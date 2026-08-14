---
title: "NOR-NOR Network"
description: "The POS dual of NAND-NAND; correct and free in algebra, but slower in CMOS because NOR series-stacks the PMOS devices."
kind: circuit
source: "0.1) Boolean Algebra §Functional completeness, §Cost metrics, §Trade-offs — no book source"
status: seed
spade: simulated
tags: [digital, boolean-algebra, nor, cmos, logical-effort]
aliases:
  - NOR-NOR
  - NOR-NOR Logic
  - NOR-Only Logic
  - NOR-NOR Networks
---

# NOR-NOR Network

A two-level product-of-sums realized entirely from NOR gates: algebraically indistinguishable from the OR-AND network it replaces, and the slower of the two single-gate realizations on any static CMOS process.

```tikz title="Bubble pushing an OR-AND network into a NOR-NOR network, and the transistor stack that makes it the expensive choice"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \ctikzset{logic ports=ieee, logic ports origin=center}

  % ================= panel A: OR-AND, with a bubble pair inserted on each sum wire
  \node[or port] (O1) at (0,2.3) {};
  \node[or port] (O2) at (0,0) {};
  \node[or port] (O3) at (0,-2.3) {};
  \node[and port, number inputs=3] (A1) at (3.9,0) {};
  \draw (O1.in 1) -- ++(-0.9,0) node[anchor=east] {$a$};
  \draw (O1.in 2) -- ++(-0.9,0) node[anchor=east] {$b$};
  \draw (O2.in 1) -- ++(-0.9,0) node[anchor=east] {$a$};
  \draw (O2.in 2) -- ++(-0.9,0) node[anchor=east] {$c$};
  \draw (O3.in 1) -- ++(-0.9,0) node[anchor=east] {$b$};
  \draw (O3.in 2) -- ++(-0.9,0) node[anchor=east] {$c$};
  \draw (O1.out) -- ++(1.3,0) |- (A1.in 1);
  \draw (O2.out) -- ++(1.3,0) |- (A1.in 2);
  \draw (O3.out) -- ++(1.3,0) |- (A1.in 3);
  \foreach \g in {O1,O2,O3} {
    \draw[red!75!black, fill=white] ([xshift=0.42cm]\g.out) circle (0.11);
    \draw[red!75!black, fill=white] ([xshift=0.76cm]\g.out) circle (0.11);
  }
  \draw (A1.out) -- ++(0.8,0) node[anchor=south] {$f$};
  \node[font=\footnotesize, align=center] at (1.6,-3.7)
    {OR--AND (POS), $D=2$\\ insert $\overline{\overline{s_k}}$ on each sum wire (red)};

  % ================= transform arrow
  \draw[->, thick] (6.3,0) -- (8.0,0);
  \node[font=\footnotesize, anchor=south] at (7.15,0.12) {De Morgan};

  % ================= panel B: NOR-NOR
  \begin{scope}[xshift=10.6cm]
    \node[nor port] (M1) at (0,2.3) {};
    \node[nor port] (M2) at (0,0) {};
    \node[nor port] (M3) at (0,-2.3) {};
    \node[nor port, number inputs=3] (N1) at (3.9,0) {};
    \draw (M1.in 1) -- ++(-0.9,0) node[anchor=east] {$a$};
    \draw (M1.in 2) -- ++(-0.9,0) node[anchor=east] {$b$};
    \draw (M2.in 1) -- ++(-0.9,0) node[anchor=east] {$a$};
    \draw (M2.in 2) -- ++(-0.9,0) node[anchor=east] {$c$};
    \draw (M3.in 1) -- ++(-0.9,0) node[anchor=east] {$b$};
    \draw (M3.in 2) -- ++(-0.9,0) node[anchor=east] {$c$};
    \draw (M1.out) -- ++(1.3,0) |- (N1.in 1);
    \draw (M2.out) -- ++(1.3,0) |- (N1.in 2);
    \draw (M3.out) -- ++(1.3,0) |- (N1.in 3);
    \draw (N1.out) -- ++(0.8,0) node[anchor=south] {$f$};
    \node[font=\footnotesize, align=center] at (1.6,-3.7)
      {NOR--NOR, $D=2$\\ OR${}+{}$bubble is a NOR; AND with every\\
       input inverted is also a NOR\\ same 4 gates, same 6 literals};
  \end{scope}
  \node[font=\footnotesize] at (7.4,-5.1)
    {$f=(a+b)(a+c)(b+c)=\mathrm{MAJ}(a,b,c)$; every signal is 1 bit wide.};

  % ================= panel C: why the right-hand network is the slow one
  \begin{scope}[yshift=-9.8cm, xshift=1.6cm]
    \node[font=\footnotesize, anchor=south] at (1.0,3.7) {static CMOS NOR2};
    \draw (1.0,3.1) node[vcc]{} -- (1.0,2.6);
    \node[pmos] (P1) at (1.0,2.1) {};
    \node[pmos] (P2) at (1.0,0.7) {};
    \draw (P1.source) -- (1.0,2.6);
    \draw (P1.drain) -- (P2.source);
    \node[nmos] (N1) at (0.3,-1.1) {};
    \node[nmos, xscale=-1] (N2) at (2.0,-1.1) {};
    \draw (P2.drain) -- (1.0,-0.3) -- (0.3,-0.3) -- (N1.drain);
    \draw (2.0,-0.3) -- (N2.drain);
    \draw (N1.source) -- (0.3,-1.9) -- (2.0,-1.9) -- (N2.source);
    \draw (1.15,-1.9) node[ground]{};
    \draw (P1.gate) -- ++(-1.0,0) node[anchor=east] {$a$};
    \draw (P2.gate) -- ++(-1.0,0) node[anchor=east] {$b$};
    \draw (N1.gate) -- ++(-0.6,0) node[anchor=east] {$a$};
    \draw (N2.gate) -- ++(0.6,0) node[anchor=west] {$b$};
    \draw (2.0,-0.3) -- (3.9,-0.3) node[anchor=west] {$\overline{a+b}$};
    \node[font=\footnotesize, anchor=west] at (2.0,2.1) {$W_p=4$};
    \node[font=\footnotesize, anchor=west] at (2.0,0.7) {$W_p=4$};
    \node[font=\footnotesize, anchor=north] at (1.15,-2.7) {$W_n=1$ each};
    \node[font=\footnotesize, align=left, anchor=north west] at (5.3,3.1)
      {two PMOS \emph{in series} $\Rightarrow$ each must be $\gamma k=4$ wide\\
       to match a unit inverter, so $C_{in}=4+1=5$ per input\\
       and $g_{\mathrm{NOR2}}=5/3$ against $g_{\mathrm{NAND2}}=4/3$.\\
       NAND2 is the mirror image: NMOS in series ($W_n=2$),\\
       PMOS in parallel ($W_p=2$), $C_{in}=4$.\\
       Reference: unit inverter $W_p=2$, $W_n=1$, $C_{in}=3$.};
  \end{scope}
\end{circuitikz}
\end{document}
```

