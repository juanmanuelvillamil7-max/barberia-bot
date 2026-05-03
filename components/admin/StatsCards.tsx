import type { AdminStats } from "@/types";

interface StatsCardsProps {
  stats: AdminStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Turnos hoy",
      value: stats.turnosHoy.toString(),
      sub: null,
      color: "#3b82f6",
      bg: "#eff6ff",
    },
    {
      label: "Ingresos hoy",
      value: `$${stats.ingresosHoy.toLocaleString("es-AR")}`,
      sub: null,
      color: "#10b981",
      bg: "#f0fdf4",
    },
    {
      label: "Turnos semana",
      value: stats.turnosSemana.toString(),
      sub: null,
      color: "#8b5cf6",
      bg: "#f5f3ff",
    },
    {
      label: "Ingresos mes",
      value: `$${stats.ingresosMes.toLocaleString("es-AR")}`,
      sub:
        stats.variacionMes !== null
          ? `${stats.variacionMes >= 0 ? "+" : ""}${stats.variacionMes}% vs mes anterior`
          : null,
      subColor: stats.variacionMes !== null && stats.variacionMes >= 0 ? "#10b981" : "#ef4444",
      color: "#f59e0b",
      bg: "#fffbeb",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      {cards.map((card) => (
        <div
          key={card.label}
          style={{
            background: card.bg,
            border: `1px solid ${card.color}30`,
            borderRadius: "0.75rem",
            padding: "1rem",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280", fontWeight: 500 }}>
            {card.label}
          </p>
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: card.color,
            }}
          >
            {card.value}
          </p>
          {card.sub && (
            <p
              style={{
                margin: "0.2rem 0 0",
                fontSize: "0.75rem",
                color: (card as { subColor?: string }).subColor ?? "#6b7280",
                fontWeight: 500,
              }}
            >
              {card.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
