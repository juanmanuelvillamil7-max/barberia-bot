"use client";

import { useState } from "react";

interface AppointmentItem {
  id: string;
  client_name: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled" | "completed";
  services: { name: string; price: number } | null;
}

interface AppointmentListProps {
  appointments: AppointmentItem[];
  onComplete?: (id: string) => Promise<void>;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmado", color: "#1d4ed8", bg: "#dbeafe" },
  completed: { label: "Completado", color: "#065f46", bg: "#d1fae5" },
  cancelled: { label: "Cancelado", color: "#991b1b", bg: "#fee2e2" },
};

export default function AppointmentList({
  appointments,
  onComplete,
}: AppointmentListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (appointments.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          background: "#f9fafb",
          borderRadius: "0.75rem",
          color: "#6b7280",
        }}
      >
        No hay turnos para este día.
      </div>
    );
  }

  async function handleComplete(id: string) {
    if (!onComplete) return;
    setLoadingId(id);
    try {
      await onComplete(id);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {appointments.map((appt) => {
        const statusStyle = STATUS_LABELS[appt.status] ?? STATUS_LABELS.confirmed;
        const time = appt.start_time.substring(0, 5);
        const service = appt.services;

        return (
          <div
            key={appt.id}
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.75rem",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            {/* Time */}
            <div
              style={{
                background: "#f3f4f6",
                borderRadius: "0.5rem",
                padding: "0.5rem 0.75rem",
                textAlign: "center",
                minWidth: "52px",
              }}
            >
              <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
                {time}
              </p>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "#111827",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {appt.client_name}
              </p>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem", color: "#6b7280" }}>
                {service?.name ?? "—"}{service ? ` · $${service.price.toLocaleString("es-AR")}` : ""}
              </p>
            </div>

            {/* Status badge + action */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
              <span
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "999px",
                  whiteSpace: "nowrap",
                }}
              >
                {statusStyle.label}
              </span>
              {appt.status === "confirmed" && onComplete && (
                <button
                  onClick={() => handleComplete(appt.id)}
                  disabled={loadingId === appt.id}
                  style={{
                    background: "transparent",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    padding: "0.2rem 0.5rem",
                    fontSize: "0.7rem",
                    color: "#374151",
                    cursor: loadingId === appt.id ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {loadingId === appt.id ? "..." : "Completar"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
