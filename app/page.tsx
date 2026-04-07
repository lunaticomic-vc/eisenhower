import { EisenhowerMatrix } from "@/components/EisenhowerMatrix";

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <EisenhowerMatrix />
    </main>
  );
}
