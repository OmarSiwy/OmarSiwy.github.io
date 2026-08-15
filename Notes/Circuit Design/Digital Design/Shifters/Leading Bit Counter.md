---
title: Leading Bit Counter
description: "LZC generalised with a runtime input b naming the bit value to count (the leading one counter is the b=1 case); one extra XOR layer, paid for with the fanout of b — which is why the book keeps LZC, LOC and LBC as three components."
kind: circuit
source: "ASA §10.2 and §10.3, pp. 316-323"
status: seed
spade: simulated
tags: [digital, shifters, lzc, normalizer]
aliases:
  - LBC
  - Leading Bit Counters
  - Leading One Counter
  - LOC
  - Leading Sign Bit Counter
---

# Leading Bit Counter

A leading bit counter returns the length of the leading run of $X$ made of a bit value $b$ that is an *input* rather than a generator parameter, which makes it the single circuit that specialises to both the leading zero counter and the leading one counter.

```tikz title="LZC, LOC and LBC interfaces, and the XOR layer that turns an LZC into an LBC"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize, >=latex,
  blk/.style={draw,fill=black!5,rounded corners=1.5pt,minimum width=15mm,minimum height=8mm,inner sep=2pt},
  wide/.style={draw,fill=black!5,rounded corners=1.5pt,minimum width=46mm,minimum height=8mm,inner sep=2pt},
  w/.style={font=\scriptsize,inner sep=1.2pt}
]

% ================= top row : the three interfaces (Fig. 10.8) =================
\node at (-4.4,6.6) {$X$};
\draw[->] (-4.4,6.4) -- node[w,right]{$w_X$} (-4.4,5.75);
\node[blk] (lzc) at (-4.4,5.35) {LZC};
\draw[->] (-4.4,4.95) -- node[w,right]{$w_C$} (-4.4,4.3);
\node at (-4.4,4.1) {$C$};

\node at (0,6.6) {$X$};
\draw[->] (0,6.4) -- node[w,right]{$w_X$} (0,5.75);
\node[blk] (loc) at (0,5.35) {LOC};
\draw[->] (0,4.95) -- node[w,right]{$w_C$} (0,4.3);
\node at (0,4.1) {$C$};

\node at (4.4,6.6) {$X$};
\draw[->] (4.4,6.4) -- node[w,right]{$w_X$} (4.4,5.75);
\node[blk] (lbc) at (4.4,5.35) {LBC};
\draw[->] (4.4,4.95) -- node[w,right]{$w_C$} (4.4,4.3);
\node at (4.4,4.1) {$C$};
\node at (2.6,6.6) {$b$};
\draw[->] (2.6,6.4) -- (2.6,5.35) -- node[w,above]{$1$} (lbc.west);

\node[w] at (-4.4,3.75) {count leading 0s};
\node[w] at (0,3.75) {count leading 1s};
\node[w] at (4.4,3.75) {count leading $b$s};

\draw[dashed,black!45] (-6.6,3.35) -- (6.6,3.35);

% ================= bottom : what the b input actually costs =================
\node at (-1.2,2.85) {$X$};
\draw[->] (-1.2,2.65) -- node[w,right]{$w_X$} (-1.2,2.05);
\node[wide] (xr) at (-1.2,1.65) {$X\oplus b^{\,w_X}$ \ \ ($w_X$ XOR gates)};
\node at (-6.5,1.65) {$b$};
\draw[->] (-6.2,1.65) -- (xr.west);
\node[w] at (-4.85,1.85) {$1$};
\node[w] at (-4.85,1.42) {fanout $w_X$};
\draw[->] (-1.2,1.25) -- node[w,right]{$w_X$} node[w,left]{$X'$} (-1.2,0.55);
\node[wide] (core) at (-1.2,0.15) {LZC core ($w_X$ bits)};
\draw[dotted,black!55] (-3.9,2.12) rectangle (1.5,-0.55);
\draw[->] (-1.2,-0.25) -- (-1.2,-1.05);
\node[w,anchor=west] at (-1.1,-0.85) {$w_C=\lceil\log_2(w_X{+}1)\rceil$};
\node at (-1.2,-1.28) {$C$};
\node[w,anchor=west] at (-3.85,-0.85) {LBC};

% one bit slice, drawn as a gate
\node[xor port] (g) at (4.6,1.5) {};
\draw (g.in 1) -- ++(-0.75,0) node[w,left]{$x_i$};
\draw (g.in 2) -- ++(-0.75,0) node[w,left]{$b$};
\draw (g.out) -- ++(0.5,0) node[w,right]{$x_i\oplus b$};
\node[w,align=left,anchor=north west] at (2.75,0.8)
  {one bit slice: $b{=}0$ passes $x_i$,\\ $b{=}1$ inverts it, so LBC$(X,0)$\\ is the LZC and LBC$(X,1)$ is the LOC};
\end{circuitikz}
\end{document}
```

