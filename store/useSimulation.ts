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

  // Clock Actions
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  //advanceTick: () => set((state) => ({ tick: state.tick + 1 })), old v
  advanceTick: () => set((state) => {
  const newTick = state.tick + 1;
   return { tick: newTick };
}),

  setSpeed: (newSpeed) => set({ speed: newSpeed }),

  setActiveModule: (module) => set({ activeModule: module, tick: 0, isPlaying: false }),

  // Process Actions
  addProcess: (p) => set((state) => ({ 
    processes: [...state.processes, p] 
  })),
  
  resetSimulation: () => set({ 
    tick: 0, 
    isPlaying: false, 
    processes: [] 
  }),
}));