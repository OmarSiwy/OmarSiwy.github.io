---
title: "Bewick Radix-8 Multiplier"
description: "Keeps the awkward 3Y/5Y/7Y multiples of a high-radix recoding in carry-save form built from small ripple-carry adders — one carry bit per k sum bits instead of a full extra row."
kind: circuit
source: "ASA §8.3.5, p. 222; §5.2.6, pp. 111-112"
status: seed
spade: simulated
tags: [digital, multipliers, booth, carry-save, radix-8]
aliases:
  - Bewick Multiplier
  - Bewick's Radix-8 Multiplier
  - Radix-8 Booth Multiplier
---

# Bewick Radix-8 Multiplier

A radix-8 Booth multiplier that generates the hard multiple $3Y$ in *high-radix* carry-save form — carries propagated only inside $k$-bit groups — so the row it drops into the bit heap costs $\lceil w_Y/k\rceil$ extra bits rather than the $w_Y$ extra bits a plain carry-save $3Y$ would cost.

```tikz title="Bewick's 3Y generator: a carry chain cut every k bits, and the bit-heap row it produces"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=0.62cm,y=0.62cm,font=\small]
  % bit of weight c is drawn at x = 15.5-c (MSB left).  Here w_Y = 16, k = 4.
  \foreach \j in {0,1,2,3}{
    \pgfmathsetmacro{\xl}{12-4*\j}
    \draw[fill=black!4] (\xl,7.3) rectangle (\xl+4,8.1);
    \draw[fill=black!4] (\xl,6.3) rectangle (\xl+4,7.1);
    \draw[thick,fill=black!8] (\xl+0.35,4.9) rectangle (\xl+3.65,5.9);
    \node at (\xl+2,5.4) {$k$-bit RCA};
    \draw[->] (\xl+2,6.3) -- (\xl+2,5.9);
    \draw[->] (\xl+2.4,4.9) -- (\xl+2.4,3.6);
    \draw[->] (\xl+0.9,4.9) -- (\xl+0.9,4.35) -- (\xl-0.5,4.35) -- (\xl-0.5,3.6);
  }
  \foreach \xc in {12,8,4}{
    \draw (\xc-0.35,5.4) -- (\xc-0.12,5.4);
    \draw (\xc+0.12,5.4) -- (\xc+0.35,5.4);
    \draw[thick] (\xc-0.2,5.1) -- (\xc+0.2,5.7);
  }
  \node[anchor=east] at (-1.3,7.7) {$2Y$};
  \node[anchor=east] at (-1.3,6.7) {$Y$};
  \node[anchor=west] at (16.4,7.7) {\footnotesize $w_Y=16$ bits};
  \node[anchor=west] at (16.4,6.7) {\footnotesize $w_Y=16$ bits};
  \node[anchor=west] at (16.4,5.4) {\footnotesize chain cut every $k$ bits};
  \node[anchor=west] at (16.4,4.35) {\footnotesize delay $=$ one $k$-bit RCA};

  % --- the bit-heap row this generator drops ---
  \draw[dotted] (-1.5,3.15) -- (16.2,3.15);
  \foreach \c in {0,1,...,15}{\fill (15.5-\c,1.6) circle (0.13);}
  \foreach \c in {4,8,12,16}{\draw[fill=white,thick] (15.5-\c,2.5) circle (0.16);}
  \node[anchor=west] at (16.4,2.5) {\footnotesize $C$: 4 carry bits};
  \node[anchor=west] at (16.4,1.6) {\footnotesize $S$: 16 sum bits};
  \node[anchor=east] at (-1.3,2.05) {$3Y$};
  \draw[|-|] (-0.7,0.75) -- (15.7,0.75);
  \node[anchor=north] at (7.5,0.65) {\footnotesize one carry bit every $k$ sum bits: heap row $=w_Y(1+1/k)$ bits, not $2w_Y$};
\end{circuitikz}
\end{document}
```

*Own construction; the grouped adder is the high-radix carry-save adder of Fig. 5.10, p. 112, specialised to $3Y=2Y+Y$.*

