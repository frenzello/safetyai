import { useState } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const POS_LIST = [
  {
    id: "POS-2026-047", duvriId: "DVR-2026-047",
    appaltatore: "Edil Rossi S.r.l.", referente: "Marco Rossi",
    lavori: "Sostituzione cuscinetti macchina IS linea 3",
    area: "Formatura", dataInizio: "28/04/2026", durata: 2,
    stato: "in_attesa", // committente aspetta POS da appaltatore
    inviato: "19/04/2026 09:15", compilato: null,
    lavoratori: ["Marco Rossi", "Luigi Bianchi"],
  },
  {
    id: "POS-2026-046", duvriId: "DVR-2026-046",
    appaltatore: "GT Impianti S.r.l.", referente: "Giuseppe Testa",
    lavori: "Manutenzione quadri elettrici",
    area: "Forno / Fusione", dataInizio: "15/04/2026", durata: 1,
    stato: "approvato",
    inviato: "10/04/2026 08:00", compilato: "12/04/2026 14:30",
    lavoratori: ["Giuseppe Testa", "Antonio Verdi", "Sergio Mancini"],
  },
  {
    id: "POS-2026-045", duvriId: "DVR-2026-045",
    appaltatore: "Clean Service S.r.l.", referente: "Anna Ferrari",
    lavori: "Pulizie industriali reparto magazzino",
    area: "Pallettizzazione / Magazzino", dataInizio: "10/04/2026", durata: 1,
    stato: "da_approvare",
    inviato: "05/04/2026 08:00", compilato: "08/04/2026 11:45",
    lavoratori: ["Anna Ferrari"],
  },
];

const STATO_POS = {
  in_attesa:   { color: "#64748b", bg: "#64748b15", label: "In attesa compilazione", icon: "⏳" },
  compilato:   { color: "#f59e0b", bg: "#f59e0b15", label: "Compilato — da approvare", icon: "📋" },
  da_approvare:{ color: "#a78bfa", bg: "#a78bfa15", label: "Da approvare", icon: "👁" },
  approvato:   { color: "#10b981", bg: "#10b98115", label: "Approvato", icon: "✓" },
  rifiutato:   { color: "#ef4444", bg: "#ef444415", label: "Rifiutato — revisione richiesta", icon: "✗" },
};

