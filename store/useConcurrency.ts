import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncTab = "mutex" | "semaphore" | "dining" | "deadlock";

export type ThreadStatus =
  | "ready"       // waiting to be scheduled
  | "running"     // inside critical section / holding resource
  | "blocked"     // waiting on lock/semaphore
  | "completed";  // finished

export interface Thread {
  id: number;           // T1, T2 ...
  name: string;
  status: ThreadStatus;
  color: string;
  waitTime: number;     // ticks spent blocked
  holdTime: number;     // ticks spent in critical section
}

export interface LogEntry {
  tick: number;
  threadId: number | null;
  text: string;
  kind: "acquire" | "release" | "block" | "deadlock" | "info" | "signal" | "wait";
}

// ── Tab 1 — Mutex ─────────────────────────────────────────────────────────────
export interface MutexState {
  lock: number | null;        // thread id holding the lock, or null
  queue: number[];            // threads waiting
  threads: Thread[];
  csLog: { threadId: number; enter: number; exit: number | null }[];
  tick: number;
  isPlaying: boolean;
  speed: 1 | 2 | 4;
  logs: LogEntry[];
}

// ── Tab 2 — Semaphore ─────────────────────────────────────────────────────────
export interface SemaphoreState {
  value: number;              // current semaphore count
  maxValue: number;           // initial / max value
  queue: number[];            // blocked threads
  threads: Thread[];
  tick: number;
  isPlaying: boolean;
  speed: 1 | 2 | 4;
  logs: LogEntry[];
}

// ── Tab 3 — Dining Philosophers ───────────────────────────────────────────────
export type PhilosopherState = "thinking" | "hungry" | "eating";

export interface Philosopher {
  id: number;
  state: PhilosopherState;
  eatCount: number;
  waitTime: number;
  color: string;
}

export interface DiningState {
  philosophers: Philosopher[];
  forks: (number | null)[];   // index = fork id, value = philosopher holding it
  tick: number;
  isPlaying: boolean;
  speed: 1 | 2 | 4;
  logs: LogEntry[];
  deadlockDetected: boolean;
}

// ── Tab 4 — Deadlock ──────────────────────────────────────────────────────────
export interface Resource {
  id: number;
  name: string;
  instances: number;
  available: number;
}

export interface DeadlockProcess {
  id: number;
  name: string;
  color: string;
  holds: number[];            // resource ids held
  wants: number[];            // resource ids wanted
  status: "running" | "blocked" | "completed";
  allocation: number[];       // allocated per resource
  maxNeed: number[];          // maximum need per resource
  remaining: number[];        // remaining need per resource
}

export interface DeadlockState {
  processes: DeadlockProcess[];
  resources: Resource[];
  cycle: number[];            // process ids forming the deadlock cycle
  safeSequence: number[];     // banker's safe sequence if found
  analysed: boolean;
  isSafe: boolean;
}

// ─── Colours ─────────────────────────────────────────────────────────────────

const THREAD_COLORS = [
  "#00b4d8", "#4caf7d", "#f59e0b", "#a78bfa",
  "#f472b6", "#34d399", "#fb923c",
];

const PHILO_COLORS = [
  "#00b4d8", "#4caf7d", "#f59e0b", "#a78bfa", "#f472b6",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeThreads(n: number): Thread[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `T${i + 1}`,
    status: "ready" as ThreadStatus,
    color: THREAD_COLORS[i % THREAD_COLORS.length],
    waitTime: 0,
    holdTime: 0,
  }));
}

function makePhilosophers(n = 5): Philosopher[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    state: "thinking" as PhilosopherState,
    eatCount: 0,
    waitTime: 0,
    color: PHILO_COLORS[i % PHILO_COLORS.length],
  }));
}

