---
title: Switch Debouncer
description: "The one place the SR latch's forbidden state is unreachable by construction: an SPDT contact physically cannot assert both inputs, so bounce becomes a clean single transition with no clock and no filter."
kind: circuit
source: "0.3) Introduction to Flip-Flops & Latches, §SR latch; Wakerly ch. 7; Mano & Ciletti ch. 5"
status: seed
spade: simulated
tags: [digital, flip-flops-and-latches, latch, sr, debounce, asynchronous]
aliases:
  - Switch Debouncer
  - Debouncer
  - Debouncing
  - Contact Debouncer
  - SPDT Debouncer
  - Contact Bounce
  - Switch Bounce
  - Bounce Filter
---

# Switch Debouncer

**One-line summary:** An SR latch wired to the two throws of a break-before-make SPDT switch, which is the only common use of that latch where the forbidden code $S=R=1$ is excluded by mechanics rather than by a design rule nobody can enforce.

```tikz title="SPDT switch debouncer: grounded wiper, two pulled-up throws, cross-coupled NAND latch"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]

  % ---- SPDT switch: common wiper grounded, both throws pulled up ----
  \draw (0,1.1) -- (0,0.3) node[ground] {};
  \node[anchor=east] at (-0.15,1.15) {wiper};
  \draw[thick] (0,1.1) -- (1.02,1.97);
  \draw[thick,dashed] (0,1.1) -- (1.02,0.23);
  \node[ocirc] at (1.1,2.0) {};
  \node[ocirc] at (1.1,0.2) {};
  \node[anchor=south] at (1.1,2.22) {$A$};
  \node[anchor=north] at (1.1,-0.02) {$B$};

  % ---- pull-ups ----
  \draw (1.9,2.0) -- (1.9,2.9);
  \draw (1.9,2.9) to[R,l=$R$] (1.9,4.1) node[vcc] {};
  \draw (3.1,0.2) -- (3.1,2.9);
  \draw (3.1,2.9) to[R,l_=$R$] (3.1,4.1) node[vcc] {};
  \fill (1.9,2.0) circle (0.055);
  \fill (3.1,0.2) circle (0.055);

  % ---- cross-coupled NAND latch ----
  \node[nand port] (g1) at (7.0,2.9) {};
  \node[nand port] (g2) at (7.0,-0.1) {};

  \draw (1.15,2.0) -- (4.6,2.0) |- (g1.in 1);
  \draw (1.15,0.2) -- (5.0,0.2) |- (g2.in 2);
  \node[anchor=south] at (4.0,2.06) {$\bar{a}$~[1]};
  \node[anchor=south] at (4.2,0.26) {$\bar{b}$~[1]};

  \draw (g1.out) -- (9.6,2.9) node[anchor=west] {$Q$~[1]};
  \draw (g2.out) -- (9.6,-0.1) node[anchor=west] {$\bar{Q}$~[1]};
  \fill (8.6,2.9) circle (0.055);
  \fill (8.2,-0.1) circle (0.055);

  \draw (8.6,2.9) -- (8.6,1.5) -- (5.4,1.5) |- (g2.in 1);
  \draw (8.2,-0.1) -- (8.2,1.1) -- (5.2,1.1) |- (g1.in 2);

  \node[anchor=north,align=center] at (5.0,-1.3)
    {$Q=\overline{\bar{a}\cdot\bar{Q}}$\qquad
     $\bar{Q}=\overline{\bar{b}\cdot Q}$\qquad
     $\bar{a}=\bar{b}=0$ unreachable};
\end{circuitikz}
\end{document}
```

*Own construction; the standard drawing, e.g. Wakerly ch. 7. The dashed arm is the wiper's other rest position. Only the four filled dots are connections — the pull-up for throw $B$ crosses the $\bar{a}$ net without joining it.*

**Topic:**

