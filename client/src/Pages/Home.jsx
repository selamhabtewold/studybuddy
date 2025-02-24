import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./landing.css";
import LoginForm from "./LoginForm";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login"; // Check if the URL is "/login"

  const [activeIndex, setActiveIndex] = useState(0);

  const carouselItems = [
    {
      image: "https://images.pexels.com/photos/8199602/pexels-photo-8199602.jpeg?auto=compress&cs=tinysrgb&w=600",
      title: "Study Groups",
      description: "Collaborate with peers for better learning.",
    },
    {
      image: "https://images.pexels.com/photos/5632406/pexels-photo-5632406.jpeg?auto=compress&cs=tinysrgb&w=600",
      title: "Online Resources",
      description: "Access a vast library of study materials.",
    },
    {
      image: "https://images.pexels.com/photos/7887844/pexels-photo-7887844.jpeg?auto=compress&cs=tinysrgb&w=600",
      title: "Progress Tracking",
      description: "Monitor your progress and stay motivated.",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  return (
    <div className="min-vh-100 gradient-bg">
      <Outlet />
      
      <div className={`container text-white ${isLoginPage ? "blur-background" : ""}`}>
        <div className="row align-items-center">
          <div className="col-md-6">
            <h1 className="display-4 mb-4">Welcome to Study Buddy</h1>
            <p className="lead mb-4">
              Your ultimate companion for productive studying. Join thousands of students who are achieving their goals with Study Buddy.
            </p>
            <button className="btn btn-primary btn-lg me-2" onClick={() => navigate("/register")}>
              Get Started
            </button>
            <button className="btn btn-outline-light btn-lg" onClick={() => navigate("/login")}>
              Login
            </button>
          </div>

          <div className="col-md-6">
            <div id="carouselExample" className="carousel slide" data-bs-ride="carousel">
              <div className="carousel-inner">
                {carouselItems.map((item, index) => (
                  <div key={index} className={`carousel-item ${index === activeIndex ? "active" : ""}`}>
                    <img src={item.image} className="d-block w-100 rounded" alt={item.title} />
                    <div className="carousel-caption d-none d-md-block">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Show Login Modal when route is "/login" */}
      {isLoginPage && (
        <LoginForm closeModal={() => navigate("/")} />
      )}

      <style>
        {`
          .blur-background {
            filter: blur(5px);
            transition: filter 0.3s ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default Home;
