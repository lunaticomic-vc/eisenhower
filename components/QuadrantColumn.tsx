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
  "urgent-important": "rgba(239,68,68,0.1)",
  "not-urgent-important": "rgba(59,130,246,0.1)",
  "urgent-not-important": "rgba(245,158,11,0.1)",
  "not-urgent-not-important": "rgba(113,113,122,0.08)",
};

interface QuadrantColumnProps {
  quadrant: Quadrant;
  tasks: Task[];
  onDelete: (id: string) => void;
}

export function QuadrantColumn({ quadrant, tasks, onDelete }: QuadrantColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrant });
  const { title, subtitle } = QUADRANT_LABELS[quadrant];
  const accentColor = QUADRANT_ACCENT[quadrant];
  const dimColor = QUADRANT_DIM[quadrant];

  return (
    <div
      className={[
        "flex flex-col rounded-xl border overflow-hidden transition-colors duration-150",
        isOver
          ? "border-[var(--border-strong)]"
          : "border-[var(--border)]",
      ].join(" ")}
      style={{
        background: isOver ? dimColor : "var(--bg-elevated)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 border-b border-[var(--border)] flex items-center justify-between"
        style={{ borderTopWidth: 2, borderTopColor: accentColor, borderTopStyle: "solid" }}
      >
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{subtitle}</p>
        </div>
        <span
          className="text-xs font-semibold tabular-nums rounded-full w-6 h-6 flex items-center justify-center"
          style={{ background: dimColor, color: accentColor }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 p-3 flex flex-col gap-2 min-h-[180px]"
      >
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-[var(--text-tertiary)] select-none">
              Drop tasks here
            </p>
          </div>
        )}
        {tasks.map((task) => (
          <div key={task.id} className="animate-fade-in">
            <TaskCard task={task} onDelete={onDelete} />
          </div>
        ))}
      </div>
    </div>
  );
}
