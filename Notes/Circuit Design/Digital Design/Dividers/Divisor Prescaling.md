---
title: Divisor Prescaling
description: "Two muxes and one adder push D into [0.984, 1.125] so digit selection collapses to rounding the shifted remainder to the nearest integer — enabling very high radices, at duplicated scaling hardware and a wider iteration datapath."
kind: circuit
source: "ASA §9.2.8, pp. 282-286"
status: seed
spade: simulated
tags: [digital, divider, srt, prescaling, shift-add]
aliases:
  - Prescaling
  - Divisor Scaling
  - Prescaled Division
---

# Divisor Prescaling

A shift-and-add unit that multiplies both operands of a division by a common factor chosen from the top bits of $D$, so that $D_{\text{scaled}}$ lands close enough to $1$ that quotient digit selection stops depending on $D$ at all.

```tikz title="Prescaling unit: two 3:1 muxes over hard-wired shifts feeding one three-input adder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- input bus: the same block is instantiated for A = X and for A = D ---
  \node[anchor=south] at (0,5.35) {$A$\quad(one copy for $A=X$, one for $A=D$)};
  \draw[thick,-latex] (0,5.3) -- (0,4.7);
  \node[anchor=west,scale=0.8] at (0.1,5.0) {$n$};
  \draw[thick] (-4.6,4.7) -- (4.6,4.7);
  \draw[thick] (0,4.7) -- (0,1.85);

  % fan-out taps: hard-wired right shifts, no shifter needed
  \foreach \x in {-4.6,-3.6,-2.6,2.6,3.6,4.6} { \draw[thick,-latex] (\x,4.7) -- (\x,3.45); }
  \node[anchor=east,scale=0.75] at (-4.68,3.62) {$0$};
  \node[anchor=east,scale=0.75] at (-3.68,3.62) {$\gg\!1$};
  \node[anchor=east,scale=0.75] at (-2.68,3.62) {$\gg\!2$};
  \node[anchor=east,scale=0.75] at (2.52,3.62) {$0$};
  \node[anchor=east,scale=0.75] at (3.52,3.62) {$\gg\!1$};
  \node[anchor=east,scale=0.75] at (4.52,3.62) {$\gg\!3$};
  % --- multiplexers ---
  \draw[thick] (-5.0,3.45) -- (-2.2,3.45) -- (-2.6,2.85) -- (-4.6,2.85) -- cycle;
  \draw[thick] (2.2,3.45) -- (5.0,3.45) -- (4.6,2.85) -- (2.6,2.85) -- cycle;
  \node[scale=0.8] at (-3.6,3.13) {mux $A$};
  \node[scale=0.8] at (3.6,3.13) {mux $B$};

  % control: 3 bits of D, decoded per Table 9.2, shared by both copies
  \draw[thick,-latex] (-6.6,3.15) -- (-4.85,3.15);
  \draw[thick,-latex] (6.6,3.15) -- (4.85,3.15);
  \node[anchor=south,scale=0.75] at (-5.7,3.2) {$d$};
  \node[anchor=south,scale=0.75] at (5.7,3.2) {$d$};
  \node[anchor=north,scale=0.75,align=center] at (0,-0.75)
       {$d$ = the 3 bits below the leading $1$ of $D$, decoded by Table 9.2};

  % --- mux outputs down to the adder ---
  \draw[thick] (-3.6,2.85) -- (-3.6,2.25) -- (-1.3,2.25) -- (-1.3,1.85);
  \draw[thick,-latex] (-1.3,2.0) -- (-1.3,1.85);
  \draw[thick] (3.6,2.85) -- (3.6,2.25) -- (1.3,2.25) -- (1.3,1.85);
  \draw[thick,-latex] (1.3,2.0) -- (1.3,1.85);
  \draw[thick,-latex] (0,2.0) -- (0,1.85);
  \node[anchor=east,scale=0.75] at (-3.7,2.55) {$n+2$};
  \node[anchor=west,scale=0.75] at (3.7,2.55) {$n+3$};
  \node[anchor=west,scale=0.75] at (0.1,2.55) {$n$};

  % --- 3-input adder = two additions ---
  \draw[thick] (-2.2,1.25) rectangle (2.2,1.85);
  \node at (0,1.55) {$+$};
  \node[anchor=west,scale=0.75] at (2.35,1.55) {two additions};

  % --- output ---
  \draw[thick,-latex] (0,1.25) -- (0,0.5);
  \node[anchor=west,scale=0.8] at (0.1,0.9) {$n+4$};
  \node[anchor=north] at (0,0.45) {$A_{\mathrm{scaled}} = A\,(1+2^{-s_1}+2^{-s_2})$};
  \node[anchor=north,scale=0.8] at (0,-0.15)
       {$D_{\mathrm{scaled}} \in \left[\tfrac{126}{128},\tfrac{144}{128}\right)$};
\end{circuitikz}
\end{document}
```

