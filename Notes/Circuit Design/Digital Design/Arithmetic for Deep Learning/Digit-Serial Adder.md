---
title: "Digit-Serial Adder"
description: "One digit of the sum per cycle with the carry held in a register: radix-16 for four cycles per 16-bit word, radix-2 for sixteen — how you spend the slack after pooling cuts the data rate to a quarter and then a sixteenth."
kind: circuit
source: "ASA §24.6.4, pp. 748-749"
status: seed
spade: simulated
tags: [digital, adder, digit-serial, bit-serial, cnn, fpga, arithmetic-for-deep-learning]
aliases:
  - Digit-Serial Adder
  - Digit Serial Adder
  - Digit-Serial Adders
  - Digit-Serial Adder/Subtractor
  - Bit-Sequential Adder
  - Bit-Serial Adder
  - Serial Adder
---

# Digit-Serial Adder

A carry-propagate adder folded in time: one radix-$2^k$ digit of the sum is produced per clock with the carry held in a single flip-flop, so the adder's logic cost falls by a factor of $\lceil n/k\rceil$ and its latency rises by the same factor.

```tikz title="Digit-serial adder, radix 16 and radix 2: a k-bit adder plus one carry flip-flop, iterated once per digit"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small, >=latex,
  blk/.style={draw, thick, rounded corners=1pt, inner sep=3pt, align=center,
              minimum height=0.75cm},
  rg/.style={draw, thick, rounded corners=1pt, fill=blue!10, inner sep=3pt,
             minimum height=0.75cm, minimum width=0.9cm},
  w/.style={->, thick}]

% ===================================================== (a) radix 16, K = 4
\begin{scope}[xshift=0cm]
  \node[blk, minimum width=2.2cm] (ad) at (0,0) {4-bit adder};
  \node[rg] (rg) at (-2.6,0) {reg};

  % operand digits in from the top
  \draw[w] (-0.45,1.7) -- (-0.45,0.38);
  \draw[w] ( 0.45,1.7) -- ( 0.45,0.38);
  \node[anchor=south] at (-0.45,1.72) {$X_i$};
  \node[anchor=south] at ( 0.45,1.72) {$Y_i$};
  \node[anchor=east, font=\footnotesize] at (-0.52,1.15) {4};
  \node[anchor=east, font=\footnotesize] at ( 0.38,1.15) {4};

  % carry out -> register
  \draw[w] (ad.west) -- (rg.east);
  \node[anchor=south, font=\footnotesize] at (-1.55,0.06) {$c_{i+1}$};

  % register -> up, over the top, down into the adder's carry-in
  \draw[w] (rg.north) -- (-2.6,0.95) -- (2.35,0.95) -- (2.35,0) -- (ad.east);
  \node[anchor=north, font=\footnotesize] at (1.55,-0.02) {$c_i$};

  % sum digit out
  \draw[w] (0,-0.38) -- (0,-1.55);
  \node[anchor=north] at (0,-1.58) {$S_i$};
  \node[anchor=west, font=\footnotesize] at (0.08,-1.0) {4};

  % clock and clear
  \draw[w] (-3.0,-1.15) -- (-3.0,-0.38);
  \draw[w] (-2.2,-1.15) -- (-2.2,-0.38);
  \node[anchor=north, font=\footnotesize] at (-3.0,-1.17) {clk};
  \node[anchor=north, font=\footnotesize] at (-2.2,-1.17) {rst};

  \node[anchor=north] at (-0.6,-2.15) {(a) radix 16 --- 4 cycles / 16-bit word};
\end{scope}

% ===================================================== (b) radix 2, K = 1
\begin{scope}[xshift=8.4cm]
  \node[blk, minimum width=1.0cm] (ad) at (0,0) {FA};
  \node[rg] (rg) at (-2.6,0) {reg};

  \draw[w] (-0.25,1.7) -- (-0.25,0.38);
  \draw[w] ( 0.25,1.7) -- ( 0.25,0.38);
  \node[anchor=south] at (-0.25,1.72) {$x_i$};
  \node[anchor=south] at ( 0.25,1.72) {$y_i$};
  \node[anchor=east, font=\footnotesize] at (-0.32,1.15) {1};
  \node[anchor=east, font=\footnotesize] at ( 0.18,1.15) {1};

  \draw[w] (ad.west) -- (rg.east);
  \node[anchor=south, font=\footnotesize] at (-1.55,0.06) {$c_{i+1}$};

  \draw[w] (rg.north) -- (-2.6,0.95) -- (1.75,0.95) -- (1.75,0) -- (ad.east);
  \node[anchor=north, font=\footnotesize] at (1.15,-0.02) {$c_i$};

  \draw[w] (0,-0.38) -- (0,-1.55);
  \node[anchor=north] at (0,-1.58) {$s_i$};
  \node[anchor=west, font=\footnotesize] at (0.08,-1.0) {1};

  \draw[w] (-3.0,-1.15) -- (-3.0,-0.38);
  \draw[w] (-2.2,-1.15) -- (-2.2,-0.38);
  \node[anchor=north, font=\footnotesize] at (-3.0,-1.17) {clk};
  \node[anchor=north, font=\footnotesize] at (-2.2,-1.17) {rst};

  \node[anchor=north] at (-0.6,-2.15) {(b) radix 2 --- 16 cycles / 16-bit word};
\end{scope}

\node[anchor=north west, font=\footnotesize, align=left] at (-3.4,-2.9)
 {Digits enter least-significant first, $i=0\ldots\lceil n/k\rceil-1$, one per clock.\\
  \texttt{rst} is pulsed in the cycle before digit $0$: it clears the carry for an
  add, and presets it to $1$ for a subtract ($-Y=\overline{Y}+1$).\\
  The carry register is the only state; the $n$-bit adder of the parallel design
  has been folded into $\lceil n/k\rceil$ uses of a $k$-bit one.};
\end{circuitikz}
\end{document}
```

