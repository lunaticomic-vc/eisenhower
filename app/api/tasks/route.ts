import db, { initDB } from "@/lib/db";
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

export async function GET() {
  await initDB();
  const result = await db.execute("SELECT * FROM tasks ORDER BY created_at DESC");
  const tasks = result.rows.map((row) => rowToTask(row as Record<string, unknown>));
  return Response.json(tasks);
}

export async function POST(request: Request) {
  await initDB();
  const body = await request.json();
  const { title, description = "", quadrant = "urgent-important", deadline = null, context = null, calendarEventId = null } = body;

  if (!title) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO tasks (id, title, description, quadrant, deadline, context, calendar_event_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, title, description, quadrant, deadline, context, calendarEventId],
  });

  const result = await db.execute({ sql: "SELECT * FROM tasks WHERE id = ?", args: [id] });
  const task = rowToTask(result.rows[0] as Record<string, unknown>);
  return Response.json(task, { status: 201 });
}
