---
title: "Constant-One Sign Extension"
description: "Replaces the replicated sign bit of every signed summand with one complemented bit plus a compile-time constant, so the whole heap's signedness collapses to a single row of constant ones and some inverters instead of one fanout tree per summand."
kind: circuit
source: "ASA §7.2.2, pp. 162-163"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, sign-extension, twos-complement, bit-heap]
aliases:
  - Constant-One Trick
  - Constant 1 Trick
  - Sign Extension Trick
  - Efficient Sign Extension
---

# Constant-One Sign Extension

Sign extension performed inside a bit heap as one *complemented* bit per signed summand plus a single synthesis-time constant, so signedness costs the whole heap one row of constant ones instead of costing each summand a fanout tree.

```tikz title="A 4-bit signed by 4-bit unsigned partial-product heap, with naive sign extension and with the constant-one trick"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ================= (a) naive sign extension =================
  \node[anchor=west,font=\footnotesize] at (0.55,4.55)
    {(a) naive: every row fans its sign bit out to column 7};
  % \j / real-lo / real-hi / sign-lo   (sign region runs sign-lo .. 7)
  \foreach \j/\a/\b/\s in {0/0/2/3, 1/1/3/4, 2/2/4/5, 3/3/5/6} {
    \foreach \c in {\a,...,\b} \fill (-0.62*\c,{3.1+0.42*\j}) circle (2.6pt);
    \foreach \c in {\s,...,7}
      \draw[fill=white] (-0.62*\c,{3.1+0.42*\j}) circle (2.6pt);
  }
  \node[anchor=west,font=\footnotesize] at (0.55,3.95) {26 bits, $h_{\max}=4$};
  \node[anchor=west,font=\footnotesize] at (0.55,3.31)
    {$\circ$ = replicated $s_j=x_3y_j$, fanout $5-j$};
  \node[anchor=east,font=\footnotesize] at (-4.65,3.10) {$j=0$};
  \node[anchor=east,font=\footnotesize] at (-4.65,4.36) {$j=3$};

  % ================= the rewrite =================
  \node[font=\large] at (-2.17,2.42) {$\Downarrow$};
  \node[anchor=west,font=\footnotesize] at (-1.95,2.42)
    {$-2^{p}s \;\equiv\; 2^{p}\bar s + \sum_{i=p}^{q}2^{i} \pmod{2^{q+1}}$};

  % ================= (b) constant-one form =================
  \node[anchor=west,font=\footnotesize] at (0.55,1.85)
    {(b) one complemented bit per row, all constants merged};
  \foreach \j/\a/\b/\s in {0/0/2/3, 1/1/3/4, 2/2/4/5, 3/3/5/6} {
    \foreach \c in {\a,...,\b} \fill (-0.62*\c,{0.75+0.42*\j}) circle (2.6pt);
    \fill (-0.62*\s,{0.75+0.42*\j}) circle (2.6pt);
    \draw[very thick] (-0.62*\s-0.13,{0.90+0.42*\j}) -- (-0.62*\s+0.13,{0.90+0.42*\j});
  }
  \node[anchor=west,font=\footnotesize] at (0.55,1.25) {16 bits + 2 constants};
  \node[anchor=west,font=\footnotesize] at (0.55,0.61)
    {$\bar{\bullet}$ = $\overline{x_3y_j}$, fanout 1};
  % the single constant row: K = -(2^3+2^4+2^5+2^6) = 136 = 2^7+2^3 mod 2^8
  \foreach \c in {7,3}
    \node[draw,circle,inner sep=0.6pt,font=\tiny] at (-0.62*\c,0.28) {1};
  \node[anchor=west,font=\footnotesize] at (0.55,0.28)
    {$K=-(2^3{+}2^4{+}2^5{+}2^6)\equiv 2^7{+}2^3$};

  % ================= position axis =================
  \draw[->] (0.35,-0.20) -- (-4.85,-0.20);
  \foreach \c in {0,...,7} {
    \draw (-0.62*\c,-0.32) -- (-0.62*\c,-0.08);
    \node[anchor=north,font=\tiny] at (-0.62*\c,-0.36) {\c};
  }
  \node[anchor=west,font=\footnotesize] at (0.55,-0.20) {column (weight $2^c$), $q=7$};
\end{circuitikz}
\end{document}
```

*after Fig. 7.12, p. 162 and Fig. 7.13, p. 163.*

**Price the naive extension before replacing it.** A summand arrives as a two's-complement word whose sign bit $s$ occupies position $p$, and the heap it joins has MSB $q$, so the heap is an unsigned multiset of weighted bits read modulo $2^{q+1}$ ([[Bit Heaps]]). Making the summand's value correct at that width means replicating $s$ at every position from $p$ up to $q$ — that is $q-p+1$ weighted bits, all driven by one wire. Their contribution is the geometric sum

