const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY || '';

if (!ANTHROPIC_KEY) {
  console.error('ERRORE: chiave API mancante.');
  process.exit(1);
}

app.post('/api/claude', async (req, res) => {
  console.log('Richiesta ricevuta — invio ad Anthropic...');
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
      console.error('Errore da Anthropic:', data.error.message);
    } else {
      console.log('Risposta ricevuta correttamente');
    }

    res.json(data);
  } catch (err) {
    console.error('Errore connessione:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('');
  console.log('====================================');
  console.log(' SafetyAI API Server');
  console.log('====================================');
  console.log(' In ascolto su http://localhost:3001');
  console.log(' Chiave API: configurata');
  console.log('====================================');
  console.log('');
  console.log(' Lascia aperta questa finestra.');
  console.log(' Apri seconda finestra e lancia: npm start');
  console.log('');
});
