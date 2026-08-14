---
title: Signed DSP Multiplier Packing
description: "Same DSP-sharing trick for signed operands: the DSP pre-adder builds A_sign-extended + 2^k B, and the upper product is corrected by adding the single precomputed sign bit of the lower one."
kind: circuit
source: "ASA §8.4.1.2, pp. 224-226"
status: seed
spade: simulated
tags: [digital, multipliers, dsp, fpga, signed]
aliases:
  - Signed DSP Packing
  - Packing Signed Multiplications into One DSP
  - Signed Multiplier Packing
---

# Signed DSP Multiplier Packing

Two signed products sharing an operand extracted from one DSP multiplication, where signedness turns the operand packing from a wiring pattern into a real pre-addition and leaves the upper product short by exactly one unit.

```tikz title="Bit-field alignment for two signed 8-bit products packed into one 18x27 DSP with pre-adder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=0.30cm,y=0.52cm,font=\footnotesize]
  % field boundary guides
  \foreach \bb in {16,32}{\draw[gray!50,dashed] (-\bb,-1.6) -- (-\bb,10.3);}

  % --- X1 = A, sign-extended to 27 bits ---
  \draw (-27,9) rectangle (-8,10) node[midway,left=1.1cm] {};
  \node at (-17.5,9.5) {SE $A$};
  \fill[black!8] (-8,9) rectangle (0,10);
  \draw (-8,9) rectangle (0,10);  \node at (-4,9.5) {$A$};
  \node[anchor=east] at (-27.6,9.5) {$X_1$};
  \node[anchor=west,gray] at (0.6,9.5) {27 b};

  % --- X2 = 2^k B ---
  \draw (-27,7.4) rectangle (-24,8.4); \node[font=\tiny] at (-25.5,7.9) {SE};
  \fill[black!8] (-24,7.4) rectangle (-16,8.4);
  \draw (-24,7.4) rectangle (-16,8.4); \node at (-20,7.9) {$B$};
  \draw[densely dotted] (-16,7.4) rectangle (0,8.4); \node at (-8,7.9) {$0\cdots0$};
  \node[anchor=east] at (-27.6,7.9) {$X_2$};
  \node[anchor=west,gray] at (0.6,7.9) {27 b};

  % --- Y = C, sign-extended to 18 bits ---
  \draw (-18,5.8) rectangle (-8,6.8); \node at (-13,6.3) {SE $C$};
  \fill[black!8] (-8,5.8) rectangle (0,6.8);
  \draw (-8,5.8) rectangle (0,6.8); \node at (-4,6.3) {$C$};
  \node[anchor=east] at (-27.6,6.3) {$Y$};
  \node[anchor=west,gray] at (0.6,6.3) {18 b};

  % --- intermediate P (not observable) ---
  \draw[densely dashed] (-45,4.0) rectangle (-16,5.0); \node at (-30.5,4.5) {SE $P$};
  \draw[densely dashed] (-16,4.0) rectangle (0,5.0);   \node at (-8,4.5) {$P=A\times C$};
  \node[anchor=east] at (-45.6,4.5) {$P$};

  % --- intermediate 2^k Q (not observable) ---
  \draw[densely dashed] (-45,2.4) rectangle (-32,3.4); \node at (-38.5,2.9) {SE $Q$};
  \draw[densely dashed] (-32,2.4) rectangle (-16,3.4); \node at (-24,2.9) {$Q=B\times C$};
  \draw[densely dotted] (-16,2.4) rectangle (0,3.4);   \node at (-8,2.9) {$0\cdots0$};
  \node[anchor=east] at (-45.6,2.9) {$2^{k}Q$};

  % --- R = (X1+X2)*Y ---
  \draw[thick] (-45,0.6) rectangle (-32,1.6); \node at (-38.5,1.1) {SE $Q'$};
  \fill[black!18] (-32,0.6) rectangle (-16,1.6);
  \draw[thick] (-32,0.6) rectangle (-16,1.6); \node at (-24,1.1) {$Q'$};
  \fill[black!18] (-16,0.6) rectangle (0,1.6);
  \draw[thick] (-16,0.6) rectangle (0,1.6);   \node at (-8,1.1) {$P$};
  \node[anchor=east] at (-45.6,1.1) {$R$};
  \node[anchor=west,gray] at (0.6,1.1) {45 b};

  % bit ruler
  \draw[|-|] (-16,-0.5) -- (0,-0.5) node[midway,below] {$k=w_P=16$};
  \node[anchor=north] at (0,-0.9) {\tiny 0};
  \node[anchor=north] at (-16,-0.9) {\tiny 16};
  \node[anchor=north] at (-32,-0.9) {\tiny 32};
  \node[anchor=north] at (-44.5,-0.9) {\tiny 44};

  % the correction
  \node[anchor=west,font=\footnotesize] at (-45,-2.1)
        {correction: $Q=Q'+p_{w_P-1}$, one bit into the post-adder};
\end{circuitikz}
\end{document}
```

