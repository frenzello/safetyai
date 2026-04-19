import { useState, useRef } from "react";

// ─── MOCK TEMPLATE CARICATI ───────────────────────────────────────────────────
const TEMPLATE_INIZIALI = [
  {
    id: 1,
    nome: "POS Manutenzione Meccanica — Marzo 2025",
    file: "POS_EditRossi_Manutenzione_Mar2025.pdf",
    dimensione: "284 KB",
    caricato: "15/03/2025",
    stato: "analizzato",
    analisi: {
      intestazione: "Logo aziendale in alto a sinistra, ragione sociale centrata, numero documento in alto a destra",
      piePagina: "«Documento riservato — Vetri Italiani S.r.l.» + numero pagina centrato + data revisione",
      struttura: ["Copertina con dati appalto", "Anagrafica impresa appaltatrice", "Descrizione lavori", "Fasi operative con tabella rischi", "DPI per mansione", "Gestione emergenze", "Firme"],
      tono: "Formale e tecnico, frasi brevi, uso estensivo di tabelle per rischi e misure",
      font: "Arial 11pt corpo, Arial Bold 12pt titoli sezione",
      colori: "Intestazioni sezione in blu aziendale #1e3a5f, testo nero, tabelle con alternanza righe grigio chiaro",
      note: "Ogni fase lavorativa ha una tabella dedicata con colonne: Attività / Rischio / Misura / Responsabile",
    },
  },
  {
    id: 2,
    nome: "POS Lavori Elettrici — Gennaio 2025",
    file: "POS_GTImpianti_Elettrico_Gen2025.pdf",
    dimensione: "196 KB",
    caricato: "20/01/2025",
    stato: "analizzato",
    analisi: {
      intestazione: "Logo aziendale + «PIANO OPERATIVO DI SICUREZZA» in maiuscolo, dati appalto in tabella sotto",
      piePagina: "Pagina X di Y — Vetri Italiani S.r.l. — Confidenziale",
      struttura: ["Dati identificativi", "Lavoratori coinvolti con mansioni", "Ciclo lavorativo e fasi", "Valutazione rischi interferenziali", "DPI", "Emergenze e pronto soccorso", "Dichiarazione e firme"],
      tono: "Molto tecnico, riferimenti normativi espliciti (CEI, D.Lgs.) in ogni sezione",
      font: "Times New Roman 11pt, titoli in grassetto",
      colori: "Stile monocromatico, nessun colore tranne i bordi delle tabelle",
      note: "Include sempre una sezione specifica sulla normativa di riferimento CEI 11-27 per i lavori elettrici",
    },
  },
];

// ─── AI ANALISI DOCUMENTO ─────────────────────────────────────────────────────
async function analizzaTemplate(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const isPdf = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");

  const contentParts = [];

  if (isPdf) {
    contentParts.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64 },
    });
  } else if (isImage) {
    contentParts.push({
      type: "image",
      source: { type: "base64", media_type: file.type, data: base64 },
    });
  }

  contentParts.push({
    type: "text",
    text: `Analizza questo Piano Operativo di Sicurezza (POS) italiano.
Il tuo compito è estrarre le caratteristiche di stile e struttura per permettere all'AI di generare futuri POS nello stesso formato.

Rispondi SOLO con un JSON valido, senza testo aggiuntivo, senza backtick:

{
  "intestazione": "descrizione dettagliata dell'intestazione: posizione logo, titolo documento, dati aziendali, numero documento, ecc.",
  "piePagina": "descrizione del piè di pagina: testo, numero pagina, data, ecc.",
  "struttura": ["lista delle sezioni del documento nell'ordine in cui appaiono"],
  "tono": "descrizione del tono e stile della scrittura (formale/tecnico/sintetico, uso di tabelle, elenchi, ecc.)",
  "font": "font e dimensioni usate se identificabili",
  "colori": "schema colori usato per intestazioni, tabelle, testo",
  "tabelle": "descrizione delle tabelle usate (struttura colonne, intestazioni tipiche)",
  "note": "qualsiasi altra caratteristica stilistica rilevante da replicare"
}

Se il documento non è un POS o non è leggibile, rispondi con:
{"errore": "descrizione del problema"}`,
  });

  const response = await fetch("http://localhost:3001/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [{ role: "user", content: contentParts }],
    }),
  });

  const data = await response.json();
  const text = data.content?.map(b => b.text || "").join("") || "";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { errore: "Impossibile analizzare il documento" };
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fileIcon(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "📋";
  if (["doc", "docx"].includes(ext)) return "📝";
  return "📄";
}

