---
title: "Fused Add-Subtract Unit"
description: "X+Y and X-Y from one operand decode and one alignment shifter: a 3-path architecture (one close, two far) instead of two whole adders."
kind: circuit
source: "ASA §15.5, p. 469; §11.1.4, pp. 340-342"
status: seed
spade: simulated
tags: [digital, floating-point, adder, fft, specialization, fpga]
aliases:
  - Fused Add-Subtract
  - Combined Floating-Point Sum and Difference
  - Fused Floating-Point Add-Subtract
---

# Fused Add-Subtract Unit

A floating-point operator that emits $X+Y$ and $X-Y$ from a single unpack and a single alignment shifter, exploiting the fact that the two results can never both be effective subtractions and therefore need only one close path between them.

```tikz title="Fused add-subtract unit: shared unpack and alignment shifter feeding one close path and two far paths, steered to two rounding adders"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=stealth]
% ---------------- shared front end ----------------
\node[draw,thick,fill=black!8,minimum width=12.4cm,minimum height=0.9cm] (top) at (0.3,8.4)
  {unpack \& exception handling, exponent difference $d=|E_X-E_Y|$ \& swap};
\draw[<-] ([xshift=-15mm]top.north) -- ++(0,0.8) node[above,font=\small]{$X$};
\draw[<-] ([xshift=15mm]top.north) -- ++(0,0.8) node[above,font=\small]{$Y$};
\node[font=\tiny,anchor=east] at (-1.35,9.2) {$1{+}w_E{+}w_F$};
\node[font=\tiny,anchor=west] at (1.95,9.2) {$1{+}w_E{+}w_F$};
% ---------------- the one alignment shifter ----------------
\node[draw,thick,fill=black!8,minimum width=5.2cm,minimum height=0.75cm] (sh) at (2.6,6.9)
  {alignment shift $\gg d$ \ (shared)};
\draw[->] (2.6,7.95) -- node[right,font=\tiny]{$M_Y$: $w_F{+}1$} (sh.north);
\draw[->] (5.9,7.95) -- node[right,font=\tiny,pos=0.55]{$\lceil\log_2(w_F{+}2)\rceil$} (5.9,6.9) -- (sh.east);
% ---------------- close path (one only) ----------------
\node[font=\tiny,anchor=east] at (-5.05,7.5) {\textbf{close path} ($d<2$) --- one};
\node[draw,minimum width=3.0cm,minimum height=0.75cm] (c1) at (-4.6,6.9) {$\gg$ 0 or 1 bit};
\node[draw,minimum width=3.0cm,minimum height=0.75cm] (c2) at (-4.6,5.4) {$|M_X-M_{Y_\mathrm{a}}|$};
\node[draw,minimum width=3.0cm,minimum height=1.05cm,align=center] (c3) at (-4.6,3.85)
  {LZC $+$ $(w_F{+}1)$-bit\\left normalizer};
\draw[->] (-4.6,7.95) -- (c1.north);
\draw[->] (c1.south) -- node[right,font=\tiny]{$w_F{+}1$} (c2.north);
\draw[->] (c2.south) -- node[right,font=\tiny]{$w_F{+}1$} (c3.north);
% ---------------- far path A: effective addition ----------------
\node[font=\tiny,anchor=east] at (-1.25,5.4) {\textbf{far} $+$};
\node[draw,minimum width=3.0cm,minimum height=0.75cm] (fa) at (0.4,5.4) {$M_X+M_{Y_\mathrm{a}}$};
\node[draw,minimum width=3.0cm,minimum height=0.75cm] (fa2) at (0.4,3.95) {1-bit right shift};
\draw[->] (sh.south) -- (2.6,6.0) -| node[above,font=\tiny,pos=0.25]{$M_{Y_\mathrm{a}}$: $w_F{+}3$} (fa.north);
\draw[->] (fa.south) -- node[right,font=\tiny]{$w_F{+}4$} (fa2.north);
% ---------------- far path B: effective subtraction ----------------
\node[font=\tiny,anchor=west] at (6.5,5.4) {\textbf{far} $-$};
\node[draw,minimum width=3.0cm,minimum height=0.75cm] (fb) at (4.9,5.4) {$M_X-M_{Y_\mathrm{a}}$};
\node[draw,minimum width=3.0cm,minimum height=0.75cm] (fb2) at (4.9,3.95) {$\le 2$-bit left shift};
\draw[->] (sh.south) -- (2.6,6.0) -| (fb.north);
\draw[->] (fb.south) -- node[right,font=\tiny]{$w_F{+}4$} (fb2.north);
% ---------------- exponent ----------------
\node[draw,minimum width=2.4cm,minimum height=0.9cm,align=center] (e1) at (-7.7,5.4)
  {exponent\\update ($\times 2$)};
\draw[->] (-5.9,7.95) -- (-7.7,7.95) -- node[left,font=\tiny]{$w_E{+}1$} (e1.north);
% ---------------- steering ----------------
\node[draw,thick,minimum width=12.4cm,minimum height=0.85cm] (st) at (0.3,2.15)
  {result steering: $\mathrm{eop}_+ = s_X \oplus s_Y$ decides which output the close path serves};
\draw[->] (c3.south) -- node[right,font=\tiny]{$w_F{+}1$} (-4.6,2.575);
\draw[->] (fa2.south) -- node[right,font=\tiny]{$w_F{+}1$} (0.4,2.575);
\draw[->] (fb2.south) -- node[right,font=\tiny]{$w_F{+}1$} (4.9,2.575);
\draw[->] (e1.south) -- (-7.7,2.15) -- node[above,font=\tiny,pos=0.35]{$w_E{+}2$} (st.west);
% ---------------- rounding + pack, two of them ----------------
\node[draw,minimum width=4.6cm,minimum height=0.9cm,align=center] (rp) at (-3.0,0.75)
  {rounding adder,\\exception handling \& pack};
\node[draw,minimum width=4.6cm,minimum height=0.9cm,align=center] (rm) at (3.6,0.75)
  {rounding adder,\\exception handling \& pack};
\draw[->] (-3.0,1.725) -- node[right,font=\tiny]{$w_E{+}2{+}w_F$} (rp.north);
\draw[->] (3.6,1.725) -- node[right,font=\tiny]{$w_E{+}2{+}w_F$} (rm.north);
\draw[->] (rp.south) -- ++(0,-0.75) node[below,font=\small]{$R_+ = X+Y$};
\draw[->] (rm.south) -- ++(0,-0.75) node[below,font=\small]{$R_- = X-Y$};
\node[font=\tiny,anchor=west] at (-2.9,-0.15) {$1{+}w_E{+}w_F$};
\node[font=\tiny,anchor=west] at (3.7,-0.15) {$1{+}w_E{+}w_F$};
% ---------------- legend ----------------
\node[draw,thick,fill=black!8,minimum width=0.45cm,minimum height=0.28cm] (lg) at (-7.5,0.75) {};
\node[font=\tiny,anchor=west] at (-7.2,0.75) {computed once};
\node[font=\tiny,anchor=north west,align=left] at (-8.9,-0.35)
  {3 paths, 1 alignment shifter, 1 LZC ---\\against 4 paths and 2 shifters\\for two independent adders.};
\end{circuitikz}
\end{document}
```

