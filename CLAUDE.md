# CLAUDE.md — Agile81

Gestionale HSE per RSPP esterni e CSE italiani, con analisi AI dei documenti (attestati di formazione, visure, DVR) tramite API Anthropic. Lingua del progetto: **italiano** (codice, commenti, UI, commit).

> **Nota rebrand (28/08/2026):** il prodotto si chiamava "SafetyAI", rinominato in **Agile81** (nome libero sul mercato, dominio target `agile81.it` da acquistare). Cartella locale, repo GitHub (`frenzello/safetyai`) e progetti Vercel/Railway restano con il vecchio nome per ora — si rinominano quando si acquista il dominio. Non stupirti quindi di trovare "safetyai" in percorsi, URL infrastrutturali, file legali/moduli non ancora aggiornati (vedi elenco più sotto) o nella cronologia git.

## Documenti guida — leggerli prima di lavorare

- `Agile81_PIANO_90_GIORNI.md` — posizionamento, priorità e criterio di successo (10 clienti paganti in 90 giorni). **L'ordine delle priorità tecniche è lì e va rispettato: niente funzionalità nuove prima della validazione.**
- `Agile81_TODO.md` — lista attività dettagliata (attenzione: aggiornata a maggio 2026, alcune voci di sicurezza sono già risolte in `server.js`).

## Architettura

- **Front-end**: React 18 (create-react-app, porta 3000). Tutto in `src/`, componenti a file singolo. `App.js` esporta due shell: `AppMVP` (freemium, nessun login, monta solo `UploadMassivo` — quella live in produzione, `MVP_MODE = true`) e `AppCompleta` (multi-azienda dietro Supabase, dormiente, non montata).
- **Back-end**: `server.js` — Express (porta 3001). Fa da proxy sicuro verso l'API Anthropic (`/api/claude`) e genera il cartiglio PSC via Python (`/api/genera-cartiglio`). Ha già: chiave in variabile d'ambiente (`ANTHROPIC_KEY`), rate limiting configurabile, CORS con whitelist, validazione modello/allegati, Sentry opzionale.
- **AI**: Claude Haiku (con escalation a Sonnet) via API, chiamato SOLO attraverso il server, mai dal client.
- **Storage**: nel flusso live (`AppMVP`) non c'è persistenza — analisi client-side, nessun database. `AppCompleta` (dormiente) ha una migrazione da localStorage (`src/database.js`, rimosso) a Supabase (`src/dbSupabase.js`, `src/supabaseClient.js`, `src/AuthSupabase.jsx`, schema in `supabase/schema.sql`) per un eventuale tier a pagamento futuro.
- **Deploy**: front-end su Vercel (dominio attuale `safetyai-lluu.vercel.app`, da migrare a `agile81.it`), server su Railway (config in `railway.json`, `Dockerfile`, `nixpacks.toml`). `REACT_APP_API_URL` deve essere impostata nelle Environment Variables del progetto Vercel (tipo **Config**, non Secret — è un URL pubblico) altrimenti il front-end ricade su `localhost:3001` anche in produzione.
- **Rebrand in corso**: testi UI, titolo pagina e documenti di progetto sono già "Agile81"; restano da aggiornare (non urgente, moduli non raggiungibili dal flusso live): `ModuloPSC.jsx`, `ModuloBadge.jsx`, `ModuloAccessi.jsx`, `ModuloNotifiche.jsx`, `RegistroScadenze.jsx`, `AuthSupabase.jsx`, `AccessGate.jsx`, `PrivacyResponsabilita.jsx`, `DPA.jsx`, `TerminiServizio.jsx`, gli script Python `genera_psc_*.py`, `supabase/schema.sql`, `legal/*.md`, `safetyai_website.html` (sito marketing, non ancora pubblicato).

## Comandi

- `npm run server` — avvia il back-end (richiede `.env` con `ANTHROPIC_KEY`)
- `npm start` — avvia il front-end (in una seconda finestra)
- `avvia.bat` — avvio rapido su Windows
- `npm run build` — build di produzione

## Mappa dei moduli principali (src/)

- `App.js` — `AppMVP` (live: header + `UploadMassivo`, nessuna azienda/sidebar) e `AppCompleta` (dormiente: shell, sidebar, navigazione, selettore multi-azienda)
- `UploadMassivo.jsx` — cuore del prodotto: upload attestati, analisi AI, controllo conformità D.Lgs 81/08, rilevamento schede lavoratore duplicate, export Excel colorato
- `Onboarding.jsx` — schermata di consenso privacy/DPA (live) + creazione azienda con AI da visura camerale + DVR (dormiente, solo `AppCompleta`)
- `ModuloScadenze.jsx` / `RegistroScadenze.jsx` — scadenzario (dormiente)
- `ModuloNotifiche.jsx` — notifiche scadenze (dormiente, da collegare ai dati reali)
- `ModuloAppaltatori.jsx`, `ModuloAccessi.jsx`, `ModuloBadge.jsx` — appalti, accessi, badge CR80 (dormiente)
- `ModuloPSC.jsx`, `POS.jsx`, `TemplatesPOS.jsx`, `TemplatesDUVRIDVR.jsx` — documenti cantiere (PSC/POS/DUVRI, dormiente)
- `PrivacyResponsabilita.jsx`, `DPA.jsx`, `DisclaimerExport.jsx`, `TerminiServizio.jsx` — parte legale/privacy (`DisclaimerExport.jsx` live, gli altri tre dormienti)
- `dbSupabase.js` — CRUD multi-tenant per `AppCompleta` (dormiente, nessun uso nel flusso live)

## Regole vincolanti

1. **Mai** chiavi API nel codice client o committate: la chiave vive solo in `.env` (già in `.gitignore`) e passa solo per `server.js`. Se trovi una chiave hardcoded in `src/`, rimuovila e segnalalo.
2. Non allentare la validazione di `server.js` (modelli consentiti, max_tokens, numero allegati) né il rate limiting senza motivo esplicito.
3. La cartella `DIPENDENTI/` contiene documenti personali reali: mai committarla, mai copiarne il contenuto in output o test.
4. Contenuto normativo (D.Lgs 81/08): non inventare regole di conformità. Riferimenti già validati dall'autore: rinnovo antincendio ogni 5 anni; aggiornamento preposti biennale; ore corsi PLE secondo Accordo Stato-Regioni 17/04/2025. In caso di dubbio normativo, chiedere a Frenzello (è RSPP: il dominio lo valida lui).
5. Le nuove funzionalità di persistenza si scrivono su Supabase, non su localStorage.
6. Il flusso freemium (analisi senza registrazione) è la strategia di acquisizione: non metterlo dietro login.

## Stato e direzione (agosto 2026)

Decisione strategica: micro-SaaS di nicchia per RSPP esterni multi-azienda, differenziato sulla prova immediata senza demo commerciale. Prezzo target 30–80 €/mese. Prima milestone: versione online con freemium funzionante, poi 50–100 contatti RSPP reali. Dettagli e motivazioni nel piano dei 90 giorni.
