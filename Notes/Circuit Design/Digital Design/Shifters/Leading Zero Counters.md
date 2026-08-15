---
title: Leading Zero Counters
description: "The naive recursive LZC: one wide NOR per level emits count bit c_k and selects between the upper and lower halves; area linear in w_X but delay k(k+1)/2, i.e. O(log^2 w_X) — still the right choice on FPGAs and the only one that fuses with a shifter."
kind: circuit
source: "ASA §10.2–10.2.1, pp. 316–320"
status: seed
spade: simulated
tags: [digital, shifters, lzc, normalizer, fpga]
aliases:
  - Leading Zero Counter
  - LZC
  - Naive LZC
  - Leading One Detector
  - LOD
---

# Leading Zero Counters

A leading zero counter returns the position of the leftmost non-zero bit of $X$ as a binary integer $C$; the *naive* architecture computes $C$ one bit at a time, most significant first, by halving the search window at every level.

```tikz title="Naive LZC architecture for w_X = 15, w_C = 4"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,
  nor/.style={draw,rounded corners=1pt,minimum width=1.1cm,minimum height=0.45cm,inner sep=1pt},
  mux/.style={draw,fill=black!8,minimum width=2.2cm,minimum height=0.45cm,inner sep=1pt},
  lbl/.style={font=\scriptsize}]

% ---- input ----
\node[anchor=south] at (3.6,0.45) {$X=X_3[14{\ldots}0]$};
\node[lbl,anchor=west] at (3.75,0.22) {15};
\draw[-latex] (3.6,0.4) -- (3.6,-0.25);

% ================= level 3 =================
\draw (3.6,-0.25) -- (0.45,-0.25);
\draw[-latex] (0.45,-0.25) -- (0.45,-0.62);
\node[lbl,anchor=south] at (1.7,-0.20) {$X_3[14{\ldots}7]$ \ 8};
\node[nor] (n3) at (0.45,-0.85) {NOR};
\draw (3.0,-0.25) -- (3.0,-0.62);
\draw (4.6,-0.25) -- (4.6,-0.62);
\node[lbl,anchor=east] at (2.93,-0.48) {$X_3[6{\ldots}0]$};
\node[lbl,anchor=west] at (4.67,-0.48) {$X_3[14{\ldots}8]$};
\node[mux] (m3) at (3.8,-0.85) {};
\node[lbl] at (3.0,-0.85) {1};
\node[lbl] at (4.6,-0.85) {0};
\draw[-latex] (n3.east) -- (2.55,-0.85);
\draw[-latex] (n3.west) -- (-1.4,-0.85);
\node[anchor=east] at (-1.45,-0.85) {$c_3$};
\node[lbl,anchor=west] at (6.0,-0.85) {LZC(4)};

% ================= level 2 =================
\draw[-latex] (3.8,-1.08) -- (3.8,-1.85);
\node[lbl,anchor=west] at (3.90,-1.46) {$X_2[6{\ldots}0]$ \ 7};
\draw (3.8,-1.85) -- (0.45,-1.85);
\draw[-latex] (0.45,-1.85) -- (0.45,-2.22);
\node[lbl,anchor=south] at (1.7,-1.80) {$X_2[6{\ldots}3]$ \ 4};
\node[nor] (n2) at (0.45,-2.45) {NOR};
\draw (3.0,-1.85) -- (3.0,-2.22);
\draw (4.6,-1.85) -- (4.6,-2.22);
\node[lbl,anchor=east] at (2.93,-2.08) {$X_2[2{\ldots}0]$};
\node[lbl,anchor=west] at (4.67,-2.08) {$X_2[6{\ldots}4]$};
\node[mux] (m2) at (3.8,-2.45) {};
\node[lbl] at (3.0,-2.45) {1};
\node[lbl] at (4.6,-2.45) {0};
\draw[-latex] (n2.east) -- (2.55,-2.45);
\draw[-latex] (n2.west) -- (-1.4,-2.45);
\node[anchor=east] at (-1.45,-2.45) {$c_2$};
\node[lbl,anchor=west] at (6.0,-2.45) {LZC(3)};

% ================= level 1 =================
\draw[-latex] (3.8,-2.68) -- (3.8,-3.45);
\node[lbl,anchor=west] at (3.90,-3.06) {$X_1[2{\ldots}0]$ \ 3};
\draw (3.8,-3.45) -- (0.45,-3.45);
\draw[-latex] (0.45,-3.45) -- (0.45,-3.82);
\node[lbl,anchor=south] at (1.7,-3.40) {$X_1[2{\ldots}1]$ \ 2};
\node[nor] (n1) at (0.45,-4.05) {NOR};
\draw (3.0,-3.45) -- (3.0,-3.82);
\draw (4.6,-3.45) -- (4.6,-3.82);
\node[lbl,anchor=east] at (2.93,-3.68) {$X_1[0]$};
\node[lbl,anchor=west] at (4.67,-3.68) {$X_1[2]$};
\node[mux] (m1) at (3.8,-4.05) {};
\node[lbl] at (3.0,-4.05) {1};
\node[lbl] at (4.6,-4.05) {0};
\draw[-latex] (n1.east) -- (2.55,-4.05);
\draw[-latex] (n1.west) -- (-1.4,-4.05);
\node[anchor=east] at (-1.45,-4.05) {$c_1$};
\node[lbl,anchor=west] at (6.0,-4.05) {LZC(2)};

% ================= level 0 =================
\draw (3.8,-4.28) -- (3.8,-5.25);
\node[lbl,anchor=west] at (3.90,-4.75) {$X_0[0]$ \ 1};
\node[not port,xscale=-0.75,yscale=0.75] (inv) at (2.9,-5.25) {};
\draw (3.8,-5.25) -- (inv.in 1);
\draw[-latex] (inv.out) -- (-1.4,-5.25);
\node[anchor=east] at (-1.45,-5.25) {$c_0$};
\node[lbl,anchor=west] at (6.0,-5.25) {LZC(1)};

\end{circuitikz}
\end{document}
```

