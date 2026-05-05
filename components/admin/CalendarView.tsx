"use client";

import { useState, useEffect, useCallback } from "react";

interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "cancelled" | "completed" | "blocked";
  services: { name: string; price: number } | null;
  google_event_id: string | null;
}

type ViewMode = "day" | "week" | "month";

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 9); // 9am a 8pm

const STATUS_COLOR: Record<string, string> = {
  confirmed: "#3b82f6",
  completed: "#10b981",
  cancelled: "#9ca3af",
  blocked: "#6b7280",
};

const STATUS_BG: Record<string, string> = {
  confirmed: "#eff6ff",
  completed: "#ecfdf5",
  cancelled: "#f3f4f6",
  blocked: "#f3f4f6",
};

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + 1); // start on Monday
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

interface AppointmentCardProps {
  appt: Appointment;
  compact?: boolean;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onUnblock: (id: string) => void;
  onSyncCalendar: (id: string) => void;
}

function AppointmentCard({ appt, compact, onComplete, onCancel, onUnblock, onSyncCalendar }: AppointmentCardProps) {
  const color = STATUS_COLOR[appt.status];
  const bg = STATUS_BG[appt.status];
  const isBlocked = appt.status === "blocked";

  if (compact) {
    return (
      <div
        style={{
          background: isBlocked
            ? "repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 4px, #e5e7eb 4px, #e5e7eb 8px)"
            : bg,
          borderLeft: `3px solid ${color}`,
          borderRadius: "4px",
          padding: "2px 6px",
          fontSize: "0.7rem",
          marginBottom: "2px",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          cursor: "default",
        }}
        title={`${appt.start_time.slice(0,5)} ${isBlocked ? "Bloqueado" : appt.client_name}`}
      >
        <span style={{ fontWeight: 600, color }}>{appt.start_time.slice(0, 5)}</span>{" "}
        <span style={{ color: "#6b7280" }}>{isBlocked ? "Bloqueado" : appt.client_name}</span>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div
        style={{
          background: "repeating-linear-gradient(45deg, #f9fafb, #f9fafb 5px, #f3f4f6 5px, #f3f4f6 10px)",
          borderLeft: "4px solid #9ca3af",
          borderRadius: "6px",
          padding: "0.6rem 0.75rem",
          marginBottom: "0.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#6b7280" }}>
            {appt.start_time.slice(0, 5)} – {appt.end_time.slice(0, 5)}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "2px" }}>Horario bloqueado</div>
        </div>
        <button
          onClick={() => onUnblock(appt.id)}
          style={{
            fontSize: "0.72rem",
            padding: "3px 10px",
            background: "#fff",
            color: "#6b7280",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Desbloquear
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: bg,
        borderLeft: `4px solid ${color}`,
        borderRadius: "6px",
        padding: "0.6rem 0.75rem",
        marginBottom: "0.5rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>
            {appt.start_time.slice(0, 5)} – {appt.end_time.slice(0, 5)}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#374151", marginTop: "2px" }}>
            {appt.client_name}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "2px" }}>
            {appt.services?.name ?? "Sin servicio"} · ${appt.services?.price?.toLocaleString("es-AR") ?? "—"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "2px" }}>
            {appt.client_phone}
          </div>
        </div>
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color,
            background: bg,
            border: `1px solid ${color}`,
            borderRadius: "999px",
            padding: "2px 8px",
            whiteSpace: "nowrap",
          }}
        >
          {appt.status === "confirmed" ? "Confirmado" : appt.status === "completed" ? "Completado" : "Cancelado"}
        </span>
      </div>

      {appt.status === "confirmed" && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => onComplete(appt.id)}
            style={{ fontSize: "0.75rem", padding: "3px 10px", background: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Completar
          </button>
          <button
            onClick={() => onCancel(appt.id)}
            style={{ fontSize: "0.75rem", padding: "3px 10px", background: "#fff", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "4px", cursor: "pointer" }}
          >
            Cancelar
          </button>
          {!appt.google_event_id && (
            <button
              onClick={() => onSyncCalendar(appt.id)}
              style={{ fontSize: "0.75rem", padding: "3px 10px", background: "#fff", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer" }}
              title="Crear evento en Google Calendar"
            >
              Sincronizar calendario
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Day View ────────────────────────────────────────────────────────────────

function DayView({ date, appointments, onComplete, onCancel, onUnblock, onBlock, onSyncCalendar, onCreateAppointment }: {
  date: Date;
  appointments: Appointment[];
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onUnblock: (id: string) => void;
  onBlock: (date: string, start: string, end: string) => Promise<void>;
  onSyncCalendar: (id: string) => void;
  onCreateAppointment: (date: string, start: string, end: string, name: string, phone: string, serviceId: string, serviceName: string, servicePrice: number) => void;
}) {
  const dateStr = toLocalDateStr(date);
  const dayAppts = appointments.filter((a) => a.appointment_date === dateStr)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const [mode, setMode] = useState<"none" | "block" | "appointment">("none");
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("10:00");
  const [blocking, setBlocking] = useState(false);

  // New appointment form state
  const [apptName, setApptName] = useState("");
  const [apptPhone, setApptPhone] = useState("");
  const [apptService, setApptService] = useState<{ id: string; name: string; duration_minutes: number; price: number } | null>(null);
  const [apptServices, setApptServices] = useState<{ id: string; name: string; duration_minutes: number; price: number }[]>([]);
  const [apptStart, setApptStart] = useState("09:00");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (mode === "appointment" && apptServices.length === 0) {
      fetch("/api/admin/services")
        .then((r) => r.json())
        .then((d) => setApptServices(d.services ?? []))
        .catch(console.error);
    }
  }, [mode, apptServices.length]);

  function getEndTime(start: string, duration: number): string {
    const [h, m] = start.split(":").map(Number);
    const total = h * 60 + m + duration;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  async function handleBlock() {
    if (!blockStart || !blockEnd || blockStart >= blockEnd) return;
    setBlocking(true);
    await onBlock(dateStr, blockStart, blockEnd);
    setBlocking(false);
    setMode("none");
  }

  async function handleCreateAppt() {
    if (!apptName.trim() || !apptService) return;
    setCreating(true);
    const endTime = getEndTime(apptStart, apptService.duration_minutes);
    await onCreateAppointment(dateStr, apptStart, endTime, apptName.trim(), apptPhone.trim(), apptService.id, apptService.name, apptService.price);
    setCreating(false);
    setMode("none");
    setApptName(""); setApptPhone(""); setApptService(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          {DAYS_ES[date.getDay()]} {date.getDate()} de {MONTHS_ES[date.getMonth()]} {date.getFullYear()}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setMode(mode === "appointment" ? "none" : "appointment")}
            style={{ fontSize: "0.75rem", padding: "4px 12px", background: mode === "appointment" ? "#3b82f6" : "#fff", color: mode === "appointment" ? "#fff" : "#3b82f6", border: "1px solid #93c5fd", borderRadius: "6px", cursor: "pointer" }}
          >
            {mode === "appointment" ? "Cancelar" : "Nuevo turno"}
          </button>
          <button
            onClick={() => setMode(mode === "block" ? "none" : "block")}
            style={{ fontSize: "0.75rem", padding: "4px 12px", background: mode === "block" ? "#6b7280" : "#fff", color: mode === "block" ? "#fff" : "#6b7280", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}
          >
            {mode === "block" ? "Cancelar" : "Bloquear horario"}
          </button>
        </div>
      </div>

      {mode === "block" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600 }}>Desde</span>
          <input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "0.85rem" }} />
          <span style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600 }}>hasta</span>
          <input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "0.85rem" }} />
          <button onClick={handleBlock} disabled={blocking || blockStart >= blockEnd} style={{ fontSize: "0.75rem", padding: "4px 14px", background: "#374151", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            {blocking ? "…" : "Confirmar"}
          </button>
        </div>
      )}

      {mode === "appointment" && (
        <div style={{ marginBottom: "1rem", padding: "1rem", background: "#eff6ff", borderRadius: "8px", border: "1px solid #93c5fd" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#374151", fontWeight: 600, marginBottom: "4px" }}>Nombre *</label>
              <input type="text" value={apptName} onChange={(e) => setApptName(e.target.value)} placeholder="Juan García" style={{ width: "100%", padding: "6px 8px", border: "1px solid #93c5fd", borderRadius: "4px", fontSize: "0.85rem", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#374151", fontWeight: 600, marginBottom: "4px" }}>WhatsApp</label>
              <input type="tel" value={apptPhone} onChange={(e) => setApptPhone(e.target.value)} placeholder="11 1234-5678" style={{ width: "100%", padding: "6px 8px", border: "1px solid #93c5fd", borderRadius: "4px", fontSize: "0.85rem", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#374151", fontWeight: 600, marginBottom: "4px" }}>Servicio *</label>
              <select value={apptService?.id ?? ""} onChange={(e) => setApptService(apptServices.find((s) => s.id === e.target.value) ?? null)} style={{ width: "100%", padding: "6px 8px", border: "1px solid #93c5fd", borderRadius: "4px", fontSize: "0.85rem", boxSizing: "border-box" }}>
                <option value="">Seleccionar…</option>
                {apptServices.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min — ${s.price.toLocaleString("es-AR")})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.7rem", color: "#374151", fontWeight: 600, marginBottom: "4px" }}>
                Hora inicio {apptService ? `→ fin: ${getEndTime(apptStart, apptService.duration_minutes)}` : ""}
              </label>
              <input type="time" value={apptStart} onChange={(e) => setApptStart(e.target.value)} style={{ padding: "6px 8px", border: "1px solid #93c5fd", borderRadius: "4px", fontSize: "0.85rem" }} />
            </div>
          </div>
          <button onClick={handleCreateAppt} disabled={creating || !apptName.trim() || !apptService} style={{ fontSize: "0.75rem", padding: "6px 16px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "4px", cursor: creating || !apptName.trim() || !apptService ? "not-allowed" : "pointer" }}>
            {creating ? "Guardando…" : "Confirmar turno"}
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 0 }}>
        {HOURS.map((hour) => {
          const slotAppts = dayAppts.filter((a) => {
            const start = timeToMinutes(a.start_time);
            return start >= hour * 60 && start < (hour + 1) * 60;
          });

          return (
            <div key={hour} style={{ display: "contents" }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#9ca3af",
                  textAlign: "right",
                  paddingRight: "0.5rem",
                  paddingTop: "4px",
                  borderTop: "1px solid #f3f4f6",
                  minHeight: "48px",
                }}
              >
                {hour}:00
              </div>
              <div
                style={{
                  borderTop: "1px solid #f3f4f6",
                  paddingLeft: "0.5rem",
                  paddingTop: "4px",
                  minHeight: "48px",
                }}
              >
                {slotAppts.map((a) => (
                  <AppointmentCard key={a.id} appt={a} onComplete={onComplete} onCancel={onCancel} onUnblock={onUnblock} onSyncCalendar={onSyncCalendar} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {dayAppts.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af", fontSize: "0.9rem" }}>
          Sin turnos para este día
        </div>
      )}
    </div>
  );
}

// ─── Week View ───────────────────────────────────────────────────────────────

function WeekView({ date, appointments, onComplete, onCancel, onUnblock, onSyncCalendar }: {
  date: Date;
  appointments: Appointment[];
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onUnblock: (id: string) => void;
  onSyncCalendar: (id: string) => void;
}) {
  const monday = startOfWeek(date);
  const days = Array.from({ length: 6 }, (_, i) => addDays(monday, i)); // lun-sáb

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `48px repeat(6, 1fr)`, minWidth: "600px" }}>
        {/* Header */}
        <div />
        {days.map((d) => {
          const isToday = toLocalDateStr(d) === toLocalDateStr(new Date());
          return (
            <div
              key={d.toISOString()}
              style={{
                textAlign: "center",
                padding: "0.4rem",
                fontSize: "0.78rem",
                fontWeight: 700,
                color: isToday ? "#3b82f6" : "#374151",
                borderBottom: "2px solid #e5e7eb",
                background: isToday ? "#eff6ff" : "transparent",
                borderRadius: isToday ? "6px 6px 0 0" : undefined,
              }}
            >
              {DAYS_ES[d.getDay()]}<br />
              <span style={{ fontSize: "1rem" }}>{d.getDate()}</span>
            </div>
          );
        })}

        {/* Time rows */}
        {HOURS.map((hour) => (
          <div key={hour} style={{ display: "contents" }}>
            <div
              style={{
                fontSize: "0.68rem",
                color: "#9ca3af",
                textAlign: "right",
                paddingRight: "0.4rem",
                paddingTop: "4px",
                borderTop: "1px solid #f3f4f6",
                minHeight: "52px",
              }}
            >
              {hour}:00
            </div>
            {days.map((d) => {
              const dateStr = toLocalDateStr(d);
              const slotAppts = appointments.filter((a) => {
                const start = timeToMinutes(a.start_time);
                return a.appointment_date === dateStr && start >= hour * 60 && start < (hour + 1) * 60;
              });

              return (
                <div
                  key={dateStr}
                  style={{
                    borderTop: "1px solid #f3f4f6",
                    borderLeft: "1px solid #f3f4f6",
                    padding: "2px",
                    minHeight: "52px",
                  }}
                >
                  {slotAppts.map((a) => (
                    <AppointmentCard key={a.id} appt={a} compact onComplete={onComplete} onCancel={onCancel} onUnblock={onUnblock} onSyncCalendar={onSyncCalendar} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Month View ──────────────────────────────────────────────────────────────

function MonthView({ date, appointments, onSelectDay }: {
  date: Date;
  appointments: Appointment[];
  onSelectDay: (d: Date) => void;
}) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = startOfMonth(date);
  const startPad = (firstDay.getDay() + 6) % 7; // Monday-first offset
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = toLocalDateStr(new Date());

  const cells: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "#e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
        {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => (
          <div key={d} style={{ background: "#f9fafb", textAlign: "center", padding: "0.4rem", fontSize: "0.75rem", fontWeight: 700, color: "#6b7280" }}>
            {d}
          </div>
        ))}

        {cells.map((d, i) => {
          if (!d) return <div key={i} style={{ background: "#f9fafb", minHeight: "80px" }} />;

          const dateStr = toLocalDateStr(d);
          const dayAppts = appointments.filter((a) => a.appointment_date === dateStr);
          const isToday = dateStr === today;

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDay(d)}
              style={{
                background: "#fff",
                minHeight: "80px",
                padding: "0.3rem",
                cursor: "pointer",
                borderTop: isToday ? `2px solid #3b82f6` : undefined,
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? "#3b82f6" : "#374151",
                  marginBottom: "4px",
                }}
              >
                {d.getDate()}
              </div>
              {dayAppts.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  style={{
                    background: STATUS_BG[a.status],
                    borderLeft: `3px solid ${STATUS_COLOR[a.status]}`,
                    borderRadius: "3px",
                    padding: "1px 4px",
                    fontSize: "0.65rem",
                    marginBottom: "2px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "#374151",
                  }}
                >
                  {a.start_time.slice(0, 5)} {a.client_name}
                </div>
              ))}
              {dayAppts.length > 3 && (
                <div style={{ fontSize: "0.62rem", color: "#9ca3af" }}>+{dayAppts.length - 3} más</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main CalendarView ────────────────────────────────────────────────────────

export default function CalendarView() {
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const getDateRange = useCallback(() => {
    if (view === "day") {
      const d = toLocalDateStr(currentDate);
      return { startDate: d, endDate: d };
    }
    if (view === "week") {
      const mon = startOfWeek(currentDate);
      return { startDate: toLocalDateStr(mon), endDate: toLocalDateStr(addDays(mon, 5)) };
    }
    // month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return {
      startDate: toLocalDateStr(new Date(year, month, 1)),
      endDate: toLocalDateStr(new Date(year, month + 1, 0)),
    };
  }, [view, currentDate]);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();
    try {
      const res = await fetch(`/api/admin/appointments?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setAppointments(data.appointments ?? []);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  async function handleUpdateStatus(id: string, status: string) {
    const res = await fetch("/api/admin/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: status as Appointment["status"] } : a));
    }
  }

  async function handleSyncCalendar(id: string) {
    const res = await fetch("/api/admin/appointments/sync-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok && data.google_event_id) {
      setAppointments((prev) =>
        prev.map((a) => a.id === id ? { ...a, google_event_id: data.google_event_id } : a)
      );
    } else {
      alert(data.error ?? "Error al sincronizar");
    }
  }

  async function handleBlock(date: string, start_time: string, end_time: string) {
    const res = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "block", date, start_time, end_time }),
    });
    const data = await res.json();
    if (res.ok && data.appointment) {
      setAppointments((prev) => [...prev, { ...data.appointment, services: null }]);
    }
  }

  async function handleCreateAppointment(
    date: string, start_time: string, end_time: string,
    client_name: string, client_phone: string,
    service_id: string, service_name: string, service_price: number
  ) {
    const res = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "appointment", date, start_time, end_time, client_name, client_phone, service_id, service_name }),
    });
    const data = await res.json();
    if (res.ok && data.appointment) {
      setAppointments((prev) => [...prev, {
        ...data.appointment,
        services: { name: service_name, price: service_price },
      }]);
    }
  }

  async function handleUnblock(id: string) {
    const res = await fetch(`/api/admin/appointments?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    }
  }

  function navigate(dir: number) {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  }

  function getTitle() {
    if (view === "day") return `${DAYS_ES[currentDate.getDay()]} ${currentDate.getDate()} ${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === "week") {
      const mon = startOfWeek(currentDate);
      const sat = addDays(mon, 5);
      return `${mon.getDate()} ${MONTHS_ES[mon.getMonth()]} – ${sat.getDate()} ${MONTHS_ES[sat.getMonth()]} ${sat.getFullYear()}`;
    }
    return `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button onClick={() => navigate(-1)} style={navBtn}>‹</button>
          <button onClick={() => setCurrentDate(new Date())} style={{ ...navBtn, fontSize: "0.8rem", padding: "0.3rem 0.75rem" }}>Hoy</button>
          <button onClick={() => navigate(1)} style={navBtn}>›</button>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#111827", marginLeft: "0.25rem" }}>{getTitle()}</span>
        </div>

        <div style={{ display: "flex", gap: "0.25rem", background: "#f3f4f6", borderRadius: "8px", padding: "3px" }}>
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "0.3rem 0.85rem",
                fontSize: "0.8rem",
                fontWeight: view === v ? 700 : 400,
                background: view === v ? "#fff" : "transparent",
                color: view === v ? "#111827" : "#6b7280",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>Cargando...</div>
      ) : (
        <>
          {view === "day" && (
            <DayView date={currentDate} appointments={appointments}
              onComplete={(id) => handleUpdateStatus(id, "completed")}
              onCancel={(id) => handleUpdateStatus(id, "cancelled")}
              onUnblock={handleUnblock}
              onBlock={handleBlock}
              onSyncCalendar={handleSyncCalendar}
              onCreateAppointment={handleCreateAppointment} />
          )}
          {view === "week" && (
            <WeekView date={currentDate} appointments={appointments}
              onComplete={(id) => handleUpdateStatus(id, "completed")}
              onCancel={(id) => handleUpdateStatus(id, "cancelled")}
              onUnblock={handleUnblock}
              onSyncCalendar={handleSyncCalendar} />
          )}
          {view === "month" && (
            <MonthView date={currentDate} appointments={appointments}
              onSelectDay={(d) => { setCurrentDate(d); setView("day"); }} />
          )}
        </>
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  padding: "0.3rem 0.6rem",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "1.1rem",
  color: "#374151",
};
