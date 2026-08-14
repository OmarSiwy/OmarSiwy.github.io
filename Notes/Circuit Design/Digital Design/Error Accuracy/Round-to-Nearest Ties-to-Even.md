---
title: "Round-to-Nearest Ties-to-Even"
description: "The IEEE 754 default: same 1/2 ulp bound as ties-up but unbiased and symmetric about zero, paid for with explicit tie detection and an LSB force."
kind: circuit
status: seed
spade: simulated
tags: [digital, error-accuracy, rounding, ieee754]
aliases:
  - RNE
  - Round to Nearest Even
  - Ties to Even
  - roundTiesToEven
  - Banker's Rounding
---

# Round-to-Nearest Ties-to-Even

Round-to-nearest whose tie rule picks the neighbour with an even LSB, which is what makes it the only half-ulp mode that is both unbiased and symmetric about zero — and the only one whose correction is *data-dependent*.

```tikz title="Ties-to-even rounding site: round bit, sticky OR tree, LSB feedback, and a conditional increment"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  % ---- the exact pre-rounding value Y, split at the rounding point ----
  \node[font=\footnotesize,anchor=east] at (-0.15,4.0) {$Y$ exact, $W+G$ bits};
  \draw (0,3.6) rectangle (6.0,4.4);
  \node[font=\footnotesize] at (3.0,4.0) {kept part $q$ --- $W$ bits};
  \draw (6.0,3.6) rectangle (10.0,4.4);
  \draw (6.0,3.6) rectangle (6.7,4.4);
  \node[font=\scriptsize] at (6.35,4.0) {$R$};
  \node[font=\footnotesize] at (8.35,4.0) {$G-1$ lower bits};
  \draw[dashed] (6.0,5.5) -- (6.0,3.5);
  \node[font=\scriptsize,anchor=south east] at (5.9,4.6) {LSB weight $2^{\ell}$};
  \node[font=\scriptsize,anchor=south west] at (6.1,4.6) {round bit, $2^{\ell-1}$};
  \node[font=\scriptsize,anchor=south] at (6.0,5.55) {rounding point};

  % ---- sticky OR tree ----
  \draw (8.3,3.6) -- (8.3,2.9);
  \draw (6.6,2.9) rectangle (10.4,2.3);
  \node[font=\scriptsize] at (8.5,2.6) {sticky $=$ OR of $G-1$ bits};

  % ---- inc = R and (S or L) ----
  \node[or port] (og) at (8.3,1.5) {};
  \node[and port] (ag) at (11.0,0.7) {};
  \draw (7.2,2.3) |- (og.in 1);
  \node[font=\scriptsize,anchor=east] at (7.1,2.2) {$S$};
  \draw (5.6,3.6) |- (og.in 2);
  \node[font=\scriptsize,anchor=south east] at (5.55,1.4) {$L$};
  \draw (og.out) -- (9.9,1.5) -- (9.9,0.85) -- (ag.in 1);
  \draw (6.35,3.6) -- (6.35,0.4) -| (ag.in 2);
  \draw[->] (ag.out) -- (12.3,0.7) -- (12.3,-1.6) -- (9.0,-1.6);
  \node[font=\scriptsize,anchor=south east] at (11.8,-1.55) {$\mathrm{inc}$};

  % ---- incrementer ----
  \draw (0.6,-2.0) rectangle (9.0,-1.2);
  \node[font=\footnotesize] at (4.8,-1.6) {incrementer  $q+\mathrm{inc}$, carry-out kept};
  \draw[->] (2.5,3.6) -- (2.5,-1.2);
  \node[font=\scriptsize,anchor=west] at (2.55,1.0) {$W$};
  \draw[->] (4.8,-2.0) -- (4.8,-2.9);
  \node[font=\footnotesize,anchor=north] at (4.8,-2.95)
    {$\lfloor Y\rceil^{\text{even}}_{\ell}$ --- $W+1$ bits};
\end{circuitikz}
\end{document}
```

