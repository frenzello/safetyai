import { useState } from "react";
import {
  leggiDB, salvaDB, genId,
  creaAppalto, creaAppaltatore, creaSubappaltatore,
  eliminaAppaltatore, eliminaSubappaltatore, eliminaAppalto,
} from "./database";

const inputStyle = {
  width: "100%", padding: "9px 12px",
  background: "#0f1117", border: "1px solid #1e2535",
  borderRadius: 7, color: "#cbd5e1", fontSize: 13,
  fontFamily: "inherit", boxSizing: "border-box",
};
const labelStyle = {
  fontSize: 11, color: "#64748b", fontWeight: 700,
  display: "block", marginBottom: 5, letterSpacing: ".3px",
};

function FormAppalto({ aziendaId, onSalva, onAnnulla }) {
  const [form, setForm] = useState({ titolo: "", area: "", dataInizio: "", cseNome: "" });
  function salva() {
    if (!form.titolo.trim()) return;
    const nuovo = creaAppalto(aziendaId, form);
    onSalva(nuovo);
  }
  return (
    <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 16 }}>Nuovo appalto</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>TITOLO LAVORI *</label>
          <input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} placeholder="Es. Sostituzione cuscinetti linea 3" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>AREA / REPARTO</label>
          <input value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="Es. Reparto Formatura" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>DATA INIZIO</label>
          <input type="date" value={form.dataInizio} onChange={e => setForm(f => ({ ...f, dataInizio: e.target.value }))} style={inputStyle} />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>CSE / COORDINATORE</label>
          <input value={form.cseNome} onChange={e => setForm(f => ({ ...f, cseNome: e.target.value }))} placeholder="Nome del coordinatore sicurezza" style={inputStyle} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onAnnulla} style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid #1e2535", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
        <button onClick={salva} disabled={!form.titolo.trim()} style={{ flex: 2, padding: "10px", background: form.titolo.trim() ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "#1e2535", border: "none", borderRadius: 8, color: form.titolo.trim() ? "white" : "#334155", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Crea appalto
        </button>
      </div>
    </div>
  );
}

