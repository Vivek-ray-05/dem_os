"use client";
import { useSimulation } from "../../store/useSimulation";

const BLOCK_W = 28;
const MAX_VISIBLE = 60;

export default function GanttChart() {
  const { history, processes } = useSimulation();

  const visible = history.slice(-MAX_VISIBLE);
  const startTick = Math.max(0, history.length - MAX_VISIBLE);

  return (
    <div className="bg-surface border border-white/5 rounded-xl p-4 mt-0">
      <h3 className="text-[10px] uppercase font-bold text-slate-500 mb-3 flex justify-between items-center">
        <span>Gantt Chart</span>
        <span className="text-slate-700 font-normal lowercase">cpu allocation / tick</span>
      </h3>

      {visible.length === 0 ? (
        <div className="h-12 flex items-center justify-center border border-dashed border-white/8 rounded-lg">
          <p className="text-slate-700 text-[10px] italic">Waiting for execution…</p>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide pb-1">
          <div className="flex gap-0.5 items-end" style={{ minWidth: visible.length * (BLOCK_W + 2) }}>
            {visible.map((id, i) => {
              const proc = processes.find((p) => p.id === id);
              const tick = startTick + i;
              return (
                <div key={i} className="flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="hidden group-hover:flex absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] px-2 py-0.5 rounded border border-white/10 z-10 whitespace-nowrap">
                    t{tick}: {id ?? "idle"}
                  </div>

                  {/* Block */}
                  <div
                    style={{
                      width: BLOCK_W,
                      backgroundColor: proc?.color ?? "transparent",
                    }}
                    className={`h-9 rounded-sm border-t-2 flex items-center justify-center transition-all ${
                      id ? "opacity-100 border-white/20" : "opacity-15 bg-slate-800 border-transparent"
                    }`}
                  >
                    {id && (
                      <span className="text-[8px] font-black text-black/70 uppercase select-none">
                        {id}
                      </span>
                    )}
                  </div>

                  {/* Tick label — every 5 ticks */}
                  <span className="text-[7px] text-slate-700 mt-0.5 font-mono">
                    {tick % 5 === 0 ? tick : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {history.length > MAX_VISIBLE && (
        <p className="text-[9px] text-slate-700 mt-1">
          Showing last {MAX_VISIBLE} of {history.length} ticks
        </p>
      )}
    </div>
  );
}