**A mechanical contact is a 1-bit signal that does not obey the discipline every other 1-bit signal in the design obeys.** When two metal surfaces meet they collide, deform elastically, separate, and meet again several times before the mechanical energy is dissipated. Electrically this is a train of make/break events: the net you are watching is a valid logic $0$, then a valid logic $1$, then $0$, alternating for as long as the contact rings. It is not a slow edge and it is not noise. Every level in it is a legal level, so no amount of amplification, hysteresis in the input buffer, or slew-rate control removes it — an edge-counting or edge-sampling consumer (see [[Setup and Hold Constraints]]) will see $k$ genuine, clean, well-formed transitions where the human who pressed the button caused one. The signal is $1$ bit wide throughout this note; there is no arithmetic here, only a question of *which* transition survives.

**The repair is memory, not filtering, and the SR latch is the cheapest memory there is.** A filter (RC network plus a Schmitt trigger, or a counter) removes bounce by refusing to believe a level until it has persisted longer than the worst bounce, which means committing to a time constant that must be characterised against a mechanical part. A latch removes bounce by a different mechanism entirely: it remembers, so the *second* and every subsequent assertion of the same input is a no-op. Formally, take the characteristic equation from [[SR Latch]],

$$Q^{+}=S+\bar{R}\,Q \quad\text{subject to}\quad SR=0$$

and apply it twice with $S=1,R=0$. The first application gives $Q^{+}=1$; the second gives $Q^{+}=1+\bar{0}\cdot 1=1$ by **idempotence of OR** ($x+x=x$). Bounce is repeated assertion of one input, and repeated assertion of one input is absorbed by the algebra. No time constant appears anywhere.

**The whole design reduces to arranging that bounce can only ever be *repeated assertion of the same* input.** That is exactly what a single-pole double-throw contact guarantees. The wiper is one conductor tied to ground; the two throws $A$ and $B$ are separate nets, each held at $V_{DD}$ by a pull-up resistor $R$. The wiper grounds at most one throw at a time, so with active-low naming $\bar a$, $\bar b$ (both 1 bit):

- **wiper on $A$:** $\bar a=0$, $\bar b=1$ — set,
- **wiper in flight:** $\bar a=\bar b=1$ — hold, both nets pulled up,
- **wiper on $B$:** $\bar a=1$, $\bar b=0$ — reset,
- **$\bar a=\bar b=0$:** requires the wiper to touch both throws at once. Geometrically impossible on a break-before-make switch.

The fourth row is the SR latch's entire defect, and it has been removed from the input space by the shape of a piece of metal. This is the pattern worth carrying forward: the forbidden code of a latch is never made safe by promising not to drive it, only by making it unreachable — here by mechanics, in [[Transparent D Latch]] by tying $R=\bar S$, in a hard flip-flop by the cell's internal set/reset priority.

**Now the travel is a three-phase sequence and every bounce lands inside a phase, never between two.** Leaving $B$ for $A$, the wiper first breaks from $B$ — bouncing as it goes, so $\bar b$ rings between $0$ and $1$ — then flies with both nets high, then makes at $A$, bouncing so $\bar a$ rings. During the $B$-side ring the latch alternates between *reset* and *hold*, and it is already reset, so $Q$ does not move: by the equation, $Q^{+}=0+\bar{1}\cdot 0=0$ and $Q^{+}=0+\bar{0}\cdot 0=0$. During the flight it holds. During the $A$-side ring it alternates between *set* and *hold*, and the first make already set it, so $Q^{+}=1$ thereafter. The output therefore changes exactly once per travel, at the instant of the *first* make on the destination throw, and it is a full-speed transition — the latency added is one NAND propagation delay, not a filter time constant. Where the SR latch's simultaneous-release race lives, this circuit has a phase in which *neither* input is asserted, which is the benign hold code.

