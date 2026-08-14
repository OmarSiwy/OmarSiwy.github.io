---
title: "AAM Carry-Select Adder"
description: "Carry-select whose selection is a ripple-carry adder on the fast chain instead of a mux tree: c_i = c_i^0 OR (~s_i AND c_i^1) fits one LUT5 per bit and gives single-cycle 256+ bit adders."
kind: circuit
source: "ASA §5.5.2, pp. 137-139"
status: seed
spade: simulated
tags: [digital, adder, carry, carry-select, fpga, prefix]
aliases:
  - AAM
  - AAM Adder
  - Add-Add-Multiplex Adder
  - Carry Computation Circuit
  - CCC
---

# AAM Carry-Select Adder

An add-add-multiplex adder is a [[Carry-Select Adder]] in which the group carries are resolved not by a mux tree in general logic but by a second ripple-carry adder riding the FPGA's dedicated carry chain, so the only general-fabric logic left is one LUT5 per output bit.

```tikz title="AAM carry-select architecture, w=16 bits, group size m=4"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,
  blk/.style={draw, thick, fill=white, minimum width=2.2cm, minimum height=0.8cm, align=center},
  fa/.style={draw, thick, fill=white, minimum width=0.9cm, minimum height=0.6cm},
  cr/.style={draw, thick, fill=white, minimum width=0.9cm, minimum height=0.55cm},
  mx/.style={draw, thick, fill=white, minimum width=1.6cm, minimum height=0.5cm},
  w/.style={font=\scriptsize, inner sep=1pt}]

% ---------------- stage 1 : the carry-select groups ----------------
\node[blk] (p3) at (0,6)    {$2\times$CPA$_4$};
\node[blk] (p2) at (4.3,6)  {$2\times$CPA$_4$};
\node[blk] (p1) at (8.6,6)  {$2\times$CPA$_4$};
\node[blk] (p0) at (12.9,6) {CPA$_4$};

\node at (0,7.6)    {$x_{15..12}\ \ y_{15..12}$};
\node at (4.3,7.6)  {$x_{11..8}\ \ y_{11..8}$};
\node at (8.6,7.6)  {$x_{7..4}\ \ y_{7..4}$};
\node at (12.9,7.6) {$x_{3..0}\ \ y_{3..0}$};
\foreach \cx in {0,4.3,8.6,12.9}{
  \draw[->] (\cx-0.6,7.35) -- (\cx-0.6,6.4);
  \draw[->] (\cx+0.6,7.35) -- (\cx+0.6,6.4);
  \node[w] at (\cx-0.85,6.95) {4};
  \node[w] at (\cx+0.85,6.95) {4};
}
\draw[<-] (p0.east) -- ++(1.1,0) node[right] {$c_{\mathrm{in}}$};

% ---------------- stage 2 : CCC, a 3-bit RCA on the fast chain -------
\draw[dashed] (-0.2,3.5) rectangle (10.6,4.5);
\node[w] at (10.2,3.75) {CCC};
\node[fa] (f3) at (0.45,4)  {FA};
\node[fa] (f2) at (4.75,4)  {FA};
\node[fa] (f1) at (9.05,4)  {FA};

\foreach \cx in {0,4.3,8.6}{
  \draw[->] (\cx+0.25,5.6) -- (\cx+0.25,4.3);
  \draw[->] (\cx+0.65,5.6) -- (\cx+0.65,4.3);
}
\node[w,anchor=west] at (0.8,5.42)  {$c^0_{16}\,c^1_{16}$};
\node[w,anchor=west] at (5.1,5.42)  {$c^0_{12}\,c^1_{12}$};
\node[w,anchor=west] at (9.4,5.42)  {$c^0_{8}\,c^1_{8}$};

\draw (13.5,5.6) -- (13.5,4) -- (9.5,4);
\node[w] at (11.6,4.22) {$c_4$};
\draw[->] (f1.west) -- (f2.east);
\draw[->] (f2.west) -- (f3.east);
\draw[->] (f3.west) -- (-1.75,4) node[left] {$c_{16}$};
\node[w] at (2.6,4.22) {1};
\node[w] at (6.9,4.22) {1};

% ---------------- stage 3 : carry recovery + select ------------------
\node[cr] (r3) at (0.45,2.6) {CR};
\node[cr] (r2) at (4.75,2.6) {CR};
\node[cr] (r1) at (9.05,2.6) {CR};
\foreach \cx in {0,4.3,8.6}{
  \draw[->] (\cx+0.45,3.7) -- (\cx+0.45,2.88);
  \draw (\cx+0.25,4.95) -- (\cx+1.3,4.95) -- (\cx+1.3,2.6) -- (\cx+0.9,2.6);
  \node[w] at (\cx+1.5,3.2) {2};
}
\node[w,anchor=east] at (0.35,3.2) {$\hat s_{16}$};
\node[w,anchor=east] at (4.65,3.2) {$\hat s_{12}$};
\node[w,anchor=east] at (8.95,3.2) {$\hat s_{8}$};

\node[mx] (m3) at (0,1.5)   {MUX};
\node[mx] (m2) at (4.3,1.5) {MUX};
\node[mx] (m1) at (8.6,1.5) {MUX};

\foreach \cx in {0,4.3,8.6}{
  \draw[->] (\cx-0.6,5.6) -- (\cx-0.6,1.75);
  \node[w,anchor=east] at (\cx-0.7,3.15) {$s^0\,s^1$};
  \node[w,anchor=east] at (\cx-0.7,2.7) {$4{+}4$};
  \draw[->] (\cx,1.25) -- (\cx,0.6);
}
\node at (0,0.35)   {$s_{15..12}$};
\node at (4.3,0.35) {$s_{11..8}$};
\node at (8.6,0.35) {$s_{7..4}$};
\draw[->] (12.3,5.6) -- (12.3,0.6);
\node at (12.3,0.35) {$s_{3..0}$};
\node[w,anchor=west] at (12.4,3) {4};

% select wiring: each recovered carry drives the group to its left
\draw[->] (13.5,4) -- (13.5,1.9) -- (9.75,1.9) -- (9.75,1.5) -- (9.4,1.5);
\draw[->] (9.05,2.325) -- (9.05,1.9) -- (5.45,1.9) -- (5.45,1.5) -- (5.1,1.5);
\draw[->] (4.75,2.325) -- (4.75,1.9) -- (1.15,1.9) -- (1.15,1.5) -- (0.8,1.5);
\node[w] at (10.5,2.1) {$c_4$};
\node[w] at (6.2,2.1)  {$c_8$};
\node[w] at (1.9,2.1)  {$c_{12}$};
\draw[->] (0.45,2.325) -- (0.45,1.9) -- (-1.75,1.9) node[left] {$c_{\mathrm{out}}$};

\node[anchor=west] at (-1.75,-0.35)
  {CCC: $\hat s_i=c^0_i\oplus c^1_i\oplus c_{i-4}$ \qquad CR: $c_i=c^0_i\vee\overline{\hat s_i}\,c^1_i$};
\end{circuitikz}
\end{document}
```

