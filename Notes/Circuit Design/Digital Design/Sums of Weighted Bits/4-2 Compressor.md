---
title: "4:2 Compressor"
description: "Two full adders per cell plus one lateral k_i signal to the neighbour: 4n+1 bits into 2n+1 with no carry propagation, so unlike a counter it stays usable down to the last compression stage; only pays on ASIC if the cell is hand-optimised at gate or transistor level."
kind: circuit
source: "ASA §7.3.2.2, pp. 181-182"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, compressor, carry-save, asic]
aliases:
  - "4:2 Compressor"
  - "4:2 Compressor Cell"
  - "4:2 Row Compressor"
  - "Row Compressor"
---

# 4:2 Compressor

A row compressor whose cell absorbs four bits of one weight plus one lateral bit from its right-hand neighbour, and whose lateral *output* is computed without ever looking at the lateral *input* — so the row has constant depth in $n$, unlike an adder row of the same shape.

```tikz title="4:2 compressor row of three cells, showing the lateral k path"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \foreach \i in {0,1,2} {
    \pgfmathsetmacro\X{-3.4*\i}
    \node[draw,fill=white,minimum width=1.0cm,minimum height=0.6cm] at (\X+1.05,2.2) {FA};
    \node[draw,fill=white,minimum width=1.0cm,minimum height=0.6cm] at (\X+0.55,0.9) {FA};
    \node[anchor=south,font=\footnotesize] at (\X+0.15,3.4) {$d_\i$};
    \node[anchor=south,font=\footnotesize] at (\X+0.75,3.4) {$c_\i$};
    \node[anchor=south,font=\footnotesize] at (\X+1.15,3.4) {$b_\i$};
    \node[anchor=south,font=\footnotesize] at (\X+1.75,3.4) {$a_\i$};
    \draw[->] (\X+0.75,3.35) -- (\X+0.75,2.5);
    \draw[->] (\X+1.15,3.35) -- (\X+1.15,2.5);
    \draw[->] (\X+1.75,3.35) -- (\X+1.75,2.2) -- (\X+1.55,2.2);
    \draw[->] (\X+0.15,3.35) -- (\X+0.15,1.2);
    \draw[->] (\X+1.05,1.9) -- (\X+1.05,1.5) -- (\X+0.85,1.5) -- (\X+0.85,1.2);
    \draw[->] (\X+0.55,0.6) -- (\X+0.55,-0.15);
    \draw[->] (\X+0.05,0.9) -- (\X-0.45,0.9) -- (\X-0.85,-0.15);
    \pgfmathtruncatemacro\j{\i+1}
    \node[anchor=north,font=\footnotesize] at (\X+0.55,-0.2) {$t_\i$};
    \node[anchor=north,font=\footnotesize] at (\X-0.85,-0.2) {$s_\j$};
  }
  \foreach \i in {0,1} {
    \pgfmathsetmacro\X{-3.4*\i}
    \pgfmathtruncatemacro\j{\i+1}
    \draw[->] (\X+0.55,2.2) -- (\X-1.35,2.2) -- (\X-2.35,0.9);
    \node[anchor=south,font=\footnotesize] at (\X-1.0,2.26) {$k_\j$};
  }
  \draw[->] (-6.25,2.2) -- (-8.80,2.2) -- (-8.80,-0.15);
  \node[anchor=south,font=\footnotesize] at (-7.9,2.26) {$k_3$};
  \node[anchor=north,font=\footnotesize] at (-8.80,-0.2) {$t_3$};
  \draw[->] (2.60,3.35) -- (2.60,2.2) -- (1.05,0.9);
  \node[anchor=south,font=\footnotesize] at (2.60,3.4) {$k_0$};
  \node[anchor=north,font=\footnotesize] at (-3.1,-1.05)
    {$4n{+}1=13$ input bits $\;\longrightarrow\;$ $2n{+}1=7$ output bits, $n=3$};
  \node[anchor=north,font=\footnotesize] at (-3.1,-1.55)
    {$t$ row: $t_3\dots t_0$ (4 bits)\quad $s$ row: $s_3\,s_2\,s_1$ (3 bits)};
\end{circuitikz}
\end{document}
```

