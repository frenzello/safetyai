import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AccessGate from './AccessGate';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AccessGate>
    <App />
  </AccessGate>
);
