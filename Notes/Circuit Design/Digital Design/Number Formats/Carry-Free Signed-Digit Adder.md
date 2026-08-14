---
title: "Carry-Free Signed-Digit Adder"
description: "Addition in O(1) instead of O(w): rewrite every column sum into an anticipated-carry word and a residue word, then add the two digit-parallel with no propagation at all."
kind: circuit
source: "ASA §2.4, pp. 46-48"
status: seed
spade: simulated
tags: [digital, number-formats, adder, redundant, signed-digit, carry]
aliases:
  - Signed-Digit Number System
  - Signed-Digit Adder
  - Carry-Free Adder
  - Carry-Free Addition
  - Avizienis Adder
---

# Carry-Free Signed-Digit Adder

An adder whose critical path is independent of the word width, bought by letting the digit set be redundant so that a column can absorb an incoming carry instead of forwarding one.

```tikz title="Two-step carry-free signed-digit adder: every column splits its own digit sum, then the transfer digit moves exactly one position left and stops"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex,
  blk/.style={draw,minimum width=2.0cm,minimum height=0.8cm,align=center},
  ad/.style={draw,circle,minimum size=0.62cm,inner sep=0pt},
  w/.style={font=\scriptsize,text=black!65}]

\foreach \c/\lab in {0/{i+1}, 4.6/{i}, 9.2/{i-1}} {
  \begin{scope}[xshift=\c cm]
    \node[blk] at (0,4) {\textsc{split}\\[-1pt]$p=\beta t+w$};
    \draw[->] (-0.5,5.25) -- (-0.5,4.4);
    \draw[->] ( 0.5,5.25) -- ( 0.5,4.4);
    \node[anchor=south] at (-0.5,5.3) {$x_{\lab}$};
    \node[anchor=south] at ( 0.5,5.3) {$y_{\lab}$};
    \node[ad] at (-0.4,2) {$+$};
    \draw[->] (-0.4,3.6) -- (-0.4,2.31);
    \node[w,anchor=west] at (-0.32,2.72) {$w_{\lab}$};
    \draw[->] (-0.4,1.69) -- (-0.4,0.95);
    \node[anchor=north] at (-0.4,0.9) {$z_{\lab}$};
  \end{scope}
}

% transfer digits: exactly one position to the left, and no further
\foreach \c/\lab in {4.6/{i+1}, 9.2/{i}} {
  \draw[->] (\c-1.0,4) -- (\c-1.65,4) -- (\c-1.65,2) -- (\c-4.5,2);
  \node[w,anchor=south] at (\c-3.05,2.06) {$t_{\lab}$};
}

% dangling ends
\draw[->] (-1.0,4) -- (-2.5,4);
\node[w,anchor=south] at (-1.75,4.08) {$t_{i+2}$};
\draw[->] (11.9,2) -- (10.51,2);
\node[w,anchor=south] at (11.2,2.06) {$t_{i-1}$};

\draw[dashed,black!45] (-3.0,3.2) -- (12.1,3.2);
\node[w,anchor=east] at (-3.1,4.0) {step 1};
\node[w,anchor=east] at (-3.1,2.0) {step 2};

\node[anchor=north west,font=\scriptsize,align=left] at (12.4,5.35)
  {digit set $\{\bar a,\dots,a\}$, radix $\beta$\\[3pt]
   $x,y,z:\ \lceil\log_2(2a{+}1)\rceil$ bits\\[2pt]
   $t\in\{\bar 1,0,1\}:\ 2$ bits\\[2pt]
   $w:\ |w|\le a-1$\\[2pt]
   $z=w+t:\ |z|\le a$};

\end{circuitikz}
\end{document}
```

*Own construction; the algorithm is Avižienis (1961), presented in ASA §2.4 through Cauchy's decimal example.*

**Redundancy is the resource being spent, and it is bought by widening the digit set, not the word.** A positional system in radix $\beta$ defines $X=\sum_{i=\ell}^{m}\beta^{i}x_{i}$, and nothing in that identity obliges $x_i\in\{0,\dots,\beta-1\}$: any set of at least $\beta$ consecutive integers containing zero works ([[Redundant Number Systems]]). Take the symmetric signed-digit set $\mathcal{D}=\{\bar a,\dots,\bar 1,0,1,\dots,a\}$ with $\bar d\equiv-d$ and $a\le\beta-1$. It holds $2a+1>\beta$ values, so representations are no longer unique — $15$ is both $15$ and $2\bar5$ in Cauchy's decimal set — and negative numbers need no sign bit at all, since $-X$ is $X$ with every digit negated. A digit costs $\lceil\log_2(2a+1)\rceil$ bits instead of $\lceil\log_2\beta\rceil$; the extra bits are the redundancy, and the adder below is what they buy.

