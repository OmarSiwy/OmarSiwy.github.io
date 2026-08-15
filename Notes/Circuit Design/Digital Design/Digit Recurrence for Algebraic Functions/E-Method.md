---
title: "E-Method"
description: "A vector digit recurrence solving Ay=b that merges numerator, denominator and division of a rational approximation into one pass with no multiplier and no divider."
kind: circuit
source: "ASA §19.4, pp. 591-594"
status: seed
spade: simulated
tags: [digital, digit-recurrence, rational-function, e-method, division, digit-recurrence-for-algebraic-functions]
aliases:
  - E-Method
  - E-method
  - Ercegovac E-Method
  - E-Method for Rational Functions
  - E-Fraction
  - Simple E-Fraction
---

# E-Method

Ercegovac's vector digit recurrence: it solves $\mathbf{A}\mathbf{y}=\mathbf{b}$ one radix-$\beta$ digit at a time, and when $\mathbf A$ is the companion-like matrix of a rational function it evaluates numerator, denominator and the division between them in a *single* recurrence with no multiplier and no divider anywhere in the datapath.

```tikz title="One iteration of the E-method for a degree-2 rational function: three residual lanes, each a selection function and four-input adder, with the digit vector routed by the sparsity pattern of A"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small, >=latex,
  blk/.style={draw, thick, rounded corners=1pt, inner sep=2pt, align=center,
              minimum height=0.8cm},
  mux/.style={draw, fill=black!8, rounded corners=1pt, inner sep=2pt,
              minimum width=1.6cm, minimum height=0.7cm, font=\footnotesize},
  w/.style={->, thick},
  tap/.style={fill=black, circle, inner sep=1.1pt}]

% ------------------------------------------------ the part every lane shares
\foreach \y/\i in {0/0, -3.6/1, -7.2/2} {
  \node[blk, minimum width=1.9cm, fill=blue!8] (r\i) at (0.95,\y) {$W_{\i}$ reg};
  \node[blk, minimum width=1.2cm] (s\i) at (3.5,\y) {Sel};
  \node[blk, minimum width=1.0cm, minimum height=2.0cm] (p\i) at (9.5,\y) {$\Sigma$};
  \node[blk, minimum width=1.0cm] (h\i) at (11.3,\y) {$\ll 1$};

  \draw[w] (r\i) -- (s\i);
  \draw[w] (p\i) -- (h\i);

  % W_i into the adder, over the top of the digit-product row
  \node[tap] at (2.55,\y) {};
  \draw[w] (2.55,\y) -- (2.55,{\y+1.5}) -- (8.55,{\y+1.5})
                     -- (8.55,{\y+0.7}) -- (9.0,{\y+0.7});
  % -d_i straight through, between the two product blocks
  \draw[w] (s\i.east) -- (8.35,\y) -- (8.35,{\y-0.25}) -- (9.0,{\y-0.25});
  \node[font=\footnotesize, anchor=north] at (7.0,{\y-0.06}) {$-d_{\i}$};

  % the loop: one clock per digit
  \draw[w] (h\i.east) -- (12.7,\y) -- (12.7,{\y-1.55})
                      -- (-0.9,{\y-1.55}) -- (-0.9,\y) -- (r\i.west);
}

% -------------------------------- the two off-diagonal products, lane by lane
\node[mux] (a0) at (7.0,0.8)    {$x\cdot d_{1}$};
\node[mux] (a1) at (7.0,-2.8)   {$x\cdot d_{2}$};
\node[mux] (b1) at (7.0,-4.4)   {$Q_{1}\cdot d_{0}$};
\node[mux] (b2) at (7.0,-8.0)   {$Q_{2}\cdot d_{0}$};
\foreach \n/\y in {a0/0, a1/-3.6} {
  \draw[w] (\n.east) -- (8.15,{\y+0.8}) -- (8.15,{\y+0.25}) -- (9.0,{\y+0.25});}
\foreach \n/\y in {b1/-3.6, b2/-7.2} {
  \draw[w] (\n.east) -- (8.55,{\y-0.8}) -- (8.55,{\y-0.7}) -- (9.0,{\y-0.7});}

% ------------------------------------------------------ cross-lane digit wires
% d_{i+1} climbs one lane: the -x superdiagonal of A
\node[tap, fill=red!70!black] at (4.55,-3.6) {};
\draw[w, red!70!black, thick] (4.55,-3.6) -- (4.55,0.8) -- (a0.west);
\node[tap, fill=red!70!black] at (4.85,-7.2) {};
\draw[w, red!70!black, thick] (4.85,-7.2) -- (4.85,-2.8) -- (a1.west);
% d_0 is broadcast down every lane: the Q_i column of A
\node[tap, fill=blue!70!black] at (5.5,0) {};
\draw[blue!70!black, thick] (5.5,0) -- (5.5,-8.0);
\node[tap, fill=blue!70!black] at (5.5,-4.4) {};
\draw[w, blue!70!black, thick] (5.5,-4.4) -- (b1.west);
\draw[w, blue!70!black, thick] (5.5,-8.0) -- (b2.west);

% ------------------------------------------------------------------ labelling
\node[font=\footnotesize, anchor=south west] at (4.13,0.06)  {$d_{0}$};
\node[font=\footnotesize, anchor=south west] at (4.13,-3.54) {$d_{1}$};
\node[font=\footnotesize, anchor=south west] at (4.13,-7.14) {$d_{2}$};
\node[font=\footnotesize, anchor=west] at (12.78,-0.55) {$d_{0}$: the answer, MSD first};
\node[font=\footnotesize, anchor=south] at (11.3,0.45) {$\times\beta$};
\node[font=\footnotesize, anchor=south] at (10.2,-1.52) {one clock per digit};
\node[font=\footnotesize, anchor=west, text=red!70!black] at (0.2,2.35)
  {$d_{i+1}$ climbs one lane --- the $-x$ superdiagonal of $\mathbf A$};
\node[font=\footnotesize, anchor=west, text=blue!70!black] at (0.2,-9.1)
  {$d_{0}$ fans out to every lane --- the $Q_i$ column of $\mathbf A$};

\node[anchor=north west, font=\footnotesize, align=left] at (-1.5,-9.6)
 {$W_i$, $x$, $Q_i$: \texttt{sfix(3,-16)} $=$ \texttt{int<20>}.\quad
  $d_i\in\{-1,0,1\}$: \texttt{int<2>}.\quad
  Reset loads $\mathbf W\!=\!\mathbf b\!=\!(P_0\,P_1\,P_2)^T$.\\
  Every $\cdot\,d$ block is a negate-and-mux over 20 wires, not a multiplier ---
  that is the whole point of a redundant digit set.\\
  Lane $i$ is row $i$ of $\;\mathbf W\leftarrow\beta(\mathbf W-\mathbf A\mathbf d)$;
  $m{+}1$ clocks give $m{+}1$ digits of $y_0=R(x)$.};
\end{circuitikz}
\end{document}
```

