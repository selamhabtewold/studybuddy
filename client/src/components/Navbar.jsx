import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "/src/context/UserContext";
import { useOnlineUsers } from "/src/context/OnlineUsersContext"; // Import the context

const Navbar = () => {
  const { user, logout } = useUser();
  const { onlineUsersCount } = useOnlineUsers(); // Access the count
  const navigate = useNavigate(); // Add useNavigate for programmatic navigation

  const handleProfileClick = (e) => {
    e.preventDefault(); // Prevent default Link behavior
    if (!user) {
      // If user is not logged in, redirect to login page
      navigate("/login");
    } else {
      // If user is logged in, redirect to dashboard
      navigate("/dashboard");
    }
  };

  return (
    <nav
      className="navbar navbar-expand-lg"
      style={{
        backgroundColor: "rgba(26, 29, 38, 0.95)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 1000,
        padding: "0.5rem 1rem",
        borderBottom: "1px solid rgba(156, 39, 176, 0.2)",
      }}
    >
      <div className="container">
        <Link
          className="navbar-brand"
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            transition: "transform 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          <img
            src="https://cdn3.iconfinder.com/data/icons/linecons-free-vector-icons-pack/32/study-64.png"
            style={{
              height: 50,
              filter: "brightness(1.2)",
              transition: "filter 0.3s ease",
            }}
            alt="Study Buddy Logo"
          />
          <span
            style={{
              color: "#ffffff",
              fontSize: "1.5rem",
              fontWeight: "700",
              marginLeft: "0.75rem",
              textShadow: "1px 1px 2px rgba(0, 0, 0, 0.3)",
            }}
          >
            Study Buddy
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
          style={{
            backgroundColor: "rgba(156, 39, 176, 0.3)",
            border: "1px solid #9C27B0",
            borderRadius: "6px",
            padding: "0.5rem",
            transition: "background-color 0.3s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(156, 39, 176, 0.5)")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "rgba(156, 39, 176, 0.3)")}
        >
          <span
            className="navbar-toggler-icon"
            style={{
              filter: "brightness(1.5)",
            }}
          ></span>
        </button>

        <div
          className="collapse navbar-collapse justify-content-between align-items-center"
          id="navbarNav"
          style={{
            padding: "0.5rem 0",
          }}
        >
          <ul
            className="navbar-nav"
            style={{
              display: "flex",
              gap: "1.5rem",
            }}
          >
            {["Your Buddy", "Courses"].map((item, index) => (
              <li key={index} className="nav-item">
                <Link
                  className="nav-link hover-effect"
                  to={item === "Your Buddy" ? "/yourbuddy" : `/${item.toLowerCase().replace(" ", "")}`} // Updated to link to /yourbuddy for "Your Buddy"
                  style={{
                    fontSize: "1.1rem",
                    color: "#cccccc",
                    fontWeight: "500",
                    padding: "0.75rem 1rem",
                    borderRadius: "6px",
                    transition: "color 0.3s ease, background-color 0.3s ease, transform 0.2s ease",
                    textDecoration: "none",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = "#9C27B0";
                    e.target.style.backgroundColor = "rgba(156, 39, 176, 0.1)";
                    e.target.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = "#cccccc";
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>

          <div className="d-flex align-items-center">
            {/* Online Users Section */}
            <div
              className="active-users d-flex align-items-center me-3"
              style={{
                color: "#ffffff",
                fontSize: "1rem",
                fontWeight: "500",
                backgroundColor: "rgba(44, 47, 60, 0.8)",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                marginRight: "1rem",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(44, 47, 60, 1)")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "rgba(44, 47, 60, 0.8)")}
            >
              <span className="me-2">{user ? user.name : "Guest"}</span>
              <span
                style={{
                  backgroundColor: "#9C27B0",
                  color: "#ffffff",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                }}
              >
                Online: {onlineUsersCount}
              </span>
            </div>

            {/* Profile Icon (now using handleProfileClick for navigation) */}
            <div
              className="profile-icon-container"
              style={{
                cursor: "pointer",
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              onClick={handleProfileClick} // Use handleProfileClick for navigation
            >
              <img
                src="https://cdn2.iconfinder.com/data/icons/user-interface-line-38/24/Untitled-5-19-256.png"
                className="profile-icon"
                alt="Profile"
                style={{
                  display: "block",
                  margin: "0 auto",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "2px solid #9C27B0",
                  padding: "2px",
                  backgroundColor: "#ffffff",
                  transition: "transform 0.3s ease, border-color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.1)";
                  e.target.style.borderColor = "#7B1FA2";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.borderColor = "#9C27B0";
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;