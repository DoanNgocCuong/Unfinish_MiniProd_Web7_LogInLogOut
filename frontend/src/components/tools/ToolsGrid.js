import React from "react";
import ToolCard from "./ToolCard";
import { toolsData } from "../../data/toolsData";
import { Navigate } from 'react-router-dom';

const ToolsGrid = () => {
  // Kiểm tra authentication
  const user = localStorage.getItem('user');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="tools-container">
      <div className="tools-grid">
        {toolsData.map((tool, index) => (
          <ToolCard key={index} tool={tool} />
        ))}
      </div>
    </div>
  );
};

export default ToolsGrid; 