import { useState } from "react";
import { supabase } from "./database";

export default function Auth({ onClose, mostraTornaIndietro = false }) {
  const [modalita, setModalita] = useState("login"); // login | registrati | recupera
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [ruolo, setRuolo] = useState("RSPP");
  const [caricamento, setCaricamento] = useState(false);
  const [messaggio, setMessaggio] = useState(null); // { tipo: "ok"|"errore", testo: "..." }

  async function handleLogin(e) {
    e.preventDefault();
    setCaricamento(true);
    setMessaggio(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCaricamento(false);
    if (error) setMessaggio({ tipo: "errore", testo: traduciErrore(error.message) });
  }

  async function handleRegistrati(e) {
    e.preventDefault();
    setCaricamento(true);
    setMessaggio(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nome, cognome, ruolo_professionale: ruolo } },
    });
    setCaricamento(false);
    if (error) setMessaggio({ tipo: "errore", testo: traduciErrore(error.message) });
    else setMessaggio({ tipo: "ok", testo: "Controlla la tua email per confermare l'account." });
  }

  async function handleRecuperaPassword(e) {
    e.preventDefault();
    setCaricamento(true);
    setMessaggio(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setCaricamento(false);
    if (error) setMessaggio({ tipo: "errore", testo: traduciErrore(error.message) });
    else setMessaggio({ tipo: "ok", testo: "Ti abbiamo inviato un'email con le istruzioni per reimpostare la password." });
  }

  async function handleSocialLogin(provider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) setMessaggio({ tipo: "errore", testo: traduciErrore(error.message) });
  }

  return (
    <div style={{
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: "#0f1117", minHeight: "100vh", color: "#e2e8f0",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "#161b27", border: "1px solid #1e2535",
        borderRadius: 16, width: "100%", maxWidth: 440,
        padding: "32px 32px 28px",
        boxShadow: "0 24px 60px #00000080",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "white",
          }}>S</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>SafetyAI</span>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 }}>
            {modalita === "login" && "Accedi al tuo account"}
            {modalita === "registrati" && "Crea il tuo account"}
            {modalita === "recupera" && "Recupera password"}
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            {modalita === "login" && "Bentornato! Continua il tuo lavoro."}
            {modalita === "registrati" && "Salva i tuoi dati, ricevi notifiche scadenze, gestisci più cantieri."}
            {modalita === "recupera" && "Ti invieremo un link per reimpostare la password."}
          </div>
        </div>

        {/* Messaggio */}
        {messaggio && (
          <div style={{
            padding: "12px 14px", marginBottom: 18,
            background: messaggio.tipo === "ok" ? "#10b98115" : "#ef444415",
            border: `1px solid ${messaggio.tipo === "ok" ? "#10b98140" : "#ef444440"}`,
            borderRadius: 9,
            fontSize: 12, color: messaggio.tipo === "ok" ? "#10b981" : "#fca5a5", lineHeight: 1.5,
          }}>
            {messaggio.testo}
          </div>
        )}

        {/* Social login (solo per login/registrati, non per recupera) */}
        {modalita !== "recupera" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                style={btnSocial}>
                <SvgGoogle /> Continua con Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin("azure")}
                style={btnSocial}>
                <SvgMicrosoft /> Continua con Microsoft
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: "#1e2535" }} />
              <span style={{ fontSize: 11, color: "#475569" }}>oppure</span>
              <div style={{ flex: 1, height: 1, background: "#1e2535" }} />
            </div>
          </>
        )}

        {/* Form */}
        <form onSubmit={
          modalita === "login" ? handleLogin :
          modalita === "registrati" ? handleRegistrati :
          handleRecuperaPassword
        }>
          {modalita === "registrati" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input
                    type="text" value={nome} onChange={e => setNome(e.target.value)} required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Cognome</label>
                  <input
                    type="text" value={cognome} onChange={e => setCognome(e.target.value)} required
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Sei un...</label>
                <select value={ruolo} onChange={e => setRuolo(e.target.value)} style={inputStyle}>
                  <option value="RSPP">RSPP esterno</option>
                  <option value="CSE">Coordinatore Sicurezza Esecuzione</option>
                  <option value="RSPP+CSE">Entrambi i ruoli</option>
                  <option value="ALTRO">Altro professionista sicurezza</option>
                </select>
              </div>
            </>
          )}

          <div style={{ marginBottom: modalita === "recupera" ? 16 : 12 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={inputStyle} placeholder="tuaemail@esempio.it"
            />
          </div>

          {modalita !== "recupera" && (
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required minLength={6} style={inputStyle}
                placeholder={modalita === "registrati" ? "Almeno 6 caratteri" : ""}
              />
            </div>
          )}

          <button type="submit" disabled={caricamento} style={{
            width: "100%", padding: "13px",
            background: caricamento ? "#1e3a5f" : "linear-gradient(135deg, #3b82f6, #06b6d4)",
            border: "none", borderRadius: 10,
            color: "white", fontSize: 13, fontWeight: 800,
            cursor: caricamento ? "wait" : "pointer", fontFamily: "inherit",
            marginBottom: 14,
          }}>
            {caricamento ? "Attendi..." :
             modalita === "login" ? "Accedi" :
             modalita === "registrati" ? "Crea account" :
             "Invia email di recupero"}
          </button>
        </form>

        {/* Navigazione modalità */}
        <div style={{ textAlign: "center", fontSize: 12, color: "#475569" }}>
          {modalita === "login" && (
            <>
              <button onClick={() => { setModalita("recupera"); setMessaggio(null); }} style={linkStyle}>
                Password dimenticata?
              </button>
              <div style={{ marginTop: 8 }}>
                Non hai un account?{" "}
                <button onClick={() => { setModalita("registrati"); setMessaggio(null); }} style={linkStyle}>
                  Registrati
                </button>
              </div>
            </>
          )}
          {modalita === "registrati" && (
            <div>
              Hai già un account?{" "}
              <button onClick={() => { setModalita("login"); setMessaggio(null); }} style={linkStyle}>
                Accedi
              </button>
            </div>
          )}
          {modalita === "recupera" && (
            <button onClick={() => { setModalita("login"); setMessaggio(null); }} style={linkStyle}>
              ← Torna al login
            </button>
          )}
        </div>

        {mostraTornaIndietro && (
          <div style={{ textAlign: "center", marginTop: 20, paddingTop: 20, borderTop: "1px solid #1e2535" }}>
            <button onClick={onClose} style={{ ...linkStyle, color: "#64748b" }}>
              ← Continua senza account (versione gratis)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STILI ───────────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "11px 14px", boxSizing: "border-box",
  background: "#0f1117", border: "1px solid #1e2535", borderRadius: 9,
  color: "#cbd5e1", fontSize: 13, fontFamily: "inherit",
};

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#64748b", letterSpacing: "0.3px", marginBottom: 5,
};

const linkStyle = {
  background: "none", border: "none", color: "#60a5fa",
  fontSize: 12, cursor: "pointer", fontFamily: "inherit",
  textDecoration: "underline",
};

const btnSocial = {
  width: "100%", padding: "11px",
  background: "#0f1117", border: "1px solid #1e2535",
  borderRadius: 9, color: "#e2e8f0",
  fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
};

// ─── ICONE SVG ───────────────────────────────────────────────────────────────
function SvgGoogle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function SvgMicrosoft() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
  );
}

// ─── TRADUZIONE ERRORI SUPABASE ──────────────────────────────────────────────
function traduciErrore(msg) {
  const m = (msg || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Email o password errati.";
  if (m.includes("user already registered")) return "Questa email è già registrata. Prova ad accedere.";
  if (m.includes("password should be at least")) return "La password deve essere di almeno 6 caratteri.";
  if (m.includes("email not confirmed")) return "Devi prima confermare la tua email. Controlla la posta.";
  if (m.includes("rate limit")) return "Troppi tentativi. Aspetta qualche minuto e riprova.";
  return msg || "Si è verificato un errore.";
}
