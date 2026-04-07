"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import type { Task } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  isDragOverlay?: boolean;
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

function isDeadlinePast(deadline: string): boolean {
  const date = new Date(deadline);
  return isPast(date) && !isToday(date);
}

export function TaskCard({ task, onDelete, isDragOverlay = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const deadlinePast = task.deadline ? isDeadlinePast(task.deadline) : false;

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...listeners}
      {...attributes}
      className={[
        "group relative rounded-lg border px-3 py-2.5 cursor-grab active:cursor-grabbing",
        "transition-all duration-150 select-none",
        "bg-[var(--bg-card)] border-[var(--border)]",
        "hover:border-[var(--border-strong)] hover:bg-[var(--bg-card-hover)]",
        isDragging && !isDragOverlay ? "opacity-40" : "opacity-100",
        isDragOverlay ? "shadow-2xl border-[var(--border-strong)] rotate-1 scale-[1.02]" : "",
      ].join(" ")}
    >
      {/* Delete button */}
      {!isDragOverlay && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={[
            "absolute top-2 right-2 z-10 w-5 h-5 rounded flex items-center justify-center",
            "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-100",
          ].join(" ")}
          aria-label="Delete task"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-[var(--text-primary)] leading-snug pr-4 line-clamp-2">
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer meta */}
      {(task.deadline || task.context) && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {task.deadline && (
            <span
              className={[
                "inline-flex items-center gap-1 text-xs font-medium rounded-md px-1.5 py-0.5",
                deadlinePast
                  ? "text-red-400 bg-red-500/10"
                  : isToday(new Date(task.deadline))
                  ? "text-amber-400 bg-amber-500/10"
                  : "text-[var(--text-secondary)] bg-white/5",
              ].join(" ")}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none" className="shrink-0">
                <rect x="0.5" y="1.5" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                <path d="M2.5 0.5V2.5M6.5 0.5V2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              {formatDeadline(task.deadline)}
            </span>
          )}
          {task.context && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] bg-white/5 rounded-md px-1.5 py-0.5">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0">
                <circle cx="4" cy="4" r="3.5" stroke="currentColor"/>
                <path d="M4 2.5V4.5L5 5.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              {task.context}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
