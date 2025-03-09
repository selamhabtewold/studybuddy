import React, { createContext, useContext, useState } from "react";

const OnlineUsersContext = createContext();

export const OnlineUsersProvider = ({ children }) => {
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);

  return (
    <OnlineUsersContext.Provider value={{ onlineUsersCount, setOnlineUsersCount }}>
      {children}
    </OnlineUsersContext.Provider>
  );
};

export const useOnlineUsers = () => useContext(OnlineUsersContext);