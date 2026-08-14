---
title: Block Memory
description: "Dedicated 36 kbit (AMD) / 20 kbit (Intel) dual-port RAM tiles with configurable depth-width trade-off — full clock rate but several cycles per access, so a throughput resource, never a latency one."
kind: circuit
source: "ASA §4.3.3, pp. 98-99 (Table 4.2, p. 99)"
status: seed
spade: simulated
tags: [digital, fpgas, memory, bram, tables]
aliases:
  - Block RAM
  - Block RAMs
  - BRAM
  - BRAM36
  - M20K
  - Memory Block
---

# Block Memory

A hardened SRAM tile of fixed total capacity whose depth-versus-width aspect ratio is chosen at configuration time — the only FPGA memory that reaches megabits, bought with a read that is registered inside the tile and therefore never combinational.

```tikz title="Block RAM tile: fixed capacity, configurable aspect ratio, registered read on both ports"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---------------- the tile ----------------
  \draw[thick] (0,0) rectangle (5.6,5.0);
  \node at (2.8,4.45) {\textbf{36\,kbit SRAM array}};
  \node at (2.8,3.70) {depth $D$ $\times$ width $w$};
  \node at (2.8,3.05) {$32\mathrm{k}{\times}1$ \ $16\mathrm{k}{\times}2$ \ $8\mathrm{k}{\times}4$};
  \node at (2.8,2.55) {$4\mathrm{k}{\times}9$ \ $2\mathrm{k}{\times}18$};
  \node at (2.8,2.05) {$1\mathrm{k}{\times}36$ \ $512{\times}72$};
  \node at (2.8,1.30) {aspect ratio chosen at};
  \node at (2.8,0.85) {configuration time,};
  \node at (2.8,0.40) {not at run time};

  % ---------------- port A ----------------
  \draw[-latex] (-3.0,4.55) -- (0,4.55);
  \node[anchor=west] at (-3.0,4.80) {$\mathit{we}_A$ \ (1)};
  \draw[-latex] (-3.0,3.95) -- (0,3.95);
  \node[anchor=west] at (-3.0,4.20) {$\mathit{addr}_A$ \ ($a$)};
  \draw[-latex] (-3.0,3.35) -- (0,3.35);
  \node[anchor=west] at (-3.0,3.60) {$\mathit{di}_A$ \ ($w$)};
  \draw[-latex] (-3.0,2.75) -- (0,2.75);
  \node[anchor=west] at (-3.0,3.00) {$\mathit{clk}_A$};

  % ---------------- port B ----------------
  \draw[-latex] (-3.0,1.85) -- (0,1.85);
  \node[anchor=west] at (-3.0,2.10) {$\mathit{we}_B$ \ (1)};
  \draw[-latex] (-3.0,1.25) -- (0,1.25);
  \node[anchor=west] at (-3.0,1.50) {$\mathit{addr}_B$ \ ($a$)};
  \draw[-latex] (-3.0,0.65) -- (0,0.65);
  \node[anchor=west] at (-3.0,0.90) {$\mathit{di}_B$ \ ($w$)};
  \draw[-latex] (-3.0,0.05) -- (0,0.05);
  \node[anchor=west] at (-3.0,0.30) {$\mathit{clk}_B$};

  % ---------------- read paths through the pipeline registers ----------------
  \draw (5.6,3.95) -- (6.4,3.95);
  \draw[thick] (6.4,3.55) rectangle (7.5,4.35);
  \node at (6.95,3.95) {reg};
  \draw[-latex] (7.5,3.95) -- (9.3,3.95);
  \node[anchor=west] at (7.7,4.35) {$\mathit{do}_A$ \ ($w$)};

  \draw (5.6,1.25) -- (6.4,1.25);
  \draw[thick] (6.4,0.85) rectangle (7.5,1.65);
  \node at (6.95,1.25) {reg};
  \draw[-latex] (7.5,1.25) -- (9.3,1.25);
  \node[anchor=west] at (7.7,1.65) {$\mathit{do}_B$ \ ($w$)};

  \node[anchor=west] at (5.9,2.75) {output register is};
  \node[anchor=west] at (5.9,2.30) {part of the tile};

  % ---------------- annotations ----------------
  \node[anchor=west] at (-3.0,5.50) {true dual port: each port may read \emph{and} write, on its own clock};
  \node[anchor=west] at (-3.0,-0.75) {$a=\log_2 D$: one extra address bit doubles the number of tiles};
  \node[anchor=west] at (-3.0,-1.30) {throughput $=$ nominal FPGA clock; latency $\ge 1$ cycle, in practice several};
\end{circuitikz}
\end{document}
```

