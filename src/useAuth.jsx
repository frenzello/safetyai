import { useState, useEffect } from "react";
import { supabase } from "./database";
import Auth from "./Auth";

// ═══════════════════════════════════════════════════════════════════════════
// useAuth — hook che traccia lo stato di autenticazione
// Usalo in App.js per sapere se c'è un utente loggato
// ═══════════════════════════════════════════════════════════════════════════

export function useAuth() {
  const [user, setUser] = useState(null);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    // Stato iniziale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCaricamento(false);
    });

    // Listener per cambi (login, logout, refresh token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return { user, caricamento, logout };
}

// ═══════════════════════════════════════════════════════════════════════════
// Paywall — componente di blocco per funzionalità premium
// Mostra schermata "registrati per sbloccare" + bottoni accesso/registrazione
// ═══════════════════════════════════════════════════════════════════════════

export function Paywall({ nomeFunzionalita, descrizione, icona = "🔒" }) {
  const [mostraAuth, setMostraAuth] = useState(false);

  if (mostraAuth) {
    return <Auth mostraTornaIndietro onClose={() => setMostraAuth(false)} />;
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: 400, padding: 32,
    }}>
      <div style={{
        maxWidth: 480, width: "100%",
        background: "#161b27", border: "1px solid #1e2535",
        borderRadius: 16, padding: "36px 32px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{icona}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>
          {nomeFunzionalita}
        </div>
        <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 28 }}>
          {descrizione}
        </div>

        <div style={{
          padding: "16px 18px", marginBottom: 24,
          background: "#3b82f608", border: "1px solid #3b82f625",
          borderRadius: 10, textAlign: "left",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", marginBottom: 10 }}>
            ✨ Con un account gratuito puoi:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#94a3b8" }}>
            <div>📂 Salvare i tuoi cantieri e riprenderli quando vuoi</div>
            <div>🔔 Ricevere notifiche automatiche delle scadenze</div>
            <div>🏷️ Generare badge identificativi CR80</div>
            <div>📋 Compilare DUVRI e POS con i tuoi dati reali</div>
            <div>📊 Tracciare accessi al cantiere</div>
          </div>
        </div>

        <button
          onClick={() => setMostraAuth(true)}
          style={{
            width: "100%", padding: "13px",
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            border: "none", borderRadius: 10,
            color: "white", fontSize: 13, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
          }}>
          Registrati gratis →
        </button>
        <div style={{ marginTop: 12, fontSize: 11, color: "#475569" }}>
          Registrazione gratuita · Nessuna carta di credito richiesta
        </div>
      </div>
    </div>
  );
}