*After Fig. 8.12, p. 225. Dashed rows are intermediate values that never appear on a wire; "SE" marks sign extension.*

**Say why the unsigned concatenation stops working.** In [[Unsigned DSP Multiplier Packing]] the packed operand $X = A + 2^kB$ is a *wiring pattern*: the two fields occupy disjoint bit ranges and the addition never carries, so $X$ is the bit vector $B \Vert 0^{k-w_A} \Vert A$ and costs nothing. Signedness destroys that. A signed $A$ on $w_A$ bits only equals its own value inside a wider word if it is sign-extended, so bits $w_A \ldots k-1$ of $X$ must all carry $a_{w_A-1}$ — and those are exactly the bits the unsigned version filled with the zeros that kept $B$ clear of $A$. Once $A<0$ the extension runs into $B$'s field and the two operands genuinely have to be added. The DSP block already contains that adder: modern AMD and Intel blocks compute

$$R = (X_1 + X_2)\times Y$$

with a **pre-adder** in front of the hard multiplier ([[DSP Blocks]]), so the addition is free in area and free in the critical path, which is what makes the signed variant worth doing at all rather than just spending a second DSP.

**Assign the fields and pin every width.** Take the book's case: $A$, $B$, $C$ signed on $w_A = w_B = w_C = 8$ bits, one $18\times27$ DSP. Then

$$X_1 = \mathrm{sext}_{27}(A),\qquad X_2 = 2^{k}B,\qquad Y = \mathrm{sext}_{18}(C),\qquad k = w_P = w_A + w_C = 16$$

$X_1$ and $X_2$ are 27-bit (the pre-adder port), $Y$ is 18-bit, and $R$ is $27+18 = 45$ bits inside the DSP's 48-bit accumulator. By **distributivity of multiplication over addition**,

$$R = (A + 2^{k}B)\times C = \underbrace{A\times C}_{P} + 2^{k}\underbrace{B\times C}_{Q}$$

so one hard multiply carries both products, with $P$ signed on $w_P = 16$ bits and $Q$ signed on $w_Q = w_B + w_C = 16$ bits. Note the pre-adder does not overflow: $|X_1 + X_2| \le 2^{k}\cdot 2^{w_B-1} + 2^{w_A-1} < 2^{26}$, comfortably inside 27-bit signed range, and the general condition for that is $k + w_B \le 27$.

**Recover $P$ for free by reducing modulo $2^{w_P}$.** Because $k \ge w_P$, the term $2^kQ$ is $\equiv 0 \pmod{2^{w_P}}$, so $R \equiv P \pmod{2^{w_P}}$ and the low field of $R$ is the $w_P$-bit two's-complement encoding of $P$ ([[Number Formats]]) — sign and all:

$$P = R[w_P-1\ldots0] \tag{8.33}$$

This holds unchanged from the unsigned case, and it is the only part of the trick signedness leaves alone. The reason is worth stating: two's complement is a representation *modulo $2^n$*, so truncation to the low $n$ bits is exact for signed and unsigned alike.

**The upper field is short by the sign of $P$.** Write $P_u = P \bmod 2^{w_P}$ for the bit pattern in the low field. The **two's-complement identity** $P = P_u - 2^{w_P}p_{w_P-1}$ says a negative $P$ stores its value by borrowing $2^{w_P}$, and that borrow has to come from somewhere — here, from the field above:

$$R = P + 2^{w_P}Q = P_u + 2^{w_P}\bigl(Q - p_{w_P-1}\bigr)$$

