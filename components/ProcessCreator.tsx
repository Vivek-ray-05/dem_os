"use client";
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSimulation } from '../store/useSimulation';

export default function ProcessCreator() {
  // 1. Added algorithm, quantum, and setQuantum to the destructuring
  const { addProcess, processes, algorithm, quantum, setQuantum } = useSimulation();
  const [burst, setBurst] = useState(5);
  const [arrival, setArrival] = useState(0);

  const handleAdd = () => {
    const newProcess = {
      id: `P${processes.length + 1}`,
      arrivalTime: arrival,
      burstTime: burst,
      remainingTime: burst,
      status: 'idle' as const,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };
    addProcess(newProcess);
  };

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
      <h4 className="text-[10px] uppercase tracking-widest text-primary font-bold">New Process</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-white/40 uppercase">Arrival Time</label>
          <input 
            type="number" 
            placeholder="Arrival" 
            value={arrival}
            onChange={(e) => setArrival(Number(e.target.value))}
            className="bg-black/40 border border-white/10 rounded p-2 text-xs focus:border-primary outline-none transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-white/40 uppercase">Burst Time</label>
          <input 
            type="number" 
            placeholder="Burst" 
            value={burst}
            onChange={(e) => setBurst(Number(e.target.value))}
            className="bg-black/40 border border-white/10 rounded p-2 text-xs focus:border-primary outline-none transition-colors"
          />
        </div>
      </div>

      {/* 2. Added the Conditional Quantum Input for Round Robin */}
      {algorithm === 'RR' && (
        <div className="p-3 bg-primary/10 rounded border border-primary/20 animate-in fade-in slide-in-from-top-2">
          <label className="text-[9px] uppercase tracking-widest text-primary font-bold block mb-2">
            Time Quantum (q)
          </label>
          <input
            type="number"
            min="1"
            value={quantum}
            onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-black/60 border border-white/10 rounded p-2 text-xs text-primary focus:border-primary outline-none"
          />
          <p className="text-[8px] text-white/30 mt-1 italic">
            Process is preempted after {quantum} ticks
          </p>
        </div>
      )}

      <button 
        onClick={handleAdd} 
        className="w-full py-2 bg-primary text-black rounded font-bold text-[10px] hover:bg-blue-400 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Plus size={14} />
        ADD TO QUEUE
      </button>
    </div>
  );
}