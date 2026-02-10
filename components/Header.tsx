import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/70 backdrop-blur-lg sticky top-0 z-10 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
             <svg
              className="h-8 w-8 text-cyan-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="7.5" cy="8.5" r="2.5"></circle>
              <path d="M10 11l6-2"></path>
              <path d="M13 15l4-3-3-4-4 3"></path>
              <path d="M10 11l-1.5 5.5L4 18l2.5-4.5"></path>
            </svg>
            <h1 className="text-2xl font-bold text-white">
              DiveColor <span className="text-cyan-500">Pro</span>
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;