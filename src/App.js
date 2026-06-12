import { useState, useEffect } from "react";
import ModuloPOS from "./POS";
import GestioneTemplatesDUVRIDVR from "./TemplatesDUVRIDVR";
import ImpostazioniTenant from "./Impostazioni";
import UploadMassivo from "./UploadMassivo";
import ModuloScadenze from "./ModuloScadenze";
import ModuloAppaltatori from "./ModuloAppaltatori";
import ModuloBadge from "./ModuloBadge";
import ModuloAccessi from "./ModuloAccessi";
import ModuloNotifiche from "./ModuloNotifiche";
import ModuloPSC from "./ModuloPSC";
import PrivacyResponsabilita from "./PrivacyResponsabilita";
import TerminiServizio from "./TerminiServizio";
import { SchermataBenvenuto, CreaAzienda } from "./Onboarding";
import {
  leggiDB, salvaDB, privacyAccettata,
  statoScadenza, giorniAllaScadenza, calcolaStatAzienda,
} from "./database";

// ─── MODALITA' MVP ────────────────────────────────────────────────────────────
// Per riabilitare TUTTA la navigazione: imposta MVP_MODE = false
// Per tornare all'MVP (solo upload attestati): MVP_MODE = true
const MVP_MODE = true;

// ─── HELPERS UI ───────────────────────────────────────────────────────────────
const STATO_CFG = {
  ok:         { color: "#10b981", bg: "#10b98115", label: "Valido" },
  attenzione: { color: "#f59e0b", bg: "#f59e0b15", label: "In scadenza" },
  critico:    { color: "#ef4444", bg: "#ef444415", label: "Critico" },
  scaduto:    { color: "#ef4444", bg: "#ef444425", label: "SCADUTO" },
  nessuna:    { color: "#475569", bg: "#47556915", label: "—" },
};

const STATO_DUVRI = {
  firmato:    { color: "#10b981", bg: "#10b98115", label: "Firmato" },
  da_firmare: { color: "#f59e0b", bg: "#f59e0b15", label: "Da firmare" },
  archiviato: { color: "#475569", bg: "#47556915", label: "Archiviato" },
};

// ─── DASHBOARD VUOTA ──────────────────────────────────────────────────────────
function DashboardVuota({ onAggiungiAzienda }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 20, textAlign: "center" }}>
      <div style={{ fontSize: 52, opacity: 0.15 }}>🏢</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#334155", marginBottom: 8 }}>Nessuna azienda ancora</div>
        <div style={{ fontSize: 14, color: "#1e2535", maxWidth: 340, lineHeight: 1.6 }}>
          Aggiungi la tua prima azienda committente per iniziare a gestire appalti, lavoratori e scadenze.
        </div>
      </div>
      <button
        onClick={onAggiungiAzienda}
        style={{
          padding: "13px 28px",
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          border: "none", borderRadius: 12,
          color: "white", fontSize: 14, fontWeight: 800,
          cursor: "pointer", fontFamily: "inherit",
        }}>
        + Aggiungi la tua prima azienda
      </button>
    </div>
  );
}

