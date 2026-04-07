export type Quadrant =
  | "urgent-important"
  | "not-urgent-important"
  | "urgent-not-important"
  | "not-urgent-not-important";

export interface Task {
  id: string;
  title: string;
  description: string;
  quadrant: Quadrant;
  deadline: string | null;
  context: string | null;
  calendarEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedTask {
  title: string;
  description: string;
  deadline: string | null;
  context: string | null;
  quadrant: Quadrant;
}

export const QUADRANT_LABELS: Record<Quadrant, { title: string; subtitle: string }> = {
  "urgent-important": { title: "Do", subtitle: "Urgent & Important" },
  "not-urgent-important": { title: "Schedule", subtitle: "Not Urgent & Important" },
  "urgent-not-important": { title: "Delegate", subtitle: "Urgent & Not Important" },
  "not-urgent-not-important": { title: "Eliminate", subtitle: "Not Urgent & Not Important" },
};
