import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div>
      <Navbar />
      <main>
        <Outlet />  {/* Displays the active page */}
      </main>
    </div>
  );
};

export default Layout;
