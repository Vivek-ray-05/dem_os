import { create } from 'zustand';

interface SimulationState {
  isPlaying: boolean;
  tick: number;
  speed: number; 
  activeModule: string;
  
  // Actions
  togglePlay: () => void;
  setSpeed: (newSpeed: number) => void;
  advanceTick: () => void;
  resetSimulation: () => void;
  setActiveModule: (module: string) => void;
}

export const useSimulation = create<SimulationState>((set) => ({
  isPlaying: false,
  tick: 0,
  speed: 1,
  activeModule: 'cpu',

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setSpeed: (newSpeed) => set({ speed: newSpeed }),
  
  advanceTick: () => set((state) => ({ tick: state.tick + 1 })),
  
  resetSimulation: () => set({ tick: 0, isPlaying: false }),

  setActiveModule: (module) => set({ activeModule: module, tick: 0, isPlaying: false }),
}));