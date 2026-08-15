---
title: Trailing Zero Counter
description: "Monotone thermometer chain of two-input ANDs whose population count is the trailing-zero count; linear in word size instead of the quadratic naive wide-AND encoding, and the objective row for coefficient-wordlength minimization."
kind: circuit
source: "ASA §B.3.5, p. 794"
status: seed
spade: simulated
tags: [digital, ilp-for-arithmetic-design, zero-counting, popcount, prefix, normalization]
aliases:
  - TZC
  - Trailing Zero Count
  - Trailing Zero Counters
  - Count Trailing Zeros
  - ctz
---

# Trailing Zero Counter

A trailing-zero counter reports how many low-order bits of a word are zero, and the one structural fact that defines it is that the intermediate "all bits up to $k$ are zero" predicates form a *monotone* thermometer code, which collapses the counter from a stack of wide ANDs into a single two-input AND chain plus a population count.

```tikz title="Monotone AND chain producing a thermometer code, summed by a population count"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---- monotone AND chain: mu_k = mu_{k-1} AND (NOT c_{l+k}) ----
\node[and port, scale=0.6] (a0) at (0.0,0) {};
\node[and port, scale=0.6] (a1) at (2.0,0) {};
\node[and port, scale=0.6] (a2) at (4.0,0) {};
\node[and port, scale=0.6] (a3) at (7.0,0) {};
\node[font=\small] at (5.5,0) {$\cdots$};

% tap points on the chain
\coordinate (m0) at (0.65,0);
\coordinate (m1) at (2.65,0);
\coordinate (m2) at (4.65,0);
\coordinate (m3) at (7.65,0);

\draw (a0.out) -- (m0);  \draw (m0) |- (a1.in 1);
\draw (a1.out) -- (m1);  \draw (m1) |- (a2.in 1);
\draw (a2.out) -- (m2);  \draw (m2) -- (5.2,0);
\draw (5.8,0) |- (a3.in 1);
\draw (a3.out) -- (m3);
\node[circ,scale=0.5] at (m0) {}; \node[circ,scale=0.5] at (m1) {};
\node[circ,scale=0.5] at (m2) {};

% constant 1 seeding the chain
\draw (a0.in 1) -- ++(-0.8,0) node[left,font=\tiny] {$1$};

% inverted coefficient bits entering from below
\node[ocirc, scale=0.6] at (a0.in 2) {};
\node[ocirc, scale=0.6] at (a1.in 2) {};
\node[ocirc, scale=0.6] at (a2.in 2) {};
\node[ocirc, scale=0.6] at (a3.in 2) {};
\draw (-0.7,-1.4) node[below,font=\tiny] {$c_\ell$}       |- (a0.in 2);
\draw ( 1.3,-1.4) node[below,font=\tiny] {$c_{\ell+1}$}   |- (a1.in 2);
\draw ( 3.3,-1.4) node[below,font=\tiny] {$c_{\ell+2}$}   |- (a2.in 2);
\draw ( 6.3,-1.4) node[below,font=\tiny] {$c_{\ell+W-1}$} |- (a3.in 2);
\node[font=\tiny,anchor=west] at (-1.9,-2.15) {coefficient word $c$: $W$ bits, LSB on the left};

% ---- thermometer code rising into the population count ----
\node[draw,minimum width=9.4cm,minimum height=0.75cm] (pc) at (3.4,2.6)
  {population count (adder tree), $W$ one-bit inputs};
\draw (m0) -- (m0 |- pc.south);
\draw (m1) -- (m1 |- pc.south);
\draw (m2) -- (m2 |- pc.south);
\draw (m3) -- (m3 |- pc.south);
\node[font=\tiny,anchor=west] at (0.8,1.35) {$\mu_0$};
\node[font=\tiny,anchor=west] at (2.8,1.35) {$\mu_1$};
\node[font=\tiny,anchor=west] at (4.8,1.35) {$\mu_2$};
\node[font=\tiny,anchor=west] at (7.8,1.35) {$\mu_{W-1}$};
\node[font=\tiny,anchor=east,align=right] at (-0.15,1.75) {thermometer\\ code, $W$ bits};

% ---- result ----
\draw (pc.east) -- ++(0.7,0) node[right,font=\tiny] {$t$, $\lceil\log_2(W{+}1)\rceil$ bits};
\end{circuitikz}
\end{document}
```

