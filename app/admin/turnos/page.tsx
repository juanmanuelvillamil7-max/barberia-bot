"use client";

import CalendarView from "@/components/admin/CalendarView";

export default function TurnosPage() {
  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "0.4rem" }}>
          Agenda
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 300, color: "var(--ink)", margin: 0 }}>
          Turnos
        </h1>
      </div>
      <CalendarView />
    </div>
  );
}
