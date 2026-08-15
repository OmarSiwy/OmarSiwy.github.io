---
title: "KCM, Table-Based Constant Multiplication"
description: "Tabulates the product of alpha-bit input chunks and sums them, giving cost linear in input width and flat in the constant's bit pattern."
kind: circuit
source: "ASA §12.2.2, pp. 384-385"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, kcm, lut, fpga, constant-multiplier]
aliases:
  - KCM
  - Ken Chapman's Multiplier
  - Ken Chapman Multiplier
  - Chapman Multiplier
  - Table-and-Addition KCM
  - KCM Multiplier
---

# KCM, Table-Based Constant Multiplication

Ken Chapman's Multiplier reads the input in radix $2^\alpha$, looks up each digit's product with the constant in a one-LUT-deep table, and sums the shifted lookups — the only constant multiplier whose cost is *linear* in the input width and *independent of the value* of the constant.

```tikz title="KCM datapath: an 18-bit input split into three 6-bit chunks, 18-bit constant, 36-bit product"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---- input word, split into D = 3 chunks of alpha = 6 -------------------
\node[draw,minimum width=9cm,minimum height=0.55cm] at (0,0) {};
\draw (-1.5,-0.275) -- (-1.5,0.275);
\draw ( 1.5,-0.275) -- ( 1.5,0.275);
\node[font=\tiny] at (-3.0,0) {$X_2=x_{17..12}$};
\node[font=\tiny] at ( 0.0,0) {$X_1=x_{11..6}$};
\node[font=\tiny] at ( 3.0,0) {$X_0=x_{5..0}$};
\node[left,font=\small] at (-4.7,0) {$X$};

% ---- one table per chunk -------------------------------------------------
\node[draw,minimum width=2.2cm,minimum height=0.7cm] at (-3.0,-1.5) {$T_2:CX_2$};
\node[draw,minimum width=2.2cm,minimum height=0.7cm] at ( 0.0,-1.5) {$T_1:CX_1$};
\node[draw,minimum width=2.2cm,minimum height=0.7cm] at ( 3.0,-1.5) {$T_0:CX_0$};
\foreach \c in {-3.0,0.0,3.0}{ \draw[->] (\c,-0.275) -- node[left,font=\tiny]{6} (\c,-1.15); }

% ---- rake of D-1 = 2 adders, each w_C = 18 bits wide ---------------------
\node[draw,minimum width=3.4cm,minimum height=0.7cm] at ( 1.5,-3.2) {$+$\ \ $w_C=18$};
\node[draw,minimum width=3.4cm,minimum height=0.7cm] at (-1.5,-5.0) {$+$\ \ $w_C=18$};

\draw[->] (2.4,-1.85) -- (2.4,-2.85) node[midway,left,font=\tiny]{18};
\draw[->] (3.75,-1.85) -- (3.75,-6.45) node[pos=0.55,right,font=\tiny]{6 final};
\draw[->] (0.6,-1.85) -- (0.6,-2.85) node[midway,left,font=\tiny]{24};
\draw[->] (0.0,-3.55) -- (0.0,-4.65) node[midway,left,font=\tiny]{18};
\draw[->] (2.25,-3.55) -- (2.25,-6.45) node[pos=0.45,right,font=\tiny]{6 final};
\draw[->] (-3.0,-1.85) -- (-3.0,-4.65) node[midway,left,font=\tiny]{24};
\draw[->] (-1.5,-5.35) -- (-1.5,-6.45) node[midway,left,font=\tiny]{24};

% ---- result word ---------------------------------------------------------
\node[draw,minimum width=9cm,minimum height=0.55cm] at (0,-6.75) {};
\draw (1.5,-7.025) -- (1.5,-6.475);
\draw (3.0,-7.025) -- (3.0,-6.475);
\node[font=\tiny] at (-1.5,-6.75) {$CX_{35..12}$};
\node[font=\tiny] at ( 2.25,-6.75) {$CX_{11..6}$};
\node[font=\tiny] at ( 3.75,-6.75) {$CX_{5..0}$};
\node[left,font=\small] at (-4.7,-6.75) {$CX$};
\node[font=\tiny,anchor=west] at (-4.7,-7.55)
  {$36=w_C+w_X$ result bits. Each rake carry is $\lfloor\text{sum}/2^{6}\rfloor<C$, hence $w_C=18$ bits, never wider.};
\node[font=\tiny,anchor=west] at (-4.7,-8.0)
  {Cost $=3\cdot(18{+}6)+2\cdot 18=108$ LUTs; depth $=$ 1 LUT $+$ 2 carry chains.};
\end{circuitikz}
\end{document}
```