// Dati compilati dall'appaltatore per il POS da approvare
const POS_COMPILATO = {
  fasi: [
    {
      id: 1, titolo: "Preparazione e messa in sicurezza",
      descrizione: "Sopralluogo iniziale con preposto committente. Verifica stato macchina. Applicazione procedura LOTO: isolamento elettrico con lucchetto personale, isolamento pneumatico, cartellonistica.",
      attrezzature: ["Multimetro Fluke 117", "Kit LOTO con lucchetti", "Cartelli di pericolo"],
      rischi: ["Contatto con parti in tensione residua", "Avvio accidentale macchina"],
      misure: ["Verifica assenza tensione con multimetro prima di procedere", "Apposizione lucchetto personale su ogni punto di isolamento"],
      durata: "1 ora",
    },
    {
      id: 2, titolo: "Smontaggio gruppo formatura",
      descrizione: "Smontaggio del coperchio superiore della macchina IS. Estrazione dell'asse principale con ausilio di estrattore idraulico. Rimozione cuscinetti usurati.",
      attrezzature: ["Estrattore idraulico 10t", "Chiavi dinamometriche", "Carrello portautensili"],
      rischi: ["Schiacciamento da componenti pesanti", "Taglio da spigoli vivi", "Proiezione frammenti"],
      misure: ["Uso guanti anti-taglio EN 388 livello D", "Ausilio di secondo operatore per componenti > 25 kg", "Occhiali di sicurezza EN 166"],
      durata: "3 ore",
    },
    {
      id: 3, titolo: "Sostituzione cuscinetti",
      descrizione: "Pulizia alloggiamenti con solvente sgrassante. Montaggio nuovi cuscinetti SKF 6208-2RS con riscaldatore ad induzione. Lubrificazione con grasso Mobilux EP2.",
      attrezzature: ["Riscaldatore ad induzione SKF TIH 030M", "Termometro IR", "Pistola grasso"],
      rischi: ["Ustione da superfici calde (cuscinetti riscaldati a 110°C)", "Inalazione vapori solvente"],
      misure: ["Guanti termoresistenti durante il montaggio", "Ventilazione locale durante uso solventi", "DPI respiratori se necessario"],
      durata: "2 ore",
    },
    {
      id: 4, titolo: "Rimontaggio e collaudo",
      descrizione: "Rimontaggio gruppo formatura. Rimozione dispositivi LOTO in ordine inverso. Avvio controllato macchina a vuoto. Verifica funzionamento e assenza vibrazioni anomale.",
      attrezzature: ["Vibrometro portatile", "Chiavi dinamometriche"],
      rischi: ["Avvio macchina in condizioni anomale"],
      misure: ["Allontanamento di tutto il personale durante il collaudo", "Avvio graduale e monitorato"],
      durata: "1 ora",
    },
  ],
  dpi: [
    { tipo: "Casco di protezione", norma: "EN 397", obbligatorio: true },
    { tipo: "Occhiali di sicurezza", norma: "EN 166", obbligatorio: true },
    { tipo: "Guanti anti-taglio", norma: "EN 388 livello D", obbligatorio: true },
    { tipo: "Guanti termoresistenti", norma: "EN 407", obbligatorio: false },
    { tipo: "Scarpe antinfortunistiche S3", norma: "EN ISO 20345", obbligatorio: true },
    { tipo: "Otoprotettori", norma: "EN 352", obbligatorio: true },
    { tipo: "Indumenti alta visibilità", norma: "EN ISO 20471 cl.2", obbligatorio: true },
  ],
  emergenza: {
    assemblea: "Parcheggio nord — uscita B",
    pronto_soccorso: "Infermeria stabilimento — edificio A piano terra",
    numero_emergenza: "Interno 112 oppure 118",
    referente: "Marco Albertini (RSPP) — cell. 347 1234567",
  },
  note: "Il referente dell'appaltatore è disponibile a qualsiasi ora durante i lavori. In caso di imprevisti tecnici che richiedano modifiche al piano, verrà immediatamente contattato il RSPP committente.",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function StatoBadge({ stato }) {
  const cfg = STATO_POS[stato] || STATO_POS.in_attesa;
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span>{cfg.icon}</span>{cfg.label}
    </span>
  );
}

