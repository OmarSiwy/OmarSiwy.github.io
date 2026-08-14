---
title: Full Adder
description: "The one-digit column of paper-and-pencil addition: sum is XOR of three bits, carry is their majority — the cell every other adder in the vault is made of."
kind: circuit
source: "ASA §5.2.1, p. 107; §5.4.1, pp. 126-127"
status: seed
spade: simulated
tags: [digital, adders, carry, fpga]
aliases:
  - "FA"
  - "Full Adders"
  - "Full Adder Cell"
---

# Full Adder

The full adder is the three-input, two-output cell that computes one column of binary addition, and the only adder primitive whose two outputs have *different weights* — which is what makes it chainable at all.

```tikz title="Full adder: black-box symbol and its five-gate realisation"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize]
  % ---- black box, after Fig. 5.3 ----
  \node[draw,fill=gray!8,minimum width=1.15cm,minimum height=0.85cm] (FA) at (0,1.6) {FA};
  \draw[->] (-0.3,3.0) -- (-0.3,2.03); \node at (-0.3,3.2) {$x_i$};
  \draw[->] ( 0.3,3.0) -- ( 0.3,2.03); \node at ( 0.3,3.2) {$y_i$};
  \draw[<-] (0.58,1.6) -- (1.8,1.6);   \node at (2.05,1.6) {$c_i$};
  \draw[->] (-0.58,1.6) -- (-1.8,1.6); \node at (-2.15,1.6) {$c_{i+1}$};
  \draw[->] (0,1.17) -- (0,0.2);       \node at (0.32,0.0) {$s_i$};
  \node[align=center] at (0,-0.95) {every wire: $1$ bit\\in weight $2^i$, carry-out weight $2^{i+1}$};

  % ---- gate-level realisation ----
  \node[xor port] (X1) at (6.9,3.0) {};
  \node[and port] (A1) at (6.9,1.5) {};
  \node[xor port] (X2) at (10.3,2.6) {};
  \node[and port] (A2) at (9.6,0.2) {};
  \node[or  port] (O1) at (12.2,0.9) {};

  % input rails
  \draw (4.0,3.75) node[above] {$x_i$} -- (4.0,1.3);
  \draw (4.0,0 |- X1.in 1) -- (X1.in 1);
  \draw (4.0,0 |- A1.in 1) -- (A1.in 1);
  \draw (4.7,3.75) node[above] {$y_i$} -- (4.7,1.2);
  \draw (4.7,0 |- X1.in 2) -- (X1.in 2);
  \draw (4.7,0 |- A1.in 2) -- (A1.in 2);
  \draw (5.4,3.75) node[above] {$c_i$} -- (5.4,-0.1);
  \draw (5.4,0 |- X2.in 2) -- (X2.in 2);
  \draw (5.4,0 |- A2.in 2) -- (A2.in 2);

  % p = x xor y, fanning out to the sum XOR and to the propagate AND
  \draw (X1.out) -- (8.1,3.0) node[above] {$p_i$};
  \draw (8.1,3.0) |- (X2.in 1);
  \draw (8.1,3.0) |- (A2.in 1);
  \fill (8.1,3.0) circle (1.7pt);

  % g = x and y
  \draw (A1.out) -- (8.7,1.5) node[above] {$g_i$};
  \draw (8.7,1.5) -| (11.1,1.5) |- (O1.in 1);
  \draw (A2.out) -- (10.9,0.2) |- (O1.in 2);

  \draw[->] (X2.out) -- (13.4,2.6) node[right] {$s_i$};
  \draw[->] (O1.out) -- (13.4,0.9) node[right] {$c_{i+1}$};
  \node[align=center] at (8.7,-1.05)
    {$p_i=x_i\oplus y_i$,\; $g_i=x_iy_i$ \quad|\quad $s_i=p_i\oplus c_i$,\; $c_{i+1}=g_i\vee p_ic_i$\\
     $5$ gates \quad|\quad $c_i\to c_{i+1}$ is $2$ levels, $x_i\to c_{i+1}$ is $3$};
\end{circuitikz}
\end{document}
```

*after Fig. 5.3, p. 107; the gate-level panel on the right is my own construction — the book gives only the symbol and the truth table.*

**Derive the cell from the column, not from a truth table.** In paper-and-pencil binary addition, position $i$ receives three bits of weight $2^i$: $x_i$, $y_i$ and the carry $c_i$ handed up from position $i-1$. Their arithmetic sum $x_i+y_i+c_i$ ranges over $\{0,1,2,3\}$, which is exactly the range of a $2$-bit unsigned number, so the column's result is written in binary as

