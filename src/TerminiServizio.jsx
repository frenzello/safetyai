// ─────────────────────────────────────────────────────────────────────────────
// TERMINI DI SERVIZIO — SafetyAI
// TODO prima del go-live:
//   1. Sostituire [RAGIONE SOCIALE], [P.IVA], [INDIRIZZO], [EMAIL] con i dati reali
//   2. Far revisionare il documento da un legale specializzato
// ─────────────────────────────────────────────────────────────────────────────

export default function TerminiServizio() {
  const oggi = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  const sezioni = [
    {
      id: "1",
      titolo: "Fornitore del servizio",
      colore: "#3b82f6",
      contenuto: `Il servizio SafetyAI e' fornito da:

[RAGIONE SOCIALE]
P.IVA: [P.IVA]
Sede legale: [INDIRIZZO]
Email: [EMAIL]

Per qualsiasi comunicazione relativa al servizio, incluse richieste legali o di supporto, utilizzare l'indirizzo email sopra indicato.`,
    },
    {
      id: "2",
      titolo: "Descrizione del servizio",
      colore: "#06b6d4",
      contenuto: `SafetyAI e' uno strumento di supporto per professionisti della sicurezza sul lavoro (RSPP, CSE, datori di lavoro, consulenti HSE). Il servizio offre, in modalita' gratuita e senza registrazione:

— Analisi automatizzata tramite intelligenza artificiale di attestati di formazione, certificazioni e documentazione HSE;
— Verifica indicativa della conformita' normativa ai sensi del D.Lgs 81/08 e delle normative specifiche applicabili;
— Generazione di un registro strutturato in formato Excel con i risultati dell'analisi.

Il servizio e' nella versione Beta. Le funzionalita' possono essere modificate, sospese o interrotte in qualsiasi momento senza preavviso.`,
    },
    {
      id: "3",
      titolo: "Condizioni d'uso e limitazioni",
      colore: "#a78bfa",
      contenuto: `L'utilizzo del servizio e' consentito esclusivamente per finalita' professionali lecite nell'ambito della sicurezza sul lavoro. E' vietato:

— Caricare documenti non di propria pertinenza o per i quali non si disponga di idonea base giuridica al trattamento;
— Utilizzare il servizio per finalita' diverse dalla verifica documentale in ambito HSE;
— Tentare di aggirare i limiti tecnici del servizio (rate limiting, limiti di upload);
— Utilizzare il servizio per generare output che si presentino come certificazioni ufficiali.

Il servizio e' soggetto a un limite di 15 documenti gratuiti per indirizzo IP ogni 24 ore. Questo limite puo' essere modificato in qualsiasi momento.`,
    },
    {
      id: "4",
      titolo: "Limitazione di responsabilita'",
      colore: "#f59e0b",
      contenuto: `L'analisi prodotta dall'intelligenza artificiale ha esclusivamente carattere indicativo e organizzativo. SafetyAI NON:

— Certifica la conformita' normativa dei documenti analizzati;
— Sostituisce la valutazione professionale di un RSPP, CSE, Medico Competente o altro soggetto qualificato;
— Garantisce l'assenza di errori nell'analisi AI (i modelli di linguaggio possono produrre risultati imprecisi);
— Ha valore legale autonomo nell'ambito di ispezioni, contenziosi o rapporti con le autorita'.

Il professionista che utilizza SafetyAI e' il solo responsabile delle decisioni operative prese sulla base dell'analisi ricevuta. SafetyAI non risponde di danni diretti, indiretti o consequenziali derivanti dall'uso o dall'impossibilita' di uso del servizio.

La limitazione di responsabilita' si applica nei limiti consentiti dalla legge italiana applicabile.`,
    },
    {
      id: "5",
      titolo: "Dati personali e privacy",
      colore: "#10b981",
      contenuto: `Il trattamento dei dati personali caricati tramite SafetyAI e' regolato dall'Informativa Privacy e dal Data Processing Agreement (DPA) disponibili nella sezione "Privacy & DPA" del servizio.

In sintesi: i documenti caricati vengono analizzati in memoria e immediatamente scartati. SafetyAI non archivia file originali ne' dati personali al termine della sessione. Il servizio non utilizza cookie di profilazione.

Il trattamento di dati personali dei lavoratori tramite SafetyAI e' consentito solo in presenza di una idonea base giuridica (tipicamente l'obbligo di legge ex D.Lgs 81/08) e previa adeguata informativa agli interessati.`,
    },
    {
      id: "6",
      titolo: "Proprieta' intellettuale",
      colore: "#ec4899",
      contenuto: `Il software, il design, il marchio SafetyAI e tutti i contenuti del servizio sono di proprieta' esclusiva del fornitore o dei rispettivi titolari e sono protetti dalle leggi italiane ed europee sul diritto d'autore e sulla proprieta' intellettuale.

E' consentito l'utilizzo del servizio per le finalita' descritte nei presenti Termini. Non e' consentita la riproduzione, la modifica, la distribuzione o l'utilizzo commerciale di qualsiasi elemento del servizio senza autorizzazione scritta.

I file Excel generati tramite SafetyAI sono di proprieta' dell'utente che li ha prodotti.`,
    },
    {
      id: "7",
      titolo: "Modifiche ai termini e cessazione del servizio",
      colore: "#64748b",
      contenuto: `Il fornitore si riserva il diritto di modificare i presenti Termini in qualsiasi momento. Le modifiche sono efficaci dalla data di pubblicazione sul sito. L'utilizzo continuato del servizio successivamente alla pubblicazione delle modifiche costituisce accettazione dei nuovi Termini.

Il fornitore si riserva il diritto di sospendere o cessare il servizio in qualsiasi momento, inclusa la versione gratuita, senza obbligo di preavviso ne' di indennizzo.`,
    },
    {
      id: "8",
      titolo: "Legge applicabile e foro competente",
      colore: "#334155",
      contenuto: `I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia relativa al servizio SafetyAI, le parti si sottopongono alla giurisdizione esclusiva del Tribunale di [CITTA'].

Per gli utenti consumatori che operano al di fuori dell'ambito professionale si applicano le disposizioni inderogabili del Codice del Consumo (D.Lgs 206/2005) e del Reg. UE 524/2013 sulla risoluzione alternativa delle controversie online.

SafetyAI e' destinato esclusivamente a professionisti. L'utilizzo in veste di consumatore non e' il caso d'uso previsto dal servizio.`,
    },
  ];

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: "#0f1117",
      minHeight: "100vh",
      color: "#e2e8f0",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 60px" }}>

        {/* Titolo */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "4px 12px", borderRadius: 20,
            background: "#3b82f615", border: "1px solid #3b82f630",
            fontSize: 11, color: "#60a5fa", fontWeight: 700,
            letterSpacing: "0.8px", marginBottom: 16,
          }}>
            TERMINI DI SERVIZIO
          </div>
          <div style={{
            fontSize: 26, fontWeight: 800, color: "#f1f5f9",
            letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 12,
          }}>
            Condizioni di utilizzo del servizio SafetyAI
          </div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, maxWidth: 580 }}>
            Utilizzando SafetyAI accetti i presenti Termini di Servizio.
            Ti invitiamo a leggerli prima di caricare documenti.
          </div>
        </div>

        {/* Banner placeholder — visibile solo se dati non compilati */}
        <div style={{
          padding: "12px 16px", marginBottom: 28,
          background: "#f59e0b08", border: "1px solid #f59e0b30",
          borderRadius: 10, display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
            <strong style={{ color: "#f59e0b" }}>Nota per il gestore:</strong>{" "}
            Prima del go-live sostituire i placeholder{" "}
            <span style={{ fontFamily: "monospace", color: "#f59e0b" }}>[RAGIONE SOCIALE]</span>,{" "}
            <span style={{ fontFamily: "monospace", color: "#f59e0b" }}>[P.IVA]</span>,{" "}
            <span style={{ fontFamily: "monospace", color: "#f59e0b" }}>[INDIRIZZO]</span>,{" "}
            <span style={{ fontFamily: "monospace", color: "#f59e0b" }}>[EMAIL]</span>{" "}
            e far revisionare il documento da un legale.
            Questo banner va rimosso in produzione.
          </div>
        </div>

        {/* Sezioni */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sezioni.map((s) => (
            <div key={s.id} style={{
              background: "#161b27",
              border: `1px solid ${s.colore}25`,
              borderRadius: 14,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "14px 20px",
                borderBottom: `1px solid ${s.colore}15`,
                display: "flex", alignItems: "center", gap: 10,
                background: `${s.colore}08`,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: `${s.colore}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: s.colore,
                }}>
                  {s.id}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                  Art. {s.id} — {s.titolo}
                </div>
              </div>
              <div style={{ padding: "14px 20px" }}>
                {s.contenuto.split("\n\n").map((para, j) => (
                  <p key={j} style={{
                    fontSize: 13, color: "#94a3b8", lineHeight: 1.75,
                    margin: "0 0 8px 0", whiteSpace: "pre-line",
                  }}>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#334155" }}>
          SafetyAI · Termini di Servizio · Aggiornati al {oggi} · Legge italiana applicabile
        </div>
      </div>
    </div>
  );
}
