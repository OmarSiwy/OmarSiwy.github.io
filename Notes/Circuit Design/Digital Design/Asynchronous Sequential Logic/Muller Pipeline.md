---
title: Muller Pipeline
description: "A chain of C-elements where a stage advances only when its predecessor is full and its successor has emptied — correct for any gate delay, no matched delays anywhere, at the price of half the stages being bubbles."
kind: circuit
source: "No book source; long-form 0.5) Asynchronous Sequential Logic §Handshaking protocols, §Delay-insensitive and QDI"
status: seed
spade: simulated
tags: [digital, asynchronous-sequential-logic, handshake, c-element, pipeline]
aliases:
  - Muller Pipelines
  - Muller Pipeline Control
---

# Muller Pipeline

A linear chain of Muller C-elements in which stage $i$ takes the state of stage $i-1$ and the *inverted* state of stage $i+1$, so that a stage advances only on a local rendezvous between "my predecessor is full" and "my successor has emptied" — the one pipeline control that is correct for arbitrary gate delays with no matched delay line anywhere in it.

```tikz title="Muller pipeline: three C-element control stages with a bundled k-bit datapath"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \foreach \x/\i in {0/0, 3/1, 6/2} {
    \draw[thick] (\x-0.6,1.4) rectangle (\x+0.6,2.2);
    \node at (\x,1.8) {$L_\i$};
    \draw[thick] (\x,0.45) -- (\x,1.4);
    \draw[thick] (\x,0) circle (0.45);
    \node at (\x,0) {$\mathbf{C}_\i$};
    \draw[thick] (\x,-0.63) circle (0.09);
  }

  % --- request chain, 1 bit per wire ---
  \draw[->,thick] (-2.0,0) -- (-0.45,0);
  \node[anchor=south] at (-1.2,0.10) {$R_{\mathrm{in}}\,[1]$};
  \draw[->,thick] (0.45,0) -- (2.55,0);
  \node[anchor=south] at (1.5,0.10) {$R_1\,[1]$};
  \draw[->,thick] (3.45,0) -- (5.55,0);
  \node[anchor=south] at (4.5,0.10) {$R_2\,[1]$};
  \draw[->,thick] (6.45,0) -- (8.6,0);
  \node[anchor=south] at (7.5,0.10) {$R_{\mathrm{out}}\,[1]$};

  % --- inverted state of the RIGHT neighbour, back into each C ---
  \draw[thick] (4.0,0) -- (4.0,-1.05) -- (3.15,-1.05);
  \draw[thick] (3.15,-1.05) arc (0:180:0.15);
  \draw[thick] (2.85,-1.05) -- (0,-1.05) -- (0,-0.72);
  \fill (4.0,0) circle (0.055);
  \node[anchor=north] at (2.0,-1.05) {$\overline{R_2}\,[1]$};

  \draw[thick] (7.1,0) -- (7.1,-1.75) -- (6.15,-1.75);
  \draw[thick] (6.15,-1.75) arc (0:180:0.15);
  \draw[thick] (5.85,-1.75) -- (3,-1.75) -- (3,-0.72);
  \fill (7.1,0) circle (0.055);
  \node[anchor=north] at (5.0,-1.75) {$\overline{R_{\mathrm{out}}}\,[1]$};

  \draw[thick] (9.4,-2.45) -- (6,-2.45) -- (6,-0.72);
  \node[anchor=west] at (9.45,-2.45) {$A_{\mathrm{out}}\,[1]$};
  \draw[<-,thick] (8.5,-2.45) -- (8.9,-2.45);

  % --- k-bit single-rail datapath ---
  \draw[->,thick] (-2.0,1.8) -- (-0.6,1.8);
  \node[anchor=south] at (-1.3,1.9) {$d_{\mathrm{in}}\,[k]$};
  \draw[->,thick] (0.6,1.8) -- (2.4,1.8);
  \draw[->,thick] (3.6,1.8) -- (5.4,1.8);
  \draw[->,thick] (6.6,1.8) -- (8.6,1.8);
  \node[anchor=south] at (7.6,1.9) {$d_{\mathrm{out}}\,[k]$};

  \node[anchor=west] at (-2.0,2.75)
    {stage $i$ advances only when $C_{i-1}$ is full \emph{and} $C_{i+1}$ has emptied};
\end{circuitikz}
\end{document}
```

