---
title: Saturating Overflow Unit
description: "Clamps out-of-range results to the extreme representable value instead of wrapping them, buying signal-processing sanity for one comparator and one multiplexer per operation."
kind: circuit
source: "ASA §3.1.5, p. 71"
status: seed
spade: simulated
tags: [digital, error-accuracy, overflow, saturation, fixed-point]
aliases:
  - Saturation Unit
  - Saturating Arithmetic
  - Clipping Unit
  - Saturation
---

# Saturating Overflow Unit

A saturating overflow unit projects an out-of-range result onto the nearest representable value instead of letting it wrap, which is the one overflow policy that keeps the output error monotone in the input.

```tikz title="Saturating overflow unit: a wide internal result is clamped once, at the end, by a sign-agreement test and a 3:1 multiplexer"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % wide, overflow-free internal datapath
  \node[draw,minimum width=2.0cm,minimum height=1.8cm,align=center] (op) at (0,0)
        {wide internal\\ operator};
  \draw[->] (-2.6,0.45) -- (-1.0,0.45) node[midway,above]{$a$};
  \draw[->] (-2.6,-0.45) -- (-1.0,-0.45) node[midway,above]{$b$};

  % wide result bus, tapped
  \draw[->] (1.0,0) -- (2.2,0);
  \node[anchor=south] at (1.6,0.06) {$s$};
  \node[anchor=north] at (1.6,-0.06) {$W$ b};
  \node[circ] at (2.2,0) {};

  % top slice to the detector
  \draw[->] (2.2,0) -- (2.2,2.2) -- (3.5,2.2);
  \node[anchor=east] at (2.1,1.45) {top $W{-}N{+}1$ b};
  \node[draw,minimum width=2.4cm,minimum height=0.9cm,align=center] (det) at (4.75,2.2)
        {overflow\\ detect};

  % low N bits straight into the mux
  \draw[->] (2.2,0) -- (6.6,0);
  \node[anchor=south] at (4.3,0.06) {$s_{N-1\ldots 0}$};
  \node[anchor=north] at (4.3,-0.06) {$N$ b};

  % saturation constants
  \node[draw,minimum width=1.9cm,minimum height=0.7cm] (max) at (4.0,-1.15) {$2^{N-1}-1$};
  \node[draw,minimum width=1.9cm,minimum height=0.7cm] (min) at (4.0,-2.30) {$-2^{N-1}$};
  \draw[->] (4.95,-1.15) -- (6.6,-1.15) node[midway,above]{$N$ b};
  \draw[->] (4.95,-2.30) -- (6.6,-2.30) node[midway,above]{$N$ b};

  % the multiplexer
  \node[draw,minimum width=1.1cm,minimum height=3.4cm,align=center] (mux) at (7.15,-1.15)
        {3:1\\ mux};

  % select
  \draw[->] (5.95,2.2) -- (7.15,2.2) -- (7.15,0.55);
  \node[anchor=west] at (7.25,1.5) {$\mathrm{sel}=(\mathrm{ovf},\,s_{W-1})$};
  \node[anchor=east] at (7.05,1.5) {$2$ b};

  % output
  \draw[->] (7.7,-1.15) -- (9.2,-1.15);
  \node[anchor=south] at (8.45,-1.09) {$r$};
  \node[anchor=north] at (8.45,-1.21) {$N$ b};
\end{circuitikz}
\end{document}
```

**Name the failure being prevented.** The default overflow policy of every fixed-point datapath is *wrap*: the result $s$ is computed on $W$ bits, the top $W-N$ bits are dropped, and what remains is $s \bmod 2^{N}$ reinterpreted as a two's-complement $N$-bit number. Dropping wires is free, which is why it is the default. It is also discontinuous: for a signed output format holding $[-2^{N-1},\,2^{N-1}-1]$, an $s$ that overshoots the top of the range by a single ulp comes back as $-2^{N-1}$. One ulp of arithmetic overshoot produces $2^{N}$ ulp of error and a sign reversal. The formats and the meaning of ulp here are [[Fixed-Point Representations]]; the error accounting is [[Error Accuracy]].

**State the clamp as a function before building it.** Saturation replaces the modular reduction with a projection onto the representable interval,

$$r \;=\; \min\!\big(\max(s,\,-2^{N-1}),\; 2^{N-1}-1\big)$$

