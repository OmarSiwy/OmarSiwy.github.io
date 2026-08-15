---
title: Hierarchical Segmentation
description: "Stacks a second uniform level inside each first-level segment (UU) or inside each logarithmic segment (LU), giving logarithmic segmentation the memory/arithmetic knob it otherwise lacks."
kind: circuit
source: "ASA §18.2.4, pp. 551-552"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, segmentation, range-reduction, fpga]
aliases:
  - UU Segmentation
  - LU Segmentation
  - Two-Level Segmentation
  - Stacked Segmentation
---

# Hierarchical Segmentation

Segments the input twice, so that the number of second-level subintervals — and with it the local table depth and the reduced-argument width — is a *tabulated function of the first-level index* instead of one global constant.

```tikz title="UU hierarchical segmentation: a level-2 parameter table drives a variable split of Y1 and an offset into a flat coefficient table"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------- input word X = [A1 | Y1] ----------
\node[anchor=east] at (-0.15,6.05) {$X=$};
\draw[thick] (0,5.8) rectangle (1.6,6.3);
\draw[thick] (1.6,5.8) rectangle (6.0,6.3);
\node at (0.8,6.05) {$A_1$};
\node at (3.8,6.05) {$Y_1$};
\node[font=\tiny] at (0.8,5.55) {$\alpha_1$};
\node[font=\tiny] at (3.8,5.55) {$w_X-\alpha_1$};

% ---------- level-2 parameter table ----------
\draw[thick] (0.1,3.7) rectangle (2.1,4.9);
\node[align=center] at (1.1,4.3) {level-2\\param.\ table};
\draw[thick,->] (0.8,5.5) -- (0.8,4.9);

% ---------- left shifter ----------
\draw[thick] (3.5,3.9) rectangle (5.5,4.7);
\node at (4.5,4.3) {left shifter};
\draw[thick,->] (4.5,5.5) -- (4.5,4.7);
\draw[thick,->] (2.1,4.3) -- (3.5,4.3);
\node[font=\tiny,anchor=south] at (2.8,4.35) {$\alpha_2(A_1)$};

% ---------- shifter output = [A2 | Y2] ----------
\draw[thick] (3.2,2.6) rectangle (4.1,3.1);
\draw[thick] (4.1,2.6) rectangle (7.4,3.1);
\node at (3.65,2.85) {$A_2$};
\node at (5.75,2.85) {$Y_2$};
\node[font=\tiny] at (3.65,2.35) {$\alpha_2^{\max}$};
\node[font=\tiny] at (5.4,2.35) {$w_X-\alpha_1$};
\draw[thick,->] (4.5,3.9) -- (4.5,3.1);

% ---------- address adder ----------
\draw[thick] (0.3,1.35) rectangle (2.5,1.95);
\node at (1.4,1.65) {$+$};
\draw[thick,->] (1.1,3.7) -- (1.1,1.95);
\node[font=\tiny,anchor=east] at (1.05,2.9) {$\Delta(A_1)$};
\draw[thick,->] (3.2,2.85) -- (2.0,2.85) -- (2.0,1.95);

% ---------- coefficient table and evaluator ----------
\draw[thick] (0.3,-0.75) rectangle (2.6,0.85);
\node[align=center] at (1.45,0.05) {polynomial\\coefficient\\table};
\draw[thick,->] (1.4,1.35) -- (1.4,0.85);
\node[font=\tiny,anchor=west] at (1.5,1.12) {$A$, $\lceil\log_2 N\rceil$ bits};

\draw[thick] (4.3,-0.75) rectangle (6.6,0.85);
\node[align=center] at (5.45,0.05) {polynomial\\evaluator};
\draw[thick,->] (2.6,0.6) -- (4.3,0.6);  \node[font=\tiny,anchor=south] at (3.45,0.62) {$C_0$};
\draw[thick,->] (2.6,0.2) -- (4.3,0.2);  \node[font=\tiny,anchor=south] at (3.45,0.22) {$C_1$};
\node[font=\scriptsize] at (3.45,-0.06) {$\vdots$};
\draw[thick,->] (2.6,-0.55) -- (4.3,-0.55); \node[font=\tiny,anchor=south] at (3.45,-0.53) {$C_d$};

\draw[thick,->] (6.0,2.6) -- (6.0,0.85);
\draw[thick,->] (6.6,0.05) -- (7.9,0.05);
\node[anchor=west] at (7.95,0.05) {$R$};
\node[font=\tiny,anchor=south] at (7.25,0.08) {$w_R$};
\end{circuitikz}
\end{document}
```

