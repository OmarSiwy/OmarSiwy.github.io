---
title: "SOPC, Sum of Products by Constants"
description: "The whole filter body as one bit heap — every partial product a shifted copy of an input word, compressed once and rounded once — which is what makes the internal guard bits cheap to buy."
kind: circuit
source: "ASA §12.5.3, §12.5.5, pp. 407-414; §23.3.3, pp. 690-693"
status: seed
spade: simulated
tags: [digital, lti-filters, constant-multiplication, bit-heap, rounding]
aliases:
  - SOPC
  - Sum of Products by Constants
  - Sum of Constant Products
  - Sums of Products by Constants
---

# SOPC, Sum of Products by Constants

A sum of products by constants evaluates $R=\sum_{i=0}^{N-1}C_iX_i$ with every $C_i$ frozen at synthesis time, which is what lets the whole sum be built as a single bit heap with a single rounding at the bottom rather than as $N$ multipliers each rounded on its own.

```tikz title="Direct-form IIR filter whose entire datapath is one SOPC block: five constant multipliers, the book's per-product rounding boxes, an adder chain, and the single final rounding, with fixed-point formats on every wire"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---- SOPC enclosure ----
  \draw[fill=black!3] (-0.75,0.15) rectangle (6.75,2.75);
  \node[anchor=south west, font=\tiny] at (-0.7,0.2) {SOPC};

  % ---- input delay line: u(k) -> u(k-1) -> u(k-2) ----
  \draw[->] (-2.0,3.55) -- (3.0,3.55);
  \node[anchor=south, font=\tiny] at (-1.75,3.62) {$u(k)$};
  \node[anchor=north, font=\tiny] at (-1.5,3.48) {sfix$(0,\ell)$};
  \draw[fill=black!12] (0.60,3.28) rectangle (0.90,3.82);
  \draw[fill=black!12] (2.10,3.28) rectangle (2.40,3.82);
  \node[anchor=south, font=\tiny] at (1.5,3.62) {$u(k{-}1)$};
  \node[anchor=south, font=\tiny] at (3.0,3.62) {$u(k{-}2)$};

  % ---- feedback delay line: ytilde(k) -> ytilde(k-1) -> ytilde(k-2) ----
  \draw (7.05,0.75) -- (7.05,3.55) -- (4.5,3.55);
  \draw[fill=black!12] (6.60,3.28) rectangle (6.90,3.82);
  \draw[fill=black!12] (5.10,3.28) rectangle (5.40,3.82);
  \node[anchor=south, font=\tiny] at (6.0,3.62) {$\widetilde{y}(k{-}1)$};
  \node[anchor=south, font=\tiny] at (4.5,3.62) {$\widetilde{y}(k{-}2)$};

  % ---- taps into the constant multipliers ----
  \foreach \x in {0,1.5,3.0,4.5,6.0} { \draw[->] (\x,3.55) -- (\x,2.55); }

  % ---- constant multipliers (triangles) ----
  \foreach \x/\lbl in {0/$b_0$, 1.5/$b_1$, 3.0/$b_2$, 4.5/$-a_2$, 6.0/$-a_1$} {
    \draw[fill=white] (\x-0.38,2.55) -- (\x+0.38,2.55) -- (\x,2.00) -- cycle;
    \node[font=\tiny] at (\x,2.38) {\lbl};
  }

  % ---- per-product rounding boxes (the book's drawing) ----
  \foreach \x in {0,1.5,3.0,4.5,6.0} {
    \draw[->] (\x,2.00) -- (\x,1.72);
    \draw[fill=white] (\x-0.40,1.24) rectangle (\x+0.40,1.72);
    \node[font=\tiny] at (\x,1.48) {round};
    \draw[->] (\x,1.24) -- (\x,0.97);
  }

  % ---- adder chain ----
  \foreach \x in {1.5,3.0,4.5,6.0} {
    \draw[fill=white] (\x,0.75) circle (0.22);
    \node[font=\tiny] at (\x,0.75) {$+$};
  }
  \draw[->] (0,0.97) -- (0,0.75) -- (1.28,0.75);
  \draw[->] (1.72,0.75) -- (2.78,0.75);
  \draw[->] (3.22,0.75) -- (4.28,0.75);
  \draw[->] (4.72,0.75) -- (5.78,0.75);

  % ---- ytilde out of the SOPC, then the single final rounding ----
  \draw[->] (6.22,0.75) -- (8.35,0.75);
  \fill (7.05,0.75) circle (0.055);
  \node[anchor=south, font=\tiny] at (7.75,0.86) {$\widetilde{y}(k)$};
  \node[anchor=north, font=\tiny] at (7.75,0.62) {sfix$(m',\ell_{\text{ext}})$};
  \draw[fill=white] (8.35,0.45) rectangle (9.65,1.05);
  \node[font=\tiny] at (9.00,0.75) {final round};
  \draw[->] (9.65,0.75) -- (10.85,0.75);
  \node[anchor=south, font=\tiny] at (10.35,0.86) {$\widetilde{y}_{\text{out}}(k)$};
  \node[anchor=north, font=\tiny] at (10.35,0.62) {sfix$(m',\ell')$};
\end{circuitikz}
\end{document}
```

