import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAvailableSlots } from "@/lib/availability";
import { createCalendarEvent } from "@/lib/calendar";
import { deleteCalendarEvent } from "@/lib/calendar";
import { sendConfirmationEmail } from "@/lib/resend";
import { upsertClientByEmail } from "@/lib/clients";

interface BookingRequestBody {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  date: string;
  time: string;
  serviceId: string;
  serviceName: string;
}

export async function POST(request: NextRequest) {
  let body: BookingRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { clientName, clientEmail, clientPhone, date, time, serviceId, serviceName } = body;

  if (!clientName || !clientEmail || !date || !time || !serviceId || !serviceName) {
    return NextResponse.json(
      { error: "Missing required fields: clientName, clientEmail, date, time, serviceId, serviceName" },
      { status: 400 }
    );
  }

  try {
    // Fetch service duration and price
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, duration_minutes, price")
      .eq("id", serviceId)
      .eq("active", true)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Verify availability (race condition guard)
    const slots = await getAvailableSlots(date, service.duration_minutes);
    const isAvailable = slots.some((s) => s.time === time);
    if (!isAvailable) {
      return NextResponse.json(
        { error: "El horario seleccionado ya no está disponible. Por favor elegí otro." },
        { status: 409 }
      );
    }

    // Calculate end time
    const [h, m] = time.split(":").map(Number);
    const endMinutes = h * 60 + m + service.duration_minutes;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

    // Create Google Calendar event
    const googleEventId = await createCalendarEvent(
      clientName,
      serviceName,
      date,
      time,
      endTime
    );

    // Upsert client record
    const clientId = await upsertClientByEmail(clientName, clientEmail, clientPhone);

    // Insert appointment in Supabase
    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        client_name: clientName,
        client_phone: clientPhone ?? "",
        client_email: clientEmail,
        service_id: serviceId,
        appointment_date: date,
        start_time: time,
        end_time: endTime,
        status: "confirmed",
        google_event_id: googleEventId,
        ...(clientId ? { client_id: clientId } : {}),
      })
      .select("id, client_name, client_email, service_id, appointment_date, start_time, end_time, status, google_event_id, created_at")
      .single();

    if (insertError || !appointment) {
      // Rollback calendar event
      if (googleEventId) await deleteCalendarEvent(googleEventId);
      return NextResponse.json(
        { error: "Error al guardar el turno. Por favor intentá de nuevo." },
        { status: 500 }
      );
    }

    // Send confirmation email (non-blocking — don't fail booking if email fails)
    sendConfirmationEmail(
      clientEmail,
      clientName,
      serviceName,
      date,
      time,
      service.price,
      appointment.id
    ).catch((err) => console.error("sendConfirmationEmail error:", err));

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    console.error("POST /api/book error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
