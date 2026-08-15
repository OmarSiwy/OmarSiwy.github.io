---
title: "Divide-by-Self Specialization"
description: "Replaces the divider in x/x by an all-zero/all-one exponent test driving a mux between 1.0 and NaN — cheap in hardware where it is not in software, and the mux pushes downstream."
kind: circuit
source: "ASA §15.7, pp. 470-472"
status: seed
spade: simulated
tags: [digital, floating-point-specialization, division, hls, ieee754]
aliases:
  - Divide by Self
  - x/x Specialization
  - Self-Division Specialization
---

# Divide-by-Self Specialization

A floating-point divider whose two operands are the same signal, reduced to a one-bit predicate on the exponent field selecting between the two values $x/x$ can take — the only "divider" here that contains no recurrence, no adder and, after logic optimization, no gates at all.

```tikz title="x/x times a: original, divider specialization, multiplier specialization"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex,
  blk/.style={draw,thick,fill=white,minimum width=0.62cm,minimum height=0.55cm,inner sep=1pt},
  w/.style={font=\tiny},
  lbl/.style={font=\small}]

%%%%%%%%%%%%%%%%%%%%%%%%%% (a) original %%%%%%%%%%%%%%%%%%%%%%%%%%
\begin{scope}[xshift=0cm]
  \node[lbl] at (-0.15,0.80) {$x$};
  \draw[thick] (0.10,0.80) -- (0.70,0.80);
  \node[w] at (0.40,0.98) {32};
  \draw[thick] (0.70,0.95) -- (0.70,0.65);
  \draw[thick,->] (0.70,0.95) -- (0.95,0.95);
  \draw[thick,->] (0.70,0.65) -- (0.95,0.65);
  \node[blk] at (1.25,0.80) {$/$};
  \draw[thick] (1.56,0.80) -- (1.85,0.80) -- (1.85,0.65);
  \draw[thick,->] (1.85,0.65) -- (2.10,0.65);
  \node[blk] at (2.41,0.50) {$\times$};
  \node[lbl] at (-0.15,0.00) {$a$};
  \draw[thick] (0.10,0.00) -- (1.85,0.00) -- (1.85,0.35);
  \draw[thick,->] (1.85,0.35) -- (2.10,0.35);
  \node[w] at (0.90,0.18) {32};
  \draw[thick,->] (2.72,0.50) -- (3.25,0.50);
  \node[w] at (3.00,0.68) {32};
  \node[lbl,align=center] at (1.60,-1.15) {(a) original\\ $(x/x)\cdot a$};
\end{scope}

%%%%%%%%%%%%%%%%%%%%%%%%%% (b) divider specialization %%%%%%%%%%%%%%%%%%%%%%%%%%
\begin{scope}[xshift=4.5cm]
  \fill[yellow!25,rounded corners=2pt] (0.55,-0.15) rectangle (2.42,1.62);
  \node[lbl] at (-0.15,1.35) {$x$};
  \draw[thick,->] (0.10,1.35) -- (0.60,1.35);
  \node[w] at (0.35,1.53) {32};
  \node[blk,minimum width=0.9cm] at (1.00,1.35) {\footnotesize test};
  \draw[thick] (1.45,1.35) -- (1.95,1.35);
  \draw[thick,->] (1.95,1.35) -- (1.95,0.92);
  \node[w] at (1.78,1.12) {1};
  % multiplexer
  \draw[thick,fill=white] (1.70,1.03) -- (2.20,0.78) -- (2.20,0.22) -- (1.70,-0.03) -- cycle;
  \node[lbl] at (1.05,0.78) {$1.0$};
  \draw[thick,->] (1.32,0.78) -- (1.70,0.78);
  \node[lbl] at (1.00,0.22) {NaN};
  \draw[thick,->] (1.32,0.22) -- (1.70,0.22);
  \draw[thick] (2.20,0.50) -- (2.60,0.50) -- (2.60,0.65);
  \draw[thick,->] (2.60,0.65) -- (2.85,0.65);
  \node[blk] at (3.16,0.50) {$\times$};
  \node[lbl] at (-0.15,-0.55) {$a$};
  \draw[thick] (0.10,-0.55) -- (2.60,-0.55) -- (2.60,0.35);
  \draw[thick,->] (2.60,0.35) -- (2.85,0.35);
  \node[w] at (1.20,-0.37) {32};
  \draw[thick,->] (3.47,0.50) -- (4.00,0.50);
  \node[w] at (3.75,0.68) {32};
  \node[lbl,align=center] at (1.90,-1.15) {(b) divider\\ specialization};
\end{scope}

%%%%%%%%%%%%%%%%%%%%%%%%%% (c) multiplier specialization %%%%%%%%%%%%%%%%%%%%%%%%%%
\begin{scope}[xshift=9.9cm]
  \node[lbl] at (-0.15,1.35) {$x$};
  \draw[thick,->] (0.10,1.35) -- (0.60,1.35);
  \node[w] at (0.35,1.53) {32};
  \node[blk,minimum width=0.9cm] at (1.00,1.35) {\footnotesize test};
  \draw[thick] (1.45,1.35) -- (1.95,1.35);
  \draw[thick,->] (1.95,1.35) -- (1.95,0.92);
  \node[w] at (1.78,1.12) {1};
  \draw[thick,fill=white] (1.70,1.03) -- (2.20,0.78) -- (2.20,0.22) -- (1.70,-0.03) -- cycle;
  \node[lbl] at (-0.15,0.78) {$a$};
  \draw[thick,->] (0.10,0.78) -- (1.70,0.78);
  \node[w] at (0.80,0.96) {32};
  \node[lbl] at (1.00,0.22) {NaN};
  \draw[thick,->] (1.32,0.22) -- (1.70,0.22);
  \draw[thick,->] (2.20,0.50) -- (2.75,0.50);
  \node[w] at (2.50,0.68) {32};
  \node[lbl,align=center] at (1.30,-1.15) {(c) multiplier\\ specialization};
\end{scope}

\end{circuitikz}
\end{document}
```