*after Fig. 12.10, p. 384 — the book draws the single summation block; the rake is expanded here so the $w_C$-wide adders and the finished low bits are visible.*

**Split the input into LUT-sized digits.** The parameter $\alpha$ is not a design choice, it is the number of inputs of the target FPGA's architectural LUT — $4$ to $6$ on mainstream parts at the time of writing (see [[Lookup-Tables]]). Read the $w_X$-bit unsigned $X$ as a radix-$2^\alpha$ number with $D=\lceil w_X/\alpha\rceil$ digits:

$$X=\sum_{i=0}^{D-1}X_i\cdot(2^{\alpha})^{i},\qquad X_i\in\{0,\dots,2^{\alpha}-1\}\tag{12.13}$$

Each digit $X_i$ is a plain $\alpha$-bit slice of the input word, so the "decomposition" is free: it is wiring, not logic. With $\alpha=4$ this is exactly reading $X$ in hexadecimal.

**Distribute the constant over the digits.** Multiplying (12.13) by $C$ and applying **distributivity of $\times$ over $+$**, then commuting the constant inside each term:

$$CX=\sum_{i=0}^{D-1}CX_i\cdot 2^{\alpha i}\tag{12.14}$$

The whole method is that one rewriting. What was a product of two $w$-bit words is now $D$ products of a constant by an $\alpha$-bit word, plus a weighted sum — and the shifts $2^{\alpha i}$ are wires.

> [!warning] Two index errors around (12.13)-(12.14) in the printed text
> Equation (12.14) is printed with upper summation limit $\lceil w_X/\alpha\rceil$, where (12.13) correctly uses $\lceil w_X/\alpha\rceil-1$. The two sums range over the same digits, so (12.14) has one term too many; read both as $i=0\dots D-1$. Separately, the alignment panel of Fig. 12.10a labels its three rows $CX_0$, $2^{\alpha}CX_3$, $2^{2\alpha}CX_3$ — the second and third should be $CX_1$ and $CX_2$, as the architecture panel Fig. 12.10b correctly shows.

**Every subproduct is one LUT deep, whatever $C$ is.** $CX_i$ is a function of exactly $\alpha$ bits. Any Boolean function of $\alpha$ variables is by definition the truth table of one $\alpha$-input LUT, so **each output bit of $CX_i$ costs exactly one LUT and one LUT of delay** — no adder, no carry, and no dependence on the bit pattern of $C$. Since $0\le CX_i\le C(2^{\alpha}-1)<2^{w_C+\alpha}$, the subproduct is $w_C+\alpha$ bits wide and each table costs $w_C+\alpha$ LUTs. This is the same argument that makes a full [[Tabulated Constant Multiplier]] optimal for $w_X\le\alpha$; KCM's contribution is applying it $D$ times to slices instead of once to the whole word, trading $2^{w_X}$-sized tables for $D$ tables of $2^{\alpha}$ entries.

**Show that the accumulator never grows past $w_C$.** Sum (12.14) LSB-first with a *rake* of $D-1$ adders. Let $S_0=CX_0$ and, writing $A_k=\lfloor S_k/2^{\alpha}\rfloor$ for the part carried forward,

$$S_{k}=A_{k-1}+CX_{k},\qquad A_k=\left\lfloor \frac{S_k}{2^{\alpha}}\right\rfloor .$$

Nothing above stage $k$ can reach bit positions below $2^{\alpha}$ of $S_k$, so **the low $\alpha$ bits of every partial sum are final** and leave the datapath as result bits $\alpha k\ldots\alpha k+\alpha-1$. The width of what is carried follows by induction: $A_{-1}=0<C$, and if $A_{k-1}<C$ then

$$S_k<C+C(2^{\alpha}-1)=C\cdot 2^{\alpha}\ \Longrightarrow\ A_k=\lfloor S_k/2^{\alpha}\rfloor<C ,$$

so $A_k$ fits in $w_C$ bits at every stage. Each rake adder therefore has only $w_C$ bit positions where both operands are live; the $\alpha$ positions above are a carry increment on $CX_k$ alone, which is why the book counts $w_C$ per adder rather than $w_C+\alpha$. The final stage emits its whole $w_C+\alpha$ bits, and $(D-1)\alpha+w_C+\alpha=w_C+w_X$ checks the result width.

