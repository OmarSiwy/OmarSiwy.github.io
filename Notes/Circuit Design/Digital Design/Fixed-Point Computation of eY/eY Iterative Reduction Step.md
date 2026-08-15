---
title: eY Iterative Reduction Step
description: "One step of L_{i+1} = L_i - L_i^dagger: the alpha_i leading bits of L_i address two ROMs (X_i^dagger and L_i^dagger = ln E_i^dagger), and the subtraction cancels alpha_i - 1 MSBs so the datapath narrows monotonically toward L_n ~ 0."
kind: circuit
source: "ASA §22.5.5, pp. 662-663"
status: seed
spade: simulated
tags: [digital, fixed-point-computation-of-ey, exponential, digit-recurrence, lookup-table]
aliases:
  - eY Reduction Step
  - Iterative Exponential Reduction Step
  - Exponential Digit Recurrence Reduction
---

# eY Iterative Reduction Step

One iteration of the additive recurrence $L_{i+1} = L_i - L_i^\dagger$, in which the $\alpha_i$ leading bits of $L_i$ address a pair of ROMs and the subtraction is guaranteed to cancel $\alpha_i - 1$ of them, so this is the only step in the $e^Y$ family whose datapath gets *narrower* the further you go.

```tikz title="One reduction step: subword A_i addresses two ROMs, the subtraction cancels alpha_i - 1 MSBs"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- Fig. 22.8: decomposition of L_i ---
  \draw (-3.6,4.9) rectangle (2.4,5.4);
  \draw (-2.1,4.9) -- (-2.1,5.4);
  \node at (-2.85,5.15) {$A_i$};
  \node at (0.15,5.15) {remaining bits of $L_i$};
  \node[anchor=east] at (-3.65,5.15) {$L_i$};
  \draw[<->] (-3.6,5.65) -- (-2.1,5.65);
  \node[anchor=south] at (-2.85,5.62) {$\alpha_i$ bits};
  \node[anchor=south east] at (2.45,5.45) {LSB $\ell$};
  \node[anchor=west] at (2.5,5.15) {$w_i$ bits};

  % --- A_i fans out to the two ROMs ---
  \draw (-2.85,4.9) -- (-2.85,4.5);
  \draw (-4.5,4.5) -- (-1.5,4.5);
  \draw[->] (-4.5,4.5) -- (-4.5,4.1);
  \draw[->] (-1.5,4.5) -- (-1.5,4.1);

  \draw (-5.7,3.3) rectangle (-3.3,4.1);
  \node[align=center] at (-4.5,3.7) {$X_i^\dagger = E_i^\dagger-1$\\[-1pt]\footnotesize $2^{\alpha_i}$ entries};
  \draw (-2.7,3.3) rectangle (-0.3,4.1);
  \node[align=center] at (-1.5,3.7) {$L_i^\dagger=\ln E_i^\dagger$\\[-1pt]\footnotesize $2^{\alpha_i}$ entries};

  \draw[->] (-1.5,3.3) -- (-1.5,2.6);
  \node[anchor=east] at (-1.55,2.95) {$L_i^\dagger$};
  \node[anchor=west] at (-1.45,2.95) {\texttt{sfix}, $w_i$ bits, LSB $\ell$};

  % --- L_i bypass into the subtractor ---
  \draw[->] (2.2,4.9) -- (2.2,2.6);
  \node[anchor=west] at (2.25,3.7) {$L_i$};

  % --- subtractor ---
  \draw (-2.3,1.9) rectangle (2.9,2.6);
  \node at (0.3,2.25) {$-$ \ \ (22.33)};
  \draw[->] (0.3,1.9) -- (0.3,1.0);
  \node[anchor=west] at (0.35,1.65) {$L_{i+1}$\quad $w_i-(\alpha_i-1)$ bits, LSB $\ell$};
  \node[anchor=west,font=\footnotesize] at (0.35,1.25) {top $\alpha_i-1$ bits cancel $\Rightarrow$ narrower each step};
  \node[anchor=west,font=\footnotesize] at (0.35,0.85) {back to $L_i$ of the next step, until $L_n\approx0$};

  % --- X^dagger kept for reconstruction ---
  \draw[->] (-4.5,3.3) -- (-4.5,1.4);
  \node[anchor=east] at (-4.55,2.3) {$X_i^\dagger$};
  \node[anchor=west] at (-4.45,2.3) {$\alpha_i$ bits};
  \node[anchor=north,font=\footnotesize,align=center] at (-4.5,1.35) {pushed on a stack;\\ popped by the reconstruction pass};
\end{circuitikz}
\end{document}
```