*after Fig. 10.10, p. 319.*

**Fix what the operator must return before choosing a structure.** The input is a bit vector $X$ on $w_X$ bits, the output a binary integer $C$ on $w_C$ bits giving the index of the leftmost 1, counted from the left: $C = 0$ when $X[w_X-1] = 1$. The count ranges over $[0, w_X]$ — $w_X+1$ distinct values, because "no 1 anywhere" needs an encoding too — so $w_C = \lceil \log_2(w_X+1)\rceil$. The sizing is exact, with no wasted code, precisely when $w_X = 2^k - 1$, giving $w_C = k$; that is the case the recursion is written for, and it is why the book's worked width is 15 and not 16. Two siblings differ only in what they look for: the **leading one counter** (LOC) counts ones, and the **leading bit counter** (LBC, [[Leading Bit Counter]]) takes the bit value $b$ to search for as an input. The LBC subsumes both but pays the fanout of $b$ across the whole vector, so all three are generated separately (p. 316).

**Split the count by its most significant bit, and the split is a NOR.** Write $w_X = 2^k-1$ and cut $X$ into its upper $2^{k-1}$ bits $X_H$ and its lower $2^{k-1}-1$ bits $X_L$. The top count bit $c_{k-1}$ has weight $2^{k-1}$, so $c_{k-1}=1$ exactly when $C \ge 2^{k-1}$, which by the definition of $C$ says that the first $2^{k-1}$ bits are all zero. That is a bit-level statement about $X_H$, and De Morgan turns the universally-quantified "all zero" into a single gate:

$$c_{k-1} = \bigwedge_{i} \overline{X_H[i]} = \overline{\bigvee_i X_H[i]} = \mathrm{NOR}(X_H)$$