**The active-low NAND form is not a stylistic choice here; it is what a grounding contact produces.** A mechanical wiper can only *short a net to something*, and shorting to ground is the cheap option (one common return, no floating supply rail through the switch body). So the natural assertion level is $0$, the idle level is the pull-up's $1$, and the gate whose non-controlling value is $1$ is the NAND. **De Morgan's law** $\overline{x\cdot y}=\bar x+\bar y$ maps this back to the NOR drawing in [[SR Latch]] with $S=\bar a$, $R=\bar b$; it is the same circuit read at the opposite polarity, and the pull-ups are what make the idle code the hold code rather than the forbidden one. In static CMOS the cost is two NAND2 cells — 8 transistors — plus two resistors, which is the cheapest debouncer that exists.

**On an FPGA this circuit is not available, and the substitute is a counter, not a latch.** Two LUTs with their outputs cross-fed form a cycle in the timing graph: static timing analysis cannot traverse it, the feedback delay is placement-dependent and uncharacterised, and synthesis will warn or reject. What FPGA boards actually have, in any case, is usually an SPST push-button with one pull-up — one net, no second throw, so the mechanical exclusion argument does not even apply. The synchronous debouncer replaces memory-of-input with agreement-over-time: sample the raw net on the system clock and flip the output only after $N$ consecutive samples disagree with it. Any bounce burst shorter than $N$ sample periods is rejected outright, so with sample period $T_s$ the design condition is

$$N\,T_{s} > t_{\text{bounce,max}}$$

and the price is a latency of $N T_s$ on every real press, plus $\lceil \log_2 N\rceil$ flip-flops of counter. The two circuits sit at opposite ends of the same trade: the latch has zero latency and needs a second contact; the counter needs no second contact and pays $N T_s$.

> [!important] The synchronous version does not remove the need for a synchroniser
> The raw contact is asynchronous to the sampling clock, so the sampling flip-flop itself can go metastable — debouncing and synchronisation are orthogonal problems. Put a [[Synchronizer Chain]] between the pad and the counter; the counter filters bounce, the chain bounds the probability of a metastable sample reaching the counter. Debouncing a signal you have not synchronised only makes the failure rarer, not bounded.

**Result.**

$$\boxed{\ \bar{a}\cdot\bar{b}=0\ \text{(mechanical)}\ \Rightarrow\ Q^{+}=\overline{a}\!\downarrow\ \text{once per travel};\qquad \text{sampled form: } N\,T_{s}>t_{\text{bounce,max}}\ }$$

**When it breaks.**

- **A make-before-break (shorting) SPDT.** Its wiper deliberately touches both throws during transfer, so $\bar a=\bar b=0$ *is* reachable, the forbidden state returns, and the release is the unarbitrated race of [[SR Latch]]. The switch must be specified break-before-make; nothing in the schematic reveals which one you bought.
- **An SPST button.** There is no second contact to exclude the forbidden code, so this topology does not exist for it. Use the counter version.
- **A wiper that stalls in flight** — an under-travelled press, a worn detent. Both nets read $1$, the latch holds, and the output keeps the *previous* value indefinitely. That is the correct failure (no spurious event), but it means a press can be silently lost, which a counter-based debouncer reports identically and no debouncer can fix.
- **Pull-up sizing.** $R$ must pull the net through the board and gate-input capacitance fast compared with the shortest contact make, or a genuine make is filtered out by the net's own $RC$; too small and the wiper carries wasted current every time it rests. Neither bound is derivable from the logic — it is a board-level measurement.
- **$N$ too small in the sampled version.** The threshold is a hard inequality against a mechanical, temperature- and wear-dependent number. Undershoot it and the debouncer passes bounce through with full timing credibility, which is worse than not having one.
- **Either output feeding a clock pin.** Debounced or not, a contact-derived signal has no defined edge rate and no relationship to the clock domain. Route it as data into a [[Synchronizer Chain]], never as a clock.

> [!warning] No bounce duration is given in the source
> The long-form note states the mechanism but no measured $t_{\text{bounce,max}}$, and none is quoted here. Contact bounce durations are part-specific and belong in the switch datasheet; sizing $N$ from a remembered rule of thumb is exactly the mistake the inequality above is meant to prevent.

**RTL (Spade).**

