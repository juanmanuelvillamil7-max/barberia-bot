import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { createCalendarEvent } from "@/lib/calendar";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: appt, error } = await supabase
    .from("appointments")
    .select("id, client_name, appointment_date, start_time, end_time, google_event_id, services(name)")
    .eq("id", id)
    .single();

  if (error || !appt) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  if (appt.google_event_id) {
    return NextResponse.json({ error: "Ya tiene evento en Google Calendar" }, { status: 400 });
  }

  const serviceName = (appt.services as unknown as { name: string } | null)?.name ?? "Turno";

  const googleEventId = await createCalendarEvent(
    appt.client_name,
    serviceName,
    appt.appointment_date,
    appt.start_time.substring(0, 5),
    appt.end_time.substring(0, 5)
  );

  if (!googleEventId) {
    return NextResponse.json({ error: "No se pudo crear el evento en Google Calendar" }, { status: 500 });
  }

  await supabase
    .from("appointments")
    .update({ google_event_id: googleEventId })
    .eq("id", id);

  return NextResponse.json({ google_event_id: googleEventId });
}