*after Fig. 5.30, p. 138.*

**Fix the partition and the candidate pair.** Split $w$-bit operands $x,y$ into $k=w/m$ groups of $m$ bits. Group $0$ gets a single $m$-bit CPA with the real $c_\text{in}$, so its sum $s_{m-1..0}$ ($m$ bits) and its carry-out $c_m$ (1 bit) are final immediately. Every other group $j\ge1$ gets two $m$-bit CPAs — one wired to carry-in $0$, one to carry-in $1$ — producing two $m$-bit sum candidates $s^0,s^1$ and two 1-bit carry candidates $c_i^0,c_i^1$ at the group boundary $i=(j+1)m$. That is the [[Carry-Select Adder]] verbatim; only what happens next differs.

**Read the candidate pair as a group generate/alive pair.** Carry-out is monotone in carry-in — feeding a $1$ into a group can never destroy a carry that a $0$ already produced — so the case $c_i^0c_i^1=10$ is impossible (Table 5.2, p. 139), leaving kill $00$, propagate $01$, generate $11$. Hence $c_i^0=G$ and $c_i^1=G\vee A$ for that group, and

$$c_i=c_i^0\vee c_{i-m}\,c_i^1\qquad\text{(Eq. 5.63)}$$

is exactly the prefix recurrence $c_i=G\vee A\,c_{i-m}$ of [[Parallel Prefix Adders]] at group granularity, because $G\vee(G\vee A)c=G\vee Ac$ by absorption. The carry-select first stage has therefore already computed the group prefix pair for free; the question is only how to run the recurrence across the $k-1$ boundaries.

