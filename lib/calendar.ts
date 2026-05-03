import { google } from "googleapis";
import { BARBERIA_CONFIG } from "./config";

function getCalendarClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!email || !privateKey || !calendarId) {
    throw new Error("Missing Google Calendar env vars");
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return { calendar: google.calendar({ version: "v3", auth }), calendarId };
}

// Returns busy time blocks for a given date (YYYY-MM-DD)
export async function getCalendarEvents(
  date: string
): Promise<Array<{ start: string; end: string }>> {
  try {
    const { calendar, calendarId } = getCalendarClient();

    const timeMin = `${date}T00:00:00-03:00`;
    const timeMax = `${date}T23:59:59-03:00`;

    const res = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    return (res.data.items ?? [])
      .filter((e) => e.start?.dateTime && e.end?.dateTime)
      .map((e) => ({
        start: e.start!.dateTime!,
        end: e.end!.dateTime!,
      }));
  } catch (err) {
    console.error("Google Calendar getEvents error:", err);
    return [];
  }
}

export async function createCalendarEvent(
  clientName: string,
  serviceName: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<string | null> {
  try {
    const { calendar, calendarId } = getCalendarClient();

    const startDateTime = `${date}T${startTime}:00-03:00`;
    const endDateTime = `${date}T${endTime}:00-03:00`;

    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `${serviceName} — ${clientName}`,
        description: `Turno agendado via WhatsApp Bot\nCliente: ${clientName}\nServicio: ${serviceName}`,
        start: {
          dateTime: startDateTime,
          timeZone: BARBERIA_CONFIG.timezone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: BARBERIA_CONFIG.timezone,
        },
      },
    });

    return res.data.id ?? null;
  } catch (err) {
    console.error("Google Calendar createEvent error:", err);
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    const { calendar, calendarId } = getCalendarClient();
    await calendar.events.delete({ calendarId, eventId });
  } catch (err) {
    console.error("Google Calendar deleteEvent error:", err);
  }
}
