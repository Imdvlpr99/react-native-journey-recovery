# Docs Website Full Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the docs website to be minimalist, professional, and learner-friendly — single accent color, unified type scale, cleaned-up landing page, consistent component aesthetics.

**Architecture:** No routing, state, or structural changes. All work is visual: CSS token system → component-by-component pass → landing page full rewrite. Each task is independently shippable. The `ArchitectureVisualizer` and `StorageComparison` component internals are untouched; only their wrapper section styling in `App.tsx` is adjusted.

**Tech Stack:** React 18, TypeScript strict, Tailwind CSS v4, Plus Jakarta Sans + JetBrains Mono fonts.

**Spec:** `docs/superpowers/specs/2026-11-13-docs-website-redesign-design.md` *(approved in conversation 2026-11-13)*

## Global Constraints

- No new npm dependencies
- No routing, hash logic, or functional changes
- Dark + light theme must both pass visual inspection
- Mobile responsive layout must be preserved
- `ArchitectureVisualizer.tsx` and `StorageComparison.tsx` internals untouched
- Accent color: sky only (`sky-500` / `sky-400` dark, `sky-600` light) — no emerald/indigo/amber/rose on decorative elements
- Icon cards: single slate-tinted neutral background (`slate-100 dark:bg-slate-800`) — not multicolor
- Type scale (4 levels): `display` (hero h1 ~4xl-6xl), `heading` (section h2 ~2xl-3xl), `subhead` (card h3/h4 ~sm-base), `caption` (labels/badges ~xs-[11px])

## Review Focus

- **Dark + light parity** — Every new class must have a `dark:` counterpart; a card that looks clean in dark may lose contrast in light. Visual check both modes after each task.
- **Mobile sidebar + landing overlap** — The landing page hero and the sidebar drawer share z-index territory on small screens; ensure new spacing does not clip overlapping elements.
- **Code block readability** — `CodeBlock.tsx` and `SyntaxHighlighter.tsx` are not modified, but new surrounding backgrounds (lighter slate surfaces) may reduce code block contrast; spot-check after `index.css` changes.
- **Active-state legibility** — Navbar tab, Sidebar item, and TOC item active colors must remain distinguishable from hover states after the accent unification.
- **Footer badge color** — The emerald `100% Test Coverage` badge in `Footer.tsx` is intentionally kept (it is a semantic status badge, not a decorative accent); only purely decorative multicolor uses are replaced.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `website/src/index.css` | Modify | CSS token system: type scale vars, tighten existing tokens |
| `website/src/components/Navbar.tsx` | Modify | Cleaner tab pill, remove inline size jank |
| `website/src/components/Sidebar.tsx` | Modify | Remove collapse chevrons, always-open groups, tighter headers |
| `website/src/components/Hero.tsx` | Modify | Strip redundant install CTA, simplify to breadcrumb + title + description only |
| `website/src/components/Sections.tsx` | Modify | Unified slate icon card backgrounds, type scale rhythm |
| `website/src/components/Footer.tsx` | Modify | Remove heavy grid, simplify to 2-col brand + links layout |
| `website/src/components/TableOfContents.tsx` | Modify | Minor: tighter spacing, remove scroll-top button (use footer) |
| `website/src/App.tsx` | Modify | Remove `<Hero />` from docs view; tighten architecture/storage section headers |
| `website/src/components/LandingPage.tsx` | Modify | Full rewrite: Hero → 3-Step Walkthrough → Feature grid (remove Gateways section) |

---

### Task 1: CSS Token System (`index.css`)

**Files:**
- Modify: `website/src/index.css`

**Interfaces:**
- Produces: CSS custom properties `--type-display`, `--type-heading`, `--type-subhead`, `--type-caption`, `--type-mono` consumed by later tasks as Tailwind class references (not direct var usage — the vars document intent, classes implement them)

- [ ] **Step 1: Add type scale documentation comment block**

