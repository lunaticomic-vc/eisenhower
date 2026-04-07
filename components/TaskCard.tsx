"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onClick: (task: Task, rect: DOMRect) => void;
  isDragOverlay?: boolean;
}

export function TaskCard({ task, onDelete, onClick, isDragOverlay = false }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (isDragging || isDragOverlay) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onClick(task, rect);
      }}
      className={[
        "group relative rounded-lg border px-3 py-2 cursor-grab active:cursor-grabbing",
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
            "absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded flex items-center justify-center",
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

      <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug pr-4 line-clamp-1">
        {task.title}
      </p>
    </div>
  );
}
