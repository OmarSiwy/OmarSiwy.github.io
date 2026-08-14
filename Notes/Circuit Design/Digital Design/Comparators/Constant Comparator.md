---
title: Constant Comparator
description: "Freezing Y collapses every leaf to a wire or an inverter, so a LUT sees alpha bits of X alone — chunk width, LUT count and chain depth all improve by the same factor."
kind: circuit
source: "ASA §6.3.3, p. 149"
status: seed
spade: simulated
tags: [digital, comparators, constant, fpga, lut]
aliases:
  - Constant Comparison
  - Comparing to a Constant
  - IntConstantComparator
---

# Constant Comparator

A magnitude comparator with one operand frozen at synthesis time, which turns the comparison into a function of $X$ alone and so doubles the number of input bits each LUT can swallow.

```tikz title="16-bit constant comparator: four 5-bit LUT chunks on one fast carry chain"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
\node[draw,minimum width=2.2cm,minimum height=1.0cm] (l3) at (0,0)    {LUT$_3$: $C_3\!=\!10110$};
\node[draw,minimum width=2.2cm,minimum height=1.0cm] (l2) at (3.7,0)  {LUT$_2$: $C_2\!=\!01110$};
\node[draw,minimum width=2.2cm,minimum height=1.0cm] (l1) at (7.4,0)  {LUT$_1$: $C_1\!=\!10011$};
\node[draw,minimum width=2.2cm,minimum height=1.0cm] (l0) at (11.1,0) {LUT$_0$: $C_0\!=\!1$};
\foreach \i/\w in {3/5, 2/5, 1/5, 0/1}{
  \draw[<-] (l\i.north) -- node[right,font=\tiny]{\w} ++(0,1.0) node[above,font=\small]{$X_{\i}$};
}
\draw[->] (13.6,0) -- node[above,font=\tiny]{$c_0\!=\!1$} (l0.east);
\draw[->] (l0.west) -- node[above,font=\tiny]{$c_1$} (l1.east);
\draw[->] (l1.west) -- node[above,font=\tiny]{$c_2$} (l2.east);
\draw[->] (l2.west) -- node[above,font=\tiny]{$c_3$} (l3.east);
\draw[->] (l3.west) -- node[above,font=\tiny]{$c_4$} ++(-2.5,0) node[left,font=\small]{$\overline{c_4}=(X<C)$};
\node[font=\tiny,align=center] at (5.6,-1.7)
  {each LUT emits $x'_j=(X_j>C_j)$ and $\overline{y'_j}=(X_j\ge C_j)$ into the hard full adder;\\
   there is no $Y$ port, so all $\alpha=5$ LUT inputs are spent on $X$};
\node[font=\tiny,align=center] at (5.6,2.3)
  {$X$ (16 bits), split MSB-first into $\lceil 16/5\rceil = 4$ chunks};
\end{circuitikz}
\end{document}
```

**Substitute the constant into the leaf equations and watch them evaporate.** The [[Binary Tree Comparator]] encodes each node's verdict as the 1-bit pair $G=[X>Y]$, $E=[X=Y]$, with leaves $G_i = x_i\wedge\overline{y_i}$ and $E_i = \overline{x_i\oplus y_i}$ on single bits. Freeze $Y=C$ so that each $y_i$ becomes the known bit $c_i$. By *complement of a constant* and *absorption* ([[Boolean Algebra]]):

$$
c_i=0:\quad G_i = x_i\wedge\overline{0}=x_i,\;\; E_i=\overline{x_i}
\qquad\qquad
c_i=1:\quad G_i = x_i\wedge\overline{1}=0,\;\; E_i=x_i
$$

Every XNOR and every AND against a constant has become a wire or an inverter. Nothing at all is left at the leaves — the only surviving logic in the whole comparator is the $\circ$ prefix reduction $G_{H:L}=G_H\vee(E_H\wedge G_L)$, $E_{H:L}=E_H\wedge E_L$ over the chunks, unchanged from the variable case.

**The saving is LUT packing, not gate count.** Deleting the leaves saves nothing on an FPGA, because a leaf never occupied a LUT of its own: it was already absorbed into the LUT that fed the carry chain. What changes is what that LUT has room for. In the variable [[Fast Carry Chain Comparator]] a basic logic element computes $\mathrm{FA}(p(a,b,c,d),\,q(a,b,c,d),\,c_i)$ — two arbitrary functions of the *same* $\alpha$ inputs, driving one hard full adder ([[Lookup-Tables]]) — and half those inputs are spent carrying $Y$, leaving an $\alpha/2$-bit chunk. With $C$ folded into the truth table, both $p$ and $q$ see $\alpha$ bits of $X$, so the chunk width doubles.