Add after the existing `@theme` block, before `:root`:
```css
/*
  Type Scale (4 levels — use these Tailwind classes, not arbitrary sizes):
  display  → text-4xl sm:text-6xl  (hero headline)
  heading  → text-2xl sm:text-3xl  (section h2)
  subhead  → text-sm font-semibold  (card h3, step labels)
  caption  → text-xs               (badges, breadcrumbs, helper text)
  mono     → font-mono text-xs     (code labels, kbd, install commands)
*/
```

- [ ] **Step 2: Remove the multicolor token-* classes, replace with a single neutral set**

In `index.css`, the `.token-*` classes currently use rose/green/sky/fbbf24/a78bfa. Keep them unchanged — they are syntax-highlight tokens, not decorative palette. No edit needed here.

- [ ] **Step 3: Add a smooth `section-enter` animation utility**

After the existing `@keyframes fadeIn` block:
```css
@keyframes sectionEnter {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.section-enter {
  animation: sectionEnter 240ms ease-out forwards;
}
```

- [ ] **Step 4: Tighten scrollbar to match new minimal aesthetic**

Change existing `::-webkit-scrollbar` width from `6px` to `4px`; leave all other scrollbar rules as-is.

- [ ] **Step 5: Build check**

Run: `npm run build --prefix website`
Expected: build completes with no errors (CSS changes are additive).

- [ ] **Step 6: Commit**

```bash
git add website/src/index.css
git commit -m "style: add type scale comment, section-enter animation, tighten scrollbar"
```

---

### Task 2: Navbar Refinement (`Navbar.tsx`)

**Files:**
- Modify: `website/src/components/Navbar.tsx`

**Interfaces:**
- Consumes: nothing new from Task 1
- Produces: visually cleaner tab group; no prop signature changes

- [ ] **Step 1: Simplify the center nav pill container**

Replace the existing center `<nav>` className:
```
bg-slate-100/70 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/70 dark:border-slate-800/70
```
With:
```
p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50
```

- [ ] **Step 2: Unify all 4 tab button classNames to a single conditional pattern**

Each tab button currently has duplicated long className strings. Consolidate to:
- inactive: `px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 flex items-center gap-1.5`
- active: add `bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-sm`

- [ ] **Step 3: Remove the mobile menu dropdown — replace with bottom sheet style**

The existing `mobileMenuOpen` dropdown div uses `shadow-lg`. Change to:
```
border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090b10]/95 backdrop-blur-sm px-4 py-3 space-y-0.5
```
No structural changes — only the wrapper className.

- [ ] **Step 4: Build check**

Run: `npm run build --prefix website`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add website/src/components/Navbar.tsx
git commit -m "style: simplify navbar tab pill, unify active state classes"
```

---

### Task 3: Sidebar Refinement (`Sidebar.tsx`)

**Files:**
- Modify: `website/src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: always-open group nav (remove collapse state), cleaner group headers

- [ ] **Step 1: Remove collapse state**

Delete: `const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});`
Delete: `const toggleGroup = (title: string) => { ... };`
Delete: `const isCollapsed = collapsedGroups[group.title] && term === '';`

Replace the group `<button>` collapse toggle with a plain `<div>`:
```tsx
<div className="w-full flex items-center gap-2 py-1 text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
  <span className="text-slate-300 dark:text-slate-700">{group.icon}</span>
  <span>{group.title}</span>
</div>
```

- [ ] **Step 2: Remove the chevron imports**

Remove `IconChevronDown` and `IconChevronRight` from the import statement (they are no longer used in this file after Step 1).

- [ ] **Step 3: Tighten the filter input border**

Change:
```
rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60
```
to:
```
rounded-md border border-slate-200/80 dark:border-slate-800/60 bg-transparent focus-within:border-sky-500/60
```

- [ ] **Step 4: Tighten active item highlight**

Change active item class from `bg-sky-50 text-sky-700 font-semibold dark:bg-sky-950/40 dark:text-sky-300` to:
`text-sky-600 dark:text-sky-400 font-semibold bg-sky-50/60 dark:bg-sky-950/30`

- [ ] **Step 5: Build check**

