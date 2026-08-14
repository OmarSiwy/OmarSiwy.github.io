---
title: "High-Radix Carry-Save Adder"
description: "Carry-save with alpha-bit carry propagation inside each group: fewer redundant bits to register, longer critical path — a clean area/speed knob on the redundancy."
kind: circuit
source: "ASA §5.2.6, pp. 111-112"
status: seed
spade: simulated
tags: [digital, adder, carry-save, redundant, radix, fpga]
aliases:
  - "HRCS"
  - "High-Radix Carry-Save"
  - "High-Radix Carry-Save Addition"
  - "Hexadecimal Carry-Save Adder"
  - "Partial Redundant Form"
---

# High-Radix Carry-Save Adder

**One-line summary:** A carry-save adder that lets each carry ripple $\alpha$ bits before it is kept rather than stopping it at every bit, making the redundancy of the output — and with it the number of bits to be registered — a tunable parameter instead of a fixed factor of two.

```tikz title="High-radix carry-save adder: k independent alpha-bit carry-propagate adders, each keeping its carry-out as a redundancy bit rather than passing it to its neighbour"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize]

% ---- the k = 4 groups, MSB group on the left ----
\foreach \dx/\j/\jp in {0/3/4, 3.4/2/3, 6.8/1/2, 10.2/0/1} {
  \begin{scope}[xshift=\dx cm]

    % operand slices arriving from above
    \node[anchor=south] at (0.5,2.05) {$X_{\j}$};
    \node[anchor=south] at (1.3,2.05) {$Y_{\j}$};
    \node[anchor=south] at (2.15,2.05) {$z_{\j}$};
    \draw[thick,->] (0.5,2.0)  -- (0.5,0.95);
    \draw[thick,->] (1.3,2.0)  -- (1.3,0.95);
    \draw[thick,->] (2.15,2.0) -- (2.15,0.95);
    \node[anchor=east] at (0.47,1.5) {$\alpha$};
    \node[anchor=east] at (1.27,1.5) {$\alpha$};
    \node[anchor=west] at (2.18,1.5) {$1$};

    % the alpha-bit carry-propagate adder
    \draw[thick,fill=gray!10] (0.15,0.05) rectangle (2.45,0.95);
    \node at (1.3,0.5) {$+$};

    % kept carry-out, left; sum digit, middle
    \draw[thick,->] (0.4,0.05) -- (0.4,-0.95);
    \draw[thick,->] (1.6,0.05) -- (1.6,-0.95);
    \node[anchor=north] at (0.4,-1.0) {$c_{\jp}$};
    \node[anchor=north] at (1.6,-1.0) {$S_{\j}$};
    \node[anchor=east] at (0.37,-0.5) {$1$};
    \node[anchor=west] at (1.63,-0.5) {$\alpha$};

  \end{scope}
}

% ---- the point of the picture: nothing crosses a group boundary ----
\draw[dashed,gray] (2.95,-1.55) -- (2.95,2.5);
\draw[dashed,gray] (6.35,-1.55) -- (6.35,2.5);
\draw[dashed,gray] (9.75,-1.55) -- (9.75,2.5);
\node[anchor=south,align=center] at (6.35,2.55)
  {no carry crosses a dashed boundary: the critical path is one $\alpha$-bit
   addition, independent of $w=k\alpha$};

% ---- what the output pair means ----
\node[anchor=west,align=left] at (0,-2.35)
  {Digit $j$ of the result is $d_{j}=S_{j}+c_{j}$ at weight $2^{\alpha j}$
   (with $c_{0}=0$), so $d_{j}\in\{0,\ldots,2^{\alpha}\}$:\\
   $S+C=X+Y+Z$, with $S$ and $Z$ carrying $w$ and $k$ bits, $C$ carrying $k$ bits
   at weights $2^{\alpha},2^{2\alpha},\ldots,2^{k\alpha}$.};

\end{circuitikz}
\end{document}
```