**Start from a product of sums, never from a sum of products.** The input to this transform is the two-level form of [[Two-Level POS Network]],

$$f=\prod_{k=1}^{p}s_k,\qquad s_k=\sum_{i=1}^{n_k}\ell_{k,i}$$

where each literal $\ell_{k,i}$ is a variable or its complement and every signal in the network — literal, sum term, output — is 1 bit wide. The transform below is an identity on *this* shape only. Handing it an SOP is the single most common way to build a network that computes $\bar f$ and to discover it in simulation rather than on paper.

**Double-negate the outer AND, then push one bar into each sum term.** By involution $x=\bar{\bar x}$ applied to the whole product, and then De Morgan $\overline{\prod_k s_k}=\sum_k\overline{s_k}$ extended to $p$ terms by induction on the two-variable law:

$$f=\prod_{k}s_k=\overline{\overline{\prod_{k}s_k}}=\overline{\sum_{k}\overline{s_k}}$$

Read the right-hand side gate by gate. The inner $\overline{s_k}=\overline{\sum_i \ell_{k,i}}$ is an $n_k$-input NOR of the literals of $s_k$ — one gate, exactly where the OR gate was. The outer bar sits over a sum of $p$ signals, which is a $p$-input NOR — one gate, exactly where the AND gate was. **Every OR becomes a NOR, the AND becomes a NOR, and nothing else changes**: $p+1$ gates, depth $2$, and the same literal count $\sum_k n_k$. No inverter is created and none is destroyed. This is the mirror of the NAND-NAND transform on the SOP side ([[NAND-NAND Network]]); the two are the same manipulation read through the principle of duality.

