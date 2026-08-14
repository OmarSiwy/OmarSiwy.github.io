---
title: Nfloat Format
description: "Normals only, with all four special cases in an explicit 2-bit exn field: two bits more than IEEE 754, one extra binade at each end, and no subnormal logic in any operator of the pipeline."
kind: concept
source: "ASA §2.5.3-2.5.4, pp. 54-56"
status: seed
spade: simulated
tags: [digital, number-formats, floating-point, flopoco, subnormal]
aliases:
  - Nfloat
  - Nfloats
  - Normal-Only Float
  - FloPoCo Floating-Point Format
---

# Nfloat Format

$\mathrm{Nfloat}(w_E,w_F)$ is a floating-point family that encodes **only normal numbers** in its exponent and fraction, and pushes zero, $\pm\infty$ and NaN out into a separate 2-bit `exn` field — the one design decision that removes subnormal hardware from every operator downstream.

```tikz title="Nfloat bit fields, and the representable values of Nfloat(3,2) against IEEEfloat(3,2)"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=0.34cm,y=1cm,font=\footnotesize,>=stealth]

% ---------- (a) the four fields, after Fig. 2.15 ----------
\def\y{3.1}
\draw[fill=orange!25] (0,\y)  rectangle ++(4,0.46);  \node at (2,{\y+0.23}) {\textsf{exn}};
\draw[fill=red!18]    (4,\y)  rectangle ++(2,0.46);  \node at (5,{\y+0.23}) {$s$};
\draw[fill=violet!18] (6,\y)  rectangle ++(8,0.46);  \node at (10,{\y+0.23}) {$E$};
\draw[fill=green!12]  (14,\y) rectangle ++(14,0.46); \node at (21,{\y+0.23}) {$F$};
\draw[|<->|] (0,{\y+0.72})  -- node[above=-2pt,fill=white,inner sep=1pt] {$2$} (4,{\y+0.72});
\draw[|<->|] (4,{\y+0.72})  -- node[above=-2pt,fill=white,inner sep=1pt] {$1$} (6,{\y+0.72});
\draw[|<->|] (6,{\y+0.72})  -- node[above=-2pt,fill=white,inner sep=1pt] {$w_E$} (14,{\y+0.72});
\draw[|<->|] (14,{\y+0.72}) -- node[above=-2pt,fill=white,inner sep=1pt] {$w_F$} (28,{\y+0.72});
\node[anchor=north] at (14,{\y-0.06}) {total $w_E+w_F+3$ bits\quad$\cdot$\quad\textsf{exn}$=01\Rightarrow X=(-1)^s(1+F)2^{E-E_0}$};

% ---------- (b) every positive Nfloat(3,2) value, after Fig. 2.16c ----------
\def\y{1.35}
\fill[blue!10] (16,{\y-0.02}) rectangle (28,{\y+0.5});
\fill[gray!25] (0,{\y-0.02}) rectangle (0.125,{\y+0.5});
\draw[->] (0,\y) -- (29.4,\y);
\foreach \e in {-3,...,4}{
  \foreach \f in {0,...,3}{
    \pgfmathsetmacro{\v}{(1+\f/4)*pow(2,\e)}
    \draw (\v,\y) -- (\v,{\y+0.5});
  }
}
\foreach \t/\l in {0/0, 1/1, 16/16, 28/28}
  \node[anchor=north,font=\tiny] at (\t,{\y-0.08}) {$\l$};
\node[anchor=east] at (-0.4,{\y+0.25}) {$\mathrm{Nfloat}(3,2)$};
\node[anchor=south,font=\tiny] at (22,{\y+0.86}) {$e=4$: the binade IEEEfloat(3,2) spends on \textsf{exn} codes};
\draw[->] (22,{\y+0.84}) -- (22,{\y+0.56});
\node[anchor=west,font=\tiny] at (29.6,{\y+0.25}) {$\mathbb{R}$};

% ---------- (c) the same two formats near zero, x-axis stretched 20x ----------
\def\y{-0.5}
\fill[gray!25] (0,{\y-0.02}) rectangle (2.5,{\y+0.42});
\draw[->] (0,\y) -- (11.4,\y);
\foreach \e in {-3,-2}{
  \foreach \f in {0,...,3}{
    \pgfmathsetmacro{\v}{20*(1+\f/4)*pow(2,\e)}
    \draw (\v,\y) -- (\v,{\y+0.42});
  }
}
\draw (10,\y) -- (10,{\y+0.42});
\node[anchor=east] at (-0.4,{\y+0.21}) {$\mathrm{Nfloat}(3,2)$};
\foreach \t/\l in {0/0, 2.5/{2^{-3}}, 5/{2^{-2}}, 10/{2^{-1}}}
  \node[anchor=north,font=\tiny] at (\t,{\y-0.08}) {$\l$};

\def\y{-1.9}
\fill[gray!25] (0,{\y-0.02}) rectangle (1.25,{\y+0.42});
\draw[->] (0,\y) -- (11.4,\y);
\foreach \f in {1,2,3}{
  \pgfmathsetmacro{\v}{20*(\f/4)*pow(2,-2)}
  \draw[dashed] (\v,\y) -- (\v,{\y+0.42});
}
\foreach \e in {-2}{
  \foreach \f in {0,...,3}{
    \pgfmathsetmacro{\v}{20*(1+\f/4)*pow(2,\e)}
    \draw (\v,\y) -- (\v,{\y+0.42});
  }
}
\draw (10,\y) -- (10,{\y+0.42});
\node[anchor=east] at (-0.4,{\y+0.21}) {$\mathrm{IEEEfloat}(3,2)$};
\foreach \t/\l in {1.25/{2^{-4}}, 5/{2^{-2}}, 10/{2^{-1}}}
  \node[anchor=north,font=\tiny] at (\t,{\y-0.08}) {$\l$};
\node[anchor=west,font=\tiny] at (11.6,-0.29) {gap around zero: $2^{-3}$, no subnormals};
\node[anchor=west,font=\tiny] at (11.6,-1.69) {dashed $=$ the 3 subnormals per sign, gap $2^{-4}$};
\node[anchor=west,font=\tiny] at (11.6,-2.55) {$x$-axis stretched $20\times$ against (b)};

\end{circuitikz}
\end{document}
```

