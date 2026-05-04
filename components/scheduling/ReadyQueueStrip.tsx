"use client";
import { List } from "lucide-react";
import { useSimulation } from "../../store/useSimulation";

export default function ReadyQueueStrip() {
  const { algorithm, readyQueue, processes } = useSimulation();

  if (algorithm !== "RR" || readyQueue.length === 0) return null;

  return (
    <div className="mb-4 p-2.5 bg-black/40 rounded-xl border border-white/5 flex items-center gap-3 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-1.5 px-2 border-r border-white/10 shrink-0">
        <List size={11} className="text-primary" />
        <span className="text-[9px] font-bold text-primary uppercase">Queue</span>
      </div>
      <div className="flex gap-1.5">
        {readyQueue.map((id, index) => {
          const p = processes.find((proc) => proc.id === id);
          return (
            <div
              key={`${id}-${index}`}
              style={{ borderLeftColor: p?.color }}
              className="px-2.5 py-0.5 bg-white/5 border border-white/10 border-l-2 rounded text-[9px] whitespace-nowrap font-bold"
            >
              {id}
            </div>
          );
        })}
      </div>
    </div>
  );
}