*own construction from the system of §19.4, pp. 592–594.*

**Generalise digit-recurrence division from a scalar divisor to a matrix.** Digit-recurrence division ([[Dividers]]) keeps a residual $W$ and drives it toward zero by subtracting $d\cdot D$ each step, where $D$ is the divisor and $d$ the digit just chosen; the quotient is the sequence of digits. Replace the scalar $D$ by a non-singular matrix $\mathbf A$, the scalar residual by a vector $\mathbf W$, and the scalar digit by a *vector* of digits $\mathbf d$ — one per component — and the same argument computes $\mathbf A^{-1}\mathbf b$ digit by digit. That is the whole idea. Each component of the approximation is a radix-$\beta$ expansion

$$Y_i \;=\; \sum_{j=0}^{m}\beta^{-j}d_{i,j},\qquad d_{i,j}\in\{-\gamma,\dots,\gamma\},$$

with $m$ the target precision and $\gamma$ the digit-set parameter; collecting the weight-$\beta^{-j}$ digits of every component gives $\mathbf d_j = (d_{0,j}\;d_{1,j}\;\dots\;d_{n,j})^T$. Redundancy $\rho = \gamma/(\beta-1)$ ([[Number Formats]]) is what makes the selection function cheap, exactly as in [[SRT Division]].

