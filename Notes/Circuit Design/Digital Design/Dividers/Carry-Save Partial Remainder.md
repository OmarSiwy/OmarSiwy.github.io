---
title: "Carry-Save Partial Remainder"
description: "Keeps R_i in carry-save so the iteration has no carry propagation at all — the bill arrives at digit selection, where the ignored truncated carry eats 2^t/D off the selection-interval overlap."
kind: circuit
source: "ASA §9.2.9, pp. 286-288"
status: seed
spade: simulated
tags: [digital, dividers, srt, carry, redundant, fpga]
aliases:
  - "Carry-Save Remainder"
  - "Redundant Partial Remainder"
  - "Carry-Save Partial Remainder"
---

# Carry-Save Partial Remainder

A digit-recurrence divider whose partial remainder is stored as a sum/carry pair rather than a single two's-complement word, so that one iteration costs one full-adder delay instead of one carry propagation — at the price of a larger quotient-digit selection function.

```tikz title="One iteration of an SRT divider with the partial remainder held in carry-save form"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % --- the state: R_i held as a redundant (sum, carry) pair -------------
  \draw (-4.8,4.2) rectangle (-3.2,5.0);
  \node at (-4.0,4.6) {$R^{s}_i$};
  \draw (-2.6,4.2) rectangle (-1.0,5.0);
  \node at (-1.8,4.6) {$R^{c}_i$};
  \node[anchor=south] at (-2.9,5.05) {$R_i = R^{s}_i + R^{c}_i$, \ $w_R$ bits each};

  % --- both words shift left by one radix digit -------------------------
  \draw (-4.0,4.2) -- (-4.0,0.2);
  \draw (-1.8,4.2) -- (-1.8,0.2);
  \node[anchor=west] at (-3.95,3.1) {$\ll 1$};
  \node[anchor=west] at (-1.75,3.1) {$\ll 1$};
  \node[anchor=west] at (-3.95,1.6) {$\beta R^{s}_i$, $w_R$};
  \node[anchor=west] at (-1.75,1.6) {$\beta R^{c}_i$, $w_R$};

  % --- short CPA on the leading bits only, then the selection table -----
  \draw (-4.0,3.9) -- (1.2,3.9) -- (1.2,3.4);
  \draw (-1.8,3.6) -- (2.4,3.6) -- (2.4,3.4);
  \draw (0.2,2.6) rectangle (3.4,3.4);
  \node at (1.8,3.0) {\textsf{CPA} on the 6 MSBs};
  \draw (1.8,2.6) -- (1.8,2.2);
  \node[anchor=west] at (1.85,2.4) {$\beta\widetilde R_i$, 6 bits};
  \draw (0.2,1.4) rectangle (3.4,2.2);
  \node at (1.8,1.8) {\textsf{sel}};
  \draw (4.4,5.2) -- (4.4,1.8) -- (3.4,1.8);
  \node[anchor=west] at (4.45,2.6) {3 MSBs of $D$};
  \draw (1.8,1.4) -- (1.8,0.9) -- (4.4,0.9);
  \node[anchor=south] at (3.1,0.95) {$q_{-i}$, 2 bits};

  % --- addend multiplexer: 0, D or bitwise-NOT D ------------------------
  \draw (7.0,5.6) -- (7.0,1.6);
  \node[anchor=south] at (7.0,5.62) {$D$, $w_R$};
  \draw (7.0,5.2) -- (4.4,5.2);
  \draw (6.0,1.6) -- (6.0,1.2);
  \draw (7.0,1.6) -- (7.4,1.6) -- (7.4,1.2);
  \draw (4.2,1.2) -- (8.0,1.2) -- (7.6,0.6) -- (4.6,0.6) -- cycle;
  \node at (6.1,0.88) {\textsf{mux}};
  \node[anchor=south] at (4.6,1.22) {$0$};
  \node[anchor=south east] at (5.93,1.22) {$D$};
  \node[anchor=south east] at (7.33,1.22) {$\overline{D}$};
  \draw (6.1,0.6) -- (6.1,0.2);
  \node[anchor=east] at (6.05,0.4) {$-q_{-i}D$, $w_R$};

  % --- one row of full adders: the entire arithmetic of the iteration ---
  \draw (-4.8,-0.6) rectangle (7.2,0.2);
  \node at (1.2,-0.2) {\textsf{3:2 carry-save adder} \ --- one full-adder row,
    no carry propagation, $c_{\text{in}} = [\,q_{-i}{=}{+}1\,]$};

  % --- feedback: sum word on the left, carry word over the top ----------
  \draw (-4.0,-0.6) -- (-4.0,-1.4);
  \node[anchor=west] at (-3.95,-1.05) {$R^{s}_{i+1}$};
  \draw[->] (-4.0,-1.4) -- (-6.5,-1.4) -- (-6.5,4.6) -- (-4.8,4.6);
  \draw (-1.8,-0.6) -- (-1.8,-2.0);
  \node[anchor=west] at (-1.75,-1.05) {$R^{c}_{i+1}$};
  \draw[->] (-1.8,-2.0) -- (-7.3,-2.0) -- (-7.3,5.8) -- (0.4,5.8) -- (0.4,4.6) -- (-1.0,4.6);
  \node[anchor=north] at (1.2,-2.3) {one iteration = one clock cycle;
    the critical path is \textsf{CPA} $\to$ \textsf{sel} $\to$ \textsf{mux} $\to$ one full adder};
\end{circuitikz}
\end{document}
```

