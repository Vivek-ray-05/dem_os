"use client";
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Cpu, Database, Share2, Disc, 
  Play, Pause, RotateCcw, Activity, Settings2
} from 'lucide-react';
import { useSimulation } from '../store/useSimulation';
import ProcessCreator from '../components/ProcessCreator';
import GanttChart from '../components/GanttChart';
import StatsCard from '../components/StatsCard';

export default function OSVisualizer() {
  const [activeTab, setActiveTab] = useState('cpu');
  const [hasMounted, setHasMounted] = useState(false);
  
  // Destructuring algorithm and setAlgorithm to ensure reactivity
  const { 
    isPlaying, 
    togglePlay, 
    tick, 
    speed, 
    resetSimulation, 
    processes, 
    algorithm, 
    setAlgorithm 
  } = useSimulation();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        useSimulation.getState().advanceTick();
      }, 1000 / speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, hasMounted]);

  const menuItems = [
    { id: 'cpu', icon: <Cpu size={18} />, label: 'CPU Scheduling' },
    { id: 'memory', icon: <Database size={18} />, label: 'Memory Management' },
    { id: 'sync', icon: <Share2 size={18} />, label: 'Concurrency' },
    { id: 'disk', icon: <Disc size={18} />, label: 'Disk Scheduling' },
  ];

  if (!hasMounted) return null;

  return (
    <div className="flex h-screen bg-background text-white font-mono selection:bg-primary/30">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/5 bg-surface flex flex-col">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-primary font-bold text-xl tracking-tighter">OS-PRO v2.0</h1>
          <p className="text-[10px] text-slate-500 uppercase mt-1">Silberschatz Edition</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col bg-gradient-to-br from-transparent to-primary/5 overflow-hidden">
        
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-surface/30 backdrop-blur-md z-10">
          <h2 className="text-[11px] uppercase tracking-widest text-slate-500">
            Module <span className="mx-2 text-white/20">/</span> <span className="text-primary font-bold">{activeTab}</span>
          </h2>
          
          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5 shadow-2xl">
            <button 
                onClick={resetSimulation} 
                className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                title="Reset Kernel"
            >
              <RotateCcw size={16} />
            </button>
            <button 
              onClick={togglePlay} 
              className={`flex items-center gap-2 px-6 py-1.5 rounded-lg font-bold text-xs transition-all ${
                isPlaying ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-primary text-background'
              }`}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              {isPlaying ? 'STOP KERNEL' : 'RUN KERNEL'}
            </button>
          </div>
        </header>

        <section className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-12 gap-6 max-w-7xl mx-auto">
            
            {/* THE INTERACTIVE STAGE */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="bg-surface border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity size={100} />
                  </div>
                  
                  {/* ALGORITHM SELECTOR FIX */}
                  <div className="flex justify-between items-center mb-6 relative z-20">
                    <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-tighter">
                      <LayoutDashboard size={14} /> Execution Stage (Tick: {tick})
                    </h3>
                    
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                      <Settings2 size={12} className="mx-2 text-slate-500" />
                      {(['FCFS', 'SJF'] as const).map((algo) => (
                        <button
                          key={algo}
                          onClick={() => setAlgorithm(algo)}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                            algorithm === algo 
                              ? 'bg-primary text-background shadow-[0_0_10px_rgba(0,180,216,0.5)]' 
                              : 'text-slate-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {algo}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <ProcessCreator />

                      <div className="bg-black/20 border border-white/5 rounded-xl p-4 min-h-[300px]">
                        <h4 className="text-[10px] uppercase text-slate-500 font-bold mb-4 flex justify-between">
                            Ready Queue 
                            <span className="text-primary">{processes.filter(p => p.status !== 'completed').length} Active</span>
                        </h4>
                        <div className="space-y-2">
                          {processes.map((p) => (
                            <div 
                              key={p.id} 
                              className={`flex justify-between items-center p-3 rounded-lg border-l-4 transition-all duration-500 ${
                                p.status === 'running' 
                                  ? 'bg-primary/20 scale-[1.02] border-primary shadow-[0_0_20px_rgba(0,180,216,0.15)]' 
                                  : p.status === 'completed' 
                                  ? 'opacity-30 grayscale bg-white/5 border-white/5' 
                                  : 'bg-white/5 border-white/10'
                              }`}
                              style={{ borderColor: p.status === 'running' ? undefined : p.color }}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-bold flex items-center gap-2">
                                  {p.id}
                                  {p.status === 'running' && (
                                    <span className="flex h-2 w-2 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                  )}
                                </span>
                                <span className="text-[9px] uppercase font-bold text-slate-500">
                                  {p.status}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`block text-xs font-mono font-bold ${p.status === 'running' ? 'text-primary animate-pulse' : 'text-slate-400'}`}>
                                  {p.remainingTime}s
                                </span>
                                <span className="block text-[8px] text-slate-600 uppercase font-bold">Remaining</span>
                              </div>
                            </div>
                          ))}
                          {processes.length === 0 && (
                            <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-lg">
                                <p className="text-slate-600 text-xs italic">Waiting for processes...</p>
                            </div>
                          )}
                        </div>
                      </div>
                  </div>

                  <GanttChart />
                </div>
            </div>

            {/* ANALYTICS & LOGS */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-surface border border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase">System Performance</h3>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] text-slate-500">CPU UTILIZATION</span>
                  <span className="text-primary text-xl font-bold">{isPlaying ? '98.2%' : '0.0%'}</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-700 ease-in-out shadow-[0_0_10px_#00b4d8]" 
                    style={{ width: isPlaying ? '98%' : '0%' }} 
                  />
                </div>
              </div>

              <StatsCard /> 

              <div className="bg-surface border border-white/5 rounded-2xl p-6 font-mono text-[10px] text-slate-400 h-[320px] flex flex-col shadow-xl">
                <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase border-b border-white/5 pb-2">Kernel Logs</h3>
                <div className="space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
                  <p className="text-green-500/80"><span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> [OK] Kernel v2.0 active</p>
                  <p className="text-primary/80"><span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> [INFO] Mode: {activeTab} ({algorithm})</p>
                  
                  {processes.map((p, i) => (
                    <React.Fragment key={`log-group-${p.id}-${i}`}>
                        {tick >= p.arrivalTime && (
                            <p className="text-white/30 truncate">
                                <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> [NEW] Process {p.id} arrived at {p.arrivalTime}s
                            </p>
                        )}
                        {p.status === 'completed' && (
                            <p className="text-green-400 font-bold">
                                <span className="opacity-50 text-white/30">[{new Date().toLocaleTimeString()}]</span> [DONE] {p.id} terminated at {p.finishTime}s
                            </p>
                        )}
                    </React.Fragment>
                  ))}
                  <div className="pt-2 animate-pulse text-primary">_</div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
