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

    const { data: conversations, error } = await adminClient
      .from("conversations")
      .select("phone_number, messages, last_activity")
      .order("last_activity", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = conversations ?? [];

    // Try to enrich with client names from clients table
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
    }));

    return NextResponse.json({ conversations: result });
  } catch (err) {
    console.error("GET /api/admin/conversations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
