"use client";
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Database, 
  Share2, 
  Disc, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw 
} from 'lucide-react';
import { useSimulation } from '../store/useSimulation';

export default function OSVisualizer() {
  const [activeTab, setActiveTab] = useState('cpu');
  
  // Connect to the Simulation Store
  const { isPlaying, togglePlay, tick, speed, resetSimulation } = useSimulation();

  // --- THE KERNEL HEARTBEAT ---
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
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 border-r border-white/5 bg-surface flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <h1 className="text-primary font-bold tracking-tighter text-xl">OS-PRO v2.0</h1>
          </div>
          <p className="text-[10px] text-slate-500 uppercase mt-1 tracking-widest">Silberschatz Edition</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-white transition-colors w-full text-left">
            <Settings size={16} />
            <span className="text-xs">System Settings</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-transparent to-primary/5">
        
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-surface/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              Module <span className="mx-2 text-white/20">/</span> 
              <span className="text-primary font-bold">{activeTab}</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
            <button 
              onClick={resetSimulation}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
            >
              <RotateCcw size={16} />
            </button>
            
            {/* The Simulation Control Button */}
            <button 
              onClick={togglePlay}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${
                isPlaying 
                ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30' 
                : 'bg-primary text-background hover:bg-blue-400'
              }`}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              {isPlaying ? 'STOP SIMULATION' : 'RUN SIMULATION'}
            </button>
          </div>
        </header>

        <section className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-12 grid-rows-6 gap-6 h-full min-h-[600px]">
            
            {/* Primary Visualizer Card */}
            <div className="col-span-12 lg:col-span-8 row-span-4 bg-surface border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
               <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-2">
                 <LayoutDashboard size={14} />
                 INTERACTIVE STAGE
               </h3>
               
               <div className="flex flex-col items-center justify-center h-full border border-dashed border-white/10 rounded-xl">
                  <div className="text-center">
                    <p className="text-primary text-4xl font-bold mb-2">{tick}</p>
                    <p className="text-slate-600 text-sm italic uppercase tracking-widest">Global Clock Tick</p>
                  </div>
               </div>
            </div>

            {/* Metrics Card */}
            <div className="col-span-12 lg:col-span-4 row-span-2 bg-surface border border-white/5 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-slate-500 mb-4">SYSTEM PERFORMANCE</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-slate-500 uppercase">CPU Utilization</span>
                  <span className="text-primary text-xl font-bold">{isPlaying ? '98%' : '0%'}</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-1000" 
                    style={{ width: isPlaying ? '98%' : '0%' }}
                  />
                </div>
              </div>
            </div>

            {/* Event Log Card */}
            <div className="col-span-12 lg:col-span-4 row-span-2 bg-surface border border-white/5 rounded-2xl p-6 font-mono">
              <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase">Kernel Logs</h3>
              <div className="text-[10px] space-y-1 text-slate-400">
                <p><span className="text-success">[OK]</span> Kernel v2.0 active</p>
                <p><span className="text-primary">[INFO]</span> Module: {activeTab}</p>
                <p><span className="text-white/40">[TICK]</span> Current timestamp: {tick}</p>
                {isPlaying && <p className="text-primary animate-pulse">{">"} Simulation running...</p>}
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