**Read the cost as two straight lines in $w_X$.** $D$ tables at $w_C+\alpha$ LUTs plus $D-1$ adders at $w_C$ LUTs gives the boxed count below. Two things about it matter more than its value. First it is **linear in $w_X$**, against the $2^{w_X-\alpha}$ of plain tabulation — that is the entire reason KCM exists. Second it does not contain $C$ at all: a constant needing $12$ adders in an optimal shift-and-add graph and one needing $2$ cost the same KCM. There is no NP-complete search ([[Minimum-Adder Constant Multiplier]]), no lucky-constant effect, and an area figure you can quote before the constant is known — though backend logic optimisers will still compress the tables, so measured area lands at or below the formula and does creep back towards being constant-dependent.

**Worked count, $C=683$, $w_X=8$, $\alpha=4$.** $683=1010101011_2$ so $w_C=10$, and $D=\lceil 8/4\rceil=2$ with $X_0=x_{3..0}$, $X_1=x_{7..4}$. Two $16$-entry tables of $10+4=14$ LUTs each (the largest entry is $683\cdot 15=10245<2^{14}$), one $10$-bit rake adder: $2\cdot 14+1\cdot 10=38$ LUTs, one LUT plus one carry chain deep. Every shift-and-add graph for this constant needs at least four adders and $\approx46$ full-adder equivalents at depth $3$ ([[Minimum-Adder Constant Multiplier]]), so KCM wins on both axes here — and would cost the same $38$ LUTs for any other $10$-bit constant, including the ones for which no clever graph exists.

**Fit the tables and their adders into the same LUT row.** Wirthlin's refinement splits the input into chunks of $\alpha-1$ bits instead of $\alpha$: the freed LUT input lets one row of Xilinx logic hold both a table output and the corresponding adder bit on the fast carry chain, so the table and the rake share silicon instead of stacking. Intel's elementary logic unit already couples each LUT with a full adder and needs no such trick. This is a specific instance of the general LUT-plus-addition mapping opportunity, and it is a case where **the right $\alpha$ is a property of the fabric, not of the arithmetic** — the same reason KCM is an FPGA technique and largely pointless on an ASIC, where there is no free LUT and the "table" degenerates into a mux tree or ROM you have to pay for ([[FPGAs]]).

**Stop summing with adders.** The rake is correct and simple but it is a chain of $D-1$ carry-propagate additions, so its latency grows linearly in $D$. The partial products $CX_i\cdot2^{\alpha i}$ are just a set of weighted bits, and the right consumer for a set of weighted bits is a [[Compressor Trees|compressor tree]] over a single [[Bit Heaps|bit heap]] — one compression and one final adder instead of $D-1$ of them. FloPoCo therefore writes KCM generators as **virtual operators**: they emit their table outputs into a caller-supplied heap and deliberately do *not* compress it, so that an enclosing operator — a complex multiplier, an FIR tap, a whole [[Sum of Constant Products|sum of products]] — compresses everything exactly once.

