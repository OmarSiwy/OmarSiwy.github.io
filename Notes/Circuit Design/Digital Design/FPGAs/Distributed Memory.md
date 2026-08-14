---
title: Distributed Memory
description: "A SLICEM LUT turned inside out: its SRAM cells become writable FFs with a one-hot write decoder, giving a simple dual-port 64x1 (or 2x 32x1) RAM per LUT6 — the cheapest ROM on the chip."
kind: circuit
source: "ASA §4.3.1, pp. 95-97"
status: seed
spade: simulated
tags: [digital, fpgas, memory, lut, rom, table]
aliases:
  - Distributed RAM
  - Distributed ROM
  - LUT RAM
  - SLICEM
  - MLAB
---

# Distributed Memory

A memory built out of a LUT's own configuration cells: the cells become clock-writable flip-flops addressed by a separate write port, so the LUT's logic inputs keep working as a read address and the whole memory costs no fabric that was not already there.

```tikz title="LUT5 of a SLICEM in memory mode: 32 writable cells, one-hot write decoder, unchanged 32:1 read mux"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex,line width=0.5pt]

% ---- 32:1 read multiplexer (the LUT5's own mux, unchanged) ----
\draw (3.9,4.8) -- (4.9,4.0) -- (4.9,1.6) -- (3.9,0.8) -- cycle;
\node[rotate=90] at (4.55,2.8) {\scriptsize $32{:}1$};

% ---- one-hot write decoder ----
\draw (-1.3,0.9) rectangle (-0.1,4.7);
\node[rotate=90] at (-0.7,2.8) {\scriptsize One-hot decoder};
\draw[->] (-3.7,2.8) -- (-1.3,2.8);
\node[anchor=south] at (-2.85,2.85) {WA$0..4$};
\node[anchor=north] at (-2.85,2.75) {\scriptsize 5 (write addr)};

% ---- DI1 data-in bus ----
\draw[->] (-3.7,0.3) -- (-2.6,0.3);
\node[anchor=south] at (-3.15,0.35) {DI1};
\node[anchor=north] at (-3.15,0.25) {\scriptsize 1};
\draw (-2.6,0.3) -- (1.35,0.3) -- (1.35,4.53);

% ---- the 32 configuration cells, now writable FFs ----
\foreach \y/\lab in {4.4/0, 3.6/1, 2.8/2, 1.2/31} {
  \draw (2.0,\y-0.28) rectangle (2.9,\y+0.28);
  \node[anchor=west] at (2.03,\y+0.13) {\tiny D};
  \node[anchor=west] at (2.03,\y-0.13) {\tiny EN};
  \node[anchor=east] at (2.87,\y) {\tiny Q};
  % D input from the DI1 bus
  \draw (1.35,\y+0.13) -- (2.0,\y+0.13);
  \fill (1.35,\y+0.13) circle (1.3pt);
  % EN input from the decoder
  \draw[->] (-0.1,\y-0.13) -- (2.0,\y-0.13);
  % Q into the mux
  \draw[->] (2.9,\y) -- (3.9,\y);
  \node[anchor=west] at (3.93,\y) {\tiny \lab};
}
\node at (2.45,2.0) {$\vdots$};
\node at (4.05,2.0) {\tiny $\vdots$};
\node at (0.9,2.0) {$\vdots$};

% ---- read address into the mux ----
\draw (0.2,5.5) -- (4.4,5.5);
\draw[->] (4.4,5.5) -- (4.4,4.4);
\node[anchor=south] at (2.0,5.55) {A$0..4$ \; \scriptsize 5 (read addr, the ordinary LUT inputs)};

% ---- outputs ----
\draw[->] (4.9,2.8) -- (6.6,2.8);
\node[anchor=south] at (5.9,2.85) {O5};
\node[anchor=north] at (5.9,2.75) {\scriptsize 1};

\fill (3.4,1.2) circle (1.3pt);
\draw (3.4,1.2) -- (3.4,0.1) -- (5.8,0.1);
\draw[->] (5.8,0.1) -- (6.6,0.1);
\node[anchor=west] at (6.65,0.1) {MC31 \scriptsize (1, cascade)};

% ---- clock ----
\draw (1.55,-0.9) -- (2.45,-0.9);
\draw[->] (2.45,-0.9) -- (2.45,0.92);
\node[anchor=east] at (1.52,-0.9) {clk};
\node[anchor=west] at (2.52,-0.55) {\scriptsize (to all 32 cells)};

% ---- frame ----
\draw[dashed,rounded corners=3pt] (-1.7,-1.3) rectangle (5.2,6.35);
\node[anchor=north west] at (-1.7,-1.35) {\scriptsize one LUT5 of a SLICEM, memory mode: $32\times1$ simple dual-port};

\end{circuitikz}
\end{document}
```

*After Fig. 4.7a, p. 97.*