*Top row after Fig. 10.8, p. 318; the expansion below is this note's construction.*

**Collapse the whole family into one identity.** Write $X=x_{w_X-1}\dots x_0$ on $w_X$ bits and let $b$ be one bit. The LBC returns
$$C=\min\{\,n : x_{w_X-1-n}\neq b\,\}$$
with $C=w_X$ when no such $n$ exists. Now apply the defining property of XOR — $u\oplus v=0\iff u=v$ — bitwise, and set $X'=X\oplus b^{w_X}$ where $b^{w_X}$ denotes $b$ replicated $w_X$ times. Then $x'_i=0\iff x_i=b$, so the leading run of $b$s in $X$ is precisely the leading run of zeroes in $X'$, position for position. The leading bit counter is therefore an LZC with a $w_X$-wide XOR row bolted to its input, and *nothing else changes*: the count is the same integer on the same $w_C=\lceil\log_2(w_X+1)\rceil$ bits, and $C=w_X$ still means "degenerate input" — all-zero for the LZC, all-$b$ here. Setting $b=0$ makes the row the identity (the LZC), setting $b=1$ makes it a complement (the LOC), which is the sense in which the LBC "generalises the two others" (p. 316).

**The area the identity adds is one gate per input bit, and it is not negligible.** The XOR row is $w_X$ two-input gates at one gate delay. Measure that against the counter it feeds. The naive architecture of an LZC costs $w_X-w_C$ 1-bit multiplexers and the same number of 2-input NOR gates ([[Leading Zero Counters]]), so the XOR row is very nearly a *third* gate of every kind — order 50% more cells for a circuit that was already only linear in $w_X$. The [[Oklobdzija LZC Tree]] is dearer, just under $2w_X$ bit-level multiplexers plus $w_X$ AND gates, so the same row is proportionally cheaper there but still real silicon. This is the mundane half of "slightly higher architectural cost"; the interesting half is below.

> [!warning] The book gives no quantitative cost for the LBC
> §10.2 states only that the LBC "has a slightly higher architectural cost due to the fanout of $b$; therefore it is better to distinguish these three components" (p. 316), then develops every area and delay figure for the LZC alone. The gate counts compared above are this note's arithmetic on the LZC figures of pp. 319–321, not the authors'. No measured LUT count, delay or area ratio for an LBC appears anywhere in Chapter 10.

**Fanout, not area, is what the extra input really costs, and it is a delay charge.** $b$ drives $w_X$ gate inputs. A single driver's delay grows with its capacitive load, so past a few tens of loads the signal has to be buffered, and a buffer tree of branching factor $f$ over $w_X$ sinks has depth $\lceil\log_f w_X\rceil$. Whether that matters depends entirely on the counter behind it. The naive LZC has delay $d_k=k+d_{k-1}$, hence $d_{w_C}=w_C(w_C+1)/2=O(\log^2 w_X)$ — a couple of buffer levels vanish into that. The logarithmic architectures have total delay $O(\log_2 w_X)$ *counted in gate levels*, so a $\lceil\log_4 w_X\rceil$-deep buffer tree in front of them is a constant-factor penalty of the same order as the entire counter. Worse, those two architectures are already spending structure to fight fanout: Oklobdzija's construction has the known weakness that $z_L$ drives a whole $k$-bit-wide multiplexer, and the [[Monotonic String Leading Zero Counter]] exists partly because a [[Kogge-Stone Tree]] caps prefix fanout at 2. Injecting a fresh signal with fanout $w_X$ at the input undoes exactly the property those designs were bought for. Hence three separate components rather than one parameterised block: when $b$ is known at generation time the row and its buffer tree should not exist at all.

**Folding the XOR into the first level moves the cost but does not remove it.** Nothing forces a separate row. In the naive architecture the level-$k$ primitive is $\mathrm{NOR}(X_H)$, i.e. "is this half all zeroes"; replace it with "is this half all $b$" and you have an equality detector, $\mathrm{NOR}(X_H\oplus b^{2^{k-1}})$. In the monotonic-string form the prefix-OR runs over $x_i\neq b$ instead of $x_i$. Either way the same $w_X$ XORs appear, just merged one level earlier, and the fanout of $b$ is unchanged — it is a property of the *function*, since every input bit's contribution depends on $b$. On an [[FPGAs|FPGA]] the merge is nonetheless close to free in area: a leaf cell computing a $k$-input function of $X$ becomes a $(k{+}1)$-input function of $X$ and $b$, and while $k+1\le 6$ that is still exactly one [[Lookup-Tables|LUT]]. The routing fanout of $b$ remains, and on an FPGA that is where the delay lives anyway. On ASIC the XOR is a real cell and the merge only saves the separate drive stage.

