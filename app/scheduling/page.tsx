"use client";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { useSimulation } from "../../store/useSimulation";
import ControlBar         from "../../components/scheduling/ControlBar";
import AlgorithmSelector  from "../../components/scheduling/AlgorithmSelector";
import ProcessCreator     from "../../components/scheduling/ProcessCreator";
import ProcessList        from "../../components/scheduling/ProcessList";
import GanttChart         from "../../components/scheduling/GanttChart";
import StatsCard          from "../../components/scheduling/StatsCard";
import KernelLogs         from "../../components/scheduling/KernelLogs";
import ReadyQueueStrip    from "../../components/scheduling/ReadyQueueStrip";
import SectionCard        from "../../components/shared/SectionCard";

export default function SchedulingPage() {
  const [mounted, setMounted] = useState(false);
  const { isPlaying, speed } = useSimulation();

  useEffect(() => { setMounted(true); }, []);

  // Simulation ticker — lives here, not in the store
  useEffect(() => {
    if (!mounted || !isPlaying) return;
    const id = setInterval(() => {
      useSimulation.getState().advanceTick();
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [isPlaying, speed, mounted]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-br from-background to-primary/[0.03]">
      <ControlBar module="scheduling" />

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-12 gap-5 p-6 max-w-7xl mx-auto">

          {/* ── LEFT — execution stage ── */}
          <div className="col-span-12 lg:col-span-8 space-y-5">
            <SectionCard glow>
              {/* Decorative background icon */}
              <div className="absolute top-3 right-4 opacity-[0.04] pointer-events-none">
                <Activity size={90} />
              </div>

              {/* Header row */}
              <div className="flex justify-between items-center mb-5 relative z-10">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Execution Stage
                </h3>
                <AlgorithmSelector />
              </div>

              <ReadyQueueStrip />

              {/* Two-column: creator + process list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <ProcessCreator />
                <ProcessList />
              </div>

              <GanttChart />
            </SectionCard>
          </div>

          {/* ── RIGHT — analytics panel ── */}
          <div className="col-span-12 lg:col-span-4 space-y-5">
            <StatsCard />
            <KernelLogs />
          </div>

        </div>
      </div>
    </div>
  );
}