**Turn "carry" into a value that is chosen, not discovered.** In a non-redundant system the carry out of column $i$ is a function of every column below it, which is exactly why [[RCA, Ripple-Carry Adder]] has $O(w)$ depth. Redundancy breaks that dependence because a column sum has more than one legal spelling: given the position sum $p_i=x_i+y_i$, we are free to *pick* which part of it we hand upward. Write, for each $i$ independently,

$$p_i \;=\; x_i+y_i \;=\; \beta\,t_{i+1} + w_i,\qquad t_{i+1}\in\{\bar1,0,1\}$$

with $t_{i+1}$ the **transfer digit** and $w_i$ the **interim sum**. This is just the division identity for $p_i$ by $\beta$, except that we do not take the canonical remainder — we choose the pair $(t_{i+1},w_i)$ that leaves $|w_i|$ small. Since $p_i$ depends only on column $i$, all $w$ digits and all $t$ digits are produced in parallel with no wire between columns. That is step 1 in the diagram, and it is the book's "anticipated generation of all possible carries".

**Make the second step incapable of generating a carry.** Step 2 assimilates each transfer into the column above the one that made it:

$$z_i \;=\; w_i + t_i$$

This is again fully digit-parallel: $z_i$ reads one $w$ and one $t$, and produces no output that any other column consumes. It terminates — rather than rippling — precisely when every $z_i$ lands back inside $\mathcal{D}$, i.e. $|w_i+t_i|\le a$. By the triangle inequality $|w_i+t_i|\le|w_i|+1$, so the sufficient condition is

$$|w_i|\le a-1 \quad\text{for every possible } p_i .$$

**The redundancy has to be large enough or step 1 cannot honour that bound.** With $|x_i|,|y_i|\le a$ we have $p_i\in[-2a,2a]$, and the three choices of $t_{i+1}$ cover the three intervals

$$t_{i+1}=\bar1:\ [-\beta-a+1,\,-\beta+a-1],\qquad t_{i+1}=0:\ [-a+1,\,a-1],\qquad t_{i+1}=1:\ [\beta-a+1,\,\beta+a-1].$$

Two requirements follow. The intervals must not leave a hole, so the top of the $t=0$ interval must reach the bottom of the $t=1$ interval: $\beta-a+1\le a$, i.e. $\beta\le 2a-1$. And their union must reach the extremes $\pm2a$ of $p_i$: $\beta+a-1\ge 2a$, i.e. $a\le\beta-1$ — which is the same bound that keeps $\mathcal{D}$ from being wider than one radix step. Combining, and requiring $a$ integral:

$$\left\lceil\frac{\beta+1}{2}\right\rceil \;\le\; a \;\le\; \beta-1 .$$

The interval is non-empty only for $\beta\ge3$. **Radix 2 therefore has no carry-free adder** at any digit set: $\lceil 3/2\rceil = 2 > 1 = \beta-1$. The borrow-save/BSD adders usually called "radix-2 signed digit" are *limited-carry* schemes — they need a second look at position $i-1$, so their depth is a constant $>1$ but not $1$. Radix 4 with $\mathcal{D}=\{\bar3,\dots,3\}$ is the smallest instance that is genuinely carry-free ($2\le3\le3$), which is why it is the RTL below and why it is the digit set that shows up in [[SRT Division]] and in high-radix [[Dividers]].

> [!warning] The source's own worked example does not balance
> ASA p. 47 gives $4321+1235 = 11111 + \bar5\,\bar5\,\bar5\,\bar4$, then $11111 + \bar5\,\bar5\,\bar5\,\bar4 = \bar4\,\bar4\,\bar4\,\bar3$. Both lines are wrong. The transfer out of column $i$ lands at weight $i+1$, so with four columns the carry word is $11110$, not $11111$; and the printed result $\bar4\bar4\bar4\bar3$ evaluates to $-4443$, whereas $4321+1235=5556$. Even reading it charitably as $1\bar4\bar4\bar4\bar3$ gives $10000-4443=5557$. The correct chain is
> $$4321+1235 \;=\; \underbrace{11110}_{\text{transfers}} + \underbrace{\bar5\,\bar5\,\bar5\,\bar4}_{\text{interim sums}} \;=\; 1\,\bar4\,\bar4\,\bar4\,\bar4 \;=\; 10000-4444 \;=\; 5556\ \checkmark$$

