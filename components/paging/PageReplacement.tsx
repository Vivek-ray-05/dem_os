"use client";
import { useEffect } from "react";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { usePaging } from "../../store/usePaging";
import type { ReplacementAlgo } from "../../store/usePaging";

const ALGOS: ReplacementAlgo[] = ["FIFO", "LRU", "OPTIMAL", "CLOCK"];
const PRESETS: Record<string, number[]> = {
  "Classic":   [7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1],
  "Thrashing": [1,2,3,4,1,2,5,1,2,3,4,5],
  "Locality":  [1,2,3,1,2,3,1,2,3,4,5,4,5,4,5],
};

const PAGE_COLORS: Record<number, string> = {
  0:"#00b4d8", 1:"#4caf7d", 2:"#f59e0b", 3:"#a78bfa",
  4:"#f472b6", 5:"#34d399", 6:"#fb923c", 7:"#60a5fa",
  8:"#e879f9", 9:"#f87171",
};
const pc = (p: number | null) => p != null ? (PAGE_COLORS[p] ?? "#888") : "transparent";

export default function PageReplacement() {
  const {
    refString, setRefString, frameCount, setFrameCount,
    replacementAlgo, setReplacementAlgo, frames, history,
    currentStep, isPlaying, speed, setSpeed, faults, hits,
    stepForward, togglePlay, resetReplacement,
  } = usePaging();

  // Auto-play ticker
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= refString.length) { togglePlay(); return; }
    const id = setInterval(stepForward, 1000 / speed);
    return () => clearInterval(id);
  }, [isPlaying, speed, currentStep, refString.length]);

  const done = currentStep >= refString.length;
  const faultRate = history.length > 0
    ? ((faults / history.length) * 100).toFixed(0) : "—";

  return (
    <div className="flex flex-col gap-5">

      {/* ── Controls row ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Algorithm selector */}
        <div className="flex items-center gap-0.5 bg-black/40 p-1 rounded-lg border border-white/5">
          {ALGOS.map((a) => (
            <button key={a} onClick={() => setReplacementAlgo(a)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all ${
                replacementAlgo === a
                  ? "bg-primary text-black shadow-[0_0_14px_rgba(0,180,216,0.35)] scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}>{a}</button>
          ))}
        </div>

        {/* Frame count */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-500 uppercase font-bold mr-1">Frames</span>
          {([2,3,4] as const).map((n) => (
            <button key={n} onClick={() => setFrameCount(n)}
              className={`w-7 h-7 rounded-md text-[10px] font-bold transition-all ${
                frameCount === n ? "bg-primary/20 text-primary border border-primary/30" : "text-slate-500 hover:bg-white/5"
              }`}>{n}</button>
          ))}
        </div>

        {/* Speed */}
        <div className="flex items-center gap-0.5 bg-black/30 p-0.5 rounded-lg border border-white/5 ml-auto">
          {([1,2,4] as const).map((s) => (
            <button key={s} onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                speed === s ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
              }`}>{s}×</button>
          ))}
        </div>

        {/* Playback */}
        <div className="flex items-center gap-1">
          <button onClick={resetReplacement}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <RotateCcw size={13} />
          </button>
          <button onClick={stepForward} disabled={done || isPlaying}
            className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors">
            <SkipForward size={13} />
          </button>
          <button onClick={togglePlay} disabled={done}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 ${
              isPlaying
                ? "bg-danger/15 text-danger border border-danger/25 hover:bg-danger/25"
                : "bg-primary text-black hover:brightness-110 shadow-[0_0_12px_rgba(0,180,216,0.25)]"
            }`}>
            {isPlaying ? <><Pause size={11} fill="currentColor"/> STOP</> : <><Play size={11} fill="currentColor"/> RUN</>}
          </button>
        </div>
      </div>

      {/* ── Preset reference strings ──────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] text-slate-500 uppercase font-bold shrink-0">Presets</span>
        {Object.entries(PRESETS).map(([name, seq]) => (
          <button key={name} onClick={() => setRefString(seq)}
            className="px-2.5 py-1 text-[9px] font-bold rounded border border-white/10 text-slate-400 hover:text-white hover:border-primary/30 hover:bg-primary/5 transition-all">
            {name}
          </button>
        ))}
        <span className="text-[9px] text-slate-600 ml-1">{refString.length} accesses</span>
      </div>

      {/* ── Main stage ───────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Frame slots */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-3">
          <h4 className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
            RAM Frames ({frameCount})
          </h4>
          {frames.map((f, i) => (
            <div key={i}
              style={{ borderColor: f.page != null ? pc(f.page) : "rgba(255,255,255,0.05)" }}
              className={`relative h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                f.justLoaded ? "scale-105 shadow-[0_0_20px_rgba(0,180,216,0.3)]" : ""
              }`}
              >
              {/* Clock bit badge */}
              {replacementAlgo === "CLOCK" && f.page != null && (
                <span className={`absolute top-1 right-1.5 text-[8px] font-black px-1 rounded ${
                  f.clockBit ? "text-primary" : "text-slate-600"
                }`}>{f.clockBit}</span>
              )}
              <div className="flex flex-col items-center">
                {f.page != null ? (
                  <>
                    <span style={{ color: pc(f.page) }} className="text-lg font-black leading-none">
                      P{f.page}
                    </span>
                    <span className="text-[8px] text-slate-600 uppercase">frame {i}</span>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-700 italic">empty</span>
                )}
              </div>
              {f.justLoaded && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-primary bg-background px-1.5 rounded-full border border-primary/30">
                  LOADED
                </span>
              )}
            </div>
          ))}

          {/* Stats */}
          <div className="mt-2 space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Page Faults</span>
              <span className="font-bold text-danger">{faults}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Hits</span>
              <span className="font-bold text-success">{hits}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-500">Fault Rate</span>
              <span className="font-bold text-white">{faultRate}{faultRate !== "—" ? "%" : ""}</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1">
              <div
                className="bg-success h-full transition-all duration-500"
                style={{ width: history.length > 0 ? `${(hits / history.length) * 100}%` : "0%" }}
              />
            </div>
            <p className="text-[8px] text-slate-700">hit rate</p>
          </div>
        </div>

        {/* Reference string + Timeline */}
        <div className="col-span-12 md:col-span-9 flex flex-col gap-3">
          <h4 className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
            Reference String &amp; Timeline
          </h4>

          {/* Reference string strip */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-0.5 pb-1" style={{ minWidth: refString.length * 34 }}>
              {refString.map((p, i) => {
                const result = history[i];
                const isNext = i === currentStep;
                const isPast = i < currentStep;
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    {/* Page chip */}
                    <div style={{
                      backgroundColor: isPast ? (result?.fault ? "rgba(239,68,68,0.15)" : "rgba(76,175,125,0.15)") : isNext ? "rgba(0,180,216,0.15)" : "rgba(255,255,255,0.03)",
                      borderColor: isPast ? (result?.fault ? "rgba(239,68,68,0.4)" : "rgba(76,175,125,0.4)") : isNext ? "rgba(0,180,216,0.5)" : "rgba(255,255,255,0.08)",
                      color: pc(p),
                    }}
                      className="w-7 h-8 rounded border flex items-center justify-center text-[11px] font-black transition-all duration-200"
                    >
                      {p}
                    </div>
                    {/* Fault/hit indicator */}
                    {isPast && (
                      <div className={`w-1.5 h-1.5 rounded-full ${result?.fault ? "bg-danger" : "bg-success"}`} />
                    )}
                    {isNext && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                    {!isPast && !isNext && <div className="w-1.5 h-1.5" />}
                    {/* Tick */}
                    <span className="text-[7px] text-slate-700">{i % 5 === 0 ? i : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Frame-slot timeline (Gantt-style) */}
          <div className="overflow-x-auto scrollbar-hide">
            <div style={{ minWidth: history.length * 34 }}>
              {Array.from({ length: frameCount }, (_, fi) => (
                <div key={fi} className="flex gap-0.5 mb-0.5">
                  <span className="text-[8px] text-slate-600 w-12 shrink-0 flex items-center">F{fi}</span>
                  {history.map((result, si) => {
                    const page = result.frameSnapshot[fi];
                    return (
                      <div key={si}
                        style={{
                          width: 28,
                          backgroundColor: page != null ? pc(page) + "26" : "transparent",
                          borderColor: page != null ? pc(page) + "60" : "rgba(255,255,255,0.04)",
                        }}
                        className={`h-7 rounded-sm border flex items-center justify-center shrink-0 ${
                          result.fault && result.frameSnapshot[fi] !== (history[si-1]?.frameSnapshot[fi] ?? null)
                            ? "ring-1 ring-danger/50" : ""
                        }`}
                      >
                        {page != null && (
                          <span style={{ color: pc(page) }} className="text-[9px] font-black">{page}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Progress + done state */}
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden">
              <div
                className="bg-primary/60 h-full transition-all duration-300"
                style={{ width: `${(currentStep / refString.length) * 100}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-600 shrink-0">{currentStep}/{refString.length}</span>
          </div>

          {done && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-xl text-[10px] text-success/80 font-bold">
              ✓ Simulation complete — {faults} faults in {refString.length} accesses ({faultRate}% fault rate)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
