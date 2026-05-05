import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";

async function getAdminClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEI!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = await getAdminClient();
  const { data, error } = await adminClient
    .from("bot_config")
    .select("custom_instructions, updated_at")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ custom_instructions: "", updated_at: null });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { custom_instructions: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const adminClient = await getAdminClient();
  const { data, error } = await adminClient
    .from("bot_config")
    .upsert({ id: 1, custom_instructions: body.custom_instructions, updated_at: new Date().toISOString() })
    .select("custom_instructions, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