**Isolate the only case where a tie rule is free to choose.** Rounding to the nearest multiple of $2^{\ell}$ is uniquely determined everywhere except at the *ties*, the values exactly halfway between two representable numbers, where both neighbours are at distance $\tfrac12\,\mathrm{ulp}$ — see [[Error Accuracy]] for the ulp and the half-ulp bound. Write the exact $(W+G)$-bit input as $Y = q\,2^{\ell} + r$ with the kept part $q$ on $W$ bits and $0 \le r < 2^{\ell}$ carried in the $G \ge 1$ discarded bits. Split $r$ once more at the halfway weight: $r = R\,2^{\ell-1} + r'$ with $R$ the single **round bit** of weight $2^{\ell-1}$ and $0 \le r' < 2^{\ell-1}$ the $G-1$ bits below it. Then $r < 2^{\ell-1} \iff \lnot R$, and $r > 2^{\ell-1} \iff R \wedge (r' \neq 0)$, so the entire $(G-1)$-bit field $r'$ enters the decision only through the one-bit predicate

$$S \;=\; \bigvee_{i=0}^{G-2} r'_i \qquad\text{(the sticky bit)}$$

by associativity and idempotence of OR. A tie is exactly $R \wedge \lnot S$: the round bit set and nothing below it.

**Make "even" a one-bit test, then read the increment off it.** The two candidate results are $q$ and $q+1$, and their LSBs are $L$ and $\lnot L$ where $L$ is the LSB of $q$ — consecutive integers have opposite parity, so exactly one of the two neighbours is even, and "pick the even one" is always well defined. In a tie, that neighbour is $q$ when $L=0$ and $q+1$ when $L=1$, i.e. **increment iff $L$**. Combining the three cases — round down when $\lnot R$, round up when $R \wedge S$, and in the tie $R \wedge \lnot S$ increment iff $L$ — and factoring $R$ out by distributivity of $\wedge$ over $\vee$:

$$\mathrm{inc} \;=\; (R \wedge S) \vee (R \wedge \lnot S \wedge L) \;=\; R \wedge \big(S \vee (\lnot S \wedge L)\big) \;=\; R \wedge (S \vee L)$$

the last step by absorption, $S \vee (\lnot S \wedge L) = S \vee L$. Three one-bit signals, two gates: that is the whole tie handling, and it is why the added logic is not where the cost lives.

**The cost is the sticky bit, and it is a cost ties-up does not pay at all.** [[Round-to-Nearest Ties-Up]] adds the constant $2^{\ell-1}$ to $Y$ and truncates, which needs no knowledge of $r'$ whatsoever — its correction is *data-independent*, so the constant can be injected into a bit heap column or an unused carry-in far upstream and the rounding becomes literally free. Ties-to-even's correction depends on $R$, $S$ and $L$, all of which are outputs of the datapath, so it cannot be pre-injected: the lower $G-1$ bits must actually exist and be reduced. In a fixed-point site where the discarded field is a static slice of a product or a fully compressed heap, that reduction is a $(G-1)$-input OR tree of depth $\lceil \log_k(G-1)\rceil$ for $k$-input gates, and its inputs are the *low* bits, which settle first — the book notes for the floating-point multiplier that "as these bits arrive first, the sticky computation does not add to the critical path" (p. 345).

**In floating point the same OR tree is the dominant overhead, because the bits it must see come out of a shifter.** In a [[Floating-Point Operators|floating-point adder]] the discarded bits are produced by the alignment [[Shifters|shifter]], and a baseline adder only needs a *quasi*-barrel shifter that may drop bits entirely. Supporting ties-to-even forces either a full shifter followed by a wide OR, or a shifter with the sticky reduction folded into its stages; the first sticky is then updated again after the normalisation shift. The book's verdict on the whole upgrade from a ties-away baseline: "This adds a handful of gates to the rounding adder block: the bulk of the overhead is in the sticky computation" (§11.1.3, p. 339). That is the sentence to remember — the tie logic is two gates, the sticky is a shifter redesign.

**The real reason IEEE 754 chose this rule is that the hardware is already there.** The statistical argument — unbiasedness over long accumulations — is the one usually quoted, but the book gives the architectural one: directed rounding modes (toward $\pm\infty$, toward zero) *cannot* be implemented without knowing whether the discarded bits are all zero, since $1.101\,0001$ must round up to $1.110$ while $1.101\,0000$ must stay at $1.101$. An IEEE-compliant unit therefore contains a sticky computation whatever its default mode, and "the ties-to-even rule for round to nearest was chosen as a good use of this hardware" (p. 336). In an application-specific operator that supports no directed mode, that argument evaporates and ties-up wins by default — which is precisely the stance this book takes for fixed point.

**Unbiasedness, stated as something checkable rather than folklore.** For both nearest modes the error lies in $[-u/2, +u/2]$ with $u = 2^{\ell}$, and both attain the bound at ties, so the *worst case* is identical. They differ only in the mean. Ties-up always adds $+u/2$ at a tie, giving mean error $\tfrac{u}{2}\Pr[\text{tie}]$; ties-to-even adds $+u/2$ when $L=1$ and $-u/2$ when $L=0$, so if $L$ is uniform and independent of the tie event the two cancel exactly and the mean error is $0$. Over $N$ chained roundings the bounds grow the same way, $N u/2$, but the *expected* drift is $N\tfrac{u}{2}\Pr[\text{tie}]$ versus $0$ — the same distinction that separates truncation from rounding at one order of magnitude higher.

**Symmetry about zero is exact, not statistical.** Negation maps the neighbour pair $\{q,\,q+1\}$ of $Y$ to the neighbour pair $\{-q-1,\,-q\}$ of $-Y$, and $n$ is even iff $-n$ is even, so the even neighbour of $-Y$ is the negation of the even neighbour of $Y$: $\lfloor -Y \rceil^{\text{even}}_{\ell} = -\lfloor Y \rceil^{\text{even}}_{\ell}$. The rule commutes with negation regardless of the representation, which is why $-1.5 \to -2$ and $1.5 \to 2$. Ties-up in two's complement breaks this at every tie: $\lfloor -1.5 + 0.5 \rfloor = -1$, so $-1.5 \to -1$ while $1.5 \to 2$ (p. 70). If your datapath computes $f(-X) = -f(X)$ and you want the hardware to preserve that identity bit for bit, this is the only nearest mode that does it.

> [!warning] The book conflates ties-up with IEEE roundTiesToAway
> Footnote 2 on p. 69 says the cheaper "ties up" rule of Eq. (3.1) "was added in the 2008 revision of the IEEE 754 standard. It is called *round to nearest, ties to away (from zero)*." These are not the same mode on a two's-complement datapath, and the book itself supplies the counterexample two paragraphs earlier: Eq. (3.1) gives $\lfloor -1.5 + 0.5 \rfloor = -1$, whereas `roundTiesToAway` must return $-2$. They coincide only on non-negative values, or in a sign-magnitude format where adding the half-ulp to the *magnitude* is what the hardware does. Eq. (3.1) in two's complement is ties-toward-$+\infty$.

$$\boxed{\;\lfloor Y \rceil^{\text{even}}_{\ell} \;=\; \big(q + \mathrm{inc}\big)2^{\ell},\qquad \mathrm{inc} \;=\; R \wedge (S \vee L)\;}$$

Equivalently, as an add-then-mask: $\lfloor Y + 2^{\ell-1} \rfloor_{\ell} = q + R$, and forcing the LSB of that sum to $0$ whenever $R \wedge \lnot S$ yields $q$ when $L=0$ and leaves $q+1$ when $L=1$ — the same function. That form is the one to reach for when the half-ulp is already free upstream, since it reuses [[Round-to-Nearest Ties-Up]] plus one AND per LSB.

**When it breaks.**

- **No sticky, no ties-to-even.** If the low columns were never computed — a truncated multiplier, a bit heap whose bottom rows were dropped, an approximated datapath — $S$ is unknowable and the mode is unimplementable at that site. Ties-up still works there, because its correction is a constant.
- **Any approximation upstream destroys the point.** The tie test interrogates the *computed* value, not $f(X)$. As soon as $\delta_{\text{approx}} \neq 0$ the half-ulp budget is already spent (see [[Faithful Operator]]), and paying for exact tie handling on a value that is itself wrong buys nothing. Ties-to-even earns its cost only where the pre-rounding value is exact: $+,-,\times,\div,\sqrt{\;}$.
- **Ties may be impossible.** For $f(X) = \pi X$ no product is ever a tie, since every tie is rational and no $\pi X$ is; the tie path is then dead logic. Check before paying — the same check the book runs before adding sticky computation to a floating-point multiplier.
- **Unbiasedness assumes $L$ is uniform.** If the kept LSB is correlated with the tie event — a datapath whose $q$ is always even because of a preceding shift or a fixed multiplication by 2 — every tie rounds *down* and ties-to-even becomes as biased as truncation, in the other direction.
- **Rounding twice is not rounding once.** With $\ell_1 = 2$ then $\ell_2 = 3$: $Y = 21 \to 20$ (round bit 0, so down), then $20 \to 16$ (a tie, $q = 2$ even). Rounding $21$ directly to a multiple of $8$ gives $24$. Error $5$ instead of $3$; the double rounding is not even faithful in this ulp. Round once, at the final format.
- **The increment can overflow.** $q$ all ones and $\mathrm{inc}=1$ carries out of the kept field, so the output is $W+1$ bits unless the input range provably excludes it. In floating point this is the significand overflow that bumps the exponent.
- **Latency, when the discarded bits arrive last.** The OR tree is off the critical path only when its inputs settle early. Behind a variable shifter they do not, and the sticky becomes the critical path itself.

**RTL (Spade).**

```spade
/// Round-to-nearest, ties-to-even.
/// `q` is the kept part (LSB weight 2^l), `d` the G >= 1 discarded bits:
/// d.msb() is the round bit of weight 2^(l-1), everything below it the sticky.
fn rne<#uint W, #uint G>(q: uint<W>, d: uint<G>) -> uint<{W + 1}> {
    let r = d.msb();            // round bit
    let s = (d <<. 1) != 0;     // sticky: any discarded bit below the round bit
    let l = q.lsb();            // LSB of the kept part
    let inc: uint<W> = zext((r && (s || l)).as_uint());
    q + inc
}
```

`q` is the upper field of the drawing and `d` the lower one; the diagram's $R$, $S$, $L$ are `r`, `s`, `l`, all one bit. The sticky is written as a truncating shift compared against zero — `d <<. 1` discards the round bit and keeps the $G-1$ bits below it, so `!= 0` is exactly the drawn OR tree, and synthesis will emit the tree rather than a shifter. `q + inc` widens to $W+1$ by Spade's `+` rule, which is the drawn carry-out; nothing here is registered, so a real rounder either sits behind a pipeline register or is merged into the final adder that produced `q`.

Verified by monomorphising through `entity rne8(q: uint<8>, d: uint<8>) -> uint<9> { rne::<8, 8>(q, d) }` and simulating that wrapper: 3521 vectors, all passing — 9 named (both tie parities, both sides of the tie, the asymmetric $1 + \tfrac{255}{256}$ and $128 + \tfrac{1}{256}$, and the top-of-range tie that carries out into bit 8), 3000 random against a behavioural reference, and an exhaustive sweep of all 256 discarded patterns for both parities of `q`.

**Related Notes.**

- [[Round-to-Nearest Ties-Up]] – compares: identical half-ulp bound and a data-independent correction, which is why it is the default in application-specific fixed point.
- [[Truncation Unit]] – compares: the free mode this one is two gates and an OR tree more expensive than, at half the error bound.
- [[Directed Rounding Unit]] – depends-on: needs the same sticky bit, and it is that shared hardware that motivated the tie rule in the first place.
- [[Half-Unit Biased Format]] – counter-example: reaches a half-ulp bound with *no* rounding hardware at all, by moving the half-ulp into the format.
- [[Choosing a Rounding Mode]] – compares: where this sits against every sibling in one table.
- [[Faithful Operator]] – depends-on: explains why exact tie handling is wasted on a datapath that already carries an approximation error.
- [[Floating-Point Formats]] – supports: the format whose standard makes this the default rounding.
- [[Floating-Point Operators]] – extends: where the sticky bit stops being cheap, and what the shifter has to become.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

| § | Topic | Printed pages |
| --- | --- | --- |
| 3.1.3 | rounding to the nearest, ties, the ties-to-even definition and its cost; footnote 2 on the 2008 revision | 68–70 |
| 3.1.4 | truncation versus rounding to the nearest; symmetry about zero | 70 |
| 11.1.3 | upgrading the baseline floating-point adder to ties-to-even: full shifter, wide OR, tie detection in the rounding adder | 339 |
| 11.1.3 (sidebar) | "Origin of the *ties to even* rule" — the sticky bit is already required by the directed modes | 336 |
| 11.2.2 | ties-to-even in the floating-point multiplier: an OR tree on the low bits of $P$, off the critical path | 345 |
| 10.1.5 | barrel shifter with early sticky-bit computation | 314 |