which is the nearest representable value to $s$ in the ordinary metric on $\mathbb{Z}$ — saturation is to the *range* what rounding is to the *resolution*. Two properties follow immediately and are the whole reason to pay for it. It is **monotone**: $s_1 \le s_2 \implies r_1 \le r_2$, because $\min$ and $\max$ against constants are each monotone and composition preserves monotonicity. And it is **error-minimal for the output format**: no $N$-bit value is closer to $s$ than $r$ is, so the clamp never makes an already-bad situation worse. Wrapping has neither property.

**Detect overflow by sign agreement, not by comparison.** The definition above reads as two magnitude comparisons against constants, and a general clamp to an arbitrary bound really does need a [[Magnitude Comparator]] with its carry-propagate chain. But when the target format is a *prefix truncation* of the same word — the usual case, $s$ on $\mathrm{sfix}(m,\ell)$ narrowed to $\mathrm{sfix}(m',\ell)$ with $m' < m$ — the comparison collapses. Write $s$ in two's complement,

$$s \;=\; -2^{W-1}s_{W-1} + \sum_{i=0}^{W-2} 2^{i} s_i ,$$

and recall the sign-extension identity: $\mathrm{sext}_W(\mathrm{trunc}_N(s)) = s$ exactly when the discarded bits repeat the retained sign bit. Hence

$$s \in [-2^{N-1},\,2^{N-1}-1] \;\Longleftrightarrow\; s_{W-1}=s_{W-2}=\cdots=s_{N-1},$$

a statement about $W-N+1$ bits, not a subtraction. "All equal" is $\mathrm{AND}$ of the slice $\vee$ $\mathrm{NOR}$ of the slice, so overflow is one $\mathrm{OR}$ tree and one $\mathrm{AND}$ tree over the same $W-N+1$ bits, of depth $\lceil \log_2 (W-N+1)\rceil$ and no carry chain anywhere. The retained sign bit $s_{N-1}$ must be *inside* the slice; drop it and a positive $s$ whose bit $N-1$ is set — for example $s=128$ narrowing to $N=8$ — is declared in range and delivered as $-128$.

**Which extreme to substitute is already in your hand.** Once $\mathrm{ovf}$ is asserted, the direction is the sign of the true result, and on a two's-complement wide word that is simply $s_{W-1}$, available with zero logic. The two constants are $\mathrm{MAX}=2^{N-1}-1$ (`0111...1`) and $\mathrm{MIN}=-2^{N-1}$ (`1000...0`), which are bitwise complements of each other — one inverter's worth of relationship, though synthesis will just tie the constants off. The select is therefore the 2-bit pair $(\mathrm{ovf}, s_{W-1})$ and each output bit is a function of exactly three signals: $s_i$, $\mathrm{ovf}$, $s_{W-1}$. On an FPGA that fits in one 6-input LUT per output bit, so the clamp costs $N$ LUTs plus the reduction trees; on an ASIC it is one 2:1 mux per bit driven by a pre-computed constant selection. The reduction trees run in parallel with the adder or multiplier producing $s$ and are shallower than its carry structure, so the only thing saturation adds to the critical path is the final mux delay.

> [!warning] Not covered in the source — needs outside research
> The book gives no area or delay figure for a saturation unit; it states only "at least one multiplexer per operation" (p. 71). The LUT and depth counts above are derived from the structure, not measured, and an FPGA's actual mapping will fold the mux into whatever LUT already drives that output bit.

**Saturate once, at the end — the option software does not have.** In a processor, saturating arithmetic is free when the ISA provides it, so the software habit is to saturate every operation. In application-specific hardware you can instead run a wider, overflow-free internal datapath and clamp exactly once at the output. This is both cheaper (one clamp instead of one per operation, and one mux delay instead of one per stage) and *more accurate*, because saturation is not associative: clamping is a lossy projection, and once information has been thrown away no later operation can recover it. With $N=8$ signed and $a=b=100$, $c=-100$, per-operation saturation gives $\mathrm{sat}(\mathrm{sat}(a+b)+c)=\mathrm{sat}(127-100)=27$, while a 10-bit internal accumulator clamped once gives the exact $100$. The corollary is that the two designs are not interchangeable and a testbench written against one will fail the other.

**Order the clamp after the rounder.** If the datapath also narrows at the LSB end, the rounding addition can itself create the overflow: [[Round-to-Nearest Ties-Up]] adds $2^{\ell-1}$ before truncating, and a value just below $2^{N-1}$ rounds up to exactly $2^{N-1}$, which is not representable. Placing the clamp before the rounder therefore leaves a datapath that can still emit $-2^{N-1}$ for a large positive input — the exact bug saturation was installed to prevent. The clamp goes last, and it must be sized to the rounder's output width $W$, not its input width.

$$\boxed{\;r=\min\!\big(\max(s,-2^{N-1}),\,2^{N-1}-1\big),\qquad \mathrm{ovf}=\Big(\bigvee_{i=N-1}^{W-1} s_i\Big)\oplus\Big(\bigwedge_{i=N-1}^{W-1} s_i\Big)\;}$$

## When it breaks

- **Unsigned outputs.** For a $\mathrm{ufix}$ target there is no sign bit and no lower clamp: representability is "the top $W-N$ bits are all zero", $\mathrm{ovf}=\bigvee_{i=N}^{W-1}s_i$, and the substituted constant is always $\mathrm{MAX}$. Reusing the signed sign-agreement test on unsigned data silently clips every value above $2^{N-1}$.
- **The error is bounded only at the output, not in the error budget.** $|r-s|$ still grows without limit as the overshoot grows; what saturation bounds is $|r|$. Any worst-case error bound that survives a clamp has to be a bound on the *range* of $s$, which means you are back to doing the range analysis anyway.
- **Linearity is gone the moment it fires.** A saturating operator is not LTI, so the transfer-function reasoning behind [[LTI Filters]] — and every stability and limit-cycle argument built on it — holds only inside the unclipped region. In a recursive structure a single clamp can seed a sustained oscillation that a wrapping datapath would not have produced in the same place.
- **No reassociation.** Because $\mathrm{sat}$ is non-associative, a retiming or strength-reduction pass may not reorder a saturating sum, and neither may you when hand-optimising. The wide-datapath form has no such constraint, which is a second reason to prefer it.
- **When range analysis already proves the bound.** If $|s| < 2^{N-1}$ is provable from the input ranges, the whole unit is dead silicon and a wire is the correct implementation. This is the book's stated position: use range and error analysis to make overflow impossible by construction, and the question rarely arises (p. 71).

## RTL (Spade)

```spade
fn sat<#uint W, #uint N>(x: int<W>) -> int<N>
    where W >= N else "a saturation unit only ever narrows"
{
    let narrow: int<N> = trunc(x);
    let fits = sext::<N, W>(narrow) == x;

    let sign: uint<1> = 1;
    let rest: uint<{N - 1}> = 0;
    let minv: int<N> = sign.concat(rest).as_int();
    let maxv: int<N> = ~minv;

    if fits { narrow } else if x.msb() { minv } else { maxv }
}
```

`fits` is the diagram's overflow detector written as its defining identity rather than as a bit slice — `sext(trunc(x)) == x` is the sign-agreement test, and synthesis reduces it to exactly the $\mathrm{AND}/\mathrm{OR}$ pair over bits $W{-}1 \ldots N{-}1$ rather than building a $W$-bit comparator. `minv` is `1000...0` built by concatenation (for integers `concat` puts the first argument high) and `maxv` is its bitwise complement, matching the two constant boxes. The whole thing is combinational — the block is a `fn`, which in Spade cannot contain a register — so the mux delay lands directly on the path out of the wide operator. Verified against a behavioural clamp through the concrete wrapper `entity sat12to8(x: int<12>) -> int<8> { sat::<12, 8>(x) }`, which is also what forces the generic body to be type-checked at all.

## Related Notes

- [[Fixed-Point Representations]] – depends-on: fixes $N$, the endpoints $\pm 2^{N-1}$, and what a wrap actually computes.
- [[Magnitude Comparator]] – compares: the general clamp needs one; a prefix-truncation clamp replaces it with a carry-free sign-agreement test.
- [[Round-to-Nearest Ties-Up]] – depends-on: its rounding addition is a source of the overflow this unit catches, so it must sit upstream of the clamp.
- [[LTI Filters]] – supports: the application where clipping rather than wrapping is the difference between a degraded output and a destroyed one.
- [[Quantization]] – compares: the same "force a value into a narrower format" problem attacked at the LSB end instead of the MSB end.
- [[Error Accuracy]] – depends-on: the worst-case-error framework this unit's guarantees are stated in.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §3.1.5 "Rounding and Overflow Specification in Fixed-Point Libraries", p. 71 — wrap versus saturation, the multiplexer cost, and the wider-internal-datapath option.
- Same, §3.1.4 "Truncation Versus Rounding to the Nearest", p. 70 — the rounding addition that can itself overflow.
- Same, §3.1.1–3.1.2, pp. 67–68 — worst-case absolute error bound and ulp, used for the error statements above.
