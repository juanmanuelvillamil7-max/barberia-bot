"use client";

import { useState, useEffect, useCallback } from "react";
import AppointmentList from "@/components/admin/AppointmentList";

interface AppointmentItem {
  id: string;
  client_name: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled" | "completed";
  appointment_date: string;
  services: { name: string; price: number } | null;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "confirmed", label: "Confirmados" },
  { value: "completed", label: "Completados" },
  { value: "cancelled", label: "Cancelados" },
];

function todayStr(): string {
  const now = new Date();
  const tzOffset = -3;
  const local = new Date(now.getTime() + tzOffset * 60 * 60 * 1000);
  return local.toISOString().split("T")[0];
}

export default function TurnosPage() {
  const [date, setDate] = useState(todayStr());
  const [statusFilter, setStatusFilter] = useState("");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/appointments?${params.toString()}`);
      const data = await res.json();
      setAppointments(data.appointments ?? []);
    } catch (err) {
      console.error("loadAppointments error:", err);
    } finally {
      setLoading(false);
    }
  }, [date, statusFilter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  async function handleComplete(id: string) {
    const res = await fetch("/api/admin/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "completed" }),
    });

    if (res.ok) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "completed" } : a))
      );
    }
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
        Turnos
      </h1>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.25rem" }}>
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.25rem" }}>
            Estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              fontSize: "0.9rem",
              outline: "none",
              background: "#ffffff",
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
          Cargando turnos...
        </div>
      ) : (
        <AppointmentList appointments={appointments} onComplete={handleComplete} />
      )}
    </div>
  );
}
