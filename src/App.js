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
import { privacyAccettata } from "./consensoLocale";
import { statoScadenza, giorniAllaScadenza, calcolaStatAzienda } from "./scadenzeUtils";
import { listaAziende, caricaAziendaCompleta } from "./dbSupabase";
import { logout } from "./AuthSupabase";

// ─── MODALITA' MVP ────────────────────────────────────────────────────────────
// Per riabilitare TUTTA la navigazione: imposta MVP_MODE = false
// Per tornare all'MVP (solo upload attestati): MVP_MODE = true
const MVP_MODE = true;

// ─── HELPERS UI ───────────────────────────────────────────────────────────────
const STATO_CFG = {
  ok:         { color: "#1E5D39", bg: "#1E5D3915", label: "Valido" },
  attenzione: { color: "#C4872E", bg: "#C4872E15", label: "In scadenza" },
  critico:    { color: "#812C2C", bg: "#812C2C15", label: "Critico" },
  scaduto:    { color: "#812C2C", bg: "#812C2C25", label: "SCADUTO" },
  nessuna:    { color: "#5C5545", bg: "#5C554515", label: "—" },
};

const STATO_DUVRI = {
  firmato:    { color: "#1E5D39", bg: "#1E5D3915", label: "Firmato" },
  da_firmare: { color: "#C4872E", bg: "#C4872E15", label: "Da firmare" },
  archiviato: { color: "#5C5545", bg: "#5C554515", label: "Archiviato" },
};