**Fix the bit count, then sell the shape.** A block RAM is a full-custom SRAM macro dropped into the reconfigurable fabric exactly as a DSP block is (p. 98): the array itself is not reconfigurable, only its port geometry is. AMD/Xilinx 7th-generation and UltraScale tiles hold 36 kbit, Intel's M20K holds 20 kbit, and each publishes a fixed menu of $(\text{depth} \times \text{width})$ configurations (Table 4.2, p. 99):

| Device | Tile | Configurations $(D \times w)$ |
| --- | --- | --- |
| AMD/Xilinx 7th gen & UltraScale | 36 kbit | $32\text{k}\times1$, $16\text{k}\times2$, $8\text{k}\times4$, $4\text{k}\times9$, $2\text{k}\times18$, $1\text{k}\times36$, $512\times72$ |
| Intel Stratix 5/10 (M20K) | 20 kbit | $2\text{k}\times10$, $1\text{k}\times20$, $512\times40$ |

**Read the menu arithmetically and the nameplate stops being a single number.** For Intel every row multiplies out to the same $20{,}480$ bits, so "20 kbit" is exact. For AMD it does not: $32\text{k}\times1 = 32{,}768$ but $1\text{k}\times36 = 36{,}864$, a ratio of $\tfrac{9}{8}$. The pattern is visible in the widths themselves — $9 = 8+1$, $18 = 16+2$, $36 = 32+4$, $72 = 64+8$ — one extra bit per eight, present in the array but reachable only in the non-power-of-two modes. Design against $2^{15}$ usable bits per tile and treat the surplus as a bonus, because the $\times 9$ family is what you must select to get at it.

> [!warning] Not covered in the source — needs outside research
> The book gives Table 4.2 without commenting on the $32{,}768$ versus $36{,}864$ discrepancy. Vendor documentation calls the extra bits parity bits; whether they are freely usable as data in every mode, and what they cost in routing, is a device-handbook question this chapter does not answer.

**Turn "how big is my table?" into a tile count.** Suppose [[Table-Based Function Evaluation]] has left you a table of $2^a$ entries of $w$ bits each. A single configuration $(D, W)$ from the menu covers $D$ entries of $W$ bits, so you tile the table in both directions: $\lceil 2^a / D \rceil$ tiles deep, $\lceil w / W \rceil$ tiles wide, and the mapper is free to pick whichever configuration minimises the product.

$$N_{\text{BRAM}}(a, w) \;=\; \min_{(D,W)\,\in\,\mathcal{C}} \left\lceil \frac{2^a}{D} \right\rceil \left\lceil \frac{w}{W} \right\rceil$$

**Both ceilings vanish when the shape is a power of two, and that is why the choice usually does not matter.** If $D \mid 2^a$ and $W \mid w$ the ceilings are exact and the product telescopes to $2^a w / (D W)$ — a constant, since $DW$ is the tile capacity. Concretely, for the $8\times8 \to 16$ product used as the running comparison ($a = 16$, $w = 16$): $32\text{k}\times1$ gives $2 \times 16 = 32$, $2\text{k}\times18$ gives $32 \times 1 = 32$, $8\text{k}\times4$ gives $8 \times 4 = 32$ — all $32$, matching the book's count of 32 BRAM36 for that 1 Mbit table. The configurations that *lose* are exactly the ones where a ceiling bites: $1\text{k}\times36$ costs $64$ and $512\times72$ costs $128$, because $\lceil 16/36 \rceil = 1$ wastes more than half of each word. **Pick the widest configuration whose width divides $w$**, not simply the widest.

