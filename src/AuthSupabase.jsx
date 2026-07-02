import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// Gate di autenticazione REALE (sostituisce il codice d'accesso condiviso).
// Mostra i figli solo se l'utente è autenticato; altrimenti login/registrazione.
// Ogni account vede SOLO i propri dati (Row Level Security lato Supabase).
export default function AuthSupabase({ children }) {
  const [session, setSession] = useState(undefined); // undefined = in caricamento
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setErr(null); setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Registrazione avviata: controlla la tua email per confermare l'account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e2) {
      setErr(e2.message || "Errore imprevisto");
    } finally {
      setLoading(false);
    }
  }

  const wrap = { minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 24 };

  if (session === undefined) {
    return <div style={{ ...wrap, color: "#64748b", fontSize: 14 }}>Caricamento…</div>;
  }
  if (session) return children;

  const input = { width: "100%", padding: "12px 14px", marginBottom: 12, background: "#0f1117", border: "1px solid #1e2535", borderRadius: 10, color: "#e2e8f0", fontSize: 14, boxSizing: "border-box" };

  return (
    <div style={wrap}>
      <div style={{ width: 360, maxWidth: "100%", background: "#161b27", border: "1px solid #1e2535", borderRadius: 16, padding: 28 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, margin: "0 auto 10px", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "white" }}>S</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>SafetyAI</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {mode === "login" ? "Accedi al tuo account" : "Crea un nuovo account"}
          </div>
        </div>

        <form onSubmit={submit}>
          <input style={input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <input style={input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} />

          {err && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 10 }}>{err}</div>}
          {msg && <div style={{ fontSize: 12, color: "#34d399", marginBottom: 10 }}>{msg}</div>}

          <button type="submit" disabled={loading} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: loading ? "#1e2535" : "linear-gradient(135deg,#3b82f6,#06b6d4)", color: "white", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Attendere…" : mode === "login" ? "Accedi" : "Registrati"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#64748b" }}>
          {mode === "login" ? "Non hai un account? " : "Hai già un account? "}
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(null); setMsg(null); }}
            style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
            {mode === "login" ? "Registrati" : "Accedi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility per il logout, da usare in un pulsante dell'app:
export async function logout() {
  await supabase.auth.signOut();
}
