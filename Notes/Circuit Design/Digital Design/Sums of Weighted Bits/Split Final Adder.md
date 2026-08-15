---
title: Split Final Adder
description: "Bits out of a triangular heap arrive Gaussian-like — LSBs and MSBs first, middle last — so a uniform fast adder is wasted: ripple-carry on the early LSBs, a prefix adder across the late middle, carry-select on MSBs whose carry-in arrives last. Truncation flattens the profile and pipelining removes it."
kind: circuit
source: "ASA §7.3.4, pp. 193-194"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, adder, timing, critical-path]
aliases:
  - Split Adder
  - Final Adder
  - Non-Uniform Final Adder
  - Hybrid Final Adder
---

# Split Final Adder

The final adder of a compressor tree cut into segments whose adder architecture matches the *arrival time* of each column rather than its position, so that the two segments where time is free cost nothing and only the late middle pays for speed.

```tikz title="Arrival-time profile of a compressor tree's two output rows, and the three-segment final adder matched to it"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % --- arrival-time profile of the two compressor-tree output rows ---
  \draw[->] (0,0) -- (9.6,0) node[anchor=west] {column $i$};
  \draw[->] (0,0) -- (0,2.4) node[anchor=east] {$t_i$};
  \draw[very thick] plot[smooth] coordinates
    {(0.2,0.15) (1.2,0.60) (2.2,1.15) (3.2,1.70) (4.6,1.95)
     (6.0,1.70) (7.0,1.15) (8.0,0.60) (9.0,0.15)};
  \node[anchor=south west,font=\footnotesize] at (0.1,2.05)
    {Gaussian-like arrival profile of $R_i,S_i$};
  \node[anchor=east,font=\footnotesize,align=right] at (-0.15,1.0)
    {two rows\\$R,S$\\$w$ bits each};

  % --- split boundaries ---
  \draw[dashed,gray] (2.95,-1.30) -- (2.95,1.62);
  \draw[dashed,gray] (6.05,-1.30) -- (6.05,1.68);
  \node[anchor=north west,font=\footnotesize] at (3.05,-0.05) {$i=a$};
  \node[anchor=north west,font=\footnotesize] at (6.15,-0.05) {$i=b$};

  % --- what the profile does over each segment ---
  \node[font=\footnotesize] at (1.55,-0.95) {$t_{i+1}-t_i\ \ge\ \tau_{FA}$};
  \node[font=\footnotesize] at (4.50,-0.95) {$t_{i+1}-t_i\ \approx\ 0$};
  \node[font=\footnotesize] at (7.65,-0.95) {$t_{i+1}-t_i\ <\ 0$};

  % --- the three adder segments ---
  \draw (0.20,-2.10) rectangle (2.70,-1.30);
  \node[align=center,font=\footnotesize] at (1.45,-1.70) {ripple-carry\\$a$ bits};
  \draw (3.20,-2.10) rectangle (5.80,-1.30);
  \node[align=center,font=\footnotesize] at (4.50,-1.70) {prefix tree\\$b-a$ bits};
  \draw (6.30,-2.10) rectangle (9.00,-1.30);
  \node[align=center,font=\footnotesize] at (7.65,-1.70) {carry-select\\$w-b$ bits};

  % --- boundary carries ---
  \draw[->] (2.70,-1.70) -- (3.20,-1.70);
  \node[font=\footnotesize,anchor=south] at (2.95,-1.64) {$c_a$};
  \draw[->] (5.80,-1.70) -- (6.30,-1.70);
  \node[font=\footnotesize,anchor=south] at (6.05,-1.64) {$c_b$};
  \draw[->] (9.00,-1.70) -- (9.55,-1.70) node[anchor=west,font=\footnotesize] {$c_w$};

  % --- sum out ---
  \draw[->] (1.45,-2.10) -- (1.45,-2.65);
  \draw[->] (4.50,-2.10) -- (4.50,-2.65);
  \draw[->] (7.65,-2.10) -- (7.65,-2.65);
  \node[anchor=north,font=\footnotesize] at (4.50,-2.70)
    {one $w{+}1$-bit sum $\{c_w,S[w{-}1{:}0]\}$};
\end{circuitikz}
\end{document}
```

