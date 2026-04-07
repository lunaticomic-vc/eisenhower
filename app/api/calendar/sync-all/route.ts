import { getDB, initDB } from "@/lib/db";
import { getAuthenticatedClient, createCalendarEvent, updateCalendarEvent } from "@/lib/calendar";
import type { Quadrant } from "@/lib/types";

export async function POST() {
  const auth = await getAuthenticatedClient();
  if (!auth) {
    return Response.json({ error: "Not authenticated with Google Calendar" }, { status: 401 });
  }

  await initDB();
  const db = getDB();
  const result = await db.execute("SELECT * FROM tasks WHERE deadline IS NOT NULL");

  let synced = 0;
  let errors = 0;

  for (const row of result.rows) {
    const id = row.id as string;
    const title = row.title as string;
    const description = row.description as string;
    const deadline = row.deadline as string;
    const calendarEventId = row.calendar_event_id as string | null;

    try {
      if (calendarEventId) {
        await updateCalendarEvent(calendarEventId, title, description, deadline);
      } else {
        const eventId = await createCalendarEvent(title, description, deadline);
        await db.execute({
          sql: "UPDATE tasks SET calendar_event_id = ?, updated_at = datetime('now') WHERE id = ?",
          args: [eventId, id],
        });
      }
      synced++;
    } catch {
      errors++;
    }
  }

  return Response.json({ synced, errors, total: result.rows.length });
}
