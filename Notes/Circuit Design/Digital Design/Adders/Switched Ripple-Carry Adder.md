---
title: "Switched Ripple-Carry Adder"
description: "RCA topology where a GKP block steers fast switches that pass, pull down or pull up the carry — Zuse's Z3 relay adder, and exactly what an FPGA carry chain is."
kind: circuit
source: "ASA §5.3.1, pp. 112–114"
status: seed
spade: simulated
tags: [digital, adders, carry, switches, fpga]
aliases:
  - "Switched Ripple-Carry"
  - "Switched RCA"
  - "Switched Ripple-Carry Adders"
  - "Switched Carry Chain"
---

# Switched Ripple-Carry Adder

The switched ripple-carry adder keeps the [[RCA, Ripple-Carry Adder|RCA]]'s topology exactly and replaces each cell's carry logic with three switches, so a carry crosses a bit position through a closed switch rather than through a gate.

```tikz title="One switched full-adder cell: GKP steers three mutually exclusive switches onto the carry rail"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize]
  % --- GKP block: three mutually exclusive case signals, from x_i and y_i only ---
  \node[draw,fill=gray!8,minimum width=1.6cm,minimum height=0.8cm] (gkp) at (1.9,2.9) {GKP};
  \draw[->] (1.5,4.0) -- (1.5,3.3);  \node at (1.5,4.22) {$x_i$};
  \draw[->] (2.3,4.0) -- (2.3,3.3);  \node at (2.3,4.22) {$y_i$};

  % --- the carry rail ---
  \draw (-1.9,1.0) -- (-0.5,1.0);
  \draw[->,very thick] (-1.9,1.0) -- (-3.1,1.0);
  \node at (-3.6,1.0) {$c_{i+1}$};
  \draw[->,very thick] (4.9,1.0) -- (3.7,1.0);
  \node at (5.4,1.0) {$c_i$};
  \node[circ] at (-0.5,1.0) {};

  % --- switch 1: generate pulls the rail up to Vcc ---
  \draw (-0.5,3.2) to[switch] (-0.5,1.0);
  \draw (-0.5,3.2) -- (-0.5,3.5) node[vcc]{$V_{cc}\,(1)$};

  % --- switch 2: kill pulls the rail down to GND ---
  \draw (-0.5,1.0) to[switch] (-0.5,-1.2);
  \draw (-0.5,-1.2) -- (-0.5,-1.45) node[ground]{};
  \node[anchor=west] at (-0.3,-1.6) {GND $(0)$};

  % --- switch 3: propagate closes the pass gate, c_i goes straight through ---
  \draw (3.7,1.0) to[switch] (1.3,1.0);
  \draw (1.3,1.0) -- (-0.5,1.0);

  % --- control wires from the GKP block to the three switch gates ---
  \draw[dashed,->] (1.3,2.5) -- (1.3,2.15) -- (-0.15,2.15);
  \node[anchor=south] at (0.55,2.2) {$g_i$};
  \draw[dashed,->] (1.9,2.5) -- (1.9,-0.15) -- (-0.15,-0.15);
  \node[anchor=south] at (0.85,-0.1) {$k_i$};
  \draw[dashed,->] (2.5,2.5) -- (2.5,1.45);
  \node[anchor=west] at (2.6,1.95) {$p_i$};

  \node[align=left,anchor=north west] at (-3.6,-2.4)
    {every wire is $1$ bit; this is one bit slice of a $w$-bit chain\\
     $g_i,k_i,p_i$ are mutually exclusive and exhaustive: exactly one switch closes\\
     the sum $s_i=p_i\oplus c_i$ (5.11) is one XOR per bit, off the carry path, not drawn};
\end{circuitikz}
\end{document}
```

*after Fig. 5.11, p. 114.* The dashed lines are control, not signal path; the carry itself never leaves the horizontal rail.

