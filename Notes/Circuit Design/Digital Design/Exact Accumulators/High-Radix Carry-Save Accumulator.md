---
title: "High-Radix Carry-Save Accumulator"
description: "Cut the carry propagation every alpha bits and hold each chunk's carry-out in a flip-flop: the critical path becomes alpha bits instead of w_A, for k-1 registers and k flush cycles at the end."
kind: circuit
source: "ASA §21.2.3, pp. 635-636"
status: seed
spade: simulated
tags: [digital, exact-accumulators, accumulator, carry-save, redundant, fpga, iterative]
aliases:
  - High-Radix Carry-Save Architecture
  - High-Radix Carry-Save Accumulation
  - Chunked Accumulator
  - Segmented Accumulator
  - Radix-2^alpha Carry-Save Accumulator
---

# High-Radix Carry-Save Accumulator

A wide fixed-point accumulator whose adder is chopped into $k$ independent $\alpha$-bit adders, each one's carry-out delayed by a flip-flop before it reaches its neighbour — so the loop's critical path is $\alpha$ bits regardless of how wide the accumulator is.

```tikz title="High-radix carry-save accumulator: k alpha-bit adders, k alpha-bit registers, and k-1 one-bit carry registers between them"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- row labels
  \node[anchor=east] at (-0.15,6.65) {$X_{\text{fix}} =$};
  \node[anchor=east] at (-0.15,5.2)  {$\alpha$-bit adders};
  \node[anchor=east] at (-0.15,3.6)  {$\alpha$-bit registers};
  \node[anchor=east] at (-0.15,1.75) {$A =$};

  % ---- X_fix strip
  \draw (0.0,6.4) rectangle (15.6,6.9);
  \draw (3.9,6.4) -- (3.9,6.9);
  \draw (7.8,6.4) -- (7.8,6.9);
  \draw (11.7,6.4) -- (11.7,6.9);
  \node[anchor=south,scale=0.8] at (7.8,6.92)
    {$w_A$ bits, split into $k=\lceil w_A/\alpha\rceil$ chunks of $\alpha$};

  % ---- A strip
  \draw (0.0,1.5) rectangle (15.6,2.0);
  \draw (3.9,1.5) -- (3.9,2.0);
  \draw (7.8,1.5) -- (7.8,2.0);
  \draw (11.7,1.5) -- (11.7,2.0);

  % ---- four chunk columns
  \foreach \c in {1.95,5.85,9.75,13.65} {
    \draw (\c-1.05,4.8) rectangle (\c+1.05,5.6);
    \node[scale=0.72] at (\c-0.7,5.2) {$c_{\text{out}}$};
    \node at (\c,5.2) {$+$};
    \node[scale=0.72] at (\c+0.7,5.2) {$c_{\text{in}}$};
    \draw[fill=black!8] (\c-1.05,3.2) rectangle (\c+1.05,4.0);
    \node[scale=0.8] at (\c,3.6) {register};
    \draw[->] (\c,6.4) -- (\c,5.6);
    \node[anchor=west,scale=0.75] at (\c+0.06,6.0) {$\alpha$};
    \draw[->] (\c-0.5,4.8) -- (\c-0.5,4.0);
    \node[anchor=east,scale=0.75] at (\c-0.56,4.4) {$\alpha$};
    \draw[->] (\c+0.5,4.0) -- (\c+0.5,4.8);
    \node[anchor=west,scale=0.75] at (\c+0.56,4.4) {$\alpha$};
    \draw[->] (\c,3.2) -- (\c,2.0);
    \node[anchor=west,scale=0.75] at (\c+0.06,2.6) {$\alpha$};
  }

  % ---- carry registers in the gaps; carry flows right (LSB) to left (MSB)
  \foreach \g/\n in {11.7/1, 7.8/2, 3.9/3} {
    \draw[fill=black!8] (\g-0.3,4.8) rectangle (\g+0.3,5.6);
    \node[scale=0.8] at (\g,5.2) {$c_{\n}$};
    \draw[->] (\g+0.9,5.2) -- (\g+0.3,5.2);
    \node[anchor=south,scale=0.7] at (\g+0.6,5.24) {$1$};
    \draw[->] (\g-0.3,5.2) -- (\g-0.9,5.2);
    \node[anchor=south,scale=0.7] at (\g-0.6,5.24) {$1$};
    \draw[black!45,dashed] (\g,4.8) -- (\g,1.95);
    \draw[fill=black!25] (\g-0.22,1.55) rectangle (\g+0.22,1.95);
    \node[anchor=south east,scale=0.7] at (\g-0.06,2.26) {$c_{\n}$};
  }

  % ---- sign bit into the carry-in of the least significant chunk
  \draw (15.9,7.3) -- (15.9,5.2);
  \draw[->] (15.9,5.2) -- (14.7,5.2);
  \node[anchor=south] at (15.9,7.32) {$s$};

  % ---- annotation
  \node[anchor=north west,align=left,text width=7.4cm,scale=0.85] at (0.0,1.1)
    {Critical path is one $\alpha$-bit carry propagation, not $w_A$. The stored value
     is $A$ \emph{plus} the $k-1$ shaded carry bits: exact, but redundant, so $A$
     alone is the true sum only once the carries have been flushed.};
\end{circuitikz}
\end{document}
```

