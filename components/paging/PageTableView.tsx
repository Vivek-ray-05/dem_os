"use client";
import { RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { usePaging } from "../../store/usePaging";

const PROT_LABELS = ["R", "W", "X"] as const;

export default function PageTableView() {
  const { pageTableEntries, selectedPage, togglePageValid, selectPage, resetPageTable } = usePaging();

  const selected = selectedPage != null ? pageTableEntries[selectedPage] : null;
  const validCount   = pageTableEntries.filter((e) => e.valid).length;
  const invalidCount = pageTableEntries.length - validCount;

  // Build physical memory usage (which frames are occupied)
  const usedFrames = new Set(
    pageTableEntries.filter((e) => e.valid && e.frameNumber != null).map((e) => e.frameNumber!)
  );
  const totalFrames = 16;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header controls ───────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-4 text-[10px]">
          <span><span className="text-success font-bold">{validCount}</span> <span className="text-slate-500">valid pages</span></span>
          <span><span className="text-danger font-bold">{invalidCount}</span> <span className="text-slate-500">invalid pages</span></span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <p className="text-[9px] text-slate-600 italic">Click any row to inspect · Toggle valid bit</p>
          <button onClick={resetPageTable}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* ── Page Table ────────────────────────────────────── */}
        <div className="col-span-12 md:col-span-6">
          <h4 className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2">
            Page Table (Process A)
          </h4>

          {/* Column headers */}
          <div className="grid grid-cols-6 text-[8px] text-slate-600 uppercase font-bold px-2 mb-1">
            <span>Page</span>
            <span className="text-center">Valid</span>
            <span className="text-center">Frame</span>
            <span className="text-center">R</span>
            <span className="text-center">W</span>
            <span className="text-center">X</span>
          </div>

          <div className="space-y-0.5 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {pageTableEntries.map((entry, i) => (
              <div key={i}
                onClick={() => selectPage(selectedPage === i ? null : i)}
                className={`grid grid-cols-6 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200 text-[10px] font-mono border ${
                  selectedPage === i
                    ? "bg-primary/10 border-primary/30"
                    : entry.valid
                    ? "hover:bg-white/5 border-transparent"
                    : "opacity-50 hover:opacity-70 border-transparent"
                }`}>
                <span className={selectedPage === i ? "text-primary font-bold" : "text-slate-400"}>P{i}</span>
                <span className="text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePageValid(i); }}
                    className="transition-colors hover:scale-110">
                    {entry.valid
                      ? <CheckCircle size={11} className="text-success mx-auto" />
                      : <XCircle    size={11} className="text-danger/60 mx-auto" />}
                  </button>
                </span>
                <span className={`text-center ${entry.valid ? "text-slate-300" : "text-slate-700"}`}>
                  {entry.valid && entry.frameNumber != null ? `F${entry.frameNumber}` : "—"}
                </span>
                {[entry.r, entry.w, entry.x].map((perm, pi) => (
                  <span key={pi} className={`text-center font-bold ${perm ? "text-slate-400" : "text-slate-700"}`}>
                    {perm ? PROT_LABELS[pi] : "·"}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column ───────────────────────────────────── */}
        <div className="col-span-12 md:col-span-6 space-y-4">

          {/* Selected page detail */}
          {selected != null && selectedPage != null ? (
            <div className={`p-4 rounded-xl border space-y-3 transition-all duration-300 ${
              selected.valid
                ? "bg-primary/5 border-primary/20"
                : "bg-danger/5 border-danger/20"
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-black text-white">Page {selectedPage}</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${selected.valid ? "text-success" : "text-danger"}`}>
                    {selected.valid ? "In memory" : "PAGE FAULT if accessed"}
                  </p>
                </div>
                <button onClick={() => togglePageValid(selectedPage)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                    selected.valid
                      ? "border-danger/30 text-danger hover:bg-danger/10"
                      : "border-success/30 text-success hover:bg-success/10"
                  }`}>
                  {selected.valid ? "Mark Invalid" : "Mark Valid"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-black/30 p-2 rounded-lg">
                  <p className="text-slate-500 text-[8px] uppercase">Physical Frame</p>
                  <p className="font-bold text-white">{selected.frameNumber != null ? `Frame ${selected.frameNumber}` : "None"}</p>
                </div>
                <div className="bg-black/30 p-2 rounded-lg">
                  <p className="text-slate-500 text-[8px] uppercase">Dirty Bit</p>
                  <p className={`font-bold ${selected.dirty ? "text-warn" : "text-slate-500"}`}>
                    {selected.dirty ? "Modified" : "Clean"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {(["r","w","x"] as const).map((k) => (
                  <div key={k} className={`flex-1 p-2 rounded-lg border text-center text-[9px] font-black ${
                    selected[k] ? "bg-success/10 border-success/20 text-success" : "bg-white/3 border-white/5 text-slate-700"
                  }`}>
                    {k.toUpperCase()}
                    <div className="text-[7px] font-normal opacity-70">{k === "r" ? "read" : k === "w" ? "write" : "exec"}</div>
                  </div>
                ))}
              </div>

              {!selected.valid && (
                <div className="p-2 bg-danger/10 border border-danger/20 rounded-lg text-[9px] text-danger/80">
                  Accessing page {selectedPage} would trigger a page fault → OS must load this page from disk
                </div>
              )}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center border border-dashed border-white/8 rounded-xl">
              <p className="text-[10px] text-slate-600 italic">Select a page row to inspect</p>
            </div>
          )}

          {/* Physical memory map */}
          <div>
            <h4 className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-2">
              Physical Memory ({totalFrames} frames)
            </h4>
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: totalFrames }, (_, fi) => {
                const isUsed = usedFrames.has(fi);
                const isSelected = selected?.valid && selected?.frameNumber === fi;
                const pageThere = pageTableEntries.findIndex((e) => e.valid && e.frameNumber === fi);
                return (
                  <div key={fi}
                    className={`h-10 rounded-lg border flex flex-col items-center justify-center transition-all duration-300 ${
                      isSelected
                        ? "bg-primary/20 border-primary/50 scale-110 shadow-[0_0_10px_rgba(0,180,216,0.3)]"
                        : isUsed
                        ? "bg-white/5 border-white/10"
                        : "bg-transparent border-dashed border-white/5"
                    }`}>
                    <span className={`text-[8px] font-bold ${isSelected ? "text-primary" : isUsed ? "text-slate-400" : "text-slate-700"}`}>
                      F{fi}
                    </span>
                    {isUsed && (
                      <span className={`text-[7px] ${isSelected ? "text-primary/70" : "text-slate-600"}`}>
                        P{pageThere}
                      </span>
                    )}
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
