"use client";
import { X, Hash } from "lucide-react";
import { useSimulation } from "../../store/useSimulation";

export default function ProcessList() {
  const { processes, removeProcess, isPlaying } = useSimulation();

  const active = processes.filter((p) => p.status !== "completed").length;

  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-4 min-h-[300px] flex flex-col">
      <h4 className="text-[10px] uppercase text-slate-500 font-bold mb-3 flex justify-between items-center shrink-0">
        Process State List
        <span className="text-primary">{active} Active</span>
      </h4>

      <div className="space-y-1.5 overflow-y-auto flex-1 custom-scrollbar pr-1">
        {processes.map((p) => (
          <div
            key={p.id}
            style={{ borderLeftColor: p.color }}
            className={`flex justify-between items-center p-2.5 rounded-lg border-l-2 transition-all duration-300 ${
              p.status === "running"
                ? "bg-primary/8 shadow-[0_0_16px_rgba(0,180,216,0.08)] scale-[1.01]"
                : p.status === "completed"
                ? "opacity-30 grayscale bg-white/3"
                : "bg-white/5"
            }`}
          >
            {/* ID + status */}
            <div className="flex flex-col min-w-[48px]">
              <span className="text-xs font-bold flex items-center gap-1.5">
                {p.id}
                {p.status === "running" && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                )}
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-600">{p.status}</span>
            </div>

            {/* Priority */}
            <div className="flex flex-col items-center px-3 border-x border-white/5">
              <span className="text-[10px] font-bold text-primary/80 flex items-center gap-0.5">
                <Hash size={9} />{p.priority}
              </span>
              <span className="text-[8px] text-white/20 uppercase">prio</span>
            </div>

            {/* Remaining */}
            <div className="text-right flex-1">
              <span className={`block text-xs font-bold ${p.status === "running" ? "text-primary" : "text-slate-500"}`}>
                {p.remainingTime}t
              </span>
              <span className="block text-[8px] text-slate-700 uppercase">left</span>
            </div>

            {/* Delete — only when not playing and not completed */}
            {!isPlaying && p.status !== "completed" && (
              <button
                onClick={() => removeProcess(p.id)}
                className="ml-2 p-1 rounded text-slate-600 hover:text-danger hover:bg-danger/10 transition-colors"
                title={`Remove ${p.id}`}
              >
                <X size={11} />
              </button>
            )}
          </div>
        ))}

        {processes.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/8 rounded-lg">
            <p className="text-slate-700 text-[10px] italic">No processes — add one to start</p>
          </div>
        )}
      </div>
    </div>
  );
}
