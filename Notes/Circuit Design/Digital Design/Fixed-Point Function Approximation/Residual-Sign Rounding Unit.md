---
title: "Residual-Sign Rounding Unit"
description: "Turn any faithful algebraic-function approximation into a correctly rounded one: compute S faithful at precision l-1, and when its LSB is 1 let the sign of P(S,X,Y) pick the neighbour."
kind: circuit
source: "ASA §16.3.1, pp. 486-487 (Fig. 16.9, p. 487)"
status: seed
spade: simulated
tags: [digital, fixed-point-function-approximation, rounding, algebraic-functions, division, square-root]
aliases:
  - Residual-Sign Rounding
  - Residual Sign Rounding
  - Faithful-to-Correctly-Rounded Conversion
---

# Residual-Sign Rounding Unit

A rounding stage that upgrades a *faithful* approximation of an algebraic function to a *correctly rounded* one, by computing one guard bit more than the target format and, only when that guard bit is set, resolving the resulting exact midpoint with the sign of the defining polynomial's residual.

```tikz title="Faithful at one extra bit gives correct rounding: LSB 0 passes through, LSB 1 is decided by the sign of P"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\small]

% ---------------- panel (a): LSB of S is 0 ----------------
\draw[->] (0.0,0) -- (7.4,0) node[right] {$\mathbb{R}$};
\foreach \x in {0.6,2.0,3.4,4.8,6.2} \draw (\x,-0.13) -- (\x,0.13);
\draw[very thick] (3.4,-0.30) -- (3.4,0.30);
\node[anchor=north] at (3.4,-0.34) {$S$, LSB $=0$};

\draw[<->] (0.6,1.35) -- (2.0,1.35);
\node[anchor=south] at (1.3,1.37) {$2^{\ell}$};
\draw[<->] (3.4,1.35) -- (4.1,1.35);
\node[anchor=south] at (3.75,1.37) {$\delta<2^{\ell-1}$};

\draw[|-|] (2.7,0.62) -- (4.1,0.62);
\node[anchor=south] at (3.4,0.64) {interval of $\widehat S$};

\node[anchor=north] at (3.4,-1.05)
  {(a) $S$ is already a $\mathrm{ufix}(0,\ell)$ number, so it \emph{is} the rounding};

% ---------------- panel (b): LSB of S is 1 ----------------
\begin{scope}[yshift=-3.6cm]
\draw[->] (0.0,0) -- (7.4,0) node[right] {$\mathbb{R}$};
\foreach \x in {0.6,2.0,3.4,4.8,6.2} \draw (\x,-0.13) -- (\x,0.13);
\draw[very thick] (4.1,-0.30) -- (4.1,0.30);
\node[anchor=north] at (4.1,-0.70) {$S$, LSB $=1$};
\node[anchor=north] at (3.4,-0.16) {$T$};
\node[anchor=north] at (4.8,-0.16) {$T{+}1$};

\draw[dashed] (4.35,-0.30) -- (4.35,1.20);
\node[anchor=south] at (4.35,1.20) {$P=0$ at $\widehat S$};
\draw[<-] (3.50,0.62) -- (4.28,0.62);
\draw[->] (4.42,0.62) -- (5.20,0.62);
\node[anchor=south] at (3.55,0.66) {$P<0$};
\node[anchor=south] at (5.15,0.66) {$P>0$};

\draw[|-|] (3.4,-1.25) -- (4.8,-1.25);
\node[anchor=north] at (4.1,-1.27) {faithful interval of $\widehat S$};

\node[anchor=north] at (3.4,-1.95)
  {(b) $S$ is a midpoint, so the sign of $P(S,X,Y)$ picks the neighbour};
\end{scope}

\end{circuitikz}
\end{document}
```

*after Fig. 16.9, p. 487.*

**Fix the two formats before anything else.** The target result $R$ lives in $\mathrm{ufix}(0,\ell)$ — weights $2^{0}$ down to $2^{\ell}$ inclusive, so $w = 1-\ell$ bits — and the unit of last place is $u = 2^{\ell}$. The approximator does *not* produce $R$; it produces $S \in \mathrm{ufix}(0,\ell-1)$, one bit finer, so $S$ is $w+1$ bits and its own ulp is $2^{\ell-1} = u/2$. Write $s_0$ for the LSB of $S$ and $T = \lfloor S/2 \rfloor$ for the $w$-bit number obtained by dropping it; $T$ and $T+1$ are the two $\mathrm{ufix}(0,\ell)$ numbers bracketing $S$. The exact mathematical value is $\widehat S$, which is in general not representable at any finite precision. See [[Number Formats]] for the $\mathrm{ufix}(m,\ell)$ convention and [[Rounding]] for what "faithful" and "correctly rounded" mean.

**Assume faithfulness one bit past the target, not correct rounding at the target.** The only contract required of the upstream approximator is $|\widehat S - S| < 2^{\ell-1}$: $S$ is one of the (at most) two $\mathrm{ufix}(0,\ell-1)$ numbers surrounding $\widehat S$. That is strictly weaker than correct rounding at precision $\ell-1$, and — this is the whole economic argument — it is usually cheaper than correct rounding at precision $\ell$, because faithfulness is what every generic technique in this topic naturally delivers, whereas correct rounding is what none of them delivers without extra work.