**Write the whole control as one recurrence.** Let $y_i \in \{0,1\}$ be the 1-bit state of stage $i$'s C-element — its output, which is also the request $R_{i+1}$ handed to the next stage. The C-element is the majority of its two inputs and its own output, so substituting $a = y_{i-1}$ and $b = \overline{y_{i+1}}$ into $Y = \mathrm{maj}(a,b,y)$ gives

$$y_i \;=\; \mathrm{maj}\!\left(y_{i-1},\ \overline{y_{i+1}},\ y_i\right)$$

and expanding the majority by distributivity of AND over OR yields all three prime implicants,

$$y_i \;=\; y_{i-1}\,\overline{y_{i+1}} \;+\; y_{i-1}\,y_i \;+\; \overline{y_{i+1}}\,y_i .$$

Every wire in that equation is 1 bit wide. The chain's boundary conditions are $y_{-1} = R_{\mathrm{in}}$ and $y_{N} = A_{\mathrm{out}}$, both 1 bit; the datapath is a separate $k$-bit single-rail bus that the control never inspects.

**Read the recurrence as a full/empty protocol and the rendezvous falls out.** Take $y_i = 1$ to mean "stage $i$ holds a datum". The first product term $y_{i-1}\overline{y_{i+1}}$ is the *set* condition: predecessor full **and** successor empty — the only circumstance under which moving a datum forward neither loses one nor overwrites one. Its dual, $\overline{y_{i-1}}\,y_{i+1}$, is the *reset* condition, obtained by De Morgan on the complement of the sum. Everything else is the hold case, and it is exactly the two remaining terms $y_{i-1}y_i + \overline{y_{i+1}}\,y_i$. So a stage changes state only when its two neighbours *disagree* about occupancy, and that single sentence is the whole protocol: no clock, no delay line, no global sequencing.

**The absence of a matched delay in the control is the point, and it is a stronger claim than it looks.** The circuit is built from C-elements and inverters only. That is precisely the class Martin's result says is achievable in the pure delay-insensitive model — arbitrary, unbounded, independent delays on every gate *and every wire* — so the control chain needs neither the isochronic forks that a general QDI circuit assumes nor the per-stage matched delay of a [[Matched Delay Line]]. What remains is the datapath: hanging $k$-bit latches $L_i$ off the C-element outputs, as drawn, makes this a [[Bundled-Data Interface]], and *that* reintroduces one timing assumption per stage. Replace the latches and the single-rail bus with dual-rail function blocks and a [[Completion Detection Tree]] and the assumption disappears again, at roughly twice the datapath area.

**The occupancy law is the price.** In a four-phase protocol a datum is delivered by $R\!\uparrow$ and the wire is only reusable after the return-to-zero $R\!\downarrow$, so consecutive data must be separated by a spacer. Combined with the set condition, which requires an empty stage ahead before anything can move, this means a chain of $2N$ C-elements holds at most $N$ data tokens: **half the stages are bubbles at peak throughput.** The simulation below shows the mechanism directly — with the sink refusing to accept ($A_{\mathrm{out}} = 1$) and the source requesting ($R_{\mathrm{in}} = 1$), a three-stage chain settles to $y = 011$, not $111$. Stage 2 cannot set because its successor is full, so it stays the bubble that stage 1 needed in order to fill.

> [!important]
> **The chain has no power-on state, and this is a design obligation rather than a detail.** $y = \mathrm{maj}(a,b,y)$ is satisfied by $y = X$ for *any* $a,b$ — the unknown is a fixpoint of the majority function, because a majority vote among three unknowns is unknown. A four-state simulator therefore leaves the entire pipeline at `xxx` forever, and real silicon resolves it only by whichever transistor happens to win. Every practical C-element carries an explicit set or clear transistor for exactly this reason; the RTL below carries a `clr` input, and without it the simulation cannot be made to say anything at all.

