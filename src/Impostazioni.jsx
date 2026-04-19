import { useState } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const DATI_AZIENDALI_INIT = {
  ragioneSociale: "Vetri Italiani S.r.l.",
  piva: "01234567890",
  codiceFiscale: "01234567890",
  ateco: "23.13",
  indirizzo: "Via dell'Industria 12",
  cap: "37100",
  citta: "Verona",
  provincia: "VR",
  telefono: "045 1234567",
  email: "info@vetriitaliani.it",
  pec: "vetriitaliani@pec.it",
  settore: "Produzione vetro cavo industriale",
  dipendenti: "320",
};

const FIGURE_INIT = {
  dl: { nome: "Giovanni Ferretti", email: "g.ferretti@vetriitaliani.it", telefono: "045 1234568" },
  rspp: { nome: "Marco Albertini", email: "m.albertini@vetriitaliani.it", telefono: "347 1234567", esterno: false },
  mc: { nome: "Dr. Paolo Neri", email: "p.neri@medicinacompetente.it", telefono: "045 9876543", esterno: true },
  rls: { nome: "Stefano Conti", email: "s.conti@vetriitaliani.it", telefono: "045 1234569" },
  aspp: { nome: "Mario Bianchi", email: "m.bianchi@vetriitaliani.it", telefono: "045 1234570" },
};

const AREE_INIT = [
  {
    id: 1, nome: "Forno / Fusione", icona: "🔥", attiva: true,
    descrizione: "Reparto di fusione del vetro a temperatura > 1300°C. Accesso con autorizzazione.",
    rischi: [
      { id: 1, descrizione: "Calore radiante estremo", probabilita: 3, danno: 4, attivo: true },
      { id: 2, descrizione: "Contatto vetro fuso", probabilita: 2, danno: 4, attivo: true },
      { id: 3, descrizione: "Gas combusti e CO", probabilita: 2, danno: 3, attivo: true },
      { id: 4, descrizione: "Esplosione (perdita gas)", probabilita: 1, danno: 4, attivo: true },
      { id: 5, descrizione: "Rumore > 90 dBA", probabilita: 4, danno: 3, attivo: true },
    ],
  },
  {
    id: 2, nome: "Formatura", icona: "⚙️", attiva: true,
    descrizione: "Reparto macchine IS per la formatura del vetro cavo. Produzione continua 24h.",
    rischi: [
      { id: 1, descrizione: "Organi meccanici in movimento (IS)", probabilita: 3, danno: 4, attivo: true },
      { id: 2, descrizione: "Proiezione schegge vetro caldo", probabilita: 3, danno: 3, attivo: true },
      { id: 3, descrizione: "Calore radiante da IS e nastri", probabilita: 3, danno: 2, attivo: true },
      { id: 4, descrizione: "Carri ponte in quota", probabilita: 2, danno: 4, attivo: true },
      { id: 5, descrizione: "Scivolamento pavimento bagnato", probabilita: 3, danno: 2, attivo: true },
      { id: 6, descrizione: "Rumore > 85 dBA", probabilita: 4, danno: 3, attivo: true },
    ],
  },
  {
    id: 3, nome: "Ricottura", icona: "🌡️", attiva: true,
    descrizione: "Tunnel di ricottura lehr fino a 600°C. Nastri trasportatori continui.",
    rischi: [
      { id: 1, descrizione: "Superfici calde (lehr fino 600°C)", probabilita: 3, danno: 3, attivo: true },
      { id: 2, descrizione: "Nastri trasportatori in movimento", probabilita: 2, danno: 3, attivo: true },
      { id: 3, descrizione: "Proiezione frammenti vetro", probabilita: 2, danno: 2, attivo: true },
    ],
  },
  {
    id: 4, nome: "Controllo qualità", icona: "🔍", attiva: true,
    descrizione: "Ispezione automatica e manuale del prodotto finito.",
    rischi: [
      { id: 1, descrizione: "Contatto frammenti vetro", probabilita: 3, danno: 2, attivo: true },
      { id: 2, descrizione: "Macchine automatiche in moto", probabilita: 2, danno: 3, attivo: true },
      { id: 3, descrizione: "Rischio elettrico (quadri, sensori)", probabilita: 2, danno: 3, attivo: true },
    ],
  },
  {
    id: 5, nome: "Pallettizzazione / Magazzino", icona: "📦", attiva: true,
    descrizione: "Pallettizzazione automatica e manuale. Stoccaggio prodotto finito.",
    rischi: [
      { id: 1, descrizione: "Investimento da carrelli elevatori", probabilita: 3, danno: 4, attivo: true },
      { id: 2, descrizione: "Caduta materiale dall'alto", probabilita: 2, danno: 4, attivo: true },
      { id: 3, descrizione: "Movimentazione manuale carichi", probabilita: 3, danno: 2, attivo: true },
      { id: 4, descrizione: "Ribaltamento pallet instabili", probabilita: 2, danno: 3, attivo: true },
    ],
  },
  {
    id: 6, nome: "Esterno / Piazzale", icona: "🏭", attiva: true,
    descrizione: "Aree esterne di carico/scarico e accesso stabilimento.",
    rischi: [
      { id: 1, descrizione: "Traffico interno veicoli pesanti", probabilita: 3, danno: 4, attivo: true },
      { id: 2, descrizione: "Lavori in quota (coperture)", probabilita: 2, danno: 4, attivo: false },
    ],
  },
  {
    id: 7, nome: "Uffici", icona: "🖥️", attiva: true,
    descrizione: "Uffici amministrativi e sala riunioni. Rischio generico d'ufficio.",
    rischi: [
      { id: 1, descrizione: "Rischio generico d'ufficio", probabilita: 1, danno: 1, attivo: true },
    ],
  },
];