**Condense the full adder's truth table on the inputs alone.** The full adder's carry-out $c_{i+1}=x_ic_i\vee y_ic_i\vee x_iy_i$ (Eq. 5.3, p. 107) depends on $c_i$ only conditionally, and which of the three conditions holds is decided by $(x_i,y_i)$ before $c_i$ arrives (Table 5.1, p. 112). With $x_i=y_i=0$ the carry dies — *kill*; with $x_i=y_i=1$ it is born — *generate*; with $x_i\neq y_i$ it passes through unchanged — *propagate*. Encoding the three cases from the inputs only,

$$k_i=\overline{x_i\vee y_i},\qquad p_i=x_i\oplus y_i,\qquad g_i=x_iy_i \tag{p. 112}$$

gives three $1$-bit signals available after one gate delay, in parallel, at every bit position, and independent of carry propagation entirely. They are **mutually exclusive and exhaustive** — by inspection of the four rows of $(x_i,y_i)$, each row satisfies exactly one of $k_i,p_i,g_i$ — which is the property the whole circuit rests on. In the note's widths: $X,Y$ are $w$ bits each, every $x_i,y_i,c_i,g_i,k_i,p_i$ is $1$ bit, and the result $S=c_w s_{w-1}\ldots s_0$ is $w+1$ bits, per [[Number Formats]].

**Realize the three cases with switches, not with gates.** Since exactly one of the three holds, a single-pole switch per case suffices and no arbitration is needed: $g_i$ closes a switch from $V_{cc}$ onto $c_{i+1}$, $k_i$ closes one from GND, and $p_i$ closes a pass switch between $c_i$ and $c_{i+1}$ (Fig. 5.11, p. 114). Exclusivity means the rail is never driven by two sources, so no contention; exhaustiveness means it is never floating, so no dynamic node to keep alive. The speedup is not algorithmic — the topology is bit-for-bit the RCA's, and the carry still visits every position in order — it is that **a switch is much faster than the complex gate it replaces**, so the per-bit constant $\tau_\text{cp}$ of the ripple recurrence shrinks while the $O(w)$ depth stays. The three GKP signals themselves are off the critical path: they settle once, in parallel, while the carry is still at bit $0$.

*(The prose on p. 113 calls this the "GKSSP block"; Fig. 5.11 labels it GKP. Same block.)*

**The same circuit read as Boolean algebra is a multiplexer.** Generate is only reachable when we are not propagating, and $p_i=0$ forces $x_i=y_i$, so **by case exhaustion on Table 5.1** $g_i=\overline{p_i}\,x_i=\overline{p_i}\,y_i$ (Eq. 5.14, p. 113). Substituting into $c_{i+1}=g_i\vee p_ic_i$ (Eq. 5.10) turns the carry recurrence into

$$c_{i+1}=\overline{p_i}\,x_i\vee p_ic_i \tag{5.15}$$

— "if the bits differ, pass the carry; otherwise pass either input bit." The $k_i$ branch has vanished from the formula because $\overline{p_i}x_i$ already delivers $0$ in the kill case, but it has *not* vanished from the circuit: in switch form you still need something to actively pull the rail low. That asymmetry is the whole difference between the gate reading and the switch reading of the same equation. The alive signal $a_i=\overline{k_i}=x_i\vee y_i$ merges propagate and generate and gives the equivalent $c_{i+1}=g_i\vee a_ic_i$ (Eqs. 5.12–5.13), which is the form [[Parallel Prefix Adders]] reassociate.

**Relays were the first switches this was built from.** Zuse's relay-based Z3 realized exactly this cell [Zus84; Roj97]: the relays for $k_i,g_i,p_i$ switched *in parallel* from the operand bits, establishing a continuous electrical carry-propagation path, after which the carry travelled that path with no further mechanical movement — which is what made a complete addition possible in one machine cycle rather than one cycle per bit (p. 114). Aiken's later, independent design did the same [Bau98]. The lesson generalizes past relays: whenever the switching element is far slower than the medium that conducts through it, a switch-steered ripple beats a gate-per-bit ripple by the ratio of the two.