**The recurrence is scale-then-subtract, and the residual is an exact linear function of the digits already emitted.** Starting from $\mathbf W_0 = \mathbf b$,

$$\mathbf d_j = \mathrm{Sel}(\mathbf W_j),\qquad \mathbf W_{j+1} = \beta\left(\mathbf W_j - \mathbf A\mathbf d_j\right).$$

Unrolling and using distributivity of the matrix-vector product over the sum, $\mathbf W_1 = \beta(\mathbf b - \mathbf A\mathbf d_0)$, $\mathbf W_2 = \beta^2\mathbf b - \beta^2\mathbf A\mathbf d_0 - \beta\mathbf A\mathbf d_1$, and by induction

$$\mathbf W_k \;=\; \beta^{k}\Bigl(\mathbf b - \mathbf A\sum_{j=0}^{k-1}\beta^{-j}\mathbf d_j\Bigr) \;=\;\beta^{k}\bigl(\mathbf b - \mathbf A\mathbf Y^{(k-1)}\bigr).$$

So $\beta^{-k}\mathbf W_k$ *is* the exact residual $\mathbf b - \mathbf A\mathbf Y$ of the linear system after $k$ digits. Keeping $\|\mathbf W_k\|$ bounded therefore forces $\|\mathbf Y - \mathbf y\| = \|\mathbf A^{-1}\beta^{-k}\mathbf W_k\| \to 0$ geometrically — one factor of $\beta$ per iteration, which is the definition of a digit recurrence. Nothing here is an approximation: as long as $\mathbf A$, $\mathbf b$ and the digits are exactly representable, the recurrence is exact arithmetic, which is why a digit recurrence delivers correct rounding where a multiplicative method delivers only faithful rounding ([[Error Accuracy]]).

> [!warning] The source's index convention is off by one factor of $\beta$
> As printed, Eq. (19.57) writes $Y_i=\sum_{j=-1}^{-m}\beta^{j}d_{i,j}$ — first digit of weight $\beta^{-1}$ — while Eqs. (19.59)–(19.61) start from $\mathbf W_0=\mathbf b$ and use $\mathbf d_j=\mathrm{Sel}(\mathbf W_{j+1})$, $\mathbf W_j=\beta(\mathbf W_{j+1}-\mathbf A\mathbf d_j)$; and Eqs. (19.62) and (19.67) both write the digit against $\mathbf W_{i,j}$, same index. That pair is inconsistent: taking the equations literally converges to $\mathbf y/\beta$, not $\mathbf y$. Check by hand on $\mathbf A=\mathbf I$, $b=\tfrac14$, $\beta=2$, $\gamma=1$: digits $0,1,-1,0,\dots$, which sums to $\tfrac14$ only if the first digit carries weight $\beta^{0}$. The form used above ($\mathbf W_0=\mathbf b$, $\mathbf d_j=\mathrm{Sel}(\mathbf W_j)$, digits from $j=0$) is self-consistent, matches Ercegovac's original indexing, and is the one simulated below. The alternative repair — keeping the book's weights and writing $\mathbf W_{j-1}=\beta\mathbf W_j-\mathbf A\mathbf d_j$, i.e. scaling only the residual, as in the scalar $W_{i+1}=\beta W_i - dD$ — is equally valid and differs only by relabelling.

**Selection is rounding to nearest with a clamp, and it is per-lane.** Because $\mathbf A\approx\mathbf I$ (this is imposed below), the residual lane $W_{i,j}$ is already close to the digit that should be emitted, so the selection function is simply

