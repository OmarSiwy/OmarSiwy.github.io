---
title: "LUT-Array Function Table"
description: "A 2^α×n ROM as n α-input LUTs sharing one address bus — the FPGA unit cost, and why shrinking the address below α buys nothing."
kind: circuit
source: "ASA §16.4.2, pp. 491-492"
status: seed
spade: simulated
tags: [digital, fixed-point-function-approximation, fpga, lut, rom, table]
aliases:
  - "LUT Array Function Table"
  - "LUT-Array ROM"
  - "LUT Array ROM"
  - "LUT ROM"
  - "Distributed ROM"
  - "Tabulating a Function Using FPGA LUTs"
---

# LUT-Array Function Table

A function table built as $n$ independent $\alpha$-input LUTs driven by one shared address bus — the only ROM form whose cost is *quantized*, because the LUT is indivisible and a table narrower than $\alpha$ address bits costs exactly as much as one that fills it.

```tikz title="A 2^6 x 8 function table as eight 6-input LUTs on a shared address bus"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  % --- input word X, split into its alpha = 6 bits -------------------------
  \foreach \i/\lbl in {0/$x_5$,1/$x_4$,2/$x_3$,3/$x_2$,4/$x_1$,5/$x_0$} {
    \pgfmathsetmacro\X{2.65+0.45*\i}
    \draw (\X,2.35) rectangle (\X+0.45,2.85);
    \node[font=\footnotesize] at (\X+0.225,2.60) {\lbl};
  }
  \node[anchor=east,font=\footnotesize] at (2.55,2.60) {$X=$};
  \draw[<->] (2.65,3.15) -- (5.35,3.15);
  \node[anchor=south,font=\footnotesize] at (4.0,3.15) {$\alpha=6$ bits};

  % --- shared address bus --------------------------------------------------
  \draw[thick] (4.0,2.35) -- (4.0,1.45);
  \draw[thick] (0.5,1.45) -- (7.5,1.45);
  \node[anchor=east,font=\footnotesize] at (3.9,1.90) {$\alpha$};

  % --- the n = 8 LUTs, one per output bit ----------------------------------
  \foreach \i in {0,...,7} {
    \pgfmathsetmacro\X{0.5+1.0*\i}
    \draw[->] (\X,1.45) -- (\X,0.35);
    \draw (\X-0.36,-0.35) rectangle (\X+0.36,0.35);
    \node[font=\footnotesize] at (\X,0.0) {LUT};
    \draw[->] (\X,-0.35) -- (\X,-0.95);
    \draw (\X-0.5,-1.45) rectangle (\X+0.5,-0.95);
  }
  \node[anchor=east,font=\footnotesize] at (0.9,0.72) {$\alpha$};
  \node[anchor=east,font=\footnotesize] at (-0.10,-1.20) {$\widetilde f(X)=$};

  % --- output word width ---------------------------------------------------
  \draw[<->] (0.0,-1.80) -- (8.0,-1.80);
  \node[anchor=north,font=\footnotesize] at (4.0,-1.82) {$n=8$ bits, one per LUT};

  % --- annotations ---------------------------------------------------------
  \node[anchor=west,font=\footnotesize] at (8.25,0.0)
    {$8\times$ a $2^{6}\!\times\!1$ ROM};
  \node[anchor=west,font=\footnotesize] at (8.25,-0.55)
    {$=$ one $2^{6}\!\times\!8$ ROM};
\end{circuitikz}
\end{document}
```

*after Fig. 16.11b, p. 492 ($w_X=\alpha=6$, $n=8$).*

**Read the LUT as a memory, not as a gate.** An FPGA logic cell's lookup table has $\alpha$ address inputs and one output, and its configuration bitstream *is* its truth table: $2^{\alpha}$ SRAM cells behind a $2^{\alpha}$-to-1 multiplexer. That is the definition of a $2^{\alpha}\times1$ ROM, so nothing has to be built to obtain one. Putting $n$ of them side by side and wiring the *same* $\alpha$-bit address to all $n$ gives a $2^{\alpha}\times n$ ROM: the address bus is $\alpha$ bits, each LUT contributes exactly 1 bit, and the output word $\widetilde f(X)$ is $n$ bits. On current AMD and Intel fabrics $\alpha=6$; older families had $\alpha=4$. See [[Lookup-Tables]] for the cell itself and [[FPGAs]] for where it sits in the tile.