$$x_i+y_i+c_i \;=\; 2c_{i+1}+s_i$$

with $s_i$ the bit kept at weight $2^i$ and $c_{i+1}$ the bit exported to weight $2^{i+1}$ (p. 106). Every signal named here is $1$ bit wide; there is no other width in this note. The full adder is the circuit realising that one equation, and everything below is a consequence of it rather than an independent design choice.

**The two outputs fall straight out of the encoding.** Enumerating the eight input patterns (Fig. 5.3, p. 107) gives

| $x_i$ | $y_i$ | $c_i$ | $c_{i+1}$ | $s_i$ |
| --- | --- | --- | --- | --- |
| $0$ | $0$ | $0$ | $0$ | $0$ |
| $0$ | $0$ | $1$ | $0$ | $1$ |
| $0$ | $1$ | $0$ | $0$ | $1$ |
| $0$ | $1$ | $1$ | $1$ | $0$ |
| $1$ | $0$ | $0$ | $0$ | $1$ |
| $1$ | $0$ | $1$ | $1$ | $0$ |
| $1$ | $1$ | $0$ | $1$ | $0$ |
| $1$ | $1$ | $1$ | $1$ | $1$ |

$s_i$ is $1$ in exactly the rows with an odd number of ones, which is the definition of the three-input parity function, and $c_{i+1}$ is $1$ in exactly the rows with two or more ones, which is the definition of the majority function:

$$s_i=x_i\oplus y_i\oplus c_i \tag{5.2}$$
$$c_{i+1}=x_ic_i\vee y_ic_i\vee x_iy_i \tag{5.3}$$

Eq. (5.3) is the majority function's canonical sum-of-products form: one product term per pair, ORed together, since "at least two of three" is "some pair is both set". The book abbreviates the pair as $(c_{i+1},s_i)=\text{FA}(x_i,y_i,c_i)$ (Eq. 5.4, p. 107), and that notation is used unchanged by every other note in [[Adders]]. Rewriting either expression is [[Boolean Algebra]] applied to a two-output [[Combinational Logic]] block: no state, no feedback, output a pure function of the input.

**Factor out $x_i\oplus y_i$, because it is a shared subexpression and it shortens the carry path.** Introduce the *propagate* and *generate* signals, which depend on the operand bits only and are therefore available one gate delay after the inputs, in parallel, at every position:

$$p_i=x_i\oplus y_i,\qquad g_i=x_iy_i$$

Then $s_i=p_i\oplus c_i$ immediately, **by associativity of XOR**. For the carry, start from (5.3) and factor $c_i$ out of the first two terms **by distributivity of AND over OR**:

$$c_{i+1}=(x_i\vee y_i)c_i\vee x_iy_i$$

and note $x_i\vee y_i=p_i\vee g_i$, with $g_i$ absorbed **by the absorption law** $g_i\vee g_ic_i=g_i$, leaving

$$c_{i+1}=g_i\vee p_ic_i$$

The book writes this as $c_{i+1}=g_i\vee a_ic_i$ (Eq. 5.13, p. 113) with the *alive* signal $a_i=x_i\vee y_i$ in place of $p_i$; the two agree because they differ only where $g_i=1$, and there the $g_i$ term already forces the output. Use $p_i$ when the same wire must also feed the sum XOR, $a_i$ when it must not.

That is the form drawn on the right of the diagram, and the reason to prefer it over (5.3) is not gate count — five gates either way — but *depth from $c_i$*. In (5.3) the carry-in feeds two ANDs and an OR, and $p_i$ and $g_i$ are precomputed the moment the operands arrive, so the $c_i\to c_{i+1}$ path is two levels while the $x_i\to c_{i+1}$ path is three. Since chaining $w$ cells multiplies the first number by $w$ and the second by $1$, this asymmetry is the entire optimisation target.

**The three inputs are functionally interchangeable and implementationally never are.** The cell computes a symmetric function — $x_i+y_i+c_i$ does not care which addend is which, and both parity and majority are invariant under any permutation of their arguments — so any of the three wires may be relabelled the carry-in without changing the truth table. But the moment cells are chained into a [[RCA, Ripple-Carry Adder]], only one of the three inputs sits on the critical path, and the design problem becomes: make $\tau_\text{cp}$, the $c_i\to c_{i+1}$ delay, small at the expense of $\tau_\text{fa}$, the input-to-output delay. The chain's latency is

