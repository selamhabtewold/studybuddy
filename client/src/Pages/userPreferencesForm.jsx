import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const interestsOptions = ["AI", "Machine Learning", "Math", "Python", "Java", "DSA"];
const subjectsOptions = ["Mathematics", "Physics", "Computer Science", "Statistics"];

const UserPreferencesForm = () => {
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const handleCheckboxChange = (setState, value) => {
    setState((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   const userEmail = localStorage.getItem("userEmail"); // Get registered user email

  //   if (!userEmail) {
  //     alert("User not found. Please register again.");
  //     return;
  //   }

  //   const preferencesData = { email: userEmail, interests, subjects };

  //   try {
  //     const response = await fetch("http://localhost:5000/api/users/preferences", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(preferencesData),
  //     });

  //     if (response.ok) {
  //       alert("Preferences saved successfully!");
  //       navigate("/dashboard"); // Redirect to dashboard or recommendations page
  //     } else {
  //       alert("Failed to save preferences.");
  //     }
  //   } catch (error) {
  //     console.error("Error:", error);
  //     alert("An error occurred. Please try again.");
  //   }
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userEmail = localStorage.getItem("userEmail");
    const token = localStorage.getItem("authToken"); // ✅ Get token from localStorage
  
    if (!userEmail || !token) {
      alert("User not found or not authenticated.");
      return;
    }
  
    const preferencesData = { email: userEmail, interests, subjects };
  
    try {
      const response = await fetch("http://localhost:5000/api/users/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // ✅ Send token in request headers
        },
        body: JSON.stringify(preferencesData),
      });
  
      if (response.ok) {
        alert("Preferences saved successfully!");
        navigate("/dashboard");
      } else {
        alert("Failed to save preferences.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };
  
  return (
    <div className="container mt-5">
      <h2 className="text-center">Tell Us Your Interests</h2>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-3">
          <h5>Select Your Interests:</h5>
          {interestsOptions.map((interest) => (
            <label key={interest} className="d-block">
              <input
                type="checkbox"
                value={interest}
                checked={interests.includes(interest)}
                onChange={() => handleCheckboxChange(setInterests, interest)}
              />{" "}
              {interest}
            </label>
          ))}
        </div>

        <div className="mb-3">
          <h5>Select Subjects You Want to Study:</h5>
          {subjectsOptions.map((subject) => (
            <label key={subject} className="d-block">
              <input
                type="checkbox"
                value={subject}
                checked={subjects.includes(subject)}
                onChange={() => handleCheckboxChange(setSubjects, subject)}
              />{" "}
              {subject}
            </label>
          ))}
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Save & Continue
        </button>
      </form>
    </div>
  );
};

export default UserPreferencesForm;
