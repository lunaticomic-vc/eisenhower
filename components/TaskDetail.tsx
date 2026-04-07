"use client";

import { useEffect, useCallback, useState } from "react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import type { Task } from "@/lib/types";
import { QUADRANT_LABELS } from "@/lib/types";

interface TaskDetailProps {
  task: Task;
  originRect: DOMRect;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMMM d, yyyy");
}

export function TaskDetail({ task, originRect, onClose, onDelete }: TaskDetailProps) {
  const [phase, setPhase] = useState<"flip-out" | "open" | "flip-back" | "closed">("flip-out");

  useEffect(() => {
    // Start the flip-out animation immediately, then transition to open
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPhase("open");
      });
    });
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = useCallback(() => {
    setPhase("flip-back");
    setTimeout(() => {
      setPhase("closed");
      onClose();
    }, 400);
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  const deadlinePast = task.deadline ? isPast(new Date(task.deadline)) && !isToday(new Date(task.deadline)) : false;
  const label = QUADRANT_LABELS[task.quadrant];

  // Calculate origin center for transform-origin
  const cx = originRect.left + originRect.width / 2;
  const cy = originRect.top + originRect.height / 2;

  const isVisible = phase === "flip-out" || phase === "open";
  const isExpanded = phase === "open";

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={handleClose}
      style={{ perspective: "1200px" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-400"
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          opacity: isExpanded ? 1 : 0,
        }}
      />

      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute transition-all ease-out"
        style={{
          transitionDuration: "400ms",
          transformOrigin: `${cx}px ${cy}px`,
          ...(isExpanded
            ? {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) rotateY(0deg)",
                width: "min(560px, 90vw)",
                maxHeight: "80vh",
                opacity: 1,
              }
            : {
                top: originRect.top,
                left: originRect.left,
                width: originRect.width,
                height: originRect.height,
                transform: "rotateY(90deg)",
                opacity: 0,
              }),
        }}
      >
        <div
          className={[
            "rounded-2xl border border-[var(--border-strong)] overflow-hidden",
            "bg-[var(--bg-elevated)] shadow-2xl",
            "transition-opacity duration-300",
            isExpanded ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-[var(--border)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                  {label.title} &middot; {label.subtitle}
                </p>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] leading-snug">
                  {task.title}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[50vh] overflow-y-auto">
            {/* Description */}
            {task.description && (
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                  Description
                </p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {/* Deadline */}
            {task.deadline && (
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                  Deadline
                </p>
                <p className={[
                  "text-sm font-medium",
                  deadlinePast ? "text-red-400" : isToday(new Date(task.deadline)) ? "text-amber-400" : "text-[var(--text-primary)]"
                ].join(" ")}>
                  {formatDeadline(task.deadline)}
                  {deadlinePast && <span className="ml-2 text-xs text-red-400/70">Overdue</span>}
                </p>
              </div>
            )}

            {/* Context */}
            {task.context && (
              <div>
                <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">
                  Context
                </p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {task.context}
                </p>
              </div>
            )}

            {/* No extra info */}
            {!task.description && !task.deadline && !task.context && (
              <p className="text-sm text-[var(--text-tertiary)] italic">
                No additional details.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">
              Created {format(new Date(task.createdAt), "MMM d, yyyy")}
            </span>
            <button
              onClick={() => { onDelete(task.id); handleClose(); }}
              className="text-xs text-red-400/70 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
            >
              Delete task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
