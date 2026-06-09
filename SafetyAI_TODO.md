# SafetyAI — Lista attività

Ultimo aggiornamento: 19 maggio 2026

---

## 🔴 PRIMA DEL LANCIO — Obbligatorio

### Sicurezza server
- [ ] Spostare la chiave API Anthropic in variabile d'ambiente (non nel codice)
- [ ] Aggiungere autenticazione alle richieste al server (token utente)
- [ ] Aggiungere rate limiting (max X richieste per utente per minuto)
- [ ] Verificare che HTTPS sia attivo sul server di produzione
- [ ] Rimuovere la chiave API hardcoded da UploadMassivo.jsx e da tutti i file src

### Infrastruttura
- [ ] Acquistare dominio safetyai.it
- [ ] Deploy server Node.js su Railway o Render
- [ ] Deploy frontend React su Vercel
- [ ] Configurare variabili d'ambiente in produzione
- [ ] Testare il flusso completo in produzione prima del lancio

### Legale / Privacy
- [ ] Revisione legale del DPA da parte di un avvocato specializzato in privacy
- [ ] Verificare conformità informativa privacy con GDPR art. 13
- [ ] Definire e formalizzare i Termini di servizio
- [ ] Aggiornare i link nel footer del sito (Privacy Policy, DPA, Termini)

### Pagamenti
- [ ] Creare account Stripe
- [ ] Definire i piani di abbonamento definitivi con prezzi
- [ ] Implementare il flusso di pagamento nell'app
- [ ] Testare pagamenti in modalità sandbox prima del lancio

---

## 🟡 SVILUPPO APP — In corso / Prossimi passi

### Funzionalità core da completare
- [ ] Collegare il modulo "Carica documenti" al database localStorage (ora i dati analizzati non vengono salvati in modo strutturato)
- [ ] Implementare la sezione Scadenze con i dati reali dal database
- [ ] Implementare la sezione Accessi con i dati reali
- [ ] Implementare la sezione Notifiche (alert automatici scadenze)
- [ ] Completare il modulo Appaltatori (aggiunta manuale + upload documenti)
- [ ] Completare il modulo Subappaltatori
- [ ] Collegare DUVRI e POS ai dati reali delle aziende e lavoratori

### Onboarding azienda
- [ ] Testare l'analisi AI di visura camerale reale
- [ ] Testare l'analisi AI di DVR reale (vari formati e dimensioni)
- [ ] Gestire il caso in cui il PDF non è leggibile (scansione non OCR)

### Qualità analisi AI
- [ ] Raccogliere 50-100 attestati reali per testare l'accuratezza
- [ ] Affinare le regole di conformità D.Lgs 81/08 in base agli errori trovati
- [ ] Aggiungere regole per i casi edge (attestati molto vecchi, enti non riconosciuti)

### UX / Interfaccia
- [ ] Rendere modificabili i dati estratti dall'AI direttamente nella schermata risultati
- [ ] Aggiungere funzione di ricerca lavoratori
- [ ] Aggiungere filtri per scadenza nella vista Scadenze
- [ ] Ottimizzare per mobile (l'app attualmente è pensata per desktop)

---

## 🟢 MARKETING / LANCIO

### Sito web
- [ ] Aggiornare sezione prezzi con piani definitivi
- [ ] Aggiungere email di contatto reale al posto di info@safetyai.it
- [ ] Aggiungere form "Richiedi accesso anticipato" con raccolta email
- [ ] Pubblicare il sito online (ora è solo un file HTML locale)
- [ ] SEO base (meta description, og tags, sitemap)

### Promozione
- [ ] Creare profilo LinkedIn SafetyAI
- [ ] Preparare post di lancio per LinkedIn
- [ ] Contattare rete professionale HSE esistente per beta test
- [ ] Raccogliere feedback strutturato dai 2 tester attuali
- [ ] Preparare script e registrare video dimostrativo reale

### Pre-lancio
- [ ] Onboardare i 2 tester attuali sulla versione online
- [ ] Raccogliere almeno 5 testimonianze da beta tester prima del lancio pubblico
- [ ] Definire data target di lancio pubblico

---

## ✅ COMPLETATO

- [x] Struttura base app React con sidebar e navigazione
- [x] Modulo Upload Massivo con analisi AI attestati
- [x] Controllo conformità normativa D.Lgs 81/08 (14 regole)
- [x] Export Excel con matrice lavoratori × attestati colorata
- [x] Approvazione/rifiuto documenti non conformi
- [x] Apertura PDF originale per verifica (pulsante "Verifica")
- [x] Disclaimer pre-export con responsabilità operatore
- [x] Pagina Privacy & Responsabilità con DPA completo
- [x] Schermata benvenuto con accettazione Privacy + DPA
- [x] Struttura dati completa (aziende, appalti, appaltatori, subappaltatori, lavoratori)
- [x] Persistenza dati con localStorage
- [x] Selettore multi-azienda nella sidebar
- [x] Onboarding azienda con analisi AI da visura + DVR
- [x] Supporto DVR di grandi dimensioni (estrazione testo prime 30 pagine)
- [x] Inserimento manuale dati azienda
- [x] Profilo azienda con rischi e figure della sicurezza
- [x] Sito marketing completo (landing page)
- [x] Demo animata integrata nel sito nella sezione "Come funziona"
- [x] DPA in PDF scaricabile dall'app
- [x] Informativa Privacy in PDF scaricabile dall'app

---

## 📝 NOTE

**Stack tecnologico attuale:**
- Frontend: React (localhost:3000)
- Backend: Node.js + Express (localhost:3001)
- AI: Claude Haiku via API Anthropic
- Storage: localStorage (lato client)
- PDF: estrazione testo con PDF.js

**Costi stimati in produzione:**
- Server (Railway/Render): €5-10/mese
- Dominio: €20/anno
- Anthropic per utente attivo: €0.20-0.50/mese
- Stripe: 1.4% + €0.25 per transazione
- Totale infrastruttura base: ~€10-15/mese

**Break-even:** 1 utente piano Professional (€79/mese) copre tutti i costi fissi
