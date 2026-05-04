"use client";
export default function DiskPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="h-14 shrink-0 border-b border-white/5 flex items-center px-6 bg-surface/40">
        <h2 className="text-[10px] uppercase tracking-widest text-slate-500">
          Module <span className="mx-1.5 text-white/20">/</span>
          <span className="text-primary font-bold">disk</span>
        </h2>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 opacity-40">
          <div className="w-12 h-12 rounded-full border-2 border-primary/40 mx-auto flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary/40" />
          </div>
          <p className="text-sm font-bold text-white">Disk Scheduling</p>
          <p className="text-xs text-slate-500">SCAN · C-SCAN · LOOK — coming soon</p>
        </div>
      </div>
    </div>
  );
}