*Radix-2 instance; the selection widths shown are those of the radix-4, $\gamma=2$ table of Fig. 9.7, p. 276.*

**Find the carry propagation before removing it.** The digit recurrence

$$R_{i+1} = \beta R_i - q_{-i} D \tag{9.16}$$

is, in a plain two's-complement datapath, one $w_R$-bit carry-propagate subtraction per iteration, where $w_R$ is the working width of the remainder ($w_F + 2$ or so for a significand divider — see [[Number Formats]]). Everything else in the loop is width-independent: $\beta R_i$ is a wire shift, $q_{-i}D$ is a multiplexer over $\{0, \pm D, \pm 2D\}$ because $q_{-i}$ is a handful of bits, and the selection function reads only a fixed number of leading bits. So the cycle time is $O(w_R)$ — or $O(\log w_R)$ with a prefix adder — for one reason only, and that reason is the accumulation of $R$.

**Split the remainder into two words and the propagation disappears.** Store $R_i$ redundantly as an unevaluated pair $(R^s_i, R^c_i)$ of $w_R$ bits each, with $R_i = R^s_i + R^c_i$ never actually formed — the two-word member of the family in [[Redundant Number Systems]]. Then $\beta R_i - q_{-i}D$ is a sum of *three* aligned vectors, $\beta R^s_i$, $\beta R^c_i$ and the single addend $-q_{-i}D$, because $q_{-i}$ is small enough that its product with $D$ is one multiplexer output rather than a partial-product array. A height-3 [[Bit Heaps|bit heap]] collapses to height 2 in exactly one row of full adders, which is the [[Carry-Save Adder]]; at a higher radix where $q_{-i}D$ needs two addends the heap is height 4 and a [[Compressor Trees|compressor tree]] of two levels does it. Either way the reduction depth is a constant set by the radix, not by $w_R$: no carry propagation at all in the loop (p. 286).

**The subtraction stays exact because the carry word has a free bit.** With $q_{-i} > 0$ the addend is $-q_{-i}D$, and the two's-complement identity $-x = \bar{x} + 1$ turns that into the bitwise complement plus a unit in the last place. A fourth addend would break the height-3 argument — but a carry-save adder emits its carry vector shifted left by one position, so bit $0$ of $R^c_{i+1}$ is structurally zero and the $+1$ can be injected there for free. This is why the diagram shows $\overline{D}$ into the multiplexer and $c_{\text{in}} = [\,q_{-i}{=}{+}1\,]$ into the compressor rather than an extra input.

**The cost moves, it does not vanish, and it lands on digit selection.** The selection function now faces a remainder that occupies twice as many bits: a direct table on the redundant pair would need $6 + 6 + 3 = 15$ inputs where the non-redundant table of Fig. 9.8 needed $9$ (6 bits of $\beta R_i$ and 3 of $D$). The fix is to reconstruct a short non-redundant estimate with a fast carry-propagate adder over the leading bits only — the $\textsf{CPA}$ block in the diagram — but a redundant number truncated at position $t$ has lost an unknown carry of weight $2^t$ coming up from the discarded part:

$$\beta \widetilde R_i = \beta R_i + \delta, \qquad \delta = 0 \ \text{or}\ -2^t \tag{9.44}$$

The approximation is **one-sided**: $\beta\widetilde R_i \le \beta R_i \le \beta \widetilde R_i + 2^t$. That asymmetry matters. Substituting the worst case of each inequality into the selection constraint $-\rho + \beta R_i/D \le q_{-i} \le \rho + \beta R_i/D$ of (9.30) — dividing by $D > 0$ preserves the ordering — tightens it to

