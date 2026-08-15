---
title: Output Format Widening
description: "Fix the range wrap by adding one output MSB — exact and free in logic, but roughly half the output range goes unused and the operator becomes 8-bit in, 9-bit out."
kind: circuit
source: "ASA §16.2, pp. 482-484; §16.4, pp. 490-492"
status: seed
spade: simulated
tags: [digital, fixed-point-function-approximation]
aliases:
  - Using a Wider Format
  - Wider Output Format
  - Extra Output MSB
---

# Output Format Widening

Give the output format one more integer bit so the largest rounded value of the discrete image becomes representable — the only one of the four standard range fixes that changes no returned value and adds no error.

```tikz title="Sine table in the widened output format ufix(0,-4): 16/16 is now representable, and 15 of the 32 output codes are unreachable"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=6.4cm,y=2.1cm,>=latex,font=\small]
  \fill[red!8] (0,1.0625) rectangle (1,2);
  \draw[gray!25,step=0.0625] (0,0) grid (1,2);
  \draw[dashed,gray!80] (0,1) -- (1.02,1);
  \draw[red,very thick,domain=0:1,samples=120,variable=\x] plot ({\x},{sin(90*\x)});
  \foreach \i/\r in {0/0,1/2,2/3,3/5,4/6,5/8,6/9,7/10,8/11,9/12,10/13,11/14,12/15,13/15}
      \fill[blue!60!black] ({\i/16},{\r/16}) circle (1.5pt);
  \foreach \i in {14,15} \fill[red] ({\i/16},1) circle (2.4pt);
  \draw[->] (0,0) -- (1.05,0) node[below,font=\scriptsize] {$X$};
  \draw[->] (0,0) -- (0,2.10);
  \node[font=\scriptsize,anchor=south east] at (0,2.10) {$\widetilde f(X)$};
  \node[left,font=\scriptsize] at (0,0) {$0$};
  \node[left,font=\scriptsize] at (0,0.5) {$\tfrac{8}{16}$};
  \node[left,font=\scriptsize] at (0,1) {$\tfrac{16}{16}=1$};
  \node[left,font=\scriptsize] at (0,1.5) {$\tfrac{24}{16}$};
  \node[left,font=\scriptsize] at (0,1.9375) {$\tfrac{31}{16}$};
  \node[below,font=\scriptsize] at (0.9375,0) {$\tfrac{15}{16}$};
  \node[font=\scriptsize,anchor=west,align=left] at (0.04,1.62)
    {the new MSB $2^{0}$ opens codes $\tfrac{16}{16}\dots\tfrac{31}{16}$;\\ only $\tfrac{16}{16}$ is ever reached, so 15 of the 32\\ output codes are unreachable};
  \node[font=\scriptsize,anchor=north west] at (0.02,0.985) {old 4-bit ceiling};
  \node[red,font=\scriptsize,anchor=north west,align=left] at (1.02,0.80)
    {$X=\tfrac{14}{16},\tfrac{15}{16}$ both\\ round to $1$: held\\ exactly in 5 bits,\\ wraps to $0$ in 4};
  \draw[->,red] (1.03,0.87) .. controls (0.99,0.96) and (0.97,0.99) .. (0.952,0.995);
\end{circuitikz}
\end{document}
```

*After Fig. 16.6a, p. 483, with the discretization data of Fig. 16.5, p. 482.*

**Write down the condition the output format has to satisfy.** With $u = 2^{\ell_{\text{out}}}$ the output ulp, the format $\mathrm{ufix}(m_{\text{out}},\ell_{\text{out}})$ — $m_{\text{out}}+1-\ell_{\text{out}}$ bits wide, see [[Fixed-Point Representations]] — represents exactly

$$\Big[\,0,\; 2^{\,m_{\text{out}}+1}-u\,\Big]\cap u\mathbb{Z},$$

so a table of $\widetilde f = \mathrm{RN}\circ f$ is well formed iff

$$\max_{X\in\mathbb{F}_{\text{in}}}\;\mathrm{RN}\big(f(X)\big)\;\le\;2^{\,m_{\text{out}}+1}-u .$$

The extrema are over the **discrete image** $\mathrm{RN}(f(\mathbb{F}_{\text{in}}))$, not over the continuous range of $f$, and that is the whole trap: $\mathrm{RN}$ is non-decreasing but not bounded by $f$, so it can push a value that was strictly inside the range onto the first point outside it.