const NOTIFICHE_INIT = {
  giorniPreavviso30: true,
  giorniPreavviso15: true,
  giorniPreavviso7: true,
  giornoScadenza: true,
  giornoDopoScadenza: true,
  copiaRspp: true,
  raggruppaPerAppaltatore: false,
  pausaWeekend: true,
  emailRspp: "m.albertini@vetriitaliani.it",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function statoRischio(p, d) {
  const r = p * d;
  if (r >= 9) return { color: "#ef4444", label: "ALTO" };
  if (r >= 4) return { color: "#f59e0b", label: "MEDIO" };
  return { color: "#10b981", label: "BASSO" };
}

function Toggle({ value, onChange, color = "#3b82f6" }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 42, height: 24, borderRadius: 12, cursor: "pointer",
      background: value ? `linear-gradient(135deg, ${color}, #06b6d4)` : "#1e2535",
      position: "relative", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 3, left: value ? 21 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "white", transition: "left 0.2s",
        boxShadow: "0 1px 3px #00000040",
      }} />
    </div>
  );
}

function Campo({ label, children, hint, half }) {
  return (
    <div style={{ marginBottom: 16, width: half ? "calc(50% - 6px)" : "100%" }}>
      <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 13px",
  background: "#0f1117", border: "1px solid #1e2535",
  borderRadius: 8, color: "#cbd5e1", fontSize: 13,
  boxSizing: "border-box",
};

// ─── SEZIONE DATI AZIENDALI ───────────────────────────────────────────────────
function SezioneDatiAziendali({ dati, setDati }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Dati aziendali</div>
      <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>
        Questi dati vengono inseriti automaticamente nell'intestazione di ogni documento generato.
      </div>

      {/* Logo */}
      <div style={{
        background: "#161b27", border: "1px solid #1e2535",
        borderRadius: 12, padding: "20px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>Logo aziendale</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 10,
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 800, color: "white",
          }}>VI</div>
          <div>
            <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 600, marginBottom: 4 }}>Vetri Italiani S.r.l.</div>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 10 }}>
              Il logo viene inserito in intestazione su tutti i documenti generati (DUVRI, POS, DVR)
            </div>
            <button style={{
              padding: "7px 14px", background: "#1e2535",
              border: "1px solid #334155", borderRadius: 7,
              color: "#94a3b8", fontSize: 12, cursor: "pointer",
            }}>📎 Carica logo (PNG/SVG)</button>
          </div>
        </div>
      </div>

      {/* Dati */}
      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Campo label="Ragione sociale *">
            <input value={dati.ragioneSociale} onChange={e => setDati(p => ({ ...p, ragioneSociale: e.target.value }))} style={inputStyle} />
          </Campo>
          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            <Campo label="P.IVA *" half>
              <input value={dati.piva} onChange={e => setDati(p => ({ ...p, piva: e.target.value }))} style={inputStyle} />
            </Campo>
            <Campo label="Codice ATECO *" half>
              <input value={dati.ateco} onChange={e => setDati(p => ({ ...p, ateco: e.target.value }))} style={inputStyle} />
            </Campo>
          </div>
          <Campo label="Indirizzo stabilimento *">
            <input value={dati.indirizzo} onChange={e => setDati(p => ({ ...p, indirizzo: e.target.value }))} style={inputStyle} />
          </Campo>
          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            <Campo label="CAP" half>
              <input value={dati.cap} onChange={e => setDati(p => ({ ...p, cap: e.target.value }))} style={inputStyle} />
            </Campo>
            <Campo label="Città" half>
              <input value={dati.citta} onChange={e => setDati(p => ({ ...p, citta: e.target.value }))} style={inputStyle} />
            </Campo>
          </div>
          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            <Campo label="Email" half>
              <input value={dati.email} onChange={e => setDati(p => ({ ...p, email: e.target.value }))} style={inputStyle} />
            </Campo>
            <Campo label="PEC" half>
              <input value={dati.pec} onChange={e => setDati(p => ({ ...p, pec: e.target.value }))} style={inputStyle} />
            </Campo>
          </div>
          <div style={{ display: "flex", gap: 12, width: "100%" }}>
            <Campo label="Settore produttivo" half>
              <input value={dati.settore} onChange={e => setDati(p => ({ ...p, settore: e.target.value }))} style={inputStyle} />
            </Campo>
            <Campo label="N. dipendenti" half>
              <input value={dati.dipendenti} onChange={e => setDati(p => ({ ...p, dipendenti: e.target.value }))} style={inputStyle} />
            </Campo>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SEZIONE FIGURE SICUREZZA ─────────────────────────────────────────────────