**When $b$ is a late signal, stop generalising and duplicate instead.** The XOR row sits *in front of* the counter, so its delay plus the buffer tree is added to a path that already ends at $C$. If $b$ is a data-dependent signal — a mode bit out of a decoder, the sign of the very word being normalised — that addition is on the critical path. The alternative is to keep both specialised counters, run an LZC and an LOC on the same $X$ in parallel, and select between the two counts with $b$:
$$C=\big(b\wedge C_{\mathrm{LOC}}\big)\vee\big(\bar b\wedge C_{\mathrm{LZC}}\big)$$
Delay becomes $D_{\mathrm{LZC}}+1$ multiplexer level with $b$ arriving as late as it likes, and its fanout drops from $w_X$ to $w_C=O(\log w_X)$ — an exponential reduction in load, for the price of a second counter. The two designs bracket the trade honestly: the XOR form pays $w_X$ gates and $w_X$ fanout to save a counter; the mux form pays a counter to save both. Above the widths where a counter is cheap ($w_X\le 16$ or so) and when $b$ is late, the duplicate wins.

**Padding an odd width must use $\bar b$, not ones.** The recurrences behind every LZC want $w_X=2^k-1$ (naive) or $2^k$ (Oklobdzija). For any other width the fix is to take $w_C=\lceil\log_2(w_X+1)\rceil$ and pad $X$ on the right, with **ones** for an LZC, so that an all-zero input saturates at $C=w_X$ instead of running past the end (p. 319). Push that through the identity: padding $X'=X\oplus b^{w_X}$ with ones is padding $X$ with $\bar b$. Hard-code the pad to 1 and the LBC is correct for $b=0$ and silently wrong for $b=1$ on precisely the all-ones input — a corner case no symmetric test vector reaches.

**Tying $b$ to the sign bit gives the leading *sign* counter, which is why this circuit exists at all.** A [[Normalizers|normalizer]] for a sign/magnitude significand counts leading zeroes, but a two's-complement significand — as posit-style [[Floating-Point Formats|floating-point formats]] use — must count leading copies of the sign, because $\mathrm{sext}$ prefixes carry no information ([[Fixed-Point Representations]], [[Number Formats]]). That is the LBC with $b:=x_{w_X-1}$ wired internally, and it is the reason the generic normalizer's fourth parameter is *what to count*: 0s, 1s, or the sign bit $s$ (Fig. 10.14, p. 323). Two consequences follow from $b$ being internal. First, the XOR row is unavoidable — there is no generation-time specialisation to fall back on — and $b$ is a fanned-out data signal by construction. Second, the useful shift distance is $C-1$, not $C$: one copy of the sign has to survive or the shifted word changes value, so the count feeding the shifter is one less than the count of leading sign bits, and $C\ge 1$ always holds because $x_{w_X-1}=b$ by definition.

$$\boxed{\ \mathrm{LBC}(X,b)=\mathrm{LZC}\!\big(X\oplus b^{\,w_X}\big),\qquad \Delta\text{area}=w_X\ \text{XOR},\quad \Delta\text{delay}=1+\lceil\log_f w_X\rceil,\quad \mathrm{fanout}(b)=w_X\ }$$

**When it breaks.**

- **$b$ is a constant.** Then the whole row folds away at synthesis and you have paid a generator parameter for nothing — instantiate an LZC or an LOC. This is the book's own reason for keeping three components.
- **$b$ is late.** The XOR row is upstream of everything, so its delay is unhideable. Use the parallel LZC+LOC with a $w_C$-wide output mux instead.
- **Large $w_X$.** The $O(\log^2 w_X)$ naive counter absorbs the buffer tree; a logarithmic counter does not, and the constant factor can eat the asymptotic advantage that motivated it.
- **Odd widths.** Pad with $\bar b$. Padding with 1 unconditionally is correct only for $b=0$.
- **Fusion with a shifter.** The [[Fused Normalizer]] trick works because the naive counter emits $c_j$ MSB-first, in the order a left shifter consumes them; the XOR row is upstream of that pipeline and does not disturb it, so an LBC-normalizer fuses exactly as an LZC-normalizer does. The logarithmic counters still cannot fuse, with or without $b$.
- **Anticipation.** [[Leading Zero Anticipation]] predicts the count from the *addends*, before the sum exists. Its predictor is derived for a specific comparison of the two operands; there is no free "anticipate leading $b$s" by XOR-ing an input, because $b$ would have to be XOR-ed into a sum that has not been formed.

**RTL (Spade).**

