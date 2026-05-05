"use client";

import { useState, useEffect } from "react";

const EJEMPLOS = [
  "Sos relajado y usás humor cuando la situación lo permite.",
  "Siempre mencioná que aceptamos efectivo y transferencia.",
  "Si preguntan cuánto tarda, decí que el servicio de corte dura entre 30 y 45 minutos.",
  "Si el cliente duda entre servicios, recomendá el Corte + Barba como la mejor opción.",
  "Recordale al cliente que puede cancelar por este mismo chat hasta 2 horas antes.",
];

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-body)",
  fontSize: "0.62rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--stone)",
  marginBottom: "0.6rem",
};

export default function BotPage() {
  const [instructions, setInstructions] = useState("");
  const [original, setOriginal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/bot-config")
      .then((r) => r.json())
      .then((d) => {
        setInstructions(d.custom_instructions ?? "");
        setOriginal(d.custom_instructions ?? "");
        setSavedAt(d.updated_at ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/bot-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_instructions: instructions }),
      });
      const data = await res.json();
      if (res.ok) {
        setOriginal(instructions);
        setSavedAt(data.updated_at);
      }
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = instructions !== original;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.4rem" }}>
            Inteligencia artificial
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 300, color: "var(--ink)", margin: 0 }}>
            Personalidad del bot
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {savedAt && !hasChanges && (
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "var(--stone)" }}>
              Guardado {formatDate(savedAt)}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              padding: "0.65rem 1.5rem",
              background: hasChanges ? "#B8922A" : "var(--dust)",
              color: hasChanges ? "#fff" : "var(--stone)",
              border: "none",
              fontFamily: "var(--font-body)",
              fontSize: "0.68rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: hasChanges && !saving ? "pointer" : "not-allowed",
              transition: "background 0.2s",
            }}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>Cargando…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>

          {/* Editor */}
          <div>
            <label style={labelStyle}>Instrucciones personalizadas</label>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--stone)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              Escribí en lenguaje natural cómo querés que responda el bot. No hace falta formato especial — escribí como si le estuvieras explicando a una persona.
            </p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={"Escribí acá las instrucciones para el bot...\n\nEjemplo:\n- Sos relajado y con buena onda\n- Mencioná que aceptamos efectivo y transferencia\n- Si preguntan por demoras, aclará que el corte lleva 30-45 min"}
              rows={16}
              style={{
                width: "100%",
                padding: "1rem",
                border: "1px solid var(--dust)",
                background: "var(--cream)",
                fontFamily: "var(--font-body)",
                fontSize: "0.88rem",
                color: "var(--ink)",
                lineHeight: 1.65,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", color: "var(--rule)", marginTop: "0.5rem" }}>
              {instructions.length} caracteres
            </p>
          </div>

          {/* Guía + ejemplos */}
          <div>
            <label style={labelStyle}>Sugerencias de instrucciones</label>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--stone)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              Clickeá cualquier sugerencia para agregarla al editor.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "2rem" }}>
              {EJEMPLOS.map((ej, i) => (
                <button
                  key={i}
                  onClick={() => setInstructions((prev) => prev ? `${prev}\n- ${ej}` : `- ${ej}`)}
                  style={{
                    textAlign: "left",
                    padding: "0.7rem 0.9rem",
                    background: "transparent",
                    border: "1px solid var(--dust)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.78rem",
                    color: "var(--stone)",
                    cursor: "pointer",
                    lineHeight: 1.5,
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#B8922A";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--dust)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--stone)";
                  }}
                >
                  + {ej}
                </button>
              ))}
            </div>

            <div style={{ borderTop: "1px solid var(--dust)", paddingTop: "1.25rem" }}>
              <label style={labelStyle}>Lo que el bot ya sabe (base fija)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {[
                  "Nombre y ubicación de la barbería",
                  "Servicios y precios (desde Supabase)",
                  "Horarios de atención",
                  "Cómo agendar y cancelar turnos",
                  "Disponibilidad en tiempo real",
                  "Hablar en español argentino",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "#B8922A" }}>✓</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--stone)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