*after Fig. 5.10, p. 112*

**Topic:**

**Read the architecture as one knob turned, not as a new circuit.** Take the $w$-bit ripple-carry chain of [[RCA, Ripple-Carry Adder]] and cut it every $\alpha$ bits, with $k=w/\alpha$ pieces. Cutting a carry chain is the only structural act here — everything else follows from where the severed carry goes. In an [[Carry-Select Adder|ordinary carry-select]] or prefix adder the severed carry is *recovered*, by speculation or by a prefix network, and the output is a plain binary number. Here it is simply **not recovered**: each cut carry is emitted as an output bit and the operator declares its result redundant. The two endpoints of the knob are already familiar circuits. At $\alpha=1$ every carry is cut, no carry propagates at all, and each group is a single full adder — that is exactly [[CSA, Carry-Save Adder]]. At $\alpha=w$ nothing is cut and the circuit is an ordinary carry-propagate adder with a lone carry-out. High-radix carry-save (HRCS) is the whole one-parameter family in between, and the book introduces it precisely as *"a variant of carry-save consisting in keeping $\alpha$-bit carry propagation, outputting carries every $\alpha$ bits only"* (p. 111).

**The value identity is inherited from carry-save unchanged; only the weights move.** Write the operands split into $k$ slices of $\alpha$ bits, $X=\sum_{j=0}^{k-1}2^{\alpha j}X_j$ and likewise $Y$, with each $X_j,Y_j\in[0,2^\alpha-1]$ — this regrouping is a change of radix and costs no logic at all, only a reading of the same wires (see [[Number Formats]]). Group $j$ computes the $(\alpha+1)$-bit quantity $X_j+Y_j+z_j$, and by **Euclidean division by $2^\alpha$** that quantity splits uniquely as

$$X_j+Y_j+z_j = 2^{\alpha}c_{j+1}+S_j,\qquad S_j\in[0,2^{\alpha}-1],\ c_{j+1}\in\{0,1\}$$

the quotient being one bit because the left side is at most $2(2^\alpha-1)+1=2^{\alpha+1}-1$. Multiplying each line by $2^{\alpha j}$ and summing over $j$ — the carries land at weight $2^{\alpha(j+1)}$ — gives

$$S+C = X+Y+Z,\qquad C=\sum_{j=0}^{k-1}2^{\alpha(j+1)}c_{j+1},\quad Z=\sum_{j=0}^{k-1}2^{\alpha j}z_j$$

which is Eq. (5.9) of the plain carry-save adder with the carry weights sparsened. Widths: $X,Y,S$ are $w$ bits; $Z$ and $C$ are $k$ bits each; the top carry $c_k$ sits at weight $2^{w}$ and is the overflow position. Note that $S+C$ is again an *unevaluated* sum — one of the two additions offered has genuinely been performed, the other has not, and that is the entire trade being made.

> [!important] The third input is $k$ bits wide, not $w$ — HRCS is not a 3:2 compressor
> A carry-save adder takes three full $w$-bit vectors and returns two, which is what makes it the atom of every [[Compressor Trees|compressor tree]]. HRCS does **not**: its third input $Z$ has one bit per group, at positions $0,\alpha,2\alpha,\ldots$ only, because those are the only carry-in slots the $\alpha$-bit adders left unused. Feeding it a dense third operand is impossible without adding hardware. This is why HRCS never appears inside a multiplier's reduction tree and always appears in a **feedback loop**, where the vector being fed back is the sparse carry vector the operator itself produced — the accumulator use in [[Exact Accumulators]] being the canonical one.

**The digit set follows from the weights and is minimally redundant.** Collect the outputs by weight rather than by wire. At weight $2^{\alpha j}$ sit the $\alpha$-bit slice $S_j$ and the single incoming carry $c_j$ produced by group $j-1$, so digit $j$ of the result is