Run: `npm run build --prefix website`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add website/src/components/Sidebar.tsx
git commit -m "style: remove sidebar collapse, clean group headers and active state"
```

---

### Task 4: Hero Simplification (`Hero.tsx`)

**Files:**
- Modify: `website/src/components/Hero.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: simplified docs-page header — breadcrumb + title + description only; no install CTA (redundant with landing page)

- [ ] **Step 1: Remove install CTA state and handler**

Delete: `const [copied, setCopied] = useState(false);`
Delete: `const installCmd = ...;`
Delete: `const handleCopyInstall = async () => { ... };`

- [ ] **Step 2: Remove the install button JSX block**

Delete the entire `<button type="button" onClick={handleCopyInstall} ...>` block (lines 50–65 in current file).

- [ ] **Step 3: Remove the Quickstart jump button and Architecture link**

Delete the remaining two `<button>` and `<a>` elements in the quick action bar div. Delete the outer wrapper div `flex flex-wrap items-center gap-3 pt-1` entirely.

- [ ] **Step 4: Remove unused icon imports**

Update import to: `import { IconCopy, IconCheck } from './Icons';` → remove entirely since neither is used now.
New import line: *(no imports needed from Icons)*. Remove the entire `import { ... } from './Icons';` line.

- [ ] **Step 5: Tighten the outer wrapper spacing**

Change: `className="space-y-5 pb-8 border-b border-slate-200/80 dark:border-slate-800/80"`
To: `className="space-y-3 pb-8 border-b border-slate-200/60 dark:border-slate-800/60"`

- [ ] **Step 6: Update the breadcrumb to match the new caption type scale**

Change version pill span className to: `text-xs font-mono text-slate-400 dark:text-slate-500 bg-transparent border-none p-0`
Remove the border and background from the version pill entirely — just render: `<span className="text-xs font-mono text-slate-400 dark:text-slate-500">v0.1.0 · Zero Native Deps</span>`

- [ ] **Step 7: Build check**

Run: `npm run build --prefix website`
Expected: no type errors (all removed state/handlers were internal).

- [ ] **Step 8: Commit**

```bash
git add website/src/components/Hero.tsx
git commit -m "style: strip redundant install CTA from docs Hero, simplify to breadcrumb+title"
```

---

### Task 5: Remove Hero from Docs View + Tighten Section Headers (`App.tsx`)

**Files:**
- Modify: `website/src/App.tsx`

**Interfaces:**
- Consumes: Task 4 (Hero simplified)
- Produces: docs view without redundant Hero; architecture/storage section headers using consistent type scale

- [ ] **Step 1: Remove `<Hero />` from the docs main column**

In the docs view `<main>` block, delete `<Hero />` (line 179 in current file).
Leave `<Sections />` as the first child.

- [ ] **Step 2: Tighten architecture section header**

Replace the architecture section header div (lines 198–206 current) with:
```tsx
<div className="space-y-1 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">Engine Deep Dive</p>
  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
    Recovery Pipeline &amp; Mutex Queue
  </h1>
  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
    Trace how user input flows from React hooks through the Promise FIFO mutex queue, checksum serializer, and storage adapters to flash storage.
  </p>
</div>
```

- [ ] **Step 3: Tighten storage section header**

Apply identical wrapper pattern to the storage section header (lines 216–223 current):
```tsx
<div className="space-y-1 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">Benchmarks &amp; Sizing</p>
  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
    Storage Adapter Decision Matrix
  </h1>
  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
    Compare write latency, memory usage, and security across MMKV, SecureStore, and AsyncStorage with an interactive flash write calculator.
  </p>
</div>
```

- [ ] **Step 4: Remove `Hero` import**

Delete: `import { Hero } from './components/Hero';` from App.tsx imports.

- [ ] **Step 5: Build check**

Run: `npm run build --prefix website`
Expected: no errors (Hero is still exported from its file, just not imported here).

- [ ] **Step 6: Commit**

```bash
git add website/src/App.tsx
git commit -m "style: remove redundant Hero from docs view, tighten section headers"
```

---

### Task 6: Sections Typography + Icon Card Unification (`Sections.tsx`)