**See it fail on the canonical example.** Take $f = \sin(\tfrac{\pi}{2}x)$ on $[0,1)$ with $\ell_X = \ell_{\text{out}} = -4$ and both formats $\mathrm{ufix}(-1,-4)$, i.e. a 4-bit-in / 4-bit-out operator. The continuous supremum is $1$ and is never attained, so "the range fits in $[0,1)$" reads true. After rounding it is false: $16\sin(\tfrac{\pi}{2}\cdot\tfrac{14}{16}) = 15.693$ and $16\sin(\tfrac{\pi}{2}\cdot\tfrac{15}{16}) = 15.923$ both round to $\tfrac{16}{16} = 1$, which the format does not hold. By the modulo property of fixed-point arithmetic the 5-bit integer $10000_2$ truncated to 4 bits is $0000_2$: the top of the domain is silently replaced by the bottom. The wrap set has size $\approx\tfrac{2}{\pi}2^{-\ell/2}$ out of $2^{-\ell}$ inputs and so *shrinks* with precision — $2/16$ at $\ell=-4$, $162/65536$ at $\ell=-16$ — which is why this must be fixed by construction rather than found by testing; the full count is derived in [[Fixed-Point Function Approximation]].

**Widen by one and the condition closes.** Move the output to $\mathrm{ufix}(m_{\text{out}}+1,\ell_{\text{out}})$: one more bit, same ulp, range doubled to $[\,0,\,2^{m_{\text{out}}+2}-u\,]$. In the example $\mathrm{ufix}(-1,-4)\to\mathrm{ufix}(0,-4)$, 4 bits become 5, and $\tfrac{16}{16}$ lands inside. Nothing else changes: $\widetilde f$ is still $\mathrm{RN}\circ f$ at every point, still correctly rounded, still within $\tfrac12$ ulp. That is the property the other three fixes give up — saturation costs nearly a full ulp at the two top points, round-down doubles the budget everywhere, scaling perfectly rounds a *different* function for a total near $1.5$ ulp ([[Error Accuracy]]).

> [!important] One extra bit is always enough for this failure mode
> Suppose $m_{\text{out}}$ was chosen so the *continuous* range fits, $\sup f \le 2^{m_{\text{out}}+1}$. Because $\mathrm{RN}$ is non-decreasing, $\mathrm{RN}(f(X)) \le \mathrm{RN}(\sup f) \le 2^{m_{\text{out}}+1}$ — the power of two is itself representable in the widened format, so no rounding can exceed it. And $2^{m_{\text{out}}+1} \le 2^{m_{\text{out}}+2}-u$ for any format with more than one bit. So the discrete image can overshoot the naive format by **at most one binade boundary**, never more; there is no case where you must widen by two.

**Pay for it in width, not in error.** The doubled range is used to hold exactly one new value. Of the $2^{m+2-\ell}$ output codes, everything above $2^{m+1}$ is dead except the single code $2^{m+1}$ itself — in the plot, 15 of 32. The book's 8-bit instance makes the shape of the cost concrete (p. 490): `flopoco FixFunctionByTable f="sin(pi/2*x)" signedIn=false lsbIn=-8 lsbOut=-8` emits VHDL with an MSB that is only ever useful for the value $1$, and the operator is now **8-bit in, 9-bit out**. Width is contagious: every downstream adder, multiplier and register inherits the ninth bit, and if the result addresses a second table the address space — and therefore that table — doubles.

**Price the extra bit in the target technology.** On an FPGA a $2^{k}\times n$ ROM costs $2^{\max(k-\alpha,0)}\times n$ LUTs for $\alpha$-input LUTs ([[LUT-Array Function Table]], p. 492), so one more output bit costs $2^{\max(k-\alpha,0)}$ LUTs — one LUT while $k\le\alpha$, four more at $k=8,\alpha=6$. That is the pessimistic figure, because the new bit is a very cheap Boolean function: for the sine table it is $1$ only at addresses $14$ and $15$, i.e. $x_3\wedge x_2\wedge x_1$, a single gate. Synthesis exploits exactly this — the book's $2^8\times 8$ sine table maps to 25 LUTs rather than the predicted 32 (p. 492), and on ASIC the standard-cell area model $A \propto 2^{0.65\min(k,n)}\times 2^{0.19|k-n|}$ (Eq. 16.1, p. 491) moves by one in $|k-n|$, a factor $2^{0.19}\approx 1.14$, not by a factor $2$. Widening a **hard ROM macro** or a block RAM is the case where the cost is real, since there the bit is stored, not synthesized.

**Sometimes the extra bit is free downstream.** The reciprocal $f(x) = \tfrac{2}{x+1}-1$ on $[0,1)$ hits $f(0) = 1$ *exactly*, so it needs the weight-$2^0$ bit for one single input (Fig. 16.7, p. 484). Wrapped in a leading-zero counter and a shifter to implement $1/x$ over a wide domain, the range-reduction and reconstruction logic consumes that bit anyway, so widening costs nothing at all — see [[Tabulated Reciprocal]].

