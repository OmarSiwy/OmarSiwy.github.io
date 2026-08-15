---
title: Choosing an eY Architecture
description: "Trade-off table across the nine Fixed-Point Computation of eY circuits: which one to build at BFloat, binary16, single and double, and why the book supplies table dimensions but no synthesis figures."
kind: comparison
source: "ASA §22.5, pp. 654-664"
status: seed
spade: n/a
tags: [digital, fixed-point-computation-of-ey, exponential, comparison, fpga, table, multiplier]
aliases:
  - Choosing an e^Y Architecture
  - eY Architecture Comparison
  - Comparing eY Architectures
  - Choosing an Exponential Architecture
---

# Choosing an eY Architecture

Nine circuits evaluate the same specification — $M \approx e^Y$ for $Y$ in `sfix`$(-1,\ell)$ with $\ell=-w_F-g$, faithful to $\bar\delta_{\mathrm{arch}} < 1-2u$ — and the fraction count $w_F$ alone decides between four of them, with the fabric deciding the rest.

```tikz title="Five e^Y architectures compared at scale: table bits and multiplier shapes"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- band rules and band labels ----
  \draw[gray!55] (-1.5,0) -- (17.1,0);
  \draw[gray!55] (-1.5,-0.8) -- (17.1,-0.8);
  \node[rotate=90,font=\footnotesize\itshape,align=center] at (-1.75,1.1)
    {tables\\ area $\propto$ bits};
  \node[rotate=90,font=\footnotesize\itshape,align=center] at (-1.75,-1.7)
    {multipliers\\ drawn to bit widths};

  % ================= titles =================
  \node[align=center] at (0,3.9)    {Direct tabulation\\[-2pt]\footnotesize BFloat, $w_F{=}7$, $g{=}3$};
  \node[align=center] at (3.2,3.9)  {Higher-order (Fig.\ 22.6)\\[-2pt]\footnotesize single, $k{=}10$, $g{=}4$};
  \node[align=center] at (7.6,3.9)  {First-order (Fig.\ 22.7)\\[-2pt]\footnotesize binary16 solid \emph{vs} single dashed};
  \node[align=center] at (11.6,3.9) {Polynomial (\S22.5.3)\\[-2pt]\footnotesize double, $k{=}9$, $d{=}2$};
  \node[align=center] at (15.0,3.9) {Iterative (\S22.5.5)\\[-2pt]\footnotesize any $w_F$, subword $\alpha_i$};

  % ================= table band (baseline y=0) =================
  % c1 direct tabulation: 2^10 x 11 = 11264 bits
  \draw[fill=black!12] (-0.239,0) rectangle (0.239,0.478);
  \node[font=\footnotesize] at (0,0.68) {$e^Y$};

  % c2 higher-order: e^A 2^10 x 28 = 28672 ; h 2^8 x 6 = 1536
  \draw[fill=black!12] (2.60,0) rectangle (3.362,0.762);
  \node[font=\footnotesize] at (2.98,0.96) {$e^A$};
  \draw[fill=black!12] (3.46,0) rectangle (3.636,0.176);
  \node[font=\footnotesize] at (3.55,0.36) {$h$};

  % c3 first-order: dashed = single 2^14 x 29 = 464 Kbit ; solid = binary16 2^7 x 16 = 2 Kbit
  \draw[dashed] (6.05,0) rectangle (9.15,3.102);
  \node[font=\footnotesize,align=center] at (7.6,2.72) {single: $2^{14}{\times}29$\\ $=464$ Kbit};
  \draw[fill=black!12] (7.498,0) rectangle (7.702,0.204);
  \draw[gray] (7.6,0.204) -- (7.6,0.60);
  \node[font=\footnotesize,align=center] at (7.6,0.86) {binary16: $2^{7}{\times}16$\\ $=2$ Kbit};

  % c4 polynomial: widths not given by the source
  \draw[dashed] (10.75,0) rectangle (12.45,1.4);
  \node[font=\scriptsize,align=center] at (11.6,0.70) {$2^{9}$ intervals\\ $+\;2^{k}$ $e^A$\\ \emph{schematic}};

  % c5 iterative: n tables of 2^{alpha_i}
  \draw[dashed] (14.00,0) rectangle (14.35,0.35);
  \draw[dashed] (14.55,0) rectangle (14.90,0.35);
  \draw[dashed] (15.10,0) rectangle (15.45,0.35);
  \draw[dashed] (15.65,0) rectangle (16.00,0.35);
  \node[font=\footnotesize] at (15.0,0.60) {$n$ small tables, \emph{schematic}};

  % ================= multiplier band (top y=-0.8) =================
  \node[font=\footnotesize] at (0,-1.15) {none};

  \draw[fill=black!12] (2.57,-0.8) rectangle (3.83,-2.06);
  \node[font=\footnotesize] at (3.2,-1.43) {$18{\times}18$};

  \draw[fill=black!12] (6.50,-0.8) rectangle (6.92,-1.36);
  \node[font=\footnotesize,anchor=north] at (6.71,-1.44) {$6{\times}8$};
  \draw[dashed] (7.20,-0.8) rectangle (8.11,-1.64);
  \node[font=\footnotesize,anchor=north] at (7.65,-1.72) {$13{\times}12$};

  \draw[dashed] (11.00,-0.8) rectangle (11.55,-1.35);
  \draw[dashed] (11.65,-0.8) rectangle (12.20,-1.35);
  \node[font=\footnotesize,anchor=north] at (11.6,-1.45) {$d$ multipliers};

  \draw[dashed] (13.20,-0.8) rectangle (14.53,-2.13);
  \node[font=\scriptsize,align=center] at (13.865,-1.47) {one full\\ multiplier};
  \node at (14.75,-1.45) {$\approx$};
  \draw[fill=black!12] (14.97,-0.8) rectangle (15.39,-2.48);
  \draw[fill=black!12] (15.47,-0.8) rectangle (15.89,-2.06);
  \draw[fill=black!12] (15.97,-0.8) rectangle (16.39,-1.64);
  \draw[fill=black!12] (16.47,-0.8) rectangle (16.89,-1.22);
  \node[font=\footnotesize,anchor=north] at (15.93,-2.58) {each $\alpha_i$ wide};

  % ================= scale key =================
  \draw[fill=black!12] (-0.35,-1.75) rectangle (-0.206,-1.606);
  \node[font=\footnotesize,anchor=west] at (-0.15,-1.68) {$=1$ Kbit};
  \draw (-0.35,-2.25) -- (0.35,-2.25);
  \draw (-0.35,-2.15) -- (-0.35,-2.35);
  \draw (0.35,-2.15) -- (0.35,-2.35);
  \node[font=\footnotesize,anchor=west] at (0.42,-2.25) {$=10$ bits};

  % ================= bottom labels =================
  \node[font=\footnotesize,align=center] at (0,-3.6)
    {$2^{10}{\times}11 = 11$ Kbit\\ no multiplier\\ correctly rounded};
  \node[font=\footnotesize,align=center] at (3.2,-3.6)
    {$2^{10}{\times}28+2^{8}{\times}6$\\ $\approx30$ Kbit: 1 BRAM\\ $18{\times}18$: 1 DSP};
  \node[font=\footnotesize,align=center] at (7.3,-3.6)
    {$2$ Kbit, $6{\times}8$\\ \emph{vs} $464$ Kbit, $13{\times}12$\\ table grows as $2^{w_F/2}$};
  \node[font=\footnotesize,align=center] at (11.6,-3.6)
    {$k$ and $d$ are\\ independent knobs\\ scales to $w_F{=}52$};
  \node[font=\footnotesize,align=center] at (15.0,-3.6)
    {$n\approx w_F/(\alpha{-}1)$ steps\\ LUT fabric or ASIC\\ underuses DSP/BRAM};
\end{circuitikz}
\end{document}
```

