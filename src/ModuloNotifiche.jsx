import { useState, useEffect } from "react";
import { tutteLeScadenze, statoScadenza, giorniAllaScadenza } from "./database";

// ─── COSTANTI ─────────────────────────────────────────────────────────────────
const CFG_KEY = "safetyai_notifiche_cfg";
const LOG_NOTIF_KEY = "safetyai_notifiche_log";

const DEFAULT_CFG = {
  attivo: true,
  soglie: { critico: 15, attenzione: 60 },
  email: "",
  frequenza: "settimanale", // giornaliero | settimanale
  includiScaduti: true,
  includiCritici: true,
  includiAttenzione: true,
};

const STATO_CFG = {
  ok:        { color: "#10b981", bg: "#10b98115", label: "Valido" },
  attenzione:{ color: "#f59e0b", bg: "#f59e0b15", label: "In scadenza" },
  critico:   { color: "#ef4444", bg: "#ef444415", label: "Imminente" },
  scaduto:   { color: "#ef4444", bg: "#ef444425", label: "SCADUTO" },
  nessuna:   { color: "#475569", bg: "#47556915", label: "Permanente" },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function leggiCfg() {
  try { return { ...DEFAULT_CFG, ...JSON.parse(localStorage.getItem(CFG_KEY) || "{}") }; }
  catch { return { ...DEFAULT_CFG }; }
}
function salvaCfg(cfg) {
  try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch {}
}
function leggiLogNotifiche() {
  try { return JSON.parse(localStorage.getItem(LOG_NOTIF_KEY) || "[]"); }
  catch { return []; }
}
function salvaLogNotifiche(log) {
  try { localStorage.setItem(LOG_NOTIF_KEY, JSON.stringify(log.slice(-200))); } catch {}
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

// Genera il testo dell'email di riepilogo
function generaTestoEmail(scadenzeUrgenti, aziendaNome) {
  const scaduti = scadenzeUrgenti.filter(s => s.stato === "scaduto");
  const critici = scadenzeUrgenti.filter(s => s.stato === "critico");
  const attenzione = scadenzeUrgenti.filter(s => s.stato === "attenzione");

  let corpo = `SafetyAI — Riepilogo scadenze documentali\n`;
  corpo += `Azienda: ${aziendaNome}\n`;
  corpo += `Data: ${new Date().toLocaleDateString("it-IT")}\n\n`;

  if (scaduti.length > 0) {
    corpo += `🚫 DOCUMENTI SCADUTI (${scaduti.length})\n`;
    corpo += scaduti.map(s => `  • ${s.lavoratoreNome} — ${s.attestatoTipo} [${s.impresaNome}] scaduto il ${s.scadenza}`).join("\n");
    corpo += "\n\n";
  }
  if (critici.length > 0) {
    corpo += `⚠️ SCADENZA IMMINENTE (${critici.length})\n`;
    corpo += critici.map(s => `  • ${s.lavoratoreNome} — ${s.attestatoTipo} scade tra ${s.giorni} giorni (${s.scadenza})`).join("\n");
    corpo += "\n\n";
  }
  if (attenzione.length > 0) {
    corpo += `📋 IN SCADENZA (${attenzione.length})\n`;
    corpo += attenzione.map(s => `  • ${s.lavoratoreNome} — ${s.attestatoTipo} scade tra ${s.giorni} giorni (${s.scadenza})`).join("\n");
    corpo += "\n";
  }
  corpo += `\nAccedi a SafetyAI per gestire le scadenze.\n— Inviato automaticamente da SafetyAI`;
  return corpo;
}

// ─── COMPONENTE ANTEPRIMA EMAIL ───────────────────────────────────────────────
function AnteprimaEmail({ scadenze, aziendaNome, onChiudi }) {
  const urgenti = scadenze.filter(s => ["scaduto", "critico", "attenzione"].includes(s.stato));
  const testo = generaTestoEmail(urgenti, aziendaNome);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #1e2535", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9" }}>Anteprima email notifica</div>
          <button onClick={onChiudi} style={{ background: "none", border: "none", color: "#475569", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ background: "#0f1117", border: "1px solid #1e2535", borderRadius: 10, padding: "16px", fontFamily: "monospace", fontSize: 12, color: "#94a3b8", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
            {testo}
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #1e2535", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onChiudi} style={{ padding: "9px 20px", background: "#1e2535", border: "1px solid #334155", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Chiudi</button>
          <button
            onClick={() => {
              const el = document.createElement("textarea");
              el.value = testo;
              document.body.appendChild(el);
              el.select();
              document.execCommand("copy");
              document.body.removeChild(el);
              onChiudi();
            }}
            style={{ padding: "9px 20px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            📋 Copia testo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPALE ────────────────────────────────────────────────────
export default function ModuloNotifiche({ azienda }) {
  const [cfg, setCfg] = useState(leggiCfg);
  const [logNotifiche, setLogNotifiche] = useState(leggiLogNotifiche);
  const [scadenze, setScadenze] = useState([]);
  const [mostraAnteprima, setMostraAnteprima] = useState(false);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("config"); // config | log

  useEffect(() => {
    if (azienda) setScadenze(tutteLeScadenze(azienda));
  }, [azienda]);

  function showToast(msg, color = "#10b981") {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  function aggiornaCfg(partial) {
    const nuova = { ...cfg, ...partial };
    setCfg(nuova);
    salvaCfg(nuova);
  }

  function simulaInvio() {
    if (!cfg.email) { showToast("Inserisci un indirizzo email prima", "#ef4444"); return; }
    const urgenti = scadenze.filter(s => ["scaduto", "critico", "attenzione"].includes(s.stato));
    if (urgenti.length === 0) { showToast("Nessuna scadenza da notificare al momento", "#f59e0b"); return; }

    // Registra nel log
    const evento = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      email: cfg.email,
      aziendaNome: azienda?.nome || "",
      totale: urgenti.length,
      scaduti: urgenti.filter(s => s.stato === "scaduto").length,
      critici: urgenti.filter(s => s.stato === "critico").length,
      attenzione: urgenti.filter(s => s.stato === "attenzione").length,
      tipo: "manuale",
    };
    const nuovoLog = [evento, ...logNotifiche].slice(0, 50);
    setLogNotifiche(nuovoLog);
    salvaLogNotifiche(nuovoLog);
    setMostraAnteprima(true);
    showToast(`Notifica preparata per ${cfg.email}`);
  }

  if (!azienda) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "#334155", fontSize: 14 }}>
        Seleziona un'azienda dalla sidebar
      </div>
    );
  }

  const urgenti = scadenze.filter(s => ["scaduto", "critico", "attenzione"].includes(s.stato));
  const scaduti = scadenze.filter(s => s.stato === "scaduto");
  const critici = scadenze.filter(s => s.stato === "critico");
  const inAttenzione = scadenze.filter(s => s.stato === "attenzione");

  const inputStyle = {
    padding: "10px 14px", background: "#0f1117",
    border: "1px solid #1e2535", borderRadius: 8,
    color: "#cbd5e1", fontSize: 13, fontFamily: "inherit",
    width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e2e8f0" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 500, padding: "12px 20px", background: toast.color, borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, boxShadow: "0 8px 24px #00000040" }}>
          {toast.msg}
        </div>
      )}

      {mostraAnteprima && (
        <AnteprimaEmail scadenze={scadenze} aziendaNome={azienda.nome} onChiudi={() => setMostraAnteprima(false)} />
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>Notifiche Scadenze</div>
        <div style={{ fontSize: 13, color: "#475569" }}>{azienda.nome} · Configura avvisi automatici</div>
      </div>

      {/* Panoramica urgenze */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Scaduti", value: scaduti.length, color: "#ef4444", icon: "🚫" },
          { label: "Imminenti (≤15gg)", value: critici.length, color: "#ef4444", icon: "⚠️" },
          { label: "In scadenza (≤60gg)", value: inAttenzione.length, color: "#f59e0b", icon: "📋" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#161b27", border: `1px solid ${s.color}20`, borderRadius: 10, padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#161b27", borderRadius: 10, padding: 4, border: "1px solid #1e2535", width: "fit-content" }}>
        {["config", "log"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 18px", background: tab === t ? "#1e3a5f" : "transparent",
            border: `1px solid ${tab === t ? "#3b82f6" : "transparent"}`,
            borderRadius: 7, color: tab === t ? "#60a5fa" : "#64748b",
            fontSize: 12, fontWeight: tab === t ? 700 : 400, cursor: "pointer", fontFamily: "inherit",
          }}>
            {t === "config" ? "⚙ Configurazione" : "📋 Storico invii"}
          </button>
        ))}
      </div>

      {tab === "config" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Attiva/disattiva */}
          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "18px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Notifiche attive</div>
                <div style={{ fontSize: 12, color: "#475569" }}>Abilita il sistema di avvisi per le scadenze documentali</div>
              </div>
              <div
                onClick={() => aggiornaCfg({ attivo: !cfg.attivo })}
                style={{
                  width: 48, height: 26, borderRadius: 13,
                  background: cfg.attivo ? "#3b82f6" : "#1e2535",
                  border: `1px solid ${cfg.attivo ? "#3b82f680" : "#334155"}`,
                  cursor: "pointer", position: "relative", transition: "background .2s",
                }}>
                <div style={{
                  position: "absolute", top: 3,
                  left: cfg.attivo ? 25 : 3,
                  width: 18, height: 18, borderRadius: "50%",
                  background: cfg.attivo ? "white" : "#475569",
                  transition: "left .2s",
                }} />
              </div>
            </div>
          </div>

          {/* Email destinatario */}
          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "18px 24px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>📧 Destinatario notifiche</div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="email"
                value={cfg.email}
                onChange={e => aggiornaCfg({ email: e.target.value })}
                placeholder="tuaemail@esempio.it"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => showToast("Email salvata ✓")}
                style={{ padding: "10px 16px", background: "#10b98120", border: "1px solid #10b98140", borderRadius: 8, color: "#10b981", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                Salva
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 8 }}>
              ⚠️ La funzionalità email automatica richiede il server Node.js attivo. In modalità locale, usa "Simula invio" per generare il testo.
            </div>
          </div>

          {/* Frequenza */}
          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "18px 24px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>🕐 Frequenza invio</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["giornaliero", "settimanale"].map(f => (
                <button key={f} onClick={() => aggiornaCfg({ frequenza: f })} style={{
                  flex: 1, padding: "11px",
                  background: cfg.frequenza === f ? "#1e3a5f" : "#0f1117",
                  border: `1px solid ${cfg.frequenza === f ? "#3b82f6" : "#1e2535"}`,
                  borderRadius: 9, color: cfg.frequenza === f ? "#60a5fa" : "#475569",
                  fontSize: 13, fontWeight: cfg.frequenza === f ? 700 : 400,
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  {f === "giornaliero" ? "📅 Giornaliero" : "📆 Settimanale"}
                </button>
              ))}
            </div>
          </div>

          {/* Soglie */}
          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "18px 24px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>⚙ Soglie di allerta</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>
                  🔴 CRITICO — giorni alla scadenza
                </label>
                <input
                  type="number" min={1} max={30}
                  value={cfg.soglie.critico}
                  onChange={e => aggiornaCfg({ soglie: { ...cfg.soglie, critico: Number(e.target.value) } })}
                  style={{ ...inputStyle }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>
                  🟡 ATTENZIONE — giorni alla scadenza
                </label>
                <input
                  type="number" min={30} max={180}
                  value={cfg.soglie.attenzione}
                  onChange={e => aggiornaCfg({ soglie: { ...cfg.soglie, attenzione: Number(e.target.value) } })}
                  style={{ ...inputStyle }}
                />
              </div>
            </div>
          </div>

          {/* Filtri tipi */}
          <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, padding: "18px 24px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>📋 Includi nelle notifiche</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { key: "includiScaduti", label: "Documenti già scaduti", color: "#ef4444" },
                { key: "includiCritici", label: `Scadenza imminente (entro ${cfg.soglie.critico} giorni)`, color: "#ef4444" },
                { key: "includiAttenzione", label: `In scadenza (entro ${cfg.soglie.attenzione} giorni)`, color: "#f59e0b" },
              ].map(item => (
                <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#0f1117", borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>{item.label}</div>
                  <div
                    onClick={() => aggiornaCfg({ [item.key]: !cfg[item.key] })}
                    style={{
                      width: 40, height: 22, borderRadius: 11,
                      background: cfg[item.key] ? item.color : "#1e2535",
                      border: `1px solid ${cfg[item.key] ? item.color + "80" : "#334155"}`,
                      cursor: "pointer", position: "relative", flexShrink: 0,
                    }}>
                    <div style={{
                      position: "absolute", top: 2,
                      left: cfg[item.key] ? 20 : 2,
                      width: 16, height: 16, borderRadius: "50%",
                      background: cfg[item.key] ? "white" : "#475569",
                      transition: "left .15s",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Azioni */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={simulaInvio}
              style={{ flex: 1, padding: "13px", background: urgenti.length > 0 ? "linear-gradient(135deg, #3b82f6, #06b6d4)" : "#1e2535", border: "none", borderRadius: 10, color: urgenti.length > 0 ? "white" : "#334155", fontSize: 13, fontWeight: 800, cursor: urgenti.length > 0 ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
              📧 Simula invio notifica
              {urgenti.length > 0 && <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 12, fontSize: 11 }}>{urgenti.length} urgenti</span>}
            </button>
          </div>

          {urgenti.length === 0 && (
            <div style={{ textAlign: "center", padding: "16px", background: "#10b98108", border: "1px solid #10b98120", borderRadius: 10, fontSize: 13, color: "#10b981" }}>
              ✓ Nessuna scadenza urgente per {azienda.nome}
            </div>
          )}
        </div>
      )}

      {tab === "log" && (
        <div>
          {logNotifiche.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "#334155", fontSize: 14 }}>
              Nessuna notifica inviata — usa "Simula invio notifica"
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {logNotifiche.map((ev, i) => (
                <div key={ev.id || i} style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 10, padding: "14px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>📧</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
                      Notifica inviata a {ev.email}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {ev.scaduti > 0 && <span style={{ color: "#ef4444" }}>🚫 {ev.scaduti} scaduti</span>}
                      {ev.critici > 0 && <span style={{ color: "#f59e0b" }}>⚠️ {ev.critici} imminenti</span>}
                      {ev.attenzione > 0 && <span style={{ color: "#60a5fa" }}>📋 {ev.attenzione} in scadenza</span>}
                      <span>· {ev.aziendaNome}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#334155", flexShrink: 0 }}>
                    {formatDateTime(ev.timestamp)}
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
