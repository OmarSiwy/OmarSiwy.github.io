---
title: Half Adder
description: "Full adder with one input known zero: XOR plus AND. Shaves the LSB cell of any adder with c0=0 and rewrites X+Y as S+C in one layer."
kind: circuit
source: "ASA §5.2.1, p. 107"
status: seed
spade: simulated
tags: [digital, adders, compressor, fpga]
aliases:
  - "HA"
  - "Half Adders"
  - "Half-Adder"
  - "Half Adder Cell"
---

# Half Adder

The half adder is the full-adder cell with its carry-in tied to zero, which reduces it to one XOR and one AND and makes it the only adder cell that cannot be chained.

```tikz title="Half adder: one XOR for the sum, one AND for the carry, with its truth table"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize]
  \node[xor port] (X) at (2.8,1.0) {};
  \node[and port] (A) at (2.8,-1.0) {};

  \draw (0,2.0) node[above] {$x_i$} -- (0,0 |- A.in 1);
  \draw (0.7,2.0) node[above] {$y_i$} -- (0.7,0 |- A.in 2);
  \draw (X.in 1) -- (X.in 1 -| 0,0);
  \draw (X.in 2) -- (X.in 2 -| 0.7,0);
  \draw (A.in 1) -- (A.in 1 -| 0,0);
  \draw (A.in 2) -- (A.in 2 -| 0.7,0);
  \node[circ] at (X.in 1 -| 0,0) {};
  \node[circ] at (X.in 2 -| 0.7,0) {};

  \draw[->] (X.out) -- (5.0,1.0) node[right] {$s_i = x_i \oplus y_i$};
  \draw[->] (A.out) -- (5.0,-1.0) node[right] {$c_{i+1} = x_i y_i$};
  \node[anchor=west,font=\scriptsize] at (5.0,0.6) {weight $2^i$};
  \node[anchor=west,font=\scriptsize] at (5.0,-1.4) {weight $2^{i+1}$};
  \node[anchor=west,font=\scriptsize] at (-0.5,-2.4) {every wire drawn is $1$ bit \quad|\quad $x_i + y_i = 2c_{i+1} + s_i$};

  \node[align=left,anchor=north west,font=\scriptsize] at (8.0,1.9)
    {$x_i\ \ y_i$ \ $\mid$ \ $c_{i+1}\ \ s_i$\\[1pt]
     \ 0\ \ \ 0\ \ $\mid$\ \ \ \ 0\ \ \ 0\\
     \ 0\ \ \ 1\ \ $\mid$\ \ \ \ 0\ \ \ 1\\
     \ 1\ \ \ 0\ \ $\mid$\ \ \ \ 0\ \ \ 1\\
     \ 1\ \ \ 1\ \ $\mid$\ \ \ \ 1\ \ \ 0};
  \draw (8.0,1.55) -- (10.1,1.55);
\end{circuitikz}
\end{document}
```

*after Fig. 5.4, p. 107, redrawn at gate level: the book gives the black box and the truth table only.*

**Kill one input of the full adder and two gates fall out.** The [[Full Adder]] computes $s_i=x_i\oplus y_i\oplus c_i$ (Eq. 5.2) and $c_{i+1}=x_ic_i\vee y_ic_i\vee x_iy_i$ (Eq. 5.3, p. 107). Substitute the constant $c_i=0$: in the sum, $0$ is the **identity element of XOR**, so $x_i\oplus y_i\oplus 0=x_i\oplus y_i$ (Eq. 5.5); in the carry, $0$ is the **annihilator of AND**, so $x_i\cdot 0=y_i\cdot 0=0$, and then $0$ is the **identity of OR**, so the three-term majority collapses to $c_{i+1}=x_iy_i$ (Eq. 5.6). Both are constant-input laws of [[Boolean Algebra]]; nothing else about the cell changes, and the truth table above is exactly the four rows of the FA's table with $c_i=0$. Every signal here is $1$ bit: $x_i$ and $y_i$ have weight $2^i$, the sum $s_i$ has weight $2^i$, and the carry $c_{i+1}$ has weight $2^{i+1}$ — which is the entire content of the identity $x_i+y_i=2c_{i+1}+s_i$.

