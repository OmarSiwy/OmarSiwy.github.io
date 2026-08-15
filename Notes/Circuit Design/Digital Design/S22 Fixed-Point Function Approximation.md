---
title: "Fixed-Point Function Approximation"
description: "Map of the 11 Fixed-Point Function Approximation notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, fixed-point-function-approximation, hub]
aliases:
  - "Fixed-Point Function Approximation"
  - "4.1) Fixed-Point Function Approximation"
---

# Fixed-Point Function Approximation

One question, asked once here so that no note below has to restate it: *given $f$,
an input format, an output format and an accuracy target, build the cheapest
circuit whose output is within that target for **every** input.*

**Inputs.** $X$ on $w_X$ bits in one of exactly two formats — $\mathrm{ufix}(-1,\ell_X)$
for the domain $[0,1)$, or $\mathrm{sfix}(0,\ell_X)$ for $[-1,1)$ — so the interval
collapses to one Boolean, `signedIn`. A generator never takes $[a,b]$ as a parameter,
because $f$ is *itself* a parameter and any change of variable folds into it: you hand
it $\sin(\tfrac{\pi}{2}x)$ on $[0,1)$, never $\sin(x)$ on $[-\tfrac{\pi}{2},\tfrac{\pi}{2}]$,
and the $\pi$ costs nothing because it lives in the offline constant (p. 480).
**Outputs.** $\widetilde f(X)$ in $\mathrm{sfix}(m_\text{out},\ell_\text{out})$,
$w_R = m_\text{out}-\ell_\text{out}+1$ bits, ulp $u = 2^{\ell_\text{out}}$.
**Accuracy.** Either **faithful** — $|\widetilde f(X)-f(X)| < 1$ ulp, the usual
target — or **correctly rounded** at $\le\tfrac12$ ulp. Both are defined in
[[Error Accuracy]], both over the formats of [[Number Formats]].
**Optimised for.** Area first, latency second: every circuit here is combinational,
and the thing that explodes is memory.

Two structural facts make this topic behave unlike its software counterpart. First,
"for every input" is a **finite** statement — $2^{w_X}$ cases — so an accuracy claim
is decidable by exhaustive enumeration, which is why the source treats correct
rounding of elementary functions only up to about 24 bits (p. 488) where the whole
answer table can simply be checked offline. A `double` library facing $2^{64}$ inputs
must instead prove. Second, rounding is monotone, so a *correctly rounded*
implementation of a monotonic $f$ is monotonic for free; a *faithful* one need not be,
though the wobble is provably never more than one ulp (p. 485). Care about that only
when a downstream block does a binary search or a threshold comparison.

- [[Choosing a Function Approximation Method]] – the trade-off table: bits, LUTs and
  ASIC area for all 11, with the source's own measured numbers, plus the three
  separate decisions hiding behind "how do I evaluate $f$". Read it first if you are
  picking rather than learning.

### The baseline, and what it costs on each target

Plain tabulation has the lightest requirements of anything in Part 4 — $f$ merely has
to be defined and finite on the domain. Everything else wants derivatives. Its cost is
one formula, and the four notes below are that formula meeting four different fabrics.

- [[Function Table ROM]] – $B = 2^n m$ bits: exponential in the input width, only
  linear in the output width. Start here; every later technique in the vault is an
  attack on that exponent.
- [[LUT-Array Function Table]] – the FPGA reading: an $\alpha$-input LUT *is* a
  $2^\alpha\times1$ ROM, so cost quantizes in steps of $\alpha$. Read it for why a
  5-bit table costs exactly what a 6-bit one does.
- [[Synthesized Logic Table]] – hand the table to standard-cell synthesis as a Boolean
  function instead. Read it for the area model that is symmetric in inputs and
  outputs, and for the exponent $0.65 < 1$ that logic sharing genuinely buys.
- [[Hard ROM Macro]] – the transistor-level alternative, where stored bits are wiring
  to the rails. The counter-example: lowest cost per bit, and it still measured
  *larger*, because it forfeits the optimization above.

### Making the image fit the output format

Discretization creates one corner case that is a correctness bug rather than an
accuracy loss: an $f$ whose continuous supremum is $1$ can, *after rounding*, actually
attain $1$ at the top of the grid — which is not representable, and wraps silently to
zero. It touches a fraction $\approx\tfrac{2}{\pi}2^{\ell/2}$ of inputs, so it gets
*rarer* as precision grows, and it lives where random tests do not go. These four are
the fixes (p. 483), in increasing order of cleverness and decreasing order of cost.

- [[Output Format Widening]] – one more MSB. Exact, free in logic, and wastes half the
  output range. The honest baseline against which the other three are savings.
- [[Saturating Output Clamp]] – clamp to the largest representable value. The only fix
  that is actual hardware, and it doubles the error at the two rightmost inputs.
- [[Round-Down Table Fill]] – tabulate $\mathrm{RD}(f)$ so the top can never round up.
  Zero hardware; you pay a full ulp of budget everywhere for a bug at two addresses.
- [[Output Range Scaling]] – tabulate $(1-2^\ell)f$ instead. The generic answer, free
  because the factor is baked into the offline constant, at the price of being
  perfectly rounded with respect to the wrong function ($\approx 1.5$ ulp overall).

### Two functions that show what tabulation tolerates

- [[Tabulated Reciprocal]] – $1/x$ recast as $\tfrac{2}{x+1}-1$ on $[0,1)$. Read it
  for the second, sneakier shape of the range problem, and for a case where the
  surrounding [[Shifters]] absorb the extra MSB for free.
- [[Modular Squaring Table]] – $x^2 \bmod p$, wildly discontinuous, feeding
  $ab = \tfrac{(a+b)^2-(a-b)^2}{4}$. The existence proof that no smoothness is needed,
  and therefore the case where tabulation is not a baseline but the only option.

### Getting correct rounding back

- [[Residual-Sign Rounding Unit]] – for algebraic $f$ (those defined by $P(S,X,\dots)=0$
  built from $+$ and $\times$ alone), aim faithful at precision $\ell-1$ and let the
  exactly-computable sign of the residual break the tie. Read it for why the whole
  faithful/correctly-rounded distinction is nearly free for $\sqrt{\cdot}$ and $/$ and
  stubbornly expensive for $\exp$ and $\sin$.

### Where this sits

Formats, ulp and the rounding modes the table is filled with come from
[[Number Formats]] and [[Rounding]]; the cost models are stated in the primitives of
[[FPGAs]]. Downstream, [[Table-Based Function Evaluation]], [[Polynomial Approximation]] and
[[Digit Recurrence for Algebraic Functions]] each buy back the $2^n$ exponent a
different way — by splitting the address, by storing coefficients instead of values,
or by storing nothing and iterating. [[FloPoCo]] is where the generator interface
described above actually lives.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 16,
"Generalities on Fixed-Point Function Approximation", pp. 477–494.