*after Fig. 23.17, p. 690.*

**Fix the operation before arguing about the architecture.** The SOPC operation is

$$R=\sum_{i=0}^{N-1}C_iX_i \tag{12.44}$$

$N$ data inputs, one output, $N$ constants known to the synthesiser (p. 407). Each input carries the format `sfix(0, ℓ_i)`, i.e. $1-\ell_i$ bits, and the result carries `sfix(m_R, ℓ_R)`, i.e. $m_R-\ell_R+1$ bits; formats and the ulp notation are as in [[Number Formats]]. Nothing here is a multiplier: expanding $C_i=\sum_j c_{ij}2^{j}$ in binary and applying **distributivity of multiplication over addition** gives $C_iX_i=\sum_j c_{ij}\,(X_i\ll j)$, so every partial product of every term is *the same word* $X_i$, shifted. Which rows exist is decided at synthesis; only their values are data. That single observation is the whole note.

**SOPC is multiple-constant multiplication read backwards.** MCM is one input and $M$ outputs $C_0X,\dots,C_{M-1}X$; SOPC is $N$ inputs and one output. The two are related by the **transposition of the signal-flow graph** — reverse every edge, and branch nodes become adders while adders become branch nodes — so a shift-and-add MCM adder graph for a constant set can be converted into an SOPC adder graph for the same constants, and back (p. 407, Fig. 12.22, p. 409). Transposition is not free in general: transposing a constant matrix–vector graph with $N_A$ adders, $N$ inputs and $M$ outputs yields $N_A-N+M$ adders (p. 411). For the MCM$\to$SOPC direction $N=1$, so an $M$-constant MCM costing $N_A$ adders transposes to an SOPC costing $N_A+M-1$ — the four adders of Fig. 12.22e against the three of the $\{19X,43X\}$ MCM. The optimisation problem is the same problem in both directions, which is why [[Multiplication by Constants]] carries the algorithms and this note carries only the arithmetic.

**The entire body of a direct-form filter is one SOPC.** The difference equation's right-hand side $\sum_{i=0}^{m}b_i\,u(k-i)-\sum_{i=1}^{n}a_i\,\widetilde{y}(k-i)$ matches (12.44) with $N=n+m+1$ inputs — the $m+1$ delayed inputs supplied by the [[Tapped Delay Line]] and the $n$ delayed outputs supplied by the feedback line — and constants $(b_i,-a_i)$. Everything in the diagram outside the grey box is registers and one rounding. So a filter has one arithmetic operator, not $n+m+1$ of them, and the architectural question is never "which multiplier" but "how is this one sum accumulated".

**Delete the per-product roundings; they are the composition artefact.** Fig. 23.17 draws a `round` after each constant multiplier because that is what you get by wiring together five pre-existing operators. Each such rounding contributes up to one ulp of the internal format, so $N$ of them give $\overline{\delta_{\text{r}}}\le N\,2^{\ell_{\text{ext}}}$ and you must lower $\ell_{\text{ext}}$ by $\lceil\log_2 N\rceil$ bits just to pay for the composition. But since every partial product is a shifted copy of an input word, all $N$ products already live in one array of weighted bits, and **associativity and commutativity of addition** let the double sum be reassociated column-wise instead of term-wise. That is a [[Bit Heaps|bit heap]]: accumulate every weighted bit once, reduce it with a compressor tree, carry-propagate once, round once. The five rounding boxes and the four-adder chain of the figure collapse into a single reduction — see [[Sums of Weighted Bits]] for the framework and [[Compressor Trees]] for the reduction itself.

**The table-based version makes the collapse concrete.** Under KCM each input is split into $D_i$ chunks $X_{ik}$ of $\alpha$ bits, and applying distributivity again turns (12.44) into a double sum

$$R\approx\sum_{i=0}^{N-1}\sum_{k=0}^{D_i-1}2^{k\alpha+\ell_i}\,C_iX_{ik} \tag{12.48}$$

