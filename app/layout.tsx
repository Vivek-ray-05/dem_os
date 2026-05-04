import type { Metadata } from "next";
import NavLink from "../components/shared/NavLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "OS-PRO — OS Concepts Simulator",
  description: "Interactive simulator for CPU scheduling, paging, disk scheduling and concurrency",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex h-screen overflow-hidden bg-background text-white font-mono">

        {/* ── SIDEBAR ── */}
        <aside className="w-60 shrink-0 flex flex-col border-r border-white/5 bg-surface">
          <div className="p-5 border-b border-white/5">
            <p className="text-primary font-bold text-lg tracking-tighter">OS-PRO v2.0</p>
            <p className="text-[10px] text-slate-500 uppercase mt-0.5 tracking-widest">Silberschatz Edition</p>
          </div>

          <nav className="flex-1 p-3 space-y-0.5">
            <NavLink href="/scheduling" iconName="cpu"      label="CPU Scheduling" />
            <NavLink href="/paging"     iconName="database" label="Memory / Paging" />
            <NavLink href="/disk"       iconName="disc"     label="Disk Scheduling" />
            <NavLink href="/sync"       iconName="share"    label="Concurrency" />
          </nav>

          <div className="p-4 border-t border-white/5">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest">v2.0.0 — Next.js 16</p>
          </div>
        </aside>

        {/* ── MODULE CONTENT ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>

      </body>
    </html>
  );
}