so the field the hardware actually exposes is one unit low. The book reaches the same place from the picture rather than the algebra (pp. 225-226): the sign extension of $P$ overlapping $Q$ is a $w_Q$-bit vector, all bits equal to $p_{w_P-1}$, hence worth $p_{w_P-1}(2^{w_Q}-1)$, giving $Q' = Q + p_{w_P-1}(2^{w_Q}-1)$ and $Q = Q' - p_{w_P-1}(2^{w_Q}-1)$. The two routes agree because $-(2^{w_Q}-1) \equiv 1 \pmod{2^{w_Q}}$ — the two's-complement negation of all-ones is one. So the subtraction of a $w_Q$-bit constant collapses to an **increment**:

$$Q' = R[w_P+w_Q-1\ldots w_P],\qquad Q = Q' + p_{w_P-1} \tag{8.34, 8.37}$$

**Get the correction bit before the multiply, not after it.** Taking $p_{w_P-1}$ from $R$ itself would work but would put a second adder after the DSP; the point of the exercise is that a *one-bit* correction can ride the DSP's own post-adder, or be folded into $X_1$'s sign extension at essentially no cost (p. 226). That needs $p_{w_P-1}$ — the sign of $A\times C$ — computed from $A$ and $C$ directly. The book gives it as $a_{w_A-1}\oplus c_{w_C-1}$, which is the sign rule for a product and is correct whenever the product is nonzero.

> [!warning] Eq. (8.38) as printed is wrong on zero, and the failure is silent
> The XOR rule gives $p = 1$ when exactly one operand is negative — including when the *other* one is zero, where the true product is $0$ and $p_{w_P-1} = 0$. Simulating the naive version against a behavioural reference produces, among others, `a=0 b=1 c=-1 → q=0, expected -1` and `a=-128 b=0 c=0 → q=1, expected 0`: $Q$ is off by exactly one, for every vector with $A=0$ or $C=0$ and the surviving operand negative. $P$ stays correct, so the error hides in one of the two outputs. The guarded form is
> $$p_{w_P-1} = (a_{w_A-1} \oplus c_{w_C-1}) \wedge (A \ne 0) \wedge (C \ne 0)$$
> and costs two OR-reductions, roughly two LUT6 for 8-bit operands. The book also indexes the wrong operand — (8.38) reads $b_{w_A-1}\oplus b_{w_B-1}$, but $P = A\times C$, so the second sign bit is $C$'s, not $B$'s. Likewise (8.29) writes $R=(X_0+X_1)\times Y$ while (8.30)-(8.31) and Fig. 8.12 name the ports $X_1$ and $X_2$.

**Know when the packing is legal.** Three inequalities bound it. $w_C \le 18$ so $C$ fits the narrow multiplier port; $k + w_B \le 27$ so the pre-adder result fits the wide port; and $k \ge w_P = w_A + w_C$ so the two products do not overlap. Taking $k$ at its minimum, those collapse to $w_A + w_B + w_C \le 27$ with $w_C \le 18$ — three 8-bit operands use 24 of the 27 available bits, which is why 8-bit inference is the canonical customer ([[Quantization]]). Slack matters: choosing $k$ *larger* than $w_P$ leaves room to accumulate several results in the post-adder, and the vendor guidance is to take $k$ as large as the ports allow (p. 226). Going the other way — an $18\times18$ block asked to hold two $8\times8$ signed products — forces $k < w_P$, and then the overlapping low bits of $Q$ must be recomputed by a small LUT multiplier and subtracted out of $R$, which both restores $P$'s upper bits and cancels the carry that propagated into $Q$.

This is an FPGA-only idea. It buys nothing on an ASIC, where a multiplier is synthesised to the width you ask for and two $8\times8$ signed multipliers are simply cheaper than one $18\times27$; the trick exists because the FPGA's DSP is a fixed, indivisible, and *scarce* block, so the currency being saved is DSP count, not gates.

$$\boxed{\ R = (\mathrm{sext}(A) + 2^{k}B)\times C,\quad P = R[w_P-1\ldots0],\quad Q = R[w_P+w_Q-1\ldots w_P] + p_{w_P-1}\ }$$

## When it breaks

