---
title: Recip Constant Divider
description: "Exact floor(X/D) as floor((AX+B)/2^p) — one constant multiplication and a shift; the only constant divider whose cost ignores the magnitude of D, at O(w^2) area and O(log w) delay."
kind: circuit
source: "ASA §13.1, pp. 428-429; §13.4.1, pp. 435-436"
status: seed
spade: simulated
tags: [digital, division-by-constants, reciprocal, constant-multiplication, fpga]
aliases:
  - Recip
  - Recip Divider
  - Reciprocal Multiplication Divider
  - Multiplying by the Reciprocal
  - Magic Number Division
---

# Recip Constant Divider

Euclidean division by a compile-time constant $D$ computed as $\lfloor (AX+B)/2^p\rfloor$ — one constant multiplication and a hardwired shift — which is the only member of the family whose cost depends on $w$ alone and not on the magnitude of $D$.

```tikz title="Recip datapath: one constant multiplier, a wired shift, and the r-bit remainder subtracter (w = 32, D = 3)"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,
  blk/.style={draw, thick, minimum width=22mm, minimum height=8mm},
  op/.style={draw, thick, circle, minimum size=6mm, inner sep=0pt}]
  % ---- input word ----
  \node at (-1.2,4.0) {$X$};
  \draw[->] (-1.2,3.75) -- (-1.2,2.55);
  \node[anchor=west,font=\tiny] at (-1.1,3.15) {$w=32$};
  \node[circ] at (-1.2,3.45) {};
  % ---- constant multiplier ----
  \node[blk] (mulA) at (-1.2,2.1) {$\times\,A$};
  \node[anchor=west,font=\tiny,align=left] at (0.15,2.15)
    {$p=w+r=33$\\[1pt]
     $A=\lceil 2^{p}/D\rceil=\mathtt{0xAAAAAAAB}$\\[1pt]
     $w_A=p-\lfloor\log_2 D\rfloor=32$};
  \draw[->] (-1.2,1.7) -- (-1.2,1.15);
  \node[anchor=west,font=\tiny] at (-1.1,1.45) {$w+w_A=64$};
  % ---- the product word, split by the shift ----
  \draw[thick] (-3.3,0.35) rectangle (-1.0,1.05);
  \draw[thick,dashed] (-1.0,0.35) rectangle (1.4,1.05);
  \node[font=\tiny] at (-2.15,0.7) {$AX_{\,63\ldots 33}$};
  \node[font=\tiny] at (0.2,0.7) {$AX_{\,32\ldots 0}$ dropped};
  \node[anchor=west,font=\tiny,align=left] at (1.55,0.7)
    {$\gg p$: no gates,\\[1pt] only which wires are read};
  % ---- quotient ----
  \draw[->] (-2.15,0.35) -- (-2.15,-1.15);
  \node[circ] at (-2.15,-0.15) {};
  \node[anchor=west,font=\tiny] at (-2.05,-0.65) {$w-\lfloor\log_2 D\rfloor=31$};
  \node at (-2.15,-1.4) {$Q=\lfloor X/D\rfloor$};
  % ---- remainder path ----
  \draw[->] (-2.15,-0.15) -- (1.3,-0.15) -- (1.3,-0.75);
  \node[blk] (mulD) at (1.3,-1.15) {$\times\,D$};
  \draw[->] (1.3,-1.55) -- (1.3,-2.15);
  \node[anchor=west,font=\tiny] at (1.4,-1.85) {$DQ$};
  \node[op] (sub) at (1.3,-2.45) {$-$};
  \draw[->] (-1.2,3.45) -- (5.9,3.45) -- (5.9,-2.45) -- (sub.east);
  \node[anchor=south,font=\tiny] at (3.6,-2.4) {$X$, $32$};
  \draw[->] (1.3,-2.75) -- (1.3,-3.3);
  \node at (1.3,-3.55) {$R=X-DQ$};
  \node[anchor=west,font=\tiny,align=left] at (2.2,-3.1)
    {only $r=\lceil\log_2 D\rceil=2$ bits live;\\[1pt] the upper $30$ are provably $0$,\\[1pt] so the subtracter is $r$ bits wide};
\end{circuitikz}
\end{document}
```

