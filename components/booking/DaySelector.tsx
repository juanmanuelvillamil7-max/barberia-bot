"use client";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

interface DaySelectorProps {
  availableDates: string[];
  selected: string | null;
  onSelect: (date: string) => void;
}

export default function DaySelector({ availableDates, selected, onSelect }: DaySelectorProps) {
  if (availableDates.length === 0) {
    return <p style={{ color: "var(--stone)", padding: "2rem 0" }}>Sin fechas disponibles.</p>;
  }

  return (
    <div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--stone)", marginBottom: "1.75rem" }}>
        Elegí un día
      </p>

      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.75rem", scrollbarWidth: "none" }}>
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
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "58px",
                padding: "0.75rem 0",
                background: isSelected ? "var(--ink)" : "transparent",
                border: `1px solid ${isSelected ? "var(--ink)" : "var(--dust)"}`,
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <span style={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: isSelected ? "var(--rule)" : "var(--stone)",
                marginBottom: "0.35rem",
              }}>
                {dayName}
              </span>
              <span style={{
                display: "block",
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: 300,
                color: isSelected ? "var(--cream)" : "var(--ink)",
                lineHeight: 1,
              }}>
                {dayNum}
              </span>
              <span style={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                color: isSelected ? "var(--rule)" : "var(--stone)",
                marginTop: "0.35rem",
              }}>
                {monthName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
