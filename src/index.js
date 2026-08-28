import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';

// Sentry frontend — il DSN e pubblico per natura, ma sovrascrivibile via env
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN || 'https://b4b333370cb34050fe733c01b666276d@o4511653482659840.ingest.de.sentry.io/4511661136543824',
  environment: process.env.NODE_ENV,
});

// Nessun login: il freemium è "carica PDF -> analisi AI -> Excel", senza account
// ne database (vedi AppMVP in App.js). AuthSupabase resta pronto per un tier a
// pagamento futuro, non e piu montato qui.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
