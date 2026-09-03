export function DisclaimerExport({ onConferma, onAnnulla }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#1A140Dcc", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#FBF8F1",
        border: "4px solid #1A140D",
        borderRadius: 3, width: "100%", maxWidth: 520,
        overflow: "hidden",
        boxShadow: "8px 8px 0 #1A140D",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "3px solid #1A140D",
          background: "#EFDFC5",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 3, border: "2px solid #1A140D", flexShrink: 0,
            background: "#C4872E",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>⚠️</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Zilla Slab',serif", textTransform: "uppercase", letterSpacing: "0.01em", color: "#241D14" }}>
              Prima di esportare
            </div>
            <div style={{ fontSize: 11, color: "#5C5545", marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>
              Leggi e conferma per procedere
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ padding: "20px 24px", position: "relative" }}>
          <svg aria-hidden="true" viewBox="0 0 140 190" style={{ position: "absolute", right: -8, bottom: -16, width: 90, height: "auto", opacity: 0.08, pointerEvents: "none" }}>
            <path d="M70 8 C 90 20, 82 32, 96 38 C 112 44, 98 56, 114 64 C 130 72, 112 84, 128 94 C 140 102, 118 114, 130 124 C 138 132, 122 142, 104 144 L 100 178 L 40 178 L 36 144 C 18 142, 2 132, 10 124 C 22 114, 0 102, 12 94 C 28 84, 10 72, 26 64 C 42 56, 28 44, 44 38 C 58 32, 50 20, 70 8 Z" fill="#1E5D39" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, position: "relative" }}>
            {[
              {
                icona: "🤖",
                testo: "L'analisi prodotta dall'AI ha carattere indicativo. rspPINO non certifica la conformità normativa dei documenti.",
              },
              {
                icona: "👤",
                testo: "Le decisioni di approvazione o rifiuto sono state prese da te e rimangono sotto la tua esclusiva responsabilità professionale.",
              },
              {
                icona: "📁",
                testo: "Il file Excel generato è uno strumento organizzativo. Non sostituisce la conservazione degli originali né ha valore legale autonomo.",
              },
              {
                icona: "🔒",
                testo: "Gestisci il file esportato con la stessa cura riservata ai documenti originali — contiene dati personali dei lavoratori.",
              },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                padding: "10px 12px",
                background: "#EFE9DD",
                border: "1px solid #1A140D30",
                borderRadius: 2,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.icona}</span>
                <div style={{ fontSize: 12, color: "#5C5545", lineHeight: 1.6 }}>{item.testo}</div>
              </div>
            ))}
          </div>

          <div style={{
            padding: "10px 14px", marginBottom: 20,
            background: "#E8EDE5", border: "2px solid #1E5D39",
            borderRadius: 2, fontSize: 11, color: "#1E5D39", lineHeight: 1.6,
          }}>
            Cliccando "Ho capito, esporta" dichiari di aver compreso questi limiti
            e di assumerti la responsabilità professionale del documento generato.
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onAnnulla}
              style={{
                flex: 1, padding: "11px",
                background: "#FBF8F1", border: "2px solid #1A140D",
                borderRadius: 2, color: "#5C5545",
                fontSize: 12, fontWeight: 700, fontFamily: "'Zilla Slab',serif", textTransform: "uppercase", cursor: "pointer",
              }}>
              Annulla
            </button>
            <button
              onClick={onConferma}
              style={{
                flex: 2, padding: "11px",
                background: "#1E5D39",
                border: "2px solid #1A140D", boxShadow: "3px 3px 0 #1A140D",
                borderRadius: 2,
                color: "#F2EEE0", fontSize: 13, fontWeight: 700, fontFamily: "'Zilla Slab',serif", textTransform: "uppercase",
                cursor: "pointer",
              }}>
              Ho capito, esporta 📊
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
