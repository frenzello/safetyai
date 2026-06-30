# Backend SafetyAI (Express) — immagine Node esplicita.
# Evita l'auto-detection di Railpack che trattava il repo come sito React statico
# (immagine Caddy senza Node -> "node: command not found").
FROM node:20-slim

WORKDIR /app

# Installa le dipendenze (lock allineato; npm install tollera eventuali drift futuri)
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

# Copia il resto del codice (server.js, ecc.)
COPY . .

# Railway fornisce la porta via process.env.PORT; server.js usa PORT || 3001
ENV NODE_ENV=production
CMD ["node", "server.js"]