**Replace an infinite expansion by a finite over-approximation.** Multiplying by $1/D$ is the obvious idea and it fails for the obvious reason: unless $D$ is a power of two, $1/D$ has an infinite — though eventually periodic — binary expansion, so there is no finite constant to hand to [[Multiplication by Constants]]. Recip [DCC12], lifting a software trick [Rob05], does not approximate $1/D$ at all. It finds three *integers* $A$, $B$, $p$ such that the flooring is exact over the entire input domain:

$$\left\lfloor \frac{X}{D}\right\rfloor = \left\lfloor\frac{AX+B}{2^p}\right\rfloor \qquad\forall X\in\{0,\dots,2^w-1\} \tag{13.1}$$

The dividend $X$ is $w$ bits, $A$ is $w_A$ bits, the product $AX$ is $w+w_A$ bits, and $Q$ occupies $w-\lfloor\log_2 D\rfloor$ bits. The claim is an integer identity, not an approximation with an error bar, so the architecture is exact — 0 ulp — even though its only arithmetic component is an approximate reciprocal. Everything below is the argument for why.

**Turn the requirement into a bound on a single slack variable.** Take $B=0$ and $A=\lceil 2^p/D\rceil$, so that $A/2^p$ over-approximates $1/D$, and name the relative slack
$$\varepsilon \;=\; \frac{A}{2^p}-\frac{1}{D} \;=\; \frac{AD-2^p}{D\,2^p},\qquad 0\le AD-2^p\le D-1$$
the numerator bound being nothing more than the definition of the ceiling: $\lceil 2^p/D\rceil D$ overshoots $2^p$ by less than $D$. Now split the dividend by the Euclidean identity $X=DQ+R$ with $0\le R<D$, so $X/D=Q+R/D$, and substitute by distributivity:
$$\frac{AX}{2^p} \;=\; X\left(\frac1D+\varepsilon\right) \;=\; Q \;+\; \underbrace{\frac{R}{D} \;+\; \varepsilon X}_{\text{must stay in }[0,1)}$$
Since $Q$ is an integer, $\lfloor AX/2^p\rfloor=Q$ **iff** that bracket lies in $[0,1)$. The lower bound is free because $\varepsilon\ge0$ by construction — this is why $A$ rounds *up*, and it is the whole reason a ceiling appears in an architecture about flooring.

**Evaluate the upper bound at its worst point and the condition becomes one inequality on $p$.** Both terms of the bracket are monotonically increasing in their argument, so the maximum is at $R=D-1$ and $X=2^w-1$ simultaneously:
$$\frac{D-1}{D} + \varepsilon\,(2^w-1) < 1 \iff \varepsilon\,(2^w-1) < \frac{1}{D}$$
Substituting the worst-case $\varepsilon \le (D-1)/(D\,2^p)$ clears $D$ from both sides and leaves a sufficient condition with no fractions in it,
$$(D-1)(2^w-1) < 2^p \qquad\text{i.e.}\qquad p \;\ge\; w + r,\qquad r=\lceil\log_2 D\rceil$$
so $A$ needs $w_A = p-\lfloor\log_2 D\rfloor \approx w$ bits. That is the sizing decision the whole architecture rests on: a $w\times w$ constant multiplication, hence the book's estimate of $O(w^2)$ area and $O(\log w)$ delay (p. 429).

