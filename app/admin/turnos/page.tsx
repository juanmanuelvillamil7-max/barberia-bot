"use client";

import CalendarView from "@/components/admin/CalendarView";

export default function TurnosPage() {
  return (
    <div>
      <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
        Turnos
      </h1>
      <CalendarView />
    </div>
  );
}
