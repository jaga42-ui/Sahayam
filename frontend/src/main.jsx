import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Fade out the pre-hydration splash once the app has mounted.
const splash = document.getElementById('app-splash');
if (splash) {
  // Small grace period so the brand mark is felt, not flashed.
  window.setTimeout(() => {
    splash.classList.add('hide');
    window.setTimeout(() => splash.remove(), 600);
  }, 650);
}