*after Fig. 15.9, p. 471.*

**Establish why the compiler is not allowed the obvious rewrite.** $x/x \to 1.0$ is not a valid transformation of a C program: the C standard lists it among the non-equivalences [StdC18], p. 471, because $x/x$ evaluates to NaN when $x$ is $\pm 0$, $\pm\infty$ or already NaN. A compiler may only fire the rewrite if it can *prove* $x$ avoids all three, and the arithmetic identity $\forall x \in \mathbb{R}\setminus\{0\},\ x/x = 1$ is no such proof — the IEEE-754 value set is not $\mathbb{R}$ ([[Number Formats]]). Nobody writes `x/x` by hand; it turns up as residue from code hoisting, procedure specialization and cloning [Muc97], which is exactly why the compiler, not the programmer, has to deal with it.

**Turn the illegal rewrite into a legal guard, then read the guard off the bit pattern.** The semantics-preserving version is a two-armed conditional, $P(x)\ ?\ \mathrm{NaN} : 1.0$, with the predicate

$$P(x) = \mathrm{isZero}(x) \vee \mathrm{isInf}(x) \vee \mathrm{isNaN}(x)$$

and the whole trick is that in a binary interchange format $\langle w_E, w_F\rangle$ all three disjuncts live in the exponent field. Writing $x$ as $s\,\Vert\,E_x\,\Vert\,F_x$ with $|E_x| = w_E$ and $|F_x| = w_F$ bits, the format's encoding rules give $\mathrm{isInf}(x)\vee\mathrm{isNaN}(x) \equiv (E_x = 2^{w_E}-1)$ — the two differ only in $F_x$, and both send $x/x$ to NaN, so the disjunction never needs to distinguish them. Zero is $E_x = 0 \wedge F_x = 0$. So

$$P(x) = \big(E_x = 0 \wedge F_x = 0\big) \vee \big(E_x = 2^{w_E}-1\big)$$

which for binary32 is a test on $8$ exponent bits plus a $23$-bit zero test, and for binary64 a test on $11$ plus $52$. Structurally each disjunct is one constant comparison, i.e. one reduction tree ([[Equality Comparator]]): an all-ones test is a $w_E$-input AND, an all-zeros test a NOR, each of depth $\lceil \log_k w_E \rceil$ on $k$-input LUTs. The sign bit is never examined — $x/x$ does not depend on it.

