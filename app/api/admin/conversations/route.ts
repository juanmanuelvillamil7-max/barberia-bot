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

  try {
    const adminClient = await getAdminClient();

    const { data: conversations, error } = await adminClient
      .from("conversations")
      .select("phone_number, messages, last_activity, bot_active")
      .order("last_activity", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = conversations ?? [];

    const phones = list.map((c) => c.phone_number);
    const { data: clients } = phones.length
      ? await adminClient.from("clients").select("phone, full_name").in("phone", phones)
      : { data: [] };

    const nameMap = new Map((clients ?? []).map((c) => [c.phone, c.full_name]));

    const result = list.map((conv) => ({
      phone_number: conv.phone_number,
      client_name: nameMap.get(conv.phone_number) ?? null,
      messages: conv.messages ?? [],
      last_activity: conv.last_activity,
      bot_active: conv.bot_active ?? true,
    }));

    return NextResponse.json({ conversations: result });
  } catch (err) {
    console.error("GET /api/admin/conversations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { phone_number: string; bot_active: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { phone_number, bot_active } = body;
  if (!phone_number || bot_active === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const adminClient = await getAdminClient();
    const { error } = await adminClient
      .from("conversations")
      .update({ bot_active })
      .eq("phone_number", phone_number);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/admin/conversations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
