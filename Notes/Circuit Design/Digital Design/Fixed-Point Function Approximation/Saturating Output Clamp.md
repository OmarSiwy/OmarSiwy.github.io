---
title: Saturating Output Clamp
description: "Clamp the unrepresentable top value to the largest representable one — the only range fix that is actual added hardware, and it doubles the error at the two rightmost inputs."
kind: circuit
source: "ASA §16.2.1, pp. 481-483"
status: seed
spade: simulated
tags: [digital, fixed-point-function-approximation, saturation, rounding, fpga]
aliases:
  - Output Saturation
  - Saturating Clamp
  - Saturated Output
---

# Saturating Output Clamp

Of the four repairs for the fixed-point range wrap, this is the one that becomes real gates: it detects that the rounded result has left the output format and substitutes the largest representable value, keeping the format unchanged at the price of a full ulp of error at the offending inputs.

```tikz title="Saturating clamp: the two out-of-range points pinned to 15/16, and the OR gate that implements the clamp on one output bit"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\small]
  % ---------- (a) the discretization, with the top two values clamped ----------
  \begin{scope}[x=0.30cm,y=0.36cm]
    \draw[gray!25,step=1] (0,0) grid (16,16);
    \draw[red,thick,domain=0:16,samples=120,variable=\x]
        plot ({\x},{16*sin(90*\x/16)});
    \foreach \i/\r in {0/0,1/2,2/3,3/5,4/6,5/8,6/9,7/10,8/11,9/12,10/13,11/14,12/15,13/15}
        \fill[blue!60!black] (\i,\r) circle (2.2pt);
    \foreach \i in {14,15} {
        \draw[red,thick] (\i,16) circle (2.8pt);
        \draw[->,red,very thick] ({\i+0.42},15.9) -- ({\i+0.42},15.1);
        \fill[blue!60!black] (\i,15) circle (2.2pt);
    }
    \draw[->] (0,0) -- (17.4,0) node[below,font=\scriptsize] {$X$, 4 bits};
    \draw[->] (0,0) -- (0,17.6);
    \node[anchor=west,font=\scriptsize] at (0.4,17.4) {$\widetilde f(X)$, 4 bits};
    \node[left,font=\scriptsize] at (-0.3,16) {$\tfrac{16}{16}=1$};
    \node[left,font=\scriptsize] at (-0.3,8) {$\tfrac{8}{16}$};
    \node[left,font=\scriptsize] at (-0.3,0) {$0$};
    \node[anchor=west,font=\scriptsize,red,align=left] at (16.8,14.6)
      {$\mathrm{RN}(f)=\tfrac{16}{16}$,\\ outside $\mathrm{ufix}(-1,-4)$};
    \node[anchor=west,font=\scriptsize,blue!60!black,align=left] at (16.8,11.4)
      {clamped to\\ $\tfrac{15}{16}$};
    \node[anchor=north,font=\scriptsize] at (8,-2.6) {(a) the two clamped points};
  \end{scope}
  % ---------- (b) the gate-level clamp, one output bit ----------
  \begin{scope}[xshift=9.4cm,yshift=0.6cm]
    \draw (0,4.2) rectangle (0.9,4.7);
    \node[font=\scriptsize] at (0.45,4.45) {$G$};
    \draw (0.9,4.2) rectangle (3.5,4.7);
    \node[font=\scriptsize] at (2.2,4.45) {$W$};
    \node[anchor=south,font=\scriptsize] at (1.75,4.75) {raw result $r$, $W+G$ bits};
    \node[or port,scale=0.62] (rd) at (0.75,3.1) {};
    \draw (0.22,4.2) -- (0.22,3.25) -- (rd.in 1);
    \draw (0.68,4.2) -- (0.68,2.95) -- (rd.in 2);
    \draw (rd.out) -- (1.7,3.1);
    \node[anchor=south,font=\scriptsize] at (1.45,3.12) {$\omega$};
    \draw (1.7,3.1) -- (1.7,1.98);
    \node[or port,scale=0.62] (g) at (3.6,2.15) {};
    \draw (1.7,1.98) -- (g.in 2);
    \draw (2.9,4.2) -- (2.9,2.33) -- (g.in 1);
    \node[anchor=west,font=\scriptsize] at (2.95,3.5) {$r_i$};
    \draw (g.out) -- (4.7,2.15) node[anchor=west,font=\scriptsize] {$\widetilde f_i$};
    \node[anchor=north,font=\scriptsize,align=center] at (2.2,1.2)
      {(b) $\widetilde f_i=r_i\vee\omega$, one 2-input OR per\\
       output bit, $\omega$ the OR of the $G$ guard bits};
  \end{scope}
\end{circuitikz}
\end{document}
```