**Count the address decode too, or the estimate is a lie.** Splitting a table across $n$ tiles deep means the high $\lceil \log_2 n \rceil$ address bits no longer index a tile — they select between tiles, so the $w$-bit outputs must be multiplexed. A LUT6 with 6 inputs realises a $4{:}1$ multiplexer (4 data, 2 select), so an $n{:}1$ mux is a radix-4 tree of depth $\lceil \log_4 n \rceil$; for the 32-tile case that is $8 + 2 + 1 = 11$ LUT6 per output bit, i.e. $16 \times 11 = 176$ LUT6 plus a register stage to keep up with the RAM. That is small against 21,840 LUT6 for the blind LUT-logic implementation, but it is not zero, and it grows linearly with $n$ while the BRAM count grows with $n$ as well.

> [!warning] Not covered in the source — needs outside research
> Ch. 4 costs the BRAM column of the trade-off in tiles only; the multiplexer above the tiles is not costed. The $4{:}1$-per-LUT6 figure is derived here from [[Lookup-Tables]], and modern slices additionally carry dedicated wide-mux resources that the book does not describe, so 176 LUT6 is an upper bound.

**Treat the tile as a throughput resource, never a latency one.** A block RAM reaches the nominal frequency of the FPGA — roughly the delay of one logic element — but each access takes several cycles through dedicated internal pipeline registers (p. 98). The diagram draws that as an output register belonging to the tile, and the distinction is the whole engineering consequence: in a feed-forward datapath the registers are free, absorbed into a pipeline you were going to build anyway, and the operator retires one lookup per cycle. In a *recurrence* they are not free — they land inside the loop, so a digit recurrence or an accumulator that consults a BRAM table has its critical recurrence lengthened by the full read latency, and the loop must either be unrolled by that factor or run at one iteration per several cycles. This is the reason table lookups in [[Exact Accumulators]] and in iterative operators tend to stay in [[Distributed Memory]], whose read is combinational.

> [!important] Distributed memory reads combinationally; block memory does not. That single difference, not capacity, decides which one a given operator can use.

**Shrink the address before you shrink anything else.** $N_{\text{BRAM}} \propto 2^a$ means one extra address bit costs a doubling, the same exponential that makes blind LUT-logic tabulation hopeless. No configuration choice escapes it, because $DW$ is fixed by silicon. The only lever is arithmetic: [[Multipartite Methods]] splits a table into a table-of-values plus several small offset tables, replacing one $2^a$-deep table with tables of total depth an order of magnitude smaller at the price of $m-1$ additions. Apply that first, then map what is left onto tiles.

$$\boxed{\;N_{\text{BRAM}}=\min_{(D,W)\in\mathcal{C}}\left\lceil\frac{2^{a}}{D}\right\rceil\left\lceil\frac{w}{W}\right\rceil,\qquad DW \approx 2^{15}\ \text{(AMD)},\ 20480\ \text{(Intel)}\;}$$

**When it breaks.**

- **Depth caps well below the nameplate once the word is wide.** For $w \approx 16\text{-}18$ the deepest AMD configuration is $2\text{k}\times18$, so a single tile holds only an 11-bit address. Past $a = 11$ the tile count doubles per address bit, and that cliff — not total device capacity — is what usually ends the design.
- **Latency inside a loop.** Any recurrence that reads a table cannot hide the several-cycle access; see the paragraph above. A combinational-read table must go to distributed memory or to plain LUT logic.
- **Read-during-write on the same address** is the one behavioural corner the tile does not resolve for you: the RTL below is read-first (the old word comes out), but hardware tiles are configurable to write-first or no-change, and the two ports of a true dual-port tile writing the same address in the same cycle is undefined.

> [!warning] Not covered in the source — needs outside research
> Sect. 4.3.3 states that block RAMs are "usually true dual-port" and that some configurations are simple dual-port only, but gives no read-during-write semantics, no cycle count for the access latency ("several"), and no $f_{\max}$ figure. Every one of those is a device-handbook number.

