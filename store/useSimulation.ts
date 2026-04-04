import { create } from 'zustand';
import { Process } from '../.next/types/os'; 

interface SimulationState {
  // --- CLOCK STATE ---
  isPlaying: boolean;
  tick: number;
  speed: number;
  activeModule: string;
  
  // --- PROCESS STATE ---
  processes: Process[]; 
  history: (string | null)[]; 
  
  // --- ACTIONS ---
  togglePlay: () => void;
  advanceTick: () => void;
  setSpeed: (newSpeed: number) => void;
  setActiveModule: (module: string) => void;
  addProcess: (p: Process) => void; 
  resetSimulation: () => void;
}

export const useSimulation = create<SimulationState>((set) => ({
  // Initial Values
  isPlaying: false,
  tick: 0,
  speed: 1,
  activeModule: 'cpu',
  processes: [],
  history: [],

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setSpeed: (newSpeed) => set({ speed: newSpeed }),

  setActiveModule: (module) => set({ 
    activeModule: module, 
    tick: 0, 
    isPlaying: false, 
    history: [],
    processes: [] 
  }),

  // --- THE SCHEDULER ENGINE ---
  advanceTick: () => set((state) => {
    const currentTick = state.tick;
    const updatedProcesses = state.processes.map(p => ({ ...p }));

    // FCFS: Find the first arrived process that isn't done
    const processToRun = updatedProcesses.find(p => 
      p.status !== 'completed' && p.arrivalTime <= currentTick
    );

    let runningId: string | null = null;

    if (processToRun) {
      processToRun.status = 'running';
      runningId = processToRun.id;

      // Decrement the remaining time
      processToRun.remainingTime = Math.max(0, processToRun.remainingTime - 1);

      // Check if it just finished
      if (processToRun.remainingTime === 0) {
        processToRun.status = 'completed';
        // NEW: Record finish time for stats
        processToRun.finishTime = currentTick + 1; 
      }
    }

    return { 
      tick: currentTick + 1, 
      processes: updatedProcesses,
      history: [...state.history, runningId]
    };
  }),

  addProcess: (p) => set((state) => ({ 
    processes: [...state.processes, p] 
  })),
  
  resetSimulation: () => set({ 
    tick: 0, 
    isPlaying: false, 
    processes: [],
    history: []
  }),
}));