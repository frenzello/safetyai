import { useState } from "react";
import { tutteLeScadenze, statoScadenza, giorniAllaScadenza } from "./database";

const STATO_CFG = {
  ok:        { color: "#10b981", bg: "#10b98112", label: "Valido" },
  attenzione:{ color: "#f59e0b", bg: "#f59e0b12", label: "In scadenza" },
  critico:   { color: "#ef4444", bg: "#ef444412", label: "Imminente" },
  scaduto:   { color: "#ef4444", bg: "#ef444420", label: "SCADUTO" },
  nessuna:   { color: "#475569", bg: "#47556912", label: "Permanente" },
};

export default function ModuloScadenze({ azienda }) {
  const [filtro, setFiltro] = useState("tutti");
  const [cerca, setCerca] = useState("");
  const [vistaDettaglio, setVistaDettaglio] = useState(null); // lavoratoreNome

  if (!azienda) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "#334155", fontSize: 14 }}>
      Seleziona un'azienda dalla sidebar per vedere le scadenze
    </div>
  );

  const scadenze = tutteLeScadenze(azienda);

  const scadenzeFiltrate = scadenze.filter(s => {
    if (filtro === "urgenti" && !["scaduto","critico","attenzione"].includes(s.stato)) return false;
    if (filtro === "scaduti" && s.stato !== "scaduto") return false;
    if (filtro === "ok" && s.stato !== "ok") return false;
    if (cerca) {
      const q = cerca.toLowerCase();
      if (!s.lavoratoreNome.toLowerCase().includes(q) && !s.attestatoTipo.toLowerCase().includes(q) && !s.impresaNome.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Raggruppa per lavoratore
  const perLavoratore = scadenzeFiltrate.reduce((acc, s) => {
    const key = s.lavoratoreNome;
    if (!acc[key]) acc[key] = { ...s, attestati: [] };
    acc[key].attestati.push(s);
    return acc;
  }, {});

  const urgenti = scadenze.filter(s => ["scaduto","critico"].includes(s.stato));
  const inScadenza = scadenze.filter(s => s.stato === "attenzione");

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e2e8f0" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>Scadenze documentali</div>
        <div style={{ fontSize: 13, color: "#475569" }}>{azienda.nome} · {scadenze.length} attestati totali</div>
      </div>

      {/* Alert urgenti */}
      {urgenti.length > 0 && (
        <div style={{ padding: "14px 20px", marginBottom: 20, background: "#ef444412", border: "1px solid #ef444430", borderRadius: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🚨</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>
              {urgenti.filter(s => s.stato === "scaduto").length} scaduti · {urgenti.filter(s => s.stato === "critico").length} in scadenza imminente
            </div>
            <div style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.6 }}>
              {urgenti.slice(0, 3).map(s => `${s.lavoratoreNome} — ${s.attestatoTipo}`).join(" · ")}
              {urgenti.length > 3 && ` · e altri ${urgenti.length - 3}`}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Totali", value: scadenze.length, color: "#60a5fa" },
          { label: "Scaduti", value: scadenze.filter(s => s.stato === "scaduto").length, color: "#ef4444" },
          { label: "Entro 60gg", value: inScadenza.length + urgenti.filter(s => s.stato === "critico").length, color: "#f59e0b" },
          { label: "Validi", value: scadenze.filter(s => s.stato === "ok").length, color: "#10b981" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#161b27", border: `1px solid ${s.color}20`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtri e ricerca */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          placeholder="Cerca lavoratore, tipo attestato, impresa..."
          value={cerca} onChange={e => setCerca(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, color: "#cbd5e1", fontSize: 13, fontFamily: "inherit" }}
        />
        {["tutti","urgenti","scaduti","ok"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: "9px 14px", background: filtro === f ? "#1e3a5f" : "#161b27",
            border: `1px solid ${filtro === f ? "#3b82f6" : "#1e2535"}`,
            borderRadius: 8, color: filtro === f ? "#60a5fa" : "#64748b",
            fontSize: 12, fontWeight: filtro === f ? 700 : 400, cursor: "pointer", fontFamily: "inherit",
          }}>
            {f === "tutti" ? "Tutti" : f === "urgenti" ? "⚠ Urgenti" : f === "scaduti" ? "✗ Scaduti" : "✓ Validi"}
          </button>
        ))}
      </div>

      {/* Lista */}
      {Object.keys(perLavoratore).length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#334155", fontSize: 14 }}>
          {scadenze.length === 0
            ? "Nessun attestato ancora caricato — vai su \"Carica documenti\""
            : "Nessun risultato per i filtri selezionati"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(perLavoratore).map(([nome, dati]) => {
            const expanded = vistaDettaglio === nome;
            const statoWorst = dati.attestati.reduce((worst, a) => {
              const ord = { scaduto: 0, critico: 1, attenzione: 2, ok: 3, nessuna: 4 };
              return (ord[a.stato] ?? 4) < (ord[worst] ?? 4) ? a.stato : worst;
            }, "nessuna");
            const cfg = STATO_CFG[statoWorst] || STATO_CFG.nessuna;

            return (
              <div key={nome} style={{ background: "#161b27", border: `1px solid ${["scaduto","critico"].includes(statoWorst) ? cfg.color + "40" : "#1e2535"}`, borderRadius: 12, overflow: "hidden" }}>
                {/* Header lavoratore */}
                <div
                  onClick={() => setVistaDettaglio(expanded ? null : nome)}
                  style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", background: `${cfg.color}06` }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${cfg.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>
                    {nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{nome}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                      {dati.impresaNome} · {dati.attestati.length} attestati
                    </div>
                  </div>
                  <span style={{ padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>{cfg.label}</span>
                  <span style={{ color: "#334155", fontSize: 14 }}>{expanded ? "▾" : "▸"}</span>
                </div>

                {/* Dettaglio attestati */}
                {expanded && (
                  <div style={{ borderTop: "1px solid #1e2535" }}>
                    {dati.attestati
                      .sort((a, b) => {
                        const ord = { scaduto: 0, critico: 1, attenzione: 2, ok: 3, nessuna: 4 };
                        return (ord[a.stato] ?? 4) - (ord[b.stato] ?? 4);
                      })
                      .map((att, i) => {
                        const acfg = STATO_CFG[att.stato] || STATO_CFG.nessuna;
                        return (
                          <div key={i} style={{ padding: "11px 20px", borderBottom: i < dati.attestati.length - 1 ? "1px solid #1e253540" : "none", display: "flex", alignItems: "center", gap: 12, borderLeft: `3px solid ${acfg.color}` }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>{att.attestatoTipo}</div>
                              <div style={{ fontSize: 11, color: "#475569", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {att.appaltoTitolo && <span>📋 {att.appaltoTitolo}</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              {att.scadenza ? (
                                <>
                                  <span style={{ padding: "3px 8px", borderRadius: 20, background: acfg.bg, color: acfg.color, fontSize: 11, fontWeight: 700 }}>{att.scadenza}</span>
                                  {att.giorni !== null && (
                                    <div style={{ fontSize: 10, color: acfg.color, marginTop: 3, fontWeight: 600 }}>
                                      {att.giorni < 0 ? `scaduto ${Math.abs(att.giorni)}gg fa` : `${att.giorni} giorni`}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span style={{ fontSize: 11, color: "#334155" }}>Nessuna scadenza</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