- **Running out is a hard wall.** Tiles are a fixed device resource like DSP blocks; when they are gone the fallback is distributed memory at roughly 64 bits per LUT6, three orders of magnitude denser in area per bit. Stratix 10's eSRAM (~5.90 Mb, single-port, a handful per device) does not help — it is too coarse and too scarce for application-specific arithmetic, and the book says so.

**RTL (Spade).** The stdlib's `clocked_memory` is the primitive a synthesiser recognises as a block RAM; wrapping its asynchronous read in a register is what makes the inference legal and models the tile's output stage.

```spade
/// Simple dual-port block RAM: one write port, one synchronous (registered)
/// read port. N = 2^AW words of DW bits; N*DW <= 36864 fits one AMD tile.
entity bram<#uint AW, #uint DW, #uint N>(
    clk: clock,
    we: bool,
    waddr: uint<AW>,
    wdata: uint<DW>,
    raddr: uint<AW>,
) -> uint<DW> {
    let mem: Memory<uint<DW>, N> =
        inst std::mem::clocked_memory(clk, [(we, waddr, wdata)]);
    reg(clk) dout = inst std::mem::read_memory(mem, raddr);
    dout
}
```

`waddr`/`raddr` are the $a$-bit address buses of the diagram, `wdata`/`dout` the $w$-bit data buses; `AW = 10`, `DW = 36`, `N = 1024` instantiates exactly the $1\text{k}\times36$ configuration. The `reg(clk)` is the tile's output register drawn outside the array, and it is the only sequential element — everything else is the macro. `read_memory` is combinational on the array contents, so writing and reading the same address in one cycle yields the *old* word: read-first, verified in simulation. Synthesis will do one thing the drawing does not: the write port and the read port here share `clk`, whereas a real tile has independent `clk_A`/`clk_B`, and a genuine dual-clock instance needs `std::mem::dp_bram` plus the clock-domain-crossing discipline that comes with it. `N` cannot be written as `{1 << AW}` — Spade rejects `<<` in a type expression — so the word count is a third generic parameter that the caller must keep consistent with `AW`.

**Related Notes.**

- [[Distributed Memory]] – compares: the same storage built from SLICEM LUTs, combinational read, ~64 bit per LUT6 instead of 36 kbit per tile.
- [[Table-Based Function Evaluation]] – supports: produces the $(a, w)$ that $N_{\text{BRAM}}$ consumes.
- [[Multipartite Methods]] – extends: the only way to beat the $2^a$ doubling, by splitting one deep table into several shallow ones.
- [[Exact Accumulators]] – counter-example: a recurrence where the tile's read latency lands inside the loop and disqualifies it.
- [[Choosing an FPGA Primitive]] – compares: the full LUT-logic / DSP / block-RAM trade-off of which this note is one column.
- [[DSP Blocks]] – compares: the other hardened macro, embedded in the fabric the same way and rationed the same way.
- [[Lookup-Tables]] – depends-on: the $4{:}1$-mux-per-LUT6 fact used to cost the address decode.
- [[FPGAs]] – depends-on: the fabric these tiles are embedded in.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- Sect. 4.3, p. 95 — memory elements as a class; runtime data versus tables of precomputed values.
- Sect. 4.3.3, p. 98 — 36 kbit AMD / 20 kbit Intel tiles, depth-width trade-off, true versus simple dual port, thousands of cells per device, nominal frequency with several-cycle access, Stratix 10 eSRAM.
- Table 4.2, p. 99 — the configuration menus reproduced above.
- Sect. 4.1.1, p. 90 — the LUT cost bound used for the address-decode estimate.

> [!warning] Source-navigation correction
> Within Chapter 4 the PDF-to-printed-page offset is **+23**, not the +22 that holds from Chapter 5 onward: PDF 118 renders printed 95, PDF 123 renders printed 100. The break is at PDF 124 (the unnumbered "Part I" divider), after which a blank printed page 102 is absent from the PDF.
