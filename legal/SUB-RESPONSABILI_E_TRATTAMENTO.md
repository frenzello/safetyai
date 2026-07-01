# Sub-responsabili, flusso dati e misure — SafetyAI

> **BOZZA operativa — non è un parere legale.** Da validare con consulente privacy/DPO. Verificare i termini vigenti di ciascun fornitore prima della pubblicazione.

## 1. Elenco sub-responsabili (art. 28, par. 4 GDPR)

| Fornitore | Ruolo nel servizio | Ubicazione dati | Base per trasferimento extra-UE |
|---|---|---|---|
| **Anthropic** (API Claude) | Estrazione dati e verifica conformità dai documenti | USA | SCC + DPA Anthropic (da sottoscrivere/verificare) |
| **Vercel** | Hosting frontend | USA/UE | SCC |
| **Railway** | Hosting backend (API) | USA/UE | SCC |
| **Supabase** | Database e autenticazione (previsto) | UE selezionabile (consigliata region EU) | SCC se region non-UE |

> Prima di andare in produzione: sottoscrivere il **DPA** con ciascun fornitore e, dove possibile, selezionare **region UE** (in particolare Supabase).

## 2. Flusso dei dati verso l'IA (punto più sensibile)

1. L'utente carica un PDF/immagine di un attestato o idoneità.
2. Il file viene inviato **cifrato (HTTPS)** al backend, che lo inoltra all'**API di Anthropic** per l'estrazione dei dati.
3. Anthropic restituisce i dati strutturati; il file **non viene conservato** dal servizio oltre la sessione di analisi (salvo salvataggio esplicito nel registro da parte dell'utente).

**Da documentare/verificare nei termini vigenti di Anthropic:**
- che i dati inviati via **API commerciale non siano usati per l'addestramento** dei modelli;
- la **retention** lato Anthropic degli input/output;
- la disponibilità del **DPA** e delle **SCC** per il trasferimento USA.

## 3. Dati sanitari (art. 9 GDPR)

Le idoneità sanitarie contengono dati sulla salute. Misure minime richieste:
- trattamento limitato alle finalità di sicurezza sul lavoro (art. 9.2 lett. b/h);
- accesso ristretto e tracciato;
- valutazione se sia necessaria una **DPIA** (valutazione d'impatto, art. 35) — probabile, dato il trattamento su larga scala di categorie particolari.

## 4. Conservazione e cancellazione

- Registro attestati/lavoratori: conservato per gli obblighi di legge, poi cancellato/restituito al Titolare.
- File originali caricati: non persistiti oltre l'analisi salvo salvataggio esplicito.
- Definire una **policy di retention** esplicita e un processo di cancellazione su richiesta.

## 5. Misure tecniche e organizzative

- Autenticazione utente e **isolamento dei dati per organizzazione** (Row Level Security su Supabase — in implementazione).
- Cifratura in transito (TLS); segreti (chiavi API) solo lato server, mai nel client.
- Rate limiting e log applicativi; monitoraggio errori (Sentry — in implementazione).
- Backup del database e principio del minimo privilegio sugli accessi.

## 6. Adempimenti aperti (checklist)

- [ ] DPA firmato con azienda cliente (SafetyAI = responsabile, art. 28)
- [ ] DPA/termini verificati con Anthropic, Vercel, Railway, Supabase
- [ ] Region UE per il database (Supabase)
- [ ] DPIA per i dati sanitari
- [ ] Informativa consegnata ai lavoratori dal Titolare (template: `INFORMATIVA_PRIVACY.md`)
- [ ] Policy di retention e procedura di cancellazione
- [ ] Nomina eventuale DPO