$$\boxed{\ \#\mathrm{LUTs}=D\,(w_C+\alpha)+(D-1)\,w_C,\qquad D=\left\lceil \frac{w_X}{\alpha}\right\rceil\ }$$

Linear in $w_X$, linear in $w_C$, and constant in the value of $C$; delay is one LUT plus $D-1$ carry chains of $w_C$ bits.

**When it breaks.**

- $w_X\le\alpha$: do not chunk at all. One table is $w_X+w_C$ LUTs at one LUT of delay and nothing is cheaper — see [[Tabulated Constant Multiplier]].
- $\alpha\nmid w_X$: the top chunk holds $w_X-(D-1)\alpha<\alpha$ bits, so its table is smaller than $w_C+\alpha$ LUTs and the formula overcounts. It is an upper bound, not an identity.
- Trivially structured constants. $C=2^n$ is a wire and $C=3$ is one adder; KCM charges its flat price anyway. The flatness that protects you from bad constants also denies you the good ones.
- $w_C\gg w_X$ favours KCM, $w_X\gg w_C$ favours shift-and-add: KCM's cost is driven by the chunk count $\lceil w_X/\alpha\rceil$, shift-and-add's by the nonzero count of $C$. [[Choosing a Constant Multiplier]] is where that trade is settled.
- Large $D$: the serial rake becomes the latency bottleneck long before it becomes the area bottleneck. Switch to an adder tree or a bit heap.
- ASIC targets. There is no architectural $\alpha$, so the tables are synthesised logic like everything else and the argument that made them free evaporates.
- Signed $X$ needs the top chunk's table to store a negative product and the lower tables to stay unsigned, with sign extension into the rake — see [[Number Formats]]. The rewriting itself is unchanged.
- Real constants. (12.14) is *exact* only because $C$ is an integer. For $C\in\mathbb{R}$ each table must be rounded and the error budget re-derived; that is [[Fix-by-Real KCM]], not this note.

**RTL (Spade).** The entity below is the worked $C=683$, $\alpha=4$, $w_X=8$ instance drawn as a two-chunk version of the diagram.

```spade
/// T(k) = C*k for C = 683, alpha = 4. One LUT per output bit on an FPGA.
fn kcm_table(k: uint<4>) -> uint<14> {
    let t: [uint<14>; 16] = [0, 683, 1366, 2049, 2732, 3415, 4098, 4781,
                             5464, 6147, 6830, 7513, 8196, 8879, 9562, 10245];
    t[k]
}

/// 683 * X for an 8-bit X: D = 2 chunks of alpha = 4, one rake adder of w_C = 10.
entity kcm683(x: uint<8>) -> uint<18> {
    let b = x.as_bits();
    let x0 = b[0..4].as_uint();
    let x1 = b[4..8].as_uint();

    let p0 = kcm_table(x0).as_bits();
    let low: uint<4> = p0[0..4].as_uint();     // final result bits 3..0
    let a0: uint<10> = p0[4..14].as_uint();    // A_0 < C, so exactly w_C bits

    let s1: uint<14> = zext::<10, 14>(a0) +. kcm_table(x1);
    s1.concat(low)
}
```

`kcm_table` is a table by construction — a 16-entry constant array indexed by a runtime `uint<4>` — and is the box labelled $T_i$ in the diagram; both instances read the *same* data, which is why a sequential KCM sharing one table is possible. `low` is the "6 final" tap and `a0` the $w_C$-wide rake carry, and slicing `p0` at bit 4 is where the induction above is cashed in: `a0` is declared `uint<10>`, not `uint<14>`, and it type-checks precisely because $A_k<C$. The addition is the truncating `+.` because $A_0+CX_1<C\cdot2^{\alpha}$ already fits in 14 bits, so the growth `+` would give is provably dead. `concat` puts `s1` high, reassembling $CX$ without a shifter. Combinational throughout — synthesis will map each table to $w_C+\alpha$ LUTs and, unlike the drawing, will happily merge the rake adder's low bits into those same LUT rows.

**Related notes.**

- [[Tabulated Constant Multiplier]] – extends: KCM is this note's degenerate case applied per chunk; below $\alpha$ input bits, use that one instead.
- [[Lookup-Tables]] – depends-on: supplies $\alpha$, the only parameter KCM has, and the reason a table costs one LUT per output bit.
- [[Bit Heaps]] – extends: the $D$ shifted subproducts are a set of weighted bits, which is the representation the rake is an inefficient special case of.
- [[Compressor Trees]] – supports: replaces the rake's $D-1$ serial carry-propagate adders with one compression, the right back end for large $D$.
- [[Binary Shift-and-Add Constant Multiplier]] – compares: cost driven by the nonzero count of $C$ instead of by $w_X$, and therefore violently constant-dependent.
- [[Minimum-Adder Constant Multiplier]] – counter-example: buys a cheaper graph with an NP-complete search whose payoff varies per constant; KCM's flat price is what makes it the FPGA default.
- [[Choosing a Constant Multiplier]] – compares: settles $w_C$-versus-$w_X$ and where the flat cost stops being worth it.
- [[Fix-by-Real KCM]] – extends: the same chunking with rounded tables and $g>\log_2 D$ guard bits, for real constants.
- [[Table-Based Multiple Constant Multiplication]] – extends: shares chunk tables across several constants of the same input.
- [[Sum of Constant Products]] – supports: the enclosing operator KCM is written as a virtual operator for.
- [[Number Formats]] – depends-on: two's-complement handling of the top chunk when $X$ is signed.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §12.2.2 "The Table-and-Addition KCM Algorithm", pp. 384-385 — eqs. (12.13)-(12.14), Fig. 12.10, the LUT count, Wirthlin's $\alpha-1$ chunking, Xilinx versus Intel logic cells.
- §12.2 and §12.2.1, p. 383 — $\alpha$ as the architectural LUT input count, and the $2^k$-LUTs-per-output-bit collapse of plain tabulation for $w_X=\alpha+k$.
- §12.3.3, pp. 390-394 — the real-constant generalisation and the virtual-operator formulation.
- §12.7, p. 418 — KCM as the FPGA default, and the $w_C$-versus-$w_X$ rule of thumb.