**Files:**
- Modify: `website/src/components/Sections.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: all doc sections using consistent heading/body/caption type scale; icon card backgrounds unified to slate-only

- [ ] **Step 1: Global replace multicolor icon card backgrounds**

Using replace_all, change every occurrence of:
- `bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400` → keep (this is already neutral)
- `bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400` → `bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400`
- `bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400` → `bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400`
- `bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400` → `bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400`

Exception: keep `text-sky-600 dark:text-sky-400` on the sky-tinted cards (the first card in each grid) — sky is the single allowed accent.

- [ ] **Step 2: Unify section h2 heading sizes**

Replace all `text-2xl md:text-3xl font-extrabold` with `text-2xl sm:text-3xl font-bold tracking-tight` for consistent heading scale.

- [ ] **Step 3: Unify warning/callout border to use accent**

The amber callout (`border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20`) is semantic (warning). Keep it — this is not a decorative accent, it is a status color.

- [ ] **Step 4: Add `section-enter` animation class to each top-level `<section>` element**

Add `section-enter` class (from Task 1) to the outer `<section>` wrapper of each doc section. Example: `<section id="overview" className="doc-section scroll-mt-24 mb-16 section-enter">`.

- [ ] **Step 5: Build check**

Run: `npm run build --prefix website`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add website/src/components/Sections.tsx
git commit -m "style: unify icon card colors to slate, consistent heading scale, section-enter animation"
```

---

### Task 7: Footer Simplification (`Footer.tsx`)

**Files:**
- Modify: `website/src/components/Footer.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: lighter footer — 2-column layout (brand + 3 nav columns), reduced visual weight

- [ ] **Step 1: Remove the heavy grid, replace with a simpler layout**

Replace the entire `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">` block with:
```tsx
<div className="flex flex-col md:flex-row gap-10 md:gap-16">
  {/* Brand — left */}
  <div className="shrink-0 max-w-xs space-y-3">
    <div className="flex items-center gap-2">
      <img src="./logo.png" alt="Logo" className="w-6 h-6 rounded-md object-contain" />
      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 tracking-tight">journey-recovery</span>
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
      Deterministic checkpoint recovery for React Native &amp; Expo. MIT License · TypeScript Strict.
    </p>
    <div className="flex gap-2">
      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-800">MIT</span>
      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20">100% Coverage</span>
    </div>
  </div>

  {/* Nav columns — right, flexible */}
  <div className="flex flex-wrap gap-10 flex-1">
    {/* Documentation column — keep existing links but remove h5 uppercase, use plain label */}
    {/* Architecture & Storage column — keep existing */}
    {/* Community column — keep existing */}
  </div>
</div>
```

Keep all `<ul>` link lists intact; only change the outer grid wrapper and brand block.

- [ ] **Step 2: Simplify column headers**

Replace `<h5 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-300">` with:
`<p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">`

- [ ] **Step 3: Tighten bottom bar**

Change: `pt-6 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500`
To: `pt-5 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-400 dark:text-slate-500`

- [ ] **Step 4: Build check**

Run: `npm run build --prefix website`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add website/src/components/Footer.tsx
git commit -m "style: simplify footer to 2-col brand + links layout, lighter visual weight"
```

---

### Task 8: TableOfContents Minor Pass (`TableOfContents.tsx`)

**Files:**
- Modify: `website/src/components/TableOfContents.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: tighter TOC, scroll-top button removed (now in footer)

- [ ] **Step 1: Remove the scroll-to-top button**

Delete: `const [showScrollTop, setShowScrollTop] = useState(false);`
Delete: the `useEffect` scroll listener for `showScrollTop`
Delete: the `scrollToTop` function
Delete: the `{showScrollTop && <button ...>}` JSX block

- [ ] **Step 2: Remove unused icon import**

Remove `IconArrowUp` from the import line (no longer used).

- [ ] **Step 3: Tighten the "On This Page" header**

Change: `font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 text-[11px]`
To: `text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3`

- [ ] **Step 4: Build check**

