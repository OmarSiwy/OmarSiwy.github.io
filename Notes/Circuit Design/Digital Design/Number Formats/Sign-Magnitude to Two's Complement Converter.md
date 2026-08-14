---
title: "Sign-Magnitude to Two's Complement Converter"
description: "One conditional negate in each direction — an XOR row plus an increment gated by the sign bit — and the one input value, -2^(w-1), on which the reverse direction cannot work."
kind: circuit
source: "ASA §2.1.2–2.1.4, pp. 36–38"
status: seed
spade: simulated
tags: [digital, number-formats, twos-complement, sign-magnitude, conversion, fpga]
aliases:
  - "Sign-Magnitude to Two's Complement Converter"
  - "Two's Complement to Sign-Magnitude Converter"
  - "Sign-Magnitude Conversion"
  - "Sign-Magnitude Converter"
  - "Conditional Negate"
---

# Sign-Magnitude to Two's Complement Converter

**One-line summary:** A conditional two's-complement negation driven by the word's own MSB, distinguished from every other format converter by being *its own inverse* — the identical gates carry sign-magnitude to two's complement and two's complement back to sign-magnitude, with a single input code on which the second reading fails.

```tikz title="Sign-magnitude / two's complement converter: an XOR row masked by the sign bit, an increment with the sign bit as carry-in, and a two-gate detector for the one code the reverse direction cannot represent"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize]

% ============ input word ============
\draw[fill=red!20]   (0,2.0)   rectangle (0.7,2.8);
\draw[fill=green!12] (0.7,2.0) rectangle (3.4,2.8);
\node at (0.35,2.4) {$s$};
\node at (2.05,2.4) {$x_{w-2}\ \ldots\ x_{0}$};
\node[anchor=west] at (0.55,3.15) {$X$ : $w$ bits};

% ============ sign rail ============
\draw[thick] (0.35,2.0) -- (0.35,-1.1);
\node[circ,scale=0.75] at (0.35,1.4) {};
\node[circ,scale=0.75] at (0.35,0.8) {};
\draw[thick] (0.35,1.4) -- (5.5,1.4) -- (5.5,1.85);
\draw[thick] (0.35,0.8) -- (8.6,0.8) -- (8.6,1.3);
\draw[thick] (0.35,-1.1) -- (7.15,-1.1);
\node[anchor=west] at (0.5,-0.85) {$s$ : 1 bit, fanout 4};

% ============ sign bypass, over the top ============
\draw[thick] (0.35,2.8) -- (0.35,3.75) -- (7.9,3.75) -- (7.9,3.3);
\node[anchor=west] at (0.55,3.95) {$s$ is never complemented: it becomes bit $w-1$ of the result};

% ============ XOR row ============
\draw[fill=gray!8] (4.4,1.85) rectangle (6.6,2.95);
\node[align=center] at (5.5,2.4) {XOR row\\ $w-1$ gates};
\draw[thick,->] (3.4,2.4) -- (4.4,2.4);
\node[anchor=south] at (3.9,2.45) {$w-1$};
\node[anchor=west] at (5.6,1.62) {$s$ = mask};

% ============ incrementer ============
\draw[fill=gray!8] (7.6,1.3) rectangle (9.6,3.3);
\node[align=center] at (8.6,2.4) {increment\\ mod $2^{w}$};
\draw[thick,->] (6.6,2.4) -- (7.6,2.4);
\node[anchor=south] at (7.1,2.45) {$w-1$};
\node[anchor=west] at (8.7,1.05) {$c_{\text{in}}=s$};

% ============ output word ============
\draw[thick,->] (9.6,2.4) -- (10.8,2.4);
\node[anchor=south] at (10.2,2.45) {$w$};
\draw[fill=red!20]   (10.8,2.0) rectangle (11.5,2.8);
\draw[fill=green!12] (11.5,2.0) rectangle (14.2,2.8);
\node at (11.15,2.4) {$s$};
\node at (12.85,2.4) {$t_{w-2}\ \ldots\ t_{0}$};
\node[anchor=west] at (10.8,3.15) {$T$ : $w$ bits, carry-out discarded};
\node[anchor=north] at (11.15,1.95) {$1$};
\node[anchor=north] at (12.85,1.95) {$w-1$};

% ============ zero-magnitude detector ============
\draw[thick] (3.0,2.0) -- (3.0,-0.4) -- (4.55,-0.4);
\node[anchor=south] at (3.8,-0.35) {$w-1$};
\node[nor port,scale=0.8,number inputs=2] (nr) at (5.35,-0.4) {};
\draw (4.55,-0.4) -- (4.55,-0.18) -- (nr.in 1);
\draw (4.55,-0.4) -- (4.55,-0.62) -- (nr.in 2);
\node[and port,scale=0.8] (an) at (7.95,-0.85) {};
\draw[thick] (nr.out) -- (6.6,-0.4) -- (6.6,-0.63) -- (an.in 1);
\draw[thick] (7.15,-1.1) -- (7.15,-1.07) -- (an.in 2);
\draw[thick,->] (an.out) -- (9.5,-0.85);
\node[anchor=west] at (9.6,-0.85) {\texttt{invalid} (1 bit)};
\node[anchor=north,align=center] at (5.35,-1.35) {$(w-1)$-input NOR:\\ magnitude field is all zero};

% ============ the two readings ============
\node[anchor=west,align=left] at (0,-2.55)
  {\textbf{$X$ sign-magnitude} $\Rightarrow$ $T$ two's complement, exact for every input.\\
   \textbf{$X$ two's complement} $\Rightarrow$ $T$ sign-magnitude, exact unless \texttt{invalid},
   which fires only on $X=10\ldots0=-2^{w-1}$.};

\end{circuitikz}
\end{document}
```