**Split on the guard bit; half the inputs are already done.** If $s_0 = 0$ then $S$ is itself a $\mathrm{ufix}(0,\ell)$ number, and faithfulness gives $|\widehat S - S| < 2^{\ell-1} = u/2$: $\widehat S$ is strictly inside the half-ulp interval centred on $S$, so no other $\mathrm{ufix}(0,\ell)$ number is closer. By the definition of round-to-nearest, $S$ *is* the correctly rounded result, with no test and no arithmetic — panel (a). The whole cost of the unit falls on the other half of the input space.

**Turn the remaining tie into a sign test, using monotonicity.** If $s_0 = 1$ then $S = T + u/2$ sits exactly halfway between $T$ and $T+1$, and faithfulness places $\widehat S$ strictly inside $(T, T+1)$ — panel (b). Rounding correctly now means answering one question: is $\widehat S$ left or right of $S$? Because $\widehat S$ is defined as the root of $P(\cdot, X, Y, \dots)$ and because $P$ is monotonic in its first argument on that interval, the map $S \mapsto P(S,X,Y)$ is strictly order-preserving about its root. So, for $P$ increasing,

$$P(S,X,Y) > 0 \iff S > \widehat S, \qquad P(S,X,Y) < 0 \iff S < \widehat S,$$

and $P(S,X,Y) = 0$ says $S = \widehat S$ exactly. Three cases, and the *sign* of one number decides all of them: $P>0$ round down to $T$, $P<0$ round up to $T+1$, $P=0$ is a genuine tie for which the format's tie rule applies. Nothing here is an approximation — it is the trichotomy of the ordered field $\mathbb{R}$ pushed through a strictly monotone function.

**The sign is exactly computable because $P$ is only additions and multiplications.** An algebraic function is by definition the solution of $P(S,X,Y,\dots)=0$ with $P$ a polynomial, and a polynomial evaluated at *finite binary* arguments is itself a finite binary number: products of $p$- and $q$-bit fixed-point numbers are exact in $p+q$ bits, sums of $p$-bit numbers are exact in $p+\lceil\log_2 k\rceil$ bits. $S$, $X$, $Y$ are all finite binary by construction, so $P(S,X,Y)$ has an exact finite representation whose width is a closed-form function of the input widths — no error analysis, no guard bits, no interval arithmetic. This is exactly why the trick has no analogue for [[Polynomial Approximation]] of $\exp$ or $\sin$: those have no polynomial $P$ vanishing at the result, so there is no finite residual whose sign to take, and correct rounding falls back to Ziv's unbounded loop.

**In a digit recurrence the residual is already in a register.** For the quotient $Q = X/Y$ the defining polynomial is $P(Q,X,Y) = QY - X$, which *is* the remainder — so [[SRT Division]] finishes each division holding the sign information for free, and the same holds for square root and for the rational functions of [[Digit Recurrence for Algebraic Functions]]. The book's generalisation (p. 487) is the observation that this is not a division-specific accident: run the recurrence one extra step to get $S$ at $\mathrm{ufix}(0,\ell-1)$, look at the residual you were already computing, and correct rounding costs a sign wire and an increment. That is why digit recurrence is the one family where correct rounding is nearly free at any precision.

> [!important] One extra bit is the entire mechanism
> Everything above is bought by widening the approximator's output by a single bit. The guard bit both (i) certifies the easy half of the input space with zero logic, and (ii) reduces the hard half from "which of $2^{w}$ values" to "which of two neighbours", which is one sign.

**Cost is an incrementer plus whatever the sign costs.** The unit proper is: drop one bit (free — it is wiring), one $w$-bit conditional incrementer, a zero-detect on the residual for the tie case, and about three gates of control. On FPGA the incrementer maps to the hard carry chain at $\lceil w/2 \rceil$ LUT-pairs and one carry-chain delay (see [[FPGAs]]); the zero-detect is a $r$-input reduction NOR, $\lceil r/\alpha \rceil$ LUTs at the first level for LUT arity $\alpha$, and it is the same primitive a [[Magnitude Comparator]] uses for its equality output. On ASIC both collapse into the final carry-propagate adder that the approximator already needs, so the marginal cost is closer to the control gates than to a separate adder — the increment is folded in as a carry-in, not built.

> [!warning] The source gives no area or delay figure for this unit — neither ASA §16.3.1 nor the surrounding text quotes LUT counts or timing for residual-sign rounding. The cost paragraph above is derived from the structure, not measured; a real number needs synthesis or outside research.

$$\boxed{\;R \;=\; T \;+\; \Big[\, s_0 \wedge \big(\,P(S,X,Y) < 0 \;\vee\; (P(S,X,Y) = 0 \wedge t_0)\,\big)\Big],\qquad T=\lfloor S/2\rfloor,\ t_0 = \mathrm{LSB}(T)\;}$$