**Cauchy's digit set is in fact not carry-free, and the example only works by luck.** For $\beta=10$, $a=5$ the condition needs $a\ge6$; with $a=5$ the interval $[\bar4,4]$ for $w$ cannot express $p_i=\pm5$ at all. The book's example survives because every transfer there happens to be $+1$ and every interim sum $-5$, giving $z=-4$ in range. Make the transfers disagree and it breaks: take $X=3\bar3=27$ and $Y=2\bar2=18$. Column sums are $p_0=-5$ and $p_1=+5$, forcing $(t_1,w_0)=(\bar1,5)$ and $(t_2,w_1)=(1,\bar5)$, so $z_1=w_1+t_1=-5-1=-6\notin\mathcal{D}$. The value $1\,\bar6\,5 = 100-60+5 = 45$ is right, but the digit is illegal and a real adder would have to propagate. The book's own later suggestion of enlarging the set to $\{\bar7,\dots,7\}$ does satisfy $6\le7\le9$ — it is the digit set that makes the claim true.

**Every wire is a digit, so state the widths.** For radix $\beta$ and half-set $a$: $x_i,y_i,z_i$ are $\lceil\log_2(2a+1)\rceil$ bits each in two's complement; $p_i$ is one bit wider; $t_i$ is $2$ bits (three values, signed); $w_i$ is $\lceil\log_2(2a-1)\rceil$ bits. At $\beta=4,a=3$ that is $3$ bits per digit, so a $W$-digit word covers the range of a $2W$-bit binary number in $3W$ bits — a **50 % storage overhead**, the standing price of the format. The result is $W+1$ digits: the top transfer $t_W$ escapes with nowhere to be absorbed.

**Depth is constant, but only the *addition* is.** Each SPLIT is a function of $2\lceil\log_2(2a+1)\rceil$ input bits — 6 bits at radix 4 — so on an FPGA it is one LUT6 per output bit, independent of $W$; step 2 is a $\lceil\log_2(2a-1)\rceil$-bit plus 2-bit add, again LUT-sized. Total logic is $\Theta(W)$ at depth $2$, against $\Theta(W)$ logic at depth $\Theta(W)$ for a ripple adder. What this does *not* buy is a free exit: converting back to a non-redundant format is $z^{+}-z^{-}$, a full carry-propagate subtraction of the positive and negative digit planes, or an MSB-first digit recurrence. Redundant formats are **carry-delaying, not carry-eliminating**, and pay off only when many additions sit between one conversion and the next.

> [!important] On an FPGA the baseline it must beat is not a ripple adder
> A carry-free adder throws away the hard carry chain, which is the one structure the fabric implements almost for free ([[FPGAs]]). Below a few hundred bits an FPGA carry-chain adder is already fast enough that constant depth wins nothing while costing $1.5\times$ the registers and several LUTs per digit. The signed-digit adder earns its place where the *loop* is the problem — an accumulation whose next input depends on this cycle's output, as in a digit recurrence — not where a single addition is.

$$\boxed{\ p_i=x_i+y_i=\beta\,t_{i+1}+w_i,\quad z_i=w_i+t_i,\qquad \left\lceil\tfrac{\beta+1}{2}\right\rceil\le a\le\beta-1\ }$$

**When it breaks.**