*after Fig. 2.15, p. 54 and Fig. 2.16c, p. 55; the near-zero comparison in (c) is my own construction from Table 2.4.*

**Take the exception codes out of the exponent and give them their own wires.** An Nfloat word carries four fields — `exn` (2 bits), sign $s$ (1 bit), biased exponent $E$ ($w_E$ bits, unsigned), fraction $F$ ($w_F$ bits, read as $\mathrm{ufix}(-1,-w_F)$ so $F\in[0,1)$, exactly as in [[IEEE 754 Format]]). The `exn` field is a flat enumeration of the four things a float can be:

| `exn` | meaning |
| --- | --- |
| `00` | zero ($\pm0$ per $s$) |
| `01` | normal number, $X=(-1)^{s}(1+F)\,2^{E-E_{0}}$ (2.19) |
| `10` | infinity ($\pm\infty$ per $s$) |
| `11` | NaN |

The bias is unchanged, $E_{0}=2^{w_E-1}-1$, so the $s$, $E$, $F$ fields of an Nfloat and of an IEEEfloat of the same $(w_E,w_F)$ mean the same thing bit for bit when `exn` $=01$. Total width is $w_E+w_F+3$: two bits *more* than $\mathrm{IEEEfloat}(w_E,w_F)$, and the same width as $\mathrm{LNS}(w_E,w_F)$, which is why the book can put the three families on one axis.

**Count what the two extra bits buy back in exponent range.** IEEE 754 reserves $E=0$ for subnormals-and-zero and $E=2^{w_E}-1$ for the exceptionals, so its normals occupy $E\in[1,\,2^{w_E}-2]$ and the actual exponent $e=E-E_0$ spans

$$e_{\min}^{\text{IEEE}}=1-(2^{w_E-1}-1)=-2^{w_E-1}+2,\qquad e_{\max}^{\text{IEEE}}=(2^{w_E}-2)-(2^{w_E-1}-1)=2^{w_E-1}-1 .$$

With the exceptions moved to `exn`, no exponent code is reserved: $E$ ranges over the whole of $[0,\,2^{w_E}-1]$ and the same subtraction gives

$$e_{\min}^{\text{Nfloat}}=-2^{w_E-1}+1,\qquad e_{\max}^{\text{Nfloat}}=2^{w_E-1}$$

— **one full binade at each end** (Table 2.4, p. 55). The largest finite value is $(2-2^{-w_F})2^{e_{\max}}$ in both families, so Nfloat's overflow threshold is exactly $2\times$ IEEE's. Panel (b) shows the top binade of $\mathrm{Nfloat}(3,2)$, the interval $[16,28]$, which $\mathrm{IEEEfloat}(3,2)$ does not have at all.