$$s\sum_{i=p}^{q}2^{i}=s\,(2^{q+1}-2^{p}),$$

and it is arithmetically right: at $s=1$ it equals $2^{q+1}-2^p\equiv-2^p$, which is exactly the negative weight the sign bit is supposed to carry. Nothing is wrong with the value. What is wrong is the structure — one signal now drives $q-p+1$ compressor inputs, and a $w\times w$ multiplier contributes $w$ summands each needing its own such tree.

**Replace the replicated bit with a complement plus a string of ones.** The classic trick from two's-complement multipliers, and the one Baugh and Wooley built their signed multiplier around: instead of $s$ at position $p$, add $\bar s$ at position $p$, and add a constant string of $1$s stretching from $p$ to $q$. Expanding with the complement identity $\bar s = 1-s$,

$$\bar s\,2^{p}+\sum_{i=p}^{q}2^{i}=(1-s)2^{p}+(2^{q+1}-2^{p})=2^{q+1}-s\,2^{p}.$$

Subtracting the naive expression leaves

$$\big(2^{q+1}-s2^{p}\big)-\big(s2^{q+1}-s2^{p}\big)=(1-s)\,2^{q+1}=\bar s\,2^{q+1}.$$

> [!important]
> The two forms differ by $\bar s\,2^{q+1}$, a bit that lands one column *above* the heap's MSB. The heap is evaluated modulo $2^{q+1}$, so that bit is discarded by the same truncation that makes two's complement work in the first place. The trick is not an approximation and not a special case — it is an equality in $\mathbb{Z}/2^{q+1}\mathbb{Z}$.

Checked at the two values of $s$: with $s=1$ the sum is $\sum_{i=p}^{q}2^i$, a solid vector of ones, which is the sign extension; with $s=0$ the sum is $2^{q+1}$, a single bit above the heap, i.e. zero.

**Read the same identity locally, with no modular reasoning at all.** A bit of *negative* weight satisfies, again by $\bar s = 1-s$,

$$-2^{p}s = 2^{p}\bar s - 2^{p},$$

an exact identity over $\mathbb{Z}$. Every negatively-weighted bit therefore becomes a positively-weighted *complemented* bit plus a compile-time constant $-2^{p}$. The row of ones in the first derivation is nothing but that constant written inside the heap's modulus: $\sum_{i=p}^{q}2^{i}=2^{q+1}-2^{p}\equiv-2^{p}$. This is the form to reason with, because it says the correction is one number, not one row per summand.

**Sum over every signed summand and the corrections collapse.** Summing the identity over all sign bits, at positions $p_1,\dots,p_m$,

$$V(\mathcal{B}_{\text{signed}})=V(\mathcal{B}^{+})+K,\qquad K=-\sum_{k=1}^{m}2^{p_k},$$

where $\mathcal{B}^{+}$ is a purely positive heap whose only change is $m$ complemented bits. Because $K$ is known at synthesis it is a constant bit vector, and constant bits merge: at most one constant bit per column survives, so the whole of $K$ is *one row* of the heap — not one row per signed summand. Half-ulp rounding constants merge into the same row for free ([[Truncated Bit Heap]]).

**Work the figure's instance.** Take $X$ a 4-bit signed integer times $Y$ a 4-bit unsigned integer. The product lies in $[-120,105]$, so 8 bits suffice and $q=7$, modulus $2^{8}$. Row $j\in\{0,1,2,3\}$ is $X\cdot y_j$ shifted left by $j$; its sign bit $x_3y_j$ sits at $p_j=3+j$ and would naively be replicated up to column 7 with fanout $5-j$. Naive dot count $8+7+6+5=26$. With the trick each row keeps 4 dots (three products plus one complemented bit), and

$$K=-\big(2^{3}+2^{4}+2^{5}+2^{6}\big)=-120\equiv 136 = 2^{7}+2^{3}\pmod{2^{8}},$$

so the entire constant row is two dots, at columns 7 and 3 — $16+2=18$ bits against 26, with no signal fanning out past its own column.

**Subtraction is this same statement.** Subtracting a summand means adding its bitwise complement, sign-extended by exactly the rule above, plus a constant $1$ at the subtrahend's LSB. That $1$ is another synthesis-time constant, so it merges into $K$ and costs nothing beyond the inverters.

**The inverters are usually free, which is the part that makes this a bargain.** The bit being complemented is itself the output of a gate. In a multiplier it is the AND $x_{w-1}y_j$, and complementing turns that AND into a NAND — in static CMOS a NAND2 is 4 transistors against 6 for an AND2, so the "cost" is negative. On a LUT-based FPGA the complement is absorbed into the truth table of the LUT that already produces the partial-product bit, so it is free there too ([[FPGAs]]). A real inverter appears only when the bit enters the heap from elsewhere — a register output, a table lookup — and even then it is one inverter per signed summand, against a buffer tree per signed summand.

