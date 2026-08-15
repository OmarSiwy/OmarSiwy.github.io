---
title: Saturated Normalizer
description: "An LZC-plus-shifter whose left shift saturates at the constant exponent E_C instead of w_F — one log factor shallower than a generic subnormal normalizer."
kind: circuit
source: "ASA §15.1.6, pp. 462-464"
status: seed
spade: simulated
tags: [digital, floating-point, normalizer, subnormal, shifter, lzc, fpga]
aliases:
  - Saturating Normalizer
  - Saturated Normalizers
  - Capped Normalizer
---

# Saturated Normalizer

A leading-zero counter and left shifter placed on the input significand of a floating-point constant multiplier, whose shift distance is clipped to the constant's exponent $E_C$ rather than run out to $w_F$ — which makes it the only normalizer whose depth is set by the *constant* and not by the format.

```tikz title="Saturated normalizer: the LZC sees only the top E_C+1 bits, and the shifter is sized by E_C, not w_F"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=stealth,
  blk/.style={draw,thick,align=center,inner sep=3pt},
  bus/.style={->,thick}]

% ---- input significand vector, MSB on the left ----
\fill[black!12] (1.5,6.0) rectangle (3.0,6.6);
\draw[thick] (1.5,6.0) rectangle (8.4,6.6);
\draw[thick] (3.0,6.0) -- (3.0,6.6);
\node at (5.7,6.3) {\tiny remaining $w_F-E_C$ bits, never inspected};
\node[anchor=east] at (1.4,6.3) {$n_X\!+\!F_X$};
\draw[|<->|] (1.5,6.9) -- node[above,font=\tiny]{$w_F{+}1$ bits, MSB left} (8.4,6.9);
\node at (2.25,6.3) {\tiny top $E_C{+}1$};

% ---- tap into the capped leading-zero counter ----
\draw[bus] (2.25,6.0) -- (2.25,5.1);
\node[blk] at (2.25,4.7) {saturating LZC\\[-1pt]{\tiny priority encoder, $E_C{+}1$ inputs}};
\node[anchor=west,font=\tiny] at (4.3,4.9) {all-zero window $\Rightarrow \lambda'{=}E_C$};

% ---- full vector down the right into the shifter ----
\draw[thick] (7.6,6.0) -- (7.6,3.35);
\draw[bus] (7.6,3.35) -- (7.6,3.25);
\node[anchor=west,font=\tiny] at (7.7,4.7) {$w_F{+}1$};

% ---- lambda' bus ----
\draw[thick] (2.25,4.3) -- (2.25,3.25);
\draw[bus] (2.25,3.3) -- (2.25,3.25);
\node[anchor=west,font=\tiny] at (2.35,3.75) {$\lambda'=\min(\lambda,E_C)$, $\lceil\log_2(E_C{+}1)\rceil$ bits};

% ---- the shifter ----
\node[blk,minimum width=6.6cm,minimum height=0.8cm] at (4.95,2.85)
  {left barrel shifter --- $\lceil\log_2(E_C{+}1)\rceil$ mux stages, not $\lceil\log_2(w_F{+}1)\rceil$};

% ---- outputs ----
\draw[bus] (6.6,2.45) -- (6.6,1.35);
\node[anchor=west,font=\tiny] at (6.7,1.9) {$M'=(n_X{+}F_X)\!\ll\!\lambda'$, $w_F{+}1$};
\node[blk,minimum width=3.4cm,minimum height=0.75cm] at (6.6,0.95)
  {significand multiplier by $1{+}F_C$};

\node[circ] at (2.25,3.6) {};
\draw[thick] (2.25,3.6) -- (0.1,3.6);
\draw[thick] (0.1,3.6) -- (0.1,1.35);
\draw[bus] (0.1,1.45) -- (0.1,1.35);
\node[blk,minimum width=3.0cm,minimum height=0.75cm] at (0.1,0.95)
  {exponent adder: $+\,(E_C-\lambda')$};

\end{circuitikz}
\end{document}
```

*Own construction; it expands the `saturated normalizer` block of Fig. 15.6, p. 463, and shows the two consumers it feeds there.*

