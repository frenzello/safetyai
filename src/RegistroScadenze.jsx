import { useState, useEffect } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// Simula quello che arriva dall'API Claude dopo l'estrazione documenti
const OGGI = new Date("2026-04-19");

function parseData(str) {
  if (!str) return null;
  const [g, m, a] = str.split("/");
  return new Date(`${a}-${m}-${g}`);
}

function giorniAllaScadenza(dataStr) {
  const d = parseData(dataStr);
  if (!d) return null;
  return Math.ceil((d - OGGI) / (1000 * 60 * 60 * 24));
}

function statoScadenza(dataStr) {
  const giorni = giorniAllaScadenza(dataStr);
  if (giorni === null) return "nessuna_scadenza";
  if (giorni < 0) return "scaduto";
  if (giorni <= 15) return "critico";
  if (giorni <= 30) return "attenzione";
  return "ok";
}

const LAVORATORI = [
  {
    id: 1,
    nome: "Marco Rossi",
    cf: "RSSMRC75A01L781K",
    appaltatore: "Edil Rossi S.r.l.",
    mansione: "Caposquadra",
    documenti: [
      { tipo: "Formazione generale lavoratori D.Lgs 81/08 art.37", scadenza: "15/08/2028", rilascio: "15/08/2022", ore: 8, ente: "Ente Bilaterale Edilizia VR", normativa: "D.Lgs 81/08 art.37" },
      { tipo: "Formazione specifica — Rischio chimico", scadenza: "01/05/2026", rilascio: "01/05/2022", ore: 12, ente: "Confindustria Verona", normativa: "D.Lgs 81/08 art.37" },
      { tipo: "Primo soccorso gruppo B", scadenza: "10/03/2026", rilascio: "10/03/2023", ore: 12, ente: "Croce Rossa Italiana", normativa: "D.M. 388/2003" },
      { tipo: "Antincendio rischio medio", scadenza: "20/11/2029", rilascio: "20/11/2023", ore: 8, ente: "Vigili del Fuoco Verona", normativa: "D.M. 02/09/2021" },
      { tipo: "Lavori in quota e utilizzo DPI 3a categoria", scadenza: "05/05/2026", rilascio: "05/05/2023", ore: 8, ente: "CEFAS Verona", normativa: "D.Lgs 81/08 art.77" },
      { tipo: "Idoneità sanitaria — mansione caposquadra", scadenza: "01/12/2026", rilascio: "01/12/2025", ore: null, ente: "Dr. Bianchi - Medico Competente", normativa: "D.Lgs 81/08 art.41" },
    ],
  },
  {
    id: 2,
    nome: "Luigi Bianchi",
    cf: "BNCLGU82B20F205Z",
    appaltatore: "Edil Rossi S.r.l.",
    mansione: "Operaio specializzato",
    documenti: [
      { tipo: "Formazione generale lavoratori D.Lgs 81/08 art.37", scadenza: "10/01/2027", rilascio: "10/01/2022", ore: 8, ente: "Ente Bilaterale Edilizia VR", normativa: "D.Lgs 81/08 art.37" },
      { tipo: "Formazione specifica — Movimentazione manuale carichi", scadenza: "15/09/2026", rilascio: "15/09/2021", ore: 8, ente: "CEFAS Verona", normativa: "D.Lgs 81/08 Titolo VI" },
      { tipo: "Primo soccorso gruppo B", scadenza: "20/06/2026", rilascio: "20/06/2023", ore: 12, ente: "Croce Rossa Italiana", normativa: "D.M. 388/2003" },
      { tipo: "Idoneità sanitaria — operaio edile", scadenza: "15/05/2026", rilascio: "15/05/2025", ore: null, ente: "Dr. Bianchi - Medico Competente", normativa: "D.Lgs 81/08 art.41" },
    ],
  },
  {
    id: 3,
    nome: "Giuseppe Testa",
    cf: "TSTGPP68D15A794R",
    appaltatore: "GT Impianti S.r.l.",
    mansione: "Elettricista qualificato",
    documenti: [
      { tipo: "Formazione generale lavoratori D.Lgs 81/08 art.37", scadenza: "01/03/2027", rilascio: "01/03/2022", ore: 8, ente: "Assoelettrici", normativa: "D.Lgs 81/08 art.37" },
      { tipo: "Formazione specifica — Rischio elettrico CEI 11-27", scadenza: "01/03/2027", rilascio: "01/03/2023", ore: 16, ente: "CEI — Comitato Elettrotecnico Italiano", normativa: "CEI 11-27" },
      { tipo: "Antincendio rischio basso", scadenza: "15/01/2028", rilascio: "15/01/2023", ore: 4, ente: "Vigili del Fuoco Verona", normativa: "D.M. 02/09/2021" },
      { tipo: "Idoneità sanitaria — elettricista", scadenza: "01/06/2027", rilascio: "01/06/2025", ore: null, ente: "Dr. Verdi - Medico Competente", normativa: "D.Lgs 81/08 art.41" },
      { tipo: "Patente a crediti", scadenza: "01/01/2028", rilascio: "01/10/2024", ore: null, ente: "INL — Ispettorato Nazionale del Lavoro", normativa: "D.L. 159/2024" },
    ],
  },
  {
    id: 4,
    nome: "Anna Ferrari",
    cf: "FRRNNA80F45G224Y",
    appaltatore: "Clean Service S.r.l.",
    mansione: "Addetta pulizie industriali",
    documenti: [
      { tipo: "Formazione generale lavoratori D.Lgs 81/08 art.37", scadenza: "10/06/2026", rilascio: "10/06/2021", ore: 8, ente: "ASCOM Verona", normativa: "D.Lgs 81/08 art.37" },
      { tipo: "Formazione specifica — Uso prodotti chimici", scadenza: "20/06/2026", rilascio: "20/06/2023", ore: 8, ente: "ASCOM Verona", normativa: "D.Lgs 81/08 art.37" },
      { tipo: "Antincendio rischio basso", scadenza: "20/04/2026", rilascio: "20/04/2023", ore: 4, ente: "Vigili del Fuoco Verona", normativa: "D.M. 02/09/2021" },
      { tipo: "Idoneità sanitaria — addetta pulizie", scadenza: "01/11/2026", rilascio: "01/11/2025", ore: null, ente: "Dr. Neri - Medico Competente", normativa: "D.Lgs 81/08 art.41" },
    ],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const STATO_CFG = {
  ok:              { color: "#10b981", bg: "#10b98112", label: "Valido", icon: "✓" },
  attenzione:      { color: "#f59e0b", bg: "#f59e0b12", label: "In scadenza", icon: "⚠" },
  critico:         { color: "#ef4444", bg: "#ef444412", label: "Scadenza imminente", icon: "✗" },
  scaduto:         { color: "#ef4444", bg: "#ef444420", label: "SCADUTO", icon: "✗" },
  nessuna_scadenza:{ color: "#64748b", bg: "#64748b12", label: "Nessuna scadenza", icon: "○" },
};

function statoComplessivoLavoratore(lavoratore) {
  const stati = lavoratore.documenti.map(d => statoScadenza(d.scadenza));
  if (stati.includes("scaduto")) return "scaduto";
  if (stati.includes("critico")) return "critico";
  if (stati.includes("attenzione")) return "attenzione";
  return "ok";
}

function accessoConsentito(lavoratore) {
  return !lavoratore.documenti.some(d => statoScadenza(d.scadenza) === "scaduto");
}

// ─── COMPONENTI ──────────────────────────────────────────────────────────────
function ScadenzaBadge({ dataStr, compact = false }) {
  const stato = statoScadenza(dataStr);
  const giorni = giorniAllaScadenza(dataStr);
  const cfg = STATO_CFG[stato];

  if (!dataStr) return <span style={{ fontSize: 11, color: "#334155" }}>—</span>;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: compact ? "2px 7px" : "4px 10px",
      borderRadius: 20, background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700,
    }}>
      <span style={{ fontSize: 9 }}>{cfg.icon}</span>
      {stato === "scaduto"
        ? `Scaduto ${Math.abs(giorni)}gg fa`
        : stato === "nessuna_scadenza"
        ? "Permanente"
        : `${dataStr}${!compact && giorni !== null ? ` (${giorni}gg)` : ""}`}
    </span>
  );
}