- **$\beta=2$.** No carry-free adder exists; radix-2 signed digit needs a limited-carry scheme that inspects position $i-1$.
- **$a=\lceil\beta/2\rceil$ for even $\beta$** (Cauchy's $\beta=10,a=5$; also $\beta=4,a=2$). Minimally redundant even radices miss the bound by one and are limited-carry, not carry-free — see the counterexample above.
- **One-shot additions.** The conversion back to binary costs a full-width carry-propagate adder, so a single redundant addition is strictly worse than a plain one. Amortise over $\ge2$ additions or do not use the format.
- **Small $W$ on an FPGA.** The hard carry chain makes ripple depth effectively flat up to a few hundred bits; constant depth is worth nothing there.
- **Sums of many terms rather than two.** If the goal is to add $n>2$ operands, the transfer digit is the wrong abstraction — [[CSA, Carry-Save Adder]] and [[Bit Heaps]] hold the same "carries not yet assimilated" state with one bit per weight instead of a whole extra digit plane, and defer the single propagation to the very end.
- **Comparison, sign test, equality.** All become non-local: $x=y$ is not $\text{digits}(x)=\text{digits}(y)$, and the sign of a signed-digit number is decided by its most significant *non-zero* digit, which is a priority encode over the whole word.

**RTL (Spade).** Radix 4, $\mathcal{D}=\{\bar3,\dots,3\}$, digits held as `int<3>`.

```spade
/// One radix-4 signed-digit position: split x+y into a transfer t and an
/// interim sum w with |w| <= 2, both from column i alone.
fn sd4_split(x: int<3>, y: int<3>) -> (int<2>, int<3>) {
    let p = x + y;                                  // int<4>, range -6..6
    if p >= 3       { (1,  trunc(p - 4)) }
    else if p <= -3 { (-1, trunc(p + 4)) }
    else            { (0,  trunc(p)) }
}

/// Step 2: z = w + t, |z| <= 2 + 1 = 3, so it cannot leave the digit set.
fn sd4_assim(w: int<3>, t: int<2>) -> int<3> {
    trunc(w + sext::<2, 3>(t))
}

/// 4-digit carry-free adder. Element 0 is the least significant digit.
fn sd4_add4(x: [int<3>; 4], y: [int<3>; 4]) -> [int<3>; 5] {
    let (t0, w0) = sd4_split(x[0], y[0]);
    let (t1, w1) = sd4_split(x[1], y[1]);
    let (t2, w2) = sd4_split(x[2], y[2]);
    let (t3, w3) = sd4_split(x[3], y[3]);
    [ w0,                       // no transfer enters the lowest column
      sd4_assim(w1, t0),
      sd4_assim(w2, t1),
      sd4_assim(w3, t2),
      sext(t3) ]                // the escaping transfer becomes digit 4
}
```

`sd4_split` is one SPLIT box in the diagram and `sd4_assim` one $+$ circle; `t0..t3` are the only wires that cross a column boundary, and each crosses exactly one. Widths follow the Spade growth rules: `x + y` on two `int<3>` is `int<4>`, `p ± 4` is `int<5>`, and both `trunc` back to `int<3>` because the algebra guarantees $|w|\le2$ — the `trunc` is safe *because* of the bound derived above, not despite it. Everything is combinational, so the whole word is two LUT levels; synthesis will flatten `sd4_split` and `sd4_assim` of the same column into one LUT layer per output bit, which the drawing's two-row layout deliberately does not show.

Simulated with `.zettel/sim.sh` against a behavioural reference $\sum_i 4^i z_i \overset{?}{=} \sum_i 4^i x_i+\sum_i 4^i y_i$: **5010/5010 checks pass** (10 named vectors including the asymmetric $1+128$ and its mirror, both saturated words $\pm255$, and exact cancellation; plus a 5000-vector random sweep). The testbench also asserts every output digit stays in $\{\bar3,\dots,3\}$, which is the property the derivation above actually claims. Mis-wiring one transfer digit by a single column fails 2798 of those checks, so the sweep is not vacuous.

**Related Notes.**

- [[Redundant Number Systems]] – depends-on: the format this adder is defined over; the digit-set freedom is derived there.
- [[RCA, Ripple-Carry Adder]] – compares: the $O(w)$ baseline whose dependence chain redundancy is bought to break.
- [[CSA, Carry-Save Adder]] – compares: the same "defer the carry" idea at one bit per weight instead of a whole digit, and the right choice for multi-operand sums.
- [[Bit Heaps]] – extends: generalises deferred carries to an arbitrary set of weighted bits, with one propagation at the end.
- [[SRT Division]] – supports: the consumer that actually needs constant-depth addition, because its recurrence is a loop.
- [[Booth's Algorithm]] – supports: uses the same representation freedom, recoding the multiplier into $\{\bar1,0,1\}$ digits to shorten the partial-product list.
- [[Choosing a Number Format]] – compares: where the storage and conversion overhead sits against the other formats.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §2.4 "Redundant Positional Number Systems", pp. 46–48 — digit-set condition, Cauchy's decimal system, the two-step example (corrected above), and the carry-delaying remark.
- §2.3 "High-Radix Binary Representation", pp. 44–46 — the radix-$2^\alpha$ regrouping that makes radix 4 free on binary hardware.
- Aviz̆ienis, "Signed-digit number representations for fast parallel arithmetic", 1961 [Avi61 in ASA] — the carry-free algorithm itself; the bound $\lceil(\beta+1)/2\rceil\le a\le\beta-1$ is re-derived above rather than quoted.
