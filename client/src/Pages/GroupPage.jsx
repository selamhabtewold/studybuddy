// GroupPage.jsx
import React from "react";
import { useParams } from "react-router-dom";

const GroupPage = () => {
  const { groupId } = useParams();

  return (
    <div className="container mt-4">
      <h2>Group Page</h2>
      <p>You have joined group with ID: {groupId}</p>
      {/* Add group-specific content here */}
    </div>
  );
};

export default GroupPage;