> [!important] The book's test is exact only in a subnormal-free format
> Fig. 15.9 and the surrounding text describe the test as "the exponent bits are all zeroes or all ones", $8$ bits for single and $11$ for double (p. 471). Dropping the $F_x = 0$ conjunct is correct in FloPoCo's format, which carries explicit exception bits and *has no subnormals*, so $E_x = 0$ means zero and nothing else. Under strict IEEE-754 it is wrong in the dangerous direction: a subnormal $x$ also has $E_x = 0$, yet $x/x = 1.0$ exactly, and the exponent-only guard would answer NaN. Making the guard IEEE-exact costs the $w_F$-input NOR — cheap, but not free, and the RTL below pays it. Subnormal handling is the same seam that §15.1.6 opens for the constant multiplier ([[Constant Multiplier with Subnormal Support]]).

**Explain why this is a hardware optimization and not a software one.** The book is explicit that no current compiler emits the guard, and the reason is the target: on a superscalar processor the three predicates are library calls or a chain of masks, compares and branches whose latency and misprediction risk can exceed a *pipelined* divider that the machine issues once and forgets. In hardware the comparison is a handful of gates on an $8$-bit field, while the thing it deletes is a full floating-point divider — a digit recurrence of roughly $w_F$ sequential steps plus quotient-digit selection, normalization and a rounding path ([[Dividers]]). The cost ratio is not close, and it is the *asymmetry* that flips, not the absolute cost of the test.

**Notice that the mux in panel (b) is not even a mux.** Both of its data inputs are synthesis-time constants, so its output is a bit-wise function of a single variable. For binary32, $1.0 = \mathtt{0x3F800000}$ and the canonical quiet NaN $\mathtt{0x7FC00000}$; their XOR is $\mathtt{0x40400000}$, so they differ in exactly two positions, bit $30$ and bit $22$. Every other bit takes the same value in both operands and is therefore a constant. The 32-bit result is

$$q \;=\; 0 \,\Vert\, P \,\Vert\, \underbrace{1\cdots1}_{7} \,\Vert\, P \,\Vert\, \underbrace{0\cdots0}_{22}$$

— a fan-out of the predicate wire and two constant rails. After the test, the specialized divider costs **zero gates**. Synthesis finds this on its own from the conditional; the drawing shows a mux because the mux is what the transformation *is*, not what it *costs*.

**Push the mux past the multiplier.** The reason this specialization is worth more than the divider it removes is that both of its outputs propagate. $1.0$ is the multiplicative identity and is exactly representable, so $\circ(1.0 \times a) = a$ bit-for-bit for every $a$ — no rounding, no ulp ([[Error Accuracy]]), and true for $\pm 0$, $\pm\infty$ and quiet NaN alike. NaN is absorbing: $\mathrm{NaN}\times a$ is NaN for every $a$. Case-splitting on $P$ therefore lets the multiplier be distributed into both arms of the conditional and then eliminated from each:

$$(x/x)\cdot a \;=\; \begin{cases}\mathrm{NaN}\times a = \mathrm{NaN} & P(x)\\ 1.0 \times a = a & \neg P(x)\end{cases}$$

which is panel (c): the *multiplier* disappears too, and what remains is a 32-bit 2:1 select between $a$ and a constant. With one operand constant each bit slice degenerates to a two-input gate — $\neg P \wedge a_i$ where the NaN bit is $0$, $P \vee a_i$ where it is $1$ — so $\mathtt{0x7FC00000}$ having nine set bits, the whole datapath is $9$ OR gates and $23$ AND gates fed by one predicate. On an FPGA all $32$ collapse into the LUTs already computing whatever produces $a$, or into the fabric's dedicated wide-mux inputs; on an ASIC they are $32$ two-input cells. Either way the mux keeps sinking until it reaches an operator for which $1.0$ is not an identity — $1.0 + a \neq a$ — and every operator it passes becomes a candidate for its own specialization.

$$\boxed{\ (x/x)\cdot a \;=\; \mathrm{mux}\big(P(x),\,\mathrm{NaN},\,a\big),\qquad P(x) = (E_x = 0 \wedge F_x = 0) \vee (E_x = 2^{w_E}-1)\ }$$

**When it breaks.**

