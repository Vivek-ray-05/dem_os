"use client";
export default function SyncPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center px-6 bg-surface/40">
        <h2 className="text-[10px] uppercase tracking-widest text-slate-500">
          Module <span className="mx-1.5 text-white/20">/</span>
          <span className="text-primary font-bold">concurrency</span>
        </h2>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 opacity-40">
          <div className="w-12 h-12 mx-auto grid grid-cols-2 gap-1">
            <div className="rounded-sm bg-primary/30" />
            <div className="rounded-sm bg-primary/20" />
            <div className="rounded-sm bg-primary/20" />
            <div className="rounded-sm bg-primary/30" />
          </div>
          <p className="text-sm font-bold text-white">Concurrency & Sync</p>
          <p className="text-xs text-slate-500">Semaphores · Deadlock · Race conditions — coming soon</p>
        </div>
      </div>
    </div>
  );
}