whose terms $T_{ik}(X_{ik})$ are each one precomputed table (p. 412). Three rules make this correct and cheap. First, **all tables share one output LSB** $\ell_R-g$, because "if one of the tables is more accurate than another one, then it is accurate in vain" (p. 413) — a heap is only as accurate as its shallowest column. Second, the $\sum_i D_i$ table outputs go into one heap with **one** truncation at the end, (12.49), so the individual table errors merge into a single global error analysis instead of $ND$ independent ones. Third, the $g$ guard bits below $\ell_R$ that make that single truncation last-bit accurate follow from generalising the worst-case error analysis of §12.3:

$$g>\log_2(ND) \tag{12.51}$$

For the 4th-order half-sine FIR of Fig. 12.25, $N=4$ inputs each split into $D=3$ chunks gives $g>\log_2 12$, hence $g=4$ (p. 413). FloPoCo's `FixRealSOPC` uses the tighter $g>1+\log_2\overline{\delta^{(\text{gulp})}_{\text{round}}}$ (12.52), summing the true per-constant error bounds rather than assuming the worst for each, where a *gulp* is the ulp of the computation including the guard bits. Round-to-nearest at the bottom then costs nothing: the half-ulp $2^{\ell_R-1}$ is folded into one of the tables (p. 414), so the bias is a row of the heap that already existed. See [[Rounding]] for why a bias plus a truncation is a round-to-nearest.

**What $\delta_{\text{r}}$ measures is exactly the SOPC's contract, and nothing more.** In a filter the SOPC's own error is

$$\delta_{\text{r}}(k)=\widetilde{y}(k)-\left(\sum_{i=0}^{m}b_iu(k-i)-\sum_{i=1}^{n}a_i\widetilde{y}(k-i)\right) \tag{23.30}$$

which compares the hardware block against an *ideal* SOPC using infinitely accurate $a_i,b_i$ but fed the **same finite-precision** $u(k-i)$ and $\widetilde{y}(k-i)$ (p. 692). So $\delta_{\text{r}}$ absorbs coefficient quantisation and datapath rounding and nothing else — no input error, no accumulated history. It can be made arbitrarily small by lowering $\ell_{\text{ext}}$, and it is **exactly zero** when the coefficients are finitely representable and the internal format is wide enough to hold the exact sum. What the feedback loop then does to $\delta_{\text{r}}$ is priced separately, by the worst-case peak gain of $1/(1+\sum a_iz^{-i})$; a faithful SOPC is a necessary condition for a faithful filter and never a sufficient one (p. 414).

> [!important] Guard bits are linear in a heap and exponential in accuracy
> One extra guard bit adds one column to the bit heap: at most $ND$ extra bits, one extra row of half adders, one extra bit of final carry-propagation. What it buys is a halving of the rounding error. That asymmetry is why the 22 guard bits a bell-model resonator demands ($\lceil\log_2 1.2806\times10^{6}\rceil+1$, p. 694) are affordable at all: 22 more columns of a five-row heap, against 22 more bits on five separately rounded multipliers *and* the four adders between them. Build the sum as one heap and the internal precision stops being the expensive parameter.

**On FPGA the tables are the fabric.** Each $T_{ik}$ is an $\alpha$-input lookup per output bit, which is literally what a LUT is, and a table-based method "provides lower area and better delay for low input word sizes" on FPGAs (p. 407); the heap reduction below it then maps to the fabric's ternary adders and hard carry chains rather than to explicit 4:2 compressors. On ASIC the same $T_{ik}$ is real ROM, so shift-and-add adder graphs from the MCM literature usually win instead, and the heap is reduced with a genuine compressor tree. The operation is identical; only the row-generation cost model flips. See [[FPGAs]].

$$\boxed{\;R=\left\lfloor\;\sum_{i=0}^{N-1}\sum_{k=0}^{D_i-1}2^{k\alpha+\ell_i}\,T_{ik}(X_{ik})\;\right\rfloor_{\ell_R},\qquad g>\log_2(ND)\;}$$

**When it breaks.**

- **A coefficient that is not constant.** The moment $C_i$ is a runtime value, every row of the heap becomes data-dependent and the block is an $N$-multiplier array. Nothing above survives.
- **Large $N$.** Heap height grows like $ND$, so compressor-tree depth grows like $\log_{3/2}(ND)$ and the final carry-propagate over $m_R-\ell_R+g+1$ bits becomes the critical path. Past that point the SOPC must be pipelined or split, and the single-rounding argument stops being free.
- **Wide inputs.** The table-based construction only wins for small word sizes (p. 407); above that $D_i$ grows, $\log_2(ND)$ grows with it, and shift-and-add adder graphs take over.
- **Trivial constants.** $C_i\in\{0,\pm2^{j}\}$ costs no adder and injects no rounding error, so any cost model that charges $N$ products overestimates — this is exactly the effect that lets a jointly optimised FIR beat a quantised-afterwards one.
- **Recursion.** In a recursive filter the SOPC output is re-injected into its own inputs, and that infinite recursion needs an error analysis the single-block bound above does not provide (p. 414).