*The word split at the top is Fig. 22.8, p. 663; the surrounding dataflow is my own construction from (22.32)–(22.33), pp. 662–663.*

**The step exists to consume a chunk of $L_i$ at a price fixed in advance.** The family it belongs to is built on precomputed pairs of reals $(E_i^\dagger, L_i^\dagger)$ with $E_i^\dagger = e^{L_i^\dagger}$, iterated as

$$\forall i>0\quad\begin{cases} L_{i+1} = L_i + L_i^\dagger\\ E_{i+1} = E_i\times E_i^\dagger\end{cases} \qquad (22.32)$$

which maintains the invariant $E_i = e^{L_i}$: from $E_{i+1}=E_i^\dagger E_i = e^{L_i^\dagger}e^{L_i}=e^{L_i^\dagger+L_i}=e^{L_{i+1}}$, using $e^{a}e^{b}=e^{a+b}$. To evaluate $e^{L_0}$ for $L_0 = Y\in[-\tfrac12,\tfrac12]$ we run (22.32) in the *subtractive* direction so that $L_i\to 0$; this note is that direction. The multiplicative half, $E_i = E_{i+1}E_i^\dagger$ run backwards, is [[eY Iterative Reconstruction Step]].

**Choosing $E_i^\dagger$ first is what makes the tables cheap, and it inverts the obvious causality.** One is tempted to tabulate $L_i^\dagger = A_i$ and derive $E_i^\dagger = e^{A_i}$ — but then $E_i^\dagger$ is a full-width irrational and the multiplication in the reconstruction pass is a full multiplication. The construction goes the other way: pick $E_i^\dagger$ as a *short* number, one that costs $\alpha_i$ bits and no more, and pay for that by tabulating its logarithm, which is the cheap operand here because $L_i^\dagger$ only ever meets an adder. Concretely, the $\alpha_i$ leading bits of $L_i$ form the subword $A_i$, which addresses two ROMs of $2^{\alpha_i}$ entries each ([[Lookup-Tables]]):

- $X_i^\dagger = E_i^\dagger - 1$, an approximation to $e^{L_i}-1$ built from $A_i$ alone and rounded to a fixed-point format of only $\alpha_i$ bits;
- $L_i^\dagger = \ln(E_i^\dagger)$, rounded to LSB $\ell$.

Neither table is addressed by anything but $A_i$, so both are pure combinational ROMs — one LUT level each when $\alpha_i$ equals the fabric's LUT input width.

**The cancellation is a width argument, not an accuracy argument.** $L_i$ and $L_i^\dagger$ share the LSB $\ell$ by construction, so

$$L_{i+1} = L_i - L_i^\dagger \qquad (22.33)$$

is width-aligned and needs no shifter — a plain two's-complement subtraction ([[RCA, Ripple-Carry Adder]]). Since $L_i^\dagger$ was selected to be close to $L_i$, the difference cancels the $\alpha_i-1$ most significant bits of $L_i$, so if $L_i$ is $w_i$ bits then

$$w_{i+1} = w_i - (\alpha_i - 1)$$

with LSB still at $\ell$. Nothing is truncated: the discarded MSBs are provably sign-extension of the bits that remain, which is why the narrowing is free rather than an approximation.

