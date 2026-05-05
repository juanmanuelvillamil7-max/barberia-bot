import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";
import { createCalendarEvent } from "@/lib/calendar";

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  try {
    let query = supabase
      .from("appointments")
      .select("id, client_name, client_phone, client_email, appointment_date, start_time, end_time, status, google_event_id, created_at, services(id, name, duration_minutes, price)")
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (date) {
      query = query.eq("appointment_date", date);
    } else if (startDate && endDate) {
      query = query.gte("appointment_date", startDate).lte("appointment_date", endDate);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointments: data ?? [] });
  } catch (err) {
    console.error("GET /api/admin/appointments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id: string; status: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, status } = body;
  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  const validStatuses = ["confirmed", "cancelled", "completed", "blocked"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select("id, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointment: data });
  } catch (err) {
    console.error("PATCH /api/admin/appointments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    type: "block" | "appointment";
    date: string;
    start_time: string;
    end_time: string;
    client_name?: string;
    client_phone?: string;
    service_id?: string;
    service_name?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, date, start_time, end_time } = body;
  if (!date || !start_time || !end_time) {
    return NextResponse.json({ error: "Missing date, start_time or end_time" }, { status: 400 });
  }

  // Blocked slot
  if (!type || type === "block") {
    const { data, error } = await supabase
      .from("appointments")
      .insert({ appointment_date: date, start_time, end_time, client_name: "Bloqueado", client_phone: "", status: "blocked" })
      .select("id, client_name, client_phone, appointment_date, start_time, end_time, status, google_event_id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ appointment: data }, { status: 201 });
  }

  // Real appointment
  if (!body.client_name?.trim()) {
    return NextResponse.json({ error: "El nombre del cliente es requerido" }, { status: 400 });
  }

  let googleEventId: string | null = null;
  try {
    googleEventId = await createCalendarEvent(body.client_name, body.service_name ?? "Turno", date, start_time, end_time);
  } catch (err) {
    console.error("Calendar error on manual appointment:", err);
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      appointment_date: date,
      start_time,
      end_time,
      client_name: body.client_name.trim(),
      client_phone: body.client_phone?.trim() ?? "",
      service_id: body.service_id ?? null,
      status: "confirmed",
      google_event_id: googleEventId,
    })
    .select("id, client_name, client_phone, appointment_date, start_time, end_time, status, google_event_id, services(name, price)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ appointment: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("status", "blocked");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/appointments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
