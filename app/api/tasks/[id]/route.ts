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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDB();
  const { id } = await params;
  const body = await request.json();

  const check = await db.execute({ sql: "SELECT id FROM tasks WHERE id = ?", args: [id] });
  if (check.rows.length === 0) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  const allowed = ["title", "description", "quadrant", "deadline", "context", "calendarEventId"];
  const updates: string[] = [];
  const args: (string | null)[] = [];

  for (const key of allowed) {
    if (key in body) {
      const col = key === "calendarEventId" ? "calendar_event_id" : key;
      updates.push(`${col} = ?`);
      args.push(body[key]);
    }
  }

  if (updates.length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.push("updated_at = datetime('now')");
  args.push(id);

  await db.execute({
    sql: `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`,
    args,
  });

  const result = await db.execute({ sql: "SELECT * FROM tasks WHERE id = ?", args: [id] });
  const task = rowToTask(result.rows[0] as Record<string, unknown>);
  return Response.json(task);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDB();
  const { id } = await params;

  const check = await db.execute({ sql: "SELECT id FROM tasks WHERE id = ?", args: [id] });
  if (check.rows.length === 0) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  await db.execute({ sql: "DELETE FROM tasks WHERE id = ?", args: [id] });
  return new Response(null, { status: 204 });
}