// Banker's algorithm — returns safe sequence or null
function bankersAlgorithm(
  processes: DeadlockProcess[],
  resources: Resource[]
): number[] | null {
  const work = resources.map((r) => r.available);
  const finish = processes.map(() => false);
  const sequence: number[] = [];

  for (let iter = 0; iter < processes.length * 2; iter++) {
    for (let i = 0; i < processes.length; i++) {
      if (finish[i]) continue;
      const p = processes[i];
      // Can we satisfy this process's remaining need?
      const canAllocate = p.remaining.every((need, ri) => need <= work[ri]);
      if (canAllocate) {
        // Process can complete — release its resources
        p.allocation.forEach((alloc, ri) => { work[ri] += alloc; });
        finish[i] = true;
        sequence.push(p.id);
      }
    }
  }
  return finish.every(Boolean) ? sequence : null;
}

// Detect deadlock cycle in resource allocation graph
function detectCycle(processes: DeadlockProcess[]): number[] {
  const blocked = processes.filter((p) => p.status === "blocked").map((p) => p.id);
  // Simple cycle detection: if a set of blocked processes all want resources
  // held by other blocked processes, they form a deadlock
  const cycle: number[] = [];
  for (const p of processes.filter((p) => p.status === "blocked")) {
    const holderIds = processes
      .filter((other) => other.holds.some((r) => p.wants.includes(r)))
      .map((o) => o.id);
    if (holderIds.every((hid) => blocked.includes(hid)) && holderIds.length > 0) {
      cycle.push(p.id);
    }
  }
  return cycle;
}

// ─── Initial states ───────────────────────────────────────────────────────────

function initMutex(threadCount = 4): MutexState {
  return {
    lock: null,
    queue: [],
    threads: makeThreads(threadCount),
    csLog: [],
    tick: 0,
    isPlaying: false,
    speed: 1,
    logs: [{ tick: 0, threadId: null, text: "Mutex initialised — unlocked", kind: "info" }],
  };
}

function initSemaphore(maxValue = 2, threadCount = 5): SemaphoreState {
  return {
    value: maxValue,
    maxValue,
    queue: [],
    threads: makeThreads(threadCount),
    tick: 0,
    isPlaying: false,
    speed: 1,
    logs: [{ tick: 0, threadId: null, text: `Semaphore initialised — value ${maxValue}`, kind: "info" }],
  };
}

function initDining(): DiningState {
  return {
    philosophers: makePhilosophers(5),
    forks: [null, null, null, null, null],
    tick: 0,
    isPlaying: false,
    speed: 1,
    logs: [{ tick: 0, threadId: null, text: "5 philosophers seated", kind: "info" }],
    deadlockDetected: false,
  };
}