Run: `npm run build --prefix website`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add website/src/components/TableOfContents.tsx
git commit -m "style: remove scroll-top from TOC, tighten header label"
```

---

### Task 9: LandingPage Full Rewrite (`LandingPage.tsx`)

**Files:**
- Modify: `website/src/components/LandingPage.tsx`

**Interfaces:**
- Consumes: `ActiveTab` from `Navbar.tsx` (unchanged), `CodeBlock` from `CodeBlock.tsx` (unchanged), all Icons (subset)
- Produces: 3-section landing page: Hero → 3-Step Walkthrough → Feature grid

**New section structure:**
```
Hero
  ├── Badge pill (v0.1.0 · Zero Native Deps · Pure TypeScript)
  ├── Headline: "Deterministic state recovery for React Native & Expo."
  ├── Subheadline (1 sentence, max 120 chars)
  ├── Install bar (pkg manager tabs + copy button) — keep existing logic
  └── 2 CTAs: "Read the Docs" (primary) · "Engine Architecture" (ghost)

3-Step Walkthrough (keep existing logic, restyle)
  ├── Section label + h2
  ├── 3 step cards (left col 5) + code preview (right col 7)
  └── Adapter selector inside step 1 card

Feature Grid
  ├── 4 cards: Promise FIFO Mutex · FNV-1a Checksums · Field Privacy · Pluggable Adapters
  └── Single slate icon bg (no multicolor)
```

The "Gateways / Engine Deep Dives & Decision Frameworks" section is **removed**.

- [ ] **Step 1: Remove the Gateways section JSX**

Delete the entire `{/* ── GATEWAYS TO DEEP DIVES ── */}` section block (the final `<section>` in the current file, approximately lines 487–561).

- [ ] **Step 2: Rewrite the Hero section**

Replace the existing `{/* ── HERO ── */}` section with:
```tsx
<section className="pt-16 sm:pt-24 pb-8 flex flex-col items-center text-center">
  <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-7 flex flex-col items-center">

    {/* Badge */}
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">v0.1.0</span>
      <span className="text-slate-300 dark:text-slate-700">·</span>
      <span>Zero Native Dependencies</span>
      <span className="text-slate-300 dark:text-slate-700">·</span>
      <span>Pure TypeScript</span>
    </div>

    {/* Headline */}
    <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.06]">
      Deterministic state recovery<br className="hidden sm:block" /> for React Native &amp; Expo.
    </h1>

    {/* Sub-headline */}
    <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
      Checkpoint multi-screen flows, eliminate async write races with a Promise FIFO mutex, and restore in-flight progress after OS background kills.
    </p>

    {/* Install bar — keep existing pkgManager state + installCommands logic, just restyle wrapper */}
    <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] overflow-hidden shadow-sm">
      {/* pkg manager tab row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40">
        <span className="text-[11px] font-mono text-slate-400">$ install</span>
        <div className="flex items-center gap-0.5">
          {/* existing pkgManager buttons — restyle active: bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 rounded px-2 py-0.5 text-[11px] font-mono */}
        </div>
      </div>
      {/* command + copy button row */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <code className="text-xs sm:text-sm font-mono text-slate-700 dark:text-sky-300 truncate">
          {/* installCommands[pkgManager] */}
        </code>
        {/* existing copy button */}
      </div>
    </div>

    {/* CTAs */}
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onNavigate('docs', 'quickstart')}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-700 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-colors shadow-sm cursor-pointer"
      >
        Read the Docs
        <IconChevronRight size={14} />
      </button>
      <button
        type="button"
        onClick={() => onNavigate('architecture')}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
      >
        <IconLayers size={15} className="text-sky-500 dark:text-sky-400" />
        Engine Architecture
      </button>
    </div>
  </div>
</section>
```

Note: the `pkgManager` state, `installCommands`, and `handleCopyInstall` logic are kept verbatim from the existing file — only the JSX wrapper is restyled. Fill in the actual render expressions from the existing code.

- [ ] **Step 3: Restyle the 3-Step Walkthrough section header**

Replace:
```tsx
<div className="text-[11px] font-mono font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
  Interactive Walkthrough
</div>
<h2 className="text-2xl sm:text-3xl font-bold tracking-tight ...">
  How the engine works in 3 declarative steps
