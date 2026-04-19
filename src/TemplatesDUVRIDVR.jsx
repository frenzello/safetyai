import { useState, useRef } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const TEMPLATES_DUVRI_INIZIALI = [
  {
    id: 1,
    nome: "DUVRI Manutenzione Meccanica — Feb 2026",
    file: "DUVRI_Manutenzione_Feb2026.pdf",
    dimensione: "312 KB",
    caricato: "28/02/2026",
    stato: "analizzato",
    analisi: {
      intestazione: "Intestazione a tre colonne: logo aziendale a sinistra, titolo 'DOCUMENTO UNICO DI VALUTAZIONE DEI RISCHI DA INTERFERENZA' centrato in maiuscolo grassetto, codice documento e revisione a destra",
      piePagina: "«Vetri Italiani S.r.l. — Documento riservato» a sinistra, numero pagina centrato, data emissione a destra",
      struttura: [
        "Copertina con dati committente e appaltatore",
        "Indice del documento",
        "1. Dati identificativi committente",
        "2. Dati identificativi appaltatore",
        "3. Descrizione dei lavori in appalto",
        "4. Rischi specifici del committente (tabella per area)",
        "5. Tabella valutazione rischi da interferenza (P × D = R)",
        "6. Misure di prevenzione committente",
        "7. Misure di prevenzione appaltatore",
        "8. DPI obbligatori per area con norma EN",
        "9. Gestione emergenze",
        "10. Stima costi sicurezza",
        "11. Firme e data",
      ],
      tono: "Formale e tecnico, riferimenti normativi espliciti, uso estensivo di tabelle per rischi, linguaggio diretto e prescrittivo",
      font: "Arial 10pt corpo testo, Arial Bold 11pt titoli sezione, Arial 9pt nelle tabelle",
      colori: "Intestazioni sezione su sfondo #1e3a5f (blu scuro) con testo bianco, righe tabella alternate bianco/#f0f4f8, bordi tabella #cccccc",
      tabelle: "Tabella rischi con colonne: N. / Rischio da interferenza / Attività interferenti / P / D / R / Giudizio. Giudizio codificato: verde OK, giallo MEDIO, rosso ALTO",
      note: "Ogni sezione inizia su nuova pagina. Il DUVRI riporta sempre il numero di revisione e la data di ultima modifica in copertina. I costi sicurezza sono dettagliati voce per voce con importo unitario e totale.",
    },
  },
  {
    id: 2,
    nome: "DUVRI Lavori Elettrici — Dic 2025",
    file: "DUVRI_Elettrico_Dic2025.pdf",
    dimensione: "228 KB",
    caricato: "15/12/2025",
    stato: "analizzato",
    analisi: {
      intestazione: "Logo in alto a sinistra, titolo documento in alto al centro, numero documento con revisione in alto a destra. Sotto: tabella dati identificativi con committente e appaltatore affiancati",
      piePagina: "Linea separatrice, poi: nome file a sinistra, 'Pag. X/Y' a destra",
      struttura: [
        "Dati identificativi e riferimenti normativi",
        "Descrizione sintetica dei lavori",
        "Analisi dei rischi presenti nel sito",
        "Rischi da interferenza (tabella compatta)",
        "Misure di coordinamento",
        "DPI richiesti",
        "Procedure di emergenza",
        "Costi della sicurezza",
        "Firme",
      ],
      tono: "Sintetico e diretto, frasi brevi, uso di elenchi puntati per le misure invece di testo discorsivo",
      font: "Calibri 11pt, titoli Calibri Bold 12pt su sfondo colorato",
      colori: "Titoli sezione su sfondo grigio #e8e8e8, testo nero, tabella rischi con colori semaforo nella colonna R",
      tabelle: "Tabella rischi compatta: Pericolo / Area / Rischio interferenziale / Misura. Colonna misura con checkbox stampati",
      note: "Formato più compatto rispetto allo standard, favorisce la leggibilità rapida in cantiere. Include sempre QR code per accesso digitale al documento.",
    },
  },
];

