import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyAdminSession } from "@/lib/auth";

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

  let body: { date: string; start_time: string; end_time: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { date, start_time, end_time } = body;
  if (!date || !start_time || !end_time) {
    return NextResponse.json({ error: "Missing date, start_time or end_time" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        appointment_date: date,
        start_time,
        end_time,
        client_name: "Bloqueado",
        client_phone: "",
        status: "blocked",
      })
      .select("id, client_name, client_phone, appointment_date, start_time, end_time, status")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ appointment: data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/appointments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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
