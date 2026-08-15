---
title: Transposed Direct Form II IIR Filter
description: "Shares registers like DF-II yet multiplies the b_i by the narrow u(k) like DF-I — the best area at equal guaranteed accuracy, at a critical path of two multipliers and two adders."
kind: circuit
source: "ASA §23.1.5-23.1.6, pp. 679-681"
status: seed
spade: simulated
tags: [digital, lti-filters, iir, transposed, mcm, fixed-point]
aliases:
  - TDF-II
  - TDFII
  - Transposed Direct Form II
  - Transposed direct form II
  - Direct form II, transposed
---

# Transposed Direct Form II IIR Filter

The one recursive structure whose feed-forward coefficients multiply the *input* while its delay line is still shared, bought at a critical path that runs through two multipliers and two adders instead of one multiplier and an adder chain.

```tikz title="Transposed direct form II IIR filter of order 2: shared delay column, two independent MCMs, and the two-multiplier critical path"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---- critical-path underlay: u -> b0 -> adder -> y -> -a1 -> adder ----
  \draw[line width=2.4pt, red!25]
    (0.6,3.0) -- (3.2,3.0) -- (6.4,3.0) -- (6.4,1.6) -- (3.2,1.6) -- (3.2,1.15);

  % ---- MCM boundaries ----
  \draw[dashed, gray] (1.05,-0.25) rectangle (2.05,3.45);
  \node[gray, font=\tiny, anchor=south] at (1.55,3.45) {MCM by $(b_0,b_1,b_2)$};
  \draw[dashed, gray] (5.05,-0.25) rectangle (6.05,2.05);
  \node[gray, font=\tiny, anchor=north] at (5.55,-0.35) {MCM by $(-a_1,-a_2)$};

  % ---- input bus ----
  \draw[->] (-1.0,3.0) -- (0.6,3.0);
  \node[anchor=south, font=\tiny] at (-0.2,3.08) {$u(k)$};
  \node[anchor=north, font=\tiny] at (-0.2,2.92) {sfix$(0,\ell)$};
  \draw (0.6,3.0) -- (0.6,0.2);
  \fill (0.6,1.6) circle (0.05);
  \fill (0.6,0.2) circle (0.05);

  % ---- forward (b) multipliers ----
  \foreach \y/\lab in {3.0/$b_0$, 1.6/$b_1$, 0.2/$b_2$} {
    \draw[->] (0.6,\y) -- (1.2,\y);
    \draw[fill=white] (1.2,{\y+0.28}) -- (1.2,{\y-0.28}) -- (1.9,\y) -- cycle;
    \node[font=\tiny] at (1.42,\y) {\lab};
    \draw[->] (1.9,\y) -- (2.98,\y);
  }

  % ---- adder column ----
  \foreach \y in {3.0, 1.6, 0.2} {
    \draw[fill=white] (3.2,\y) circle (0.22);
    \node at (3.2,\y) {$+$};
  }

  % ---- shared delay registers, on the adder column ----
  \draw (3.2,0.42) -- (3.2,0.75);
  \draw[fill=black!10] (3.05,0.75) rectangle (3.35,1.15);
  \draw[->] (3.2,1.15) -- (3.2,1.38);
  \node[anchor=west, font=\tiny] at (3.45,1.05) {$w_2(k{-}1)$};
  \node[anchor=west, font=\tiny] at (3.45,0.78) {sfix$(m',\ell_{\text{ext}})$};

  \draw (3.2,1.82) -- (3.2,2.15);
  \draw[fill=black!10] (3.05,2.15) rectangle (3.35,2.55);
  \draw[->] (3.2,2.55) -- (3.2,2.78);
  \node[anchor=west, font=\tiny] at (3.45,2.35) {$w_1(k{-}1)$};

  % ---- output and feedback bus ----
  \draw[->] (3.42,3.0) -- (7.9,3.0);
  \node[anchor=south, font=\tiny] at (7.2,3.08) {$\widetilde{y}(k)$};
  \node[anchor=north, font=\tiny] at (7.2,2.92) {sfix$(m',\ell_{\text{ext}})$};
  \fill (6.4,3.0) circle (0.05);
  \draw (6.4,3.0) -- (6.4,0.2);
  \fill (6.4,1.6) circle (0.05);
  \fill (6.4,0.2) circle (0.05);

  % ---- feedback (-a) multipliers, pointing left ----
  \foreach \y/\lab in {1.6/$-a_1$, 0.2/$-a_2$} {
    \draw[fill=white] (6.0,{\y+0.28}) -- (6.0,{\y-0.28}) -- (5.3,\y) -- cycle;
    \node[font=\tiny] at (5.75,\y) {\lab};
    \draw (6.4,\y) -- (6.0,\y);
    \draw[->] (5.3,\y) -- (3.42,\y);
  }

  \node[red!60!black, font=\tiny, anchor=west] at (-1.0,-0.85)
    {critical path (red): 2 multipliers + 2 adders, $u(k)\to\widetilde{y}(k)\to w_1$};
\end{circuitikz}
\end{document}
```

