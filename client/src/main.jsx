import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; 
import App from "./App";
import { UserProvider } from "./context/UserContext"; 
import { OnlineUsersProvider } from "./context/OnlineUsersContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter> {/* ✅ Router is here, so don't use another one in `App.js` */}
    <UserProvider>
      <OnlineUsersProvider>
      <App />
      </OnlineUsersProvider>
    
    </UserProvider>
  </BrowserRouter>
);
