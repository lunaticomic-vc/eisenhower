"use client";

import { useState, useRef, type KeyboardEvent } from "react";

interface AddTaskInputProps {
  onTaskAdded: () => void;
}

export function AddTaskInput({ onTaskAdded }: AddTaskInputProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    const text = value.trim();
    if (!text || loading) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Parse with AI
      const parseRes = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!parseRes.ok) {
        throw new Error("Failed to parse task");
      }

      const parsed = await parseRes.json();

      // Step 2: Create task
      const createRes = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!createRes.ok) {
        throw new Error("Failed to create task");
      }

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
    if (e.key === "Escape") {
      setValue("");
      setError(null);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className={[
          "flex items-center gap-3 rounded-xl border px-4 py-3",
          "bg-[var(--bg-elevated)] transition-colors duration-150",
          loading
            ? "border-[var(--border)]"
            : error
            ? "border-red-500/40"
            : "border-[var(--border)] focus-within:border-[var(--border-strong)]",
        ].join(" ")}
      >
        {/* Icon */}
        <div className="shrink-0 text-[var(--text-tertiary)]">
          {loading ? (
            <svg
              className="w-4 h-4 animate-spin shimmer"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle
                cx="8" cy="8" r="6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="28"
                strokeDashoffset="10"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 3V8L11 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="What do you need to do? e.g. 'finish report by friday for the board meeting'"
          disabled={loading}
          className={[
            "flex-1 bg-transparent text-sm outline-none",
            "text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
            "disabled:opacity-50",
          ].join(" ")}
          aria-label="Add new task"
        />

        {/* Submit hint / button */}
        {value && !loading && (
          <button
            onClick={handleSubmit}
            className="shrink-0 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1 rounded-md hover:bg-white/5"
          >
            <kbd className="font-sans">↵</kbd>
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400 px-1">{error}</p>
      )}
    </div>
  );
}