**Completeness is what licenses the exercise at all.** $\{\text{NOR}\}$ is functionally complete, with $a\downarrow b\equiv\overline{a+b}$:

$$\overline{a}=a\downarrow a,\qquad a+b=\overline{\overline{a+b}}=(a\downarrow b)\downarrow(a\downarrow b),\qquad ab=\overline{\bar a+\bar b}=(a\downarrow a)\downarrow(b\downarrow b)$$

the last step by De Morgan again. So any AND-OR-NOT netlist can be rewritten in NOR alone — but note the price paid by that route: each substitution costs a level, so a naive gate-by-gate replacement doubles depth. The two-level transform above is the reason to care, because it is the one that costs nothing. $\{\text{NAND}\}$ and $\{\text{NOR}\}$ are the only two single-operator complete sets among the sixteen binary functions.

**Work it on the carry-out, where both duals are minimal.** The majority function is self-dual: $f^{D}$, obtained by swapping every $\cdot$ with $+$ without touching the literals, is

$$f=ab+ac+bc \quad\Longrightarrow\quad f^{D}=(a+b)(a+c)(b+c)=f$$

so the minimal SOP and the minimal POS of a full adder's $c_{out}$ are the *same expression written twice*, both with $6$ literals and $3$ terms. Applying the transform gives

$$c_{out}=\big(\overline{a+b}\big)\downarrow\big(\overline{a+c}\big)\downarrow\big(\overline{b+c}\big)$$

three NOR2 into one NOR3: $4$ gates, $6$ literals, depth $2$ — digit for digit the tally the NAND-NAND realization of the SOP produces. On paper the two networks are indistinguishable, which is precisely why the choice has to be made on the technology and not on the algebra.

**The algebra is free; the silicon is not.** A static CMOS gate is an NMOS pull-down network realizing $\bar f$ and its series-parallel dual in PMOS pulling up ([[CMOS Logic Gates]]). For NOR-$k$ the pull-down is $k$ NMOS in **parallel** and the pull-up is $k$ PMOS in **series**; NAND-$k$ is the mirror image. A series stack of $k$ devices has $k$ times the resistance of one, so each must be $k$ times wider to hold the worst-case drive constant. Take the standard reference sizing: mobility ratio $\gamma=\mu_n/\mu_p=2$, unit inverter $W_p=2$, $W_n=1$, input capacitance $C_{in}=3$. Then

$$C_{\text{NOR-}k}=\gamma k+1=2k+1,\qquad C_{\text{NAND-}k}=k+\gamma=k+2$$

per input, and dividing by the inverter's $3$ gives the logical efforts $g_{\text{NOR-}k}=(2k+1)/3$ against $g_{\text{NAND-}k}=(k+2)/3$: $5/3$ vs $4/3$ at $k=2$, $7/3$ vs $5/3$ at $k=3$, $3$ vs $2$ at $k=4$. The gap widens with fan-in because the NOR grows at $2/3$ per input and the NAND at $1/3$. Parasitic delay, by contrast, is *identical*: both gates dump $3k$ units of diffusion on the output node ($1\times 2k$ plus $k\times 1$ for the NOR, $k\times 2$ plus $1\times k$ for the NAND), so $p_{\text{NOR-}k}=p_{\text{NAND-}k}=k$ in inverter units. **The entire penalty is input capacitance, not output loading.**

**Put both majority networks through the same delay model and the penalty shrinks.** Path logical effort multiplies along the two stages: $G_{\text{NOR}}=(5/3)(7/3)=35/9$ against $G_{\text{NAND}}=(4/3)(5/3)=20/9$, a ratio of $1.75$. But delay is $D=N\hat f+P$ with $\hat f=(GBH)^{1/N}$, so that ratio is taken to the $1/N$ power and then added to a parasitic term the two networks share. Each primary input drives two first-level gates, giving branching $B=2$; with $N=2$ stages and $P=p_2+p_3=5$:

