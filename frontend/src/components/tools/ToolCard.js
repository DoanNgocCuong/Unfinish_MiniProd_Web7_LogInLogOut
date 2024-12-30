import React from "react";
import { FaExternalLinkAlt, FaLock } from "react-icons/fa";

const ToolCard = ({ tool }) => {
  const user = localStorage.getItem('user');

  if (!user) {
    return (
      <div className="tool-card locked">
        <div className="tool-image-container blur">
          <img src={tool.image} alt={tool.name} className="tool-image" />
          <div className="lock-overlay">
            <FaLock className="lock-icon" />
            <p>Login required</p>
          </div>
        </div>
        <div className="tool-content">
          <h3 className="tool-name">{tool.name}</h3>
          <p className="tool-description">Please login to access this tool</p>
        </div>
      </div>
    );
  }

  return (
    <a
      href={tool.link}
      target="_blank"
      rel="noopener noreferrer"
      className="tool-card"
    >
      <div className="tool-image-container">
        <img
          src={tool.image}
          alt={tool.name}
          className="tool-image"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60";
          }}
        />
        <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <FaExternalLinkAlt className="text-gray-600 text-sm" />
        </div>
      </div>
      <div className="tool-content">
        <h3 className="tool-name">{tool.name}</h3>
        <p className="tool-description">{tool.description}</p>
      </div>
    </a>
  );
};

export default ToolCard; 