**Fix what the block is handed.** A multiplier by a compile-time constant $C=2^{E_C}(1+F_C)$ with $C>1$, hence $E_C\ge 0$, receives an unpacked input as two fields: the "is normal" bit $n_X$ (1 bit, zero exactly when the biased exponent field is all-zero) and the fraction $F_X$ ($w_F$ bits). Concatenated MSB-first they form one $(w_F{+}1)$-bit vector $n_X+F_X$ read as a fixed-point value in $[0,2)$ — $\mathrm{ufix}(0,-w_F)$ in the notation of [[Number Formats]]. Let $\lambda$ be its leading-zero count, so $\lambda=0$ for every normal input and $\lambda>0$ for every subnormal one. The architecture downstream of this block was designed for normals only; the block's job is to make subnormals acceptable to it, or to make them harmlessly skippable.

**Split the subnormal input space at $\lambda=E_C$, because that is where the outcome changes.** With $C>1$ no normal input can produce a subnormal output, so the only question is what a subnormal input becomes. Two regimes, and the boundary is exactly the constant's exponent:

- **$0\le\lambda\le E_C$: the output is normal.** Rewrite the input as $0+F_X = 2^{-\lambda}(1+F'_X)$, which is legitimate because $\lambda$ leading zeros mean the value lies in $[2^{-\lambda},2^{-\lambda+1})$, so dividing by $2^{-\lambda}$ lands it in $[1,2)$. That $1+F'_X$ is a *bona fide* normal significand, and feeding it to the unmodified architecture works provided the exponent path adds $E_C-\lambda$ instead of $E_C$ — the shift already consumed $\lambda$ of the constant's scaling.
- **$\lambda>E_C$: the output stays subnormal.** Multiplying by $2^{E_C}$ is a left shift by $E_C$ that still fails to normalize, so hand $0+2^{E_C}F_X$ straight to the significand multiplier and skip renormalization entirely.

**Prove that the second regime needs no post-normalization, since that is what makes it free.** From $\lambda$ leading zeros, $n_X+F_X<2^{1-\lambda}$. Shifting left by $E_C$ gives $2^{E_C}(n_X+F_X)<2^{E_C+1-\lambda}\le 2^0=1$, using $\lambda\ge E_C+1$ in the exponent. The constant significand satisfies $1+F_C<2$ by the definition of a normalized float, so by multiplicativity of the bound the product is below $2$ — the post-normalization multiplexer that a generic multiplier needs here is provably dead logic, and the constant multiplier's own bit heap absorbs the rounding.

**Handle the one boundary the bound leaves open.** At $\lambda=E_C+1$ the same inequality is tight from below: $2^{E_C}(n_X+F_X)\in[2^{-1},1)$, and multiplying by $(1+F_C)\in(1,2)$ can push the product above $1$. A subnormal input has therefore produced a normal output, and the exponent field — which the saturating path leaves at its all-zero subnormal encoding — must be incremented. That is one extra bit into the exponent adder, not a second shifter, and it is the reason the diagram's `+1` and the `product normal?` test in Fig. 15.6 fan into the same OR.

**Merge the two regimes into one block, which is the whole point.** Both cases are "shift left by $\lambda$, but never further than $E_C$":

- $\lambda\le E_C$ wants a shift of $\lambda$;
- $\lambda>E_C$ wants a shift of $E_C$;

and $\min$ is exactly the function that agrees with both. The emitted shift amount is $\lambda'=\min(\lambda,E_C)$ on $\lceil\log_2(E_C{+}1)\rceil$ bits, the shifted significand $M'=(n_X+F_X)\ll\lambda'$ is $w_F+1$ bits wide (the left shift discards only zeros, so no width growth), and for a normal input $\lambda=0$ forces $\lambda'=0$ and the block is a wire.

> [!warning] Source misprint — the book prints $\max$ where $\min$ is required
> ASA p. 462 states $\lambda'=\max(\lambda,E_C)$, then in the next sentence says the normalizer "does nothing ($\lambda'=0$) for normal inputs". Those are inconsistent: a normal input has $\lambda=0$, and $\max(0,E_C)=E_C\ne 0$ for any $C\ge 2$. The surrounding prose — saturation *to* $E_C$, a shift of "at most $E_C$ bits" — is only satisfied by the saturating minimum, so read $\lambda'=\min(\lambda,E_C)$ throughout.

