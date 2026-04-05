"use client";
import React, { useState } from 'react';
import { Plus, Hash, Timer, Activity } from 'lucide-react';
import { useSimulation } from '../store/useSimulation';

export default function ProcessCreator() {
  const { addProcess, processes, algorithm, quantum, setQuantum } = useSimulation();
  
  const [burst, setBurst] = useState<number | "">("");
  const [arrival, setArrival] = useState<number | "">("");
  const [priority, setPriority] = useState<number>(1); 

  const handleAdd = () => {
    if (burst === "" || arrival === "") return;

    const newProcess = {
      id: `P${processes.length + 1}`,
      arrivalTime: Number(arrival),
      burstTime: Number(burst),
      remainingTime: Number(burst),
      priority: priority,
      status: 'idle' as const,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };
    
    addProcess(newProcess);
    setBurst("");
    setArrival("");
    setPriority(1); 
  };

  const isDisabled = burst === "" || arrival === "";

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4 shadow-xl">
      <h4 className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-2">
        <Plus size={12} /> New Process Configuration
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-white/40 uppercase font-bold flex items-center gap-1">
            <Timer size={10} /> Arrival Time
          </label>
          <input 
            type="number" 
            placeholder="e.g. 0" 
            value={arrival}
            onChange={(e) => setArrival(e.target.value === "" ? "" : Number(e.target.value))}
            className="bg-black/40 border border-white/10 rounded p-2 text-xs focus:border-primary outline-none transition-colors placeholder:text-white/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-white/40 uppercase font-bold flex items-center gap-1">
            <Activity size={10} /> Burst Time
          </label>
          <input 
            type="number" 
            placeholder="e.g. 5" 
            value={burst}
            onChange={(e) => setBurst(e.target.value === "" ? "" : Number(e.target.value))}
            className="bg-black/40 border border-white/10 rounded p-2 text-xs focus:border-primary outline-none transition-colors placeholder:text-white/20"
          />
        </div>
      </div>

      {algorithm === 'Priority' && (
        <div className="flex flex-col gap-1 p-3 bg-white/5 rounded border border-white/10">
          <label className="text-[9px] text-white/40 uppercase font-bold flex items-center gap-1">
            <Hash size={10} /> Priority Level
          </label>
          <input 
            type="number" 
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="bg-black/40 border border-white/10 rounded p-2 text-xs focus:border-primary outline-none transition-colors"
          />
        </div>
      )}

      {algorithm === 'RR' && (
        <div className="p-3 bg-primary/10 rounded border border-primary/20">
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
        </div>
      )}

      {/* MATCHING THE "RUN KERNEL" STYLE */}
      <button 
        onClick={handleAdd} 
        disabled={isDisabled}
        style={{
          backgroundColor: isDisabled ? 'rgba(255, 255, 255, 0.05)' : '#00b4d8',
          color: isDisabled ? 'rgba(255, 255, 255, 0.1)' : '#000000',
        }}
        className={`w-full py-2 rounded font-bold text-[10px] transition-all flex items-center justify-center gap-2 ${
          !isDisabled ? 'hover:brightness-110 shadow-[0_0_15px_rgba(0,180,216,0.3)] active:scale-95' : 'cursor-not-allowed'
        }`}
      >
        <Plus size={14} fill="currentColor" />
        ADD TO KERNEL QUEUE
      </button>
    </div>
  );
}