> [!important]
> Why $\alpha_i-1$ and not $\alpha_i$. Truncating $L_i$ to $A_i$ leaves a remainder in $[0,2^{\ell+w_i-\alpha_i})$ — that alone would cancel $\alpha_i$ bits and leave an *unsigned* residue. The lost bit is the price of $L_i^\dagger$ being $\ln$ of a **quantized** $E_i^\dagger$ rather than $A_i$ itself: that quantization moves $L_i^\dagger$ off $A_i$ by up to about a half-ulp of $X_i^\dagger$ amplified by $1/E_i^\dagger$, which can push $L_{i+1}$ negative. One extra bit absorbs both the displacement and the sign.

**Widths, concretely.** Take $\ell = -(w_F+g)$ as in [[Number Formats]], so $L_0 = Y$ is `sfix`$(-1,\ell)$ and $w_0 = w_F+g$. With a fixed $\alpha_i = \alpha$ the sequence is $w_{i+1} = w_i - (\alpha-1)$, and iteration stops at the first $n$ with $L_n$ small enough that $e^{L_n}-1$ is a one-term Taylor or a tiny table:

$$n \approx \frac{w_F+g}{\alpha-1}$$

For the parameters in the RTL below — $w_F+g=12$, $\ell=-12$, $\alpha=4$ — the widths run $12 \to 9 \to 6 \to 3$, so $n=3$ and $|L_3| < 2^{-10}$, at which point $e^{L_3}-1 = L_3 + O(2^{-21})$ is already below the $2^{-12}$ ulp and the recurrence is done. $\alpha$ is the single knob: bigger $\alpha$ means $2^\alpha$-entry tables and fewer iterations, smaller $\alpha$ the reverse.

**The tables are per-step, which is why "loop control" is nearly free and folding is nearly pointless.** $A_i$ sits at bit positions $\ell+w_i-1$ down to $\ell+w_i-\alpha_i$, which move down by $\alpha_i-1$ every step, and $\ln$ is not scale-invariant — so step $i$ needs its *own* pair of ROMs. Folding the recurrence onto one physical step therefore saves only the subtractor (which is shrinking anyway) while adding an address counter, an input mux and a table-select; it does not save the $n$ table pairs, which are the whole area. The natural implementation is the fully spatial one: $n$ steps in a feed-forward chain, no counter, no mux, registers only where you want pipeline stages. That is the sense in which this recurrence is iterative in derivation and combinational in silicon.

**On FPGA the fabric picks $\alpha$ for you; on ASIC the adder picks the arithmetic.** On a LUT-only fabric, setting $\alpha_i$ to the LUT input width makes each ROM exactly one LUT level and the whole reduction chain a shallow logic cone — an excellent match. On modern DSP-and-BRAM FPGAs the match fails from both ends, and [[eY DSP and BRAM Mapping]] is the reason: sized for LUTs the reconstruction multipliers underuse the DSPs, sized for DSPs the $2^{\alpha_i}$ tables explode. On ASIC the binding constraint is (22.33) itself — the chain of $n$ dependent subtractions is the critical path, and implementations move to high-radix [[Redundant Number Systems]] to break the carry propagation, exactly as CORDIC-class recurrences do.

$$\boxed{\ L_{i+1} = L_i - L_i^\dagger,\qquad L_i^\dagger = \ln E_i^\dagger \ \text{addressed by the } \alpha_i \text{ leading bits of } L_i,\qquad w_{i+1} = w_i - (\alpha_i-1)\ }$$

**When it breaks.**

- The narrowing stops paying once $w_i \le \alpha_i$: there is no "remaining bits" field left to cancel into, so the last step must be replaced by a direct table or a Taylor term on $L_n$.
- $\alpha_i$ large enough to fill a modern FPGA's memory or DSP granularity makes $2^{\alpha_i}$ table entries per step, times $n$ steps — the [[Higher-Order eY Architecture]] wins outright there.
- The $\alpha_i-1$ cancellation is a guarantee only if the ROM contents are *chosen* to satisfy it, not merely rounded to nearest. Round $X_i^\dagger$ to $\alpha_i$ bits carelessly and $\ln E_i^\dagger$ drifts far enough from $A_i$ that $L_{i+1}$ overflows its $w_i-(\alpha_i-1)$ bits — the truncation in the RTL below then silently wraps.
- Latency is $n$ dependent additions plus $n$ ROM reads, against one table + one multiplier + two adders for the higher-order architecture. This family is chosen for area on LUT fabric, never for latency.