*after Fig. 23.11b, p. 680; formats after Fig. 23.17, p. 690.*

**Transpose the graph and the coefficients change what they multiply.** Reversing every edge of a single-input single-output signal-flow graph, swapping every fork with an adder, and exchanging input with output leaves the transfer function $H(z)$ unchanged — the classical transposition theorem, which holds because the graph's transmittance is the same product of branch gains summed over the same paths, read backwards. Apply it to [[Direct Form II IIR Filter]] (Fig. 23.10, redrawn as Fig. 23.11a, p. 680) and the *two* SOPCs of that structure — the $a$-side and the $b$-side sums of products by constants — each become a **multiple constant multiplication**: one value fanning out into many constant multipliers instead of many values collapsing into one adder tree. The delay elements stay in one shared column, so the register sharing that motivated direct form II survives transposition (p. 679).

**Read the recurrence off the adder column, bottom-up.** Each row $i$ of the column owns one state variable $w_i$ that is the sum of everything the rows below it have already accumulated, delayed one sample, plus that row's own two products. For a filter of order $N=\max(n,m)$, with $n$ feed-forward taps $b_0\ldots b_n$ and $m$ feedback taps $a_1\ldots a_m$ (pad the shorter list with zeros):

$$w_N(k) = b_N\,u(k) - a_N\,\widetilde{y}(k)$$
$$w_i(k) = b_i\,u(k) - a_i\,\widetilde{y}(k) + w_{i+1}(k-1), \qquad 1 \le i < N$$
$$\widetilde{y}(k) = b_0\,u(k) + w_1(k-1)$$

Substituting downwards, $w_1(k-1)$ carries $b_1u(k-1) - a_1\widetilde{y}(k-1)$ plus $w_2(k-2)$, and by induction $\widetilde{y}(k) = \sum_{i=0}^{n} b_iu(k-i) - \sum_{i=1}^{m}a_i\widetilde{y}(k-i)$ — equation (23.13) recovered, which is the whole content of the claim that transposition preserves $H(z)$.

