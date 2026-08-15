---
title: "Periodic Shift-and-Add Rational Constant Multiplier"
description: Exploits the purely periodic binary expansion of A/B so each addition doubles the number of correct bits — i adders for 2^i repeats of the period.
kind: circuit
source: "ASA §12.4, pp. 395-401"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, rational, shift-and-add, periodicity, fpga]
aliases:
  - Periodical Shift-and-Add Graph
  - Periodic Shift-and-Add Graph
  - Rational Constant Multiplier
  - Multiplication by a Rational Constant
---

# Periodic Shift-and-Add Rational Constant Multiplier

A shift-and-add multiplier by a rational constant $A/B$ whose adder graph is built from the *period* of the constant's binary expansion rather than from its bit pattern, so each addition doubles the number of correct result bits and the adder count is logarithmic in the target precision.

```tikz title="Periodic shift-and-add graph for a 24-bit input times 7/5"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % --- main vertical datapath ---
  \node[anchor=south] at (0,0.6) {$X$};
  \draw[->] (0,0.55) -- (0,-0.92);
  \node[anchor=east] at (-0.12,-0.25) {\tiny 24};

  \node[draw,minimum width=3.2cm,minimum height=0.56cm,fill=gray!8] (a1) at (0,-1.2) {$+$};
  \node[draw,minimum width=3.2cm,minimum height=0.56cm,fill=gray!8] (a2) at (0,-3.0) {$+$};
  \node[draw,minimum width=3.2cm,minimum height=0.56cm,fill=gray!8] (a3) at (0,-4.8) {$+$};
  \node[draw,minimum width=3.2cm,minimum height=0.56cm,fill=gray!8] (a4) at (0,-6.6) {$+$};
  \node[draw,minimum width=3.2cm,minimum height=0.56cm,fill=gray!8] (a5) at (0,-8.4) {$+$};

  \draw[->] (0,-1.48) -- (0,-2.72);
  \draw[->] (0,-3.28) -- (0,-4.52);
  \draw[->] (0,-5.08) -- (0,-6.32);
  \draw[->] (0,-6.88) -- (0,-8.12);
  \draw[->] (0,-8.68) -- (0,-9.5);

  % --- widths (left of the bus) ---
  \node[anchor=east] at (-0.12,-2.3) {\tiny 26};
  \node[anchor=east] at (-0.12,-4.1) {\tiny 30};
  \node[anchor=east] at (-0.12,-5.9) {\tiny 38};
  \node[anchor=east] at (-0.12,-7.5) {\tiny 54};
  \node[anchor=east] at (-0.12,-9.1) {\tiny 56};

  % --- meaning of each partial product (right of the bus) ---
  \node[anchor=west] at (0.12,-2.3) {$\pi_0 = X\cdot 11_2$};
  \node[anchor=west] at (0.12,-4.1) {$\pi_1 = X\cdot 110011_2$};
  \node[anchor=west] at (0.12,-5.9) {$\pi_2 = X\cdot 11001100110011_2$};
  \node[anchor=west] at (0.12,-7.5) {$\pi_3 = X\cdot (1100)^{7}11_2$ \ (30-bit pattern)};
  \node[anchor=west] at (1.75,-1.2) {computing $PX$, $P=0110_2$};
  \node[anchor=west] at (1.75,-8.4) {adding $HX$, $H=1$};
  \node[anchor=north] at (0,-9.62) {$R = X\cdot 1.0110011001100110011001100110011_2 \approx \tfrac{7}{5}X$};

  % --- doubling feedback taps: pi_i shifted by 2^i s ---
  \draw[->] (0,-1.75) -- (-2.2,-1.75) -- (-2.2,-3.0) -- (-1.6,-3.0);
  \node[anchor=east] at (-2.3,-2.35) {$\gg 4$};
  \draw[->] (0,-3.55) -- (-2.2,-3.55) -- (-2.2,-4.8) -- (-1.6,-4.8);
  \node[anchor=east] at (-2.3,-4.15) {$\gg 8$};
  \draw[->] (0,-5.35) -- (-2.2,-5.35) -- (-2.2,-6.6) -- (-1.6,-6.6);
  \node[anchor=east] at (-2.3,-5.95) {$\gg 16$};

  % --- X bus feeding the first and the last adder ---
  \draw (0,-0.75) -- (-3.7,-0.75) -- (-3.7,-8.4);
  \draw[->] (-3.7,-1.2) -- (-1.6,-1.2);
  \draw[->] (-3.7,-8.4) -- (-1.6,-8.4);
  \fill (-3.7,-1.2) circle (0.05);
  \node[anchor=south] at (-2.6,-1.14) {$\gg 1$};
  \node[anchor=south] at (-2.6,-8.34) {$\gg 31$};
\end{circuitikz}
\end{document}
```