**Fix what the operator is asked to produce.** The input is a word written in the fixed-point convention of [[Number Formats]],

$$C=\sum_{i=\ell}^{m}2^{i}c_i,\qquad c_i\in\{0,1\},$$

so the significant bit vector is $W=m-\ell+1$ bits wide with $c_\ell$ the LSB. The output $t$ is the index of the lowest set bit, an unsigned integer in $[0,W]$ and therefore $\lceil\log_2(W+1)\rceil$ bits wide — one bit wider than a naive $\log_2 W$ because the all-zero word must be representable. The whole operator is combinational; nothing here is clocked.

**Build the predicate the count is actually made of.** Define $\mu_k=1$ exactly when the $k+1$ lowest bits are all zero:

$$\mu_k=1 \iff c_\ell=c_{\ell+1}=\dots=c_{\ell+k}=0,\qquad k=0,\dots,W-1 .$$

The vector $\mu$ is a *thermometer code*: it is a run of ones followed by a run of zeros, because zeroing a longer prefix is a strictly stronger condition. Its length is exactly the number of trailing zeros, so the count is a plain sum, $t=\sum_{k=0}^{W-1}\mu_k$ — no priority encoder, no comparison tree, just a population count. That reduction is the whole trick: the *positional* question "where is the lowest one" has been turned into the *cardinal* question "how many predicates hold", and cardinality is cheap.

**Reject the direct encoding on cost grounds.** Read the definition literally and $\mu_k$ is a $(k+1)$-input AND of complemented bits, $\mu_k=\bigwedge_{j=0}^{k}\overline{c_{\ell+j}}$. Instantiating one such gate per $k$ costs $\sum_{k=0}^{W-1}(k+1)=\tfrac{W(W+1)}{2}$ literals — quadratic in the word size, and in the ILP form of the same encoding it is quadratically many rows as well. For a 32-bit coefficient that is 528 literals to compute 32 bits.

**Reassociate the conjunction and the cost collapses to linear.** Associativity of $\wedge$ lets the $(k+1)$-fold conjunction be split at its last term,

$$\mu_k=\Big(\bigwedge_{j=0}^{k-1}\overline{c_{\ell+j}}\Big)\wedge\overline{c_{\ell+k}}=\mu_{k-1}\wedge\overline{c_{\ell+k}},$$

and the parenthesised group is a subexpression that has already been built. Every $\mu_k$ is therefore a *two*-input AND: $W$ gates and $W$ inverters total, linear, with the base case handled by seeding the chain with the constant $\mu_{-1}=1$ so that $\mu_0=\overline{c_\ell}$ falls out of the same recurrence rather than being a special case in the RTL. Monotonicity is what makes this legal — $\mu_k\Rightarrow\mu_{k-1}$ — and it is the reason the shared prefix exists at all.

**Recognise the AND chain as a borrow chain, because that is how it maps.** The chain propagates a one exactly as long as the bits it passes are zero, which is precisely the borrow behaviour of a decrement. Applying the two's-complement identity $C-1=\overline{\overline{C}+1-1}$ in its practical form: subtracting one flips the trailing zeros to ones, flips the lowest set bit to zero, and leaves everything above untouched. Intersecting that with $\overline{C}$, which is one on every position where $C$ is zero, kills the high bits and leaves exactly the thermometer code:

$$\mu=\overline{C}\wedge(C-1)\pmod{2^W}.$$

This matters for [[FPGAs]] specifically: written that way the chain is a $W$-bit decrement, so the synthesiser puts it on the hard carry chain instead of on a $W$-deep string of fabric LUTs, and the depth advantage is large enough that it usually beats a prefix tree built out of general logic. On an ASIC the two forms are the same circuit and the explicit AND chain is the clearer source.

