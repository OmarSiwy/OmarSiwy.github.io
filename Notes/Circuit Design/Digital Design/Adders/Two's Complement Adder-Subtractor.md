---
title: "Two's Complement Adder/Subtractor"
description: "One XOR per bit plus a sub signal on the carry-in turns any adder into S = X + (-1)^sub Y at zero delay cost; carries the signed/unsigned overflow test with it."
kind: circuit
source: "ASA §5.2.3-5.2.5, pp. 108-110"
status: seed
spade: simulated
tags: [digital, adder, subtraction, twos-complement, overflow, fpga]
aliases:
  - "Two's Complement Adder/Subtractor"
  - "Two's Complement Adder-Subtractor"
  - "Adder/Subtractor"
  - "Reconfigurable Adder/Subtractor"
  - "Two's Complement Subtractor"
  - "Basic Subtraction"
---

# Two's Complement Adder/Subtractor

A carry-propagate adder with one XOR gate inserted in front of each $y_i$ and the shared `sub` select wired to $c_0$, computing $S = X + (-1)^{\texttt{sub}}Y$ without touching the carry chain that sets the latency.

```tikz title="8-bit two's complement adder/subtractor: sub inverts Y and supplies the +1"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize]
  % sub rail, routed above the input labels
  \draw[thick] (1.9,3.15) -- (-11.3,3.15);
  \node[anchor=west] at (1.95,3.15) {\texttt{sub} ($1$ bit)};

  \foreach \i [evaluate=\i as \X using -1.6*\i] in {0,...,7} {
    \node[xor port, scale=0.42, rotate=-90] (X\i) at (\X+0.3,1.15) {};
    \draw (\X+0.42,1.95) -- (\X+0.42,3.15);
    \draw[->] (\X+0.18,2.25) -- (\X+0.18,1.95);
    \node[anchor=south] at (\X+0.18,2.28) {$y_{\i}$};
    \draw[->] (\X+0.3,0.62) -- (\X+0.3,0.34);
    \draw[->] (\X-0.30,2.25) -- (\X-0.30,0.34);
    \node[anchor=south] at (\X-0.30,2.28) {$x_{\i}$};
    \node[draw,fill=gray!8,minimum width=1.02cm,minimum height=0.66cm] (F\i) at (\X,0) {FA};
    \draw[->] (\X,-0.34) -- (\X,-0.95);
    \node[anchor=north] at (\X,-0.98) {$s_{\i}$};
  }
  \foreach \i/\j [evaluate=\i as \X using -1.6*\i] in {0/1,1/2,2/3,3/4,4/5,5/6,6/7} {
    \draw[very thick,->] (\X-0.51,0) -- (\X-1.09,0) node[midway,above] {$c_{\j}$};
  }
  \draw[very thick] (1.9,0) -- (1.9,3.15);
  \draw[very thick,->] (1.9,0) -- (0.51,0) node[midway,above] {$c_0\!=\!\texttt{sub}$};
  \draw[very thick,->] (-11.71,0) -- (-13.4,0) node[midway,above] {$c_8=c_\text{out}$};

  % signed-overflow flag: c_8 XOR c_7
  \node[xor port, scale=0.42] (OV) at (-12.55,-1.75) {};
  \draw (-12.6,0) -- (-12.6,-1.4) -- (-12.82,-1.4) -- (OV.in 1);
  \draw (-10.24,0) -- (-10.24,-2.1) -- (OV.in 2);
  \draw[->] (OV.out) -- (-13.6,-1.75) node[anchor=east] {$\text{ovf}_\text{signed}$};

  \node[align=left,anchor=west] at (-7.2,4.0)
    {$X,Y$: $8$ bits each \quad|\quad $S$: $8$ bits \quad|\quad every drawn wire is $1$ bit};
  \node[align=left,anchor=west] at (-7.2,-2.9)
    {$\texttt{sub}=0 \Rightarrow S=X+Y$ \qquad $\texttt{sub}=1 \Rightarrow S=X+\overline{Y}+1=X-Y$};
\end{circuitikz}
\end{document}
```

*after Fig. 5.8, p. 110; the overflow XOR is drawn after Fig. 5.6, p. 109, but corrected — see the warning below.*

**Reduce subtraction to a second addition instead of building a subtractor.** There is a primitive cell for subtraction — the *full subtractor*, which emits a difference and a negatively-weighted borrow — and almost nobody builds one, because the **two's-complement identity** $-Y = \overline{Y} + 1$ turns the problem into an addition already solved (p. 109). Writing $X - Y = X + (-Y) = X + \overline{Y} + 1$ costs $w$ inverters for the bitwise complement, and the $+1$ costs nothing at all: a generic $w$-bit adder already has a carry-in port of weight $1$, and §5.2.1 established that the $(w{+}1)$-bit output range $[0, 2^{w+1}-2]$ leaves exactly one slot free for it (p. 105). Fig. 5.7, p. 109 is that circuit — an [[RCA, Ripple-Carry Adder]] with a NOT on every $y_i$ and $c_0$ tied to constant $1$.

