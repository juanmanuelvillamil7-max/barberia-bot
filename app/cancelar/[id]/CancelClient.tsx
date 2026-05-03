"use client";

import { useState } from "react";

interface Summary {
  clientName: string;
  serviceName: string;
  price: number;
  displayDate: string;
  startTime: string;
}

interface CancelClientProps {
  appointmentId: string;
  summary: Summary;
}

export default function CancelClient({ appointmentId, summary }: CancelClientProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleCancel() {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? "Error al cancelar el turno.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Error de conexión. Intentá de nuevo.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "1rem 0",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#d1fae5",
            marginBottom: "1rem",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem", fontWeight: 700, color: "#111827" }}>
          Turno cancelado
        </h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem" }}>
          Tu turno fue cancelado correctamente.
        </p>
        <a
          href="/reservar"
          style={{
            display: "inline-block",
            marginTop: "1.5rem",
            padding: "0.75rem 1.5rem",
            background: "#3b82f6",
            color: "#ffffff",
            borderRadius: "0.75rem",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
        >
          Agendar nuevo turno
        </a>
      </div>
    );
  }

  return (
    <div>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: "0.25rem", marginBottom: "1.5rem" }}>
        Revisá los datos de tu turno antes de cancelar.
      </p>

      {/* Summary */}
      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "0.75rem",
          padding: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          { label: "Cliente", value: summary.clientName },
          { label: "Servicio", value: summary.serviceName },
          { label: "Precio", value: `$${summary.price.toLocaleString("es-AR")}` },
          { label: "Fecha", value: summary.displayDate },
          { label: "Hora", value: `${summary.startTime}hs` },
        ].map(({ label, value }, i, arr) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingBottom: i < arr.length - 1 ? "0.5rem" : 0,
              marginBottom: i < arr.length - 1 ? "0.5rem" : 0,
              borderBottom: i < arr.length - 1 ? "1px solid #e5e7eb" : "none",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{label}</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827" }}>{value}</span>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            color: "#991b1b",
            fontSize: "0.85rem",
          }}
        >
          {errorMsg}
        </div>
      )}

      <button
        onClick={handleCancel}
        disabled={status === "loading"}
        style={{
          width: "100%",
          padding: "0.85rem",
          background: status === "loading" ? "#fca5a5" : "#ef4444",
          color: "#ffffff",
          border: "none",
          borderRadius: "0.75rem",
          fontSize: "1rem",
          fontWeight: 700,
          cursor: status === "loading" ? "not-allowed" : "pointer",
        }}
      >
        {status === "loading" ? "Cancelando..." : "Confirmar cancelación"}
      </button>

      <a
        href="/reservar"
        style={{
          display: "block",
          textAlign: "center",
          marginTop: "1rem",
          color: "#6b7280",
          fontSize: "0.85rem",
          textDecoration: "underline",
        }}
      >
        Volver al inicio
      </a>
    </div>
  );
}
