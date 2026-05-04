import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { supabase } from "@/lib/supabase";
import { BARBERIA_CONFIG } from "@/lib/config";
import type { ConversationMessage } from "@/types";

export async function POST(request: NextRequest) {
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { phone_number: string; message: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { phone_number, message } = body;
  if (!phone_number || !message?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    // Send via WhatsApp
    await sendWhatsAppMessage(phone_number, message.trim());

    // Load current conversation history
    const { data: existing } = await supabase
      .from("conversations")
      .select("messages")
      .eq("phone_number", phone_number)
      .maybeSingle();

    const currentMessages: ConversationMessage[] = existing?.messages ?? [];

    const adminEntry = {
      role: "assistant" as const,
      content: message.trim(),
      timestamp: new Date().toISOString(),
      sent_by: "admin" as const,
    };

    const updatedMessages = [...currentMessages, adminEntry].slice(
      -BARBERIA_CONFIG.maxMensajesGuardados
    );

    // Save message + disable bot
    await supabase.from("conversations").upsert(
      {
        phone_number,
        messages: updatedMessages,
        last_activity: new Date().toISOString(),
        bot_active: false,
      },
      { onConflict: "phone_number" }
    );

    return NextResponse.json({ success: true, message: adminEntry });
  } catch (err) {
    console.error("POST /api/admin/conversations/send error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