*after Fig. 11.6, p. 341, restructured per §15.5, p. 469*

**Establish what the two operations cannot help but share.** Inputs $X,Y$ arrive in a $(1{+}w_E{+}w_F)$-bit format ([[Number Formats]]) and unpack to $(s_X,E_X,M_X)$ and $(s_Y,E_Y,M_Y)$ with significands $M\in[1,2)$ on $w_F{+}1$ bits. After the swap that enforces $E_X\ge E_Y$, the alignment distance is $d=E_X-E_Y$, saturated to $w_F{+}2$ so that a hopeless shift simply flushes $M_Y$ to zero (p. 337), and carried on $\lceil\log_2(w_F{+}2)\rceil$ bits. The decisive observation is that $d$ and the aligned significand $M_{Y_\mathrm{a}}=M_Y\gg d$ — $w_F{+}3$ bits once guard, round and sticky are appended — depend on the *magnitudes* of $X$ and $Y$ only. Negating $Y$ flips $s_Y$ and nothing else, so $X+Y$ and $X-Y$ present the alignment shifter with bit-identical work. One unpack, one exponent subtracter, one swap network and one barrel shifter ([[Barrel Shifters]]) therefore serve both results.

**Turn the effective operation into a single XOR, then observe that the two results disagree on it.** The significand datapath does not care about $s_X$ and $s_Y$ individually, only whether the aligned significands are to be added or subtracted. That predicate — the *effective operation* — is $\mathrm{eop}=1$ (subtract) exactly when the operands carry opposite signs, i.e. $\mathrm{eop}_+=s_X\oplus s_Y$ for $X+Y$. Writing $X-Y=X+(-Y)$ replaces $s_Y$ by $\overline{s_Y}$, and by the XOR complement identity $a\oplus\bar b=\overline{a\oplus b}$,

$$\mathrm{eop}_- \;=\; s_X\oplus\overline{s_Y} \;=\; \overline{s_X\oplus s_Y} \;=\; \overline{\mathrm{eop}_+}.$$

