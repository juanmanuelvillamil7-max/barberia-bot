import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { deleteCalendarEvent } from "@/lib/calendar";

interface CancelRequestBody {
  appointmentId: string;
}

export async function POST(request: NextRequest) {
  let body: CancelRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { appointmentId } = body;

  if (!appointmentId) {
    return NextResponse.json(
      { error: "Missing required field: appointmentId" },
      { status: 400 }
    );
  }

  try {
    // Fetch appointment
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, status, google_event_id")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json({ error: "El turno ya fue cancelado" }, { status: 409 });
    }

    // Update status in Supabase
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (updateError) {
      return NextResponse.json(
        { error: "Error al cancelar el turno" },
        { status: 500 }
      );
    }

    // Delete Google Calendar event
    if (appointment.google_event_id) {
      await deleteCalendarEvent(appointment.google_event_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/cancel error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
