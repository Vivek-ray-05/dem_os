"use client";
import { useEffect, useRef } from "react";
import { useSimulation } from "../../store/useSimulation";

const KIND_STYLE: Record<string, string> = {
  ok:   "text-success/80",
  info: "text-primary/80",
  new:  "text-white/40",
  done: "text-success font-bold",
  warn: "text-warn/80",
};

const KIND_TAG: Record<string, string> = {
  ok: "OK", info: "INFO", new: "NEW", done: "DONE", warn: "WARN",
};

export default function KernelLogs() {
  const { logs } = useSimulation();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className="bg-surface border border-white/5 rounded-xl p-4 flex flex-col h-[280px]">
      <h3 className="text-[10px] uppercase font-bold text-slate-500 mb-3 border-b border-white/5 pb-2 shrink-0">
        Kernel Logs
      </h3>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 font-mono text-[10px] pr-1">
        {logs.map((entry, i) => (
          <p key={i} className={`truncate ${KIND_STYLE[entry.kind] ?? "text-white/30"}`}>
            <span className="text-white/20 mr-1.5">[t{String(entry.time).padStart(3, "0")}]</span>
            <span className="text-white/30 mr-1.5">[{KIND_TAG[entry.kind]}]</span>
            {entry.text}
          </p>
        ))}
        <div ref={bottomRef} className="animate-pulse text-primary">_</div>
      </div>
    </div>
  );
}