**At the bottom the extra binade does not compensate for the missing subnormals.** Nfloat's smallest positive value is a normal, $2^{e_{\min}}=2^{-2^{w_E-1}+1}$, while IEEE's is a subnormal, $2^{e_{\min}-w_F}=2^{-2^{w_E-1}+2-w_F}$. The ratio is

$$\frac{\text{smallest Nfloat}}{\text{smallest IEEEfloat}}=2^{\,w_F-1},$$

so the underflow threshold moves *up* by roughly a factor $2^{w_F}$ — for a binary32 shape $(8,23)$ that is $2^{22}\approx4\cdot10^{6}$. Panel (c) is this at $(3,2)$: Nfloat stops at $2^{-3}$, IEEE keeps going to $2^{-4}$ through three subnormals per sign. Range at the top is bought with an exponent bit; range at the bottom is what gradual underflow was for, and Nfloat simply declines to pay for it.

**The trade is bits against logic, and a pipeline is billed differently from a memory.** IEEE 754 is a *memory-oriented* format: it was designed to extract the most from a fixed word size on a general-purpose processor, where every bit of a stored double is a bit of cache and of bus. Inside a pipeline of application-specific operators nothing is stored between stages — the two `exn` bits are two wires, and forwarding them is strictly cheaper than re-encoding exceptions into the exponent at every operator output and decoding them again at every input. Subnormal support is worse than the encoding overhead: honouring $E=0$ forces a leading-zero counter, a variable shifter and a pair of MUXes into the significand path of *every* operator, not just the ones that see a subnormal ([[Shifters]], [[Floating-Point Operators]]). And when the format is fully parameterised, one more exponent bit buys more usable range than subnormals do, at a fraction of that cost. Application-specific also means the operand ranges are known at design time, so there is no anonymous programmer to protect from underflow.

> [!note] The comparison trick survives, and gets slightly better
> The bias exists so that a positive float read as an unsigned integer is monotone in its value (p. 51), which turns a float comparator into an integer comparator. Ordering the fields `exn`$\,|\,s\,|E|F$ with `exn` in the high bits preserves that for Nfloat, and extends it: `00` $<$ `01` $<$ `10` $<$ `11` puts zero below every normal, $\infty$ above every normal and NaN above $\infty$, unconditionally — the $E$ and $F$ fields cannot perturb the order because `exn` dominates them. IEEE 754 cannot do this, because its NaNs and its infinities share $E=2^{w_E}-1$ and are separated only by $F$. This consequence is mine, not the book's.

$$\boxed{\ \mathrm{Nfloat}(w_E,w_F):\quad w_E+w_F+3\ \text{bits},\quad e\in\big[-2^{w_E-1}+1,\ 2^{w_E-1}\big],\quad X=(-1)^{s}(1+F)2^{E-E_0}\ \text{iff}\ \textsf{exn}=01\ }$$

**When it breaks.**

- **$x-y=0\Leftrightarrow x=y$ fails.** This is the one genuine mathematical property subnormals buy (p. 55), and dropping them costs it. Concretely in $(3,2)$: $x=2^{-2}$ and $y=1.25\cdot2^{-2}$ are both representable in both families, and $y-x=2^{-4}$. IEEEfloat$(3,2)$ returns it exactly, as its smallest subnormal. Nfloat$(3,2)$ cannot represent $2^{-4}$ at all — its smallest positive is $2^{-3}$ — so it returns zero for the difference of two distinct numbers. Any algorithm that tests a difference against zero, or divides by one, needs a guard the format no longer provides.
- **The two extra bits are pure loss at a memory boundary.** Store an array of Nfloats and you pay $2/(w_E+w_F+1)$ extra in DRAM traffic for information that would have been free in the exponent. The overhead is worst exactly where floats are getting most interesting: $25\%$ on an 8-bit format, $12.5\%$ on 16, $3\%$ on 64. Nfloat belongs on wires, IEEE 754 in arrays and at interfaces.
- **`exn` is often over-provisioned.** Two bits enumerate four cases whether or not the datapath can produce them. A pipeline with bounded inputs and no division may be provably free of $\infty$ and NaN, at which point one bit — or none — would do; the format does not offer that ([[Floating-Point Specialization]]).
- **Round-tripping is not the identity.** IEEE $\to$ Nfloat $\to$ IEEE flushes every subnormal to $\pm0$ and collapses NaN payloads and signalling/quiet distinctions. It is faithful only on normals, zeros and infinities.
- **Where a sibling takes over.** If the range is known and narrow, the whole exponent is dead weight and [[Signed Fixed-Point Format]] wins on both area and accuracy; if the workload is multiply/divide-dominated, $\mathrm{LNS}(w_E,w_F)$ occupies the identical $w_E+w_F+3$ bits and makes a multiplier into an adder ([[LNS Multiplier]]). [[Choosing a Number Format]] is the actual decision.