The bracket is an Iverson bracket producing the increment bit; the $P=0$ disjunct implements ties-to-even, and swapping it for the constant $1$ gives ties-away-from-zero.

**When it breaks.**

- **$P$ not monotonic in $S$ on the faithful interval.** The test is a sign, so it is only as good as the order-preservation. $P(Q,X,Y) = QY-X$ is increasing in $Q$ only for $Y>0$; with $Y<0$ every comparison inverts, so a signed divider must XOR the sign test with $\mathrm{sign}(Y)$. For $P(S,X)=S^2-X$ monotonicity holds only on $S\ge 0$, which is why the square-root case is stated for the positive root.
- **Non-algebraic $f$.** No polynomial $P$ means no finite residual means no sign to take. Elementary and special functions get correct rounding only by offline enumeration at small precision, or by Ziv's loop, which has no termination bound and is a `while` in hardware.
- **Residual held redundantly.** A carry-save or borrow-save partial remainder has no sign *bit*: reading its sign costs an assimilating carry-propagate add or a dedicated sign-detection network. If the recurrence stayed redundant precisely to avoid that adder, this unit hands the cost straight back on the last cycle.
- **The exact-zero test is the expensive third of the logic.** Distinguishing $P=0$ from $P>0$ needs a full $r$-bit zero-detect; if the tie rule is round-half-up you can delete it and test only the sign bit. Ties-to-even is what costs the NOR.
- **Carry-out of the increment.** $T = 2^{w}-1$ with the increment asserted overflows $w$ bits. Either widen the result — see [[Output Format Widening]] — or clamp it, see [[Saturating Output Clamp]], or prove by range analysis that the top code is unreachable.
- **Faithfulness must be strict.** The case-(a) argument uses $|\widehat S - S| < 2^{\ell-1}$, not $\le$. An approximator whose error bound is attained at the endpoint breaks the "no other $\mathrm{ufix}(0,\ell)$ number is closer" step, and there the tie is not detectable from $s_0$.
- **A sibling already has correct rounding for free.** Plain tabulation puts the rounding in the table-generation script at zero hardware cost — see [[Function Table ROM]] — so bolting this unit onto a ROM is pure overhead. It pays only where the approximator is *generic and faithful*: digit recurrence, and [[Polynomial Approximation]].

**RTL in Spade.**

```spade
/// Residual-sign rounding: take a faithful S in ufix(0, l-1) plus the exact
/// residual P(S,X,Y), return the correctly rounded ufix(0, l) result.
/// W = width of the target format; R = width of the (signed) residual.
entity rsround<#uint W, #uint R>(s: uint<{W + 1}>, resid: int<R>) -> uint<{W + 1}> {
    let t: uint<W> = trunc(s >> 1);       // T: the precision-l neighbour below S
    let midpoint = s.as_bits()[0];        // s_0: 1 => S is a tie point
    let up = if midpoint {
        if resid.sign_bit() { true }              // P<0 : S < Shat, take T+1
        else if resid == 0 { t.as_bits()[0] }     // P=0 : exact tie, round to even
        else { false }                            // P>0 : S > Shat, take T
    } else { false };
    t + if up { 1 } else { 0 }
}
```

`s` is the $(w{+}1)$-bit faithful result — the thick tick in the diagram — and `resid` is $P(S,X,Y)$, whose sign bit is which side of the dashed line $\widehat S$ falls on. `t` is $T$, and `s >> 1` is pure wiring: no logic is spent dropping the guard bit. The block is combinational and unclocked; the whole of it is one $w$-bit increment, a sign bit, and an $r$-input zero-detect. Synthesis will not build the incrementer the code implies — it merges `up` into the carry-in of the approximator's final carry-propagate adder, which is the one thing the drawing cannot show. The return width is $w{+}1$ so the carry-out is explicit rather than silently wrapped.

**Related notes.**

- [[Digit Recurrence for Algebraic Functions]] – supports: the family this unit was generalised from, and the only one whose residual is already a register.
- [[SRT Division]] – supports: its partial remainder $QY-X$ is literally the $P$ whose sign this unit reads.
- [[Rounding]] – depends-on: supplies "faithful", "correctly rounded" and the tie rules the boxed expression selects between.
- [[Magnitude Comparator]] – supports: the exact-zero detection in the tie case is the equality path of a comparator against $0$.
- [[Choosing a Function Approximation Method]] – compares: where the "correct rounding is nearly free" column comes from.
- [[Function Table ROM]] – counter-example: gets correct rounding at zero hardware cost by putting it in the table generator, so this unit buys nothing there.
- [[Output Format Widening]] – extends: what to do with the carry-out when $T+1$ leaves the target format.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §16.3.1 "Algebraic Functions", pp. 486-487 — definition of an algebraic function, exactness of $P$ on finite binary inputs, and the faithful-to-correctly-rounded argument.
  - Fig. 16.9, p. 487 — the two-case number-line figure redrawn above.
  - §16.3.2, p. 488 — why the same argument fails for elementary and special functions (Ziv's algorithm, termination).
  - §11.3.4, p. 351 — cited on p. 487 as where the square-root instance of this technique was introduced.