*after Fig. 9.13, p. 285.*

**Start from what makes digit selection hard.** In a digit recurrence $R_{i+1} = \beta R_i - q_{-i}D$ with redundant digit set $\{-\gamma,\dots,\gamma\}$ and redundancy factor $\rho = \gamma/(\beta-1)$, the invariant $|R_i| \le \rho D$ admits the digit $q_{-i}$ exactly when

$$-\rho + \frac{\beta R_i}{D} \;\le\; q_{-i} \;\le\; \rho + \frac{\beta R_i}{D}$$

so in the P-D plane the admissible region for each digit is a **wedge** whose width, measured vertically, is $2\rho D$ — proportional to $D$. The wedges are widest at $D$ near $1$ and pinch shut as $D \to 0$, which is why the [[Quotient Digit Selection Table]] needs bits of $D$ as inputs at all, and why the tiling fails outright for small $D$. Everything below is an attempt to buy back that width.

**Exploit the invariance of the quotient under a common factor.** For any $M \neq 0$, $\frac{MX}{MD} = \frac{X}{D}$, so scaling *both* operands leaves the quotient untouched and only moves $D$ inside the P-D plane. The remainder is scaled by the same $M$, which is why an exact final remainder has to be divided back by $M$ — but the quotient digits, the only thing the selection function produces, are unaffected. This is a free change of variable, and the whole technique is about paying as little hardware as possible for the multiplication by $M$.

**Choose $M$ so it is a two-addition constant.** Assume $D$ has already been normalised to $D \in [\frac12, 1)$ by a leading-zero count and a shift (see [[Normalizers]]); the leading $1$ carries no information, so let $d$ be the **3 bits below it**, $16D \in [8,16)$. Table 9.2 assigns each of the 8 values of $d$ a factor of the form

$$M = 1 + 2^{-s_1} + 2^{-s_2}, \qquad s_1 \in \{\varnothing,1,2\},\quad s_2 \in \{\varnothing,1,3\}$$

where $\varnothing$ means "select the constant $0$", i.e. that mux contributes nothing:

| $d$ | $16D$ | $M$ | mux $A$ | mux $B$ | $128\,D_{\text{scaled}}$ |
|---|---|---|---|---|---|
| 000 | $[8,9)$    | $2$    | $\gg 1$ | $\gg 1$ | $[128,144)$ |
| 001 | $[9,10)$   | $7/4$  | $\gg 2$ | $\gg 1$ | $[126,140)$ |
| 010 | $[10,11)$  | $13/8$ | $\gg 1$ | $\gg 3$ | $[130,143)$ |
| 011 | $[11,12)$  | $12/8$ | $\gg 1$ | $0$     | $[132,144)$ |
| 100 | $[12,13)$  | $11/8$ | $\gg 2$ | $\gg 3$ | $[132,143)$ |
| 101 | $[13,14)$  | $10/8$ | $\gg 2$ | $0$     | $[130,140)$ |
| 110 | $[14,15)$  | $9/8$  | $0$     | $\gg 3$ | $[126,135)$ |
| 111 | $[15,16)$  | $9/8$  | $0$     | $\gg 3$ | $[135,144)$ |

Because $M$ is a sum of three powers of two, no multiplier appears: two hard-wired right shifts (pure routing), two 3:1 muxes of $n{+}2$ and $n{+}3$ bits, and one three-input addition. The constant set is the smallest interesting instance of [[Multiple Constant Multiplication]] — seven distinct constants, each realised in two adds by [[Shift-and-Add]] rather than by a table of products.

> [!warning] Source typo, Table 9.2, p. 285
> The book's $D$ column prints `.1100...` on all four of its last rows. The $16D$ column disambiguates them: they are `.1100`, `.1101`, `.1110`, `.1111`. The table above uses the corrected bit patterns.