function SezioneFigure({ figure, setFigure }) {
  const RUOLI = [
    { key: "dl", label: "Datore di lavoro", desc: "Firma il DVR e delega specifiche responsabilità", required: true },
    { key: "rspp", label: "RSPP", desc: "Responsabile Servizio Prevenzione e Protezione", required: true, hasEsterno: true },
    { key: "aspp", label: "ASPP", desc: "Addetto Servizio Prevenzione e Protezione", required: false },
    { key: "mc", label: "Medico Competente", desc: "Sorveglianza sanitaria lavoratori", required: true, hasEsterno: true },
    { key: "rls", label: "RLS", desc: "Rappresentante Lavoratori per la Sicurezza", required: false },
  ];

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Figure della sicurezza</div>
      <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>
        Nomi e contatti inseriti automaticamente nell'intestazione di ogni documento.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {RUOLI.map(ruolo => {
          const fig = figure[ruolo.key] || {};
          return (
            <div key={ruolo.key} style={{
              background: "#161b27", border: "1px solid #1e2535",
              borderRadius: 12, overflow: "hidden",
            }}>
              <div style={{
                padding: "14px 20px", borderBottom: "1px solid #1e2535",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#0f1117",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                    {ruolo.label}
                    {ruolo.required && <span style={{ fontSize: 10, color: "#ef4444" }}>*</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{ruolo.desc}</div>
                </div>
                {ruolo.hasEsterno && (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b", cursor: "pointer" }}>
                    <Toggle
                      value={fig.esterno || false}
                      onChange={v => setFigure(p => ({ ...p, [ruolo.key]: { ...p[ruolo.key], esterno: v } }))}
                      color="#a78bfa"
                    />
                    Esterno
                  </label>
                )}
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Campo label="Nome e cognome" half>
                    <input
                      value={fig.nome || ""}
                      onChange={e => setFigure(p => ({ ...p, [ruolo.key]: { ...p[ruolo.key], nome: e.target.value } }))}
                      style={inputStyle}
                    />
                  </Campo>
                  <Campo label="Email" half>
                    <input
                      value={fig.email || ""}
                      onChange={e => setFigure(p => ({ ...p, [ruolo.key]: { ...p[ruolo.key], email: e.target.value } }))}
                      style={inputStyle}
                    />
                  </Campo>
                  <Campo label="Telefono" half>
                    <input
                      value={fig.telefono || ""}
                      onChange={e => setFigure(p => ({ ...p, [ruolo.key]: { ...p[ruolo.key], telefono: e.target.value } }))}
                      style={inputStyle}
                    />
                  </Campo>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SEZIONE AREE E RISCHI ────────────────────────────────────────────────────
function SezioneAreeRischi({ aree, setAree }) {
  const [areaSelezionata, setAreaSelezionata] = useState(aree[0]?.id);
  const [showNuovoRischio, setShowNuovoRischio] = useState(false);
  const [nuovoRischio, setNuovoRischio] = useState({ descrizione: "", probabilita: 2, danno: 2 });
  const [showNuovaArea, setShowNuovaArea] = useState(false);
  const [nuovaArea, setNuovaArea] = useState({ nome: "", icona: "🏭", descrizione: "" });

  const area = aree.find(a => a.id === areaSelezionata);

  const aggiungiRischio = () => {
    if (!nuovoRischio.descrizione) return;
    setAree(prev => prev.map(a => a.id === areaSelezionata
      ? { ...a, rischi: [...a.rischi, { id: Date.now(), ...nuovoRischio, attivo: true }] }
      : a
    ));
    setNuovoRischio({ descrizione: "", probabilita: 2, danno: 2 });
    setShowNuovoRischio(false);
  };

  const aggiungiArea = () => {
    if (!nuovaArea.nome) return;
    const id = Date.now();
    setAree(prev => [...prev, { id, ...nuovaArea, attiva: true, rischi: [] }]);
    setAreaSelezionata(id);
    setNuovaArea({ nome: "", icona: "🏭", descrizione: "" });
    setShowNuovaArea(false);
  };

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Aree dello stabilimento e rischi</div>
      <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>
        Ogni DUVRI generato includerà automaticamente i rischi dell'area selezionata. Mantieni questa lista aggiornata.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>

        {/* Lista aree */}
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {aree.map(a => (
              <div
                key={a.id}
                onClick={() => setAreaSelezionata(a.id)}
                style={{
                  padding: "10px 14px", cursor: "pointer",
                  background: areaSelezionata === a.id ? "#1e3a5f" : "#161b27",
                  border: `1px solid ${areaSelezionata === a.id ? "#3b82f6" : "#1e2535"}`,
                  borderRadius: 9,
                  display: "flex", alignItems: "center", gap: 10,
                  opacity: a.attiva ? 1 : 0.4,
                }}
              >
                <span style={{ fontSize: 16 }}>{a.icona}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: areaSelezionata === a.id ? "#60a5fa" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
                  <div style={{ fontSize: 10, color: "#334155", marginTop: 1 }}>{a.rischi.filter(r => r.attivo).length} rischi attivi</div>
                </div>
                <Toggle
                  value={a.attiva}
                  onChange={v => setAree(prev => prev.map(x => x.id === a.id ? { ...x, attiva: v } : x))}
                />
              </div>
            ))}
          </div>

          {showNuovaArea ? (
            <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 9, padding: 12 }}>
              <input placeholder="Nome area" value={nuovaArea.nome} onChange={e => setNuovaArea(p => ({ ...p, nome: e.target.value }))} style={{ ...inputStyle, marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 8 }}>
                {["🏭", "🔥", "⚙️", "📦", "🖥️", "🌡️", "🔍"].map(ic => (
                  <button key={ic} onClick={() => setNuovaArea(p => ({ ...p, icona: ic }))} style={{ width: 32, height: 32, background: nuovaArea.icona === ic ? "#3b82f620" : "#0f1117", border: `1px solid ${nuovaArea.icona === ic ? "#3b82f6" : "#1e2535"}`, borderRadius: 6, cursor: "pointer", fontSize: 16 }}>{ic}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => setShowNuovaArea(false)} style={{ flex: 1, padding: "7px", background: "#1e2535", border: "none", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" }}>Annulla</button>
                <button onClick={aggiungiArea} style={{ flex: 1, padding: "7px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 6, color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Aggiungi</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNuovaArea(true)} style={{ width: "100%", padding: "9px", background: "#161b27", border: "1px dashed #334155", borderRadius: 9, color: "#475569", fontSize: 12, cursor: "pointer" }}>
              + Nuova area
            </button>
          )}
        </div>

        {/* Dettaglio area */}
        {area && (
          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
            {/* Header area */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e2535", background: "#0f1117", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{area.icona}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>{area.nome}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{area.descrizione}</div>
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{area.rischi.filter(r => r.attivo).length} rischi attivi</div>
            </div>

            {/* Lista rischi */}
            <div>
              {area.rischi.map((rischio, i) => {
                const sr = statoRischio(rischio.probabilita, rischio.danno);
                return (
                  <div key={rischio.id} style={{
                    padding: "12px 20px",
                    borderBottom: "1px solid #1e253540",
                    display: "flex", alignItems: "center", gap: 12,
                    opacity: rischio.attivo ? 1 : 0.4,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>{rischio.descrizione}</div>
                      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                        {[
                          { label: "P", value: rischio.probabilita },
                          { label: "D", value: rischio.danno },
                        ].map((v, vi) => (
                          <div key={vi} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 10, color: "#475569" }}>{v.label}=</span>
                            <select
                              value={v.value}
                              onChange={e => setAree(prev => prev.map(a => a.id === area.id
                                ? { ...a, rischi: a.rischi.map(r => r.id === rischio.id ? { ...r, [v.label.toLowerCase() === "p" ? "probabilita" : "danno"]: +e.target.value } : r) }
                                : a
                              ))}
                              style={{ width: 44, padding: "2px 4px", background: "#0f1117", border: "1px solid #1e2535", borderRadius: 5, color: "#cbd5e1", fontSize: 11 }}
                            >
                              {[1, 2, 3, 4].map(n => <option key={n}>{n}</option>)}
                            </select>
                          </div>
                        ))}
                        <div style={{
                          padding: "2px 8px", borderRadius: 4,
                          background: `${sr.color}15`, color: sr.color,
                          fontSize: 10, fontWeight: 700,
                        }}>R={rischio.probabilita * rischio.danno} {sr.label}</div>
                      </div>
                    </div>
                    <Toggle
                      value={rischio.attivo}
                      onChange={v => setAree(prev => prev.map(a => a.id === area.id
                        ? { ...a, rischi: a.rischi.map(r => r.id === rischio.id ? { ...r, attivo: v } : r) }
                        : a
                      ))}
                    />
                    <button
                      onClick={() => setAree(prev => prev.map(a => a.id === area.id
                        ? { ...a, rischi: a.rischi.filter(r => r.id !== rischio.id) }
                        : a
                      ))}
                      style={{ background: "none", border: "none", color: "#334155", fontSize: 16, cursor: "pointer" }}>×</button>
                  </div>
                );
              })}
            </div>

            {/* Nuovo rischio */}
            {showNuovoRischio ? (
              <div style={{ padding: "16px 20px", borderTop: "1px solid #1e2535", background: "#0f1117" }}>
                <input
                  placeholder="Descrizione del rischio..."
                  value={nuovoRischio.descrizione}
                  onChange={e => setNuovoRischio(p => ({ ...p, descrizione: e.target.value }))}
                  style={{ ...inputStyle, marginBottom: 10 }}
                />
                <div style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "center" }}>
                  {[
                    { key: "probabilita", label: "Probabilità (P)" },
                    { key: "danno", label: "Danno (D)" },
                  ].map(f => (
                    <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{f.label}:</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[1, 2, 3, 4].map(n => (
                          <button key={n} onClick={() => setNuovoRischio(p => ({ ...p, [f.key]: n }))} style={{
                            width: 32, height: 32, borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700,
                            background: nuovoRischio[f.key] === n ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "#1e2535",
                            border: `1px solid ${nuovoRischio[f.key] === n ? "#3b82f6" : "#1e2535"}`,
                            color: nuovoRischio[f.key] === n ? "white" : "#475569",
                          }}>{n}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{
                    padding: "4px 10px", borderRadius: 6,
                    background: `${statoRischio(nuovoRischio.probabilita, nuovoRischio.danno).color}15`,
                    color: statoRischio(nuovoRischio.probabilita, nuovoRischio.danno).color,
                    fontSize: 12, fontWeight: 700,
                  }}>R={nuovoRischio.probabilita * nuovoRischio.danno}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowNuovoRischio(false)} style={{ flex: 1, padding: "9px", background: "#1e2535", border: "none", borderRadius: 7, color: "#64748b", fontSize: 12, cursor: "pointer" }}>Annulla</button>
                  <button onClick={aggiungiRischio} disabled={!nuovoRischio.descrizione} style={{ flex: 2, padding: "9px", background: nuovoRischio.descrizione ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "#1e2535", border: "none", borderRadius: 7, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Aggiungi rischio</button>
                </div>
              </div>
            ) : (
              <div style={{ padding: "12px 20px", borderTop: "1px solid #1e2535" }}>
                <button onClick={() => setShowNuovoRischio(true)} style={{ width: "100%", padding: "9px", background: "transparent", border: "1px dashed #334155", borderRadius: 8, color: "#475569", fontSize: 12, cursor: "pointer" }}>
                  + Aggiungi rischio
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SEZIONE NOTIFICHE ────────────────────────────────────────────────────────
function SezioneNotifiche({ config, setConfig }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Configurazione notifiche</div>
      <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>
        Regole di invio automatico per le scadenze documentali.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e2535", fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>Avvisi prima della scadenza</div>
          <div style={{ padding: "14px 18px" }}>
            {[
              { key: "giorniPreavviso30", label: "30 giorni prima", desc: "Primo avviso — tempo per organizzare il rinnovo" },
              { key: "giorniPreavviso15", label: "15 giorni prima", desc: "Secondo avviso — sollecito" },
              { key: "giorniPreavviso7",  label: "7 giorni prima",  desc: "Terzo avviso — urgente" },
              { key: "giornoScadenza",    label: "Giorno di scadenza", desc: "Avviso finale — accesso bloccato il giorno dopo" },
              { key: "giornoDopoScadenza", label: "Giorno dopo scadenza", desc: "Notifica blocco accesso avvenuto" },
            ].map((opt, i) => (
              <div key={opt.key} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "10px 0",
                borderBottom: i < 4 ? "1px solid #1e253540" : "none",
              }}>
                <Toggle value={config[opt.key]} onChange={v => setConfig(p => ({ ...p, [opt.key]: v }))} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e2535", fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>Opzioni invio</div>
            <div style={{ padding: "14px 18px" }}>
              {[
                { key: "copiaRspp", label: "Copia al RSPP", desc: "Ogni notifica inviata anche al RSPP committente" },
                { key: "raggruppaPerAppaltatore", label: "Raggruppa per appaltatore", desc: "Una sola email riepilogativa per appaltatore" },
                { key: "pausaWeekend", label: "Pausa nel weekend", desc: "Non inviare sabato e domenica" },
              ].map((opt, i) => (
                <div key={opt.key} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "10px 0",
                  borderBottom: i < 2 ? "1px solid #1e253540" : "none",
                }}>
                  <Toggle value={config[opt.key]} onChange={v => setConfig(p => ({ ...p, [opt.key]: v }))} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 10 }}>Email di copia RSPP</div>
            <input
              value={config.emailRspp}
              onChange={e => setConfig(p => ({ ...p, emailRspp: e.target.value }))}
              style={inputStyle}
            />
            <div style={{ fontSize: 10, color: "#334155", marginTop: 6 }}>
              Le notifiche vengono inviate all'appaltatore e in copia a questo indirizzo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SEZIONE UTENTI ───────────────────────────────────────────────────────────
function SezioneUtenti() {
  const [utenti] = useState([
    { id: 1, nome: "Marco Albertini", email: "m.albertini@vetriitaliani.it", ruolo: "Admin", ultimoAccesso: "19/04/2026 08:32", attivo: true },
    { id: 2, nome: "Mario Bianchi",   email: "m.bianchi@vetriitaliani.it",   ruolo: "ASPP",  ultimoAccesso: "19/04/2026 09:15", attivo: true },
    { id: 3, nome: "Luigi Conti",     email: "l.conti@vetriitaliani.it",     ruolo: "Viewer", ultimoAccesso: "15/04/2026 14:22", attivo: true },
    { id: 4, nome: "Anna Rossi",      email: "a.rossi@vetriitaliani.it",     ruolo: "Preposto", ultimoAccesso: "10/04/2026 11:00", attivo: false },
  ]);

  const RUOLO_CFG = {
    Admin:    { color: "#3b82f6", bg: "#3b82f615" },
    ASPP:     { color: "#10b981", bg: "#10b98115" },
    Preposto: { color: "#f59e0b", bg: "#f59e0b15" },
    Viewer:   { color: "#64748b", bg: "#64748b15" },
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Utenti e permessi</div>
          <div style={{ fontSize: 12, color: "#475569" }}>Gestisci chi può accedere al gestionale e con quali permessi.</div>
        </div>
        <button style={{ padding: "8px 16px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 8, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          + Invita utente
        </button>
      </div>

      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 200px 130px 160px 60px",
          padding: "10px 20px", borderBottom: "1px solid #1e2535",
          fontSize: 10, color: "#334155", fontWeight: 700, letterSpacing: "0.5px",
        }}>
          <span>UTENTE</span><span>EMAIL</span><span>RUOLO</span><span>ULTIMO ACCESSO</span><span style={{ textAlign: "right" }}>STATO</span>
        </div>
        {utenti.map((u, i) => {
          const cfg = RUOLO_CFG[u.ruolo] || RUOLO_CFG.Viewer;
          return (
            <div key={u.id} style={{
              display: "grid", gridTemplateColumns: "1fr 200px 130px 160px 60px",
              padding: "13px 20px",
              borderBottom: i < utenti.length - 1 ? "1px solid #1e253540" : "none",
              alignItems: "center", opacity: u.attivo ? 1 : 0.5,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{u.nome}</div>
              <div style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
              <span style={{ padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, width: "fit-content" }}>{u.ruolo}</span>
              <div style={{ fontSize: 11, color: "#334155", fontFamily: "monospace" }}>{u.ultimoAccesso}</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: u.attivo ? "#10b981" : "#334155", boxShadow: u.attivo ? "0 0 6px #10b981" : "none", marginLeft: "auto" }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, padding: "12px 16px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 9 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>LIVELLI DI ACCESSO</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { ruolo: "Admin", desc: "Accesso completo + impostazioni tenant" },
            { ruolo: "ASPP", desc: "Genera documenti, gestisce appalti e lavoratori" },
            { ruolo: "Preposto", desc: "Verifica accessi e documenti scaduti" },
            { ruolo: "Viewer", desc: "Solo lettura su tutti i moduli" },
          ].map((r, i) => {
            const cfg = RUOLO_CFG[r.ruolo];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <span style={{ padding: "2px 8px", borderRadius: 10, background: cfg.bg, color: cfg.color, fontWeight: 700 }}>{r.ruolo}</span>
                <span style={{ color: "#334155" }}>{r.desc}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ImpostazioniTenant() {
  const [sezione, setSezione] = useState("azienda");
  const [datiAziendali, setDatiAziendali] = useState(DATI_AZIENDALI_INIT);
  const [figure, setFigure] = useState(FIGURE_INIT);
  const [aree, setAree] = useState(AREE_INIT);
  const [notifiche, setNotifiche] = useState(NOTIFICHE_INIT);
  const [salvato, setSalvato] = useState(false);

  const SEZIONI = [
    { id: "azienda",   icon: "🏢", label: "Dati aziendali" },
    { id: "figure",    icon: "👷", label: "Figure sicurezza" },
    { id: "aree",      icon: "🗺️", label: "Aree e rischi" },
    { id: "notifiche", icon: "📧", label: "Notifiche" },
    { id: "utenti",    icon: "👥", label: "Utenti e permessi" },
  ];

  const handleSalva = () => {
    setSalvato(true);
    setTimeout(() => setSalvato(false), 3000);
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", minHeight: "100vh", color: "#e2e8f0" }}>

      {/* Header */}
      <div style={{
        padding: "20px 32px", borderBottom: "1px solid #1e2535",
        background: "#161b27", display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.3px" }}>Impostazioni</div>
          <div style={{ fontSize: 11, color: "#334155", marginTop: 1 }}>Configurazione tenant — Vetri Italiani S.r.l.</div>
        </div>
        <button
          onClick={handleSalva}
          style={{
            padding: "9px 20px",
            background: salvato ? "linear-gradient(135deg,#10b981,#06b6d4)" : "linear-gradient(135deg,#3b82f6,#06b6d4)",
            border: "none", borderRadius: 9,
            color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
            transition: "background 0.3s",
          }}>
          {salvato ? "✓ Salvato!" : "Salva modifiche"}
        </button>
      </div>

      <div style={{ display: "flex" }}>

        {/* Sidebar sezioni */}
        <div style={{ width: 220, borderRight: "1px solid #1e2535", background: "#161b27", minHeight: "calc(100vh - 65px)", padding: "16px 0", flexShrink: 0 }}>
          {SEZIONI.map(s => (
            <button key={s.id} onClick={() => setSezione(s.id)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 20px", background: sezione === s.id ? "#1e3a5f22" : "transparent",
              border: "none", borderLeft: `2px solid ${sezione === s.id ? "#3b82f6" : "transparent"}`,
              color: sezione === s.id ? "#60a5fa" : "#64748b",
              fontSize: 13, fontWeight: sezione === s.id ? 700 : 400, cursor: "pointer", textAlign: "left",
            }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>{s.label}
            </button>
          ))}
        </div>

        {/* Contenuto */}
        <div style={{ flex: 1, padding: 32, overflowY: "auto", maxHeight: "calc(100vh - 65px)" }}>
          {sezione === "azienda"   && <SezioneDatiAziendali dati={datiAziendali} setDati={setDatiAziendali} />}
          {sezione === "figure"    && <SezioneFigure figure={figure} setFigure={setFigure} />}
          {sezione === "aree"      && <SezioneAreeRischi aree={aree} setAree={setAree} />}
          {sezione === "notifiche" && <SezioneNotifiche config={notifiche} setConfig={setNotifiche} />}
          {sezione === "utenti"    && <SezioneUtenti />}
        </div>
      </div>
    </div>
  );
}
