"use client";

import { useState, useEffect, useCallback } from "react";
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

    // Optimistic update
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
      // Rollback on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, quadrant: task.quadrant } : t))
      );
    }
  }

  async function handleDelete(id: string) {
    // Optimistic
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    } catch {
      // Refetch if delete fails
      fetchTasks();
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <AddTaskInput onTaskAdded={fetchTasks} />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {QUADRANT_ORDER.map((quadrant) => (
            <QuadrantColumn
              key={quadrant}
              quadrant={quadrant}
              tasks={tasks.filter((t) => t.quadrant === quadrant)}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: "ease-out" }}>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              onDelete={() => {}}
              isDragOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
