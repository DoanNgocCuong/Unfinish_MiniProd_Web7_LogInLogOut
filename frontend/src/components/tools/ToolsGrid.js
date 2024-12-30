import React from "react";
import ToolCard from "./ToolCard";
import { toolsData } from "../../data/toolsData";

const ToolsGrid = () => {
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