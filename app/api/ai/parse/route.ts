import OpenAI from "openai";
import type { ParsedTask } from "@/lib/types";

export async function POST(request: Request) {
  const openai = new OpenAI();
  const { text } = await request.json();

  if (!text || typeof text !== "string") {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a task management assistant. Today's date is ${today}.
IMPORTANT: Keep the task title and description in the SAME LANGUAGE the user wrote in. Do NOT translate. If they write in Bulgarian, respond in Bulgarian. If in English, respond in English.
Extract structured task information from the user's free text and return a JSON object with exactly these fields:
- title: string (clean, concise task title, 3-8 words, imperative form)
- description: string (enriched, more detailed and actionable version of the task)
- deadline: string | null (ISO 8601 date "YYYY-MM-DD" if a date is mentioned or implied, otherwise null)
- context: string | null (additional context, notes, or background if present, otherwise null)
- quadrant: one of "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important"

Quadrant criteria (urgent = deadline within 7 days from today):
- urgent-important: deadline within 7 days AND high importance or consequences
- not-urgent-important: deadline beyond 7 days (or none) but significant long-term value
- urgent-not-important: deadline within 7 days but low importance
- not-urgent-not-important: no urgency (deadline beyond 7 days or none) and low importance`,
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  const result = JSON.parse(
    completion.choices[0].message.content!
  ) as ParsedTask;
  return Response.json(result);
}