**Start from the observation that a LUT is already a ROM.** An $n$-input LUT stores the truth table of the function it implements in $2^n$ configuration cells and selects one of them with a $2^n{:}1$ multiplexer driven by the $n$ logic inputs ([[Lookup-Tables]]). Read that structure with different names and it is a $2^n\times1$ read-only memory whose address bus is the logic input bus. The cells are already writable — that is what bitstream configuration *is* — but the write port runs exactly once, at power-up, through the configuration chain. Distributed memory is nothing more than that write port exposed to the user clock.

**The SLICEM is the slice where the vendor bothered to expose it.** AMD slices come in two types: **SLICEL**, containing the BLEs of [[AMD BLE]], and **SLICEM**, a strict superset that additionally supports distributed memory (p. 96). In a SLICEM's LUT5 the configuration cells are modelled as ordinary flip-flops with an extra data input `DI1` (1 bit) common to all $32$ of them, and a write address `WA0..4` (5 bits) that passes through a one-hot decoder so that exactly one cell's enable is asserted. The LUT's own inputs `A0..4` (5 bits) remain the read address and the original $32{:}1$ mux remains the read path, producing `O5` (1 bit). `MC31` (1 bit) taps cell 31 for cascading — it exists for [[Shift Register LUT]] mode and is left unused here.

**One-hot decoding is what makes the write cost a cycle and the read cost nothing.** The decoder computes $e_j = [\,\mathrm{WA} = j\,] \wedge \mathrm{WE}$ for $j = 0\ldots31$, a 5-to-32 decode whose 32 outputs are pairwise disjoint; the enable term is a conjunction, so with $\mathrm{WE}=0$ every $e_j$ is $0$ and the array holds. Because the enable feeds a flip-flop, a write takes effect at the next clock edge. The read path, by contrast, never touches a clock: `A0..4` selects through combinational logic and `O5` settles one LUT delay later, $\tau_{\text{LUT}} = 0.14\ldots0.32$ ns (p. 127). This **synchronous write / asynchronous read** asymmetry is the defining behavioural signature of distributed memory and the single thing that distinguishes it from [[Block Memory]], whose read is registered and takes several cycles.

**Independent ports make it simple dual-port, and only simple.** The read address `A` and the write address `WA` are separate buses driving separate structures, so a read and a write can proceed in the same cycle at different addresses (p. 96). What you do *not* get is a second write port: there is one decoder and one `DI1`. When both ports name the same address in the same cycle, the read is combinational off the cell's current $Q$ and therefore returns the **old** value — read-first is the native behaviour, and write-first costs an explicit bypass mux you build yourself. Block RAM is usually true dual-port and lets you choose (p. 98).

**Capacity follows from LUT fracturing, not from a separate memory array.** A LUT6 is physically two LUT5s plus an output mux ([[Fracturable LUT]]), so in memory mode one LUT6 realises either **two independent $32\times1$** memories or **one $64\times1$** memory, the sixth input selecting between the two halves (p. 96). Width is free — $m$ parallel LUT6s sharing `WA`, `DI1` and `A` give $64\times m$ — while depth beyond 64 is not, because each additional address bit doubles the number of primitives *and* adds a level of output multiplexing. Intel reaches the same place by a different route: the **MLAB** is a superset of the LAB ([[Intel ALM]]) in which one ALM gives a $32\times2$ simple dual-port block (p. 96).

**The cost of a table is exactly the Shannon bound, and that is not a coincidence.** Implementing an arbitrary Boolean function of $k \le 6$ inputs costs $L(6) = 1$ LUT6 per output bit ([[Lookup-Tables]]). Implementing the same function as a $2^k \times m$ lookup table in distributed memory also costs $m$ LUT6. The two numbers agree because they are the same circuit counted twice: the "logic" implementation *is* a table lookup, and the arbitrary-function bound *is* a memory-capacity bound. The practical consequence for [[Table-Based Function Evaluation]] and [[KCM, Table-Based Constant Multiplication]] is that a table whose address has been compressed to 6 bits or fewer is free in the strongest sense available on an FPGA — it consumes the cheapest and most plentiful resource on the die, at one logic level, with no block RAM and no DSP.

**On ASIC the same drawing is a real cost, which is why the technique is FPGA-only.** Cast Fig. 4.7a into silicon and you pay for 32 flip-flops, a 5-to-32 decoder and a 32:1 mux — a small register file, and nobody would build a 32-entry ROM that way when a synthesised gate network or a compiled SRAM macro is smaller. The FPGA case inverts because the flip-flops, the decoder and the mux are *already fabricated and already paid for*; using them as memory costs only the routing to `DI1` and `WA`. Distributed memory is therefore not a circuit technique that happens to suit FPGAs, it is an artefact of reconfigurability being physically present in the fabric ([[Choosing an FPGA Primitive]]).

$$\boxed{\ 1\ \text{LUT6 (SLICEM)} \;=\; 2\times(32\times1)\ \ \text{or}\ \ 1\times(64\times1)\ \text{simple dual-port},
\qquad 2^{k}\times m\ \text{table},\ k\le6:\ m\ \text{LUT6} = m\cdot L(6)\ }$$

