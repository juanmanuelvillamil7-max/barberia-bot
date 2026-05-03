"use client";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

interface DaySelectorProps {
  availableDates: string[]; // YYYY-MM-DD
  selected: string | null;
  onSelect: (date: string) => void;
}

export default function DaySelector({
  availableDates,
  selected,
  onSelect,
}: DaySelectorProps) {
  if (availableDates.length === 0) {
    return (
      <p style={{ color: "#6b7280", textAlign: "center", padding: "1rem 0" }}>
        No hay fechas disponibles próximamente.
      </p>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", color: "#111827" }}>
        ¿Qué día?
      </h2>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {availableDates.map((dateStr) => {
          const date = new Date(`${dateStr}T12:00:00`);
          const dayName = DAYS[date.getDay()];
          const dayNum = date.getDate();
          const monthName = MONTHS[date.getMonth()];
          const isSelected = selected === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              style={{
                flexShrink: 0,
                padding: "0.6rem 0.9rem",
                border: `2px solid ${isSelected ? "#3b82f6" : "#e5e7eb"}`,
                borderRadius: "0.75rem",
                background: isSelected ? "#3b82f6" : "#ffffff",
                cursor: "pointer",
                textAlign: "center",
                minWidth: "60px",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: isSelected ? "#ffffff" : "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {dayName}
              </p>
              <p
                style={{
                  margin: "0.1rem 0 0",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: isSelected ? "#ffffff" : "#111827",
                  lineHeight: 1,
                }}
              >
                {dayNum}
              </p>
              <p
                style={{
                  margin: "0.1rem 0 0",
                  fontSize: "0.7rem",
                  color: isSelected ? "#dbeafe" : "#9ca3af",
                }}
              >
                {monthName}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
