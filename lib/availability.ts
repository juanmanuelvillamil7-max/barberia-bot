import { supabase } from "./supabase";
import { getCalendarEvents } from "./calendar";
import { BARBERIA_CONFIG } from "./config";
import type { AvailableSlot } from "@/types";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseEventTime(dateTime: string): number {
  // dateTime is ISO format: 2024-01-15T10:30:00-03:00
  const time = dateTime.split("T")[1].substring(0, 5);
  return timeToMinutes(time);
}

export async function getAvailableSlots(
  date: string,
  durationMinutes: number
): Promise<AvailableSlot[]> {
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

  if (!BARBERIA_CONFIG.diasLaborales.includes(dayOfWeek)) {
    return [];
  }

  // Check date is within booking window
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const requestedDate = new Date(`${date}T12:00:00`);
  const diffDays = Math.ceil(
    (requestedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0 || diffDays > BARBERIA_CONFIG.diasMaxReserva) {
    return [];
  }

  // Fetch existing appointments from Supabase
  const { data: appointments } = await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("appointment_date", date)
    .eq("status", "confirmed");

  // Fetch Google Calendar events (personal blocks, etc.)
  const calendarEvents = await getCalendarEvents(date);

  // Build list of busy intervals in minutes
  const busyIntervals: Array<{ start: number; end: number }> = [];

  for (const appt of appointments ?? []) {
    busyIntervals.push({
      start: timeToMinutes(appt.start_time.substring(0, 5)),
      end: timeToMinutes(appt.end_time.substring(0, 5)),
    });
  }

  for (const event of calendarEvents) {
    busyIntervals.push({
      start: parseEventTime(event.start),
      end: parseEventTime(event.end),
    });
  }

  // If today, don't offer slots in the past (add 30 min buffer)
  const startMinutes = timeToMinutes(BARBERIA_CONFIG.horarioAtencion.inicio);
  const endMinutes = timeToMinutes(BARBERIA_CONFIG.horarioAtencion.fin);

  let effectiveStart = startMinutes;
  if (diffDays === 0) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + 30;
    // Round up to next slot
    const rounded =
      Math.ceil(currentMinutes / BARBERIA_CONFIG.slotMinutos) *
      BARBERIA_CONFIG.slotMinutos;
    effectiveStart = Math.max(startMinutes, rounded);
  }

  // Generate available slots
  const slots: AvailableSlot[] = [];
  let current = effectiveStart;

  while (current + durationMinutes <= endMinutes) {
    const slotEnd = current + durationMinutes;
    const isBusy = busyIntervals.some(
      (busy) => current < busy.end && slotEnd > busy.start
    );

    if (!isBusy) {
      const timeStr = minutesToTime(current);
      const hours = Math.floor(current / 60);
      const mins = current % 60;
      const display =
        mins === 0 ? `${hours}:00hs` : `${hours}:${String(mins).padStart(2, "0")}hs`;
      slots.push({ time: timeStr, display });
    }

    current += BARBERIA_CONFIG.slotMinutos;
  }

  return slots;
}

export async function getServiceByName(
  serviceName: string
): Promise<{ id: string; duration_minutes: number; price: number } | null> {
  const { data } = await supabase
    .from("services")
    .select("id, duration_minutes, price")
    .ilike("name", `%${serviceName}%`)
    .eq("active", true)
    .limit(1)
    .single();

  return data ?? null;
}

export async function getAllServices() {
  const { data } = await supabase
    .from("services")
    .select("name, duration_minutes, price")
    .eq("active", true)
    .order("price");

  return data ?? [];
}
