---
title: Leading Zero Anticipation
description: "Approximates the leading-zero count of a sum directly from the addends, running in parallel with the addition so the LZC leaves the floating-point adder's critical path entirely."
kind: circuit
source: "ASA §10.2.2, p. 322; §11.1.4, p. 342"
status: seed
spade: simulated
tags: [digital, shifters, lzc, floating-point, normalization]
aliases:
  - LZA
  - Leading Zero Anticipator Pre-encoder
  - Leading Zero Prediction
  - leading-zero anticipation
---

# Leading Zero Anticipation

A leading-zero anticipator computes a bit string $F$ from the *addends* whose leading one is within one position of the leading one of their *sum*, so the leading-zero count and the addition run concurrently instead of in series.

```tikz title="Leading zero anticipation running beside the significand subtractor, with the one-bit correction mux"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize,
  >=latex,
  blk/.style={draw,rounded corners=1.5pt,minimum width=30mm,minimum height=7.5mm,inner sep=2pt},
  sml/.style={draw,rounded corners=1.5pt,minimum width=10mm,minimum height=6mm,inner sep=2pt},
  w/.style={font=\scriptsize,inner sep=1.2pt}
]
% inputs
\node at (-0.4,6.5) {$A,\ B$};
\node[w,anchor=west] at (0.2,6.5) {aligned significands, $w$ bits each};
\draw (-0.4,6.25) -- (-0.4,5.9);
\draw (-4.0,5.9) -- (3.2,5.9);
\draw[->] (-4.0,5.9) -- node[w,left]{$2w$} (-4.0,5.15);
\draw[->] ( 3.2,5.9) -- node[w,right]{$2w$} ( 3.2,5.15);

% anticipation path
\node[blk] (pre) at (-4.0,4.75) {LZA pre-encoder};
\node[w,anchor=east] at (-4.25,3.9) {$f_i=(a_i\oplus b_i)\oplus(\bar a_{i-1}\wedge b_{i-1})$};
\draw[->] (pre.south) -- node[w,right]{$F$, $w$} (-4.0,3.15);
\node[blk] (lzc) at (-4.0,2.75) {prefix-OR LZC};
\draw[->] (lzc.south) -- node[w,right,pos=0.9]{$\lambda$, $w_\lambda=\lceil\log_2(w{+}1)\rceil$} (-4.0,1.15);

% data path
\node[blk] (sub) at (3.2,4.75) {significand subtractor};
\draw[->] (sub.south) -- node[w,right]{$D=A-B$, $w$} (3.2,1.15);

% shifter
\node[blk,minimum width=76mm] (sh) at (-0.4,0.75) {left barrel shifter (shift by $\lambda$)};
\draw[->] (sh.south) -- node[w,right]{$T=D\ll\lambda$, $w$} (-0.4,-0.95);

% one-more-bit candidate
\node[sml] (s1) at (3.2,-1.35) {$\ll 1$};
\draw (-0.4,-0.95) -- (3.2,-0.95);
\draw[->] (3.2,-0.95) -- (s1.north);

% select: MSB of T
\draw (-0.4,-1.55) -- (-6.4,-1.55);
\node[w,anchor=south,align=center] at (-3.6,-1.5) {$\overline{t_{w-1}}$: the prediction was one bit long};
\draw[->] (-5.2,-1.55) -- (-5.2,-2.45) -- (-2.6,-2.45);
\draw[->] (-6.4,-1.55) -- (-6.4,-2.15);

% correction mux and count fix-up
\node[blk,minimum width=44mm] (mx) at (-0.4,-2.45) {correction mux};
\draw[->] (-0.4,-0.95) -- (-0.4,-2.08);
\draw (3.2,-1.65) -- (3.2,-2.45);
\draw[->] (3.2,-2.45) -- (1.8,-2.45);
\draw[->] (mx.south) -- node[w,right]{$R$, $w$ --- normalised} (-0.4,-3.4);

\node[blk,minimum width=20mm] (inc) at (-6.4,-2.45) {$\lambda+\overline{t_{w-1}}$};
\draw (-4.0,1.5) -- (-8.6,1.5) -- (-8.6,-2.45);
\draw[->] (-8.6,-2.45) -- (inc.west);
\node[w,anchor=west] at (-8.55,0.2) {$\lambda$, $w_\lambda$};
\draw[->] (inc.south) -- node[w,right]{$\lambda_{\mathrm c}$, $w_\lambda$ --- to the exponent} (-6.4,-3.4);
\end{circuitikz}
\end{document}
```

