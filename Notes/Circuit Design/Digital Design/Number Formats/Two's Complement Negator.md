---
title: "Two's Complement Negator"
description: "Negation as a row of inverters plus an increment, where the increment is free because it rides the consuming adder's carry-in."
kind: circuit
source: "ASA §2.1.2-2.1.4, pp. 35-38"
status: seed
spade: simulated
tags: [digital, number-formats, twos-complement, negation, subtraction]
aliases:
  - Two's Complement Negation
  - Twos Complement Negator
  - Negator
  - Two's Complement Opposite
  - Bitwise Complement and Increment
---

# Two's Complement Negator

The operator that computes $-X$ on $w$ bits as one inverter per bit followed by an increment — and the only arithmetic block whose cost is normally **zero**, because the increment is absorbed into the carry-in of whatever adder consumes it.

```tikz title="Two's complement negation: (a) as a stand-alone block, w inverters plus a w-bit increment, with the -2^(w-1) overflow detect; (b) fused into a consumer adder, where the XOR row replaces the inverters and the +1 becomes the carry-in"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,x=1cm,y=1cm,
  blk/.style={draw,rounded corners=1pt,fill=blue!6,minimum width=1.5cm,minimum height=0.62cm}]

% ================= (a) stand-alone negator =================
\node[anchor=west] at (-1.7,4.0) {\textbf{(a)} stand-alone: $w$ inverters then a $w$-bit increment};

\draw (-1.1,3) node[anchor=east] {$X$} -- (0.55,3);
\node at (-0.45,3.26) {$w$};
\node[not port,scale=0.8] (n) at (1.0,3) {};
\node at (1.0,3.62) {$\times\,w$};
\node[blk] (inc) at (3.8,3) {$+\,1$};
\draw[->] (n.out) -- (inc.west);
\node at (2.7,3.26) {$\overline{X}$};
\node at (2.7,2.72) {$w$};
\draw[->] (inc.east) -- (6.6,3) node[anchor=west] {$-X$};
\node at (5.5,3.26) {$w$};

% overflow detect: sign(X) AND sign(-X)
\node[and port,scale=0.75] (ov) at (8.2,1.1) {};
\draw (-0.35,3) |- (ov.in 1);
\node[circ,scale=0.5] at (-0.35,3) {};
\node[anchor=south west] at (-0.25,1.28) {$x_{w-1}$};
\draw (5.9,3) |- (ov.in 2);
\node[circ,scale=0.5] at (5.9,3) {};
\node[anchor=west] at (6.0,2.1) {$(-X)_{w-1}$};
\draw[->] (ov.out) -- (9.5,1.1) node[anchor=west] {ovf};

% ================= (b) fused into the consumer =================
\node[anchor=west] at (-1.7,0.3) {\textbf{(b)} fused: $A-B=A+\overline{B}+1$, and the $+1$ is the adder's carry-in};

\node[draw,rounded corners=1pt,fill=blue!6,minimum width=1.4cm,minimum height=1.7cm]
  (add) at (4.4,-1.35) {$+$};

\draw[->] (-1.1,-0.85) node[anchor=east] {$A$} -- (3.7,-0.85);
\node at (0.6,-0.59) {$w$};

\draw (-1.1,-1.85) node[anchor=east] {$B$} -- (0.55,-1.85);
\node at (-0.45,-1.59) {$w$};
\node[xor port,scale=0.8] (xr) at (1.15,-1.85) {};
\draw (0.55,-1.85) -- (xr.in 1);
\node at (1.15,-1.23) {$\times\,w$};
\draw[->] (xr.out) -- (3.7,-1.85);
\node at (2.9,-1.59) {$w$};

\draw (0.1,-3.3) node[anchor=east] {sub} -- (4.4,-3.3) -- (add.south);
\node[circ,scale=0.5] at (0.5,-3.3) {};
\draw (0.5,-3.3) |- (xr.in 2);
\node[anchor=east] at (4.3,-2.6) {$c_{\mathrm{in}}$};

\draw[->] (5.1,-1.35) -- (6.6,-1.35) node[anchor=west] {$A-B$};
\node at (5.8,-1.09) {$w{+}1$};

\node[anchor=west] at (6.9,-3.3) {sub $=1$: $-B$\quad sub $=0$: $+B$};

\end{circuitikz}
\end{document}
```

