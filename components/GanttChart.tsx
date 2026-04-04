import React from 'react';
import { useSimulation } from '../store/useSimulation';

export default function GanttChart() {
  const { history, processes } = useSimulation();

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6 mt-6">
      <h3 className="text-xs font-bold text-slate-500 mb-4 uppercase flex justify-between">
        <span>Gantt Chart (Timeline)</span>
        <span className="text-[10px] lowercase font-normal italic">CPU Allocation per Tick</span>
      </h3>
      
      <div className="flex w-full overflow-x-auto pb-4 gap-0.5 min-h-[60px] items-end">
        {history.map((id, index) => {
          const process = processes.find(p => p.id === id);
          return (
            <div key={index} className="flex flex-col items-center group relative">
              {/* Tooltip on hover */}
              <div className="hidden group-hover:block absolute -top-8 bg-black text-[8px] px-2 py-1 rounded border border-white/10 z-10 whitespace-nowrap">
                Tick {index}: {id || 'IDLE'}
              </div>
              
              {/* The Timeline Block */}
              <div 
                className={`w-6 h-10 rounded-sm transition-all border-t-2 ${
                  id ? 'opacity-100' : 'opacity-20 bg-slate-800'
                }`}
                style={{ 
                  backgroundColor: process?.color || 'transparent',
                  borderColor: process?.color ? 'rgba(255,255,255,0.2)' : 'transparent'
                }}
              />
              <span className="text-[8px] text-slate-600 mt-1">{index}</span>
            </div>
          );
        })}
        {history.length === 0 && (
          <div className="text-slate-700 text-[10px] italic flex items-center h-10">
            Waiting for execution start...
          </div>
        )}
      </div>
    </div>
  );
}