*after Fig. 7.21a, p. 181. The escaping lateral bit $k_n$ is emitted as $t_n$, joining the $t$ row at weight $2^n$.*

**Start from the counter and watch it run out.** A $(p;q)$ [[Parallel Counter]] eats $p$ bits of a single weight and emits their population count on $q=\lceil\log_2(p+1)\rceil$ bits — a *column* becomes a *row*. The full adder is $(3;2)$, and compression per output bit is best at $p=2^q-1$, giving $(7;3)$ and $(15;4)$. But a $(p;q)$ counter is only defined when the column is at least $p$ tall, so every large counter is unusable in the late stages of a [[Compressor Trees|compressor tree]], exactly where the heap is short and the schedule is tight (p. 180).

**Let the compressor work across columns instead of down one.** The 4:2 row compressor takes four bits per column over $n$ adjacent columns, plus a single bit $k_0$ entering at the right, and produces two output rows. Every signal here is one bit: $a_i,b_i,c_i,d_i$ have weight $2^i$ for $i=0\dots n-1$, the lateral $k_i$ has weight $2^i$, and the outputs are $t_i$ at weight $2^i$ and $s_{i+1}$ at weight $2^{i+1}$. The whole row is $4n+1$ input bits and $2n+1$ output bits, an unconditional removal of $\delta=2n$ dots — see [[Bit Heaps]] for the dot bookkeeping this feeds.

**The cell is two full adders stacked, and the wiring order is the entire trick.** The upper [[Full Adder]] takes $a_i,b_i,c_i$; the lower one takes its sum together with $d_i$ and the lateral $k_i$:

$$(\sigma_i,\;k_{i+1}) = \mathrm{FA}(a_i,b_i,c_i),\qquad (t_i,\;s_{i+1}) = \mathrm{FA}(\sigma_i,\,d_i,\,k_i).$$

Writing $\mathrm{FA}(x,y,z)=(x\oplus y\oplus z,\;\mathrm{maj}(x,y,z))$ and expanding the majority by distributivity of AND over OR, $\mathrm{maj}(x,y,z)=xy\vee z(x\oplus y)$, gives the cell in closed form:

$$\sigma_i = a_i\oplus b_i\oplus c_i,\quad k_{i+1}=\mathrm{maj}(a_i,b_i,c_i),\quad t_i=\sigma_i\oplus d_i\oplus k_i,\quad s_{i+1}=\mathrm{maj}(\sigma_i,d_i,k_i).$$

**Conservation is just the two full-adder identities added together.** Each full adder satisfies $x+y+z=\text{sum}+2\cdot\text{carry}$, so summing the upper cell's $a_i+b_i+c_i=\sigma_i+2k_{i+1}$ with the lower cell's $\sigma_i+d_i+k_i=t_i+2s_{i+1}$ cancels $\sigma_i$ and leaves the cell invariant $a_i+b_i+c_i+d_i+k_i = t_i+2s_{i+1}+2k_{i+1}$. Multiplying by $2^i$ and telescoping over $i=0\dots n-1$ makes every internal $k_i$ cancel against its own $2\cdot 2^{i-1}k_i$, leaving only the row's boundary terms $k_0$ and $2^nk_n$.

> [!important]
> $k_{i+1}=\mathrm{maj}(a_i,b_i,c_i)$ contains no $k_i$. The lateral path is one full adder long, full stop, and the row's depth is two full adders for any $n$. Swap one argument — write $k_{i+1}=\mathrm{maj}(a_i,b_i,k_i)$ instead, which is the picture a carry-propagate row would draw — and the recurrence closes on itself into the $O(n)$ chain of a ripple-carry adder. It is the choice of *which three* of the five cell inputs feed the upper adder that keeps it open, which is why this is [[Carry-Save Adder|carry-save]] behaviour laid out as a row.

