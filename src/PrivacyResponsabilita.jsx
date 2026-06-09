import { useState } from "react";
import DPA from "./DPA";

export default function PrivacyResponsabilita({ onBack }) {
  const [mostraDPA, setMostraDPA] = useState(false);

  if (mostraDPA) {
    return <DPA onBack={() => setMostraDPA(false)} />;
  }
  const sezioni = [
    {
      icona: "🔒",
      titolo: "I tuoi dati non vengono conservati",
      colore: "#3b82f6",
      contenuto: [
        "I documenti che carichi — attestati, idoneità sanitarie, visure, polizze — vengono analizzati in memoria e immediatamente scartati. SafetyAI non archivia nessun file su server propri.",
        "L'analisi avviene tramite le API di Anthropic (Claude). I dati trasmessi per l'analisi non vengono utilizzati per addestrare modelli AI, in conformità con la policy commerciale di Anthropic.",
        "L'unica copia dei documenti rimane sul tuo dispositivo, sotto il tuo controllo."
      ]
    },
    {
      icona: "⚖️",
      titolo: "Chi è titolare del trattamento",
      colore: "#a78bfa",
      contenuto: [
        "Ai sensi del GDPR (Reg. UE 2016/679), il titolare del trattamento dei dati personali dei lavoratori è sempre e solo il professionista che utilizza lo strumento — RSPP, CSE, o datore di lavoro.",
        "SafetyAI opera come responsabile esterno del trattamento (art. 28 GDPR). Per un utilizzo professionale continuativo è necessario sottoscrivere un Data Processing Agreement (DPA) con il fornitore del servizio.",
        "I dati personali trattati — nomi, codici fiscali, dati sanitari — rientrano nelle categorie particolari ex art. 9 GDPR e richiedono una base giuridica adeguata per il trattamento."
      ]
    },
    {
      icona: "🛡️",
      titolo: "Misure di sicurezza adottate",
      colore: "#10b981",
      contenuto: [
        "Tutte le comunicazioni tra il tuo browser e i server di analisi avvengono tramite connessione cifrata (HTTPS/TLS).",
        "Le chiavi API non sono mai esposte nel codice lato client. Ogni chiamata passa attraverso un server intermedio che non registra il contenuto dei documenti.",
        "Non vengono utilizzati cookie di profilazione. Nessun dato viene condiviso con terze parti a fini commerciali o pubblicitari."
      ]
    },
    {
      icona: "⚠️",
      titolo: "Responsabilità dell'operatore",
      colore: "#f59e0b",
      contenuto: [
        "SafetyAI è uno strumento di supporto organizzativo. L'analisi prodotta dall'intelligenza artificiale ha carattere indicativo e non costituisce in nessun caso una valutazione tecnica, legale o di conformità normativa certificata.",
        "La responsabilità del controllo, della validazione e di ogni decisione relativa all'idoneità dei documenti rimane esclusivamente in capo al professionista che utilizza il servizio.",
        "In particolare: l'approvazione o il rifiuto di un documento non conforme secondo l'AI deve essere sempre il risultato di una valutazione autonoma e consapevole dell'operatore, che risponde personalmente delle proprie scelte professionali.",
        "SafetyAI non sostituisce la figura del RSPP, del CSE, del Medico Competente o di qualsiasi altro soggetto con responsabilità definite dal D.Lgs 81/08."
      ]
    },
    {
      icona: "📋",
      titolo: "Cosa fare prima di usare SafetyAI professionalmente",
      colore: "#06b6d4",
      contenuto: [
        "Informa i lavoratori e le imprese del trattamento dei loro dati personali tramite adeguata informativa privacy (art. 13 GDPR).",
        "Verifica che la base giuridica per il trattamento dei dati sanitari (idoneità) sia presente — tipicamente l'obbligo di legge ex D.Lgs 81/08.",
        "Contatta il fornitore del servizio per sottoscrivere il DPA prima di trattare dati di terzi in modo sistematico.",
        "Mantieni sempre una copia dei documenti originali nei tuoi archivi. SafetyAI non è un sistema di archiviazione documentale."
      ]
    }
  ];

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: "#0f1117",
      minHeight: "100vh",
      color: "#e2e8f0",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1e2535",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        position: "sticky",
        top: 0,
        background: "#0f1117",
        zIndex: 10,
      }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: "none", border: "none",
            color: "#3b82f6", fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 0", fontFamily: "inherit",
          }}>
            ← Torna
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            borderRadius: 8, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white",
          }}>S</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>SafetyAI</span>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 60px" }}>

        {/* Titolo */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "4px 12px", borderRadius: 20,
            background: "#3b82f615", border: "1px solid #3b82f630",
            fontSize: 11, color: "#60a5fa", fontWeight: 700,
            letterSpacing: "0.8px", marginBottom: 16,
          }}>
            PRIVACY & RESPONSABILITÀ
          </div>
          <div style={{
            fontSize: 28, fontWeight: 800, color: "#f1f5f9",
            letterSpacing: "-0.6px", lineHeight: 1.2, marginBottom: 12,
          }}>
            Come trattiamo i tuoi dati<br />e i tuoi limiti di responsabilità
          </div>
          <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, maxWidth: 600 }}>
            Sappiamo che come professionista della sicurezza sei abituato a rispondere personalmente
            delle tue scelte. Questi temi li prendiamo sul serio quanto te.
          </div>
        </div>

        {/* Sezioni */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sezioni.map((s, i) => (
            <div key={i} style={{
              background: "#161b27",
              border: `1px solid ${s.colore}25`,
              borderRadius: 14,
              overflow: "hidden",
            }}>
              {/* Header sezione */}
              <div style={{
                padding: "18px 24px",
                borderBottom: `1px solid ${s.colore}15`,
                display: "flex", alignItems: "center", gap: 12,
                background: `${s.colore}08`,
              }}>
                <span style={{ fontSize: 22 }}>{s.icona}</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{s.titolo}</div>
              </div>

              {/* Contenuto */}
              <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                {s.contenuto.map((testo, j) => (
                  <div key={j} style={{
                    display: "flex", gap: 12, alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: s.colore, flexShrink: 0, marginTop: 7,
                    }} />
                    <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{testo}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Box DPA */}
        <div style={{
          marginTop: 16, padding: "20px 24px",
          background: "#161b27", border: "1px solid #3b82f630",
          borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
              📄 Data Processing Agreement (DPA)
            </div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
              Il contratto formale che regolamenta come SafetyAI tratta i dati per tuo conto, ai sensi dell'art. 28 GDPR.
            </div>
          </div>
          <button
            onClick={() => setMostraDPA(true)}
            style={{
              padding: "9px 16px", flexShrink: 0,
              background: "#3b82f620", border: "1px solid #3b82f640",
              borderRadius: 8, color: "#60a5fa",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", whiteSpace: "nowrap",
            }}>
            Leggi il DPA →
          </button>
        </div>

        {/* Box contatti */}
        <div style={{
          marginTop: 32, padding: "20px 24px",
          background: "#161b27", border: "1px solid #1e2535",
          borderRadius: 12,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>✉️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
              Hai domande su privacy o conformità GDPR?
            </div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
              Per richieste DPA, informative privacy personalizzate o qualsiasi chiarimento
              sul trattamento dei dati, contattaci prima di utilizzare SafetyAI in ambito professionale.
            </div>
          </div>
        </div>

        {/* Nota versione */}
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#334155" }}>
          SafetyAI · Informativa aggiornata a maggio 2026 · Reg. UE 2016/679 (GDPR) · D.Lgs 81/08
        </div>
      </div>
    </div>
  );
}