*after Fig. 21.10, p. 635.*

**Isolate the one operation in the accumulator that cannot be pipelined.** In the exact accumulator datapath the [[Exact Unnormalized Multiplier]], the [[Sign-Padding Alignment Shifter]] and the [[Accumulator-to-Float Converter]] are all purely combinational, so an arbitrary number of pipeline stages can be dropped into them and the frequency raised as far as routing allows. The $w_A$-bit addition cannot be cut that way: its result is its own next input, and a register inserted inside it would change what it computes. One clock period therefore has to cover one full $w_A$-bit carry propagation — 554 bits for a binary32 exact sum of products, 4196 for the binary64 [[Kulisch Accumulator]] — and that single path sets the frequency of the entire operator. Every other block gets to be as fast as you like; this one decides.

**Break the carry chain at fixed intervals and register what falls out.** Split $X_{\text{fix}}$ and the register output $A$, both $w_A$ bits, into $k = \lceil w_A/\alpha\rceil$ chunks of $\alpha$ bits, and split the $w_A$-bit adder into $k$ independent $\alpha$-bit adders. On every cycle, chunk $j$ adds three things: its own $\alpha$ bits of $X_{\text{fix}}$, its own $\alpha$ bits of $A$, and one carry bit — the carry-*out* that its right-hand (less significant) neighbour produced *on the previous cycle*, parked in a 1-bit register $c_{j-1}$. Writing $t$ for the cycle index and $j = 0\ldots k-1$ from the LSB chunk upwards,

$$A_j^{t+1} \;=\; \left(A_j^{t} + X_j^{t} + c_{j-1}^{t}\right) \bmod 2^{\alpha},
\qquad
c_j^{t+1} \;=\; \left\lfloor \frac{A_j^{t} + X_j^{t} + c_{j-1}^{t}}{2^{\alpha}} \right\rfloor$$

The two lines are the same $(\alpha{+}1)$-bit sum read twice: $A_j^{t+1}$ is its low $\alpha$ bits, $c_j^{t+1}$ its MSB. The boundary condition $c_{-1}^{t} = s$ is not a special case but the sign of the current summand, feeding the carry-in of the LSB chunk to complete the two's-complement negation $-x = \bar{x}+1$ started by the XOR row of the [[Two's-Complement Exact Accumulator]]; a plain accumulator uses that carry-in for exactly the same purpose. The top chunk's carry-out $c_{k-1}$ has nowhere to go and is discarded, which is precisely the accumulator overflow that the [[Accumulator Exception FSM]] is there to catch.

**Nothing is thrown away, so the sum stays exact — the value merely stops being $A$.** Summing the recurrence over $j$ with weights $2^{\alpha j}$, the quantity the machine holds after cycle $t$ is

$$V^{t} \;=\; \sum_{j=0}^{k-1} A_j^{t}\,2^{\alpha j} \;+\; \sum_{j=0}^{k-2} c_j^{t}\,2^{\alpha (j+1)}$$

and it is *equal*, not approximately equal, to $\sum_{i<t} X_{\text{fix}}^{i}$. What changed is only the encoding: the accumulator now carries $w_A + k - 1$ bits of state representing a $w_A$-bit value, a **radix-$2^{\alpha}$ carry-save representation** in the sense of [[Redundant Number Systems]] — each radix-$2^\alpha$ digit is allowed the range $[0, 2^{\alpha}]$ rather than $[0, 2^{\alpha}-1]$, and that one extra value per digit is exactly what lets the addition finish in constant time no matter how many digits there are.

