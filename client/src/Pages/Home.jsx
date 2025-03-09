import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./landing.css"; // Keep your custom CSS if needed
import LoginForm from "../Pages/LoginForm";
import Navbar from "../components/Navbar"; // Import the Navbar component

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
    <div
      className="min-vh-100 d-flex flex-column position-relative"
      style={{
        backgroundColor: "#1a1a1a", // Retain dark background as base
        fontFamily: "'Arial', sans-serif",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden", // Ensure carousel background stays within bounds
      }}
    >
      {/* Navbar (kept as is, styled to match dark theme) */}
      {/* <Navbar /> */}

      {/* Carousel as Background with Dark Overlay */}
      <div
        className={`position-absolute top-0 start-0 w-100 h-100 ${isLoginPage ? "blur-background" : ""}`}
        style={{
          zIndex: 0,
          transition: "filter 0.3s ease-in-out",
        }}
      >
        <div
          className="carousel slide"
          data-bs-ride="carousel"
          style={{ height: "100%", width: "100%" }}
        >
          <div className="carousel-inner" style={{ height: "100%" }}>
            {carouselItems.map((item, index) => (
              <div
                key={index}
                className={`carousel-item ${index === activeIndex ? "active" : ""}`}
                style={{ height: "100%" }}
              >
                <img
                  src={item.image}
                  className="d-block w-100"
                  alt={item.title}
                  style={{
                    objectFit: "cover",
                    height: "100vh",
                    filter: "brightness(0.2)", // Slightly darkened for overlay contrast
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Dark Overlay */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.2)", // Dark semi-transparent overlay
            zIndex: 1,
          }}
        />
      </div>

      {/* Main Content - Centered Layout with Overlay Content */}
      <div
        className="container py-5 flex-grow-1 d-flex flex-column justify-content-center align-items-center position-relative"
        style={{
          marginTop: "60px", // Adjusted for the Navbar height (assuming 60px)
          maxWidth: "1200px",
          zIndex: 2, // Ensure text/buttons are above the overlay
          transition: "filter 0.3s ease-in-out",
        }}
      >
        <div className="text-center mb-5">
          <h1
            className="mb-3"
            style={{
              fontSize: "3rem",
              fontWeight: "700",
              color: "#ffffff", // White text for contrast on dark overlay
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
            }}
          >
            Unlock Your Learning Potential with StuddyBuddy
          </h1>
          <p
            className="mb-4"
            style={{
              fontSize: "1.2rem",
              color: "#7f8c8d", // Light gray for subtitle, still visible on dark overlay
              fontWeight: "400",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Join a community of learners, access powerful tools, and achieve your goals—start your journey today!
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate("/login")}
            style={{
              backgroundColor: "#d426ff", // Purple accent from the current design
              borderColor: "#d426ff",
              padding: "0.75rem 2rem",
              fontSize: "1.1rem",
              borderRadius: "8px",
              transition: "background-color 0.3s ease, transform 0.2s ease",
              boxShadow: "0 4px 12px rgba(212, 38, 255, 0.3)",
              position: "relative",
              overflow: "hidden",
              zIndex: 3, // Ensure button is above overlay
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#b31cff";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#d426ff";
              e.target.style.transform = "scale(1)";
            }}
            aria-label="Start learning with StudyBuddy"
          >
            Get Started
          </button>
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
          .gradient-bg {
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
          }
          @media (max-width: 768px) {
            h1 {
              font-size: 2rem;
            }
            p {
              font-size: 1rem;
            }
            .btn-lg {
              padding: 0.5rem 1.5rem;
              font-size: 1rem;
            }
            .min-vh-100 .carousel-item img {
              height: 100vh;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Home;