**Two output rows, but $2n+1$ bits, not $2n$.** The $t$ row occupies weights $2^0\dots2^{n-1}$ and the $s$ row occupies $2^1\dots2^n$; the escaping $k_n$ also has weight $2^n$, and the book emits it as $t_n$ so that the $t$ row is $n+1$ bits and the $s$ row is $n$ bits. Both $t_n$ and $s_n$ can be $1$ at once — take $a=b=c=1$, which forces $k_n=1$ and $\sigma=1$, then any of $d,k_{n-1}$ set forces $s_n=1$ — so the top column really does carry two bits and the final adder is one bit wider than "two $n$-bit rows" would suggest.

**On ASIC it only pays if you own the cell.** A 4:2 row of width $n$ is $2n$ full adders, which is precisely what a plain $(3;2)$-only [[Dadda Tree|Dadda]] or [[Reduced Area Compressor Tree|reduced-area]] schedule would spend to remove the same $2n$ dots — so a 4:2 assembled from stock full-adder cells buys nothing but regular layout. The win comes from treating the five-input, three-output cell as one custom cell and optimising it at gate or transistor level [Wei81; PP01; LN96; CGZ04]. There is real slack to recover: substituting $\sigma_i$ collapses the sum output to a five-input parity $t_i=a_i\oplus b_i\oplus c_i\oplus d_i\oplus k_i$, four cascaded 2-input XORs in the naive build, which a custom cell flattens into one gate. Its structural advantage over a large counter survives either way: with no height precondition, it is usable down to the last compression stage (p. 182).

> [!warning] The source asserts the hand-optimised cell is a win but never quantifies it — no gate count, no transistor count, no delay for the optimised 4:2 against two cascaded full adders. The four citations are given without figures. Needs outside research before the trade-off can be made numerically.

**The generalisation exists and flattens fast.** The same construction gives 5:2 and 7:3 row compressors [PP01; CGZ04; MPS91]; the 7:3 cell has nine inputs, five outputs and **two** lateral carries to the neighbour. Beyond that the cell grows faster than the compression it delivers and the returns diminish (p. 182). For irregular input shapes the right generalisation is a different axis entirely — the [[Generalized Parallel Counter]], which lets inputs sit in different columns.

**On FPGA the premise inverts.** The 4:2's selling point is *avoiding* carry propagation, but a hard carry chain makes propagation nearly free, so the property is worth almost nothing there while the lateral wire still costs generic routing. The FPGA 4:2 of Fig. 7.24 (p. 186) therefore deliberately puts a carry chain back in and saves the carry as an extra output row instead, reaching $E=2-\tfrac1k$ at delay $\tau_L+k\tau_{CC}$ (Table 7.3, p. 184) — see [[Carry-Chain 4-2 Compressor]]. In the same table the plain full adder is the *worst* compressor on FPGA: a whole LUT6 for $E=1$.

$$\boxed{\ a_i+b_i+c_i+d_i+k_i \;=\; t_i + 2\,(s_{i+1}+k_{i+1}),\qquad k_{i+1}=\mathrm{maj}(a_i,b_i,c_i)\ }$$

**Where it stops paying.**

- **Columns shorter than four.** The row wants four input bits present in every column it spans. A multiplier heap is triangular, so at both ends the row must be truncated or zero-padded, and a padded column spends a full cell to remove nothing.
- **Stock-cell libraries.** Without a custom 4:2 cell the $2n$ full adders are better spent by a scheduler that can place them freely; see [[Choosing a Compressor Tree]].
- **Any FPGA target.** The no-propagation property is the thing you are paying for and the carry chain gives it away for free.
- **Counting the output as $2n$ bits.** It is $2n+1$; $t_n$ and $s_n$ collide at weight $2^n$.
- **Latency scaling.** Depth is constant in $n$, but the $\log$ in the *tree* is untouched: a stage of 4:2 rows takes height 4 to height 2, so a heap of height $h$ still needs $\Theta(\log h)$ stages. The base improves from Dadda's $1.5$ to $2$; the asymptotics do not move.

