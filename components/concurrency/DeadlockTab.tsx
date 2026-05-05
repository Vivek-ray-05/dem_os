"use client";
import { AlertTriangle, CheckCircle, RotateCcw, Search, Trash2 } from "lucide-react";
import { useConcurrency } from "../../store/useConcurrency";

const STATUS_COLOR: Record<string, string> = {
  running:   "text-primary",
  blocked:   "text-danger",
  completed: "text-success",
};
const STATUS_BG: Record<string, string> = {
  running:   "bg-primary/10 border-primary/20",
  blocked:   "bg-danger/10 border-danger/20",
  completed: "bg-success/10 border-success/20 opacity-50",
};

export default function DeadlockTab() {
  const { deadlock, deadlockAnalyse, deadlockReset, deadlockResolve } = useConcurrency();
  const { processes, resources, cycle, safeSequence, analysed, isSafe } = deadlock;

  const blockedCount   = processes.filter((p) => p.status === "blocked").length;
  const completedCount = processes.filter((p) => p.status === "completed").length;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Concept callout ───────────────────────────────────── */}
      <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl text-[10px] text-slate-400 leading-relaxed">
        <span className="text-primary font-bold">Banker's Algorithm</span> checks if a system
        is in a <span className="text-success font-bold">safe state</span> by finding a sequence
        where every process can finish. A{" "}
        <span className="text-danger font-bold">deadlock</span> occurs when processes form a
        circular wait — each holding a resource the next one needs.
      </div>

      {/* ── Action bar ────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button onClick={deadlockReset}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5">
          <RotateCcw size={13} />
        </button>
        <button onClick={deadlockAnalyse}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-bold bg-primary text-black hover:brightness-110 shadow-[0_0_12px_rgba(0,180,216,0.25)] transition-all">
          <Search size={12} /> RUN BANKER'S ALGORITHM
        </button>

        {/* Result badge */}
        {analysed && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[10px] font-bold ${
            isSafe
              ? "bg-success/10 border-success/30 text-success"
              : "bg-danger/10 border-danger/30 text-danger"
          }`}>
            {isSafe
              ? <><CheckCircle size={13} /> SAFE STATE</>
              : <><AlertTriangle size={13} /> UNSAFE — DEADLOCK</>
            }
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* ── Process + allocation table ────────────────────── */}
        <div className="col-span-12 md:col-span-7 space-y-4">

          {/* Resource availability */}
          <div className="flex gap-3">
            {resources.map((r) => (
              <div key={r.id} className="bg-black/30 border border-white/8 rounded-xl px-4 py-2.5 text-center min-w-[80px]">
                <p className="text-[9px] text-slate-500 uppercase font-bold">{r.name}</p>
                <p className="text-lg font-black text-white mt-0.5">{r.available}<span className="text-slate-600 text-xs">/{r.instances}</span></p>
                <p className="text-[8px] text-slate-600">available</p>
                {/* Available bar */}
                <div className="w-full bg-white/5 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${(r.available / r.instances) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Process table */}
          <div>
            <div className="grid text-[8px] text-slate-600 uppercase font-bold px-3 mb-1"
              style={{ gridTemplateColumns: "80px 100px 100px 100px 60px" }}>
              <span>Process</span>
              <span>Allocation</span>
              <span>Max Need</span>
              <span>Remaining</span>
              <span>Status</span>
            </div>
            <div className="space-y-1">
              {processes.map((p) => (
                <div key={p.id}
                  style={{ borderLeftColor: p.color }}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl border-l-2 border transition-all duration-300 ${STATUS_BG[p.status]}`}
                  >
                  <div className="flex items-center gap-2" style={{ gridColumn: "1" }}>
                    <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-black"
                      style={{ backgroundColor: p.color + "20", color: p.color }}>
                      {p.name}
                    </div>
                  </div>
                  {/* Use a flex row instead of nested grid to avoid style prop issues */}
                  <div className="flex gap-3 mt-1 flex-wrap">
                    <div className="text-[9px]">
                      <span className="text-slate-600 mr-1">Alloc:</span>
                      <span className="text-slate-300 font-mono">[{p.allocation.join(",")}]</span>
                    </div>
                    <div className="text-[9px]">
                      <span className="text-slate-600 mr-1">Max:</span>
                      <span className="text-slate-300 font-mono">[{p.maxNeed.join(",")}]</span>
                    </div>
                    <div className="text-[9px]">
                      <span className="text-slate-600 mr-1">Need:</span>
                      <span className={`font-mono font-bold ${p.remaining.some(r => r > 0) ? "text-warn" : "text-success"}`}>
                        [{p.remaining.join(",")}]
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${STATUS_BG[p.status]} ${STATUS_COLOR[p.status]}`}>
                        {p.status.toUpperCase()}
                      </span>
                      {/* Terminate to resolve deadlock */}
                      {analysed && !isSafe && cycle.includes(p.id) && p.status !== "completed" && (
                        <button onClick={() => deadlockResolve(p.id)}
                          className="p-1 rounded text-danger/60 hover:text-danger hover:bg-danger/10 transition-colors"
                          title={`Terminate ${p.name} to break deadlock`}>
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel — analysis results ────────────────── */}
        <div className="col-span-12 md:col-span-5 space-y-4">

          {/* Resource Allocation Graph (text-based) */}
          <div className="bg-black/30 border border-white/8 rounded-xl p-4 space-y-3">
            <p className="text-[9px] text-slate-500 uppercase font-bold">Resource Allocation Graph</p>

            {processes.filter((p) => p.status !== "completed").map((p) => (
              <div key={p.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-black shrink-0"
                    style={{ backgroundColor: p.color + "20", color: p.color }}>
                    {p.name}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    {p.holds.length > 0 && (
                      <div className="flex items-center gap-1 text-[9px]">
                        <span className="text-success/60">holds →</span>
                        {p.holds.map((r) => (
                          <span key={r} className="px-1.5 py-0.5 bg-success/10 border border-success/20 rounded text-success text-[8px] font-bold">
                            R{r}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.wants.length > 0 && (
                      <div className="flex items-center gap-1 text-[9px]">
                        <span className="text-danger/60">wants →</span>
                        {p.wants.map((r) => (
                          <span key={r} className="px-1.5 py-0.5 bg-danger/10 border border-danger/20 rounded text-danger text-[8px] font-bold">
                            R{r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Analysis results */}
          {analysed && (
            <div className="space-y-3">
              {/* Safe sequence */}
              {isSafe && (
                <div className="bg-success/8 border border-success/20 rounded-xl p-4">
                  <p className="text-[9px] text-success uppercase font-bold mb-2 flex items-center gap-1.5">
                    <CheckCircle size={11} /> Safe Sequence Found
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {safeSequence.map((pid, i) => {
                      const p = processes.find((pr) => pr.id === pid);
                      return (
                        <div key={i} className="flex items-center gap-1">
                          <div className="px-2.5 py-1 rounded-lg text-[10px] font-black border"
                            style={{
                              backgroundColor: p!.color + "20",
                              borderColor: p!.color + "50",
                              color: p!.color,
                            }}>
                            {p!.name}
                          </div>
                          {i < safeSequence.length - 1 && (
                            <span className="text-slate-600 text-[10px]">→</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-success/60 mt-2">
                    All processes can complete in this order without deadlock.
                  </p>
                </div>
              )}

              {/* Deadlock cycle */}
              {!isSafe && cycle.length > 0 && (
                <div className="bg-danger/8 border border-danger/20 rounded-xl p-4">
                  <p className="text-[9px] text-danger uppercase font-bold mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={11} /> Deadlock Cycle Detected
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    {cycle.map((pid, i) => {
                      const p = processes.find((pr) => pr.id === pid);
                      return (
                        <div key={i} className="flex items-center gap-1">
                          <div className="px-2.5 py-1 rounded-lg text-[10px] font-black border"
                            style={{
                              backgroundColor: p!.color + "15",
                              borderColor: p!.color + "40",
                              color: p!.color,
                            }}>
                            {p!.name}
                          </div>
                          <span className="text-danger/40 text-[10px]">
                            {i < cycle.length - 1 ? "→" : "↩"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-danger/60">
                    Click <Trash2 size={9} className="inline" /> next to a deadlocked process to terminate it and break the cycle.
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-black/30 border border-white/5 rounded-lg p-2">
                  <p className="text-lg font-black text-primary">{processes.length}</p>
                  <p className="text-[8px] text-slate-600 uppercase">Total</p>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-lg p-2">
                  <p className="text-lg font-black text-danger">{blockedCount}</p>
                  <p className="text-[8px] text-slate-600 uppercase">Blocked</p>
                </div>
                <div className="bg-black/30 border border-white/5 rounded-lg p-2">
                  <p className="text-lg font-black text-success">{completedCount}</p>
                  <p className="text-[8px] text-slate-600 uppercase">Done</p>
                </div>
              </div>
            </div>
          )}

          {!analysed && (
            <div className="h-32 flex items-center justify-center border border-dashed border-white/8 rounded-xl">
              <p className="text-[10px] text-slate-600 italic">
                Press "Run Banker's Algorithm" to analyse
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}