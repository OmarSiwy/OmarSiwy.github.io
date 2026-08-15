---
title: Hard ROM Macro
description: "Transistor-level ROM: stored bits become wiring to the rails and all the logic is address decoding — lowest cost per bit, but it forfeits logic optimization and measured larger than standard cells."
kind: circuit
status: seed
spade: simulated
tags: [digital, fixed-point-function-approximation, rom, asic, memory]
aliases:
  - ROM Macro
  - ROM Generator
  - ROM Generators
  - Mask-Programmed ROM
  - NOR ROM Array
---

# Hard ROM Macro

A $2^{k}\times n$ table laid out at transistor level by a ROM generator, in which a stored bit is the *presence or absence of a device* at a word-line/bit-line crossing, so the array holds no logic at all and the entire logic cost of the operator collapses into the address decoder.

```tikz title="NOR-style hard ROM macro: decoder, programmed cell array, precharged bit lines"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}

% ---- word lines (rows), driven by the address decoder
\foreach \y/\lab in {0/0, -1.7/1, -3.4/2, -5.1/3} {
  \draw[thick] (0.2,\y) -- (4.4,\y);
  \node[anchor=east,font=\small] at (0.15,\y) {$W_{\lab}$};
}

% ---- address decoder
\node[draw,thick,minimum width=1.1cm,minimum height=6.0cm] (dec) at (-1.2,-2.55) {};
\node[rotate=90,font=\small] at (-1.2,-2.55) {address decoder};
\draw[thick,latex-] (-1.75,-2.55) -- (-3.0,-2.55);
\node[anchor=east,font=\small] at (-3.05,-2.55) {$\mathrm{addr}$ : $k$ bits};
\foreach \y in {0,-1.7,-3.4,-5.1} { \draw[thick] (-0.65,\y) -- (0.2,\y); }
\node[anchor=north,font=\small,align=center] at (-1.2,-5.9) {$2^{k}=4$ word lines};

% ---- programmed nMOS cells: a device at a crossing stores a 0
\node[nmos,scale=0.55,anchor=gate] (c01) at (2.4,0)    {};
\node[nmos,scale=0.55,anchor=gate] (c10) at (1.4,-1.7) {};
\node[nmos,scale=0.55,anchor=gate] (c22) at (3.4,-3.4) {};
\node[nmos,scale=0.55,anchor=gate] (c31) at (2.4,-5.1) {};
\node[nmos,scale=0.55,anchor=gate] (c32) at (3.4,-5.1) {};
\foreach \c in {c01,c10,c22,c31,c32} { \node[ground,scale=0.7] at (\c.source) {}; }

% ---- bit lines through the drains, pMOS precharge on top
\foreach \c/\lab in {c10/2, c01/1, c22/0} {
  \draw[thick] (\c.drain |- 0,2.0) -- (\c.drain |- 0,-6.3);
  \node[pmos,scale=0.55,anchor=drain] (p\lab) at (\c.drain |- 0,2.0) {};
  \draw[thick] (p\lab.source) -- (p\lab.source |- 0,3.6);
  \node[anchor=east,font=\small] at ([xshift=-3pt]\c.drain |- 0,1.35) {$B_{\lab}$};
}
\draw[thick] (0.9,3.6) -- (4.0,3.6);
\node[vcc,anchor=south] at (2.4,3.6) {};
\node[anchor=west,font=\small] at (4.05,3.6) {$V_{DD}$};
\draw[thick] (p2.gate) -- (p0.gate -| 5.0,0);
\node[anchor=west,font=\small] at (5.05,2.15) {$\overline{\phi}_{\text{pre}}$ (precharge)};

% ---- sense amplifiers + output register
\node[draw,thick,minimum width=3.4cm,minimum height=0.8cm,font=\small]
  (sa) at (2.4,-6.75) {sense $+$ output register};
\draw[thick,-latex] (2.4,-7.15) -- (2.4,-8.0);
\node[anchor=north,font=\small] at (2.4,-8.05) {data : $n=3$ bits};

\node[anchor=west,font=\small,align=left] at (5.0,-0.55)
  {array $=2^{k}\times n$ crossings,\\no gates, no logic depth};
\node[anchor=west,font=\small,align=left] at (5.0,-3.85)
  {device present $\Rightarrow$ bit $0$\\device absent $\Rightarrow$ bit $1$};

\end{circuitikz}
\end{document}
```

*Own construction. $k=2$, $n=3$; the five programmed devices store $W_0\!=\!101$, $W_1\!=\!011$, $W_2\!=\!110$, $W_3\!=\!100$.*

