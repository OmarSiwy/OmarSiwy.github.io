---
title: Saturating Adder
description: "Modulo-2^w interface plus one multiplexer on c_out that substitutes the maximal representable value — clipping instead of wraparound, which is what signal processing needs."
kind: circuit
source: "ASA §5.1.1, p. 105"
status: seed
spade: simulated
tags: [digital, adders, saturation, overflow, dsp]
aliases:
  - Saturated Adder
  - Saturating Addition
  - Saturation Arithmetic
  - Clipping Adder
---

# Saturating Adder

A $w$-bit-in, $w$-bit-out adder that, on overflow, emits the extreme representable value instead of the sum modulo $2^w$ — the only member of the adder family whose output is deliberately *not* the exact sum.

```tikz title="Saturating adder: a generic adder whose carry-out selects between the wrapped sum and the maximal representable constant"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- generic adder: exact, w+1 bits wide internally ---
  \draw[thick] (0,0) rectangle (3.0,0.9);
  \node at (1.5,0.45) {\large $+$};

  % operands
  \draw[->,thick] (0.9,1.9) -- (0.9,0.9);
  \node[anchor=south] at (0.9,1.95) {$X$};
  \node[anchor=west] at (0.98,1.45) {$w$};
  \draw[->,thick] (2.1,1.9) -- (2.1,0.9);
  \node[anchor=south] at (2.1,1.95) {$Y$};
  \node[anchor=west] at (2.18,1.45) {$w$};

  % modulo-2^w sum out of the adder, into mux input 0
  \draw[->,thick] (1.5,0) -- (1.5,-1.4);
  \node[anchor=west] at (1.58,-0.45) {$s_{w-1..0}$};
  \node[anchor=west] at (1.58,-1.05) {$w$};

  % carry-out becomes the select
  \draw[thick] (0.4,0) -- (0.4,-1.8) -- (0.98,-1.8);
  \draw[->,thick] (0.98,-1.8) -- (1.0,-1.8);
  \node[anchor=east] at (0.32,-0.9) {$c_\mathrm{out}=s_w$};
  \node[anchor=south] at (0.7,-1.78) {$1$};

  % saturation constant
  \node[anchor=south] at (4.4,-0.75) {$2^w-1$};
  \draw[->,thick] (4.4,-0.8) -- (4.4,-1.4);
  \node[anchor=west] at (4.48,-1.15) {$w$};

  % --- multiplexer ---
  \draw[thick] (1.0,-2.2) rectangle (5.0,-1.4);
  \node at (3.0,-1.8) {mux};
  \node[anchor=north] at (1.5,-1.42) {\tiny $0$};
  \node[anchor=north] at (4.4,-1.42) {\tiny $1$};

  % output
  \draw[->,thick] (3.0,-2.2) -- (3.0,-3.1);
  \node[anchor=north] at (3.0,-3.15) {$S$};
  \node[anchor=west] at (3.08,-2.65) {$w$};
\end{circuitikz}
\end{document}
```

*after Fig. 5.1b, p. 105 — the book draws only the modulo-$2^w$ box; the clamp path is its prose made explicit.*

**Saturation is an interface decision, not an adder decision.** A generic adder on two $w$-bit unsigned operands produces $S=X+Y+c_\text{in}$ exactly, as $w+1$ bits, because $[0,2^w-1]+[0,2^w-1]+\{0,1\}\subseteq[0,2^{w+1}-1]$ — no information is lost and there is nothing to saturate. Saturation only becomes a question once you have chosen the **modulo $2^w$ interface**: $w$ bits in, $w$ bits out, $c_\text{in}$ tied to $0$ and $c_\text{out}$ discarded. That interface computes $X+Y \bmod 2^w$, and the discarded bit is precisely the one that says the answer was wrong. A saturating adder keeps the same pin-out and spends that bit instead of throwing it away.

**The overflow flag is already in the circuit — it is the carry-out.** For unsigned operands, $c_\text{out}=s_w=1$ exactly when $X+Y\ge 2^w$, so the flag costs zero gates: it is the top bit of an adder you were building anyway (p. 105). The clamp is therefore $w$ two-input multiplexers, all sharing one select line. Nothing in the carry network changes, which is why saturation composes with *every* adder architecture in this folder — [[RCA, Ripple-Carry Adder]], [[Kogge-Stone Tree]], [[FPGA Hard Carry Chain Adder]] all export the same $c_\text{out}$.