*Own construction; the arrival profile is the one described for Fig. 7.15a, p. 166, discussed p. 194.*

**Fix what the final adder is actually adding.** A compressor tree takes a bit heap and returns a heap of height at most two (p. 174) — two rows $R$ and $S$ of $w$ bits each, where $w$ is the width of the widest surviving column plus the carries pushed into it. The final adder computes $R+S$ on $w+1$ bits and is the last thing between the tree and the result, which is why it "typically lies on the critical path, at least for ASICs" (p. 193). Everything below is about that one $w$-bit two-operand addition; the tree itself is [[Compressor Trees]] and the heap it consumes is [[Bit Heaps]].

**Give every column an arrival time instead of treating the operands as one bus.** Let $t_i$ be the instant at which $R_i$ and $S_i$ are both stable, measured from when the heap's primary bits appear. A compressor stage divides column height by roughly $1.5$ — the Dadda recurrence $m_l=\lfloor 1.5\,m_{l-1}\rfloor$ run backwards — so a column of initial height $h_i$ passes through about $\lceil \log_{1.5}(h_i/2)\rceil$ stages before it settles, and

$$t_i \;\approx\; \tau_{FA}\left\lceil \log_{1.5}\!\frac{h_i}{2} \right\rceil .$$

For a multiplier the heap is triangular, $h_i = \min(i+1,\,w-i)$ up to the $n\times n$ plateau, so $t_i$ is a *logarithm of a triangle*: a flat-topped hump, rising on the LSB side, falling on the MSB side. The book calls this Gaussian-like and attributes the multiplier analysis to [SO96] (p. 194). The consequence is the whole note: a fast adder is designed on the assumption that all $2w$ input bits are ready simultaneously, and here they are not.

**Turn the arrival profile into a carry-front recurrence.** In a plain ripple chain the carry into column $i+1$ is ready one full-adder delay after both its own data and the incoming carry:

$$c^{\text{arr}}_{i+1} \;=\; \max\big(t_i,\;c^{\text{arr}}_i\big) + \tau_{FA} .$$

Unrolling the $\max$ — it distributes over the recurrence because $\max$ is associative and $+\tau_{FA}$ is monotone — gives a closed form over all earlier columns:

$$c^{\text{arr}}_{i} \;=\; \max_{j<i}\big(t_j + (i-j)\,\tau_{FA}\big).$$

The bracket is the data front $t_j$ raced against a carry front advancing at $\tau_{FA}$ per column. Which one wins is decided entirely by the *slope* of $t$.

> [!note]
> On any run of columns where the profile rises at least one full-adder delay per column, $t_{j+1}-t_j \ge \tau_{FA}$, the maximum above is attained at $j=i-1$, so $c^{\text{arr}}_i = t_{i-1}+\tau_{FA} \le t_i$. The carry front never overtakes the data front, and the ripple chain contributes **exactly zero** to the critical path. Ripple-carry is not merely cheap on the LSBs; over that run it is free.

**Spend nothing on the LSB field.** That condition is what the LSB side of a triangular heap satisfies: its columns are short, they settle early, and each successive column settles a stage later. So columns $0\dots a-1$ get an [[Ripple-Carry Adder]] — $a$ full adders, one carry wire, no generate/propagate logic, no duplicated sum. Choosing $a$ is choosing the last column at which the slope condition still holds; past it the profile flattens and every extra ripple stage is charged in full.

