import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DiskTab = "visualiser" | "comparison";
export type DiskAlgo = "FCFS" | "SSTF" | "SCAN" | "C-SCAN" | "LOOK" | "C-LOOK";
export type HeadDirection = "up" | "down";

export interface SeekStep {
  from: number;
  to: number;
  seekDistance: number;
  algo?: DiskAlgo;
}

export interface DiskState {
  requestQueue: number[];       // pending disk requests (cylinder numbers)
  initialHead: number;          // starting head position
  headPosition: number;         // current head position
  direction: HeadDirection;     // current sweep direction
  diskSize: number;             // total cylinders (0 to diskSize-1)
  algorithm: DiskAlgo;
  history: SeekStep[];          // completed moves
  currentStep: number;          // index into computed sequence
  sequence: number[];           // full computed service order
  totalSeekDistance: number;
  isPlaying: boolean;
  speed: 1 | 2 | 4;
}

// ─── Algorithm implementations ───────────────────────────────────────────────

export function computeFCFS(head: number, requests: number[]): number[] {
  return [...requests];
}

export function computeSSTF(head: number, requests: number[]): number[] {
  const remaining = [...requests];
  const result: number[] = [];
  let current = head;
  while (remaining.length > 0) {
    let closest = remaining.reduce((a, b) =>
      Math.abs(a - current) <= Math.abs(b - current) ? a : b
    );
    result.push(closest);
    remaining.splice(remaining.indexOf(closest), 1);
    current = closest;
  }
  return result;
}

export function computeSCAN(
  head: number,
  requests: number[],
  direction: HeadDirection,
  diskSize: number
): number[] {
  const sorted = [...new Set(requests)].sort((a, b) => a - b);
  const left  = sorted.filter((r) => r < head).reverse();
  const right = sorted.filter((r) => r >= head);
  if (direction === "up") {
    const res = [...right];
    if (res.length > 0 && res[res.length - 1] !== diskSize - 1) res.push(diskSize - 1);
    else if (res.length === 0) res.push(diskSize - 1);
    return [...res, ...left];
  } else {
    const res = [...left];
    if (res.length > 0 && res[res.length - 1] !== 0) res.push(0);
    else if (res.length === 0) res.push(0);
    return [...res, ...right];
  }
}

export function computeCSCAN(
  head: number,
  requests: number[],
  diskSize: number
): number[] {
  const sorted = [...new Set(requests)].sort((a, b) => a - b);
  const right = sorted.filter((r) => r >= head);
  const left  = sorted.filter((r) => r < head);
  const res = [...right];
  if (res.length > 0 && res[res.length - 1] !== diskSize - 1) res.push(diskSize - 1);
  else if (res.length === 0) res.push(diskSize - 1);
  res.push(0);
  return [...res, ...left];
}

export function computeLOOK(
  head: number,
  requests: number[],
  direction: HeadDirection
): number[] {
  const sorted = [...requests].sort((a, b) => a - b);
  const left  = sorted.filter((r) => r < head).reverse();
  const right = sorted.filter((r) => r >= head);
  if (direction === "up") {
    return [...right, ...left];
  } else {
    return [...left, ...right];
  }
}

export function computeCLOOK(
  head: number,
  requests: number[]
): number[] {
  const sorted = [...requests].sort((a, b) => a - b);
  const right = sorted.filter((r) => r >= head);
  const left  = sorted.filter((r) => r < head);
  return [...right, ...left];
}

function computeSequence(
  algo: DiskAlgo,
  head: number,
  requests: number[],
  direction: HeadDirection,
  diskSize: number
): number[] {
  if (requests.length === 0) return [];
  switch (algo) {
    case "FCFS":   return computeFCFS(head, requests);
    case "SSTF":   return computeSSTF(head, requests);
    case "SCAN":   return computeSCAN(head, requests, direction, diskSize);
    case "C-SCAN": return computeCSCAN(head, requests, diskSize);
    case "LOOK":   return computeLOOK(head, requests, direction);
    case "C-LOOK": return computeCLOOK(head, requests);
    default:       return computeFCFS(head, requests);
  }
}

function buildHistory(head: number, sequence: number[]): SeekStep[] {
  const steps: SeekStep[] = [];
  let current = head;
  for (const next of sequence) {
    steps.push({ from: current, to: next, seekDistance: Math.abs(next - current) });
    current = next;
  }
  return steps;
}

// ─── Default request queues ───────────────────────────────────────────────────

const DEFAULT_REQUESTS = [98, 183, 37, 122, 14, 124, 65, 67];
const DEFAULT_HEAD = 53;
const DISK_SIZE = 200;