**Derive the circuit from one identity about the all-ones word.** The $w$-bit word of all ones is $\sum_{i=0}^{w-1}2^i=2^w-1$ by the geometric sum. Bitwise complement computes $1-x_i=\overline{x_i}$ in every column independently, with no borrow between columns, so complementing the whole word is a *subtraction from that constant*:

$$\overline{X}=(2^{w}-1)-X\tag{2.2}$$

Add one to both sides and the constant becomes the modulus:

$$\overline{X}+1=2^{w}-X\equiv-X \pmod{2^{w}}\tag{2.3}$$

That congruence is the entire circuit. $X$ is $w$ bits in, $\overline{X}$ is $w$ bits (the inverter row changes no width), and $\overline{X}+1$ is kept at $w$ bits by discarding the carry out of position $w-1$ — which is legitimate precisely because [[Signed Fixed-Point Format]] reads a $w$-bit word as an element of $\mathbb{Z}/2^{w}\mathbb{Z}$, where dropping $2^w$ is the identity map. Two spot checks: $-0=\overline{0000}+1=1111+1=0000$, and $-1=\overline{0001}+1=1110+1=1111$ (p. 37).

**Price the two halves separately, because only one of them costs anything.** The inverter row is $w$ NOT gates, one gate level, no carry, no fan-out growth — free by any measure that matters. The increment is a carry propagation of length up to $w$, i.e. the same asymptotic structure as an adder: a linear chain if built naively, $O(\log w)$ if built as a prefix network. It is *cheaper* than a full adder — an incrementer's per-bit cell is a half adder ($s_i=\overline{x_i}\oplus c_i$, $c_{i+1}=\overline{x_i}\,c_i$) rather than a full adder, roughly halving the area — but the delay class is identical. **A stand-alone negator is an adder wearing a disguise**, and if you find one on a critical path you are paying adder latency to change a sign.

> [!important] Never build panel (a) if a panel (b) is available
> Every consumer that is itself an adder has an unused carry-in. $A-B=A+\overline{B}+1$ puts the $+1$ *there*, so the increment disappears into a port that already exists: subtraction costs one XOR row more than addition, and negation folded into a subsequent add costs nothing at all. This is the whole reason two's complement displaced sign-magnitude, whose negation is one wire but whose addition then needs a magnitude comparator and two datapaths (pp. 37-38).

**Make the negation conditional for free.** Replace each inverter with an XOR against a control bit $\mathrm{sub}$: $b_i\oplus\mathrm{sub}$ is $b_i$ when $\mathrm{sub}=0$ and $\overline{b_i}$ when $\mathrm{sub}=1$, because XOR with $1$ is complementation and XOR with $0$ is the identity. Drive the same $\mathrm{sub}$ into $c_{\text{in}}$ and one adder computes $A+B$ or $A-B$ under a single control wire — panel (b). The control bit fans out to $w+1$ places, which is the only thing this trick actually costs on ASIC; buffer it like any other broadcast signal.

**The increment's carry chain is short in practice and pathological exactly once.** In $\overline{X}$, every bit below the lowest set bit of $X$ is a $1$, and the bit at that position is a $0$. The $+1$ therefore ripples through exactly those ones and stops. Reading that back gives the hand rule taught without any algebra: *copy $X$ from the LSB up to and including its lowest $1$, invert everything above*. Check $X=0110_2=6$: copy $10$, invert $01$ to $10$, giving $1010_2=-6$. The worst case is $X=0$, where $\overline{X}$ is all ones and the carry crosses all $w$ positions — and produces $0$, correctly.