**Both outputs are one gate deep and share the same support.** The FA needs two XOR levels for its sum and a majority network for its carry; the HA needs one XOR and one AND *in parallel*, so its input-to-output delay is a single gate for both outputs and there is no internal path left to optimise. That is why it is worth a distinct standard cell: in a library that ships several hand-tuned FA implementations for the sake of the $c_i\to c_{i+1}$ path (p. 107), the HA is the degenerate case where that path does not exist. On FPGAs the accounting differs, because the two outputs are two distinct functions and an $n$-input [[Lookup-Tables|LUT]] has one output — but both depend on the *same* two inputs, so a fracturable LUT (an AMD `LUT6_2` driving `O5`/`O6`, one half of an Intel ALM) yields both from a single physical LUT.

> [!warning] The source gives no area or delay figure for the HA
> The book states Eqs. 5.5–5.6 and stops; it never quantifies what replacing an FA with an HA saves, in gates, in LUTs or in picoseconds. The LUT-packing argument above is architectural reasoning from the fracturable-LUT structure, not a measured number. Treat any HA-versus-FA cost claim as needing a datasheet or a synthesis run.

**The name is literal: two half adders are a full adder.** Feed $x_i,y_i$ to one HA, giving $(c^a,s^a)$, then feed $s^a$ and $c_i$ to a second, giving $(c^b,s_i)$. The sum is correct by **associativity of XOR**, $s_i=(x_i\oplus y_i)\oplus c_i$, and the carry-out is $c_{i+1}=c^a\vee c^b$. The two carries are **mutually exclusive**: $c^a=1$ forces $x_i=y_i=1$, hence $s^a=0$, hence $c^b=0$. So that disjunction may equally be written as an XOR — a fact prefix-adder derivations lean on, since it lets a carry be assembled with the same operator as a sum. This is what "half" refers to, and it also shows that Eq. 5.3's majority is not an independent definition but a consequence of chaining two ANDs and an OR.

**Read the same cell the other way and it is a $(2,2)$ counter.** In bit-heap language a half adder consumes two bits of weight $2^i$ and produces one bit of weight $2^i$ plus one of weight $2^{i+1}$: it lowers one column's height by one at the price of raising the next column's by one. The total bit count is unchanged — $2$ in, $2$ out — whereas the full adder is a $(3,2)$ counter that genuinely destroys a bit. That asymmetry is why [[Compressor Trees]] use HAs sparingly and deliberately: an HA buys height, never bits, so it earns its place only when a column sits exactly one over the target height for the next stage, or when it shortens the final carry-propagate adder. Applied across a whole word, a row of $w$ independent HAs rewrites $X+Y$ as $S+2C$ — two $w$-bit vectors out, and **delay independent of $w$**, since no carry crosses a cell boundary. That is the two-input degenerate case of the [[CSA, Carry-Save Adder]]'s three-input row and it carries the same caveat: the result is redundant, and something downstream still pays for a real carry propagation ([[Sums of Weighted Bits]]).

**Where it actually appears inside an adder.** Wherever $c_0=0$ — the normal case outside a subtractor or a multi-word add — bit $0$ of a [[RCA, Ripple-Carry Adder]] has a constant input and degenerates to an HA; the book makes the point in the caption of Fig. 5.6, p. 109. The saving is one cell out of $w$, i.e. $O(1/w)$: a real win at $w=4$, noise at $w=32$. What it also buys is a marginally shorter first hop on the carry chain. The same substitution appears in [[Parallel Prefix Adders]]: with $c_0=0$ the bit-$0$ group generate is just $g_0=x_0y_0$ and the bit-$0$ sum is $x_0\oplus y_0$, which is precisely this cell. And an *incrementer* $X+1$ is nothing but a ripple chain of half adders, each cell adding $x_i$ to the carry arriving from below — the one case where HAs alone make a complete adder.

$$\boxed{\ s_i = x_i\oplus y_i,\qquad c_{i+1}=x_i\wedge y_i,\qquad x_i+y_i = 2c_{i+1}+s_i\ }$$

