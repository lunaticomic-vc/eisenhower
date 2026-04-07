"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";

interface CalendarInputProps {
  onDone: () => void;
  autoFocus?: boolean;
}

export function CalendarInput({ onDone }: CalendarInputProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit() {
    const text = value.trim();
    if (!text || loading) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/calendar/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (res.status === 401) {
        window.location.href = "/api/calendar/auth";
        return;
      }

      if (!res.ok) throw new Error("Failed to add event");

      const data = await res.json();
      setStatus({ type: "success", message: `Added "${data.summary}" to calendar` });
      setValue("");
      setTimeout(onDone, 1500);
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
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
            : status?.type === "error"
            ? "border-red-500/40"
            : status?.type === "success"
            ? "border-green-500/40"
            : "border-blue-500/30 focus-within:border-blue-500/50",
        ].join(" ")}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin text-blue-400" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue-400 shrink-0">
            <rect x="1.5" y="3" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M4.5 1v3M11.5 1v3M1.5 7h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setStatus(null); }}
          onKeyDown={handleKeyDown}
          placeholder="Add to calendar... e.g. 'tomorrow at 18 leave for airport'"
          disabled={loading}
          className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-blue-400/40 disabled:opacity-50"
          aria-label="Quick add calendar event"
        />

        {value && !loading && (
          <button
            onClick={handleSubmit}
            className="shrink-0 text-xs text-blue-400/70 hover:text-blue-400 transition-colors"
          >
            <kbd className="font-sans">Return</kbd>
          </button>
        )}
      </div>
      {status && (
        <p className={["mt-2 text-xs px-1", status.type === "success" ? "text-green-400" : "text-red-400"].join(" ")}>
          {status.message}
        </p>
      )}
    </div>
  );
}