**One input has no opposite, and it is a real bug, not a footnote.** The range $[-2^{w-1},2^{w-1}-1]$ is asymmetric because zero occupies a positive code, so $+2^{w-1}$ is not representable and $-(-2^{w-1})$ overflows: $\overline{1000}+1=0111+1=1000$, the input unchanged. Detection is one AND gate — $X$ and $-X$ are both negative only for this value, since for $X<0$ the opposite is positive and for $X\ge0$ it is non-positive. That is the `ovf` output in panel (a), and it is why the book warns that sign-magnitude-to-two's-complement conversion "will fail on one value" (p. 38); see [[Sign-Magnitude to Two's Complement Converter]].

**The clean repair is a format change, not a special case.** Widen to $w+1$ bits *first*, then negate: $X\in\mathrm{sfix}(m,\ell)$ sign-extends losslessly into $\mathrm{sfix}(m+1,\ell)$ by [[Sign Extension]], and on that wider format the image of $[-2^m,2^m-2^\ell]$ under negation is $[-2^m+2^\ell,2^m]$, which fits. So the exact negator is *not* format-preserving — it costs one MSB — and every operator that claims to negate in place has silently chosen to accept the $-2^m$ hole. Panel (b) does exactly this widening, which is why an exact $w$-bit subtractor produces $w+1$ bits. Deciding to drop that bit again is a [[Fixed-Point Format Narrowing]] question, not a negation question.

**On FPGA the fused form is not merely cheaper, it is literally the same circuit as an adder.** A LUT-plus-carry-chain fabric feeds each carry stage from a LUT that is already computing the propagate term; folding $b_i\oplus\mathrm{sub}$ into that same LUT consumes an unused input rather than a new logic level, and the chain's carry-in is a dedicated port. Add and subtract therefore land on identical resource counts, and the negation is free in the strongest possible sense. On ASIC the XOR row is real silicon — roughly twice the area of the NOT row and one extra gate delay ahead of the adder — so a hard-wired subtractor beats a controlled add/sub when the direction is known at design time. Either way the increment itself is never built: see [[RCA, Ripple-Carry Adder]] for the linear chain that absorbs it and [[CLA, Carry-Lookahead Adder]] when the $O(w)$ ripple is the constraint.

$$\boxed{\ -X=\overline{X}+1 \bmod 2^{w},\qquad A-B=A+\overline{B}+1\ \text{with}\ c_{\mathrm{in}}=\mathrm{sub}\ }$$

**When it breaks.**

- **$X=-2^{w-1}$** (in fixed point, $X=-2^m$): negation is a fixed point of the map and the result is wrong by $2^w$. Either widen first or emit the `ovf` flag; silently truncating is the classic `abs(INT_MIN)` bug.
- **When the consumer is not an adder.** A negated operand entering a multiplier, comparator, shifter or memory port has no carry-in to hide in, and you pay a genuine incrementer. Multipliers usually avoid it entirely by folding the sign into a Baugh-Wooley correction instead of negating first.
- **When the negation is speculative.** Computing both $X$ and $-X$ to select later costs the incrementer anyway *and* a $w$-bit mux; a conditional XOR row driving one adder is strictly better whenever the decision is available before the add.
- **Constants never need this.** $-C$ for a design-time constant is folded by the synthesizer; the circuit exists only for values that vary at runtime.
- **Not for sign-magnitude or floating-point significands.** There, negation is a single sign-bit flip and this whole note is the wrong tool — see [[Choosing a Number Format]].

**RTL (Spade).**

