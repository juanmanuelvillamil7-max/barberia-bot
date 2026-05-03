"use client";

import type { AvailableSlot } from "@/types";

interface TimeSlotGridProps {
  slots: AvailableSlot[];
  selected: string | null;
  onSelect: (time: string) => void;
  loading?: boolean;
}

export default function TimeSlotGrid({ slots, selected, onSelect, loading = false }: TimeSlotGridProps) {
  if (loading) {
    return (
      <div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "1.75rem" }}>
          Elegí un horario
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>Cargando horarios…</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "1.75rem" }}>
          Elegí un horario
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--stone)" }}>
          Sin horarios disponibles para este día.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "1.75rem" }}>
        Elegí un horario
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
        {slots.map((slot) => {
          const isSelected = selected === slot.time;
          return (
            <button
              key={slot.time}
              onClick={() => onSelect(slot.time)}
              style={{
                padding: "0.75rem 0.25rem",
                border: `1px solid ${isSelected ? "var(--ink)" : "var(--dust)"}`,
                background: isSelected ? "var(--ink)" : "transparent",
                color: isSelected ? "var(--cream)" : "var(--ink)",
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                letterSpacing: "0.04em",
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s, color 0.15s",
              }}
            >
              {slot.display}
            </button>
          );
        })}
      </div>
    </div>
  );
}