*Own construction from the sizing data of §22.5 (pp. 654–663). The two bands use different scales: memories are drawn with **area proportional to their bit count**, multipliers with **each side proportional to its operand width**. The first-order $e^A$ output width is read off Fig. 22.7, p. 660 (`ufix`$(0,\ell-2)$, so $|\ell|+3$ bits). The polynomial and iterative columns are dashed and schematic because the source gives no word widths for them; as the warning below says, no synthesis figures exist for any column.*

| Circuit | Where the source sizes it | Table bits | Multiplier / hard blocks | Latency | Accuracy | Printed page |
| --- | --- | --- | --- | --- | --- | --- |
| [[Direct eY Table]] | BFloat, $w_F=7$, $g=3$ | $2^{10}\times11 = 11$ Kbit | none | one memory read | correctly rounded, $0.5u$ | 654–655 |
| [[First-Order eY Architecture]] | binary16, $w_F=10$, $\ell=-13$, $k=7$, $g=3$ | $2^{7}\times16 = 2$ Kbit ($e^A$) | one $6\times8$ | table + mult + add | $\bar\delta_{\mathrm{approx},1}=2^{-15}(1+2^{-7})$, eq. 22.31 | 659–660 |
| [[First-Order eY Architecture]] | single, $w_F=23$, $k=14$ | $2^{14}\times29 \approx 464$ Kbit — **too big** | one $13\times12$ | table + mult + add | faithful at $g=3$ | 660 |
| [[Higher-Order eY Architecture]] | small $w_F$, $g'=0$, $t=k$, $p=\ell+k-1$ | $2^{k}$ ($e^A$) $+\,2^{|p|-k}$ ($h$) | one near-square truncated | 2 tables + mult + 2 adds | $\bar\delta_{\mathrm{arch}}=4.7u \Rightarrow g=4$ | 658–659 |
| [[Higher-Order eY Architecture]] | larger $w_F$, $h$ faithful, $t=k-1$ | as above | as above | as above | $\bar\delta_{\mathrm{arch}}=4.9u \Rightarrow g=4$ | 659 |
| [[eA Table]] | single case study, $k=10$, $t=10$ | $2^{10}\times28 = 28\,672$ bits | feeds one multiplier operand | one read | $\delta_T = 0.625u$, $\delta_{\mathrm{trunc}T}=1.25u$ at $t=k$ | 659, 661 |
| [[hZ Table]] | single case study, $p=-18$ | $2^{8}\times6 = 1536$ bits | none | one read | $\bar\delta_H = 1.65u/2$ (correctly rounded) | 657, 659, 661 |
| [[Polynomial hZ Evaluator]] | double, $w_F=52$, $k=9$, $d=2$ | $2^{9}=512$ intervals, widths — | $d$ multipliers (Horner) | Horner depth $d$ | $\bar\delta_H = 1.65u$ (faithful), forces $t=k-1$ | 660–661 |
| [[eY DSP and BRAM Mapping]] | single, $g=4$, $\ell=-27$, $k=10$ | $2^{10}\times28 + 2^{8}\times6$ in **one 36 Kbit BRAM**, $2^{10}\times36$ dual-port | one $18\times18$ = **1 DSP** | 1 BRAM + 1 DSP + adds | product exact $\Rightarrow$ $\delta_{\mathrm{mult}}$ drops to $u/2$ | 661 |
| [[eY Iterative Reduction Step]] | any $w_F$, subword $\alpha_i$ | $2^{\alpha_i}$ entries $\times\,2$ tables per step | none (subtractor only) | $n$ dependent subtractions | no budget given | 662–663 |
| [[eY Iterative Reconstruction Step]] | any $w_F$, subword $\alpha_i$ | reuses the reduction's $X_i^\dagger$ | $n$ rectangular $w_{i+1}\times\alpha_i$, cumulated $\approx$ **one full multiplier** | $n$ multiply-adds | no budget given | 662–663 |