**Locate the saving: it is in the shift range, not the block count.** The generic subnormal normalizer of a floating-point multiplier ([[Normalizers]]) must be able to shift a $(w_F{+}1)$-bit significand left by anything up to $w_F$, so its [[Leading Zero Counters|leading zero counter]] is a priority encoder over all $w_F+1$ bits and its [[Barrel Shifters|barrel shifter]] is $\lceil\log_2(w_F{+}1)\rceil$ multiplexer stages deep. Saturating at $E_C$ shrinks *both*. The LZC never has to look past bit $w_F-E_C$: if the top $E_C+1$ bits are all zero the answer is $E_C$ regardless of everything below, so the priority encoder has $E_C+1$ inputs and depth $\lceil\log_2(E_C{+}1)\rceil$. The shifter loses stages by the same count. For binary32 ($w_F=23$) a full normalizer is a 5-stage shifter fed by a 24-input LZC; for $C=3$ or $C=\pi$, where $E_C=1$, it is a single 2:1 multiplexer row fed by one bit. The book's phrasing is that "for many practical constants $E_C$ will be much smaller than $w_F$" (p. 463) — that inequality is the entire subnormal optimization, and it is available only because $C$ is known at synthesis time.

**Read the FPGA consequence off the stage count, because it is the part that maps unevenly.** A barrel-shifter stage is one 2:1 multiplexer per bit, which is one LUT per bit on any 4-LUT-or-wider fabric, so the shifter's LUT cost is linear in the stage count and dropping from $\lceil\log_2(w_F{+}1)\rceil$ to $\lceil\log_2(E_C{+}1)\rceil$ stages is a proportional area cut as well as a delay cut ([[FPGAs]]). On an ASIC the same reduction buys mostly delay, since a shifter's transistor count is dominated by the wiring of the wide stages that a small $E_C$ never instantiates. Either way the block remains *on* the critical path — the book is explicit that "this normalizer adds to the critical path" (p. 463) — so this is a shortening, not a deletion, and it does not reach the class of savings that removing the close path of an adder achieves.