*after Fig. 24.19, p. 749.*

**Cut the word into digits and the carry recurrence survives unchanged.** Write the $n$-bit operands in radix $\beta = 2^k$ as $X = \sum_{i=0}^{m-1} X_i\,2^{ki}$ with $m = \lceil n/k\rceil$ and $X_i \in \{0,\dots,2^k-1\}$ — a regrouping of the same bit string, not a change of format ([[Number Formats]]). Adding two such expansions digitwise gives $X_i + Y_i \le 2^{k+1}-2$, which needs $k+1$ bits, so exactly one bit of overflow crosses each digit boundary. Name it $c_{i+1}$ and the whole addition becomes the single recurrence

$$X_i + Y_i + c_i \;=\; S_i + 2^{k}\,c_{i+1},\qquad c_0 = 0,\qquad S_i\in[0,2^k),\ c_{i+1}\in\{0,1\}.$$

The bound is tight and never needs two carry bits: the left side is at most $(2^k-1)+(2^k-1)+1 = 2^{k+1}-1$, so $c_{i+1}\le 1$ by construction. That is the same statement as the carry recurrence of [[RCA, Ripple-Carry Adder]] with the full adder promoted from one bit to $k$; the only difference is where the $m$ instances of it live.

**Correctness is one induction, and it is what licenses discarding the last carry.** Assume after digit $i$ that $\sum_{j\le i}S_j 2^{kj} + 2^{k(i+1)}c_{i+1} = \sum_{j\le i}(X_j+Y_j)2^{kj}$. Multiplying the recurrence at step $i+1$ by $2^{k(i+1)}$ and adding gives the same statement at $i+1$, by associativity of integer addition; the base case is $c_0=0$. After the last digit, $S + 2^{n}c_m = X+Y$, so the digit stream $S$ is $X+Y \bmod 2^n$ and $c_m$ is the bit that does not fit. Throwing $c_m$ away is precisely the wrap that two's-complement arithmetic already relies on, which is why the same hardware serves signed and unsigned operands with no sign logic anywhere — the sign lives in the interpretation of the last digit, not in the datapath.

