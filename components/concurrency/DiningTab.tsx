"use client";
import { useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, SkipForward, AlertTriangle } from "lucide-react";
import { useConcurrency } from "../../store/useConcurrency";

const STATE_LABEL: Record<string, string> = {
  thinking: "THINKING",
  hungry:   "HUNGRY",
  eating:   "EATING",
};

const STATE_COLOR: Record<string, string> = {
  thinking: "text-slate-400",
  hungry:   "text-warn",
  eating:   "text-success",
};

const STATE_BG: Record<string, string> = {
  thinking: "bg-white/5 border-white/10",
  hungry:   "bg-warn/10 border-warn/30",
  eating:   "bg-success/10 border-success/30 shadow-[0_0_16px_rgba(76,175,125,0.15)]",
};

export default function DiningTab() {
  const { dining, diningStep, diningTogglePlay, diningSetSpeed, diningReset } = useConcurrency();
  const { philosophers, forks, tick, isPlaying, speed, logs, deadlockDetected } = dining;
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(diningStep, 1000 / speed);
    return () => clearInterval(id);
  }, [isPlaying, speed, tick]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [logs.length]);

  // Compute positions for circular table (5 seats)
  const tableR = 110;       // radius for philosopher seats
  const forkR  = 68;        // radius for forks
  const cx = 150; const cy = 150; // SVG center

  const angle = (i: number, total: number) => (2 * Math.PI * i) / total - Math.PI / 2;

  const philoPos = philosophers.map((_, i) => ({
    x: cx + tableR * Math.cos(angle(i, 5)),
    y: cy + tableR * Math.sin(angle(i, 5)),
  }));

  const forkPos = forks.map((_, i) => ({
    x: cx + forkR * Math.cos(angle(i + 0.5, 5)),
    y: cy + forkR * Math.sin(angle(i + 0.5, 5)),
  }));

  return (
    <div className="flex flex-col gap-5">

      {/* ── Concept callout ───────────────────────────────────── */}
      <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl text-[10px] text-slate-400 leading-relaxed">
        5 philosophers sit at a round table. Each needs <span className="text-primary font-bold">2 forks</span> to eat
        but can only pick up adjacent forks. If all pick up their left fork simultaneously —{" "}
        <span className="text-danger font-bold">deadlock</span>. This illustrates circular wait.
      </div>

      {/* ── Controls ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-0.5 bg-black/30 p-0.5 rounded-lg border border-white/5">
          {([1, 2, 4] as const).map((s) => (
            <button key={s} onClick={() => diningSetSpeed(s)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                speed === s ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
              }`}>{s}×</button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={diningReset} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5">
            <RotateCcw size={13} />
          </button>
          <button onClick={diningStep} disabled={isPlaying || deadlockDetected}
            className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 disabled:opacity-30">
            <SkipForward size={13} />
          </button>
          <button onClick={diningTogglePlay} disabled={deadlockDetected}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 ${
              isPlaying
                ? "bg-danger/15 text-danger border border-danger/25"
                : "bg-primary text-black hover:brightness-110 shadow-[0_0_12px_rgba(0,180,216,0.25)]"
            }`}>
            {isPlaying ? <><Pause size={11} fill="currentColor" /> STOP</> : <><Play size={11} fill="currentColor" /> RUN</>}
          </button>
        </div>
      </div>

      {/* ── Deadlock banner ───────────────────────────────────── */}
      {deadlockDetected && (
        <div className="flex items-center gap-3 p-3 bg-danger/10 border border-danger/30 rounded-xl animate-pulse">
          <AlertTriangle size={16} className="text-danger shrink-0" />
          <div>
            <p className="text-[10px] font-black text-danger">DEADLOCK DETECTED</p>
            <p className="text-[9px] text-danger/70">All philosophers are hungry and waiting — circular wait achieved. Reset to try again.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-5">

        {/* ── Circular table SVG ────────────────────────────── */}
        <div className="col-span-12 md:col-span-5 flex flex-col items-center">
          <p className="text-[9px] text-slate-500 uppercase font-bold mb-3 self-start">Dining Table</p>

          <svg viewBox="0 0 300 300" className="w-full max-w-[300px]">
            {/* Table circle */}
            <circle cx={cx} cy={cy} r={50} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
            <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="10" fontFamily="monospace">TABLE</text>

            {/* Forks */}
            {forkPos.map((pos, i) => {
              const holder = forks[i];
              const philo = holder != null ? philosophers[holder] : null;
              return (
                <g key={`fork-${i}`}>
                  <circle
                    cx={pos.x} cy={pos.y} r={10}
                    fill={holder != null ? philo!.color + "30" : "rgba(255,255,255,0.04)"}
                    stroke={holder != null ? philo!.color : "rgba(255,255,255,0.12)"}
                    strokeWidth="1.5"
                  />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle"
                    fill={holder != null ? philo!.color : "rgba(255,255,255,0.3)"}
                    fontSize="9" fontFamily="monospace" fontWeight="bold">
                    F{i}
                  </text>
                </g>
              );
            })}

            {/* Philosophers */}
            {philoPos.map((pos, i) => {
              const p = philosophers[i];
              const stateColors: Record<string, string> = {
                thinking: "rgba(255,255,255,0.1)",
                hungry:   "#f59e0b33",
                eating:   "#4caf7d33",
              };
              const strokeColors: Record<string, string> = {
                thinking: "rgba(255,255,255,0.2)",
                hungry:   "#f59e0b",
                eating:   "#4caf7d",
              };
              return (
                <g key={`philo-${i}`}>
                  {p.state === "eating" && (
                    <circle cx={pos.x} cy={pos.y} r={22}
                      fill="none" stroke={p.color} strokeWidth="1"
                      opacity="0.3" strokeDasharray="4,4">
                      <animateTransform attributeName="transform" type="rotate"
                        from={`0 ${pos.x} ${pos.y}`} to={`360 ${pos.x} ${pos.y}`}
                        dur="3s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={pos.x} cy={pos.y} r={18}
                    fill={stateColors[p.state]}
                    stroke={strokeColors[p.state]}
                    strokeWidth={p.state === "eating" ? "2" : "1.5"} />
                  <text x={pos.x} y={pos.y - 2} textAnchor="middle"
                    fill={p.state === "thinking" ? "rgba(255,255,255,0.5)" : p.state === "hungry" ? "#f59e0b" : "#4caf7d"}
                    fontSize="10" fontFamily="monospace" fontWeight="bold">
                    P{i}
                  </text>
                  <text x={pos.x} y={pos.y + 9} textAnchor="middle"
                    fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="monospace">
                    {p.state === "eating" ? `×${p.eatCount}` : p.state === "hungry" ? `${p.waitTime}t` : ""}
                  </text>
                </g>
              );
            })}

            {/* Tick */}
            <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize="8" fontFamily="monospace">
              t={tick}
            </text>
          </svg>

          {/* Legend */}
          <div className="flex gap-4 mt-2 text-[9px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/20 inline-block"/> thinking</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warn inline-block"/> hungry</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block"/> eating</span>
          </div>
        </div>

        {/* ── Philosopher status cards ───────────────────────── */}
        <div className="col-span-12 md:col-span-4 space-y-2">
          <p className="text-[9px] text-slate-500 uppercase font-bold">Philosophers</p>
          {philosophers.map((p) => (
            <div key={p.id}
              style={{ borderLeftColor: p.color }}
              className={`flex items-center gap-3 p-2.5 rounded-xl border-l-2 border transition-all duration-300 ${STATE_BG[p.state]}`}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                style={{ backgroundColor: p.color + "20", color: p.color }}>
                P{p.id}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className={`text-[10px] font-black ${STATE_COLOR[p.state]}`}>
                    {STATE_LABEL[p.state]}
                  </span>
                  <span className="text-[8px] text-slate-600">ate {p.eatCount}×</span>
                </div>
                <div className="text-[8px] text-slate-600 mt-0.5">
                  Forks: {p.id} (L) &amp; {(p.id + 1) % 5} (R)
                  {p.state === "hungry" && <span className="text-warn ml-2">waiting {p.waitTime}t</span>}
                </div>
              </div>
            </div>
          ))}

          {/* Fork status */}
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 mt-2">
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Fork Status</p>
            <div className="grid grid-cols-5 gap-1">
              {forks.map((holder, i) => {
                const philo = holder != null ? philosophers[holder] : null;
                return (
                  <div key={i}
                    style={{ borderColor: philo ? philo.color + "60" : "rgba(255,255,255,0.08)" }}
                    className="flex flex-col items-center p-1.5 rounded-lg border bg-black/20">
                    <span className="text-[8px] text-slate-500 font-bold">F{i}</span>
                    <span style={{ color: philo?.color ?? "transparent" }}
                      className="text-[8px] font-black mt-0.5">
                      {holder != null ? `P${holder}` : "·"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Event log ─────────────────────────────────────── */}
        <div className="col-span-12 md:col-span-3">
          <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Event Log</p>
          <div ref={logRef} className="bg-black/30 border border-white/5 rounded-xl p-3 h-72 overflow-y-auto custom-scrollbar space-y-1">
            {logs.map((e, i) => (
              <p key={i} className={`text-[9px] font-mono ${
                e.kind === "deadlock" ? "text-danger font-bold"
                : e.kind === "acquire" ? "text-success/70"
                : e.kind === "release" ? "text-primary/70"
                : "text-slate-600"
              }`}>
                <span className="text-white/20">[{String(e.tick).padStart(3, "0")}]</span> {e.text}
              </p>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}