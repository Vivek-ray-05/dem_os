import { create } from 'zustand';

interface SimulationState {
  isPlaying: boolean;
  tick: number;
  speed: number; // 1 = 1s, 2 = 0.5s, etc.
  togglePlay: () => void;
  setSpeed: (newSpeed: number) => void;
  advanceTick: () => void;
  resetSimulation: () => void;
}

export const useSimulation = create<SimulationState>((set) => ({
  isPlaying: false,
  tick: 0,
  speed: 1,
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSpeed: (newSpeed) => set({ speed: newSpeed }),
  advanceTick: () => set((state) => ({ tick: state.tick + 1 })),
  resetSimulation: () => set({ tick: 0, isPlaying: false }),
}));