> [!note]
> Eq. 5.63 is a **majority function in disguise**. With $10$ impossible, $c_i^0\vee c_{i-m}c_i^1=\mathrm{maj}(c_i^0,c_i^1,c_{i-m})$ on all reachable inputs — check the three rows. Majority-of-three with an incoming carry is precisely the carry-out of a **full adder**. So a plain ripple-carry adder fed the two candidate vectors, with carry-in $c_m$, propagates the group carries correctly on its own carry chain, one FA per boundary. That is the whole idea: the second stage is not new logic, it is `+`.

**Put the recurrence on the chain instead of in the fabric.** In an ordinary carry-select the $k-1$ boundary carries are resolved by muxes in general logic, and on an FPGA every such mux costs a LUT plus a routing hop — the routing, not the LUT, is what dominates (see [[FPGA Hard Carry Chain Adder]]). The **carry computation circuit (CCC)** replaces that mux chain with a $(k-1)$-bit RCA on the candidate vectors $[c^0]$ and $[c^1]$, carry-in $c_m$, which the synthesiser maps straight onto the hard carry chain at $\tau_\text{cp}\approx0.015$ ns/bit. The whole group-carry propagation then costs $k-1$ chain stages and zero general routing.

**Recover the carries from the CCC's sum bits.** The CCC's own carry-out at boundary $i$ already equals $c_i$, but only the *final* carry leaves the chain as a routable signal; the intermediate ones live inside it, and the outputs the BLEs actually expose are the sum bits. The CCC's sum at position $i$ is

$$\hat s_i=c_i^0\oplus c_i^1\oplus c_{i-m}=\begin{cases}c_{i-m}&\text{kill or generate}\\ \overline{c_{i-m}}&\text{propagate}\end{cases}\qquad\text{(Eqs. 5.64, 5.65)}$$

since $c_i^0\oplus c_i^1$ is $0$ in the kill and generate rows and $1$ in the propagate row. In Eq. 5.63 the term $c_{i-m}$ is guarded by the product $\overline{c_i^0}c_i^1$, i.e. it is only ever evaluated in the propagate case, where $c_{i-m}=\overline{\hat s_i}$; substituting a value into a product term is sound wherever that term's guard holds, so

$$c_i=c_i^0\vee\overline{\hat s_i}\,c_i^1\qquad\text{(Eq. 5.66)}$$

is an identity, not an approximation. This is the **carry recovery (CR)** block: one inverter, one AND, one OR, all of whose inputs — $c_i^0$, $c_i^1$, $\hat s_i$ — are ordinary fabric signals.

> [!warning] The book does not say why the chain's own carry-out is unusable for the intermediate boundaries, given that it equals $c_i$ exactly. The reasoning above (intermediate carry taps are internal to the chain, or expensive to drive onto general routing) is inference from the figure, which draws the top carry $c_{16}$ leaving the CCC directly while every lower boundary goes through a CR. Confirm against a specific family's BLE documentation before quoting it.

**Count the LUTs.** Per output bit above group $0$, the selection needs $s_i^0$, $s_i^1$ and the group's select carry; the select carry is itself $c^0\vee\overline{\hat s}c^1$ over three more signals. Merging CR and mux therefore takes 5 inputs and fits **a single LUT5 per output bit** (p. 139) — one fractured half-ALM or one 6-LUT on current parts. Area overall: $\approx2\times$ the CPAs of an [[RCA, Ripple-Carry Adder]] in stage 1, one $(k-1)$-bit adder in stage 2, and $w-m$ LUT5s in stage 3. On ASIC none of this pays: a mux tree costs a gate, not a routing hop, and a [[Kogge-Stone Tree]] beats both on depth.

