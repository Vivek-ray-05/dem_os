import { create } from 'zustand';
import { Process } from '../.next/types/os'; // Ensure this points to your actual types file

interface SimulationState {
  // --- CLOCK STATE ---
  isPlaying: boolean;
  tick: number;
  speed: number;
  activeModule: string;
  
  // --- PROCESS STATE ---
  processes: Process[]; 
  history: (string | null)[]; // Tracks process IDs per tick for the Gantt Chart
  
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

  // Clock Actions
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setSpeed: (newSpeed) => set({ speed: newSpeed }),

  setActiveModule: (module) => set({ activeModule: module, tick: 0, isPlaying: false, history: [] }),

  // --- THE SCHEDULER ENGINE ---
  advanceTick: () => set((state) => {
    const currentTick = state.tick;
    const updatedProcesses = state.processes.map(p => ({ ...p }));

    // FCFS Logic: Find the first process that hasn't finished and has already arrived
    const processToRun = updatedProcesses.find(p => 
      p.status !== 'completed' && p.arrivalTime <= currentTick
    );

    let runningId: string | null = null;

    if (processToRun) {
      // Transition status to running
      processToRun.status = 'running';
      runningId = processToRun.id;

      // Decrement burst time
      processToRun.remainingTime = Math.max(0, processToRun.remainingTime - 1);

      // Check for completion
      if (processToRun.remainingTime === 0) {
        processToRun.status = 'completed';
      }
    }

    return { 
      tick: currentTick + 1, 
      processes: updatedProcesses,
      history: [...state.history, runningId] // Records the "who ran when" snapshot
    };
  }),

  // Process Actions
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