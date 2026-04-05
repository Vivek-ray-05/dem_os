import { create } from 'zustand';
import { Process } from '../.next/types/os'; 

type Algorithm = 'FCFS' | 'SJF' | 'SRTF'; 

interface SimulationState {
  isPlaying: boolean;
  tick: number;
  speed: number;
  activeModule: string;
  algorithm: Algorithm;
  processes: Process[]; 
  history: (string | null)[]; 
  
  togglePlay: () => void;
  advanceTick: () => void;
  setSpeed: (newSpeed: number) => void;
  setAlgorithm: (algo: Algorithm) => void;
  setActiveModule: (module: string) => void;
  addProcess: (p: Process) => void; 
  resetSimulation: () => void;
}

export const useSimulation = create<SimulationState>((set) => ({
  isPlaying: false,
  tick: 0,
  speed: 1,
  activeModule: 'cpu',
  algorithm: 'FCFS',
  processes: [],
  history: [],

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setSpeed: (newSpeed) => set({ speed: newSpeed }),
  
  setAlgorithm: (algo) => set({ algorithm: algo }),

  setActiveModule: (module) => set({ 
    activeModule: module, 
    tick: 0, 
    isPlaying: false, 
    history: [],
    processes: [] 
  }),

  advanceTick: () => set((state) => {
    const currentTick = state.tick;
    
    // 1. Identify processes that have arrived and aren't finished
    const readyProcesses = state.processes.filter(
      p => p.status !== 'completed' && p.arrivalTime <= currentTick
    );

    let processToRun: Process | null = null;
    const currentlyRunning = readyProcesses.find(p => p.status === 'running');

    // 2. Scheduler Selection Logic
    if (readyProcesses.length > 0) {
      if (state.algorithm === 'FCFS') {
        // Non-preemptive: Keep current process if it exists
        processToRun = currentlyRunning || [...readyProcesses].sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      } 
      else if (state.algorithm === 'SJF') {
        // Non-preemptive: Keep current process until finished
        processToRun = currentlyRunning || [...readyProcesses].sort((a, b) => a.burstTime - b.burstTime)[0];
      } 
      else if (state.algorithm === 'SRTF') {
        // Preemptive: Always pick the shortest remaining time
        processToRun = [...readyProcesses].sort((a, b) => {
          if (a.remainingTime !== b.remainingTime) return a.remainingTime - b.remainingTime;
          return a.arrivalTime - b.arrivalTime; // Tie-breaker: earlier arrival
        })[0];
      }
    }

    // 3. Update Process States and Timers
    let runningId: string | null = null;
    const updatedProcesses = state.processes.map(p => {
      const updated = { ...p };
      
      if (processToRun && p.id === processToRun.id) {
        updated.status = 'running';
        runningId = updated.id;
        updated.remainingTime = Math.max(0, updated.remainingTime - 1);
        
        if (updated.remainingTime === 0) {
          updated.status = 'completed';
          updated.finishTime = currentTick + 1;
        }
      } else if (updated.status !== 'completed') {
        updated.status = 'idle';
      }
      return updated;
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
  
  // Hard Reset: Clears the entire ready queue
  resetSimulation: () => set({
    tick: 0,
    isPlaying: false,
    processes: [], 
    history: []
  })
}));
