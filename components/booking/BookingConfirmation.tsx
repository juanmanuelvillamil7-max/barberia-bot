"use client";

import { useState } from "react";
import type { Service } from "@/types";

interface BookingConfirmationProps {
  service: Service;
  date: string;
  time: string;
  onConfirm: (clientName: string, clientEmail: string) => Promise<void>;
  isLoading: boolean;
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function BookingConfirmation({
  service,
  date,
  time,
  onConfirm,
  isLoading,
}: BookingConfirmationProps) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const displayDate = (() => {
    const d = new Date(`${date}T12:00:00`);
    return `${DAYS[d.getDay()]} ${d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}`;
  })();

  function validate(): boolean {
    const newErrors: { name?: string; email?: string } = {};
    if (!clientName.trim()) newErrors.name = "Ingresá tu nombre";
    if (!clientEmail.trim()) {
      newErrors.email = "Ingresá tu email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      newErrors.email = "Email inválido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onConfirm(clientName.trim(), clientEmail.trim());
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>
        Confirmá tu turno
      </h2>

      {/* Summary */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "0.75rem",
          padding: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <Row label="Servicio" value={service.name} />
        <Row label="Precio" value={`$${service.price.toLocaleString("es-AR")}`} />
        <Row label="Fecha" value={displayDate} />
        <Row label="Hora" value={`${time}hs`} last />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="clientName"
            style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" }}
          >
            Nombre completo
          </label>
          <input
            id="clientName"
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Tu nombre"
            style={{
              width: "100%",
              padding: "0.65rem 0.75rem",
              border: `1px solid ${errors.name ? "#ef4444" : "#d1d5db"}`,
              borderRadius: "0.5rem",
              fontSize: "1rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {errors.name && (
            <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>{errors.name}</p>
          )}
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="clientEmail"
            style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.3rem" }}
          >
            Email
          </label>
          <input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="tu@email.com"
            style={{
              width: "100%",
              padding: "0.65rem 0.75rem",
              border: `1px solid ${errors.email ? "#ef4444" : "#d1d5db"}`,
              borderRadius: "0.5rem",
              fontSize: "1rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {errors.email && (
            <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>{errors.email}</p>
          )}
          <p style={{ color: "#9ca3af", fontSize: "0.75rem", margin: "0.25rem 0 0" }}>
            Te enviamos la confirmación por email.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.85rem",
            background: isLoading ? "#93c5fd" : "#3b82f6",
            color: "#ffffff",
            border: "none",
            borderRadius: "0.75rem",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {isLoading ? "Confirmando..." : "Confirmar turno"}
        </button>
      </form>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: last ? 0 : "0.5rem",
        marginBottom: last ? 0 : "0.5rem",
        borderBottom: last ? "none" : "1px solid #e5e7eb",
      }}
    >
      <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827" }}>{value}</span>
    </div>
  );
}