function AccessoBadge({ consentito }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 14px", borderRadius: 8,
      background: consentito ? "#10b98115" : "#ef444415",
      border: `1px solid ${consentito ? "#10b98130" : "#ef444430"}`,
      color: consentito ? "#10b981" : "#ef4444",
      fontSize: 12, fontWeight: 800,
    }}>
      <span style={{ fontSize: 16 }}>{consentito ? "✓" : "✗"}</span>
      {consentito ? "ACCESSO CONSENTITO" : "ACCESSO BLOCCATO"}
    </div>
  );
}

// ─── VISTA DETTAGLIO LAVORATORE ───────────────────────────────────────────────
function DettaglioLavoratore({ lavoratore, onBack }) {
  const accesso = accessoConsentito(lavoratore);
  const statoGen = statoComplessivoLavoratore(lavoratore);
  const cfgGen = STATO_CFG[statoGen];
  const scadutiOCritici = lavoratore.documenti.filter(d => ["scaduto", "critico"].includes(statoScadenza(d.scadenza)));

  return (
    <div>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: "#3b82f6",
        fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 20,
        display: "flex", alignItems: "center", gap: 6,
      }}>← Torna al registro</button>

      {/* Header lavoratore */}
      <div style={{
        background: "#161b27",
        border: `1px solid ${cfgGen.color}30`,
        borderRadius: 14, overflow: "hidden", marginBottom: 20,
      }}>
        <div style={{
          padding: "24px 28px",
          background: `linear-gradient(135deg, ${cfgGen.color}10, transparent)`,
          borderBottom: "1px solid #1e2535",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
              background: `${cfgGen.color}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, color: cfgGen.color,
            }}>
              {lavoratore.nome.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.4px" }}>
                {lavoratore.nome}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                {lavoratore.mansione} · {lavoratore.appaltatore}
              </div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 2, fontFamily: "monospace" }}>
                CF: {lavoratore.cf}
              </div>
            </div>
          </div>
          <AccessoBadge consentito={accesso} />
        </div>

        {/* Alert documenti critici */}
        {scadutiOCritici.length > 0 && (
          <div style={{
            padding: "14px 28px",
            background: "#ef444410",
            borderBottom: "1px solid #ef444420",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>
              ⚠ {scadutiOCritici.length} documento/i richiedono attenzione immediata
            </div>
            {scadutiOCritici.map((doc, i) => {
              const giorni = giorniAllaScadenza(doc.scadenza);
              const stato = statoScadenza(doc.scadenza);
              return (
                <div key={i} style={{ fontSize: 12, color: "#fca5a5", marginTop: 4, display: "flex", gap: 8 }}>
                  <span>✗</span>
                  <span>
                    <strong>{doc.tipo}</strong> —{" "}
                    {stato === "scaduto"
                      ? `scaduto ${Math.abs(giorni)} giorni fa`
                      : `scade tra ${giorni} giorni`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid #1e2535" }}>
          {[
            { label: "Totale doc.", value: lavoratore.documenti.length, color: "#94a3b8" },
            { label: "Validi", value: lavoratore.documenti.filter(d => statoScadenza(d.scadenza) === "ok").length, color: "#10b981" },
            { label: "In scadenza", value: lavoratore.documenti.filter(d => ["attenzione","critico"].includes(statoScadenza(d.scadenza))).length, color: "#f59e0b" },
            { label: "Scaduti", value: lavoratore.documenti.filter(d => statoScadenza(d.scadenza) === "scaduto").length, color: "#ef4444" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "14px", textAlign: "center",
              borderRight: i < 3 ? "1px solid #1e2535" : "none",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Documenti */}
      <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 12 }}>
        WALLET DOCUMENTALE
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lavoratore.documenti
          .sort((a, b) => {
            const ord = { scaduto: 0, critico: 1, attenzione: 2, ok: 3, nessuna_scadenza: 4 };
            return ord[statoScadenza(a.scadenza)] - ord[statoScadenza(b.scadenza)];
          })
          .map((doc, i) => {
            const stato = statoScadenza(doc.scadenza);
            const cfg = STATO_CFG[stato];
            const giorni = giorniAllaScadenza(doc.scadenza);

            return (
              <div key={i} style={{
                background: "#161b27",
                border: `1px solid ${["scaduto","critico"].includes(stato) ? cfg.color + "40" : "#1e2535"}`,
                borderRadius: 11, padding: "16px 20px",
                borderLeft: `3px solid ${cfg.color}`,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
                      {doc.tipo}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {doc.rilascio && (
                        <span style={{ fontSize: 11, color: "#475569" }}>
                          Rilascio: <strong style={{ color: "#64748b" }}>{doc.rilascio}</strong>
                        </span>
                      )}
                      {doc.ore && (
                        <span style={{ fontSize: 11, color: "#475569" }}>
                          🕐 <strong style={{ color: "#64748b" }}>{doc.ore}h</strong>
                        </span>
                      )}
                      {doc.normativa && (
                        <span style={{
                          fontSize: 10, padding: "2px 7px",
                          background: "#a78bfa15", color: "#a78bfa",
                          borderRadius: 4, fontWeight: 600,
                        }}>{doc.normativa}</span>
                      )}
                    </div>
                    {doc.ente && (
                      <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>
                        📋 {doc.ente}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <ScadenzaBadge dataStr={doc.scadenza} />
                    {giorni !== null && stato !== "scaduto" && (
                      <div style={{
                        fontSize: 10, color: cfg.color,
                        marginTop: 4, fontWeight: 600,
                      }}>
                        {stato === "nessuna_scadenza" ? "" : `${giorni} giorni`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar giorni rimanenti */}
                {doc.scadenza && doc.rilascio && stato !== "scaduto" && (
                  <div style={{ marginTop: 12 }}>
                    {(() => {
                      const totale = Math.ceil((parseData(doc.scadenza) - parseData(doc.rilascio)) / (1000 * 60 * 60 * 24));
                      const rimanenti = Math.max(0, giorni);
                      const pct = Math.round((rimanenti / totale) * 100);
                      return (
                        <>
                          <div style={{ height: 4, background: "#1e2535", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: pct > 50 ? "#10b981" : pct > 20 ? "#f59e0b" : "#ef4444",
                              borderRadius: 2, transition: "width 0.3s",
                            }} />
                          </div>
                          <div style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>
                            {pct}% di validità rimanente
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function RegistroScadenze() {
  const [selectedLav, setSelectedLav] = useState(null);
  const [vista, setVista] = useState("scadenze"); // scadenze | lavoratori | accessi
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStato, setFilterStato] = useState("tutti");
  const [simulaAccesso, setSimulaAccesso] = useState(null);
  const [showQR, setShowQR] = useState(null);

  // Calcola tutte le scadenze imminenti (tutti i documenti di tutti i lavoratori)
  const tutteLeScadenze = LAVORATORI.flatMap(lav =>
    lav.documenti
      .filter(d => d.scadenza)
      .map(d => ({
        lavoratore: lav,
        documento: d,
        stato: statoScadenza(d.scadenza),
        giorni: giorniAllaScadenza(d.scadenza),
      }))
  ).sort((a, b) => (a.giorni ?? 9999) - (b.giorni ?? 9999));

  const scadenzeUrgenti = tutteLeScadenze.filter(s => ["scaduto","critico","attenzione"].includes(s.stato));

  const lavFiltrati = LAVORATORI.filter(l => {
    const q = searchQuery.toLowerCase();
    if (q && !l.nome.toLowerCase().includes(q) && !l.appaltatore.toLowerCase().includes(q)) return false;
    if (filterStato !== "tutti") {
      const s = statoComplessivoLavoratore(l);
      if (filterStato === "bloccati" && accessoConsentito(l)) return false;
      if (filterStato !== "bloccati" && s !== filterStato) return false;
    }
    return true;
  });

  if (selectedLav) {
    return (
      <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", minHeight: "100vh", padding: 32, color: "#e2e8f0" }}>
        <DettaglioLavoratore lavoratore={selectedLav} onBack={() => setSelectedLav(null)} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", minHeight: "100vh", padding: 32, color: "#e2e8f0" }}>

      {/* Simulazione accesso QR */}
      {simulaAccesso && (
        <div style={{
          position: "fixed", inset: 0, background: "#000000c0", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: 20, width: 360, overflow: "hidden",
            boxShadow: "0 30px 80px #00000080",
          }}>
            {(() => {
              const lav = LAVORATORI.find(l => l.id === simulaAccesso);
              const ok = accessoConsentito(lav);
              const statoG = statoComplessivoLavoratore(lav);
              const cfgG = STATO_CFG[statoG];
              return (
                <>
                  <div style={{
                    padding: "32px 28px",
                    background: ok ? "linear-gradient(135deg, #10b98120, transparent)" : "linear-gradient(135deg, #ef444420, transparent)",
                    textAlign: "center", borderBottom: "1px solid #1e2535",
                  }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px",
                      background: ok ? "#10b98120" : "#ef444420",
                      border: `3px solid ${ok ? "#10b981" : "#ef4444"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 36,
                    }}>
                      {ok ? "✓" : "✗"}
                    </div>
                    <div style={{
                      fontSize: 20, fontWeight: 800,
                      color: ok ? "#10b981" : "#ef4444",
                      letterSpacing: "-0.3px", marginBottom: 4,
                    }}>
                      {ok ? "ACCESSO CONSENTITO" : "ACCESSO BLOCCATO"}
                    </div>
                    <div style={{ fontSize: 14, color: "#f1f5f9", fontWeight: 600, marginBottom: 4 }}>{lav.nome}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{lav.mansione} · {lav.appaltatore}</div>
                  </div>

                  {!ok && (
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid #1e2535" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>Motivo blocco:</div>
                      {lav.documenti.filter(d => statoScadenza(d.scadenza) === "scaduto").map((doc, i) => (
                        <div key={i} style={{ fontSize: 12, color: "#fca5a5", marginBottom: 4 }}>
                          ✗ {doc.tipo} — scaduto
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ padding: "16px 24px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#334155", marginBottom: 16 }}>
                      Verifica: {new Date().toLocaleTimeString("it-IT")} · SafetyAI
                    </div>
                    <button
                      onClick={() => setSimulaAccesso(null)}
                      style={{
                        width: "100%", padding: "12px",
                        background: "#1e2535", border: "none",
                        borderRadius: 9, color: "#94a3b8",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}>Chiudi</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px", marginBottom: 4 }}>
          Registro scadenze e accessi
        </div>
        <div style={{ fontSize: 13, color: "#475569" }}>
          Oggi: {OGGI.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* Alert banner scaduti */}
      {scadenzeUrgenti.filter(s => s.stato === "scaduto").length > 0 && (
        <div style={{
          padding: "14px 20px", marginBottom: 20,
          background: "#ef444412", border: "1px solid #ef444430",
          borderRadius: 10, display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🚨</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>
              {scadenzeUrgenti.filter(s => s.stato === "scaduto").length} documento/i scaduti — accesso bloccato automaticamente
            </div>
            <div style={{ fontSize: 12, color: "#fca5a5" }}>
              {scadenzeUrgenti.filter(s => s.stato === "scaduto").map(s =>
                `${s.lavoratore.nome} (${s.documento.tipo})`
              ).join(" · ")}
            </div>
          </div>
        </div>
      )}

      {/* Stats top */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Lavoratori registrati", value: LAVORATORI.length, color: "#60a5fa", icon: "👷" },
          { label: "Accessi consentiti", value: LAVORATORI.filter(accessoConsentito).length, color: "#10b981", icon: "✓" },
          { label: "Accessi bloccati", value: LAVORATORI.filter(l => !accessoConsentito(l)).length, color: "#ef4444", icon: "✗" },
          { label: "Scadenze entro 30gg", value: scadenzeUrgenti.filter(s => s.stato !== "scaduto").length, color: "#f59e0b", icon: "⚠" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "#161b27", border: `1px solid ${s.color}20`,
            borderRadius: 12, padding: "16px 20px",
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-1px" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#161b27", padding: 4, borderRadius: 10, border: "1px solid #1e2535", width: "fit-content" }}>
        {[
          { id: "scadenze", label: "⏱ Scadenze" },
          { id: "lavoratori", label: "👷 Lavoratori" },
          { id: "accessi", label: "🚪 Simula accesso" },
        ].map(t => (
          <button key={t.id} onClick={() => setVista(t.id)} style={{
            padding: "8px 18px", border: "none", borderRadius: 7, cursor: "pointer",
            background: vista === t.id ? "#0f1117" : "transparent",
            color: vista === t.id ? "#f1f5f9" : "#475569",
            fontSize: 13, fontWeight: vista === t.id ? 700 : 400,
            boxShadow: vista === t.id ? "0 1px 4px #00000040" : "none",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── VISTA SCADENZE ── */}
      {vista === "scadenze" && (
        <div>
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 14 }}>
            PROSSIME SCADENZE — {tutteLeScadenze.filter(s => s.stato !== "ok" && s.stato !== "nessuna_scadenza").length} da gestire
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tutteLeScadenze
              .filter(s => s.stato !== "nessuna_scadenza")
              .slice(0, 20)
              .map((s, i) => {
                const cfg = STATO_CFG[s.stato];
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedLav(s.lavoratore)}
                    style={{
                      background: "#161b27",
                      border: `1px solid ${["scaduto","critico"].includes(s.stato) ? cfg.color + "30" : "#1e2535"}`,
                      borderRadius: 10, padding: "13px 18px",
                      display: "flex", alignItems: "center", gap: 14,
                      cursor: "pointer",
                      borderLeft: `3px solid ${cfg.color}`,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: `${cfg.color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800, color: cfg.color,
                    }}>
                      {s.lavoratore.nome.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{s.documento.tipo}</div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                        {s.lavoratore.nome} · {s.lavoratore.appaltatore}
                      </div>
                    </div>
                    <ScadenzaBadge dataStr={s.documento.scadenza} />
                    <span style={{ color: "#334155" }}>›</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── VISTA LAVORATORI ── */}
      {vista === "lavoratori" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <input
              placeholder="Cerca lavoratore o appaltatore..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1, padding: "10px 14px",
                background: "#161b27", border: "1px solid #1e2535",
                borderRadius: 8, color: "#cbd5e1", fontSize: 13,
              }}
            />
            {["tutti", "ok", "attenzione", "bloccati"].map(f => (
              <button key={f} onClick={() => setFilterStato(f)} style={{
                padding: "9px 14px", border: `1px solid ${filterStato === f ? "#3b82f6" : "#1e2535"}`,
                background: filterStato === f ? "#1e3a5f" : "#161b27",
                borderRadius: 8, color: filterStato === f ? "#60a5fa" : "#64748b",
                fontSize: 12, fontWeight: filterStato === f ? 700 : 400, cursor: "pointer",
              }}>
                {f === "tutti" ? "Tutti" : f === "ok" ? "✓ OK" : f === "attenzione" ? "⚠ Attenzione" : "✗ Bloccati"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lavFiltrati.map(lav => {
              const accesso = accessoConsentito(lav);
              const statoG = statoComplessivoLavoratore(lav);
              const cfgG = STATO_CFG[statoG];
              const docInScadenza = lav.documenti.filter(d => ["attenzione","critico","scaduto"].includes(statoScadenza(d.scadenza)));

              return (
                <div
                  key={lav.id}
                  onClick={() => setSelectedLav(lav)}
                  style={{
                    background: "#161b27",
                    border: `1px solid ${!accesso ? "#ef444430" : "#1e2535"}`,
                    borderRadius: 12, overflow: "hidden", cursor: "pointer",
                  }}
                >
                  <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: `${cfgG.color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 800, color: cfgG.color,
                    }}>
                      {lav.nome.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{lav.nome}</div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                        {lav.mansione} · {lav.appaltatore}
                      </div>
                    </div>

                    {/* Dots scadenze */}
                    <div style={{ display: "flex", gap: 4 }}>
                      {lav.documenti.map((doc, i) => {
                        const s = statoScadenza(doc.scadenza);
                        const c = STATO_CFG[s].color;
                        return (
                          <div key={i} style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: c, boxShadow: `0 0 4px ${c}`,
                          }} title={`${doc.tipo}: ${doc.scadenza}`} />
                        );
                      })}
                    </div>

                    <AccessoBadge consentito={accesso} />
                    <span style={{ color: "#334155", fontSize: 16 }}>›</span>
                  </div>

                  {docInScadenza.length > 0 && (
                    <div style={{
                      padding: "8px 20px",
                      background: accesso ? "#f59e0b08" : "#ef444408",
                      borderTop: `1px solid ${accesso ? "#f59e0b20" : "#ef444420"}`,
                      fontSize: 11,
                      color: accesso ? "#f59e0b" : "#ef4444",
                    }}>
                      {docInScadenza.map(d => {
                        const g = giorniAllaScadenza(d.scadenza);
                        return `${d.tipo.split("—")[0].trim()}: ${g < 0 ? "SCADUTO" : `${g}gg`}`;
                      }).join(" · ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VISTA SIMULA ACCESSO ── */}
      {vista === "accessi" && (
        <div>
          <div style={{
            padding: "16px 20px", marginBottom: 20,
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: 10, fontSize: 13, color: "#64748b",
          }}>
            Simula la scansione del QR code di un lavoratore alla portineria. Il sistema verifica in tempo reale tutti i documenti e autorizza o blocca l'accesso.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {LAVORATORI.map(lav => {
              const ok = accessoConsentito(lav);
              return (
                <div
                  key={lav.id}
                  style={{
                    background: "#161b27",
                    border: `1px solid ${ok ? "#1e2535" : "#ef444330"}`,
                    borderRadius: 12, padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: 14,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: ok ? "#10b98115" : "#ef444415",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800,
                    color: ok ? "#10b981" : "#ef4444",
                  }}>
                    {lav.nome.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{lav.nome}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{lav.appaltatore}</div>
                  </div>
                  <AccessoBadge consentito={ok} />
                  <button
                    onClick={() => setSimulaAccesso(lav.id)}
                    style={{
                      padding: "9px 16px",
                      background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                      border: "none", borderRadius: 8,
                      color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}>
                    📱 Scansiona QR
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