- **$A = 0$ or $C = 0$ with the other operand negative** — the unguarded XOR sign rule corrupts $Q$ by $+1$. Guard it, or read $p_{w_P-1}$ back out of $R$ and pay a post-multiply adder.
- **$w_A + w_B + w_C > 27$** (or $w_C > 18$) — the operands no longer fit the ports and the packing is simply unavailable; two DSPs, or [[Multiplier Tiling]].
- **$k < w_P$** — the products overlap, and the LUT-multiplier fixup eats most of the DSP you saved.
- **No shared operand** — the whole identity rests on $C$ appearing in both products. Three independent products, or two with nothing in common, do not pack at all.
- **Latency** — the pre-adder is a dedicated pipeline stage on AMD parts, free when you are pipelining and a real extra level of logic when you are not; and it consumes the D port, so it cannot simultaneously serve a symmetric-FIR pre-add.
- **Below roughly $4\times4$** the packing stops being the right answer even when it is legal: tiny multipliers are cheaper tabulated in LUTs than routed to a hard block (p. 224).

## RTL (Spade)

```spade
/// Two signed products P = A*C and Q = B*C from one DSP with pre-adder.
fn dsp_pack_signed(a: int<8>, b: int<8>, c: int<8>) -> (int<16>, int<16>) {
    let x1: int<27> = sext(a);              // X1 = A, sign-extended to the wide port
    let x2: int<27> = sext(b) << 16;        // X2 = 2^k B,  k = w_P = 16
    let x: int<27> = x1 +. x2;              // the DSP pre-adder; cannot overflow
    let y: int<27> = sext(c);               // Y = C on the 18-bit port
    let r = x * y;                          // hard multiplier

    let p: int<16>       = trunc(r);        // R[15..0]
    let q_prime: int<16> = trunc(r >> 16);  // R[31..16]

    // sign of A*C, precomputed — guarded against a zero operand
    let neg = (a.sign_bit() != c.sign_bit()) && (a != 0) && (c != 0);
    (p, if neg { q_prime +. 1 } else { q_prime })
}
```

`x1`/`x2`/`y` are the three DSP input ports of the diagram and `r` is its 45-bit output; the two `trunc`s are the slices $R[15\ldots0]$ and $R[31\ldots16]$, pure wire selections with no logic behind them. `+.` is used deliberately at both additions — the pre-adder because the bound $k+w_B\le 27$ proves the 28th bit is never needed, and the correction because $Q'+1$ is exact modulo $2^{w_Q}$ by the very identity that produced it. Everything here is combinational; synthesis will absorb `x1 +. x2`, `x * y` and the `+. 1` into a single DSP48E2 primitive with `PREADDINSEL`/`INMODE` set, and will register the boundaries you did not draw, so the real block is three or four cycles deep. Note `r >> 16` may lower to an arithmetic or a logical shift with no consequence: the 16 bits the choice affects are the ones `trunc` throws away.

Simulated against a behavioural signed reference: 68,546 vectors, zero failures — ten named asymmetric cases (including $1\times127$ vs $-128\times127$, and the $A=0,\,C=-1$ corner above), a 65,536-point sweep of all $(A,C)$ pairs with $B$ cycling, and 3,000 random triples.

## Related Notes

- [[Unsigned DSP Multiplier Packing]] – compares: the same packing without sign extension, where the pre-adder degenerates to concatenation and no correction bit exists.
- [[DSP Blocks]] – depends-on: supplies the pre-adder $R=(X_1+X_2)Y$ and the post-adder that absorbs the one-bit correction.
- [[Quantization]] – supports: 8-bit inference is where two products routinely share a weight, which is the only situation this pays for.
- [[Multiplier Tiling]] – counter-example: tiling spends *many* DSPs on *one* large product; packing spends one DSP on many small ones, and the two meet when the operands stop fitting the ports.
- [[Multipliers]] – compares: where this sits against building the two multipliers outright.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §8.4.1.2 "Signed Multiplication", pp. 224-226, eqs. (8.29)-(8.38) and Fig. 8.12, p. 225.
- §8.4.1.1 "Unsigned Multiplication", pp. 223-224, for the packing identity and Fig. 8.11.
- §8.4.1.3 "Extensions", p. 226, for $k > w_P$ accumulation and the too-small-DSP fixup.