**Cut the linear depth only if the profile says to.** The recurrence $\mu_k=\mu_{k-1}\wedge\overline{c_{\ell+k}}$ is a prefix computation over an associative operator, structurally identical to the carry recurrence of a ripple-carry adder, so the same reassociation that produces a parallel-prefix adder applies here: a prefix-AND tree gives $O(\log W)$ depth at $O(W\log W)$ gates. The population count that follows is already $O(\log W)$ deep, so a linear chain is the only term that grows, and below roughly 16 bits — or on any FPGA where the chain is hardened — the tree buys nothing and costs area.

**Read the ILP incarnation off the same recurrence.** The application this comes from ([De+17]) minimises the *bit width* of fixed-point coefficients rather than their value, so $t$ has to appear inside a solver model, not a netlist. Each link is linearised with the standard convex hull of $z=x\wedge y$ (B.7–B.9, p. 790) at $x=\mu_{k-1}$, $y=1-c_{\ell+k}$:

$$\mu_k\le\mu_{k-1},\qquad \mu_k\le 1-c_{\ell+k},\qquad \mu_k\ge\mu_{k-1}-c_{\ell+k},$$

three rows and one binary per bit, $3K$ rows for a chain bounded at $K$ links, against $O(K^2)$ for the wide-AND encoding. The first row is worth naming separately: it is the implication gadget $x\to y\iff x\le y$ (B.32, p. 792), so the monotone chaining costs nothing beyond a row that would be present anyway, and each link's constraints are the exact convex hull of that link's feasible set. Since the ILP run time is dominated by the *number of variables* rather than rows (p. 795), the $K$-versus-$O(K^2)$ difference in binaries is the part that decides whether the model solves.

> [!note]
> The same chain run from the MSB end counts *leading* zeros, and the same objective row then measures how far a coefficient can be normalised — see [[Leading Zero Counters]]. Nothing about the derivation changes except the index direction.

> [!warning] Index direction in the source
> Equations (B.42)–(B.46) on printed p. 794 index the chain *downwards*, $\mu_\ell,\mu_{\ell-1},\dots,\mu_{\ell-k}$, over bits $c_\ell,c_{\ell-1},\dots$, while (B.41) on the same page defines $\ell$ as the *lowest* index of the sum. The two are inconsistent; bits below $c_\ell$ do not exist. This note re-indexes upwards, $\mu_k$ over $c_{\ell+k}$, which is what the text means.

$$\boxed{\ \mu_k=\mu_{k-1}\wedge\overline{c_{\ell+k}},\quad \mu_{-1}=1,\qquad t=\sum_{k=0}^{W-1}\mu_k=\operatorname{popcount}\!\big(\overline{C}\wedge(C-1)\big)\ }$$

**When it breaks.**

- **All-zero input.** Every $\mu_k$ is one and $t=W$, which is why the result needs $\lceil\log_2(W+1)\rceil$ bits. Any downstream consumer that treats $t$ as a shift amount must handle $t=W$ separately, since a $W$-bit shift by $W$ is undefined in most HDL semantics. Check whether the calling code wants a valid flag instead.
- **A truncated chain in the ILP model.** $K$ bounds the *expected* number of trailing zeros, not the possible number. If the solver finds a coefficient with more than $K$ trailing zeros the count saturates at $K$ and the objective silently under-rewards it. The model is still feasible and still returns an answer, which is the dangerous part — this failure has no infeasibility to trip over.
- **Fabric depth past ~16 bits.** The linear chain's $O(W)$ depth stops being free once it exceeds the delay of the population-count tree it feeds; that is the crossover where a prefix-AND tree pays. On an FPGA with a hard carry chain the crossover moves out far enough that it rarely arrives.
- **You wanted the mask, not the count.** Normalisers and lowest-set-bit isolators want the one-hot $C\wedge(-C)$ or the thermometer code itself, not its cardinality. Taking the population count and then re-decoding it into a shift amount throws away a signal you already had — see [[Shifters]].