**Dropping the consensus term breaks the pipeline in a way that is worse than a glitch.** $y_{i-1}\overline{y_{i+1}} + y_{i-1}y_i$ alone is a functionally equivalent cover, and every logic optimiser will find it, because the third term is redundant by the consensus theorem. But it is not hazard-free: with $y_{i-1} = y_i = 1$ and $y_{i+1}$ rising, the first term falls before the second is guaranteed to hold, and $y_i$ glitches low. On a datapath a glitch settles; here $y_i$ *is* the request wire $R_{i+1}$, so a glitch is a **spurious handshake event** — the downstream stage sees a phantom datum, and the token count is now wrong for the rest of time. The redundant term is load-bearing; see [[Muller C-Element]] for the transistor-level forms that get this right by construction.

**On FPGA the two things that make it work are the two things the tools remove.** The self-loop is a combinational cycle, which static timing analysis cannot traverse: Vivado wants `ALLOW_COMBINATORIAL_LOOPS` on the net plus a `set_disable_timing`, after which the reported timing is meaningless and you are hand-certifying it. The consensus term is by construction non-minimal and the optimiser deletes it. The only reliable route is to stop synthesising the equation and instantiate the majority function as an explicit `LUT3` primitive with a `DONT_TOUCH`, one LUT and one feedback route per stage. On ASIC none of this arises — the C-element is a standard cell.

$$\boxed{\ y_i \;=\; y_{i-1}\,\overline{y_{i+1}} \;+\; y_{i-1}\,y_i \;+\; \overline{y_{i+1}}\,y_i\ }$$

## When it breaks

- **Throughput needs double the stages.** The $2N$-stages-per-$N$-tokens law means matching a synchronous pipeline's occupancy costs twice the control. If your block is latency-critical and never idle, that is pure overhead.
- **The cycle time includes the reverse path.** A stage cannot refill until its successor's state has propagated *backwards* through the inverter into its own C-element. The handshake cycle is a round trip, not a forward pass, so lengthening the chain does not amortise it away.
- **Two-phase changes the storage, not the control.** Keeping the same C-element chain but treating every transition as an event requires event-sensitive capture-pass latches instead of level-sensitive ones — see [[Two-Phase Handshake]]. The control chain is unchanged; the datapath gets materially larger.
- **It is strictly linear and strictly deterministic.** A Muller pipeline cannot merge two independent producers or arbitrate between them: that needs a [[Mutual Exclusion Element]], which is a genuinely different circuit with metastability in it.
- **No reset means no circuit.** See the callout above. A Muller pipeline without an initialisation input is unsimulatable and, in silicon, starts in an arbitrary state that may contain phantom tokens.
- **Not a clock-domain crossing.** Two independently clocked domains meeting through this chain still need a synchroniser; use an [[Asynchronous FIFO]].

## RTL (Spade)

```spade
/// Two-input Muller C-element with an asynchronous clear.
/// `y` is the element's OWN output, closed into a real loop by the caller.
fn c_elem(clr: bool, a: bool, b: bool, y: bool) -> bool {
    !clr && ((a && b) || (a && y) || (b && y))
}

/// Three-stage Muller pipeline. `rin` is the request from the left
/// environment, `aout` the acknowledge from the right; every stage's second
/// input is its right neighbour's INVERTED state.
entity muller_pipe3(clr: bool, rin: bool, aout: bool) -> [bool; 3] {
    decl y0, y1, y2;
    let y0 = c_elem(clr, rin, !y1,   y0);
    let y1 = c_elem(clr, y0,  !y2,   y1);
    let y2 = c_elem(clr, y1,  !aout, y2);
    [y0, y1, y2]
}
```

