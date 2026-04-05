import { create } from 'zustand';

// Assuming Process is defined based on your usage in the components
export interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  status: 'idle' | 'running' | 'completed';
  finishTime?: number;
  color?: string;
}

type Algorithm = 'FCFS' | 'SJF' | 'SRTF' | 'RR';

interface SimulationState {
  isPlaying: boolean;
  tick: number;
  speed: number;
  activeModule: string;
  algorithm: Algorithm;
  processes: Process[];
  history: (string | null)[];
  quantum: number;
  readyQueue: string[];
  elapsedInQuantum: number;

  setQuantum: (q: number) => void;
  togglePlay: () => void;
  advanceTick: () => void;
  setSpeed: (newSpeed: number) => void;
  setAlgorithm: (algo: Algorithm) => void;
  setActiveModule: (module: string) => void;
  addProcess: (p: Process) => void;
  resetSimulation: () => void;
}

export const useSimulation = create<SimulationState>((set, get) => ({
  isPlaying: false,
  tick: 0,
  speed: 1,
  activeModule: 'cpu',
  algorithm: 'FCFS',
  processes: [],
  history: [],
  quantum: 2,
  readyQueue: [],
  elapsedInQuantum: 0,

  setQuantum: (q) => set({ quantum: q }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSpeed: (newSpeed) => set({ speed: newSpeed }),

  setAlgorithm: (algo) => set({
    algorithm: algo,
    tick: 0,
    history: [],
    readyQueue: [],
    elapsedInQuantum: 0,
    processes: get().processes.map(p => ({
      ...p,
      status: 'idle',
      remainingTime: p.burstTime,
      finishTime: undefined
    }))
  }),

  setActiveModule: (module) => set({
    activeModule: module,
    tick: 0,
    isPlaying: false,
    history: [],
    processes: [],
    readyQueue: [],
    elapsedInQuantum: 0
  }),

  advanceTick: () => set((state) => {
    const currentTick = state.tick;
    const { algorithm, quantum, elapsedInQuantum, readyQueue } = state;

    // 1. ARRIVAL: Identify processes arriving at this exact clock tick
    const newlyArrived = state.processes
      .filter(p => p.arrivalTime === currentTick)
      .map(p => p.id);

    let updatedReadyQueue = [...readyQueue];
    let processToRunId: string | null = null;
    let nextElapsed = elapsedInQuantum;

    // --- ROUND ROBIN LOGIC ---
    if (algorithm === 'RR') {
      const currentlyRunning = state.processes.find(p => p.status === 'running');

      if (currentlyRunning) {
        const isFinished = currentlyRunning.remainingTime <= 0;
        const isQuantumOver = nextElapsed >= quantum;

        if (isFinished) {
          // Process ended naturally last tick
          processToRunId = null;
          nextElapsed = 0;
          updatedReadyQueue.push(...newlyArrived);
        } 
        else if (isQuantumOver) {
          // PREEMPTION: New arrivals join queue first, then the preempted process
          updatedReadyQueue.push(...newlyArrived);
          updatedReadyQueue.push(currentlyRunning.id);
          processToRunId = null;
          nextElapsed = 0;
        } 
        else {
          // Continue current burst; arrivals wait behind
          processToRunId = currentlyRunning.id;
          updatedReadyQueue.push(...newlyArrived);
        }
      } else {
        // CPU was idle
        updatedReadyQueue.push(...newlyArrived);
      }

      // If CPU is free, pick next from the head of the queue
      if (!processToRunId && updatedReadyQueue.length > 0) {
        processToRunId = updatedReadyQueue.shift() || null;
        nextElapsed = 0; 
      }

      // This tick will count as 1 unit of execution for whichever process is picked
      if (processToRunId) nextElapsed++;

    } 
    // --- NON-RR LOGIC (FCFS, SJF, SRTF) ---
    else {
      updatedReadyQueue.push(...newlyArrived);
      const eligibleProcesses = state.processes.filter(
        p => p.status !== 'completed' && p.arrivalTime <= currentTick
      );

      if (eligibleProcesses.length > 0) {
        if (algorithm === 'FCFS') {
          const currentlyRunning = eligibleProcesses.find(p => p.status === 'running');
          processToRunId = (currentlyRunning || [...eligibleProcesses].sort((a, b) => a.arrivalTime - b.arrivalTime)[0]).id;
        } 
        else if (algorithm === 'SJF') {
          const currentlyRunning = eligibleProcesses.find(p => p.status === 'running');
          processToRunId = (currentlyRunning || [...eligibleProcesses].sort((a, b) => a.burstTime - b.burstTime)[0]).id;
        } 
        else if (algorithm === 'SRTF') {
          processToRunId = [...eligibleProcesses].sort((a, b) => {
            if (a.remainingTime !== b.remainingTime) return a.remainingTime - b.remainingTime;
            return a.arrivalTime - b.arrivalTime;
          })[0].id;
        }
      }
    }

    // 2. APPLY UPDATES: Burn 1ms of burst time and update status
    const updatedProcesses = state.processes.map(p => {
      const updated = { ...p };
      if (p.id === processToRunId) {
        updated.status = 'running';
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
      history: [...state.history, processToRunId],
      readyQueue: updatedReadyQueue,
      elapsedInQuantum: nextElapsed
    };
  }),

  addProcess: (p) => set((state) => ({
    processes: [...state.processes, { ...p, remainingTime: p.burstTime, status: 'idle' }]
  })),

  resetSimulation: () => set({
    tick: 0,
    isPlaying: false,
    processes: [],
    history: [],
    readyQueue: [],
    elapsedInQuantum: 0
  })
}));