*after Fig. 18.17, p. 552*

**Compose the change of variable with itself.** [[Uniform Piecewise Segmentation]] writes $X=2^{-\alpha}(A+Y)$ with $A$ the top $\alpha$ bits and $Y\in[0,1)$ the rest. Nothing stops the same identity being applied to $Y_1$, since $Y_1$ is again a value in $[0,1)$ with $w_X-\alpha_1$ bits. Substituting gives

$$X=2^{-\alpha_1}\Big(A_1+2^{-\alpha_2}\big(A_2+Y_2\big)\Big),\qquad A_2=\lfloor 2^{\alpha_2}Y_1\rfloor,\quad Y_2=2^{\alpha_2}Y_1-A_2 .$$

With $\alpha_2$ a *constant* this is worthless: by associativity of the two scalings it collapses to a single uniform split at $\alpha=\alpha_1+\alpha_2$, and the concatenated pair $(A_1,A_2)$ is literally the top $\alpha_1+\alpha_2$ bits of $X$. **The entire content of the technique is letting $\alpha_2$ depend on $A_1$.**

**Store the second-level parameters rather than deriving them.** A small table indexed by $A_1$ — $2^{\alpha_1}$ entries — holds two fields per first-level interval: the parameter $\alpha_2(A_1)$, in $\lceil\log_2(\alpha_2^{\max}+1)\rceil$ bits, and an offset $\Delta(A_1)$ pointing at the address of the first polynomial belonging to that interval, in $\lceil\log_2 N\rceil$ bits. Intervals where $f$ is nearly linear get $\alpha_2=0$ and consume one polynomial; the interval where $f$ misbehaves gets a large $\alpha_2$ and consumes many. The coefficient table therefore has depth $N=\sum_{A_1}2^{\alpha_2(A_1)}$ — a *sum* of per-interval demands, where flat uniform segmentation pays the *product* $2^{\alpha_1}\cdot 2^{\max_A\alpha_2}$ because it must size every interval like the worst one (Eqs. 18.7–18.8, p. 543, taking the max over $A$).

**A field boundary that moves is a shift.** In uniform segmentation the split of $X$ into $(A,Y)$ is free because the boundary sits at a fixed bit position — it is a wire slice. Here the boundary sits $\alpha_2(A_1)$ bits from the top of $Y_1$ and moves with $A_1$, so a [[Barrel Shifters|barrel shifter]] is required to bring it back to a fixed position. Computing $2^{\alpha_2}Y_1$ exactly needs $w_X-\alpha_1+\alpha_2^{\max}$ bits: the top $\alpha_2^{\max}$ are $A_2$ (zero-extended, since $Y_1<1$ forces $2^{\alpha_2}Y_1<2^{\alpha_2}\le 2^{\alpha_2^{\max}}$), and the low $w_X-\alpha_1$ bits are the reduced argument $Y_2$.

**The reduced argument is not reduced in the worst case.** The shifter injects $\alpha_2(A_1)$ zeros at the LSB end of $Y_2$, so $Y_2$ carries only $w_X-\alpha_1-\alpha_2(A_1)$ significant bits but occupies a bus sized for the *smallest* $\alpha_2$ across all first-level intervals — exactly the failure mode of [[Logarithmic Segmentation]] at $A=0$ (p. 550), and it sizes the evaluator's multipliers. The same mitigation transfers unchanged: treat $w_{Y_2}$ as a free parameter, start it at $w_X-\alpha_1-\min_{A_1}\alpha_2(A_1)$, and decrement until the accuracy target breaks; the bits being dropped are zeros on every interval except the ones with the smallest $\alpha_2$, where $f$ is flat by construction.