function initDeadlock(): DeadlockState {
  // Classic deadlock scenario with Banker's algorithm
  const resources: Resource[] = [
    { id: 0, name: "R0", instances: 3, available: 1 },
    { id: 1, name: "R1", instances: 3, available: 1 },
    { id: 2, name: "R2", instances: 2, available: 0 },
  ];
  const processes: DeadlockProcess[] = [
    { id: 0, name: "P0", color: THREAD_COLORS[0], holds: [0], wants: [1,2], status: "running",  allocation: [0,1,0], maxNeed: [7,5,3], remaining: [7,4,3] },
    { id: 1, name: "P1", color: THREAD_COLORS[1], holds: [1], wants: [0],   status: "blocked",  allocation: [2,0,0], maxNeed: [3,2,2], remaining: [1,2,2] },
    { id: 2, name: "P2", color: THREAD_COLORS[2], holds: [2], wants: [1],   status: "blocked",  allocation: [3,0,2], maxNeed: [9,0,2], remaining: [6,0,0] },
    { id: 3, name: "P3", color: THREAD_COLORS[3], holds: [],  wants: [0,1], status: "blocked",  allocation: [2,1,1], maxNeed: [2,2,2], remaining: [0,1,1] },
    { id: 4, name: "P4", color: THREAD_COLORS[4], holds: [1], wants: [2],   status: "running",  allocation: [0,0,2], maxNeed: [4,3,3], remaining: [4,3,1] },
  ];
  const cycle = detectCycle(processes);
  const safeSeq = bankersAlgorithm(processes, resources);
  return {
    processes,
    resources,
    cycle,
    safeSequence: safeSeq ?? [],
    analysed: false,
    isSafe: safeSeq !== null,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ConcurrencyStore {
  activeTab: SyncTab;
  setActiveTab: (t: SyncTab) => void;

  // ── Mutex ──
  mutex: MutexState;
  mutexRequestLock: (threadId: number) => void;
  mutexReleaseLock: () => void;
  mutexStep: () => void;
  mutexTogglePlay: () => void;
  mutexSetSpeed: (s: 1 | 2 | 4) => void;
  mutexReset: () => void;

  // ── Semaphore ──
  semaphore: SemaphoreState;
  semaphoreWait: (threadId: number) => void;
  semaphoreSignal: (threadId: number) => void;
  semaphoreStep: () => void;
  semaphoreTogglePlay: () => void;
  semaphoreSetSpeed: (s: 1 | 2 | 4) => void;
  semaphoreReset: () => void;
  semaphoreSetMax: (v: number) => void;

  // ── Dining ──
  dining: DiningState;
  diningStep: () => void;
  diningTogglePlay: () => void;
  diningSetSpeed: (s: 1 | 2 | 4) => void;
  diningReset: () => void;

  // ── Deadlock ──
  deadlock: DeadlockState;
  deadlockAnalyse: () => void;
  deadlockReset: () => void;
  deadlockResolve: (processId: number) => void;
}

export const useConcurrency = create<ConcurrencyStore>((set, get) => ({
  activeTab: "mutex",
  setActiveTab: (activeTab) => set({ activeTab }),

  // ════════════════════════════════════════════════════
  // MUTEX
  // ════════════════════════════════════════════════════
  mutex: initMutex(),

  mutexReset: () => set({ mutex: initMutex() }),
  mutexSetSpeed: (speed) => set((s) => ({ mutex: { ...s.mutex, speed } })),
  mutexTogglePlay: () => set((s) => ({ mutex: { ...s.mutex, isPlaying: !s.mutex.isPlaying } })),

  mutexRequestLock: (threadId) =>
    set((s) => {
      const m = s.mutex;
      const thread = m.threads.find((t) => t.id === threadId);
      if (!thread || thread.status !== "ready") return {};
      if (m.lock === null) {
        // Lock is free — grant immediately
        return {
          mutex: {
            ...m,
            lock: threadId,
            threads: m.threads.map((t) =>
              t.id === threadId ? { ...t, status: "running" as ThreadStatus } : t
            ),
            csLog: [...m.csLog, { threadId, enter: m.tick, exit: null }],
            logs: [...m.logs, { tick: m.tick, threadId, text: `T${threadId} acquired lock`, kind: "acquire" }],
          },
        };
      } else {
        // Lock is held — block the thread
        return {
          mutex: {
            ...m,
            queue: [...m.queue, threadId],
            threads: m.threads.map((t) =>
              t.id === threadId ? { ...t, status: "blocked" as ThreadStatus } : t
            ),
            logs: [...m.logs, { tick: m.tick, threadId, text: `T${threadId} blocked — lock held by T${m.lock}`, kind: "block" }],
          },
        };
      }
    }),

  mutexReleaseLock: () =>
    set((s) => {
      const m = s.mutex;
      if (m.lock === null) return {};
      const releasedId = m.lock;
      const newQueue = [...m.queue];
      const nextId = newQueue.shift() ?? null;
      const newLogs: LogEntry[] = [
        { tick: m.tick, threadId: releasedId, text: `T${releasedId} released lock`, kind: "release" },
      ];
      const updatedCsLog = m.csLog.map((e) =>
        e.threadId === releasedId && e.exit === null ? { ...e, exit: m.tick } : e
      );
      let newThreads = m.threads.map((t) =>
        t.id === releasedId ? { ...t, status: "completed" as ThreadStatus } : t
      );
      if (nextId !== null) {
        newThreads = newThreads.map((t) =>
          t.id === nextId ? { ...t, status: "running" as ThreadStatus } : t
        );
        newLogs.push({ tick: m.tick, threadId: nextId, text: `T${nextId} acquired lock (was queued)`, kind: "acquire" });
      }
      return {
        mutex: {
          ...m,
          lock: nextId,
          queue: newQueue,
          threads: newThreads,
          csLog: updatedCsLog,
          logs: [...m.logs, ...newLogs],
        },
      };
    }),

  mutexStep: () =>
    set((s) => {
      const m = s.mutex;
      const newLogs: LogEntry[] = [];
      let threads = m.threads.map((t) => ({
        ...t,
        waitTime: t.status === "blocked" ? t.waitTime + 1 : t.waitTime,
        holdTime: t.status === "running" ? t.holdTime + 1 : t.holdTime,
      }));

      // Auto-release after 3 ticks in CS
      const holder = threads.find((t) => t.id === m.lock);
      if (holder && holder.holdTime >= 3) {
        const releasedId = m.lock!;
        const newQueue = [...m.queue];
        const nextId = newQueue.shift() ?? null;
        threads = threads.map((t) =>
          t.id === releasedId ? { ...t, status: "completed" as ThreadStatus, holdTime: 0 } : t
        );
        newLogs.push({ tick: m.tick + 1, threadId: releasedId, text: `T${releasedId} exited critical section`, kind: "release" });
        if (nextId) {
          threads = threads.map((t) =>
            t.id === nextId ? { ...t, status: "running" as ThreadStatus } : t
          );
          newLogs.push({ tick: m.tick + 1, threadId: nextId, text: `T${nextId} entered critical section`, kind: "acquire" });
        }
        // Auto-queue ready threads
        const readyThreads = threads.filter((t) => t.status === "ready");
        const nextQueue = nextId ? newQueue : [...newQueue];
        return {
          mutex: { ...m, tick: m.tick + 1, threads, lock: nextId, queue: nextQueue, logs: [...m.logs, ...newLogs] },
        };
      }

      // Auto-request from ready threads
      const readyThread = threads.find((t) => t.status === "ready");
      if (readyThread && m.lock === null) {
        threads = threads.map((t) =>
          t.id === readyThread.id ? { ...t, status: "running" as ThreadStatus } : t
        );
        newLogs.push({ tick: m.tick + 1, threadId: readyThread.id, text: `T${readyThread.id} acquired lock`, kind: "acquire" });
        return {
          mutex: { ...m, tick: m.tick + 1, threads, lock: readyThread.id, logs: [...m.logs, ...newLogs] },
        };
      } else if (readyThread && m.lock !== null) {
        threads = threads.map((t) =>
          t.id === readyThread.id ? { ...t, status: "blocked" as ThreadStatus } : t
        );
        newLogs.push({ tick: m.tick + 1, threadId: readyThread.id, text: `T${readyThread.id} blocked`, kind: "block" });
        return {
          mutex: { ...m, tick: m.tick + 1, threads, queue: [...m.queue, readyThread.id], logs: [...m.logs, ...newLogs] },
        };
      }

      return { mutex: { ...m, tick: m.tick + 1, threads, logs: newLogs.length ? [...m.logs, ...newLogs] : m.logs } };
    }),

  // ════════════════════════════════════════════════════
  // SEMAPHORE
  // ════════════════════════════════════════════════════
  semaphore: initSemaphore(),

  semaphoreReset: () => set((s) => ({ semaphore: initSemaphore(s.semaphore.maxValue) })),
  semaphoreSetSpeed: (speed) => set((s) => ({ semaphore: { ...s.semaphore, speed } })),
  semaphoreTogglePlay: () => set((s) => ({ semaphore: { ...s.semaphore, isPlaying: !s.semaphore.isPlaying } })),
  semaphoreSetMax: (maxValue) => set({ semaphore: initSemaphore(maxValue) }),

  semaphoreWait: (threadId) =>
    set((s) => {
      const sem = s.semaphore;
      if (sem.value > 0) {
        return {
          semaphore: {
            ...sem,
            value: sem.value - 1,
            threads: sem.threads.map((t) =>
              t.id === threadId ? { ...t, status: "running" as ThreadStatus } : t
            ),
            logs: [...sem.logs, { tick: sem.tick, threadId, text: `T${threadId} wait() — value ${sem.value} → ${sem.value - 1}`, kind: "wait" }],
          },
        };
      } else {
        return {
          semaphore: {
            ...sem,
            queue: [...sem.queue, threadId],
            threads: sem.threads.map((t) =>
              t.id === threadId ? { ...t, status: "blocked" as ThreadStatus } : t
            ),
            logs: [...sem.logs, { tick: sem.tick, threadId, text: `T${threadId} blocked — semaphore = 0`, kind: "block" }],
          },
        };
      }
    }),

  semaphoreSignal: (threadId) =>
    set((s) => {
      const sem = s.semaphore;
      const newQueue = [...sem.queue];
      const nextId = newQueue.shift() ?? null;
      const newLogs: LogEntry[] = [
        { tick: sem.tick, threadId, text: `T${threadId} signal() — value ${sem.value} → ${nextId ? sem.value : sem.value + 1}`, kind: "signal" },
      ];
      let newThreads = sem.threads.map((t) =>
        t.id === threadId ? { ...t, status: "completed" as ThreadStatus } : t
      );
      if (nextId) {
        newThreads = newThreads.map((t) =>
          t.id === nextId ? { ...t, status: "running" as ThreadStatus } : t
        );
        newLogs.push({ tick: sem.tick, threadId: nextId, text: `T${nextId} unblocked by signal`, kind: "signal" });
      }
      return {
        semaphore: {
          ...sem,
          value: nextId ? sem.value : Math.min(sem.value + 1, sem.maxValue),
          queue: newQueue,
          threads: newThreads,
          logs: [...sem.logs, ...newLogs],
        },
      };
    }),

  semaphoreStep: () =>
    set((s) => {
      const sem = s.semaphore;
      const newLogs: LogEntry[] = [];
      let threads = sem.threads.map((t) => ({
        ...t,
        waitTime: t.status === "blocked" ? t.waitTime + 1 : t.waitTime,
        holdTime: t.status === "running" ? t.holdTime + 1 : t.holdTime,
      }));
      let { value, queue } = sem;

      // Auto signal after holding 3 ticks
      const running = threads.filter((t) => t.status === "running");
      for (const r of running) {
        if (r.holdTime >= 3) {
          const newQ = [...queue];
          const nextId = newQ.shift() ?? null;
          threads = threads.map((t) =>
            t.id === r.id ? { ...t, status: "completed" as ThreadStatus, holdTime: 0 } : t
          );
          newLogs.push({ tick: sem.tick + 1, threadId: r.id, text: `T${r.id} signal() — released`, kind: "signal" });
          if (nextId) {
            threads = threads.map((t) =>
              t.id === nextId ? { ...t, status: "running" as ThreadStatus } : t
            );
            queue = newQ;
            newLogs.push({ tick: sem.tick + 1, threadId: nextId, text: `T${nextId} unblocked`, kind: "signal" });
          } else {
            value = Math.min(value + 1, sem.maxValue);
            queue = newQ;
          }
        }
      }

      // Auto wait from ready threads
      const readyThread = threads.find((t) => t.status === "ready");
      if (readyThread) {
        if (value > 0) {
          value--;
          threads = threads.map((t) =>
            t.id === readyThread.id ? { ...t, status: "running" as ThreadStatus } : t
          );
          newLogs.push({ tick: sem.tick + 1, threadId: readyThread.id, text: `T${readyThread.id} wait() — entered`, kind: "wait" });
        } else {
          threads = threads.map((t) =>
            t.id === readyThread.id ? { ...t, status: "blocked" as ThreadStatus } : t
          );
          queue = [...queue, readyThread.id];
          newLogs.push({ tick: sem.tick + 1, threadId: readyThread.id, text: `T${readyThread.id} blocked — semaphore=0`, kind: "block" });
        }
      }

      return {
        semaphore: {
          ...sem,
          tick: sem.tick + 1,
          threads,
          value,
          queue,
          logs: newLogs.length ? [...sem.logs, ...newLogs] : sem.logs,
        },
      };
    }),

  // ════════════════════════════════════════════════════
  // DINING PHILOSOPHERS
  // ════════════════════════════════════════════════════
  dining: initDining(),

  diningReset: () => set({ dining: initDining() }),
  diningSetSpeed: (speed) => set((s) => ({ dining: { ...s.dining, speed } })),
  diningTogglePlay: () => set((s) => ({ dining: { ...s.dining, isPlaying: !s.dining.isPlaying } })),

  diningStep: () =>
    set((s) => {
      const d = s.dining;
      const philos = d.philosophers.map((p) => ({ ...p }));
      const forks = [...d.forks];
      const newLogs: LogEntry[] = [];
      let deadlockDetected = false;

      // Each philosopher independently tries to progress
      for (const p of philos) {
        if (p.state === "thinking") {
          // Randomly decide to get hungry (30% chance per tick)
          if (Math.random() < 0.3) {
            p.state = "hungry";
            newLogs.push({ tick: d.tick, threadId: p.id, text: `P${p.id} is hungry`, kind: "info" });
          }
        } else if (p.state === "hungry") {
          p.waitTime++;
          const leftFork = p.id;
          const rightFork = (p.id + 1) % 5;
          // Try to pick up both forks
          if (forks[leftFork] === null && forks[rightFork] === null) {
            forks[leftFork] = p.id;
            forks[rightFork] = p.id;
            p.state = "eating";
            newLogs.push({ tick: d.tick, threadId: p.id, text: `P${p.id} picked up forks ${leftFork} & ${rightFork}`, kind: "acquire" });
          }
        } else if (p.state === "eating") {
          p.eatCount++;
          // Eat for 2 ticks then put down forks
          if (p.eatCount % 2 === 0) {
            const leftFork = p.id;
            const rightFork = (p.id + 1) % 5;
            forks[leftFork] = null;
            forks[rightFork] = null;
            p.state = "thinking";
            newLogs.push({ tick: d.tick, threadId: p.id, text: `P${p.id} finished eating, released forks`, kind: "release" });
          }
        }
      }

      // Deadlock detection: all philosophers hungry and no forks available
      const allHungry = philos.every((p) => p.state === "hungry");
      if (allHungry) {
        deadlockDetected = true;
        newLogs.push({ tick: d.tick, threadId: null, text: "DEADLOCK — all philosophers waiting for forks!", kind: "deadlock" });
      }

      return {
        dining: {
          ...d,
          philosophers: philos,
          forks,
          tick: d.tick + 1,
          deadlockDetected,
          logs: [...d.logs, ...newLogs],
        },
      };
    }),

  // ════════════════════════════════════════════════════
  // DEADLOCK DETECTOR
  // ════════════════════════════════════════════════════
  deadlock: initDeadlock(),

  deadlockAnalyse: () =>
    set((s) => {
      const d = s.deadlock;
      const cycle = detectCycle(d.processes);
      const safeSeq = bankersAlgorithm(d.processes, d.resources);
      return {
        deadlock: {
          ...d,
          cycle,
          safeSequence: safeSeq ?? [],
          isSafe: safeSeq !== null,
          analysed: true,
        },
      };
    }),

  deadlockResolve: (processId) =>
    set((s) => {
      const d = s.deadlock;
      // Terminate the process — release its resources
      const process = d.processes.find((p) => p.id === processId);
      if (!process) return {};
      const newResources = d.resources.map((r, ri) => ({
        ...r,
        available: r.available + (process.allocation[ri] ?? 0),
      }));
      const newProcesses = d.processes.map((p) =>
        p.id === processId
          ? { ...p, status: "completed" as const, holds: [], allocation: p.allocation.map(() => 0) }
          : p
      );
      const newCycle = detectCycle(newProcesses);
      const newSafeSeq = bankersAlgorithm(newProcesses, newResources);
      return {
        deadlock: {
          ...d,
          processes: newProcesses,
          resources: newResources,
          cycle: newCycle,
          safeSequence: newSafeSeq ?? [],
          isSafe: newSafeSeq !== null,
          analysed: true,
        },
      };
    }),

  deadlockReset: () => set({ deadlock: initDeadlock() }),
}));