import React from 'react';
import { useSimulation } from '../store/useSimulation';

export default function StatsCard() {
  const { processes } = useSimulation();
  
  const completed = processes.filter(p => p.status === 'completed');
  
  const stats = completed.map(p => {
    // TAT = Finish Time - Arrival Time
    const turnaround = (p.finishTime || 0) - p.arrivalTime;
    // WT = Turnaround Time - Burst Time
    const waiting = turnaround - p.burstTime;
    return { turnaround, waiting };
  });

  const avgWaiting = stats.length > 0 
    ? (stats.reduce((acc, curr) => acc + curr.waiting, 0) / stats.length).toFixed(2) 
    : "0.00";

  const avgTurnaround = stats.length > 0 
    ? (stats.reduce((acc, curr) => acc + curr.turnaround, 0) / stats.length).toFixed(2) 
    : "0.00";

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-xl mt-6">
      <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase">Scheduler Analytics</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
          <p className="text-[10px] text-slate-500 uppercase">Avg. Waiting ($W_t$)</p>
          <p className="text-xl font-bold text-primary">{avgWaiting}s</p>
        </div>
        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
          <p className="text-[10px] text-slate-500 uppercase">Avg. Turnaround ($TAT$)</p>
          <p className="text-xl font-bold text-green-400">{avgTurnaround}s</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
        <p className="text-[10px] text-slate-500 uppercase">Throughput</p>
        <p className="text-sm font-bold text-white">{completed.length} Jobs Completed</p>
      </div>
    </div>
  );
}