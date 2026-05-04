import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEI!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: clients, error: clientsError } = await adminClient
      .from("clients")
      .select("id, full_name, email, phone, birthday, created_at")
      .order("full_name");

    if (clientsError) {
      return NextResponse.json({ error: clientsError.message }, { status: 500 });
    }

    const clientList = clients ?? [];
    if (clientList.length === 0) {
      return NextResponse.json({ clients: [] });
    }

    // Fetch appointment stats for all clients
    const { data: appts } = await adminClient
      .from("appointments")
      .select("client_id, appointment_date")
      .in("client_id", clientList.map((c) => c.id))
      .neq("status", "cancelled");

    // Aggregate: count and last visit per client
    const statsMap = new Map<string, { count: number; lastVisit: string | null }>();
    for (const appt of appts ?? []) {
      if (!appt.client_id) continue;
      const curr = statsMap.get(appt.client_id) ?? { count: 0, lastVisit: null };
      curr.count++;
      if (!curr.lastVisit || appt.appointment_date > curr.lastVisit) {
        curr.lastVisit = appt.appointment_date;
      }
      statsMap.set(appt.client_id, curr);
    }

    const result = clientList.map((c) => ({
      ...c,
      total_cuts: statsMap.get(c.id)?.count ?? 0,
      last_visit: statsMap.get(c.id)?.lastVisit ?? null,
    }));

    return NextResponse.json({ clients: result });
  } catch (err) {
    console.error("GET /api/admin/clients error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { full_name: string; email?: string; phone?: string; birthday?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.full_name?.trim()) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEI!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const insert: Record<string, string> = { full_name: body.full_name.trim() };
    if (body.email?.trim()) insert.email = body.email.trim();
    if (body.phone?.trim()) insert.phone = body.phone.trim();
    if (body.birthday) insert.birthday = body.birthday;

    const { data, error } = await adminClient
      .from("clients")
      .insert(insert)
      .select("id, full_name, email, phone, birthday, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ client: data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/clients error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id: string; birthday?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, birthday } = body;
  if (!id) {
    return NextResponse.json({ error: "Missing client id" }, { status: 400 });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEI!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await adminClient
      .from("clients")
      .update({ birthday: birthday ?? null })
      .eq("id", id)
      .select("id, full_name, email, phone, birthday, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ client: data });
  } catch (err) {
    console.error("PATCH /api/admin/clients error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
