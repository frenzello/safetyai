# rspPINO — Piano di rilancio 90 giorni (agosto → novembre 2026)

> Questo file va messo nella cartella del progetto accanto a `rspPINO_TODO.md`.
> Contesto per Claude Code: leggere questo file insieme a `rspPINO_TODO.md` prima di ogni sessione di lavoro.
> Rinominato da "SafetyAI" ad "rspPINO" il 28/08/2026 — vedi la nota rebrand in `CLAUDE.md`.

## Decisione e posizionamento (dall'analisi di mercato del 25/08/2026)

Decisione: si procede, come **micro-SaaS di nicchia**, non come startup generalista.

- Target: **RSPP esterni multi-azienda** (30–80 piccole aziende clienti ciascuno). NON competere frontalmente su verifica fornitori/cantiere: lì c'è già Levels / "Operatore Sicurezza" (AI, 65+ tipologie documentali, 2.000+ cantieri) con 1–2 anni di vantaggio.
- Differenziazione: **distribuzione, non tecnologia**. Tutti i concorrenti (Levels, Blumatica, Sicurweb, Namirial, TeamSystem, Sikuro, Twind) vendono via "richiedi una demo". rspPINO si prova in 5 minuti senza registrazione: upload attestati → analisi AI → Excel. Il freemium È il canale di acquisizione.
- Prezzi di mercato osservati: 50–300 €/mese (Twind da 79 €/mese per RSPP esterni; Sikuro ~500 €/anno). Fascia target per rspPINO: 30–80 €/mese.
- Soglia decisionale: **10 clienti paganti entro 90 giorni dal lancio pubblico**. Se non raggiunta, il progetto torna strumento interno per la consulenza e non si investe oltre.
- L'analisi AI dei documenti non è un fossato competitivo (chiunque può integrare un'API LLM; la piattaforma gratuita "Check" del sistema bilaterale la offre già gratis a Napoli). Non venderla come "AI": vendere il risultato — "scadenzario sempre aggiornato senza lavoro manuale".

## Priorità tecniche, in ordine (blocca tutto il resto)

Stato verificato al 25/08/2026: la sicurezza server è già in gran parte fatta in `server.js` (chiave in variabile d'ambiente, rate limiting configurabile, CORS con whitelist, validazione modello/allegati, Sentry). La migrazione Supabase è iniziata (`supabase/schema.sql`, `src/dbSupabase.js`, `src/AuthSupabase.jsx`, `src/supabaseClient.js`). Esiste già un deploy front-end su Vercel (safetyai-lluu.vercel.app, in attesa di migrazione a rsppino.it) e configurazione Railway/Docker per il server.

1. **Completare la migrazione a Supabase** — portare tutti i moduli da `database.js` (localStorage) a `dbSupabase.js`. localStorage non è un prodotto vendibile: niente multi-dispositivo, niente backup, niente account.
2. **Bonifica residua sicurezza client**: verificare che nessuna chiave API sia rimasta hardcoded nei file `src/` (voce ancora aperta nel TODO per `UploadMassivo.jsx`); per il tier gratuito pubblico abbassare `CLAUDE_DAILY_LIMIT` e valutare un captcha oltre soglia.
3. **Auth + gate freemium**: analisi + export Excel liberi senza registrazione; persistenza, multi-azienda, scadenzario e notifiche dietro account (poi a pagamento). ✅ Fatto il 28/08/2026: `AppMVP` in produzione, nessun login, nessun database nel flusso live.
4. **Deploy di produzione completo**: dominio definitivo, server Node su Railway (config già presente), CORS ristretto al dominio finale, test del flusso completo end-to-end. ✅ Backend Railway e frontend Vercel verificati funzionanti end-to-end il 28/08/2026 (dominio ancora safetyai-lluu.vercel.app, da migrare a rsppino.it).
5. **Notifiche automatiche scadenze** — è la funzione per cui un RSPP paga ogni mese, va resa affidabile (email, digest settimanale). `ModuloNotifiche.jsx` esiste già, va collegato ai dati reali.

Rimandare a dopo la validazione: DUVRI/POS collegati ai dati reali, sezione Accessi, badge avanzati. Non aggiungere funzioni nuove prima dei 10 paganti.

## Go-to-market (in parallelo, dalle settimane 4–6)

- Landing page con prova immediata senza registrazione (il "wow" in 5 minuti).
- Portarla davanti a 50–100 RSPP veri: LinkedIn, gruppi di categoria (AiFOS, ordini, gruppi Facebook/Telegram di RSPP), colleghi diretti.
- Raccogliere obiezioni e disponibilità a pagare PRIMA di fissare il prezzo definitivo.
- Ogni conversazione registrata: chi è, quante aziende gestisce, cosa usa oggi, cosa pagherebbe.

## Metriche da tracciare dal giorno 1

Visite → prove gratuite → registrazioni → paganti. Con numeri su questi quattro passaggi la decisione dei 90 giorni si prende da sola.