**Doubling the chunk width divides area and depth by the same two, because both are chunk counts.** A $w$-bit input needs $\lceil w/\alpha\rceil$ chunks; each chunk is one BLE, i.e. one LUT pair plus one carry stage. Area is the chunk count and latency is the chunk count, so a single parameter moves both. There is no asymptotic change — it is still $O(w)$ LUTs on one carry chain — and that is the point: a constant-factor win of exactly $2$ on two axes at once, which is rare enough to take.

**A 16-bit threshold, end to end.** Compare $X$ (16 bits, unsigned) against

$$C = \mathtt{0xB3A7} = 1011\,0011\,1010\,0111_2$$

The variable-operand baseline costs $\lceil 16/2\rceil = 8$ LUTs and 8 carry stages. The constant version chunks at $\alpha$: the book's four-input BLE model gives $\alpha=4$ and $\lceil 16/4\rceil=4$; [[FloPoCo]]'s 5-bit chunking (13 chunks at $w=64$) gives $\lceil 16/5\rceil=4$. Both readings agree — **4 LUTs, 4 carry stages**, half of each. Taking the 5-bit split,

$$C = \underbrace{10110}_{C_3}\ \underbrace{01110}_{C_2}\ \underbrace{10011}_{C_1}\ \underbrace{1}_{C_0}$$

each chunk's LUT pair is a function of 5 bits of $X$ and nothing else. For $C_3=10110$ the equality bit is a single 5-literal product term,

$$E_3 = x_{15}\,\overline{x_{14}}\,x_{13}\,x_{12}\,\overline{x_{11}}$$