$$d_{i,j} = \begin{cases}\mathrm{sign}(W_{i,j})\times\left\lfloor|W_{i,j}|+\tfrac12\right\rfloor & |W_{i,j}|\le\gamma\\[2pt] \mathrm{sign}(W_{i,j})\times\gamma & \text{otherwise}\end{cases}$$

componentwise — no lane looks at any other lane. For $\beta=2,\gamma=1$ that collapses to two threshold comparisons against $\pm\tfrac12$, i.e. a look at the sign bit and the three or four leading fractional bits, which is the whole reason the per-iteration critical path stays short. When $\zeta>\tfrac12$ the convergence bound leaves slack, and the comparison can be made against a truncation $\widetilde{\mathbf W}_j$ of the residual to its leading digits — the same move that lets [[Square Root Digit Selection Function|square-root selection]] read a carry-save residual.

**Convergence needs $\mathbf A$ close to the identity and $\mathbf b$ small.** Ercegovac proves by induction that if there exist $\zeta,\mu$ with

$$\tfrac12 \le \zeta < 1,\qquad 0<\mu<\frac1\beta\left[1-\frac{\zeta}{\gamma}(\beta-1)\right] = \frac1\beta\left(1-\frac{\zeta}{\rho}\right),$$
$$\|\mathbf I - \mathbf A\| \le \mu \quad\text{with}\quad \|\mathbf M\| = \max_i\left(\sum_{k=0}^n|m_{ik}|\right),\qquad \|\mathbf b\|\le\zeta \quad\text{with}\quad \|\mathbf b\|=\max_i|b_i|,$$

then $\|\mathbf W_j - \mathbf d_j\|\le\zeta$ at every iteration and $\|\mathbf Y - \mathbf y\| < \beta^{-m}$ after $m+1$ digits. The second condition immediately forces $\zeta<\rho$, so a **redundant** digit set buys headroom in exactly the same way it does for SRT: $\rho$ is the budget out of which both the selection-function slack and the $\|\mathbf I-\mathbf A\|$ slack are paid. The first bound is also what sizes the residual registers — $\|\mathbf W_j-\mathbf d_j\|\le\zeta<1$ with $|d_{i,j}|\le\gamma$ bounds every lane by $\gamma+\zeta$, so two integer bits plus a sign always suffice.

**A rational function of degree $n$ becomes an $(n{+}1)\times(n{+}1)$ system with three nonzeros per row.** Take a rational approximation of a target $f$ ([[Polynomial Approximation]] supplies the machinery for finding one):

$$R(x) = \frac{P_0+P_1x+P_2x^2+\dots+P_nx^n}{1+Q_1x+Q_2x^2+\dots+Q_nx^n}.$$

Consider the system with $1$ on the diagonal, $-x$ on the superdiagonal, the $Q_i$ down the first column below the diagonal, and right-hand side $(P_0\;P_1\;\dots\;P_n)^T$. Row $n$ gives $y_n = P_n - Q_ny_0$; back-substituting upward, $y_i = \sum_{k=i}^{n}x^{k-i}(P_k-Q_ky_0)$ for $i\ge1$. Row 0 is $y_0 = P_0 + xy_1$, so

$$
y_0 = P_0 + \sum_{k=1}^{n}x^kP_k - y_0\sum_{k=1}^{n}Q_kx^k
\;\Longrightarrow\;
y_0\left(1+\sum_{k=1}^nQ_kx^k\right) = \sum_{k=0}^nP_kx^k,
$$

that is, $y_0 = R(x)$. The other $n$ components are the Horner partial sums that would have been computed anyway; the E-method just never materialises them as numbers. **The numerator evaluation, the denominator evaluation and the division are one recurrence** — compare [[Horner Evaluation]] plus a second Horner plus a full divider, three sequential stages.

**Three nonzeros per row is why there is no multiplier.** Lane $i$ of $\mathbf W \leftarrow \beta(\mathbf W - \mathbf A\mathbf d)$ expands to