**Topic:**

**Put both encodings on the same $w$ wires before writing a single gate.** A $w$-bit vector $x_{w-1}\ldots x_0$ admits two readings. Under **sign-magnitude** the MSB is a sign flag $s=x_{w-1}$ and the remaining $w-1$ bits are an unsigned magnitude,

$$X_{\mathrm{sm}}=(-1)^{s}\sum_{i=0}^{w-2}2^{i}x_{i}=(-1)^{s}M,\qquad M\in[0,\,2^{w-1}-1] \tag{2.5}$$

Under **two's complement** the same MSB is a bit of weight $-2^{w-1}$, per the $\mathrm{sfix}(w-1,0)$ convention of [[Signed Fixed-Point Format]],

$$X_{2\mathrm{c}}=-2^{w-1}x_{w-1}+\sum_{i=0}^{w-2}2^{i}x_{i} \tag{2.4}$$

Both readings put the sign in the same position and both use $s=0$ for non-negative, so the two encodings **agree bit-for-bit on every non-negative value**: with $s=0$ the sum in (2.4) and the sum in (2.5) are the same sum. Every difference between the formats lives in the $s=1$ half of the code space, and that is the entire content of the converter. Widths: input $w$ bits ($1+(w-1)$), output $w$ bits, no growth in either direction.

> [!warning] The book's stated sign-magnitude range on p. 38 is wrong
> ASA gives $X\in[-2^{w-1}-1,\,2^{w-1}-1]$ and calls it symmetric — the two clauses contradict each other. The magnitude field is $w-1$ bits, so $M\le 2^{w-1}-1$ and the correct range is $[-(2^{w-1}-1),\,2^{w-1}-1]$. Counterexample at $w=4$: the printed bound claims $-9$ is representable, but the largest magnitude a 3-bit field can hold is $7$, so the most negative code $1111_2$ is $-7$. The long-form [[Number Formats]] note already carries the corrected form; use that one.

**The conversion is the negation identity, gated.** From the bitwise-NOT identity $\overline{X}=(2^{w}-1)-X$ (2.2) — valid because complementing computes $1-x_i$ in every column with no borrow — adding one to both sides gives the **two's-complement negation identity**