> [!important] The error budget is $1/D$ ulp, not 1 ulp
> [[Error Accuracy]] calls an approximation **faithful** when its error is under 1 ulp, so the result is one of the two neighbours of the exact value. That is not enough here. The pre-floor value already carries the fractional part $R/D$, which climbs to $(D-1)/D$ — within $1/D$ of the next integer — and the floor has no tolerance left. Whatever error the truncated product contributes may therefore only spend $\mathbf{1/D}$ ulp, or the floor tips to $Q+1$ and the answer is not off by an ulp, it is off by one whole quotient. Every truncation in this datapath must be re-checked against $1/D$, never against the 1 ulp reflex of [[Truncated Multipliers]].
>
> Concretely, $D=3$, $w=32$. The naive $p=32$, $A=\lceil2^{32}/3\rceil=\texttt{0x55555556}$, gives $\varepsilon = 2/(3\cdot2^{32})$ and fails: $\varepsilon(2^{32}-1)\approx 0.667 \not< 1/3$. It breaks at the first $X\ge 2^{31}$ with $X\equiv2\pmod 3$, namely $X=2^{31}$:
> $$\lfloor 2^{31}/3\rfloor = 715\,827\,882,\qquad \lfloor \texttt{0x55555556}\cdot 2^{31}/2^{32}\rfloor = 715\,827\,883$$
> One too many, on a perfectly ordinary input. The condition demands $2\cdot(2^{32}-1)<2^p$, so $p=33$ and $A=(2^{33}+1)/3=\texttt{0xAAAAAAAB}$ — exactly the magic constant GCC and Clang emit, and exactly why they emit a $32\times32\to64$ multiply-high followed by a shift by 33 rather than by 32. The margin is one unit.

**The shift is free, which is what makes the cost model believable.** $\gg p$ with $p$ a synthesis-time constant is not a [[Barrel Shifters|barrel shifter]] and not even a gate: it is the decision to route bits $w+w_A-1\ldots p$ of the product to the output and leave the rest unconnected. Synthesis then propagates that back into the multiplier and never builds the discarded columns at all, which is precisely the [[Truncated Multipliers]] construction — with the caveat of the callout above, that its error budget here is $1/D$ ulp rather than the usual $1$. The critical path is therefore one constant multiplication and nothing else, and its depth is the adder-tree depth of whichever [[Multiplication by Constants|constant-multiplication]] technique is chosen — [[Binary Shift-and-Add Constant Multiplier|shift-and-add]] on an adder graph, [[KCM, Table-Based Constant Multiplication]] on LUTs, or a hardened multiplier from the [[DSP Blocks]] column.

**The remainder costs one small subtracter, not a second divider.** The published Recip [DCC12] computes $Q$ alone; recovering $R$ needs $R=X-DQ$, a second constant multiplication and a subtraction, and it looks like it should double the area. It does not, for a structural reason: $R<D\le 2^r$, so every bit of that difference above position $r-1$ is provably zero and need not be computed. **The subtracter is $r$ bits wide regardless of $w$** — for $D=3$ that is two bits. Table 13.3 (p. 436) measures the overhead on Kintex-7 at $D=3$, $w=32$: 138 LUT / 6.0 ns for the quotient-and-remainder operator, and it is still 824 LUT / 13.3 ns at $w=128$. The remainder is the cheapest thing in the chapter that is not literally free.

> [!warning] Source inconsistency in Table 13.3, p. 436
> The caption states that the `Recip/R` column "denotes the architecture of [DCC12] that computes quotient only", yet `Recip/R` is 1–12 LUT *larger* than the `Recip` column in every one of its ten rows ($D=23$, $w=32$: 169 LUT / 7.3 ns against 158 LUT / 5.8 ns). A quotient-only circuit cannot cost more than the same circuit plus a remainder subtracter. Either the column labels are transposed or `/R` means "with remainder" and the caption is attached to the wrong column; the text's claim that the remainder is nearly free survives under both readings, but do not quote individual figures from that table without deciding which.

> [!warning] The book never constructs $B$ — needs outside research
> Equation (13.1) is stated for three integers $A$, $B$, $p$, and p. 429 notes that "there are two possible choices for $w_A$ in [DCC12], and the smallest one is chosen", but neither the value of $B$ nor the second choice of $w_A$ is given anywhere in the chapter. The derivation above therefore covers only the $B=0$, round-up branch. The other branch — round $A$ *down* and correct with a nonzero additive $B$, which can save a bit of $p$ — has to be taken from [DCC12] or [Rob05] directly.