**Locate the problem on the near path.** In a floating-point adder the near path handles effective subtraction of operands whose exponents differ by at most one, which is the only case where massive cancellation can occur. Its chain is: subtract the two $w$-bit significands, count the leading zeroes of the difference, shift them out. Each of those three is $O(\log_2 w)$ deep — the subtractor as a [[Parallel Prefix Adders|prefix adder]], the [[Leading Zero Counters|LZC]] and the barrel shifter as balanced trees — so the near path carries **three** logarithmic stages in series where the far path carries two (p. 342). The LZC is the removable one, because unlike the shifter it does not need the difference itself, only where its leading one is.

**Predict from the operands, not from the result.** Both $A$ and $B$ are available at $t=0$; only $D=A-B$ has to wait for carry propagation. If a purely local function of $A$ and $B$ can locate the leading one of $D$, that function runs concurrently with the subtractor and the LZC vanishes from the critical path. Such a function cannot be exact in general — the leading one's position depends on a carry that by construction has not propagated yet — but the whole point of leading-zero anticipation is that it is exact **to within one bit**, and one bit is repairable by a single multiplexer after the shifter.

**Set up the carry algebra on the complemented operand.** Take $A \ge B$ so the difference is non-negative, both on $w$ bits, and apply the two's-complement identity $-B = \bar B + 1$, so that $D = A + T + 1$ with $T = \bar B$. On the pair $(A,T)$ define the usual carry classes per column $i$:

$$g_i = a_i \wedge t_i = a_i \wedge \bar b_i,\qquad
p_i = a_i \oplus t_i = \overline{a_i \oplus b_i},\qquad
z_i = \bar a_i \wedge \bar t_i = \bar a_i \wedge b_i$$

Exactly one of the three holds in each column, and the difference bit is $d_i = p_i \oplus c_i$ where $c_i$ is the carry into column $i$. The three classes are precisely *generate*, *propagate* and *kill*: $c_{i+1} = g_i \vee (p_i \wedge c_i)$, so a $z$ column forces $c_{i+1}=0$ regardless of everything below it.

**Read the leading one off the top of the $g/p/z$ string.** Let $q$ be the highest column that is not $z$. Every column above $q$ is $z$, so $p_i = 0$ there, and every carry entering those columns is $0$ because $z_q$ kills the carry out of column $q$; hence $d_i = p_i \oplus c_i = 0$ for all $i > q+1$. The whole question collapses onto column $q+1$, whose value is the carry out of $q$:

- if $g_q$, then $c_{q+1} = 1$ and $d_{q+1} = 1$ — the leading one is exactly at $q+1$;
- if $p_q$, then $c_{q+1} = c_q$ is unknown, but $d_{q+1} = c_q$ and $d_q = \overline{c_q}$, so the leading one is at $q+1$ or at $q$ — never lower.

That two-case split *is* the anticipator: the position of the leading one is determined, up to one bit, by the highest non-$z$ column, and finding the highest non-$z$ column requires no carry at all.