> [!important] $\alpha$ is a pure speed/area knob, not an accuracy knob
> The two endpoints are circuits that already have names. At $\alpha = w_A$ there is one chunk, no carry register, and the circuit *is* the plain [[RCA, Ripple-Carry Adder]] accumulator of [[Two's-Complement Exact Accumulator]]. At $\alpha = 1$ every bit position keeps its own carry flip-flop and the circuit *is* a [[CSA, Carry-Save Adder]] with its carry vector registered, at a cost of $w_A - 1$ extra flip-flops. Choosing $\alpha$ in between buys frequency at $k-1 = \lceil w_A/\alpha\rceil - 1$ flip-flops and costs **zero** accuracy, because the discarded information is not information — it is still in the machine.

**Pay for the redundancy once, at the end, not once per summand.** The price of the deferred carries is that $A$ alone is not the sum. A single input's contribution is only fully propagated $k$ cycles after it arrived, but a *new* input is still accepted every single cycle, which is the figure of merit that matters for an accumulator. To read the true value out, drive $X_{\text{fix}} = 0$ (and $s = 0$) until every carry has walked to the top: each zero cycle moves each live carry one chunk left, so $k-1$ zero cycles suffice and the book quotes "$k$ cycles (3 cycles in Fig. 21.10)", i.e. the $k-1$ of the figure rounded up. Over an accumulation of thousands of summands this is not a cost at all. If instead the running sum is needed on *every* cycle, the $c_j$ are handed to the [[Accumulator-to-Float Converter]] alongside $A$, where a separate adder propagates them — still $k$ cycles of latency, but pipelined, off the loop, and therefore free in frequency terms.

**On an FPGA this architecture is nearly free, because every wire it adds is a local one.** A logic cell already provides a flip-flop directly behind the adder bit it computes, so the $\alpha$-bit chunk registers occupy registers that would otherwise sit idle: on [[FPGAs]] the accumulator register costs nothing, and the addition rides the dedicated fast carry chain. The chunking preserves that — the $c_j$ loops are strictly local routing between adjacent columns of the fabric, never a long haul across the die — so on a device with fast carry chains $\alpha = 32$ already reaches very high frequency, and the whole solution costs **only a few percent** more than the monolithic ripple-carry accumulator it replaces (p. 636). A plain 64-bit two's-complement accumulator clocks above 200 MHz on a modern FPGA (p. 635); chunking is what keeps that number when $w_A$ is 554 instead of 64. On an ASIC the trade is less lopsided: the flip-flops are not free there, and a fast [[Adders|parallel-prefix adder]] is a real alternative to chunking — but it is still a $\log w_A$-deep path inside the loop, where chunking is $\alpha$-deep by construction.

$$\boxed{\;A_j^{t+1} + 2^{\alpha}c_j^{t+1} = A_j^{t} + X_j^{t} + c_{j-1}^{t},\quad c_{-1}^{t}=s,\quad k=\lceil w_A/\alpha\rceil,\quad
\text{cost } k-1 \text{ FFs},\quad \text{path } \alpha \text{ bits}\;}$$

**When it breaks.**

- The top carry-out $c_{k-1}$ is dropped, so the accumulator wraps modulo $2^{w_A}$ instead of saturating. In the exact-accumulation case that is fine by construction — $w_A$ was chosen so overflow cannot happen — but in an [[Application-Specific Exact Accumulator]] with a finite $m_A$ it is a real overflow that must be routed to the exception FSM. Chunking does not change that; it changes *where* the bit is.
- Shrinking $\alpha$ stops buying frequency once the flip-flop clock-to-Q plus setup time dominates the $\alpha$-bit carry propagation. The source gives $\alpha = 32$ as already sufficient on FPGA fabric with fast carry chains but no closed form for the optimal $\alpha$ — it is a synthesis-timing question, not an arithmetic one.
- Below roughly $\alpha \approx 4$ the $k-1$ flip-flops stop being a rounding error on the area and you are paying for a full carry-save accumulator; at that point use [[CSA, Carry-Save Adder]] directly and skip the chunk bookkeeping.
- $A$ in isolation is meaningless to any consumer that is not carry-aware: it cannot be compared, sign-tested, or converted without either a flush or the $c_j$ bits travelling with it. Anything reading the accumulator mid-flight must be told about the redundancy.
- The scheme assumes the accumulation runs long enough to amortise $k-1$ flush cycles. For $N$ comparable to $k$ — a length-8 dot product against a 554-bit accumulator — the flush is most of the work, and the plain wide adder at a lower clock is the better circuit.

**RTL (Spade).** One chunk of the recurrence, which is simultaneously one iteration in time and one slice in space; the full accumulator is $k$ of these wired carry-out to carry-in.

```spade
/// One chunk of a high-radix carry-save accumulator: the alpha-bit slice
/// A_j <- (A_j + X_j + c_{j-1}) mod 2^alpha,  c_j <- carry-out, both registered.
entity cs_acc_chunk<#uint A>(clk: clock, rst: bool, x: uint<A>, cin: bool)
    -> (uint<A>, bool)
{
    decl sum;
    reg(clk) a: uint<A> reset(rst: 0) = trunc(sum);
    reg(clk) c: bool reset(rst: false) = sum.msb();
    let sum: uint<{A + 1}> =
        zext::<A, {A + 1}>(a) +. zext::<A, {A + 1}>(x) +. zext(cin.as_uint());
    (a, c)
}
```

`sum` is the $(\alpha{+}1)$-bit output of one adder box in the diagram, read twice: `trunc(sum)` is the $\alpha$-bit bus into the chunk register, `sum.msb()` is the single wire into the $c_j$ box. Both are registered, which is the whole point — `cin` arrives from the neighbour's register output, so the combinational path between any two flip-flops is one $\alpha$-bit carry chain and nothing else. Everything is forced to $\alpha{+}1$ bits with `zext` and combined with the truncating `+.` rather than the widening `+`, because Spade's `+` returns $N{+}1$ bits and chaining two of them does not type-check; the carry is recovered from the MSB instead of from operator width. Synthesis will not build the drawn ripple-carry adder — on an FPGA it maps the $\alpha$-bit add plus its register onto one column of carry-chain-plus-flip-flop, which is exactly why the chunk register is free.

**Iteration count and loop control.** The operator runs one iteration per clock and accepts one summand per clock indefinitely; the *recurrence* needs $k = \lceil w_A/\alpha\rceil$ iterations for one summand's carries to reach the top, plus $k-1$ zero-input iterations at the end of the accumulation to flush. Loop control is almost nothing: no counter is needed during accumulation, and the flush is a $\lceil\log_2 k\rceil$-bit down-counter driving a single mux that forces $X_{\text{fix}} = 0$ and $s = 0$ — off the critical path, since it feeds the shifter's input side, not the loop.

A concrete `cs_acc_chunk::<4>` instantiated $k=4$ times into a 16-bit accumulator was checked against a behavioural 16-bit reference accumulator: 4677 vectors over 203 trials — named asymmetric cases (`0x0001`, `0x8000`, `0x000f`, `0x0fff`, `0xffff`, and `0x0001` with $s=1$), 40 back-to-back `0xffff` inputs so every chunk generates a carry every cycle, and 200 random sequences of 15 summands with random sign carry-in. Zero mismatches, and the measured worst-case flush was 3 zero cycles, confirming $k-1$ rather than $k$.

**Related Notes.**

- [[Two's-Complement Exact Accumulator]] – extends: this is that accumulator with its single $w_A$-bit adder cut into $k$ pieces; everything else in the loop is unchanged.
- [[Redundant Number Systems]] – depends-on: supplies the radix-$2^\alpha$ carry-save encoding that makes the deferred carries a representation rather than a loss.
- [[CSA, Carry-Save Adder]] – compares: the $\alpha=1$ endpoint, one carry flip-flop per bit instead of one per chunk.
- [[RCA, Ripple-Carry Adder]] – compares: the $\alpha=w_A$ endpoint, and the adder actually instantiated inside each chunk.
- [[FPGAs]] – supports: fast carry chains and the free register behind each adder bit are why the overhead is a few percent rather than a real cost.
- [[Accumulator-to-Float Converter]] – depends-on: consumes $A$ together with the $c_j$ when a running sum is needed every cycle instead of only at the end.
- [[Accumulator Exception FSM]] – supports: receives the discarded top carry-out as the accumulator overflow.
- [[Application-Specific Exact Accumulator]] – compares: where a finite $m_A$ makes that dropped carry a live exception rather than a structural impossibility.
- [[Kulisch Accumulator]] – compares: the widest case, 4196 bits for binary64, where chunking is not an optimisation but the only way to clock the thing.
- [[Choosing an Accumulator]] – compares: where this sits against every sibling accumulator architecture.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 21, "Floating-Point Accumulation and Sum of Products".

- §21.2.3 "High-Radix Carry-Save Architecture": the $\alpha$-chunking of the $w_A$-bit adder, $k = \lceil w_A/\alpha\rceil$, the $k-1$ additional carry registers, and Fig. 21.10, p. 635.
- §21.2.3 continued: local routing, $\alpha = 32$ on FPGA, the few-percent overhead against the ripple-carry accumulator of Fig. 21.8, the zero-input flush and the alternative of exporting the $c_i$ to the `FixToFloat` block, p. 636.
- §21.2.2.5: the two's-complement accumulator on FPGA — free register behind each adder bit, local routing, 64-bit accumulator above 200 MHz, p. 635.
- §5.2.6, p. 112: the radix-$2^\alpha$ carry-save representation this architecture stores its state in.
