import OpenAI from "openai";
import { getAuthenticatedClient, createOAuth2Client } from "@/lib/calendar";
import { google } from "googleapis";

export async function POST(request: Request) {
  const auth = await getAuthenticatedClient();
  if (!auth) {
    return Response.json({ error: "Not authenticated with Google Calendar" }, { status: 401 });
  }

  const { text } = await request.json();
  if (!text || typeof text !== "string") {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const openai = new OpenAI();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a calendar assistant. Today is ${dayOfWeek}, ${today}. Current time is ${now.toTimeString().slice(0, 5)}.
IMPORTANT: Keep the event summary in the SAME LANGUAGE the user wrote in. Do NOT translate.

Parse the user's free text into a Google Calendar event. Return a JSON object with:
- summary: string (concise event title)
- description: string (any extra details, or empty string)
- startDate: string (ISO 8601 date, e.g. "2026-04-08")
- startTime: string | null (24h format "HH:MM" if a time is mentioned, null for all-day events)
- endTime: string | null (24h format "HH:MM" if an end time is mentioned or can be reasonably inferred, null otherwise. If only a start time is given, set end time to 1 hour later.)
- allDay: boolean (true if no specific time is mentioned)

Examples:
- "tomorrow at 18 leave for airport" → { summary: "Leave for airport", startDate: "tomorrow's date", startTime: "18:00", endTime: "19:00", allDay: false }
- "dentist appointment next monday 10am to 11am" → { summary: "Dentist appointment", startDate: "next monday", startTime: "10:00", endTime: "11:00", allDay: false }
- "mom's birthday on april 15" → { summary: "Mom's birthday", startDate: "2026-04-15", startTime: null, endTime: null, allDay: true }`,
      },
      { role: "user", content: text },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content!) as {
    summary: string;
    description: string;
    startDate: string;
    startTime: string | null;
    endTime: string | null;
    allDay: boolean;
  };

  const calendar = google.calendar({ version: "v3", auth });

  let requestBody;
  if (parsed.allDay || !parsed.startTime) {
    requestBody = {
      summary: parsed.summary,
      description: parsed.description || undefined,
      start: { date: parsed.startDate },
      end: { date: parsed.startDate },
    };
  } else {
    const startDateTime = `${parsed.startDate}T${parsed.startTime}:00`;
    const endTime = parsed.endTime || (() => {
      const [h, m] = parsed.startTime!.split(":").map(Number);
      return `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    })();
    const endDateTime = `${parsed.startDate}T${endTime}:00`;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    requestBody = {
      summary: parsed.summary,
      description: parsed.description || undefined,
      start: { dateTime: startDateTime, timeZone: tz },
      end: { dateTime: endDateTime, timeZone: tz },
    };
  }

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody,
  });

  return Response.json({
    success: true,
    eventId: event.data.id,
    summary: parsed.summary,
    startDate: parsed.startDate,
    startTime: parsed.startTime,
  });
}
