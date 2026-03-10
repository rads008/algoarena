// frontend/src/components/Setup.jsx
import { useState } from "react";
import { api } from "../lib/api";

const FRIENDS = [
  { name: "Radhika",  placeholder: "e.g. radhika_lc" },
  { name: "Simran",   placeholder: "e.g. simran_algo" },
  { name: "Sugandha", placeholder: "e.g. sugandha_dev" },
];

export default function Setup({ onComplete }) {
  const [usernames, setUsernames] = useState({ Radhika: "", Simran: "", Sugandha: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};
    FRIENDS.forEach(f => {
      if (!usernames[f.name].trim()) newErrors[f.name] = "Username is required";
    });
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    setLoading(true);
    setGlobalError("");

    try {
      for (const f of FRIENDS) {
        await api.createUser({ name: f.name, leetcode_username: usernames[f.name].trim() });
      }
      onComplete();
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const colors = ["#f97316", "#06b6d4", "#a78bfa"];

  return (
    <div style={{
      minHeight: "100vh", background: "#020617", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24,
      fontFamily: "'Space Mono', monospace",
    }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
         * { box-sizing: border-box; margin:0; padding:0; }
         input::placeholder { color: #475569; }
         input:focus { outline: none; }
        `}
      </style>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚔️</div>
          <h1 style={{
            fontWeight: 700, fontSize: 32, letterSpacing: 2,
            background: "linear-gradient(90deg,#06b6d4,#a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>AlgoArena</h1>
          <p style={{ color: "#64748b", marginTop: 8, fontSize: 13 }}>
            Enter LeetCode usernames to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {FRIENDS.map((f, i) => (
            <div key={f.name}>
              <label style={{ display: "block", fontSize: 11, color: colors[i], marginBottom: 6, letterSpacing: 1 }}>
                {f.name.toUpperCase()}
              </label>
              <input
                type="text"
                placeholder={f.placeholder}
                value={usernames[f.name]}
                onChange={e => setUsernames(prev => ({ ...prev, [f.name]: e.target.value }))}
                style={{
                  width: "100%", background: "#0f172a",
                  border: `1px solid ${errors[f.name] ? "#ef4444" : colors[i]+"33"}`,
                  borderRadius: 10, padding: "12px 16px", color: "#f1f5f9",
                  fontSize: 14, fontFamily: "'Space Mono', monospace",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = colors[i]}
                onBlur={e => e.target.style.borderColor = errors[f.name] ? "#ef4444" : colors[i]+"33"}
              />
              {errors[f.name] && (
                <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors[f.name]}</p>
              )}
            </div>
          ))}

          {globalError && (
            <div style={{
              background: "#ef444411", border: "1px solid #ef444444",
              borderRadius: 10, padding: "12px 16px", color: "#ef4444", fontSize: 12,
            }}>⚠️ {globalError}</div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? "#1e293b" : "linear-gradient(135deg,#06b6d4,#0891b2)",
            border: "none", color: "#fff", padding: "14px",
            borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700, fontSize: 14, fontFamily: "'Space Mono', monospace",
            marginTop: 8, transition: "all 0.2s",
          }}>
            {loading ? "⟳ Validating & setting up..." : "🚀 Launch Arena"}
          </button>
        </form>
      </div>
    </div>
  );
}
