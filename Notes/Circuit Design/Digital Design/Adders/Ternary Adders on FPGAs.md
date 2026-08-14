---
title: Ternary Adders on FPGAs
description: "Spend the idle LUT layer on a carry-save row and let the hard chain collapse it: X+Y+Z in the same ALM count as a binary adder on Intel shared-arithmetic mode, up to 50 percent slower on AMD."
kind: circuit
source: "ASA §5.4.4, pp. 130-133"
status: seed
spade: simulated
tags: [digital, adders]
aliases:
  - Ternary Adder
  - Ternary Adders
---

# Ternary Adders on FPGAs

A three-input adder $S = X+Y+Z$ whose carry-save row is hidden inside the LUTs that an FPGA adder leaves unused, so the third operand costs no extra logic elements — a saving that does not exist in VLSI.

```tikz title="Generic ternary adder: a CSA row in the LUTs feeding an RCA on the hard carry chain"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,
  fa/.style={draw, rectangle, minimum width=1.7cm, minimum height=0.85cm, fill=white},
  ha/.style={draw, rectangle, minimum width=1.4cm, minimum height=0.8cm, fill=white}]

\draw[dashed, gray] (-1.20,2.05) rectangle (10.15,3.15);
\draw[dashed, gray] (-1.20,-0.55) rectangle (10.15,0.55);
\node[gray, anchor=east] at (-1.45,2.60) {CSA row: free LUTs};
\node[gray, anchor=east] at (-1.45,-0.30) {RCA: hard carry chain};

\foreach \i/\X in {3/0, 2/3, 1/6, 0/9} {
  \node[fa] (t\i) at (\X,2.6) {FA};
  \draw (\X-0.5,3.025) -- (\X-0.5,3.65) node[above] {$z_\i$};
  \draw (\X,3.025)      -- (\X,3.65)      node[above] {$y_\i$};
  \draw (\X+0.5,3.025)  -- (\X+0.5,3.65)  node[above] {$x_\i$};
  \node[fa] (b\i) at (\X,0) {FA};
  \draw[->] (\X,-0.425) -- (\X,-1.15) node[below] {$s_\i$};
  \draw[->] (\X+0.5,2.175) -- (\X+0.5,0.425);
}
\node[anchor=west] at (9.60,1.30) {$s'_0$};

\draw[->] (8.5,2.175) -- (8.5,1.65) -- (6.0,1.65) -- (6.0,0.425);
\node[anchor=south] at (7.60,1.68) {$c'_0$};
\draw[->] (5.5,2.175) -- (5.5,1.35) -- (3.0,1.35) -- (3.0,0.425);
\node[anchor=south] at (4.60,1.38) {$c'_1$};
\draw[->] (2.5,2.175) -- (2.5,1.05) -- (0.0,1.05) -- (0.0,0.425);
\node[anchor=south] at (1.60,1.08) {$c'_2$};
\draw[->] (-0.5,2.175) -- (-0.5,2.00) -- (-3.20,2.00) -- (-3.20,1.70);
\node[anchor=south] at (-1.90,2.02) {$c'_3$};

\draw[->] (9.0,0.95) -- (9.0,0.425);
\node[anchor=south] at (9.0,0.95) {$0$};

\foreach \i/\X in {0/9, 1/6, 2/3} {
  \pgfmathtruncatemacro{\j}{\i+1}
  \draw[->] (\X-0.85,0) -- (\X-2.15,0);
  \node[anchor=south] at (\X-1.5,0.03) {$c_\j$};
}
\draw[->] (10.45,0) -- (9.85,0);
\node[anchor=west] at (10.50,0) {$0$};

\node[ha] (h) at (-3.20,1.30) {HA};
\draw[->] (-0.85,0) -- (-3.20,0) -- (-3.20,0.90);
\node[anchor=south] at (-2.00,0.03) {$c_4$};
\draw[->] (-3.90,1.30) -- (-4.70,1.30) node[anchor=east] {$s_5\,s_4$};

\node[anchor=west] at (-5.60,4.25) {$X,Y,Z$: $w$ bits each \quad $S=X+Y+Z$: $w+2$ bits \quad $X+Y+Z=S'+2C'$};
\end{circuitikz}
\end{document}
```

