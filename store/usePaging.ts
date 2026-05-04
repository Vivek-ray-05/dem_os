import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PagingTab = "replacement" | "translation" | "tlb" | "pagetable";
export type ReplacementAlgo = "FIFO" | "LRU" | "OPTIMAL" | "CLOCK";

export interface FrameState {
  page: number | null;       // which page is loaded (-1 = empty)
  clockBit: number;          // for CLOCK algorithm (0 or 1)
  justLoaded: boolean;       // highlight pulse
  justEvicted: boolean;      // red flash before clearing
}

export interface AccessResult {
  page: number;
  fault: boolean;
  evicted: number | null;    // page that was kicked out
  frameSnapshot: (number | null)[];  // state of frames after this access
  clockHand?: number;        // for CLOCK visualisation
}

// ── Tab 2 — Address Translation ───────────────────────────────────────────────
export interface TranslationState {
  pageSize: 4 | 8 | 16 | 32;
  virtualAddress: number;
  frameTable: (number | null)[];  // index = page number, value = frame number
  stage: "idle" | "split" | "lookup" | "assemble" | "highlight";
  totalFrames: number;
}

// ── Tab 3 — TLB ───────────────────────────────────────────────────────────────
export interface TLBEntry {
  vpn: number;
  pfn: number;
  valid: boolean;
}

export interface TLBAccessResult {
  vpn: number;
  hit: boolean;
  pfn: number | null;
}

export interface TLBState {
  capacity: 2 | 4 | 8;
  entries: TLBEntry[];
  pageTable: (number | null)[];
  accessLog: TLBAccessResult[];
  currentStep: number;
  referenceString: number[];
  hits: number;
  misses: number;
}

// ── Tab 4 — Page Table ────────────────────────────────────────────────────────
export interface PageTableEntry {
  frameNumber: number | null;
  valid: boolean;
  dirty: boolean;
  r: boolean;   // read
  w: boolean;   // write
  x: boolean;   // execute
}

// ─── Full Store ───────────────────────────────────────────────────────────────

interface PagingStore {
  activeTab: PagingTab;
  setActiveTab: (t: PagingTab) => void;

  // ── Replacement (Tab 1 — built first) ──
  refString: number[];
  frameCount: 2 | 3 | 4;
  replacementAlgo: ReplacementAlgo;
  frames: FrameState[];
  history: AccessResult[];
  currentStep: number;        // index into refString being processed
  isPlaying: boolean;
  speed: 1 | 2 | 4;
  faults: number;
  hits: number;

  setRefString: (s: number[]) => void;
  setFrameCount: (n: 2 | 3 | 4) => void;
  setReplacementAlgo: (a: ReplacementAlgo) => void;
  setSpeed: (s: 1 | 2 | 4) => void;
  stepForward: () => void;
  togglePlay: () => void;
  resetReplacement: () => void;

  // ── Translation (Tab 2) ──
  translation: TranslationState;
  setPageSize: (ps: 4 | 8 | 16 | 32) => void;
  setVirtualAddress: (va: number) => void;
  advanceTranslationStage: () => void;
  resetTranslation: () => void;

  // ── TLB (Tab 3) ──
  tlb: TLBState;
  setTLBCapacity: (c: 2 | 4 | 8) => void;
  stepTLB: () => void;
  resetTLB: () => void;

  // ── Page Table (Tab 4) ──
  pageTableEntries: PageTableEntry[];
  selectedPage: number | null;
  togglePageValid: (page: number) => void;
  selectPage: (page: number | null) => void;
  resetPageTable: () => void;
}

// ─── Algorithm Implementations ────────────────────────────────────────────────