**When it breaks**

- **Only SLICEMs can do it.** Distributed memory competes for a subset of the slices, not for the LUT total, so a design can exhaust distributed RAM while LUT utilisation still looks comfortable.
  > [!warning] Not covered in the source — needs outside research
  > Ch. 4 states that SLICELs and SLICEMs exist but gives no ratio between them. The SLICEM fraction of a device (roughly half the slices in the columns that have them, on 7-series and UltraScale parts) is vendor documentation, not book material, and is not cited here.
- **Depth is the wall, exactly as for block RAM.** Every address bit past 6 doubles the primitive count and adds a mux level; the book's own summary is that building larger memories out of distributed memory is costly (p. 98). Somewhere in the low hundreds of words [[Block Memory]] wins on area and never gets worse, because a 36 kbit tile absorbs address bits for free until its own configuration limit.
- **The asynchronous read is on your critical path.** There is no internal output register, so the mux delay lands in the user's combinational cone. The adjacent slice flip-flops can register it, but that is a design decision you make, not a property of the primitive.
- **No true dual-port, no second write port, no byte enables, no ECC.** Anything needing two writers needs either duplication with a merge, or block RAM.
- **Memory mode and shift-register mode are exclusive.** A given LUT5 is one or the other; [[Shift Register LUT]] takes the same cells and chains them instead of decoding them.
- **A distributed *ROM* is not a distinct resource at all.** If nothing ever writes, `DI1`, `WA` and the decoder are dead logic that the mapper removes, and what is left is a plain LUT holding a constant table. The interesting case is the one in between: the cells can be rewritten at runtime to swap a coefficient while the surrounding structure stays fixed ([[Shift Register LUT]], p. 98).

**RTL (Spade)**

```spade
entity lut5_ram(clk: clock, we: bool, wa: uint<5>, di1: bool, ra: uint<5>) -> bool {
    let onehot: uint<32> = 1 << zext::<5, 32>(wa);
    let en: uint<32> = if we { onehot } else { 0 };
    reg(clk) mem: uint<32> initial(0) = (mem & ~en) | (if di1 { en } else { 0 });
    mem.as_bits()[ra]
}
```

`onehot` is the decoder box of the diagram — a left shift of a single `1` is the cheapest way to write a one-hot decode, and `zext` is needed because Spade requires the shift amount to carry the same type as the shifted value. `en` gates it with `WE`, and the register update `(mem & ~en) | (di1 ? en : 0)` clears then sets only the addressed bit, which is the per-cell enable expressed as a 32-bit vector operation. `mem.as_bits()[ra]` is the $32{:}1$ mux; `as_bits` indexes from the LSB, so cell $j$ sits at bit $j$ and address bit order matches the drawing. `initial(0)` is the bitstream INIT value — the same field that holds a LUT's truth table — and it is why an unwritten instance is a ROM. Synthesis will not build any of this: the mapper recognises the pattern and drops in `RAM32X1S` primitives, so the decoder and mux are hardware that already exists rather than logic that gets generated.

**Related Notes**

- [[Lookup-Tables]] – depends-on: the $2^n$ cells plus $2^n{:}1$ mux this note rewrites as a memory, and the $L(n)$ bound the cost identity matches.
- [[Fracturable LUT]] – depends-on: the two-LUT5-per-LUT6 split that gives $2\times32\times1$ or $1\times64\times1$.
- [[Shift Register LUT]] – compares: the other SLICEM mode, same cells chained instead of address-decoded, and the route to runtime coefficient swapping.
- [[Block Memory]] – compares: the resource that takes over past ~64 words deep, registered read and true dual-port instead of asynchronous read and simple dual-port.
- [[Table-Based Function Evaluation]] – extends: the consumer that shrinks an address until a table fits this primitive.
- [[KCM, Table-Based Constant Multiplication]] – extends: constant multiplication as a sum of sub-tables, each one of these.
- [[Choosing an FPGA Primitive]] – compares: where distributed memory sits against LUT logic, DSP and block RAM for the same function.
- [[AMD BLE]] – supports: the SLICEL contents that the SLICEM is a superset of.
- [[Intel ALM]] – counter-example: the same capability packaged as an MLAB, $32\times2$ per ALM instead of $32\times1$ per LUT5.

## References

- [[1.3) FPGAs]] — §Memory elements → Distributed memory (SLICEL/SLICEM, `DI1`/`WA`, capacity, the $L(6)$ equality), §Block memory (comparison), and the trade-off table.
- de Dinechin & Kumm, *Application-Specific Arithmetic*, §4.3 *Memory Elements*, pp. 95–98 — §4.3.1 *Distributed Memory* (pp. 96) and Fig. 4.7a (p. 97); §4.3.3 *Block Memory* (p. 98) for the contrast; §4.1.2–4.1.3 (pp. 91–93) for SLICEL and LAB/ALM contents.
- $\tau_{\text{LUT}}$ figure, p. 127.