$$W_i \;\leftarrow\; \beta\left(W_i - d_i + x\,d_{i+1} - Q_i\,d_0\right),$$

and every product in it is *word $\times$ digit* with $|d|\le\gamma$. For $\gamma=1$ that is a negation and a 3:1 mux over the width of the word; for a general $\gamma$ it is a small multiple-selector, since $\{-\gamma..\gamma\}$ shifted by a radix that is a power of two gives only shifted copies. The per-iteration hardware is therefore $n{+}1$ selection functions and $n{+}1$ short multi-operand adders — no multiplier and no divider, which is the entire economic argument for the method. This is the same trade [[Multiplication by Constants]] makes in the other direction: there a constant is turned into a shift-and-add network up front, here it is consumed one digit at a time and the network never exists.

**Read the convergence conditions back onto the rational function.** $\mathbf I - \mathbf A$ has zero diagonal, $+x$ on the superdiagonal and $-Q_i$ in the first column, so its row sums are $|x|$ for row 0, $|Q_i|+|x|$ for rows $1..n-1$, and $|Q_n|$ for row $n$. Taking the max,

$$\forall i\in\{1,\dots,n\}:\quad |Q_i| + |x| < \mu \qquad\text{and}\qquad \forall i:\; |P_i| < \zeta.$$

> [!important] The E-method is not universal, and $x$ is why
> $|Q_i|+|x|<\mu$ **involves the input**, so it is not a property of the function alone — it defines a *domain of convergence*. Combined with $|P_i|<\zeta$ and $\zeta<\rho\le1$, it says the coefficients of the rational approximation must be small; most approximations produced by a minimax fit are not. Scaling input and output by powers of two can convert the two constraints into a constraint on the input interval, but if no scaling works the E-method simply does not apply to that $R$, and you fall back to two Horner chains and a divider. Rational fractions that do satisfy the constraints, possibly after an output-side power-of-two scaling, are called **simple E-fractions**; finding them with machine-representable $P_i,Q_i$ is a search problem in its own right, solved in Brisebarre et al. (2018). For a *polynomial* ($\forall i,\,Q_i=0$) some power-of-two scaling always exists, so the E-method always applies — but it is not an efficient way to evaluate a polynomial and Horner wins. The E-method earns its keep only where a rational approximation genuinely beats a polynomial one, which is where the target has near-singularities a polynomial cannot capture.

**Widths, and where they come from.** With $\gamma=2$ and $\beta$ a power of two, $\mathbf d_j$ is $n{+}1$ digits of $\lceil\log_2(2\gamma{+}1)\rceil$ bits each; each lane of $\mathbf W_j$ is bounded by $\gamma+\zeta<3$, so `sfix(2,-m)` — $m+3$ bits — suffices. In the RTL below, $\beta=2$, $\gamma=1$, $n=2$, and every lane is `sfix(3,-16)` = `int<20>`: one more integer bit than the bound requires, bought so that no *partial* sum inside the four-input adder can wrap before the terms cancel. The digit is `int<2>`. Note that the residual arithmetic is exact — the left shift by $\log_2\beta$ never drops a bit as long as the bound holds — so the only error in the whole datapath is the quantisation of $x$, $P_i$ and $Q_i$ into the fixed-point format, which changes *which* rational function is evaluated rather than how well it is evaluated.

**On FPGAs, keep the residual in plain two's complement and raise the radix.** Ercegovac's original work targeted ASICs and kept the partial remainders redundant, because a carry-propagate adder on the iteration path is the ASIC bottleneck. The reference FPGA implementation of Brisebarre et al. (2018) does the opposite: standard two's-complement remainders, because [[FPGAs|fast-carry hardware]] makes a 20-bit carry-propagate add roughly free and a redundant representation would double the register count and complicate the selection function for nothing. The same paper reports that **high radices, $\beta = 8$ to $\beta = 32$**, give area-efficient FPGA implementations by exploiting large architectural LUTs — the selection function grows, but it grows into a LUT that was going to be paid for anyway, and the iteration count drops by $\log_2\beta$.

