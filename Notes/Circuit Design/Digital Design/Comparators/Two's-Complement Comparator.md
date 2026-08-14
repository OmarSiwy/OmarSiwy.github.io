---
title: "Two's-Complement Comparator"
description: "Signed comparison for free: exchange the two MSBs and run the unsigned comparator; format alignment is zero-padding, also free."
kind: circuit
source: "ASA §6.1.1, p. 146"
status: seed
spade: simulated
tags: [digital, comparators, twos-complement, fixed-point, signed]
aliases:
  - Signed Comparator
  - Two's Complement Comparator
  - Signed Comparison
  - MSB Exchange
---

# Two's-Complement Comparator

An ordering comparator for signed operands whose entire content is a permutation of two wires: swap the sign bits and hand the words to an unsigned [[Magnitude Comparator]] unchanged.

```tikz title="Signed comparison by MSB exchange: the two sign wires cross, the unsigned comparator is untouched"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,font=\footnotesize]

% --- X word ---
\draw[fill=red!20]   (0,3.0) rectangle ++(0.95,0.55); \node at (0.475,3.28) {$x_{w-1}$};
\draw[fill=green!12] (0.95,3.0) rectangle ++(2.65,0.55); \node at (2.275,3.28) {$x_{w-2}\,\dots\,x_0$};
\node[below,font=\tiny] at (0.475,3.0) {1};
\node[below,font=\tiny] at (2.275,3.0) {$w-1$};
\node[above] at (1.8,3.6) {$X$};

% --- Y word ---
\draw[fill=red!20]   (4.9,3.0) rectangle ++(0.95,0.55); \node at (5.375,3.28) {$y_{w-1}$};
\draw[fill=green!12] (5.85,3.0) rectangle ++(2.65,0.55); \node at (7.175,3.28) {$y_{w-2}\,\dots\,y_0$};
\node[below,font=\tiny] at (5.375,3.0) {1};
\node[below,font=\tiny] at (7.175,3.0) {$w-1$};
\node[above] at (6.7,3.6) {$Y$};

% --- the exchange: one wire crossing, no logic ---
\draw[<->,thick,red!55!black] (0.475,3.6) to[out=70,in=110] (5.375,3.6);
\node[red!55!black] at (2.83,5.25) {exchange the two MSBs: a wire crossing --- 0 gates, 0 delay};

% --- into the unsigned comparator ---
\draw[->] (1.8,2.75) -- node[right,font=\tiny]{$w$} (1.8,2.05);
\draw[->] (6.7,2.75) -- node[right,font=\tiny]{$w$} (6.7,2.05);
\node[left]  at (1.65,2.4) {$X'$};
\node[left]  at (6.55,2.4) {$Y'$};
\draw[fill=blue!8] (0.9,1.3) rectangle (7.6,2.05);
\node at (4.25,1.675) {unsigned magnitude comparator, $w$ bits};

% --- outputs ---
\foreach \x/\lbl in {1.9/{$X<Y$}, 4.25/{$X=Y$}, 6.6/{$X>Y$}} {
  \draw[->] (\x,1.3) -- node[right,font=\tiny]{1} (\x,0.6);
  \node[below] at (\x,0.6) {\lbl};
}

% --- why it is legal ---
\node[align=center] at (4.25,-0.25)
  {$X'=X+2^{w-1}$ and $Y'=Y+2^{w-1}$ read as unsigned, both in $[0,2^{w})$;\\
   adding the same positive bias to both sides preserves order};

\end{circuitikz}
\end{document}
```

**Write down what the sign bit is actually worth.** A $w$-bit two's-complement word $X$ with bits $x_{w-1}\dots x_0$ denotes $X=-2^{w-1}x_{w-1}+\sum_{i=0}^{w-2}2^{i}x_{i}$ and covers $[-2^{w-1},\,2^{w-1}-1]$, while the *same $w$ wires* read as unsigned denote $U(X)=2^{w-1}x_{w-1}+\sum_{i=0}^{w-2}2^{i}x_{i}$. The two readings differ in one term, so subtracting them gives

$$U(X)-X \;=\; 2^{w-1}x_{w-1}-\bigl(-2^{w-1}x_{w-1}\bigr) \;=\; 2^{w}x_{w-1}$$

i.e. $U(X)=X \bmod 2^{w}$. The readings agree exactly on the non-negatives and differ by the full modulus on the negatives, which is precisely the wrong thing for an ordering: feed signed words to an unsigned comparator and every negative number sorts *above* every positive one, while the order *within* each sign class is already correct. The bug is therefore a single reflection at the sign boundary, not a per-bit error, and one bit of hardware ought to be enough to undo it. The positional weighting used throughout is the one fixed in [[Number Formats]].