**Flatten a two-dimensional index into one address.** $\Delta$ is a prefix sum over the block sizes, $\Delta(A_1)=\sum_{j<A_1}2^{\alpha_2(j)}$, so $\Delta(A_1+1)-\Delta(A_1)=2^{\alpha_2(A_1)}$, which is precisely the range of $A_2$. The sum $A=\Delta(A_1)+A_2$ therefore never escapes its own block and needs no bound check — one $\lceil\log_2 N\rceil$-bit adder, no comparator — and the whole hierarchy is invisible to the [[Polynomial Coefficient Table]] downstream, which stays a single flat memory of $N$ entries.

> [!note] Allocate the blocks largest-first and the adder disappears. If the blocks are laid out in order of non-increasing $2^{\alpha_2}$, every $\Delta$ is a sum of multiples of $2^{\alpha_2(A_1)}$ and so is itself a multiple of it; then $A_2$ occupies only bit positions where $\Delta(A_1)$ is zero and the addition degenerates to a bitwise OR. Nothing depends on $\Delta$ being monotone in $A_1$, because $\Delta$ is a lookup, not a computation.

**Two levels, two useful orders.** Stacking was introduced with an arbitrary number of levels [Lee+03], but experience [Lee+09] narrowed it to two combinations. **UU** is the architecture drawn above: uniform first level, uniform second. **LU** replaces the first level with [[Logarithmic Segmentation]] — a combined leading-zero counter and shifter (Fig. 18.16, p. 549) producing $(A_1,Y_1)$ — and is otherwise identical from the level-2 parameter table onwards. LU is the more interesting of the two, because logarithmic segmentation on its own has *no* memory/arithmetic knob at all: its interval count is dictated by $w_X$, and the only control available is crudely saturating the leading-bit count (§18.2.3.2, p. 550). The tabulated values $\alpha_2(A_1)$ *are* that missing knob, restored generically.

**Where it lands in hardware.** The level-2 parameter table is $2^{\alpha_1}$ entries of a handful of bits — on FPGA it belongs in distributed LUT RAM, leaving the block RAM entirely to the coefficient table, and the barrel shifter is LUT-fabric-cheap for the same reason LU hierarchies are practical at all ([[Barrel Shifters]]). On ASIC the picture is worse: the parameter ROM, the shifter and the address adder are all serially ahead of the coefficient ROM decode, so the technique buys memory at the cost of two *dependent* lookups in the critical path where flat uniform segmentation has one and no logic before it.

> [!warning] Not covered in the source — needs outside research
> The book gives no algorithm for choosing $\alpha_1$ or the profile $\alpha_2(A_1)$, and no area or delay figures for either UU or LU. It also warns that the published UU-versus-LU comparison [Lee+09] used an evaluator whose multipliers were all the same size — inferior to computing just right (§18.3.1) — so those per-function verdicts do not transfer, and a careful reimplementation "remains to be done" (p. 551).

$$\boxed{\;A=\Delta(A_1)+A_2,\qquad \Delta(A_1)=\sum_{j<A_1}2^{\alpha_2(j)},\qquad N=\sum_{j=0}^{2^{\alpha_1}-1}2^{\alpha_2(j)}\;}$$

**When it breaks.**