- **Subnormals**, if you take the exponent-only test literally in an IEEE format — see the callout. Under a flush-to-zero regime the exponent-only test is correct again, because subnormals no longer exist as inputs.
- **Signalling NaN.** $P$ lumps sNaN with qNaN, but IEEE requires an sNaN operand to raise *invalid* and be quieted. The mux raises nothing. If the design has exception flags at all, they must be generated beside the mux; if it has none, the specialization has already left IEEE.
- **NaN payload.** $x/x$ for $x$ a NaN should propagate $x$'s payload under the standard's recommendation; the constant $\mathtt{0x7FC00000}$ does not. Bit-for-bit agreement with a software run — the whole point of a "safe" HLS optimization — needs the mux to select $x$ itself in that arm.
- **$x$ is not a single signal.** The rewrite needs syntactic identity of the two operands after the compiler's own aliasing analysis. Two numerically equal but distinct signals give $x/y$, and no amount of exponent testing helps.
- **The compiler can prove $x$ is normal.** Then $P \equiv \mathrm{false}$, the mux goes too, and the specialization is the trivial one. The circuit here is what you build when the proof fails, which in HLS is the usual case.
- **The sibling case.** When the divisor is a constant rather than the dividend itself, none of this applies and you want a genuine specialized divider instead ([[Floating-Point Divider by a Small Odd Constant]]).

**RTL (Spade).**

```spade
/// IEEE-754 binary32: sign(1) | exponent(8) | significand(23), index 0 = LSB.
/// True exactly when x/x is NaN, i.e. x is +/-0, +/-Inf or NaN.
fn div_self_test(x: uint<32>) -> bool {
    let e: uint<8>  = x.as_bits()[23..31].as_uint();  // biased exponent
    let m: uint<31> = x.as_bits()[0..31].as_uint();   // exponent | significand
    (m == 0) || (e == 255)
}

/// Fig. 15.9b: the divider, gone.
entity div_self(x: uint<32>) -> uint<32> {
    if div_self_test(x) { 0x7FC00000 } else { 0x3F800000 }
}

/// Fig. 15.9c: the multiplier too, because 1.0 * a == a exactly.
entity div_self_mul(x: uint<32>, a: uint<32>) -> uint<32> {
    if div_self_test(x) { 0x7FC00000 } else { a }
}
```

`div_self_test` is the `test` box; its `bool` result is the 1-bit select wire, and `m == 0` is the IEEE-exact zero test the figure's exponent-only version omits — dropping it and testing `e == 0` instead reproduces the book's subnormal-free variant exactly. `div_self` is panel (b) and `div_self_mul` panel (c); both are purely combinational, no `reg`, no clock, so the emitted module has no `clk_i` port. The two `entity` bodies read as 32-bit muxes, but synthesis will not build muxes: with both arms constant in `div_self` the netlist is wiring, and in `div_self_mul` it is 32 two-input gates, as derived above. Both entities were simulated against a behavioural reference over 11 named vectors — including the pair $\mathtt{0x00800000}$ (smallest normal, $\to 1.0$) and $\mathtt{0x00000100}$ (subnormal, $\to 1.0$), which are bit-reversals of each other and would diverge under a reversed field extraction — plus a 15000-vector random sweep biased toward the all-zero and all-one exponent corners; all 15011 passed.

**Related Notes**

- [[Floating-Point Operators]] – depends-on: the format decomposition $s\Vert E\Vert F$ and the special-value encodings the whole test reads.
- [[Dividers]] – compares: the digit-recurrence hardware this specialization deletes outright.
- [[Equality Comparator]] – supports: the all-zeros and all-ones constant comparisons are the only real logic here.
- [[Choosing a Specialized Floating-Point Operator]] – compares: where a zero-cost specialization sits against the ones that trade area for accuracy.
- [[Floating-Point Divider by a Small Odd Constant]] – counter-example: the other way a floating-point division collapses, when the *divisor* is known instead of the operands being identical.
- [[Floating-Point Multiplier by a Power of Two]] – extends: the same "the operation is entirely in the exponent field" argument, applied to multiplication.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §15.7 "Floating-Point Optimizations in an HLS Context", pp. 470-472; Fig. 15.9 p. 471 (the three panels above); the C-standard non-equivalence list p. 471; the "8 bits for single precision and 11 for double" cost argument p. 471.
- §15.1.6 subnormal support, pp. 462-464 — the format assumption behind the callout.
- [StdC18] ISO/IEC 9899:2018, *Programming languages — C*, cited p. 471 for the non-equivalences.
- [Muc97] Muchnick, *Advanced Compiler Design and Implementation*, Morgan Kaufmann 1997, cited p. 471 for code hoisting and procedure cloning as the source of `x/x`.
- [Ugu+20] cited p. 470 for the state of arithmetic optimization in mainstream HLS compilers.
