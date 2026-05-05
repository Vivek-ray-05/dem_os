"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, SkipForward, ArrowUp, ArrowDown } from "lucide-react";
import { useDisk } from "../../store/useDisk";
import type { DiskAlgo } from "../../store/useDisk";

const ALGOS: DiskAlgo[] = ["FCFS", "SSTF", "SCAN", "C-SCAN", "LOOK", "C-LOOK"];

const ALGO_DESC: Record<DiskAlgo, string> = {
  FCFS:    "Service requests in order received — simple but high seek time",
  SSTF:    "Always serve closest request — risk of starvation",
  SCAN:    "Sweep back and forth like an elevator — hits ends of disk",
  "C-SCAN": "One-way sweep, jump back to start — more uniform wait times",
  LOOK:    "Like SCAN but only goes as far as last request — no wasted travel",
  "C-LOOK": "Like C-SCAN but reverses at last request — most balanced",
};

const PRESETS: Record<string, { requests: number[]; head: number }> = {
  "Classic":  { requests: [98,183,37,122,14,124,65,67],  head: 53  },
  "Spread":   { requests: [10,180,50,160,30,140,70,120], head: 100 },
  "Clustered":{ requests: [40,45,50,55,60,65,70,75],     head: 100 },
};

export default function DiskVisualiser() {
  const {
    disk, setAlgorithm, setRequests, setInitialHead,
    setDirection, stepForward, togglePlay, setSpeed, reset,
  } = useDisk();

  const {
    requestQueue, initialHead, headPosition, direction,
    diskSize, algorithm, history, sequence,
    currentStep, totalSeekDistance, isPlaying, speed,
  } = disk;

  const [inputVal, setInputVal] = useState(requestQueue.join(", "));

  useEffect(() => {
    setInputVal(requestQueue.join(", "));
  }, [requestQueue]);

  const handleRequestInput = (val: string) => {
    setInputVal(val);
    const nums = val.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n) && n >= 0 && n < diskSize);
    if (nums.length > 0) setRequests(nums);
  };

  const done = currentStep >= sequence.length;

  useEffect(() => {
    if (!isPlaying || done) return;
    const id = setInterval(stepForward, 1000 / speed);
    return () => clearInterval(id);
  }, [isPlaying, speed, done, currentStep]);

  // SVG chart dimensions
  const chartW = 560;
  const chartH = 260;
  const padL = 40; const padR = 20;
  const padT = 20; const padB = 30;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  // Map cylinder → x, step → y
  const cx = (cyl: number) => padL + (cyl / (diskSize - 1)) * innerW;
  const cy = (step: number, total: number) => padT + (step / Math.max(total, 1)) * innerH;

  // Build path points: start + all history moves
  const pathPoints: { x: number; y: number; cyl: number; isFault: boolean }[] = [];
  pathPoints.push({ x: cx(initialHead), y: padT, cyl: initialHead, isFault: false });
  history.forEach((step, i) => {
    pathPoints.push({ x: cx(step.to), y: cy(i + 1, sequence.length), cyl: step.to, isFault: false });
  });

  const pathD = pathPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="flex flex-col gap-5">

      {/* ── Concept bar ───────────────────────────────────────── */}
      <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl text-[10px] text-slate-400 leading-relaxed">
        <span className="text-primary font-bold">{algorithm}</span>
        {" — "}{ALGO_DESC[algorithm]}
      </div>

      {/* ── Controls row ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Algorithm selector */}
        <div className="flex items-center gap-0.5 bg-black/40 p-1 rounded-lg border border-white/5">
          {ALGOS.map((a) => (
            <button key={a} onClick={() => setAlgorithm(a)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all ${
                algorithm === a
                  ? "bg-primary text-black shadow-[0_0_14px_rgba(0,180,216,0.35)] scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}>{a}</button>
          ))}
        </div>

        {/* Direction — only relevant for SCAN / LOOK */}
        {(algorithm === "SCAN" || algorithm === "LOOK") && (
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-slate-500 uppercase font-bold">Dir</span>
            <button onClick={() => setDirection("up")}
              className={`p-1.5 rounded-lg border text-[10px] transition-all ${
                direction === "up" ? "bg-primary/15 border-primary/30 text-primary" : "border-white/8 text-slate-500 hover:bg-white/5"
              }`}><ArrowUp size={12} /></button>
            <button onClick={() => setDirection("down")}
              className={`p-1.5 rounded-lg border text-[10px] transition-all ${
                direction === "down" ? "bg-primary/15 border-primary/30 text-primary" : "border-white/8 text-slate-500 hover:bg-white/5"
              }`}><ArrowDown size={12} /></button>
          </div>
        )}

        {/* Speed + playback */}
        <div className="flex items-center gap-0.5 bg-black/30 p-0.5 rounded-lg border border-white/5 ml-auto">
          {([1,2,4] as const).map((s) => (
            <button key={s} onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                speed === s ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
              }`}>{s}×</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={reset} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5">
            <RotateCcw size={13} />
          </button>
          <button onClick={stepForward} disabled={done || isPlaying}
            className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 disabled:opacity-30">
            <SkipForward size={13} />
          </button>
          <button onClick={togglePlay} disabled={done}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 ${
              isPlaying
                ? "bg-danger/15 text-danger border border-danger/25"
                : "bg-primary text-black hover:brightness-110 shadow-[0_0_12px_rgba(0,180,216,0.25)]"
            }`}>
            {isPlaying ? <><Pause size={11} fill="currentColor" /> STOP</> : <><Play size={11} fill="currentColor" /> RUN</>}
          </button>
        </div>
      </div>

      {/* ── Presets + input ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[9px] text-slate-500 uppercase font-bold shrink-0">Presets</span>
        {Object.entries(PRESETS).map(([name, { requests, head }]) => (
          <button key={name}
            onClick={() => { setRequests(requests); setInitialHead(head); }}
            className="px-2.5 py-1 text-[9px] font-bold rounded border border-white/10 text-slate-400 hover:text-white hover:border-primary/30 hover:bg-primary/5 transition-all">
            {name}
          </button>
        ))}
        <div className="flex items-center gap-2 ml-2">
          <span className="text-[9px] text-slate-500 uppercase font-bold shrink-0">Head</span>
          <input type="number" min={0} max={diskSize - 1} value={initialHead}
            onChange={(e) => setInitialHead(Math.min(diskSize - 1, Math.max(0, Number(e.target.value))))}
            className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-primary text-center focus:border-primary outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500 uppercase font-bold shrink-0">Queue</span>
          <input
            value={inputVal}
            onChange={(e) => handleRequestInput(e.target.value)}
            className="w-48 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-300 focus:border-primary outline-none font-mono"
            placeholder="98, 183, 37, 122..."
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* ── Seek chart ────────────────────────────────────── */}
        <div className="col-span-12 md:col-span-8">
          <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">
            Seek Chart <span className="text-slate-700 font-normal normal-case ml-2">X = cylinder, Y = time step</span>
          </p>
          <div className="bg-black/30 border border-white/5 rounded-xl p-2 overflow-x-auto">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ minWidth: 320 }}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <g key={t}>
                  <line
                    x1={padL} y1={padT + t * innerH}
                    x2={padL + innerW} y2={padT + t * innerH}
                    stroke="rgba(255,255,255,0.04)" strokeWidth="1"
                  />
                  <text x={padL - 4} y={padT + t * innerH + 3}
                    fill="rgba(255,255,255,0.2)" fontSize="8" textAnchor="end" fontFamily="monospace">
                    {Math.round(t * sequence.length)}
                  </text>
                </g>
              ))}

              {/* Cylinder axis labels */}
              {[0, 50, 100, 150, 199].map((cyl) => (
                <text key={cyl}
                  x={cx(cyl)} y={chartH - 6}
                  fill="rgba(255,255,255,0.2)" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  {cyl}
                </text>
              ))}

              {/* Request markers at top */}
              {requestQueue.map((cyl, i) => (
                <g key={i}>
                  <line x1={cx(cyl)} y1={padT} x2={cx(cyl)} y2={padT + innerH}
                    stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx={cx(cyl)} cy={padT - 4} r={3}
                    fill="rgba(0,180,216,0.4)" stroke="#00b4d8" strokeWidth="0.5" />
                </g>
              ))}

              {/* Future sequence (dim) */}
              {sequence.slice(currentStep).map((cyl, i) => {
                const step = currentStep + i;
                return (
                  <circle key={`future-${i}`}
                    cx={cx(cyl)} cy={cy(step + 1, sequence.length)}
                    r={3} fill="rgba(255,255,255,0.06)" />
                );
              })}

              {/* Completed path */}
              {pathPoints.length > 1 && (
                <path d={pathD} fill="none"
                  stroke="#00b4d8" strokeWidth="2"
                  strokeLinejoin="round" strokeLinecap="round"
                  opacity="0.8"
                />
              )}

              {/* Path points */}
              {pathPoints.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={i === 0 ? 5 : 4}
                    fill={i === 0 ? "#f59e0b" : "#00b4d8"}
                    stroke={i === 0 ? "#f59e0b" : "#00b4d8"}
                    strokeWidth="1.5" opacity="0.9"
                  />
                  {i > 0 && (
                    <text x={p.x + 6} y={p.y + 3}
                      fill="rgba(0,180,216,0.6)" fontSize="7" fontFamily="monospace">
                      {p.cyl}
                    </text>
                  )}
                </g>
              ))}

              {/* Current head indicator */}
              <line
                x1={cx(headPosition)} y1={padT}
                x2={cx(headPosition)} y2={padT + innerH}
                stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6"
              />
              <text x={cx(headPosition)} y={padT - 8}
                fill="#f59e0b" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                {headPosition}
              </text>
            </svg>
          </div>
        </div>

        {/* ── Stats + sequence ──────────────────────────────── */}
        <div className="col-span-12 md:col-span-4 space-y-4">

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/30 border border-white/5 rounded-xl p-3">
              <p className="text-[8px] text-slate-500 uppercase font-bold">Total Seek</p>
              <p className="text-2xl font-black text-primary">{totalSeekDistance}</p>
              <p className="text-[8px] text-slate-600">cylinders</p>
            </div>
            <div className="bg-black/30 border border-white/5 rounded-xl p-3">
              <p className="text-[8px] text-slate-500 uppercase font-bold">Avg Seek</p>
              <p className="text-2xl font-black text-success">
                {history.length > 0 ? (totalSeekDistance / history.length).toFixed(1) : "—"}
              </p>
              <p className="text-[8px] text-slate-600">per request</p>
            </div>
            <div className="bg-black/30 border border-white/5 rounded-xl p-3">
              <p className="text-[8px] text-slate-500 uppercase font-bold">Serviced</p>
              <p className="text-2xl font-black text-white">{currentStep}<span className="text-sm text-slate-600">/{sequence.length}</span></p>
            </div>
            <div className="bg-black/30 border border-white/5 rounded-xl p-3">
              <p className="text-[8px] text-slate-500 uppercase font-bold">Head</p>
              <p className="text-2xl font-black text-warn">{headPosition}</p>
              <p className="text-[8px] text-slate-600">current</p>
            </div>
          </div>

          {/* Service sequence */}
          <div className="bg-black/30 border border-white/5 rounded-xl p-3">
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Service Order</p>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar">
              {sequence.map((cyl, i) => (
                <div key={i}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                    i < currentStep
                      ? "bg-primary/15 border-primary/30 text-primary"
                      : i === currentStep
                      ? "bg-warn/15 border-warn/40 text-warn animate-pulse"
                      : "bg-white/3 border-white/8 text-slate-600"
                  }`}>
                  {cyl}
                </div>
              ))}
            </div>
          </div>

          {/* Per-step seek log */}
          <div className="bg-black/30 border border-white/5 rounded-xl p-3">
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Seek Log</p>
            <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
              {history.length === 0 && (
                <p className="text-[9px] text-slate-700 italic">no moves yet</p>
              )}
              {history.map((step, i) => (
                <div key={i} className="flex justify-between text-[9px] font-mono">
                  <span className="text-slate-500">{step.from} → {step.to}</span>
                  <span className="text-primary font-bold">{step.seekDistance}</span>
                </div>
              ))}
            </div>
          </div>

          {done && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-xl text-[10px] text-success font-bold">
              ✓ Complete — {totalSeekDistance} total cylinders travelled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}