function FaseCard({ fase, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  return (
    <div style={{
      background: "#0f1117", border: "1px solid #1e2535",
      borderRadius: 10, overflow: "hidden",
    }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: "14px 18px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12,
          background: expanded ? "#1e2535" : "transparent",
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color: "white",
        }}>{fase.id}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{fase.titolo}</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Durata: {fase.durata}</div>
        </div>
        <span style={{ color: "#334155", fontSize: 14 }}>{expanded ? "▾" : "▸"}</span>
      </div>

      {expanded && (
        <div style={{ padding: "16px 18px", borderTop: "1px solid #1e2535" }}>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 16 }}>
            {fase.descrizione}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 8 }}>ATTREZZATURE</div>
              {fase.attrezzature.map((a, i) => (
                <div key={i} style={{ fontSize: 12, color: "#64748b", marginBottom: 4, display: "flex", gap: 6 }}>
                  <span style={{ color: "#3b82f6" }}>·</span>{a}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 8 }}>RISCHI SPECIFICI</div>
              {fase.rischi.map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: "#64748b", marginBottom: 4, display: "flex", gap: 6 }}>
                  <span style={{ color: "#ef4444" }}>⚠</span>{r}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, color: "#10b981", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 8 }}>MISURE ADOTTATE</div>
            {fase.misure.map((m, i) => (
              <div key={i} style={{ fontSize: 12, color: "#64748b", marginBottom: 4, display: "flex", gap: 6 }}>
                <span style={{ color: "#10b981" }}>✓</span>{m}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VISTA DETTAGLIO POS ─────────────────────────────────────────────────────
function DettaglioPOS({ pos, onBack, onApprova, onRifiuta }) {
  const cfg = STATO_POS[pos.stato];
  const isApprovabile = pos.stato === "da_approvare";
  const [notaRifiuto, setNotaRifiuto] = useState("");
  const [showRifiuto, setShowRifiuto] = useState(false);

  return (
    <div>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: "#3b82f6",
        fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 20,
      }}>← Torna alla lista</button>

      {/* Header */}
      <div style={{
        background: "#161b27", border: `1px solid ${cfg.color}30`,
        borderRadius: 14, overflow: "hidden", marginBottom: 20,
      }}>
        <div style={{
          padding: "24px 28px",
          background: `linear-gradient(135deg, ${cfg.color}10, transparent)`,
          borderBottom: "1px solid #1e2535",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 6 }}>
              PIANO OPERATIVO DI SICUREZZA · {pos.id}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.4px" }}>
              {pos.appaltatore}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
              {pos.lavori} · {pos.area}
            </div>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>
              DUVRI collegato: <span style={{ color: "#3b82f6" }}>{pos.duvriId}</span>
            </div>
          </div>
          <StatoBadge stato={pos.stato} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid #1e2535" }}>
          {[
            { label: "Data inizio", value: pos.dataInizio },
            { label: "Durata", value: `${pos.durata} giorni` },
            { label: "Lavoratori", value: pos.lavoratori.length },
            { label: "Compilato", value: pos.compilato || "—" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "14px 20px",
              borderRight: i < 3 ? "1px solid #1e2535" : "none",
            }}>
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {pos.stato === "in_attesa" ? (
        <div style={{
          padding: "40px", textAlign: "center",
          background: "#161b27", border: "1px dashed #1e2535",
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>⏳</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>
            In attesa della compilazione da parte dell'appaltatore
          </div>
          <div style={{ fontSize: 13, color: "#334155", marginBottom: 20 }}>
            Richiesta inviata a <strong style={{ color: "#94a3b8" }}>{pos.referente}</strong> il {pos.inviato}
          </div>
          <button style={{
            padding: "9px 18px", background: "#1e2535",
            border: "1px solid #334155", borderRadius: 8,
            color: "#64748b", fontSize: 12, cursor: "pointer",
          }}>✉ Invia sollecito</button>
        </div>
      ) : (
        <div>
          {/* Fasi lavorative */}
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 12 }}>
            FASI LAVORATIVE — {POS_COMPILATO.fasi.length}
          </div>
          <div style={{
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: 12, padding: 16, marginBottom: 16,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {POS_COMPILATO.fasi.map((fase, i) => (
                <FaseCard key={fase.id} fase={fase} index={i} />
              ))}
            </div>
          </div>

          {/* DPI */}
          <div style={{
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: 12, overflow: "hidden", marginBottom: 16,
          }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2535", fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>
              DPI previsti
            </div>
            <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 8 }}>
              {POS_COMPILATO.dpi.map((d, i) => (
                <div key={i} style={{
                  padding: "6px 12px",
                  background: d.obbligatorio ? "#3b82f615" : "#1e2535",
                  border: `1px solid ${d.obbligatorio ? "#3b82f630" : "#1e2535"}`,
                  borderRadius: 8, fontSize: 12,
                  color: d.obbligatorio ? "#60a5fa" : "#475569",
                }}>
                  {d.tipo}
                  <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.6 }}>{d.norma}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emergenza */}
          <div style={{
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: 12, padding: "16px 20px", marginBottom: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", marginBottom: 12 }}>Gestione emergenze</div>
            {[
              ["Punto di raccolta", POS_COMPILATO.emergenza.assemblea],
              ["Pronto soccorso", POS_COMPILATO.emergenza.pronto_soccorso],
              ["Numero emergenza", POS_COMPILATO.emergenza.numero_emergenza],
              ["Referente RSPP", POS_COMPILATO.emergenza.referente],
            ].map(([k, v], i) => (
              <div key={i} style={{
                display: "flex", gap: 12, padding: "6px 0",
                borderBottom: i < 3 ? "1px solid #1e253540" : "none",
                fontSize: 12,
              }}>
                <span style={{ color: "#475569", width: 120, flexShrink: 0 }}>{k}</span>
                <span style={{ color: "#94a3b8" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Azioni approvazione */}
          {isApprovabile && (
            <div>
              {showRifiuto ? (
                <div style={{
                  background: "#161b27", border: "1px solid #ef444330",
                  borderRadius: 12, padding: 20, marginBottom: 16,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 10 }}>
                    Motivo del rifiuto
                  </div>
                  <textarea
                    value={notaRifiuto}
                    onChange={e => setNotaRifiuto(e.target.value)}
                    placeholder="Descrivi le modifiche richieste all'appaltatore..."
                    rows={3}
                    style={{
                      width: "100%", padding: "10px 14px",
                      background: "#0f1117", border: "1px solid #ef444330",
                      borderRadius: 8, color: "#cbd5e1", fontSize: 13,
                      resize: "vertical", boxSizing: "border-box", marginBottom: 10,
                    }}
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowRifiuto(false)} style={{ flex: 1, padding: "10px", background: "#1e2535", border: "none", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" }}>Annulla</button>
                    <button onClick={() => onRifiuta(notaRifiuto)} style={{ flex: 2, padding: "10px", background: "#ef444420", border: "1px solid #ef444440", borderRadius: 8, color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✗ Invia richiesta revisione</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowRifiuto(true)} style={{
                    flex: 1, padding: "12px",
                    background: "#1e2535", border: "1px solid #334155",
                    borderRadius: 9, color: "#94a3b8", fontSize: 13, cursor: "pointer",
                  }}>✗ Richiedi revisione</button>
                  <button onClick={onApprova} style={{
                    flex: 2, padding: "12px",
                    background: "linear-gradient(135deg, #10b981, #06b6d4)",
                    border: "none", borderRadius: 9, color: "white",
                    fontSize: 13, fontWeight: 800, cursor: "pointer",
                  }}>✓ Approva POS</button>
                </div>
              )}
            </div>
          )}

          {pos.stato === "approvato" && (
            <div style={{
              padding: "14px 20px",
              background: "#10b98112", border: "1px solid #10b98130",
              borderRadius: 9, display: "flex", gap: 10, alignItems: "center",
            }}>
              <span style={{ fontSize: 20 }}>✓</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>POS approvato</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                  I lavori possono procedere. Documento archiviato.
                </div>
              </div>
              <button style={{
                marginLeft: "auto", padding: "7px 14px",
                background: "#1e2535", border: "none", borderRadius: 7,
                color: "#64748b", fontSize: 12, cursor: "pointer",
              }}>↓ PDF</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PORTALE COMPILAZIONE POS (vista appaltatore) ────────────────────────────
function PortaleCompilazionePOS({ onClose }) {
  const [stepPos, setStepPos] = useState(1);
  const [fasi, setFasi] = useState([
    { id: 1, titolo: "", descrizione: "", attrezzature: "", rischi: "", misure: "", durata: "" },
  ]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenera = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2500);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000b0", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#161b27", border: "1px solid #1e2535",
        borderRadius: 16, width: "100%", maxWidth: 640,
        maxHeight: "90vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 30px 80px #00000080",
      }}>
        {/* Header portale */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid #1e2535",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "linear-gradient(135deg, #1e3a5f20, transparent)",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9" }}>
              Compila Piano Operativo di Sicurezza
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
              Richiesta da Vetri Italiani S.r.l. · POS-2026-047
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: 24 }}>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

          {generating ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 56, height: 56, margin: "0 auto 20px", borderRadius: "50%", border: "3px solid #1e2535", borderTop: "3px solid #3b82f6", animation: "spin 0.9s linear infinite" }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>L'AI sta generando il POS...</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 8 }}>Analisi delle fasi lavorative e dei rischi specifici</div>
            </div>
          ) : generated ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 60, height: 60, margin: "0 auto 16px", borderRadius: "50%", background: "#10b98120", border: "2px solid #10b98140", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✓</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#10b981", marginBottom: 8 }}>POS generato e inviato</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
                Il Piano Operativo di Sicurezza è stato inviato a Vetri Italiani S.r.l. per approvazione. Riceverai una notifica email al completamento della revisione.
              </div>
              <button onClick={onClose} style={{ padding: "10px 24px", background: "#1e2535", border: "none", borderRadius: 8, color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>Chiudi</button>
            </div>
          ) : (
            <div>
              {/* Steps */}
              <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
                {["Fasi lavorative", "DPI e sicurezza", "Genera con AI"].map((s, i) => (
                  <div key={i} style={{ flex: 1 }}>
                    <div style={{ height: 3, borderRadius: 2, background: i < stepPos ? "#3b82f6" : "#1e2535", marginBottom: 4 }} />
                    <div style={{ fontSize: 10, color: i < stepPos ? "#3b82f6" : "#334155", fontWeight: i === stepPos - 1 ? 700 : 400 }}>{i + 1}. {s}</div>
                  </div>
                ))}
              </div>

              {stepPos === 1 && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 16 }}>Descrivi le fasi lavorative</div>
                  {fasi.map((fase, fi) => (
                    <div key={fi} style={{
                      background: "#0f1117", border: "1px solid #1e2535",
                      borderRadius: 10, padding: 16, marginBottom: 12,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white" }}>{fi + 1}</div>
                        <input
                          placeholder="Nome della fase (es. Preparazione, Smontaggio...)"
                          value={fase.titolo}
                          onChange={e => {
                            const nw = [...fasi]; nw[fi].titolo = e.target.value; setFasi(nw);
                          }}
                          style={{ flex: 1, padding: "8px 12px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 7, color: "#cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                        />
                        {fasi.length > 1 && (
                          <button onClick={() => setFasi(fasi.filter((_, i) => i !== fi))} style={{ background: "none", border: "none", color: "#334155", fontSize: 18, cursor: "pointer" }}>×</button>
                        )}
                      </div>
                      {[
                        { key: "descrizione", label: "Descrizione attività", ph: "Descrivi le operazioni..." },
                        { key: "attrezzature", label: "Attrezzature utilizzate", ph: "Es. Estrattore idraulico, chiavi dinamometriche..." },
                        { key: "rischi", label: "Rischi specifici", ph: "Es. Schiacciamento, taglio..." },
                        { key: "misure", label: "Misure di sicurezza adottate", ph: "Es. Guanti anti-taglio, ausilio secondo operatore..." },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 10, color: "#475569", fontWeight: 700, display: "block", marginBottom: 4 }}>{f.label}</label>
                          <textarea
                            rows={2}
                            placeholder={f.ph}
                            value={fase[f.key]}
                            onChange={e => { const nw = [...fasi]; nw[fi][f.key] = e.target.value; setFasi(nw); }}
                            style={{ width: "100%", padding: "8px 12px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 7, color: "#cbd5e1", fontSize: 12, resize: "vertical", boxSizing: "border-box" }}
                          />
                        </div>
                      ))}
                      <div>
                        <label style={{ fontSize: 10, color: "#475569", fontWeight: 700, display: "block", marginBottom: 4 }}>Durata stimata</label>
                        <input placeholder="Es. 2 ore" value={fase.durata} onChange={e => { const nw = [...fasi]; nw[fi].durata = e.target.value; setFasi(nw); }} style={{ width: 120, padding: "7px 12px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 7, color: "#cbd5e1", fontSize: 12 }} />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setFasi([...fasi, { id: fasi.length + 1, titolo: "", descrizione: "", attrezzature: "", rischi: "", misure: "", durata: "" }])} style={{ width: "100%", padding: "10px", background: "#0f1117", border: "1px dashed #334155", borderRadius: 8, color: "#475569", fontSize: 12, cursor: "pointer", marginBottom: 16 }}>+ Aggiungi fase</button>
                  <button onClick={() => setStepPos(2)} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Continua →</button>
                </div>
              )}

              {stepPos === 2 && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 16 }}>DPI e gestione emergenze</div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 8 }}>DPI utilizzati dal tuo personale</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {["Casco EN 397", "Occhiali EN 166", "Guanti anti-taglio EN 388", "Guanti termoresistenti EN 407", "Scarpe S3 EN 20345", "Otoprotettori EN 352", "Imbracatura EN 361", "Indumenti alta visibilità"].map(dpi => (
                        <label key={dpi} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#0f1117", border: "1px solid #1e2535", borderRadius: 7, cursor: "pointer", fontSize: 12, color: "#94a3b8" }}>
                          <input type="checkbox" style={{ accentColor: "#3b82f6" }} defaultChecked={["Casco EN 397", "Occhiali EN 166", "Guanti anti-taglio EN 388", "Scarpe S3 EN 20345", "Otoprotettori EN 352"].includes(dpi)} />
                          {dpi}
                        </label>
                      ))}
                    </div>
                  </div>
                  {[
                    { label: "Referente emergenza tua impresa", ph: "Nome, cognome, cell." },
                    { label: "Note aggiuntive", ph: "Eventuali informazioni rilevanti per il committente..." },
                  ].map((f, i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 6 }}>{f.label}</label>
                      <textarea rows={2} placeholder={f.ph} style={{ width: "100%", padding: "10px 14px", background: "#0f1117", border: "1px solid #1e2535", borderRadius: 8, color: "#cbd5e1", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button onClick={() => setStepPos(1)} style={{ flex: 1, padding: "11px", background: "#1e2535", border: "none", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" }}>← Indietro</button>
                    <button onClick={() => setStepPos(3)} style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Continua →</button>
                  </div>
                </div>
              )}

              {stepPos === 3 && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 16 }}>Genera con AI e invia</div>
                  <div style={{ padding: "14px 18px", background: "#3b82f610", border: "1px solid #3b82f620", borderRadius: 10, fontSize: 13, color: "#60a5fa", marginBottom: 20, lineHeight: 1.7 }}>
                    ⚡ L'AI integrerà le tue fasi lavorative con i rischi del DUVRI del committente, genererà le misure di coordinamento specifiche e produrrà il POS completo conforme all'art. 26 D.Lgs. 81/08.
                  </div>
                  <div style={{ background: "#0f1117", border: "1px solid #1e2535", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
                    {[
                      ["Appalto", "DVR-2026-047"],
                      ["Committente", "Vetri Italiani S.r.l."],
                      ["Fasi lavorative", fasi.filter(f => f.titolo).length || 1],
                      ["Lavoratori", "Marco Rossi, Luigi Bianchi"],
                    ].map(([k, v], i, arr) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: i < arr.length - 1 ? "1px solid #1e253540" : "none", fontSize: 13 }}>
                        <span style={{ color: "#475569" }}>{k}</span>
                        <span style={{ color: "#cbd5e1", fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setStepPos(2)} style={{ flex: 1, padding: "12px", background: "#1e2535", border: "none", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" }}>← Modifica</button>
                    <button onClick={handleGenera} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 8, color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>⚡ Genera POS e invia</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ModuloPOS() {
  const [selected, setSelected] = useState(null);
  const [lista, setLista] = useState(POS_LIST);
  const [showPortale, setShowPortale] = useState(false);

  const handleApprova = (posId) => {
    setLista(prev => prev.map(p => p.id === posId ? { ...p, stato: "approvato" } : p));
    setSelected(null);
  };

  const handleRifiuta = (posId) => {
    setLista(prev => prev.map(p => p.id === posId ? { ...p, stato: "rifiutato" } : p));
    setSelected(null);
  };

  const selectedPos = lista.find(p => p.id === selected);

  if (selectedPos) {
    return (
      <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", minHeight: "100vh", padding: 32, color: "#e2e8f0" }}>
        <DettaglioPOS
          pos={selectedPos}
          onBack={() => setSelected(null)}
          onApprova={() => handleApprova(selectedPos.id)}
          onRifiuta={(nota) => handleRifiuta(selectedPos.id)}
        />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", minHeight: "100vh", padding: 32, color: "#e2e8f0" }}>
      {showPortale && <PortaleCompilazionePOS onClose={() => setShowPortale(false)} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>Piano Operativo di Sicurezza</div>
          <div style={{ fontSize: 13, color: "#475569" }}>Gestione POS per ogni appalto attivo</div>
        </div>
        <button
          onClick={() => setShowPortale(true)}
          style={{
            padding: "9px 16px", background: "#1e2535",
            border: "1px solid #334155", borderRadius: 8,
            color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
          👁 Simula portale appaltatore
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "In attesa", value: lista.filter(p => p.stato === "in_attesa").length, color: "#64748b" },
          { label: "Da approvare", value: lista.filter(p => p.stato === "da_approvare").length, color: "#a78bfa" },
          { label: "Approvati", value: lista.filter(p => p.stato === "approvato").length, color: "#10b981" },
          { label: "In revisione", value: lista.filter(p => p.stato === "rifiutato").length, color: "#ef4444" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#161b27", border: `1px solid ${s.color}20`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert da approvare */}
      {lista.filter(p => p.stato === "da_approvare").length > 0 && (
        <div style={{
          padding: "12px 18px", marginBottom: 20,
          background: "#a78bfa12", border: "1px solid #a78bfa30",
          borderRadius: 10, display: "flex", gap: 10, alignItems: "center",
          fontSize: 13, color: "#a78bfa",
        }}>
          <span>👁</span>
          <span><strong>{lista.filter(p => p.stato === "da_approvare").length} POS</strong> in attesa della tua approvazione</span>
        </div>
      )}

      {/* Lista POS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {lista.map(pos => {
          const cfg = STATO_POS[pos.stato];
          return (
            <div
              key={pos.id}
              onClick={() => setSelected(pos.id)}
              style={{
                background: "#161b27",
                border: `1px solid ${pos.stato === "da_approvare" ? "#a78bfa30" : "#1e2535"}`,
                borderRadius: 12, overflow: "hidden", cursor: "pointer",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 4, height: 48, borderRadius: 2, flexShrink: 0,
                  background: cfg.color, boxShadow: `0 0 8px ${cfg.color}60`,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#3b82f6", fontFamily: "monospace", fontWeight: 700 }}>{pos.id}</span>
                    <span style={{ fontSize: 10, color: "#334155" }}>→</span>
                    <span style={{ fontSize: 11, color: "#475569" }}>{pos.duvriId}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{pos.appaltatore}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                    {pos.lavori} · {pos.area} · {pos.dataInizio}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <StatoBadge stato={pos.stato} />
                  <div style={{ fontSize: 10, color: "#334155", marginTop: 6 }}>
                    {pos.lavoratori.length} lavorator{pos.lavoratori.length > 1 ? "i" : "e"}
                  </div>
                </div>
                <span style={{ color: "#334155", fontSize: 16 }}>›</span>
              </div>

              {pos.stato === "da_approvare" && (
                <div style={{
                  padding: "8px 20px",
                  background: "#a78bfa08", borderTop: "1px solid #a78bfa20",
                  fontSize: 11, color: "#a78bfa",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span>👁 Compilato il {pos.compilato} — in attesa della tua revisione</span>
                  <span style={{ fontWeight: 700 }}>Clicca per approvare →</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
