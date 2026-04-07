import { EisenhowerMatrix } from "@/components/EisenhowerMatrix";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] backdrop-blur-md"
        style={{ background: "rgba(9,9,11,0.85)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #ef4444 0%, #3b82f6 100%)" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1H5.5V5.5H1V1Z" fill="white" fillOpacity="0.9"/>
                <path d="M6.5 1H11V5.5H6.5V1Z" fill="white" fillOpacity="0.5"/>
                <path d="M1 6.5H5.5V11H1V6.5Z" fill="white" fillOpacity="0.5"/>
                <path d="M6.5 6.5H11V11H6.5V6.5Z" fill="white" fillOpacity="0.2"/>
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Eisenhower
            </span>
          </div>

          <p className="text-xs text-[var(--text-tertiary)] hidden sm:block">
            Prioritize what matters. Act on what&rsquo;s urgent.
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        <EisenhowerMatrix />
      </main>
    </div>
  );
}
