const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { spawn } = require('child_process');
const path = require('path');

try { require('dotenv').config(); } catch (_) {}

const app = express();

// --- CORS -------------------------------------------------------------------
const ALLOWED_ORIGINS = [
  'https://safetyai-lluu.vercel.app',
  'http://localhost:3000',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
];

// Origine consentita se: assente (server-to-server), in lista, o qualsiasi sottodominio *.vercel.app
function isOriginConsentita(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try { return /(^|\.)vercel\.app$/.test(new URL(origin).hostname); } catch (_) { return false; }
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginConsentita(origin)) return callback(null, true);
    callback(new Error('CORS: origine non consentita - ' + origin));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
// Risponde SEMPRE al preflight CORS (prima il backend dava 404 alle OPTIONS -> tutte le chiamate del browser fallivano)
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '15mb' }));

// --- RATE LIMITING ----------------------------------------------------------
// Globale: configurabile via RATE_LIMIT_GENERAL (default 2000 req / 15 min per IP)
const limiterGenerale = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GENERAL || '2000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Troppe richieste. Riprova tra 15 minuti.' },
});

// Analisi AI: configurabile via CLAUDE_DAILY_LIMIT (default 10000 PDF per IP ogni 24 ore).
// Alto per consentire l'analisi massiva di cartelle/organici; abbassare per esporre un tier gratuito pubblico.
const limiterClaude = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: parseInt(process.env.CLAUDE_DAILY_LIMIT || '10000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite giornaliero di analisi raggiunto. Riprova piu tardi.' },
});

app.use(limiterGenerale);

// --- CHIAVE API -------------------------------------------------------------
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;

if (!ANTHROPIC_KEY) {
  console.error('ERRORE: variabile ANTHROPIC_KEY non configurata.');
  console.error('Crea un file .env con: ANTHROPIC_KEY=sk-ant-...');
  process.exit(1);
}

// --- VALIDAZIONE RICHIESTA --------------------------------------------------
const MODELLI_CONSENTITI = new Set([
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-opus-4-6',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
]);

const MAX_TOKENS_CONSENTITI = 4096;
const MAX_ALLEGATI = 25;

function validaRichiestaClaude(body) {
  const errori = [];
  if (!body || typeof body !== 'object') return ['Corpo non valido'];
  if (!body.model || !MODELLI_CONSENTITI.has(body.model))
    errori.push('Modello non consentito: ' + body.model);
  if (body.max_tokens && body.max_tokens > MAX_TOKENS_CONSENTITI)
    errori.push('max_tokens troppo alto (max ' + MAX_TOKENS_CONSENTITI + ')');
  if (!Array.isArray(body.messages) || body.messages.length === 0)
    errori.push('messages deve essere un array non vuoto');

  let allegati = 0;
  for (const msg of (body.messages || [])) {
    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'image' || part.type === 'document') allegati++;
      }
    }
  }
  if (allegati > MAX_ALLEGATI)
    errori.push('Troppi allegati: ' + allegati + ' (max ' + MAX_ALLEGATI + ')');

  return errori;
}

// --- ENDPOINT: ANALISI AI --------------------------------------------------
app.post('/api/claude', limiterClaude, async (req, res) => {
  console.log('[claude] Richiesta da ' + req.ip + ' - validazione...');

  const errori = validaRichiestaClaude(req.body);
  if (errori.length > 0) {
    console.warn('[claude] Rifiutata:', errori);
    return res.status(400).json({ error: errori.join('; ') });
  }

  console.log('[claude] Invio ad Anthropic - modello: ' + req.body.model);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (data.error) {
      console.error('[claude] Errore da Anthropic:', data.error.message);
    } else {
      console.log('[claude] Risposta OK');
    }

    res.json(data);
  } catch (err) {
    console.error('[claude] Errore connessione:', err.message);
    res.status(500).json({ error: 'Errore interno del server. Riprova.' });
  }
});

// --- ENDPOINT: GENERAZIONE CARTIGLIO ---------------------------------------
app.post('/api/genera-cartiglio', (req, res) => {
  console.log('[cartiglio] Generazione richiesta...');

  const dati = req.body;
  const scriptPath = path.join(__dirname, 'genera_cartiglio.py');
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

  const child = spawn(pythonCmd, [scriptPath]);
  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (data) => { stdout += data.toString(); });
  child.stderr.on('data', (data) => { stderr += data.toString(); });

  child.stdin.write(JSON.stringify(dati));
  child.stdin.end();

  child.on('close', (code) => {
    if (stderr) console.log('[cartiglio stderr]', stderr.slice(0, 300));
    if (code !== 0) {
      console.error('[cartiglio] Errore Python exit', code);
      return res.status(500).json({ error: 'Errore generazione cartiglio' });
    }
    const png_base64 = stdout.trim();
    if (!png_base64) {
      return res.status(500).json({ error: 'Nessun output dal generatore cartiglio' });
    }
    console.log('[cartiglio] Generato - lunghezza base64:', png_base64.length);
    res.json({ png_base64 });
  });

  child.on('error', (err) => {
    console.error('[cartiglio] Impossibile avviare Python:', err.message);
    res.status(500).json({ error: 'Impossibile avviare il generatore cartiglio' });
  });
});

// --- AVVIO -----------------------------------------------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('====================================');
  console.log(' SafetyAI API Server');
  console.log('====================================');
  console.log(' Porta: ' + PORT);
  console.log(' Chiave API: configurata');
  console.log(' CORS: ' + ALLOWED_ORIGINS.join(', '));
  console.log(' Rate limit analisi: ' + (process.env.CLAUDE_DAILY_LIMIT || '10000') + ' PDF/giorno per IP');
  console.log('====================================');
  if (PORT === 3001 || PORT === '3001') {
    console.log('');
    console.log(' Lascia aperta questa finestra.');
    console.log(' Apri seconda finestra e lancia: npm start');
  }
  console.log('');
});
