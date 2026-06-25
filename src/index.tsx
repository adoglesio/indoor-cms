// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// @ts-ignore: Ignore missing type declarations for CSS import
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);