**Size the groups by balancing two chains.** The critical path traverses one $m$-bit CPA chain, then the $(k-1)$-bit CCC chain, then one LUT5:

$$\tau\approx\big(m+\tfrac{w}{m}-1\big)\tau_\text{cp}+\tau_\text{LUT}+\tau_\text{route}$$

and $m+w/m\ge2\sqrt{w}$ by AM–GM with equality at $m=\sqrt{w}$, so the chain shrinks from $w$ stages to about $2\sqrt{w}$. At $w=256$ that is $\approx32$ stages instead of $256$; the fixed cost $\tau_\text{LUT}+\tau_\text{route}$ of the extra layer is what has to be amortised, which is why [NPP11] report a benefit only from **256 bits upward**. Below that, plain `+` on the hard chain wins outright.

**Pipeline it for free, or deepen the CCC.** Because every LUT in the design sits in a BLE whose flip-flop is otherwise idle, registering the stage boundaries costs almost nothing — the same argument that makes the [[Pipelined Ripple-Carry Adder]] attractive on FPGA — and [NPP11] find AAM uses resources comparable to that pipelined adder at equal speed, while keeping **single-cycle latency**. For $w$ in the thousands the CCC's own $O(k)$ chain becomes the bottleneck; [LPB19] replace it with full prefix networks ([[Brent-Kung Tree]], Han–Carlson, [[Kogge-Stone Tree]], [[Sklansky Tree]]) on 1024–8192-bit adders and report a *"quasi linear relationship between prefix tree complexity and performance"* — on FPGA, unlike ASIC, the trees rank predictably once the operands are huge.

$$\boxed{\ \hat s_i=c_i^0\oplus c_i^1\oplus c_{i-m}\ ,\qquad c_i=c_i^0\vee\overline{\hat s_i}\,c_i^1\ }$$

## When it breaks

- **Below $w\approx256$** the two extra logic layers cost more than the $w-2\sqrt{w}$ chain stages they save; use `+` and let the tool infer the chain.
- **On ASIC** the premise is gone: there is no privileged carry chain to hide the recurrence in, and a prefix tree gives $O(\log w)$ instead of $O(\sqrt{w})$.
- **The CCC is still linear** in the group count. At $w\ge1024$ replace it with a prefix network, or the $\sqrt{w}$ scaling reasserts itself.
- **Stage 1 is $\approx2\times$ area** and stage 3 adds $w-m$ LUTs; if the adder is not on the critical path this is pure waste.
- **It depends on the synthesiser cooperating** — the CCC must be inferred as a carry chain, not flattened into logic, and the two candidate CPAs must not be resource-shared back into one.
- **Nothing here changes the arithmetic**: the result is the exact $(w+1)$-bit sum, 0 ulp of error, with format questions left to [[Number Formats]] and [[Error Accuracy]].

## RTL (Spade)