**The clamp constant is the largest value the format can hold, which for $\text{uint}(w)$ is $2^w-1$, not $2^{w-1}$.** The all-ones vector is what a multiplexer selects here, and it is free in the sense that no gate drives it — the mux's "1" input is a tie-to-supply, so synthesis folds the whole thing into an OR: $S_i = s_i \vee c_\text{out}$, one two-input gate per bit, by absorption over the constant $1$.

> [!warning] The book's saturation constant on p. 105 is wrong
> The text says the multiplexer "outputs the $w$-bit sum if $c_\text{out}=0$ and outputs $2^{w-1}$ if $c_\text{out}=1$." Counterexample at $w=8$: $X=200$, $Y=100$ give $c_\text{out}=1$, so the stated circuit returns $2^7=128$ — *smaller than either operand*, and smaller than $199+100$ would have returned. Saturation is supposed to be monotone; this is not. The maximal representable value of $\text{uint}(8)$ is $2^8-1=255$. Read $2^w-1$. (The exponent is right for the *signed* positive clamp, $2^{w-1}-1$, so this looks like a dropped $-1$ rather than a conceptual slip.)

**Signed saturation needs two constants and a different flag.** In $\text{sfix}$/two's complement the operands live in $[-2^{w-1},2^{w-1}-1]$ and the exact sum in $[-2^w,2^w-2]$, again $w+1$ bits. Overflow is *not* $c_\text{out}$ — it is the disagreement of the top two carries,
$$\text{ovf}=c_w\oplus c_{w-1},$$
equivalently "the exact $(w+1)$-bit sum does not sign-extend", i.e. $s_w\neq s_{w-1}$. That is the corrected test from [[Two's Complement Adder-Subtractor]]; the book's own $s_{w-1}\oplus c_\text{out}$ form false-positives. The clamp direction is then the sign of the exact sum: $s_w=1$ (result went negative) selects $-2^{w-1}$, $s_w=0$ selects $2^{w-1}-1$. Cost over unsigned: one XOR for the flag, and the mux's constant input is now itself a 2:1 mux on $s_w$ — two [[Multiplexers]] levels, or one $3$-input LUT level on an FPGA.

**The clamp sits after the carry, so its delay is unhideable.** $\tau_\text{sat}=\tau_\text{add}(w)+\tau_\text{mux}$, and worse, $c_\text{out}$ fans out to all $w$ mux selects, so a buffer tree of depth $O(\log w)$ appears on the very last net of the critical path. On an FPGA the sum bits leave the hard carry chain and must re-enter the fabric for the clamp — a full LUT delay plus routing on top of a chain whose whole point was to avoid the fabric ([[FPGA Hard Carry Chain Adder]]). This is why a saturating adder is a bad thing to place in a feedback loop and why the guard-bit trick below usually wins.

**Saturating addition is not associative, and that destroys the usual reassociation tricks.** At $w=8$ signed: $(100+_\text{sat}100)+_\text{sat}(-100)=127-100=27$, while $100+_\text{sat}(100+_\text{sat}(-100))=100$. Since it is not associative it is not a monoid, so a summation of $N$ terms cannot be reassociated into a balanced tree, cannot be deferred through a compressor tree, and cannot be carried in redundant form — [[CSA, Carry-Save Adder]] is unusable, because a carry-save pair has no cheap comparison and therefore no cheap clamp. Every partial sum must be clamped in sequence, giving $N$ dependent $\tau_\text{sat}$ delays.

> [!important] Prefer guard bits and one clamp at the end.
> Accumulate in $w+g$ bits exactly, where $2^g\ge N$ bounds the growth of an $N$-term sum, then clamp once into $w$ bits. The accumulation is ordinary modulo arithmetic — associative, tree-reassociable, carry-save-friendly — and the single final clamp is both cheaper ($1$ clamp instead of $N$) and *more accurate*, because intermediate excursions that would have been clipped are allowed to come back into range. Per-step saturation is only correct when the specification genuinely demands clipping at every step, as it does at a DAC output. See [[Error Accuracy]].

$$\boxed{\ S_\text{unsigned}=\begin{cases}(X+Y)\bmod 2^w,& c_\text{out}=0\\[2pt] 2^{w}-1,& c_\text{out}=1\end{cases}\qquad S_i=s_i\vee c_\text{out}\ }$$

$$\boxed{\ \text{ovf}_\text{signed}=c_w\oplus c_{w-1},\qquad S_\text{signed}=\begin{cases}s_{w-1..0},&\text{ovf}=0\\[2pt] 2^{w-1}-1,&\text{ovf}=1,\ s_w=0\\[2pt] -2^{w-1},&\text{ovf}=1,\ s_w=1\end{cases}\ }$$

**When it breaks.** Mixing the two: an unsigned clamp applied to signed data returns $2^w-1$, which reads as $-1$. Subtraction: $X-Y$ borrows, so the unsigned underflow flag is $\overline{c_\text{out}}$ and the clamp constant is $0$, not $2^w-1$ — the [[Two's Complement Adder-Subtractor]] needs a second constant input and a `sub`-dependent flag polarity. Multi-operand sums, as above, where the non-associativity makes the result order-dependent and the compressor-tree speedup unavailable. Feedback loops, where the clamp delay lands directly in the recurrence of an [[LTI Filters]] biquad and forces a lower clock. And the accuracy cliff: saturation is *unbounded* error at the clipped point — unlike [[Quantization]], whose error is bounded by an ulp, a clamp can be off by $2^w$, so any error analysis that assumed a bounded-noise model is void the moment the clamp fires.

**In Spade.** The generic entity is parameterised on $W$ and instantiated at $W=8$ for simulation.

```spade
fn sat_add_u<#uint W>(x: uint<W>, y: uint<W>) -> uint<W> {
    let s: uint<{W + 1}> = x + y;      // exact, W+1 bits
    let wrapped: uint<W> = trunc(s);   // the modulo-2^W interface
    let full: uint<W> = ~(0 as uint<W>);
    if s.msb() { full } else { wrapped }
}

fn sat_add_s<#uint W>(x: int<W>, y: int<W>) -> int<W> {
    let s: int<{W + 1}> = x + y;
    let wrapped: int<W> = trunc(s);
    let neg = s.msb();                 // s_W: sign of the exact sum
    let ovf = neg != wrapped.msb();    // s_W != s_{W-1}, i.e. c_W xor c_{W-1}
    let hi: int<W> = (~(0 as uint<W>) >> 1).as_int();   // 0111..1 = 2^(W-1) - 1
    if ovf { if neg { ~hi } else { hi } } else { wrapped }
}
```

`s.msb()` is the diagram's $c_\text{out}$ wire and `trunc(s)` is the $s_{w-1..0}$ bus; the `if` is the mux, purely combinational, so this is a `fn` and not an `entity`. The width arithmetic is the whole point: `+` widens to `W+1`, and it is that extra bit — not a separate comparator — that carries the flag, so `trunc` and `msb` split one adder output into the mux's data and select. In the signed version `~hi` is $-2^{w-1}$ by the two's-complement identity $-x=\bar{x}+1$ applied to $\text{hi}=2^{w-1}-1$. Synthesis will not build the drawn multiplexer: it collapses `if c { 1 } else { s_i }` into `s_i | c` in the unsigned case, and into one LUT per bit in the signed case.

**Related notes.**

- [[Choosing an Adder]] – compares: the saturating variant is an output-stage decision layered on whichever architecture that note selects.
- [[RCA, Ripple-Carry Adder]] – depends-on: supplies the $c_\text{out}$ that drives the clamp, at no extra cost.
- [[Two's Complement Adder-Subtractor]] – extends: signed saturation reuses its corrected overflow test $c_w\oplus c_{w-1}$, and subtraction flips the clamp constant to $0$.
- [[CSA, Carry-Save Adder]] – counter-example: non-associativity makes carry-save accumulation illegal under per-step saturation.
- [[FPGA Hard Carry Chain Adder]] – counter-example: the clamp forces a fabric round-trip that the hard chain exists to avoid.
- [[Multiplexers]] – depends-on: $w$ 2:1 muxes sharing one high-fanout select.
- [[Error Accuracy]] – supports: clamping is an unbounded-error event, outside the bounded-noise model used elsewhere.
- [[Quantization]] – compares: both are lossy range/precision fixes, but quantization error is bounded by an ulp and saturation error is not.
- [[LTI Filters]] – supports: the application that demands clipping over wraparound, and the loop whose critical path the clamp lengthens.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §5.1.1 Unsigned integer addition — p. 105 (Fig. 5.1a/b): the generic, modulo-$2^w$ and saturated interfaces. **Its saturation constant $2^{w-1}$ is an error; see the warning above.**
- §5.1.2 Signed integer addition — p. 105: the $[-2^{w-1},2^{w-1}-1]\to[-2^w,2^w-2]$ range argument.
- §5.2.3 Addition of signed numbers in two's complement — pp. 108-109: the overflow condition (whose stated formula is corrected in [[Two's Complement Adder-Subtractor]]).
- §5.1.3 Fixed-point addition — pp. 105-106 (Eq. 5.1): why the clamp is a format decision, not an arithmetic one.
