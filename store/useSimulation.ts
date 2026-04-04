import { create } from 'zustand';
import { Process } from '../.next/types/os'; 

type Algorithm = 'FCFS' | 'SJF';

interface SimulationState {
  isPlaying: boolean;
  tick: number;
  speed: number;
  activeModule: string;
  algorithm: Algorithm; // New: track current strategy
  processes: Process[]; 
  history: (string | null)[]; 
  
  togglePlay: () => void;
  advanceTick: () => void;
  setSpeed: (newSpeed: number) => void;
  setAlgorithm: (algo: Algorithm) => void; // New: setter
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
    
    // 1. Identify "Ready" processes (Arrived and not completed)
    const readyProcesses = state.processes.filter(
      p => p.status !== 'completed' && p.arrivalTime <= currentTick
    );

    let processToRunFromReady: Process | null = null;

    if (readyProcesses.length > 0) {
      if (state.algorithm === 'FCFS') {
        // --- FCFS LOGIC ---
        processToRunFromReady = [...readyProcesses].sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      } else {
        // --- SJF LOGIC (Non-Preemptive) ---
        // If someone is already running, they keep the CPU until finished
        const currentlyRunning = readyProcesses.find(p => p.status === 'running');
        
        if (currentlyRunning) {
          processToRunFromReady = currentlyRunning;
        } else {
          // Otherwise, pick the shortest burst time
          processToRunFromReady = [...readyProcesses].sort((a, b) => a.burstTime - b.burstTime)[0];
        }
      }
    }

    let runningId: string | null = null;

    const updatedProcesses = state.processes.map(p => {
      const updatedProcess = { ...p };

      if (processToRunFromReady && p.id === processToRunFromReady.id) {
        updatedProcess.status = 'running';
        runningId = updatedProcess.id;

        updatedProcess.remainingTime = Math.max(0, updatedProcess.remainingTime - 1);

        if (updatedProcess.remainingTime === 0) {
          updatedProcess.status = 'completed';
          updatedProcess.finishTime = currentTick + 1; 
        }
      } else if (updatedProcess.status === 'running') {
        // Set to idle if no longer the chosen process (prevents dual-running bugs)
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