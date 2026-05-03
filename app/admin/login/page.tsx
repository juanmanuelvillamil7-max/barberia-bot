"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BARBERIA_CONFIG } from "@/lib/config";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Credenciales incorrectas"); return; }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0",
    border: "none",
    borderBottom: "1px solid var(--dust)",
    background: "transparent",
    fontFamily: "var(--font-body)",
    fontSize: "1rem",
    color: "var(--ink)",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--cream)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1.5rem",
    }}>
      <div style={{ maxWidth: "360px", width: "100%" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ width: "32px", height: "1px", background: "var(--ink)", margin: "0 auto 1.5rem" }} />
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.5rem" }}>
            Panel de administración
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 300, color: "var(--ink)", margin: 0 }}>
            {BARBERIA_CONFIG.nombre}
          </h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.5rem" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@barberia.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "2.5rem" }}>
            <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.5rem" }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--ink)", borderLeft: "2px solid var(--ink)", paddingLeft: "0.75rem", marginBottom: "1.5rem" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "1rem",
              background: isLoading ? "var(--stone)" : "var(--ink)",
              color: "var(--cream)",
              border: "none",
              fontFamily: "var(--font-body)",
              fontSize: "0.72rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {isLoading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