$$\boxed{\ \mathrm{ufix}(m,\ell)\ \longrightarrow\ \mathrm{ufix}(m{+}1,\ell):\quad \text{range } [0,\,2^{m+2}-u],\quad \widetilde f\ \text{unchanged},\quad |\widetilde f - f| \le \tfrac{u}{2}\ }$$

**When it breaks.**

- The output feeds a fixed-width interface — a bus, a DSP-block port, a floating-point significand field. The bit has nowhere to go and you fall back on [[Saturating Output Clamp]] or [[Output Range Scaling]].
- The operator is one stage of a chain. Widening each stage once compounds, and the growth is in the *integer* bits, which is where multiplier area is quadratic.
- The output addresses another table. A 9-bit address doubles the second ROM to buy one reachable code — here scaling is strictly better.
- The naive format was chosen from data rather than from $\sup f$. Then the overshoot can exceed one binade and the "one bit is always enough" argument above does not apply; re-derive $\max \mathrm{RN}(f(X))$ before widening.
- Signed formats: the same argument holds at the negative end, where the wrap runs the other way. `sfix` needs the check at both extrema, not just the top.

**RTL (Spade).** The circuit is a [[Function Table ROM]] whose output type carries the extra bit; the `_narrow` variant is the bug, kept for contrast.

```spade
/// RN(sin(pi/2 X)) tabulated for X in ufix(-1,-4), in the *widened* output
/// format ufix(0,-4): 5 bits, so that 16/16 = 1 is representable.
fn sin_wide(x: uint<4>) -> uint<5> {
    let rom: [uint<5>; 16] = [0, 2, 3, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 15, 16, 16];
    rom[x]
}

/// The same table forced back into ufix(-1,-4). The two top entries wrap to 0.
fn sin_narrow(x: uint<4>) -> uint<4> {
    trunc(sin_wide(x))
}
```

`x` is the 4-bit address bus of the diagram's horizontal axis; the returned `uint<5>` is the vertical axis, with bit 4 the new $2^{0}$ MSB that is set only for `x = 14, 15`. Both are pure `fn`s — combinational, no clock, so the ROM is unregistered and synthesis is free to fold it into logic rather than an array. `trunc` is the whole bug in one call: it is the modulo reduction, it discards bit 4 silently, and the compiler accepts it because dropping a bit is a legal width conversion, not an error. Synthesis will not build the 16-word array the source describes — it will minimise sixteen 5-bit constants into gates, which is precisely why the fifth bit costs one AND rather than one more ROM column.

**Related Notes.**

- [[Saturating Output Clamp]] – compares: fix (b), keeps the width and pays nearly one full ulp at the two top points instead.
- [[Round-Down Table Fill]] – compares: fix (c), keeps the width by redefining the target as $\mathrm{RD}(f)$, doubling the error budget everywhere.
- [[Output Range Scaling]] – compares: fix (d), the generic fix — keeps the width, costs nothing in hardware, and is perfectly rounded with respect to a modified function.
- [[Function Table ROM]] – depends-on: the operator whose output format this widens.
- [[LUT-Array Function Table]] – supports: gives the per-output-bit LUT cost of the extra MSB on FPGA.
- [[Hard ROM Macro]] – counter-example: the one implementation where the extra bit is stored rather than synthesized, so the width really is paid.
- [[Tabulated Reciprocal]] – counter-example: $f(0)=1$ forces the extra MSB, but the surrounding reconstruction logic absorbs it for free.
- [[Choosing a Function Approximation Method]] – compares: where this sits against the other range fixes.
- [[Fixed-Point Representations]] – depends-on: the $\mathrm{ufix}(m,\ell)$ notation and its exact value set.
- [[Error Accuracy]] – supports: ulp, $\mathrm{RN}$/$\mathrm{RD}$ and the $\tfrac12$-ulp bound this fix preserves.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §16.2 "Discretization Issues", pp. 482-484 — Fig. 16.5 (the wrap), Fig. 16.6a (the widened format), Fig. 16.7 (the reciprocal).
- Same, §16.4, p. 490 — the 8-bit-in / 9-bit-out FloPoCo instance and "almost half of the output domain is unused".
- Same, §16.4.2 "Actual Cost of a ROM", pp. 491-492 — Eq. 16.1 (ASIC standard-cell area model), the $2^{\max(k-\alpha,0)}\times n$ LUT cost, and the 25-vs-32 LUT measurement.
