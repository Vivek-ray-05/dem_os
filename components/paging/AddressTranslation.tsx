"use client";
import { ChevronRight, RotateCcw } from "lucide-react";
import { usePaging } from "../../store/usePaging";

const PAGE_SIZES = [4, 8, 16, 32] as const;

export default function AddressTranslation() {
  const {
    translation,
    setPageSize,
    setVirtualAddress,
    advanceTranslationStage,
    resetTranslation,
  } = usePaging();

  const { pageSize, virtualAddress, frameTable, stage, totalFrames } = translation;

  // Derived values
  const offsetBits  = Math.log2(pageSize);
  const pageBits    = Math.log2(frameTable.length);
  const maxVA       = frameTable.length * pageSize - 1;
  const pageNumber  = Math.floor(virtualAddress / pageSize);
  const offset      = virtualAddress % pageSize;
  const frameNumber = frameTable[pageNumber];
  const physicalAddress = frameNumber != null ? frameNumber * pageSize + offset : null;

  // Binary representations
  const toBin = (n: number, bits: number) =>
    n.toString(2).padStart(bits, "0");

  const vaBin     = toBin(virtualAddress, pageBits + offsetBits);
  const pnBin     = vaBin.slice(0, pageBits);
  const offBin    = vaBin.slice(pageBits);
  const fnBin     = frameNumber != null ? toBin(frameNumber, pageBits) : "??";
  const paBin     = frameNumber != null ? fnBin + offBin : "??";

  const STAGE_LABELS: Record<typeof stage, string> = {
    idle:      "Press Step to begin",
    split:     "Split: page number | offset",
    lookup:    "Lookup page table",
    assemble:  "Assemble physical address",
    highlight: "Physical memory highlighted",
  };

  const stageIndex = ["idle","split","lookup","assemble","highlight"].indexOf(stage);
  const isPageFault = frameNumber == null && (stage as string) !== "idle";

  return (
    <div className="flex flex-col gap-5">

      {/* ── Config row ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500 uppercase font-bold">Page Size</span>
          <div className="flex gap-0.5 bg-black/30 p-0.5 rounded-lg border border-white/5">
            {PAGE_SIZES.map((ps) => (
              <button key={ps} onClick={() => setPageSize(ps)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                  pageSize === ps ? "bg-primary text-black" : "text-slate-400 hover:text-white"
                }`}>{ps}B</button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500 uppercase font-bold">Virtual Address</span>
          <input
            type="number" min={0} max={maxVA} value={virtualAddress}
            onChange={(e) => setVirtualAddress(Math.min(maxVA, Math.max(0, Number(e.target.value))))}
            className="w-20 bg-black/40 border border-white/10 rounded-md px-2 py-1 text-xs text-primary text-center focus:border-primary outline-none"
          />
          <span className="text-[9px] text-slate-600">max: {maxVA}</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={resetTranslation}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <RotateCcw size={13} />
          </button>
          <button onClick={advanceTranslationStage}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              stage === "highlight"
                ? "bg-white/5 text-slate-400"
                : "bg-primary text-black hover:brightness-110 shadow-[0_0_12px_rgba(0,180,216,0.25)]"
            }`}>
            {stage === "highlight" ? "Reset to try again" : <><ChevronRight size={12}/> STEP</>}
          </button>
        </div>
      </div>

      {/* ── Stage indicator ──────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {["split","lookup","assemble","highlight"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-1 rounded-full transition-all duration-500 ${
              i < stageIndex ? "bg-primary w-8" : i === stageIndex - 1 ? "bg-primary w-8" : "bg-white/10 w-5"
            }`}/>
            <span className={`text-[9px] uppercase font-bold ${i < stageIndex ? "text-primary" : "text-slate-600"}`}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* ── Main animation ───────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Address dissection */}
        <div className="col-span-12 md:col-span-7 space-y-4">

          {/* Virtual address box */}
          <div className="bg-black/30 rounded-xl p-4 border border-white/5">
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Virtual Address</p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-primary text-xl font-black">{virtualAddress}</span>
              <span className="text-slate-500 text-sm">= 0b</span>
              <div className="flex font-mono text-sm font-bold gap-0">
                {/* Page number bits */}
                {pnBin.split("").map((bit, i) => (
                  <span key={`pn${i}`}
                    className={`w-6 h-7 flex items-center justify-center rounded transition-all duration-500 ${
                      stageIndex >= 1
                        ? "bg-primary/20 text-primary border-t-2 border-primary/60"
                        : "text-slate-400"
                    }`}>{bit}</span>
                ))}
                {/* Offset bits */}
                {offBin.split("").map((bit, i) => (
                  <span key={`off${i}`}
                    className={`w-6 h-7 flex items-center justify-center rounded transition-all duration-500 ${
                      stageIndex >= 1
                        ? "bg-warn/20 text-warn border-t-2 border-warn/60"
                        : "text-slate-400"
                    }`}>{bit}</span>
                ))}
              </div>
            </div>

            {stageIndex >= 1 && (
              <div className="flex gap-6 text-[10px] font-bold animate-in fade-in duration-300">
                <div>
                  <span className="text-primary">{pageBits}-bit</span>
                  <span className="text-slate-500 ml-1">page number =</span>
                  <span className="text-primary ml-1">P{pageNumber}</span>
                </div>
                <div>
                  <span className="text-warn">{offsetBits}-bit</span>
                  <span className="text-slate-500 ml-1">offset =</span>
                  <span className="text-warn ml-1">{offset}</span>
                </div>
              </div>
            )}
          </div>

          {/* Arrow */}
          {stageIndex >= 2 && (
            <div className="flex items-center justify-center animate-in fade-in duration-300">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-500">page table lookup</span>
                <div className="h-8 w-px bg-gradient-to-b from-primary/60 to-transparent"/>
                {isPageFault ? (
                  <span className="text-[10px] font-bold text-danger bg-danger/10 px-3 py-1 rounded-full border border-danger/20">
                    PAGE FAULT — P{pageNumber} not in memory
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-500">P{pageNumber} → Frame {frameNumber}</span>
                )}
              </div>
            </div>
          )}

          {/* Physical address box */}
          {stageIndex >= 3 && !isPageFault && (
            <div className="bg-black/30 rounded-xl p-4 border border-success/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="text-[9px] text-success uppercase font-bold mb-2">Physical Address</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-success text-xl font-black">{physicalAddress}</span>
                <span className="text-slate-500 text-sm">= 0b</span>
                <div className="flex font-mono text-sm font-bold gap-0">
                  {fnBin.split("").map((bit, i) => (
                    <span key={i} className="w-6 h-7 flex items-center justify-center rounded bg-success/20 text-success border-t-2 border-success/60">{bit}</span>
                  ))}
                  {offBin.split("").map((bit, i) => (
                    <span key={i} className="w-6 h-7 flex items-center justify-center rounded bg-warn/20 text-warn border-t-2 border-warn/60">{bit}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-6 text-[10px] font-bold">
                <div>
                  <span className="text-success">Frame {frameNumber}</span>
                  <span className="text-slate-500 ml-1">(from page table)</span>
                </div>
                <div>
                  <span className="text-warn">+{offset}</span>
                  <span className="text-slate-500 ml-1">offset</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Page table + RAM grid */}
        <div className="col-span-12 md:col-span-5 space-y-4">

          {/* Page table */}
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Page Table</p>
            <div className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar">
              {frameTable.map((fn, pn) => (
                <div key={pn}
                  className={`flex justify-between items-center px-2 py-1 rounded text-[10px] font-mono transition-all duration-300 ${
                    stageIndex >= 2 && pn === pageNumber
                      ? "bg-primary/15 border border-primary/30 scale-[1.02]"
                      : "hover:bg-white/3"
                  }`}>
                  <span className={stageIndex >= 2 && pn === pageNumber ? "text-primary font-bold" : "text-slate-500"}>
                    P{pn}
                  </span>
                  <span className={fn != null ? "text-slate-300" : "text-danger/60"}>
                    {fn != null ? `→ F${fn}` : "INVALID"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Physical memory grid */}
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">Physical Frames</p>
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: totalFrames }, (_, fi) => {
                const isTarget = stageIndex >= 4 && fi === frameNumber;
                const isUsed = frameTable.includes(fi);
                return (
                  <div key={fi}
                    className={`h-10 rounded-lg border flex items-center justify-center text-[9px] font-bold transition-all duration-500 ${
                      isTarget
                        ? "bg-success/20 border-success/50 scale-110 shadow-[0_0_12px_rgba(76,175,125,0.4)] text-success"
                        : isUsed
                        ? "bg-white/5 border-white/10 text-slate-400"
                        : "bg-transparent border-white/4 text-slate-700"
                    }`}>
                    F{fi}
                    {isTarget && <span className="ml-0.5 text-[7px]">▲</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Status bar ───────────────────────────────────────────── */}
      <div className={`p-2.5 rounded-lg text-[10px] font-bold border ${
        isPageFault && stage !== "idle"
          ? "bg-danger/10 border-danger/20 text-danger"
          : "bg-white/3 border-white/5 text-slate-500"
      }`}>
        {isPageFault && (stage as string) !== "idle"
          ? `✗ Page fault! Page ${pageNumber} is not mapped to any physical frame.`
          : STAGE_LABELS[stage]}
      </div>
    </div>
  );
}
