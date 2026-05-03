import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendWhatsAppMessage, markMessageAsRead, verifyWebhookSignature } from "@/lib/whatsapp";
import { processMessage } from "@/lib/openai";
import { BARBERIA_CONFIG } from "@/lib/config";
import type { WhatsAppWebhookBody, ConversationMessage } from "@/types";

// GET — WhatsApp webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN &&
    challenge
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// POST — Receive incoming WhatsApp messages
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verify signature only if WHATSAPP_APP_SECRET is configured
  if (process.env.WHATSAPP_APP_SECRET) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("Webhook signature verification failed");
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  // Always respond 200 immediately to Meta
  // Process in background using waitUntil (Vercel/Next.js edge runtime)
  const responsePromise = processWebhook(rawBody);

  // Use waitUntil if available (Vercel), otherwise fire-and-forget
  const ctx = (request as NextRequest & { waitUntil?: (p: Promise<unknown>) => void });
  if (typeof ctx.waitUntil === "function") {
    ctx.waitUntil(responsePromise);
  } else {
    responsePromise.catch((err) =>
      console.error("Background processing error:", err)
    );
  }

  return new NextResponse("OK", { status: 200 });
}

async function processWebhook(rawBody: string): Promise<void> {
  let body: WhatsAppWebhookBody;

  try {
    body = JSON.parse(rawBody);
  } catch {
    console.error("Invalid JSON body");
    return;
  }

  const value = body.entry?.[0]?.changes?.[0]?.value;
  if (!value?.messages?.length) {
    // Status update or other event — ignore
    return;
  }

  const message = value.messages[0];

  // Only handle text messages
  if (message.type !== "text" || !message.text?.body) {
    return;
  }

  const clientPhone = message.from;
  const messageId = message.id;
  const userText = message.text.body.trim();

  // Deduplicate — check if we already processed this message_id
  const { data: existing } = await supabase
    .from("conversations")
    .select("messages")
    .eq("phone_number", clientPhone)
    .single();

  const currentMessages: ConversationMessage[] = existing?.messages ?? [];

  // Check for duplicate message_id in recent messages (last 5)
  const isDuplicate = currentMessages
    .slice(-5)
    .some((m) => (m as ConversationMessage & { message_id?: string }).message_id === messageId);

  if (isDuplicate) {
    console.log(`Duplicate message ${messageId} — skipping`);
    return;
  }

  // Mark as read
  await markMessageAsRead(messageId);

  // Process with GPT
  let assistantReply: string;
  try {
    assistantReply = await processMessage(userText, currentMessages, clientPhone);
  } catch (err) {
    console.error("processMessage error:", err);
    assistantReply =
      "Disculpá, tuve un problema técnico. ¿Podés repetirme lo que necesitás?";
  }

  // Send reply to client
  try {
    await sendWhatsAppMessage(clientPhone, assistantReply);
  } catch (err) {
    console.error("sendWhatsAppMessage error:", err);
    return;
  }

  // Save conversation history
  const userEntry: ConversationMessage & { message_id: string } = {
    role: "user",
    content: userText,
    timestamp: new Date().toISOString(),
    message_id: messageId,
  };

  const assistantEntry: ConversationMessage = {
    role: "assistant",
    content: assistantReply,
    timestamp: new Date().toISOString(),
  };

  const updatedMessages = [
    ...currentMessages,
    userEntry,
    assistantEntry,
  ].slice(-BARBERIA_CONFIG.maxMensajesGuardados);

  await supabase.from("conversations").upsert(
    {
      phone_number: clientPhone,
      messages: updatedMessages,
      last_activity: new Date().toISOString(),
    },
    { onConflict: "phone_number" }
  );
}