$$\tau_\text{add}(w)=(w-1)\,\tau_\text{cp}+\max(\tau_\text{cp},\tau_\text{fa}) \tag{5.7}$$

(p. 108), which multiplies the first by $w-1$ and the second by $1$. This is why "the FA cell is so important that founders provide several full-custom implementations for their technologies", with new transistor-level FA papers and patents appearing every year (p. 107). At the gate level (5.3) and (5.13) are the same circuit; at the transistor level they are not, and neither is a mirror-CMOS majority gate, a transmission-gate cell, or a 10-transistor pass-logic cell.

**One more rewriting turns the carry into a multiplexer.** Generate is only reachable when we are *not* propagating: $p_i=0$ forces $x_i=y_i$, so in that case $g_i=x_iy_i=x_i$, and **by case exhaustion on $p_i$**

$$c_{i+1}=p_ic_i\vee\overline{p_i}\,x_i \tag{5.15}$$

Read literally: *if the bits differ, pass the carry through unchanged; otherwise pass either operand bit.* No OR-of-ANDs survives — it is a $2:1$ select steered by $p_i$. This is what a [[Switched Ripple-Carry Adder]] realises with transmission gates, and it is what is hardened into FPGA silicon.

> [!important] On an FPGA a full adder is not five gates, it is half a LUT and one mux
> On AMD series 4 through 7 and UltraScale/UltraScale+, one basic logic element computes a full adder as $s_i=p_i\oplus c_i$ (Eq. 5.50) and $c_{i+1}=p_ic_i\vee\overline{p_i}x_i$ (Eq. 5.51) — the LUT is configured to produce only $p_i=x_i\oplus y_i$, the carry-chain XOR produces the sum, and the carry-chain multiplexer produces the carry in the form of (5.15) (Fig. 5.23, p. 126). That mux is on dedicated, non-programmable routing: $\tau_\text{cp}=0.015$ ns per BLE against $\tau_\text{fa}=0.57$ ns worst case on Virtex 6 speed grade 3, a factor of $38$ (p. 127). Intel is simpler still — each BLE contains a complete hardened FA with dedicated carry wires to its neighbours (§5.4.2, p. 128). The consequence for everything downstream: on an FPGA the FA's carry path is *already* the fastest wire on the die, so schemes that buy carry speed with extra logic start out behind. Note also that an FA consumes only a fraction of the BLE, which §5.4.3 exploits by merging other logic into the adder for free.

**With one input constant the cell collapses.** Setting $c_i=0$ deletes two of the three product terms in (5.3) and one operand from (5.2), giving $s_i=x_i\oplus y_i$ and $c_{i+1}=x_iy_i$ — a [[Half Adder]] (Eqs. 5.5-5.6, p. 107), two gates instead of five. Worth doing at position $0$ of any adder whose carry-in is tied low. Setting $c_i=1$ instead gives the dual, $s_i=\overline{x_i\oplus y_i}$ and $c_{i+1}=x_i\vee y_i$, at the same cost.

**Counted rather than chained, the same cell is a $3{:}2$ compressor.** Nothing in $x_i+y_i+c_i=2c_{i+1}+s_i$ requires $c_i$ to come from position $i-1$. Feed three *independent* bits of weight $2^i$ and the cell returns two bits, one of weight $2^i$ and one of weight $2^{i+1}$: it has reduced three same-weight terms to two, which is the defining move of [[Bit Heaps]] and [[Compressor Trees]], and — when applied to a whole row at once with the carries *not* chained — of the [[CSA, Carry-Save Adder]]. The delay is then one $\tau_\text{fa}$ and independent of $w$, because no carry crosses a cell boundary.

$$\boxed{\ x_i+y_i+c_i=2c_{i+1}+s_i,\qquad s_i=x_i\oplus y_i\oplus c_i,\qquad c_{i+1}=\text{MAJ}(x_i,y_i,c_i)=g_i\vee p_ic_i\ }$$

## When it breaks

- **Optimising the cell in isolation.** A gate-count-minimal or area-minimal FA with a slow $c_i\to c_{i+1}$ path is a *worse* cell inside an adder, because (5.7) weights $\tau_\text{cp}$ by $w-1$. Choose the cell against the chain it will sit in, not against a standalone datasheet.
- **The five-gate picture on an FPGA.** It is an ASIC drawing. The synthesised object is one LUT plus hardened carry logic, and reasoning about FA gate counts there will mislead you about both area and delay.
- **Versal-class devices.** The carry chain no longer contains an XOR at all; the sum needs a second LUT4 and only even-indexed carries come from the lookahead unit, so "one BLE = one FA" stops holding (§5.4.1, pp. 127-128).
- **More than three inputs.** Once a column has four or more bits to reduce, a tree of FAs is not the cheapest reduction — a dedicated compressor is, and the decision belongs to [[Compressor Trees]], not here.
- **The symmetry.** It is real as a Boolean fact and useless as a design fact: relabelling which input is the carry changes nothing logically and everything about which path you must protect.