function initDisk(algo: DiskAlgo = "FCFS"): DiskState {
  const seq = computeSequence(algo, DEFAULT_HEAD, DEFAULT_REQUESTS, "up", DISK_SIZE);
  return {
    requestQueue: DEFAULT_REQUESTS,
    initialHead: DEFAULT_HEAD,
    headPosition: DEFAULT_HEAD,
    direction: "up",
    diskSize: DISK_SIZE,
    algorithm: algo,
    history: [],
    currentStep: 0,
    sequence: seq,
    totalSeekDistance: 0,
    isPlaying: false,
    speed: 1,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface DiskStore {
  activeTab: DiskTab;
  setActiveTab: (t: DiskTab) => void;

  disk: DiskState;
  setAlgorithm: (a: DiskAlgo) => void;
  setRequests: (q: number[]) => void;
  setInitialHead: (h: number) => void;
  setDirection: (d: HeadDirection) => void;
  stepForward: () => void;
  togglePlay: () => void;
  setSpeed: (s: 1 | 2 | 4) => void;
  reset: () => void;

  // Comparison tab — run all algos on same input
  comparisonResults: Record<DiskAlgo, { sequence: number[]; totalSeek: number }>;
  runComparison: () => void;
}

const ALL_ALGOS: DiskAlgo[] = ["FCFS", "SSTF", "SCAN", "C-SCAN", "LOOK", "C-LOOK"];

export const useDisk = create<DiskStore>((set, get) => ({
  activeTab: "visualiser",
  setActiveTab: (activeTab) => set({ activeTab }),

  disk: initDisk(),

  comparisonResults: {} as Record<DiskAlgo, { sequence: number[]; totalSeek: number }>,

  setAlgorithm: (algorithm) =>
    set((s) => {
      const { requestQueue, initialHead, direction, diskSize } = s.disk;
      const seq = computeSequence(algorithm, initialHead, requestQueue, direction, diskSize);
      return {
        disk: {
          ...s.disk,
          algorithm,
          sequence: seq,
          history: [],
          currentStep: 0,
          headPosition: initialHead,
          totalSeekDistance: 0,
          isPlaying: false,
        },
      };
    }),

  setRequests: (requestQueue) =>
    set((s) => {
      const { algorithm, initialHead, direction, diskSize } = s.disk;
      const seq = computeSequence(algorithm, initialHead, requestQueue, direction, diskSize);
      return {
        disk: {
          ...s.disk,
          requestQueue,
          sequence: seq,
          history: [],
          currentStep: 0,
          headPosition: initialHead,
          totalSeekDistance: 0,
          isPlaying: false,
        },
      };
    }),

  setInitialHead: (initialHead) =>
    set((s) => {
      const { algorithm, requestQueue, direction, diskSize } = s.disk;
      const seq = computeSequence(algorithm, initialHead, requestQueue, direction, diskSize);
      return {
        disk: {
          ...s.disk,
          initialHead,
          headPosition: initialHead,
          sequence: seq,
          history: [],
          currentStep: 0,
          totalSeekDistance: 0,
          isPlaying: false,
        },
      };
    }),

  setDirection: (direction) =>
    set((s) => {
      const { algorithm, requestQueue, initialHead, diskSize } = s.disk;
      const seq = computeSequence(algorithm, initialHead, requestQueue, direction, diskSize);
      return {
        disk: {
          ...s.disk,
          direction,
          sequence: seq,
          history: [],
          currentStep: 0,
          headPosition: initialHead,
          totalSeekDistance: 0,
          isPlaying: false,
        },
      };
    }),

  stepForward: () =>
    set((s) => {
      const d = s.disk;
      if (d.currentStep >= d.sequence.length) return { disk: { ...d, isPlaying: false } };
      const to = d.sequence[d.currentStep];
      const seekDist = Math.abs(to - d.headPosition);
      const step: SeekStep = { from: d.headPosition, to, seekDistance: seekDist };
      return {
        disk: {
          ...d,
          headPosition: to,
          history: [...d.history, step],
          currentStep: d.currentStep + 1,
          totalSeekDistance: d.totalSeekDistance + seekDist,
        },
      };
    }),

  togglePlay: () => set((s) => ({ disk: { ...s.disk, isPlaying: !s.disk.isPlaying } })),

  setSpeed: (speed) => set((s) => ({ disk: { ...s.disk, speed } })),

  reset: () =>
    set((s) => {
      const { algorithm, requestQueue, initialHead, direction, diskSize, speed } = s.disk;
      const seq = computeSequence(algorithm, initialHead, requestQueue, direction, diskSize);
      return {
        disk: {
          ...s.disk,
          headPosition: initialHead,
          history: [],
          currentStep: 0,
          totalSeekDistance: 0,
          isPlaying: false,
          sequence: seq,
          speed,
        },
      };
    }),

  runComparison: () => {
    const { requestQueue, initialHead, direction, diskSize } = get().disk;
    const results = {} as Record<DiskAlgo, { sequence: number[]; totalSeek: number }>;
    for (const algo of ALL_ALGOS) {
      const seq = computeSequence(algo, initialHead, requestQueue, direction, diskSize);
      const hist = buildHistory(initialHead, seq);
      const totalSeek = hist.reduce((sum, s) => sum + s.seekDistance, 0);
      results[algo] = { sequence: seq, totalSeek };
    }
    set({ comparisonResults: results });
  },
}));