**RTL.**

```spade
fn fa(x: bool, y: bool, z: bool) -> (bool, bool) {
    ((x != y) != z, (x && y) || (z && (x != y)))
}

/// One 4:2 cell at bit position i — exactly Fig. 7.21a.
fn comp42_cell(a: bool, b: bool, c: bool, d: bool, k: bool) -> (bool, bool, bool) {
    let (sigma, k_out) = fa(a, b, c);
    let (t, s) = fa(sigma, d, k);
    (t, s, k_out)
}

fn maj<#uint N>(x: uint<N>, y: uint<N>, z: uint<N>) -> uint<N> {
    (x & y) | (z & (x ^ y))
}

/// A row of N cells: 4N+1 bits in, 2N+1 bits out.
fn comp42_row<#uint N>(a: uint<N>, b: uint<N>, c: uint<N>, d: uint<N>, k0: bool)
        -> (uint<N>, uint<{N + 1}>, bool) {
    let sigma = a ^ b ^ c;
    let kh    = maj(a, b, c);
    let k     = (kh << 1) | zext::<1, N>(k0.as_uint());
    let t     = sigma ^ d ^ k;
    let s     = maj(sigma, d, k).concat(0u1);
    (t, s, kh.msb())
}
```

`comp42_cell` is one column of the diagram: `sigma` is the wire from the upper FA down into the lower one, `k_out` is the arrow leaving to the left, `k` the arrow arriving from the right. `comp42_row` is the same circuit written a word at a time — and the no-propagation property is visible as syntax, because `k` is obtained from `kh` by a **shift**, not by a recurrence. A ripple-carry adder cannot be written this way; that shift would have to read its own output. Widths: `s` is `maj(...)` concatenated with a zero LSB, which is the $\times 2$ that moves the carry row to weight $2^{i+1}$, so it is `uint<N+1>`; the escaping $k_n$ is the bit that `kh << 1` drops off the top, recovered as `kh.msb()`. All combinational — no clock, no register. Synthesis will not preserve the two-FA drawing: each of a cell's three outputs is a function of at most five signals (the four column bits plus $k_i$), so on a 6-LUT part a cell flattens to three LUT6 with no full adder left anywhere in the netlist — which is the same "optimise below the FA abstraction" argument the note makes for ASIC, arriving for free.

Verified against the behavioural reference $a+b+c+d+k_0 = t + s + 2^{8}k_8$ for $N=8$: 7 named vectors including the asymmetric $1+128$ with and without $k_0$, plus a 4000-vector random sweep, all passing.

**Related notes.**

- [[Full Adder]] – depends-on: the cell is two of them, and the choice of which three inputs go to the upper one is what removes the carry chain.
- [[Carry-Save Adder]] – compares: same "keep the carry as a second row" idea, one lateral bit deep instead of zero.
- [[Parallel Counter]] – compares: the sibling that compresses within a column and therefore dies once the heap is shorter than $p$.
- [[Carry-Chain 4-2 Compressor]] – counter-example: on FPGA the carry chain is reintroduced on purpose, and this note's central property becomes worthless.
- [[Generalized Parallel Counter]] – extends: drops the requirement that all inputs of a cell share a weight.
- [[Compressor Trees]] – supports: the stage-level schedule that decides where a 4:2 row is placed at all.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §7.3.2.1 Counters, p. 180.
- §7.3.2.2 Row Compressors and Fig. 7.21, pp. 181–182.
- §7.3.2.5 Row Compressors for FPGAs, Table 7.3 p. 184 and Fig. 7.24 p. 186.