**The array is a transposition, not a decomposition.** A $2^{k}\times n$ table is conceptually indexed by address and read out by word; the LUT array indexes by *bit position* and reads out by address. Formally, write the table as a Boolean map $\widetilde f:\{0,1\}^{k}\to\{0,1\}^{n}$ and split its codomain componentwise — $\widetilde f = (\widetilde f_{n-1},\dots,\widetilde f_0)$ with each $\widetilde f_j:\{0,1\}^{k}\to\{0,1\}$. Componentwise evaluation of a product codomain is exactly what parallel hardware does for free, so the $n$ single-output functions are computed independently and concatenated. No LUT ever sees another LUT's output; the array has the depth of *one* LUT regardless of $n$, and each of the $n$ slices is an unrelated $k$-variable Boolean function that happens to share a fanout net.

**The unit of cost rounds up, and only up.** The LUT is indivisible: you configure all $2^{\alpha}$ of its cells or you waste them. A $2^{\alpha}\times n$ ROM therefore costs $n$ LUTs — and so does a $2^{\alpha-1}\times n$ ROM, which fills half of each LUT and leaves the top address input tied off. **Shrinking the address below $\alpha$ buys nothing.** For function approximation this is not a rounding detail but a design rule: if a $k$-bit input table fits with $k<\alpha$, the remaining $\alpha-k$ address bits are already paid for, so widening the input to the full $\alpha$ bits improves accuracy at zero LUT cost. It is the reason a plain table is the right answer, not merely an acceptable one, whenever $k\le\alpha$ — see [[Choosing a Function Approximation Method]].

**Above $\alpha$, Shannon expansion sets the growth rate.** With $k>\alpha$ no single LUT can see the whole address, so split $X$ into $\alpha$ low bits $X_L$ and $k-\alpha$ high bits $X_H$ and apply the Boole–Shannon expansion once per high bit,
$$\widetilde f_j(X) \;=\; \bigvee_{h\in\{0,1\}^{k-\alpha}} \big[X_H = h\big]\;\wedge\;\widetilde f_j(h,X_L),$$
where each cofactor $\widetilde f_j(h,\cdot)$ is a function of only $\alpha$ variables and therefore one LUT. The disjunction over disjoint conditions is a multiplexer, so each output bit costs $2^{k-\alpha}$ LUTs plus a $2^{k-\alpha}$-to-1 select tree. At $k=\alpha+1$ that is 2 LUTs plus one 2-to-1 mux per output bit, and the mux may come free from the tile's dedicated wide-mux resources or may not, depending on the family. Since the $2^{\alpha}\times n$ case costs $n$ LUTs flat, the two regimes combine into a single expression, $\text{LUTs} = 2^{\max(k-\alpha,0)}\times n$.

**Treat that formula as an upper bound, because the array is still combinational logic.** The $n$ slices are Boolean functions, and FPGA synthesis inherited the same expression minimisation and sub-expression sharing that makes [[Synthesized Logic Table|standard-cell synthesis]] beat a hard ROM on ASIC. On an $\alpha=6$ device the $2^{8}\times8$ table for $\sin(\tfrac{\pi}{2}x)$ on $[0,1)$ synthesises into **25 LUTs, not the predicted $2^{2}\times8=32$** (p. 492). The mechanism is visible in the RTL below: the most significant output bit of that table is monotone in the address — the function is increasing and the rounded result crosses $\tfrac12$ exactly once — so slice 7 is not a table at all but a single comparison $X\ge22$, and synthesis will not spend four LUTs and a mux tree on it. Slices near the LSB are pseudo-random and cost the full predicted amount; the savings are concentrated in the high bits, which is also why the discount shrinks as the table gets wider.