$$d_j = S_j + c_j\in\{0,1,\ldots,2^{\alpha}\},\qquad c_0=0$$

a radix-$2^{\alpha}$ system whose digit set has $2^\alpha+1$ members — one more than a non-redundant radix-$2^{\alpha}$ digit set, and therefore the **smallest redundancy a redundant system can have** ([[Redundant Number Systems]]). The book calls this *partial redundant form* [FO01]; at $\alpha=4$ it is *hexadecimal carry-save*. Carry-save proper is the $\alpha=1$ case, digit set $\{0,1,2\}$, one spare value out of two — proportionally the most redundant member of the family. Every awkwardness of a redundant format is inherited in proportion: comparison and sign detection still require collapsing $S+C$ with a real carry-propagate addition first, because a large $d_j$ can still be cancelled by nothing further down, so the collapse is not cheaper than for carry-save. What HRCS buys is not easier comparison, it is fewer wires.

**Storage falls from $2w$ to $w+k$, and that is the whole point.** A number in carry-save form needs $2w$ bits; in radix-$2^\alpha$ carry-save it needs $w+k=w(1+1/\alpha)$. At $\alpha=4$ that is $1.25w$ instead of $2w$ — a 37.5 % reduction in **register** count, and registers are the currency the format is spent on, since a redundant intermediate exists to be clocked around a loop. The saving is superlinear in usefulness at small $\alpha$ and quickly saturates: going $\alpha=1\to2$ removes $w/2$ bits, $\alpha=4\to8$ removes only $w/8$. Past $\alpha\approx4$ you are paying real delay for very little register.

**What you pay is exactly $\tau_\mathrm{add}(\alpha)$, the RCA delay law evaluated at the group width.** Each group is an ordinary $\alpha$-bit carry-propagate adder, so by Eq. (5.7)

$$\tau_{\text{HRCS}}(\alpha) = \tau_\text{add}(\alpha) = (\alpha-1)\tau_\text{cp} + \max(\tau_\text{cp},\tau_\text{fa})$$

with $\tau_\text{cp}$ the carry-in-to-carry-out delay of a cell and $\tau_\text{fa}$ its input-to-output delay. Two checks that this is the right formula. At $\alpha=1$ it collapses to $\max(\tau_\text{cp},\tau_\text{fa})=\tau_\text{fa}$, the single-full-adder delay of carry-save — the family's fast end. At $\alpha=w$ it is the full $\tau_\text{add}(w)$ of an RCA. And crucially the expression contains **no $w$ and no $k$**: the groups are mutually independent, so widening the operator adds groups in parallel and costs nothing in delay. Area is unchanged from an RCA at $w$ full adders regardless of $\alpha$; only the wiring between them changes. So the knob trades a strictly linear delay term against a strictly hyperbolic register term, and the optimum is wherever the loop's clock period and its register budget happen to cross.

**On FPGA the delay side of the trade is nearly free, so push $\alpha$ hard.** The cut-every-$\alpha$-bits reasoning assumes $\tau_\text{cp}$ is comparable to a gate. On an FPGA it is not: the carry chain is hardened, and on Virtex 6 at the fastest speed grade $\tau_\text{cp}=0.015$ ns per bit against $\tau_\text{fa}=0.57$ ns — a factor of $38$ (pp. 126–127, [[FPGA Hard Carry Chain Adder]]). Substituting into the delay law, an $\alpha$-bit group costs $0.57+0.015(\alpha-1)$ ns, so going from $\alpha=1$ to $\alpha=16$ lengthens the critical path by about $0.23$ ns — roughly $40\,\%$ — while cutting the redundant bits from $w$ to $w/16$. On ASIC the same move would cost a factor of several in delay. The FPGA argument sharpens further: the group's carry chain must not straddle a placement boundary if $\tau_\text{cp}$ is to hold, so $\alpha$ wants to be a divisor of the device's natural chain granularity, and the LUTs feeding a hard carry chain are mostly idle anyway ([[FPGAs]]), meaning the group's operand logic is free.

