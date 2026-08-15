---
title: Multipartite with Compressed TIV
description: "Runs LDTC on the table of initial values — the dominant term — inside the multipartite search, shrinking the architecture at exactly zero accuracy cost."
kind: circuit
source: "ASA §17.2.8, p. 518; §17.1, pp. 497-502; §17.2.9, pp. 519-520"
status: seed
spade: simulated
tags: [digital, table-based-function-evaluation, multipartite, table-compression, fpga]
aliases:
  - Compressed TIV
  - TIV Compression
  - Errorless Compression of the TIV
  - Multipartite with TIV Compression
---

# Multipartite with Compressed TIV

A multipartite architecture whose table of initial values is itself replaced by a sub-sampling table plus a difference table, so the largest table in the design shrinks without a single term of the error budget changing.

```tikz title="Multipartite datapath with the TIV split into a sub-sampling table and a difference table, and the bit alignment of the four tables into one heap"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ================= architecture =================
\draw[thick] (0,6.0) rectangle (6.0,6.5);
\foreach \i in {1,...,11} \draw[gray!45] (0.5*\i,6.0) -- (0.5*\i,6.5);
\draw[very thick] (3.0,6.0) -- (3.0,6.5);
\draw[very thick] (4.5,6.0) -- (4.5,6.5);
\node[anchor=east,font=\small] at (-0.15,6.25) {$X=$};
\node[font=\tiny] at (1.5,6.78) {$A$ \ ($\alpha=6$)};
\node[font=\tiny] at (3.75,6.78) {$B_1$};
\node[font=\tiny] at (5.25,6.78) {$B_0$};
% sub-sampling field: top alpha-s bits of A
\draw[thick,densely dotted] (0,5.82) -- (2.0,5.82);
\node[font=\tiny,anchor=north] at (1.0,5.78) {$\lfloor A/2^{s}\rfloor$, \ $s=2$};
% routing
\draw[->] (1.0,6.0) -- (1.0,3.95) node[midway,left,font=\tiny] {4};
\draw[->] (1.9,6.0) -- (1.9,5.25) -- (3.6,5.25) -- (3.6,3.95);
\node[font=\tiny,anchor=south] at (2.75,5.28) {6};
\draw[->] (3.75,6.0) -- (3.75,5.02) -- (6.2,5.02) -- (6.2,3.95);
\node[font=\tiny,anchor=south] at (4.45,5.05) {$C_1,B_1$};
\draw[->] (5.25,6.0) -- (5.25,4.78) -- (8.8,4.78) -- (8.8,3.95);
\node[font=\tiny,anchor=south] at (7.2,4.81) {$C_0,B_0$};
% tables
\node[draw,thick,minimum width=2.2cm,minimum height=1.1cm,align=center] at (1.0,3.4)
  {$\mathrm{TIV}_{ss}$\\[-3pt]{\tiny $2^{4}$ entries}\\[-4pt]{\tiny $6$ bits, $(-1,-6)$}};
\node[draw,thick,minimum width=2.2cm,minimum height=1.1cm,align=center] at (3.6,3.4)
  {$\mathrm{TIV}_{\mathrm{diff}}$\\[-3pt]{\tiny $2^{6}$ entries}\\[-4pt]{\tiny $8$ bits, $(-5,-12)$}};
\node[draw,thick,minimum width=2.2cm,minimum height=1.1cm,align=center] at (6.2,3.4)
  {$\mathrm{TO}_1$\\[-3pt]{\tiny $2^{\gamma_1+\beta_1-1}$ entries}\\[-4pt]{\tiny $5$ bits, $(-8,-12)$}};
\node[draw,thick,minimum width=2.2cm,minimum height=1.1cm,align=center] at (8.8,3.4)
  {$\mathrm{TO}_0$\\[-3pt]{\tiny $2^{\gamma_0+\beta_0-1}$ entries}\\[-4pt]{\tiny $3$ bits, $(-10,-12)$}};
% adder
\node[draw,thick,minimum width=10.6cm,minimum height=0.6cm] at (4.9,2.05) {$+$ \ {\tiny(one bit heap: the TIV split adds only $v=2$ columns)}};
\foreach \x in {1.0,3.6,6.2,8.8} \draw[->] (\x,2.85) -- (\x,2.35);
\draw[->] (4.9,1.75) -- (4.9,1.15) node[midway,right,font=\tiny] {$S$ at $(-1,-12)$};
\node[font=\tiny,anchor=north] at (4.9,1.12) {truncate (free): drop the $g=2$ guard columns \ $\Rightarrow$ \ $R$ at $(-1,-10)$};
% ================= bit alignment =================
\begin{scope}[yshift=-1.5cm,xshift=1.6cm]
\fill[gray!25] (2.0,-0.15) rectangle (3.0,0.85);
\foreach \y/\xa/\xb/\lab in {0.45/0/3.0/{$\mathrm{TIV}_{ss}$}, -0.05/2.0/6.0/{$\mathrm{TIV}_{\mathrm{diff}}$},
                             -0.55/3.5/6.0/{$\mathrm{TO}_1$}, -1.05/4.5/6.0/{$\mathrm{TO}_0$}}{
  \draw[thick] (\xa,\y) rectangle (\xb,\y+0.35);
  \node[anchor=west,font=\tiny] at (6.2,\y+0.175) {\lab};
}
\foreach \y/\xa/\xb in {0.45/0/3.0, -0.05/2.0/6.0, -0.55/3.5/6.0, -1.05/4.5/6.0}
  \foreach \k in {1,...,11} { \draw[gray!45] ({max(\xa,min(\xb,0.5*\k))},\y) -- ({max(\xa,min(\xb,0.5*\k))},\y+0.35); }
\foreach \y in {-0.05,-0.55,-1.05} \node[font=\small] at (-0.45,\y+0.175) {$+$};
\draw[thick] (-0.6,-1.25) -- (6.6,-1.25);
\node[font=\small] at (-0.45,-1.63) {$=$};
\draw[thick] (0,-1.8) rectangle (5.0,-1.45);
\foreach \k in {1,...,9} \draw[gray!45] (0.5*\k,-1.8) -- (0.5*\k,-1.45);
\node[anchor=west,font=\tiny] at (6.2,-1.625) {$R$ \ (10 bits)};
\draw[red,thick,densely dashed] (5.0,1.05) -- (5.0,-1.95);
\draw[red,<->] (5.05,1.18) -- (5.95,1.18);
\node[red,font=\tiny,anchor=south] at (5.5,1.2) {$g=2$};
\node[font=\tiny,anchor=south] at (2.5,0.92) {overlap $v=2$};
\node[font=\tiny,anchor=south] at (0.25,0.86) {$2^{-1}$};
\node[font=\tiny,anchor=north] at (5.9,-1.84) {$2^{-12}$};
\node[font=\tiny,anchor=north] at (2.6,-2.4) {all four tables share the LSB weight $2^{-12}$, i.e. $\ell_R-g$};
\end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 17.13, p. 518; parameters are those of the worked instance below.*

**Attack the term that did not shrink.** Every other economy in [[Multipartite Methods]] acts on the tables of offsets: [[Symmetric Table of Offsets|symmetry]] halves both their address space and their width, and splitting $B$ into $m$ fields replaces one $2^{\gamma+\beta}$-entry table by $m$ much smaller ones. The TIV is untouched by all of it. It stays

$$\text{TIV}:\ 2^{\alpha}\,(w_R+g)\ \text{bits},\qquad w_R=m_R-\ell_R+1$$

with $\alpha\approx 2w_X/3$ fixed by the second-derivative argument, so it is exponential in $w_X$ and it is almost always the dominant term of the architecture. In the book's 16-bit sine run it is the only table with $2^9$ entries at full output width; the three TOs together are comparable to it only after symmetry has already cut them fourfold.

**Recognise the TIV as the textbook LDTC input.** [[LDTC, Lossless Differential Table Compression|LDTC]] compresses a table whose neighbouring entries vary little relative to the full output range, and the TIV is that by construction: $\text{TIV}^*(A)\approx f(2^{\ell_X}A)$, so two adjacent entries differ by roughly $|f'|\,2^{-\alpha}$ while the table spans the whole range of $f$. Multipartite already *requires* $f$ continuous with bounded $f''$ — the same hypothesis that makes the approximation work makes the TIV compressible. This is the one place in the chapter where an approximate method and an exact one compose without an interaction term.

**The split is an integer identity, not an approximation.** Sub-sample by $2^s$: $\text{TIV}_{ss}$ keeps $2^{\alpha-s}$ entries of $w_H$ bits holding the upper part of the slice minimum, and $\text{TIV}_{\text{diff}}$ keeps all $2^{\alpha}$ entries but only $w_L$ bits of local variation. Then for every address

$$\text{TIV}(A)=\text{TIV}_{ss}\!\left(\lfloor A/2^{s}\rfloor\right)+\text{TIV}_{\text{diff}}(A),\qquad v=w_H+w_L-(w_R+g)$$

holds **bit for bit**, with $v$ the number of binary positions where the two tables overlap and therefore the width of the carry that the reconstruction can propagate. The triplet $(s,w_H,w_L)$ is enumerated, not derived, and validated slice by slice: a vector dies the moment one slice's $\max-\min$ exceeds $2^{w_L}$.

> [!important] Because the identity is exact, nothing in the multipartite error analysis is re-derived. $\overline{\delta_{\text{approx}}}$, the table-filling bound $(m+1)2^{\ell_R-g-1}$ and the final-rounding term are all functions of $\mathcal{D}$ and $g$ alone; compression changes neither, so $g$ computed before compression is still the right $g$ after it. Compression is a pure size transformation applied to an already-verified architecture.

**It also costs nothing in delay, because the adder was already there.** A stand-alone LDTC reconstruction needs an adder $w_H$ bits wide — the low $w_R-w_H$ bits of the sum are $\text{TIV}_{\text{diff}}$'s own bits, unchanged. Inside a multipartite there is no separate adder at all: the TIV output and the $m$ TO outputs already meet in one [[Bit Heaps|bit heap]], all aligned on the common LSB $2^{\ell_R-g}$, so splitting the TIV in two merely adds one more row to the heap, and only $v$ of its columns are ones the heap did not already have. If those $v$ columns do not force an extra stage in the [[Compressor Trees|compressor tree]], the delay overhead is exactly zero — which is why $v=2$, occasionally $3$, is the usual optimum: a wider overlap buys a smaller pair of tables until the extra heap columns start costing a stage.

**Compression sits inside the search, not after it.** Algorithm 17.3 enumerates decompositions $\mathcal{D}=\{\alpha,\beta,m,(\gamma_i,p_i,\beta_i)\}$, rejects those with $\overline{\delta_{\text{approx}}}\ge 2^{\ell_R-1}$, computes $g$, and only then sizes the tables — and it is *in that sizing step* that the TIV is compressed. The ordering matters: the compression ratio depends on $\alpha$ and on $w_R+g$, so evaluating it inside the loop lets the search prefer a decomposition that compresses well over one that is smaller uncompressed. Doing it afterwards, as a post-pass on the winner, would pick a different and worse $\mathcal{D}$. The inner LDTC enumeration is cheap enough to sit there because its validity test costs $O(2^{\alpha})$ per $s$ with the per-slice extrema memoised.

**What it is worth.** For the 16-bit-in, 16-bit-out sine of p. 520 the winning decomposition is $m=3$ with a compressed TIV of $7\cdot2^{6}+13\cdot2^{9}=7104$ bits — so $\alpha=9$, $s=3$, $w_H=7$, $w_L=13$ — against TOs of $9\cdot2^{9}+7\cdot2^{8}+5\cdot2^{8}=7680$ bits. Total $14\,784$ bits where the plain table would be $16\cdot2^{16}=1\,048\,576$: a factor $70$, found in under a second. Note what compression did to the balance: after it, the TIV is no longer the dominant term, the two halves of the architecture are within 8% of each other.

**On FPGAs the win is close to linear in bits, until it is not.** Below the LUT/block-RAM crossover a $2^k\times n$ ROM costs $2^{\max(k-\lambda,0)}\cdot n$ [[Lookup-Tables|LUTs]] on a $\lambda$-input device, which is linear in the output width $n$ — exactly the dimension LDTC attacks in the big table. The p. 520 architecture costs $7+104$ LUTs for the compressed TIV, i.e. $\text{TIV}_{ss}$ fits inside a single LUT depth ($2^6$ entries, $\lambda=6$) and is essentially free, while $\text{TIV}_{\text{diff}}$'s $2^9\times13$ is $8\cdot13$. Above the crossover the reasoning inverts: a table that would have fitted one [[Block Memory|block RAM]] and cost zero logic becomes two tables that fit block-RAM granularity worse, and the compression is a pessimisation. See [[FPGAs]] for the cost model.

$$\boxed{\ \text{TIV}(A)=\text{TIV}_{ss}\!\left(\lfloor A/2^{s}\rfloor\right)+\text{TIV}_{\text{diff}}(A)\ \ \text{exactly},\qquad \delta_{\text{total}}\ \text{unchanged},\qquad \text{cost}\ 2^{\alpha-s}w_H+2^{\alpha}w_L\ <\ 2^{\alpha}(w_R+g)\ }$$

**When it breaks.**

- **Small $\alpha$.** LDTC pays off when the address width and the output width are close, because $\text{TIV}_{\text{diff}}$ keeps all $2^{\alpha}$ entries and only its *width* shrinks. At $\alpha=6$ with $w_R+g=12$ the best ratio available on the worked instance below is $0.79$; at $\alpha=9$ with a 20-bit TIV the book's example reaches $0.69$. Multipartite's own $\alpha\approx 2w_X/3$ pushes in the right direction as $w_X$ grows, so this is a small-operator caveat.
- **The TIV is not always the dominant term.** With large $m$ and an aggressively small $\alpha$ the TOs dominate; compressing the TIV then moves a few per cent. The TOs themselves are poor LDTC candidates — symmetry has already spent the neighbouring-value redundancy, the same reason a KCM table resists compression.
- **One bad slice kills a vector.** Validity is worst case over all $2^{\alpha-s}$ slices, not average. A function with one steep region — anything not properly [[Range Reduction|range-reduced]], $\sqrt{x}$ near $0$ being the standard example — forces $w_L$ up to cover that slice and the compression evaporates, even though the other slices would have compressed fine.
- **Block RAM.** Above the LUT/BRAM crossover, splitting one table into two usually costs more blocks than it saves bits.
- **Nothing changes for correctness.** Faithful rounding, the free final truncation from [[HUB Table Filling|HUB filling]], and the [[Monotonic Multipartite Tables|non-monotonicity]] of the result are all properties of $\mathcal{D}$ and $g$; compression neither creates nor removes a non-monotonicity. The exhaustive final check over all $2^{w_X}$ inputs is unchanged too — which is what makes this safe to apply blindly.

**RTL (Spade).** The TIV path of a small instance: $f=\sin(\pi x/4)$, $\alpha=6$, TIV filled at $2^{-12}$ (so $w_R+g=12$, $\ell_R=-10$, $g=2$), LDTC parameters $(s,w_H,w_L)=(2,6,8)$ from an exhaustive enumeration, giving $v=2$. The two TO contributions arrive as already-aligned inputs because they belong to sibling notes.

```spade
// TIV of sin(pi.x/4) on [0,1), alpha = 6, filled at 2^-12; LDTC (s,wH,wL) = (2,6,8)
fn tiv_ss(b: uint<4>) -> uint<6> {
    let t: [uint<6>; 16] = [
        0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 35, 38, 40, 43,
    ];
    t[b]
}