```spade
/// m-bit CPA: returns {carry-out, sum} packed as uint<5>.
fn cpa4(x: uint<4>, y: uint<4>, cin: bool) -> uint<5> {
    let r: uint<5> = trunc((x + y) + zext::<1, 5>(cin.as_uint()));
    r
}
fn sum4(r: uint<5>) -> uint<4> { r.as_bits()[0..4].as_uint() }
fn cy(r: uint<5>) -> bool { r.as_bits()[4] }

/// AAM carry-select adder, w = 16, m = 4.
entity aam16(x: uint<16>, y: uint<16>, cin: bool) -> uint<17> {
    let xb = x.as_bits();
    let yb = y.as_bits();

    // stage 1: one CPA for group 0, two CPAs per group 1..3
    let g0 = cpa4(xb[0..4].as_uint(), yb[0..4].as_uint(), cin);
    let c4 = cy(g0);
    let g1_0 = cpa4(xb[4..8].as_uint(), yb[4..8].as_uint(), false);
    let g1_1 = cpa4(xb[4..8].as_uint(), yb[4..8].as_uint(), true);
    let g2_0 = cpa4(xb[8..12].as_uint(), yb[8..12].as_uint(), false);
    let g2_1 = cpa4(xb[8..12].as_uint(), yb[8..12].as_uint(), true);
    let g3_0 = cpa4(xb[12..16].as_uint(), yb[12..16].as_uint(), false);
    let g3_1 = cpa4(xb[12..16].as_uint(), yb[12..16].as_uint(), true);

    // stage 2: CCC = a 3-bit RCA on the candidate vectors, carry-in c4
    let cand0 = [cy(g1_0), cy(g2_0), cy(g3_0)].as_uint();
    let cand1 = [cy(g1_1), cy(g2_1), cy(g3_1)].as_uint();
    let ccc: uint<4> = trunc((cand0 + cand1) + zext::<1, 4>(c4.as_uint()));
    let sh = ccc.as_bits();

    // stage 3: carry recovery c = c0 | (~s & c1), then the select
    let c8  = cy(g1_0) || (!sh[0] && cy(g1_1));
    let c12 = cy(g2_0) || (!sh[1] && cy(g2_1));
    let c16 = cy(g3_0) || (!sh[2] && cy(g3_1));

    let s0 = sum4(g0);
    let s1 = if c4  { sum4(g1_1) } else { sum4(g1_0) };
    let s2 = if c8  { sum4(g2_1) } else { sum4(g2_0) };
    let s3 = if c12 { sum4(g3_1) } else { sum4(g3_0) };

    c16.as_uint().concat(s3).concat(s2).concat(s1).concat(s0)
}
```

`cpa4` is one CPA box in the diagram, returning carry-out and sum packed into `uint<5>` because Spade's `+` on `uint<4>` yields `uint<4+1>` and the extra bit *is* the carry — `cy` and `sum4` just split it. `cand0`/`cand1` are the two candidate vectors entering the CCC; element 0 of a Spade array is the **LSB**, so `[c_8, c_12, c_16]` is the correct chain order, and reversing it still compiles and still type-checks — only simulation catches it. The whole entity is combinational; `sh[3]`, the CCC's own carry-out, is deliberately unused, because `c16` comes from the CR exactly as in Fig. 5.30. Synthesis will not preserve this structure literally: a tool targeting an FPGA maps `cpa4` and the CCC onto carry chains and collapses each CR-plus-mux into the single LUT5 that the drawing shows as two boxes.

## Related Notes

- [[Carry-Select Adder]] – extends: identical first stage; AAM replaces its mux tree with a chain-resident RCA.
- [[FPGA Hard Carry Chain Adder]] – depends-on: the entire argument rests on the chain being an order of magnitude faster than general routing.
- [[Parallel Prefix Adders]] – compares: Eq. 5.63 is the prefix recurrence at group granularity, so the CCC is a linear prefix network in disguise.
- [[Kogge-Stone Tree]] – counter-example: minimum depth on ASIC, but on FPGA it loses to a chain until the operands reach thousands of bits, where [LPB19] put it back inside the CCC.
- [[Brent-Kung Tree]] – extends: one of the prefix networks substituted for the CCC's RCA at 1024–8192 bits.
- [[Pipelined Ripple-Carry Adder]] – compares: the alternative use of the same idle BLE flip-flops, at the cost of multi-cycle latency.
- [[Choosing an Adder]] – compares: where the $w\ge256$ crossover sits against every sibling.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §5.5 Fast adders on FPGAs — pp. 134–139; §5.5.2 Fast combinatorial adders, pp. 137–139 (Fig. 5.30, p. 138; Table 5.2 and Eqs. 5.63–5.66, p. 139)
- §5.5.1 Pipelined adders — pp. 135–137 (Fig. 5.29) for the resource comparison
- §5.3.2 Carry-select and §5.3.6 parallel prefix — pp. 114–123, for the first stage and for Eq. 5.63 read as a prefix recurrence
- §5.4 Adders on FPGAs — pp. 125–134, for $\tau_\text{cp}$ and the carry-chain model

Primary sources cited there: [DNP10] de Dinechin, Nguyen & Pasca, *Pipelined FPGA Adders* (FPL 2010); [NPP11] for the AAM architecture and the 256-bit crossover; [LPB19] for the prefix-network CCC variants at 1024–8192 bits.
