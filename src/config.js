// URL del backend SafetyAI
// In sviluppo locale: usa http://localhost:3001 (default)
// In produzione: imposta REACT_APP_API_URL nelle variabili d'ambiente di Vercel/Netlify
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default API_URL;