*after Fig. 5.26a, p. 131; the half adder on the left is the $w=4$ instance of the two extra result bits, which the book's figure leaves dangling.*

**Collapse three operands into two by the full-adder identity, one column at a time.** Take $X,Y,Z$ unsigned and $w$ bits wide. For every bit position $i$ a [[Full Adder]] gives the arithmetic identity

$$x_i + y_i + z_i = 2\,c'_i + s'_i,\qquad
s'_i = x_i \oplus y_i \oplus z_i,\qquad
c'_i = x_i y_i \vee x_i z_i \vee y_i z_i .$$

The carry is the *majority* of the three bits and the sum is their parity — the two halves of the count $x_i+y_i+z_i \in \{0,1,2,3\}$ written in binary. Multiply the identity by $2^i$ and sum over $i$; by distributivity of multiplication over the place-value sum this reassociates into whole words:

$$\sum_i 2^i(x_i+y_i+z_i) = \sum_i 2^i s'_i + 2\sum_i 2^i c'_i
\quad\Longrightarrow\quad X+Y+Z = S' + 2C' .$$

$S'$ and $C'$ are both $w$ bits. Nothing propagates sideways in this layer — column $i$ never reads column $i-1$ — so its depth is one full adder regardless of $w$. That is the defining property of a [[CSA, Carry-Save Adder]] row, and the whole point: three vectors in, two vectors out, in constant time.

**Bound the output width before choosing the second layer.** $X+Y+Z \le 3(2^w-1) < 2^{w+2}$, so $S$ needs exactly $w+2$ bits. In the diagram those two extra bits come from the half adder that sums the top row's $c'_{w-1}$ with the bottom row's $c_w$; equivalently, zero-extend $S'$ and $2C'$ to $w+2$ bits and let one ordinary adder produce all of $S$. The second layer is a plain [[RCA, Ripple-Carry Adder]] and is where all the carry propagation lives.

**In VLSI this trade is a straight loss.** The circuit uses $2w$ full adders where a binary adder of the same output width uses about $w$, and the critical path is one FA longer than the binary adder's. Nothing is bought: an ASIC carry-save layer only pays when it is amortised over four or more operands, or reused across iterations of an accumulation, because there the tree depth $O(\log n)$ beats $n$ sequential adds. For $n=3$ the book is explicit that the FA count is identical to doing it the obvious way (p. 132) — the ternary adder is a *target-specific* optimisation, not an arithmetic one.

> [!important] The saving is not arithmetic — it is that the LUT has already been paid for
> An FPGA adder occupies one BLE per bit, and that BLE contains both a hard full adder *and* a 6-input LUT. The RCA uses the LUT for a single two-input function, $p_i = x_i \oplus y_i$, leaving four of its six inputs idle ([[LUT-Merged Adder]], [[Lookup-Tables]]). The CSA row is exactly the size of logic that fits in that hole. You are not adding hardware, you are stopping the waste of hardware you already instantiated.

**Intel: shared arithmetic mode makes the third operand exactly free.** The ALMs of Arria I/II/V and Stratix II–V carry a *shared arithmetic mode* built for this pattern; the CSA full adders map into the ALM LUTs and the RCA into the dedicated carry logic (Fig. 5.26b, p. 131). The result is that **a ternary adder consumes exactly as many ALMs as a binary adder of the same output width**, and is only slightly slower [Kum+13, p. 132]. Compare by *output* width, not input width — a binary adder that could hold $S$ needs $(w+2)$-bit operands anyway. Quartus infers the mapping from a plain `S <= X+Y+Z`, so on these families the optimisation costs nothing in source either. It was **dropped from Stratix 10 onward** (p. 132); on those parts the CSA row falls back to ordinary LUTs and the adder costs extra logic.

