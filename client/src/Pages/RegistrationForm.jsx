import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Registration.css";
import { useNavigate } from "react-router-dom";

const RegistrationForm = ({ closeModal }) => {
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
        setFormData({ name: "", email: "", password: "" });

        setTimeout(() => {
          navigate("/login"); // Redirect after success
          closeModal(); // Close modal after success
        }, 2000);
      } else {
        setMessage(data.message || "Registration failed.");
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
        {/* Close button */}
        <button className="close-btn" onClick={closeModal}>
          &times;
        </button>
        <h2 className="text-center mb-4">Register</h2>
        {message && <p className="alert alert-info text-center">{message}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control" required />
          </div>
          <div className="form-group mb-3">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" required />
          </div>
          <div className="form-group mb-4">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-control" required />
          </div>
          <button type="submit" className="btn btn-primary w-100 mb-3" disabled={loading}>
            {loading ? "Processing..." : "Sign Up"}
          </button>
        </form>

        {/* Already have an account? */}
        <div className="text-center mt-3">
          <p>
            Already have an account?{" "}
            <button className="btn btn-link" onClick={() => navigate("/login")}>
              Log in
            </button>
          </p>
        </div>
      </div>

      {/* Modal Styling */}
      <style>
        {`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .modal-content {
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 400px;
            width: 100%;
            position: relative;
          }
          .close-btn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
          }
        `}
      </style>
    </div>
  );
};

export default RegistrationForm;