**The other primitive has the opposite failure mode.** Block RAM, usable as ROM with contents loaded at configuration time, is the right answer once the table exceeds a few tens of kilobits — which by $B=2^{k}n$ means roughly $k\le12$ before it is needed and nothing at all after $k\approx16$. Its shapes are coarse and discrete rather than quantized at a single granularity, so it wastes differently: a LUT array wastes at most a factor of two on the address, while a block RAM used at the wrong aspect ratio can waste most of a macro. It also shares the hard ROM's real drawback — its contents are opaque to logic optimisation, so none of the 25-versus-32 discount is available. Contrast [[Hard ROM Macro]] on ASIC, where the same loss of optimisability makes the generator lose outright to standard cells.

> [!important] On ASIC there is no quantization floor at all: the empirical area model $A\propto 2^{0.65\min(k,n)}\times2^{0.19|k-n|}$ (eq. 16.1, p. 491) is continuous in $k$, so one address bit fewer always costs less. The FPGA's floor is what makes "use all $\alpha$ bits" a rule here and not there.

$$\boxed{\ \text{LUTs}\;=\;2^{\max(k-\alpha,\,0)}\times n\quad\text{(upper bound)},\qquad k\le\alpha\ \Rightarrow\ n\ \text{LUTs regardless of }k\ }$$

> [!warning] Not covered in the source — needs outside research. Pages 491–492 model the fabric as single-output $\alpha$-LUTs. Real families fracture: an Intel ALM and an AMD LUT6 both expose two outputs when the two functions share enough inputs, which is exactly the case here (all $n$ slices share the entire address bus), so the true cost of a narrow table can be closer to $n/2$ cells than $n$. The same cells can also be configured as distributed RAM rather than ROM; neither is quantified on these pages.

**When it breaks.**

- **$k<\alpha$.** The formula is still correct and still useless — it reports $n$ LUTs for a table that is mostly empty. The actionable statement is the design rule, not the count.
- **$k\gtrsim12$.** $2^{k}n$ has already passed the point where LUTs are the sensible primitive; block RAM takes over, and by $k=16$ the table is $1$ Mibit and no primitive rescues it. This is where the whole of [[Fixed-Point Function Approximation]] begins.
- **The count is an upper bound, sometimes badly.** 25 against 32 is a $22\%$ error on the book's own example. Do not budget an FPGA from this formula; synthesise the table.
- **It can also be exceeded.** The $n$-way fanout of the address bus is generic routing, and the mux tree above $k=\alpha+1$ competes for the same wide-mux resources as everything else in the tile. Congestion is not in the model.
- **$\alpha$ is not a constant.** It is 6 on current parts and 4 on older ones, and every threshold above moves with it — the "free" table halves in size on an $\alpha=4$ device.
- **Contents must be constants.** A LUT array is a ROM. If the table has to change at run time it becomes distributed RAM with a write port, and the cost model no longer applies.

**RTL.**

```spade
/// One of the n LUTs of Fig. 16.11b: an alpha-input, 1-output ROM.
/// alpha = A here; the array is the configuration bitstream.
fn lut<#uint A, #uint S>(addr: uint<A>, contents: [bool; S]) -> bool {
    contents[addr]
}

/// Word-level view (Fig. 16.11a): a 2^6 x 8 ROM holding
/// RN(256 * (255/256) * sin(pi/2 * X)), X = addr/64 in ufix(-1,-6),
/// output in ufix(-1,-8). The 255/256 factor is the output range scaling.
fn sin_rom(addr: uint<6>) -> uint<8> {
    let table: [uint<8>; 64] = [
          0,   6,  13,  19,  25,  31,  37,  44,
         50,  56,  62,  68,  74,  80,  86,  92,
         98, 103, 109, 115, 120, 126, 131, 136,
        142, 147, 152, 157, 162, 167, 171, 176,
        180, 185, 189, 193, 197, 201, 205, 208,
        212, 215, 219, 222, 225, 228, 231, 233,
        236, 238, 240, 242, 244, 246, 247, 249,
        250, 251, 252, 253, 254, 254, 255, 255,
    ];
    table[addr]
}

/// Bit-level view (Fig. 16.11b): output bit 0 is one LUT6 on its own,
/// holding column 0 of the table above. Pseudo-random: a real LUT.
fn sin_rom_bit0(addr: uint<6>) -> bool {
    lut(addr, [
        false, false, true,  true,  true,  true,  true,  false,
        false, false, false, false, false, false, false, false,
        false, true,  true,  true,  false, false, true,  false,
        false, true,  false, true,  false, true,  true,  false,
        false, true,  true,  true,  true,  true,  true,  false,
        false, true,  true,  false, true,  false, true,  true,
        false, false, false, false, false, false, true,  true,
        false, true,  false, true,  false, false, true,  true,
    ])
}

/// Output bit 7, same address bus, same shape — but monotone, so synthesis
/// replaces this LUT with the comparator (addr >= 22).
fn sin_rom_bit7(addr: uint<6>) -> bool {
    lut(addr, [
        false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, false, false,
        false, false, false, false, false, false, true,  true,
        true,  true,  true,  true,  true,  true,  true,  true,
        true,  true,  true,  true,  true,  true,  true,  true,
        true,  true,  true,  true,  true,  true,  true,  true,
        true,  true,  true,  true,  true,  true,  true,  true,
        true,  true,  true,  true,  true,  true,  true,  true,
    ])
}
```

