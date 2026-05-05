<div align="center">

<br />

```
 ██████╗ ███████╗       ██████╗ ██████╗  ██████╗
██╔═══██╗██╔════╝      ██╔══██╗██╔══██╗██╔═══██╗
██║   ██║███████╗█████╗██████╔╝██████╔╝██║   ██║
██║   ██║╚════██║╚════╝██╔═══╝ ██╔══██╗██║   ██║
╚██████╔╝███████║      ██║     ██║  ██║╚██████╔╝
 ╚═════╝ ╚══════╝      ╚═╝     ╚═╝  ╚═╝ ╚═════╝
```

**An interactive Operating System concepts simulator built for learning, not just reading.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-5-orange?style=flat-square)](https://github.com/pmndrs/zustand)

<br />

</div>

---

## What is this?

OS-PRO is a browser-based simulator that makes Operating System concepts tangible. Instead of reading about how SCAN disk scheduling works or why semaphores exist, you watch them execute — step by step, at your own pace, with real numbers.

It covers the four pillars of any undergraduate OS course: **CPU scheduling**, **memory management**, **concurrency**, and **disk I/O** — each as a fully interactive module with its own visualisations, controls, and performance metrics.

Built as a learning tool first. Every design decision — the step mode, the colour coding, the inline explanations — exists to make the concept click, not just look impressive.

---

## Modules

### CPU Scheduling

Five scheduling algorithms with a live Gantt chart and real-time metrics. Processes arrive, compete for CPU time, and complete — exactly as they would in a real kernel.

| Algorithm | Type | Key characteristic |
|-----------|------|--------------------|
| FCFS | Non-preemptive | First arrived, first served — simple but can cause convoy effect |
| SJF | Non-preemptive | Shortest burst time wins — optimal average wait, but needs future knowledge |
| SRTF | Preemptive | Preempts running process if a shorter job arrives |
| Round Robin | Preemptive | Fixed time quantum, fair rotation — the basis of most real schedulers |
| Priority | Preemptive | Lower number = higher priority, with arrival time as tiebreaker |

Add processes with custom arrival time, burst time, and priority. The Gantt chart scrolls as the simulation runs, showing exactly which process ran at each tick. Waiting time, turnaround time, and CPU utilisation are computed from actual simulation history — not hardcoded.

---

### Memory / Paging

Four sub-tabs that build on each other conceptually.

**Page Replacement** — The most visual tab. Set a reference string and watch FIFO, LRU, Optimal, or Clock manage a fixed number of frames. A Gantt-style timeline shows every frame at every tick. Fault rate and hit rate update live. Three presets demonstrate classic scenarios: locality of reference, thrashing, and balanced access patterns.

**Address Translation** — Step through how a virtual address becomes a physical one. The binary representation of the address splits into `[page number | offset]` with colour highlighting, the page table row lights up on lookup, and the physical frame glows in the memory grid. Supports 4B, 8B, 16B, and 32B page sizes. Page faults shown explicitly when a page is unmapped.

**TLB Simulation** — Demonstrates why the Translation Lookaside Buffer exists. Watch the TLB fill up as accesses repeat, observe hits (green) vs misses (red), and see the Effective Access Time drop as the hit rate climbs. TLB size is configurable: 2, 4, or 8 entries.

**Page Table** — A full 16-entry page table with valid, dirty, and RWX permission columns. Click any row to inspect it. Toggle valid bits to simulate page faults. Physical memory frames update in real time to reflect which are occupied.

---

### Concurrency

Four tabs that cover synchronisation from first principles to deadlock resolution.

**Mutex** — One thread holds the lock, all others queue. Watch threads transition from READY → BLOCKED → IN CS → DONE. The lock display shows who holds it and for how long. Manual controls let you request and release the lock yourself; auto mode steps through automatically.

**Semaphore** — A counting semaphore with configurable capacity (1, 2, or 3 slots). `wait()` decrements the counter and blocks if zero; `signal()` increments it and unblocks the next waiting thread. Unlike a mutex, multiple threads can hold it simultaneously — the slot gauge makes this visually obvious.

**Dining Philosophers** — The classic deadlock illustration. Five philosophers at a round table, each needing two forks to eat. The SVG visualisation shows their state (thinking / hungry / eating) in real time. If all five pick up their left fork simultaneously, deadlock is detected and flagged immediately.

**Deadlock Detector** — A preloaded scenario with processes, resources, allocations, and a Resource Allocation Graph. Click **Run Banker's Algorithm** to check if the system is in a safe state. If a safe sequence exists it is shown step by step; if not, the deadlock cycle is highlighted and you can terminate individual processes to break it.

---

### Disk Scheduling

**Seek Visualiser** — Six algorithms on a live SVG chart where X is cylinder number and Y is time. The head path draws itself as the simulation runs. SCAN and LOOK support direction toggle (up/down). Presets cover classic textbook examples, spread requests, and clustered access patterns. You can also type in a custom queue and head position.

| Algorithm | Behaviour |
|-----------|-----------|
| FCFS | Requests served in arrival order — simple baseline |
| SSTF | Always serves the closest pending request — risk of starvation |
| SCAN | Sweeps back and forth, servicing requests like an elevator |
| C-SCAN | One-directional sweep, jumps back to start — more uniform wait |
| LOOK | Like SCAN but reverses at the last request, not the disk boundary |
| C-LOOK | Like C-SCAN but reverses at last request — most balanced in practice |

**Algorithm Comparison** — Runs all six algorithms on the same queue simultaneously and renders a sorted bar chart of total seek distance. Shows savings vs FCFS, average seek per request, and a full side-by-side service order table. Click any result to jump straight to that algorithm in the visualiser.

---

## Getting started

**Prerequisites:** Node.js 18 or later, npm.

```bash
# Clone the repository
git clone https://github.com/Vivek-ray-05/dem_os.git
cd dem_os

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects automatically to the CPU scheduling module.

```bash
# Production build
npm run build
npm start
```

---

## Project structure

```
dem_os/
├── app/
│   ├── layout.tsx              # Shared sidebar + shell
│   ├── page.tsx                # Redirect → /scheduling
│   ├── scheduling/page.tsx     # CPU scheduling module
│   ├── paging/page.tsx         # Memory / paging module
│   ├── sync/page.tsx           # Concurrency module
│   └── disk/page.tsx           # Disk scheduling module
│
├── components/
│   ├── scheduling/             # Gantt chart, process list, stats, logs
│   ├── paging/                 # Page replacement, translation, TLB, page table
│   ├── concurrency/            # Mutex, semaphore, dining, deadlock
│   ├── disk/                   # Seek visualiser, comparison chart
│   └── shared/                 # SectionCard, NavLink
│
└── store/
    ├── useSimulation.ts        # CPU scheduling state + algorithms
    ├── usePaging.ts            # Paging state + algorithms
    ├── useConcurrency.ts       # Concurrency state + algorithms
    └── useDisk.ts              # Disk scheduling state + algorithms
```

Each module is a self-contained route. The store for each module lives in `store/` and handles all algorithm logic — the components are purely visual. Adding a new module means adding a route, a store, and a components folder without touching anything else.

---

## Tech stack

| | |
|---|---|
| **Framework** | Next.js 16 with App Router |
| **UI** | React 19, Tailwind CSS 4 |
| **State** | Zustand 5 — one store per module, no prop drilling |
| **Animations** | Framer Motion, CSS transitions, SVG animations |
| **Icons** | Lucide React |
| **Language** | TypeScript throughout |

No backend. No database. Everything runs in the browser.

---

## Algorithms implemented

**CPU Scheduling** — FCFS, SJF, SRTF, Round Robin, Priority (preemptive)

**Page Replacement** — FIFO, LRU, Optimal (Bélády's), Clock (second-chance)

**Address Translation** — Single-level page table, configurable page size, TLB with FIFO eviction

**Disk Scheduling** — FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK

**Concurrency** — Mutex with blocking queue, counting semaphore, Dining Philosophers, Banker's Algorithm (deadlock detection + safe sequence)

---

## Textbook reference

The algorithms and terminology follow **Operating System Concepts** (10th edition) by Abraham Silberschatz, Peter Baer Galvin, and Greg Gagne — the standard undergraduate OS textbook. The test cases in the scheduling and disk modules match the worked examples from that book, so you can verify the output against the solutions manually.

---

## Contributing

The codebase is structured to make adding new simulations straightforward:

1. Create `store/useNewModule.ts` with your state and algorithm implementations
2. Create `components/newModule/` with your visualisation components
3. Add the route at `app/newModule/page.tsx`
4. Add the nav link in `app/layout.tsx`

Each module is isolated — there is no shared state between them, so you cannot break an existing module while building a new one.

---

## License

MIT — use it, fork it, build on it.

---

<div align="center">
<br />
<p>Built with the goal of making OS concepts less abstract.</p>
<p><sub>Next.js · React · TypeScript · Tailwind · Zustand</sub></p>
</div>
