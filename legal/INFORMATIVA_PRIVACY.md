# Informativa sul trattamento dei dati personali — SafetyAI

> **BOZZA operativa — non è un parere legale.** Va rivista e validata da un consulente privacy/DPO prima della pubblicazione. I dati identificativi (Titolare, contatti, P.IVA) tra parentesi quadre vanno completati.

_Ultimo aggiornamento: [data] — resa ai sensi degli artt. 13-14 del Regolamento (UE) 2016/679 (GDPR)._

## 1. Ruoli (catena del trattamento)

SafetyAI è uno strumento SaaS che analizza documenti di sicurezza sul lavoro (attestati di formazione, idoneità sanitarie, documenti aziendali).

- **Titolare del trattamento**: l'**azienda cliente/consulente** che carica i documenti dei propri lavoratori o dei propri appaltatori (decide finalità e mezzi).
- **Responsabile del trattamento (art. 28)**: **[Ragione sociale gestore SafetyAI]**, che tratta i dati per conto del Titolare sulla base di un apposito accordo (DPA).
- **Sub-responsabili**: fornitori infrastrutturali e di IA elencati nel documento `SUB-RESPONSABILI_E_TRATTAMENTO.md`.
- **Interessati**: i lavoratori (dipendenti/appaltatori) i cui documenti vengono caricati.

## 2. Dati trattati

- **Dati identificativi**: nome, cognome, codice fiscale, mansione, azienda di appartenenza.
- **Dati sui documenti di sicurezza**: tipo di corso/attestato, date di rilascio e scadenza, ente erogatore, ore, esito di conformità.
- **Categorie particolari (art. 9 GDPR) — dati sanitari**: le **idoneità sanitarie** contengono dati relativi alla salute. Sono trattati esclusivamente per l'adempimento degli obblighi in materia di salute e sicurezza sul lavoro (art. 9, par. 2, lett. b) e h) GDPR; D.Lgs. 81/2008).

## 3. Finalità e base giuridica

| Finalità | Base giuridica |
|---|---|
| Verifica della conformità documentale alla normativa (D.Lgs. 81/08 e Accordi Stato-Regioni) | Obbligo legale del datore di lavoro (art. 6, par. 1, lett. c) + art. 9, par. 2, lett. b/h) |
| Gestione scadenze e promemoria rinnovi | Legittimo interesse / esecuzione del contratto di servizio |
| Sicurezza e funzionamento del servizio | Legittimo interesse |

I documenti **non** vengono utilizzati per addestrare modelli di intelligenza artificiale (vedi `SUB-RESPONSABILI_E_TRATTAMENTO.md`).

## 4. Modalità e analisi automatizzata

I documenti vengono elaborati da un modello di IA che estrae i dati e propone un esito di conformità. **La decisione finale resta sempre dell'operatore umano** (approvazione/scarto manuale): non vi è un processo decisionale interamente automatizzato con effetti giuridici ai sensi dell'art. 22 GDPR.

## 5. Destinatari e trasferimenti extra-UE

Per erogare il servizio, i dati sono comunicati ai sub-responsabili elencati nel relativo documento. Alcuni (es. il fornitore del modello di IA) possono trattare i dati **al di fuori dell'UE (USA)**: il trasferimento avviene sulla base di **Clausole Contrattuali Standard (SCC)** e misure supplementari. Dettaglio in `SUB-RESPONSABILI_E_TRATTAMENTO.md`.

## 6. Conservazione

I dati sono conservati per il tempo necessario agli adempimenti di sicurezza sul lavoro e agli obblighi di legge (es. conservazione della documentazione formativa). Al termine del rapporto/servizio sono cancellati o restituiti al Titolare. Periodo indicativo: **[definire, es. 10 anni per la documentazione formativa]**.

## 7. Diritti degli interessati

Gli interessati possono esercitare i diritti di cui agli artt. 15-22 GDPR (accesso, rettifica, cancellazione, limitazione, opposizione, portabilità) scrivendo a **[email Titolare / DPO]**. È inoltre possibile proporre reclamo al **Garante per la protezione dei dati personali** (www.garanteprivacy.it).

## 8. Misure di sicurezza

Accesso protetto da autenticazione, cifratura in transito (HTTPS/TLS), isolamento dei dati per organizzazione, chiavi API custodite lato server. Dettaglio tecnico in `SUB-RESPONSABILI_E_TRATTAMENTO.md`.