function runFIFO(frames: (number | null)[], page: number): {
  newFrames: (number | null)[];
  evicted: number | null;
  fault: boolean;
  fifoQueue: (number | null)[];
} {
  if (frames.includes(page)) return { newFrames: [...frames], evicted: null, fault: false, fifoQueue: frames };
  const emptyIdx = frames.indexOf(null);
  if (emptyIdx !== -1) {
    const nf = [...frames];
    nf[emptyIdx] = page;
    return { newFrames: nf, evicted: null, fault: true, fifoQueue: nf };
  }
  // evict oldest (index 0 in FIFO order — tracked via the frames array order)
  const evicted = frames[0]!;
  const nf = [...frames.slice(1), page];
  return { newFrames: nf, evicted, fault: true, fifoQueue: nf };
}

function runLRU(
  frames: (number | null)[],
  page: number,
  history: number[]   // pages accessed so far, oldest first
): { newFrames: (number | null)[]; evicted: number | null; fault: boolean } {
  if (frames.includes(page)) return { newFrames: [...frames], evicted: null, fault: false };
  const emptyIdx = frames.indexOf(null);
  if (emptyIdx !== -1) {
    const nf = [...frames];
    nf[emptyIdx] = page;
    return { newFrames: nf, evicted: null, fault: true };
  }
  // Find LRU: page whose last use is furthest in the past
  let lruPage = frames[0]!;
  let lruTime = -1;
  for (const f of frames) {
    const lastUse = history.lastIndexOf(f!);
    if (lastUse > lruTime) { lruTime = lastUse; }
  }
  // Actually find the one with smallest lastIndexOf
  let minTime = Infinity;
  for (const f of frames) {
    const t = history.lastIndexOf(f!);
    if (t < minTime) { minTime = t; lruPage = f!; }
  }
  const nf = [...frames];
  nf[nf.indexOf(lruPage)] = page;
  return { newFrames: nf, evicted: lruPage, fault: true };
}

function runOptimal(
  frames: (number | null)[],
  page: number,
  future: number[]   // remaining pages to be accessed
): { newFrames: (number | null)[]; evicted: number | null; fault: boolean } {
  if (frames.includes(page)) return { newFrames: [...frames], evicted: null, fault: false };
  const emptyIdx = frames.indexOf(null);
  if (emptyIdx !== -1) {
    const nf = [...frames];
    nf[emptyIdx] = page;
    return { newFrames: nf, evicted: null, fault: true };
  }
  // Evict the page that won't be used for longest (or never used)
  let evictPage = frames[0]!;
  let maxDist = -1;
  for (const f of frames) {
    const nextUse = future.indexOf(f!);
    const dist = nextUse === -1 ? Infinity : nextUse;
    if (dist > maxDist) { maxDist = dist; evictPage = f!; }
  }
  const nf = [...frames];
  nf[nf.indexOf(evictPage)] = page;
  return { newFrames: nf, evicted: evictPage, fault: true };
}

function runClock(
  frames: (number | null)[],
  clockBits: number[],
  clockHand: number,
  page: number
): {
  newFrames: (number | null)[];
  newBits: number[];
  newHand: number;
  evicted: number | null;
  fault: boolean;
} {
  if (frames.includes(page)) {
    const idx = frames.indexOf(page);
    const newBits = [...clockBits];
    newBits[idx] = 1;
    return { newFrames: [...frames], newBits, newHand: clockHand, evicted: null, fault: false };
  }
  const emptyIdx = frames.indexOf(null);
  if (emptyIdx !== -1) {
    const nf = [...frames]; nf[emptyIdx] = page;
    const nb = [...clockBits]; nb[emptyIdx] = 1;
    return { newFrames: nf, newBits: nb, newHand: (emptyIdx + 1) % frames.length, evicted: null, fault: true };
  }
  // Sweep hand until we find bit=0
  let hand = clockHand;
  const nf = [...frames];
  const nb = [...clockBits];
  while (nb[hand] === 1) { nb[hand] = 0; hand = (hand + 1) % frames.length; }
  const evicted = nf[hand];
  nf[hand] = page;
  nb[hand] = 1;
  return { newFrames: nf, newBits: nb, newHand: (hand + 1) % frames.length, evicted: evicted!, fault: true };
}