**Complementing the sign bit is exactly adding the bias $2^{w-1}$.** Let $X^{\flat}$ be the same word with $x_{w-1}$ replaced by $\overline{x_{w-1}}=1-x_{w-1}$; only one term of the unsigned sum moves, so

$$U(X^{\flat}) \;=\; U(X)-2^{w-1}x_{w-1}+2^{w-1}\bigl(1-x_{w-1}\bigr) \;=\; U(X)+2^{w-1}-2^{w}x_{w-1}$$

and substituting $U(X)=X+2^{w}x_{w-1}$ from the previous paragraph cancels the $x_{w-1}$ terms outright:

$$U(X^{\flat}) \;=\; X+2^{w}x_{w-1}+2^{w-1}-2^{w}x_{w-1} \;=\; X+2^{w-1}$$

The complemented word is the **excess-$2^{w-1}$** (offset-binary, biased) encoding of the same value — the same device IEEE 754 applies to its exponent field, and for the same reason. Because $X$ ranges over $[-2^{w-1},2^{w-1}-1]$, the image ranges over $[0,2^{w}-1]$: the map lands exactly on the unsigned range, is a bijection, and never wraps.

**Order survives because the map is a translation, not merely a bijection.** $t\mapsto t+2^{w-1}$ is strictly increasing on $\mathbb{Z}$ — adding a constant to both sides of an inequality preserves it, the translation-invariance axiom of an ordered group — so

$$X<Y \iff X+2^{w-1}<Y+2^{w-1} \iff U(X^{\flat})<U(Y^{\flat})$$

and injectivity carries $=$ across as well, hence $>$ by trichotomy. No modular reduction has to be argued away, because both images were shown above to lie inside $[0,2^{w})$ before any comparison happens. This is the entire correctness proof, and it is worth noticing what it does *not* need: nothing about the internal structure of the unsigned comparator. Any of [[Binary Tree Comparator]], [[Fast Carry Chain Comparator]] or [[Two-Level Fast Carry Comparator]] can sit underneath.

**"Exchange the MSBs" and "complement both MSBs" are the same comparator.** The book states the rule as exchanging $x_{w-1}$ with $y_{w-1}$, which is not the same *encoding* as complementing each word — split on the two cases. If $x_{w-1}\neq y_{w-1}$, each word receives the negation of its own sign bit, so exchange **is** complement-both, verbatim. If $x_{w-1}=y_{w-1}$, the exchange is the identity while complement-both flips both; but in either case the two words still share an MSB, so the unsigned verdict falls through to the low $w-1$ bits — and that is the correct signed verdict too, since with the sign $s$ fixed, $X=-2^{w-1}s+L$ is increasing in the low part $L$. The two constructions agree pointwise as comparators while disagreeing as encodings. Prefer the exchange: complementing costs two inverters, crossing costs nothing even before technology mapping.

**The obvious alternative — subtract and read the sign — is wrong on half the input pairs.** $X-Y$ ranges over $[-(2^{w}-1),\,2^{w}-1]$ and needs $w+1$ bits, so the sign bit of a *$w$-bit* wrapping difference is not the sign of the difference. Take $w=4$, $X=-8=1000_2$, $Y=7=0111_2$: the true difference is $-15$, but $1000-0111=0001_2$, whose MSB $0$ claims $X\ge Y$. The exchange gets it right without arithmetic at all — $X'=0000$, $Y'=1111$, and $0<15$. Two repairs exist for the subtractive route: sign-extend both operands to $w+1$ bits and subtract there, which adds one full-adder stage to the carry chain, or keep $w$ bits and correct with the overflow flag, $(X<Y)=s_{w-1}\oplus V$, which adds an XOR after the slowest bit of the chain. Both buy back a bit that the exchange never lost. The unsigned identity underneath is the one from [[Magnitude Comparator]] — $c_{w}$ of $X+\overline{Y}+1$ is $(X\ge Y)$ — and it is exact only because it is computed at $w+1$ bits by construction.

**Equality never needed fixing, and that asymmetry is exploitable.** The two's-complement encoding is injective, so $X=Y$ holds iff the two bit vectors are identical, whatever weights are attached to the positions. An [[Equality Comparator]] is therefore signedness-agnostic: the same AND-of-XNORs serves $\mathrm{ufix}$, $\mathrm{sfix}$ and raw bit patterns, and the MSB exchange leaves its output invariant (swapping one bit between two words does not change whether the words agree). Only the two ordering outputs consume the exchange, which is one more argument for building the single predicate the context asks for rather than all three ([[Choosing a Comparator]]).