```spade
// -X = ~X + 1  (mod 2^w)
fn neg<#uint W>(x: int<W>) -> int<W> {
    (~x.as_uint() +. 1).as_int()
}

// the one input with no opposite: overflow iff x and -x are both negative
fn neg_ovf<#uint W>(x: int<W>) -> bool {
    x.sign_bit() && neg(x).sign_bit()
}

// A - B = A + ~B + 1, with the +1 entering as the adder's carry-in
fn addsub<#uint W>(a: int<W>, b: int<W>, sub: bool) -> int<{W + 1}> {
    let ae: uint<{W + 1}> = sext(a).as_uint();
    let be: uint<{W + 1}> = sext(b).as_uint();
    let z: uint<{W + 1}> = 0;
    let m = if sub { ~z } else { z };
    (ae +. (be ^ m) +. (if sub { 1 } else { 0 })).as_int()
}
```

`neg` is panel (a): `~` is the inverter row and `+.` is the wrapping increment, truncating to $W$ bits exactly as hardware drops the carry out of position $W-1$ — the non-wrapping `+` would return $W+1$ bits and refuse to compile against the `int<W>` return type. `neg_ovf` is the single AND gate of the diagram, one bit out. In `addsub`, `m` is the XOR row's control broadcast to all $W+1$ bits and the final `if sub { 1 } else { 0 }` is the carry-in wire — written as a third addend because Spade has no carry-in port, but synthesis maps it onto the adder's existing $c_{\text{in}}$ rather than building a second adder. Everything here is a `fn`, hence purely combinational: the sign-extend to $W+1$ is wiring, and the only logic depth is one XOR level plus one carry propagation.

Verified by simulation: exhaustive over all $256$ codes for `neg`/`neg_ovf`, exhaustive over all $65536$ operand pairs for `addsub` at both control values, plus $3000$ random vectors, against a `$signed` behavioural reference — $134{,}335$ vectors, zero mismatches. The asymmetric cases $1-(-128)=129$ and $-128-1=-129$ are checked by name, since a bit-reversed or operand-swapped datapath survives symmetric vectors.

**Related Notes.**

- [[Signed Fixed-Point Format]] – depends-on: supplies the $\mathbb{Z}/2^{w}\mathbb{Z}$ reading of a $w$-bit word that makes discarding the carry out of $2^w$ legitimate rather than a bug.
- [[RCA, Ripple-Carry Adder]] – supports: the consumer whose spare carry-in swallows the increment, which is what makes negation free.
- [[CLA, Carry-Lookahead Adder]] – extends: when a stand-alone increment is unavoidable, its $O(w)$ ripple is the thing to replace.
- [[Sign Extension]] – depends-on: widening to $w+1$ before negating is what removes the $-2^{w-1}$ exception.
- [[Sign-Magnitude to Two's Complement Converter]] – extends: conversion in either direction *is* this negator, and inherits its one failing value.
- [[Fixed-Point Format Narrowing]] – compares: the extra MSB an exact negation produces has to go somewhere, and that is a narrowing decision.
- [[Choosing a Number Format]] – compares: formats where negation is a wire instead of a carry chain, and what they cost elsewhere.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 2 "Number Formats":

- §2.1.2 Signed integers in two's complement representation, pp. 35-36 — $-X$ defined as $2^w-X$; Fig. 2.2 (the modulo-16 ring); the asymmetric range $[-2^{w-1},2^{w-1}-1]$ and the warning that $-2^{w-1}$ has no representable opposite.
- §2.1.2 (cont.), p. 37 — Eq. (2.2) $\overline{X}=(2^w-1)-X$, Eq. (2.3) $-X=\overline{X}+1 \bmod 2^w$, worked on 4 bits; Eq. (2.4), the weighted-sum value with a negative MSB weight.
- §2.1.3 Sign-magnitude representation, pp. 37-38 — Eq. (2.5), the symmetric range, the two zeros.
- §2.1.4 Conversion between sign-magnitude and two's complement, p. 38 — both directions are a two's complement negation; "the second conversion will fail on one value: $-2^{w-1}$".
- §2.2.2 Two's complement fixed-point representation, p. 41 — Eq. (2.8), the scaled form and the range $[-2^m,2^m-2^\ell]$ used here for the widening argument.
