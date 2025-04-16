import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation
import { useUser } from "../context/UserContext";
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure Bootstrap CSS is included (via CDN or npm)

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUser(); // Get login function from context

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.trim() });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!formData.email || !formData.password) {
      setMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.token);

        // Store user details and role in context
        const userData = {
          id: data.userId,
          email: data.email,
          name: data.name,
          role: data.role || "user", // Default to 'user' if role is not provided
        };
        login(userData);

        setMessage("Login successful!");
        // Redirect based on role
        if (userData.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch (error) {
      setMessage("Server error");
      console.error("Login error:", error);
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
        className="card p-4 shadow-lg"
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "rgba(26, 26, 26, 0.9)", // Slightly transparent dark background
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)", // Enhanced shadow for depth
          border: "1px solid rgba(212, 38, 255, 0.2)", // Subtle purple border
        }}
      >
        <h2 className="text-center mb-4">Login to StudyBuddy</h2>
        <form onSubmit={handleLogin} className="needs-validation" noValidate>
          <div className="mb-3">
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
              placeholder="Enter your email"
              style={{
                backgroundColor: "#2d2d2d", // Dark input background
                border: "1px solid rgba(212, 38, 255, 0.2)", // Purple border
                color: "#ffffff", // White text
                borderRadius: "8px",
              }}
            />
          </div>
          <div className="mb-3">
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
              placeholder="Enter your password"
              style={{
                backgroundColor: "#2d2d2d", // Dark input background
                border: "1px solid rgba(212, 38, 255, 0.2)", // Purple border
                color: "#ffffff", // White text
                borderRadius: "8px",
              }}
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
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          {message && (
            <p
              className={message.includes("successful") ? "text-success text-center" : "text-danger text-center"}
              style={{
                fontSize: "1rem",
                marginTop: "1rem",
                color: message.includes("successful") ? "#00ff00" : "#ff0000", // Green for success, red for error
              }}
            >
              {message}
            </p>
          )}
          <p className="text-center" style={{ color: "#aaaaaa" }}>
            Don’t have an account?{' '}
            <Link
              to="/register"
              className="text-decoration-none"
              style={{
                color: "#d426ff", // Purple for the register link
                transition: "color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#b31cff")}
              onMouseLeave={(e) => (e.target.style.color = "#d426ff")}
            >
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;