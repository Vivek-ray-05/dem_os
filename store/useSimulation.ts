import { create } from "zustand";

export interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  priority: number;
  status: "idle" | "running" | "completed";
  finishTime?: number;
  color: string;
}

export interface LogEntry {
  time: number;
  text: string;
  kind: "ok" | "info" | "new" | "done" | "warn";
}

type Algorithm = "FCFS" | "SJF" | "SRTF" | "RR" | "Priority";

interface SimulationState {
  isPlaying: boolean;
  tick: number;
  speed: number;
  algorithm: Algorithm;
  processes: Process[];
  history: (string | null)[];
  quantum: number;
  readyQueue: string[];
  elapsedInQuantum: number;
  logs: LogEntry[];
  togglePlay: () => void;
  advanceTick: () => void;
  setSpeed: (s: number) => void;
  setAlgorithm: (algo: Algorithm) => void;
  setQuantum: (q: number) => void;
  addProcess: (p: Omit<Process, "remainingTime" | "status">) => void;
  removeProcess: (id: string) => void;
  resetSimulation: () => void;
}

const PROCESS_COLORS = [
  "#00b4d8","#4caf7d","#f59e0b","#a78bfa",
  "#f472b6","#34d399","#fb923c","#60a5fa",
];

export const useSimulation = create<SimulationState>((set, get) => ({
  isPlaying: false,
  tick: 0,
  speed: 1,
  algorithm: "FCFS",
  processes: [],
  history: [],
  quantum: 2,
  readyQueue: [],
  elapsedInQuantum: 0,
  logs: [{ time: 0, text: "Kernel v2.0 active", kind: "ok" }],

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setSpeed: (speed) => set({ speed }),
  setQuantum: (quantum) => set({ quantum }),

  setAlgorithm: (algorithm) =>
    set((s) => ({
      algorithm,
      tick: 0,
      history: [],
      readyQueue: [],
      elapsedInQuantum: 0,
      logs: [
        { time: 0, text: "Kernel v2.0 active", kind: "ok" },
        { time: 0, text: `Algorithm set to ${algorithm}`, kind: "info" },
      ],
      processes: s.processes.map((p) => ({
        ...p,
        status: "idle" as const,
        remainingTime: p.burstTime,
        finishTime: undefined,
      })),
    })),

  addProcess: (p) =>
    set((s) => {
      const colorIndex = s.processes.length % PROCESS_COLORS.length;
      const newProcess: Process = {
        ...p,
        color: PROCESS_COLORS[colorIndex],
        remainingTime: p.burstTime,
        status: "idle",
      };
      return {
        processes: [...s.processes, newProcess],
        logs: [
          ...s.logs,
          { time: s.tick, text: `${p.id} queued — burst ${p.burstTime}, arrival ${p.arrivalTime}`, kind: "new" },
        ],
      };
    }),

  removeProcess: (id) =>
    set((s) => ({
      processes: s.processes.filter((p) => p.id !== id),
      logs: [...s.logs, { time: s.tick, text: `${id} removed from queue`, kind: "warn" }],
    })),

  resetSimulation: () =>
    set({
      tick: 0,
      isPlaying: false,
      processes: [],
      history: [],
      readyQueue: [],
      elapsedInQuantum: 0,
      logs: [{ time: 0, text: "Kernel reset — ready", kind: "ok" }],
    }),

  advanceTick: () =>
    set((state) => {
      const { tick, algorithm, quantum, elapsedInQuantum, readyQueue } = state;
      const newlyArrived = state.processes.filter((p) => p.arrivalTime === tick).map((p) => p.id);
      let updatedQueue = [...readyQueue];
      let processToRunId: string | null = null;
      let nextElapsed = elapsedInQuantum;
      const newLogs: LogEntry[] = [];

      newlyArrived.forEach((id) => {
        newLogs.push({ time: tick, text: `${id} arrived`, kind: "new" });
      });

      if (algorithm === "RR") {
        const running = state.processes.find((p) => p.status === "running");
        if (running) {
          if (running.remainingTime <= 0) {
            nextElapsed = 0;
            updatedQueue.push(...newlyArrived);
          } else if (nextElapsed >= quantum) {
            updatedQueue.push(...newlyArrived, running.id);
            processToRunId = null;
            nextElapsed = 0;
          } else {
            processToRunId = running.id;
            updatedQueue.push(...newlyArrived);
          }
        } else {
          updatedQueue.push(...newlyArrived);
        }
        if (!processToRunId && updatedQueue.length > 0) {
          processToRunId = updatedQueue.shift() ?? null;
          nextElapsed = 0;
        }
        if (processToRunId) nextElapsed++;
      } else {
        updatedQueue.push(...newlyArrived);
        const eligible = state.processes.filter(
          (p) => p.status !== "completed" && p.arrivalTime <= tick
        );
        if (eligible.length > 0) {
          if (algorithm === "FCFS") {
            const running = eligible.find((p) => p.status === "running");
            processToRunId = running?.id ?? [...eligible].sort((a, b) => a.arrivalTime - b.arrivalTime)[0].id;
          } else if (algorithm === "SJF") {
            const running = eligible.find((p) => p.status === "running");
            processToRunId = running?.id ?? [...eligible].sort((a, b) => a.burstTime - b.burstTime)[0].id;
          } else if (algorithm === "SRTF") {
            processToRunId = [...eligible].sort((a, b) =>
              a.remainingTime !== b.remainingTime ? a.remainingTime - b.remainingTime : a.arrivalTime - b.arrivalTime
            )[0].id;
          } else if (algorithm === "Priority") {
            processToRunId = [...eligible].sort((a, b) =>
              a.priority !== b.priority ? a.priority - b.priority : a.arrivalTime - b.arrivalTime
            )[0].id;
          }
        }
      }

      const updatedProcesses = state.processes.map((p) => {
        const next = { ...p };
        if (p.id === processToRunId) {
          next.status = "running";
          next.remainingTime = Math.max(0, next.remainingTime - 1);
          if (next.remainingTime === 0) {
            next.status = "completed";
            next.finishTime = tick + 1;
            newLogs.push({ time: tick + 1, text: `${p.id} completed`, kind: "done" });
          }
        } else if (next.status !== "completed") {
          next.status = "idle";
        }
        return next;
      });

      return {
        tick: tick + 1,
        processes: updatedProcesses,
        history: [...state.history, processToRunId],
        readyQueue: updatedQueue,
        elapsedInQuantum: nextElapsed,
        logs: [...state.logs, ...newLogs],
      };
    }),
}));

export function getCpuUtilisation(history: (string | null)[]): number {
  if (history.length === 0) return 0;
  return Math.round((history.filter(Boolean).length / history.length) * 100);
}