*Panel (a) after Fig. 16.6b, p. 483 (data from Fig. 16.5, p. 482). Panel (b) is my own construction.*

**Fix the failure the clamp is repairing.** Let the output format be $\mathrm{ufix}(m_{\text{out}},\ell_{\text{out}})$, of width $w_R=m_{\text{out}}-\ell_{\text{out}}+1$ bits and ulp $u=2^{\ell_{\text{out}}}$; its representable set is $[0,\,2^{m_{\text{out}}+1}-u]\cap u\mathbb{Z}$, as in [[Number Formats]]. For $f=\sin(\tfrac{\pi}{2}x)$ on $[0,1)$ with both formats $\mathrm{ufix}(-1,-4)$, the two inputs $X=\tfrac{14}{16}$ and $X=\tfrac{15}{16}$ satisfy $\mathrm{RN}(f(X))=\tfrac{16}{16}=1$, which is one ulp above the top of the format. Left alone, the modulo property of fixed-point arithmetic truncates $10000_2$ to $0000_2$ and the largest value of the range is silently replaced by the smallest. The clamp is the answer that changes nothing about the format and nothing about the tabulated function — only what happens at the very top.

**Define the clamp on values before defining it on bits.** Write $M=2^{m_{\text{out}}+1}-u$ for the largest representable value and $r$ for the raw result the datapath produces, computed in a wider intermediate format $\mathrm{ufix}(m_{\text{out}}+G,\ell_{\text{out}})$ carrying $G\ge 1$ guard bits above the output. The clamp is the monotone map

$$\mathrm{sat}(r)=\min(r,\,M),$$

so $\widetilde f(X)=\mathrm{sat}\big(\mathrm{RN}(f(X))\big)$. Because $\min$ is monotone non-decreasing and $\mathrm{RN}$ preserves the monotonicity of $f$, the clamped operator is still monotone — which is not true of a merely faithful approximator (Fig. 16.8, p. 485).

**Turn the comparison into a guard-bit test.** Scale everything by $u$ so that the $W=w_R$ output bits carry the integer $R=r/u\in[0,2^{W+G})$ and $M/u=2^{W}-1$. Then

$$R>2^{W}-1 \iff \left\lfloor R/2^{W}\right\rfloor\neq 0 \iff \bigvee_{j=W}^{W+G-1} r_j = 1,$$

the first equivalence by Euclidean division of $R$ by $2^{W}$ and the second because a natural number is nonzero exactly when some bit of it is set. Call that disjunction $\omega$ (1 bit). No [[Magnitude Comparator]] is instantiated: comparing against $2^{W}-1$, the all-ones constant, degenerates to an OR-reduce over the $G$ guard bits, of depth $\lceil\log_2 G\rceil$. A comparator is only needed when the clamp bound is *not* an all-ones constant — the signed case below.

**Collapse the select into OR gates.** The saturated value is the $W$-bit all-ones word, so the $W$-bit 2:1 multiplexer $\widetilde f_i = \omega\,?\,1:r_i$ simplifies by the absorption laws $x\vee 1=1$ and $x\vee 0=x$ to a single OR per bit,

