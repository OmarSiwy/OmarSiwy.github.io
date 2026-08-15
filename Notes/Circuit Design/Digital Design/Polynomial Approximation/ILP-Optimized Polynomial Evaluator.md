---
title: "ILP-Optimized Polynomial Evaluator"
description: "Makes the coefficient bits ILP variables so approximation and rounding are optimized jointly — correct rounding at 24 bits, not just faithful, with fewer coefficient bits."
kind: circuit
source: "ASA §18.4.4, pp. 566-568"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, ilp, rounding, correct-rounding, fpga]
aliases:
  - ILP-Optimised Polynomial Evaluator
  - Combined Approximation and Rounding Optimization
  - ILP Polynomial Approximation
  - Correctly Rounded Polynomial Evaluator
---

# ILP-Optimized Polynomial Evaluator

A piecewise polynomial evaluator whose coefficient *bits* are the decision variables of an integer linear program, so that approximation and evaluation are dimensioned in one shot instead of one after the other — the only member of the family that delivers **correct** rounding rather than faithful rounding.

```tikz title="Coefficient bits as ILP variables, and the two rounding inequalities they must satisfy"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ============ panel A: the coefficient bits ARE the ILP variables =============
\node[anchor=west,font=\small] at (-2.4,3.95) {\textbf{variables} $c_{i,j}$};
\foreach \j in {0,...,15}{ \node[font=\tiny,gray] at (0.18+0.36*\j,3.58) {$\j$}; }
\node[font=\tiny,gray,anchor=west] at (5.95,3.58) {bit index $j$, MSB left};
% --- C0 : every bit kept
\node[anchor=east,font=\small] at (-0.15,3.05) {$C_0$};
\foreach \j in {0,...,15}{ \draw[thick] (0.36*\j,2.85) rectangle (0.36+0.36*\j,3.25); }
\node[font=\tiny,anchor=west] at (5.95,3.05) {16 b — cheap: feeds only an add};
% --- C1 : window [3,13], two low bits driven to zero
\node[anchor=east,font=\small] at (-0.15,2.35) {$C_1$};
\foreach \j in {0,1,2}{ \draw[dashed,gray] (0.36*\j,2.15) rectangle (0.36+0.36*\j,2.55); }
\foreach \j in {3,...,13}{ \draw[thick] (0.36*\j,2.15) rectangle (0.36+0.36*\j,2.55); }
\foreach \j in {14,15}{ \fill[black!22] (0.36*\j,2.15) rectangle (0.36+0.36*\j,2.55);
                        \draw[thick] (0.36*\j,2.15) rectangle (0.36+0.36*\j,2.55);
                        \node[font=\tiny] at (0.18+0.36*\j,2.35) {$0$}; }
\node[font=\tiny,anchor=west] at (5.95,2.35) {11 b stored (pass 1)};
% --- C2 : window [6,12], three low bits driven to zero
\node[anchor=east,font=\small] at (-0.15,1.65) {$C_2$};
\foreach \j in {0,...,5}{ \draw[dashed,gray] (0.36*\j,1.45) rectangle (0.36+0.36*\j,1.85); }
\foreach \j in {6,...,12}{ \draw[thick] (0.36*\j,1.45) rectangle (0.36+0.36*\j,1.85); }
\foreach \j in {13,14,15}{ \fill[black!22] (0.36*\j,1.45) rectangle (0.36+0.36*\j,1.85);
                        \draw[thick] (0.36*\j,1.45) rectangle (0.36+0.36*\j,1.85);
                        \node[font=\tiny] at (0.18+0.36*\j,1.65) {$0$}; }
\node[font=\tiny,anchor=west] at (5.95,1.65) {7 b stored (pass 2)};
\draw[gray] (4.50,1.42) -- (4.50,1.20);
\node[font=\tiny,anchor=north] at (4.50,1.20) {$j_{\min,2}$};
\node[font=\tiny,anchor=north west,align=left] at (-2.4,0.92)
  {grey $=$ driven to $0$ by maximising $\sum_{i,k}\mu_{i,k}$, where $\mu_{i,k}{=}1 \iff c_{i,j}{=}0$ for all $j\in\{j_{\min,i},\dots,j_{\min,i}{+}k\}$;\\
   dashed $=$ above $j_{\max,i}$, bounded beforehand. Table word $=\sum_i(j_{\max,i}-j_{\min,i}+1)$ b per subinterval.};
\draw[dashed,gray] (-2.5,0.05) -- (9.8,0.05);
% ============ panel B: two linear constraints per input value ================
\node[anchor=west,font=\small] at (-2.4,-0.35) {\textbf{constraints}};
\draw[thick,->] (0,-1.15) -- (8.9,-1.15) node[right,font=\tiny]{$R$};
\foreach \k in {0,1,2,3,4,5,6}{ \draw[thick] (1.2*\k,-1.30) -- (1.2*\k,-1.00); }
\fill[black!12] (3.6,-1.00) rectangle (4.8,-0.48);
\draw (3.6,-1.00) -- (3.6,-0.42);
\draw[dashed] (4.8,-1.00) -- (4.8,-0.42);
\node[font=\tiny,anchor=east] at (3.55,-0.30) {$\lfloor f(X)\rfloor_{\ell_R}$};
\node[font=\tiny,anchor=west] at (4.85,-0.30) {$\lfloor f(X)\rfloor_{\ell_R}+2^{\ell_R}$};
\fill (4.30,-0.74) circle (1.7pt);
\draw[->] (5.55,-0.74) -- (4.40,-0.74);
\node[font=\tiny,anchor=west] at (5.60,-0.74) {$R_{\text{ext}}(Y)=\sum_{i,j}2^{j}Y^{i}c_{i,j}$ must land here};
\draw[<->] (1.2,-1.48) -- node[below,font=\tiny]{$2^{\ell_R}$, one ulp of the result} (2.4,-1.48);
\node[font=\tiny,anchor=north west,align=left] at (-2.4,-1.95)
  {Linear in $c_{i,j}$ because $Y^i$ is a \emph{constant} in each constraint. A truncated product\\
   $\widetilde{C_iP_i}=\sum_j 2^{j}\lfloor P_i\rfloor_{\ell-j}\,c_{i,j}$ is therefore linear too, and costs the model nothing.\\
   $2\cdot 2^{\,w_X-\alpha}$ constraints per subinterval; $2^{\alpha}$ independent ILPs.};
\end{circuitikz}
\end{document}
```

