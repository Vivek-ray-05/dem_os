"use client";
import { useEffect } from "react";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { useConcurrency } from "../../store/useConcurrency";

const STATUS_STYLE: Record<string, string> = {
  ready:     "bg-white/5 border-white/10 text-slate-400",
  running:   "bg-primary/15 border-primary/40 text-primary",
  blocked:   "bg-danger/10 border-danger/30 text-danger",
  completed: "bg-success/10 border-success/20 text-success/50 opacity-40",
};

export default function SemaphoreTab() {
  const {
    semaphore,
    semaphoreWait, semaphoreSignal,
    semaphoreStep, semaphoreTogglePlay,
    semaphoreSetSpeed, semaphoreReset, semaphoreSetMax,
  } = useConcurrency();

  const { value, maxValue, queue, threads, tick, isPlaying, speed, logs } = semaphore;
  const allDone = threads.every((t) => t.status === "completed");
  const fillPct = (value / maxValue) * 100;

  useEffect(() => {
    if (!isPlaying || allDone) return;
    const id = setInterval(semaphoreStep, 1000 / speed);
    return () => clearInterval(id);
  }, [isPlaying, speed, allDone, tick]);

  return (
    <div className="flex flex-col gap-5">

      {/* ── Concept callout ───────────────────────────────────── */}
      <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl text-[10px] text-slate-400 leading-relaxed">
        A <span className="text-primary font-bold">semaphore</span> is a counter that controls
        access to a shared resource pool.{" "}
        <span className="text-warn font-bold">wait()</span> decrements it (blocks if 0).{" "}
        <span className="text-success font-bold">signal()</span> increments it (unblocks a waiting thread).
        Unlike a mutex, multiple threads can hold it simultaneously.
      </div>

      {/* ── Controls ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Max value selector */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500 uppercase font-bold">Capacity</span>
          {[1, 2, 3].map((v) => (
            <button key={v} onClick={() => semaphoreSetMax(v)}
              className={`w-7 h-7 rounded-md text-[10px] font-bold transition-all ${
                maxValue === v
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-slate-500 hover:bg-white/5 border border-transparent"
              }`}>{v}</button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 bg-black/30 p-0.5 rounded-lg border border-white/5 ml-auto">
          {([1, 2, 4] as const).map((s) => (
            <button key={s} onClick={() => semaphoreSetSpeed(s)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                speed === s ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
              }`}>{s}×</button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={semaphoreReset} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5">
            <RotateCcw size={13} />
          </button>
          <button onClick={semaphoreStep} disabled={allDone || isPlaying}
            className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 disabled:opacity-30">
            <SkipForward size={13} />
          </button>
          <button onClick={semaphoreTogglePlay} disabled={allDone}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 ${
              isPlaying
                ? "bg-danger/15 text-danger border border-danger/25"
                : "bg-primary text-black hover:brightness-110 shadow-[0_0_12px_rgba(0,180,216,0.25)]"
            }`}>
            {isPlaying ? <><Pause size={11} fill="currentColor" /> STOP</> : <><Play size={11} fill="currentColor" /> RUN</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* ── Semaphore gauge ───────────────────────────────── */}
        <div className="col-span-12 md:col-span-4 space-y-4">

          {/* Big counter */}
          <div className="bg-black/30 border border-white/8 rounded-2xl p-5 flex flex-col items-center gap-3">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Semaphore Value</p>
            <div className={`text-6xl font-black transition-all duration-300 ${
              value === 0 ? "text-danger" : value === maxValue ? "text-success" : "text-primary"
            }`}>
              {value}
            </div>
            <p className="text-[9px] text-slate-600">of {maxValue} slots free</p>

            {/* Slot visualisation */}
            <div className="flex gap-2">
              {Array.from({ length: maxValue }, (_, i) => (
                <div key={i}
                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-300 ${
                    i < value
                      ? "bg-success/20 border-success/50"
                      : "bg-danger/10 border-danger/30"
                  }`} />
              ))}
            </div>

            {/* Fill bar */}
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${fillPct}%`,
                  backgroundColor: value === 0 ? "#ef4444" : value === maxValue ? "#4caf7d" : "#00b4d8",
                }}
              />
            </div>
          </div>

          {/* Queue */}
          <div className="bg-black/30 border border-white/5 rounded-xl p-3">
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-2 flex justify-between">
              Blocked Queue <span className="text-slate-600">{queue.length}</span>
            </p>
            {queue.length === 0 ? (
              <p className="text-[9px] text-slate-700 italic text-center py-1">empty</p>
            ) : (
              <div className="flex gap-1.5 flex-wrap">
                {queue.map((tid, i) => {
                  const t = threads.find((th) => th.id === tid);
                  return (
                    <div key={i} style={{ borderColor: t?.color }}
                      className="px-2 py-0.5 border rounded text-[9px] font-bold text-slate-400">
                      T{tid}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manual controls */}
          {!isPlaying && (
            <div className="space-y-1.5">
              <p className="text-[9px] text-slate-500 uppercase font-bold">Manual</p>
              {threads.filter((t) => t.status === "ready").map((t) => (
                <button key={t.id} onClick={() => semaphoreWait(t.id)}
                  style={{ borderColor: t.color + "40" }}
                  className="w-full text-left px-3 py-1.5 rounded-lg border bg-white/3 text-[10px] hover:bg-white/8 transition-colors">
                  <span style={{ color: t.color }} className="font-bold">T{t.id}</span>
                  <span className="text-warn ml-2 font-bold">wait()</span>
                </button>
              ))}
              {threads.filter((t) => t.status === "running").map((t) => (
                <button key={t.id} onClick={() => semaphoreSignal(t.id)}
                  style={{ borderColor: t.color + "40" }}
                  className="w-full text-left px-3 py-1.5 rounded-lg border bg-white/3 text-[10px] hover:bg-white/8 transition-colors">
                  <span style={{ color: t.color }} className="font-bold">T{t.id}</span>
                  <span className="text-success ml-2 font-bold">signal()</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Threads ───────────────────────────────────────── */}
        <div className="col-span-12 md:col-span-5 space-y-2">
          <p className="text-[9px] text-slate-500 uppercase font-bold">Threads</p>
          {threads.map((t) => (
            <div key={t.id}
              style={{ borderLeftColor: t.color }}
              className={`flex items-center gap-3 p-3 rounded-xl border-l-2 border border-r-0 border-t-0 border-b-0 transition-all duration-300 ${STATUS_STYLE[t.status]}`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                style={{ backgroundColor: t.color + "20", color: t.color }}>
                T{t.id}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold">{t.name}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                    t.status === "running" ? "bg-primary/20 text-primary"
                    : t.status === "blocked" ? "bg-danger/20 text-danger"
                    : t.status === "completed" ? "bg-success/20 text-success"
                    : "bg-white/5 text-slate-500"
                  }`}>
                    {t.status === "running" ? "IN CS" : t.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-3 mt-1 text-[8px] text-slate-600">
                  <span>wait: {t.waitTime}t</span>
                  <span>hold: {t.holdTime}t</span>
                </div>
                {/* Progress bar while running */}
                {t.status === "running" && (
                  <div className="w-full bg-white/5 h-0.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (t.holdTime / 3) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Event log ─────────────────────────────────────── */}
        <div className="col-span-12 md:col-span-3">
          <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Event Log</p>
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 h-64 overflow-y-auto custom-scrollbar space-y-1">
            {logs.map((e, i) => (
              <p key={i} className={`text-[9px] font-mono ${
                e.kind === "wait"    ? "text-warn/80"
                : e.kind === "signal"  ? "text-success/80"
                : e.kind === "block"   ? "text-danger/80"
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