function FormImpresa({ label, onSalva, onAnnulla }) {
  const [form, setForm] = useState({ nome: "", piva: "", referente: "", email: "", telefono: "" });
  function salva() {
    if (!form.nome.trim()) return;
    onSalva(form);
  }
  return (
    <div style={{ background: "#0f1117", border: "1px solid #1e2535", borderRadius: 10, padding: "16px 18px", marginTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 12 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>RAGIONE SOCIALE *</label>
          <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Es. Edil Rossi S.r.l." style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>PARTITA IVA</label>
          <input value={form.piva} onChange={e => setForm(f => ({ ...f, piva: e.target.value }))} placeholder="12345678901" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>REFERENTE</label>
          <input value={form.referente} onChange={e => setForm(f => ({ ...f, referente: e.target.value }))} placeholder="Nome Cognome" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>EMAIL</label>
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@azienda.it" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>TELEFONO</label>
          <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+39 333 1234567" style={inputStyle} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={onAnnulla} style={{ flex: 1, padding: "8px", background: "transparent", border: "1px solid #1e2535", borderRadius: 7, color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
        <button onClick={salva} disabled={!form.nome.trim()} style={{ flex: 2, padding: "8px", background: form.nome.trim() ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "#1e2535", border: "none", borderRadius: 7, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Aggiungi
        </button>
      </div>
    </div>
  );
}

export default function ModuloAppaltatori({ azienda, onUpdate }) {
  const [showNuovoAppalto, setShowNuovoAppalto] = useState(false);
  const [appaltoAperto, setAppaltoAperto] = useState(null);
  const [showNuovoApp, setShowNuovoApp] = useState(null); // appaltoId
  const [showNuovoSub, setShowNuovoSub] = useState(null); // appaltatoreId
  const [subParent, setSubParent] = useState(null); // { appaltoId, appaltatoreId }

  if (!azienda) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "#334155", fontSize: 14 }}>
      Seleziona un'azienda dalla sidebar
    </div>
  );

  function handleNuovoAppalto(nuovo) {
    onUpdate();
    setShowNuovoAppalto(false);
    setAppaltoAperto(nuovo.id);
  }

  function handleNuovoAppaltatore(appaltoId, dati) {
    creaAppaltatore(azienda.id, appaltoId, dati);
    onUpdate();
    setShowNuovoApp(null);
  }

  function handleNuovoSubappaltatore(appaltoId, appaltatoreId, dati) {
    creaSubappaltatore(azienda.id, appaltoId, appaltatoreId, dati);
    onUpdate();
    setShowNuovoSub(null);
    setSubParent(null);
  }

  function handleEliminaAppaltatore(appaltoId, appaltatoreId) {
    if (!window.confirm("Eliminare questo appaltatore e tutti i suoi lavoratori?")) return;
    eliminaAppaltatore(azienda.id, appaltoId, appaltatoreId);
    onUpdate();
  }

  function handleEliminaSubappaltatore(appaltoId, appaltatoreId, subId) {
    if (!window.confirm("Eliminare questo subappaltatore?")) return;
    eliminaSubappaltatore(azienda.id, appaltoId, appaltatoreId, subId);
    onUpdate();
  }

  function handleEliminaAppalto(appaltoId) {
    if (!window.confirm("Eliminare questo appalto e tutti i suoi dati?")) return;
    eliminaAppalto(azienda.id, appaltoId);
    onUpdate();
    setAppaltoAperto(null);
  }

  const appalti = azienda.appalti || [];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>Appalti e imprese</div>
          <div style={{ fontSize: 13, color: "#475569" }}>{azienda.nome} · {appalti.length} appalti</div>
        </div>
        <button onClick={() => setShowNuovoAppalto(true)} style={{ padding: "10px 18px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 9, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + Nuovo appalto
        </button>
      </div>

      {/* Form nuovo appalto */}
      {showNuovoAppalto && (
        <FormAppalto
          aziendaId={azienda.id}
          onSalva={handleNuovoAppalto}
          onAnnulla={() => setShowNuovoAppalto(false)}
        />
      )}

      {/* Lista appalti vuota */}
      {appalti.length === 0 && !showNuovoAppalto && (
        <div style={{ textAlign: "center", padding: "48px", color: "#334155", fontSize: 14, background: "#161b27", borderRadius: 12, border: "1px solid #1e2535" }}>
          Nessun appalto ancora — creane uno per iniziare ad aggiungere appaltatori e lavoratori
        </div>
      )}

      {/* Appalti */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {appalti.map(ap => {
          const aperto = appaltoAperto === ap.id;
          const totLav = ap.appaltatori.reduce((n, a) => n + a.lavoratori.length + (a.subappaltatori || []).reduce((s, sub) => s + sub.lavoratori.length, 0), 0);

          return (
            <div key={ap.id} style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
              {/* Header appalto */}
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={() => setAppaltoAperto(aperto ? null : ap.id)}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(42,110,245,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📋</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{ap.titolo || "Appalto senza titolo"}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                    {ap.area && `${ap.area} · `}{ap.appaltatori.length} imprese · {totLav} lavoratori
                    {ap.dataInizio && ` · Dal ${new Date(ap.dataInizio).toLocaleDateString("it-IT")}`}
                  </div>
                </div>
                <span style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(16,185,129,.1)", color: "#10b981", fontSize: 10, fontWeight: 700 }}>ATTIVO</span>
                <button onClick={e => { e.stopPropagation(); handleEliminaAppalto(ap.id); }} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 16, padding: "0 4px" }} title="Elimina appalto">✕</button>
                <span style={{ color: "#334155", fontSize: 14 }}>{aperto ? "▾" : "▸"}</span>
              </div>

              {/* Dettaglio appalto */}
              {aperto && (
                <div style={{ borderTop: "1px solid #1e2535", padding: "16px 20px" }}>

                  {/* Bottone aggiungi appaltatore */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: ".5px" }}>IMPRESE APPALTATRICI</div>
                    <button onClick={() => setShowNuovoApp(ap.id)} style={{ padding: "5px 12px", background: "#1e2535", border: "1px solid #334155", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      + Aggiungi impresa
                    </button>
                  </div>

                  {/* Form nuova impresa */}
                  {showNuovoApp === ap.id && (
                    <FormImpresa
                      label="NUOVA IMPRESA APPALTATRICE"
                      onSalva={dati => handleNuovoAppaltatore(ap.id, dati)}
                      onAnnulla={() => setShowNuovoApp(null)}
                    />
                  )}

                  {/* Lista appaltatori */}
                  {ap.appaltatori.length === 0 && showNuovoApp !== ap.id && (
                    <div style={{ padding: "16px", textAlign: "center", color: "#334155", fontSize: 13, background: "#0f1117", borderRadius: 8 }}>
                      Nessuna impresa ancora
                    </div>
                  )}

                  {ap.appaltatori.map(app => (
                    <div key={app.id} style={{ background: "#0f1117", border: "1px solid #1e2535", borderRadius: 9, overflow: "hidden", marginBottom: 8 }}>
                      {/* Appaltatore header */}
                      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(42,110,245,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#60a5fa", flexShrink: 0 }}>
                          {app.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{app.nome}</div>
                          <div style={{ fontSize: 11, color: "#475569" }}>
                            {app.piva && `P.IVA ${app.piva} · `}{app.referente && `${app.referente} · `}{app.lavoratori.length} lavoratori
                          </div>
                        </div>
                        <button
                          onClick={() => { setShowNuovoSub(app.id); setSubParent({ appaltoId: ap.id, appaltatoreId: app.id }); }}
                          style={{ padding: "4px 10px", background: "transparent", border: "1px solid #1e2535", borderRadius: 5, color: "#475569", fontSize: 10, cursor: "pointer", fontFamily: "inherit" }}>
                          + Subappalto
                        </button>
                        <button onClick={() => handleEliminaAppaltatore(ap.id, app.id)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 14 }}>✕</button>
                      </div>

                      {/* Form nuovo subappaltatore */}
                      {showNuovoSub === app.id && subParent?.appaltatoreId === app.id && (
                        <div style={{ padding: "0 16px 16px" }}>
                          <FormImpresa
                            label="NUOVO SUBAPPALTATORE"
                            onSalva={dati => handleNuovoSubappaltatore(ap.id, app.id, dati)}
                            onAnnulla={() => { setShowNuovoSub(null); setSubParent(null); }}
                          />
                        </div>
                      )}

                      {/* Subappaltatori */}
                      {(app.subappaltatori || []).map(sub => (
                        <div key={sub.id} style={{ padding: "10px 16px 10px 40px", borderTop: "1px solid #1e253540", display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#475569", flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{sub.nome}</div>
                            <div style={{ fontSize: 10, color: "#334155" }}>Subappaltatore · {sub.lavoratori.length} lavoratori</div>
                          </div>
                          <button onClick={() => handleEliminaSubappaltatore(ap.id, app.id, sub.id)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 12 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