*Own construction from Eqs. (18.37)–(18.40), pp. 567–568; the bit windows are illustrative, not a published result.*

**Name what the two-generator pipeline throws away.** The conventional flow runs Algorithm 18.1 to fix a coefficient LSB $\ell_p$, reads off the achieved $\bar\delta_{\text{approx}}$, hands the remaining budget $\bar\delta^{\text{target}}_{\text{eval}}=2^{\ell_R-1}-\bar\delta_{\text{approx}}$ to Algorithm 18.2, and lets that size the [[Horner Evaluation]] datapath. Each half is dimensioned against a *worst case over all inputs* that almost never occurs, and the seam between them is a triangle inequality — so the two error bounds are added when they could have cancelled. Every worst case that never materialises is a stored bit nobody needed. The fix is to stop separating them.

**Make the coefficient bits themselves the unknowns.** Write each coefficient in its binary expansion with per-coefficient bounds $j_{\min,i}$ and $j_{\max,i}$ fixed in advance from a traditional [[Remez Minimax]] fit ($j_{\min,i}$ close to Algorithm 18.1's $\ell_p$):

$$C_i=\sum_{j=j_{\min,i}}^{j_{\max,i}}2^{j}c_{i,j},\qquad c_{i,j}\in\{0,1\}.\tag{18.37}$$

Substituting into the value the architecture computes before final rounding and exchanging the two finite sums — legal because both are finite, and distributivity of $\times$ over $+$ pushes $Y^i$ across the inner sum:

$$R_{\text{ext}}(Y)=\sum_{i=0}^{d}C_iY^i=\sum_{i=0}^{d}\sum_{j=j_{\min,i}}^{j_{\max,i}}2^{j}Y^{i}c_{i,j}.\tag{18.38}$$

The whole trick lives in one observation about that expression: **for a fixed $Y$, $2^jY^i$ is a constant.** So $R_{\text{ext}}$, viewed one input value at a time, is a *linear form* in the $\sum_i(j_{\max,i}-j_{\min,i}+1)$ binary unknowns — the same word that will be stored in the [[Polynomial Coefficient Table]].

**Turn correct rounding into two inequalities per input value.** With the half-ulp rounding bit pre-added into $C_0$ (see the error budget in [[Polynomial Approximation]]), truncating $R_{\text{ext}}$ to $\ell_R$ is round-to-nearest, so the result is correctly rounded exactly when $R_{\text{ext}}$ lands inside the one-ulp band around the correctly rounded value of $f$:

$$\lfloor f(X)\rfloor_{\ell_R}\ \le\ R_{\text{ext}}(Y)\ <\ \lfloor f(X)\rfloor_{\ell_R}+2^{\ell_R}.\tag{18.39}$$

Both sides are known reals; combining with (18.38) gives two linear constraints on the $c_{i,j}$ per value of $Y$, made integral by multiplying through by a suitable power of two — the standard scaling of [[Number Formats]], which changes nothing because every coefficient of the form is already a dyadic rational. A 1-ulp (faithful) target is the same construction with a wider band. After a uniform reduction of parameter $\alpha$ ([[Uniform Piecewise Segmentation]]), $Y$ is $w_Y=w_X-\alpha$ bits, so there are $2\cdot2^{w_X-\alpha}$ constraints, and because each subinterval $A$ has its own polynomial the problem decomposes into $2^{\alpha}$ **independent** ILPs. Nothing about that should scale — but state-of-the-art solvers carry it to $w_X=24$ with $\alpha=7$, i.e. $128$ problems of $2^{18}$ constraints each.

> [!important] Enumerating every input is what buys correct rounding
> Every other generator in the chapter reasons with *bounds* — $\bar\delta_{\text{approx}}$, $\bar S_{i+1}$, $\bar\delta_{\text{eval}}$ — and pays the slack of a worst case at each step ([[Error Accuracy]]). The ILP writes one constraint per actual input value, so there is no slack to pay: the feasible set is exactly the set of designs that are right everywhere, and the objective is then free to shrink the hardware inside it.

**Truncated products become free rather than an extra error term.** In a bound-based flow, truncating a multiplier ([[Truncated Multipliers]]) injects a term that must be budgeted for. Here it does not, for the same reason as before: $P_i=Y^i$ is a constant in each constraint, so replacing it with any truncated version leaves the form linear. Keeping only the partial products of weight above $\ell$,

$$\widetilde{C_iP_i}=\sum_{j=j_{\min,i}}^{j_{\max,i}}2^{j}\lfloor P_i\rfloor_{\ell-j}\,c_{i,j}=\sum_j \underbrace{2^{j}\lfloor P_i\rfloor_{\ell-j}}_{=K_{i,j}}\,c_{i,j},$$

which is a linear form with different — and exactly known — constants $K_{i,j}$. The generalisation is the useful part: **any** hardware approximation to $Y^i$ can be modelled exactly — a tabulated power, a truncated squarer ([[Squarers and Integer Powers]]), a fused partial-product array — provided the operator reports its output faithfully for each $Y$, because there is one constraint per $Y$ and it may use precisely the value that operator produces. The evaluator's arithmetic error stops being a bound and becomes part of the feasibility test.

**The objective is "force low bits to zero", encoded with an indicator ladder.** Feasibility alone would accept any correctly rounding design; the cost to minimise is table width, i.e. the number of live bits per coefficient. Define

$$\mu_{i,k}=1\iff c_{i,j}=0\ \ \forall j\in\{j_{\min,i},\dots,j_{\min,i}+k\}\tag{18.40}$$

— an indicator that the bottom $k+1$ bits of $C_i$ are all zero, expressible recursively as linear inequalities ($\mu_{i,k}\le\mu_{i,k-1}$ and $\mu_{i,k}\le1-c_{i,j}$ for each $j$ in the run, plus the reverse implication) — and maximise $\sum_{i,k}\mu_{i,k}$. Because the ladder is nested, a run of $n$ zeros scores $n$ rather than $1$, so the objective rewards *contiguous* low-bit runs, which is exactly what raises $j_{\min,i}$ and narrows the stored word. Different coefficients can be weighted differently to reflect their real cost: a bit of $C_2$ pays in the deep, narrow multiplier while a bit of $C_0$ pays only in an adder, so the weights are the honest place to put the "extra LSBs on $C_0$ are nearly free" heuristic that the bound-based flow applies by hand.

**Two passes beat one, for the reason the shared $\ell_p$ works.** The published method optimises $C_1$ first, then $C_2$. A single pass must pick one $j_{\min,1}$ good enough for the worst subinterval; on most intervals a smaller one would have done, and that unused headroom is invisible to the solver. Running $C_1$ to convergence first pins down the per-interval $j_{\min,1}$, which frees room for the second pass to push $j_{\min,2}$ up — the same "hoist the $A$-loop inside the algorithm so the easy intervals donate their slack" argument that makes one shared $\ell_p$ better than per-interval $\ell_p$ values.

**What comes out is a perfectly ordinary datapath.** The ILP is a *design-time* optimisation ([[ILP for Arithmetic Design]]): the silicon is the same coefficient ROM feeding the same truncated Horner chain, only with narrower table words and multipliers whose truncation points were chosen by the solver rather than by an error bound. On an FPGA that shows up as a shallower BRAM word and, occasionally, one fewer DSP because a shortened $C_2$ drops the deep multiplier under the LUT-versus-DSP crossover ([[FPGAs]]); on an ASIC it is simply less area in the table and the partial-product arrays. Nothing about the run-time architecture is unusual, which is why the method composes with everything else in the chapter.

$$\boxed{\ \lfloor f(X)\rfloor_{\ell_R}\ \le\ \sum_{i=0}^{d}\sum_{j=j_{\min,i}}^{j_{\max,i}}2^{j}Y^{i}c_{i,j}\ <\ \lfloor f(X)\rfloor_{\ell_R}+2^{\ell_R},\qquad \max\sum_{i,k}\mu_{i,k}\ }$$

> [!warning] The book reports no coefficient-width table for this method
> §18.4.4 states only that the results are "constantly, if marginally, better than those of the generator presented in Sect. 18.4.3: a few bits shaved from each coefficient" (p. 568), and refers the reader to the original work for everything else. No LUT, DSP, delay or table-bit figure is published, so no cost comparison against the bound-based generator can be quoted here.

**When it breaks.** The constraint count is $2\cdot2^{w_X-\alpha}$ per subinterval and *every* input value must be enumerated, so the method dies above about 24 bits — beyond that the bound-based Algorithms 18.1/18.2, which scale to 64-bit precisions and arbitrary degree, are the only option. Raising $\alpha$ shrinks each ILP but multiplies the number of them by $2$ per bit, so there is no free escape. The published technique covers **degree 1 and 2 only**; higher degrees are probably expressible but unattractive, because a higher degree implies a smaller $\alpha$ ([[Choosing a Polynomial Evaluator]]) and therefore a *larger* $w_X-\alpha$, which is the exponent in the constraint count — the method's scaling runs opposite to the degree knob. It also assumes every operator in the datapath reports faithfully: an approximation whose error is not exactly characterised per input, a [[Parallel Polynomial Evaluator]] whose bit heap is pruned by a heuristic, or a tabulated power with an unstated error, silently invalidates the constraints. Finally, the whole edifice rests on the half-ulp being pre-added into $C_0$; without it (18.39) is the wrong band and the solution is faithful at best ([[Rounding]]).

```spade
/// Degree-2 truncated Horner core as the ILP emits it: each coefficient
/// arrives on its own [j_min,i, j_max,i] window, all sharing the scale 2^-15.
/// Y is ufix(0,-9); S1 and S0 = R_ext are fix(_,-15); R is fix(_,-12).
entity ilp_horner2(
    y:  uint<9>,     // reduced argument, w_Y = w_X - alpha = 12 - 3
    c0: int<16>,     // widest window: extra LSBs on C_0 are nearly free
    c1: int<14>,     // narrowed by ILP pass 1
    c2: int<10>,     // narrowed by ILP pass 2
) -> int<14> {
    // S_2 = C_2 exactly;  S_1 = [ C_1 + Y*S_2 ]_{-15}
    let p1: int<20> = y.to_int() * c2;
    let t1: int<14> = trunc(p1 >>> 9);
    let s1: int<15> = c1 + t1;

    // S_0 = R_ext = [ C_0 + Y*S_1 ]_{-15}
    let y15: int<15> = sext(y.to_int());
    let p0: int<30> = y15 * s1;
    let t0: int<16> = trunc(p0 >>> 9);
    let s0: int<17> = c0 + t0;

    // half-ulp is pre-added into C_0, so truncating to l_R = -12 is round-to-nearest
    let r: int<14> = trunc(s0 >>> 3);
    r
}
```

Purely combinational — no `reg`, so this is the Horner chain of (18.19) unrolled in space, one multiply-add per degree, and its critical path is what Algorithm 18.2 would otherwise have to bound. The three coefficient ports are the three bit windows of the diagram's top panel; their differing widths ($16/14/10$) *are* the ILP's output, and each `trunc(... >>> 9)` is a $\lfloor P_i\rfloor$ the solver modelled exactly rather than bounded. The one thing synthesis will not honour is the drawing's suggestion that $C_2$'s forced-zero LSBs still exist: constant-zero bits never leave the table, so those wires vanish and the deep multiplier shrinks with them. Checked against the worked-example coefficients $(5569,5242,-262)$ for $\log_2(1+X)$ and a $5000$-vector random sweep.

**Related Notes**

- [[ILP for Arithmetic Design]] – depends-on: the general machinery — bits as binary variables, hardware cost as objective — of which this is the polynomial instance.
- [[Horner Evaluation]] – extends: replaces Algorithm 18.2's bound-based sizing of exactly this datapath with a per-input feasibility test.
- [[Truncated Multipliers]] – supports: truncation stops being an error term and becomes a constant $K_{i,j}$ inside the constraint.
- [[Squarers and Integer Powers]] – supports: any faithfully reported $Y^i$ operator, squarer included, drops into the model unchanged.
- [[Rounding]] – depends-on: the half-ulp-in-$C_0$ trick that makes the truncation in (18.39) a round-to-nearest.
- [[Polynomial Coefficient Table]] – compares: the object being minimised; the ILP narrows its word, not its depth.
- [[Choosing a Polynomial Evaluator]] – compares: where "correctly rounded, $\le24$ bits, degree $\le2$" sits against the rest of the family.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 18, "Polynomial-Based Architectures for Function Evaluation":

- §18.4.4 "Combined Approximation and Rounding Optimization Using integer linear programming (ILP)", Eqs. (18.37)–(18.40), pp. 566–568 — the formulation, the truncated-product argument, the $\mu_{i,k}$ objective, the two-pass remark, and the $w_X\le24$, $\alpha=7$ scaling claim.
- §18.4.3 uniform piecewise generator, Fig. 18.23, pp. 565–566 — the bound-based flow this replaces.
- §18.3.1 Horner sizing, Algorithm 18.2, pp. 554–558 — the datapath the ILP dimensions.
- [De+17], cited on p. 566, for the original method and everything §18.4.4 omits.