**The point of the transposition is which signal the $b_i$ see.** In direct form II every multiplier — both the $a_i$ and the $b_i$ — takes the loop signal $t'(k)$, which is computed inside the feedback and therefore has to be carried at extended precision `sfix(m', ℓ_ext)`. In direct form I the $b_i$ take $u(k)$ at the interface format `sfix(0, ℓ)`, but the two delay lines are unshared. Transposed direct form II gets both: the $b$ column hangs off the input bus at `sfix(0, ℓ)`, so its constant multipliers are built for a $1-\ell$-bit data input, while the delay column is still a single chain of $N$ registers. Only the $a$ column consumes $\widetilde{y}(k)$ at $m'-\ell_{\text{ext}}+1$ bits, and it must, in every structure — the recursion is what defines an IIR filter. Since a constant multiplier's area grows roughly linearly in the width of its *data* input (see [[Multiple Constant Multiplication]]), moving $n+1$ of the $n+m+1$ multipliers back onto the narrow bus is where the area comes from. This is why the chapter calls it "the best combination" (p. 681).

**Both coefficient columns are MCM problems, and they are independent.** The $b$ column computes $\{b_0u, \ldots, b_nu\}$ from one value; the $a$ column computes $\{a_1\widetilde{y}, \ldots, a_m\widetilde{y}\}$ from another. Each is single-variable MCM, so each can be solved by a shift-and-add network that shares intermediate sums across coefficients — $n+1$ constant multiplications cost far fewer than $n+1$ multipliers, and the savings do not have to be split between the two columns because no subexpression is shared between them (they multiply different data). The adders on the column itself are *structural*, not part of either MCM: $N$ two-input adders of [[Adders]], each at the internal width $m'-\ell_{\text{ext}}+1$.

**The critical path is the price, and it is a genuine two-multiplier path.** $\widetilde{y}(k)$ is not registered — it is the output of the top adder, driven combinationally by $b_0u(k)$ and by the register $w_1$. That same $\widetilde{y}(k)$ immediately drives the $a$ column, whose products land in the row-$i$ adders *before* those adders' outputs reach the registers. So the longest combinational run is $u(k) \to b_0\text{-mult} \to \text{adder}_0 \to \widetilde{y}(k) \to a_1\text{-mult} \to \text{adder}_1 \to w_1$: two multipliers and two adders, drawn in red above, against one multiplier plus an adder chain in direct forms I and II (p. 681).

**Only one of those two multipliers can be retimed away.** The $b_0$ multiplier is *not* inside the feedback loop; the loop is $\widetilde{y} \to a_1\text{-mult} \to \text{adder}_1 \to w_1 \to \text{adder}_0 \to \widetilde{y}$, containing one multiplier, two adders and exactly one register. Registering the input bus once (at the narrow format `sfix(0, ℓ)`, so it is cheap) and cutting after the $b$ MCM shifts the whole response by $z^{-1}$ — a pure latency, still LTI — and removes the $b_0$ multiplier from the combinational path. What remains, one multiplier plus two adders per register, is the loop's iteration bound and no amount of pipelining removes it: any register inserted inside that loop adds a $z^{-1}$ the difference equation did not ask for and changes $H(z)$.

> [!warning] Not covered in the source — needs outside research
> Ch. 23 states the two-multiplier critical path as a flat drawback (p. 681) and gives the retiming fix only for direct form II ("add one register to the wire labeled $t'(k)$ on Fig. 23.10, but then it is no longer possible to share registers"). The retiming argument in the paragraph above is standard signal-flow-graph retiming, not the book's; the chapter gives no delay, LUT or slice numbers for any structure.

**Accuracy is where the structures become comparable at all.** Every one of the four structures splits into a non-recursive forward path — ordinary error analysis, see [[Error Accuracy]] — and a recursive loop, in which a rounding error injected once is fed back forever (p. 681). Writing $\delta_{\text{r}}(k)$ for the per-sample rounding error of the arithmetic and $\delta_{\text{t}}(k) = \widetilde{y}(k) - y(k)$ for the resulting deviation from the ideal filter, (23.32) rearranges into an IIR filter driven by $\delta_{\text{r}}$:

$$\mathcal{H}_\delta(z) = \frac{1}{1+\sum_{i=1}^{n}a_iz^{-i}}, \qquad \overline{\delta_{\text{t}}} = \langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\,\overline{\delta_{\text{r}}} \tag{23.33-34}$$

so the LSB of the internal format must sit $1+\lceil\log_2\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\rceil$ guard bits below the output LSB, $\ell_{\text{ext}} = \ell' - 1 - \lceil\log_2\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\rceil$ (23.37, p. 694). $\mathcal{H}_\delta$ depends only on the $a_i$, which are the same in every structure, so the guard-bit count is a property of the *filter*, not of the architecture — and that is precisely what makes the sentence "transposed direct form II is the best area **at equal guaranteed accuracy**" mean something rather than being a comparison of unequal circuits. See [[Number Formats]] for the `sfix(m, ℓ)` convention.

> [!warning] Not covered in the source — needs outside research
> §23.3.3-23.3.5 derives (23.30)-(23.37) for a *direct-form* implementation, where all rounding is lumped into a single SOPC error $\delta_{\text{r}}$. In the transposed form the rounding errors are injected at $N$ different nodes, each with a different sub-path to the output, so the bound above is applied by analogy and is conservative rather than tight. The chapter does not redo the analysis per structure.

**Wrap-around inside the loop is safe, and that is not obvious.** The internal MSB $m'$ is chosen from the worst-case peak gain by (23.24), $m' \le \lceil\log_2(\langle\!\langle\mathcal{H}\rangle\!\rangle + 2^{\ell'})\rceil$, and that bound is often pessimistic. If it is exceeded anyway, the result is still correct: two's-complement addition and multiplication are ring homomorphisms modulo $2^{m'-\ell_{\text{ext}}+1}$, so an intermediate that wraps and is then fed into the $a_i$ multipliers propagates consistently and the final value is right whenever the *final* value fits (p. 691). This is what licenses the RTL below to use Spade's width-preserving `*.` `+.` `-.` throughout and still match a bit-exact reference: with no LSB truncation the datapath is exactly $\mathbb{Z}/2^{16}$. Add truncation, and the ring structure is gone — that is the job of the guard bits.

$$\boxed{\ \widetilde{y}(k) = b_0u(k) + w_1(k-1),\qquad w_i(k) = b_iu(k) - a_i\widetilde{y}(k) + w_{i+1}(k-1)\ }$$

**When it breaks.**

- **Timing.** Two multipliers and two adders combinational. Retiming buys back one multiplier at the cost of one sample of latency; the remaining $T_{\text{mult}} + 2T_{\text{add}}$ per register is the loop's iteration bound. If that still misses the clock target, fall back to plain [[Direct Form II IIR Filter]] with $t'(k)$ registered and give up register sharing (p. 681).
- **Poles near the unit circle.** $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle$ grows without bound as the poles approach $|z|=1$ — the bell model of §23.3.5 reaches $1.28\times10^6$, i.e. 22 guard bits — and here *every* register in the shared column sits at the widened format. TDF-II still uses fewer register bits than direct form I, but the multiplier-width advantage shrinks: the $a$ column is wide in every structure and now dominates.
- **High order.** A single order-$N$ structure with $N$ large is ill-conditioned under coefficient quantisation regardless of transposition, because the pole locations are a badly-behaved function of the $a_i$. Factor into [[Biquad Cascade]] sections instead; each section's poles then move independently.
- **No feedback at all.** With $m=0$ the $a$ column vanishes, the two-multiplier path vanishes with it, and this degenerates into [[Transposed Direct-Form FIR Filter]] — which is strictly better documented and unconditionally stable.
- **Sharing only pays when $n \approx m$.** The column has $\max(n,m)$ registers, so a filter with $n=8, m=1$ pays for eight extended-precision registers where direct form I would have paid for eight narrow ones plus one wide one.

**RTL (Spade).** An order-2 section — a biquad's worth of the column — with the coefficients left as ports:

```spade
/// Transposed direct form II, order 2. All signals int<16>; `*.` `+.` `-.` are
/// the wrapping (width-preserving) operators, i.e. arithmetic modulo 2^16.
entity tdf2(
    clk: clock,
    rst: bool,
    u:  int<16>,
    b0: int<16>, b1: int<16>, b2: int<16>,
    a1: int<16>, a2: int<16>,
) -> int<16> {
    decl y;
    // bottom state: no incoming register
    reg(clk) w2 reset(rst: 0) = (b2 *. u) -. (a2 *. y);
    // middle state: fed by the stage below it, one cycle late
    reg(clk) w1 reset(rst: 0) = (b1 *. u) -. (a1 *. y) +. w2;
    // output is combinational: b0 tap plus the top register
    let y: int<16> = (b0 *. u) +. w1;
    y
}
```

`u` is the input bus, `y` is the $\widetilde{y}(k)$ wire out of the top adder, and `w1`/`w2` are the two shaded registers of the shared column — `w2`'s next-value has no `w3` term because it is the bottom row. The `decl y;` is load-bearing: `w2` and `w1` are written before `y` exists, which is exactly the graph's feedback edge, and Spade's forward declaration is what lets a register read a value defined later in the body without it becoming a combinational loop. `*.` and `+.` keep the result at 16 bits rather than growing to 32 and 17, making the whole datapath one fixed internal format — the modulo-$2^{m'}$ argument above, with $m'-\ell_{\text{ext}}+1 = 16$ and no LSB truncation.

Synthesis will do one thing the drawing does not: the coefficients are *ports* here, so five real signed multipliers are inferred (DSP48s on Xilinx, ALMs otherwise). Freeze the coefficients to constants and both dashed boxes collapse into shift-and-add MCM networks with no multiplier at all, which is the entire reason the transposed form is worth drawing.

Simulated against a behavioural 16-bit-wrapping reference over 3009 vectors: an impulse response with asymmetric taps $b=(1,2,3)$, $a=0$, which must produce $1,2,3,0$ **in that order** and catches a reversed tap column; a running-sum recursion $b=(1,0,0)$, $a_1=-1$ checked against $1,2,3,4,5$; and a 3000-vector random sweep with the coefficient set reshuffled every 250 cycles.

**Related notes.**

- [[Direct Form II IIR Filter]] – extends: this is that structure with every edge reversed; same $H(z)$, same shared column, narrower $b$ multipliers.
- [[Direct Form I IIR Filter]] – compares: also multiplies the $b_i$ by $u(k)$, but with two unshared delay lines instead of one.
- [[Transposed Direct Form I IIR Filter]] – compares: the other transposed recursive form, which shortens the adder chain but does not share registers.
- [[Multiple Constant Multiplication]] – depends-on: each of the two dashed columns is exactly this problem, and the shift-and-add sharing is where the multipliers go.
- [[SOPC, Sum of Products by Constants]] – counter-example: the dual building block, which transposition replaces; a direct form is built from SOPCs, a transposed form from MCMs.
- [[Adders]] – depends-on: the $\max(n,m)$ structural adders of the shared column, all at the extended internal width.
- [[Transposed Direct-Form FIR Filter]] – compares: the $m=0$ degeneration, with no loop and therefore no guard bits.
- [[Biquad Cascade]] – extends: the factorisation that keeps pole conditioning under control when order 2 is not enough.
- [[Choosing a Filter Structure]] – compares: where this sits against every sibling in the area/timing/accuracy table.
- [[Error Accuracy]] – supports: the $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle$ amplification and the guard-bit formula that make "equal guaranteed accuracy" computable.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Ch. 23:

- §23.1.5, pp. 677-679 — difference equations, direct and transposed forms, "a direct form I contains an SOPC, the building block of the transposed direct form I is an MCM"; Fig. 23.9.
- §23.1.5, pp. 679-680 — direct form II by commuting the two cascaded filters, register sharing, and Fig. 23.11a/b: "the parallel implementation of its transposed version… similarly shares registers, and it involves two independent MCM."
- §23.1.6, p. 681 — why the $b_i$ multiplier width differs across structures, and the two-multiplier/two-adder critical path of Fig. 23.11b.
- §23.3.2, p. 691 — output MSB bound (23.24) and the modulo-$2^{m'}$ overflow argument; Fig. 23.17 formats, p. 690.
- §23.3.4-23.3.5, pp. 693-694 — $\mathcal{H}_\delta$ (23.33), the WCPG amplification (23.34), and the guard-bit formula (23.37).
