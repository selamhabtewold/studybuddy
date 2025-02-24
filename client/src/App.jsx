import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Courses from "./Pages/Courses";
import CourseContent from "./Pages/CourseContent";
import CourseDescription from "./Pages/CourseDescription";
import YourBuddy from "./Pages/YourBuddy";
import Home from "./Pages/Home";
import UserPreferencesForm from "./Pages/userPreferencesForm";
import AdminDashboard from "./Pages/AdminDashboard";
import LoginForm from "./Pages/LoginForm";
import RegistrationForm from "./Pages/RegistrationForm";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// ✅ This component will handle user tracking (MOVED useLocation HERE)
const NavigationTracker = () => {
  const location = useLocation(); // Now it's inside Router context

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (userId) {
      console.log(`User ID: ${userId} navigated to ${location.pathname}`);

      // Send tracking data to the backend
      fetch("http://localhost:5000/api/track-navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, page: location.pathname }),
      });
    }
  }, [location]);

  return null; // This component only runs logic, no UI needed
};

function App() {
  return (
    <Router>
      <NavigationTracker /> {/* ✅ Add the tracker inside Router */}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/yourbuddy" element={<YourBuddy />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegistrationForm />} />
          <Route path="/course/:courseName" element={<CourseDescription />} />
          <Route path="/course-content/:courseName" element={<CourseContent />} />
          <Route index element={<Home />} /> {/* Default route */}
          <Route path="/preferences" element={<UserPreferencesForm />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