```spade
/// Count the leading zeroes of a bit array given MSB-first (element 0 = MSB).
fn clz<#uint N, #uint CW>(x: [bool; N]) -> uint<CW> {
    gen if N == 0 {
        0
    } else {
        if x[0] {
            0
        } else {
            let rest: uint<CW> = clz::<{N - 1}, CW>(x[1..N]);
            trunc(rest + 1)
        }
    }
}

/// Replicate b into a W-bit mask.
fn splat<#uint W>(b: bool) -> uint<W> {
    [b; W].as_uint()
}

/// Leading bit counter: number of leading bits of X equal to b.
fn lbc<#uint W, #uint CW>(x: uint<W>, b: bool) -> uint<CW> {
    clz::<W, CW>((x ^ splat::<W>(b)).as_bits().reversed())
}
```

`splat::<W>(b)` is the $b$ bus of the drawing and `x ^ splat::<W>(b)` is the XOR row, one line for what costs $w_X$ gates; `clz` is the "LZC core" box. Widths: `x` is $w_X=W$ bits, `b` is 1 bit, and the result is $w_C=CW$ bits, which must satisfy $2^{CW}>W$ — at $W=16$, $CW=5$, since $C=16$ is reachable. Everything is combinational: no `reg`, no clock port, and `gen if` unrolls `clz` at elaboration into a $W$-deep priority chain. Two things synthesis does differently from the drawing: that chain is the *linear* association of the counter, so the tool will restructure it into whatever its own timing model prefers rather than into the tree of a sibling note; and `[b; W]` lowers to a Verilog replication of one net, so the fanout this note charges for only materialises after place-and-route, never in the RTL.

> [!warning] `sext` of a 1-bit signed value emits illegal Verilog
> The natural way to write `splat` — `let m: int<W> = sext(b.as_uint().as_int()); m.as_uint()` — compiles cleanly under `spade 0.19.0` and emits `assign m = {{15{_e[0]}}, _e};` where `_e` was declared as a scalar `wire`. `iverilog -g2012` rejects it: *"can not select part of scalar"*. Array replication `[b; W].as_uint()` produces correct Verilog and is what is used above. A block that only passes the Spade compiler would have shipped this.

Simulated against a behavioural leading-$b$-run reference: 12 named vectors — including the asymmetric pairs $(\texttt{0x0001},b{=}0)\to15$ against $(\texttt{0x0001},b{=}1)\to0$, both saturating cases $(\texttt{0x0000},0)\to16$ and $(\texttt{0xFFFF},1)\to16$, and Fig. 10.12's example word `0000010011011001` with its complement, both giving 5 — plus 3000 random $(X,b)$ pairs. 3012 vectors, all pass.

**Related Notes.**

- [[Leading Zero Counters]] – extends: the $b=0$ case and the source of every recurrence, cost and delay figure this note perturbs.
- [[Oklobdzija LZC Tree]] – depends-on: the logarithmic core whose fanout weakness the $b$ input makes worse.
- [[Monotonic String Leading Zero Counter]] – depends-on: the prefix-OR form, which adapts to LBC by running the prefix over $x_i\neq b$ rather than $x_i$.
- [[Normalizers]] – supports: the consumer that makes "what to count" a generator parameter in the first place.
- [[Fused Normalizer]] – extends: the XOR row is upstream of the fused count-and-shift levels, so fusion is unaffected.
- [[Leading Zero Anticipation]] – counter-example: predicts the count before the word exists, which the XOR-at-the-input trick cannot follow.
- [[Floating-Point Formats]] – depends-on: two's-complement significands are why a leading *sign* counter is needed at all.
- [[Fixed-Point Representations]] – supports: the sign-extension prefix that carries no information and must be counted, not stored.
- [[Choosing a Shifter]] – compares: where the counted-and-shifted variants sit against the plain shifters.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 10 "Shifters and Leading Bit Counters":

- §10.2 intro, p. 316 — LZC/LOD, LOC and LBC defined; the $b$ input, the fanout remark, and the decision to keep three components.
- Fig. 10.8, p. 318 — the three interfaces; the top row above is redrawn from it.
- §10.2.1, pp. 318–319 — the naive recurrence, its $w_X-w_C$ muxes and NORs, and the pad-with-ones rule for widths that are not $2^k-1$.
- §10.2.2.1, pp. 320–321 — Oklobdzija's tree, its just-under-$2w_X$ multiplexers, and the fanout caveat on the multiplexer select.
- §10.2.2.2, pp. 321–322 — monotonic string conversion, its Kogge-Stone prefix-OR, and the sentence that it "is easily adapted to LOC or LBC".
- §10.3, p. 323 and Fig. 10.14 — normalizers for two's-complement significands, and *what to count* (0s, 1s, sign bit $s$) as the generator's fourth parameter.

> [!warning] PDF page offset in this file is not constant
> The brief states PDF page = printed page + 22 (verified at PDF 129 = printed 107). In Chapter 10 the offset is **+19**: PDF 335 renders printed 316, PDF 337 renders printed 318. Every page cited above was read at the +19 offset with the printed folio checked on the rendered page. This matches the offset already recorded in [[Barrel Shifters]].
