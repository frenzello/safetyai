import { useState } from "react";
import ModuloPOS from "./POS";
import GestioneTemplatesDUVRIDVR from "./TemplatesDUVRIDVR";
import ImpostazioniTenant from "./Impostazioni";
import UploadMassivo from "./UploadMassivo";
import RegistroScadenze from "./RegistroScadenze";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const OGGI = new Date("2026-04-19");

function parseData(str) {
  if (!str) return null;
  const [g, m, a] = str.split("/");
  return new Date(`${a}-${m}-${g}`);
}
function giorniAllaScadenza(str) {
  const d = parseData(str);
  if (!d) return null;
  return Math.ceil((d - OGGI) / (1000 * 60 * 60 * 24));
}
function statoScadenza(str) {
  const g = giorniAllaScadenza(str);
  if (g === null) return "ok";
  if (g < 0) return "scaduto";
  if (g <= 15) return "critico";
  if (g <= 30) return "attenzione";
  return "ok";
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const LAVORATORI = [
  {
    id: 1, nome: "Marco Rossi", cf: "RSSMRC75A01L781K",
    appaltatore: "Edil Rossi S.r.l.", mansione: "Caposquadra",
    documenti: [
      { tipo: "Formazione generale lavoratori", scadenza: "15/08/2028", rilascio: "15/08/2022", ore: 8 },
      { tipo: "Formazione specifica — Rischio chimico", scadenza: "01/05/2026", rilascio: "01/05/2022", ore: 12 },
      { tipo: "Primo soccorso gruppo B", scadenza: "10/03/2026", rilascio: "10/03/2023", ore: 12 },
      { tipo: "Antincendio rischio medio", scadenza: "20/11/2029", rilascio: "20/11/2023", ore: 8 },
      { tipo: "Lavori in quota DPI 3a cat.", scadenza: "05/05/2026", rilascio: "05/05/2023", ore: 8 },
      { tipo: "Idoneità sanitaria", scadenza: "01/12/2026", rilascio: "01/12/2025", ore: null },
    ],
  },
  {
    id: 2, nome: "Luigi Bianchi", cf: "BNCLGU82B20F205Z",
    appaltatore: "Edil Rossi S.r.l.", mansione: "Operaio specializzato",
    documenti: [
      { tipo: "Formazione generale lavoratori", scadenza: "10/01/2027", rilascio: "10/01/2022", ore: 8 },
      { tipo: "Formazione specifica — MMC", scadenza: "15/09/2026", rilascio: "15/09/2021", ore: 8 },
      { tipo: "Primo soccorso gruppo B", scadenza: "20/06/2026", rilascio: "20/06/2023", ore: 12 },
      { tipo: "Idoneità sanitaria", scadenza: "15/05/2026", rilascio: "15/05/2025", ore: null },
    ],
  },
  {
    id: 3, nome: "Giuseppe Testa", cf: "TSTGPP68D15A794R",
    appaltatore: "GT Impianti S.r.l.", mansione: "Elettricista",
    documenti: [
      { tipo: "Formazione generale lavoratori", scadenza: "01/03/2027", rilascio: "01/03/2022", ore: 8 },
      { tipo: "Rischio elettrico CEI 11-27", scadenza: "01/03/2027", rilascio: "01/03/2023", ore: 16 },
      { tipo: "Antincendio rischio basso", scadenza: "15/01/2028", rilascio: "15/01/2023", ore: 4 },
      { tipo: "Idoneità sanitaria", scadenza: "01/06/2027", rilascio: "01/06/2025", ore: null },
      { tipo: "Patente a crediti", scadenza: "01/01/2028", rilascio: "01/10/2024", ore: null },
    ],
  },
  {
    id: 4, nome: "Anna Ferrari", cf: "FRRNNA80F45G224Y",
    appaltatore: "Clean Service S.r.l.", mansione: "Addetta pulizie",
    documenti: [
      { tipo: "Formazione generale lavoratori", scadenza: "10/06/2026", rilascio: "10/06/2021", ore: 8 },
      { tipo: "Uso prodotti chimici", scadenza: "20/06/2026", rilascio: "20/06/2023", ore: 8 },
      { tipo: "Antincendio rischio basso", scadenza: "20/04/2026", rilascio: "20/04/2023", ore: 4 },
      { tipo: "Idoneità sanitaria", scadenza: "01/11/2026", rilascio: "01/11/2025", ore: null },
    ],
  },
];

const APPALTATORI = [
  { id: 1, nome: "Edil Rossi S.r.l.", piva: "02341567890", referente: "Marco Rossi", email: "sicurezza@edilrossi.it", stato: "critico" },
  { id: 2, nome: "GT Impianti S.r.l.", piva: "03456789012", referente: "Giuseppe Testa", email: "g.testa@gtimpianti.com", stato: "ok" },
  { id: 3, nome: "Clean Service S.r.l.", piva: "04567890123", referente: "Anna Ferrari", email: "aferrari@cleanservice.it", stato: "attenzione" },
];

const DUVRI_LIST = [
  { id: "DVR-2026-047", appaltatore: "Edil Rossi S.r.l.", lavori: "Sostituzione cuscinetti linea 3", area: "Formatura", data: "19/04/2026", stato: "da_firmare" },
  { id: "DVR-2026-046", appaltatore: "GT Impianti S.r.l.", lavori: "Manutenzione quadri elettrici", area: "Forno / Fusione", data: "15/04/2026", stato: "firmato" },
  { id: "DVR-2026-045", appaltatore: "Clean Service S.r.l.", lavori: "Pulizie industriali", area: "Magazzino", data: "10/04/2026", stato: "firmato" },
  { id: "DVR-2026-044", appaltatore: "Edil Rossi S.r.l.", lavori: "Sostituzione guarnizioni forno", area: "Forno / Fusione", data: "02/04/2026", stato: "archiviato" },
];

const NOTIFICHE_LOG = [
  { id: 1, ts: "19/04 08:00", tipo: "critico", lavoratore: "Marco Rossi", doc: "Primo soccorso gruppo B", appaltatore: "Edil Rossi S.r.l.", giorni: -40 },
  { id: 2, ts: "19/04 08:00", tipo: "attenzione", lavoratore: "Marco Rossi", doc: "Formazione specifica — Rischio chimico", appaltatore: "Edil Rossi S.r.l.", giorni: 12 },
  { id: 3, ts: "19/04 08:00", tipo: "attenzione", lavoratore: "Anna Ferrari", doc: "Antincendio rischio basso", appaltatore: "Clean Service S.r.l.", giorni: 1 },
  { id: 4, ts: "18/04 08:00", tipo: "attenzione", lavoratore: "Luigi Bianchi", doc: "Idoneità sanitaria", appaltatore: "Edil Rossi S.r.l.", giorni: 26 },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function statoLavoratore(lav) {
  const stati = lav.documenti.map(d => statoScadenza(d.scadenza));
  if (stati.includes("scaduto")) return "scaduto";
  if (stati.includes("critico")) return "critico";
  if (stati.includes("attenzione")) return "attenzione";
  return "ok";
}
function accessoConsentito(lav) {
  return !lav.documenti.some(d => statoScadenza(d.scadenza) === "scaduto");
}

const STATO_DOC = {
  ok:         { color: "#10b981", bg: "#10b98115", label: "Valido" },
  attenzione: { color: "#f59e0b", bg: "#f59e0b15", label: "In scadenza" },
  critico:    { color: "#ef4444", bg: "#ef444415", label: "Critico" },
  scaduto:    { color: "#ef4444", bg: "#ef444425", label: "SCADUTO" },
};

const STATO_DUVRI = {
  firmato:    { color: "#10b981", bg: "#10b98115", label: "Firmato" },
  da_firmare: { color: "#f59e0b", bg: "#f59e0b15", label: "Da firmare" },
  archiviato: { color: "#475569", bg: "#47556915", label: "Archiviato" },
};

function Badge({ stato, small }) {
  const cfg = STATO_DOC[stato] || STATO_DOC.ok;
  return (
    <span style={{
      padding: small ? "2px 7px" : "4px 10px",
      borderRadius: 20, background: cfg.bg, color: cfg.color,
      fontSize: small ? 10 : 11, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <span style={{ fontSize: 7 }}>●</span>{cfg.label}
    </span>
  );
}

// ─── MODULO DASHBOARD ─────────────────────────────────────────────────────────
function ModuloDashboard({ onNavigate }) {
  const scadenzeUrgenti = LAVORATORI.flatMap(l =>
    l.documenti.filter(d => ["scaduto","critico","attenzione"].includes(statoScadenza(d.scadenza)))
      .map(d => ({ lav: l, doc: d, stato: statoScadenza(d.scadenza), giorni: giorniAllaScadenza(d.scadenza) }))
  ).sort((a, b) => (a.giorni ?? 999) - (b.giorni ?? 999));

  const lavBloccati = LAVORATORI.filter(l => !accessoConsentito(l));

  return (
    <div>
      {/* Alert critico */}
      {lavBloccati.length > 0 && (
        <div style={{
          padding: "14px 20px", marginBottom: 24,
          background: "#ef444412", border: "1px solid #ef444430",
          borderRadius: 12, display: "flex", gap: 12, alignItems: "center",
        }}>
          <span style={{ fontSize: 22 }}>🚨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>
              {lavBloccati.length} lavorator{lavBloccati.length > 1 ? "i" : "e"} con accesso bloccato
            </div>
            <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 2 }}>
              {lavBloccati.map(l => l.nome).join(", ")} — documenti scaduti
            </div>
          </div>
          <button
            onClick={() => onNavigate("accessi")}
            style={{
              padding: "7px 14px", background: "#ef444420",
              border: "1px solid #ef444440", borderRadius: 7,
              color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>Gestisci →</button>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Appalti attivi", value: 3, sub: "in questo stabilimento", color: "#60a5fa", icon: "◈", mod: "duvri" },
          { label: "Lavoratori idonei", value: `${LAVORATORI.filter(accessoConsentito).length}/${LAVORATORI.length}`, sub: `${lavBloccati.length} bloccati`, color: lavBloccati.length > 0 ? "#ef4444" : "#10b981", icon: "✓", mod: "accessi" },
          { label: "Scadenze urgenti", value: scadenzeUrgenti.filter(s => s.stato !== "ok").length, sub: "entro 30 giorni", color: "#f59e0b", icon: "⏱", mod: "notifiche" },
          { label: "DUVRI da firmare", value: DUVRI_LIST.filter(d => d.stato === "da_firmare").length, sub: "in attesa firma", color: "#a78bfa", icon: "📋", mod: "duvri" },
          { label: "Appaltatori attivi", value: APPALTATORI.length, sub: `${APPALTATORI.filter(a => a.stato === "critico").length} con criticità`, color: "#06b6d4", icon: "🏢", mod: "idoneita" },
          { label: "Notifiche oggi", value: NOTIFICHE_LOG.filter(n => n.ts.startsWith("19/04")).length, sub: "email inviate", color: "#10b981", icon: "📧", mod: "notifiche" },
        ].map((s, i) => (
          <div
            key={i}
            onClick={() => onNavigate(s.mod)}
            style={{
              background: "#161b27", border: `1px solid ${s.color}20`,
              borderRadius: 12, padding: "18px 20px",
              cursor: "pointer", position: "relative", overflow: "hidden",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = s.color + "50"}
            onMouseLeave={e => e.currentTarget.style.borderColor = s.color + "20"}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color }} />
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: "-1px" }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Due colonne */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Scadenze */}
        <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid #1e2535",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>Scadenze imminenti</span>
            <span onClick={() => onNavigate("accessi")} style={{ fontSize: 11, color: "#3b82f6", cursor: "pointer" }}>Vedi tutte →</span>
          </div>
          {scadenzeUrgenti.slice(0, 5).map((s, i) => {
            const cfg = STATO_DOC[s.stato];
            return (
              <div key={i} style={{
                padding: "11px 20px", borderBottom: "1px solid #1e253540",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0, boxShadow: `0 0 5px ${cfg.color}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.lav.nome}</div>
                  <div style={{ fontSize: 10, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.doc.tipo}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>
                  {s.giorni < 0 ? `${Math.abs(s.giorni)}gg fa` : `${s.giorni}gg`}
                </div>
              </div>
            );
          })}
        </div>

        {/* DUVRI recenti */}
        <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid #1e2535",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>DUVRI recenti</span>
            <span onClick={() => onNavigate("duvri")} style={{ fontSize: 11, color: "#3b82f6", cursor: "pointer" }}>Vedi tutti →</span>
          </div>
          {DUVRI_LIST.map((d, i) => {
            const cfg = STATO_DUVRI[d.stato];
            return (
              <div key={i} style={{
                padding: "11px 20px", borderBottom: "1px solid #1e253540",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.appaltatore}</div>
                  <div style={{ fontSize: 10, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.lavori} · {d.area}</div>
                </div>
                <span style={{
                  padding: "2px 8px", borderRadius: 20,
                  background: cfg.bg, color: cfg.color,
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MODULO IDONEITÀ ──────────────────────────────────────────────────────────
function ModuloIdoneita() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const lavoratoriFiltrati = LAVORATORI.filter(l =>
    !search || l.nome.toLowerCase().includes(search.toLowerCase()) || l.appaltatore.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    const lav = LAVORATORI.find(l => l.id === selected);
    const sl = statoLavoratore(lav);
    const cfg = STATO_DOC[sl] || STATO_DOC.ok;
    const accesso = accessoConsentito(lav);

    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 20 }}>← Torna alla lista</button>

        <div style={{ background: "#161b27", border: `1px solid ${cfg.color}30`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          <div style={{
            padding: "24px 28px", background: `linear-gradient(135deg,${cfg.color}10,transparent)`,
            borderBottom: "1px solid #1e2535", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: `${cfg.color}20`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 18, fontWeight: 800, color: cfg.color,
              }}>{lav.nome.split(" ").map(n => n[0]).join("")}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>{lav.nome}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{lav.mansione} · {lav.appaltatore}</div>
              </div>
            </div>
            <div style={{
              padding: "8px 16px", borderRadius: 9,
              background: accesso ? "#10b98115" : "#ef444415",
              border: `1px solid ${accesso ? "#10b98130" : "#ef444430"}`,
              color: accesso ? "#10b981" : "#ef4444",
              fontSize: 13, fontWeight: 800,
            }}>{accesso ? "✓ ACCESSO CONSENTITO" : "✗ ACCESSO BLOCCATO"}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {lav.documenti
              .sort((a, b) => {
                const ord = { scaduto: 0, critico: 1, attenzione: 2, ok: 3 };
                return (ord[statoScadenza(a.scadenza)] ?? 4) - (ord[statoScadenza(b.scadenza)] ?? 4);
              })
              .map((doc, i) => {
                const s = statoScadenza(doc.scadenza);
                const dcfg = STATO_DOC[s] || STATO_DOC.ok;
                const gg = giorniAllaScadenza(doc.scadenza);
                return (
                  <div key={i} style={{
                    padding: "14px 28px", borderBottom: "1px solid #1e253550",
                    display: "flex", alignItems: "center", gap: 14,
                    borderLeft: `3px solid ${dcfg.color}`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{doc.tipo}</div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 3, display: "flex", gap: 10 }}>
                        <span>Rilascio: {doc.rilascio}</span>
                        {doc.ore && <span>🕐 {doc.ore}h</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge stato={s} />
                      <div style={{ fontSize: 11, color: dcfg.color, marginTop: 4, fontWeight: 600 }}>
                        {doc.scadenza} {gg !== null && `(${gg < 0 ? Math.abs(gg) + "gg fa" : gg + "gg"})`}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>Idoneità tecnico-professionale</div>
        <div style={{ fontSize: 13, color: "#475569" }}>Verifica documentale lavoratori e appaltatori</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Idonei", value: LAVORATORI.filter(l => accessoConsentito(l) && statoLavoratore(l) === "ok").length, color: "#10b981" },
          { label: "Con scadenze", value: LAVORATORI.filter(l => ["attenzione","critico"].includes(statoLavoratore(l))).length, color: "#f59e0b" },
          { label: "Bloccati", value: LAVORATORI.filter(l => !accessoConsentito(l)).length, color: "#ef4444" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#161b27", border: `1px solid ${s.color}20`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <input
        placeholder="Cerca lavoratore o appaltatore..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, color: "#cbd5e1", fontSize: 13, marginBottom: 14, boxSizing: "border-box" }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lavoratoriFiltrati.map(lav => {
          const sl = statoLavoratore(lav);
          const cfg = STATO_DOC[sl] || STATO_DOC.ok;
          const accesso = accessoConsentito(lav);
          return (
            <div key={lav.id} onClick={() => setSelected(lav.id)} style={{
              background: "#161b27", border: `1px solid ${!accesso ? "#ef444330" : "#1e2535"}`,
              borderRadius: 12, padding: "16px 20px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: `${cfg.color}15`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 15, fontWeight: 800, color: cfg.color,
              }}>{lav.nome.split(" ").map(n => n[0]).join("")}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{lav.nome}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{lav.mansione} · {lav.appaltatore}</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {lav.documenti.map((doc, i) => {
                  const s = statoScadenza(doc.scadenza);
                  const c = (STATO_DOC[s] || STATO_DOC.ok).color;
                  return <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, boxShadow: `0 0 4px ${c}` }} title={doc.tipo} />;
                })}
              </div>
              <div style={{
                padding: "5px 12px", borderRadius: 8,
                background: accesso ? "#10b98115" : "#ef444415",
                color: accesso ? "#10b981" : "#ef4444",
                fontSize: 11, fontWeight: 700,
              }}>{accesso ? "✓ OK" : "✗ Bloccato"}</div>
              <span style={{ color: "#334155" }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MODULO DUVRI ─────────────────────────────────────────────────────────────
function ModuloDUVRI() {
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [form, setForm] = useState({ tipo: "", descrizione: "", area: "", dataInizio: "", inQuota: false });

  const AREE = ["Forno / Fusione", "Formatura", "Ricottura", "Controllo qualità", "Pallettizzazione / Magazzino", "Esterno", "Uffici"];
  const TIPI = ["Manutenzione meccanica", "Manutenzione elettrica", "Pulizie industriali", "Lavori edili", "Ispezione", "Installazione macchinari", "Lavori in quota", "Altro"];

  const handleGenera = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 3000);
  };

  if (generated) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#10b98120", border: "2px solid #10b98140", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✓</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>DUVRI generato con successo</div>
            <div style={{ fontSize: 12, color: "#475569" }}>{selectedApp?.nome} · {form.area} · {new Date().toLocaleDateString("it-IT")}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button onClick={() => { setGenerated(false); setShowForm(false); setStep(1); }} style={{ padding: "9px 16px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, color: "#64748b", fontSize: 12, cursor: "pointer" }}>← Lista</button>
            <button style={{ padding: "9px 16px", background: "#1e2535", border: "1px solid #334155", borderRadius: 8, color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>↓ Word</button>
            <button style={{ padding: "9px 16px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 8, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✉ Invia per firma</button>
          </div>
        </div>
        <div style={{ background: "#161b27", border: "1px solid #10b98130", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2535", background: "#0f1117", fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>📋 DVR-2026-048 — {selectedApp?.nome} — {form.area}</div>
          <div style={{ padding: "28px 32px", background: "#fafaf9", maxHeight: 400, overflowY: "auto" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#1a1a1a", lineHeight: 1.9 }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <strong style={{ fontSize: 16 }}>DOCUMENTO UNICO DI VALUTAZIONE DEI RISCHI DA INTERFERENZA</strong><br />
                <em>Art. 26 D.Lgs. 81/2008 e s.m.i.</em>
              </div>
              <strong>1. DATI IDENTIFICATIVI</strong>
              <br /><br />
              Committente: Vetri Italiani S.r.l. — Via dell'Industria 12, 37100 Verona<br />
              Appaltatore: {selectedApp?.nome} — P.IVA {selectedApp?.piva}<br />
              RSPP Committente: Marco Albertini<br />
              <br />
              <strong>2. DESCRIZIONE DEI LAVORI</strong>
              <br /><br />
              {form.descrizione || `${form.tipo} nell'area ${form.area} dello stabilimento di Verona.`} I lavori avranno inizio il {form.dataInizio} con una durata stimata di {form.durata || 2} giorni lavorativi.
              <br /><br />
              <strong>3. RISCHI DA INTERFERENZA</strong>
              <br /><br />
              Sulla base dell'analisi delle attività interferenti tra il personale del committente e quello dell'appaltatore nell'area {form.area}, sono stati identificati i seguenti rischi interferenziali: investimento da carri ponte durante la movimentazione stampi (R=8), proiezione schegge da linee adiacenti in produzione (R=6), scivolamento su pavimento bagnato da acqua di raffreddamento (R=4).
              <br /><br />
              <strong>4. MISURE DI PREVENZIONE</strong>
              <br /><br />
              — Procedura LOTO obbligatoria prima di qualsiasi intervento sulla macchina<br />
              — DPI obbligatori: casco EN 397, occhiali EN 166, scarpe S3, guanti EN 388, otoprotettori EN 352<br />
              — Coordinamento con preposto committente prima dell'inizio di ogni turno di lavoro<br />
              — Accesso vietato alle aree in produzione senza autorizzazione del preposto
              <br /><br />
              <strong>5. COSTI DELLA SICUREZZA: € 130,00</strong>
              <br /><br />
              [... documento completo generato dall'AI ...]
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: "10px 16px", background: "#f59e0b10", border: "1px solid #f59e0b20", borderRadius: 8, fontSize: 12, color: "#f59e0b" }}>
          ⚠ Documento AI — validare e firmare prima dell'uso
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div style={{ maxWidth: 580 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800,
                background: step > n ? "#10b981" : step === n ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "#1e2535",
                color: step >= n ? "white" : "#334155",
              }}>{step > n ? "✓" : n}</div>
              <span style={{ fontSize: 12, color: step === n ? "#f1f5f9" : "#334155", fontWeight: step === n ? 700 : 400 }}>
                {["Appaltatore", "Lavori", "Genera"][n - 1]}
              </span>
              {n < 3 && <div style={{ width: 20, height: 1, background: "#1e2535", marginLeft: 4 }} />}
            </div>
          ))}
        </div>

        {generating ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 60, height: 60, margin: "0 auto 20px", borderRadius: "50%", border: "3px solid #1e2535", borderTop: "3px solid #3b82f6", animation: "spin 0.9s linear infinite" }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>Generazione in corso...</div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 8 }}>L'AI sta redigendo il DUVRI</div>
          </div>
        ) : step === 1 ? (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 20 }}>Seleziona appaltatore</div>
            {APPALTATORI.map(app => (
              <div key={app.id} onClick={() => setSelectedApp(app)} style={{
                background: selectedApp?.id === app.id ? "#1e3a5f" : "#161b27",
                border: `1px solid ${selectedApp?.id === app.id ? "#3b82f6" : "#1e2535"}`,
                borderRadius: 12, padding: "16px 20px", cursor: "pointer", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{app.nome}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>P.IVA {app.piva} · {app.referente}</div>
                </div>
                {selectedApp?.id === app.id && <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 800 }}>✓</div>}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "11px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" }}>← Annulla</button>
              <button onClick={() => setStep(2)} disabled={!selectedApp} style={{ flex: 2, padding: "11px", background: selectedApp ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "#1e2535", border: "none", borderRadius: 8, color: selectedApp ? "white" : "#334155", fontSize: 13, fontWeight: 700, cursor: selectedApp ? "pointer" : "not-allowed" }}>Continua →</button>
            </div>
          </div>
        ) : step === 2 ? (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 20 }}>Descrivi i lavori</div>
            {[
              { label: "Tipo di lavoro *", key: "tipo", type: "select", opts: TIPI },
              { label: "Area dello stabilimento *", key: "area", type: "select", opts: AREE },
              { label: "Data inizio *", key: "dataInizio", type: "date" },
              { label: "Descrizione dettagliata *", key: "descrizione", type: "textarea" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 6 }}>{f.label}</label>
                {f.type === "select" ? (
                  <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%", padding: "10px 14px", background: "#0f1117", border: "1px solid #1e2535", borderRadius: 8, color: "#cbd5e1", fontSize: 13, boxSizing: "border-box" }}>
                    <option value="">Seleziona...</option>
                    {f.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea rows={3} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder="Descrivi le attività specifiche..." style={{ width: "100%", padding: "10px 14px", background: "#0f1117", border: "1px solid #1e2535", borderRadius: 8, color: "#cbd5e1", fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
                ) : (
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%", padding: "10px 14px", background: "#0f1117", border: "1px solid #1e2535", borderRadius: 8, color: "#cbd5e1", fontSize: 13, boxSizing: "border-box" }} />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: "11px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" }}>← Indietro</button>
              <button onClick={() => setStep(3)} disabled={!form.tipo || !form.area || !form.dataInizio} style={{ flex: 2, padding: "11px", background: (form.tipo && form.area && form.dataInizio) ? "linear-gradient(135deg,#3b82f6,#06b6d4)" : "#1e2535", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Continua →</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 20 }}>Riepilogo</div>
            <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
              {[["Appaltatore", selectedApp?.nome], ["Area", form.area], ["Tipo lavoro", form.tipo], ["Data inizio", form.dataInizio]].map(([k, v], i, arr) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "11px 20px", borderBottom: i < arr.length - 1 ? "1px solid #1e253540" : "none", fontSize: 13 }}>
                  <span style={{ color: "#475569" }}>{k}</span>
                  <span style={{ color: "#cbd5e1", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 16px", background: "#3b82f610", border: "1px solid #3b82f620", borderRadius: 8, fontSize: 12, color: "#60a5fa", marginBottom: 20 }}>
              ⚡ L'AI includerà automaticamente tutti i rischi dell'area {form.area} e le misure di prevenzione specifiche per {form.tipo.toLowerCase()}.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: "12px", background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" }}>← Modifica</button>
              <button onClick={handleGenera} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 8, color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>⚡ Genera DUVRI con AI</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>Generatore DUVRI</div>
          <div style={{ fontSize: 13, color: "#475569" }}>Art. 26 D.Lgs. 81/08 · {DUVRI_LIST.length} documenti</div>
        </div>
        <button onClick={() => setShowForm(true)} style={{ padding: "10px 18px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 9, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Nuovo DUVRI</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Anno 2026", value: 47, color: "#60a5fa" },
          { label: "Da firmare", value: DUVRI_LIST.filter(d => d.stato === "da_firmare").length, color: "#f59e0b" },
          { label: "Tempo medio", value: "42 sec", color: "#10b981" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#161b27", border: `1px solid ${s.color}20`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
        {DUVRI_LIST.map((d, i) => {
          const cfg = STATO_DUVRI[d.stato];
          return (
            <div key={i} style={{ padding: "14px 20px", borderBottom: i < DUVRI_LIST.length - 1 ? "1px solid #1e253540" : "none", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#3b82f6", fontFamily: "monospace", fontWeight: 700 }}>{d.id}</span>
                  <span style={{ fontSize: 10, color: "#334155" }}>·</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>{d.data}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginTop: 2 }}>{d.appaltatore}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{d.lavori} · {d.area}</div>
              </div>
              <span style={{ padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>{cfg.label}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ padding: "5px 10px", background: "#1e2535", border: "none", borderRadius: 6, color: "#64748b", fontSize: 11, cursor: "pointer" }}>↓ PDF</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MODULO ACCESSI ───────────────────────────────────────────────────────────
function ModuloAccessi() {
  const [simula, setSimula] = useState(null);
  return (
    <div>
      {simula && (() => {
        const lav = LAVORATORI.find(l => l.id === simula);
        const ok = accessoConsentito(lav);
        return (
          <div style={{ position: "fixed", inset: 0, background: "#000000b0", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 20, width: 340, overflow: "hidden", boxShadow: "0 30px 80px #00000080" }}>
              <div style={{ padding: "32px 28px", background: ok ? "#10b98110" : "#ef444410", textAlign: "center", borderBottom: "1px solid #1e2535" }}>
                <div style={{ width: 70, height: 70, borderRadius: "50%", margin: "0 auto 16px", background: ok ? "#10b98120" : "#ef444420", border: `3px solid ${ok ? "#10b981" : "#ef4444"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{ok ? "✓" : "✗"}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: ok ? "#10b981" : "#ef4444", marginBottom: 6 }}>{ok ? "ACCESSO CONSENTITO" : "ACCESSO BLOCCATO"}</div>
                <div style={{ fontSize: 14, color: "#f1f5f9", fontWeight: 600 }}>{lav.nome}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{lav.appaltatore}</div>
              </div>
              {!ok && (
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2535" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 6 }}>Motivo blocco:</div>
                  {lav.documenti.filter(d => statoScadenza(d.scadenza) === "scaduto").map((d, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#fca5a5" }}>✗ {d.tipo}</div>
                  ))}
                </div>
              )}
              <div style={{ padding: "16px 20px" }}>
                <button onClick={() => setSimula(null)} style={{ width: "100%", padding: "11px", background: "#1e2535", border: "none", borderRadius: 8, color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>Chiudi</button>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>Gestione accessi</div>
      <div style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>Verifica in tempo reale idoneità all'accesso</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {LAVORATORI.map(lav => {
          const ok = accessoConsentito(lav);
          const sl = statoLavoratore(lav);
          const cfg = STATO_DOC[sl] || STATO_DOC.ok;
          const docProblematici = lav.documenti.filter(d => ["scaduto","critico","attenzione"].includes(statoScadenza(d.scadenza)));
          return (
            <div key={lav.id} style={{ background: "#161b27", border: `1px solid ${!ok ? "#ef444330" : "#1e2535"}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${cfg.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: cfg.color }}>{lav.nome.split(" ").map(n => n[0]).join("")}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{lav.nome}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{lav.mansione} · {lav.appaltatore}</div>
                </div>
                <div style={{ padding: "6px 14px", borderRadius: 8, background: ok ? "#10b98115" : "#ef444415", border: `1px solid ${ok ? "#10b98130" : "#ef444430"}`, color: ok ? "#10b981" : "#ef4444", fontSize: 12, fontWeight: 800 }}>{ok ? "✓ CONSENTITO" : "✗ BLOCCATO"}</div>
                <button onClick={() => setSimula(lav.id)} style={{ padding: "8px 14px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 7, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📱 QR</button>
              </div>
              {docProblematici.length > 0 && (
                <div style={{ padding: "8px 20px", background: ok ? "#f59e0b08" : "#ef444408", borderTop: `1px solid ${ok ? "#f59e0b20" : "#ef444420"}`, fontSize: 11, color: ok ? "#f59e0b" : "#ef4444" }}>
                  {docProblematici.map(d => {
                    const g = giorniAllaScadenza(d.scadenza);
                    return `${d.tipo.split("—")[0].trim()}: ${g < 0 ? "SCADUTO" : g + "gg"}`;
                  }).join(" · ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MODULO NOTIFICHE ─────────────────────────────────────────────────────────
function ModuloNotifiche() {
  const TIPO_CFG = {
    critico:    { color: "#ef4444", bg: "#ef444415", icon: "🚨", label: "Critico" },
    attenzione: { color: "#f59e0b", bg: "#f59e0b15", icon: "⚠",  label: "Avviso" },
  };
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>Notifiche automatiche</div>
      <div style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>Invio automatico ogni mattina alle 08:00</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Notifiche oggi", value: NOTIFICHE_LOG.filter(n => n.ts.startsWith("19/04")).length, color: "#60a5fa" },
          { label: "Inviate totali", value: NOTIFICHE_LOG.length, color: "#10b981" },
          { label: "Blocchi attivi", value: 1, color: "#ef4444" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#161b27", border: `1px solid ${s.color}20`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #1e2535", fontSize: 11, color: "#334155", fontWeight: 700, letterSpacing: "0.5px" }}>LOG INVII</div>
        {NOTIFICHE_LOG.map((n, i) => {
          const cfg = TIPO_CFG[n.tipo] || TIPO_CFG.attenzione;
          return (
            <div key={i} style={{ padding: "13px 20px", borderBottom: i < NOTIFICHE_LOG.length - 1 ? "1px solid #1e253540" : "none", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{cfg.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{n.lavoratore}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{n.doc} · {n.appaltatore}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span style={{ padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700 }}>{cfg.label}</span>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 3, fontFamily: "monospace" }}>{n.ts}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
export default function SafetyAIApp() {
  const [modulo, setModulo] = useState("dashboard");

  const NAV = [
    { id: "dashboard",     icon: "⊟", label: "Dashboard" },
    { id: "idoneita",      icon: "✓", label: "Idoneità" },
    { id: "upload",        icon: "📂", label: "Carica documenti" },
    { id: "scadenze",      icon: "⏱", label: "Scadenze" },
    { id: "duvri",         icon: "📋", label: "DUVRI" },
    { id: "pos",           icon: "◈", label: "POS" },
    { id: "accessi",       icon: "◉", label: "Accessi" },
    { id: "notifiche",     icon: "📧", label: "Notifiche" },
    { id: "templates",     icon: "🎨", label: "Template stile" },
    { id: "archivio",      icon: "≡", label: "Archivio" },
    { id: "impostazioni",  icon: "⚙", label: "Impostazioni" },
  ];

  const scadutiCount = LAVORATORI.filter(l => !accessoConsentito(l)).length;
  const urgentiCount = LAVORATORI.flatMap(l => l.documenti).filter(d => ["scaduto","critico"].includes(statoScadenza(d.scadenza))).length;

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", minHeight: "100vh", color: "#e2e8f0", display: "flex" }}>

      {/* Sidebar */}
      <div style={{ width: 220, background: "#161b27", borderRight: "1px solid #1e2535", display: "flex", flexDirection: "column", flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #1e2535" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#3b82f6,#06b6d4)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white" }}>S</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.3px" }}>SafetyAI</div>
              <div style={{ fontSize: 9, color: "#64748b", letterSpacing: "1px" }}>GESTIONALE HSE</div>
            </div>
          </div>
        </div>

        {/* Tenant */}
        <div style={{ padding: "10px 20px", borderBottom: "1px solid #1e2535", background: "#0f1117" }}>
          <div style={{ fontSize: 9, color: "#334155", marginBottom: 2, letterSpacing: "0.5px" }}>AZIENDA</div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Vetri Italiani S.r.l.</div>
        </div>

        {/* Alert badge */}
        {urgentiCount > 0 && (
          <div onClick={() => setModulo("accessi")} style={{
            margin: "10px 12px 0", padding: "8px 12px",
            background: "#ef444412", border: "1px solid #ef444425",
            borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>🚨</span>
            <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>{urgentiCount} doc. urgenti</span>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 0" }}>
          {NAV.map(item => {
            const attivo = modulo === item.id;
            return (
              <button key={item.id} onClick={() => setModulo(item.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 20px", background: attivo ? "#1e3a5f22" : "transparent",
                border: "none", borderLeft: `2px solid ${attivo ? "#3b82f6" : "transparent"}`,
                color: attivo ? "#60a5fa" : "#64748b",
                fontSize: 13, fontWeight: attivo ? 700 : 400, cursor: "pointer", textAlign: "left",
              }}>
                <span style={{ fontSize: 14, opacity: 0.8 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #1e2535", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white" }}>AS</div>
          <div>
            <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600 }}>ASPP</div>
            <div style={{ fontSize: 10, color: "#475569" }}>Vetri Italiani</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{
          padding: "16px 28px", borderBottom: "1px solid #1e2535",
          background: "#161b27", display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              {NAV.find(n => n.id === modulo)?.label || "Dashboard"}
            </div>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 1 }}>
              Domenica 19 aprile 2026 · {OGGI.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {urgentiCount > 0 && (
              <div style={{ padding: "6px 12px", background: "#ef444415", border: "1px solid #ef444430", borderRadius: 7, fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
                🚨 {urgentiCount} urgenti
              </div>
            )}
            <button onClick={() => setModulo("duvri")} style={{ padding: "8px 16px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", border: "none", borderRadius: 8, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Nuovo DUVRI</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          {modulo === "dashboard"    && <ModuloDashboard onNavigate={setModulo} />}
          {modulo === "idoneita"     && <ModuloIdoneita />}
          {modulo === "duvri"        && <ModuloDUVRI />}
          {modulo === "accessi"      && <ModuloAccessi />}
          {modulo === "notifiche"    && <ModuloNotifiche />}
          {modulo === "pos"          && <ModuloPOS />}
          {modulo === "templates"    && <GestioneTemplatesDUVRIDVR />}
          {modulo === "impostazioni" && <ImpostazioniTenant />}
          {modulo === "upload"       && <UploadMassivo />}
          {modulo === "scadenze"     && <RegistroScadenze />}
          {modulo === "archivio"     && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 52, opacity: 0.15 }}>≡</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#334155" }}>Archivio</div>
              <div style={{ fontSize: 13, color: "#1e2535", background: "#161b27", padding: "8px 16px", borderRadius: 8, border: "1px solid #1e2535" }}>In sviluppo — Fase 2</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