$$-X=\overline{X}+1 \pmod{2^{w}} \tag{2.3}$$

Now split on $s$. If $s=0$ there is nothing to do: the sign-magnitude word already *is* its two's-complement code. If $s=1$, the value is $-M$, so first read the magnitude as a $w$-bit **non-negative** two's-complement number by prefixing a $0$ MSB — this is the zero-padding half of [[Sign Extension]], errorless and gate-free — and then apply (2.3) to that $w$-bit word (p. 38). The reverse direction is the same sentence read backwards: a negative two's-complement number is negated by (2.3), which clears its sign bit, leaving the $w-1$ LSBs as the magnitude and the sign to be re-asserted by hand.

**Fold the two branches into one datapath by noticing the mask and the carry-in are the same wire.** Written as a conditional the circuit would be a $w$-bit multiplexer between $X$ and $-X$; written arithmetically it is much cheaper. Define the mask $\mu(s)=s\cdot(2^{w-1}-1)$ — all ones in the magnitude positions when $s=1$, all zeros when $s=0$, and $0$ in the sign position always — and take

$$T=\big(X\oplus\mu(s)\big)+s \pmod{2^{w}}$$

Check both branches. For $s=0$, **XOR with $0$ is the identity**, the carry-in is $0$, and $T=X=M$, which is (2.4) with $x_{w-1}=0$. For $s=1$, **XOR with $1$ is complementation**, so the magnitude field becomes $\overline{M}=(2^{w-1}-1)-M$ by (2.2) applied at width $w-1$, while the sign position is XORed with $0$ and stays at $1$. As an unsigned $w$-bit integer that word is

$$2^{w-1}+\big(2^{w-1}-1-M\big)=2^{w}-1-M$$

and adding the carry-in $s=1$ gives $2^{w}-M\equiv-M \pmod{2^{w}}$ — exactly (2.3), obtained without ever materialising the zero-padded intermediate. The single mux has become $w-1$ XOR gates and a $1$-bit carry-in, which is the whole reason the conditional-negate idiom is written this way everywhere it appears.

> [!important] The direction of conversion is a reading, not a control input
> $T=(X\oplus\mu(s))+s$ has no mode bit and no second datapath. Feed it a sign-magnitude word and the output is two's complement; feed it a two's-complement word and the output is sign-magnitude. It is an **involution**: apply it twice and you are back where you started. For $T=1\|L$ with $L\neq 0$ the map produces $2^{w}-L$, whose MSB is $1$ and whose low field is $2^{w-1}-L=|T|$, and applying it again returns $1\|L$. The one orbit that does not close is the code $10\ldots0$, and that single exception is the entire error budget of the block.

**One input code has no image, and two gates find it.** The code $X=10\ldots0$ carries both anomalies of both formats at once. Read as sign-magnitude it is $-0$, the redundant zero, and the converter maps it to $00\ldots0$ — correct, since $-0=0$; this is why the sign-magnitude $\to$ two's complement direction is **exact on all $2^{w}$ inputs**, merely two-to-one at zero. Read as two's complement it is $-2^{w-1}$, whose magnitude $2^{w-1}$ needs $w$ bits and cannot fit a $w-1$-bit magnitude field. The circuit returns $00\ldots0$, i.e. $+0$, silently: an error of $2^{w-1}$ ulps, the largest error the format admits. The book records the failure but not its detection (p. 38). It is one $(w-1)$-input NOR and one AND:

$$\mathtt{invalid}=s\wedge\bigwedge_{i=0}^{w-2}\overline{x_{i}}$$

Two repairs, both one gate level. **Saturate**: mux the output to $1\,\underbrace{1\ldots1}_{w-1}=-(2^{w-1}-1)$ when `invalid` fires, trading a catastrophic error for one ulp — the same bargain a saturating adder strikes. **Widen**: emit $w+1$ bits, giving the magnitude field $w$ bits, which is exact for every $w$-bit two's-complement input with no detector at all. Widening is free in wires and costs one bit of every downstream operator; saturation is free downstream and costs a mux.