*after Fig. 12.17, p. 399.*

**Reduce the constant until its expansion is purely periodic.** Every rational has an eventually periodic binary expansion; the algorithm needs a *purely* periodic one, and Lemma 12.1 (p. 396) supplies the condition: for an irreducible $C/D<1$ with $2\nmid C$ and $2\nmid D$, the expansion starts with an occurrence of the period. Neither hypothesis costs anything. A factor of two in numerator or denominator is a shift, so pull it out as $2^{e}$ and keep only the odd part — that is a wire renaming, not hardware. And if $C>D$, Euclidean division gives $C=HD+C'$ with $C'<D$, hence

$$\frac{X C}{D} = XH + \frac{X C'}{D},$$

which splits the problem into an integer constant multiplication $HX$ — handled by any of [[Binary Shift-and-Add Constant Multiplier]], [[CSD Constant Multiplier]] or [[Minimum-Adder Constant Multiplier]] — plus a purely periodic fraction. Only the second part is new.

**Read the period size off the multiplicative order of 2.** Lemma 12.2 (p. 396) states that the period size $s$ is the multiplicative order of $2$ modulo $D$ — the least $s$ with $2^{s}\bmod D=1$ — and the periodic pattern is the integer $P=\lfloor 2^{s}C/D\rfloor$. The proof is two lines. By definition of $s$ there is an integer $k$ with $2^{s}=kD+1$, so by substitution

$$P=\left\lfloor\frac{(kD+1)C}{D}\right\rfloor=\left\lfloor kC+\frac{C}{D}\right\rfloor = kC,$$

the floor dropping $C/D$ because $C/D<1$. Rearranging $2^{s}C/D=kC+C/D$ gives

$$\frac{2^{s}C}{D}=P+\frac{C}{D},$$

and *that recursive occurrence of $C/D$ on the right is the periodicity* — shifting the fraction left by $s$ places reproduces the fraction plus an integer $P$. Examples (p. 397): $1/3$ has $s=2$ because $2^2\bmod 3=1$ and $P=\lfloor 4/3\rfloor=1=01_2$, so $1/3=0.(01)^{\infty}$; $5/9$ has $s=6$ and $P=\lfloor 5\cdot 64/9\rfloor=35=100011_2$. Algorithm 12.2 (p. 398) is just this made mechanical: simplify $A/B$, strip factors of two into $e$, Euclidean-divide to get $H$, then find $s$ by doubling $t\leftarrow 2t$ until $t\bmod D=1$. Its output is the four-integer representation

$$\frac{A}{B}=2^{e}\left(H+\sum_{i=1}^{+\infty}\frac{P}{2^{si}}\right).$$

**Turn periodicity into a doubling recurrence instead of a repeated-append loop.** The naive use of the representation appends one copy of the period per addition: $s$ more correct bits per adder, so $w_0/s$ adders, linear in the precision. The self-similarity identity above says more than that. Define the seed $\pi_0=2^{-s}PX$, which is $X$ times the constant truncated to $s$ bits, and then

$$\pi_{i+1}=\pi_i+2^{-2^{i}s}\pi_i .$$

Because $\pi_i$ is $X$ times a pattern of $2^{i}s$ bits, shifting it right by exactly its own length and adding places a second, non-overlapping copy of that pattern immediately below the first — by distributivity, $\pi_i(1+2^{-2^{i}s})$ is $X$ times a pattern of $2^{i+1}s$ bits. **Each addition doubles the number of correct bits**, the same repetition-squaring that turns a serial carry chain into a [[Parallel Prefix Adders]] tree, and by the same argument the depth is logarithmic. Gustafsson's result (p. 399) is that a constant consisting of $2^{i}$ repetitions of the period costs exactly $i$ additions, and this is optimal.

**Count the iterations from the precision, not from the constant.** Let $w_0$ be the number of bits of $A/B$ the application needs (for correctly-rounded binary32 with a 24-bit input, $w_0=28$), and $w_H$ the bit width of the header $H$. The fractional part must be right to $w_0-w_H$ bits, so the loop runs until $2^{i}s\ge w_0-w_H$:

$$i=\left\lceil\log_2\frac{w_0-w_H}{s}\right\rceil .$$

The last iteration usually overshoots, and a smaller final addition recovers the waste (p. 400): with $\pi_j$ already computed for every $j\le i$, take the least $j$ such that $(2^{i}+2^{j})s\ge w_0-w_H$ and finish with $R=\pi_j+2^{-2^{i}s}\pi_i$ — a shorter adder than a full further doubling, and it needs no new intermediate value because $j\le i$. The book notes the alternative $R=\pi_i+2^{-2^{j}s}\pi_j$ is worse: it puts the larger operand at the bottom and widens the adder.

**Budget the widths before drawing the graph.** With an input $X$ of $w_X$ bits, $\pi_i$ is $X$ times a $2^{i}s$-bit constant, so $\pi_i$ is $w_X+2^{i}s$ bits wide — the adder at step $i$ spans the same $w_X+2^{i}s$ bits, and the shift itself is free routing. One optimization trims this: leading and trailing zeroes of $P$ are stripped once and folded into the shift amounts, saving that many bits at every stage. The worked example is $A/B=7/5$ with $w_X=24$, $w_0=28$: $e=0$, $H=1$, $C'/D=2/5$, $s=4$ since $2^4\bmod 5=1$, and $P=\lfloor 2\cdot 16/5\rfloor=6=0110_2$. Then $i=3$ because $2^3\cdot 4=32\ge 27$ while $2^2\cdot 4=16<27$, and no smaller $j$ helps. $P$ has one leading and one trailing zero, so $\pi_0$ is built as $X\cdot 11_2=X+(X\ll 1)$ on $26$ bits rather than $28$, and the chain runs $24\to 26\to 30\to 38\to 54\to 56$: three doubling adders of $30$, $38$ and $54$ bits between one adder for $PX$ and one $56$-bit adder for $HX$ (Fig. 12.17, p. 399). Five adders, depth five, for a constant that a bit-pattern method would attack with a $28$-bit CSD recoding.

**Place the header addition where it does not deepen the graph.** $HX$ is computed in parallel with the whole $\pi$ chain by an ordinary [[Minimum-Adder Constant Multiplier]], and there are two ways to parenthesize the two final additions (p. 400): $R=(HX+\pi_j)+2^{-2^{i}s}\pi_i$ or $R=HX+(\pi_j+2^{-2^{i}s}\pi_i)$. Assuming — as one should for a short period — that $HX$ has strictly smaller depth than $\pi_i$, associativity lets us pick either, and the first is shallower whenever $j<i$, since it hides the header addition under the still-running doubling chain. When $i=j$ the second is preferred if it happens to use fewer full adders. In Fig. 12.17 $H=1$, so $HX=X$ costs zero adders and only the final $56$-bit addition remains.

**On FPGAs the whole cost is the adders.** Every shift is a routing offset, so the operator is $i+2$ ripple-carry additions of increasing width, which map straight onto the hard carry chain — see [[FPGAs]] — and the critical path is the sum of $i+2$ carry chains of length up to $w_X+2^{i}s$. That is the argument for keeping this shape rather than folding it: it is a plain [[Pipelined Adder Graph]] and retimes cleanly. On ASICs the same graph invites carry-save between stages, at the cost of a final carry-propagate assimilation. The chain widens monotonically, so pipelining it costs asymmetric register banks; balance registers dominate if the graph is deep.

$$\boxed{\ \pi_0=2^{-s}PX,\qquad \pi_{i+1}=\pi_i+2^{-2^{i}s}\pi_i,\qquad i=\left\lceil\log_2\frac{w_0-w_H}{s}\right\rceil\ }$$

**Where it stops paying.**

- **Long periods.** $s$ is the multiplicative order of $2$ mod $D$, which is $O(D)$ for many denominators — $1/11$ already has $s=10$. The first partial product $PX$ is a multiplication by an $s$-bit constant, so a long period simply moves the whole cost into the SCM sub-problem and the periodicity buys nothing. In practice this only pays for small denominators (p. 400).
- **The optimal SCM algorithms catch up.** Once $A/B$ is rounded to $w_0$ bits it is just an integer constant, and the exhaustive methods of §12.1.3-12.1.4 find an equally good adder graph. Their advantage here is only that this algorithm is far faster and scales to large $w_0$ (p. 401) — see [[Choosing a Constant Multiplier]].
- **Division by very small constants.** Multiplying by the inverse is not the best way to divide by $3$ or $5$; the dedicated recurrences in [[Division by Constants]] typically have lower area at somewhat higher latency (p. 401).
- **Width blow-up.** The last adder is $w_X+2^{i}s+1$ bits — $56$ bits for a $24$-bit input times $7/5$ — even though only $w_0$ of those bits survive the final round. Truncating the low bits early trades that area for error and moves the design into the faithful-rounding analysis of [[Faithful Shift-and-Add Real Constant Multiplier]]; see [[Number Formats]] and [[Error Accuracy]] for the ulp bookkeeping.

> [!warning] Not covered in the source — needs outside research
> The book gives no LUT counts, delays or synthesis comparison for the periodic architecture against a CSD or optimal-SCM implementation of the same rounded constant. Its claims of optimality are adder counts, not area.

**One iteration in RTL.** This circuit is a recurrence, so the entity below is a single step $\pi_i\mapsto\pi_{i+1}$, never an unrolled operator. The shift amount `SH` $=2^{i}s$ is a constant of the iteration, so it is a const generic, and the shift is expressed as a concatenation with `SH` zero bits — `concat` on integers puts its receiver in the high half, which is exactly $\pi_i\cdot 2^{\mathrm{SH}}$.

```spade
entity periodic_step<#uint W, #uint SH>(pi: uint<W>) -> uint<{W + SH + 1}> {
    let pad: uint<SH> = 0;
    let hi: uint<{W + SH}> = pi.concat(pad);   // pi shifted up by 2^i * s
    let lo: uint<{W + SH}> = zext(pi);         // pi in place
    hi + lo                                    // + widens by one bit
}
```

`pi` is one vertical wire of the diagram and the return value is the next one down; `hi` and `lo` are the two operands of one `+` box, and there is no register anywhere — the entity is purely combinational, matching the drawing, and a folded sequential version would not. The width arithmetic is where the entity is deliberately more conservative than Fig. 12.17: $\pi_i(2^{\mathrm{SH}}+1)<2^{W+\mathrm{SH}+1}$ is the best bound available from $W$ and $\mathrm{SH}$ alone, so the entity returns $W+\mathrm{SH}+1$ bits, whereas a generator that knows the constant proves the top bit dead and emits $26\to 30$ instead of $26\to 31$. Synthesis will also do one thing the drawing does not: the low $\mathrm{SH}$ bits of `hi` are constant zero, so the bottom $\mathrm{SH}$ bit positions of the adder collapse to wires and only $W$ full adders survive per stage.

Instantiating `periodic_step::<26, 4>` gives the second box of the figure, $\pi_0\mapsto\pi_1$; the operator is that entity repeated with `SH` $= s,2s,4s,\dots$ and $W$ growing to match, for $i=\lceil\log_2((w_0-w_H)/s)\rceil$ iterations. **The loop is unrolled at generation time, and it should be.** Every iteration uses a different shift, so folding the chain onto one reused adder requires a barrel shifter — $\lceil\log_2 W\rceil$ mux stages on a $54$-bit datapath — plus a full-width accumulator register and a small iteration counter. For $i=3$ that control costs more than the three adders it saves, and it serialises a graph whose entire appeal is a depth of $\log_2$ in the precision.

**Related notes.**

- [[Binary Shift-and-Add Constant Multiplier]] – compares: the baseline that spends one adder per nonzero bit of the rounded constant, linear where this is logarithmic.
- [[Minimum-Adder Constant Multiplier]] – depends-on: supplies the sub-multipliers for $PX$ and $HX$, and finds an equally good graph once the rational is rounded.
- [[CSD Constant Multiplier]] – compares: recodes the bit pattern instead of the period, so it never sees the repetition.
- [[Faithful Shift-and-Add Real Constant Multiplier]] – extends: same shift-and-add skeleton for an arbitrary real constant, where the period does not exist and error analysis replaces exactness.
- [[Rational-Constant KCM Table]] – supports: the same periodicity shrinks the tables of a KCM implementation of the same constant.
- [[Division by Constants]] – counter-example: for small divisors like $3$ or $5$, a dedicated division recurrence beats multiplying by the periodic inverse.
- [[Parallel Prefix Adders]] – compares: the identical repetition-squaring argument, applied to the carry recurrence instead of the constant's period.
- [[Pipelined Adder Graph]] – extends: retimes this chain, whose monotonically growing widths make the balance registers asymmetric.
- [[Choosing a Constant Multiplier]] – compares: where this sits among every constant-multiplication technique.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
- §12.4 Multiplication by a Rational Constant, pp. 395-401.
- §12.4.1 On the Periodicity of the Binary Representation of Rational Numbers, Lemmas 12.1-12.2 and proof, pp. 396-397.
- Algorithm 12.2, computing the periodic representation $(e,H,P,s)$, p. 398.
- §12.4.2 Periodical Shift-and-Add Graphs, the recurrence and the last-addition optimization, pp. 398-400.
- Fig. 12.17, multiplication of a 24-bit mantissa by $7/5$, p. 399.
- Concluding remarks on period length, optimal SCM and division by small constants, pp. 400-401.