**Align formats first, exchange last.** Two operands in the same $\mathrm{sfix}(m,\ell)$ store integers $X_{\text{int}},Y_{\text{int}}$ with $X=2^{\ell}X_{\text{int}}$; multiplying an inequality by the positive constant $2^{\ell}$ preserves it, so the binary point is irrelevant to the comparison — it is a label on the wires, never a signal ([[Fixed-Point Representations]]). Two operands in *different* formats are first converted to the smallest common format, $m=\max(m_X,m_Y)$ and $\ell=\min(\ell_X,\ell_Y)$ (§2.2.3, cited from p. 146). At the low end that conversion is zero-padding — appending $\ell_X-\ell$ zeros multiplies the stored integer by $2^{\ell_X-\ell}$ while leaving the value alone. At the high end the unsigned case is also zero-padding, but the signed case is **sign extension**: positions $m_X\dots m$ must be driven from $x_{m_X}$, because the negative weight has to move to the new MSB and a zero there turns every negative operand positive.

> [!important] The exchange is defined on the aligned width, and only there
> Sign-extend both operands to the common $w=m-\ell+1$ **first**, exchange the MSBs of the widened words **last**. Reversing the two steps replicates a biased bit into the new positions, which represents nothing at all; the circuit still compiles, still runs, and is wrong on exactly the operands whose formats differed.

> [!warning] The book states the common-format rule for unsigned operands only
> §6.1.1 (p. 146) gives the "smallest larger common format" conversion in its $\mathrm{ufix}$ bullet and the MSB-exchange rule in its two's-complement bullet, but the two's-complement bullet is restricted to operands "of the same format". The signed different-format case — sign-extend high, zero-pad low, then exchange — is not written down there; the paragraph above composes it from the book's own §2.2.3 conversion, and the composition is what the RTL below is simulated against.

**Padding is not waste, but only half of it feeds the constant optimisation.** A padded operand carries bits the synthesiser knows statically, and static bits are exactly what a [[Constant Comparator]] collapses: each XNOR against a known bit becomes a wire or an inverter, and the freed LUT inputs widen the chunk a single LUT can cover. For an unsigned operand both padded ends are literal zeros and both are harvestable. For a two's-complement operand only the low end is — the high-end positions carry a *replicated signal*, $x_{m_X}$, not a constant, so they cost real LUT inputs and the optimisation applies to the fractional padding alone. Widening a signed operand for alignment is free in gates and not free in the downstream operator, which is now $w$ bits wide.

**In hardware the exchange is netlist renaming.** On an ASIC it is placement: two nets change which pin they terminate on, no cell is instantiated, no delay is added. On an FPGA the fast-carry construction consumes the operands in aligned 2-bit chunks through LUTs that compute arbitrary functions of their inputs, so the exchange is absorbed into the truth table of the single LUT pair that already sees the top chunk — the other $\lceil w/2\rceil-1$ chunks are bit-identical to the unsigned case and the LUT count does not move ([[Fast Carry Chain Comparator]]). In the technology-independent tree only the root's two leaf equations change polarity ([[Binary Tree Comparator]]). "At no cost" is therefore not a hand-wave meaning *cheap*: it is the literal claim that signed and unsigned comparators are the same netlist with two nets renamed, and it is why signedness never appears in this chapter's cost model.

$$\boxed{\ U(X^{\flat})=X+2^{w-1}\quad\Longrightarrow\quad (X<Y)_{\text{signed}} \;=\; \bigl(X^{\flat}<Y^{\flat}\bigr)_{\text{unsigned}} \;=\; \bigl(X_{\text{msb}\leftrightarrow}<Y_{\text{msb}\leftrightarrow}\bigr)_{\text{unsigned}}\ }$$

**When it breaks.**

- **Mixed signedness.** A signed $X$ against an unsigned $Y$ of the same width cannot be repaired by any permutation of wires, because the two encodings do not share a range: $Y$ reaches $2^{w}-1$ and $X$ stops at $2^{w-1}-1$. Widen both to $w+1$ — sign-extend $X$, zero-extend $Y$ — and apply the exchange at that width. Cost: one more chunk on the chain. In Verilog this is also where signedness silently evaporates, since an expression is signed only if *every* operand is.
- **Different widths.** The exchange is defined at a fixed $w$; applied before alignment it is wrong, as the callout above spells out. This is the failure mode that survives a testbench built from same-format vectors.
- **Other signed formats.** Sign-magnitude reverses the magnitude order inside the negatives, so no fixed wire permutation works — it needs a conditional inversion of the magnitude field. One's complement has two encodings of zero, which the exchange does not merge, so $=$ is still broken afterwards. Biased formats need nothing at all: they *are* the $X^{\flat}$ word already, which is why exponent fields compare unsigned.
- **IEEE 754.** A float is sign-magnitude at the top level, so flipping the sign bit alone is not enough; the standard total-order key flips *all* bits when the sign is set. And NaN is unordered, a fourth outcome that no comparator built from $<$, $=$, $>$ can express ([[Number Formats]]).
- **Redundant representations.** Carry-save pairs and signed-digit words have no single bit with a fixed sign weight, so there is nothing to exchange; comparison there requires a conversion first, which costs a carry propagation and dominates everything in this note.
- **Verification, not silicon.** Because the exchange is invisible in a waveform, a signedness or bit-order bug looks exactly like correct silence. This is the one place in the note where "free" costs something, and it is why the block below is simulated rather than merely compiled.