**Subtraction is free because the carry register has a reset port.** By the two's-complement identity $-Y = \overline{Y} + 1$, subtracting means complementing every digit of $Y$ and injecting a carry-in of $1$ at digit $0$. The complement is $k$ XOR gates fed by a `sub` line, and the $+1$ is the *reset value* of the carry flip-flop rather than an extra input — the flip-flop is cleared before digit $0$ of an addition and preset before digit $0$ of a subtraction. This is the one structural benefit of holding the carry in a register instead of a wire, and it is why the source calls these "digit-serial adders/subtractors" as a single block.

**The reason it appears in an unrolled CNN is rate matching, not area worship.** The unrolled ternary VGG-7 of [[Ternary MAC Unit]] is a stream architecture that iterates over the input pixels at one pixel per cycle, so every layer's hardware is sized for the input rate. Pooling breaks that: the first pooling layer cuts the data rate to $1/4$, the second to $1/16$ ([[Max Pooling Unit]]). A conventional stream architecture absorbs the slack by growing the channel count deeper in the network, but here **every channel already has its own hardware** — full unrolling means one adder per nonzero weight — so nothing absorbs it and the deep-layer adders would sit idle three cycles in four. Sharing one adder between channels is the obvious repair and it is not available: each adder implements a *different* constant subexpression found by RPAG or CSE ([[Multiplication by Constants]]), so two channels have no common operator to share. Digit-serial arithmetic spends the slack instead of wasting it — set $m$ equal to the rate-reduction factor and the operator is busy every cycle again.

$$\text{after first pooling: } k=4,\ m=4 \quad\text{(radix 16)};\qquad \text{after second: } k=1,\ m=16 \quad\text{(radix 2)}.$$

**The area saving is linear in the radix and it lands where the design is short.** At 16-bit activations the source budgets about **16 LUTs per parallel adder** (p. 748), which is the expected one LUT per bit on a fabric with a hard carry chain ([[FPGAs]]). Folding to radix 16 leaves a 4-bit adder — 4 LUTs — plus one flip-flop for the carry; folding to radix 2 leaves a single full adder, 1 LUT plus 1 flip-flop. Against 1.14 M MAC operations that is the difference between "about 18 million LUTs" and something a VU9P can hold, and the reported result is **66.6% of LUTs and 41.6% of flip-flops** on an AWS F1 VU9P at 122 k frames/s and 30 µs latency (p. 749). Note which of those two numbers is larger: the design is LUT-bound, so converting LUTs into flip-flops is not a neutral trade but a strictly favourable one on this device.

**What the loop costs is a counter per layer, not per adder, plus shift registers per pooling stage.** Each adder carries its own carry flip-flop and its own reset multiplexer, both $O(1)$ and both already counted above. The sequencing — which digit index is on the wires — is *identical for every adder downstream of the same pooling layer*, because they all consume the same stream, so one modulo-$m$ counter of $\lceil\log_2 m\rceil$ bits drives the `rst` pulse for the entire layer. That is the whole reason the technique is affordable at this scale: the control overhead amortises over thousands of adders. What does not amortise is the format conversion at the boundary. The source is explicit that **parallel-in/serial-out shift registers are required after each pooling stage** (p. 749), and afterwards every word is processed digit-wise; a PISO for an $n$-bit word is $n$ flip-flops with a $k$-bit output tap ([[Shifters]]), paid once per stream rather than once per adder, and it is the dominant part of the flip-flop budget.

**On an FPGA this buys area, not frequency — which is the opposite of the ASIC intuition.** The textbook argument for serial arithmetic is that it shortens the carry path from $n$ to $k$ and so raises $f_{\max}$. On a modern FPGA a 16-bit add already rides the dedicated carry chain and is nowhere near the critical path, so shortening it to 4 bits changes nothing about the clock. What changes is the LUT count, and LUTs are the binding constraint here. The corresponding cost is per-word latency: the operator's throughput is one *digit* per cycle and its latency one *word* per $m$ cycles, so an adder graph of depth $d$ built from digit-serial nodes has a latency of $d\,m$ cycles rather than $d$ combinational levels — but its throughput is still one word per $m$ cycles, which is exactly the rate the stream is now delivering.