The two effective operations are complements of each other. Whatever the input signs, one of $X+Y$ and $X-Y$ is an effective addition of significands and the other is an effective subtraction — never both, never neither. The book states this as "at most one of the operations may be an effective subtraction" (p. 469); for two nonzero normal operands it is exactly one, and the weaker phrasing is what covers zeros and infinities, whose results are produced by the exception logic rather than by the significand paths at all.

**Recall which case actually needs the expensive hardware.** Let $S=M_X\pm 2^{-d}M_Y$ be the aligned significand result before normalization. An effective addition gives $S\in[1,4)$: at most a 1-bit right shift. An effective subtraction with $d\ge2$ gives $S>1-2^{-2}\cdot2=\tfrac12$: at most a 1-bit left shift, so a fixed 2-bit normalizer covers it. Only an effective subtraction with $d\in\{0,1\}$ can cancel down to $2^{-w_F}$, and only that case needs a leading-zero counter of $\lceil\log_2(w_F{+}1)\rceil$ levels followed by a full $(w_F{+}1)$-bit left normalizer ([[Shifters]]). That is the *close path* of the [[Dual-Path Floating-Point Adder]]; everything else is a *far path*.

**Compose the two facts.** The close path is claimed by a result only if that result is an effective subtraction *and* $d<2$. Since at most one result is an effective subtraction, at most one result can ever claim the close path — so one LZC and one left normalizer suffice for the pair, and a mux steers their output to whichever of $R_+$, $R_-$ is currently the subtraction. The far paths do not collapse the same way: when $d\ge2$ neither result is close, so both need a far path simultaneously, and their significand adders compute genuinely different values, $M_X+M_{Y_\mathrm{a}}$ and $M_X-M_{Y_\mathrm{a}}$. Three paths, not four; one shifter, not two.

> [!note] Read the architecture as two adders of different species, not as two halves of one
> The far$-$/close pair is a complete [[Dual-Path Floating-Point Adder]] and produces whichever result is the effective subtraction. The far$+$ path alone is exactly the [[Positive-Term Floating-Point Adder]] of §15.4 — the adder you are allowed to build when cancellation is impossible — and produces the effective addition. Fusion is then just: build one of each, share their front end, and let $\mathrm{eop}_+$ decide at runtime which output port each one drives. That is why the path count is 3 and the shifter count is 1.

**Account for what is actually saved and what is not.** Against two independent floating-point adders, the fused unit deletes one unpack/exception decode, one exponent subtracter and swap network, one $\lceil\log_2(w_F{+}2)\rceil$-level alignment barrel shifter on $w_F{+}3$ bits, one LZC, one $(w_F{+}1)$-bit left normalizer and one path-select multiplexer. It pays for a steering layer: two $(w_F{+}1)$-bit 2:1 muxes on the significands plus the corresponding exponent and sign steering. What it does *not* save is the back end — two results still need two rounding adders and two pack blocks, on $w_E{+}2{+}w_F$ bits each, and the two exponent updates differ because only one of them absorbs the close path's shift amount $\lambda$.

> [!warning] The book gives no area figure for the 3-path architecture — needs outside research
> §15.4 quantifies the *positive-terms* specialization at about 1/3 of a generic floating-point adder [Som+20], p. 468. §15.5 quantifies nothing; it states the structure and cites [TDX12], p. 469. Do not carry the 1/3 across — it measures a different circuit.

**Weigh the sharing differently on FPGA than on ASIC.** The block that gets shared is the alignment shifter, and its cost is $\lceil\log_2(w_F{+}2)\rceil$ levels of routing-heavy multiplexing on $w_F{+}3$ bits — pure LUT and pure interconnect on an FPGA ([[FPGAs]]), where the significand adders it sits beside ride the hard carry chain and are close to free per bit. So on FPGA the fusion shares the expensive object and duplicates the cheap one, which is the right way round; on ASIC, where a $(w_F{+}4)$-bit adder is not obviously cheaper than a barrel shifter, the balance is less lopsided. The counterweight is that the added steering muxes cost a LUT per bit on FPGA while on ASIC a 2:1 mux is a few transistors — some of the FPGA gain is handed straight back at the steering layer.