$$\boxed{\ -2^{p}s = 2^{p}\bar s - 2^{p}\ \Longrightarrow\ V(\mathcal{B}_{\text{signed}})=V(\mathcal{B}^{+})+K,\quad K=-\!\!\sum_{\text{sign bits}}\!\!2^{p_k}\ \text{constant}\ }$$

**When it breaks.**

- The discarded term is $\bar s\,2^{q+1}$. It vanishes *only* because the heap is read modulo $2^{q+1}$. Any column above $q$ that you actually intend to keep — an accumulator sized not to wrap, a heap feeding a wider consumer — sees a spurious $2^{q+1}$ every time $s=0$. Fix $q$ first, apply the trick second.
- $K$ must be a synthesis-time constant. An adder/subtractor whose mode is a runtime signal does not qualify: its LSB $+1$ is a live bit and stays in the heap as a real dot with real fanout.
- Total dots fall, but a *column* can get taller. In the 4×4 instance above, column 3 goes from height 4 to height 5 once the constant lands there. Compression depth tracks $h_{\max}$, not the dot count, so re-check the tallest column rather than assuming the trick is free in delay ([[Compressor Trees]]).
- With exactly one signed summand there is nothing to merge — one row of ones replaces one row of $s$'s, identical dot count. The win is still real, but it is a fanout win, not an area win.
- With every summand signed and $p_k$ dense, $K$ can be as wide as the heap, i.e. a full extra row. That is the worst case the book bounds: "at most one row of constant ones".

**In Spade, as an explicit heap rather than a `*`.**

```spade
/// One partial-product row of a signed x unsigned bit heap.
/// Magnitude bits pass through; the sign bit is complemented.
fn ppr(x: int<4>, yj: bool) -> uint<4> {
    let b = x.as_bits();
    [b[0] && yj, b[1] && yj, b[2] && yj, !(b[3] && yj)].as_uint()
}

entity smul4(x: int<4>, y: uint<4>) -> int<8> {
    let yb = y.as_bits();
    let r0: uint<8> = zext(ppr(x, yb[0]));
    let r1: uint<8> = zext(ppr(x, yb[1]));
    let r2: uint<8> = zext(ppr(x, yb[2]));
    let r3: uint<8> = zext(ppr(x, yb[3]));
    // K = -(2^3 + 2^4 + 2^5 + 2^6) mod 2^8 = 136 = 0b1000_1000
    let k: uint<8> = 136;
    (r0 +. (r1 << 1) +. (r2 << 2) +. (r3 << 3) +. k).as_int()
}
```

`ppr` is one row of panel (b): three plain product dots at columns $j\dots j+2$ and the barred dot $\overline{x_3y_j}$ at column $j+3$ — note there is no sign extension anywhere in the body, the row is 4 bits wide and stays 4 bits wide. `k` is the constant row, its two set bits being columns 7 and 3. Every accumulation is `+.`, the *truncating* 8-bit add, and that truncation is literally the $\bmod\ 2^{q+1}$ that discards $\bar s\,2^{q+1}$; using the widening `+` would preserve the discarded bit and give the wrong answer. The block is purely combinational — no clock, no register. Synthesis will not build the four-deep adder chain the `+.` sequence implies: it will extract the 18 weighted bits and drop them into a compressor tree, folding `k` in as free constant inputs, which is the entire reason for writing the arithmetic this way instead of as `x * y`.

Simulated with `.zettel/sim.sh`: 3265 vectors — all 256 input combinations exhaustively, plus 3000 random and 9 named asymmetric cases (`x=-8, y=1` against `x=1, y=8` distinguishes the two ports) — against `$signed(x) * y`, zero mismatches. Forcing `k = 0` makes the same bench fail immediately, so the constant row is doing the work the derivation claims.

**Related notes.**

- [[Bit Heaps]] – depends-on: supplies the modulo-$2^{q+1}$ semantics and the constant-bit merging that makes $K$ collapse to one row.
- [[Fixed-Point Representations]] – depends-on: the two's-complement negative-MSB weighting this identity rewrites.
- [[Booth's Algorithm]] – compares: the other way to keep a signed multiplier's heap small, by halving the number of rows rather than by cleaning up each row's sign.
- [[Compressor Trees]] – supports: consumes the resulting positive heap; the trick's payoff is measured in its dot count and column heights.
- [[Truncated Bit Heap]] – extends: $K$ shares its row with the rounding half-ulp, so the two constants are budgeted together.
- [[Merged Multiply-Accumulate]] – extends: the accumulator input is one more signed summand, absorbed by the same $K$.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §7.2.1 "Managing Constant Bits", p. 161.
- §7.2.2 "Managing Signed Numbers", pp. 162-163, incl. Fig. 7.12 (dot transformation) and Fig. 7.13 (4-bit signed × unsigned multiplier heap).
- §7.2.2.1 "Subtracting a Number", p. 163.