// ─── Initial states ───────────────────────────────────────────────────────────

const DEFAULT_REF = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
const FRAME_COUNT = 3;

function makeFrames(n: number): FrameState[] {
  return Array.from({ length: n }, () => ({ page: null, clockBit: 0, justLoaded: false, justEvicted: false }));
}

function makePageTableEntries(n = 16): PageTableEntry[] {
  const frames = [0, 3, 1, null, 7, null, 2, null, 5, null, 4, null, null, 6, null, null];
  return Array.from({ length: n }, (_, i) => ({
    frameNumber: frames[i] ?? null,
    valid: frames[i] != null,
    dirty: Math.random() > 0.7,
    r: true,
    w: i < 8,
    x: i < 4,
  }));
}

function makeTranslationFrameTable(pageSize: number): (number | null)[] {
  const pages = 32 / pageSize;
  return Array.from({ length: pages }, (_, i) => (i < pages / 2 ? i * 2 : null));
}

function makeTLBState(capacity: 2 | 4 | 8): TLBState {
  return {
    capacity,
    entries: [],
    pageTable: Array.from({ length: 16 }, (_, i) => (i % 3 === 0 ? null : i * 2)),
    accessLog: [],
    currentStep: 0,
    referenceString: [2, 5, 1, 3, 2, 7, 5, 1, 2, 3],
    hits: 0,
    misses: 0,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePaging = create<PagingStore>((set, get) => ({
  activeTab: "replacement",
  setActiveTab: (activeTab) => set({ activeTab }),

  // ── Replacement state ──
  refString: DEFAULT_REF,
  frameCount: FRAME_COUNT,
  replacementAlgo: "FIFO",
  frames: makeFrames(FRAME_COUNT),
  history: [],
  currentStep: 0,
  isPlaying: false,
  speed: 1,
  faults: 0,
  hits: 0,

  setRefString: (refString) =>
    set({ refString, frames: makeFrames(get().frameCount), history: [], currentStep: 0, faults: 0, hits: 0 }),

  setFrameCount: (frameCount) =>
    set({ frameCount, frames: makeFrames(frameCount), history: [], currentStep: 0, faults: 0, hits: 0 }),

  setReplacementAlgo: (replacementAlgo) =>
    set({ replacementAlgo, frames: makeFrames(get().frameCount), history: [], currentStep: 0, faults: 0, hits: 0 }),

  setSpeed: (speed) => set({ speed }),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  resetReplacement: () =>
    set((s) => ({
      frames: makeFrames(s.frameCount),
      history: [],
      currentStep: 0,
      isPlaying: false,
      faults: 0,
      hits: 0,
    })),

  stepForward: () => {
    const s = get();
    if (s.currentStep >= s.refString.length) {
      set({ isPlaying: false });
      return;
    }
    const page = s.refString[s.currentStep];
    const currentFramePages = s.frames.map((f) => f.page);
    let newFramePages: (number | null)[] = [...currentFramePages];
    let evicted: number | null = null;
    let fault = false;
    let newClockBits = s.frames.map((f) => f.clockBit);
    let newClockHand = (s.history[s.history.length - 1] as any)?.clockHand ?? 0;

    if (s.replacementAlgo === "FIFO") {
      const r = runFIFO(currentFramePages, page);
      newFramePages = r.newFrames; evicted = r.evicted; fault = r.fault;
    } else if (s.replacementAlgo === "LRU") {
      const pastPages = s.history.map((h) => h.page);
      const r = runLRU(currentFramePages, page, pastPages);
      newFramePages = r.newFrames; evicted = r.evicted; fault = r.fault;
    } else if (s.replacementAlgo === "OPTIMAL") {
      const future = s.refString.slice(s.currentStep + 1);
      const r = runOptimal(currentFramePages, page, future);
      newFramePages = r.newFrames; evicted = r.evicted; fault = r.fault;
    } else if (s.replacementAlgo === "CLOCK") {
      const r = runClock(currentFramePages, newClockBits, newClockHand, page);
      newFramePages = r.newFrames; newClockBits = r.newBits;
      newClockHand = r.newHand; evicted = r.evicted; fault = r.fault;
    }

    const newFrames: FrameState[] = newFramePages.map((p, i) => ({
      page: p,
      clockBit: newClockBits[i],
      justLoaded: p === page && fault,
      justEvicted: false,
    }));

    const result: AccessResult = {
      page,
      fault,
      evicted,
      frameSnapshot: newFramePages,
      clockHand: newClockHand,
    };

    set({
      frames: newFrames,
      history: [...s.history, result],
      currentStep: s.currentStep + 1,
      faults: s.faults + (fault ? 1 : 0),
      hits: s.hits + (fault ? 0 : 1),
    });
  },

  // ── Translation state ──
  translation: {
    pageSize: 4,
    virtualAddress: 13,
    frameTable: makeTranslationFrameTable(4),
    stage: "idle",
    totalFrames: 8,
  },

  setPageSize: (pageSize) =>
    set((s) => ({
      translation: {
        ...s.translation,
        pageSize,
        virtualAddress: 0,
        frameTable: makeTranslationFrameTable(pageSize),
        stage: "idle",
      },
    })),

  setVirtualAddress: (va) =>
    set((s) => ({ translation: { ...s.translation, virtualAddress: va, stage: "idle" } })),

  advanceTranslationStage: () =>
    set((s) => {
      const stages: TranslationState["stage"][] = ["idle", "split", "lookup", "assemble", "highlight"];
      const cur = stages.indexOf(s.translation.stage);
      const next = cur < stages.length - 1 ? stages[cur + 1] : "idle";
      return { translation: { ...s.translation, stage: next } };
    }),

  resetTranslation: () =>
    set((s) => ({ translation: { ...s.translation, stage: "idle", virtualAddress: 0 } })),

  // ── TLB state ──
  tlb: makeTLBState(4),

  setTLBCapacity: (capacity) =>
    set({ tlb: makeTLBState(capacity) }),

  stepTLB: () =>
    set((s) => {
      const { tlb } = s;
      if (tlb.currentStep >= tlb.referenceString.length) return {};
      const vpn = tlb.referenceString[tlb.currentStep];
      const tlbHit = tlb.entries.find((e) => e.valid && e.vpn === vpn);
      let hit = false;
      let pfn: number | null = null;
      let newEntries = [...tlb.entries];

      if (tlbHit) {
        hit = true;
        pfn = tlbHit.pfn;
      } else {
        pfn = tlb.pageTable[vpn] ?? null;
        if (pfn !== null) {
          const newEntry: TLBEntry = { vpn, pfn, valid: true };
          if (newEntries.length >= tlb.capacity) {
            newEntries = [...newEntries.slice(1), newEntry]; // FIFO eviction
          } else {
            newEntries = [...newEntries, newEntry];
          }
        }
      }

      return {
        tlb: {
          ...tlb,
          entries: newEntries,
          currentStep: tlb.currentStep + 1,
          accessLog: [...tlb.accessLog, { vpn, hit, pfn }],
          hits: tlb.hits + (hit ? 1 : 0),
          misses: tlb.misses + (hit ? 0 : 1),
        },
      };
    }),

  resetTLB: () => set((s) => ({ tlb: makeTLBState(s.tlb.capacity) })),

  // ── Page Table state ──
  pageTableEntries: makePageTableEntries(),
  selectedPage: null,

  togglePageValid: (page) =>
    set((s) => ({
      pageTableEntries: s.pageTableEntries.map((e, i) =>
        i === page ? { ...e, valid: !e.valid } : e
      ),
    })),

  selectPage: (page) => set({ selectedPage: page }),

  resetPageTable: () => set({ pageTableEntries: makePageTableEntries(), selectedPage: null }),
}));
