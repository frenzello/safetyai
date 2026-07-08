import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import AuthSupabase from './AuthSupabase';

// Sentry frontend — il DSN e pubblico per natura, ma sovrascrivibile via env
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN || 'https://b4b333370cb34050fe733c01b666276d@o4511653482659840.ingest.de.sentry.io/4511661136543824',
  environment: process.env.NODE_ENV,
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthSupabase>
    <App />
  </AuthSupabase>
);