**Spend everything on the middle field.** Over columns $a\dots b-1$ the profile is at its plateau, $t_i \approx t_{\max}$, so the $\max$ unrolls to $t_{\max} + (i-a)\tau_{FA}$ — linear, and the carry front is now the only thing moving. This is the one segment where reassociating the carry recurrence pays, and it pays because the carry operator $(g,p)\circ(g',p') = (g \vee (p \wedge g'),\, p \wedge p')$ is associative, so any prefix graph over the segment is correct by construction ([[Parallel Prefix Adders]]). Depth drops from $(b-a)\,\tau_{FA}$ to $\tau_{pg}\lceil\log_2(b-a)\rceil$. The saving over a uniform fast adder is in the *argument of the logarithm and in area*: a [[Kogge-Stone Adder]] over the whole word costs $\Theta(w\log_2 w)$ prefix nodes and $\log_2 w$ levels of wire tracks, whereas restricting it to the plateau costs $\Theta\!\big((b-a)\log_2(b-a)\big)$ nodes. The tree is built only where the schedule cannot hide it.

**Buy the MSB field with area rather than with time.** On columns $b\dots w-1$ the profile falls, $t_{i+1}-t_i<0$: the data is early but the carry $c_b$ out of the middle segment lands at $t_{\max}+\tau_{pg}\lceil\log_2(b-a)\rceil$, later than every $t_i$ in the field. There is a real interval during which the MSB data is stable and nothing can be done with it, and a [[Carry-Select Adder]] is exactly the structure that consumes that interval: compute the $(w-b)$-bit sum twice, once assuming $c_b=0$ and once assuming $c_b=1$, entirely in the shadow of the middle segment, then commit with one mux. The doubled adder area is paid in gates; in time it costs $\tau_{\text{mux}}$ and nothing else. Note that the two conditional sums differ by exactly one, $\text{sum}_1 = \text{sum}_0 + 1$, so the second adder is an incrementer, not a second full adder — the usual carry-select area penalty is an overestimate here.

$$\boxed{\;T \;=\; \max\big(t_{a-1}+\tau_{FA},\; t_{\max}\big) \;+\; \tau_{pg}\big\lceil \log_2 (b-a)\big\rceil \;+\; \tau_{\text{mux}}\;}$$

Neither $a\,\tau_{FA}$ nor $(w-b)\,\tau_{FA}$ appears. The only width that reaches the critical path is the width of the plateau.

**On FPGA the split is the wrong move.** The hard carry chain makes ripple propagation nearly free — $\tau_{CC} \ll \tau_L \approx \tau_R$ — so a chain adder over all $w$ bits already runs at $\tau_L + w\,\tau_{CC}$, and a prefix tree built from LUTs and general routing is *slower*, not faster. Each segment boundary additionally costs a LUT layer to break the chain and re-enter it. The FPGA answer is therefore a single carry-chain adder over the full width, and the arrival profile is spent instead on choosing better compressors inside the tree (Table 7.3, p. 184, and [[Ternary Adder]]). See [[FPGAs]].

> [!warning] The split is qualitative in the source
> §7.3.4 states the three-way split in one paragraph and gives no timing model, no method for choosing $a$ and $b$, and no measured delay or area for a split final adder against a uniform one. The recurrence, the slope condition and the boxed expression above are reconstructed from the Dadda height recurrence of §7.3.1 and the adder delays of §5.3; the *quantitative* benefit is not covered in the source and needs outside research.

**When it breaks.**

- **Truncation flattens the profile.** A [[Truncated Bit Heap]] discards the low columns outright, which is precisely the rising region: the ripple segment shrinks toward zero width and the split degenerates to prefix-plus-select. The book notes the same for any low-precision variant (p. 194).
- **Pipelining removes the profile entirely.** In a [[Pipelined Compressor Tree]] every bit is re-registered at a stage boundary, so all $2w$ inputs to the final adder arrive at the same clock edge, $t_i \equiv 0$. There is no slope to exploit and one uniform fast adder is again the right answer.
- **Non-triangular heaps have no hump.** A multi-operand addition of $n$ equal-width integers gives a rectangular dot diagram (Fig. 7.27a, p. 195): constant height, constant $t_i$, flat profile, nothing to split.
- **The schedule, not just the shape, sets the profile.** [[Reduced Area Compressor Tree]] compresses as soon as possible and hands the final adder a *narrower* word than Dadda does — 10 bits against 14 on the $8\times8$ example — while also starting the carry earlier. Refit $a$ and $b$ to the schedule; they are not a property of the multiplier alone.
- **Small $w$.** Below roughly a couple of dozen columns the plateau is a handful of bits wide, $\lceil\log_2(b-a)\rceil$ and $b-a$ differ by little, and two extra segment boundaries plus a mux layer cost more than they save.
- **FPGA**, as above: the asymptotics that motivate the split are erased by the hard carry chain.

**RTL (Spade).**

```spade
entity split_final_adder(r: uint<16>, s: uint<16>) -> uint<17> {
    let rb = r.as_bits();
    let sb = s.as_bits();

    // columns 0..5 — early data, rising profile: ripple is free here
    let lo: uint<6> = rb[0..5].as_uint() + sb[0..5].as_uint();
    let c_a = lo.as_bits()[5];

    // columns 5..11 — the late middle: the only segment on the critical
    // path, so the only one that has to be a prefix tree
    let mid: uint<7> =
        trunc(rb[5..11].as_uint() + sb[5..11].as_uint() + zext::<1, 7>(c_a.as_uint()));
    let c_b = mid.as_bits()[6];

    // columns 11..16 — data early, c_b last: speculate on both carry-ins
    let hi0: uint<6> = rb[11..16].as_uint() + sb[11..16].as_uint();
    let hi1: uint<6> = trunc(hi0 + 1);
    let hi = if c_b { hi1 } else { hi0 };

    hi.concat(mid.as_bits()[0..6].as_uint()).concat(lo.as_bits()[0..5].as_uint())
}
```

`r` and `s` are the tree's two output rows, $w=16$, split at $a=5$ and $b=11$; `c_a` and `c_b` are the two boundary carries in the diagram and are the only serialisation between segments. Width arithmetic: each `uint<5>+uint<5>` grows to `uint<6>` and each `uint<6>+uint<6>` to `uint<7>`, so the extra bit *is* the segment carry-out, read back with `.as_bits()[msb]`; the final `concat` reassembles $6+6+5=17$ bits with `hi` in the high position. `hi0` and `hi1` are the carry-select pair, and `hi1 = hi0 + 1` makes the incrementer argument above explicit. The block is purely combinational. What synthesis does differently from the drawing: the per-segment *architecture* is not in the RTL — `+` is written three times and the tool decides ripple, prefix or chain for each — so the split must be carried into the tool as three separate arithmetic instances with per-instance constraints, or the optimiser will happily merge all three back into one uniform adder and discard the point of the note.

**Related Notes (with context).**

- [[Compressor Trees]] – depends-on: produces the two rows this adder consumes, and its stage count is what sets $t_i$.
- [[Bit Heaps]] – depends-on: the column-height profile $h_i$ that the arrival times are a logarithm of.
- [[Ripple-Carry Adder]] – supports: the LSB segment, chosen because the rising profile makes its carry chain free.
- [[Parallel Prefix Adders]] – supports: the middle segment, the only place where reassociating the carry recurrence is paid for.
- [[Kogge-Stone Adder]] – compares: the uniform alternative, $\Theta(w\log_2 w)$ nodes over the whole word instead of over the plateau.
- [[Carry-Select Adder]] – supports: the MSB segment, spending area to absorb the late boundary carry.
- [[Truncated Bit Heap]] – counter-example: removes the rising region, so the ripple segment has nothing to exploit.
- [[Pipelined Compressor Tree]] – counter-example: re-registering equalises all arrival times and the split collapses to one uniform adder.
- [[Reduced Area Compressor Tree]] – compares: an ASAP schedule changes both the final adder's width and its arrival profile.
- [[Ternary Adder]] – counter-example: on FPGA the hard carry chain, not the prefix tree, is the fast structure.
- [[Adders]] – compares: the hub for every architecture the segments are drawn from.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §7.3 (compressor tree output is a height-2 heap feeding a final adder), p. 174.
- §7.3.4 *Some Remarks on the Final Adder*, pp. 193-194 — the Gaussian-like arrival profile, the RCA/fast/carry-select split, truncation and pipelining as flattening effects, and the reference to [SO96] for triangular multiplier timing.
- Fig. 7.15a, p. 166 — the bit heap whose distribution the arrival profile follows.
- Fig. 7.27a, p. 195 — the rectangular dot diagram of a multi-operand addition, the flat-profile counter-case.
- §7.3.1, pp. 176-180 — the Dadda height recurrence $m_l=\lfloor 1.5\,m_{l-1}\rfloor$ used to estimate $t_i$, and the Reduced Area comparison (10-bit against 14-bit final adder on the $8\times8$ example).
- Table 7.3, p. 184 — LUT costs and delays showing $\tau_{CC}\ll\tau_L$ on FPGA.
- §5.3, pp. 115-123 — carry-select (§5.3.2, p. 115) and parallel prefix adders (§5.3.6, pp. 118-123), the segment architectures.
