export default function DPA({ onBack }) {
  const oggi = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  const articoli = [
    {
      numero: "1",
      titolo: "Definizioni e oggetto",
      contenuto: `Ai sensi del presente Accordo, i termini sotto indicati hanno il seguente significato:

"Titolare del trattamento" (di seguito "Titolare"): il professionista o l'ente che utilizza SafetyAI per elaborare dati personali nell'ambito della propria attività professionale di consulenza in materia di sicurezza sul lavoro.

"Responsabile del trattamento" (di seguito "SafetyAI" o "Responsabile"): il fornitore del servizio SafetyAI, che elabora dati personali per conto del Titolare secondo le istruzioni di quest'ultimo.

"Dati personali": qualsiasi informazione relativa a persone fisiche identificate o identificabili, inclusi nome, cognome, codice fiscale, dati relativi alla salute (idoneità sanitaria), dati relativi alla formazione professionale e qualsiasi altra informazione contenuta nei documenti caricati sulla piattaforma.

"Trattamento": qualsiasi operazione applicata ai dati personali, inclusa la raccolta, la registrazione, l'organizzazione, la strutturazione, la conservazione, l'elaborazione, la comunicazione o la cancellazione.

"Violazione dei dati": qualsiasi violazione della sicurezza che comporti accidentalmente o in modo illecito la distruzione, la perdita, la modifica, la divulgazione non autorizzata o l'accesso ai dati personali trasmessi, conservati o trattati.

Il presente Accordo disciplina il trattamento dei dati personali effettuato da SafetyAI per conto del Titolare nell'ambito dell'utilizzo del servizio SafetyAI, in conformità all'art. 28 del Regolamento (UE) 2016/679 (GDPR).`
    },
    {
      numero: "2",
      titolo: "Istruzioni per il trattamento",
      contenuto: `SafetyAI tratta i dati personali esclusivamente su documentata istruzione del Titolare e unicamente per le seguenti finalità:

a) Analisi automatizzata dei documenti caricati dal Titolare tramite intelligenza artificiale, al fine di estrarne informazioni strutturate (tipo documento, nome lavoratore, date di scadenza, conformità normativa);

b) Restituzione al Titolare delle informazioni estratte in forma organizzata, tramite l'interfaccia della piattaforma e/o file di esportazione (es. Excel);

c) Supporto tecnico al Titolare nell'utilizzo della piattaforma, nei limiti strettamente necessari.

SafetyAI non tratta i dati personali per finalità proprie, non li cede a terzi a fini commerciali e non li utilizza per addestrare modelli di intelligenza artificiale.

Qualora SafetyAI ritenga che un'istruzione del Titolare violi il GDPR o altre disposizioni applicabili in materia di protezione dei dati, ne informa immediatamente il Titolare.`
    },
    {
      numero: "3",
      titolo: "Conservazione e cancellazione dei dati",
      contenuto: `SafetyAI adotta il principio di minimizzazione del trattamento. In particolare:

a) I documenti caricati dal Titolare (PDF, immagini) vengono trasmessi all'API di analisi e immediatamente scartati dalla memoria del sistema. SafetyAI non archivia i file originali su propri server.

b) I dati estratti dall'analisi (nome lavoratore, tipo documento, date, esito conformità) vengono visualizzati nella sessione attiva del Titolare e non vengono conservati da SafetyAI al termine della sessione.

c) I file esportati dal Titolare (es. registro Excel) risiedono esclusivamente sul dispositivo del Titolare e sono sotto la sua esclusiva responsabilità.

d) SafetyAI non conserva log dei contenuti elaborati. Vengono conservati esclusivamente log tecnici anonimi necessari per la stabilità e la sicurezza del servizio (es. timestamp delle richieste, codici di errore), privi di qualsiasi riferimento al contenuto dei documenti o all'identità dei lavoratori.

Al termine del rapporto contrattuale, SafetyAI conferma per iscritto al Titolare che nessun dato personale è conservato nei propri sistemi.`
    },
    {
      numero: "4",
      titolo: "Misure di sicurezza tecniche e organizzative",
      contenuto: `SafetyAI adotta le seguenti misure di sicurezza ai sensi dell'art. 32 GDPR:

Misure tecniche:
— Tutte le comunicazioni tra client e server avvengono tramite protocollo HTTPS con cifratura TLS 1.2 o superiore;
— Le chiavi API per l'accesso ai servizi di intelligenza artificiale non sono mai esposte lato client;
— Le trasmissioni dei dati verso i servizi di analisi AI avvengono tramite connessioni cifrate;
— L'accesso ai sistemi di SafetyAI è protetto da autenticazione e limitato al personale autorizzato.

Misure organizzative:
— Il personale di SafetyAI che ha accesso ai sistemi è soggetto a obbligo di riservatezza;
— Vengono condotte verifiche periodiche delle misure di sicurezza adottate;
— SafetyAI si impegna ad aggiornare le misure di sicurezza in funzione dell'evoluzione tecnologica e dei rischi identificati.

SafetyAI tiene conto del rischio specifico associato al trattamento di dati relativi alla salute (idoneità sanitaria) ai sensi dell'art. 9 GDPR e adotta misure proporzionate alla natura di tali dati.`
    },
    {
      numero: "5",
      titolo: "Sub-responsabili del trattamento",
      contenuto: `Il Titolare autorizza SafetyAI ad avvalersi dei seguenti sub-responsabili del trattamento per l'erogazione del servizio:

— Anthropic, PBC (San Francisco, California, USA): fornitore del servizio di intelligenza artificiale utilizzato per l'analisi dei documenti. Anthropic elabora i dati trasmessi tramite API secondo la propria politica commerciale, che prevede che i dati trasmessi tramite API non vengano utilizzati per addestrare modelli AI. Il trasferimento di dati verso gli USA avviene nel rispetto delle garanzie applicabili ai sensi del Capo V GDPR.

SafetyAI si impegna a:
a) Informare il Titolare di eventuali modifiche riguardanti l'aggiunta o la sostituzione di sub-responsabili, offrendo al Titolare la possibilità di opporsi a tali modifiche;
b) Imporre ai sub-responsabili, tramite contratto, obblighi equivalenti a quelli previsti dal presente Accordo;
c) Rispondere nei confronti del Titolare dell'adempimento degli obblighi dei sub-responsabili.`
    },
    {
      numero: "6",
      titolo: "Diritti degli interessati",
      contenuto: `SafetyAI assiste il Titolare nell'adempimento degli obblighi relativi all'esercizio dei diritti degli interessati (lavoratori) ai sensi degli artt. 15-22 GDPR, inclusi il diritto di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione.

Considerato che SafetyAI non conserva dati personali al termine della sessione (art. 3 del presente Accordo), le richieste di accesso, cancellazione o portabilità relative ai dati dei lavoratori dovranno essere gestite dal Titolare attraverso i propri archivi, che rimangono l'unica sede di conservazione dei documenti originali.

SafetyAI si impegna a rispondere alle richieste di assistenza del Titolare in materia di diritti degli interessati entro 5 giorni lavorativi.`
    },
    {
      numero: "7",
      titolo: "Notifica delle violazioni dei dati",
      contenuto: `SafetyAI notifica al Titolare qualsiasi violazione dei dati personali di cui venga a conoscenza entro 72 ore dalla scoperta, fornendo almeno le seguenti informazioni:

a) Descrizione della natura della violazione, incluse le categorie e il numero approssimativo di interessati e di registrazioni di dati personali coinvolti;
b) Nome e dati di contatto del responsabile della protezione dei dati o di altro punto di contatto presso cui ottenere più informazioni;
c) Descrizione delle probabili conseguenze della violazione;
d) Descrizione delle misure adottate o proposte per porre rimedio alla violazione.

Il Titolare rimane responsabile della notifica all'Autorità Garante e degli interessati nei termini previsti dagli artt. 33 e 34 GDPR.`
    },
    {
      numero: "8",
      titolo: "Trasferimenti internazionali di dati",
      contenuto: `Il servizio di analisi AI utilizza infrastrutture di Anthropic, PBC, con sede negli Stati Uniti. Il trasferimento di dati personali verso gli USA avviene sulla base delle garanzie applicabili ai sensi del Capo V GDPR.

SafetyAI si impegna a monitorare l'evoluzione del quadro normativo relativo ai trasferimenti internazionali e ad adottare le misure necessarie per garantire la conformità del trattamento.

Il Titolare prende atto che il trasferimento di dati verso gli USA è necessario per l'erogazione del servizio di analisi AI e accetta tale trasferimento con la sottoscrizione del presente Accordo.`
    },
    {
      numero: "9",
      titolo: "Audit e verifiche",
      contenuto: `SafetyAI mette a disposizione del Titolare tutte le informazioni necessarie a dimostrare il rispetto degli obblighi previsti dall'art. 28 GDPR e contribuisce alle attività di audit e ispezione realizzate dal Titolare o da un revisore incaricato dal Titolare.

Le richieste di audit devono essere comunicate a SafetyAI con ragionevole preavviso (almeno 15 giorni) e non devono interferire con le normali attività operative. I costi dell'audit sono a carico del Titolare.

SafetyAI può richiedere che il revisore incaricato dal Titolare sottoscriva un accordo di riservatezza prima di accedere alle informazioni richieste.`
    },
    {
      numero: "10",
      titolo: "Durata e risoluzione",
      contenuto: `Il presente Accordo ha la stessa durata del contratto di servizio tra il Titolare e SafetyAI. In caso di risoluzione del contratto per qualsiasi causa, SafetyAI conferma per iscritto al Titolare, entro 30 giorni dalla cessazione del rapporto, che nessun dato personale è conservato nei propri sistemi.

Il presente Accordo sostituisce e integra qualsiasi precedente accordo tra le parti relativo al trattamento dei dati personali. In caso di conflitto tra il presente Accordo e il contratto di servizio principale, prevalgono le disposizioni del presente Accordo in materia di protezione dei dati.`
    },
  ];

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: "#0f1117",
      minHeight: "100vh",
      color: "#e2e8f0",
    }}>
      {/* Header sticky */}
      <div style={{
        borderBottom: "1px solid #1e2535",
        padding: "16px 32px",
        display: "flex", alignItems: "center", gap: 16,
        position: "sticky", top: 0,
        background: "#0f1117", zIndex: 10,
      }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: "none", border: "none", color: "#3b82f6",
            fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6, padding: "6px 0",
          }}>← Torna</button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white" }}>S</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>SafetyAI</span>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 60px" }}>

        {/* Intestazione documento */}
        <div style={{
          background: "#161b27", border: "1px solid #1e2535",
          borderRadius: 14, padding: "28px 32px", marginBottom: 32,
        }}>
          <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700, letterSpacing: "0.8px", marginBottom: 12 }}>
            DOCUMENTO LEGALE · GDPR ART. 28
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px", marginBottom: 8 }}>
            Data Processing Agreement
          </div>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
            Accordo sul Trattamento dei Dati Personali tra SafetyAI e l'Utente Professionale
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Responsabile del trattamento", valore: "SafetyAI" },
              { label: "Titolare del trattamento", valore: "L'utente professionale registrato" },
              { label: "Base giuridica", valore: "Art. 28 Reg. UE 2016/679 (GDPR)" },
              { label: "Ultimo aggiornamento", valore: oggi },
            ].map((item, i) => (
              <div key={i} style={{ padding: "10px 14px", background: "#0f1117", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 4 }}>{item.label.toUpperCase()}</div>
                <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 600 }}>{item.valore}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Avviso legale */}
        <div style={{
          padding: "14px 18px", marginBottom: 28,
          background: "#f59e0b08", border: "1px solid #f59e0b25",
          borderRadius: 10, display: "flex", gap: 12,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
            <strong style={{ color: "#f59e0b" }}>Nota legale:</strong> il presente documento è un DPA standard predisposto da SafetyAI come punto di partenza. Per un utilizzo professionale si raccomanda la revisione da parte di un legale specializzato in privacy prima del lancio commerciale del servizio.
          </div>
        </div>

        {/* Articoli */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {articoli.map((art, i) => (
            <div key={i} style={{
              background: "#161b27",
              border: "1px solid #1e2535",
              borderRadius: 12, overflow: "hidden",
            }}>
              <div style={{
                padding: "14px 20px",
                borderBottom: "1px solid #1e2535",
                display: "flex", alignItems: "center", gap: 12,
                background: "#0f111780",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: "#3b82f620",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "#60a5fa",
                }}>
                  {art.numero}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                  Art. {art.numero} — {art.titolo}
                </div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                {art.contenuto.split("\n\n").map((paragrafo, j) => (
                  <p key={j} style={{
                    fontSize: 13, color: "#94a3b8", lineHeight: 1.75,
                    margin: "0 0 10px 0",
                    whiteSpace: "pre-line",
                  }}>
                    {paragrafo}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Firma */}
        <div style={{
          marginTop: 28, padding: "20px 24px",
          background: "#161b27", border: "1px solid #10b98130",
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>
            Accettazione del presente Accordo
          </div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
            L'utilizzo del servizio SafetyAI in ambito professionale implica l'accettazione integrale del presente Data Processing Agreement. Per i professionisti che gestiscono dati di terzi in modo sistematico è disponibile una versione firmata del presente accordo su richiesta.
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "#334155" }}>
          SafetyAI · Data Processing Agreement · Reg. UE 2016/679 · Versione 1.0
        </div>
      </div>
    </div>
  );
}