**Reduce the stored bit to a piece of wiring.** The cell at word $i$, bit $j$ is one nMOS whose gate is the word line $W_i$ and whose drain is the bit line $B_j$; its source goes to ground. Only one of the $2^{k}$ word lines is high at a time, so if a device exists at $(i,j)$ it conducts and drags $B_j$ to $0$, and if none exists $B_j$ keeps whatever it was precharged to. Programming the table is therefore not logic design but *layout*: you either place a transistor (or, in a contact-programmed variant, a single via) at the crossing or you do not. This is exactly what the source means by "in a ROM the logic cost is essentially in the address-decoding logic, since constant 0 and 1 resume to wiring to the corresponding power lines" (p. 491). The immediate consequence is that **area is independent of the contents**: the $2^{k}\times n$ macro storing $\sin$ is the same size as the one storing white noise, because nothing in the array ever looked at the bits.

**Put all the logic in the decoder, and note that it is exponential too.** The array is a wired-NOR plane with no gate delay of its own, so every Boolean gate in the macro belongs to the $k \to 2^{k}$ decoder — $2^{k}$ one-hot word lines, each a $k$-input AND of the address bits and their complements, followed by a word-line driver sized for the row's capacitance (see [[Decoders]]). Predecoding shares the AND tree so the decoder's *depth* stays $\Theta(\log k)$, but its *area* is still $\Theta(2^{k})$ — it must produce $2^{k}$ distinct outputs. Both terms of the macro's cost, array and decoder, carry the same exponential in $k$ that [[Function Table ROM]] establishes; the hard macro buys a smaller constant in front of it and nothing else.

**Accept that the read is dynamic, which is what makes the macro synchronous.** A NOR plane cannot pull a bit line up — there is no pMOS in the array — so the bit line must be precharged high through $\overline{\phi}_{\text{pre}}$ while all word lines are low, and only then is the addressed word line raised and the line allowed to discharge. The alternative, a pseudo-nMOS plane with a permanently-on pMOS load, removes the clock at the price of static current on every column holding a $0$ and a degraded low level. Either way the macro presents an address setup time, an evaluate window and a registered or latched output, not a cloud of combinational logic.

> [!important] A hard ROM is not free combinational lookup
> [[Function Table ROM]] treats the table as pure combinational logic — an address in, a value out, no clock. The transistor-level macro is not that circuit: precharge makes it a clocked block with at least one cycle of latency and an output register. A pipeline that budgeted "one ROM access, combinational" for its table has to find that cycle somewhere, which is precisely the trade the FPGA reader already knows from [[Block Memory]].

**Fold the array, or the aspect ratio ruins it.** The literal shape of a $2^{k}\times n$ array is unusable as soon as $k$ grows: a $2^{12}\times 8$ table is 4096 rows of 8 columns, a tall thin sliver that no floorplan wants, with a bit line whose capacitance — and hence discharge time — is proportional to the number of rows on it. Generators therefore split the address, $k = k_{\text{row}} + k_{\text{col}}$, decoding $k_{\text{row}}$ bits into $2^{k_{\text{row}}}$ word lines and using the remaining $k_{\text{col}}$ bits to drive a column multiplexer that selects one bit line out of every $2^{k_{\text{col}}}$ (a [[Multiplexers|column mux]] per output bit). The array becomes roughly square and the quoted cost per bit is the one at that preferred aspect ratio, not at an arbitrary one.

**Understand why it loses anyway.** Content-independence is the macro's virtue in area predictability and its defect in area: it cannot exploit *any* structure in $f$. Standard-cell synthesis can, and does — it minimises each output's expression and shares sub-expressions across outputs, which is why the measured area of a synthesized table, $A \propto 2^{\,0.65\min(k,n)}\times 2^{\,0.19|k-n|}$ (eq. 16.1, p. 491), carries an exponent $0.65 < 1$ rather than the $1$ that a literal bit count would give (see [[Synthesized Logic Table]]). Gustafsson and Johansson compared the two directly and found ROM generators "to lead to larger area than standard-cell implementations on the tabulated functions studied" (p. 491) — for *tabulated functions*, which are smooth and hence rich in the sharing synthesis feeds on. The macro also costs what every hard block costs: fixed pin locations, a routing blockage over its footprint, its own characterised timing model, and no ability for the tool to absorb surrounding logic into it.

**On FPGA the option does not exist in this form.** There is no memory compiler and no transistor-level layout to buy; the fabric's already-hardened equivalent is [[Block Memory]], whose contents are loaded at configuration time and which shares the hard macro's inflexibility — coarse discrete shapes, no logic optimization — while being free if the block was idle anyway. Below its granularity the same table is spread across LUTs instead ([[LUT-Array Function Table]]), which *does* get logic-optimized, because FPGA synthesis inherited the ASIC technology.