$$\widetilde f_i = r_i \vee \omega,\qquad 0\le i<W .$$

That is panel (b): $W$ two-input ORs plus one $G$-input OR tree, total depth $\lceil\log_2 G\rceil+1$. On an ASIC this is $W$ `OR2` cells and a small tree. On an FPGA it is usually **free**: each $\widetilde f_i$ is one more input to the LUT that already computes $r_i$, so as long as that LUT has a spare input among its $\alpha$ (see [[FPGAs]]), the clamp disappears into the existing logic rather than adding a level.

> [!important] Whether saturation costs anything at all depends on the architecture, not on saturation
> The book hedges — saturating "may or may not incur some hardware overhead" (p. 482) — and the hedge is exact. If the operator is a [[Function Table ROM]], the clamp is not a runtime decision: the generator simply writes $M$ into the two offending table entries at generation time, and the circuit is bit-for-bit a plain table. Zero gates. The OR bank exists only when the output is *computed* — a polynomial evaluator, a digit recurrence, a table-and-addition scheme — because there the top value is not a stored constant that the generator can edit.

**Pay for the fix in accuracy, and know exactly where.** Away from the clamped points $\widetilde f=\mathrm{RN}(f)$ and the error stays at the correctly-rounded bound $u/2=\tfrac{1}{32}$ ([[Rounding]]). At the two clamped inputs the output is $M=\tfrac{15}{16}$ while the true values are $f(\tfrac{14}{16})=0.98079$ and $f(\tfrac{15}{16})=0.99518$, giving absolute errors $0.04329=0.693\,u$ and $0.05769=0.923\,u$ — the book's "close to $1/16$: one full ulp" (p. 483). So the clamp costs a factor of nearly two in worst-case error, but it costs it at **two inputs out of $2^{n}$**, not everywhere; that is the whole difference between this and [[Round-Down Table Fill]], which pays the same factor at every input.

**Get the faithfulness condition in closed form.** Clamping is safe precisely when the excursion it hides is a rounding artefact and not a real overflow. Since $\mathrm{sat}$ only moves values downward to $M$,

$$\big|\mathrm{sat}(\mathrm{RN}(f(X)))-f(X)\big| < u \iff f(X) < M+u = 2^{m_{\text{out}}+1}\quad\text{for every }X\in\mathbb{F}_{\text{in}},$$

i.e. the *continuous* range must fit in the format extended by one ulp, even though the *discrete* rounded image did not fit in the format. Under that condition the clamped operator is still faithful; it is never correctly rounded. If $f$ genuinely exceeds $2^{m_{\text{out}}+1}$ the clamp is not an approximation at all, and [[Output Format Widening]] is the only honest answer.

**Expect the signed case to be twice the circuit.** For $\mathrm{sfix}$ output the clamp is two-sided, to $011\ldots1$ above and $100\ldots0$ below, and neither constant is all-ones, so the absorption argument fails and the multiplexer survives: two guard tests (the guard bits together with the sign bit) and a $W$-bit 3-way select, roughly $2W$ complex cells on an ASIC or $W$ LUTs on an FPGA. Two-sided saturation is the general operator described in [[Error Analysis]]; the one-sided unsigned form above is the cheap special case that the function-approximation range problem happens to need.

$$\boxed{\ \widetilde f_i = r_i \vee \omega,\qquad \omega=\bigvee_{j=W}^{W+G-1} r_j\ }$$

## When it breaks