**Every LUT, slice, delay and frequency column is missing on purpose.** Chapter 22 gives table dimensions, multiplier operand widths and error bounds, and nothing else — the DSP and BRAM counts in the table above are the only hard-block figures in the whole section, and they belong to one worked FPGA case study, not to a synthesis campaign. The book says so itself on p. 663:

> [!warning] Not covered in the source — needs outside research
> *"A detailed comparison on the same technology of this iterative architecture and a polynomial-based one is currently missing."* (p. 663.) There are therefore no LUT, slice, DSP-count or delay figures anywhere in §22.5, for any of the eleven rows. Two entries are also derived rather than quoted: $2^{14}\times29\approx464$ Kbit multiplies the $2^{14}$ entries of p. 660 by the $|\ell|+3$ output width read off Fig. 22.7, and $n\approx(w_F+g)/(\alpha-1)$ follows from the $\alpha_i-1$ cancellation of (22.33) rather than appearing as a formula. Anything else you need — area, $f_{\max}$, energy — has to come from your own build.

**Below about eight fraction bits the decision is not between these circuits at all.** [[Direct eY Table]] needs $2^{w_F+g}$ entries, so BFloat costs 11 Kbit and binary16 already costs eight times that; but in exchange it is the only row that is correctly rounded, and it has no multiplier, no error budget and no guard-bit negotiation with the surrounding range reduction. Its real competitor is one level up: tabulating the *entire* floating-point exponential (§22.2.4, p. 645) costs $2\times2^{4+7}\times15$ bits for BFloat — more than four times the table — but deletes the range reduction outright, and p. 655 declines to say which wins. So at machine-learning formats you are choosing between two tables, not between an architecture and a table.