**When it breaks.**

- **It cannot be chained for general addition.** There is no carry-in port, so bit positions $1\ldots w-1$ must be full adders. An HA-only chain computes $X+1$, not $X+Y$.
- **$c_0$ is not always zero.** In a [[Two's Complement Adder-Subtractor]] the carry-in carries the `sub` flag, and in multi-word arithmetic it carries the previous word's carry-out; in both, the LSB cell stays an FA.
- **On an FPGA hard carry chain the saving vanishes.** The LSB position occupies a carry-chain slot and its LUT whether the logic in it is an HA or an FA, so the substitution frees nothing ([[FPGA Hard Carry Chain Adder]]).
- **Building an FA out of two HAs is a regression.** The decomposition above is a proof, not a recipe: it puts two gate levels on the $c_i\to c_{i+1}$ path, the one path a tuned FA cell exists to shorten.
- **In a compressor tree it does not reduce work.** Two bits in, two bits out. A heuristic that places HAs greedily makes the tree wider without making it shorter; the HA is a levelling tool, not a compression one.

**RTL (Spade).**

```spade
/// One half-adder cell: (carry-out, sum).  x + y = 2*cout + s.
fn ha(x: bool, y: bool) -> (bool, bool) {
    (x && y, x != y)
}

/// A row of W independent half adders, LSB first: X + Y = S + 2C, one gate deep.
fn ha_row<#uint W>(x: [bool; W], y: [bool; W]) -> ([bool; W], [bool; W]) {
    gen if W == 0 {
        ([], [])
    } else {
        let (c, s) = ha(x[0], y[0]);
        let (ct, st) = ha_row(x[1..W], y[1..W]);
        ([c].concat(ct), [s].concat(st))
    }
}
```

`ha` is the whole drawing: `x && y` is the AND gate and `x != y` is the XOR gate — `!=` and not `^`, because `^` is not defined on `bool` in Spade. The recursion in `ha_row` builds no chain, which is the point: the two returned arrays are $C$ and $S$ side by side, cell $i$ sees only $x_i,y_i$, and index $0$ of each array is the LSB. The factor $2$ of the identity is **not in the RTL at all** — weighting $C$ one position left is the caller's job, at the moment the two vectors are collapsed. Both items are `fn`, hence purely combinational: no clock, no state, and one gate of depth regardless of $W$. Synthesis keeps the row as drawn (there is nothing to restructure), but it will not honour the LSB-cell distinction where it would matter: given `x + y` with a constant-zero carry-in, an FPGA tool packs bit $0$ into the same carry-chain slot as every other bit.

**Related notes.**

- [[Full Adder]] – extends: the general cell; this is its $c_i=0$ restriction, and two of these are one of those.
- [[Boolean Algebra]] – depends-on: the identity and annihilator laws that do the whole reduction.
- [[RCA, Ripple-Carry Adder]] – supports: cell $0$ of any ripple chain with $c_0=0$.
- [[Parallel Prefix Adders]] – supports: with $c_0=0$, bit $0$'s generate and sum *are* this cell.
- [[Two's Complement Adder-Subtractor]] – counter-example: $c_0=\texttt{sub}$, so its LSB cell stays a full adder.
- [[Compressor Trees]] – compares: as a $(2,2)$ counter it levels a column without destroying a bit, unlike the $(3,2)$ full adder.
- [[CSA, Carry-Save Adder]] – compares: a row of these is the two-input degenerate carry-save row — same $w$-independent delay, same redundant result.
- [[FPGA Hard Carry Chain Adder]] – counter-example: hardened carry logic makes the one-cell saving exactly zero.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.2.1 The full adder and half adder cells, p. 107 — **Fig. 5.4** (HA black box and truth table), Fig. 5.3, Eqs. 5.2–5.6, and the remark on full-custom FA cells.
- §5.2.3, p. 109 — caption of Fig. 5.6: the FA taking a zero carry "can be replaced by a less expensive HA".
- §5.1.2, p. 105 — why the sum of two $w$-bit values needs $w+1$ bits, i.e. where $c_{i+1}$'s weight comes from.
