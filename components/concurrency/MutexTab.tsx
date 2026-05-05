"use client";
import { useEffect } from "react";
import { Play, Pause, RotateCcw, SkipForward, Lock, Unlock } from "lucide-react";
import { useConcurrency } from "../../store/useConcurrency";

const STATUS_STYLE: Record<string, string> = {
  ready:     "bg-white/5 border-white/10 text-slate-400",
  running:   "bg-primary/15 border-primary/40 text-primary shadow-[0_0_14px_rgba(0,180,216,0.15)]",
  blocked:   "bg-danger/10 border-danger/30 text-danger",
  completed: "bg-success/10 border-success/20 text-success/50 opacity-40",
};

const STATUS_LABEL: Record<string, string> = {
  ready: "READY", running: "IN CS", blocked: "BLOCKED", completed: "DONE",
};

export default function MutexTab() {
  const {
    mutex,
    mutexRequestLock, mutexReleaseLock,
    mutexStep, mutexTogglePlay, mutexSetSpeed, mutexReset,
  } = useConcurrency();

  const { lock, queue, threads, tick, isPlaying, speed, logs } = mutex;
  const allDone = threads.every((t) => t.status === "completed");

  useEffect(() => {
    if (!isPlaying || allDone) return;
    const id = setInterval(mutexStep, 1000 / speed);
    return () => clearInterval(id);
  }, [isPlaying, speed, allDone, tick]);

  return (
    <div className="flex flex-col gap-5">

      {/* ── Concept callout ───────────────────────────────────── */}
      <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl text-[10px] text-slate-400 leading-relaxed">
        A <span className="text-primary font-bold">mutex</span> (mutual exclusion lock) allows only
        one thread into the critical section at a time. All other threads that request it are{" "}
        <span className="text-danger font-bold">blocked</span> and queued until the lock is released.
      </div>

      {/* ── Controls ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-0.5 bg-black/30 p-0.5 rounded-lg border border-white/5">
          {([1, 2, 4] as const).map((s) => (
            <button key={s} onClick={() => mutexSetSpeed(s)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                speed === s ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
              }`}>{s}×</button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={mutexReset} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5">
            <RotateCcw size={13} />
          </button>
          <button onClick={mutexStep} disabled={allDone || isPlaying}
            className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors">
            <SkipForward size={13} />
          </button>
          <button onClick={mutexTogglePlay} disabled={allDone}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 ${
              isPlaying
                ? "bg-danger/15 text-danger border border-danger/25 hover:bg-danger/25"
                : "bg-primary text-black hover:brightness-110 shadow-[0_0_12px_rgba(0,180,216,0.25)]"
            }`}>
            {isPlaying ? <><Pause size={11} fill="currentColor" /> STOP</> : <><Play size={11} fill="currentColor" /> RUN</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* ── Lock visualisation ────────────────────────────── */}
        <div className="col-span-12 md:col-span-4 space-y-4">

          {/* Lock state */}
          <div className={`rounded-2xl border p-5 flex flex-col items-center gap-3 transition-all duration-500 ${
            lock !== null
              ? "bg-danger/8 border-danger/25 shadow-[0_0_30px_rgba(239,68,68,0.08)]"
              : "bg-success/8 border-success/25 shadow-[0_0_30px_rgba(76,175,125,0.08)]"
          }`}>
            {lock !== null
              ? <Lock size={32} className="text-danger" />
              : <Unlock size={32} className="text-success" />
            }
            <div className="text-center">
              <p className={`text-xs font-black uppercase ${lock !== null ? "text-danger" : "text-success"}`}>
                {lock !== null ? "LOCKED" : "UNLOCKED"}
              </p>
              {lock !== null && (
                <p className="text-[9px] text-slate-500 mt-0.5">
                  held by <span style={{ color: threads.find(t => t.id === lock)?.color }} className="font-bold">T{lock}</span>
                </p>
              )}
            </div>

            {/* Tick display */}
            <p className="text-[9px] text-slate-600 font-mono">tick: {tick}</p>
          </div>

          {/* Wait queue */}
          <div className="bg-black/30 border border-white/5 rounded-xl p-3">
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-2 flex justify-between">
              Wait Queue <span className="text-slate-600">{queue.length} waiting</span>
            </p>
            {queue.length === 0 ? (
              <p className="text-[9px] text-slate-700 italic text-center py-2">empty</p>
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
              <p className="text-[9px] text-slate-500 uppercase font-bold">Manual Control</p>
              {threads.filter((t) => t.status === "ready").map((t) => (
                <button key={t.id} onClick={() => mutexRequestLock(t.id)}
                  style={{ borderColor: t.color + "40" }}
                  className="w-full text-left px-3 py-1.5 rounded-lg border bg-white/3 text-[10px] hover:bg-white/8 transition-colors">
                  <span style={{ color: t.color }} className="font-bold">T{t.id}</span>
                  <span className="text-slate-500 ml-2">request lock</span>
                </button>
              ))}
              {lock !== null && (
                <button onClick={mutexReleaseLock}
                  className="w-full px-3 py-1.5 rounded-lg border border-danger/20 bg-danger/5 text-[10px] text-danger hover:bg-danger/10 transition-colors">
                  T{lock} release lock
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Thread cards ──────────────────────────────────── */}
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
                  }`}>{STATUS_LABEL[t.status]}</span>
                </div>
                <div className="flex gap-3 mt-1 text-[8px] text-slate-600">
                  <span>wait: {t.waitTime}t</span>
                  <span>hold: {t.holdTime}t</span>
                </div>
              </div>
              {t.status === "running" && (
                <div className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Kernel logs ───────────────────────────────────── */}
        <div className="col-span-12 md:col-span-3">
          <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Event Log</p>
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 h-64 overflow-y-auto custom-scrollbar space-y-1">
            {logs.map((e, i) => (
              <p key={i} className={`text-[9px] font-mono ${
                e.kind === "acquire" ? "text-primary/80"
                : e.kind === "release" ? "text-success/80"
                : e.kind === "block" ? "text-danger/80"
                : "text-slate-600"
              }`}>
                <span className="text-white/20">[{String(e.tick).padStart(3,"0")}]</span> {e.text}
              </p>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}