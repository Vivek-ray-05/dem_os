"use client";
import { useDisk } from "../../store/useDisk";
import type { DiskTab } from "../../store/useDisk";
import DiskVisualiser from "../../components/disk/DiskVisualiser";
import DiskComparison from "../../components/disk/DiskComparison";
import SectionCard    from "../../components/shared/SectionCard";

const TABS: { id: DiskTab; label: string }[] = [
  { id: "visualiser", label: "Seek Visualiser"      },
  { id: "comparison", label: "Algorithm Comparison" },
];

const DESCRIPTIONS: Record<DiskTab, string> = {
  visualiser: "Step through disk head movement — FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK",
  comparison: "Run all 6 algorithms on the same queue and compare total seek distance",
};

export default function DiskPage() {
  const { activeTab, setActiveTab } = useDisk();
  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-br from-background to-primary/[0.03]">
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-6 bg-surface/40 backdrop-blur-sm">
        <h2 className="text-[10px] uppercase tracking-widest text-slate-500">
          Module <span className="mx-1.5 text-white/20">/</span>
          <span className="text-primary font-bold">disk scheduling</span>
        </h2>
        <p className="text-[9px] text-slate-600 hidden md:block italic">{DESCRIPTIONS[activeTab]}</p>
      </header>
      <div className="shrink-0 border-b border-white/5 bg-surface/20 px-6">
        <div className="flex -mb-px">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:border-white/20"
              }`}>{label}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 max-w-7xl mx-auto">
          <SectionCard glow>
            {activeTab === "visualiser" && <DiskVisualiser />}
            {activeTab === "comparison" && <DiskComparison />}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}