$$\boxed{\ A_{\text{ROM}} \;=\; \underbrace{2^{k}n\,A_{\text{cell}}}_{\substack{\text{array: content-independent,}\\ \text{no logic}}} \;+\; \underbrace{A_{\text{dec}}(k)=\Theta(2^{k})}_{\text{all of the logic}} \;>\; A_{\text{std cell}} \propto 2^{\,0.65\min(k,n)}2^{\,0.19|k-n|}\ }$$

The inequality is an empirical result on tabulated functions, not an asymptotic one: $A_{\text{cell}}$ really is far smaller than a standard cell, and the macro still lost.

**When it breaks.**

- **It does not beat the exponential.** Both terms are $\Theta(2^{k})$. A hard macro shifts the wall a small constant to the right; it does not move $k \approx 12$–$16$ meaningfully, which is why every technique after this one attacks the exponent instead.
- **Small tables lose outright.** Decoder, precharge devices, sense amplifiers and the output register are a fixed overhead paid before the first stored bit. Below a few hundred bits the macro is all overhead and a handful of gates wins.
- **Smooth $f$ is the worst case for it.** The macro's advantage is largest exactly where synthesis has nothing to share — high-entropy contents such as microcode or character generators. A tabulated elementary function is the opposite: neighbouring entries differ in a few low bits, which is the structure both synthesis and every method in [[Choosing a Function Approximation Method]] exist to exploit.
- **Long bit lines are slow and noisy.** Discharge time grows with rows per column, so an unfolded tall array trades away the very cost-per-bit it was chosen for.
- **The clock is not optional.** A dynamic array loses its value to leakage and coupling if the evaluate window stretches, so the macro cannot be stopped mid-access the way combinational logic can.

> [!warning] Not covered in the source — needs outside research
> The source states the qualitative result (very low cost per bit, larger overall area than standard cells) but gives **no cost-per-bit figure, no decoder-versus-array area split, and no crossover table size** at which a macro would begin to win. It also gives no delay comparison. The cell-level structure above (NOR plane, precharge, column folding) is standard CMOS memory canon, not material from Ch. 16.

**RTL (Spade).**

A hard macro is not RTL — it is a layout artefact produced by a memory compiler, and no HDL construct instantiates one portably. What you write is the *contents*; the macro is what the back end may substitute for them. The synthesizable description is therefore an addressed constant array with a registered output, which is also the closest honest model of the macro's timing:

```spade
/// Contents of a 2^4 x 4 ROM: RN(15*sin(pi/2*x)) on x in [0,1)
fn sin_table(addr: uint<4>) -> uint<4> {
    let t: [uint<4>; 16] = [0, 1, 3, 4, 6, 7, 8, 10, 11, 12, 12, 13, 14, 14, 15, 15];
    t[addr]
}

/// A hard ROM macro reads synchronously: address in, data out one cycle later.
entity rom16x4(clk: clock, addr: uint<4>) -> uint<4> {
    reg(clk) d = sin_table(addr);
    d
}
```

`addr` is the $k=4$-bit word into the decoder block of the diagram, and each of the sixteen `uint<4>` literals is one word line's programmed cell pattern across the $n=4$ bit lines — a `0` bit is a device placed at that crossing, a `1` bit is an empty site. The indexing `t[addr]` is decoder *and* array together; Spade has no way to separate them, which is the point. The `reg(clk)` is the "sense + output register" box, and it is the only part of the timing the RTL gets right. What synthesis does differently from the drawing: at $2^4\times 4$ it will not build a macro at all — it will emit a few dozen gates, per eq. 16.1 — and the precharge phase, the bit lines and the one-hot word lines exist nowhere in the emitted Verilog.

**Related Notes.**

- [[Function Table ROM]] – depends-on: the $2^{k}\cdot n$ bit count this note prices in silicon, and the combinational model this note corrects.
- [[Synthesized Logic Table]] – counter-example: the standard-cell alternative that measured *smaller* despite a much larger cost per bit.
- [[Block Memory]] – compares: the FPGA's already-hardened ROM, with the same inflexibility and none of the layout effort.
- [[LUT-Array Function Table]] – compares: the fine-grained FPGA mapping, which keeps the logic optimization a hard macro forfeits.
- [[Combinational Logic]] – supports: the decoder is the macro's only Boolean content.
- [[Choosing a Function Approximation Method]] – compares: where a plain table sits once the exponential stops being affordable at any cost per bit.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §16.4.2 "Actual Cost of a ROM", p. 491 — ROM generators, cost per bit, eq. (16.1), and the [GJ08] area comparison.
- Ibid., §16.4 and §16.4.1, pp. 488–490 — plain tabulation, `FixFunctionByTable`, and the "exponential in the input size, only linear in the output size" observation.
- Weste & Harris, *CMOS VLSI Design*, ch. on memory — NOR ROM plane, precharge and sensing, decoder predecoding, and row/column folding (used to fill the structural gap flagged above).
