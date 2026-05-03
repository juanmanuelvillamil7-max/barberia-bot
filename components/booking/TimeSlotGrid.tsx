"use client";

import type { AvailableSlot } from "@/types";

interface TimeSlotGridProps {
  slots: AvailableSlot[];
  selected: string | null;
  onSelect: (time: string) => void;
  loading?: boolean;
}

export default function TimeSlotGrid({
  slots,
  selected,
  onSelect,
  loading = false,
}: TimeSlotGridProps) {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0", color: "#6b7280" }}>
        Cargando horarios...
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <p style={{ color: "#6b7280", margin: 0 }}>
          No hay turnos disponibles para este día. Elegí otro.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>
        ¿A qué hora?
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.5rem",
        }}
      >
        {slots.map((slot) => {
          const isSelected = selected === slot.time;
          return (
            <button
              key={slot.time}
              onClick={() => onSelect(slot.time)}
              style={{
                padding: "0.6rem 0.25rem",
                border: `2px solid ${isSelected ? "#3b82f6" : "#e5e7eb"}`,
                borderRadius: "0.5rem",
                background: isSelected ? "#3b82f6" : "#ffffff",
                color: isSelected ? "#ffffff" : "#374151",
                cursor: "pointer",
                fontWeight: isSelected ? 700 : 500,
                fontSize: "0.9rem",
                transition: "border-color 0.15s, background 0.15s, color 0.15s",
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