const TEMPLATES_DVR_INIZIALI = [
  {
    id: 1,
    nome: "DVR Reparto Formatura — Rev. 3 — 2025",
    file: "DVR_Formatura_Rev3_2025.pdf",
    dimensione: "1.8 MB",
    caricato: "10/01/2025",
    stato: "analizzato",
    analisi: {
      intestazione: "Logo aziendale + 'DOCUMENTO DI VALUTAZIONE DEI RISCHI' + 'D.Lgs. 81/2008 art. 28' su intestazione fissa in ogni pagina. Prima pagina: tabella di controllo revisioni con data, autore, descrizione modifica",
      piePagina: "Numero di revisione, data, nome file, numero pagina su X totale. Dicitura: 'Documento di proprietà di Vetri Italiani S.r.l. — vietata la riproduzione'",
      struttura: [
        "Copertina con estremi aziendali e tabella revisioni",
        "Indice analitico",
        "1. Dati aziendali e organigramma sicurezza",
        "2. Descrizione del ciclo produttivo",
        "3. Descrizione degli ambienti di lavoro (per reparto)",
        "4. Metodologia di valutazione (matrice P×D)",
        "5. Valutazione rischi per mansione (tabella per ogni mansione)",
        "6. Valutazione rischi specifici (rumore, vibrazioni, chimico, MMC, microclima)",
        "7. Misure di prevenzione e protezione in atto",
        "8. Programma di miglioramento con scadenze",
        "9. Firme e dichiarazioni",
        "Allegati: schede di sicurezza, planimetrie, organigramma",
      ],
      tono: "Molto formale e tecnico, ricco di riferimenti normativi, struttura per mansione con tabelle dedicate, linguaggio prescrittivo",
      font: "Times New Roman 11pt corpo, Arial Bold 12pt titoli principali, Arial 10pt titoli secondari",
      colori: "Titoli principali su sfondo blu #003366 testo bianco, titoli secondari su sfondo azzurro #d6e4f0, tabelle con righe alternate bianco e #f5f5f5",
      tabelle: "Tabella mansioni: Mansione / Attività / Fattore di rischio / P / D / R / Misure in atto / Misure previste / Scadenza. Matrice colori: R≤4 verde, 4<R≤9 giallo, R>9 rosso",
      note: "Il DVR è strutturato per reparti. Ogni reparto ha una scheda dedicata con planimetria in allegato. Include registro degli aggiornamenti con motivazione della revisione. Le misure di miglioramento hanno sempre un responsabile e una data di scadenza.",
    },
  },
];

