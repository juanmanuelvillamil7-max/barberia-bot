import OpenAI from "openai";
import { supabase } from "./supabase";
import { createCalendarEvent, deleteCalendarEvent } from "./calendar";
import { getAvailableSlots, getServiceByName, getAllServices } from "./availability";
import { upsertClientByPhone } from "./clients";
import { BARBERIA_CONFIG } from "./config";
import type { ConversationMessage, BookingResult } from "@/types";

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description:
        "Consulta los horarios disponibles para un servicio en una fecha específica",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Fecha en formato YYYY-MM-DD",
          },
          service_name: {
            type: "string",
            description:
              "Nombre del servicio (ej: Corte de pelo, Barba, Corte + Barba)",
          },
        },
        required: ["date", "service_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description:
        "Agenda un turno confirmado. Solo llamar cuando el cliente confirmó día, hora, servicio y dio su nombre.",
      parameters: {
        type: "object",
        properties: {
          client_name: {
            type: "string",
            description: "Nombre del cliente",
          },
          date: {
            type: "string",
            description: "Fecha del turno en formato YYYY-MM-DD",
          },
          time: {
            type: "string",
            description: "Hora del turno en formato HH:MM",
          },
          service_name: {
            type: "string",
            description: "Nombre del servicio",
          },
        },
        required: ["client_name", "date", "time", "service_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description: "Cancela un turno existente del cliente",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Fecha del turno a cancelar en formato YYYY-MM-DD",
          },
        },
        required: ["date"],
      },
    },
  },
];

async function handleCheckAvailability(
  date: string,
  serviceName: string
): Promise<string> {
  const service = await getServiceByName(serviceName);
  if (!service) {
    return JSON.stringify({
      error: `No encontré el servicio "${serviceName}". Los servicios disponibles son: Corte de pelo, Barba, Corte + Barba, Cejas, Color.`,
    });
  }

  const slots = await getAvailableSlots(date, service.duration_minutes);
  if (slots.length === 0) {
    return JSON.stringify({
      date,
      service: serviceName,
      available: false,
      message: "No hay turnos disponibles para esa fecha.",
    });
  }

  return JSON.stringify({
    date,
    service: serviceName,
    duration_minutes: service.duration_minutes,
    available_slots: slots.map((s) => s.display),
    // Return raw times for booking reference
    raw_times: slots.map((s) => s.time),
  });
}

async function handleBookAppointment(
  clientName: string,
  date: string,
  time: string,
  serviceName: string,
  clientPhone: string
): Promise<BookingResult> {
  const service = await getServiceByName(serviceName);
  if (!service) {
    return { success: false, error: "Servicio no encontrado" };
  }

  // Calculate end time
  const [h, m] = time.split(":").map(Number);
  const endMinutes = h * 60 + m + service.duration_minutes;
  const endHour = Math.floor(endMinutes / 60);
  const endMin = endMinutes % 60;
  const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

  // Verify slot is still available (race condition guard)
  const slots = await getAvailableSlots(date, service.duration_minutes);
  const isAvailable = slots.some((s) => s.time === time);
  if (!isAvailable) {
    return {
      success: false,
      error: "Ese horario ya no está disponible. Elegí otro.",
    };
  }

  // Create Google Calendar event first
  const googleEventId = await createCalendarEvent(
    clientName,
    serviceName,
    date,
    time,
    endTime
  );

  // Upsert client by phone
  const clientId = await upsertClientByPhone(clientName, clientPhone);

  // Insert into Supabase
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      client_name: clientName,
      client_phone: clientPhone,
      service_id: service.id,
      appointment_date: date,
      start_time: time,
      end_time: endTime,
      status: "confirmed",
      google_event_id: googleEventId,
      ...(clientId ? { client_id: clientId } : {}),
    })
    .select("id")
    .single();

  if (error) {
    // Rollback calendar event
    if (googleEventId) await deleteCalendarEvent(googleEventId);
    return { success: false, error: "Error al guardar el turno" };
  }

  return {
    success: true,
    appointmentId: data.id,
    googleEventId: googleEventId ?? undefined,
  };
}