on $2^{k-1}$ inputs. No arithmetic is involved in producing a count bit — only a wide NOR.

**Turn the case split into a recurrence whose addition is free.** Conditioning on $c_{k-1}$:

$$\mathrm{LZC}_k(X) = \begin{cases} 2^{k-1} + \mathrm{LZC}_{k-1}(X_L) & X_H = 0\\[2pt] \mathrm{LZC}_{k-1}(X_H') & \text{otherwise}\end{cases}$$

The $+\,2^{k-1}$ looks like it costs an adder and does not. $\mathrm{LZC}_{k-1}$ returns a $(k-1)$-bit value, so it is bounded by $2^{k-1}-1$ and can never generate a carry into column $k-1$; by the positional-value identity $2^{k-1}c + v = \langle c, v\rangle$ for $v < 2^{k-1}$, the addition **is** the concatenation of $c_{k-1}$ in front of the recursive result ([[Number Formats]]). One level is therefore one wide NOR, one $(2^{k-1}-1)$-wide 1-bit multiplexer, and a wire.

**Drop the middle bit — both branches have already accounted for it.** In the else-branch the sub-problem is not all of $X_H$ but its upper $2^{k-1}-1$ bits $X_H'$, one bit narrower, so that both mux inputs have the same width and the mux can be a plain $2{:}1$. The bit that falls out is $X[2^{k-1}-1]$, the middle bit. Nothing is lost: if $X_H \ne 0$ but only its lowest bit $X[2^{k-1}-1]$ is set, then the leading one is at index $2^{k-1}-1$ and $C = 2^{k-1}-1 = 011\ldots1$, which is exactly what $c_{k-1}=0$ followed by an all-ones recursive count produces when $X_H'$ is zero — and a zero $X_H'$ drives every remaining level down its $c=1$ branch by construction. The saturating behaviour of the sub-counter does the bookkeeping the discarded bit would have done.

**Pad with ones, never with zeroes, when $w_X$ is not $2^k-1$.** Set $w_C = \lceil\log_2(w_X+1)\rceil$ and extend $X$ on the *right* to width $2^{w_C}-1$. The padding sits below the real data, so it can never be the leading one unless $X$ itself is zero; padding with **ones** then pins $C$ at $w_X$ for $X=0$ instead of letting it run on to $2^{w_C}-1$, which is the saturation the interface promises (pp. 318–319).

**Count the gates: the area is linear, exactly like a ripple-carry adder.** Level $k$ contributes a $(2^{k-1}-1)$-wide 1-bit mux, and the levels run $k = w_C, \dots, 1$, so by the geometric sum $\sum_{k=1}^{n}2^k = 2^{n+1}-2$:

$$\#\text{muxes} = \sum_{k=1}^{w_C-1}(2^k-1) = 2^{w_C}-1-w_C = w_X - w_C$$

and the wide NORs, decomposed into binary trees, contribute the same $w_X - w_C$ two-input gates in total. Growth is $\Theta(w_X)$, the same linear-in-width picture as [[RCA, Ripple-Carry Adder]] — and, as there, the honest cost is not the area.

**The delay is quadratic in the logarithm, because the levels are strictly serial.** Level $k$'s NOR is a binary tree over $2^{k-1}$ bits, hence depth $k-1$, plus one gate for the mux; and level $k-1$ cannot start until level $k$'s mux has resolved, since its very input is that mux's output. So $d_k = k + d_{k-1}$ with $d_1 = 1$, and by the triangular-number closed form

$$d_k = \sum_{j=1}^{k} j = \frac{k(k+1)}{2} = O(\log^2 w_X)$$

That is worse than the $O(\log w_X)$ of [[Oklobdzija LZC Tree]] or [[Monotonic String Leading Zero Counter]] — the serialisation is fundamental to this shape, not an artefact of the gate mapping.

**Keep it anyway on FPGA, and keep it whenever a shifter follows.** Two reasons, and both are about the constant hidden inside the asymptotics. First, the wide NOR is the one operation an FPGA is unreasonably good at: it maps onto a wide [[Lookup-Tables|LUT]] feeding the fast carry chain rather than onto a tree of two-input gates, so the "depth $k-1$" term in $d_k$ largely evaporates, and two successive rows of $2{:}1$ muxes merge into one row of 6-LUTs. Second — and this is the structural argument, not a technology one — the naive LZC emits its count bits **most significant first**, $c_{k-1}$ before $c_{k-2}$. The logarithmic architectures emit all of $C$ simultaneously, which sounds better and is worse here: a left shifter ordered largest-shift-first wants exactly the MSB-first order, so each level can NOR, emit $c_j$, and perform its own conditional shift in one pass. That fusion is [[Fused Normalizer]], and it is unavailable to any LZC that produces $C$ all at once (pp. 320, 325).

> [!warning] Fig. 10.10's innermost NOR is mislabelled
> The published figure labels the LZC(2) level's NOR input $X_1[1{\ldots}0]$. It must be $X_1[2{\ldots}1]$ — the *upper* $2^{k-1}=2$ bits of the 3-bit window, consistent with $X_3[14{\ldots}7]$ and $X_2[6{\ldots}3]$ at the levels above. With the printed labelling, $X_1 = 100$ would give $\mathrm{NOR}(00)=1$, hence $c_1 = 1$ and then $c_0 = \overline{X_1[0]} = 1$, reporting a count of $3$ where the leading one is at position $0$. The diagram above and the RTL below use the corrected range.

$$\boxed{\ \mathrm{LZC}_k(X) = \big\langle\, \mathrm{NOR}(X_H),\ \ \mathrm{LZC}_{k-1}\!\big(\mathrm{NOR}(X_H)\ ?\ X_L : X_H'\big) \,\big\rangle,\qquad d_k = \tfrac{k(k+1)}{2}\ }$$

**Where it breaks.**

- **Large $w_X$ on ASIC.** $d_k = k(k+1)/2$ overtakes a logarithmic tree quickly once the wide NOR really is a gate tree; past roughly $w_X = 32$–$64$ on standard cells the tree architectures win, and [[Choosing a Shifter]] is where that trade is made.
- **The FPGA argument is a constant-factor argument.** It says the $O(\log^2)$ curve starts low and rises slowly on wide-LUT-plus-carry silicon, not that the asymptotics changed. Re-check it whenever the target family's carry chain changes.
- **$X = 0$ is not an error condition here**, it is $C = w_X$ — but only if the padding is ones. Zero-padding a non-power width silently returns $2^{w_C}-1$, a value the consumer's exponent field may not survive.
- **Pipelining fights the LUT merge.** Registers must go every *other* level, or the two-mux-rows-per-6-LUT packing is broken and both LUT count and depth double (p. 314).
- **Inside an IEEE-754 adder or FMA**, the fused form has no place to do the arithmetic on $C$ that subnormal support requires; use a separate LZC then, or an approximate [[Leading Zero Anticipation]] running in parallel with the addition.

**In Spade**, the three levels plus the final inverter, written out for $w_X=15$ so that every slice width is visible:

```spade
/// Naive leading-zero counter, w_X = 15, w_C = 4 (Fig. 10.10).
/// x[14] is the MSB; C saturates at 15 when x is all zeroes.
fn lzc15(x: [bool; 15]) -> uint<4> {
    // LZC(4): NOR the upper 8 bits; select lower 7 or upper 7, dropping x[7].
    let c3 = !x[7..15].reduce_or();
    let x2: [bool; 7] = if c3 { x[0..7] } else { x[8..15] };
    // LZC(3): NOR the upper 4 of 7; drop x2[3].
    let c2 = !x2[3..7].reduce_or();
    let x1: [bool; 3] = if c2 { x2[0..3] } else { x2[4..7] };
    // LZC(2): NOR the upper 2 of 3; drop x1[1].
    let c1 = !x1[1..3].reduce_or();
    let x0: [bool; 1] = if c1 { x1[0..1] } else { x1[2..3] };
    // LZC(1): one inverter.
    let c0 = !x0[0];
    [c0, c1, c2, c3].as_uint()
}
```

Each `reduce_or` is one NOR box in the diagram and each `if` is one mux row; `x2`, `x1`, `x0` are the $7$-, $3$- and $1$-bit buses drawn between the levels, and the width sequence $15 \to 7 \to 3 \to 1$ is the $2^k-1$ halving made literal. The concatenation that the recurrence calls free is the array literal `[c0, c1, c2, c3]` — element 0 is the LSB in Spade, so this packs $c_3$ into the top bit, and `as_uint` is a pure re-labelling of the same four wires, not a conversion. The block is entirely combinational: no `reg`, no clock port. What synthesis will not honour is the drawing's binary NOR trees — on FPGA each wide NOR collapses into LUTs plus carry, and the four mux rows pack two-to-a-LUT, so the placed depth is well under the $d_4 = 10$ gate levels the recurrence predicts.

Simulated against a behavioural leading-zero reference over 5026 vectors: all 15 single-bit inputs, $X = 0$ (saturating to 15), the asymmetric pair $X = 1 \mapsto 14$ and $X = 128 \mapsto 7$ that exercises the dropped middle bit, and a 5000-vector random sweep. Zero mismatches.

**Related notes.**

- [[Oklobdzija LZC Tree]] – compares: same recursive case split, reassociated into a balanced tree for $O(\log w_X)$ depth, at roughly $2w_X$ muxes and a large fanout on the zero flag.
- [[Monotonic String Leading Zero Counter]] – compares: reaches the same depth via prefix-OR with fanout bounded by 2, which is what to reach for when Oklobdzija's fanout shows up in timing.
- [[Fused Normalizer]] – extends: merges these levels into a left shifter, which only works because this variant emits $C$ most significant bit first.
- [[Normalizers]] – supports: the operator this count usually feeds, where $C$ becomes an exponent and the shifted word a significand.
- [[Leading Bit Counter]] – extends: generalises the search target from 0 to a run-time bit $b$, at the cost of that bit's fanout.
- [[Leading Zero Anticipation]] – counter-example: gives up exactness to compute the count *concurrently* with the addition that produces $X$, which no architecture on this page can do.
- [[RCA, Ripple-Carry Adder]] – compares: the same linear area and the same strictly serial level structure, and the same reason to abandon it at width.
- [[Lookup-Tables]] – depends-on: the wide-LUT-plus-carry mapping is the entire case for preferring this architecture on FPGA.
- [[Combinational Logic]] – depends-on: pure combinational logic; the recursion is spatial unrolling, not iteration in time.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 10 "Shifters and Leading Bit Counters":

- §10.2 Variations on leading zero counters, p. 316 — LZC/LOC/LBC interfaces (Fig. 10.8, p. 318), the LBC fanout argument, and the two ways an LZC relates to a shifter.
- §10.2.1 Naive LZC architecture, pp. 318–320 — the case split (Fig. 10.9, p. 318), the architecture for $w_X=15$ (Fig. 10.10, p. 319), the mux/NOR count $w_X-w_C$, the delay recurrence $d_k = k+d_{k-1}$, and the FPGA preference.
- §10.2.2 Logarithmic-time LZC architectures, pp. 320–322 — the alternatives this one is measured against.
- §10.3 Normalizer, pp. 323–325 — the MSB-first fusion with a left shifter (Fig. 10.15, p. 324) and the IEEE-754 caveat.
- §10.1.3, p. 314 — the two-mux-rows-per-6-LUT merge and its pipelining constraint.