$$-\rho + \frac{2^t}{D} + \frac{\beta\widetilde R_i}{D} \;\le\; q_{-i} \;\le\; \rho + \frac{\beta \widetilde R_i}{D} \tag{9.45}$$

Only the lower bound moves. In the P-D coordinates of [[SRT Division]] the *upper* edge of every selection wedge drops by the constant $2^t$ while the lower edge stays pinned to the origin, so consecutive wedges overlap by $(2\rho-1)D - 2^t$ instead of $(2\rho-1)D$.

```tikz title="Selection wedges for digits 0 and +1, exact versus truncated redundant remainder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,x=11cm,y=7cm,>=latex]
  % Radix 4, gamma = 2, rho = 2/3, truncation at t = -4 so 2^t = 1/16.
  % Boundary between the digits 0 and +1, in the P-D plane.
  % survives: (1/3)D <= beta Rtilde <= (2/3)D - 2^t
  \fill[green!16] (0.5,0.16667) -- (1.0,0.33333) -- (1.0,0.60417) -- (0.5,0.27083) -- cycle;
  % eaten by the ignored carry: a strip of constant height 2^t
  \fill[red!22]   (0.5,0.27083) -- (1.0,0.60417) -- (1.0,0.66667) -- (0.5,0.33333) -- cycle;

  % truncation lattice: 3 bits of D by 4 fractional bits of beta Rtilde
  \draw[black!25,very thin] (0.5,0) -- (1.0,0);
  \foreach \yy in {0.0625,0.125,...,0.75} \draw[black!25,very thin] (0.5,\yy) -- (1.0,\yy);
  \foreach \xx in {0.5,0.625,...,1.0}     \draw[black!25,very thin] (\xx,0) -- (\xx,0.75);

  % exact boundaries (dashed) and truncated ones (solid)
  \draw[dashed,thick] (0.5,0.33333) -- (1.0,0.66667);
  \draw[very thick]   (0.5,0.27083) -- (1.0,0.60417);
  \draw[very thick]   (0.5,0.16667) -- (1.0,0.33333);

  % axes
  \draw[->] (0.48,0) -- (0.48,0.78);
  \node[anchor=south east] at (0.482,0.78) {$\beta\widetilde R_i$};
  \draw[->] (0.5,-0.03) -- (1.02,-0.03);
  \node[anchor=west] at (1.025,-0.03) {$D$};
  \node[anchor=north] at (0.5,-0.04) {$\tfrac12$};
  \node[anchor=north] at (1.0,-0.04) {$1$};

  % what each region means
  \node[anchor=west] at (0.52,0.70) {$q_{-i}={+}1$ only};
  \node[anchor=west] at (0.52,0.075) {$q_{-i}=0$ only};
  \node[anchor=west] at (0.62,0.31) {both digits legal};
  \draw[<->,thick] (0.94,0.56417) -- (0.94,0.62667);
  \node[anchor=south] at (0.94,0.635) {$2^{t}$ lost};
  \node[anchor=north west,align=left] at (0.5,-0.10)
    {$\rho=\tfrac23$ (radix 4, $\gamma=2$), $t=-4$.\ \ Dashed: the exact boundary $\beta R_i=\rho D$.\\
     Solid: the boundary once the truncated carry is charged to the selection function.};
\end{circuitikz}
\end{document}
```

*after Fig. 9.14, p. 287, restricted to the $0/{+}1$ boundary.*

**Redundancy is the budget the truncated carry is spent out of.** Dividing the overlap by $D$ puts it in the same units as the approximation error of [[Quotient Digit Selection Table|the selection derivation]]: an estimate $\hat y$ of $y = \beta R_i / D$ is safe iff its uncertainty $\varepsilon < 2\rho - 1$, and here $\varepsilon = 2^t/D$. Two consequences follow. The binding case is $D$ at its *smallest*, $D = 1/2$ for a normalized significand, where $2^t/D = 2^{t+1}$ — which is the same reason the P-D wedges narrow toward the origin. And the trade is monotone in $\rho$: a maximally redundant digit set ($\gamma = \beta - 1$, $\rho = 1$) can absorb a coarse $t$, while $\rho$ barely above $1/2$ cannot afford any truncated carry at all. The book's worked case is $t = -4$ at $\rho = 2/3$: the overlap survives, but 6 bits of $\beta\widetilde R_i$ and 3 bits of $D$ are no longer enough to tile it (Fig. 9.14, p. 287).

> [!warning] The source does not say what the selection function grows to
> Fig. 9.14 establishes that $6{+}3$ inputs stop working at $t=-4$; the book gives no replacement figure for the required input width, and no LUT or delay cost for the enlarged table. Sizing it needs outside data or a FloPoCo run.

**Count the iterations and price the loop control.** Nothing about carry-save changes the iteration count, which comes from the exact identity (9.34) and the invariant bound

$$\left|\frac{R_1}{D} - Q_i\right| \le \rho\,\beta^{-i} \tag{9.35}$$

so a correctly-rounded floating-point quotient needing $w_F+3$ bits takes $k = \lceil (w_F+3)/\alpha \rceil$ iterations at radix $2^\alpha$ — $w_F + 3$ cycles at radix 2, and no unrolling is implied. What carry-save costs the loop is: a second $w_R$-bit register bank; the leading-bits $\textsf{CPA}$, which is *inside* the cycle and is the reason the critical path is not literally one full-adder delay; and one final $w_R$-bit carry propagation to resolve $R^s_k + R^c_k$ — needed only if you want the remainder itself or its sign for rounding, not if you only want $Q$. The quotient side is unaffected: it is still assembled by [[On-the-Fly Quotient Conversion|on-the-fly conversion]], which is wiring.

**On ASIC this is the main lever; on FPGA it is usually not.** Parhami's observation, echoed by the chapter, is that computing the partial remainder digit-parallel buys more than raising the radix to cut the iteration count, which is why radix-2 with a redundant remainder is a perfectly sane ASIC design point; a 1997 survey of radix-2 and radix-4 implementations found that *divider performance is only weakly sensitive to reasonable choices of architecture but significantly improved by aggressive circuit techniques* [HOH97] (p. 287). On [[FPGAs]] the arithmetic is different, because the hard carry chain makes a full carry-propagate remainder fast enough up to about 32 bits, and the digit product merges into the addition LUTs anyway (p. 288). Above 32 bits the recommended form is *high-radix* carry-save, which keeps one carry bit per chunk rather than per bit — the register overhead is $1/16$ for a chunk size of 16, not $2\times$ — and even there the dominant overhead is the larger selection function, not the registers. Bruguera's double-precision divider [Bru18] combines everything: three radix-4 steps per cycle ($64 = 2^{2\times3}$), $R_i$ in carry-save, prescaling to shrink the selection input to 6 bits of $\beta\widetilde R_i$, and all candidate $\beta R_i - q_{-i}D$ speculatively computed in parallel (p. 288) — see [[Radix-64 Speculative Divider]].

$$\boxed{\ (R^{s}_{i+1}, R^{c}_{i+1}) = \mathrm{CSA}\big(\beta R^{s}_i,\ \beta R^{c}_i,\ -q_{-i}D\big), \qquad \text{overlap} \;=\; 2\rho - 1 - \frac{2^t}{D}\ }$$

**When it breaks.**

- **$D$ near its lower bound.** $2^t/D$ is largest at $D = 1/2$, where it is $2^{t+1}$. Choose $t$ against that corner, not against $D \approx 1$.
- **Low redundancy.** If $2^t/D \ge 2\rho - 1$ no threshold placement exists and the recurrence can leave the invariant $|R_i| \le \rho D$ — divergence, not a rounding error. $\rho$ barely above $1/2$ (that is, $\gamma = \beta/2$ at even radix) leaves almost nothing to spend.
- **The selection table stops being cheap first.** At $\rho = 2/3$ and $t = -4$ the overlap still exists but no longer admits the $6{+}3$-bit tiling, so the saving in the datapath is paid back in table inputs. [[Divisor Prescaling]] is the usual counter-move: push $D$ toward 1 and the selection function stops depending on $D$ at all.
- **Widths below ~32 bits on FPGA.** The hard carry chain makes the non-redundant remainder fast enough that the second register bank and the estimate CPA are pure loss (p. 288).
- **You wanted the remainder.** $R$ arrives unevaluated. Correct rounding needs its sign, so one $w_R$-bit carry propagation reappears — once, outside the loop, which is the whole point.

**RTL (Spade).**

```spade
/// 3:2 carry-save compression: `s + c` equals `a + b + x` modulo 2^W.
fn csa3<#uint W>(a: uint<W>, b: uint<W>, x: uint<W>) -> (uint<W>, uint<W>) {
    let s = a ^ b ^ x;
    let m = (a & b) | (a & x) | (b & x);
    (s, m << 1)
}

/// Truncated estimate of the redundant value: a carry-propagate add over the
/// leading bits only. The carry out of position t is discarded, so the result
/// is one-sided:  est <= true value <= est + 2^t.
fn est6<#uint W, #uint T>(ss: uint<W>, sc: uint<W>) -> int<6> {
    let hs = ss.as_bits()[T..W].as_uint();
    let hc = sc.as_bits()[T..W].as_uint();
    (hs +. hc).as_int()
}

/// One iteration of the radix-2 SRT recurrence, R_i carried as (rs, rc).
entity srt2_cs_step<#uint W>(rs: uint<W>, rc: uint<W>, d: uint<W>)
    -> (uint<W>, uint<W>, int<2>)
{
    let ss = rs << 1;                       // beta R_i, both words
    let sc = rc << 1;
    let y  = est6::<W, {W - 6}>(ss, sc);    // 6-bit estimate, ulp = 2^t
    let q: int<2> = if y >= 8 { 1 } else if y <= -9 { -1 } else { 0 };
    let addend = if q == 1 { ~d } else if q == -1 { d } else { 0 };
    let cin    = q == 1;                    // the +1 of  -D = ~D + 1
    let (s0, c0) = csa3::<W>(ss, sc, addend);
    let cw: uint<W> = zext(cin.as_uint());  // rides in the free LSB of the carry word
    (s0, c0 | cw, q)
}
```

`rs`/`rc` are the two register banks at the top of the diagram and `ss`/`sc` the shifted buses; `est6` is the short $\textsf{CPA}$, taking `W - 6` as its truncation position so `T` *is* $t$ in (9.44). The block is purely combinational — the loop is this entity plus two $W$-bit registers and a $\lceil\log_2 k\rceil$-bit counter, one iteration per cycle. Widths never grow: `csa3` is bit-parallel and the shifts are the truncating $W$-bit kind, because the invariant $|R_i| \le \rho D$ is what keeps the value in range, not extra headroom. Synthesis will not build the multiplexer the diagram draws: the `if` chain, the complement and one full adder bit merge into a single LUT per bit position, which is exactly the FPGA packing of p. 276.

Compiled with `spade 0.19.0` and simulated with `iverilog` at $W = 16$: 10170 vectors — named asymmetric cases including $1 + 128$ and its swap, two 5000-vector random sweeps (one with $D$ normalized), and a directed sweep across both selection thresholds — all matching the behavioural reference $R_{i+1} \equiv 2(R^s_i + R^c_i) - q_{-i}D \pmod{2^{16}}$.

**Related notes.**

- [[SRT Division]] – extends: this is the same recurrence and the same selection derivation, with the accumulator made redundant.
- [[Carry-Save Adder]] – depends-on: the one full-adder row that replaces the carry propagation.
- [[Redundant Number Systems]] – depends-on: the two-word representation and why an unevaluated sum is still a number.
- [[Compressor Trees]] – extends: at radix $\ge 4$ with two addends the height-4 heap needs a tree, not a single row.
- [[Bit Heaps]] – supports: the "three aligned vectors" accounting that fixes the reduction depth.
- [[Quotient Digit Selection Table]] – compares: the table this circuit makes more expensive, and the $\varepsilon < 2\rho-1$ budget it spends.
- [[Comparison-Based Digit Selection]] – counter-example: selecting by comparing against multiples of $D$ instead, which puts carry propagations *back* in series.
- [[On-the-Fly Quotient Conversion]] – supports: keeps the quotient side free of carry propagation too, so the whole loop is width-independent.
- [[Divisor Prescaling]] – compares: attacks the same selection function from the $D$ side rather than the $R$ side.
- [[Radix-64 Speculative Divider]] – extends: carry-save remainder plus prescaling plus speculation, all at once.
- [[Choosing a Divider]] – compares: where a redundant-remainder SRT sits against the multiplicative family.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9.

- §9.2.9 "Speeding up the partial remainder", (9.44)–(9.45), Fig. 9.14, pp. 286–287.
- §9.2.4 redundant digit sets and the selection interval, (9.27)–(9.30), pp. 272–275.
- §9.2.5 termination bound (9.33)–(9.35), pp. 279–280.
- §9.2.10 case study [Bru18], and the FPGA discussion of high-radix carry-save, p. 288.
- Selection-function input widths for radix 4, $\gamma = 2$: Figs. 9.7–9.8, pp. 276–277.