one AND with no XNORs, because each constant bit $c_i$ chose the polarity of its literal in advance. The greater-than bit $G_3=[\,X_3>10110\,]$ is another 5-variable function, and both fit the pair. Feeding $X = \mathtt{0xB3A0} = 10110\ 01110\ 10000\ 0$ and seeding $c_0=1$ (the $+1$ of the two's-complement identity $X+\overline{C}+1$, see [[Magnitude Comparator]]):

| stage | $X_j$ (5 bits) | $C_j$ | verdict | prefix role | $c_{j+1}$ |
| --- | --- | --- | --- | --- | --- |
| 0 | $0$ | $1$ | $<$ | kill | $0$ |
| 1 | $10000$ | $10011$ | $<$ | kill | $0$ |
| 2 | $01110$ | $01110$ | $=$ | propagate | $0$ |
| 3 | $10110$ | $10110$ | $=$ | propagate | $0$ |

$c_4=0$, so $X\ge C$ is false and $\mathbf{X<C}$ — correct, $\mathtt{0xB3A0}<\mathtt{0xB3A7}$. Note the shape: the two top chunks abstain and the verdict formed at stage 1 rides untouched to the output. Had $X_3$ been $10111$, stage 3 would have generated and overridden everything below it in one carry step.

**Constant operands arrive uninvited, so look for them.** Aligning two fixed-point operands of different formats to a common $\mathrm{ufix}(m,\ell)$ is pure zero-padding ([[Number Formats]]), and those padding bits are compile-time constants — a *partially* constant comparison, where the padded lanes collapse exactly as above and only the overlapping lanes stay variable. Exponent bounds, saturation thresholds and FSM range checks are the other reliable sources.

> [!warning] AMD tooling does not implement this
> At the time of writing, AMD tools fall back on the plain logic optimizer for small $w$ and on a standard non-specialized comparator for larger $w$ (p. 149), so the factor of 2 is not free — you must generate the operator: `flopoco IntConstantComparator flags=1 w=64 c=17979737894628297144`, which decomposes a 64-bit input into 13 chunks of 5 bits linked by fast carry logic.

$$\boxed{\ \text{LUTs} \;=\; \text{carry stages} \;=\; \Big\lceil \tfrac{w}{\alpha} \Big\rceil \quad\text{versus}\quad \Big\lceil \tfrac{w}{\alpha/2} \Big\rceil = \Big\lceil \tfrac{2w}{\alpha} \Big\rceil \ \text{for a variable } Y\ }$$

**When it breaks.**

- **$C$ is not actually constant.** A threshold written to a configuration register is a variable operand; you are back to $\lceil w/2\rceil$ LUTs and the whole note is moot.
- **A tiny $w$.** Below one chunk ($w\le\alpha$) the entire comparison is one LUT with or without the optimization, and the factor of 2 has nothing to bite on.
- **Very large $w$.** The chain is still $\lceil w/\alpha\rceil$ carry stages deep, i.e. linear. Past a few thousand bits latency wants the [[Two-Level Fast Carry Comparator]] instead, whose first level also benefits from a constant but whose level-2 overhead you now pay.
- **Only $X=Y$ is wanted.** Use the [[Equality Comparator]]: a constant makes each chunk equality a single product term, which is what a LUT already is, so the win is packing again but the reduction is a plain AND tree rather than a carry chain.
- **ASIC, not FPGA.** There is no $\alpha$ to fill. The optimization degenerates into what any logic optimizer does with constant propagation — real, worth having, but not a clean factor of 2, and not something you build by hand.

**RTL (Spade).**

```spade
// (G,E) reduction; h is the more significant chunk
fn merge(h: (bool, bool), l: (bool, bool)) -> (bool, bool) {
    let (gh, eh) = h;
    let (gl, el) = l;
    (gh || (eh && gl), eh && el)
}

// leaf against the compile-time chunk K: a function of X's chunk alone
fn leaf<#uint A, #uint K>(xc: uint<A>) -> (bool, bool) {
    (xc > K, xc == K)
}

// C = 0xB3A7 = 10110 01110 10011 1
entity cmp_b3a7(x: uint<16>) -> uint<2> {
    let b = x.as_bits();
    let l3 = leaf::<5, 0b10110>(b[11..16].as_uint());
    let l2 = leaf::<5, 0b01110>(b[6..11].as_uint());
    let l1 = leaf::<5, 0b10011>(b[1..6].as_uint());
    let l0 = leaf::<1, 0b1>(b[0..1].as_uint());
    let (g, e) = merge(l3, merge(l2, merge(l1, l0)));
    g.as_uint().concat(e.as_uint())   // bit 1 = X > C, bit 0 = X = C
}
```

`leaf` is the LUT pair of one box in the diagram and `merge` is one carry stage between two boxes; the constant enters only as the const generic `K`, so the emitted module's port list is `input[15:0] x_i` and nothing else — the missing $Y$ port *is* the optimization, visible in the interface. Widths: $X$ is 16 bits, `b[11..16]` etc. are the $\alpha=5$ chunks (index 0 = LSB, so `b[0..1]` is the ragged 1-bit chunk 0), and every $G$/$E$ edge is 1 bit. All of it is combinational — no clock, no register. Synthesis will not build the `merge` chain as the drawn gates: on FPGA it packs each `leaf`/`merge` pair into one BLE and routes the $\circ$ reduction onto the dedicated carry path, which is why the drawing shows a chain where the source shows a fold.

Simulated with iverilog against a behavioural `{x > 16'hB3A7, x == 16'hB3A7}` reference: 5610 vectors, 0 failures — 10 named (including the worked example $\mathtt{0xB3A0}$, both one-ulp neighbours of $C$, and the deliberately asymmetric $\mathtt{0x0001}$ and $\mathtt{0x0080}$ that a reversed chunk order would pass), 5000 random inputs, and a 600-wide exhaustive walk straddling $C$ where the generate/propagate/kill boundary actually lives.

**Related notes.**

- [[Fast Carry Chain Comparator]] – extends: the same chunked carry chain with a live $Y$; freezing $Y$ is exactly what doubles its chunk width.
- [[Binary Tree Comparator]] – depends-on: supplies the $(G,E)$ leaf equations that the constant collapses, and the associativity that lets the chunks reduce in any order.
- [[Magnitude Comparator]] – depends-on: the $X+\overline{C}+1$ subtraction whose carry-out this chain computes.
- [[Two-Level Fast Carry Comparator]] – compares: the alternative when $\lceil w/\alpha\rceil$ carry stages are too deep, at strictly worse area.
- [[Equality Comparator]] – compares: the $X=C$ case, one product term per chunk and an AND tree instead of a chain.
- [[Choosing a Comparator]] – compares: where this sits against every sibling.
- [[Multiplication by Constants]] – supports: the same "a frozen operand collapses the operator" pattern, taken much further.
- [[Division by Constants]] – supports: ditto for division, where the constant buys a table instead of a chunk.
- [[Lookup-Tables]] – depends-on: the whole factor of 2 is an $\alpha$-input LUT budget argument.
- [[FloPoCo]] – supports: generates this operator, since the vendor tools do not.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 6 "Fixed-Point Comparison".
  - Sect. 6.3.3 Comparing to a Constant, p. 149 — the LUT-$\alpha$ argument and the FloPoCo command.
  - Sect. 6.3.1 Exploiting Fast Carry Logic and Table 6.2, p. 148 — the two-bit chunk encoding and the $\lceil w/2\rceil$ baseline.
  - Sect. 6.2 Basic Binary Tree Comparison and Table 6.1, p. 147 — the $(G,E)$ leaf equations.
  - Sect. 6.1.1 Fixed-Point Considerations, p. 146 — format alignment as zero-padding, which manufactures the constant bits.
  - Sect. 5.4 (BLE structure $\mathrm{FA}(p,q,c_i)$), p. 125, cited from p. 148.
