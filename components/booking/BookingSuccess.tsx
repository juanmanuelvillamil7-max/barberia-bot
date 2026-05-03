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

export default function BookingSuccess({ service, date, time, clientName, clientEmail, appointmentId, onNewBooking }: BookingSuccessProps) {
  const displayDate = (() => {
    const d = new Date(`${date}T12:00:00`);
    return `${DAYS[d.getDay()]} ${d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}`;
  })();

  return (
    <div style={{ textAlign: "center", paddingTop: "1rem" }}>
      {/* Thin rule */}
      <div style={{ width: "32px", height: "1px", background: "var(--ink)", margin: "0 auto 2rem" }} />

      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.75rem" }}>
        Reserva confirmada
      </p>

      <h2 style={{
        fontFamily: "var(--font-display)",
        fontSize: "2.6rem",
        fontWeight: 300,
        color: "var(--ink)",
        lineHeight: 1.1,
        marginBottom: "0.5rem",
      }}>
        Hasta pronto,
      </h2>
      <h2 style={{
        fontFamily: "var(--font-display)",
        fontSize: "2.6rem",
        fontWeight: 400,
        color: "var(--ink)",
        lineHeight: 1.1,
        marginBottom: "2.5rem",
      }}>
        {clientName.split(" ")[0]}.
      </h2>

      {/* Summary */}
      <div style={{ borderTop: "1px solid var(--dust)", textAlign: "left", marginBottom: "2rem" }}>
        <SummaryRow label="Servicio" value={service.name} />
        <SummaryRow label="Fecha" value={displayDate} />
        <SummaryRow label="Hora" value={`${time}hs`} />
        <SummaryRow label="Precio" value={`$${service.price.toLocaleString("es-AR")}`} last />
      </div>

      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--stone)", marginBottom: "2.5rem" }}>
        Confirmación enviada a {clientEmail}
      </p>

      <button
        onClick={onNewBooking}
        style={{
          width: "100%",
          padding: "1rem",
          background: "var(--ink)",
          color: "var(--cream)",
          border: "none",
          fontFamily: "var(--font-body)",
          fontSize: "0.72rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          cursor: "pointer",
          marginBottom: "1.25rem",
        }}
      >
        Agendar otro turno
      </button>

      <a
        href={`/cancelar/${appointmentId}`}
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.72rem",
          letterSpacing: "0.1em",
          color: "var(--stone)",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
        }}
      >
        Cancelar este turno
      </a>
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
