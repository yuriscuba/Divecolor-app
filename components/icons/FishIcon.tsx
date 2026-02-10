
import React from 'react';

export const FishIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M15 12c0-3.47-4-6-4-6s-4 2.53-4 6c0 3.47 4 6 4 6s4-2.53 4-6Z" />
    <path d="M22 12s-3-2-3-5" />
    <path d="M2 12s3-2 3-5" />
    <path d="m19 7-1 1" />
    <path d="m5 7 1 1" />
    <path d="M11 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0Z" />
    <path d="M15 12c-2-1-4 0-4 0" />
    <path d="M15 12c-2 1-4 0-4 0" />
  </svg>
);