## RTL (Spade)

```spade
/// One full-adder cell: (carry-out, sum) = FA(x, y, c).
fn fa(x: bool, y: bool, c: bool) -> (bool, bool) {
    let p = x != y;
    ((x && y) || (p && c), p != c)
}

/// The same cell read as arithmetic: the 2-bit number x + y + c.
fn fa_num(x: bool, y: bool, c: bool) -> uint<2> {
    let (cout, s) = fa(x, y, c);
    [s, cout].as_uint()
}
```

`p` is the $p_i$ wire at the fan-out dot in the diagram — one XOR shared between the sum and the carry, matching (5.13) rather than (5.3). `x && y` is $g_i$, the AND feeding the OR; `p && c` is the lower AND. `!=` is XOR here, because `^` is not defined on `bool` in Spade. Both are `fn`, so the block is purely combinational — no clock, no register, no state — which is the honest encoding of a cell whose entire job is a two-level function of three wires. `fa_num` exists only to state the arithmetic contract for the testbench: `[s, cout]` packs index $0$ into the **least**-significant position, so the result reads $2c_{i+1}+s_i$, and getting that array order backwards is a bug that compiles perfectly and adds wrong. Synthesis will not preserve this structure: an ASIC tool substitutes the library's tuned FA cell, and an FPGA tool maps it to the carry-chain form of (5.15) above.

## Related Notes (with context)

- [[RCA, Ripple-Carry Adder]] – extends: $w$ of these cells wired carry-out to carry-in; the reason $\tau_\text{cp}$ is the only delay worth optimising.
- [[Half Adder]] – extends: what this cell collapses to when one input is a constant.
- [[Boolean Algebra]] – depends-on: distributivity, absorption and case exhaustion are the only laws used to get from (5.3) to (5.13) and (5.15).
- [[Combinational Logic]] – depends-on: the cell is a stateless two-output function, which is why the Spade block is `fn` and not `entity`.
- [[CSA, Carry-Save Adder]] – extends: a row of these cells with the carries deliberately *not* chained, giving delay independent of $w$.
- [[Compressor Trees]] – extends: uses the cell as a $3{:}2$ counter rather than as a column of an adder.
- [[Bit Heaps]] – supports: the weighted-dot bookkeeping in which "three dots of weight $2^i$ become one dot of weight $2^i$ and one of weight $2^{i+1}$" is exactly this cell.
- [[Switched Ripple-Carry Adder]] – extends: implements (5.15) with transmission gates instead of gates, breaking the gate-delay model.
- [[FPGA Hard Carry Chain Adder]] – counter-example: the cell is hardened into silicon, so its carry path stops being the bottleneck it is in an ASIC.
- [[Parallel Prefix Adders]] – extends: the $(g_i,p_i)$ pair defined here is the atom of the associative prefix operator every tree is built from.
- [[Two's Complement Adder-Subtractor]] – extends: the same cell unmodified, with $y_i$ conditionally inverted and the $+1$ riding in on $c_0$.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.1.3, p. 106 — the column equation $x_i+y_i+c_i=2c_{i+1}+s_i$ and the fixed-point-reduces-to-integer argument.
- §5.2.1 "The Full Adder and Half Adder Cells", p. 107 — **Fig. 5.3** (symbol and truth table), Eqs. 5.2-5.4; Fig. 5.4 and Eqs. 5.5-5.6 for the half adder; the remark on full-custom FA cells.
- §5.2.2, p. 108 — Eq. 5.7, the delay model that makes $\tau_\text{cp}$ the target.
- §5.3.2, p. 113 — Eq. 5.13 ($c_{i+1}=g_i\vee a_ic_i$) and Eqs. 5.14-5.15 (the multiplexer form).
- §5.4.1 "Addition Support on AMD FPGAs", pp. 126-127 — **Fig. 5.23**, Eqs. 5.50-5.51, Virtex 6 timing from [Xil14]; pp. 127-128 for the Versal carry-lookahead variant.
- §5.4.2, p. 128 — Intel BLEs with a complete hardened FA.