$$\boxed{\ \lambda'=\min(\lambda,E_C),\qquad M'=(n_X+F_X)\ll\lambda',\qquad \text{depth }\lceil\log_2(E_C{+}1)\rceil\ \text{ instead of }\ \lceil\log_2(w_F{+}1)\rceil\ }$$

**When it breaks.**

- **$E_C\ge w_F$.** $\min(\lambda,E_C)=\lambda$ for every reachable $\lambda$, the saturation never fires, and the block degenerates into the generic normalizer it was supposed to beat. Constants that large are rare but legal, and the synthesis script must not assume the saving exists.
- **$E_C=0$**, i.e. $C\in[1,2)$. Then $\lambda'\equiv 0$ and the block vanishes entirely; every subnormal input takes the saturating path unshifted, and only the $\lambda=1$ exponent-increment wrinkle survives as a single gate.
- **$C<1$, so $E_C<0$.** The premise inverts: subnormal inputs are never renormalized, but *normal* inputs can now produce subnormal outputs. The repair is a **right** shift by $\lambda=e_{\min}-E_R$ applied *after* the multiplier, and it cannot be hoisted in front of it because no shifted-out bit may be discarded. That forces rounding after normalization and gives up the merged-rounding trick this architecture is built on. Nothing in this note transfers except the observation that the shift distance is still bounded by $|E_C|$.
- **Zeros and exceptions.** An all-zero significand saturates to $\lambda'=E_C$ and shifts zero — arithmetically harmless, but only because unpack has already flagged the operand; the block itself has no notion of an exceptional input and must never be the thing that decides one.

> [!warning] Not covered in the source — needs outside research
> ASA declines to give the $C<1$ subnormal architecture: "We do not detail the architecture here" (p. 464). Only the two savings are stated — the constant significand multiplier survives, and the shift distance is limited to $|E_C|$ when $|E_C|<w_F$. The block diagram, the placement of rounding, and the sharing of the shifter with the input-subnormal path are left to the reader.

**RTL (Spade).**

```spade
// Leading-zero count of x, saturated at CAP: returns min(clz(x), CAP) on R bits.
// The recursion unrolls at compile time, so only CAP stages of logic exist —
// the low w_F - E_C bits of x are never examined.
fn clz_sat<#uint W, #uint CAP, #uint R>(x: uint<W>) -> uint<R> {
    gen if CAP == 0 {
        0
    } else {
        if x.msb() {
            0
        } else {
            let deeper: uint<R> = clz_sat::<W, {CAP - 1}, R>(x << 1);
            trunc(deeper + 1)
        }
    }
}

entity saturated_normalizer<#uint W, #uint CAP, #uint R>(m: uint<W>) -> (uint<W>, uint<R>) {
    let lam: uint<R> = clz_sat::<W, CAP, R>(m);
    (m << zext::<R, W>(lam), lam)
}
```

`m` is the $(w_F{+}1)$-bit vector $n_X+F_X$ with $n_X$ in `msb()`; `W = w_F + 1`, `CAP = E_C`, and `R = ` $\lceil\log_2(E_C{+}1)\rceil$ is passed explicitly because Spade cannot compute a ceiling-log in a return-type position. `lam` is $\lambda'$ and the tuple's first element is $M'$; the left shift is Spade's non-widening `<<`, which is correct here precisely because the discarded bits are the leading zeros the count just proved were there. The whole block is combinational — no `reg`, no `clock` — and it belongs in the same stage as the `product normal?` comparator it runs beside. What synthesis does differently from the drawing: the recursion emits a chain of `CAP` one-bit shift-or-pass stages, not the logarithmic barrel shifter the diagram shows, so for anything but a tiny $E_C$ a retiming or restructuring pass is what recovers the $\lceil\log_2(E_C{+}1)\rceil$ depth. Verified by compiling with a concrete `satnorm24` wrapper instantiating `<24, 4, 3>` and simulating 6009 vectors — nine named (including $\lambda=0$, $\lambda=E_C$ exactly, $\lambda=E_C{+}1$, the all-ones-free `24'h000001` that saturates from $\lambda=23$, and all-zero) plus two 3000-vector random sweeps, one uniform and one biased into the saturating region — against a behavioural capped-LZC reference.

**Related Notes**

- [[Normalizers]] – extends: the general LZC-plus-shifter this narrows; every structural element here is that block with its shift range clipped from $w_F$ to $E_C$.
- [[Leading Zero Counters]] – depends-on: supplies $\lambda$, but only over an $(E_C{+}1)$-bit window, which is where the depth reduction actually lives.
- [[Barrel Shifters]] – depends-on: the left shifter whose stage count $\lceil\log_2(E_C{+}1)\rceil$ this note's bound sets.
- [[Constant Multiplier with Subnormal Support]] – supports: the operator this block is the front end of, and the only place $\lambda'$ and the $\lambda=E_C{+}1$ increment are consumed.
- [[Product Normalization Predictor]] – compares: the sibling trick that moves the *output* normalization decision off the critical path, where this one shortens the *input* normalization instead.
- [[Floating-Point Multiplier by a Power of Two]] – counter-example: with $F_C=0$ the product bound is exact, the $\lambda=E_C{+}1$ wrinkle disappears, and the significand multiplier goes with it.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §15.1.6 "Subnormal Handling", pp. 462-464 — the case split, the $\lambda>E_C$ product bound, the $\lambda=E_C{+}1$ increment, and the $\max$/$\min$ misprint on p. 462.
  - §15.1.6.1 "Case $C>1$", p. 462; §15.1.6.2 "Case $C<1$", pp. 463-464.
  - Fig. 15.6, p. 463 — correctly rounded constant floating-point multiplier with subnormal management, $C>1$; the source of the block's two consumers.