**AMD: the third input is free but the wire that carries $c'_i$ is not.** The mapping needs a 6-input LUT fracturable into two 5-input LUTs with shared inputs (Fig. 5.25a, p. 130), which is every Virtex 5–7, Spartan 6, Kintex 7, Artix 7, Zynq and UltraScale/+ part (p. 132). Count what each slice LUT must produce for column $i$: the majority $c'_i$, and the propagate of the second row, $p_i = s'_i \oplus c'_{i-1} = x_i \oplus y_i \oplus z_i \oplus c'_{i-1}$. Two functions of the same four inputs $\{x_i,y_i,z_i,c'_{i-1}\}$ — which is precisely what a fractured 6-LUT delivers, and why a non-fracturable LUT cannot host this. The catch is $c'_{i-1}$: it is produced in the *neighbouring* BLE's LUT, so it must leave the slice and come back through the **general routing fabric** (Fig. 5.26c, p. 131). Only the second row's carries ride the dedicated chain.

**Read the delay as a fixed term plus a per-bit term, and the AMD penalty explains itself.** Using the Virtex 6 figures of pp. 126–127, a binary adder costs $\tau_{\text{LUT}} + w\,\tau_{\text{cp}} + \tau_{\text{XOR}}$ with $\tau_{\text{cp}} = 0.015$ ns per bit against $\tau_{\text{LUT}} = 0.14\ldots0.32$ ns. The AMD ternary adder adds a second LUT evaluation *and* one general-fabric hop to the fixed term while leaving the $w\,\tau_{\text{cp}}$ term untouched. A constant penalty against a term that grows at 15 ps per bit is worst when $w$ is small — which is exactly the book's finding that at low word sizes a ternary adder is **up to 50 % slower than a binary one** (p. 132), and why the penalty fades as the word grows. AMD's tools will not infer this structure from HDL: instantiate the primitives yourself, or generate the core with [[FloPoCo]] (`flopoco target=virtex6 XilinxTernaryAddSub wIn=16`, p. 133).

**Negation is free on one vendor and costs bits on the other.** Complementing an operand is free in the LUT layer — the inversion is absorbed into the same truth table, so $X-Y+Z$, $X+Y-Z$ and $X-Y-Z$ cost no extra resources on AMD (p. 133). On Intel the negated forms are not inferrable from `S <= X-Y+Z`, so you invert the input(s) by hand and set the corresponding carry-in bit(s) to 1, applying the two's-complement identity $-Y = \bar{Y} + 1$ ([[Number Formats]]). Because the majority function $c'_i$ is defined bit-wise and knows nothing about sign, the sign extension of a complemented operand has to be materialised as real bits: the word must be **extended by one bit for $X-Y+Z$ and $X+Y-Z$, and by two bits for $X-Y-Z$**, consuming extra ALMs (p. 132).

**The LUT is only free once.** Everything that competes for the same idle inputs — a table lookup for a constant multiplier, an adder/subtractor select, a source multiplexer, partial-product generation (p. 129) — competes with the ternary row. If you have already spent the LUT in front of the chain on one of those, a third addend is no longer free and the mapping degrades to extra logic. That contention is the practical limit on how many of these "free" optimisations you can stack on one adder.

$$\boxed{\ X+Y+Z \;=\; \underbrace{(X \oplus Y \oplus Z)}_{S',\ w\text{ bits}} \;+\; 2\underbrace{\big(XY \vee XZ \vee YZ\big)}_{C',\ w\text{ bits}}\ \in\ [0,\,2^{w+2})\ }$$

with $\oplus,\wedge,\vee$ applied bitwise, and the ALM cost on Intel shared-arithmetic parts equal to that of a binary adder of $w+2$-bit output.

**Where it stops paying.**