**RTL (Spade).** The conversion at the boundary of an Nfloat pipeline — an IEEE 754 word in, an Nfloat word out — is where the format definition becomes hardware. Shown for $(w_E,w_F)=(5,10)$, i.e. binary16 in, 18 bits out:

```spade
/// IEEEfloat(5,10) word -> Nfloat(5,10) word (FloPoCo's input conversion).
/// Out layout, MSB first: exn(2) | s(1) | E(5) | F(10)  = 18 bits.
fn ieee_to_nfloat16(x: uint<16>) -> uint<18> {
    let b = x.as_bits();
    let f = b[0..10].as_uint();
    let e = b[10..15].as_uint();
    let s = b[15];

    let e_max = e == 0b11111;
    let e_zero = e == 0b00000;
    let f_zero = f == 0;

    let exn: uint<2> = if e_max {
        if f_zero { 0b10 } else { 0b11 }
    } else if e_zero {
        0b00
    } else {
        0b01
    };

    let ef: uint<15> = if exn == 0b01 { b[0..15].as_uint() } else { 0 };
    exn.concat(s.as_uint()).concat(ef)
}
```

`b[10..15]` and `b[0..10]` are the $E$ and $F$ rectangles of panel (a), with `as_bits()` index 0 = LSB; `concat` on integers puts its left operand high, which is what lays `exn` down in the top two bits and buys the monotone-compare property argued above. The whole thing is one `fn`, so it is purely combinational — three 5-bit comparisons, a 10-bit OR-reduce for `f_zero`, and a 15-bit MUX, no register and no shifter anywhere. The one thing synthesis does differently from the drawing: the `ef` MUX is not really 15 bits of logic, because `exn == 0b01` is already available as a one-hot decode of the two comparators, so a synthesiser folds the zeroing into 15 AND gates. Note what is *absent* — there is no normalising shifter, because subnormals are not renormalised into normals but flushed to zero, and that absence is the entire argument for the format.

**Related Notes.**

- [[IEEE 754 Format]] – compares: the same $s,E,F$ fields with the same bias, but with the two extremal exponent codes stolen for exceptions and subnormals.
- [[FloPoCo]] – supports: the generator whose every floating-point operator speaks this format internally.
- [[Floating-Point Operators]] – extends: what an adder, multiplier and divider look like once the subnormal path is deleted from all of them.
- [[Floating-Point Specialization]] – extends: how much further `exn` and the exponent can be trimmed once the value range is pinned down at design time.
- [[Choosing a Number Format]] – compares: where this sits against fixed point and LNS on the same bit budget.
- [[LNS Multiplier]] – compares: the other family occupying exactly $w_E+w_F+3$ bits, trading addition cost for multiplication cost.
- [[Signed Fixed-Point Format]] – counter-example: when the range is known, the exponent field is dead weight and this format loses on both area and ulp.
- [[Shifters]] – depends-on: the variable-shift hardware that subnormal support forces into every operator, and that Nfloat exists to avoid.
- [[Error Accuracy]] – depends-on: the ulp and rounding machinery this note assumes rather than restates.
- [[Exact Accumulators]] – supports: the other route to accuracy from an imprecise format, and the reason a small $w_F$ is survivable.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §2.5.3 "A Simplified Floating-Point Format", pp. 54–55 (Fig. 2.15, eq. 2.19, Tables 2.3–2.4, Fig. 2.16).
- §2.5.4 "Respective Motivations of IEEEfloat and Nfloat", pp. 55–56 (the memory-vs-pipeline argument; $x-y=0\Leftrightarrow x=y$; radix and base $B=\beta=2$).
- §2.5.1 "The IEEE 754 Standard", pp. 49–52 (bias, implicit bit, the monotone-integer-comparison rationale, p. 51).
- §2.6 "Logarithmic Number Systems", pp. 56–57 (the $w_E+w_F+3$ width shared with LNS, eq. 2.20).