async function handleCancelAppointment(
  date: string,
  clientPhone: string
): Promise<string> {
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, google_event_id, start_time, services(name)")
    .eq("appointment_date", date)
    .eq("client_phone", clientPhone)
    .eq("status", "confirmed")
    .limit(1);

  if (!appointments || appointments.length === 0) {
    return JSON.stringify({
      success: false,
      message: `No encontré un turno confirmado para el ${date} con tu número.`,
    });
  }

  const appt = appointments[0];

  // Cancel in Supabase
  await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appt.id);

  // Delete from Google Calendar
  if (appt.google_event_id) {
    await deleteCalendarEvent(appt.google_event_id);
  }

  return JSON.stringify({
    success: true,
    message: `Turno cancelado correctamente.`,
    appointment: {
      date,
      time: appt.start_time,
    },
  });
}

function buildSystemPrompt(
  services: Array<{ name: string; duration_minutes: number; price: number }>
): string {
  const now = new Date().toLocaleString("es-AR", {
    timeZone: BARBERIA_CONFIG.timezone,
    dateStyle: "full",
    timeStyle: "short",
  });

  const servicesList = services
    .map((s) => `  • ${s.name}: $${s.price.toLocaleString("es-AR")} (${s.duration_minutes} min)`)
    .join("\n");

  return `Sos el asistente virtual de ${BARBERIA_CONFIG.nombre}, una barbería ubicada en ${BARBERIA_CONFIG.ciudad}.
Hablás en español argentino, sos amable, directo y con buena onda.
Tu único objetivo es ayudar a los clientes a agendar, consultar o cancelar turnos.

INFORMACIÓN DE LA BARBERÍA:
- Profesional: ${BARBERIA_CONFIG.profesional}
- Horario: Lunes a Sábado de ${BARBERIA_CONFIG.horarioAtencion.inicio} a ${BARBERIA_CONFIG.horarioAtencion.fin}hs
- Podés reservar turnos hasta ${BARBERIA_CONFIG.diasMaxReserva} días adelante

SERVICIOS Y PRECIOS:
${servicesList}

REGLAS IMPORTANTES:
1. Siempre preguntá qué servicio necesita si no lo mencionó.
2. Siempre preguntá qué día y horario prefiere si no lo dijo.
3. Antes de confirmar un turno, pedile el nombre al cliente.
4. Antes de llamar a book_appointment, confirmá con el cliente: nombre, servicio, día y hora.
5. Mostrá máximo 5 opciones de horario para no abrumar al cliente.
6. Si no hay disponibilidad en el horario pedido, ofrecé alternativas cercanas.
7. Si preguntan por precios, respondé con la lista de servicios.
8. Si el mensaje no tiene que ver con la barbería, respondé amablemente que solo podés ayudar con turnos.
9. Usá "vos" y tuteo argentino, nunca "usted".
10. Sé conciso — los mensajes de WhatsApp deben ser cortos y directos.
11. Para cancelar un turno, pedile al cliente el día del turno.
12. Nunca inventes horarios disponibles — siempre usá check_availability antes de mostrar opciones.

FECHA Y HORA ACTUAL: ${now}`;
}

export async function processMessage(
  userMessage: string,
  history: ConversationMessage[],
  clientPhone: string
): Promise<string> {
  const services = await getAllServices();
  const systemPrompt = buildSystemPrompt(services);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    // Last N messages for context
    ...history.slice(-BARBERIA_CONFIG.historialMensajes).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const client = getOpenAIClient();

  // Agentic loop — handle multi-step function calls
  for (let iteration = 0; iteration < 5; iteration++) {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 500,
    });

    const choice = response.choices[0];

    if (choice.finish_reason === "stop" || !choice.message.tool_calls?.length) {
      return choice.message.content ?? "Perdoná, no entendí. ¿Podés repetirme?";
    }

    // Handle tool calls
    messages.push(choice.message);

    for (const toolCall of choice.message.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments);
      let result: string;

      if (toolCall.function.name === "check_availability") {
        result = await handleCheckAvailability(args.date, args.service_name);
      } else if (toolCall.function.name === "book_appointment") {
        const bookResult = await handleBookAppointment(
          args.client_name,
          args.date,
          args.time,
          args.service_name,
          clientPhone
        );
        result = JSON.stringify(bookResult);
      } else if (toolCall.function.name === "cancel_appointment") {
        result = await handleCancelAppointment(args.date, clientPhone);
      } else {
        result = JSON.stringify({ error: "Función desconocida" });
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  return "Disculpá, tuve un problema. ¿Podés repetirme lo que necesitás?";
}
