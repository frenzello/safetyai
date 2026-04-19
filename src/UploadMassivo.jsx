import { useState, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const APPALTO = {
  id: "APL-2026-047",
  committente: "Vetri Italiani S.r.l.",
  rspp: "Marco Albertini",
  lavori: "Sostituzione cuscinetti macchina IS linea 3",
  area: "Reparto Formatura",
  dataInizio: "28/04/2026",
  scadenzaInvio: "25/04/2026",
};

const DOC_AZIENDALI_TIPI = ["DURC", "Visura camerale", "Polizza RC", "DVR aziendale"];

// ─── AI EXTRACTION via Anthropic API ─────────────────────────────────────────
async function extractDocumentData(file) {
  // Convert file to base64
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  // Build content for Claude
  const contentParts = [];

  if (isImage) {
    contentParts.push({
      type: "image",
      source: {
        type: "base64",
        media_type: file.type,
        data: base64,
      },
    });
  } else if (isPdf) {
    contentParts.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: base64,
      },
    });
  } else {
    // Fallback: treat as text
    contentParts.push({
      type: "text",
      text: `Nome file: ${file.name}`,
    });
  }

  contentParts.push({
    type: "text",
    text: `Sei un esperto di sicurezza sul lavoro italiana. Analizza questo documento e rispondi SOLO con un oggetto JSON valido, senza testo aggiuntivo, senza backtick, senza markdown.

Leggi attentamente il contenuto e descrivi ESATTAMENTE quello che vedi, senza ricondurre a categorie generiche.

JSON da restituire:
{
  "tipo_documento": "descrizione precisa e fedele del documento. Per attestati formativi indica la materia esatta del corso (es. 'Movimentazione manuale dei carichi', 'Rischio chimico', 'Formazione generale per lavoratori D.Lgs 81/08', 'Antincendio rischio medio', 'Primo soccorso gruppo B'). Per documenti aziendali indica il tipo esatto (es. 'DURC', 'Visura camerale', 'Polizza RC', 'DVR'). NON usare categorie generiche se il documento contiene informazioni più specifiche.",
  "categoria": "scrivi 'aziendale' se è un documento dell'impresa (DURC, visura, polizza, DVR), oppure 'lavoratore' se è un attestato personale",
  "nome_lavoratore": "nome e cognome del lavoratore esattamente come scritto nel documento, null se assente",
  "codice_fiscale": "codice fiscale se presente, null se assente",
  "data_scadenza": "data di scadenza in formato GG/MM/AAAA, null se non presente",
  "data_rilascio": "data di rilascio o conseguimento in formato GG/MM/AAAA, null se non presente",
  "ore_formazione": "numero di ore del corso se indicato, null se assente",
  "normativa": "normativa di riferimento citata nel documento es. D.Lgs 81/08 art.37, null se assente",
  "ente_erogatore": "nome dell'ente, organismo o datore di lavoro che ha rilasciato il documento, null se assente",
  "confidenza": numero intero da 0 a 100 che indica quanto sei sicuro della lettura,
  "note": "qualsiasi altra informazione rilevante presente nel documento, null se niente da segnalare"
}

Se il documento non è leggibile o non pertinente alla sicurezza sul lavoro:
{"errore": "descrizione del problema", "confidenza": 0}`,
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
    return { errore: "Impossibile leggere il documento", confidenza: 0 };
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fileIcon(name) {
  if (!name) return "📄";
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "📋";
  if (["jpg", "jpeg", "png"].includes(ext)) return "🖼";
  return "📄";
}

function StatoBadge({ stato }) {
  const cfg = {
    elaborazione: { bg: "#3b82f615", color: "#60a5fa", label: "Elaborazione..." },
    ok:           { bg: "#10b98115", color: "#10b981", label: "Classificato" },
    errore:       { bg: "#ef444415", color: "#ef4444", label: "Errore lettura" },
    attesa:       { bg: "#1e2535",   color: "#475569", label: "In coda" },
  }[stato] || { bg: "#1e2535", color: "#475569", label: stato };

  return (
    <span style={{
      padding: "3px 9px", borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {stato === "elaborazione" && (
        <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite", fontSize: 10 }}>⟳</span>
      )}
      {cfg.label}
    </span>
  );
}

// ─── LAVORATORE CARD (risultato classificazione) ──────────────────────────────
function LavoratoreRisultato({ lavoratore, docs }) {
  const [expanded, setExpanded] = useState(true);
  const tuttiOk = docs.every(d => d.stato === "ok");

  return (
    <div style={{
      background: "#161b27",
      border: `1px solid ${tuttiOk ? "#10b98130" : "#1e2535"}`,
      borderRadius: 12, overflow: "hidden",
    }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: "16px 20px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 14,
          background: tuttiOk ? "#10b98108" : "transparent",
        }}
      >
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: tuttiOk ? "#10b98120" : "#1e2535",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 800,
          color: tuttiOk ? "#10b981" : "#64748b",
        }}>
          {lavoratore.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{lavoratore}</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
            {docs.length} documenti · {docs.filter(d => d.stato === "ok").length} classificati
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {tuttiOk && (
            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>✓ Completo</span>
          )}
          <span style={{ color: "#334155", fontSize: 14 }}>{expanded ? "▾" : "▸"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #1e2535" }}>
          {docs.map((doc, i) => (
            <div key={i} style={{
              padding: "12px 20px",
              borderBottom: i < docs.length - 1 ? "1px solid #1e253540" : "none",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{fileIcon(doc.nomeFile)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>
                  {doc.risultato?.tipo_documento || doc.nomeFile}
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 3, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {doc.risultato?.nome_lavoratore && (
                    <span style={{ color: "#60a5fa" }}>👤 {doc.risultato.nome_lavoratore}</span>
                  )}
                  {doc.risultato?.data_rilascio && (
                    <span>Rilascio: <strong style={{ color: "#94a3b8" }}>{doc.risultato.data_rilascio}</strong></span>
                  )}
                  {doc.risultato?.data_scadenza && (
                    <span>Scad: <strong style={{ color: "#f59e0b" }}>{doc.risultato.data_scadenza}</strong></span>
                  )}
                  {doc.risultato?.ore_formazione && (
                    <span>🕐 {doc.risultato.ore_formazione}h</span>
                  )}
                  {doc.risultato?.normativa && (
                    <span style={{ color: "#a78bfa" }}>{doc.risultato.normativa}</span>
                  )}
                  {doc.risultato?.ente_erogatore && (
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                      📋 {doc.risultato.ente_erogatore}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <StatoBadge stato={doc.stato} />
                {doc.risultato?.confidenza && (
                  <div style={{ fontSize: 10, color: "#334155", textAlign: "right", marginTop: 3 }}>
                    {doc.risultato.confidenza}% conf.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PortaleUploadMassivo() {
  const [step, setStep] = useState("upload"); // upload | elaborazione | risultati | inviato
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [elaborati, setElaborati] = useState([]); // [{nomeFile, stato, risultato}]
  const [progress, setProgress] = useState({ fatto: 0, totale: 0 });
  const inputRef = useRef();

  // Raggruppa per lavoratore
  const perLavoratore = elaborati.reduce((acc, doc) => {
    if (doc.risultato?.categoria === "lavoratore" && doc.risultato?.nome_lavoratore) {
      const nome = doc.risultato.nome_lavoratore;
      if (!acc[nome]) acc[nome] = [];
      acc[nome].push(doc);
    }
    return acc;
  }, {});

  const docAziendali = elaborati.filter(d =>
    d.risultato?.categoria === "aziendale" || DOC_AZIENDALI_TIPI.includes(d.risultato?.tipo_documento)
  );
  const docErrore = elaborati.filter(d => d.stato === "errore");
  const inElaborazione = elaborati.filter(d => d.stato === "elaborazione" || d.stato === "attesa").length;

  const handleFiles = useCallback((newFiles) => {
    const list = Array.from(newFiles);
    setFiles(list);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const startElaboration = async () => {
    if (files.length === 0) return;
    setStep("elaborazione");

    // Init tutti come "attesa"
    const initial = files.map(f => ({ nomeFile: f.name, stato: "attesa", risultato: null, file: f }));
    setElaborati(initial);
    setProgress({ fatto: 0, totale: files.length });

    // Elabora in parallelo a gruppi di 3
    const results = [...initial];
    const BATCH = 3;

    for (let i = 0; i < files.length; i += BATCH) {
      const batch = files.slice(i, i + BATCH);

      // Metti in elaborazione
      batch.forEach((_, bi) => {
        results[i + bi] = { ...results[i + bi], stato: "elaborazione" };
      });
      setElaborati([...results]);

      // Processa in parallelo
      await Promise.all(
        batch.map(async (file, bi) => {
          try {
            const risultato = await extractDocumentData(file);
            results[i + bi] = {
              ...results[i + bi],
              stato: risultato.errore ? "errore" : "ok",
              risultato,
            };
          } catch {
            results[i + bi] = {
              ...results[i + bi],
              stato: "errore",
              risultato: { errore: "Errore di connessione", confidenza: 0 },
            };
          }
          setProgress(p => ({ ...p, fatto: p.fatto + 1 }));
          setElaborati([...results]);
        })
      );
    }

    setStep("risultati");
  };

  const pct = progress.totale > 0 ? Math.round((progress.fatto / progress.totale) * 100) : 0;

  // ── STEP: UPLOAD ────────────────────────────────────────────────────────────
  if (step === "upload") {
    return (
      <div style={{
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        background: "#0f1117", minHeight: "100vh",
        padding: "40px 24px", color: "#e2e8f0",
        maxWidth: 640, margin: "0 auto",
      }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 32, height: 32,
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              borderRadius: 8, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white",
            }}>S</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>SafetyAI</span>
          </div>

          <div style={{
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: 12, padding: "20px 24px", marginBottom: 24,
          }}>
            <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700, letterSpacing: "0.8px", marginBottom: 8 }}>
              RICHIESTA DOCUMENTAZIONE · {APPALTO.id}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              {APPALTO.committente}
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
              {APPALTO.lavori} · {APPALTO.area} · Inizio {APPALTO.dataInizio}
            </div>
          </div>

          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px", marginBottom: 8 }}>
            Carica tutti i documenti
          </div>
          <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
            Seleziona tutti i file insieme — attestati, idoneità, documenti aziendali —
            senza preoccuparti dell'ordine. <strong style={{ color: "#60a5fa" }}>L'AI li classifica automaticamente</strong> e li assegna al lavoratore corretto.
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#3b82f6" : files.length > 0 ? "#10b981" : "#1e2535"}`,
            borderRadius: 16,
            padding: files.length > 0 ? "32px 24px" : "56px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "#3b82f610" : files.length > 0 ? "#10b98108" : "#161b27",
            transition: "all 0.2s",
            marginBottom: 20,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: "none" }}
            onChange={e => handleFiles(e.target.files)}
          />

          {files.length === 0 ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📂</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>
                Trascina tutti i documenti qui
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>
                Puoi caricare fino a 100 file insieme, in qualsiasi ordine
              </div>
              <div style={{
                display: "inline-flex", gap: 8, padding: "8px 16px",
                background: "#1e2535", borderRadius: 8,
                fontSize: 12, color: "#64748b",
              }}>
                <span>PDF</span><span style={{ color: "#334155" }}>·</span>
                <span>JPG</span><span style={{ color: "#334155" }}>·</span>
                <span>PNG</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#10b981", marginBottom: 4 }}>
                {files.length} file selezionati
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>
                Clicca per aggiungerne altri o trascina nuovi file
              </div>

              {/* File list preview */}
              <div style={{
                maxHeight: 200, overflowY: "auto",
                background: "#0f1117", borderRadius: 10,
                padding: "8px 0", textAlign: "left",
              }}>
                {Array.from(files).map((f, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "6px 16px",
                    borderBottom: i < files.length - 1 ? "1px solid #1e253530" : "none",
                  }}>
                    <span style={{ fontSize: 14 }}>{fileIcon(f.name)}</span>
                    <span style={{ fontSize: 12, color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.name}
                    </span>
                    <span style={{ fontSize: 10, color: "#334155", flexShrink: 0 }}>
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info box */}
        <div style={{
          display: "flex", gap: 12, marginBottom: 28,
          padding: "14px 18px", background: "#161b27",
          border: "1px solid #1e2535", borderRadius: 10,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
            <strong style={{ color: "#94a3b8" }}>Come funziona:</strong> l'AI legge ogni documento,
            identifica a chi appartiene, che tipo di attestato è e quando scade.
            Tu verifichi il risultato e invii. <strong style={{ color: "#94a3b8" }}>Nessun dato da inserire a mano.</strong>
          </div>
        </div>

        <button
          onClick={startElaboration}
          disabled={files.length === 0}
          style={{
            width: "100%", padding: "15px",
            background: files.length > 0
              ? "linear-gradient(135deg, #3b82f6, #06b6d4)"
              : "#1e2535",
            border: "none", borderRadius: 12,
            color: files.length > 0 ? "white" : "#334155",
            fontSize: 15, fontWeight: 800,
            cursor: files.length > 0 ? "pointer" : "not-allowed",
            letterSpacing: "-0.2px",
          }}>
          {files.length > 0
            ? `⚡ Analizza ${files.length} documenti con AI →`
            : "Seleziona i file per continuare"}
        </button>

        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#334155" }}>
          Dati cifrati · Conforme GDPR · Nessuna registrazione richiesta
        </div>
      </div>
    );
  }

  // ── STEP: ELABORAZIONE ──────────────────────────────────────────────────────
  if (step === "elaborazione") {
    return (
      <div style={{
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        background: "#0f1117", minHeight: "100vh",
        padding: "40px 24px", color: "#e2e8f0",
        maxWidth: 640, margin: "0 auto",
      }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 20px",
            borderRadius: "50%",
            border: "3px solid #1e2535",
            borderTop: "3px solid #3b82f6",
            animation: "spin 0.9s linear infinite",
          }} />
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.4px" }}>
            Analisi in corso
          </div>
          <div style={{ fontSize: 14, color: "#475569", marginTop: 8 }}>
            L'AI sta leggendo e classificando i tuoi documenti
          </div>
        </div>

        {/* Progress */}
        <div style={{
          background: "#161b27", border: "1px solid #1e2535",
          borderRadius: 12, padding: "20px 24px", marginBottom: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
              {progress.fatto} di {progress.totale} documenti
            </span>
            <span style={{ fontSize: 13, color: "#3b82f6", fontWeight: 800 }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "#1e2535", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
              borderRadius: 4, transition: "width 0.3s ease",
            }} />
          </div>
        </div>

        {/* Live list */}
        <div style={{
          background: "#161b27", border: "1px solid #1e2535",
          borderRadius: 12, overflow: "hidden", maxHeight: 360, overflowY: "auto",
        }}>
          {elaborati.map((doc, i) => (
            <div key={i} style={{
              padding: "11px 20px",
              borderBottom: i < elaborati.length - 1 ? "1px solid #1e253540" : "none",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{fileIcon(doc.nomeFile)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, color: "#94a3b8",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{doc.nomeFile}</div>
                {doc.risultato?.nome_lavoratore && (
                  <div style={{ fontSize: 11, color: "#10b981", marginTop: 2 }}>
                    → {doc.risultato.nome_lavoratore} · {doc.risultato.tipo_documento}
                  </div>
                )}
                {doc.risultato?.categoria === "aziendale" && (
                  <div style={{ fontSize: 11, color: "#60a5fa", marginTop: 2 }}>
                    → Documento aziendale · {doc.risultato.tipo_documento}
                  </div>
                )}
              </div>
              <StatoBadge stato={doc.stato} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── STEP: RISULTATI ─────────────────────────────────────────────────────────
  if (step === "risultati") {
    const nLavoratori = Object.keys(perLavoratore).length;

    return (
      <div style={{
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        background: "#0f1117", minHeight: "100vh",
        padding: "32px 24px", color: "#e2e8f0",
        maxWidth: 680, margin: "0 auto",
      }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* Summary header */}
        <div style={{
          background: "linear-gradient(135deg, #10b98110, #0f1117)",
          border: "1px solid #10b98130",
          borderRadius: 14, padding: "24px 28px", marginBottom: 28,
        }}>
          <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, letterSpacing: "0.8px", marginBottom: 8 }}>
            ANALISI COMPLETATA
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.4px", marginBottom: 16 }}>
            {elaborati.length} documenti classificati
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Lavoratori", value: nLavoratori, color: "#60a5fa" },
              { label: "Doc aziendali", value: docAziendali.length, color: "#a78bfa" },
              { label: "Classificati", value: elaborati.filter(d => d.stato === "ok").length, color: "#10b981" },
              { label: "Errori", value: docErrore.length, color: docErrore.length > 0 ? "#ef4444" : "#334155" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Documenti aziendali */}
        {docAziendali.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 12 }}>
              DOCUMENTI AZIENDALI — {docAziendali.length}
            </div>
            <div style={{
              background: "#161b27", border: "1px solid #1e2535",
              borderRadius: 12, overflow: "hidden",
            }}>
              {docAziendali.map((doc, i) => (
                <div key={i} style={{
                  padding: "13px 20px",
                  borderBottom: i < docAziendali.length - 1 ? "1px solid #1e253540" : "none",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 18 }}>{fileIcon(doc.nomeFile)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>
                      {doc.risultato?.tipo_documento || doc.nomeFile}
                    </div>
                    {doc.risultato?.data_scadenza && (
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                        Scadenza: <strong style={{ color: "#94a3b8" }}>{doc.risultato.data_scadenza}</strong>
                      </div>
                    )}
                  </div>
                  <StatoBadge stato={doc.stato} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per lavoratore */}
        {nLavoratori > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 12 }}>
              LAVORATORI — {nLavoratori}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(perLavoratore).map(([nome, docs]) => (
                <LavoratoreRisultato key={nome} lavoratore={nome} docs={docs} />
              ))}
            </div>
          </div>
        )}

        {/* Errori */}
        {docErrore.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 12 }}>
              NON CLASSIFICATI — {docErrore.length}
            </div>
            <div style={{
              background: "#161b27", border: "1px solid #ef444430",
              borderRadius: 12, overflow: "hidden",
            }}>
              {docErrore.map((doc, i) => (
                <div key={i} style={{
                  padding: "12px 20px",
                  borderBottom: i < docErrore.length - 1 ? "1px solid #1e253540" : "none",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{doc.nomeFile}</div>
                    <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>
                      {doc.risultato?.errore || "Documento non leggibile"}
                    </div>
                  </div>
                  <button style={{
                    padding: "5px 12px", background: "#1e2535",
                    border: "1px solid #334155", borderRadius: 6,
                    color: "#64748b", fontSize: 11, cursor: "pointer",
                  }}>Ricarica</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{
          padding: "16px 20px", background: "#161b27",
          border: "1px solid #1e2535", borderRadius: 10,
          fontSize: 12, color: "#475569", marginBottom: 20, lineHeight: 1.6,
        }}>
          🔒 Dati cifrati e accessibili solo a <strong style={{ color: "#94a3b8" }}>{APPALTO.committente}</strong> · GDPR 2016/679
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => { setStep("upload"); setFiles([]); setElaborati([]); }}
            style={{
              flex: 1, padding: "12px",
              background: "#161b27", border: "1px solid #1e2535",
              borderRadius: 9, color: "#64748b", fontSize: 13, cursor: "pointer",
            }}>← Ricarica file</button>
          <button
            onClick={() => setStep("inviato")}
            style={{
              flex: 2, padding: "12px",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              border: "none", borderRadius: 9,
              color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer",
            }}>✓ Conferma e invia</button>
        </div>
      </div>
    );
  }

  // ── STEP: INVIATO ───────────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: "#0f1117", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, color: "#e2e8f0",
    }}>
      <div style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px",
          background: "linear-gradient(135deg, #10b981, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32,
        }}>✓</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px", marginBottom: 10 }}>
          Documentazione inviata
        </div>
        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 32 }}>
          {APPALTO.committente} riceverà notifica e verificherà i documenti.
          Ti contatteremo se necessario integrare qualcosa.
        </div>
        <div style={{
          background: "#161b27", border: "1px solid #1e2535",
          borderRadius: 12, padding: "20px 24px", textAlign: "left",
        }}>
          {[
            ["Appalto", APPALTO.id],
            ["Documenti inviati", elaborati.filter(d => d.stato === "ok").length],
            ["Lavoratori", Object.keys(perLavoratore).length],
            ["Data invio", new Date().toLocaleDateString("it-IT")],
          ].map(([k, v], i, arr) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: i < arr.length - 1 ? "1px solid #1e253560" : "none",
              fontSize: 13,
            }}>
              <span style={{ color: "#475569" }}>{k}</span>
              <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, fontSize: 11, color: "#334155" }}>
          Puoi chiudere questa finestra · SafetyAI
        </div>
      </div>
    </div>
  );
}
