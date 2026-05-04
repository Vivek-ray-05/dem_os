"use client";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useSimulation } from "../../store/useSimulation";

const SPEEDS = [1, 2, 4] as const;

export default function ControlBar({ module }: { module: string }) {
  const { isPlaying, togglePlay, resetSimulation, speed, setSpeed, tick } = useSimulation();

  return (
    <header className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-6 bg-surface/40 backdrop-blur-sm z-10">
      <h2 className="text-[10px] uppercase tracking-widest text-slate-500">
        Module <span className="mx-1.5 text-white/20">/</span>
        <span className="text-primary font-bold">{module}</span>
        <span className="ml-3 text-slate-600">tick: {tick}</span>
      </h2>

      <div className="flex items-center gap-2">
        {/* Speed selector */}
        <div className="flex items-center gap-0.5 bg-black/30 p-0.5 rounded-lg border border-white/5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                speed === s
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
          <button
            onClick={resetSimulation}
            className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={togglePlay}
            className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              isPlaying
                ? "bg-danger/15 text-danger border border-danger/25 hover:bg-danger/25"
                : "bg-primary text-black hover:brightness-110 shadow-[0_0_14px_rgba(0,180,216,0.3)]"
            }`}
          >
            {isPlaying
              ? <><Pause size={13} fill="currentColor" /> STOP</>
              : <><Play  size={13} fill="currentColor" /> RUN KERNEL</>
            }
          </button>
        </div>
      </div>
    </header>
  );
}
