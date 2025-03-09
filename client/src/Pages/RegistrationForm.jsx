import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import "./registration.css"; // Import external CSS file for styling (you can remove or update this if not needed)
import { X } from "lucide-react"; // Import cancel icon

const RegistrationPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!formData.email || !formData.password || !formData.name) {
      setMessage("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: "user" }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Registration successful! Redirecting to login...");
        setFormData({ name: "", email: "", password: "" }); // Clear form after success

        // Redirect to login after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMessage(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{
        backgroundColor: "#1a1a1a", // Dark background from the image
        fontFamily: "'Arial', sans-serif",
        color: "#ffffff",
      }}
    >
      <div
        className="card p-4 shadow-lg rounded position-relative"
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "rgba(26, 26, 26, 0.9)", // Slightly transparent dark background
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)", // Enhanced shadow for depth
          border: "1px solid rgba(212, 38, 255, 0.2)", // Subtle purple border
        }}
      >
        <button
          className="close-btn position-absolute top-0 end-0 m-3"
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            transition: "color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#d426ff")} // Purple hover
          onMouseLeave={(e) => (e.target.style.color = "#ffffff")}
          aria-label="Close registration form"
        >
          <X size={24} />
        </button>
        <h2 className="text-center mb-4">Register for StudyBuddy ™</h2>
        {message && (
          <p
            className={
              message.includes("successful") ? "text-success text-center" : "text-danger text-center"
            }
            style={{
              fontSize: "1rem",
              marginBottom: "1rem",
              color: message.includes("successful") ? "#00ff00" : "#ff0000", // Green for success, red for error
            }}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor="name" className="form-label" style={{ color: "#aaaaaa" }}>
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              required
              style={{
                backgroundColor: "#2d2d2d", // Dark input background
                border: "1px solid rgba(212, 38, 255, 0.2)", // Purple border
                color: "#ffffff", // White text
                borderRadius: "8px",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#d426ff")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(212, 38, 255, 0.2)")}
              aria-label="Enter your name"
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="email" className="form-label" style={{ color: "#aaaaaa" }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              required
              style={{
                backgroundColor: "#2d2d2d", // Dark input background
                border: "1px solid rgba(212, 38, 255, 0.2)", // Purple border
                color: "#ffffff", // White text
                borderRadius: "8px",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#d426ff")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(212, 38, 255, 0.2)")}
              aria-label="Enter your email"
            />
          </div>
          <div className="form-group mb-4">
            <label htmlFor="password" className="form-label" style={{ color: "#aaaaaa" }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              required
              style={{
                backgroundColor: "#2d2d2d", // Dark input background
                border: "1px solid rgba(212, 38, 255, 0.2)", // Purple border
                color: "#ffffff", // White text
                borderRadius: "8px",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#d426ff")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(212, 38, 255, 0.2)")}
              aria-label="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            disabled={loading}
            style={{
              backgroundColor: "#d426ff", // Purple accent from the image
              border: "none",
              padding: "0.75rem 1.5rem",
              fontSize: "1.1rem",
              borderRadius: "8px",
              transition: "background-color 0.3s ease, transform 0.2s ease",
              boxShadow: "0 4px 12px rgba(212, 38, 255, 0.3)",
              color: "#ffffff",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#b31cff";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#d426ff";
              e.target.style.transform = "scale(1)";
            }}
            aria-label="Submit registration form"
          >
            {loading ? "Processing..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center mt-3">
          <p style={{ color: "#aaaaaa" }}>
            Already have an account?{' '}
            <button
              className="btn btn-link"
              onClick={() => navigate("/login")}
              style={{
                color: "#d426ff", // Purple for the login link
                padding: "0",
                fontSize: "1rem",
                textDecoration: "none",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#b31cff")}
              onMouseLeave={(e) => (e.target.style.color = "#d426ff")}
              aria-label="Navigate to login page"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;