**Make the inversion conditional with the one gate that is already a mux on a constant.** A `sub` select could steer $2w$-to-$w$ multiplexers, but XOR is cheaper and does the same job: $y_i \oplus 0 = y_i$ and $y_i \oplus 1 = \overline{y_i}$, **by the identity element and complement laws of XOR**. So one 2-input XOR per bit, all $w$ of them driven from the same 1-bit `sub` rail, realizes the conditional complement. The same rail drives $c_0$, delivering the conditional $+1$ in the same instant. That is the whole circuit (Eq. 5.8, Fig. 5.8, p. 110):

$$y_i' = y_i \oplus \texttt{sub}, \qquad c_0 = \texttt{sub}, \qquad S = X + \overline{Y}^{\,\texttt{sub}} + \texttt{sub}$$

**Count what the select actually costs on the critical path.** Signal widths: $X, Y$ are $w$ bits, `sub` is $1$ bit, $Y'$ is $w$ bits, $S$ is $w$ bits with $c_\text{out}$ as an optional $(w{+}1)$-th. Area grows by exactly $w$ two-input XOR gates. Latency grows by $\tau_\text{xor}$ **once**, not $w$ times: every $y_i'$ is computed in parallel from primary inputs, so the row sits in front of the chain and lengthens only the input-to-$c_1$ leg of Eq. (5.7), $\tau_\text{add}(w) = (w-1)\tau_\text{cp} + \max(\tau_\text{cp},\tau_\text{fa})$, leaving the $(w-1)\tau_\text{cp}$ term — the term that dominates for any interesting $w$ — untouched. This is why the take-away of §5.2.3-5.2.5 is that *all four* of {signed, unsigned} $\times$ {add, subtract} reduce to the same carry-propagate adder, and therefore every acceleration in [[Parallel Prefix Adders]] applies to all four unchanged (p. 110).

**On FPGA the XOR row is free outright.** An adder mapped to the hard carry chain barely uses the LUT it sits in — on AMD the LUT computes only $p_i = x_i \oplus y_i$, a 2-input function in a 6-input LUT — so absorbing `sub` as a third input, $p_i = x_i \oplus y_i \oplus \texttt{sub}$, changes nothing about the resource count. The adder/subtractor costs **exactly the same number of LUTs and the same carry chain** as the plain adder (p. 133), which is not true in VLSI, where the $w$ XOR gates are real transistors. See [[FPGA Hard Carry Chain Adder]] and [[LUT-Merged Adder]] for what else fits in that free LUT layer.

**Read the same bit vector two ways and only the flag changes.** Two's complement is arithmetic modulo $2^w$ with a different *interpretation* of the MSB weight (as $-2^{w-1}$ rather than $+2^{w-1}$), so the adder hardware is bit-for-bit identical for `sfix` and `ufix` operands — see [[Number Formats]] and [[Fixed-Point Representations]] for the formats themselves. What is *not* shared is overflow detection:

- **unsigned**: overflow $\iff c_\text{out} = 1$ in add mode; in subtract mode $c_\text{out} = 1$ means *no* borrow, i.e. $X \ge Y$, so the unsigned underflow flag is $\overline{c_\text{out}}$;
- **signed**: overflow $\iff$ the two operands entering the adder share a sign bit and the result's sign bit differs from it. Equal input signs are necessary — operands of opposite sign can never carry the sum outside $[-2^{w-1}, 2^{w-1}-1]$.

The gate-level form of the signed test is the XOR of the **top two carries**, $c_w \oplus c_{w-1}$: they are equal exactly when the sign column's carry-in and carry-out agree, which is exactly when the sign of the result is the sign the operands imply. One XOR gate, and $c_{w-1}$ is already a wire in the chain.

> [!warning] The book's overflow formula on p. 109 is wrong
> The text and Fig. 5.6 compute the signed overflow flag as $s_{w-1} \oplus c_\text{out}$ — "the XOR of the sign of the result and $s_w = c_\text{out}$". Counterexample at $w = 8$: $X = 100 = 01100100_2$, $Y = -50 = 11001110_2$, both in add mode. The sum is $50 = 00110010_2$ with $c_\text{out} = 1$, so $s_7 \oplus c_\text{out} = 0 \oplus 1 = 1$ — flagged, although $+50$ is perfectly representable and the operands have opposite signs so overflow is impossible. The correct classic form is $c_w \oplus c_{w-1}$, which gives $1 \oplus 1 = 0$ here. It agrees with the book's own prose definition (equal input signs, differing output sign) in every case; $s_{w-1} \oplus c_\text{out}$ does not. The Spade block below implements $c_w \oplus c_{w-1}$ and was simulated against a behavioural signed reference over 4011 vectors, including this one.