**Cost is one XOR row plus an increment, and on FPGAs the XOR row is free.** The increment dominates: it is a degenerate [[Adders|adder]] whose second operand is the constant $s$, so it carries the same $O(w)$ carry chain and the same critical path, and the XOR row sits off that chain except through the LSB. On ASIC the incrementer is roughly half an adder — a row of half-adder cells — and the increment disappears entirely when the converter feeds an adder that has a spare carry-in, which is the same absorption trick [[Two's Complement Negator]] relies on. On FPGA the mapping is better still: each bit's LUT already has to compute the carry chain's propagate input, and $x_i\oplus s$ is a two-input function of signals that LUT is already fed, so the XOR row folds into the LUTs the increment was going to need anyway ([[FPGAs]]). The converter then costs one LUT and one hard-carry-chain bit per position — indistinguishable in area and delay from a bare increment.

> [!warning] The cost and delay above are derived here, not quoted
> ASA §2.1.4 gives the algorithm and the failing value but no gate count, no LUT count and no delay figure for this converter. The area and delay claims in the preceding paragraph follow from the structure and from the FPGA adder mapping discussed later in the book; they are not measured numbers.

**Where it is actually instantiated is floating point, and there the exceptional code cannot occur.** Sign-magnitude survives essentially nowhere in integer datapaths — two's complement wins on the strength of one adder serving both readings and on free [[Sign Extension]] — but it is the encoding of the IEEE-754 significand, where the sign is a separate field anyway ([[IEEE 754 Format]]). A floating-point adder that must subtract aligned significands either builds a sign-magnitude subtractor or converts both operands to two's complement, uses one ordinary adder, and converts the result back with this same block, whose output magnitude then feeds the [[Normalizers|normalizer]] ([[Floating-Point Operators]]). The back-conversion is safe there for a structural reason: the significand datapath is widened by guard bits before the subtraction, so the difference of two $p$-bit significands is bounded by $2^{p}-1$ and the extremal code $-2^{w-1}$ of the $w>p$-bit datapath is simply unreachable. The $-2^{w-1}$ hazard is a fixed-point-integer problem, not a floating-point one.

**Result.**

$$\boxed{\ T=\big(X\oplus\mu(s)\big)+s \bmod 2^{w},\quad \mu(s)=s\cdot(2^{w-1}-1),\quad s=x_{w-1},\quad \mathtt{invalid}=s\wedge\bigwedge_{i=0}^{w-2}\overline{x_{i}}\ }$$

**When it breaks.**

- **$X=10\ldots0$ read as two's complement.** $-2^{w-1}$ has no $w$-bit sign-magnitude image; the block returns $+0$ silently. This is the only failing input, and it is the same code that is $-0$ on the way in.
- **Chained conversions with no width growth.** The map is an involution off that one code, so round-tripping is lossless — but a round trip that passes through $10\ldots0$ collapses to $00\ldots0$ and stays there. Never assume a converter pair is transparent unless `invalid` is checked or the width was grown.
- **Equality and comparison across the boundary.** Sign-magnitude has two zeros, so a bitwise comparator disagrees with an arithmetic one on $\pm 0$; convert first, or special-case zero. This is one of the standing reasons the book gives for two's complement (p. 38).
- **Wide $w$ on the critical path.** The increment is a carry chain, so the converter inherits the adder's delay curve; past the point where a ripple chain stops closing timing, the fix is the adder's fix, not the converter's.
- **The sign-magnitude *value* is not what the sign bit says on a zero-magnitude word.** Any control logic that branches on $s$ alone treats $-0$ as negative. Branch on the pair $(s, M\neq 0)$.

**RTL (Spade).**

```spade
/// Conditional negate under the MSB. Sign-magnitude -> two's complement and
/// two's complement -> sign-magnitude are the same circuit: XOR the w-1
/// magnitude bits with the sign bit, leave the sign bit alone, add the sign bit.
fn sm_tc<#uint W>(x: uint<W>) -> uint<W> {
    let s = x.msb();
    let mag_ones: uint<{W - 1}> = ~(0 as uint<{W - 1}>);
    let mask: uint<W> = if s { zext(mag_ones) } else { 0 };
    let inc: uint<W> = zext(s.as_uint());
    (x ^ mask) +. inc
}

/// The one input the two's-complement -> sign-magnitude direction cannot
/// represent: the code 1 0...0, i.e. -2^(w-1).
fn sm_tc_invalid<#uint W>(x: uint<W>) -> bool {
    let mag_ones: uint<{W - 1}> = ~(0 as uint<{W - 1}>);
    let mag_mask: uint<W> = zext(mag_ones);
    x.msb() && ((x & mag_mask) == 0)
}
```

`mag_ones` is the drawing's mask generator: $2^{w-1}-1$, ones everywhere except the sign position, which is why `x ^ mask` leaves the MSB at $s$ and the sign wire crosses the XOR row untouched. `+.` is the **truncating** add, so the result stays $w$ bits and the carry-out is discarded — that discard *is* the $\bmod\,2^{w}$ in the boxed identity, and writing `+` instead would grow the word to $w+1$ bits and silently turn the wraparound into an exact sum. `inc` is the diagram's $c_\text{in}$, zero-extended from the same one-bit wire that feeds `mask`; both are `fn`, so the whole block is combinational with no clock and no state. Synthesis will not keep the XOR row as a separate stage: an FPGA tool absorbs it into the LUTs feeding the carry chain, and an ASIC tool re-maps the increment onto whatever incrementer the library's timing prefers.

**Related Notes (with context):**

- [[Two's Complement Negator]] – depends-on: the unconditional $\overline{X}+1$ that this note gates with the sign bit; the increment is absorbable into a downstream carry-in for exactly the same reason there.
- [[Signed Fixed-Point Format]] – depends-on: supplies $\mathrm{sfix}(w-1,0)$ and the negated MSB weight that makes the two encodings differ only on negative codes.
- [[Sign Extension]] – supports: prefixing the $0$ MSB that turns a $w-1$-bit magnitude into a $w$-bit non-negative two's-complement word is the zero-pad half of that rule.
- [[IEEE 754 Format]] – depends-on: the sign-magnitude significand, the one place the format survives and therefore the one place this converter is built in volume.
- [[Floating-Point Operators]] – extends: convert in, add once in two's complement, convert back — this block is both ends of that sandwich.
- [[Normalizers]] – depends-on: consumes the magnitude produced on the way out of a floating-point subtraction, and is why the output must be sign-magnitude at all.
- [[Adders]] – depends-on: the increment is a degenerate adder and inherits its carry chain, its delay model and its FPGA mapping.
- [[FPGAs]] – supports: the LUT-plus-hard-carry-chain structure that makes the XOR row cost nothing.
- [[Choosing a Number Format]] – compares: the price of this converter is one of the terms weighed whenever a format boundary is negotiable.
- [[Fixed-Point Format Narrowing]] – counter-example: the other way a format conversion loses information — gradually at the LSB by rounding, rather than catastrophically at one extremal code.
- [[Number Formats]] – supports: the topic, and the corrected sign-magnitude range.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 2 "Number Formats":

- §2.1.2 Two's complement, pp. 36–37 — Eq. (2.2) $\overline{X}=(2^{w}-1)-X$, Eq. (2.3) $-X=\overline{X}+1 \bmod 2^{w}$, Eq. (2.4) the negated-MSB weight.
- §2.1.3 Sign-magnitude representation, pp. 37–38 — Fig. 2.3 (both signed layouts on the same bit vector), Eq. (2.5), the two zeros, and the misprinted range corrected above.
- §2.1.4 Conversion between sign-magnitude and two's complement, p. 38 — the positive-code coincidence, both conversion directions, and the note that the second fails on $-2^{w-1}$.
