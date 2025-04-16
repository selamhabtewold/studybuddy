import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; 
import App from "./App";
import { UserProvider } from "./context/UserContext"; 
import { OnlineUsersProvider } from "./context/OnlineUsersContext";
import { SocketProvider } from "./context/socketContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <UserProvider>
      <OnlineUsersProvider>
        <SocketProvider> {/* ✅ Wrap the entire app with SocketProvider */}
          <App />
        </SocketProvider>
      </OnlineUsersProvider>
    </UserProvider>
  </BrowserRouter>
);
