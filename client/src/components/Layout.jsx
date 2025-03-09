import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{
        backgroundColor: "#1a1a1a", // Dark background from the image for consistency
        fontFamily: "'Arial', sans-serif",
        color: "#ffffff",
      }}
    >
      <Navbar /> {/* Sticky navbar at the top */}
      <main
        style={{
          marginTop: "80px", // Adjust for the fixed navbar height (match navbar height)
          flex: "1", // Ensure main content takes remaining space
          padding: "20px", // Optional padding for content
        }}
      >
        <Outlet /> {/* Dynamically renders the active page */}
      </main>
    </div>
  );
};

export default Layout;