**From binary16 to single precision the deciding constraint is how fast the $e^A$ table grows.** [[First-Order eY Architecture]] deletes the $h$ box by taking $f(Z)\approx Z$, which costs a neglected $Z^2/2$ and therefore demands $k\ge(w_F+4)/2$ to keep that below one ulp — the table grows as $2^{w_F/2}$. At binary16 that is $2^7\times16 = 2$ Kbit and a $6\times8$ multiplier, cheaper than anything else here by an order of magnitude. At single precision the same rule gives $k=14$: the multiplier only grows to $13\times12$ but the table grows $128\times$, to roughly 464 Kbit. That asymmetry is the whole argument for the [[Higher-Order eY Architecture]] — restoring the $h$ box lets $k$ fall to 10, and because $h(Z)=e^Z-Z-1$ has its MSB at $-2k-1$, the second table is $2k$ bits *narrower* than $e^Z$ and costs 1536 bits against the 28 672 it saves. Pick first-order while $2^{(w_F+4)/2}$ is a few hundred entries; pick higher-order the moment it is not.

**Past single precision the constraint changes from table size to how the tables are generated.** [[hZ Table]] stays affordable only while $-2k-\ell+g'$ is a handful of bits; at $w_F=52$ it is not, and [[Polynomial hZ Evaluator]] replaces it with the generic piecewise evaluator on $h(x)=e^{2^{-k}x}-2^{-k}x-1$. What you buy is a second knob: $k$ sizes [[eA Table]], $d$ sizes the polynomial's own table-versus-multiplier split, and $k=9$, $d=2$ with 512 intervals reaches double precision. What you pay is half an ulp — a generic approximator is contracted faithful, not correctly rounded, so $\bar\delta_H$ doubles from $1.65u/2$ to $1.65u$ — and you pay it with one bit of $e^A$ truncation ($t=k-1$ instead of $t=k$) rather than with a guard bit, landing at $4.9u$ against $4.7u$. Both stay under $5u$, so $g=4$ either way.

**On FPGA the hard blocks, not the asymptotics, decide.** [[eY DSP and BRAM Mapping]] is the one place in §22.5 where a whole operator is costed against real silicon, and the result is a coincidence of $w_F=23$ rather than a scaling law: both tables fit one 36 Kbit dual-port BRAM as $2^{10}\times36$, and both multiplier operands are 18 bits, so the product is *exact* and can be rounded to nearest — killing the truncated-multiplier error term for one extra bit of final adder. Neighbouring precisions do not land there: binary16 wants a $6\times8$ multiplier that wastes most of a DSP, and double wants several DSPs and more than one BRAM. The [[eY Iterative Reduction Step]] and [[eY Iterative Reconstruction Step]] family is the counter-case. On a LUT-only fabric it is excellent — set $\alpha_i$ to the LUT input width and each ROM is one LUT level, with $\alpha$ as a single clean knob trading $2^{\alpha}$-entry tables against $n\approx(w_F+g)/(\alpha-1)$ iterations. On a DSP-and-BRAM fabric it fails from both ends at once: sized for LUTs the rectangular $w_{i+1}\times\alpha_i$ multipliers cannot fill an $18\times18$ block, and sized to fill the DSPs the $2^{\alpha_i}$ tables explode. On ASIC the objection is different again — the chain of $n$ dependent subtractions on the $L_i$ datapath is the critical path, which is why implementations go to high-radix redundant arithmetic. Latency never chooses any of these: the table-plus-multiplier architectures are two or three trivially pipelinable stages, so throughput is a placement question, and the iterative family is chosen for area on LUT fabric or never.

$$\boxed{\ w_F \lesssim 8:\ \text{direct table}\ \mid\ w_F \lesssim 16:\ \text{first-order}\ \mid\ w_F \ge 23:\ \text{higher-order}\ \mid\ w_F = 52:\ \text{polynomial } h\ \mid\ \text{LUT-only or ASIC: iterative}\ }$$

**Related Notes**

- [[Direct eY Table]] – compares: the no-arithmetic baseline, and the only correctly rounded row; wins below about eight fraction bits and dies immediately above.
- [[First-Order eY Architecture]] – compares: the cheapest datapath at binary16, killed at single precision by a $2^{w_F/2}$ table.
- [[Higher-Order eY Architecture]] – compares: the workhorse from single precision upward, whose $h$ box buys back the first-order table growth.
- [[eA Table]] – depends-on: the $2^k$-entry ROM shared by both arithmetic architectures, and the $t$ knob that balances the multiplier.
- [[hZ Table]] – depends-on: the correctly-rounded $2k$-bits-narrower box that makes the higher-order architecture cheaper than first-order.
- [[Polynomial hZ Evaluator]] – extends: replaces that box with two independent knobs once tabulating $h$ stops fitting, at the cost of half an ulp.
- [[eY DSP and BRAM Mapping]] – supports: the single-precision case study that turns the table's abstract widths into one BRAM and one DSP.
- [[eY Iterative Reduction Step]] – counter-example: a different family entirely, whose datapath narrows each step and which wins only on LUT-only fabric.
- [[eY Iterative Reconstruction Step]] – counter-example: its backward half, where $n$ rectangular multipliers cumulate to barely more than one full multiplier.
- [[Fixed-Point Computation of eY]] – depends-on: the topic these nine circuits partition, and the specification every row is measured against.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §22.5 "Fixed-Point Computation of $e^Y$":

- §22.5 intro, tabulation for very small formats — pp. 654–655 ($2^{10}\times11$ for BFloat; the §22.2.4 comparison, p. 645)
- §22.5.1 Using large tables and square multipliers — pp. 655–659 (Fig. 22.6, p. 657; eqs. 22.19–22.29; the $4.7u$ and $4.9u$ settlements and the $g'=3$ variant, p. 659)
- §22.5.2 First-order architecture — pp. 659–660 (Fig. 22.7, p. 660; eqs. 22.30–22.31; the binary16 and single-precision sizings)
- §22.5.3 Polynomial approximation for large precisions — pp. 660–661 ($k=9$, $d=2$, 512 intervals for double)
- §22.5.4 FPGA-specific remarks and the IEEE-single case study — p. 661 ($2^{10}\times28$, $2^{8}\times6$, one 36 Kbit BRAM, one $18\times18$ DSP)
- §22.5.5 Iterative computation using small tables and rectangular multipliers — pp. 662–663 (Fig. 22.8, p. 663; eqs. 22.32–22.34; the missing-comparison statement)
