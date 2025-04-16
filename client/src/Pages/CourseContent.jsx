import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import html2pdf from "html2pdf.js";
import { useSocket } from "../context/socketContext";

// Sample quiz questions for each course
const quizQuestions = {
  DSA: [
    { question: "What is the time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], answer: "O(log n)" },
  ],
  PYTHON: [
    { question: "What is Python’s primary use?", options: ["Web development", "Data analysis", "Game development", "All of the above"], answer: "All of the above" },
  ],
  JAVA: [
    { question: "What is Java primarily known for?", options: ["Web apps", "Platform independence", "Mobile games", "Data science"], answer: "Platform independence" },
  ],
};

// Sample course info data
const courseInfo = {
  DSA: {
    description: "Master data structures and algorithms to solve complex problems efficiently.",
    objectives: ["Understand core data structures", "Implement efficient algorithms", "Prepare for technical interviews"],
    prerequisites: ["Basic programming knowledge", "Familiarity with any language"],
    thumbnail: "https://placehold.co/300x150?text=DSA",
  },
  PYTHON: {
    description: "Learn Python from basics to advanced concepts for versatile programming.",
    objectives: ["Master Python syntax", "Build projects with Python", "Explore data analysis libraries"],
    prerequisites: ["No prior experience required"],
    thumbnail: "https://placehold.co/300x150?text=Python",
  },
  JAVA: {
    description: "Become proficient in Java programming with in-depth OOP concepts.",
    objectives: ["Learn Java fundamentals", "Understand OOP principles", "Build Java applications"],
    prerequisites: ["Basic programming skills"],
    thumbnail: "https://placehold.co/300x150?text=Java",
  },
};

const CourseContent = () => {
  const { courseName } = useParams();
  const [activeSection, setActiveSection] = useState(courseName);
  const [quizState, setQuizState] = useState({
    started: false,
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: {},
    timeLeft: 600,
    completed: false,
    score: 0,
  });
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState(0);
  const { sendMessage } = useSocket();

  const normalizedCourseName = courseName ? courseName.toUpperCase() : "";
  const totalQuestions = 10;

  const editor = useEditor({
    extensions: [StarterKit],
    content: notes,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setNotes(html);
      saveNotes(html);
    },
  });

  useEffect(() => {
    const storedScore = localStorage.getItem(`quizScore_${normalizedCourseName}`);
    const storedProgress = localStorage.getItem(`progress_${normalizedCourseName}`);
    setQuizState({
      started: false,
      questions: [],
      currentQuestionIndex: 0,
      userAnswers: {},
      timeLeft: 600,
      completed: false,
      score: storedScore ? parseInt(storedScore, 10) : 0,
    });
    setProgress(storedProgress ? parseFloat(storedProgress) : 0);

    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No auth token found in localStorage");
      // Mock response if no token
      const mockNotes = `<p>Default notes for ${normalizedCourseName} (no token)</p>`;
      setNotes(mockNotes);
      if (editor) editor.commands.setContent(mockNotes);
      return;
    }

    // Use full URL in development; adjust for your backend
    const apiUrl = process.env.NODE_ENV === "development"
      ? "http://localhost:5000/api/notes/" // Replace with your backend URL/port
      : "/api/notes/"; // For production with proxy

    fetch(`${apiUrl}${normalizedCourseName}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.text(); // Get raw text to debug
      })
      .then((text) => {
        try {
          const data = JSON.parse(text);
          setNotes(data.notes || "");
          if (editor) editor.commands.setContent(data.notes || "");
        } catch (err) {
          console.error("Failed to parse response as JSON:", text);
          // Fallback to mock response
          const mockNotes = `<p>Mock notes for ${normalizedCourseName}</p>`;
          setNotes(mockNotes);
          if (editor) editor.commands.setContent(mockNotes);
        }
      })
      .catch((err) => {
        console.error("Error fetching notes:", err);
        // Fallback to mock response
        const mockNotes = `<p>Mock notes for ${normalizedCourseName}</p>`;
        setNotes(mockNotes);
        if (editor) editor.commands.setContent(mockNotes);
      });
  }, [normalizedCourseName, editor]);

  const saveNotes = async (html) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found");
      const apiUrl = process.env.NODE_ENV === "development"
        ? "http://localhost:5000/api/notes/"
        : "/api/notes/";
      await fetch(`${apiUrl}${normalizedCourseName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: html }),
      });
    } catch (err) {
      console.error("Error saving notes:", err);
    }
  };

  const startQuiz = () => {
    setIsQuizLoading(true);
    const allQuestions = quizQuestions[normalizedCourseName] || [];
    if (allQuestions.length === 0) {
      console.error(`No quiz questions found for course: ${normalizedCourseName}`);
      setIsQuizLoading(false);
      return;
    }
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    setQuizState({
      started: true,
      questions: selected,
      currentQuestionIndex: 0,
      userAnswers: {},
      timeLeft: 600,
      completed: false,
      score: 0,
    });
    setIsQuizLoading(false);
    setActiveSection("Quiz");
  };

  useEffect(() => {
    if (quizState.started && quizState.timeLeft > 0 && !quizState.completed) {
      const timer = setInterval(() => {
        setQuizState((prev) => {
          if (prev.timeLeft <= 1) {
            endQuiz();
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (quizState.timeLeft === 0 && !quizState.completed) {
      endQuiz();
    }
  }, [quizState.started, quizState.timeLeft, quizState.completed]);

  const handleAnswer = (answer) => {
    setQuizState((prev) => ({
      ...prev,
      userAnswers: { ...prev.userAnswers, [prev.currentQuestionIndex]: answer },
    }));
  };

  const nextQuestion = () => {
    setQuizState((prev) => {
      if (prev.currentQuestionIndex < prev.questions.length - 1) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 };
      } else {
        endQuiz();
        return prev;
      }
    });
  };

  const endQuiz = () => {
    setQuizState((prev) => {
      let calculatedScore = 0;
      prev.questions.forEach((q, index) => {
        if (prev.userAnswers[index] === q.answer) calculatedScore += 1;
      });
      localStorage.setItem(`quizScore_${normalizedCourseName}`, calculatedScore);
      return { ...prev, completed: true, score: calculatedScore };
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getScorePercentage = () => {
    return quizState.score > 0 ? ((quizState.score / totalQuestions) * 100).toFixed(0) + "%" : "N/A";
  };

  const exportNotesAsPDF = () => {
    if (!notes) {
      alert("No notes to export!");
      return;
    }
    const element = document.createElement("div");
    element.innerHTML = notes;
    element.style.padding = "20px";
    element.style.backgroundColor = "#fff";
    element.style.color = "#000";
    html2pdf().from(element).save(`${courseName}_Notes.pdf`);
  };

  const shareNotesToChat = () => {
    const groupId = "exampleGroupId"; // Replace with actual groupId
    if (sendMessage && notes) {
      const plainText = notes.replace(/<[^>]+>/g, "");
      sendMessage(groupId, `Notes from ${courseName}: ${plainText}`);
      alert("Notes shared to group chat!");
    } else {
      alert("Unable to share notes. Ensure you're connected to the group chat and have notes to share.");
    }
  };

  return (
    <div className="d-flex min-vh-100 text-white" style={{ background: "linear-gradient(to bottom, black, #003300)" }}>
      <div
        className="d-flex flex-column p-4"
        style={{ width: "250px", backgroundColor: "#222", minHeight: "100vh", boxShadow: "2px 0 5px rgba(255, 255, 255, 0.1)" }}
      >
        <h5 className="text-center fw-bold mb-3">Course Navigation</h5>
        {[
          courseName,
          "Course Material",
          "Quiz",
          "Notes",
          "Course Info",
        ].map((item) => (
          <Link
            key={item}
            to={item === "Course Material" ? `/course-material/${normalizedCourseName.toLowerCase()}` : "#"}
            className={`p-3 mb-2 text-center fw-bold rounded ${activeSection === item ? "active-section" : ""}`}
            style={{
              backgroundColor: activeSection === item ? "#198754" : "#0d6efd",
              color: "white",
              textDecoration: "none",
              transition: "background 0.3s ease-in-out",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
            onMouseOut={(e) => (e.target.style.backgroundColor = activeSection === item ? "#198754" : "#0d6efd")}
            onClick={(e) => {
              if (item !== "Course Material") {
                e.preventDefault();
                setActiveSection(item);
              }
            }}
          >
            {item}
          </Link>
        ))}
        <div className="text-center mt-4">
          <span className="d-block fw-bold mb-2">Score</span>
          <div
            className="score-circle text-center fw-bold mx-auto"
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              backgroundColor: "#198754",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            {getScorePercentage()}
          </div>
        </div>
      </div>

      <div className="flex-grow-1 d-flex flex-column justify-content-between p-4">
        <div className="content-window flex-grow-1 bg-dark p-4 rounded">
          {activeSection === courseName && (
            <div className="course-overview h-100 d-flex flex-column">
              <h1 className="text-center fw-bold mb-4" style={{ color: "#0d6efd", textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" }}>
                {courseName} Dashboard
              </h1>
              <div className="row g-4 mb-4">
                <div className="col-md-4">
                  <div className="card bg-secondary text-white p-3 text-center" style={{ borderRadius: "10px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)" }}>
                    <h5>Quiz Score</h5>
                    <p className="fw-bold fs-4">{getScorePercentage()}</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-secondary text-white p-3 text-center" style={{ borderRadius: "10px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)" }}>
                    <h5>Course Progress</h5>
                    <p className="fw-bold fs-4">{Math.round(progress)}%</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-secondary text-white p-3 text-center" style={{ borderRadius: "10px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)" }}>
                    <h5>Modules</h5>
                    <p className="fw-bold fs-4">{quizQuestions[normalizedCourseName]?.length || 0}</p>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-center gap-4 mb-4">
                <button
                  className="btn btn-primary fw-bold px-4 py-2"
                  onClick={startQuiz}
                  style={{ backgroundColor: "#0d6efd", transition: "background 0.3s ease-in-out" }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
                >
                  Start Quiz
                </button>
                <Link
                  to={`/course-material/${normalizedCourseName.toLowerCase()}`}
                  className="btn btn-success fw-bold px-4 py-2"
                  style={{ backgroundColor: "#198754", transition: "background 0.3s ease-in-out" }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#0d6efd")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#198754")}
                >
                  View Materials
                </Link>
              </div>
              <div className="text-center">
                <img
                  src={courseInfo[normalizedCourseName]?.thumbnail || "https://placehold.co/300x150"}
                  alt={`${courseName} Preview`}
                  className="rounded shadow"
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </div>
            </div>
          )}
          {activeSection === "Course Material" && <h2 className="text-center fw-bold">Course Materials Coming Soon</h2>}
          {activeSection === "Quiz" && !quizState.started && !quizState.completed && (
            <div className="d-flex flex-column justify-content-center align-items-center h-100">
              <h2 className="text-center fw-bold mb-4">Ready to Test Your Knowledge?</h2>
              <button
                className="btn btn-primary fw-bold px-4 py-2"
                onClick={startQuiz}
                style={{ backgroundColor: "#0d6efd", transition: "background 0.3s ease-in-out" }}
                onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
              >
                Start Quiz
              </button>
            </div>
          )}
          {activeSection === "Quiz" && quizState.started && !quizState.completed && quizState.questions.length > 0 && !isQuizLoading && (
            <div className="quiz-container h-100 d-flex flex-column">
              <div className="d-flex justify-content-between mb-3">
                <h4>Quiz - Question {quizState.currentQuestionIndex + 1}/{quizState.questions.length}</h4>
                <div className="timer text-danger fw-bold">{formatTime(quizState.timeLeft)}</div>
              </div>
              <div className="progress mb-4">
                <div
                  className="progress-bar bg-success"
                  style={{ width: `${((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100}%` }}
                  aria-valuenow={((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <div className="card bg-dark text-white p-4 flex-grow-1">
                <h5 className="mb-3">{quizState.questions[quizState.currentQuestionIndex]?.question}</h5>
                <div className="d-flex flex-column gap-2">
                  {quizState.questions[quizState.currentQuestionIndex]?.options.map((option, idx) => (
                    <label key={idx} className="form-check">
                      <input
                        type="radio"
                        name={`question-${quizState.currentQuestionIndex}`}
                        value={option}
                        checked={quizState.userAnswers[quizState.currentQuestionIndex] === option}
                        onChange={() => handleAnswer(option)}
                        className="form-check-input"
                      />
                      <span className="ms-2">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                className="btn btn-primary mt-4 align-self-end"
                onClick={nextQuestion}
                disabled={!quizState.userAnswers[quizState.currentQuestionIndex]}
              >
                {quizState.currentQuestionIndex < quizState.questions.length - 1 ? "Next" : "Submit"}
              </button>
            </div>
          )}
          {activeSection === "Quiz" && quizState.completed && quizState.questions.length > 0 && (
            <div className="quiz-results text-center h-100 d-flex flex-column justify-content-center">
              <h2>Quiz Completed!</h2>
              <p className="mt-3">Your Score: {quizState.score} / {quizState.questions.length}</p>
              <p>Percentage: {((quizState.score / quizState.questions.length) * 100).toFixed(2)}%</p>
              <button
                className="btn btn-success mt-3"
                onClick={() => setQuizState((prev) => ({ ...prev, started: false, completed: false }))}
              >
                Retake Quiz
              </button>
            </div>
          )}
          {activeSection === "Quiz" && quizState.started && quizState.questions.length === 0 && (
            <h2 className="text-center fw-bold">No Quiz Available for {courseName}</h2>
          )}
          {activeSection === "Quiz" && isQuizLoading && (
            <h2 className="text-center fw-bold">Loading Quiz...</h2>
          )}
          {activeSection === "Notes" && (
            <div className="notes-container h-100 d-flex flex-column">
              <h2 className="text-center fw-bold mb-4">{courseName} Notes</h2>
              <EditorContent editor={editor} className="flex-grow-1 mb-3 tiptap-editor" />
              <div className="d-flex justify-content-between">
                <button
                  className="btn btn-primary fw-bold px-4 py-2"
                  onClick={exportNotesAsPDF}
                  style={{ backgroundColor: "#0d6efd", transition: "background 0.3s ease-in-out" }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
                >
                  Export as PDF
                </button>
                <button
                  className="btn btn-success fw-bold px-4 py-2"
                  onClick={shareNotesToChat}
                  style={{ backgroundColor: "#198754", transition: "background 0.3s ease-in-out" }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = "#0d6efd")}
                  onMouseOut={(e) => (e.target.style.backgroundColor = "#198754")}
                >
                  Share to Chat
                </button>
              </div>
            </div>
          )}
          {activeSection === "Course Info" && (
            <div className="course-info h-100 d-flex flex-column">
              <h1 className="text-center fw-bold mb-4" style={{ color: "#0d6efd", textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" }}>
                {courseName} Information
              </h1>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card bg-secondary text-white p-4" style={{ borderRadius: "10px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)" }}>
                    <h5 className="fw-bold">Description</h5>
                    <p>{courseInfo[normalizedCourseName]?.description || "No description available."}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-secondary text-white p-4" style={{ borderRadius: "10px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)" }}>
                    <h5 className="fw-bold">Objectives</h5>
                    <ul>
                      {courseInfo[normalizedCourseName]?.objectives?.map((obj, idx) => (
                        <li key={idx}>{obj}</li>
                      )) || <p>No objectives listed.</p>}
                    </ul>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-secondary text-white p-4" style={{ borderRadius: "10px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)" }}>
                    <h5 className="fw-bold">Prerequisites</h5>
                    <ul>
                      {courseInfo[normalizedCourseName]?.prerequisites?.map((pre, idx) => (
                        <li key={idx}>{pre}</li>
                      )) || <p>No prerequisites required.</p>}
                    </ul>
                  </div>
                </div>
                <div className="col-md-6 text-center">
                  <img
                    src={courseInfo[normalizedCourseName]?.thumbnail || "https://placehold.co/300x150"}
                    alt={`${courseName} Thumbnail`}
                    className="rounded shadow"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {activeSection !== "Quiz" && (
          <div className="navigation d-flex justify-content-between px-5 py-3">
            <button
              className="fw-bold px-4 py-2 border-0 rounded"
              style={{ backgroundColor: "#0d6efd", color: "white", transition: "background 0.3s ease-in-out" }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
            >
              Prev
            </button>
            <button
              className="fw-bold px-4 py-2 border-0 rounded"
              style={{ backgroundColor: "#0d6efd", color: "white", transition: "background 0.3s ease-in-out" }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#198754")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#0d6efd")}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <style>{`
        .content-window { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 0; }
        .quiz-container, .notes-container, .course-overview, .course-info { width: 100%; }
        .form-check-input:checked { background-color: #198754; border-color: #198754; }
        .active-section { background-color: #198754 !important; }
        .score-circle { box-shadow: 0 0 10px rgba(255, 255, 255, 0.2); }
        .tiptap-editor { background-color: #fff; color: #000; border-radius: 5px; min-height: 200px; }
        .tiptap-editor .ProseMirror { padding: 10px; }
      `}</style>
    </div>
  );
};

export default CourseContent;