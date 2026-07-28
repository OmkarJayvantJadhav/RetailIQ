/*
 * RetailIQ Frontend Application
 * File: Logo.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React from 'react';

const Logo = ({ size = 36, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4))' }}
    >
      <defs>
        <linearGradient id="logo-grad-1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="logo-grad-2" x1="40" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f472b6" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      
      {/* Outer abstract shape */}
      <rect width="40" height="40" rx="12" fill="url(#logo-grad-1)" fillOpacity="0.1" />
      
      {/* Geometric Hexagon */}
      <path 
        d="M12 26V14L20 9L28 14V26L20 31L12 26Z" 
        stroke="url(#logo-grad-1)" 
        strokeWidth="3" 
        strokeLinejoin="round" 
      />
      
      {/* Inner data nodes connecting */}
      <path 
        d="M20 9V18" 
        stroke="url(#logo-grad-2)" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
      <path 
        d="M12 14L20 18L28 14" 
        stroke="url(#logo-grad-2)" 
        strokeWidth="3" 
        strokeLinejoin="round" 
      />
      <path 
        d="M20 18V31" 
        stroke="url(#logo-grad-1)" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
      
      {/* Glowing center dot */}
      <circle cx="20" cy="18" r="3.5" fill="url(#logo-grad-2)" />
    </svg>
  );
};

export default Logo;