// ─── DASHBOARD CON DATI ───────────────────────────────────────────────────────
function Dashboard({ azienda, onNavigate }) {
  const stat = calcolaStatAzienda(azienda);

  // Raccoglie tutte le scadenze imminenti
  const scadenzeImminenti = [];
  for (const ap of azienda.appalti || []) {
    for (const app of ap.appaltatori || []) {
      const tuttiLav = [
        ...app.lavoratori,
        ...(app.subappaltatori || []).flatMap(s => s.lavoratori),
      ];
      for (const lav of tuttiLav) {
        for (const att of lav.attestati || []) {
          const stato = statoScadenza(att.scadenza);
          if (["scaduto","critico","attenzione"].includes(stato)) {
            scadenzeImminenti.push({
              nomeLavoratore: lav.nome,
              tipoDocumento: att.tipo,
              scadenza: att.scadenza,
              stato,
              giorni: giorniAllaScadenza(att.scadenza),
              appaltatore: app.nome,
            });
          }
        }
      }
    }
  }
  scadenzeImminenti.sort((a, b) => (a.giorni ?? 999) - (b.giorni ?? 999));

  return (
    <div>
      {/* Alert bloccati */}
      {stat.bloccati > 0 && (
        <div style={{ padding: "14px 20px", marginBottom: 24, background: "#ef444412", border: "1px solid #ef444430", borderRadius: 12, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>🚨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{stat.bloccati} lavoratori con accesso bloccato per documenti scaduti</div>
          </div>
          <button onClick={() => onNavigate("scadenze")} style={{ padding: "7px 14px", background: "#ef444420", border: "1px solid #ef444440", borderRadius: 7, color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Gestisci →</button>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Appalti attivi", value: stat.appaltiAttivi, color: "#60a5fa", mod: "duvri" },
          { label: "Lavoratori registrati", value: stat.totLavoratori, color: "#10b981", mod: "scadenze" },
          { label: "Attestati totali", value: stat.totAttestati, color: "#a78bfa", mod: "upload" },
          { label: "Scaduti", value: stat.scaduti, color: stat.scaduti > 0 ? "#ef4444" : "#334155", mod: "scadenze" },
          { label: "In scadenza (60gg)", value: stat.inScadenza, color: stat.inScadenza > 0 ? "#f59e0b" : "#334155", mod: "scadenze" },
          { label: "Accessi bloccati", value: stat.bloccati, color: stat.bloccati > 0 ? "#ef4444" : "#334155", mod: "scadenze" },
        ].map((s, i) => (
          <div key={i} onClick={() => onNavigate(s.mod)} style={{ background: "#161b27", border: `1px solid ${s.color}20`, borderRadius: 12, padding: "18px 20px", cursor: "pointer", position: "relative", overflow: "hidden" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color + "50"}
            onMouseLeave={e => e.currentTarget.style.borderColor = s.color + "20"}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Scadenze imminenti */}
      {scadenzeImminenti.length > 0 ? (
        <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2535", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>Scadenze da gestire</span>
            <span onClick={() => onNavigate("scadenze")} style={{ fontSize: 11, color: "#3b82f6", cursor: "pointer" }}>Vedi tutte →</span>
          </div>
          {scadenzeImminenti.slice(0, 8).map((s, i) => {
            const cfg = STATO_CFG[s.stato];
            return (
              <div key={i} style={{ padding: "12px 20px", borderBottom: i < Math.min(scadenzeImminenti.length, 8) - 1 ? "1px solid #1e253540" : "none", display: "flex", alignItems: "center", gap: 12, borderLeft: `3px solid ${cfg.color}` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nomeLavoratore} — {s.tipoDocumento}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{s.appaltatore}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
                  {s.giorni < 0 ? `Scaduto ${Math.abs(s.giorni)}gg fa` : `${s.giorni}gg`}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "#161b27", border: "1px solid #10b98130", borderRadius: 12, padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#10b981" }}>Tutto in ordine</div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>Nessuna scadenza imminente</div>
        </div>
      )}
    </div>
  );
}

// ─── SELETTORE AZIENDE ────────────────────────────────────────────────────────
function SelettoreAziende({ aziende, aziendaAttiva, onSeleziona, onNuova, onChiudi }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
      {/* Overlay */}
      <div onClick={onChiudi} style={{ position: "absolute", inset: 0, background: "#000000a0" }} />

      {/* Pannello */}
      <div style={{
        position: "relative", width: 320, background: "#161b27",
        borderRight: "1px solid #1e2535", display: "flex", flexDirection: "column",
        zIndex: 1,
      }}>
        <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid #1e2535" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 2 }}>Le tue aziende</div>
          <div style={{ fontSize: 11, color: "#475569" }}>{aziende.length} aziende registrate</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {aziende.map(az => {
            const attiva = az.id === aziendaAttiva?.id;
            const stat = calcolaStatAzienda(az);
            return (
              <div
                key={az.id}
                onClick={() => { onSeleziona(az); onChiudi(); }}
                style={{
                  padding: "14px 20px", cursor: "pointer",
                  background: attiva ? "#1e3a5f22" : "transparent",
                  borderLeft: `3px solid ${attiva ? "#3b82f6" : "transparent"}`,
                  display: "flex", alignItems: "center", gap: 12,
                }}
                onMouseEnter={e => { if (!attiva) e.currentTarget.style.background = "#1e253540"; }}
                onMouseLeave={e => { if (!attiva) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: attiva ? "#3b82f620" : "#1e2535",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800,
                  color: attiva ? "#60a5fa" : "#64748b",
                }}>
                  {az.nome.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: attiva ? "#f1f5f9" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{az.nome}</div>
                  <div style={{ fontSize: 11, color: "#334155", marginTop: 1 }}>
                    {stat.totLavoratori} lavoratori · {stat.appaltiAttivi} appalti attivi
                    {stat.scaduti > 0 && <span style={{ color: "#ef4444", marginLeft: 6 }}>⚠ {stat.scaduti} scaduti</span>}
                  </div>
                </div>
                {attiva && <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700 }}>●</span>}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #1e2535" }}>
          <button
            onClick={() => { onNuova(); onChiudi(); }}
            style={{
              width: "100%", padding: "11px",
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              border: "none", borderRadius: 9,
              color: "white", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
            + Aggiungi azienda
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SCHERMATA PROFILO AZIENDA ────────────────────────────────────────────────
function ProfiloAzienda({ azienda }) {
  const LIVELLO_CFG = {
    basso:  { color: "#10b981", bg: "#10b98115" },
    medio:  { color: "#f59e0b", bg: "#f59e0b15" },
    alto:   { color: "#ef4444", bg: "#ef444415" },
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>{azienda.nome}</div>
      <div style={{ fontSize: 13, color: "#475569", marginBottom: 24 }}>Profilo azienda committente</div>

      {/* Dati aziendali */}
      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2535", fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.5px" }}>DATI AZIENDALI</div>
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            ["Ragione sociale", azienda.nome],
            ["Partita IVA", azienda.piva || "—"],
            ["Sede legale", azienda.sede || "—"],
            ["Codice ATECO", azienda.ateco || "—"],
            ["Settore", azienda.settore || "—"],
            ["Dipendenti", azienda.dipendenti || "—"],
          ].map(([k, v], i) => (
            <div key={i}>
              <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 3 }}>{k.toUpperCase()}</div>
              <div style={{ fontSize: 13, color: "#cbd5e1" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Figure */}
      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2535", fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.5px" }}>FIGURE DELLA SICUREZZA</div>
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            ["Datore di lavoro", azienda.figure?.datoreLavoro],
            ["RSPP", azienda.figure?.rspp],
            ["Medico competente", azienda.figure?.medicoCompetente],
            ["RLS", azienda.figure?.rls],
          ].map(([k, v], i) => (
            <div key={i}>
              <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 3 }}>{k.toUpperCase()}</div>
              <div style={{ fontSize: 13, color: v ? "#cbd5e1" : "#334155" }}>{v || "Non specificato"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rischi */}
      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2535", fontSize: 11, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.5px" }}>
          RISCHI AZIENDALI — {(azienda.rischi || []).length}
        </div>
        {(azienda.rischi || []).length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "#334155" }}>Nessun rischio registrato</div>
        ) : (
          <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {azienda.rischi.map((r, i) => {
              const cfg = LIVELLO_CFG[r.livello] || LIVELLO_CFG.medio;
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", background: "#0f1117", borderRadius: 8, borderLeft: `3px solid ${cfg.color}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>{r.categoria}</div>
                    {r.descrizione && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{r.descrizione}</div>}
                  </div>
                  <span style={{ padding: "2px 8px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {r.livello?.charAt(0).toUpperCase() + r.livello?.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
export default function SafetyAIApp() {
  const [privacyOk, setPrivacyOk] = useState(privacyAccettata());
  const [db, setDb] = useState(() => leggiDB());
  const [aziendaAttivaId, setAziendaAttivaId] = useState(null);
  const [modulo, setModulo] = useState("dashboard");
  const [showSelettore, setShowSelettore] = useState(false);
  const [showNuovaAzienda, setShowNuovaAzienda] = useState(false);

  // Seleziona automaticamente la prima azienda disponibile
  useEffect(() => {
    if (db.aziende.length > 0 && !aziendaAttivaId) {
      setAziendaAttivaId(db.aziende[0].id);
    }
  }, [db.aziende, aziendaAttivaId]);

  const aziendaAttiva = db.aziende.find(a => a.id === aziendaAttivaId) || null;

  function ricaricaDB() {
    setDb(leggiDB());
  }

  function onAziendaCreata(nuova) {
    ricaricaDB();
    setAziendaAttivaId(nuova.id);
    setShowNuovaAzienda(false);
    setModulo("dashboard");
  }

  // ── SCHERMATA PRIVACY (prima volta) ──
  if (!privacyOk) {
    return <SchermataBenvenuto onAccetta={() => setPrivacyOk(true)} />;
  }

  // ── SCHERMATA NUOVA AZIENDA ──
  if (showNuovaAzienda) {
    return (
      <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", minHeight: "100vh", color: "#e2e8f0" }}>
        <div style={{ borderBottom: "1px solid #1e2535", padding: "16px 32px", display: "flex", alignItems: "center", gap: 16, background: "#161b27", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => setShowNuovaAzienda(false)} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>← Torna</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white" }}>S</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>SafetyAI</span>
          </div>
        </div>
        <div style={{ padding: "40px 24px" }}>
          <CreaAzienda onCreata={onAziendaCreata} isFirst={db.aziende.length === 0} />
        </div>
      </div>
    );
  }

  const NAV_PRINCIPALE = [
    { id: "dashboard",    icon: "⊟", label: "Dashboard",           mvp: true  },
    { id: "upload",       icon: "📂", label: "Carica documenti",    mvp: true  },
    // ── moduli completi nella versione pro (MVP_MODE = false per riabilitare) ──
    { id: "idoneita",     icon: "✓", label: "Idoneità",             mvp: false },
    { id: "scadenze",     icon: "⏱", label: "Scadenze",             mvp: false },
    { id: "appaltatori",  icon: "🏗", label: "Appalti e imprese",   mvp: false },
    { id: "badge",        icon: "🪪", label: "Genera badge",         mvp: false },
    { id: "psc",          icon: "📋", label: "PSC",                  mvp: false },
    { id: "duvri",        icon: "📋", label: "DUVRI",                mvp: false },
    { id: "pos",          icon: "◈", label: "POS",                  mvp: false },
    { id: "accessi",      icon: "◉", label: "Accessi",              mvp: false },
    { id: "notifiche",    icon: "📧", label: "Notifiche",            mvp: false },
    { id: "profilo",      icon: "🏢", label: "Profilo azienda",      mvp: false },
    { id: "impostazioni", icon: "⚙", label: "Impostazioni",         mvp: false },
  ];

  // In MVP_MODE mostra solo le voci marcate mvp:true
  const navVisibile = MVP_MODE ? NAV_PRINCIPALE.filter(i => i.mvp) : NAV_PRINCIPALE;

  const NAV_FOOTER = [
    { id: "privacy",  icon: "🔒", label: "Privacy & DPA" },
    { id: "termini",  icon: "📜", label: "Termini di servizio" },
  ];

  const tutteLeVoci = [...NAV_PRINCIPALE, ...NAV_FOOTER]; // include tutte per lookup label
  const stat = aziendaAttiva ? calcolaStatAzienda(aziendaAttiva) : null;

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", minHeight: "100vh", color: "#e2e8f0", display: "flex" }}>

      {/* Selettore aziende */}
      {showSelettore && (
        <SelettoreAziende
          aziende={db.aziende}
          aziendaAttiva={aziendaAttiva}
          onSeleziona={az => { setAziendaAttivaId(az.id); setModulo("dashboard"); }}
          onNuova={() => setShowNuovaAzienda(true)}
          onChiudi={() => setShowSelettore(false)}
        />
      )}

      {/* Sidebar */}
      <div style={{ width: 220, background: "#161b27", borderRight: "1px solid #1e2535", display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e2535" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white" }}>S</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.3px" }}>SafetyAI</div>
              <div style={{ fontSize: 9, color: "#64748b", letterSpacing: "1px" }}>GESTIONALE HSE</div>
            </div>
          </div>
        </div>

        {/* Selettore azienda attiva */}
        <div
          onClick={() => setShowSelettore(true)}
          style={{
            padding: "10px 16px", borderBottom: "1px solid #1e2535",
            background: "#0f1117", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10,
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#1e2535"}
          onMouseLeave={e => e.currentTarget.style.background = "#0f1117"}
        >
          {aziendaAttiva ? (
            <>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#3b82f620", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#60a5fa", flexShrink: 0 }}>
                {aziendaAttiva.nome.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#334155", letterSpacing: "0.4px", marginBottom: 1 }}>AZIENDA ATTIVA</div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{aziendaAttiva.nome}</div>
              </div>
              <span style={{ fontSize: 10, color: "#334155" }}>⌄</span>
            </>
          ) : (
            <>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#1e2535", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#334155", flexShrink: 0 }}>+</div>
              <div style={{ fontSize: 12, color: "#334155" }}>Seleziona azienda</div>
            </>
          )}
        </div>

        {/* Alert urgenti */}
        {stat && stat.scaduti > 0 && (
          <div onClick={() => setModulo("scadenze")} style={{ margin: "10px 12px 0", padding: "8px 12px", background: "#ef444412", border: "1px solid #ef444425", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>🚨</span>
            <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>{stat.scaduti} doc. scaduti</span>
          </div>
        )}

        {/* Nav principale */}
        <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          {navVisibile.map(item => {
            const attivo = modulo === item.id;
            // In MVP_MODE l'upload è sempre attivo (non richiede azienda)
            const disabilitato = !aziendaAttiva && item.id !== "dashboard" && !(MVP_MODE && item.id === "upload");
            return (
              <button
                key={item.id}
                onClick={() => { if (!disabilitato) setModulo(item.id); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 20px", background: attivo ? "#1e3a5f22" : "transparent",
                  border: "none", borderLeft: `2px solid ${attivo ? "#3b82f6" : "transparent"}`,
                  color: disabilitato ? "#1e2535" : attivo ? "#60a5fa" : "#64748b",
                  fontSize: 13, fontWeight: attivo ? 700 : 400,
                  cursor: disabilitato ? "not-allowed" : "pointer", textAlign: "left",
                  fontFamily: "inherit",
                }}>
                <span style={{ fontSize: 14, opacity: disabilitato ? 0.3 : 0.8 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer nav */}
        <div style={{ borderTop: "1px solid #1e2535" }}>
          {NAV_FOOTER.map(item => {
            const attivo = modulo === item.id;
            return (
              <button key={item.id} onClick={() => setModulo(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: attivo ? "#1e3a5f22" : "transparent", border: "none", borderLeft: `2px solid ${attivo ? "#3b82f6" : "transparent"}`, color: attivo ? "#60a5fa" : "#334155", fontSize: 12, fontWeight: attivo ? 700 : 400, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #1e2535", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white" }}>RS</div>
          <div>
            <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600 }}>RSPP Esterno</div>
            <div style={{ fontSize: 10, color: "#475569" }}>{db.aziende.length} aziende gestite</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{ padding: "16px 28px", borderBottom: "1px solid #1e2535", background: "#161b27", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              {tutteLeVoci.find(n => n.id === modulo)?.label || "Dashboard"}
            </div>
            {aziendaAttiva && (
              <div style={{ fontSize: 11, color: "#334155", marginTop: 1 }}>{aziendaAttiva.nome}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Banner beta — visibile solo in MVP_MODE */}
            {MVP_MODE && (
              <div style={{ padding: "5px 12px", background: "#3b82f610", border: "1px solid #3b82f630", borderRadius: 7, fontSize: 11, color: "#60a5fa", fontWeight: 600, letterSpacing: "0.3px" }}>
                BETA — Analisi conformita' attestati
              </div>
            )}
            {stat && stat.scaduti > 0 && (
              <div style={{ padding: "6px 12px", background: "#ef444415", border: "1px solid #ef444430", borderRadius: 7, fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
                🚨 {stat.scaduti} scaduti
              </div>
            )}
            {/* Bottone DUVRI nascosto in MVP_MODE */}
            {!MVP_MODE && aziendaAttiva && (
              <button onClick={() => setModulo("duvri")} style={{ padding: "8px 16px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Nuovo DUVRI</button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: modulo === "privacy" ? 0 : 28 }}>
          {modulo === "dashboard" && (
            aziendaAttiva
              ? <Dashboard azienda={aziendaAttiva} onNavigate={setModulo} />
              : <DashboardVuota onAggiungiAzienda={() => setShowNuovaAzienda(true)} />
          )}
          {modulo === "upload"       && <UploadMassivo azienda={aziendaAttiva} />}
          {modulo === "privacy"      && <PrivacyResponsabilita />}
          {modulo === "termini"      && <TerminiServizio />}
          {modulo === "profilo"      && aziendaAttiva && <ProfiloAzienda azienda={aziendaAttiva} />}
          {modulo === "scadenze"     && <ModuloScadenze azienda={aziendaAttiva} />}
          {modulo === "appaltatori"  && <ModuloAppaltatori azienda={aziendaAttiva} onUpdate={ricaricaDB} />}
          {modulo === "badge"        && <ModuloBadge azienda={aziendaAttiva} />}
          {modulo === "accessi"      && <ModuloAccessi azienda={aziendaAttiva} />}
          {modulo === "notifiche"    && <ModuloNotifiche azienda={aziendaAttiva} />}
          {modulo === "psc"          && <ModuloPSC azienda={aziendaAttiva} />}
          {modulo === "duvri"        && <GestioneTemplatesDUVRIDVR />}
          {modulo === "pos"          && <ModuloPOS />}
          {modulo === "impostazioni" && <ImpostazioniTenant />}

          {["idoneita"].includes(modulo) && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 52, opacity: 0.15 }}>🔧</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#334155" }}>{tutteLeVoci.find(n => n.id === modulo)?.label}</div>
              <div style={{ fontSize: 13, color: "#1e2535", background: "#161b27", padding: