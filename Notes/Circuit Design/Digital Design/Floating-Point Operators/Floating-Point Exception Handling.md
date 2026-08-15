---
title: "Floating-Point Exception Handling"
description: "The unpack/pack logic that decodes NaN, infinity, zero and subnormal codes on the way in and re-encodes overflow and underflow from a wE+2-bit exponent on the way out; a flat layer of gates around every operator in the chapter."
kind: circuit
source: "ASA §11.1-11.5 (Tables 11.1-11.4, pp. 331, 343, 348, 353) with §2.5.1 and §2.5.3 (Tables 2.1, 2.3, 2.4, pp. 51-55)"
status: seed
spade: simulated
tags: [digital, floating-point-operators, exceptions, nan, infinity, subnormal, overflow, ieee754, fpga]
aliases:
  - FP Exception Handling
  - Unpack and Pack
  - Floating-Point Unpack
  - Floating-Point Pack
  - Unpack Block
  - Pack Block
  - Exceptional Case Management
---

# Floating-Point Exception Handling

The two flat gate layers that bracket every operator in the chapter: `unpack` turns the stolen exponent codes into one-hot flags before the datapath runs, and `pack` turns those flags plus two guard bits of an over-wide exponent back into a code afterwards — the only part of a floating-point operator whose logic depth does not grow with $w_F$.

```tikz title="Unpack decodes the IEEE exponent field into four one-hot flags and the implicit bit; pack re-encodes the result from those flags and a two-bit-wider exponent"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize,
  blk/.style={draw,fill=gray!8,align=center,inner sep=3pt}]

% ================= UNPACK =================
\node[anchor=west,font=\small\bfseries] at (-3.5,7.5) {unpack -- one operand, IEEEfloat};

\draw[very thick,->] (-3.5,6.1) -- (-2.1,6.1);
\node[anchor=east] at (-3.55,6.1) {$E_X$ \;($w_E$)};
\draw[very thick,->] (-3.5,4.0) -- (-1.65,4.0);
\node[anchor=east] at (-3.55,4.0) {$F_X$ \;($w_F$)};

\draw[very thick] (-2.1,6.6) -- (-2.1,5.6);
\draw[->] (-2.1,6.6) -- (-1.65,6.6);
\draw[->] (-2.1,5.6) -- (-1.65,5.6);

\node[blk,minimum width=1.5cm,minimum height=0.5cm] (nz) at (-0.9,6.6) {NOR$_{w_E}$};
\node[blk,minimum width=1.5cm,minimum height=0.5cm] (nm) at (-0.9,5.6) {AND$_{w_E}$};
\node[blk,minimum width=1.5cm,minimum height=0.5cm] (nf) at (-0.9,4.0) {NOR$_{w_F}$};

\node[anchor=north,font=\tiny] at (-0.9,6.30) {$z=[E_X\!=\!0]$};
\node[anchor=north,font=\tiny] at (-0.9,5.30) {$m=[E_X\!=\!2^{w_E}\!\!-\!1]$};
\node[anchor=south,font=\tiny] at (-0.9,4.30) {$\varphi=[F_X\!=\!0]$};

% rails
\draw (-0.15,6.6) -- (1.6,6.6);
\draw (-0.15,5.6) -- (2.0,5.6);
\draw (-0.15,4.0) -- (2.4,4.0);

% inverted phi
\draw (0.35,4.0) -- (0.35,3.1);
\node[not port,scale=0.5] (inv) at (0.95,3.1) {};
\draw (0.35,3.1) -- (inv.in);
\draw (inv.out) -- (2.8,3.1);
\node[anchor=north,font=\tiny] at (1.9,3.00) {$\overline{\varphi}$};

% gates
\node[and port,scale=0.55] (gz) at (4.8,6.6) {};
\node[and port,scale=0.55] (gi) at (4.8,5.6) {};
\node[and port,scale=0.55] (gn) at (4.8,4.6) {};
\node[and port,scale=0.55] (gs) at (4.8,3.6) {};
\node[not port,scale=0.5]  (gv) at (4.8,2.6) {};

\draw (1.6,6.6) |- (gz.in 1);
\draw (2.4,4.0) |- (gz.in 2);
\draw (2.0,5.6) |- (gi.in 1);
\draw (2.4,4.0) |- (gi.in 2);
\draw (2.0,5.6) |- (gn.in 1);
\draw (2.8,3.1) |- (gn.in 2);
\draw (1.6,6.6) |- (gs.in 1);
\draw (2.8,3.1) |- (gs.in 2);
\draw (1.6,6.6) |- (gv.in);

\draw[->] (gz.out) -- ++(0.7,0) node[anchor=west] {is\_zero};
\draw[->] (gi.out) -- ++(0.7,0) node[anchor=west] {is\_inf};
\draw[->] (gn.out) -- ++(0.7,0) node[anchor=west] {is\_nan};
\draw[->] (gs.out) -- ++(0.7,0) node[anchor=west] {is\_subnormal};
\draw[->] (gv.out) -- ++(0.9,0) node[anchor=west] {$n$ \;(implicit bit)};

\node[anchor=west,font=\tiny,align=left] at (-3.55,2.5)
  {Nfloat replaces this whole\\panel with a 2-bit decoder\\on the exn field};

% ================= PACK =================
\draw[dashed,gray] (-3.7,1.7) -- (10.9,1.7);
\node[anchor=west,font=\small\bfseries] at (-3.5,1.25) {pack -- re-encode};

\draw[very thick,->] (-3.5,0.35) -- (4.4,0.35) -- (4.4,-0.1);
\node[anchor=east,font=\tiny,align=right] at (-3.55,0.35)
  {exn$_X$, exn$_Y$ \;(2$+$2)\\$s_X$, $s_Y$};

\draw[very thick,->] (-3.5,-1.75) -- (-1.9,-1.75);
\node[anchor=east,font=\tiny,align=right] at (-3.55,-1.75)
  {$E_R$ \;($w_E{+}2$)\\from the rounding adder};
\draw[very thick] (-1.9,-1.25) -- (-1.9,-2.25);
\draw[->] (-1.9,-1.25) -- (-1.75,-1.25);
\draw[->] (-1.9,-2.25) -- (-1.75,-2.25);

\node[blk,minimum width=2.3cm,minimum height=0.55cm] (cmp1) at (-0.6,-1.25)
  {$\ge 2^{w_E}\!-\!1$};
\node[blk,minimum width=2.3cm,minimum height=0.55cm] (cmp2) at (-0.6,-2.25)
  {$\le 0$};
\draw[->] (0.55,-1.25) -- node[above,font=\tiny]{ovf} (2.7,-1.25);
\draw[->] (0.55,-2.25) -- node[below,font=\tiny]{unf} (2.7,-2.25);

\node[blk,minimum width=3.4cm,minimum height=2.4cm] (tbl) at (4.4,-1.3)
  {two-level logic\\for Table 11.1\\(11.2 / 11.3 / 11.4\\for $\times$, $/$, $\sqrt{\ }$)};

\draw[very thick,->] (6.1,-0.7) -- node[above,font=\tiny]{exn$_R$ \;(2)} (8.3,-0.7);
\draw[very thick,->] (6.1,-1.3) -- node[above,font=\tiny]{$s_R$}          (8.3,-1.3);
\draw[very thick,->] (6.1,-1.9) -- node[above,font=\tiny]{sel \;(2)}      (8.3,-1.9);
\node[anchor=west,font=\tiny,align=left] at (8.4,-1.3)
  {to the result encoder\\and the significand mux};

\node[anchor=west,font=\tiny,align=left] at (-3.55,-3.2)
  {Nfloat: the two constants become $\ge 2^{w_E}$ and $<0$ -- the overflow bit and the sign bit of $E_R$ on their own.};

\end{circuitikz}
\end{document}
```

**Split the layer into a format question and an arithmetic question.** Everything the block labelled *unpack & exception handling* in Figs. 11.5-11.10 does is one of two independent jobs. The first is **decoding**: recognising, from the bit pattern alone, which of the five categories — zero, subnormal, normal, infinity, NaN — an operand belongs to. That depends only on the encoding, and not at all on which operator it feeds. The second is **closure**: given the categories of the operands, deciding the category of the result, as tabulated in Tables 11.1, 11.2, 11.3 and 11.4 (pp. 331, 343, 348, 353). That depends only on the operation, and not at all on the encoding. The two are wired in series but designed apart, which is why the same layer is drawn identically around an adder, a multiplier, a divider and a square root while only the middle table changes. See [[Floating-Point Adder]], [[Floating-Point Multiplier]], [[Floating-Point Divider]], [[Floating-Point Square Root]].

**Decode the exponent field, because that is where IEEE hid the special values.** In an $\mathrm{IEEEfloat}(w_E,w_F)$ number the sign is $1$ bit, the exponent field $E$ is $w_E$ bits and the fraction $F$ is $w_F$ bits ([[Floating-Point Formats]], §2.5.1). Normal numbers occupy $E\in[1,2^{w_E}-2]$; the two extremal codes are reserved (Table 2.1, p. 51). So three predicates over the raw fields settle everything:

$$z=[E=0]=\overline{\textstyle\bigvee_i E_i},\qquad m=[E=2^{w_E}-1]=\textstyle\bigwedge_i E_i,\qquad \varphi=[F=0]=\overline{\textstyle\bigvee_j F_j}$$

and the five categories are the four surviving conjunctions plus their complement, **by construction of the encoding rather than by any arithmetic argument**:

$$\text{zero}=z\varphi,\qquad \text{subnormal}=z\overline{\varphi},\qquad \infty=m\varphi,\qquad \mathrm{NaN}=m\overline{\varphi}$$

$z$ and $m$ are mutually exclusive because $w_E\ge1$, so no further arbitration is needed. Hardware: one $w_E$-input NOR, one $w_E$-input AND, one $w_F$-input OR, one inverter and four 2-input ANDs, per operand. Depth is $\lceil\log_2 w_F\rceil+2$ for 2-input gates, and $\varphi$ is always the critical one of the three since $w_F>w_E$ in every format of Table 2.2.

**Get the implicit bit out of the same NOR for free.** §2.5.1.2 packs normals and subnormals into a single formula (2.17)-(2.18) by defining an *is normal* bit $n$, so that a number is $X=(-1)^s\,2^{E-E_0+1-n}(n+F)$ with $n=0$ exactly when $E=0$. That is $n=\overline{z}$ — one inverter on a signal the decode already computed. The datapath then uses $n$ twice (p. 340): as the leading significand bit, $M_X=n_X.F_X$ rather than a hardwired $1$, and inside the exponent difference, which becomes $E_X-n_X-(E_Y-n_Y)$. This is the entire input-side cost of subnormal support in an adder, and it lands in the unpack block rather than in the datapath — see [[Exponent Difference and Swap Unit]] and [[Subnormal Normalization Unit]].

**Nfloat deletes the decode by paying two bits per wire.** FloPoCo's $\mathrm{Nfloat}(w_E,w_F)$ prepends an explicit 2-bit `exn` field instead of stealing exponent codes (Fig. 2.15 and Table 2.3, p. 54): `00` zero, `01` normal, `10` infinity, `11` NaN, with subnormals simply not represented. Decoding is then a 2-to-4 decoder — one gate level, independent of $w_F$ — and the whole left panel of the diagram vanishes. The price is $w_E+w_F+3$ bits per number against $w_E+w_F+1$ (Table 2.4, p. 55), and those two bits are paid not once but on every register, every bus and every pipeline stage the number crosses. The compensation is that the two stolen codes come back: the normal exponent field spans the full $[0,2^{w_E}-1]$, so an Nfloat has one binade more range at each end than an IEEEfloat with the same $w_E$.

**Read the result category off the operand categories, never off the operand values.** Every entry of Tables 11.1-11.4 that is not $\lfloor X\ \mathrm{op}\ Y\rceil$ is a constant or a copy of an input, so the closure logic is a Boolean function of the two 2-bit categories and the two signs — six inputs, two levels, regardless of $w_E$ and $w_F$. The rules that are not obvious:

- **Addition** (Table 11.1). NaN absorbs everything. $(+\infty)+(-\infty)$ is NaN — the indeterminate form — while two infinities of like sign return that infinity, so the infinity row needs an $s_X\!=\!s_Y$ comparison and is not a plain absorption. For two zeros the standard picks $(-0)+(-0)=-0$ and $+0$ for the three other sign combinations, i.e. $s_R=s_X\wedge s_Y$; that choice is **specific to round-to-nearest** (p. 332), so this one product term is rounding-mode logic hiding inside format logic. Zero plus a finite operand returns the *other operand unchanged*, which is a significand multiplexer, not a constant.
- **Multiplication** (Table 11.2, p. 343). Only $0\times\infty$ manufactures a NaN. The sign is $s_X\oplus s_Y$ uniformly, on the exceptional rows as well as the finite one, so the sign datapath is a single XOR that never has to be muxed.
- **Division** (Table 11.3, p. 348). $0/0$ and $\infty/\infty$ are NaN; $x/0=\pm\infty$; $x/\infty=\pm0$. The sign is again $s_X\oplus s_Y$ everywhere.
- **Square root** (Table 11.4, p. 353). Unary, so the table is one row — but the committee chose $\sqrt{-0}=-0$ rather than NaN, because signed zeros are still zeros. The consequence is stated on p. 353 and is easy to get wrong: **the operator may not return NaN on the sign bit alone; it must also test for zero.** Two gates instead of one, in the one operator whose exception layer would otherwise be trivial.

**Read overflow and underflow off two guard bits the exponent path was already carrying.** The result category is not settled by the inputs alone: a finite $\times$ finite can still leave the format. Rather than compare and correct inside the datapath, the exponent update is simply kept **exact on $w_E+2$ bits** — the $w_E$ field bits, one overflow bit above them, and one sign bit above that (p. 338; the same choice is made for the multiplier on p. 345 and the divider on p. 349). Two guard bits suffice because the tentative exponent can exceed the field by at most one binade before rounding and can fall below zero by at most the leading-zero count, both of which the saturated LZC bounds. Pack then applies a plain constant comparison ([[Comparators]]). Since IEEE normals occupy $[1,2^{w_E}-2]$ and Nfloat normals occupy $[0,2^{w_E}-1]$:

$$\text{IEEEfloat: }\ \mathrm{ovf}=[E_R\ge 2^{w_E}-1],\ \ \mathrm{unf}=[E_R\le 0]
\qquad
\text{Nfloat: }\ \mathrm{ovf}=[E_R\ge 2^{w_E}],\ \ \mathrm{unf}=[E_R<0]$$

> [!note] The two Nfloat tests are wires, the two IEEE tests are comparators
> $[E_R\ge 2^{w_E}]$ on a $(w_E{+}2)$-bit two's-complement number *is* the overflow bit, and $[E_R<0]$ *is* the sign bit — the two guard bits were placed exactly there for that reason. The IEEE thresholds are off by one from the power of two, so neither reduces to a bit, and both need a $(w_E{+}2)$-bit constant comparison. That is the concrete form of p. 338's remark that "there are more overflow/underflow situations in IEEEfloat to make room for the encoding of $0$, $\infty$ and NaN in the exponent field": the cost is not the two stolen codes, it is that stealing them moved the boundary off a bit position.

**Let the datapath contribute its own verdicts.** Two exceptional results are produced by the significand path and arrive at pack as flags rather than as categories. Total cancellation in an adder saturates the leading-zero count at $\lambda=w_F+4$, and p. 338 is explicit that the resulting zero "will be managed by the exception handling & pack block" — the LZC's saturation flag is OR-ed straight into the zero code, which is cheaper than letting the exponent underflow naturally. In the multiplier and divider the corresponding contribution is a rounding overflow that bumps the exponent (pp. 344, 349), which is why pack must sit *after* the rounding adder and cannot be hoisted to shorten the critical path — see [[Floating-Point Rounding Adder]].

**The layer is an area cost everywhere and a latency cost only on the IEEE input side.** Nothing here is deeper than $\lceil\log_2 w_F\rceil$, against the five $\log_2 w_F$-deep blocks a baseline adder puts in series (p. 337), so as a fraction of the operator this is small — but the unpack OR tree is *in front of* all five and the pack table is *behind* all five, so it is charged at both ends and cannot be overlapped with anything. On [[FPGAs]] the fraction OR maps to a LUT6 reduction tree, two levels for $w_F\le36$ and three at $w_F=52$, and the pack comparisons ride the fast carry logic that §6.3 (p. 148) makes cheap; both are small enough that the FPGA argument for Nfloat is about the *datapath* bits, not about these gates. On ASIC the four AND gates and the 2-to-4 decoder are noise either way.

$$\boxed{\ \begin{aligned}
\text{unpack:}\quad & z=\overline{\textstyle\bigvee E_X},\quad m=\textstyle\bigwedge E_X,\quad \varphi=\overline{\textstyle\bigvee F_X},\quad n=\overline{z}\\[2pt]
& \text{zero}=z\varphi,\quad \text{sub}=z\overline{\varphi},\quad \infty=m\varphi,\quad \mathrm{NaN}=m\overline{\varphi}\\[4pt]
\text{pack:}\quad & \mathrm{ovf}=[E_R\ge 2^{w_E}-1],\quad \mathrm{unf}=[E_R\le 0] \quad (E_R \text{ exact on } w_E+2 \text{ bits})
\end{aligned}\ }$$

**When it breaks.**

- **Flush-to-zero baselines.** The baseline adder of Fig. 11.5 converts subnormals to zero inside unpack (p. 337), i.e. `is_subnormal` is wired into the zero code. The decode above still computes the right flag; what breaks is downstream, silently, and it breaks an identity rather than an error bound: with no subnormals, $x-y=0$ no longer implies $x=y$ (p. 55). Gradual underflow needs [[Subnormal Normalization Unit]], not a mux.
- **`unf` forces zero, which is only correct under flush-to-zero.** A compliant operator whose exact result falls below the smallest normal must emit a *subnormal*, which is a variable right shift by a distance derived from $E_R$ — a shifter, not a one-bit test. The comparison above tells you an underflow happened; it does not produce the answer.
- **NaN payloads and quiet-vs-signalling.** §2.5.1.3 (p. 51) declares these "irrelevant in the present book". A layer built from this note emits one canonical NaN and drops the sign and significand bits of any incoming NaN. Software that steers on payloads, and hardware that must distinguish sNaN from qNaN, needs more than Table 11.1.
- **The sign of a NaN is not defined here.** Tables 11.1-11.4 give NaN as a category, not as a bit pattern, so `s_R` is a don't-care on those rows. Anything reading it downstream — notably a [[Floating-Point Comparator]], whose unordered predicate must be true for *every* NaN — must ignore it rather than test it.
- **$\sqrt{-0}$.** The test is `sign AND NOT zero`, never `sign`. Getting this wrong costs one gate and returns NaN for a value the standard says is $-0$.
- **The five IEEE status flags are a different thing entirely.** *Invalid*, *Overflow*, *Underflow*, *DivideByZero* and *Inexact* are trappable status bits, not values. This note produces the values those situations return; the flags are extra outputs, and *Inexact* in particular is not available in pack at all — it is the sticky, which lives in the datapath ([[Sticky Bit Generator]]).

> [!warning] The `sel` output is my reading, not the book's
> Table 11.1's zero rows return "$X$" or "$Y$" — a whole operand, so something must multiplex the significand as well as set the category. p. 338 says only that pack "merges the exception information from the initial exception handling with that encoded in the exponent" and "concatenates the sign of the result"; no figure in Chapter 11 opens the pack block. The two-bit `sel` in the diagram and in the RTL below is the obvious encoding of that mux, not a structure the source specifies.

> [!warning] Chapter 11 costs this layer nowhere
> No gate count, LUT count, delay or area figure is given for unpack or pack, for either format. The depth expressions above are counted off the gate netlist; the LUT6 tree depths are $\lceil\log_6 w_F\rceil$ arithmetic. Anything more precise — in particular the real overhead of Nfloat's two extra bits across a pipelined datapath — needs a synthesis run.

**RTL (Spade).**

```spade
// exception codes (Table 2.3): 00 zero, 01 finite, 10 infinity, 11 NaN
// sel:                        00 datapath, 01 operand X, 10 operand Y

/// IEEE 754 unpack: exponent and fraction fields to an exception code and the
/// "is normal" bit n.
fn ieee_decode<#uint WE, #uint WF>(e: uint<WE>, f: uint<WF>) -> (uint<2>, bool) {
    let ez = e == 0;          // NOR tree over the exponent field
    let emax = (~e) == 0;     // AND tree over the exponent field
    let fz = f == 0;          // NOR tree over the fraction field
    let exn = if emax {
        if fz { 0b10 } else { 0b11 }
    } else if ez && fz {
        0b00
    } else {
        0b01
    };
    (exn, !ez)
}

/// pack, exponent side: the exact (wE+2)-bit result exponent to an exception
/// code. IEEE steals the all-ones field, so the last usable field is 2^wE - 2.
fn exp_range<#uint WE>(er: int<{WE + 2}>) -> uint<2> {
    let zero: uint<WE> = 0;
    let allones = ~zero;
    let w: uint<{WE + 2}> = zext(allones);
    let top = w.as_int();
    if er >= top { 0b10 } else if er < 1 { 0b00 } else { 0b01 }
}

/// pack, table side: Table 11.1 for addition, as a function of the two input
/// codes, the two signs, and the datapath's own verdict.
fn add_exn(xa: uint<2>, sx: bool, ya: uint<2>, sy: bool, dp: uint<2>, sr: bool)
    -> (uint<2>, bool, uint<2>)
{
    if (xa == 0b11) || (ya == 0b11) {
        (0b11, false, 0b00)
    } else if (xa == 0b10) && (ya == 0b10) {
        if sx == sy { (0b10, sx, 0b00) } else { (0b11, false, 0b00) }
    } else if xa == 0b10 {
        (0b10, sx, 0b00)
    } else if ya == 0b10 {
        (0b10, sy, 0b00)
    } else if (xa == 0b00) && (ya == 0b00) {
        (0b00, sx && sy, 0b00)
    } else if xa == 0b00 {
        (0b01, sy, 0b10)
    } else if ya == 0b00 {
        (0b01, sx, 0b01)
    } else {
        (dp, sr, 0b00)
    }
}

/// The whole layer around a floating-point adder: unpack both operands, apply
/// the table, and re-encode the datapath exponent.
entity fp_exn_add<#uint WE, #uint WF>(
    ex: uint<WE>, fx: uint<WF>, sx: bool,
    ey: uint<WE>, fy: uint<WF>, sy: bool,
    er: int<{WE + 2}>, sr: bool,
) -> uint<7> {
    let (xa, nx) = ieee_decode(ex, fx);
    let (ya, ny) = ieee_decode(ey, fy);
    let (exn, s, sel) = add_exn(xa, sx, ya, sy, exp_range::<WE>(er), sr);
    exn.concat(s.as_uint()).concat(sel).concat(nx.as_uint()).concat(ny.as_uint())
}
```

`ieee_decode` is the left panel: `ez`, `emax`, `fz` are the three reduction trees and the `if` chain is the four AND gates, with `!ez` the implicit bit $n$. `exp_range` is the pair of comparators; `er` is `int<{WE + 2}>` — signed, two bits wider than the field — so `er < 1` is the underflow test on the sign bit *and* the low field bits together, which is why the extra width has to survive the rounding adder rather than being truncated at it. `add_exn` is the two-level table, and it never reads `dp` on a row where an input is exceptional, because on those rows `er` is meaningless. All of it is combinational; there is no clock port, and synthesis will collapse the priority chain into the flat two-level cover the diagram draws, not into the cascade the `else if` implies.

Simulated with iverilog at $w_E=5$, $w_F=10$ (binary16 fields) against an independently written behavioural model of Tables 2.1, 2.3 and 11.1: **5148 vectors, 0 failures** — 20 named vectors including $(+\infty)+(-\infty)\to\mathrm{NaN}$, $(-0)+(-0)\to-0$ against $(-0)+(+0)\to+0$, the asymmetric pair $(+0)+Y$ versus $X+(+0)$ that separates `sel`$=$X from `sel`$=$Y, an asymmetric exponent pair $E=1$ against $E=16$, an asymmetric fraction pair $F=2^9$ against $F=2^0$, and the four boundary exponents $E_R\in\{0,1,30,31\}$; then an exhaustive sweep of all 128 values of the signed 7-bit $E_R$; then 5000 random vectors.

**Related notes.**

- [[Floating-Point Formats]] – depends-on: supplies the encoding this block decodes, including the reserved codes of Table 2.1 and the `exn` field of Table 2.3.
- [[Number Formats]] – depends-on: the biased exponent, the implicit bit and the $n$ formulation (2.17)-(2.18) that make `is_normal` a single wire.
- [[Floating-Point Adder]] – supports: the layer drawn around Fig. 11.5, and the source of the saturated-LZC zero flag.
- [[Floating-Point Multiplier]] – supports: same layer, Table 11.2 in the middle, and a sign that is one XOR on every row.
- [[Floating-Point Divider]] – supports: same layer, Table 11.3, and the only operator where a zero divisor is a defined result rather than an error.
- [[Floating-Point Square Root]] – supports: the smallest table in the chapter, and the $\sqrt{-0}$ trap.
- [[Floating-Point Comparator]] – compares: the *only* difference between an IEEEfloat and an Nfloat comparator is this decode; everything after it is an integer comparison (p. 359).
- [[Subnormal Normalization Unit]] – extends: what has to happen when `is_subnormal` is honoured instead of flushed, on the input side and on the output side.
- [[Exponent Difference and Swap Unit]] – depends-on: consumes $n_X$ and $n_Y$ in $E_X-n_X-(E_Y-n_Y)$, the second of the two uses of the implicit bit.
- [[Floating-Point Rounding Adder]] – depends-on: pack reads the exponent *after* rounding, because rounding can carry into it; this is what pins pack to the end of the critical path.
- [[Sticky Bit Generator]] – counter-example: *Inexact* looks like an exception but is not visible here; it is a datapath signal, computed over bits pack never sees.
- [[Comparators]] – depends-on: the two constant comparisons on $E_R$, which are the only non-trivial gates on the pack side.
- [[Choosing a Floating-Point Operator]] – compares: where IEEE compliance is worth its overhead, of which this layer is the fixed part.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §2.5.1 *The IEEE 754 formats*, pp. 48-52 — normal/subnormal/exceptional encoding, the "is normal" bit $n$ and eqs. (2.17)-(2.18) p. 51, Table 2.1 p. 51, Table 2.2 p. 52.
  - §2.5.3 *A simplified floating-point format*, pp. 54-55 — Nfloat, Fig. 2.15 and Table 2.3 (`exn` encoding) p. 54, Table 2.4 (range comparison) p. 55.
  - Ch. 11 introduction, p. 330 and footnote 1 — the five IEEE exceptions explicitly left aside.
  - §11.1.1 *General considerations and terminology*, Table 11.1 p. 331 (addition, round to nearest), Fig. 11.1 p. 332.
  - §11.1.2 *Baseline addition architecture*, Fig. 11.5 p. 337 and the commentary pp. 337-338 — the $(w_E{+}2)$-bit exponent with its sign and overflow bits, the saturated LZC feeding pack, and the format-dependence of pack's work.
  - §11.1.3, p. 340 — the two uses of $n_X,n_Y$ in the unpack block.
  - §11.2.1 *Baseline multiplication architecture*, Table 11.2 p. 343, Fig. 11.7 p. 344, exponent width p. 345.
  - §11.3.1 *Baseline division architecture*, Table 11.3 p. 348, Fig. 11.8 p. 348, exact exponent adders p. 349.
  - §11.4.1 *Baseline square root architecture*, Table 11.4 p. 353 and the $\sqrt{-0}$ discussion on the same page.
  - §11.5.2, p. 359 — unpack is the whole difference between an IEEEfloat and an Nfloat comparator.
  - §6.3, p. 148 — constant comparison on FPGA fast carry logic (cited from p. 338).