- **Real overflow, not rounding overflow.** If $\sup_X f(X)\ge 2^{m_{\text{out}}+1}$ the clamp converts a loud, detectable wrap into a silent, plausible-looking saturation. It is a repair for a one-ulp excursion only.
- **Downstream error budgets.** Anything that assumed $\le u/2$ from this operator is now wrong by up to $u$; the assumption has to be re-propagated through [[Error Analysis]] rather than patched locally.
- **It cannot be found by testing.** The bad set is $\{X: f(X)\ge 1-u/2\}$, whose size is about $\tfrac{2}{\pi}2^{\ell/2}$ of the domain — $2/16$ at $\ell=-4$ but only $162/65536$ at $\ell=-16$. The clamp has to be designed in from the range analysis; random vectors will not reach the top of the domain.
- **When the top value is exact.** [[Tabulated Reciprocal]] has $f(0)=1$ exactly, not as a rounding artefact, so clamping it is a genuine error of one ulp on a value the specification demands be exact; widening is required there.
- **Signed and two-sided.** The OR collapse evaporates, and so does the "may cost nothing" claim.
- **Tabulated operators.** For a pure ROM the clamp is table content, so any area comparison that charges saturation $W$ gates is comparing the wrong architectures.

## RTL (Spade)

```spade
/// Clamp a (W+G)-bit unsigned raw result down to the W-bit output format,
/// replacing every out-of-range value by the largest representable one.
fn sat_clamp<#uint W, #uint G>(raw: uint<{W + G}>) -> uint<W> {
    let low: uint<W> = trunc(raw);
    let ovf = zext::<W, {W + G}>(low) != raw;
    let zero: uint<W> = 0;
    let mask = if ovf { ~zero } else { zero };
    low | mask
}
```

`raw` is the $W+G$-bit word $r$ of panel (b) and `low` its bottom $W$ bits; `ovf` is $\omega$, written as "truncation to $W$ bits is lossless" rather than as an explicit slice of the guard field, which is the same predicate and avoids a const-generic range expression. `mask` is the all-ones constant gated by $\omega$, and the final `|` is the per-bit OR collapse — so the boxed identity is literally the last line. The block is purely combinational (a `fn`, no `reg`, no clock); the `entity sat12to8(raw: uint<12>) -> uint<8> { sat_clamp::<8, 4>(raw) }` wrapper exists only to monomorphise the generic body and give the testbench a module. Synthesis will not build the equality comparator the source suggests: the low $W$ bits of `zext(low) != raw` compare a value with itself and vanish, leaving exactly the $G$-input OR tree in the drawing.

## Related Notes

- [[Output Format Widening]] – compares: the sibling that keeps the half-ulp guarantee by adding an output MSB instead of gates, at the cost of half the output range and an 8-bit-in/9-bit-out operator.
- [[Round-Down Table Fill]] – compares: buys the same range fix for zero gates, but pays the full ulp at every input rather than at two.
- [[Output Range Scaling]] – compares: the generic hardware-free fix, still perfectly rounded but against a modified $f$, so $\approx 1.5$ ulp against the original.
- [[Function Table ROM]] – depends-on: when the approximator is a table the clamp folds into the stored words and costs nothing at all.
- [[Magnitude Comparator]] – supports: the general out-of-range test, which degenerates to an OR-reduce here because the clamp bound is the all-ones constant.
- [[Rounding]] – depends-on: the $u/2$ bound the clamp gives up, and the round-to-nearest that created the out-of-range value in the first place.
- [[Error Analysis]] – supports: where the extra half ulp at the two clamped points enters the downstream budget.
- [[Tabulated Reciprocal]] – counter-example: its top value is exact rather than a rounding artefact, so clamping there is a real error and widening is mandatory.
- [[Choosing a Function Approximation Method]] – compares: places this fix against the other three on area, latency and worst-case error.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §16.2.1 "Range Issues and Their Solutions", pp. 481-483 — the four fixes, the saturation option and its "close to $1/16$: one full ulp" error statement.
- Fig. 16.5, p. 482 — discretization of $\sin(\tfrac{\pi}{2}x)$ on $[0,1)$ in $\mathrm{ufix}(-1,-4)$, source of the data points in panel (a).
- Fig. 16.6b, p. 483 — the saturated variant redrawn as panel (a).
- Fig. 16.8, p. 485 and §16.2.2 "Monotonicity Issue" — round-to-nearest preserves monotonicity, faithful rounding does not.
