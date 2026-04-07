"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Task, Quadrant } from "@/lib/types";
import { QUADRANT_LABELS } from "@/lib/types";
import { TaskCard } from "./TaskCard";

const QUADRANT_ACCENT: Record<Quadrant, string> = {
  "urgent-important": "var(--accent-do)",
  "not-urgent-important": "var(--accent-schedule)",
  "urgent-not-important": "var(--accent-delegate)",
  "not-urgent-not-important": "var(--accent-eliminate)",
};

const QUADRANT_DIM: Record<Quadrant, string> = {
  "urgent-important": "rgba(239,68,68,0.06)",
  "not-urgent-important": "rgba(59,130,246,0.06)",
  "urgent-not-important": "rgba(245,158,11,0.06)",
  "not-urgent-not-important": "rgba(113,113,122,0.04)",
};

interface QuadrantColumnProps {
  quadrant: Quadrant;
  tasks: Task[];
  onDelete: (id: string) => void;
  onTaskClick: (task: Task, rect: DOMRect) => void;
}

export function QuadrantColumn({ quadrant, tasks, onDelete, onTaskClick }: QuadrantColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrant });
  const { title, subtitle } = QUADRANT_LABELS[quadrant];
  const accentColor = QUADRANT_ACCENT[quadrant];
  const dimColor = QUADRANT_DIM[quadrant];
  return (
    <div
      className={[
        "flex flex-col min-h-0 overflow-hidden transition-colors duration-150",
        isOver ? "bg-white/[0.02]" : "",
      ].join(" ")}
      style={{
        borderTop: `2px solid ${accentColor}`,
        background: isOver ? dimColor : undefined,
      }}
    >
      {/* Header */}
      <div className="px-3 pt-2.5 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
            {title}
          </h2>
          <span className="text-[10px] text-[var(--text-tertiary)]">{subtitle}</span>
        </div>
        {tasks.length > 0 && (
          <span
            className="text-[10px] font-semibold tabular-nums rounded-full w-5 h-5 flex items-center justify-center"
            style={{ background: dimColor, color: accentColor }}
          >
            {tasks.length}
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 px-2 pb-2 flex flex-col gap-1.5 overflow-y-auto min-h-0"
      >
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-[60px]">
            <p className="text-[11px] text-[var(--text-tertiary)]/50 select-none">
              Drop here
            </p>
          </div>
        )}
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onDelete={onDelete} onClick={onTaskClick} />
        ))}
      </div>
    </div>
  );
}