// ─── AI ANALISI ───────────────────────────────────────────────────────────────
async function analizzaDocumento(file, tipoDocumento) {
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
    contentParts.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } });
  } else if (isImage) {
    contentParts.push({ type: "image", source: { type: "base64", media_type: file.type, data: base64 } });
  }

  const descrizioni = {
    DUVRI: "Documento Unico di Valutazione dei Rischi da Interferenza (art. 26 D.Lgs. 81/08)",
    DVR: "Documento di Valutazione dei Rischi (art. 28 D.Lgs. 81/08)",
  };

  contentParts.push({
    type: "text",
    text: `Analizza questo ${descrizioni[tipoDocumento]} italiano.
Estrai le caratteristiche di stile e struttura per permettere all'AI di generare futuri documenti nello stesso formato aziendale.

Rispondi SOLO con JSON valido, senza testo aggiuntivo, senza backtick:

{
  "intestazione": "descrizione dettagliata dell'intestazione: posizione logo, titolo, dati aziendali, numero documento, revisione",
  "piePagina": "descrizione del piè di pagina: testo, numero pagina, data, disclaimer",
  "struttura": ["lista ordinata delle sezioni/capitoli del documento"],
  "tono": "stile della scrittura: formale/tecnico/sintetico, uso tabelle/elenchi, riferimenti normativi",
  "font": "font e dimensioni usate se identificabili",
  "colori": "schema colori per intestazioni, tabelle, sfondi sezione",
  "tabelle": "struttura delle tabelle principali con nomi colonne",
  "note": "qualsiasi altra caratteristica stilistica rilevante da replicare nei documenti futuri"
}

Se non è un ${tipoDocumento} o non è leggibile:
{"errore": "descrizione del problema"}`,
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": "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", "anthropic-version": "2023-06-01" },
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

const STATO_CFG = {
  analizzato: { color: "#10b981", bg: "#10b98115", label: "Analizzato", icon: "✓", spin: false },
  analisi:    { color: "#3b82f6", bg: "#3b82f615", label: "In analisi...", icon: "⟳", spin: true },
  errore:     { color: "#ef4444", bg: "#ef444415", label: "Errore lettura", icon: "✗", spin: false },
};

function StatoBadge({ stato }) {
  const cfg = STATO_CFG[stato] || { color: "#475569", bg: "#47556915", label: stato, icon: "·", spin: false };
  return (
    <span style={{
      padding: "3px 9px", borderRadius: 20,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <span style={{ display: "inline-block", animation: cfg.spin ? "spin 0.8s linear infinite" : "none", fontSize: 10 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── MODAL ANALISI ────────────────────────────────────────────────────────────
function ModalAnalisi({ template, onClose }) {
  if (!template) return null;
  const a = template.analisi;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000b0", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 30px 80px #00000080" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1e2535", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
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
            { label: "🔤 Font", value: a.font },
            { label: "🎨 Colori", value: a.colori },
            { label: "📊 Tabelle", value: a.tabelle },
            { label: "💡 Note", value: a.note },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 12, padding: "13px 16px", background: "#0f1117", border: "1px solid #1e2535", borderRadius: 9 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 5 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{item.value || "—"}</div>
            </div>
          ))}
          <div style={{ padding: "13px 16px", background: "#0f1117", border: "1px solid #1e2535", borderRadius: 9 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 10 }}>📋 Struttura sezioni</div>
            {a.struttura?.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "white", marginTop: 1 }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #1e2535", flexShrink: 0 }}>
          <div style={{ padding: "10px 14px", background: "#3b82f610", border: "1px solid #3b82f620", borderRadius: 8, fontSize: 12, color: "#60a5fa", lineHeight: 1.6 }}>
            ⚡ L'AI userà questo stile come riferimento per i prossimi documenti generati — replicando intestazione, struttura delle sezioni e formattazione.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PANNELLO TEMPLATE CONDIVISO ──────────────────────────────────────────────
function PannelloTemplate({ tipo, colore, templates, setTemplates, templateAttivo, setTemplateAttivo }) {
  const [analisiModal, setAnalisiModal] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const analizzati = templates.filter(t => t.stato === "analizzato");
  const templateAttivoObj = templates.find(t => t.id === templateAttivo);

  const handleFiles = async (files) => {
    const lista = Array.from(files).filter(f =>
      f.type === "application/pdf" || f.type.startsWith("image/") ||
      f.name.endsWith(".docx") || f.name.endsWith(".doc")
    );
    if (!lista.length) return;

    for (const file of lista) {
      const id = Date.now() + Math.random();
      const nuovo = {
        id,
        nome: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        file: file.name,
        dimensione: `${Math.round(file.size / 1024)} KB`,
        caricato: new Date().toLocaleDateString("it-IT"),
        stato: "analisi",
        analisi: null,
      };

      setTemplates(prev => [...prev, nuovo]);

      try {
        const analisi = await analizzaDocumento(file, tipo);
        setTemplates(prev => prev.map(t =>
          t.id === id
            ? { ...t, stato: analisi.errore ? "errore" : "analizzato", analisi: analisi.errore ? null : analisi }
            : t
        ));
      } catch {
        setTemplates(prev => prev.map(t =>
          t.id === id ? { ...t, stato: "errore" } : t
        ));
      }
    }
  };

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {analisiModal && <ModalAnalisi template={analisiModal} onClose={() => setAnalisiModal(null)} />}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? colore : "#1e2535"}`,
          borderRadius: 12, padding: "28px 20px",
          textAlign: "center", cursor: "pointer",
          background: dragOver ? `${colore}10` : "#161b27",
          transition: "all 0.2s", marginBottom: 16,
        }}
      >
        <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
        <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>📄</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>
          Trascina {tipo} di esempio
        </div>
        <div style={{ fontSize: 12, color: "#475569" }}>
          PDF, Word o immagine · più file insieme
        </div>
      </div>

      {/* Lista */}
      {templates.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {templates.map(t => (
            <div key={t.id} style={{
              background: "#0f1117",
              border: `1px solid ${t.stato === "analizzato" ? colore + "30" : "#1e2535"}`,
              borderRadius: 10, padding: "13px 16px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{fileIcon(t.file)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.nome}</div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{t.dimensione} · {t.caricato}</div>
              </div>
              <StatoBadge stato={t.stato} />
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {t.stato === "analizzato" && (
                  <button onClick={() => setAnalisiModal(t)} style={{ padding: "5px 10px", background: "#1e2535", border: "1px solid #334155", borderRadius: 6, color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>👁</button>
                )}
                <button onClick={() => {
                  setTemplates(prev => prev.filter(x => x.id !== t.id));
                  if (templateAttivo === t.id) setTemplateAttivo(null);
                }} style={{ padding: "5px 9px", background: "none", border: "1px solid #1e2535", borderRadius: 6, color: "#334155", fontSize: 14, cursor: "pointer" }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selezione template attivo */}
      {analizzati.length > 0 && (
        <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e2535", fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
            Stile di riferimento attivo
          </div>
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {analizzati.map(t => (
              <label key={t.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px",
                background: templateAttivo === t.id ? "#1e3a5f" : "#0f1117",
                border: `1px solid ${templateAttivo === t.id ? colore : "#1e2535"}`,
                borderRadius: 8, cursor: "pointer",
              }}>
                <input type="radio" name={`attivo_${tipo}`} checked={templateAttivo === t.id} onChange={() => setTemplateAttivo(t.id)} style={{ accentColor: colore }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: templateAttivo === t.id ? "#f1f5f9" : "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.nome}</div>
                  <div style={{ fontSize: 10, color: "#334155", marginTop: 1 }}>{t.file}</div>
                </div>
                {templateAttivo === t.id && (
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: `${colore}20`, color: colore, fontWeight: 700 }}>ATTIVO</span>
                )}
              </label>
            ))}
          </div>
          {templateAttivoObj && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid #1e2535" }}>
              <button onClick={() => setAnalisiModal(templateAttivoObj)} style={{ width: "100%", padding: "8px", background: "#0f1117", border: "1px solid #1e2535", borderRadius: 7, color: "#64748b", fontSize: 11, cursor: "pointer" }}>
                👁 Vedi analisi stile documento attivo
              </button>
            </div>
          )}
        </div>
      )}

      {templates.length === 0 && (
        <div style={{ padding: "20px", textAlign: "center", background: "#0f1117", border: "1px dashed #1e2535", borderRadius: 10, fontSize: 12, color: "#334155" }}>
          Nessun template caricato — trascina qui i tuoi {tipo} storici
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function GestioneTemplatesDUVRIDVR() {
  const [tab, setTab] = useState("DUVRI");
  const [templatesDUVRI, setTemplatesDUVRI] = useState(TEMPLATES_DUVRI_INIZIALI);
  const [templatesDVR, setTemplatesDVR] = useState(TEMPLATES_DVR_INIZIALI);
  const [attivosDUVRI, setAttivosDUVRI] = useState(1);
  const [attivosDVR, setAttivosDVR] = useState(1);

  const [modalitaDUVRI, setModalitaDUVRI] = useState("template");
  const [modalitaDVR, setModalitaDVR] = useState("template");

  const TABS = [
    { id: "DUVRI", label: "DUVRI", colore: "#3b82f6", desc: "Documento Unico Valutazione Rischi Interferenziali" },
    { id: "DVR",   label: "DVR",   colore: "#a78bfa", desc: "Documento di Valutazione dei Rischi" },
  ];

  const tabCorrente = TABS.find(t => t.id === tab);
  const templates = tab === "DUVRI" ? templatesDUVRI : templatesDVR;
  const setTemplates = tab === "DUVRI" ? setTemplatesDUVRI : setTemplatesDVR;
  const attivo = tab === "DUVRI" ? attivosDUVRI : attivosDVR;
  const setAttivo = tab === "DUVRI" ? setAttivosDUVRI : setAttivosDVR;
  const modalita = tab === "DUVRI" ? modalitaDUVRI : modalitaDVR;
  const setModalita = tab === "DUVRI" ? setModalitaDUVRI : setModalitaDVR;

  const analizzati = templates.filter(t => t.stato === "analizzato");

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", minHeight: "100vh", padding: 32, color: "#e2e8f0" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.5px", marginBottom: 4 }}>
          Template e stile documenti
        </div>
        <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
          Carica i tuoi DUVRI e DVR storici. L'AI analizzerà intestazione, struttura e stile per replicarli fedelmente.
        </div>
      </div>

      {/* Stats globali */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Template DUVRI", value: templatesDUVRI.length, color: "#3b82f6" },
          { label: "DUVRI analizzati", value: templatesDUVRI.filter(t => t.stato === "analizzato").length, color: "#10b981" },
          { label: "Template DVR", value: templatesDVR.length, color: "#a78bfa" },
          { label: "DVR analizzati", value: templatesDVR.filter(t => t.stato === "analizzato").length, color: "#10b981" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#161b27", border: `1px solid ${s.color}20`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div style={{
        padding: "14px 18px", marginBottom: 24,
        background: "#161b27", border: "1px solid #1e2535",
        borderRadius: 10, display: "flex", gap: 12,
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>⚡</span>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
          <strong style={{ color: "#94a3b8" }}>Come funziona:</strong> carica i documenti già redatti dalla tua azienda.
          L'AI li legge ed estrae intestazione, piè di pagina, struttura delle sezioni, schema colori, struttura delle tabelle e tono della scrittura.
          Quando genererai un nuovo documento, l'AI partirà da questi esempi —
          il risultato sarà un documento nel tuo stile aziendale, non un template generico.
          <strong style={{ color: "#94a3b8" }}> Consigliamo almeno 2-3 documenti per tipo.</strong>
        </div>
      </div>

      {/* Tab selector */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#161b27", padding: 4, borderRadius: 10, border: "1px solid #1e2535", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 24px", border: "none", borderRadius: 7, cursor: "pointer",
            background: tab === t.id ? "#0f1117" : "transparent",
            color: tab === t.id ? t.colore : "#475569",
            fontSize: 13, fontWeight: tab === t.id ? 800 : 400,
            boxShadow: tab === t.id ? "0 1px 4px #00000040" : "none",
            transition: "all 0.15s",
          }}>
            {t.label}
            <span style={{ fontSize: 10, marginLeft: 8, opacity: 0.6 }}>
              {t.id === "DUVRI" ? templatesDUVRI.length : templatesDVR.length} file
            </span>
          </button>
        ))}
      </div>

      {/* Descrizione tab */}
      <div style={{ fontSize: 11, color: "#334155", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: tabCorrente.colore }} />
        {tabCorrente.desc} · {tab === "DUVRI" ? "Art. 26 D.Lgs. 81/08" : "Art. 28 D.Lgs. 81/08"}
      </div>

      {/* Layout a due colonne */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

        {/* Colonna sinistra — pannello upload */}
        <PannelloTemplate
          tipo={tab}
          colore={tabCorrente.colore}
          templates={templates}
          setTemplates={setTemplates}
          templateAttivo={attivo}
          setTemplateAttivo={setAttivo}
        />

        {/* Colonna destra — configurazione */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Modalità generazione */}
          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "13px 18px", borderBottom: "1px solid #1e2535", fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>
              Modalità generazione {tab}
            </div>
            <div style={{ padding: "14px 18px" }}>
              {[
                { id: "template", label: "Replica stile template", desc: "Intestazione, struttura e tono identici al documento di riferimento" },
                { id: "ibrido",   label: "Stile ibrido",           desc: "Struttura dal template, contenuto ottimizzato dall'AI" },
                { id: "libero",   label: "Stile libero",            desc: "Formato standard senza vincoli di stile aziendale" },
              ].map((opt, i) => (
                <label key={opt.id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "10px 0",
                  borderBottom: i < 2 ? "1px solid #1e253540" : "none",
                  cursor: "pointer",
                }}>
                  <input type="radio" name={`modalita_${tab}`} checked={modalita === opt.id} onChange={() => setModalita(opt.id)} style={{ accentColor: tabCorrente.colore, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: modalita === opt.id ? "#f1f5f9" : "#64748b" }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "#334155", marginTop: 2, lineHeight: 1.5 }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Stato configurazione */}
          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 12 }}>STATO CONFIGURAZIONE {tab}</div>
            {[
              { label: "Template caricati", value: templates.length, ok: templates.length > 0 },
              { label: "Analizzati dall'AI", value: analizzati.length, ok: analizzati.length > 0 },
              { label: "Stile attivo", value: attivo ? "✓ Configurato" : "Non selezionato", ok: !!attivo },
              { label: "Modalità", value: modalita === "template" ? "Replica stile" : modalita === "ibrido" ? "Ibrido" : "Libero", ok: true },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? "1px solid #1e253540" : "none", fontSize: 12 }}>
                <span style={{ color: "#475569" }}>{s.label}</span>
                <span style={{ color: s.ok ? "#10b981" : "#f59e0b", fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Pronto / non pronto */}
          <div style={{
            padding: "12px 16px", borderRadius: 9,
            background: analizzati.length > 0 && attivo ? "#10b98112" : "#f59e0b10",
            border: `1px solid ${analizzati.length > 0 && attivo ? "#10b98130" : "#f59e0b20"}`,
            fontSize: 12,
            color: analizzati.length > 0 && attivo ? "#10b981" : "#f59e0b",
            lineHeight: 1.6,
          }}>
            {analizzati.length > 0 && attivo
              ? `✓ Configurazione completa — il prossimo ${tab} generato replicherà lo stile del documento selezionato.`
              : `⚠ Carica almeno un ${tab} e seleziona il documento di riferimento per abilitare la replica dello stile.`
            }
          </div>

          {/* Suggerimento */}
          <div style={{
            padding: "12px 14px",
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: 9, fontSize: 11, color: "#475569", lineHeight: 1.7,
          }}>
            💡 <strong style={{ color: "#64748b" }}>Consiglio:</strong> carica {tab === "DUVRI" ? "DUVRI di tipi diversi (manutenzione meccanica, elettrica, pulizie) per coprire più scenari" : "DVR di reparti diversi per avere uno stile coerente su tutto lo stabilimento"}.
          </div>
        </div>
      </div>
    </div>
  );
}
