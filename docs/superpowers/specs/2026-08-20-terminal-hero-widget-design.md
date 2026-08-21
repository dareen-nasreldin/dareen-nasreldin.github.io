# Terminal Hero Widget — Design Spec

Date: 2026-08-20
Status: Approved for implementation

## 1. Background

`dareen.dev` is a static HTML/CSS/JS portfolio (no build tooling, no framework, no
package.json — deployed as-is, likely via GitHub Pages). Five placement variants of
a mock-PowerShell typewriter terminal were prototyped as standalone preview pages
(`preview-terminal-a.html` … `preview-terminal-e.html`, each on its own local port)
so they could be compared side by side:

- A — own full-width section after the hero
- B — small static widget pinned to the hero's bottom-right corner
- C — two-column About section (bio left, terminal right)
- D — terminal replaces the headline/subtitle as the hero's primary content
- E — small widget pinned to the hero's corner, made draggable

**E won.** This spec covers evolving E from "draggable decoration" into the real,
final feature: a small persistent terminal widget with drag-to-reposition,
scroll-persistent floating, expand/collapse with a soft blurred backdrop, resize,
and a real interactive command line with a curated command set.

Once this ships, variants A, C, D and their preview pages are deleted, and the
`size` branch of the shared component that only they used is removed (per the
original handoff's cleanup note).

## 2. Goals / Non-goals

**Goals:**
- Keep the widget's original identity: small, corner-anchored, non-intrusive —
  never blocks or replaces the existing hero content (headline, photo, CTA row).
- Let a visitor drag it anywhere; once dragged, it stays exactly where dropped as
  they scroll, instead of scrolling away with the hero.
- Give it a single obvious way back to its starting state (an ✕ control, and a
  matching `exit` command).
- Let a visitor type real commands and get real answers about Dareen, with `help`
  discoverable and auto-run the first time they engage.
- Let a visitor expand it for more room, with a soft visual separation from the
  page behind it (not a hard modal), and resize it once expanded.
- Preserve accessibility: full transcript available to screen readers as it
  changes, not just at mount time.

**Non-goals:**
- No persistence across page reloads (no localStorage/sessionStorage). Position,
  size, and interactive-session transcript are session-only, in-memory, and reset
  on reload — same as the rest of this static site.
- No mobile support for drag/expand/resize. Below 950px width the widget is
  hidden entirely, consistent with how the polaroid photo is already handled.
- No generic/pluggable command system. The 9 commands are hardcoded for this one
  site; this is not a reusable terminal-emulator library.
- No automated test suite (none exists in this repo). Verification is manual,
  via the browser tool, described in §8.

## 3. Architecture

Two small, separately-responsible scripts, replacing the single
`components/terminal-hero.js` prototype used by the 5 preview variants:

```
components/
  terminal-hero.js    — renders the window chrome + body; owns the typewriter
                         animation AND the interactive command engine (what's
                         INSIDE the window)
  terminal-widget.js   — owns drag, dock/float position, expand/collapse,
                         resize, and the reset control (how the window BEHAVES
                         on the page). Composes one terminal-hero instance.
  terminal-hero.css     — chrome styling (existing, extended for widget states)
```

Why split this way: `terminal-hero.js` alone is still exactly what variants A/C/D
needed (a static, non-interactive, non-draggable typewriter box) — it just also
now supports commands. `terminal-widget.js` is purely a window manager and has
no idea what a "command" is; it only knows about position/size/DOM. Each can be
understood, tested, and changed independently.

## 4. `terminal-hero.js` — engine additions

Keeps its existing `createTerminalHero(mountEl, opts)` signature and autoplay
typewriter behavior unchanged for non-interactive callers (none will remain
after cleanup, but the shape stays clean). Adds:

- `opts.commands`: a hardcoded lookup table, `{ name: (args) => outputLines[] }`,
  built specifically for this site (see §6).
- Returned handle gains two methods:
  - `enterInteractiveMode()` — cancels any pending autoplay timeout, appends a
    live `<input>`-backed prompt line, and immediately executes `help` as if
    the visitor had typed it.
  - `reset()` — tears down interactive state (removes the input, clears typed
    history) and restarts the autoplay script from line 0, exactly like first
    mount.
- Clicking anywhere in the terminal body (or focusing the prompt) triggers
  `enterInteractiveMode()` exactly once; subsequent clicks just refocus the
  existing input.
- Command dispatch on Enter: trim + case-insensitive match against the table.
  Unknown input prints:
  `'<input>' is not recognized as a command. Type 'help' to see available commands.`
- The screen-reader transcript (`.term-sr-only`, `aria-live="polite"`) switches
  behavior once interactive: instead of one upfront full-script dump, each new
  submitted command's output is appended to the live region as it's produced,
  so screen reader users hear new output as it happens rather than a wall of
  text up front.
- The typed `<input>` gets `aria-label="Terminal command input"` (it has no
  visible label — the blinking cursor is purely decorative once real input is
  focused).

## 5. `terminal-widget.js` — window manager

Wraps one `createTerminalHero()` instance inside a mount element that already
carries the `.term-window` chrome. Injects two icon controls into the existing
title bar (right-aligned, after the decorative dots + label):

- **⤢ / ⤡** — toggle expand/collapse
- **✕** — reset

### 5.1 State model

Two independent axes, both starting at their first value:

| Axis | Values | Starts at |
|---|---|---|
| position mode | `docked` (absolute, pinned to hero's bottom-right, 40px inset — same as variant B/E today) / `floating` (`position: fixed`, explicit `left/top` in viewport coordinates) | `docked` |
| size mode | `compact` (fixed 360px chrome, current CSS) / `expanded` (anchored grow, resizable, min 300×220, max `min(640px, 90vw)` × `min(520px, 80vh)`) | `compact` |

- **Drag** (pointerdown+move on the title bar, excluding the icon buttons —
  `stopPropagation` on their click handlers) switches position mode to
  `floating` at the drop point, in *either* size mode. Once floating, it
  follows the viewport (not the hero) as the page scrolls — implemented as a
  real `position: fixed` element outside `#hero`'s stacking concerns, so
  scrolling the page never moves it.
- **Expand/collapse** only changes size mode. It anchors at the widget's
  current top-left corner (wherever that is, docked or floating) — the window
  grows or shrinks in place, it does not reposition. Collapsing always returns
  to the fixed 360px compact size (any custom resize is discarded, not
  remembered for next expand).
- **Resize** (drag handle, bottom-right corner of the body) is only active
  while `expanded`. Clamped to the min/max above.
- **Reset (✕, or typing `exit`)** sets both axes back to their starting values
  (`docked` + `compact`) and calls `terminal-hero`'s `reset()` — the whole
  widget goes back to exactly its first-load state, autoplay script and all.

### 5.2 Expand backdrop

While `expanded`, a sibling element (`position: fixed; inset: 0;`) renders:
- `backdrop-filter: blur(6px)` over whatever's behind it
- `background: rgba(127, 119, 221, 0.10)` — the site's `--accent` purple, at
  low opacity, not a black/gray dim
- `pointer-events: none` — purely visual; the page underneath stays scrollable
  and clickable through it. This keeps the "doesn't block the page" property
  variant A/B had while still solving the raw-overlap clutter problem.

Removed (and its listeners detached) immediately on collapse or reset.

Known risk to verify live (not blocking the design): the page already runs a
`<canvas>` matrix-rain effect redrawing every 60ms plus GSAP ScrollTrigger
animations. Backdrop blur stacked on top of that may cost more on low-end
devices — verified in §8, with a fallback of dropping to a flat tint (no blur)
if it visibly stutters.

## 6. Command set

9 documented commands (listed by `help`), chosen from a broader brainstormed
list and cut for redundancy / low value (see conversation for the full
rejected list — `education`, `resume`, `ls`, `ping`, `history`, `neofetch`
were cut as either duplicating visible page content or not worth their own
command) — plus one secret 10th: `sudo make-me-a-sandwich`, deliberately left
out of `help`'s listing so it stays a surprise.

| Command | Output |
|---|---|
| `help` | Lists all 9 commands with a one-line description each. Auto-run the first time the visitor interacts. |
| `whoami` | Identity/tagline line (same as the autoplay script) |
| `Get-Stack` | Tech stack list (same as the autoplay script) |
| `Get-Projects` | The 3 portfolio projects (GIS engine, LinkedIn-Notion pipeline, Flappy FPGA), one line each |
| `Get-Experience` | Exiger, NeurotechUofT, ESP II highlights, one line each |
| `contact` | Email / LinkedIn / GitHub, rendered as real clickable links in the output |
| `clear` | Empties the transcript body; announces "Terminal cleared" to the live region |
| `cd <section>` | Smooth-scrolls the real page to `#work` / `#experience` / `#skills` / `#about` / `#contact`. Invalid target prints an error listing valid ones. |
| `exit` | Identical effect to clicking ✕ (full reset) |
| `sudo make-me-a-sandwich` | Easter egg. Prints `Okay.` — the punchline only, no extra flourish, since the deadpan one-liner is the actual joke (classic sudo/xkcd reference) |

Command matching is case-insensitive on the verb; `cd` takes one argument.

Every command's output is a static, developer-authored string (or, for
`contact` only, a small fixed HTML snippet containing the three real links) —
never built from the visitor's typed input. Plain-text output lines are
rendered via `textContent`; only `contact`'s fixed snippet uses `innerHTML`,
and only with hardcoded markup, so there is no user-input-driven HTML
injection path anywhere in the widget.

## 7. Visual/interaction summary

- Compact widget: unchanged appearance from variant B/E today — cream chrome,
  muted-tan title-bar dots, purple `PS>` prompt, autoplay loop.
- First click/focus anywhere in the body: autoplay pauses mid-line (wherever it
  is), `help` runs, a prompt line appears with a faint `type here...`
  placeholder.
- Expand icon: grows in place, backdrop fades in, resize handle appears at the
  body's bottom-right corner.
- Drag (title bar, any size/mode): widget detaches from the hero and becomes
  screen-fixed at the drop point; stays there through scrolling.
- ✕ or `exit`: everything snaps back — docked, compact, autoplay restarted
  from scratch, backdrop gone, custom size discarded.
- Below 950px viewport width: the entire widget is hidden (`display: none`),
  matching the existing polaroid/corner-widget breakpoint.

## 8. Verification plan (manual, no test framework in this repo)

Using the existing browser tool against a local static server, on the
final `index.html` (not a separate preview page, since this is the shipped
feature):
1. Console clean on load (no errors) with the widget mounted.
2. `javascript_tool` assertions: dock→float transition sets `position: fixed`
   and coordinates persist through a simulated `window.scrollTo`.
3. Dispatch synthetic `pointerdown`/`pointermove`/`pointerup` to verify drag,
   resize-handle drag (clamped to min/max), and expand/collapse toggling size.
4. Type each of the 9 commands via dispatched `input`/`keydown` events; assert
   expected output text appears and unknown-command path prints the error.
5. Assert `aria-live` region content updates after each command (accessibility
   check) and that focusing the prompt sets `aria-label`.
6. Visual spot-check of the purple blur backdrop's performance impact (watch
   `preview_logs`/console for jank) — fall back to flat tint, no blur, if the
   matrix-rain canvas visibly stutters underneath it.
7. Resize the browser pane below 950px and confirm the widget disappears.

## 9. Cleanup (post-merge)

- Delete `preview-terminal-a.html`, `preview-terminal-c.html`,
  `preview-terminal-d.html` and their servers/ports.
- Remove the `size: 'compact' | 'full'` branch from `terminal-hero.css` /
  `.js` if nothing but the widget consumes it after merge — confirm at
  implementation time whether the plain full-size, non-interactive rendering
  path is still needed anywhere on the real site (it currently is not, since E
  is the only surviving placement).
- Keep `preview-terminal-e.html` only as long as useful for isolated testing;
  final feature lives inlined into `index.html`'s hero section.