**The magnitude of $D$ never enters the cost.** Read the sizing back: $p\ge w+r$ and $w_A\approx w$, and $r$ appears only inside a logarithm. Doubling $D$ adds one bit to $p$. That is the property no sibling has — [[LinArch Divider]] pays $2^{r+k}$ per table and collapses once $r\ge\alpha$, [[Binary Tree Constant Divider]] the same, [[Composite Constant Divider]] needs $D$ to factor at all — and it is why Recip is the fallback whenever $D$ is large, prime, or simply not known to be small. The price is a $w\times w$ multiplier where LinArch pays $O(w)$ LUTs: at $D=3$, $w=32$ on Kintex-7, 138 LUT for Recip against 32 LUT for LinArch, but 207 LUT for Recip at $D=45$ against LinArch's 371.

**A hand-sized instance of the whole argument.** Take $X=200$ on $w=8$ bits and $D=3$; the truth is $200=3\cdot 66+2$. The condition $(D-1)(2^w-1)=2\cdot 255=510<2^p$ forces $p\ge 9$, so $p=9$, $A=\lceil 512/3\rceil=171=\texttt{10101011}_2$ — the 8-bit ancestor of $\texttt{0xAAAAAAAB}$ — and $B=0$. Then $AX=171\times 200=34\,200$, and
$$Q=\lfloor 34\,200/2^9\rfloor = 34\,200 \gg 9 = 66 = \texttt{01000010}_2,\qquad R = 200-3\cdot 66 = 2 = \texttt{10}_2$$
The exactness argument in numbers: $\varepsilon=(3\cdot 171-512)/(3\cdot 512)=1/1536$, and the worst pre-floor fractional part over the whole input range is $\max_X(R/D+\varepsilon X)=\tfrac23+\tfrac{255}{1536}=0.833<1$, leaving $0.167$ ulp of margin against the $1/D=0.333$ budget. Now retry with $p=8$: $A=\lceil 256/3\rceil=86$, $\varepsilon=2/768$, and $\tfrac23+\tfrac{255}{384}=1.33>1$. The first casualty is $X=128$, since $128\equiv 2\pmod 3$: $\lfloor 86\cdot 128/256\rfloor=43$ where $\lfloor 128/3\rfloor=42$. **One extra bit of $p$ is the difference between a divider and a bug that fires on half the input range.**

$$\boxed{\ \left\lfloor\frac{X}{D}\right\rfloor=\left\lfloor\frac{AX}{2^{p}}\right\rfloor\ \text{ with }\ A=\left\lceil\frac{2^{p}}{D}\right\rceil,\quad p\ge w+r,\quad r=\lceil\log_2 D\rceil\ }$$

**When it breaks.**

- $p<w+r$. Not a degradation — a hard functional bug that hides until $X$ approaches $2^w$ and $R$ approaches $D-1$, i.e. on roughly the top $1/D$ of a range that random testing under-samples. Test at $X=2^w-1$ and at every $X$ just above $2^{w-1}$ congruent to $D-1$ mod $D$.
- Signed dividends. The derivation assumes $X\ge 0$ throughout, and $\lfloor\cdot\rfloor$ on a negative numerator rounds away from zero, which is not what C's `/` does. Compilers emit a separate sign-correction sequence; see [[Number Formats]] for the two's-complement half of that.
- $D$ small and $w$ modest. Recip's $O(w^2)$ loses outright to [[LinArch Divider]] on area whenever $r<\alpha$ — 138 LUT against 32 at $D=3$, $w=32$ — and only wins back on delay.
- $D$ composite. [[Composite Constant Divider]] turns a product of table sizes into a sum and beats Recip on area for every factorable constant measured in Table 13.5.
- Remainder only. Recip must compute the full quotient first, so it cannot exploit the drop; [[Remainder-Only BTCD]] can, and does so by an order of magnitude.
- The target has no wide multiplier. On a soft core without a multiply-high instruction the same equation costs a software routine of tens of cycles rather than four instructions (p. 429) — the *hardware* Recip has no such dependency, since it builds the multiplier it needs.

```spade
entity recip_div3(x: uint<32>) -> (uint<31>, uint<2>) {
    let xw: uint<64> = zext(x);
    let a:  uint<64> = 0xAAAAAAAB;      // ceil(2^33 / 3), w_A = 32 bits
    let ax: uint<64> = xw *. a;         // w + w_A = 64 bits kept
    let q:  uint<31> = trunc(ax >> 33); // >> p, p = w + r = 33
    let qw: uint<64> = zext(q);
    let d:  uint<64> = 3;
    let dq: uint<64> = qw *. d;
    let r:  uint<2>  = trunc(xw -. dq); // only r = 2 bits of X - DQ are live
    (q, r)
}
```

