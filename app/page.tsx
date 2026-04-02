"use client";
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Cpu, Database, Share2, Disc, 
  Settings, Play, Pause, RotateCcw 
} from 'lucide-react';
import { useSimulation } from '../store/useSimulation';
import ProcessCreator from '../components/ProcessCreator';

export default function OSVisualizer() {
  const [activeTab, setActiveTab] = useState('cpu');
  const { isPlaying, togglePlay, tick, speed, resetSimulation, processes } = useSimulation();

  // THE KERNEL HEARTBEAT
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        useSimulation.getState().advanceTick();
      }, 1000 / speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const menuItems = [
    { id: 'cpu', icon: <Cpu size={18} />, label: 'CPU Scheduling' },
    { id: 'memory', icon: <Database size={18} />, label: 'Memory Management' },
    { id: 'sync', icon: <Share2 size={18} />, label: 'Concurrency' },
    { id: 'disk', icon: <Disc size={18} />, label: 'Disk Scheduling' },
  ];

  return (
    <div className="flex h-screen bg-background text-white font-mono selection:bg-primary/30">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/5 bg-surface flex flex-col">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-primary font-bold text-xl">OS-PRO v2.0</h1>
          <p className="text-[10px] text-slate-500 uppercase mt-1">Silberschatz Edition</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-transparent to-primary/5">
        
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-surface/30 backdrop-blur-md">
          <h2 className="text-[11px] uppercase tracking-widest text-slate-500">
            Module <span className="mx-2 text-white/20">/</span> <span className="text-primary font-bold">{activeTab}</span>
          </h2>
          
          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
            <button onClick={resetSimulation} className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><RotateCcw size={16} /></button>
            <button onClick={togglePlay} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${isPlaying ? 'bg-red-500/20 text-red-500' : 'bg-primary text-background'}`}>
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              {isPlaying ? 'STOP' : 'RUN'}
            </button>
          </div>
        </header>

        <section className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-12 gap-6 h-full">
            
            {/* THE INTERACTIVE STAGE */}
            <div className="col-span-12 lg:col-span-8 bg-surface border border-white/5 rounded-2xl p-6 relative">
               <h3 className="text-xs font-bold text-slate-500 mb-6 flex items-center gap-2 uppercase">
                 <LayoutDashboard size={14} /> Execution Stage (Tick: {tick})
               </h3>
               
               {/* This is the part that was missing or hidden in your screenshot */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ProcessCreator />

                  <div className="bg-black/20 border border-white/5 rounded-xl p-4 min-h-[300px]">
                    <h4 className="text-[10px] uppercase text-slate-500 font-bold mb-4">Ready Queue</h4>
                    <div className="space-y-2">
                      {processes.map((p) => (
                        <div key={p.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border-l-4" style={{ borderColor: p.color }}>
                          <span className="text-sm font-bold">{p.id}</span>
                          <span className="text-[10px] text-slate-400 text-right">Burst: {p.burstTime} | Arr: {p.arrivalTime}</span>
                        </div>
                      ))}
                      {processes.length === 0 && <p className="text-slate-600 text-xs italic">Queue is empty...</p>}
                    </div>
                  </div>
               </div>
            </div>

            {/* SIDE METRICS & LOGS */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-surface border border-white/5 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase">System Performance</h3>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] text-slate-500">CPU LOAD</span>
                  <span className="text-primary text-xl font-bold">{isPlaying ? '98%' : '0%'}</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-1000" style={{ width: isPlaying ? '98%' : '0%' }} />
                </div>
              </div>

              <div className="bg-surface border border-white/5 rounded-2xl p-6 font-mono text-[10px] text-slate-400 h-64 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase">Kernel Logs</h3>
                <p><span className="text-success">[OK]</span> OS Heartbeat active</p>
                <p><span className="text-primary">[INFO]</span> Running {activeTab} module</p>
                {processes.map(p => (
                  <p key={`log-${p.id}`} className="text-white/40">New Process Added: {p.id}</p>
                ))}
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