**In Spade**, the chain and the population count, both generic in the word width:

```spade
/// mu[k] = 1 iff bits 0..k of the word are all zero. Element 0 is the LSB.
fn tz_chain<#uint W>(cin: bool, c: [bool; W]) -> [bool; W] {
    gen if W == 0 {
        []
    } else {
        let m: bool = cin && !c[0];
        let rest: [bool; {W - 1}] = tz_chain::<{W - 1}>(m, c[1..W]);
        [m].concat(rest)
    }
}

fn popcount<#uint N, #uint R>(x: [bool; N]) -> uint<R> {
    gen if N == 0 {
        0
    } else {
        let head: uint<R> = zext(x[0].as_uint());
        let tail: uint<R> = popcount::<{N - 1}, R>(x[1..N]);
        trunc(head + tail)
    }
}

fn tzc<#uint W, #uint R>(x: uint<W>) -> uint<R> {
    popcount::<W, R>(tz_chain::<W>(true, x.as_bits()))
}
```

`tz_chain` is the gate row of the diagram: `cin` is the constant `1` entering the leftmost AND, `!c[0]` is that gate's bubbled input, and `m` is $\mu_k$ leaving on the tap. `popcount` is the box above it; carrying the result width `R` as a separate const generic is what keeps the adder tree from widening at every level — the caller sets $R=\lceil\log_2(W+1)\rceil$, so an 8-bit word instantiates as `tzc::<8, 4>`. Both are `fn`, hence purely combinational, and the recursion is compile-time structure only — `gen if` unrolls it, nothing recurses at run time. Synthesis will not build the chain as drawn: given `~x & (x -. 1)`, which is the same function, it maps the decrement onto the carry chain, and that form was simulated against this one and agrees on all 256 8-bit inputs.

Simulated against a behavioural reference over 3263 vectors: seven named cases including the asymmetric mirror pair $x=\texttt{0000\_0001}\mapsto 0$ and $x=\texttt{1000\_0000}\mapsto 7$ that catches a reversed bit order, the all-zero word saturating to 8, an exhaustive sweep of all 256 8-bit inputs, and a 3000-vector random sweep. Zero mismatches, and the carry-chain form `~x & (x -. 1)` agrees with the explicit chain on all 256 inputs.

**Related notes.**

- [[Leading Zero Counters]] – compares: the identical chain read from the MSB end, and the sibling that actually drives normalisation.
- [[Shifters]] – supports: the consumer of $t$, and the reason you may want the thermometer code rather than its sum.
- [[Polynomial Approximation]] – depends-on: the coefficient set whose wordlength this counter's objective row is minimising.
- [[Minimal-Adder Adder Graph]] – compares: the other ILP model in this topic, where the objective counts adders instead of bits.
- [[ILP for Arithmetic Design]] – extends: the gadget catalogue this chain is assembled from.
- [[Number Formats]] – depends-on: the fixed-point convention that fixes $\ell$, $m$ and hence $W$.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Appendix B "Optimization Using Integer Linear Programming":

- §B.3.5 "Counting Leading and Trailing Zeroes", eqns (B.41)–(B.46), p. 794 — the thermometer definition, the sum form of the count, and the leading-zero remark.
- §B.3.2 "Translating Boolean Relations into Constraints", eqns (B.7)–(B.9), p. 790 — the convex hull of $z=x\wedge y$ instantiated once per chain link; (B.32), p. 792 — the implication gadget $x\to y\iff x\le y$.
- §B.3.4 "Splitting Integers into Their Binary Representation", eqn (B.35), p. 793 — the binary expansion (B.41) reuses.
- §B.4.1 "Run-Time", p. 795 — the number of variables, not constraints, dominating solve time.
- [De+17] De Caro, Napoli, Esposito, Castellano, Petra & Strollo, "Minimizing Coefficient Word Length…", cited on p. 794 — the coefficient-wordlength objective this encoding serves.
