"use client";

import type { Service } from "@/types";

interface BookingSuccessProps {
  service: Service;
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  appointmentId: string;
  onNewBooking: () => void;
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function BookingSuccess({
  service,
  date,
  time,
  clientName,
  clientEmail,
  appointmentId,
  onNewBooking,
}: BookingSuccessProps) {
  const displayDate = (() => {
    const d = new Date(`${date}T12:00:00`);
    return `${DAYS[d.getDay()]} ${d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}`;
  })();

  return (
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      {/* Check icon */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "#d1fae5",
          marginBottom: "1.25rem",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827", margin: "0 0 0.5rem" }}>
        ¡Turno confirmado!
      </h2>
      <p style={{ color: "#6b7280", fontSize: "0.95rem", margin: "0 0 1.5rem" }}>
        Hola {clientName}, tu reserva está lista.
      </p>

      {/* Summary card */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "0.75rem",
          padding: "1.25rem",
          textAlign: "left",
          marginBottom: "1.5rem",
        }}
      >
        <SummaryRow label="Servicio" value={service.name} />
        <SummaryRow label="Fecha" value={displayDate} />
        <SummaryRow label="Hora" value={`${time}hs`} />
        <SummaryRow label="Precio" value={`$${service.price.toLocaleString("es-AR")}`} last />
      </div>

      {/* Email notice */}
      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "0.75rem",
          padding: "0.75rem 1rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#1d4ed8" }}>
          Enviamos la confirmación a <strong>{clientEmail}</strong>
        </p>
      </div>

      {/* Actions */}
      <button
        onClick={onNewBooking}
        style={{
          width: "100%",
          padding: "0.85rem",
          background: "#3b82f6",
          color: "#ffffff",
          border: "none",
          borderRadius: "0.75rem",
          fontSize: "1rem",
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: "1rem",
        }}
      >
        Agendar otro turno
      </button>

      <a
        href={`/cancelar/${appointmentId}`}
        style={{
          display: "block",
          textAlign: "center",
          color: "#ef4444",
          fontSize: "0.85rem",
          textDecoration: "underline",
        }}
      >
        Cancelar este turno
      </a>
    </div>
  );
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        paddingBottom: last ? 0 : "0.5rem",
        marginBottom: last ? 0 : "0.5rem",
        borderBottom: last ? "none" : "1px solid #bbf7d0",
      }}
    >
      <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827" }}>{value}</span>
    </div>
  );
}