| | $G$ | $\hat f$ at $H=1$ | $D$ at $H=1$ | $D$ at $H=16$ |
| --- | --- | --- | --- | --- |
| NAND-NAND | $20/9$ | $2.11$ | $9.2\tau$ | $21.9\tau$ |
| NOR-NOR | $35/9$ | $2.79$ | $10.6\tau$ | $27.3\tau$ |

$15\%$ at unit load, $25\%$ at a fanout of $16$, and asymptotically $\sqrt{35/20}=1.32$ as $H\to\infty$ and the shared parasitic term stops mattering. So the honest statement is not "NOR is $1.75\times$ slower" — it is that a two-level NOR network costs between nothing and about a third of a stage delay, depending entirely on how hard it is driving.

> [!important] The ranking is a property of the device pair, not of the logic.
> NOR-NOR is not slower because the transform is worse. Both transforms are exact and cost-free. It is slower because static CMOS builds its pull-up from the low-mobility device and NOR puts those devices in series — a process parameter, $\gamma$, leaking into a logic decision. Change the circuit family so that the PMOS stack disappears and the ranking flips outright.

**Where it flips.** In dynamic and domino logic there is no PMOS stack: a single clocked precharge transistor pulls the node high, and only the NMOS network's topology matters. NOR's pull-down is the parallel one, so a wide dynamic NOR is the *fastest* wide-fan-in structure available and is how address decoders, comparator match lines and CAM arrays are built — while dynamic NAND-$k$, with its series NMOS, is the one that dies with fan-in. Pseudo-NMOS is the same argument with a resistive rather than clocked pull-up, and the classic PLA is literally a NOR-NOR array for exactly this reason: both planes are parallel NMOS pull-downs sharing one pull-up per line, so both AND-plane and OR-plane are drawn as NORs and the "AND" plane is a NOR fed with complemented literals.

**On an FPGA the question does not exist.** A $k$-input lookup table implements any function of $k$ variables at a cost of one LUT and a depth of one, so a NOR2 and a NOR6 cost the same, and so do their NAND duals ([[Lookup-Tables]], [[FPGAs]]). Neither literal count nor gate polarity survives technology mapping; what the mapper minimizes is the number of $\le k$-support cones. Running this transform before FPGA synthesis changes nothing in the netlist that comes out.

$$\boxed{\ f=\prod_{k=1}^{p}s_k=\overline{\sum_{k=1}^{p}\overline{s_k}},\qquad \overline{s_k}=\overline{\sum_i \ell_{k,i}}\ \ \text{(both bars are NOR gates)},\qquad g_{\text{NOR-}k}=\frac{2k+1}{3}>\frac{k+2}{3}=g_{\text{NAND-}k}\ }$$

**When it breaks**

- **Feed it an SOP and it computes the complement.** Level-1 NORs with complemented literals do give the products, $\overline{\sum_i\overline{\ell_i}}=\prod_i \ell_i$, but the level-2 NOR then yields $\overline{\sum_k c_k}=\bar f$. Recovering $f$ costs one inverter per input plus one on the output, and adds a level. If you wanted $\bar f$ anyway — a `full` flag, an active-low enable — take the complement for free and do not build the inverters.
- **Fan-in above three is not a real option in static CMOS.** $g_{\text{NOR-}k}$ grows at $2/3$ per input, and the width model above is optimistic on top of that: a series stack loses further to the body effect and to reduced $V_{GS}$ on the upper devices. Past $k\approx3$ the gate must be decomposed into a tree, at which point the depth is no longer $2$ and the note becomes a special case of [[Multi-Level Factored Network]].
- **The transform preserves hazards exactly.** It is a per-gate rewrite with no change to the cover, so every static hazard present in the OR-AND network is present in the NOR-NOR network, at the same input transition. Choosing NOR gates is not a hazard-removal step; consensus terms still have to be added to the POS cover first.
- **$\gamma=2$ is a modelling choice.** Every number above scales with the mobility ratio, and a process where $\mu_n/\mu_p$ is closer to $1$ narrows the gap proportionally. At the limit $\gamma=1$ the reference inverter becomes $W_p=W_n=1$, $C_{in}=2$, and both gates land on $g=(k+1)/2$ — *exactly equal*, because the model's only asymmetry was $\gamma$. What separates them at that point is everything the first-order model omits: body effect and reduced $V_{GS}$ up a series stack, the internal node capacitance the stack adds, and the fact that a parallel pull-down of $k$ minimum devices is easier to lay out than a series stack of $k$ wide ones.