- **Stratix 10 and later.** Shared arithmetic mode was removed; the CSA row now needs ordinary LUTs and the "free" claim is gone (p. 132).
- **Small words on AMD.** Up to 50 % slower than a binary adder, because the fixed routing penalty dominates $w \cdot 0.015$ ns. It is an area win at every width and a latency loss at small ones; the book gives no crossover width, so measure it on your part.
- **Four or more operands.** A second CSA layer has no second idle LUT layer to hide in, so the trick does not iterate. Past three operands the honest structure is a compressor tree feeding one [[FPGA Hard Carry Chain Adder]].
- **A LUT already spent.** Merging a constant-multiplier table or an operand mux in front of the same chain conflicts with the CSA row.
- **Negated forms on Intel.** One or two extra bits of word width per the rule above, so $X-Y-Z$ is measurably more expensive than $X+Y+Z$.
- **Non-fracturable LUTs.** The AMD mapping needs two outputs from one LUT; architectures without fracturing cannot host both $c'_i$ and $p_i$ in one BLE.
- **Signed operands.** $c'_i$ is a bit-level majority with no notion of sign, so signed inputs must be sign-extended to the full $w+2$ before the CSA row rather than after it.

**In Spade**, the two layers are two lines of bitwise algebra and one add.

```spade
/// S = X + Y + Z. One carry-save row, then one binary add.
fn ternary_add<#uint W>(x: uint<W>, y: uint<W>, z: uint<W>) -> uint<{W + 2}> {
    let s: uint<W> = (x ^ y) ^ z;                    // CSA sum vector S'
    let c: uint<W> = (x & y) | (x & z) | (y & z);    // CSA carry vector C'
    let sv: uint<{W + 2}> = zext(s);
    let cw: uint<{W + 2}> = zext(c);
    sv +. (cw << 1)                                  // the hard carry chain
}
```

`s` and `c` are the top row of full adders in the diagram, one bitwise expression per output; because they are pure bitwise operations the compiler emits no carry structure for them at all, which is the whole claim. `cw << 1` is the diagonal routing of every $c'_i$ into column $i+1$. The final `+.` is the bottom row: both operands are zero-extended to $W+2$ first, so the sum cannot overflow and the truncating add is exact — that zero-extension is what absorbs the diagram's half adder. Everything is combinational; there is no clock. Synthesis differs from the drawing in one way that matters: Quartus reads this as a single three-input add and infers shared arithmetic mode, while Vivado will build two independent adders and produce nothing like Fig. 5.26c unless you instantiate the primitives.

**Related notes.**

- [[CSA, Carry-Save Adder]] – depends-on: the top row is one CSA stage, and $X+Y+Z=S'+2C'$ is its defining identity.
- [[Lookup-Tables]] – depends-on: the entire saving is the four idle inputs of the 6-LUT in front of each hard full adder.
- [[FPGA Hard Carry Chain Adder]] – depends-on: the bottom row is exactly this, and it is what makes the two-layer split worth doing.
- [[LUT-Merged Adder]] – compares: same free-LUT budget, spent on a third addend here rather than on arbitrary logic.
- [[Full Adder]] – supports: the majority/parity pair the CSA row is built from.
- [[FloPoCo]] – supports: generates the AMD primitive-level netlist that Vivado will not infer.
- [[Multiple Constant Multiplication]] – extends: adder graphs built from ternary rather than binary adders shrink by roughly a third.
- [[Sign-Configurable Adder-Subtractor]] – extends: reuses this structure to get $-X-Y$, which a single carry-in cannot express.
- [[Choosing an Adder]] – compares: where the three-operand case sits against the binary siblings.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §5.4.4 "Ternary adders", pp. 130–133; Fig. 5.26, p. 131; Intel realisation §5.4.4.1 and AMD realisation §5.4.4.2, p. 132; FloPoCo hands-on box, p. 133.
- §5.4.3 "Merging extra functionality into an adder", pp. 129–130; Fig. 5.25, p. 130.
- §5.4.1–5.4.2, pp. 125–128, for the AMD and Intel carry-chain structures and the Virtex 6 delay figures.