$$\boxed{\ X_i + Y_i + c_i = S_i + 2^{k}c_{i+1},\quad c_0=0,\quad m=\lceil n/k\rceil\ \text{cycles},\quad \text{cost}\ \approx\ \tfrac{k}{n}\ \text{of the parallel adder} + 1\ \text{FF}\ }$$

**When it breaks.**

- **You cannot spend slack you do not have.** $m$ is bounded above by the rate-reduction factor; choose $m$ larger and the operator becomes the bottleneck and the whole stream stalls. This makes the radix a property of *where in the network the adder sits*, not a global design knob.
- **The saving saturates at radix 2.** A 1-bit adder is one LUT plus the carry chain, and there is nothing below one LUT. Past $k=1$ the only remaining lever is time-multiplexing several *different* additions onto one adder, which the sparsity-and-redundancy exploitation has already ruled out.
- **The flip-flop cost is not linear in the saving.** Going from radix 16 to radix 2 divides the adder LUTs by 4 but leaves the PISO/SIPO registers unchanged, so the marginal return falls off; on a device where flip-flops were the scarce resource the trade would reverse entirely.
- **LSD-first is a hard interface constraint.** Every consumer downstream must accept least-significant-digit-first. Comparison, maximum, rounding and normalisation all want the most significant digit first, so a max-pooling or ReLU stage sitting between two digit-serial adders forces a full reassembly — the reason the shift registers appear at the pooling boundaries specifically.
- **Fixed word width, no growth.** The recurrence is inherently mod $2^n$: the word length must be decided before the digits start flowing, since $m$ is baked into the counter. Accumulations that would have grown their word ([[Error Accuracy]]) must instead carry their guard bits inside the fixed 16-bit format from the start.

> [!warning] Latency balancing inside a serialised adder graph is not covered in the source
> The RPAG/CSE output is a DAG whose paths have different depths, so once every node becomes an $m$-cycle operator the arrival times at a merge node differ by $m$ times the depth difference and must be equalised with delay registers. The source describes the serialisation (p. 749) but reports no cost for this rebalancing, and it is not separable from the quoted 41.6% flip-flop figure. Treat the flip-flop budget as covering it implicitly rather than as excluding it.

**RTL (Spade).** One iteration of the digit recurrence — the entity below *is* the drawing, and running it $m$ times is the operator.

```spade
/// One digit-slice of a radix-2^K digit-serial adder/subtractor.
/// Digits arrive least-significant first; the carry lives in one flip-flop.
entity dsadd<#uint K>(clk: clock, rst: bool, sub: bool, x: uint<K>, y: uint<K>) -> uint<K> {
    decl cnext;
    // rst is pulsed in the cycle before digit 0: the loop opens with c = 0 for
    // an add and c = 1 for a subtract, which is the +1 of -y = ~y + 1.
    reg(clk) c reset(rst: sub) = cnext;

    let yi: uint<K> = if sub { ~y } else { y };
    let a:   uint<{K + 1}> = zext(x);
    let b:   uint<{K + 1}> = zext(yi);
    let cin: uint<{K + 1}> = zext(c.as_uint());

    let t: uint<{K + 1}> = trunc(a + b);
    let u: uint<{K + 1}> = trunc(t + cin);

    let cnext = u.msb();
    trunc(u)
}
```