`a` is the $\times A$ block, `ax >> 33` is the split product word, and `q`/`r` are the two outputs of the drawing. The width arithmetic is the sizing argument transcribed: `*.` is the truncating multiply, so `xw *. a` keeps exactly the $w+w_A=64$ bits the bound guarantees are sufficient, and `trunc(ax >> 33)` selects the $w-\lfloor\log_2 D\rfloor=31$ surviving bits — the shift is bit selection, not a shifter. The remainder path narrows to `uint<2>` by the $R<D$ argument, so the 64-bit `-.` is 62 bits of provable zero that synthesis deletes. Everything is combinational; there is no clock and no register, and a real deployment would pipeline the multiplier rather than the shift. What synthesis does differently from both the drawing and this source is that no $64\times 64$ multiplier is ever built: `a` and `d` are constants, so the mapper replaces both `*.` with constant-multiplication structures, and the discarded low 33 columns of the first one are never generated at all.

## Related Notes

- [[Multiplication by Constants]] – depends-on: the entire circuit is one instance of that problem, and Recip's delay and area are whatever technique is chosen there.
- [[Truncated Multipliers]] – depends-on: the $\gg p$ prunes the low columns of $AX$, but under a $1/D$ ulp budget rather than the usual 1 ulp.
- [[Binary Shift-and-Add Constant Multiplier]] – supports: the adder-graph realisation of the $\times A$ block, and the reason the delay is $O(\log w)$ rather than $O(w)$.
- [[KCM, Table-Based Constant Multiplication]] – supports: the LUT-based realisation of the same block, which is what FloPoCo picks on FPGA and why it does not always choose the minimal $w_A$.
- [[Barrel Shifters]] – counter-example: what the $\gg p$ would cost if $p$ were a runtime value instead of a synthesis-time constant, namely $O(w\log w)$ instead of nothing.
- [[LinArch Divider]] – compares: the $O(w)$-area sibling that wins whenever $D$ is small enough for its table, and loses on delay and on every large $D$.
- [[Binary Tree Constant Divider]] – compares: also $O(\log w)$ delay, but by restructuring a table recurrence rather than by buying a multiplier.
- [[Composite Constant Divider]] – compares: exploits a factorisation of $D$, which is exactly the structure Recip refuses to look at.
- [[Choosing a Constant Divider]] – compares: where this sits against every sibling once $D$, $w$ and the target are fixed.
- [[Division by Reciprocal]] – extends: the same idea released from exactness — approximate $1/D$ for a runtime $D$ and accept a faithful result.
- [[Error Accuracy]] – depends-on: supplies ulp and faithfulness, the vocabulary the $1/D$ budget is stated in.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 13 "Division by Constants".
  - Table 13.1 "Notations used in this chapter", p. 428 — $X, D, Q, R, w, r, \alpha$.
  - §13.1 "Multiplying by the Reciprocal", pp. 428-429 — Eq. (13.1), the three integers $A$, $B$, $p$, the minimal-$w_A$ selection and FloPoCo's departure from it, the $\log(w)$ timing / $w^2$ area expectation, the $\texttt{0xAAAAAAAB}$ compiler constant and the $(2^{33}+1)/3$ derivation, and the MicroBlaze `-mxl-multiply-high` remark.
  - §13.4.1 "Reciprocal Method Outputting Only the Quotient", pp. 435-436 — $R=X-DQ$ on $r$ bits with all higher bits predictable as zero, and Table 13.3.
  - Table 13.5, p. 440 — the Recip rows used for the $D=45$ comparison.
- Primary sources cited there: [DCC12] Drane, Cheung & Constantinides, ISCAS 2012 (Recip); [Rob05] Robison, ARITH 2005 (the software trick); [BMR04] Brisebarre, Muller & Raina (the floating-point analogue).
