"use client";
import { usePaging } from "../../store/usePaging";
import type { PagingTab } from "../../store/usePaging";
import PageReplacement    from "../../components/paging/PageReplacement";
import AddressTranslation from "../../components/paging/AddressTranslation";
import TLBSimulation      from "../../components/paging/TLBSimulation";
import PageTableView      from "../../components/paging/PageTableView";
import SectionCard        from "../../components/shared/SectionCard";

const TABS: { id: PagingTab; label: string }[] = [
  { id: "replacement", label: "Page Replacement"    },
  { id: "translation", label: "Address Translation" },
  { id: "tlb",         label: "TLB Simulation"      },
  { id: "pagetable",   label: "Page Table"          },
];

const DESCRIPTIONS: Record<PagingTab, string> = {
  replacement: "Simulate FIFO · LRU · Optimal · Clock — see which pages get evicted and why",
  translation: "Step through virtual → physical address translation bit by bit",
  tlb:         "Watch the TLB fill up, track hit/miss rates and effective access time",
  pagetable:   "Explore the full page table — valid bits, protection flags, frame mapping",
};

export default function PagingPage() {
  const { activeTab, setActiveTab } = usePaging();

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-br from-background to-primary/[0.03]">

      <header className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-6 bg-surface/40 backdrop-blur-sm">
        <h2 className="text-[10px] uppercase tracking-widest text-slate-500">
          Module <span className="mx-1.5 text-white/20">/</span>
          <span className="text-primary font-bold">memory / paging</span>
        </h2>
        <p className="text-[9px] text-slate-600 hidden md:block italic">
          {DESCRIPTIONS[activeTab]}
        </p>
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
            {activeTab === "replacement" && <PageReplacement />}
            {activeTab === "translation" && <AddressTranslation />}
            {activeTab === "tlb"         && <TLBSimulation />}
            {activeTab === "pagetable"   && <PageTableView />}
          </SectionCard>
        </div>
      </div>

    </div>
  );
}
