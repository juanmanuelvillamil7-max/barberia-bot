import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";

function getAdminClient() {
  return import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEI!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  );
}

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "month";

  const now = new Date();
  const tzOffset = -3;
  const localNow = new Date(now.getTime() + tzOffset * 60 * 60 * 1000);
  const today = localNow.toISOString().split("T")[0];

  let dateFrom: string;
  if (period === "today") {
    dateFrom = today;
  } else if (period === "week") {
    const d = new Date(localNow);
    d.setUTCDate(d.getUTCDate() - 6);
    dateFrom = d.toISOString().split("T")[0];
  } else {
    dateFrom = `${today.substring(0, 7)}-01`;
  }

  try {
    const adminClient = await getAdminClient();
    const { data, error } = await adminClient
      .from("expenses")
      .select("id, amount, description, category, date, created_at")
      .gte("date", dateFrom)
      .lte("date", today)
      .order("date", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ expenses: data ?? [] });
  } catch (err) {
    console.error("GET /api/admin/expenses error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { amount: number; description: string; category?: string; date: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { amount, description, date } = body;
  if (!amount || !description || !date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const adminClient = await getAdminClient();
    const { data, error } = await adminClient
      .from("expenses")
      .insert({ amount, description, category: body.category ?? "general", date })
      .select("id, amount, description, category, date, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ expense: data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/expenses error:", err);
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
    const adminClient = await getAdminClient();
    const { error } = await adminClient.from("expenses").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/expenses error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
