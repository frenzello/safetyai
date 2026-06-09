import { useState, useRef } from "react";

// QR code via API pubblica (no dipendenze extra)
function qrUrl(testo, size = 120) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(testo)}&bgcolor=ffffff&color=000000&margin=4`;
}

// Formato CR80: 85.6mm × 54mm
// A 96dpi: ~323 × 204px — usiamo 2x per qualità stampa: 646 × 408px
const BADGE_W = 323;
const BADGE_H = 204;

const PRESET_COLORI = [
  { nome: "Blu professionale", primario: "#1a3c6e", secondario: "#2a6ef5", testo: "#ffffff" },
  { nome: "Verde sicurezza", primario: "#14532d", secondario: "#16a34a", testo: "#ffffff" },
  { nome: "Antracite", primario: "#1c1f2e", secondario: "#475569", testo: "#ffffff" },
  { nome: "Rosso cantiere", primario: "#7f1d1d", secondario: "#dc2626", testo: "#ffffff" },
  { nome: "Personalizzato", primario: null, secondario: null, testo: null },
];

function BadgeFrente({ lavoratore, azienda, config, stampa = false }) {
  const sc = stampa ? 2 : 1;
  const w = BADGE_W * sc;
  const h = BADGE_H * sc;
  const f = stampa ? 2 : 1; // fattore font

  const qrData = JSON.stringify({
    nome: lavoratore.nome,
    cf: lavoratore.cf,
    azienda: lavoratore.datoreLavoro,
    safetyai: "verifica-documenti",
  });

  return (
    <div style={{
      width: w, height: h,
      background: config.primario,
      borderRadius: stampa ? 0 : 8,
      overflow: "hidden",
      position: "relative",
      fontFamily: "'DM Sans', sans-serif",
      flexShrink: 0,
      boxShadow: stampa ? "none" : "0 8px 32px rgba(0,0,0,.4)",
    }}>
      {/* Striscia colorata superiore */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: h * 0.38,
        background: config.secondario,
      }} />

      {/* Striscia diagonale decorativa */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 0, height: 0,
        borderStyle: "solid",
        borderWidth: `${h * 0.38}px ${w * 0.25}px 0 0`,
        borderColor: `${config.primario} transparent transparent transparent`,
      }} />

      {/* Logo / nome azienda in alto */}
      <div style={{
        position: "absolute", top: 8 * sc, left: 12 * sc, right: 80 * sc,
        display: "flex", alignItems: "center", gap: 6 * sc,
      }}>
        {config.logo ? (
          <img src={config.logo} alt="logo" style={{ height: 24 * sc, maxWidth: 80 * sc, objectFit: "contain" }} />
        ) : (
          <div style={{
            fontSize: 9 * f, fontWeight: 800, color: "#fff",
            lineHeight: 1.2, letterSpacing: ".3px",
            textTransform: "uppercase", opacity: .95,
          }}>
            {azienda?.nome || "Azienda"}
          </div>
        )}
      </div>

      {/* TESSERINO label */}
      <div style={{
        position: "absolute", top: 8 * sc, right: 10 * sc,
        fontSize: 6 * f, fontWeight: 700, color: "rgba(255,255,255,.7)",
        letterSpacing: "1px", textTransform: "uppercase",
      }}>
        TESSERINO
      </div>

      {/* Foto placeholder */}
      <div style={{
        position: "absolute",
        top: h * 0.32,
        left: 14 * sc,
        width: 52 * sc, height: 64 * sc,
        background: lavoratore.foto ? "transparent" : "rgba(255,255,255,.12)",
        border: `2px solid ${config.secondario}`,
        borderRadius: 4 * sc,
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {lavoratore.foto ? (
          <img src={lavoratore.foto} alt="foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22 * sc, opacity: .4 }}>👤</div>
          </div>
        )}
      </div>

      {/* Dati lavoratore */}
      <div style={{
        position: "absolute",
        top: h * 0.34,
        left: 76 * sc,
        right: 40 * sc,
      }}>
        <div style={{
          fontSize: 11 * f, fontWeight: 800, color: config.testo,
          lineHeight: 1.2, marginBottom: 4 * sc,
          letterSpacing: "-.2px",
        }}>
          {lavoratore.nome || "Nome Cognome"}
        </div>
        <div style={{ fontSize: 8 * f, color: "rgba(255,255,255,.7)", marginBottom: 3 * sc }}>
          {lavoratore.mansione || "Mansione"}
        </div>
        <div style={{
          fontSize: 7 * f, color: "rgba(255,255,255,.6)",
          lineHeight: 1.5,
        }}>
          <div>Nato il: {lavoratore.dataNascita || "—"}</div>
          <div>Assunto il: {lavoratore.dataAssunzione || "—"}</div>
          {lavoratore.cf && <div style={{ fontFamily: "monospace", fontSize: 6.5 * f }}>CF: {lavoratore.cf}</div>}
        </div>
      </div>

      {/* Datore di lavoro */}
      <div style={{
        position: "absolute",
        bottom: 10 * sc, left: 76 * sc, right: 40 * sc,
        fontSize: 7 * f, color: "rgba(255,255,255,.55)",
        lineHeight: 1.3,
      }}>
        <span style={{ color: "rgba(255,255,255,.4)" }}>Datore di lavoro: </span>
        <span style={{ color: "rgba(255,255,255,.75)", fontWeight: 600 }}>{lavoratore.datoreLavoro || azienda?.nome || "—"}</span>
      </div>

      {/* QR code */}
      <div style={{
        position: "absolute",
        bottom: 8 * sc, right: 8 * sc,
        width: 36 * sc, height: 36 * sc,
        background: "#fff",
        borderRadius: 3 * sc,
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img
          src={qrUrl(qrData, 80)}
          alt="QR"
          style={{ width: "100%", height: "100%" }}
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}

function BadgeRetro({ lavoratore, azienda, config, stampa = false }) {
  const sc = stampa ? 2 : 1;
  const w = BADGE_W * sc;
  const h = BADGE_H * sc;
  const f = stampa ? 2 : 1;

  return (
    <div style={{
      width: w, height: h,
      background: "#f8f8f6",
      borderRadius: stampa ? 0 : 8,
      overflow: "hidden",
      position: "relative",
      fontFamily: "'DM Sans', sans-serif",
      flexShrink: 0,
      boxShadow: stampa ? "none" : "0 8px 32px rgba(0,0,0,.4)",
    }}>
      {/* Bordo colorato sinistro */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0,
        width: 6 * sc,
        background: config.secondario,
      }} />

      {/* Bordo superiore */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 4 * sc,
        background: config.primario,
      }} />

      {/* Contenuto */}
      <div style={{ padding: `${14 * sc}px ${14 * sc}px ${10 * sc}px ${16 * sc}px` }}>

        {/* Titolo normativa */}
        <div style={{
          fontSize: 7 * f, fontWeight: 800, color: config.primario,
          letterSpacing: "1px", textTransform: "uppercase",
          marginBottom: 10 * sc,
        }}>
          Tesserino di riconoscimento — Art. 26 c.8 D.Lgs. 81/2008
        </div>

        {/* Righe dati */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 * sc }}>
          {[
            ["Cognome e nome", lavoratore.nome],
            ["Data di nascita", lavoratore.dataNascita],
            ["Qualifica / mansione", lavoratore.mansione],
            ["Datore di lavoro", lavoratore.datoreLavoro || azienda?.nome],
            ["Data di assunzione", lavoratore.dataAssunzione],
            lavoratore.piva ? ["Partita IVA (autonomo)", lavoratore.piva] : null,
            lavoratore.patentaCrediti ? ["Patente a crediti", lavoratore.patentaCrediti] : null,
          ].filter(Boolean).map(([label, valore], i) => (
            <div key={i} style={{ display: "flex", gap: 8 * sc, alignItems: "baseline" }}>
              <div style={{
                fontSize: 6.5 * f, color: "#64748b", fontWeight: 600,
                minWidth: 90 * sc, letterSpacing: ".2px",
              }}>
                {label}:
              </div>
              <div style={{
                fontSize: 7.5 * f, color: "#1e293b", fontWeight: 700,
                flex: 1,
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: 1 * sc,
              }}>
                {valore || "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute", bottom: 8 * sc, left: 16 * sc, right: 16 * sc,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontSize: 6 * f, color: "#94a3b8" }}>
          {azienda?.nome} · SafetyAI
        </div>
        <div style={{
          fontSize: 6 * f, fontWeight: 700, color: config.secondario,
          padding: `${2 * sc}px ${6 * sc}px`,
          background: `${config.secondario}15`,
          borderRadius: 10 * sc,
        }}>
          🔒 Verifica QR sul fronte
        </div>
      </div>
    </div>
  );
}

export default function ModuloBadge({ azienda }) {
  const [lavoratore, setLavoratore] = useState({
    nome: "",
    dataNascita: "",
    mansione: "",
    datoreLavoro: "",
    dataAssunzione: "",
    cf: "",
    piva: "",
    patentaCrediti: "",
    foto: null,
  });
  const [presetIdx, setPresetIdx] = useState(0);
  const [colorePersonalizzato, setColorePersonalizzato] = useState({
    primario: "#1a3c6e",
    secondario: "#2a6ef5",
    testo: "#ffffff",
  });
  const [logo, setLogo] = useState(null);
  const [vistaRetro, setVistaRetro] = useState(false);
  const fotoRef = useRef();
  const logoRef = useRef();
  const printRef = useRef();

  const preset = PRESET_COLORI[presetIdx];
  const config = {
    primario: preset.primario ?? colorePersonalizzato.primario,
    secondario: preset.secondario ?? colorePersonalizzato.secondario,
    testo: preset.testo ?? colorePersonalizzato.testo,
    logo,
  };

  function caricaFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLavoratore(l => ({ ...l, foto: ev.target.result }));
    reader.readAsDataURL(file);
  }

  function caricaLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogo(ev.target.result);
    reader.readAsDataURL(file);
  }

  function stampa() {
    const w = window.open("", "_blank");
    const fronte = document.getElementById("badge-fronte-print");
    const retro = document.getElementById("badge-retro-print");
    w.document.write(`
      <!DOCTYPE html><html><head>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#fff; font-family:'DM Sans',sans-serif; }
        .pagina { width: 21cm; padding: 1cm; display:flex; flex-direction:column; gap:1cm; }
        .riga { display:flex; gap:1cm; align-items:flex-start; }
        .label { font-size:10px; color:#666; margin-bottom:4px; font-weight:600; }
        @media print {
          @page { size: A4; margin: 1cm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
      </head><body>
      <div class="pagina">
        <div><div class="label">FRONTE</div><div class="riga">${fronte?.outerHTML || ""}</div></div>
        <div><div class="label">RETRO</div><div class="riga">${retro?.outerHTML || ""}</div></div>
      </div>
      <script>window.onload=()=>{window.print();}<\/script>
      </body></html>
    `);
    w.document.close();
  }

  const inputStyle = {
    width: "100%", padding: "8px 11px",
    background: "#0f1117", border: "1px solid #1e2535",
    borderRadius: 7, color: "#cbd5e1", fontSize: 12,
    fontFamily: "inherit", boxSizing: "border-box",
  };
  const labelStyle = {
    fontSize: 10, color: "#64748b", fontWeight: 700,
    display: "block", marginBottom: 4, letterSpacing: ".3px",
  };

  if (!azienda) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "#334155", fontSize: 14 }}>
      Seleziona un'azienda dalla sidebar
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e2e8f0" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>Generatore badge</div>
        <div style={{ fontSize: 13, color: "#475569" }}>Formato CR80 (85.6 × 54 mm) · Art. 26 c.8 D.Lgs. 81/2008</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

        {/* FORM SINISTRA */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Dati lavoratore */}
          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: ".5px", marginBottom: 14 }}>DATI LAVORATORE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>COGNOME E NOME *</label>
                <input value={lavoratore.nome} onChange={e => setLavoratore(l => ({ ...l, nome: e.target.value }))} placeholder="Es. Rossi Marco" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>DATA DI NASCITA</label>
                <input value={lavoratore.dataNascita} onChange={e => setLavoratore(l => ({ ...l, dataNascita: e.target.value }))} placeholder="GG/MM/AAAA" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>CODICE FISCALE</label>
                <input value={lavoratore.cf} onChange={e => setLavoratore(l => ({ ...l, cf: e.target.value.toUpperCase() }))} placeholder="RSSMRC75A01L781K" style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11 }} />
              </div>
              <div>
                <label style={labelStyle}>QUALIFICA / MANSIONE</label>
                <input value={lavoratore.mansione} onChange={e => setLavoratore(l => ({ ...l, mansione: e.target.value }))} placeholder="Es. Carpentiere" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>DATORE DI LAVORO</label>
                <input value={lavoratore.datoreLavoro} onChange={e => setLavoratore(l => ({ ...l, datoreLavoro: e.target.value }))} placeholder={azienda.nome} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>DATA ASSUNZIONE</label>
                <input value={lavoratore.dataAssunzione} onChange={e => setLavoratore(l => ({ ...l, dataAssunzione: e.target.value }))} placeholder="GG/MM/AAAA" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>P.IVA (lav. autonomi)</label>
                <input value={lavoratore.piva} onChange={e => setLavoratore(l => ({ ...l, piva: e.target.value }))} placeholder="Solo se lavoratore autonomo" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>PATENTE A CREDITI</label>
                <input value={lavoratore.patentaCrediti} onChange={e => setLavoratore(l => ({ ...l, patentaCrediti: e.target.value }))} placeholder="Numero patente" style={inputStyle} />
              </div>
            </div>

            {/* Foto */}
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>FOTO LAVORATORE</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div
                  onClick={() => fotoRef.current?.click()}
                  style={{
                    width: 52, height: 64, background: "#0f1117",
                    border: "1px dashed #1e2535", borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", overflow: "hidden", flexShrink: 0,
                  }}>
                  {lavoratore.foto ? <img src={lavoratore.foto} alt="foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, opacity: .3 }}>👤</span>}
                </div>
                <div>
                  <button onClick={() => fotoRef.current?.click()} style={{ padding: "6px 12px", background: "#1e2535", border: "1px solid #334155", borderRadius: 6, color: "#94a3b8", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                    {lavoratore.foto ? "Cambia foto" : "Carica foto"}
                  </button>
                  {lavoratore.foto && <button onClick={() => setLavoratore(l => ({ ...l, foto: null }))} style={{ marginLeft: 6, padding: "6px 10px", background: "transparent", border: "none", color: "#475569", fontSize: 11, cursor: "pointer" }}>✕</button>}
                  <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>JPG o PNG · Formato tessera</div>
                </div>
                <input ref={fotoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={caricaFoto} />
              </div>
            </div>
          </div>

          {/* Stile */}
          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: ".5px", marginBottom: 14 }}>STILE E PERSONALIZZAZIONE</div>

            {/* Preset colori */}
            <label style={labelStyle}>SCHEMA COLORI</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {PRESET_COLORI.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPresetIdx(i)}
                  style={{
                    padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                    background: i === presetIdx ? (p.primario || "#1a3c6e") : "#0f1117",
                    border: `1px solid ${i === presetIdx ? (p.secondario || "#2a6ef5") : "#1e2535"}`,
                    color: i === presetIdx ? "#fff" : "#64748b",
                    fontWeight: i === presetIdx ? 700 : 400,
                  }}>
                  {p.nome}
                </button>
              ))}
            </div>

            {/* Colori personalizzati */}
            {presetIdx === PRESET_COLORI.length - 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>COLORE PRIMARIO</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={colorePersonalizzato.primario} onChange={e => setColorePersonalizzato(c => ({ ...c, primario: e.target.value }))} style={{ width: 36, height: 32, border: "none", borderRadius: 4, cursor: "pointer", background: "transparent" }} />
                    <input value={colorePersonalizzato.primario} onChange={e => setColorePersonalizzato(c => ({ ...c, primario: e.target.value }))} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11 }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>COLORE SECONDARIO</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={colorePersonalizzato.secondario} onChange={e => setColorePersonalizzato(c => ({ ...c, secondario: e.target.value }))} style={{ width: 36, height: 32, border: "none", borderRadius: 4, cursor: "pointer", background: "transparent" }} />
                    <input value={colorePersonalizzato.secondario} onChange={e => setColorePersonalizzato(c => ({ ...c, secondario: e.target.value }))} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11 }} />
                  </div>
                </div>
              </div>
            )}

            {/* Logo */}
            <label style={labelStyle}>LOGO AZIENDA (opzionale)</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {logo ? (
                <img src={logo} alt="logo" style={{ height: 32, maxWidth: 80, objectFit: "contain", background: "#1e2535", borderRadius: 4, padding: 4 }} />
              ) : (
                <div style={{ width: 60, height: 32, background: "#0f1117", border: "1px dashed #1e2535", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, opacity: .3 }}>🏢</div>
              )}
              <button onClick={() => logoRef.current?.click()} style={{ padding: "6px 12px", background: "#1e2535", border: "1px solid #334155", borderRadius: 6, color: "#94a3b8", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                {logo ? "Cambia logo" : "Carica logo"}
              </button>
              {logo && <button onClick={() => setLogo(null)} style={{ background: "transparent", border: "none", color: "#475569", fontSize: 11, cursor: "pointer" }}>✕</button>}
              <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={caricaLogo} />
            </div>
          </div>
        </div>

        {/* ANTEPRIMA DESTRA */}
        <div style={{ position: "sticky", top: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: ".5px", marginBottom: 12 }}>ANTEPRIMA</div>

          {/* Toggle fronte/retro */}
          <div style={{ display: "flex", gap: 4, background: "#161b27", padding: 4, borderRadius: 8, border: "1px solid #1e2535", marginBottom: 16, width: "fit-content" }}>
            {["Fronte", "Retro"].map((label, i) => (
              <button key={i} onClick={() => setVistaRetro(i === 1)} style={{
                padding: "6px 16px", border: "none", borderRadius: 5, cursor: "pointer", fontFamily: "inherit",
                background: vistaRetro === (i === 1) ? "#0f1117" : "transparent",
                color: vistaRetro === (i === 1) ? "#f1f5f9" : "#475569",
                fontSize: 12, fontWeight: vistaRetro === (i === 1) ? 700 : 400,
              }}>{label}</button>
            ))}
          </div>

          {/* Badge anteprima */}
          <div style={{ marginBottom: 16 }}>
            {!vistaRetro ? (
              <BadgeFrente lavoratore={lavoratore} azienda={azienda} config={config} />
            ) : (
              <BadgeRetro lavoratore={lavoratore} azienda={azienda} config={config} />
            )}
          </div>

          {/* Dimensioni reali */}
          <div style={{ fontSize: 11, color: "#334155", marginBottom: 16, textAlign: "center" }}>
            Anteprima 1:1 · Stampa su carta 85.6 × 54 mm (CR80)
          </div>

          {/* Bottone stampa */}
          <button
            onClick={stampa}
            disabled={!lavoratore.nome.trim()}
            style={{
              width: "100%", padding: "12px",
              background: lavoratore.nome.trim() ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "#1e2535",
              border: "none", borderRadius: 9,
              color: lavoratore.nome.trim() ? "white" : "#334155",
              fontSize: 13, fontWeight: 700, cursor: lavoratore.nome.trim() ? "pointer" : "not-allowed",
              fontFamily: "inherit",
            }}>
            🖨️ Stampa badge
          </button>

          {lavoratore.nome && (
            <div style={{ marginTop: 10, fontSize: 11, color: "#334155", textAlign: "center" }}>
              Il browser aprirà la finestra di stampa · Seleziona "Nessun margine"
            </div>
          )}

          {/* Badge nascosti per la stampa */}
          <div style={{ position: "absolute", left: -9999, top: -9999, pointerEvents: "none" }} ref={printRef}>
            <div id="badge-fronte-print"><BadgeFrente lavoratore={lavoratore} azienda={azienda} config={config} stampa /></div>
            <div id="badge-retro-print"><BadgeRetro lavoratore={lavoratore} azienda={azienda} config={config} stampa /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