$$\boxed{\ y_i' = y_i \oplus \texttt{sub},\quad c_0 = \texttt{sub}\ \Longrightarrow\ S = X + (-1)^{\texttt{sub}}Y,\qquad \text{ovf}_\text{signed} = c_w \oplus c_{w-1}\ }$$

**When it breaks.**

- **The $-Y$ that does not exist.** $\overline{Y}+1$ is exact for every $w$-bit two's-complement $Y$ except $Y = -2^{w-1}$, whose negation is not representable in $w$ bits; the circuit returns $-2^{w-1}$ again and raises the signed overflow flag. Nothing is wrong with the hardware — the format has no $+2^{w-1}$.
- **Negating both operands.** $-X-Y$ needs a constant $+2$ and there is only one carry-in port, so this structure does not generalize. That case wants the ternary form instead: [[Sign-Configurable Adder-Subtractor]].
- **`sub` fanout.** The select drives $w$ XOR gates plus $c_0$ from one net. Above a few dozen bits it needs a buffer tree, and the buffer delay lands in front of the chain — the one place where the "free" claim quietly acquires a cost.
- **Truncating interfaces.** With $c_\text{out}$ discarded the operator is modulo $2^w$ and *silently* wraps; if wraparound is unacceptable the flag has to be consumed, e.g. by a [[Saturating Adder]].
- **Carry-save inputs.** If $Y$ arrives in redundant form the trick fails outright: complementing a carry-save pair is not a bitwise operation. Convert first, or negate upstream of the [[CSA, Carry-Save Adder]].

**RTL (Spade).**

```spade
entity addsub<#uint W>(x: uint<W>, y: uint<W>, sub: bool) -> (uint<W>, bool, bool) {
    let yc: uint<W> = if sub { ~y } else { y };
    let cin: uint<{W + 1}> = if sub { 1 } else { 0 };
    let full: uint<{W + 1}> = trunc(x + yc + cin);
    let s: uint<W> = trunc(full);
    let cout = full.msb();
    // c_{w-1} recovered from s_{w-1} = x_{w-1} ^ y'_{w-1} ^ c_{w-1}
    let cin_msb = s.msb() ^^ x.msb() ^^ yc.msb();
    let ovf = cout ^^ cin_msb;
    (s, cout, ovf)
}
```

`yc` is the XOR row of the diagram — Spade's `~` is bitwise, so the whole row is one operator; `cin` is the `sub` rail arriving at $c_0$. `x + yc` widens to $W+1$ bits by the `+` rule, and the extra `+ cin` widens again to $W+2$, so `trunc` back to $W+1$ is safe because the true maximum $2(2^W-1)+1 = 2^{W+1}-1$ still fits. `full.msb()` is $c_w$; $c_{w-1}$ is not a named wire in a behavioural `+`, so it is recovered algebraically from the sum bit — **by the full-adder sum identity** $s_i = x_i \oplus y_i \oplus c_i$, rearranged. Everything is purely combinational: no `reg`, no clock port. Synthesis will not build the drawn ripple chain — it maps `+` to whatever carry structure the target prefers (a hard carry chain on FPGA, a prefix tree in an ASIC library), which is precisely the point of §5.2.5.

**Related notes.**

- [[RCA, Ripple-Carry Adder]] – depends-on: the substrate this wraps; the XOR row and $c_0$ are the only additions.
- [[Full Adder]] – depends-on: the sum identity $s_i = x_i \oplus y_i \oplus c_i$ used to recover $c_{w-1}$.
- [[Sign-Configurable Adder-Subtractor]] – extends: two independent sign selects, which this structure cannot serve because $-X-Y$ needs a carry-in of $2$.
- [[Absolute Difference Operator]] – extends: drives `sub` from a comparison so the output is always non-negative.
- [[Saturating Adder]] – compares: the other thing to do with $c_\text{out}$ instead of wrapping.
- [[FPGA Hard Carry Chain Adder]] – counter-example: on FPGA the $w$ XOR gates cost literally nothing, so the VLSI area/select trade-off disappears.
- [[LUT-Merged Adder]] – extends: `sub` is just one of several functions that fit in the free LUT layer in front of the chain.
- [[Number Formats]] – depends-on: why the same bits serve signed and unsigned.
- [[Fixed-Point Representations]] – depends-on: scaling factors out, so fixed-point subtraction is this integer circuit.
- [[Choosing an Adder]] – compares: whichever adder wins there, this wrapper applies to it unchanged.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §5.2.3 *Addition of Signed Numbers in Two's Complement*, pp. 108-109 (Fig. 5.6).
  - §5.2.4 *Basic Subtraction*, p. 109 (Fig. 5.7).
  - §5.2.5 *Reconfigurable Adder/Subtractor*, p. 110 (Eq. 5.8, Fig. 5.8).
  - §5.2.1-5.2.2, pp. 105-108 (carry-in slot, Eq. 5.7).
  - §5.4.5 *Reconfigurable adder/subtractor on FPGAs*, p. 133.