The prediction for this note was `not-expressible`, on the reasoning that a latch needs combinational feedback. That is wrong: `let` cannot refer forward, but `decl` forward-declares a name and closes the loop. The naive form is the one that fails —

```spade
fn debounce_spdt(n_a: bool, n_b: bool) -> bool {
    let qb = !(n_b && q);      // error: Use of undeclared name q
    let q  = !(n_a && qb);
    q
}
```

— and `decl` fixes it without changing the circuit:

```spade
/// Asynchronous SPDT debouncer: cross-coupled NAND latch driven by the two
/// throws. Active-low inputs; n_a = n_b = 0 is mechanically unreachable.
fn debounce_spdt(n_a: bool, n_b: bool) -> bool {
    decl q;
    let qb = !(n_b && q);
    let q  = !(n_a && qb);
    q
}

/// Synchronous counter debouncer: q flips only after `raw` has disagreed
/// with it for 2^W consecutive samples of `clk`.
entity debounce_sync<#uint W>(clk: clock, rst: bool, raw: bool) -> bool {
    let zero: uint<W> = 0;
    let full = ~zero;
    decl cnt;
    reg(clk) q reset(rst: false) = if cnt == full && raw != q { !q } else { q };
    reg(clk) cnt: uint<W> reset(rst: 0) =
        if raw != q {
            if cnt == full { 0 } else { trunc(cnt + 1) }
        } else {
            0
        };
    q
}
```

`n_a`/`n_b` are the two pulled-up throw nets of the drawing and `q`/`qb` the two NAND outputs, all `bool` = 1 bit; the pull-ups and the wiper have no RTL existence, so nothing in the type system encodes $\bar a\cdot\bar b=0$ — the entire safety argument lives outside the code. `debounce_spdt` lowers to two cross-coupled continuous assignments, i.e. a genuine combinational loop that every downstream tool will flag as one; that it compiles is a statement about Spade, not a licence to synthesise it on an FPGA. `debounce_sync` is fully registered: `cnt` is `uint<W>` and `full` is its all-ones value, so the threshold is $2^{W}$ consecutive disagreeing samples and the flip-flop cost is $W+1$. The `raw != q` term in `q`'s next-state expression is load-bearing and was added because simulation failed without it — with `cnt == full` alone, a burst of exactly $2^{W}-1$ samples still flipped the output on the following edge, since nothing re-checked that the input was still disagreeing.

**Related Notes (with context):**

- [[SR Latch]] – depends-on: supplies $Q^{+}=S+\bar{R}Q$, the $SR=0$ side condition, and the forbidden-code race that this application removes.
- [[Synchronous Counters]] – supports: the counted-agreement debouncer is a resettable up-counter with a terminal-count comparison, which is where its cost and its $\lceil\log_2 N\rceil$ width come from.
- [[Synchronizer Chain]] – depends-on: debouncing is not synchronisation; the sampled version needs a chain in front of it or the counter samples a metastable value.
- [[Transparent D Latch]] – compares: the other way to delete the forbidden code, by tying $R=\bar S$ instead of by mechanics.
- [[Cross-Coupled Inverter Bistable]] – depends-on: the loop that does the remembering, and the reason a bounce burst cannot walk it out of a stable point.
- [[Choosing a Storage Element]] – compares: where an SR latch used this way sits against every clocked sibling in the folder.

## References

- `0.3) Introduction to Flip-Flops & Latches`, §*SR latch* — the loop equations, the characteristic equation $Q^{+}=S+\bar{R}Q$, and the statement that the debouncer is one of the two surviving uses of the SR latch because the contact cannot assert both inputs.
- Wakerly, *Digital Design: Principles and Practices*, ch. 7 — the $\bar{S}\bar{R}$ NAND latch, the SPDT debouncer schematic, and the sampled (counted-agreement) alternative.
- Mano & Ciletti, *Digital Design*, ch. 5 — NOR/NAND latch forms and the invalid input combination.

> [!warning] Printed page numbers not verified
> The textbook citations are chapter-level. No copy was consulted for this note; the chapter numbering is stable across editions but the pages are not.