$$\boxed{\ \mathbf W_0=\mathbf b,\quad \mathbf d_j=\mathrm{Sel}(\mathbf W_j),\quad \mathbf W_{j+1}=\beta\left(\mathbf W_j-\mathbf A\mathbf d_j\right)\ \Longrightarrow\ y_0=\sum_{j\ge0}\beta^{-j}d_{0,j}=R(x)\ }$$

**When it breaks.**

- **The coefficients do not fit.** $|Q_i|+|x|<\mu$ and $|P_i|<\zeta$ are hard preconditions, not accuracy guidance — violate them and the residual grows without bound and the register overflows. There is no runtime check; the search for a simple E-fraction is a design-time obligation.
- **$x$ outside the domain.** Because $\mu$ constrains $|x|$, the operator has an input interval, and it is usually much narrower than the interval the approximation itself is valid on. Range reduction ([[Polynomial Approximation|Range Reduction]]) has to deliver an argument inside *that* interval, not merely inside the approximation's.
- **$\mathbf A$ nearly singular.** The theory needs $\|\mathbf I-\mathbf A\|\le\mu<1/\beta$, so $\mathbf A$ is diagonally dominant by construction and cannot be near-singular — but a denominator with a root near the reduced input interval is exactly what pushes $|Q_i|$ up and out of the constraint. The method quietly refuses the near-singularities that motivated using a rational function in the first place.
- **Polynomials.** Always applicable after scaling, never the right choice: Horner does the same work with $n$ multiply-accumulates and no $m$-cycle loop.
- **Latency.** $m+1$ cycles for $m+1$ digits. Against a pipelined polynomial evaluator at one result per cycle, the E-method loses on throughput by a factor of $m$ unless $n{+}1$ independent problems are interleaved in the same lanes.
- **The result is redundant.** $Y_0$ comes out as a signed-digit string, not two's complement. Converting costs an adder-subtractor at the end, or an [[On-the-Fly Converter]] running alongside the recurrence.

**RTL (Spade).** One iteration of the recurrence, for $\beta=2$, $\gamma=1$, $n=2$ — the datapath in the diagram, held in place and clocked once per digit.

```spade
// Fixed point: every datapath value is sfix(3,-16) held in int<20>; 1.0 is 65536.

/// Sel: round to nearest, clamped at gamma = 1. |W| < gamma + zeta < 2, so the
/// clamp and the rounding collapse into two threshold comparisons at +-1/2.
fn sel(w: int<20>) -> int<2> {
    if w >= 32768 { 1 } else { if w <= -32768 { -1 } else { 0 } }
}

/// Multiply a sfix(3,-16) value by a digit in {-1,0,1}: a negate and a mux.
fn dmul(v: int<20>, d: int<2>) -> int<20> {
    if d > 0 { v } else { if d < 0 { -v } else { 0 } }
}

/// One iteration of W_{j+1} = beta*(W_j - A d_j) per clock, held in place.
entity emethod3(
    clk: clock, rst: bool,
    x: int<20>, q1: int<20>, q2: int<20>,
    p0: int<20>, p1: int<20>, p2: int<20>,
) -> int<2> {
    decl wn;
    reg(clk) w: [int<20>; 3] reset(rst: [p0, p1, p2]) = wn;

    let d0 = sel(w[0]);
    let d1 = sel(w[1]);
    let d2 = sel(w[2]);

    let one: int<20> = 65536;
    let r0 = w[0] -. dmul(one, d0) +. dmul(x, d1);
    let r1 = w[1] -. dmul(one, d1) +. dmul(x, d2) -. dmul(q1, d0);
    let r2 = w[2] -. dmul(one, d2) -. dmul(q2, d0);

    let wn = [r0 << 1, r1 << 1, r2 << 1];
    d0
}
```