fn tiv_diff(a: uint<6>) -> uint<8> {
    let t: [uint<8>; 64] = [
        25, 75, 126, 176, 34, 84, 134, 184, 42, 92, 142, 192, 50, 99, 149, 198,
        56, 105, 154, 203, 60, 108, 157, 205, 61, 109, 157, 204, 60, 107, 154, 200,
        55, 101, 147, 193, 46, 91, 136, 181, 33, 77, 121, 164, 15, 58, 101, 143,
        56, 98, 139, 180, 28, 68, 108, 147, 58, 96, 134, 172, 17, 54, 91, 126,
    ];
    t[a]
}

entity mp_ctiv(a: uint<6>, to1: uint<5>, to0: uint<3>) -> uint<10> {
    let b   = a.as_bits()[2..6].as_uint();
    let hi: uint<12> = zext(tiv_ss(b)) << 6;
    let tiv: uint<13> = hi + zext::<8, 12>(tiv_diff(a));
    let s1:  uint<14> = tiv + zext::<5, 13>(to1);
    let sum: uint<15> = s1  + zext::<3, 14>(to0);
    sum.as_bits()[2..12].as_uint()
}
```

`b` is the dotted sub-sampling field of the diagram: dropping the $s=2$ LSBs of the $\alpha=6$ address is a wire cut, `a.as_bits()[2..6]`, not logic. `<< 6` is the alignment of $\text{TIV}_{ss}$'s $(-1,-6)$ field onto the common LSB $2^{-12}$ — also free, and the reason `hi` and the zero-extended difference can simply be added. The three additions are written as a chain of widening `+` (each grows one bit) purely so the widths are readable; synthesis will not build three ripple adders but one heap, and the maximum sum $2878+31+7$ never reaches bit 12, so the final `[2..12]` slice — the free truncation that drops the $g=2$ guard columns — cannot overflow. Everything here is combinational; the ROMs infer as LUTs at this size.

Compiled clean, and simulated with `.zettel/sim.sh` against a testbench holding the **uncompressed** 64-entry TIV: 5068 vectors, comprising all 64 addresses with the TO inputs zeroed, four asymmetric named vectors, and 5000 random $(A,\text{TO}_1,\text{TO}_0)$ triples. Zero mismatches — which is the errorless claim, checked rather than asserted. As a negative control, changing the alignment shift from `<< 6` to `<< 5` makes 64 of them fail.

**Related Notes.**

- [[LDTC, Lossless Differential Table Compression]] – depends-on: the compression algorithm, its $(s,w_H,w_L)$ enumeration and its slice validity test, applied here to one particular table.
- [[Multipartite Methods]] – extends: supplies $\mathcal{D}$, $g$ and the whole error budget; this note only changes how the TIV is stored.
- [[Bit Heaps]] – supports: the reconstruction addition is free because the TIV and the TOs already meet in a heap.
- [[Compressor Trees]] – supports: the $v$ overlap columns are free only if they do not force one more compression stage.
- [[Symmetric Table of Offsets]] – compares: the other way to shrink a multipartite, acting on the TOs instead and by approximation-preserving symmetry rather than exact differencing.
- [[HUB Table Filling]] – supports: fixes the TIV's contents and its $w_R+g$ width, which are what LDTC then compresses.
- [[ILP-Optimized Multipartite Tables]] – compares: replaces the whole greedy enumeration, including this step, by one integer program.
- [[Choosing a Table Method]] – compares: where a compressed-TIV multipartite sits against a plain ROM, LDTC alone, and polynomial evaluation.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 17.

- §17.2.8 *Errorless Compression of the TIV*, Fig. 17.13, p. 518 — the architecture and the alignment diagram redrawn above.
- §17.1 *Lossless Differential Table Compression*, pp. 497-502 — applicability (p. 498), the $(s,w_H,w_L)$ parameter space and the Hsiao refinements (pp. 499-500), Algorithms 17.1-17.2 (pp. 500-501), the merged-into-a-bit-heap cost argument and Fig. 17.2 (p. 502), typical ratios and $v=2$ (p. 502).
- §17.2.6-17.2.7, pp. 516-518 — the TIV size $2^{\alpha}(w_R+g)$ and the HUB filling that produces its contents.
- §17.2.9 *Putting It All Together*, Algorithm 17.3 and the 16-bit sine run, pp. 519-520 — $m=3$, compressed TIV $7\cdot2^6+13\cdot2^9$, TOs $9\cdot2^9+7\cdot2^8+5\cdot2^8$, $14\,784$ bits, factor 70.
- §16.4.2 *Actual Cost of a ROM*, Eq. (16.1), pp. 491-492 — the LUT and block-RAM cost model behind the FPGA paragraph.
- [Hsi+15], [Hsi+17] — Hsiao et al., the original TIV compression; [CFD22] — Christ, Forget & de Dinechin, the generalisation used here.