**Collapsing back to binary is a full-width addition, not a cheap one.** The final conversion adds $S$ and $C$, and although $C$ has only $k$ non-zero positions, they are spread across the whole word, so a carry entering at position $\alpha$ can propagate to position $w$. The collapse therefore costs one $w$-bit carry-propagate adder — the same price carry-save pays. HRCS reduces neither the cost nor the latency of leaving the format; it reduces the cost of *staying* in it. That asymmetry is what confines it to iterative structures with many redundant steps and one exit, and is the same accounting that justifies carry-save in [[Multipliers]] and [[Dividers]].

**Result.**

$$\boxed{\ S+C=X+Y+Z,\quad d_j=S_j+c_j\in\{0,\ldots,2^{\alpha}\},\quad \text{storage } w+\tfrac{w}{\alpha}\text{ bits},\quad \tau=(\alpha-1)\tau_\text{cp}+\max(\tau_\text{cp},\tau_\text{fa})\ }$$

**When it breaks.**

- **$\alpha \nmid w$.** The top group is short, so its carry sits at weight $2^{w}$ anyway but the digit set of the top digit is smaller. Harmless arithmetically, a nuisance for any generic hardware description; pad $X$ and $Y$ to a multiple of $\alpha$ rather than special-casing.
- **You need a dense third operand.** As above: $Z$ is $k$ bits, so HRCS cannot stand in for a CSA in a reduction tree. Use a plain CSA or a [[Ternary Adders on FPGAs|ternary adder]].
- **You need comparison, sign or zero detection.** Still requires the full collapse. If the loop's control depends on the sign of the accumulated value every cycle, the redundant format has bought nothing and a plain CPA plus [[Parallel Prefix Adders|prefix tree]] is the honest answer.
- **$\alpha$ large enough that the group is on the critical path.** The delay is linear in $\alpha$ with no ceiling; once $\tau_\text{add}(\alpha)$ exceeds the loop's other logic, the register saving is being paid for in clock period. On ASIC that happens at small $\alpha$; on FPGA, not until $\alpha$ is tens of bits.
- **A single addition.** Every conversion cost is paid on the way out, so one HRCS followed by one collapse is strictly worse than one adder. The format only pays across many iterations before the exit.

**RTL (Spade).**

```spade
/// One alpha-bit group: a full alpha-bit carry-propagate addition whose
/// carry-out is KEPT as an output digit bit instead of being passed on.
fn hrcs_group<#uint A>(x: uint<A>, y: uint<A>, z: bool) -> (uint<A>, bool) {
    let zz: uint<{A + 1}> = zext(z.as_uint());
    let t: uint<{A + 1}> = trunc(x + y + zz);
    (trunc(t), t.msb())
}

/// w = 16, alpha = 4, k = 4: hexadecimal carry-save, the shape of Fig. 5.10.
/// Bit j of C is the carry out of group j, of weight 2^(4(j+1)).
fn hrcs16_4(x: uint<16>, y: uint<16>, z: uint<4>) -> (uint<16>, uint<4>) {
    let xb = x.as_bits();
    let yb = y.as_bits();
    let zb = z.as_bits();
    let (s0, c1) = hrcs_group::<4>(xb[0..4].as_uint(),   yb[0..4].as_uint(),   zb[0]);
    let (s1, c2) = hrcs_group::<4>(xb[4..8].as_uint(),   yb[4..8].as_uint(),   zb[1]);
    let (s2, c3) = hrcs_group::<4>(xb[8..12].as_uint(),  yb[8..12].as_uint(),  zb[2]);
    let (s3, c4) = hrcs_group::<4>(xb[12..16].as_uint(), yb[12..16].as_uint(), zb[3]);
    (s3.concat(s2).concat(s1).concat(s0), [c1, c2, c3, c4].as_uint())
}
```