> [!warning] No technology numbers in this note
> The delays above are in units of $\tau$ from the logical-effort model with $\gamma=2$, not from any cell library, and there is no source here for a real process's $\gamma$, for stack-degradation factors, or for absolute picoseconds. Treat the table as a ranking, not a datasheet.

**RTL (Spade)**

```spade
fn nor2<#uint N>(a: uint<N>, b: uint<N>) -> uint<N> { ~(a | b) }

fn nor3<#uint N>(a: uint<N>, b: uint<N>, c: uint<N>) -> uint<N> { ~(a | b | c) }

/// f = (a+b)(a+c)(b+c) = MAJ(a,b,c), realised as NOR-NOR.
fn maj_nor_nor<#uint N>(a: uint<N>, b: uint<N>, c: uint<N>) -> uint<N> {
    nor3(nor2(a, b), nor2(a, c), nor2(b, c))
}
```

`nor2(a, b)`, `nor2(a, c)` and `nor2(b, c)` are the three first-level gates of the right-hand panel and `nor3` is the second-level gate; the width parameter `N` simply replicates that 1-bit network `N` times side by side, so widths do not grow anywhere — `~`, `|` and the whole expression are all `uint<N>`. It is a `fn`, not an `entity`, because there is nothing clocked here: pure combinational logic, one cone, depth 2. Synthesis will *not* preserve this structure — every mapper re-covers the cone, and on an FPGA the entire function collapses into a single 3-input LUT, which is the [[Lookup-Tables]] argument above made concrete.

**Related Notes**

- [[NAND-NAND Network]] – compares: the SOP-side dual, identical gate and literal counts, lower logical effort per gate; the default choice on static CMOS.
- [[Two-Level POS Network]] – depends-on: the form this transform consumes, and the only form on which it is an identity.
- [[Two-Level SOP Network]] – counter-example: apply the transform here and the network computes $\bar f$ unless you pay an inverter per input and one on the output.
- [[Karnaugh Map]] – depends-on: circling the *zeros* is how the minimal POS that feeds this transform is obtained.
- [[CMOS Logic Gates]] – supports: the pull-down/pull-up duality that puts the PMOS devices in series and decides the whole comparison.
- [[Multi-Level Factored Network]] – extends: what the network becomes once fan-in forces the second-level NOR to be decomposed and depth stops being 2.
- [[Lookup-Tables]] – counter-example: on an FPGA every gate polarity and every literal count vanishes into one LUT.
- [[Choosing a Logic Realization]] – compares: where this sits against every sibling realization.

## References

- [[0.1) Boolean Algebra]] — §Functional completeness (NOR completeness, the NAND-NAND transform this dualizes, and the remark that NAND beats NOR because NOR series-stacks the PMOS), §Cost metrics (literal count and depth as the cost proxies), §Trade-offs (the $c_{out}$ row: 6 literals, 4 gates, depth 2).
- No textbook source for this topic. The material is standard in Mano & Ciletti, *Digital Design* (the OR-AND to NOR-NOR transform and bubble pushing), Wakerly, *Digital Design: Principles and Practices* (two-level NOR-NOR realizations), Weste & Harris, *CMOS VLSI Design* (static CMOS sizing, logical effort, dynamic logic, PLAs) and Sutherland, Sproull & Harris, *Logical Effort* (the $g$ and $p$ values, recomputed here rather than quoted). Page numbers are deliberately omitted — no copy was consulted for this note.
