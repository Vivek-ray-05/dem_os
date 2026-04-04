import { create } from 'zustand';
import { Process } from '../.next/types/os'; // Updated path from your previous file structure

interface SimulationState {
  isPlaying: boolean;
  tick: number;
  speed: number;
  activeModule: string;
  processes: Process[]; 
  history: (string | null)[]; 
  
  togglePlay: () => void;
  advanceTick: () => void;
  setSpeed: (newSpeed: number) => void;
  setActiveModule: (module: string) => void;
  addProcess: (p: Process) => void; 
  resetSimulation: () => void;
}

export const useSimulation = create<SimulationState>((set) => ({
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
    
    // 1. Identify "Ready" processes (Arrived and not completed)
    const readyProcesses = state.processes
      .filter(p => p.status !== 'completed' && p.arrivalTime <= currentTick)
      // 2. Sort by arrivalTime (Strict FCFS)
      .sort((a, b) => a.arrivalTime - b.arrivalTime);

    // Pick the one that arrived earliest
    const processToRunFromReady = readyProcesses[0];
    let runningId: string | null = null;

    const updatedProcesses = state.processes.map(p => {
      const updatedProcess = { ...p };

      if (processToRunFromReady && p.id === processToRunFromReady.id) {
        updatedProcess.status = 'running';
        runningId = updatedProcess.id;

        // Decrement remaining time
        updatedProcess.remainingTime = Math.max(0, updatedProcess.remainingTime - 1);

        // Record finish time if completing
        if (updatedProcess.remainingTime === 0) {
          updatedProcess.status = 'completed';
          updatedProcess.finishTime = currentTick + 1; 
        }
      } else if (updatedProcess.status === 'running') {
        // If a process was running but is no longer the head of the FCFS queue, set to idle
        updatedProcess.status = 'idle';
      }

      return updatedProcess;
    });

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