$$\boxed{\ \mathrm{eop}_-=\overline{\mathrm{eop}_+}\ \Longrightarrow\ \#\text{close}=1,\quad \#\text{far}=2,\quad \#\text{alignment shifters}=1\ }$$

**When it breaks.**

- **Only one result consumed.** The whole saving is conditional on the datapath wanting both $X+Y$ and $X-Y$ from the *same* pair. The FFT butterfly is the canonical case ([[Fast Convolution Algorithms]]); a generic adder called twice on unrelated operands shares nothing.
- **It is an area optimization, not a latency one.** The critical path still runs unpack → align → add → normalize → round, and the steering muxes add a level to it. Quoting the fusion as a speed-up is wrong.
- **Small $w_F$ erodes the win.** The shared shifter costs $\Theta(w_F\log w_F)$ while the steering overhead is $\Theta(w_F)$ with a fixed control term; at bfloat16 widths the shifter is only a few levels deep and there is little left to share, whereas at binary64 the shifter is the dominant shared block.
- **Zero, infinity and NaN operands.** The complementarity argument is about the significand datapath. Special values bypass it, which is why the source hedges to "at most one" — the exception logic must still resolve $\pm0$ signs independently for the two results, and $X-Y$ with $X=Y$ must give $+0$ under round-to-nearest while $X+Y$ does not.
- **Subnormal support inflates exactly what was not shared.** Input subnormals are absorbed by the shared unpack at almost no cost (p. 340), but output denormalization and the saturation of $\lambda$ live per result, so the growth lands entirely on the duplicated exponent datapath.
- **Pipelining couples the two results.** A shared front end forces both results to be produced in the same stage; if the consumer wants $X+Y$ early and $X-Y$ late, fusion costs balancing registers that can outweigh the shared shifter.

**RTL (Spade).** The shared shifter, the two far adders and the steering, with the close-path claim computed as a predicate:

```spade
entity fused_addsub<#uint W, #uint K>(
    mx: uint<W>,        // larger significand, post-swap
    my: uint<W>,        // smaller significand, post-swap
    d: uint<K>,         // saturated exponent difference
    sx: bool,
    sy: bool,
) -> (uint<{W + 1}>, uint<{W + 1}>, bool, bool) {
    let ds: uint<W> = zext(d);
    let mya = my >> ds;              // the ONE alignment shifter
    let sum = mx + mya;              // far +
    let diff = mx - mya;             // far - / close
    let sub_is_plus = sx ^^ sy;      // eop_+ : X+Y is the effective subtraction
    let close = d < 2;
    (
        if sub_is_plus { diff } else { sum },   // R_+
        if sub_is_plus { sum } else { diff },   // R_-
        sub_is_plus && close,                   // R_+ claims the close path
        !sub_is_plus && close                   // R_- claims the close path
    )
}
```

`mya` is the shared shifter's output $M_{Y_\mathrm{a}}$; `sum` and `diff` are the two far-path significand adders, each widening $W\to W{+}1$ as `+` and `-` do in Spade. The two `if` expressions are the steering block, and the last two outputs are the close-path claim, whose conjunction is provably zero — the exclusivity theorem, asserted over the whole random sweep. The block is purely combinational: a real operator registers after the shifter, and the drawn steering box synthesizes not as one wide block but as $2(W{+}1)$ distributed 2:1 muxes. Omitted deliberately: the swap (the entity assumes $M_X\ge M_{Y_\mathrm{a}}$), the close path's LZC and left normalizer, and the rounding adders.

**Related Notes.**

- [[Dual-Path Floating-Point Adder]] – extends: the fused unit is this architecture with its close path shared between two results and steered by $\mathrm{eop}_+$.
- [[Positive-Term Floating-Point Adder]] – supports: the far-only adder that the effective-addition half of the pair reduces to.
- [[Barrel Shifters]] – depends-on: the alignment shifter is the block whose duplication the fusion avoids, and its depth sets the size of the win.
- [[Fast Convolution Algorithms]] – supports: the FFT butterfly is the application that needs both $X+Y$ and $X-Y$ from one operand pair.
- [[Fused Multiply-Add]] – compares: fusion for accuracy (one rounding instead of two) against fusion for area (one shifter instead of two).
- [[Fused Sum of Squares]] – compares: another fused operator whose saving comes from a sign guarantee rather than from operand sharing.
- [[Choosing a Specialized Floating-Point Operator]] – compares: where this sits against every other specialization in the chapter.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §15.5 "Combined Floating-Point Sum and Difference", p. 469 — the 3-path structure and [TDX12].
- §15.4 "Floating-Point Addition of Positive Terms", p. 468 — the far-path-only adder and its 1/3 figure [Som+20].
- §11.1.4 "Dual-Path Architectures and Other Speculative Techniques", pp. 340-342, Fig. 11.6 p. 341 — close/far split, path-select mux, leading-zero anticipation.
- §11.1.1-11.1.3, Fig. 11.5 p. 337 and pp. 337-340 — baseline adder, exponent-difference and LZC saturation, subnormal handling in unpack.
