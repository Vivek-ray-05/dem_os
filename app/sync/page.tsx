"use client";
import { useConcurrency } from "../../store/useConcurrency";
import type { SyncTab } from "../../store/useConcurrency";
import MutexTab     from "../../components/concurrency/MutexTab";
import SemaphoreTab from "../../components/concurrency/SemaphoreTab";
import DiningTab    from "../../components/concurrency/DiningTab";
import DeadlockTab  from "../../components/concurrency/DeadlockTab";
import SectionCard  from "../../components/shared/SectionCard";

const TABS: { id: SyncTab; label: string }[] = [
  { id: "mutex",     label: "Mutex"               },
  { id: "semaphore", label: "Semaphore"            },
  { id: "dining",    label: "Dining Philosophers"  },
  { id: "deadlock",  label: "Deadlock Detector"    },
];

const DESCRIPTIONS: Record<SyncTab, string> = {
  mutex:     "One thread at a time — mutual exclusion lock with blocking queue",
  semaphore: "Counting semaphore — wait() and signal() with configurable capacity",
  dining:    "5 philosophers, 5 forks — visualise circular wait and deadlock",
  deadlock:  "Banker's algorithm — detect unsafe states and resolve deadlock cycles",
};

export default function SyncPage() {
  const { activeTab, setActiveTab } = useConcurrency();

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-br from-background to-primary/[0.03]">
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-6 bg-surface/40 backdrop-blur-sm">
        <h2 className="text-[10px] uppercase tracking-widest text-slate-500">
          Module <span className="mx-1.5 text-white/20">/</span>
          <span className="text-primary font-bold">concurrency</span>
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
            {activeTab === "mutex"     && <MutexTab />}
            {activeTab === "semaphore" && <SemaphoreTab />}
            {activeTab === "dining"    && <DiningTab />}
            {activeTab === "deadlock"  && <DeadlockTab />}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}