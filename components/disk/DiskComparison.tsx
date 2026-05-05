"use client";
import { useDisk } from "../../store/useDisk";
import type { DiskAlgo } from "../../store/useDisk";

const ALGO_COLORS: Record<DiskAlgo, string> = {
  FCFS:     "#60a5fa",
  SSTF:     "#4caf7d",
  SCAN:     "#f59e0b",
  "C-SCAN": "#a78bfa",
  LOOK:     "#f472b6",
  "C-LOOK": "#00b4d8",
};

const ALGO_DESC: Record<DiskAlgo, string> = {
  FCFS:     "No optimisation — baseline",
  SSTF:     "Greedy closest first",
  SCAN:     "Elevator — hits disk ends",
  "C-SCAN": "Circular sweep",
  LOOK:     "Elevator — stops at last req",
  "C-LOOK": "Circular — stops at last req",
};

export default function DiskComparison() {
  const { disk, comparisonResults, runComparison, setAlgorithm, setActiveTab } = useDisk();
  const { requestQueue, initialHead } = disk;

  const hasResults = Object.keys(comparisonResults).length > 0;
  const results = Object.entries(comparisonResults) as [DiskAlgo, { sequence: number[]; totalSeek: number }][];
  const maxSeek = hasResults ? Math.max(...results.map(([, v]) => v.totalSeek)) : 1;
  const minSeek = hasResults ? Math.min(...results.map(([, v]) => v.totalSeek)) : 0;
  const sorted  = hasResults ? [...results].sort((a, b) => a[1].totalSeek - b[1].totalSeek) : [];
  const best    = sorted[0]?.[0];
  const worst   = sorted[sorted.length - 1]?.[0];
  const maxSequenceLength = hasResults ? Math.max(...results.map(([, v]) => v.sequence.length)) : 0;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Concept bar ─────────────────────────────────────── */}
      <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl text-[10px] text-slate-400 leading-relaxed">
        Run all 6 algorithms on the <span className="text-primary font-bold">same request queue</span> and
        head position to compare total seek distance side by side.
        Adjust the queue and head in the <span className="text-primary font-bold">Visualiser</span> tab,
        then come back here and click Run.
      </div>

      {/* ── Current input summary ─────────────────────────── */}
      <div className="flex items-center gap-4 p-3 bg-black/30 border border-white/5 rounded-xl text-[10px]">
        <div>
          <span className="text-slate-500 uppercase font-bold mr-2">Head</span>
          <span className="text-warn font-black">{initialHead}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-bold mr-2">Queue</span>
          <span className="text-slate-300 font-mono">[{requestQueue.join(", ")}]</span>
        </div>
        <button onClick={runComparison}
          className="ml-auto px-5 py-2 rounded-lg text-[10px] font-bold bg-primary text-black hover:brightness-110 shadow-[0_0_12px_rgba(0,180,216,0.25)] transition-all">
          Run All Algorithms
        </button>
      </div>

      {!hasResults && (
        <div className="h-48 flex items-center justify-center border border-dashed border-white/8 rounded-xl">
          <p className="text-[10px] text-slate-600 italic">Click "Run All Algorithms" to compare</p>
        </div>
      )}

      {hasResults && (
        <>
          {/* ── Winner / loser badges ─────────────────────── */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/25 rounded-xl">
              <span className="text-[8px] text-success uppercase font-bold">Best</span>
              <span style={{ color: ALGO_COLORS[best!] }} className="text-sm font-black">{best}</span>
              <span className="text-success text-[10px] font-bold">{comparisonResults[best!]?.totalSeek} cyl</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-danger/10 border border-danger/25 rounded-xl">
              <span className="text-[8px] text-danger uppercase font-bold">Worst</span>
              <span style={{ color: ALGO_COLORS[worst!] }} className="text-sm font-black">{worst}</span>
              <span className="text-danger text-[10px] font-bold">{comparisonResults[worst!]?.totalSeek} cyl</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-black/30 border border-white/8 rounded-xl ml-auto">
              <span className="text-[8px] text-slate-500 uppercase font-bold">Savings vs FCFS</span>
              <span className="text-primary text-[10px] font-bold">
                {comparisonResults["FCFS"]
                  ? `${comparisonResults["FCFS"].totalSeek - comparisonResults[best!]?.totalSeek} cyl`
                  : "—"}
              </span>
            </div>
          </div>

          {/* ── Bar chart ────────────────────────────────────── */}
          <div className="bg-black/20 border border-white/5 rounded-xl p-5 space-y-3">
            <p className="text-[9px] text-slate-500 uppercase font-bold">Total Seek Distance — lower is better</p>
            {sorted.map(([algo, { totalSeek }]) => {
              const barPct = (totalSeek / maxSeek) * 100;
              const isBest  = algo === best;
              const isWorst = algo === worst;
              return (
                <div key={algo} className="flex items-center gap-3">
                  <div className="w-16 text-right">
                    <span style={{ color: ALGO_COLORS[algo] }}
                      className="text-[10px] font-black">{algo}</span>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                      style={{
                        width: `${barPct}%`,
                        backgroundColor: ALGO_COLORS[algo] + (isBest ? "ff" : "99"),
                      }}>
                      <span className="text-[9px] font-black text-black/80">{totalSeek}</span>
                    </div>
                    {isBest && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-success font-bold">★ best</span>
                    )}
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-[9px] font-mono text-slate-500">
                      avg {(totalSeek / requestQueue.length).toFixed(1)}
                    </span>
                  </div>
                  {/* Jump to visualiser button */}
                  <button
                    onClick={() => { setAlgorithm(algo); setActiveTab("visualiser"); }}
                    className="text-[8px] text-slate-600 hover:text-primary transition-colors px-2 py-1 rounded border border-transparent hover:border-primary/20">
                    view →
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Sequence table ──────────────────────────────── */}
          <div className="bg-black/20 border border-white/5 rounded-xl p-4">
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-3">Service Order Comparison</p>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-[9px] font-mono">
                <thead>
                  <tr>
                    <td className="text-slate-600 pr-4 pb-2 font-bold uppercase">Step</td>
                    {sorted.map(([algo]) => (
                      <td key={algo} className="pb-2 pr-3 font-bold"
                        style={{ color: ALGO_COLORS[algo] }}>{algo}</td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxSequenceLength }, (_, i) => (
                    <tr key={i} className="border-t border-white/4">
                      <td className="text-slate-600 pr-4 py-1">{i + 1}</td>
                      {sorted.map(([algo, { sequence }]) => (
                        <td key={algo} className="pr-3 py-1 text-slate-400">
                          {sequence[i] !== undefined ? sequence[i] : <span className="opacity-20">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t border-white/10">
                    <td className="text-slate-500 pr-4 py-1.5 font-bold uppercase text-[8px]">Total</td>
                    {sorted.map(([algo, { totalSeek }]) => (
                      <td key={algo} className="pr-3 py-1.5 font-black"
                        style={{ color: ALGO_COLORS[algo] }}>{totalSeek}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}