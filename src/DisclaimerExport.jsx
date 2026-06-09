export function DisclaimerExport({ onConferma, onAnnulla }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#000000cc", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#161b27",
        border: "1px solid #1e2535",
        borderRadius: 16, width: "100%", maxWidth: 520,
        overflow: "hidden",
        boxShadow: "0 24px 60px #00000080",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #1e2535",
          background: "#f59e0b08",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: "#f59e0b20",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>⚠️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>
              Prima di esportare
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
              Leggi e conferma per procedere
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {[
              {
                icona: "🤖",
                testo: "L'analisi prodotta dall'AI ha carattere indicativo. SafetyAI non certifica la conformità normativa dei documenti.",
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
                background: "#0f1117",
                borderRadius: 8,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.icona}</span>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{item.testo}</div>
              </div>
            ))}
          </div>

          <div style={{
            padding: "10px 14px", marginBottom: 20,
            background: "#3b82f610", border: "1px solid #3b82f625",
            borderRadius: 8, fontSize: 11, color: "#60a5fa", lineHeight: 1.6,
          }}>
            Cliccando "Ho capito, esporta" dichiari di aver compreso questi limiti
            e di assumerti la responsabilità professionale del documento generato.
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onAnnulla}
              style={{
                flex: 1, padding: "11px",
                background: "#1e2535", border: "1px solid #334155",
                borderRadius: 9, color: "#64748b",
                fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>
              Annulla
            </button>
            <button
              onClick={onConferma}
              style={{
                flex: 2, padding: "11px",
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                border: "none", borderRadius: 9,
                color: "white", fontSize: 13, fontWeight: 800,
                cursor: "pointer", fontFamily: "inherit",
              }}>
              Ho capito, esporta 📊
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