**In CMOS the switch is a transmission gate, and that caps the chain length.** The modern equivalent of the relay is the [[Transmission Gate]], and full-adder cells have been designed around this idea [SB00; Bha+15]. But a transmission gate is a passive conductor: it **does not regenerate the signal**. A chain of them is an RC ladder, not a sequence of restoring stages, so the accumulated delay grows faster than linearly and the RCA delay model

$$\tau_\text{add}(w)=(w-1)\,\tau_\text{cp}+\max(\tau_\text{cp},\tau_\text{fa}) \tag{5.7}$$

is simply **not valid** for this adder [AP02] (p. 114). Practically the chain must be broken by a restoring buffer every few bits, which reintroduces gate delay and bounds how much of the switch advantage survives.

> [!warning] The book gives no replacement delay model — needs outside research
> §5.3.1 says (5.7) "is not even valid in this case" and stops there: no transistor count, no delay expression, no buffering interval, no measured speedup ratio for either the relay or the CMOS variant. The standard analysis outside this book (Weste & Harris; Elmore's RC-ladder delay) is that an unbuffered pass-transistor chain of length $n$ has delay $O(n^2)$, which is what motivates the periodic buffer — but that model is not in the source and no number here comes from it.

> [!important] Every FPGA carry chain in production is this circuit
> On AMD series 4–7 and UltraScale/UltraScale+, a BLE's hardened carry logic is one XOR plus one MUX: the LUT computes $p_i=x_i\oplus y_i$ and the BLE realizes $s_i=p_i\oplus c_i$ and $c_{i+1}=p_ic_i\vee\overline{p_i}\,x_i$ (Eqs. 5.50–5.51, p. 126, Fig. 5.23) — literally (5.15). This is why the "slow" ripple wins on FPGAs: the switch path is hardened silicon with dedicated CLB-to-CLB routing, giving $\tau_\text{cp}=0.015$ ns per bit on Virtex 6 against a worst-case $\tau_\text{fa}=0.57$ ns, a factor of $38$ (pp. 126–127). Unlike the transmission-gate case the vendor buffers the chain for you, so (5.7) *is* valid again there. See [[FPGA Hard Carry Chain Adder]], [[FPGAs]], [[Lookup-Tables]].

$$\boxed{\ c_{i+1}=\begin{cases}1 & g_i=x_iy_i\\ 0 & k_i=\overline{x_i\vee y_i}\\ c_i & p_i=x_i\oplus y_i\end{cases}\quad\equiv\quad c_{i+1}=\overline{p_i}\,x_i\vee p_ic_i,\qquad s_i=p_i\oplus c_i\ }$$

**When it breaks.**

- **Long chains.** With no regeneration the delay is superlinear and (5.7) does not describe it, so the topology does not scale to arbitrary $w$ without inserted buffers (p. 114). This is the dominant limit and it is a *circuit* limit, not an architectural one.
- **Technology dependence.** The book's own caveat: "the benefit of this approach is very technology dependent" (p. 114). It is a transistor-level optimization, invisible at the Boolean level, so it wins or loses per process — unlike [[Carry-Select Adder]] or the prefix trees, which win by construction.
- **Noise margin and threshold drop.** A single NMOS pass transistor loses a $V_t$ on a logic $1$; the full transmission gate exists to avoid that, at twice the devices and a complementary control wire per switch. Details in [[Transmission Gate]].
- **Simulation and STA.** Because the carry path is a switch network rather than a gate network, ordinary static timing analysis on the synthesized netlist does not see it. It is instantiated as a hand-designed cell, never inferred from RTL.
- **Where a sibling takes over.** Past the width where even a fast constant fails to save an $O(w)$ chain, the answer is not a better switch but a different bracketing — [[Kogge-Stone Tree]], [[Brent-Kung Tree]], or on FPGA simply the hardened chain plus pipelining ([[Pipelined Ripple-Carry Adder]]).

**RTL (Spade).**

```spade
/// GKP: the three mutually exclusive carry cases, from the inputs only.
fn gkp(x: bool, y: bool) -> (bool, bool, bool) {
    (x && y, !(x || y), x != y)
}

/// One switched cell: g closes the pull-up to Vcc, k the pull-down to GND,
/// p the pass switch that lets c_i through untouched.
fn scell(x: bool, y: bool, c: bool) -> (bool, bool) {
    let (g, k, p) = gkp(x, y);
    let cout = if g { true } else if k { false } else { c };
    (cout, p != c)
}

/// The switched chain, LSB-first: one cell per recursion step.
fn schain<#uint W>(x: [bool; W], y: [bool; W], cin: bool) -> [bool; {W + 1}] {
    gen if W == 0 {
        [cin]
    } else {
        let (cout, s) = scell(x[0], y[0], cin);
        [s].concat(schain(x[1..W], y[1..W], cout))
    }
}

fn srca<#uint W>(x: uint<W>, y: uint<W>, cin: bool) -> uint<{W + 1}> {
    schain(x.as_bits(), y.as_bits(), cin).as_uint()
}
```

`gkp` is the drawn box, returning $(g_i,k_i,p_i)$; the three arms of the `if` chain are the three switches in top-to-bottom order, and `c` reaching the last arm untouched is the closed pass gate. `cout` threaded through the recursion is the horizontal rail, and `cin` at `W == 0` is the diagram's rail leaving the top cell as $c_w$, the MSB of the $W+1$-bit result — hence no `zext`. Everything is `fn`, so it is purely combinational: no clock, no state, and index $0$ of `as_bits()` is the LSB. What synthesis will not reproduce is the *point of the circuit*: the `if` chain lowers to a gate-level mux, and no HDL can express a pass gate or a rail pulled by $V_{cc}$ and GND — that structure has to be entered as a hand-drawn cell or a vendor primitive, which is precisely why the FPGA version ships as hardened silicon and not as inferrable RTL.

**Related Notes (with context):**

- [[RCA, Ripple-Carry Adder]] – depends-on: identical topology and identical carry order; only the cell's implementation differs.
- [[Full Adder]] – depends-on: the cell whose carry logic the three switches replace.
- [[Transmission Gate]] – depends-on: the CMOS switch this is built from, and the reason the chain cannot be long.
- [[FPGA Hard Carry Chain Adder]] – extends: the same $c_{i+1}=\overline{p_i}x_i\vee p_ic_i$ cell, hardened and buffered, which makes an $O(w)$ chain beat $O(\log w)$ trees to past $32$ bits.
- [[Lookup-Tables]] – supports: on FPGA the LUT in front of each cell computes $p_i$ and is otherwise free.
- [[FPGAs]] – supports: the target where this cell is the default adder rather than an exotic one.
- [[Parallel Prefix Adders]] – counter-example: attacks the same recurrence by rebracketing it instead of by making each step's switch faster.
- [[Kogge-Stone Tree]] – counter-example: buys $\log_2 w$ depth with gates, which is the opposite trade to buying a smaller constant with switches.
- [[Carry-Select Adder]] – compares: also keeps the ripple, but hides it behind speculation rather than speeding up the step.
- [[Choosing an Adder]] – compares: where a transistor-level cell sits against the architectural options.
- [[Adders]] – supports: topic hub.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.3 Fast adders for VLSI, pp. 112–113 — Table 5.1 (kill/propagate/generate/alive), Eqs. 5.10–5.15.
- §5.3.1 Switched ripple-carry adder, pp. 113–114 — **Fig. 5.11**; Zuse's Z3 [Zus84; Roj97], Aiken [Bau98], CMOS FA cells [SB00; Bha+15], the invalidity of (5.7) [AP02].
- §5.2.2, p. 108 — Eq. 5.7, the RCA delay model this adder invalidates.
- §5.4.1 AMD carry chain, pp. 126–127 — Fig. 5.23, Eqs. 5.50–5.51, Virtex 6 timing from [Xil14].