**Locate the wall that stops Booth recoding at radix 4.** Radix-$2^r$ recoding of the $w_X$-bit multiplier $X$ needs the redundant digit set $\{-2^{r-1},\dots,2^{r-1}\}$, so radix-8 needs $\{-4,\dots,4\}$ and radix-16 needs $\{-8,\dots,8\}$. Every digit whose magnitude is a power of two selects $Y$ through a wire shift and an XOR bank; the surviving magnitudes $3$ (radix-8) and $3,5,7$ (radix-16) do not, because $3Y=2Y+Y$, $5Y=4Y+Y$ and $7Y=8Y-Y$ each contain a *real* $w_Y$-bit carry-propagate addition (p. 222). That addition sits in front of the whole compressor tree, and its $O(w_Y)$ delay eats the win from halving the row count. See [[Booth's Algorithm]] for the radix-4 recoding this generalises.

**Price the obvious carry-save patch, and watch it lose.** The reflex is to compute $3Y$ with a [[CSA, Carry-Save Adder]]: constant delay, no carry propagation. But a carry-save adder returns an *unevaluated* sum, so the row $Z_jY$ arrives at the bit heap as **two** $w_Y$-bit lines instead of one. Count the heap. Radix-4 produces $m_4=\lfloor w_X/2\rfloor+1$ rows of $\approx w_Y$ bits, so $N_4\approx w_Xw_Y/2$ bits; radix-8 produces $m_8=\lfloor w_X/3\rfloor+1$ rows, but at two lines each that is $N_8\approx 2w_Xw_Y/3$. The ratio is $4/3$: the radix-8 heap is *larger* than the radix-4 heap it was supposed to shrink. This is the book's "negating the benefit of high-radix recoding" (p. 222), and it is the reason radices above 4 are not used.

**Cut the carry chain instead of removing it.** Bewick's move is to interpolate between the two extremes. A high-radix carry-save (HRCS) adder with group size $\alpha=k$ is a [[RCA, Ripple-Carry Adder]] whose carry chain is severed every $k$ bits: it is $\lceil w_Y/k\rceil$ independent $k$-bit RCAs, each taking no carry-in and each *emitting* its carry-out as an output bit of weight $2^{k(i+1)}$ instead of feeding it forward (§5.2.6, pp. 111-112). The result is a radix-$2^k$ number with the redundant digit set $\{0,1,\dots,2^k\}$ — one ordinary radix-$2^k$ digit plus one unit bit — which is exactly the [[Redundant Number Systems]] view of carry-save generalised from $k=1$. The two endpoints bracket the design: $k=1$ is a plain carry-save row (zero delay, $w_Y$ carry bits) and $k=w_Y$ is a plain CPA (full delay, zero carry bits).

**Cost it: the area is unchanged, the trade is delay against heap bits.** Cutting a chain does not remove cells. The HRCS generator still contains $w_Y$ adder cells, the same as the $w_Y$-bit RCA it replaces; only the wires between groups are gone. What changes is the pair
$$\text{delay}=k\cdot t_{\mathrm{FA}}\quad\text{(independent of }w_Y\text{)},\qquad \Delta N_{\text{row}}=\left\lceil \frac{w_Y}{k}\right\rceil\ \text{extra heap bits},$$
so the $3Y$ row occupies $w_Y+\lceil w_Y/k\rceil = w_Y(1+1/k)$ bits: one carry bit per $k$ sum bits, and the delay overhead of one $k$-bit RCA (p. 222). Sum bits and carry bits are *both* just bits in the heap — the compressor tree of [[Sums of Weighted Bits]] does not care that the carries live only in columns $k,2k,3k,\dots$ — so the whole cost of redundancy is $\lceil w_Y/k\rceil$ additional dots.

**Solve for the $k$ at which radix-8 actually starts paying.** Substituting the row size back into the heap count, $N_8\approx (w_X/3)\,w_Y(1+1/k)$ against $N_4\approx (w_X/2)\,w_Y$, and $w_X w_Y$ cancels. The inequality $\tfrac23(1+1/k)<1$ reduces to $1/k<1/2$, so $k\ge 3$. At $k=1$ the ratio is the $4/3$ loss computed above, $k=2$ is a wash, $k=4$ gives $5/6$, and the limit as $k\to w_Y$ is the ideal $2/3$ — with a delay that has grown back to a full CPA. The useful window is therefore small $k$ above $2$, where the delay is a handful of full-adder levels and the heap has already shrunk most of the way to the $2/3$ ideal.

> [!warning] Negating an HRCS row is not covered in the source
> Booth needs $-3Y$ as well as $+3Y$, and $-(S+C)=\bar S+\bar C+2$ requires complementing *both* vectors. Complementing the sparse $C$ turns its $w_Y(1-1/k)$ known zeros into ones, destroying exactly the sparsity the scheme bought. The repair is to complement the *inputs* — feed $\overline{2Y}$ and $\bar Y$ to the HRCS adder and let the constant $2$ join the other Booth $\mathrm{cpl}_j$ bits in the heap's constant column — which means the $3Y$ generator can no longer be shared across all $m_8$ digits unless the sign is known per digit. Bewick [Bew94] is cited in one paragraph on p. 222 with no negation scheme, no choice of $k$, and no synthesis numbers.

**On FPGAs the whole idea largely evaporates.** The premise is that a $w_Y$-bit carry propagation is expensive. On AMD and Intel devices it is not: the hardened carry chain of the [[FPGAs]] slice adds 32 bits in roughly the delay of one soft logic level, so cutting it at $k$ saves almost nothing while still adding $\lceil w_Y/k\rceil$ heap bits — and each extra heap bit costs about $0.55$ LUT of compression to absorb (Table 8.3, p. 229). The trade runs the wrong way. Bewick's construction is an ASIC-era answer, and on FPGAs the same $3Y$ is better served by a plain carry-chain adder, or the whole multiplier by a DSP block.

$$\boxed{\ \frac{N_8}{N_4}=\frac{2}{3}\left(1+\frac{1}{k}\right)\ <\ 1\iff k\ge 3,\qquad \text{delay}=k\,t_{\mathrm{FA}},\ \ \Delta N_{\text{row}}=\left\lceil\frac{w_Y}{k}\right\rceil\ }$$

**When it breaks.** $k\le 2$ loses outright to radix-4 Booth. On FPGAs the hard carry chain removes the delay the scheme is buying, and the $0.55$ LUT/bit compression charge makes the crossover later than the raw bit count predicts. Radix-16 needs three generators ($3Y$, $5Y$, $7Y$) and three carry populations in the heap; the book only remarks that the idea "could also be explored", so nothing here is measured for it. Negation costs an extra XOR bank per digit and blocks sharing one generator across digits. And an HRCS value cannot be compared or rounded without first collapsing it — harmless here, since the row is going into a compressor tree that will collapse it anyway, but fatal if a truncated multiplier wants to inspect the row.

## RTL (Spade)

```spade
/// One high-radix carry-save adder, w = 16 bits, group size k = 4.
/// The carry chain is cut every k bits: four independent 4-bit RCAs.
/// Packed as C[3:0] : S[15:0], with  S + sum_i C_i * 2^(4i+4)  ==  a + b.
entity hrcs16_4(a: uint<16>, b: uint<16>) -> uint<20> {
    let av = a.as_bits();
    let bv = b.as_bits();

    // each group is a k-bit RCA with no carry-in; bit k of its result is the
    // group carry-out, which is *not* propagated into the next group.
    let g0 = av[0..4].as_uint()   + bv[0..4].as_uint();    // uint<5>
    let g1 = av[4..8].as_uint()   + bv[4..8].as_uint();
    let g2 = av[8..12].as_uint()  + bv[8..12].as_uint();
    let g3 = av[12..16].as_uint() + bv[12..16].as_uint();

    let s = g3.as_bits()[0..4].as_uint()
        .concat(g2.as_bits()[0..4].as_uint())
        .concat(g1.as_bits()[0..4].as_uint())
        .concat(g0.as_bits()[0..4].as_uint());            // uint<16>

    let c = [g0.as_bits()[4], g1.as_bits()[4],
             g2.as_bits()[4], g3.as_bits()[4]].as_uint(); // uint<4>

    c.concat(s)
}

/// The Bewick partial-product generator: 3Y held in HRCS form.
entity y3_hrcs(y: uint<14>) -> uint<20> {
    let y16: uint<16> = zext(y);
    inst hrcs16_4(y16 <<. 1, y16)
}
```

The four `+` operations are the four boxes in the diagram; `+` on `uint<4>` yields `uint<5>`, and bit 4 of each — dropped into `c` rather than into the next group's carry-in — is the open circle in the heap row. `s` and `c` are the two output vectors, packed into one 20-bit port only because Spade returns a single value; nothing here is registered, the whole generator is combinational and its critical path is one 4-bit chain. `y3_hrcs` zero-extends a 14-bit $Y$ to 16 so that $3Y<2^{16}$ cannot overflow, and `<<.` is the truncating shift that forms $2Y$. Synthesis will not build four literal adders: it maps each group onto four carry-chain cells and, on an FPGA, will happily reconnect what the source deliberately cut unless the groups are kept apart by a `KEEP` attribute — the one place the drawing and the netlist can silently disagree.

Simulated with `.zettel/sim.sh`: `hrcs16_4` passes 5008 vectors (including the asymmetric $1+128$, which fails if the group order is reversed) and `y3_hrcs` passes 3008 vectors against a behavioural $3y$, both checking $S+\sum_i C_i2^{4i+4}$ against the reference.

## Related Notes

- [[Booth's Algorithm]] – extends: this is the radix-8 continuation of that recoding, and the hard multiple $3Y$ is the obstacle it stops at.
- [[CSA, Carry-Save Adder]] – counter-example: the $k=1$ endpoint, whose $w_Y$ carry bits make the radix-8 heap *larger* than radix-4's.
- [[RCA, Ripple-Carry Adder]] – depends-on: the $k=w_Y$ endpoint, and the primitive each group is cut from.
- [[Redundant Number Systems]] – supports: the digit set $\{0,\dots,2^k\}$ that makes an unevaluated $S+C$ a number at all.
- [[Sums of Weighted Bits]] – depends-on: the compressor tree that absorbs the extra carry bits, and the sign-extension reduction the constant $2$ folds into.
- [[Choosing a Multiplier]] – compares: where a high-radix recoded array sits against tiling and DSP-based construction.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §8.3.5 "Higher radix", p. 222 (Bewick [Bew94], one carry bit per $k$ sum bits, delay of a $k$-bit RCA).
- §5.2.6 "Carry-Save Addition" and Fig. 5.10, pp. 111-112 (high-radix carry-save, digit set $\{0,\dots,2^\alpha\}$, area/speed trade-off).
- §8.3.3-8.3.4, pp. 216-221 (radix-4 Booth recoding, $\mathrm{cpl}/\mathrm{one}/\mathrm{two}$ selection, sign management).
- Table 8.3, p. 229 ($0.55$ LUT/bit compression cost on AMD).
