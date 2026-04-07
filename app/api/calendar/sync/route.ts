import { getDB, initDB } from "@/lib/db";
import { createCalendarEvent, updateCalendarEvent } from "@/lib/calendar";
import type { Task, Quadrant } from "@/lib/types";

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    quadrant: row.quadrant as Quadrant,
    deadline: row.deadline as string | null,
    context: row.context as string | null,
    calendarEventId: row.calendar_event_id as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function POST(request: Request) {
  await initDB();
  const body = await request.json();
  const { taskId } = body;

  if (!taskId) {
    return Response.json({ error: "taskId is required" }, { status: 400 });
  }

  const result = await getDB().execute({ sql: "SELECT * FROM tasks WHERE id = ?", args: [taskId] });
  if (result.rows.length === 0) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  const task = rowToTask(result.rows[0] as Record<string, unknown>);

  if (!task.deadline) {
    return Response.json({ error: "Task has no deadline to sync" }, { status: 400 });
  }

  let calendarEventId: string | null = task.calendarEventId;

  if (calendarEventId) {
    await updateCalendarEvent(calendarEventId, task.title, task.description, task.deadline);
  } else {
    calendarEventId = await createCalendarEvent(task.title, task.description, task.deadline);
    await getDB().execute({
      sql: "UPDATE tasks SET calendar_event_id = ?, updated_at = datetime('now') WHERE id = ?",
      args: [calendarEventId, task.id],
    });
  }

  return Response.json({ success: true, calendarEventId });
}