// ─── DASHBOARD VUOTA ──────────────────────────────────────────────────────────
function DashboardVuota({ onAggiungiAzienda }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 20, textAlign: "center" }}>
      <div style={{ fontSize: 52, opacity: 0.15 }}>🏢</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#8A8271", marginBottom: 8 }}>Nessuna azienda ancora</div>
        <div style={{ fontSize: 14, color: "#1A140D", maxWidth: 340, lineHeight: 1.6 }}>
          Aggiungi la tua prima azienda committente per iniziare a gestire appalti, lavoratori e scadenze.
        </div>
      </div>
      <button
        onClick={onAggiungiAzienda}
        style={{
          padding: "13px 28px",
          background: "#1E5D39",
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
        <div style={{ padding: "14px 20px", marginBottom: 24, background: "#812C2C12", border: "1px solid #812C2C30", borderRadius: 12, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>🚨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#812C2C" }}>{stat.bloccati} lavoratori con accesso bloccato per documenti scaduti</div>
          </div>
          <button onClick={() => onNavigate("scadenze")} style={{ padding: "7px 14px", background: "#812C2C20", border: "1px solid #812C2C40", borderRadius: 7, color: "#812C2C", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Gestisci →</button>
        </div>
      )}

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Appalti attivi", value: stat.appaltiAttivi, color: "#1E5D39", mod: "duvri" },
          { label: "Lavoratori registrati", value: stat.totLavoratori, color: "#1E5D39", mod: "scadenze" },
          { label: "Attestati totali", value: stat.totAttestati, color: "#812C2C", mod: "upload" },
          { label: "Scaduti", value: stat.scaduti, color: stat.scaduti > 0 ? "#812C2C" : "#8A8271", mod: "scadenze" },
          { label: "In scadenza (60gg)", value: stat.inScadenza, color: stat.inScadenza > 0 ? "#C4872E" : "#8A8271", mod: "scadenze" },
          { label: "Accessi bloccati", value: stat.bloccati, color: stat.bloccati > 0 ? "#812C2C" : "#8A8271", mod: "scadenze" },
        ].map((s, i) => (
          <div key={i} onClick={() => onNavigate(s.mod)} style={{ background: "#FBF8F1", border: `1px solid ${s.color}20`, borderRadius: 12, padding: "18px 20px", cursor: "pointer", position: "relative", overflow: "hidden" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color + "50"}
            onMouseLeave={e => e.currentTarget.style.borderColor = s.color + "20"}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#5C5545", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Scadenze imminenti */}
      {scadenzeImminenti.length > 0 ? (
        <div style={{ background: "#FBF8F1", border: "1px solid #1A140D", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1A140D", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#241D14" }}>Scadenze da gestire</span>
            <span onClick={() => onNavigate("scadenze")} style={{ fontSize: 11, color: "#1E5D39", cursor: "pointer" }}>Vedi tutte →</span>
          </div>
          {scadenzeImminenti.slice(0, 8).map((s, i) => {
            const cfg = STATO_CFG[s.stato];
            return (
              <div key={i} style={{ padding: "12px 20px", borderBottom: i < Math.min(scadenzeImminenti.length, 8) - 1 ? "1px solid #1A140D40" : "none", display: "flex", alignItems: "center", gap: 12, borderLeft: `3px solid ${cfg.color}` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#241D14", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nomeLavoratore} — {s.tipoDocumento}</div>
                  <div style={{ fontSize: 11, color: "#5C5545" }}>{s.appaltatore}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
                  {s.giorni < 0 ? `Scaduto ${Math.abs(s.giorni)}gg fa` : `${s.giorni}gg`}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "#FBF8F1", border: "1px solid #1E5D3930", borderRadius: 12, padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1E5D39" }}>Tutto in ordine</div>
          <div style={{ fontSize: 13, color: "#5C5545", marginTop: 4 }}>Nessuna scadenza imminente</div>
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
        position: "relative", width: 320, background: "#FBF8F1",
        borderRight: "1px solid #1A140D", display: "flex", flexDirection: "column",
        zIndex: 1,
      }}>
        <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid #1A140D" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#241D14", marginBottom: 2 }}>Le tue aziende</div>
          <div style={{ fontSize: 11, color: "#5C5545" }}>{aziende.length} aziende registrate</div>
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
                  background: attiva ? "#1E5D3922" : "transparent",
                  borderLeft: `3px solid ${attiva ? "#1E5D39" : "transparent"}`,
                  display: "flex", alignItems: "center", gap: 12,
                }}
                onMouseEnter={e => { if (!attiva) e.currentTarget.style.background = "#1A140D40"; }}
                onMouseLeave={e => { if (!attiva) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: attiva ? "#1E5D3920" : "#1A140D",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800,
                  color: attiva ? "#1E5D39" : "#5C5545",
                }}>
                  {az.nome.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: attiva ? "#241D14" : "#5C5545", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{az.nome}</div>
                  <div style={{ fontSize: 11, color: "#8A8271", marginTop: 1 }}>
                    {stat.totLavoratori} lavoratori · {stat.appaltiAttivi} appalti attivi
                    {stat.scaduti > 0 && <span style={{ color: "#812C2C", marginLeft: 6 }}>⚠ {stat.scaduti} scaduti</span>}
                  </div>
                </div>
                {attiva && <span style={{ fontSize: 12, color: "#1E5D39", fontWeight: 700 }}>●</span>}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid #1A140D" }}>
          <button
            onClick={() => { onNuova(); onChiudi(); }}
            style={{
              width: "100%", padding: "11px",
              background: "#1E5D39",
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
    basso:  { color: "#1E5D39", bg: "#1E5D3915" },
    medio:  { color: "#C4872E", bg: "#C4872E15" },
    alto:   { color: "#812C2C", bg: "#812C2C15" },
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#241D14", marginBottom: 4 }}>{azienda.nome}</div>
      <div style={{ fontSize: 13, color: "#5C5545", marginBottom: 24 }}>Profilo azienda committente</div>

      {/* Dati aziendali */}
      <div style={{ background: "#FBF8F1", border: "1px solid #1A140D", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1A140D", fontSize: 11, fontWeight: 700, color: "#1E5D39", letterSpacing: "0.5px" }}>DATI AZIENDALI</div>
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
              <div style={{ fontSize: 10, color: "#5C5545", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 3 }}>{k.toUpperCase()}</div>
              <div style={{ fontSize: 13, color: "#241D14" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Figure */}
      <div style={{ background: "#FBF8F1", border: "1px solid #1A140D", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1A140D", fontSize: 11, fontWeight: 700, color: "#812C2C", letterSpacing: "0.5px" }}>FIGURE DELLA SICUREZZA</div>
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            ["Datore di lavoro", azienda.figure?.datoreLavoro],
            ["RSPP", azienda.figure?.rspp],
            ["Medico competente", azienda.figure?.medicoCompetente],
            ["RLS", azienda.figure?.rls],
          ].map(([k, v], i) => (
            <div key={i}>
              <div style={{ fontSize: 10, color: "#5C5545", fontWeight: 700, letterSpacing: "0.5px", marginBottom: 3 }}>{k.toUpperCase()}</div>
              <div style={{ fontSize: 13, color: v ? "#241D14" : "#8A8271" }}>{v || "Non specificato"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rischi */}
      <div style={{ background: "#FBF8F1", border: "1px solid #1A140D", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #1A140D", fontSize: 11, fontWeight: 700, color: "#C4872E", letterSpacing: "0.5px" }}>
          RISCHI AZIENDALI — {(azienda.rischi || []).length}
        </div>
        {(azienda.rischi || []).length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "#8A8271" }}>Nessun rischio registrato</div>
        ) : (
          <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {azienda.rischi.map((r, i) => {
              const cfg = LIVELLO_CFG[r.livello] || LIVELLO_CFG.medio;
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", background: "#EFE9DD", borderRadius: 8, borderLeft: `3px solid ${cfg.color}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#241D14" }}>{r.categoria}</div>
                    {r.descrizione && <div style={{ fontSize: 11, color: "#5C5545", marginTop: 2 }}>{r.descrizione}</div>}
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

// ─── APP FREEMIUM (MVP) ───────────────────────────────────────────────────────
// Nessun login, nessun database: carica PDF -> analisi AI -> Excel. E' il canale
// di acquisizione (vedi rspPINO_PIANO_90_GIORNI.md). Non tocca Supabase.
function AppMVP() {
  const [privacyOk, setPrivacyOk] = useState(privacyAccettata());

  if (!privacyOk) {
    return <SchermataBenvenuto onAccetta={() => setPrivacyOk(true)} />;
  }

  return (
    <div style={{ fontFamily: "'Work Sans','Segoe UI',sans-serif", background: "#EFE9DD", minHeight: "100vh", color: "#241D14" }}>
      {/* Nastro di segnaletica */}
      <div style={{ height: 10, background: "repeating-linear-gradient(45deg, #812C2C, #812C2C 10px, #1A140D 10px, #1A140D 20px)" }} />

      <div style={{ position: "relative", background: "#1E5D39", color: "#F2EEE0", padding: "18px 28px", borderBottom: "4px solid #1A140D", overflow: "hidden" }}>
        <svg aria-hidden="true" viewBox="0 0 140 190" style={{ position: "absolute", right: -10, top: -20, width: 150, height: "auto", opacity: 0.12, pointerEvents: "none" }}>
          <path d="M70 8 C 90 20, 82 32, 96 38 C 112 44, 98 56, 114 64 C 130 72, 112 84, 128 94 C 140 102, 118 114, 130 124 C 138 132, 122 142, 104 144 L 100 178 L 40 178 L 36 144 C 18 142, 2 132, 10 124 C 22 114, 0 102, 12 94 C 28 84, 10 72, 26 64 C 42 56, 28 44, 44 38 C 58 32, 50 20, 70 8 Z" fill="#F2EEE0" />
        </svg>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", maxWidth: 1200, margin: "0 auto" }}>
          <div>
            <div style={{ fontFamily: "'Zilla Slab',serif", fontWeight: 700, fontSize: 34, lineHeight: 0.9, position: "relative", display: "inline-block" }}>
              <span aria-hidden="true" style={{ position: "absolute", top: 3, left: 3, zIndex: 0, color: "#1A140D" }}>
                rsp<span style={{ textTransform: "uppercase" }}>pino</span>
              </span>
              <span style={{ position: "relative", zIndex: 1 }}>
                <span style={{ color: "#F2EEE0" }}>rsp</span>
                <span style={{ color: "#812C2C", textTransform: "uppercase" }}>pino</span>
              </span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.8, marginTop: 6 }}>Analisi attestati · D.Lgs 81/08</div>
          </div>
          <div style={{ transform: "rotate(-6deg)", background: "#FBF3ED", color: "#812C2C", border: "3px solid #812C2C", borderRadius: 3, padding: "6px 13px", fontFamily: "'Zilla Slab',serif", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", boxShadow: "4px 4px 0 #1A140D" }}>
            Beta · no login
          </div>
        </div>
        <svg aria-hidden="true" viewBox="0 0 1000 70" preserveAspectRatio="none"
             style={{ position: "absolute", bottom: 0, left: 0, right: 0, width: "100%", height: 44, opacity: 0.5, pointerEvents: "none" }}>
          <polygon points="0,70 0,45 120,10 230,50 340,20 430,55 520,15 620,48 720,25 820,52 900,30 1000,50 1000,70" fill="#F2EEE0" />
        </svg>
      </div>

      <div style={{ padding: 28, maxWidth: 1200, margin: "0 auto" }}>
        <UploadMassivo azienda={null} />
      </div>
    </div>
  );
}

// ─── APP SHELL (versione pro, multi-azienda, dietro Supabase) ─────────────────
function AppCompleta() {
  const [privacyOk, setPrivacyOk] = useState(privacyAccettata());
  const [aziende, setAziende] = useState([]);
  const [aziendaAttiva, setAziendaAttiva] = useState(null);
  const [aziendaAttivaId, setAziendaAttivaId] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [erroreDati, setErroreDati] = useState(null);
  const [modulo, setModulo] = useState("dashboard");
  const [showSelettore, setShowSelettore] = useState(false);
  const [showNuovaAzienda, setShowNuovaAzienda] = useState(false);

  // Carica l'elenco aziende da Supabase (isolate per account via RLS)
  async function ricaricaDB() {
    try {
      setErroreDati(null);
      const lista = await listaAziende();
      setAziende(lista);
      if (lista.length > 0 && !aziendaAttivaId) {
        setAziendaAttivaId(lista[0].id);
      } else if (aziendaAttivaId && !lista.some(a => a.id === aziendaAttivaId)) {
        setAziendaAttivaId(lista[0]?.id || null);
      } else if (aziendaAttivaId) {
        setAziendaAttiva(await caricaAziendaCompleta(aziendaAttivaId));
      }
    } catch (e) {
      console.error("Errore caricamento dati:", e);
      setErroreDati(e.message || "Errore di caricamento dati");
    } finally {
      setCaricamento(false);
    }
  }

  useEffect(() => { ricaricaDB(); }, []);

  // Al cambio di azienda attiva (o rientrando in un modulo) ricarica l'albero completo
  useEffect(() => {
    let annullato = false;
    if (!aziendaAttivaId) { setAziendaAttiva(null); return; }
    caricaAziendaCompleta(aziendaAttivaId)
      .then(az => { if (!annullato) setAziendaAttiva(az); })
      .catch(e => {
        if (!annullato) { console.error(e); setErroreDati(e.message || "Errore di caricamento azienda"); }
      });
    return () => { annullato = true; };
  }, [aziendaAttivaId, modulo]);

  function onAziendaCreata(nuova) {
    setShowNuovaAzienda(false);
    setModulo("dashboard");
    setAziendaAttivaId(nuova.id);
    ricaricaDB();
  }

  // ── SCHERMATA PRIVACY (prima volta) ──
  if (!privacyOk) {
    return <SchermataBenvenuto onAccetta={() => setPrivacyOk(true)} />;
  }

  // ── CARICAMENTO INIZIALE DATI (da Supabase) ──
  if (caricamento) {
    return (
      <div style={{ minHeight: "100vh", background: "#EFE9DD", display: "flex", alignItems: "center", justifyContent: "center", color: "#5C5545", fontFamily: "'Work Sans','Segoe UI',sans-serif", fontSize: 14 }}>
        Caricamento dati…
      </div>
    );
  }

  // ── SCHERMATA NUOVA AZIENDA ──
  if (showNuovaAzienda) {
    return (
      <div style={{ fontFamily: "'Work Sans','Segoe UI',sans-serif", background: "#EFE9DD", minHeight: "100vh", color: "#241D14" }}>
        <div style={{ borderBottom: "1px solid #1A140D", padding: "16px 32px", display: "flex", alignItems: "center", gap: 16, background: "#FBF8F1", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => setShowNuovaAzienda(false)} style={{ background: "none", border: "none", color: "#1E5D39", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>← Torna</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: "#1E5D39", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 140 190" width="15" height="auto"><path d="M70 8 C 90 20, 82 32, 96 38 C 112 44, 98 56, 114 64 C 130 72, 112 84, 128 94 C 140 102, 118 114, 130 124 C 138 132, 122 142, 104 144 L 100 178 L 40 178 L 36 144 C 18 142, 2 132, 10 124 C 22 114, 0 102, 12 94 C 28 84, 10 72, 26 64 C 42 56, 28 44, 44 38 C 58 32, 50 20, 70 8 Z" fill="white" /></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#241D14" }}>rspPINO</span>
          </div>
        </div>
        <div style={{ padding: "40px 24px" }}>
          <CreaAzienda onCreata={onAziendaCreata} isFirst={aziende.length === 0} />
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
    <div style={{ fontFamily: "'Work Sans','Segoe UI',sans-serif", background: "#EFE9DD", minHeight: "100vh", color: "#241D14", display: "flex" }}>

      {/* Selettore aziende */}
      {showSelettore && (
        <SelettoreAziende
          aziende={aziende}
          aziendaAttiva={aziendaAttiva}
          onSeleziona={az => { setAziendaAttivaId(az.id); setModulo("dashboard"); }}
          onNuova={() => setShowNuovaAzienda(true)}
          onChiudi={() => setShowSelettore(false)}
        />
      )}

      {/* Sidebar */}
      <div style={{ width: 220, background: "#FBF8F1", borderRight: "1px solid #1A140D", display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1A140D" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#1E5D39", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 140 190" width="17" height="auto"><path d="M70 8 C 90 20, 82 32, 96 38 C 112 44, 98 56, 114 64 C 130 72, 112 84, 128 94 C 140 102, 118 114, 130 124 C 138 132, 122 142, 104 144 L 100 178 L 40 178 L 36 144 C 18 142, 2 132, 10 124 C 22 114, 0 102, 12 94 C 28 84, 10 72, 26 64 C 42 56, 28 44, 44 38 C 58 32, 50 20, 70 8 Z" fill="white" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#241D14", letterSpacing: "-0.3px" }}>rspPINO</div>
              <div style={{ fontSize: 9, color: "#5C5545", letterSpacing: "1px" }}>GESTIONALE HSE</div>
            </div>
          </div>
        </div>

        {/* Selettore azienda attiva */}
        <div
          onClick={() => setShowSelettore(true)}
          style={{
            padding: "10px 16px", borderBottom: "1px solid #1A140D",
            background: "#EFE9DD", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10,
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#1A140D"}
          onMouseLeave={e => e.currentTarget.style.background = "#EFE9DD"}
        >
          {aziendaAttiva ? (
            <>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#1E5D3920", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#1E5D39", flexShrink: 0 }}>
                {aziendaAttiva.nome.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#8A8271", letterSpacing: "0.4px", marginBottom: 1 }}>AZIENDA ATTIVA</div>
                <div style={{ fontSize: 12, color: "#5C5545", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{aziendaAttiva.nome}</div>
              </div>
              <span style={{ fontSize: 10, color: "#8A8271" }}>⌄</span>
            </>
          ) : (
            <>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#1A140D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#8A8271", flexShrink: 0 }}>+</div>
              <div style={{ fontSize: 12, color: "#8A8271" }}>Seleziona azienda</div>
            </>
          )}
        </div>

        {/* Alert urgenti */}
        {stat && stat.scaduti > 0 && (
          <div onClick={() => setModulo("scadenze")} style={{ margin: "10px 12px 0", padding: "8px 12px", background: "#812C2C12", border: "1px solid #812C2C25", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>🚨</span>
            <span style={{ fontSize: 11, color: "#812C2C", fontWeight: 700 }}>{stat.scaduti} doc. scaduti</span>
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
                  padding: "9px 20px", background: attivo ? "#1E5D3922" : "transparent",
                  border: "none", borderLeft: `2px solid ${attivo ? "#1E5D39" : "transparent"}`,
                  color: disabilitato ? "#1A140D" : attivo ? "#1E5D39" : "#5C5545",
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
        <div style={{ borderTop: "1px solid #1A140D" }}>
          {NAV_FOOTER.map(item => {
            const attivo = modulo === item.id;
            return (
              <button key={item.id} onClick={() => setModulo(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: attivo ? "#1E5D3922" : "transparent", border: "none", borderLeft: `2px solid ${attivo ? "#1E5D39" : "transparent"}`, color: attivo ? "#1E5D39" : "#8A8271", fontSize: 12, fontWeight: attivo ? 700 : 400, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #1A140D", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#812C2C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white" }}>RS</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#241D14", fontWeight: 600 }}>RSPP Esterno</div>
            <div style={{ fontSize: 10, color: "#5C5545" }}>{aziende.length} aziende gestite</div>
          </div>
          <button onClick={() => logout()} title="Esci dall'account" style={{ background: "none", border: "1px solid #1A140D", borderRadius: 7, color: "#5C5545", fontSize: 11, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>Esci</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{ padding: "16px 28px", borderBottom: "1px solid #1A140D", background: "#FBF8F1", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#241D14", letterSpacing: "-0.3px" }}>
              {tutteLeVoci.find(n => n.id === modulo)?.label || "Dashboard"}
            </div>
            {aziendaAttiva && (
              <div style={{ fontSize: 11, color: "#8A8271", marginTop: 1 }}>{aziendaAttiva.nome}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Banner beta — visibile solo in MVP_MODE */}
            {MVP_MODE && (
              <div style={{ padding: "5px 12px", background: "#1E5D3910", border: "1px solid #1E5D3930", borderRadius: 7, fontSize: 11, color: "#1E5D39", fontWeight: 600, letterSpacing: "0.3px" }}>
                BETA — Analisi conformita' attestati
              </div>
            )}
            {stat && stat.scaduti > 0 && (
              <div style={{ padding: "6px 12px", background: "#812C2C15", border: "1px solid #812C2C30", borderRadius: 7, fontSize: 12, color: "#812C2C", fontWeight: 600 }}>
                🚨 {stat.scaduti} scaduti
              </div>
            )}
            {/* Bottone DUVRI nascosto in MVP_MODE */}
            {!MVP_MODE && aziendaAttiva && (
              <button onClick={() => setModulo("duvri")} style={{ padding: "8px 16px", background: "#1E5D39", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Nuovo DUVRI</button>
            )}
          </div>
        </div>

        {/* Banner errore caricamento dati */}
        {erroreDati && (
          <div style={{ margin: "12px 28px 0", padding: "10px 16px", background: "#812C2C12", border: "1px solid #812C2C30", borderRadius: 8, fontSize: 12, color: "#812C2C" }}>
            Errore dati: {erroreDati}
            <span onClick={() => ricaricaDB()} style={{ textDecoration: "underline", cursor: "pointer", marginLeft: 8 }}>Riprova</span>
          </div>
        )}

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
              <div style={{ fontSize: 18, fontWeight: 700, color: "#8A8271" }}>{tutteLeVoci.find(n => n.id === modulo)?.label}</div>
              <div style={{ fontSize: 13, color: "#1A140D", background: "#FBF8F1", padding: "8px 16px", borderRadius: 8, border: "1px solid #1A140D" }}>In sviluppo — prossima versione</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
// In MVP_MODE (freemium, nessun login) monta AppMVP: nessuna chiamata a Supabase.
// A MVP_MODE = false si torna alla versione pro multi-azienda (richiede login,
// da rimontare dietro AuthSupabase in index.js quando si riattiva).
export default function rspPINOApp() {
  return MVP_MODE ? <AppMVP /> : <AppCompleta />;
}
