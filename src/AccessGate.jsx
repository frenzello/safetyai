import { useState } from "react";

const CODICE = process.env.REACT_APP_ACCESS_CODE || "safetyai2025";
const KEY = "safetyai_auth_v1";

export default function AccessGate({ children }) {
  const [autenticato, setAutenticato] = useState(
    () => sessionStorage.getItem(KEY) === "1"
  );
  const [input, setInput] = useState("");
  const [errore, setErrore] = useState(false);
  const [shake, setShake] = useState(false);

  if (autenticato) return children;

  function accedi() {
    if (input.trim() === CODICE) {
      sessionStorage.setItem(KEY, "1");
      setAutenticato(true);
    } else {
      setErrore(true);
      setShake(true);
      setInput("");
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <div style={{
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: "#0f1117",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#e2e8f0",
    }}>
      <div style={{
        background: "#161b27",
        border: "1px solid #1e2535",
        borderRadius: 16,
        padding: "40px 36px",
        width: 340,
        textAlign: "center",
        animation: shake ? "shake 0.5s ease" : "none",
      }}>
        {/* Logo */}
        <div style={{
          width: 48, height: 48,
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 800, color: "white",
          margin: "0 auto 20px",
        }}>S</div>

        <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 }}>SafetyAI</div>
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 28 }}>Inserisci il codice di accesso</div>

        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setErrore(false); }}
          onKeyDown={e => e.key === "Enter" && accedi()}
          placeholder="Codice di accesso"
          autoFocus
          style={{
            width: "100%",
            padding: "12px 14px",
            background: "#0f1117",
            border: `1px solid ${errore ? "#ef4444" : "#1e2535"}`,
            borderRadius: 9,
            color: "#f1f5f9",
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 8,
            letterSpacing: "0.1em",
          }}
        />

        {errore && (
          <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 10, textAlign: "left" }}>
            Codice non corretto
          </div>
        )}

        <button
          onClick={accedi}
          style={{
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            border: "none",
            borderRadius: 9,
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            marginTop: errore ? 0 : 4,
          }}>
          Accedi
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