**Read off the bound by taking the union.** Each row maps its half-open $D$ interval through its own $M$, and the eight images are listed in the last column. Their union is $[\frac{126}{128}, \frac{144}{128})$, so

$$D_{\text{scaled}} \in \left[\tfrac{63}{64},\ \tfrac98\right) = [0.984375,\ 1.125)$$

Note $D_{\text{scaled}}$ is allowed to exceed $1$. That would normally cost an integer bit, but it does not matter here: the selection function no longer takes $D$ as an input, so there is no table to widen (p. 284).

**Collapse the selection function into a rounding.** Since $D_{\text{scaled}}$ is within $1.6\%$ below and $12.5\%$ above $1$, the selection function may pretend it is dividing by exactly $1$ — *for digit selection only*; the recurrence still subtracts $q_{-i}D_{\text{scaled}}$ with the true value. Substituting $D = 1$ into the constraint above gives $\beta R_i - \rho \le q_{-i} \le \beta R_i + \rho$, and for $\rho > \frac12$ the integer nearest $\beta R_i$ always lies in that band. So

$$q_{-i} = \operatorname{round}(\beta R_i)$$

with ties broken upward, which at radix 4 is a **4-bit addition** rather than a lookup (Fig. 9.12b, p. 284). No table, no $D$ inputs, and — the point of the exercise — nothing whose size grows with $\beta$. That is what makes very high radices reachable at all; a table would grow as $\beta \cdot 2^{\text{bits of }D}$.

**Weigh what it costs before adopting it.** Four separate bills, all real (pp. 284-286):

1. The unit above is **duplicated**, once for $X$ and once for $D$, since both must be scaled by the same $M$ and the mux controls come from $D$ alone.
2. Both prescaled operands must be **exact**, so the iteration datapath widens by one MSB (the largest $M$ is $2$) and three LSBs (all bits of $A \gg 3$ are kept) — the $n{+}4$ on the diagram, carried through every iteration, not just the first.
3. $D_{\text{scaled}}$ is a full-width arbitrary number, so forming $q_{-i}D_{\text{scaled}}$ needs **a real multiplier**, rectangular (a few bits by $n{+}4$) but real (p. 285).
4. The initial condition $0 \le R_1 \le \rho D$ must survive the worst-case scaling of $X$. For a floating-point significand $1 \le X < 2$, Table 9.2 gives $\frac98 \le X_{\text{scaled}} < 4$, so with $\rho = \frac23$ one must take $R_1 = 2^{-3}X$ instead of the usual $X/2$ or $X/4$ — three extra bits of quotient to produce, hence possibly **more iterations** (p. 286). See [[Number Formats]] for the significand ranges.

**Know the cheap variant.** A single scaling by $\frac32$ applied when $D < \frac58$ costs one addition, removes the problematic cell of the radix-4 P-D tiling, and leaves many don't-cares in the selection table (Fig. 9.12a, p. 283). It does not collapse the table, only shrinks it, and it is the right choice when the goal is a smaller selection table rather than a higher radix.

**Read the FPGA and ASIC cases differently.** On FPGA the muxes and the two additions land in fast carry logic and cost little, but the rectangular multiplier for $q_{-i}D_{\text{scaled}}$ competes for the same DSP blocks a reciprocal-based divider would use, and at the precisions where fast carry logic is already fast enough (up to about 32 bits, p. 288) radix-4 without prescaling wins on area. On ASIC prescaling is a component of the state of the art: the [[Radix-64 Speculative Divider]] applies exactly Table 9.2 to shrink the selection input to 6 bits of the truncated $\beta\widetilde R_i$, then speculates on all digit values in parallel (p. 288).

$$\boxed{\ M = 1 + 2^{-s_1} + 2^{-s_2} \ \Longrightarrow\ D_{\text{scaled}} \in \left[\tfrac{126}{128}, \tfrac{144}{128}\right)\ \Longrightarrow\ q_{-i} = \operatorname{round}(\beta R_i)\ }$$

Where it breaks:

- **$D$ must already be normalised.** Prescaling replaces the *table*, not the leading-zero count; feed it a $D$ with leading zeros and $d$ indexes the wrong row and the bound is void.
- **At low radix it does not pay.** At $\beta = 4$ the 4-bit rounding adder is "not dramatically cheaper" than the 5-input selection table it replaces (p. 284), while the duplicated scaler and the wider datapath are charged in full. The technique earns its keep only where the table would have exploded.
- **The extra iteration can eat the gain.** $R_1 = 2^{-3}X$ costs up to $3/\alpha$ extra iterations at radix $2^\alpha$; at $\alpha = 2$ that is two iterations, which at small $w_F$ is a double-digit percentage of the loop.
- **It interacts with a redundant remainder.** With a [[Carry-Save Partial Remainder]] the rounding needs a converted, non-redundant leading slice of $\beta R_i$, and the ignored carry of weight $2^t$ eats $2^t/D$ off the overlap — the budget that made the "divide by 1" approximation safe is the same budget the truncation is spending.
- **The remainder comes out scaled.** $R_{\text{final}} = M \cdot (X - QD)$; an exact integer remainder needs an extra division by $M$, so [[Restoring Division]] or plain [[SRT Division]] is preferable whenever the remainder, not the quotient, is the product.

```spade
/// One prescaling unit (Fig. 9.13): A_scaled = A * (1 + 2^-s1 + 2^-s2).
/// Result carries 3 extra LSBs and 1 extra MSB, so it is exact.
fn prescale<#uint N>(a: uint<N>, d: uint<3>) -> uint<{N + 4}> {
    let a8: uint<{N + 4}> = zext(a) << 3;
    let m1 = match d {          // mux A: 0, >>1, >>2
        0b000 => a8 >> 1,
        0b001 => a8 >> 2,
        0b010 => a8 >> 1,
        0b011 => a8 >> 1,
        0b100 => a8 >> 2,
        0b101 => a8 >> 2,
        _     => 0,
    };
    let m2 = match d {          // mux B: 0, >>1, >>3
        0b011 => 0,
        0b101 => 0,
        0b000 => a8 >> 1,
        0b001 => a8 >> 1,
        _     => a8 >> 3,
    };
    let s1: uint<{N + 4}> = trunc(a8 + m1);
    trunc(s1 + m2)
}
```

`a8` is the vertical $A$ bus of the diagram, pre-shifted left by 3 so the three fractional bits the scaling creates are held as integer bits — that is the entire content of the "$n+3$ LSBs" note in the book, expressed as a scale factor of 8 on the whole datapath. `m1` and `m2` are the two mux outputs; every `>>` is a constant, so synthesis emits wiring and a pair of 3:1 muxes, not shifters. Both `trunc` calls are provably exact rather than wrapping: the largest possible result is $16(2^N-1) < 2^{N+4}$, attained at $d = 000$ where $M = 2$. The drawing shows one three-input adder; Spade's two `+` become a carry-save addition followed by one carry-propagate adder on ASIC, or two carry-chain adders on FPGA. Combinational throughout — instantiate it twice, once with $a = X$ and once with $a = D$, both driven by the same $d$.

**Related Notes.**

- [[SRT Division]] – depends-on: the recurrence and the invariant $|R_i| \le \rho D$ that prescaling manipulates.
- [[Quotient Digit Selection Table]] – compares: the table this circuit exists to delete, and the fallback when the scaling hardware is too expensive.
- [[Shift-and-Add]] – supports: how each of the seven factors is realised in two additions.
- [[Multiple Constant Multiplication]] – extends: the general problem of which constant sets are cheap in shifts and adds.
- [[Normalizers]] – depends-on: supplies the $D \in [\frac12,1)$ that makes the 3-bit index meaningful.
- [[Rounding]] – supports: the round-to-nearest-with-ties-up that becomes the selection function.
- [[Radix-64 Speculative Divider]] – extends: uses exactly Table 9.2 as one of four stacked techniques.
- [[Carry-Save Partial Remainder]] – counter-example: the truncation error it introduces spends the same redundancy budget prescaling relies on.
- [[Comparison-Based Digit Selection]] – compares: the other escape from a $D$-dependent selection table, by comparing against precomputed multiples instead of moving $D$.
- [[Choosing a Divider]] – compares: where a prescaled high-radix divider sits against every sibling.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §9.2.8 "High-radix integer division and prescaling", pp. 282-286 — Table 9.2 (p. 285), Fig. 9.12 (p. 284), Fig. 9.13 (p. 285).
- Ibid., §9.2.9, pp. 286-287 — interaction with a carry-save remainder, (9.44)-(9.45).
- Ibid., §9.2.10, p. 288 — [Bru18] radix-64 case study using Table 9.2 prescaling.
- Table 9.2 is originally from [EL90] (Ercegovac & Lang).
