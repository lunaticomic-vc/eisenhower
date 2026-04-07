"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Task, Quadrant } from "@/lib/types";
import { QuadrantColumn } from "./QuadrantColumn";
import { TaskCard } from "./TaskCard";
import { TaskDetail } from "./TaskDetail";
import { AddTaskInput } from "./AddTaskInput";

const QUADRANT_ORDER: Quadrant[] = [
  "urgent-important",
  "not-urgent-important",
  "urgent-not-important",
  "not-urgent-not-important",
];

export function EisenhowerMatrix() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<{ task: Task; rect: DOMRect } | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [calSyncing, setCalSyncing] = useState(false);
  const [calStatus, setCalStatus] = useState<string | null>(null);
  const calTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Keyboard shortcut: press "/" or "n" to open input
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (selectedTask) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "/" || e.key === "n") {
        e.preventDefault();
        setShowInput(true);
      }
      if (e.key === "Escape") {
        setShowInput(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTask]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newQuadrant = over.id as Quadrant;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.quadrant === newQuadrant) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, quadrant: newQuadrant } : t))
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quadrant: newQuadrant }),
      });
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, quadrant: task.quadrant } : t))
      );
    }
  }

  async function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    } catch {
      fetchTasks();
    }
  }

  function handleTaskClick(task: Task, rect: DOMRect) {
    setSelectedTask({ task, rect });
  }

  async function handleCalendarSync() {
    if (calSyncing) return;
    setCalSyncing(true);
    setCalStatus(null);

    try {
      const res = await fetch("/api/calendar/sync-all", { method: "POST" });
      if (res.status === 401) {
        // Not authenticated - redirect to Google OAuth
        window.location.href = "/api/calendar/auth";
        return;
      }
      const data = await res.json();
      setCalStatus(`Synced ${data.synced} tasks to calendar`);
    } catch {
      setCalStatus("Sync failed");
    } finally {
      setCalSyncing(false);
      if (calTimer.current) clearTimeout(calTimer.current);
      calTimer.current = setTimeout(() => setCalStatus(null), 3000);
    }
  }

  return (
    <div className="h-full w-full flex flex-col relative">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* 2x2 grid filling the viewport */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 min-h-0"
          style={{
            gap: "1px",
            background: "var(--border)",
          }}
        >
          {QUADRANT_ORDER.map((quadrant) => (
            <div key={quadrant} className="min-h-0">
              <QuadrantColumn
                quadrant={quadrant}
                tasks={tasks.filter((t) => t.quadrant === quadrant)}
                onDelete={handleDelete}
                onTaskClick={handleTaskClick}
              />
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: "ease-out" }}>
          {activeTask ? (
            <TaskCard task={activeTask} onDelete={() => {}} onClick={() => {}} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Floating controls */}
      {!showInput && !selectedTask && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          <button
            onClick={() => setShowInput(true)}
            className={[
              "h-10 px-4 rounded-full",
              "bg-white/[0.07] border border-[var(--border)] backdrop-blur-md",
              "text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
              "hover:bg-white/[0.1] hover:border-[var(--border-strong)]",
              "transition-all duration-150",
              "flex items-center gap-2",
            ].join(" ")}
          >
            <span>+</span>
            <span>Add task</span>
            <kbd className="ml-1 text-[10px] text-[var(--text-tertiary)]/50 border border-[var(--border)] rounded px-1 py-0.5">/</kbd>
          </button>

          <button
            onClick={handleCalendarSync}
            disabled={calSyncing}
            className={[
              "h-10 px-3 rounded-full",
              "bg-white/[0.07] border border-[var(--border)] backdrop-blur-md",
              "text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
              "hover:bg-white/[0.1] hover:border-[var(--border-strong)]",
              "transition-all duration-150",
              "flex items-center gap-1.5",
              calSyncing ? "opacity-50" : "",
            ].join(" ")}
            title="Sync deadlines to Google Calendar"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={calSyncing ? "animate-spin" : ""}>
              <rect x="1" y="2.5" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4 1v2.5M10 1v2.5M1 6h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span>Sync</span>
          </button>
        </div>
      )}

      {/* Calendar sync status toast */}
      {calStatus && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] backdrop-blur-md animate-fade-in">
          {calStatus}
        </div>
      )}

      {/* Floating input */}
      {showInput && (
        <div className="fixed inset-0 z-40 flex items-end justify-center pb-6" onClick={() => setShowInput(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <AddTaskInput
              onTaskAdded={() => { fetchTasks(); setShowInput(false); }}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Task detail overlay */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask.task}
          originRect={selectedTask.rect}
          onClose={() => setSelectedTask(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