> [!warning] Not covered in the source — needs outside research
> The book gives no LUT, slice, DSP or delay figure for this architecture, and states plainly (p. 663) that *"a detailed comparison on the same technology of this iterative architecture and a polynomial-based one is currently missing."* Any area or timing number for the reduction chain would have to be synthesized, not cited.

**RTL (Spade).** One iteration, with $\ell=-12$ and $\alpha=4$, so $L_0=Y$ is `int<12>` scaled by $2^{-12}$ and $L_1$ is `int<9>`. The two ROMs are the $i=0$ tables: $X_0^\dagger$ has LSB $2^{-5}$ and $L_0^\dagger = \ln(1+X_0^\dagger)$ is rounded to LSB $2^{-12}$.

```spade
// L_i^dagger = ln(E_i^dagger) rounded to LSB 2^-12, indexed by the raw 4-bit A_i
fn ldag(a: uint<4>) -> int<12> {
    [    0,   367,   595,   810,  1114,  1304,  1575,  1828,
     -1925, -1725, -1535, -1178, -1011,  -696,  -403,  -130][a]
}

// X_i^dagger = E_i^dagger - 1, LSB 2^-5, kept for the reconstruction pass
fn xdag(a: uint<4>) -> int<6> {
    [  0,  3,  5,  7, 10, 12, 15, 18,
     -12,-11,-10, -8, -7, -5, -3, -1][a]
}

entity reduction_step(l: int<12>) -> (int<9>, int<6>) {
    let a = l.as_bits()[8..12].as_uint();
    let d = l - ldag(a);
    let lnext: int<9> = trunc(d);
    (lnext, xdag(a))
}
```

`l.as_bits()[8..12]` is the $A_i$ field of the word at the top of the diagram — pure wiring, no logic, and reinterpreting the top four bits of a two's-complement word as a 4-bit two's-complement index is exactly $\lfloor L_i \cdot 2^{4}\rfloor$. `l - ldag(a)` is the subtractor: Spade widens `-` to `int<13>`, and `trunc` to `int<9>` is the $\alpha-1=3$ bits the diagram promises will cancel — that `trunc` is the one line in the note that is only correct because of the table construction. Everything is combinational; the diagram's feedback to "the next step" is not a register here, it is the next entity in the chain, each with its own narrower width and its own table pair. Synthesis will absorb both ROMs into LUTs rather than memory at this size, and will merge the constant-input subtractor bits into them.

**Related Notes.**

- [[eY Iterative Reconstruction Step]] – extends: consumes the $X_i^\dagger$ this step pushes, running (22.32) multiplicatively with decreasing $i$.
- [[Choosing an eY Architecture]] – compares: where this family sits against the table-and-multiplier ones, and the fabrics on which it wins.
- [[CORDIC]] – compares: the same shift-and-add digit recurrence with the convergence forced to one bit per step instead of $\alpha_i-1$.
- [[Lookup-Tables]] – depends-on: both $2^{\alpha_i}$-entry ROMs, and the reason $\alpha_i$ tracks the LUT input width.
- [[RCA, Ripple-Carry Adder]] – depends-on: (22.33) is one width-aligned two's-complement subtraction per step.
- [[Redundant Number Systems]] – extends: breaks the carry chain of the $n$ dependent subtractions on ASIC.
- [[eY DSP and BRAM Mapping]] – counter-example: the hard-block mapping this architecture cannot exploit in either direction.
- [[Higher-Order eY Architecture]] – compares: one table and one square multiplier instead of $n$ tables and $n$ rectangular ones.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §22.5.5 Iterative computation of $e^Y$ using small tables and rectangular multipliers — pp. 662–663 (Fig. 22.8; eqs. 22.32–22.33)
- §22.5.6 To read further — pp. 663–664 (CORDIC as a variant of (22.32); [Mul16], [Erc73], [PEB03], [PEB04])
