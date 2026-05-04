"use client";
import { useSimulation, getCpuUtilisation } from "../../store/useSimulation";

export default function StatsCard() {
  const { processes, history, isPlaying } = useSimulation();

  const completed = processes.filter(
    (p) => p.status === "completed" && p.finishTime != null
  );

  const stats = completed.map((p) => {
    const tat = (p.finishTime ?? 0) - p.arrivalTime;
    const wt  = tat - p.burstTime;
    return { tat, wt: Math.max(0, wt) };   // clamp — never negative
  });

  const avg = (arr: number[]) =>
    arr.length === 0 ? "—" : (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);

  const avgWT  = avg(stats.map((s) => s.wt));
  const avgTAT = avg(stats.map((s) => s.tat));
  const cpuPct = getCpuUtilisation(history);

  return (
    <div className="bg-surface border border-white/5 rounded-xl p-5 space-y-4">
      {/* CPU utilisation — real value */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wide">CPU Utilisation</span>
          <span className="text-primary text-lg font-bold">{isPlaying || history.length > 0 ? `${cpuPct}%` : "—"}</span>
        </div>
        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-700"
            style={{ width: `${cpuPct}%` }}
          />
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase font-bold">Avg Waiting</p>
          <p className="text-xl font-bold text-primary mt-0.5">{avgWT}<span className="text-xs font-normal text-slate-600 ml-1">t</span></p>
        </div>
        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
          <p className="text-[9px] text-slate-500 uppercase font-bold">Avg TAT</p>
          <p className="text-xl font-bold text-success mt-0.5">{avgTAT}<span className="text-xs font-normal text-slate-600 ml-1">t</span></p>
        </div>
      </div>

      <div className="flex justify-between items-center pt-1 border-t border-white/5">
        <span className="text-[9px] text-slate-500 uppercase font-bold">Throughput</span>
        <span className="text-xs font-bold text-white">{completed.length} jobs done</span>
      </div>
    </div>
  );
}
