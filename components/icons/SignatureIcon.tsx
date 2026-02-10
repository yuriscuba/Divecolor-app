import React from 'react';

export const SignatureIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" />
    <path d="m16 16-1.3 1.3a2 2 0 0 1-2.83 0l-1.4-1.4a2 2 0 0 1 0-2.83l4.24-4.24a2 2 0 0 1 2.83 0l.17.17" />
    <path d="m16 16 2.5 2.5" />
    <path d="m18 14 1 1" />
  </svg>
);
