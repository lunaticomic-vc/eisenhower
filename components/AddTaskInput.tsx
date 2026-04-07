"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";

interface AddTaskInputProps {
  onTaskAdded: () => void;
  autoFocus?: boolean;
}

export function AddTaskInput({ onTaskAdded, autoFocus }: AddTaskInputProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  async function handleSubmit() {
    const text = value.trim();
    if (!text || loading) return;

    setLoading(true);
    setError(null);

    try {
      const parseRes = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!parseRes.ok) throw new Error("Failed to parse task");
      const parsed = await parseRes.json();

      const createRes = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!createRes.ok) throw new Error("Failed to create task");

      setValue("");
      onTaskAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="w-full">
      <div
        className={[
          "flex items-center gap-3 rounded-xl border px-4 py-3",
          "bg-[var(--bg-elevated)] backdrop-blur-md",
          "transition-colors duration-150 shadow-2xl",
          loading
            ? "border-[var(--border)]"
            : error
            ? "border-red-500/40"
            : "border-[var(--border)] focus-within:border-[var(--border-strong)]",
        ].join(" ")}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
          </svg>
        ) : (
          <span className="text-[var(--text-tertiary)] text-sm">+</span>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError(null); }}
          onKeyDown={handleKeyDown}
          placeholder="What do you need to do?"
          disabled={loading}
          className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] disabled:opacity-50"
          aria-label="Add new task"
        />

        {value && !loading && (
          <button
            onClick={handleSubmit}
            className="shrink-0 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <kbd className="font-sans">Return</kbd>
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-400 px-1">{error}</p>}
    </div>
  );
}