function StatoBadge({ stato }) {
  const cfg = {
    analizzato: { color: "#10b981", bg: "#10b98115", label: "Analizzato", icon: "✓" },
    analisi:    { color: "#3b82f6", bg: "#3b82f615", label: "In analisi...", icon: "⟳" },
    errore:     { color: "#ef4444", bg: "#ef444415", label: "Errore lettura", icon: "✗" },
    caricato:   { color: "#f59e0b", bg: "#f59e0b15", label: "Caricato", icon: "○" },
  }[stato] || { color: "#475569", bg: "#47556915", label: stato, icon: "·" };

  return (
    <span style={{
      padding: "3px 9px", borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <span style={{
        display: "inline-block",
        animation: stato === "analisi" ? "spin 0.8s linear infinite" : "none",
        fontSize: 10,
      }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── CARD TEMPLATE ────────────────────────────────────────────────────────────
function TemplateCard({ template, onElimina, onVediAnalisi }) {
  return (
    <div style={{
      background: "#161b27",
      border: `1px solid ${template.stato === "analizzato" ? "#10b98130" : "#1e2535"}`,
      borderRadius: 12, overflow: "hidden",
    }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: template.stato === "analizzato" ? "#10b98115" : "#1e2535",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>{fileIcon(template.file)}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {template.nome}
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
            {template.file} · {template.dimensione} · Caricato il {template.caricato}
          </div>
        </div>

        <StatoBadge stato={template.stato} />

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {template.stato === "analizzato" && (
            <button
              onClick={() => onVediAnalisi(template)}
              style={{
                padding: "6px 12px", background: "#1e2535",
                border: "1px solid #334155", borderRadius: 7,
                color: "#94a3b8", fontSize: 11, cursor: "pointer",
              }}>👁 Analisi</button>
          )}
          <button
            onClick={() => onElimina(template.id)}
            style={{
              padding: "6px 10px", background: "none",
              border: "1px solid #1e2535", borderRadius: 7,
              color: "#334155", fontSize: 14, cursor: "pointer",
            }}>×</button>
        </div>
      </div>

      {template.stato === "analizzato" && template.analisi && (
        <div style={{
          padding: "12px 20px",
          background: "#10b98108", borderTop: "1px solid #10b98120",
          display: "flex", gap: 16, flexWrap: "wrap",
        }}>
          {[
            { label: "Sezioni", value: template.analisi.struttura?.length + " sezioni" },
            { label: "Tono", value: template.analisi.tono?.split(",")[0] },
            { label: "Tabelle", value: template.analisi.tabelle?.split(".")[0] },
          ].map((s, i) => (
            <div key={i} style={{ fontSize: 11 }}>
              <span style={{ color: "#334155" }}>{s.label}: </span>
              <span style={{ color: "#64748b", fontWeight: 500 }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MODAL ANALISI ────────────────────────────────────────────────────────────
function ModalAnalisi({ template, onClose }) {
  if (!template) return null;
  const a = template.analisi;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000b0", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "#161b27", border: "1px solid #1e2535",
        borderRadius: 16, width: "100%", maxWidth: 600,
        maxHeight: "85vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 30px 80px #00000080",
      }}>
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid #1e2535",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Analisi stile documento</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{template.nome}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ overflowY: "auto", padding: 24 }}>
          {[
            { label: "🏢 Intestazione", value: a.intestazione },
            { label: "📄 Piè di pagina", value: a.piePagina },
            { label: "🖋 Tono e stile", value: a.tono },
            { label: "🔤 Font e dimensioni", value: a.font },
            { label: "🎨 Schema colori", value: a.colori },
            { label: "📊 Uso tabelle", value: a.tabelle },
            { label: "💡 Note aggiuntive", value: a.note },
          ].map((item, i) => (
            <div key={i} style={{
              marginBottom: 16,
              padding: "14px 18px",
              background: "#0f1117", border: "1px solid #1e2535",
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{item.value || "—"}</div>
            </div>
          ))}

          <div style={{
            padding: "14px 18px",
            background: "#0f1117", border: "1px solid #1e2535",
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 10 }}>📋 Struttura sezioni</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {a.struttura?.map((sezione, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: "white",
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>{sezione}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #1e2535", flexShrink: 0 }}>
          <div style={{
            padding: "10px 14px", background: "#3b82f610",
            border: "1px solid #3b82f620", borderRadius: 8,
            fontSize: 12, color: "#60a5fa", lineHeight: 1.6,
          }}>
            ⚡ Quando genererai un nuovo POS, l'AI userà questo stile come riferimento — replicando intestazione, struttura delle sezioni, uso delle tabelle e tono del documento.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function GestioneTemplatesPOS() {
  const [templates, setTemplates] = useState(TEMPLATE_INIZIALI);
  const [analisiModal, setAnalisiModal] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [caricando, setCaricando] = useState(false);
  const [templateAttivo, setTemplateAttivo] = useState(1); // id template usato come riferimento
  const inputRef = useRef();

  const handleFiles = async (files) => {
    const lista = Array.from(files).filter(f =>
      f.type === "application/pdf" ||
      f.type.startsWith("image/") ||
      f.name.endsWith(".docx") || f.name.endsWith(".doc")
    );
    if (!lista.length) return;

    setCaricando(true);

    for (const file of lista) {
      const nuovo = {
        id: Date.now() + Math.random(),
        nome: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        file: file.name,
        dimensione: `${Math.round(file.size / 1024)} KB`,
        caricato: new Date().toLocaleDateString("it-IT"),
        stato: "analisi",
        analisi: null,
      };

      setTemplates(prev => [...prev, nuovo]);

      try {
        const analisi = await analizzaTemplate(file);
        setTemplates(prev => prev.map(t =>
          t.id === nuovo.id
            ? { ...t, stato: analisi.errore ? "errore" : "analizzato", analisi: analisi.errore ? null : analisi }
            : t
        ));
      } catch {
        setTemplates(prev => prev.map(t =>
          t.id === nuovo.id ? { ...t, stato: "errore" } : t
        ));
      }
    }

    setCaricando(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleElimina = (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (templateAttivo === id) setTemplateAttivo(null);
  };

  const analizzati = templates.filter(t => t.stato === "analizzato");
  const templateAttivoObj = templates.find(t => t.id === templateAttivo);

  return (
    <div style={{
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: "#0f1117", minHeight: "100vh",
      padding: 32, color: "#e2e8f0",
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {analisiModal && (
        <ModalAnalisi template={analisiModal} onClose={() => setAnalisiModal(null)} />
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px", marginBottom: 4 }}>
          Template e stile POS
        </div>
        <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
          Carica i tuoi POS già redatti. L'AI analizzerà intestazione, struttura e stile per replicarli fedelmente nei documenti futuri.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* Colonna sinistra — upload + lista */}
        <div>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "#3b82f6" : "#1e2535"}`,
              borderRadius: 14, padding: "36px 24px",
              textAlign: "center", cursor: "pointer",
              background: dragOver ? "#3b82f610" : "#161b27",
              transition: "all 0.2s", marginBottom: 20,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={e => handleFiles(e.target.files)}
            />
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>📄</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>
              Trascina qui i tuoi POS di esempio
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>
              Puoi caricare più file insieme — PDF, Word o immagini
            </div>
            <div style={{
              display: "inline-flex", gap: 10, padding: "8px 16px",
              background: "#0f1117", borderRadius: 8, fontSize: 12, color: "#64748b",
            }}>
              <span>PDF</span><span style={{ color: "#334155" }}>·</span>
              <span>DOCX</span><span style={{ color: "#334155" }}>·</span>
              <span>JPG/PNG</span>
            </div>
          </div>

          {/* Info box */}
          <div style={{
            padding: "14px 18px", marginBottom: 24,
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: 10, display: "flex", gap: 12,
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
              <strong style={{ color: "#94a3b8" }}>Come funziona il few-shot learning:</strong> l'AI legge ogni POS caricato ed estrae intestazione, piè di pagina, struttura delle sezioni, uso delle tabelle e tono della scrittura. Quando genererai un nuovo POS, l'AI partirà da questi esempi per replicare fedelmente il tuo stile aziendale — non un documento generico.
            </div>
          </div>

          {/* Lista templates */}
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 12 }}>
            DOCUMENTI CARICATI — {templates.length}
          </div>

          {templates.length === 0 ? (
            <div style={{
              padding: "40px", textAlign: "center",
              background: "#161b27", border: "1px dashed #1e2535",
              borderRadius: 12, color: "#334155", fontSize: 13,
            }}>
              Nessun template caricato ancora
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {templates.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onElimina={handleElimina}
                  onVediAnalisi={setAnalisiModal}
                />
              ))}
            </div>
          )}
        </div>

        {/* Colonna destra — configurazione */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Template attivo */}
          <div style={{
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 18px", borderBottom: "1px solid #1e2535",
              fontSize: 13, fontWeight: 700, color: "#cbd5e1",
            }}>
              Stile di riferimento attivo
            </div>
            <div style={{ padding: "16px 18px" }}>
              {analizzati.length === 0 ? (
                <div style={{ fontSize: 12, color: "#334155", textAlign: "center", padding: "20px 0" }}>
                  Carica almeno un POS per selezionare lo stile di riferimento
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.6 }}>
                    L'AI userà questo documento come riferimento principale per lo stile di tutti i nuovi POS generati.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {analizzati.map(t => (
                      <label key={t.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px",
                        background: templateAttivo === t.id ? "#1e3a5f" : "#0f1117",
                        border: `1px solid ${templateAttivo === t.id ? "#3b82f6" : "#1e2535"}`,
                        borderRadius: 9, cursor: "pointer",
                      }}>
                        <input
                          type="radio"
                          name="template_attivo"
                          checked={templateAttivo === t.id}
                          onChange={() => setTemplateAttivo(t.id)}
                          style={{ accentColor: "#3b82f6" }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 12, fontWeight: 600,
                            color: templateAttivo === t.id ? "#60a5fa" : "#94a3b8",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>{t.nome}</div>
                          <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{t.file}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {templateAttivoObj && (
                    <button
                      onClick={() => setAnalisiModal(templateAttivoObj)}
                      style={{
                        width: "100%", marginTop: 12, padding: "9px",
                        background: "#1e2535", border: "1px solid #334155",
                        borderRadius: 8, color: "#64748b", fontSize: 12,
                        cursor: "pointer",
                      }}>
                      👁 Vedi analisi dello stile
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Modalità generazione */}
          <div style={{
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 18px", borderBottom: "1px solid #1e2535",
              fontSize: 13, fontWeight: 700, color: "#cbd5e1",
            }}>Modalità generazione</div>
            <div style={{ padding: "16px 18px" }}>
              {[
                {
                  id: "template",
                  label: "Replica stile template",
                  desc: "L'AI copia intestazione, struttura e tono del documento di riferimento",
                  attivo: true,
                },
                {
                  id: "ibrido",
                  label: "Stile ibrido",
                  desc: "Struttura dal template, tono ottimizzato dall'AI",
                  attivo: false,
                },
                {
                  id: "libero",
                  label: "Stile libero",
                  desc: "L'AI genera il POS nel formato standard senza vincoli di stile",
                  attivo: false,
                },
              ].map((opt, i) => (
                <label key={opt.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 0",
                  borderBottom: i < 2 ? "1px solid #1e253540" : "none",
                  cursor: "pointer",
                }}>
                  <input
                    type="radio"
                    name="modalita"
                    defaultChecked={opt.attivo}
                    style={{ accentColor: "#3b82f6", marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2, lineHeight: 1.5 }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: 12, padding: "16px 18px",
          }}>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 12 }}>
              RIEPILOGO
            </div>
            {[
              { label: "Template caricati", value: templates.length },
              { label: "Analizzati", value: analizzati.length },
              { label: "In analisi", value: templates.filter(t => t.stato === "analisi").length },
              { label: "Con errori", value: templates.filter(t => t.stato === "errore").length },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: i < 3 ? "1px solid #1e253540" : "none",
                fontSize: 12,
              }}>
                <span style={{ color: "#475569" }}>{s.label}</span>
                <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>

          <div style={{
            padding: "12px 16px",
            background: "#f59e0b10", border: "1px solid #f59e0b20",
            borderRadius: 9, fontSize: 11, color: "#f59e0b", lineHeight: 1.6,
          }}>
            💡 Più template carichi, più preciso sarà lo stile replicato. Consigliamo almeno 3 POS di tipo diverso (manutenzione meccanica, elettrica, pulizie...).
          </div>
        </div>
      </div>
    </div>
  );
}