`addr` is the $\alpha=6$-bit bus drawn across the top of the figure; every `lut` call reads the same signal, which is the horizontal wire and the only routed net in the drawing. `sin_rom` is the word-level view and `sin_rom_bit0`/`sin_rom_bit7` are two of the eight columns of the bit-level view — same circuit, transposed, which the testbench checks bit for bit. Widths: address $6$ bits in, $1$ bit out of each LUT, $8$ bits concatenated; nothing widens, because a lookup is not an arithmetic operator. All combinational — no clock, no register, and the LUT's own output register is a separate resource in the tile that this note does not use. Synthesis will *not* emit the drawing: it will keep `sin_rom_bit0` as a LUT6, collapse `sin_rom_bit7` to a comparator, and share sub-expressions across the remaining slices, which is the 25-versus-32 discount arriving in the netlist.

Simulated through a concrete `entity` wrapper around `sin_rom`: all 64 addresses checked exhaustively against an independent behavioural reference $\mathrm{RN}\!\big(256\cdot\tfrac{255}{256}\sin(\tfrac{\pi}{2}\cdot\tfrac{i}{64})\big)$ computed in the testbench, 6 named vectors including the asymmetric pair $\mathrm{addr}=1\mapsto6$ against $\mathrm{addr}=32\mapsto180$ (a reversed address bus fails this and passes every symmetric one), and a 3000-vector random sweep — with both bit slices compared against the corresponding bit of the word output on every vector. All passing.

**Related notes.**

- [[Function Table ROM]] – depends-on: the word-level table this is the FPGA realisation of, and where $B=2^{k}m$ comes from.
- [[Lookup-Tables]] – depends-on: the single $2^{\alpha}\times1$ cell the whole cost model is denominated in.
- [[FPGAs]] – supports: the fabric that fixes $\alpha$ and decides whether the mux above $k=\alpha$ is free.
- [[Synthesized Logic Table]] – compares: the same "a table is just Boolean logic" argument on ASIC, and the reason 25 beats 32 here.
- [[Hard ROM Macro]] – counter-example: low cost per bit, but opaque to optimisation, so it loses the discount this note's array gets for free.
- [[Barrel Shifters]] – compares: the other structure whose FPGA cost is set by the LUT's $\alpha$ inputs rather than by its bit count, and which also collapses once $k\le\alpha$.
- [[Choosing a Function Approximation Method]] – compares: where "just tabulate" stops winning, which on FPGA is decided by this formula.
- [[Output Range Scaling]] – supports: the $\tfrac{255}{256}$ factor in the tabulated values above.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §16.4.2 *Actual Cost of a ROM*, pp. 491–492 — the two FPGA primitives; a LUT as a $2^{\alpha}\times1$ ROM; $2^{\max(k-\alpha,0)}\times n$; the measured 25-LUT sine table; block RAM as the second primitive.
- §16.4.2, p. 491, eq. (16.1) — the ASIC area model quoted for contrast.
- Fig. 16.11, p. 492 — word-level (a) and bit-level (b) views; the diagram above redraws (b).
- §16.4.1, p. 490 — the `255/256*sin(pi/2*x)` scaled table used as the RTL example.
