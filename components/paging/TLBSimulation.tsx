"use client";
import { SkipForward, RotateCcw, Play, Pause } from "lucide-react";
import { useEffect } from "react";
import { usePaging } from "../../store/usePaging";

export default function TLBSimulation() {
  const { tlb, setTLBCapacity, stepTLB, resetTLB, speed, setSpeed, isPlaying, togglePlay } = usePaging();
  const { entries, accessLog, currentStep, referenceString, hits, misses, capacity } = tlb;

  const done = currentStep >= referenceString.length;
  const total = accessLog.length;
  const hitRate = total > 0 ? ((hits / total) * 100).toFixed(0) : "—";
  // Effective access time: assume TLB=10ns, memory=100ns
  const eat = total > 0
    ? ((hits * (10 + 100) + misses * (10 + 100 + 100)) / total).toFixed(0)
    : "—";

  useEffect(() => {
    if (!isPlaying) return;
    if (done) { togglePlay(); return; }
    const id = setInterval(stepTLB, 1000 / speed);
    return () => clearInterval(id);
  }, [isPlaying, speed, done, currentStep]);

  const lastAccess = accessLog[accessLog.length - 1];

  return (
    <div className="flex flex-col gap-5">

      {/* ── Controls ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* TLB size */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500 uppercase font-bold">TLB Size</span>
          {([2, 4, 8] as const).map((c) => (
            <button key={c} onClick={() => setTLBCapacity(c)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all border ${
                capacity === c ? "bg-primary/15 border-primary/30 text-primary" : "border-white/5 text-slate-500 hover:text-white hover:bg-white/5"
              }`}>{c} entries</button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 bg-black/30 p-0.5 rounded-lg border border-white/5 ml-auto">
          {([1, 2, 4] as const).map((s) => (
            <button key={s} onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                speed === s ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
              }`}>{s}×</button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={resetTLB} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5">
            <RotateCcw size={13} />
          </button>
          <button onClick={stepTLB} disabled={done || isPlaying}
            className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors">
            <SkipForward size={13} />
          </button>
          <button onClick={togglePlay} disabled={done}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 ${
              isPlaying ? "bg-danger/15 text-danger border border-danger/25" : "bg-primary text-black hover:brightness-110 shadow-[0_0_12px_rgba(0,180,216,0.25)]"
            }`}>
            {isPlaying ? <><Pause size={11} fill="currentColor"/> STOP</> : <><Play size={11} fill="currentColor"/> RUN</>}
          </button>
        </div>
      </div>

      {/* ── Main grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-5">

        {/* TLB cache */}
        <div className="col-span-12 md:col-span-3 space-y-3">
          <h4 className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
            TLB Cache ({capacity} entries)
          </h4>
          <div className="space-y-1">
            {/* Header */}
            <div className="grid grid-cols-3 text-[8px] text-slate-600 uppercase font-bold px-2">
              <span>#</span><span>VPN</span><span>PFN</span>
            </div>
            {Array.from({ length: capacity }, (_, i) => {
              const entry = entries[i];
              const isLastHit = lastAccess?.hit && entry?.vpn === lastAccess?.vpn;
              const isLastMiss = !lastAccess?.hit && !entry && i === entries.length;
              return (
                <div key={i}
                  className={`grid grid-cols-3 px-2 py-1.5 rounded-lg text-[10px] font-mono border transition-all duration-300 ${
                    isLastHit
                      ? "bg-success/15 border-success/30 text-success shadow-[0_0_10px_rgba(76,175,125,0.2)]"
                      : entry
                      ? "bg-white/5 border-white/8 text-slate-300"
                      : "bg-transparent border-dashed border-white/5 text-slate-700"
                  }`}>
                  <span className="text-slate-600">{i}</span>
                  <span>{entry ? `P${entry.vpn}` : "—"}</span>
                  <span>{entry ? `F${entry.pfn}` : "—"}</span>
                </div>
              );
            })}
          </div>

          {/* Current access result badge */}
          {lastAccess && (
            <div className={`p-2 rounded-lg border text-center text-[10px] font-bold transition-all ${
              lastAccess.hit
                ? "bg-success/10 border-success/30 text-success"
                : "bg-danger/10 border-danger/30 text-danger"
            }`}>
              {lastAccess.hit ? "✓ TLB HIT" : "✗ TLB MISS"}
              <div className="text-[8px] font-normal opacity-70 mt-0.5">
                VPN {lastAccess.vpn} → {lastAccess.pfn != null ? `PFN ${lastAccess.pfn}` : "not mapped"}
              </div>
            </div>
          )}
        </div>

        {/* Flow diagram */}
        <div className="col-span-12 md:col-span-5">
          <h4 className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-3">
            Translation Flow
          </h4>
          <div className="relative flex flex-col items-center gap-2 py-2">
            {/* CPU */}
            <div className="w-full max-w-xs bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-center">
              <p className="text-[9px] text-slate-500 uppercase font-bold">CPU</p>
              {lastAccess && (
                <p className="text-primary text-sm font-black">VA with VPN {lastAccess.vpn}</p>
              )}
            </div>

            <div className="h-4 w-px bg-primary/30"/>

            {/* TLB check */}
            <div className={`w-full max-w-xs border rounded-lg px-4 py-2 text-center transition-all duration-300 ${
              lastAccess ? (lastAccess.hit ? "bg-success/10 border-success/30" : "bg-danger/10 border-danger/30") : "bg-black/40 border-white/10"
            }`}>
              <p className="text-[9px] text-slate-500 uppercase font-bold">TLB Check</p>
              <p className={`text-xs font-bold ${lastAccess ? (lastAccess.hit ? "text-success" : "text-danger") : "text-slate-600"}`}>
                {lastAccess ? (lastAccess.hit ? "HIT — return PFN directly" : "MISS — go to page table") : "awaiting access…"}
              </p>
            </div>

            {/* Two paths */}
            <div className="flex w-full max-w-xs gap-3 justify-between">
              {/* Hit path */}
              <div className={`flex-1 border rounded-lg px-2 py-2 text-center transition-all duration-300 ${
                lastAccess?.hit ? "bg-success/10 border-success/30" : "border-white/5 opacity-30"
              }`}>
                <p className="text-[8px] text-success uppercase font-bold">Hit path</p>
                <p className="text-[9px] text-slate-400 mt-0.5">110ns total</p>
              </div>
              {/* Miss path */}
              <div className={`flex-1 border rounded-lg px-2 py-2 text-center transition-all duration-300 ${
                lastAccess && !lastAccess.hit ? "bg-danger/10 border-danger/30" : "border-white/5 opacity-30"
              }`}>
                <p className="text-[8px] text-danger uppercase font-bold">Miss path</p>
                <p className="text-[9px] text-slate-400 mt-0.5">210ns total</p>
              </div>
            </div>

            <div className="h-4 w-px bg-white/10"/>

            {/* RAM */}
            <div className="w-full max-w-xs bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-center">
              <p className="text-[9px] text-slate-500 uppercase font-bold">Physical Memory</p>
              {lastAccess?.pfn != null && (
                <p className="text-slate-300 text-xs font-bold">Frame {lastAccess.pfn}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="col-span-12 md:col-span-4 space-y-3">
          <h4 className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Performance</h4>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
              <p className="text-[8px] text-slate-500 uppercase font-bold">Hit Rate</p>
              <p className="text-2xl font-black text-success leading-tight">{hitRate}{hitRate !== "—" ? "%" : ""}</p>
            </div>
            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
              <p className="text-[8px] text-slate-500 uppercase font-bold">EAT</p>
              <p className="text-2xl font-black text-primary leading-tight">{eat}{eat !== "—" ? "ns" : ""}</p>
            </div>
            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
              <p className="text-[8px] text-slate-500 uppercase font-bold">Hits</p>
              <p className="text-xl font-black text-success">{hits}</p>
            </div>
            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
              <p className="text-[8px] text-slate-500 uppercase font-bold">Misses</p>
              <p className="text-xl font-black text-danger">{misses}</p>
            </div>
          </div>

          {/* Hit rate bar */}
          <div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className="bg-success h-full transition-all duration-500"
                style={{ width: total > 0 ? `${(hits / total) * 100}%` : "0%" }}
              />
            </div>
            <p className="text-[8px] text-slate-700 mt-1">hit rate progress</p>
          </div>

          {/* Access timeline */}
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Access Log</p>
            <div className="flex flex-wrap gap-1">
              {referenceString.map((p, i) => {
                const result = accessLog[i];
                const isNext = i === currentStep;
                return (
                  <div key={i}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-black transition-all ${
                      result ? (result.hit ? "bg-success/20 text-success border border-success/30" : "bg-danger/20 text-danger border border-danger/30")
                      : isNext ? "bg-primary/20 text-primary border border-primary/40 animate-pulse"
                      : "bg-white/5 text-slate-600 border border-white/5"
                    }`}>
                    {p}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
