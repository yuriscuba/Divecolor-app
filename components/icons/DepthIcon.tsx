import React from 'react';

export const DepthIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2v20" />
    <path d="m19 12-7 7-7-7" />
    <path d="M2 12h3" />
    <path d="M19 12h3" />
    <path d="M2 18h3" />
    <path d="M19 18h3" />
  </svg>
);