The array `w` is the three residual registers on the left of the diagram; `reset(rst: [p0,p1,p2])` is the $\mathbf W_0=\mathbf b$ load, so `rst` is the operator's *start* pulse, not a power-on reset. `dmul(x, d1)` and `dmul(q1, d0)` are the two shaded blocks — a two's-complement negate and a 3:1 select over 20 wires, never a multiplier; `dmul(one, d0)` is the diagonal $-d_i$ term and synthesises to nothing but a constant into the adder. Everything from `sel` to `<< 1` is combinational and forms the whole iteration critical path: one 4-bit compare, one 20-bit four-operand add, and a wire relabelling for the $\times\beta$. Synthesis will not build `<< 1` at all, and it will fold the three `-.`/`+.` into one carry-save tree plus a single carry-propagate add, which the drawing's single $\Sigma$ box already implies.

**Loop cost.** $m+1$ clocks for $m{+}1$ digits and $\|\mathbf Y-\mathbf y\|<\beta^{-m}$, so 15 clocks for the 15-digit case simulated here. Around the datapath the loop control is a $\lceil\log_2(m{+}1)\rceil$-bit down-counter, a 2:1 mux per residual bit for the $\mathbf b$ load ($3\times20 = 60$ muxes here), and the shift register or [[On-the-Fly Converter]] that assembles $d_{0,j}$ into $Y_0$. That control is the only thing that grows when you widen the result; the datapath does not.

**Verified.** Compiled with `spade 0.19.0`, then simulated: 7 named vectors (including asymmetric ones such as $x=0.15$, $\mathbf P=(-0.25,\,0.375,\,0.125)$, $\mathbf Q=(-0.09,\,0.05)$, and its sign-mirrored twin) plus a 500-case random sweep over $|x|<0.15$, $|Q_i|<0.09$, $|P_i|<0.5$, each run for 15 clocks and compared against $R(x)$ evaluated in floating point — 507/507 within $10^{-4}$, against the theoretical $\beta^{-15}=3\times10^{-5}$. Flipping the sign of the single $Q_1d_0$ term fails 434 of the 507, so the sweep is not vacuous.

**Related notes.**

- [[Dividers]] – extends: the E-method is literally digit-recurrence division with the divisor promoted to a matrix; every structural choice here has a scalar ancestor there.
- [[SRT Division]] – extends: supplies the redundancy argument $\zeta<\rho$ and the truncated-residual selection function that the vector case reuses unchanged, one lane at a time.
- [[Polynomial Approximation]] – depends-on: produces the $R(x)$ whose $P_i,Q_i$ this recurrence consumes, and owns the range reduction that has to land $x$ inside the domain of convergence.
- [[Horner Evaluation]] – compares: the thing the E-method replaces — two Horner chains plus a divider, three stages and a full multiplier, against one recurrence and no multiplier at $m$ cycles' latency.
- [[Multiplication by Constants]] – compares: the opposite trade for the same product, a constant times a word; there the constant becomes a shift-add network up front, here it is consumed one digit at a time and no network is built.
- [[On-the-Fly Converter]] – supports: turns the signed-digit $d_{0,j}$ stream into two's complement without a final carry-propagate addition.
- [[Choosing a Digit Recurrence]] – compares: where the E-method sits against the square-root, cube-root and norm recurrences that share its skeleton.
- [[Digit Recurrence for Algebraic Functions]] – depends-on: the residual-plus-selection pattern this note instantiates for a linear system.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §19.4 "The E-Method for Evaluating Rational Functions", Eqs. (19.57)–(19.68) — pp. 591–592.
- §19.4.2 "Rational Approximation Compatible with the E-Method", Eqs. (19.69)–(19.72), the matrix of (19.70), simple E-fractions and the FPGA radices $\beta=8\dots32$ — pp. 593–594.
- §19.2 for the digit-recurrence-versus-multiplier area-time comparison quoted as a rule of thumb — p. 589.
- Primary sources cited by the chapter: Ercegovac (1977) for the method and its convergence proof; Brisebarre & Muller (2004) and Brisebarre et al. (2008, 2018) for E-fractions and the reference FPGA implementation.
