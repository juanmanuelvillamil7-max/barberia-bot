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

export default function BookingConfirmation({ service, date, time, onConfirm, isLoading }: BookingConfirmationProps) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const displayDate = (() => {
    const d = new Date(`${date}T12:00:00`);
    return `${DAYS[d.getDay()]} ${d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}`;
  })();

  function validate(): boolean {
    const e: { name?: string; email?: string } = {};
    if (!clientName.trim()) e.name = "Ingresá tu nombre";
    if (!clientEmail.trim()) e.email = "Ingresá tu email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) e.email = "Email inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onConfirm(clientName.trim(), clientEmail.trim());
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "0.5rem 0",
    border: "none",
    borderBottom: `1px solid ${hasError ? "var(--ink)" : "var(--dust)"}`,
    background: "transparent",
    fontFamily: "var(--font-body)",
    fontSize: "1rem",
    color: "var(--ink)",
    outline: "none",
    boxSizing: "border-box",
  });

  return (
    <div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "1.75rem" }}>
        Confirmá tu turno
      </p>

      {/* Summary */}
      <div style={{ borderTop: "1px solid var(--dust)", marginBottom: "2rem" }}>
        <SummaryRow label="Servicio" value={service.name} />
        <SummaryRow label="Precio" value={`$${service.price.toLocaleString("es-AR")}`} />
        <SummaryRow label="Fecha" value={displayDate} />
        <SummaryRow label="Hora" value={`${time}hs`} last />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: "1.75rem" }}>
          <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.5rem" }}>
            Nombre completo
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Tu nombre"
            style={inputStyle(!!errors.name)}
          />
          {errors.name && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--ink)", marginTop: "0.35rem" }}>{errors.name}</p>
          )}
        </div>

        <div style={{ marginBottom: "2.5rem" }}>
          <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.5rem" }}>
            Email
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="tu@email.com"
            style={inputStyle(!!errors.email)}
          />
          {errors.email && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--ink)", marginTop: "0.35rem" }}>{errors.email}</p>
          )}
          {!errors.email && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", color: "var(--rule)", marginTop: "0.5rem" }}>
              Te enviamos la confirmación por email.
            </p>
          )}
        </div>

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
          {isLoading ? "Confirmando…" : "Confirmar turno"}
        </button>
      </form>
    </div>
  );
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      padding: "0.9rem 0",
      borderBottom: last ? "none" : "1px solid var(--dust)",
    }}>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--stone)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 400, color: "var(--ink)" }}>{value}</span>
    </div>
  );
}
