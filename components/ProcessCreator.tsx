"use client";
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSimulation } from '../store/useSimulation';

export default function ProcessCreator() {
  const { addProcess, processes } = useSimulation();
  const [burst, setBurst] = useState(5);
  const [arrival, setArrival] = useState(0);

  const handleAdd = () => {
    const newProcess = {
      id: `P${processes.length + 1}`,
      arrivalTime: arrival,
      burstTime: burst,
      remainingTime: burst,
      status: 'idle' as const,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random color for visuals
    };
    addProcess(newProcess);
  };

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
      <h4 className="text-[10px] uppercase tracking-widest text-primary font-bold">New Process</h4>
      <div className="grid grid-cols-2 gap-4">
        <input 
          type="number" placeholder="Arrival" 
          onChange={(e) => setArrival(Number(e.target.value))}
          className="bg-black/40 border border-white/10 rounded p-2 text-xs"
        />
        <input 
          type="number" placeholder="Burst" 
          onChange={(e) => setBurst(Number(e.target.value))}
          className="bg-black/40 border border-white/10 rounded p-2 text-xs"
        />
      </div>
      <button onClick={handleAdd} className="w-full py-2 bg-primary text-black rounded font-bold text-[10px] hover:bg-blue-400 transition-all">
        ADD TO QUEUE
      </button>
    </div>
  );
}