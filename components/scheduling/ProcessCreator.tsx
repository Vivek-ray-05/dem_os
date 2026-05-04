"use client";
import { useState } from "react";
import { Plus, Timer, Activity, Hash } from "lucide-react";
import { useSimulation } from "../../store/useSimulation";

export default function ProcessCreator() {
  const { addProcess, processes, algorithm, quantum, setQuantum, isPlaying } = useSimulation();

  const [burst,   setBurst]   = useState<number | "">("");
  const [arrival, setArrival] = useState<number | "">("");
  const [priority, setPriority] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    setError(null);
    if (burst === "" || arrival === "") { setError("Both fields required"); return; }
    if (Number(burst) <= 0)    { setError("Burst time must be > 0"); return; }
    if (Number(arrival) < 0)   { setError("Arrival time must be ≥ 0"); return; }
    if (Number(priority) < 1)  { setError("Priority must be ≥ 1"); return; }

    addProcess({
      id: `P${processes.length + 1}`,
      arrivalTime: Number(arrival),
      burstTime:   Number(burst),
      priority:    Number(priority),
      color:       "",   // store assigns from palette
    });
    setBurst(""); setArrival(""); setPriority(1);
  };

  const disabled = burst === "" || arrival === "" || isPlaying;

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
      <h4 className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-2">
        <Plus size={11} /> New Process
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-white/40 uppercase font-bold flex items-center gap-1">
            <Timer size={9} /> Arrival
          </label>
          <input
            type="number" min={0} placeholder="0"
            value={arrival}
            onChange={(e) => setArrival(e.target.value === "" ? "" : Number(e.target.value))}
            className="bg-black/40 border border-white/10 rounded-md p-2 text-xs focus:border-primary outline-none transition-colors placeholder:text-white/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-white/40 uppercase font-bold flex items-center gap-1">
            <Activity size={9} /> Burst
          </label>
          <input
            type="number" min={1} placeholder="5"
            value={burst}
            onChange={(e) => setBurst(e.target.value === "" ? "" : Number(e.target.value))}
            className="bg-black/40 border border-white/10 rounded-md p-2 text-xs focus:border-primary outline-none transition-colors placeholder:text-white/20"
          />
        </div>
      </div>

      {algorithm === "Priority" && (
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-white/40 uppercase font-bold flex items-center gap-1">
            <Hash size={9} /> Priority (lower = higher)
          </label>
          <input
            type="number" min={1}
            value={priority}
            onChange={(e) => setPriority(Math.max(1, Number(e.target.value)))}
            className="bg-black/40 border border-white/10 rounded-md p-2 text-xs focus:border-primary outline-none transition-colors"
          />
        </div>
      )}

      {algorithm === "RR" && (
        <div className="flex flex-col gap-1 p-3 bg-primary/5 rounded-lg border border-primary/15">
          <label className="text-[9px] uppercase tracking-widest text-primary font-bold">
            Time Quantum (q)
          </label>
          <input
            type="number" min={1}
            value={quantum}
            onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-black/60 border border-white/10 rounded-md p-2 text-xs text-primary focus:border-primary outline-none"
          />
        </div>
      )}

      {error && (
        <p className="text-[10px] text-danger">{error}</p>
      )}

      {isPlaying && (
        <p className="text-[10px] text-warn/70">Stop kernel to add processes</p>
      )}

      <button
        onClick={handleAdd}
        disabled={disabled}
        className={`w-full py-2 rounded-lg text-[10px] font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${
          disabled
            ? "bg-white/5 text-white/15 cursor-not-allowed"
            : "bg-primary text-black hover:brightness-110 shadow-[0_0_12px_rgba(0,180,216,0.25)] active:scale-95"
        }`}
      >
        <Plus size={12} fill="currentColor" /> ADD TO QUEUE
      </button>
    </div>
  );
}