Each `c_elem` call is one circle in the diagram; `!y1`, `!y2`, `!aout` are the three inversion bubbles; `y0`, `y1`, `y2` are the request wires $R_1$, $R_2$, $R_{\mathrm{out}}$, each 1 bit, and the returned `[bool; 3]` packs element 0 into the LSB. The whole entity is combinational — there is not a `reg` or a `clock` in it, and the state lives entirely in the three loops. Synthesis will do one thing the drawing does not: it will try to flatten `c_elem` and then delete the `(b && y)` term, which is the failure described above.

**The loop is real, and this is the part worth checking.** Writing the self-reference directly is rejected:

```
error: Use of undeclared name y
  ┌─ mp_fail.spade:2:31
  │
2 │     let y = (a && b) || (a && y) || (b && y);
  │                               ^ Undeclared name
```

but `decl` forward-declares the wire, and the emitted Verilog then ties a module's output port back to its own input port:

```verilog
\c_elem  \c_elem_0 (.clr_i(\clr ), .a_i(\rin ), .b_i(_e_2314), .y_i(\y0 ), .output__(\y0 ));
```

`y_i` and `output__` are the same net. That is a genuine combinational latch, not the "pass the feedback in as an argument" trick, which would leave the caller driving `y_i` from somewhere else and give you a mux.

Verified with `.zettel/sim.sh`: **3009 vectors pass** — a clear/release sequence, seven named asymmetric vectors driving `rin` and `aout` independently (`fill` → `111`, `backpressure` → `011`, `drain` → `000`), and a 3000-vector random sweep in fundamental mode against a behavioural relaxation reference. The testbench is falsifiable in both directions that matter: removing one inversion fails the named vectors, and deleting the consensus term `(b && y)` fails the sweep within twenty vectors.

> [!warning] Not covered in the source — needs outside research
> This note has no assigned book source, so it quotes no cycle time, no LUT count and no measured throughput. The occupancy result is structural (a counting argument on the set condition), not a measurement; the FPGA constraint names are the vendor pragmas, not a characterised result.

## Related Notes

- [[Muller C-Element]] – depends-on: the single stage, its transistor-level forms, and why the consensus term is the whole circuit.
- [[Four-Phase Handshake]] – supports: the return-to-zero protocol this chain implements, and where the spacer that halves occupancy comes from.
- [[Two-Phase Handshake]] – compares: same control chain, event-sensitive storage, half the wire transitions.
- [[Bundled-Data Interface]] – supports: what the $k$-bit latches and the single-rail bus in the diagram commit you to.
- [[Completion Detection Tree]] – extends: replaces the bundled-data timing assumption with data-encoded validity.
- [[Micropipeline]] – extends: Sutherland's two-phase elaboration of exactly this chain with capture-pass latches.
- [[Mutual Exclusion Element]] – counter-example: the pipeline is deterministic and linear; anything that must choose between two requesters cannot be built from C-elements.
- [[Asynchronous FIFO]] – compares: the synchronous-world answer to the same buffering problem, with Gray pointers instead of a rendezvous.
- [[Handshake Ready-Valid]] – compares: the clocked elastic equivalent, where "predecessor full and successor empty" becomes `valid && ready` sampled on an edge.
- [[Network-On-Chip]] – supports: the long inter-router link is the case where this chain's delay-insensitivity actually pays.

## References

Long-form note `0.5) Asynchronous Sequential Logic`, §Handshaking protocols and §Delay-insensitive and QDI.

- J. Sparsø & S. Furber, *Principles of Asynchronous Circuit Design* — Muller pipelines, four-phase vs. two-phase, bundled data vs. dual-rail, pipeline occupancy.
- A. J. Martin, on the limitations of delay-insensitive circuits — why C-elements and inverters are the whole DI class.
- I. E. Sutherland, "Micropipelines" (Turing Award lecture) — transition signalling on this chain.
- N. Weste & D. Harris, *CMOS VLSI Design* — C-element cell forms and initialisation.
- M. M. Mano & M. D. Ciletti, *Digital Design* — consensus theorem and static-hazard-free covers.
