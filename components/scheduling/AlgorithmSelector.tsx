"use client";
import { Settings2 } from "lucide-react";
import { useSimulation } from "../../store/useSimulation";

const ALGORITHMS = ["FCFS", "SJF", "SRTF", "RR", "Priority"] as const;
type Algorithm = typeof ALGORITHMS[number];

const LABELS: Record<Algorithm, string> = {
  FCFS: "FCFS", SJF: "SJF", SRTF: "SJF(P)", RR: "RR", Priority: "PRIO",
};

export default function AlgorithmSelector() {
  const { algorithm, setAlgorithm } = useSimulation();

  return (
    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
      <Settings2 size={12} className="mx-2 text-slate-500 shrink-0" />
      {ALGORITHMS.map((algo) => {
        const active = algorithm === algo;
        return (
          <button
            key={algo}
            onClick={() => setAlgorithm(algo)}
            className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all ${
              active
                ? "bg-primary text-black shadow-[0_0_16px_rgba(0,180,216,0.4)] scale-105"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {LABELS[algo]}
          </button>
        );
      })}
    </div>
  );
}