`x` and `y` are the $X_i,Y_i$ arrows at the top of panel (a), the returned `trunc(u)` is $S_i$, and `c` is the shaded `reg` — the only state in the block. The width arithmetic is the recurrence: operands widen to $K{+}1$ bits so the sum cannot wrap, `u.msb()` *is* $c_{i+1}$ and `trunc(u)` is $S_i$, which is why $c_{i+1}$ never needs a second bit. Everything except the register is combinational, so the iteration critical path is one $K$-bit carry propagation. Synthesis will not build the two `trunc`ed additions as separate adders as the code reads: it maps the whole thing onto $K$ carry-chain cells with the carry-out taken from the top, and the `if sub` becomes the XOR gate on the $Y$ input rather than a multiplexer. Instantiating it at `K = 4` gives Fig. 24.19a and at `K = 1` gives Fig. 24.19b, where the $K$-bit adder degenerates to the single full adder drawn there.

**Loop cost.** $m = \lceil n/k\rceil$ clocks per word — 4 at radix 16, 16 at radix 2, for $n=16$. Around the datapath: one modulo-$m$ counter of $\lceil\log_2 m\rceil$ bits shared by every adder fed from the same stream, one carry flip-flop and one reset multiplexer per adder, and the PISO/SIPO shift registers at the pooling boundaries. Only the shift registers scale with the number of streams; the counter is amortised over the whole layer ([[Synchronous Sequential Logic]]).

**Verified.** Compiled with `spade 0.19.0` first try, then simulated at $K=4$ over 4-cycle words: 9 named vectors — including the asymmetric pair $\mathtt{0001}+\mathtt{0080}$ and its mirror, a carry rippling across three digits ($\mathtt{0FFF}+\mathtt{0001}$), the mod-$2^{16}$ wrap ($\mathtt{FFFF}+\mathtt{0001}$), and three subtractions — plus a 3000-case random sweep over $(X, Y, \mathtt{sub})$ compared against `X+Y` and `X-Y` in 16-bit Verilog arithmetic. 3009/3009 passed. The sweep is not vacuous: forcing `cnext = false` fails 2591 of the 3009, and replacing the subtract preset `reset(rst: sub)` with `reset(rst: false)` fails 1540.

**Related notes.**

- [[RCA, Ripple-Carry Adder]] – extends: the identical carry recurrence unrolled in space; this note folds the same $m$ stages into one stage used $m$ times, which is the whole space-time trade.
- [[Adders]] – compares: where a serial operator sits against every parallel one, and the only entry in that comparison whose cost is set by an external data rate rather than by the word length.
- [[Ternary MAC Unit]] – depends-on: $\pm1$ weights make every operation an add or subtract with no shifts, so serialising the entire layer needs exactly this one block and no digit-level realignment.
- [[Max Pooling Unit]] – depends-on: the source of the $1/4$ and $1/16$ rate drops that fix the radix; without a pooling stage there is no slack to spend.
- [[Multiplication by Constants]] – counter-example: the redundancy MCM exploits is what forbids the alternative fix of sharing one parallel adder between channels, since no two adders compute the same subexpression.
- [[Shifters]] – supports: the parallel-in/serial-out and serial-in/parallel-out registers that convert between word-parallel and digit-serial at every pooling boundary.
- [[Synchronous Sequential Logic]] – depends-on: the carry register, its reset semantics and the modulo-$m$ counter that sequences the digits.
- [[Choosing a Deep Learning Datapath]] – compares: the rate-matching decision this note answers locally, taken across the whole network.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §24.6.4 "Unrolling a Ternary CNN" — rate reduction of $1/4$ and $1/16$ after pooling, the radix-16 and radix-2 choices, the required parallel-in/serial-out shift registers, and Fig. 24.19 — p. 749.
- Same section, the 16-bit activation format, "16 LUTs to realize one adder", the 1 144 512 MAC operations of Table 24.7 and the ~18 million LUT estimate — p. 748.
- Same section, the VU9P/AWS F1 result: 66.6% of LUTs, 41.6% of flip-flops, 122 k frames/s, 30 µs latency — p. 749.
- Primary source cited by the chapter for the unrolled ternary CNN: Tridgell et al. (2019); Kumm et al. (2012) for RPAG and Hartley (2018) for its ternary-adder extension.