</h2>
```
With:
```tsx
<p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">Interactive Walkthrough</p>
<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
  How the engine works in 3 steps
</h2>
```

- [ ] **Step 4: Restyle step card active + inactive states**

Active card:
```
border-sky-400/60 dark:border-sky-500/40 bg-sky-50/40 dark:bg-slate-900 shadow-sm
```
Inactive card:
```
border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-slate-900/20 hover:border-slate-300 dark:hover:border-slate-700/80
```

Step number badge active: `bg-sky-500 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded`
Step number badge inactive: `bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-mono px-2 py-0.5 rounded`

- [ ] **Step 5: Rewrite the Feature Grid section (replace Core Pillars section)**

Replace the existing `{/* ── CORE PILLARS ── */}` section with a new feature grid placed *after* the walkthrough:
```tsx
<section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    {/* Card 1 — Promise FIFO Mutex */}
    <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center">
        <IconLock size={15} className="text-sky-500 dark:text-sky-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Promise FIFO Mutex</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Serializes rapid keystrokes into sequential writes. Never drops writes, eliminates async race conditions.</p>
    </div>

    {/* Card 2 — FNV-1a Checksums */}
    <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center">
        <IconShield size={15} className="text-slate-600 dark:text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">FNV-1a Checksums</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">32-bit deterministic hash verifies integrity before restoring. Rejects corrupted or truncated disk snapshots.</p>
    </div>

    {/* Card 3 — Field Privacy */}
    <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center">
        <IconZap size={15} className="text-slate-600 dark:text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Field-Level Privacy</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Declare sensitive fields like <code className="font-mono text-[11px]">password</code> or <code className="font-mono text-[11px]">cvv</code>. Stripped before serialization — never touches flash.</p>
    </div>

    {/* Card 4 — Pluggable Adapters */}
    <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center">
        <IconDatabase size={15} className="text-slate-600 dark:text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pluggable Adapters</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Native drivers for MMKV (C++ sync), Expo SecureStore (Hardware Keychain), and AsyncStorage.</p>
    </div>
  </div>
</section>
```

Note: `IconLock`, `IconShield`, `IconZap`, `IconDatabase` must be in the imports.

- [ ] **Step 6: Remove the `IconArrowUp` import if unused**

Check the import list in `LandingPage.tsx` — `IconArrowUp` was imported but only used in the removed Gateways section. Remove if unused.

- [ ] **Step 7: Build check**

Run: `npm run build --prefix website`
Expected: no TypeScript errors (all state/handlers preserved, only JSX restyled).

- [ ] **Step 8: Commit**

```bash
git add website/src/components/LandingPage.tsx
git commit -m "feat: rewrite landing page — minimal hero, 3-step walkthrough, feature grid, remove gateways section"
```

---

### Task 10: Visual QA + Dev Server Verification

**Files:** None modified.

**Interfaces:**
- Consumes: all previous tasks completed

- [ ] **Step 1: Start dev server**

Run: `npm run dev --prefix website`
Expected: Vite dev server starts on `http://localhost:5173` (or similar).

- [ ] **Step 2: Visual QA — dark mode**

Open browser. Check in order:
1. Home/Landing: hero headline visible, install bar functional, 3-step walkthrough switches correctly, feature grid cards uniform
2. Docs: no Hero block, sidebar always open with groups visible, TOC active indicator works on scroll
3. Architecture: section header matches new style
4. Storage: section header matches new style
5. Footer: 2-col layout, emerald Coverage badge present

- [ ] **Step 3: Visual QA — light mode**

Toggle theme. Repeat checks from Step 2. Specifically verify: code blocks still have sufficient contrast, active sidebar item readable, navbar tabs legible.

- [ ] **Step 4: Mobile QA**

Resize to 375px. Check: landing hero text wraps cleanly, install bar scrolls horizontally, mobile nav dropdown opens, sidebar drawer slides in.

- [ ] **Step 5: Final build**

Run: `npm run build --prefix website`
Expected: build succeeds, no warnings about unused imports or type errors.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: verified build and visual QA for docs website redesign"
```
