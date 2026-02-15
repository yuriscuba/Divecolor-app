import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // ← AGREGADO: Tailwind CSS
import App from './App';
import LoadingSpinner from './components/LoadingSpinner';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    }>
      <App />
    </Suspense>
  </React.StrictMode>
);
