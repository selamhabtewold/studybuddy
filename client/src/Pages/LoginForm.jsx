import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Registration.css";
import { useNavigate } from "react-router-dom";

const LoginForm = ({ closeModal }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.trim() });
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setMessage("");
  
  //   if (!formData.email || !formData.password) {
  //     setMessage("Please fill in all fields.");
  //     return;
  //   }
  
  //   setLoading(true);
  //   try {
  //     const response = await fetch("http://localhost:5000/api/users/login", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(formData),
  //     });
  
  //     const data = await response.json();
  //     if (response.ok) {
  //       setMessage("Login successful!");
  
  //       // Store user info in localStorage for tracking
  //       localStorage.setItem("userId", data.userId);
  //       localStorage.setItem("userEmail", data.email);
  //       localStorage.setItem("userRole", data.role);
  //       localStorage.setItem("userName", data.name);
  
  //       // Track user login and initial page navigation
  //       console.log(`User ID: ${data.userId} logged in and navigated to ${data.role === "admin" ? "/admin-dashboard" : "/preferences"}`);
  
  //       // Send tracking data to backend
  //       await fetch("http://localhost:5000/api/track-navigation", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ userId: data.userId, page: data.role === "admin" ? "/admin-dashboard" : "/preferences" }),
  //       });
  
  //       // Redirect user after login
  //       if (data.role === "admin") {
  //         navigate("/admin-dashboard");
  //       } else {
  //         navigate("/preferences");
  //       }
  //     } else {
  //       setMessage(data.message || "Invalid credentials.");
  //     }
  //   } catch (error) {
  //     setMessage("Something went wrong. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  
  const handleSubmit = async (e) => {
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
        setMessage("Login successful!");
        localStorage.setItem("userEmail", formData.email);
        localStorage.setItem("authToken", data.token); // ✅ Store token in localStorage
  
        if (data.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/preferences");
        }
      } else {
        setMessage(data.message || "Invalid credentials.");
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="modal-overlay active">
      <div className="modal-content">
        <button className="close-btn" onClick={closeModal}>
          &times;
        </button>
        <h2 className="text-center mb-4">Login</h2>
        {message && <p className="alert alert-danger text-center">{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" required />
          </div>
          <div className="form-group mb-4">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-control" required />
          </div>
          <button type="submit" className="btn btn-primary w-100 mb-3" disabled={loading}>
            {loading ? "Processing..." : "Login"}
          </button>
        </form>

        {/* Link to Registration */}
        <div className="text-center mt-3">
          <p>
            Don't have an account?{" "}
            <button className="btn btn-link" onClick={() => navigate("/register")}>
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