`hrcs_group` is one grey box of the diagram: `x + y` widens to $A+1$ bits and adding the zero-extended `zz` widens again, so `trunc` back to $A+1$ is safe by the $2^{\alpha+1}-1$ bound derived above — `t.msb()` is then literally the Euclidean quotient $c_{j+1}$ and `trunc(t)` the remainder $S_j$. The slicing in `hrcs16_4` is where bit order can silently invert: `as_bits()` indexes from the LSB, so `xb[0..4]` is $X_0$, whereas integer `concat` puts its *left* argument high, which is why the reassembly reads `s3.concat(s2)...` and the carry array `[c1, c2, c3, c4]` reads the other way — element 0 of an array is the LSB. Both are `fn`, so the block is purely combinational with no clock; the registers that make the format worth having belong to the loop around it, not here. Synthesis will not preserve the four separate boxes as drawn — an FPGA tool maps each group onto a segment of one hard carry chain and simply declines to connect the segments, which is physically the same thing the drawing's dashed lines mean.

Verified with `.zettel/sim.sh`: **3008 vectors** (8 named, including $1+128$ and $128+1$ to catch operand or bit-order reversal, plus a 3000-vector random sweep) checked against the behavioural reference $S+\sum_j 2^{4(j+1)}c_{j+1} = X+Y+\sum_j 2^{4j}z_j$, zero failures. Reversing the `concat` order in `hrcs16_4` makes 2993 of them fail, so the check is load-bearing.

**Related Notes (with context):**

- [[CSA, Carry-Save Adder]] – extends: this is that circuit at $\alpha=1$; every identity here degenerates to Eq. (5.9) and $\tau_\text{fa}$ when the groups are one bit wide.
- [[RCA, Ripple-Carry Adder]] – depends-on: each group *is* an RCA, and its delay law (5.7) evaluated at $\alpha$ is the entire cost side of the trade.
- [[Redundant Number Systems]] – depends-on: supplies the digit-set framing; $\{0,\ldots,2^\alpha\}$ over radix $2^\alpha$ is the minimally redundant case.
- [[Exact Accumulators]] – supports: the loop this operator exists for, where the sparse carry vector is registered and fed back rather than collapsed.
- [[Number Formats]] – supports: the $w=k\alpha$ regrouping that makes the whole construction a change of radix and nothing more.
- [[Compressor Trees]] – counter-example: the place HRCS cannot go, because its third input is $k$ bits and a reduction tree needs a dense one.
- [[FPGA Hard Carry Chain Adder]] – counter-example: hardened carry logic makes $\tau_\text{cp}$ 38x smaller than $\tau_\text{fa}$, which moves the optimal $\alpha$ from small to large and reverses the ASIC intuition.
- [[Choosing an Adder]] – compares: where a redundant-output operator sits against the carry-propagate architectures it is not competing with.
- [[Multipliers]] – supports: the same stay-redundant-then-collapse-once accounting, with a dense CSA instead of a sparse one.
- [[Dividers]] – supports: the other classic loop where carry propagation is removed from the iteration rather than accelerated.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.2.6 Carry-Save Addition, pp. 111–112 — Eq. (5.9) $C+S=X+Y+Z$, Fig. 5.9 (the $\alpha=1$ carry-save adder), and the HRCS paragraph with Fig. 5.10, the *partial redundant form* name [FO01], the digit set $\{0,\ldots,2^\alpha\}$ footnote, and the area/speed framing pointing forward to Ch. 21.
- §5.2.1, p. 108 — Eq. (5.7), the ripple-carry delay law used here at width $\alpha$.
- §5.4.1–5.4.2, pp. 126–128 — the hardened carry-chain delays ($\tau_\text{cp}=0.015$ ns/bit, $\tau_\text{fa}=0.57$ ns on Virtex 6) that set $\alpha$ on FPGA.
- §2.3, p. 44 — the radix-$2^\alpha$ regrouping the construction reads the operands with.
