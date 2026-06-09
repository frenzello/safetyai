import { useState, useEffect, useCallback } from "react";
import { leggiDB, salvaDB, statoScadenza, giorniAllaScadenza } from "./database";

// ─── COSTANTI ─────────────────────────────────────────────────────────────────
const LOG_KEY = "safetyai_accessi_log";
const STATO_CFG = {
  ok:        { color: "#10b981", bg: "#10b98115", label: "Autorizzato" },
  attenzione:{ color: "#f59e0b", bg: "#f59e0b15", label: "In scadenza" },
  critico:   { color: "#ef4444", bg: "#ef444415", label: "Critico" },
  scaduto:   { color: "#ef4444", bg: "#ef444425", label: "BLOCCATO" },
  nessuna:   { color: "#475569", bg: "#47556915", label: "Permanente" },
};

// ─── HELPERS LOG ──────────────────────────────────────────────────────────────
function leggiLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch { return []; }
}

function salvaLog(log) {
  try {
    // Tieni solo gli ultimi 500 eventi per non saturare localStorage
    const trimmed = log.slice(-500);
    localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
  } catch (e) { console.error("Errore salvataggio log accessi:", e); }
}

function aggiungiEventoLog(evento) {
  const log = leggiLog();
  log.push({ ...evento, id: `acc_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, timestamp: new Date().toISOString() });
  salvaLog(log);
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

// ─── CALCOLA STATO ACCESSO LAVORATORE ────────────────────────────────────────
function calcolaStatoAccesso(lavoratore) {
  if (!lavoratore.attestati || lavoratore.attestati.length === 0) {
    return { abilitato: false, motivo: "Nessun attestato caricato", stato: "scaduto", peggioreSca: null };
  }
  let peggiore = "nessuna";
  let scadutoTipo = null;
  const ord = { scaduto: 0, critico: 1, attenzione: 2, ok: 3, nessuna: 4 };
  for (const att of lavoratore.attestati) {
    const s = statoScadenza(att.scadenza);
    if ((ord[s] ?? 4) < (ord[peggiore] ?? 4)) {
      peggiore = s;
      if (s === "scaduto") scadutoTipo = att.tipo;
    }
  }
  return {
    abilitato: peggiore !== "scaduto",
    motivo: peggiore === "scaduto"
      ? `${scadutoTipo} scaduto`
      : peggiore === "critico"
      ? "Attestato in scadenza imminente"
      : "Documentazione regolare",
    stato: peggiore,
    attestatiScaduti: lavoratore.attestati.filter(a => statoScadenza(a.scadenza) === "scaduto").length,
    attestatiCritici: lavoratore.attestati.filter(a => statoScadenza(a.scadenza) === "critico").length,
  };
}

// ─── RACCOGLIE TUTTI I LAVORATORI DELL'AZIENDA CON CONTESTO ──────────────────
function raccogliLavoratori(azienda) {
  const lista = [];
  for (const ap of azienda.appalti || []) {
    for (const app of ap.appaltatori || []) {
      const imprese = [
        { ent: app, tipo: "Appaltatore", parentNome: null },
        ...(app.subappaltatori || []).map(s => ({ ent: s, tipo: "Subappaltatore", parentNome: app.nome })),
      ];
      for (const { ent, tipo, parentNome } of imprese) {
        for (const lav of ent.lavoratori || []) {
          const statoAcc = calcolaStatoAccesso(lav);
          lista.push({
            lavoratoreId: lav.id,
            nome: lav.nome,
            cf: lav.cf,
            mansione: lav.mansione,
            impresaNome: ent.nome,
            impresaTipo: tipo,
            parentNome,
            appaltoId: ap.id,
            appaltoTitolo: ap.titolo,
            area: ap.area,
            appaltatoreId: app.id,
            attestati: lav.attestati || [],
            ...statoAcc,
          });
        }
      }
    }
  }
  return lista;
}

// ─── MODAL DETTAGLIO LAVORATORE ───────────────────────────────────────────────
function ModalDettaglioLavoratore({ lavoratore, aziendaNome, onChiudi, onRegistraAccesso }) {
  const cfg = STATO_CFG[lavoratore.stato] || STATO_CFG.nessuna;
  const log = leggiLog().filter(e => e.lavoratoreId === lavoratore.lavoratoreId).reverse().slice(0, 20);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "#000000cc",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#161b27", border: "1px solid #1e2535",
        borderRadius: 16, width: "100%", maxWidth: 560,
        maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 24px 60px #00000080",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1e2535", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: `${cfg.color}20`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: cfg.color,
          }}>
            {lavoratore.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>{lavoratore.nome}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
              {lavoratore.mansione || "Mansione non specificata"} · {lavoratore.impresaNome}
            </div>
          </div>
          <button onClick={onChiudi} style={{ background: "none", border: "none", color: "#475569", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Stato accesso */}
          <div style={{ padding: "16px", background: `${cfg.color}12`, border: `1px solid ${cfg.color}30`, borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>{lavoratore.abilitato ? "✅" : "🚫"}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: cfg.color }}>
                {lavoratore.abilitato ? "Accesso autorizzato" : "Accesso BLOCCATO"}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{lavoratore.motivo}</div>
            </div>
          </div>

          {/* Attestati */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.5px", marginBottom: 10 }}>ATTESTATI ({lavoratore.attestati.length})</div>
            {lavoratore.attestati.length === 0 ? (
              <div style={{ fontSize: 12, color: "#334155", padding: "12px", background: "#0f1117", borderRadius: 8 }}>Nessun attestato caricato</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lavoratore.attestati.map((att, i) => {
                  const s = statoScadenza(att.scadenza);
                  const acfg = STATO_CFG[s] || STATO_CFG.nessuna;
                  const gg = giorniAllaScadenza(att.scadenza);
                  return (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "#0f1117", borderRadius: 8, borderLeft: `3px solid ${acfg.color}`, alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>{att.tipo}</div>
                        {att.ente && <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>{att.ente}</div>}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {att.scadenza ? (
                          <>
                            <span style={{ padding: "2px 7px", borderRadius: 12, background: acfg.bg, color: acfg.color, fontSize: 11, fontWeight: 700 }}>{att.scadenza}</span>
                            {gg !== null && (
                              <div style={{ fontSize: 10, color: acfg.color, marginTop: 2 }}>
                                {gg < 0 ? `scaduto ${Math.abs(gg)}gg fa` : `${gg}gg`}
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: "#475569" }}>Permanente</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Registra accesso manuale */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { onRegistraAccesso(lavoratore, "entrata"); onChiudi(); }}
              disabled={!lavoratore.abilitato}
              style={{
                flex: 1, padding: "11px",
                background: lavoratore.abilitato ? "linear-gradient(135deg, #10b981, #059669)" : "#1e2535",
                border: "none", borderRadius: 9,
                color: lavoratore.abilitato ? "white" : "#334155",
                fontSize: 13, fontWeight: 700, cursor: lavoratore.abilitato ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}>
              ↪ Registra entrata
            </button>
            <button
              onClick={() => { onRegistraAccesso(lavoratore, "uscita"); onChiudi(); }}
              style={{
                flex: 1, padding: "11px",
                background: "#1e3a5f",
                border: "1px solid #3b82f630", borderRadius: 9,
                color: "#60a5fa",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit",
              }}>
              ↩ Registra uscita
            </button>
          </div>

          {/* Log recente */}
          {log.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.5px", marginBottom: 8 }}>ULTIME REGISTRAZIONI</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {log.map((ev, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#0f1117", borderRadius: 7, fontSize: 12 }}>
                    <span style={{ color: ev.tipo === "entrata" ? "#10b981" : "#60a5fa" }}>
                      {ev.tipo === "entrata" ? "↪ Entrata" : "↩ Uscita"}
                      {ev.cantiere && <span style={{ color: "#475569", marginLeft: 6 }}>· {ev.cantiere}</span>}
                    </span>
                    <span style={{ color: "#334155" }}>{formatDateTime(ev.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MODAL REGISTRA ACCESSO RAPIDO ────────────────────────────────────────────
function ModalRegistraAccesso({ lavoratore, tipo, onConferma, onAnnulla }) {
  const [nota, setNota] = useState("");
  const cfg = STATO_CFG[lavoratore.stato] || STATO_CFG.nessuna;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 14, width: "100%", maxWidth: 400, padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>
          {tipo === "entrata" ? "↪ Registra entrata" : "↩ Registra uscita"}
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 20 }}>{lavoratore.nome} · {lavoratore.impresaNome}</div>
        {!lavoratore.abilitato && (
          <div style={{ padding: "10px 14px", marginBottom: 16, background: "#ef444412", border: "1px solid #ef444430", borderRadius: 8, fontSize: 12, color: "#fca5a5" }}>
            ⚠️ Attenzione: il lavoratore ha documenti scaduti. La registrazione viene comunque salvata.
          </div>
        )}
        <textarea
          value={nota} onChange={e => setNota(e.target.value)}
          placeholder="Nota opzionale (es. cantiere, gate, motivo...)"
          style={{ width: "100%", padding: "10px 12px", background: "#0f1117", border: "1px solid #1e2535", borderRadius: 8, color: "#cbd5e1", fontSize: 12, fontFamily: "inherit", resize: "vertical", minHeight: 60, boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={onAnnulla} style={{ flex: 1, padding: "11px", background: "#1e2535", border: "1px solid #334155", borderRadius: 9, color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
          <button onClick={() => onConferma(nota)} style={{ flex: 2, padding: "11px", background: tipo === "entrata" ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #3b82f6, #06b6d4)", border: "none", borderRadius: 9, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPALE ────────────────────────────────────────────────────
export default function ModuloAccessi({ azienda }) {
  const [log, setLog] = useState(() => leggiLog());
  const [lavoratoriDB, setLavoratoriDB] = useState([]);
  const [cerca, setCerca] = useState("");
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [filtroAppalto, setFiltroAppalto] = useState("tutti");
  const [vistaLog, setVistaLog] = useState(false);
  const [dettaglio, setDettaglio] = useState(null); // lavoratore selezionato
  const [registrazioneQuick, setRegistrazioneQuick] = useState(null); // { lavoratore, tipo }
  const [toast, setToast] = useState(null);

  const ricarica = useCallback(() => {
    if (!azienda) return;
    setLavoratoriDB(raccogliLavoratori(azienda));
    setLog(leggiLog());
  }, [azienda]);

  useEffect(() => { ricarica(); }, [ricarica]);

  function showToast(msg, color = "#10b981") {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  function handleRegistraAccesso(lavoratore, tipo) {
    setRegistrazioneQuick({ lavoratore, tipo });
  }

  function handleConfermaRegistrazione(nota) {
    const { lavoratore, tipo } = registrazioneQuick;
    aggiungiEventoLog({
      lavoratoreId: lavoratore.lavoratoreId,
      lavoratoreNome: lavoratore.nome,
      impresaNome: lavoratore.impresaNome,
      appaltoTitolo: lavoratore.appaltoTitolo,
      aziendaNome: azienda.nome,
      tipo,
      cantiere: nota || lavoratore.area || lavoratore.appaltoTitolo || "",
      nota,
      statoDocumenti: lavoratore.stato,
      abilitato: lavoratore.abilitato,
    });
    setRegistrazioneQuick(null);
    ricarica();
    showToast(`${tipo === "entrata" ? "Entrata" : "Uscita"} registrata: ${lavoratore.nome}`,
      tipo === "entrata" ? "#10b981" : "#3b82f6");
  }

  if (!azienda) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "#334155", fontSize: 14 }}>
        Seleziona un'azienda dalla sidebar
      </div>
    );
  }

  // Appalti per filtro
  const appalti = azienda.appalti || [];
  const lavFiltrati = lavoratoriDB.filter(l => {
    if (filtroAppalto !== "tutti" && l.appaltoId !== filtroAppalto) return false;
    if (filtroStato === "bloccati" && l.abilitato) return false;
    if (filtroStato === "autorizzati" && !l.abilitato) return false;
    if (filtroStato === "critici" && !["critico", "attenzione"].includes(l.stato)) return false;
    if (cerca) {
      const q = cerca.toLowerCase();
      if (!l.nome.toLowerCase().includes(q) && !l.impresaNome.toLowerCase().includes(q) && !(l.mansione || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Stats
  const totali = lavoratoriDB.length;
  const abilitati = lavoratoriDB.filter(l => l.abilitato).length;
  const bloccati = lavoratoriDB.filter(l => !l.abilitato).length;
  const critici = lavoratoriDB.filter(l => l.abilitato && ["critico", "attenzione"].includes(l.stato)).length;

  // Log filtrato
  const logAzienda = log.filter(e => e.aziendaNome === azienda.nome).reverse().slice(0, 100);

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e2e8f0" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 500, padding: "12px 20px", background: toast.color, borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, boxShadow: "0 8px 24px #00000040" }}>
          {toast.msg}
        </div>
      )}

      {/* Modali */}
      {dettaglio && (
        <ModalDettaglioLavoratore
          lavoratore={dettaglio}
          aziendaNome={azienda.nome}
          onChiudi={() => setDettaglio(null)}
          onRegistraAccesso={(lav, tipo) => { setDettaglio(null); handleRegistraAccesso(lav, tipo); }}
        />
      )}
      {registrazioneQuick && (
        <ModalRegistraAccesso
          lavoratore={registrazioneQuick.lavoratore}
          tipo={registrazioneQuick.tipo}
          onConferma={handleConfermaRegistrazione}
          onAnnulla={() => setRegistrazioneQuick(null)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>Registro Accessi</div>
          <div style={{ fontSize: 13, color: "#475569" }}>{azienda.nome} · {totali} lavoratori registrati</div>
        </div>
        <button
          onClick={() => setVistaLog(!vistaLog)}
          style={{ padding: "9px 16px", background: vistaLog ? "#1e3a5f" : "#161b27", border: `1px solid ${vistaLog ? "#3b82f6" : "#1e2535"}`, borderRadius: 9, color: vistaLog ? "#60a5fa" : "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {vistaLog ? "← Lavoratori" : "📋 Log eventi"}
        </button>
      </div>

      {!vistaLog ? (
        <>
          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Lavoratori", value: totali, color: "#60a5fa" },
              { label: "Autorizzati", value: abilitati, color: "#10b981" },
              { label: "Bloccati", value: bloccati, color: bloccati > 0 ? "#ef4444" : "#334155" },
              { label: "In scadenza", value: critici, color: critici > 0 ? "#f59e0b" : "#334155" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#161b27", border: `1px solid ${s.color}20`, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Alert bloccati */}
          {bloccati > 0 && (
            <div style={{ padding: "12px 18px", marginBottom: 20, background: "#ef444410", border: "1px solid #ef444425", borderRadius: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 18 }}>🚫</span>
              <div style={{ fontSize: 13, color: "#fca5a5" }}>
                <strong style={{ color: "#ef4444" }}>{bloccati} lavoratori bloccati</strong> — documenti scaduti che impediscono l'accesso al cantiere
              </div>
            </div>
          )}

          {/* Filtri */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <input
              value={cerca} onChange={e => setCerca(e.target.value)}
              placeholder="Cerca per nome, impresa, mansione..."
              style={{ flex: 1, minWidth: 200, padding: "9px 14px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, color: "#cbd5e1", fontSize: 13, fontFamily: "inherit" }}
            />
            {["tutti", "autorizzati", "bloccati", "critici"].map(f => (
              <button key={f} onClick={() => setFiltroStato(f)} style={{
                padding: "9px 12px", background: filtroStato === f ? "#1e3a5f" : "#161b27",
                border: `1px solid ${filtroStato === f ? "#3b82f6" : "#1e2535"}`,
                borderRadius: 8, color: filtroStato === f ? "#60a5fa" : "#64748b",
                fontSize: 11, fontWeight: filtroStato === f ? 700 : 400, cursor: "pointer", fontFamily: "inherit",
              }}>
                {f === "tutti" ? "Tutti" : f === "autorizzati" ? "✓ Autorizzati" : f === "bloccati" ? "✗ Bloccati" : "⚠ Critici"}
              </button>
            ))}
            {appalti.length > 1 && (
              <select
                value={filtroAppalto} onChange={e => setFiltroAppalto(e.target.value)}
                style={{ padding: "9px 12px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, color: "#64748b", fontSize: 12, fontFamily: "inherit" }}>
                <option value="tutti">Tutti i cantieri</option>
                {appalti.map(ap => <option key={ap.id} value={ap.id}>{ap.titolo}</option>)}
              </select>
            )}
          </div>

          {/* Lista lavoratori */}
          {lavFiltrati.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "#334155", fontSize: 14 }}>
              {totali === 0
                ? "Nessun lavoratore ancora caricato — vai su \"Carica documenti\""
                : "Nessun risultato per i filtri selezionati"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lavFiltrati.map(lav => {
                const cfg = STATO_CFG[lav.stato] || STATO_CFG.nessuna;
                const ultimoEvento = log.filter(e => e.lavoratoreId === lav.lavoratoreId).at(-1);
                return (
                  <div key={lav.lavoratoreId} style={{
                    background: "#161b27",
                    border: `1px solid ${!lav.abilitato ? "#ef444430" : "#1e2535"}`,
                    borderRadius: 12, padding: "14px 18px",
                    display: "flex", alignItems: "center", gap: 14,
                    borderLeft: `4px solid ${cfg.color}`,
                  }}>
                    {/* Avatar */}
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${cfg.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: cfg.color, flexShrink: 0 }}>
                      {lav.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{lav.nome}</div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span>{lav.impresaNome}</span>
                        {lav.impresaTipo === "Subappaltatore" && <span style={{ color: "#a78bfa" }}>sub</span>}
                        {lav.mansione && <span>· {lav.mansione}</span>}
                        {lav.appaltoTitolo && <span>· 📋 {lav.appaltoTitolo}</span>}
                      </div>
                      {ultimoEvento && (
                        <div style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>
                          Ultimo: {ultimoEvento.tipo === "entrata" ? "↪" : "↩"} {formatDateTime(ultimoEvento.timestamp)}
                        </div>
                      )}
                    </div>

                    {/* Stato + azioni */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      <span style={{ padding: "4px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>
                        {lav.abilitato ? cfg.label : "BLOCCATO"}
                      </span>
                      {lav.attestatiScaduti > 0 && (
                        <span style={{ padding: "3px 7px", borderRadius: 12, background: "#ef444415", color: "#ef4444", fontSize: 10, fontWeight: 700 }}>
                          {lav.attestatiScaduti} scaduti
                        </span>
                      )}
                      <button
                        onClick={() => handleRegistraAccesso(lav, "entrata")}
                        disabled={!lav.abilitato}
                        title={lav.abilitato ? "Registra entrata" : "Accesso bloccato"}
                        style={{ padding: "6px 10px", background: lav.abilitato ? "#10b98120" : "#1e2535", border: `1px solid ${lav.abilitato ? "#10b98140" : "#1e2535"}`, borderRadius: 7, color: lav.abilitato ? "#10b981" : "#334155", fontSize: 12, cursor: lav.abilitato ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                        ↪ In
                      </button>
                      <button
                        onClick={() => handleRegistraAccesso(lav, "uscita")}
                        title="Registra uscita"
                        style={{ padding: "6px 10px", background: "#3b82f610", border: "1px solid #3b82f625", borderRadius: 7, color: "#60a5fa", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        ↩ Out
                      </button>
                      <button
                        onClick={() => setDettaglio(lav)}
                        style={{ padding: "6px 10px", background: "#1e2535", border: "1px solid #334155", borderRadius: 7, color: "#64748b", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        Dettagli
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ── VISTA LOG ──────────────────────────────────────────────── */
        <div>
          <div style={{ marginBottom: 16, fontSize: 13, color: "#475569" }}>
            Ultimi {logAzienda.length} eventi registrati per {azienda.nome}
          </div>
          {logAzienda.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "#334155", fontSize: 14 }}>
              Nessun accesso registrato — usa i pulsanti "In / Out" sui lavoratori
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {logAzienda.map((ev, i) => (
                <div key={ev.id || i} style={{
                  background: "#161b27", border: "1px solid #1e2535",
                  borderRadius: 10, padding: "12px 18px",
                  display: "flex", alignItems: "center", gap: 14,
                  borderLeft: `4px solid ${ev.tipo === "entrata" ? "#10b981" : "#3b82f6"}`,
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{ev.tipo === "entrata" ? "↪" : "↩"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{ev.lavoratoreNome}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                      {ev.impresaNome}
                      {ev.cantiere && <span> · {ev.cantiere}</span>}
                      {!ev.abilitato && <span style={{ color: "#ef4444", marginLeft: 8 }}>⚠ Documenti scaduti al momento</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: ev.tipo === "entrata" ? "#10b981" : "#60a5fa" }}>
                      {ev.tipo === "entrata" ? "Entrata" : "Uscita"}
                    </div>
                    <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{formatDateTime(ev.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