**RTL (Spade).**

```spade
/// Signed comparison by MSB exchange. Each word keeps its low W-1 bits and
/// receives the other's sign bit; the two results are the excess-2^(W-1)
/// encodings, whose unsigned order is the signed order of X and Y.
fn cmp_signed<#uint W>(x: int<W>, y: int<W>) -> (bool, bool, bool) {
    let xl: uint<{W - 1}> = trunc(x.as_uint());
    let yl: uint<{W - 1}> = trunc(y.as_uint());
    let xp = y.msb().as_uint().concat(xl);
    let yp = x.msb().as_uint().concat(yl);
    (xp < yp, xp == yp, xp > yp)
}
```

`xl` and `yl` are the green boxes of the diagram, `y.msb()`/`x.msb()` the crossed red ones, and `concat` puts its left argument in the high position, so `xp`, `yp` are the $X'$, $Y'$ buses — $1+(W-1)=W$ bits, no growth, because the exchange moves bits rather than computing on them. `as_uint` is a reinterpretation of the same wires, not a conversion, which is exactly the claim of the last body paragraph; the three comparisons are the only logic in the function, and they are what synthesis maps onto a carry chain or a prefix tree. It is a `fn`, not an `entity`: purely combinational, nothing to clock. What synthesis does differently from the drawing is that no `unsigned magnitude comparator` block survives — the three predicates share one carry chain, and `eq` is extracted from it rather than built as a separate AND tree.

Compiled and simulated at $W=8$: **68 546 vectors, 0 mismatches** — all $65\,536$ ordered pairs exhaustively, plus 3000 random and 10 named vectors including the asymmetric sign-straddling cases $(-128,127)$, $(1,-128)$ and $(-128,1)$. Every vector also checks that exactly one of $\{<,=,>\}$ is asserted. The same testbench evaluates the naive $w$-bit wrapping sign-of-difference alongside, and it disagrees with the correct answer on **17 155** of those vectors, which is the concrete measure of what the wire crossing is buying.

**Related Notes.**

- [[Magnitude Comparator]] – depends-on: the unsigned block this note wraps unchanged; every area and delay figure here is that note's, verbatim.
- [[Fixed-Point Representations]] – depends-on: supplies the $\mathrm{sfix}(m,\ell)$ weighting and the common-format conversion the alignment paragraph rests on.
- [[Equality Comparator]] – counter-example: the one output the exchange does not touch, because equality is bit-pattern identity under any weighting.
- [[Fast Carry Chain Comparator]] – extends: where $X'$ and $Y'$ are actually consumed, and where the exchange vanishes into the top chunk's LUT.
- [[Binary Tree Comparator]] – extends: the technology-independent version of the same absorption, at the root's leaf equations.
- [[Two-Level Fast Carry Comparator]] – extends: the exchange is applied once at the top level and the chunk encoding below is unaffected.
- [[Constant Comparator]] – supports: the low-end zero padding produced by format alignment is exactly the static-bit supply it feeds on.
- [[Choosing a Comparator]] – compares: signedness does not enter the variant choice at all, which is the practical content of this note.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 6 "Fixed-Point Comparison".
  - §6.1.1 "Fixed-Point Considerations", p. 146 — the three reduction bullets: point position irrelevant in a shared format, smallest larger common format for differing $\mathrm{ufix}$ formats (referring to §2.2.3), and the two's-complement MSB exchange "at no cost".
  - §6.1.2 "Area and Delay Considerations", p. 146 — $X<Y$ as the sign bit and carry out of $X-Y$, and $>$, $\le$ by swapping the operands.
  - §6.3.1 "Exploiting Fast Carry Logic" and Table 6.2, p. 148 — the 2-bit chunk LUT pair that absorbs the exchange.
- `2.2) Comparators` (this vault) — the long-form treatment this note is cut from.
