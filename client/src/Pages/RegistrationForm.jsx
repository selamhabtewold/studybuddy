import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Registration.css";

const RegistrationForm = ({ setUserEmail }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [isLogin, setIsLogin] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission (Register / Login)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Basic validation
    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      setMessage("Please fill in all required fields.");
      return;
    }

    const endpoint = isLogin ? "/api/users/login" : "/api/users/register";
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (response.ok) {
        setMessage(data.message || (isLogin ? "Login successful!" : "Registration successful!"));

        if (isLogin) {
          localStorage.setItem("userEmail", formData.email);
          if (typeof setUserEmail === "function") {
            setUserEmail(formData.email); // Ensure setUserEmail is a function before calling
          } else {
            console.error("setUserEmail is not a function!");
          }
        }

        setFormData({ name: "", email: "", password: "" });
      } else {
        setMessage(data.message || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-form-container">
      <div className="registration-form">
        <h2 className="text-center mb-4">{isLogin ? "Login" : "Register"}</h2>

        {message && <p className={`alert ${message.includes("successful") ? "alert-success" : "alert-danger"} text-center`}>{message}</p>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group mb-3">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          )}
          <div className="form-group mb-3">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <div className="form-group mb-4">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100 mb-3" disabled={loading}>
            {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <div className="text-center">
          <button className="btn btn-link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Create an account" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