- **$\alpha_2$ nearly constant.** If the profile is flat, the hierarchy is algebraically a single uniform split at $\alpha_1+\alpha_2$; delete the parameter table, the shifter and the adder and lose nothing. The technique only pays when the difficulty of $f$ varies by several powers of two across the first level.
- **Three or more levels.** Each level adds a parameter table, a shifter and an adder to the critical path while the table saving shrinks; [Lee+09] found only the two-level cases worth keeping.
- **Latency-bound designs.** Two dependent memory reads plus a shift precede the first multiplication. Where latency binds, uniform segmentation with a larger table and a [[Parallel Polynomial Evaluator]] is the better trade.
- **Multiplier sizing.** Governed by $\min_{A_1}\alpha_2(A_1)$, not by the average — one lazy interval with $\alpha_2=0$ widens every multiplier in the evaluator.
- **A function with usable algebra.** For $\sqrt{\cdot}$, the identity $\sqrt{2^{2p}x}=2^p\sqrt{x}$ yields a two-segment specialised hierarchy that beats anything the generic machinery can find (p. 553). Reach for the generic version only when no identity exists — most inverse cumulative distributions.

**RTL (Spade).** The arithmetically interesting part is the index datapath, not the tables it feeds: parameter lookup, variable split, address flattening. Instantiated at $w_X=12$, $\alpha_1=2$, with the profile $\alpha_2=(3,2,1,0)$, hence $\Delta=(0,8,12,14)$ and $N=15$.

```spade
entity uu_index(a1: uint<2>, y1: uint<10>) -> (uint<4>, uint<10>) {
    // level-2 parameter table: (alpha2(A1), Delta(A1))
    let (alpha2, delta): (uint<10>, uint<4>) = match a1 {
        0 => (3, 0),
        1 => (2, 8),
        2 => (1, 12),
        _ => (0, 14),
    };
    let a2: uint<4> = trunc(y1 >> (10 -. alpha2));
    (delta +. a2, y1 << alpha2)
}
```

`a1`/`y1` are the two fields of the top bar; `alpha2`/`delta` are the two output fields of the level-2 parameter table; `a2` and the returned `y1 << alpha2` are the shifter's two output fields. Both shifts are the *same* barrel shifter in silicon — `y1 >> (10 - alpha2)` extracts the bits that `y1 << alpha2` discards, so a synthesiser sees one shift network and a slice, not two. `alpha2` is declared `uint<10>` only because a Spade shift requires both operands to share a type; the stored field is 2 bits wide. `+.` is the truncating add, correct here because $\Delta+A_2<N$ always holds — the property proved above — and it is what makes the adder $\lceil\log_2 N\rceil=4$ bits rather than 5. Everything is combinational; a real design registers the parameter-table output, turning the diagram into a two-stage pipeline.

**Related Notes.**

- [[Uniform Piecewise Segmentation]] – extends: applies that wire split twice, and only earns its keep because the second $\alpha$ is data.
- [[Logarithmic Segmentation]] – supports: supplies the LU first level, and receives from this note the memory/arithmetic knob it structurally lacks.
- [[Barrel Shifters]] – depends-on: the moving field boundary between $A_2$ and $Y_2$ is a barrel shift by $\alpha_2(A_1)$.
- [[Polynomial Coefficient Table]] – depends-on: consumes the flattened address $A$ and never sees the hierarchy.
- [[Dichotomy-Based Segmentation]] – compares: drops the power-of-two structure entirely, trading a shifter and an adder for a comparator tree.
- [[Choosing a Polynomial Evaluator]] – compares: where the two-dependent-lookup latency puts this against its siblings.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §18.2.4 "Hierarchical Segmentation", pp. 551–552 — UU and LU, Fig. 18.17 (p. 552), and the caveat on [Lee+09]'s evaluator.
- §18.2.3 "Logarithmic segmentation", pp. 549–551 — Fig. 18.16 (the LU first level), the unreduced $w_Y$ and its LSB-shaving mitigation, and the missing knob.
- §18.2.1 "Uniform piecewise segmentation", pp. 541–543 — Eqs. 18.3–18.4 and the worst-case coefficient sizing this technique escapes.
- §18.2.6 "Discussion", p. 553 — the square-root identity as a specialised hierarchical scheme.