**Turn the case split into a bit string.** Mark column $i$ whenever it is the column immediately above a non-$z$ column, i.e. $f_i = 1$ iff $z_{i-1}=0$ while the columns above are still $z$; the clean closed form that reproduces the case analysis is $f_i = p_i \oplus \overline{z_{i-1}}$, with the convention $z_{-1}=0$ (the incoming $+1$ of the two's-complement negation behaves as a generate). Substituting $p_i = \overline{a_i\oplus b_i}$ and using the involution $\bar x \oplus \bar y = x \oplus y$, both complements cancel:

$$f_i \;=\; \overline{a_i\oplus b_i} \oplus \overline{z_{i-1}} \;=\; (a_i \oplus b_i) \oplus z_{i-1} \;=\; (a_i \oplus b_i) \oplus (\bar a_{i-1} \wedge b_{i-1})$$

so no complement of $A$ or $B$ is ever built. As a word operation on $w$-bit vectors this is $F = (A\oplus B)\oplus\big((\lnot A \wedge B)\ll 1\big)$, one left shift by one being exactly the index offset $i-1$.

> [!important] $F$ is a *string*, not a count. The pre-encoder produces another $w$-bit vector, and it still takes an ordinary [[Monotonic String Leading Zero Counter|LZC]] to turn it into a count. What is bought is that the LZC's input is ready at gate delay 1 instead of after the whole subtraction.

**Bound the error and know its sign.** From the case analysis the leading one of $F$ never sits *below* the leading one of $D$: the $g_q$ case is exact and the $p_q$ case can only be one position too far left. So $\lambda = \mathrm{LZC}(F)$ under-estimates the true count by at most one, which means shifting $D$ left by $\lambda$ never destroys a significant bit — the worst case leaves one leading zero in the result. Exhaustive simulation over all $32{,}896$ ordered pairs at $w=8$ (below) gives $\mathrm{LZC}(D)-\lambda \in \{0,1\}$ with the correction needed in $10{,}947$ cases, so roughly a third of the time; sampling at $w=16$, $24$ and $53$ reproduces the same one-third split.

**Pay for the error with one mux, not one adder.** After the barrel shifter has produced $T = D \ll \lambda$, the MSB $t_{w-1}$ says whether the prediction was exact. If $t_{w-1}=1$ the word is normalised; if $t_{w-1}=0$ the answer is $T \ll 1$. That is a single $w$-bit 2:1 multiplexer whose select is one already-computed bit — one gate delay, versus the $\log_2 w$ delay of the LZC that was removed. The count that leaves for the exponent is $\lambda_{\mathrm c} = \lambda + \overline{t_{w-1}}$, and that increment runs in parallel with the mux on a $w_\lambda = \lceil\log_2(w+1)\rceil$-bit value, i.e. off the significand's critical path.

**Cost is one gate per bit, and on FPGAs it is free.** $f_i$ depends on exactly four inputs — $a_i$, $b_i$, $a_{i-1}$, $b_{i-1}$ — so on any FPGA with LUT4s or wider the entire pre-encoder is $w$ LUTs and one LUT delay, absorbed into the routing that would carry $A$ and $B$ anyway. In ASIC terms it is one XOR-of-(XOR, AND) per bit, about three gates and two levels. Either way the pre-encoder is negligible against the LZC and shifter it sits in front of; the reason LZA is not universal is not its cost but the correction logic and the extra verification surface it drags into the adder.

$$\boxed{\ F = (A\oplus B)\oplus\big((\lnot A \wedge B)\ll 1\big),\qquad \mathrm{LZC}(F) \;\le\; \mathrm{LZC}(A-B) \;\le\; \mathrm{LZC}(F)+1\ }$$

**Where it stops paying.**

- **The sign must be known.** The derivation assumes $A \ge B$, so the difference is non-negative and the top carry is out. With an unknown operand order you either compute both encodings and select, or select the operands first — which puts a comparison back on the path you were trying to shorten. The near path of a dual-path adder gets the ordering from the exponent comparison for free, which is exactly why LZA lives there.
- **Only effective subtraction is worth it.** For effective addition the result has at most one leading zero, so a $1$-bit normalisation mux already suffices and there is no LZC to remove.
- **Small $w$.** Below roughly $w=16$ the LZC is one or two LUT levels; removing it saves less than the correction mux costs. LZA is a double- and quadruple-precision technique.
- **Subnormal support.** When the count is consumed arithmetically — clamping the shift against the exponent to produce a subnormal — the correction $+\overline{t_{w-1}}$ lands on the exponent path too, and the clamp must be applied to $\lambda_{\mathrm c}$, not $\lambda$. The book flags the same interaction for the separate LZC of the baseline architecture (p. 342).
- **Exact anticipation exists but costs more.** Removing the one-bit uncertainty entirely is a different circuit — Ng's exact leading-zero prediction [Ng93] and the variants surveyed by Schmookler and Nowka [SN01].

> [!warning] The pre-encoding equations are not in the source
> ASA states only that LZA "computes an approximation of the leading zero count $\lambda$ that may be wrong by one bit and must be corrected by a final multiplexer" (p. 342) and points at [SN01]. The derivation and the closed form above are worked from the carry algebra and validated by exhaustive simulation at $w=8$; the survey's classification of LZA variants, and their behaviour for the unknown-sign case, are outside this book.

**RTL.**

```spade
/// LZA pre-encoding of A-B: one 4-input gate per bit, no carry propagation.
/// F's leading one sits at the leading one of A-B, or one position left of it.
fn lza_encode<#uint W>(a: uint<W>, b: uint<W>) -> uint<W> {
    (a ^ b) ^ ((~a & b) << 1)
}

/// Predicted leading-zero count of A-B (A >= B), read off F by the
/// monotonic-string LZC: prefix-OR, isolate the leading one, OR out each count bit.
entity lza8(a: uint<8>, b: uint<8>) -> uint<4> {
    let f  = lza_encode::<8>(a, b);
    let y1 = f  | (f  >> 1);
    let y2 = y1 | (y1 >> 2);
    let y  = y2 | (y2 >> 4);          // thermometer code
    let z  = y & ~(y >> 1);           // one-hot at the leading one
    let p: uint<3> = [(z & 0b10101010) != 0,
                      (z & 0b11001100) != 0,
                      (z & 0b11110000) != 0].as_uint();
    if z == 0 { 8 } else { 7 - p }
}
```

`lza_encode` is the pre-encoder block of the diagram: `a ^ b` is $p$ up to a complement, `~a & b` is the kill vector $z$, and `<< 1` is the $i-1$ index offset — all $w$ bits wide, no growth, because `^`, `&` and `<<` are width-preserving. `y1/y2/y` are the three prefix-OR levels of the LZC ($\lceil\log_2 8\rceil = 3$), `z` isolates the leading one, and the three mask comparisons are the $c_j$ read-out ORs; the count is `uint<4>` because it must represent $8$. Everything is combinational — no `reg`, so the whole block collapses into the subtractor's shadow — and synthesis will not build the shift-and-OR network literally: each $f_i$ folds into one LUT, and the prefix-OR maps to a carry-chain or a LUT tree, not to three separate shifters.

Simulated with `.zettel/sim.sh`: 8 named asymmetric vectors (including $128-1$, $64-63$, $255-0$, $\text{0xAA}-\text{0xA9}$ and $A=B$), all $32{,}896$ ordered 8-bit pairs exhaustively, and 3000 random pairs — $35{,}904$ vectors, no `FAIL`. The checked property is the two-sided one: $\lambda \le \mathrm{LZC}(D) \le \lambda+1$, *and* that one extra shift always finishes the normalisation.

**Related notes.**

- [[Monotonic String Leading Zero Counter]] – depends-on: consumes $F$; the prefix-OR/one-hot/OR readout in the RTL above is that circuit.
- [[Leading Zero Counters]] – compares: the component LZA removes from the critical path, and the one still needed on $F$.
- [[Normalizers]] – extends: the LZC-then-shift pair that LZA reorganises into count-beside-subtract, then shift, then correct.
- [[Floating-Point Operators]] – supports: the near path of the dual-path adder is the only place this pays for itself.
- [[Parallel Prefix Adders]] – compares: the subtractor LZA runs beside; both are $O(\log w)$, which is why overlapping them is worth a correction mux.
- [[Exact Accumulators]] – counter-example: a fixed-point accumulator wide enough to hold every product never normalises, so there is no LZC to anticipate.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §10.2.2 "Logarithmic-time LZC architectures", p. 322 — monotonic-string LZC and its suitability for anticipation.
- Ibid., §11.1.4 "Dual-Path Architectures and Other Speculative Techniques", p. 342 — where the LZC sits on the near path, the one-bit error, the correction multiplexer.
- Ibid., references [Ng93], [Ino94], [SN01] (Ch. 10 list, pp. 326-327) and [Lut17], [Lut19] (Ch. 11 list, p. 361) — exact prediction and the LZA survey literature.