**RTL.** A concrete 4-input SOPC: the quantised coefficients $(205,614,819,410)\cdot2^{-11}$ of the 4-tap FIR worked example, four `sfix(0,-7)` inputs, one rounding.

```spade
/// One tap: an exact product by a synthesis-time constant, widened to the
/// shared heap format and never rounded on its own.
fn tap(x: int<8>, c: int<20>) -> int<20> {
    let xw: int<20> = sext(x);
    (xw * c).trunc()
}

/// R = sum C_i X_i for C = (205, 614, 819, 410). The four terms and the
/// half-ulp bias 2^(l_R-1) = 32 are one bit heap at LSB 2^-18; the single
/// arithmetic shift is the single rounding, to LSB 2^-12.
entity sopc4(x0: int<8>, x1: int<8>, x2: int<8>, x3: int<8>) -> int<14> {
    let heap: int<20> =
        tap(x0, 205) +. tap(x1, 614) +. tap(x2, 819) +. tap(x3, 410) +. 32;
    trunc(heap >> 6)
}
```

Each `tap` is one constant multiplier triangle of the diagram, and there is no `round` box under any of them: the four 19-bit products and the bias share one 20-bit accumulator — 19 bits for the worst case $\sum|C_i|\cdot2^{7}=2^{18}$ plus a sign — so the wrapping `+.` never wraps. The bias `+. 32` is the half-ulp of (12.50) folded into the heap, and `heap >> 6` is the arithmetic shift that both truncates toward $-\infty$ and, with that bias, rounds to nearest, at LSB $2^{-12}$ in a 14-bit signed result. Synthesis will not build the chain the source implies: the four `+.` and the constant multiplies flatten into one array of weighted bits and one compressor tree, and the six discarded LSBs are simply never generated.

Simulated against `(205*x0 + 614*x1 + 819*x2 + 410*x3 + 32) >>> 6` over ten named vectors plus a 3000-vector random sweep, 3010/3010 pass. The named set includes $(127,0,0,0)$ against $(0,0,0,127)$, which differ only if the coefficients are attached to the right inputs. On the worked example's vector $(77,-45,101,19)$ the exact sum is $78664\cdot2^{-18}=1229.125\cdot2^{-12}$ and this block returns $1229$; truncating the four products independently at $2^{-12}$ instead returns $1227$. One heap and one rounding is worth two ulps on that single sample.

**Related Notes.**

- [[Bit Heaps]] – depends-on: the single weighted-bit accumulation that the $N$ products and the rounding bias all fall into.
- [[Compressor Trees]] – depends-on: what actually reduces that heap, and where the SOPC's delay comes from.
- [[Sums of Weighted Bits]] – supports: the framework in which "compress once, round once" is the natural statement rather than an optimisation.
- [[Multiplication by Constants]] – compares: the transposed problem, one input and many outputs, sharing the same adder graphs and the same $\pm(M-1)$ adder accounting.
- [[Rounding]] – supports: why a folded half-ulp plus a truncation is a round-to-nearest, and what "faithful" costs.
- [[Direct Form I IIR Filter]] – extends: wraps this block in delay lines and a feedback path, at which point $\delta_{\text{r}}$ gets amplified.
- [[Direct-Form FIR Filter]] – extends: the same block with all $a_i=0$, where the SOPC error passes to the output unamplified.
- [[Tapped Delay Line]] – supports: supplies the $u(k-i)$ that are this operator's $X_i$.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024):

- §12.5.3, p. 407 — the SOPC operation (12.44), and SOPC as the SFG transpose of MCM.
- §12.5.3–12.5.4, pp. 408–411 — Fig. 12.22, the $\{19X,43X\}$ MCM-to-SOPC transposition worked through; the $N_A-N+M$ adder count under transposition.
- §12.5.5, pp. 412–414 — KCM-based SOPC (12.47)–(12.50), Figs. 12.24–12.25, the shared table LSB and guard bits (12.51)–(12.52), the folded half-ulp, and the note that recursive filters need Ch. 23.
- §23.3.1, p. 690 — Fig. 23.17, the direct-form IIR built around one SOPC block, with its fixed-point formats.
- §23.3.3, pp. 691–693 — the error decomposition and the definition of $\delta_{\text{r}}$ (23.30).
- §23.3.5, p. 694 — the bell-resonator guard-bit count used in the callout.
