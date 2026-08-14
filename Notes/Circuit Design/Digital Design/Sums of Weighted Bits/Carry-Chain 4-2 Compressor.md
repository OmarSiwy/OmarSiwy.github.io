---
title: "Carry-Chain 4:2 Compressor"
description: "The FPGA variant that deliberately keeps the fast carry chain instead of avoiding it, saving the carry as an extra output row: efficiency 2−1/k, beating the ternary adder at much shorter delay."
kind: circuit
source: "ASA §7.3.2.5, pp. 184-186"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, compressor, fpga, carry]
aliases:
  - "Carry-Chain 4:2 Compressor"
  - "Carry-Chain 4-2 Compressor"
  - "FPGA 4:2 Compressor"
  - "Carry-Chain Row Compressor"
---

# Carry-Chain 4:2 Compressor

A row compressor that runs a real carry propagation along $k$ columns of the FPGA's hard carry chain and keeps the row's own carries as a second output row, so it compresses four rows into two at the delay of a single $k$-bit adder.

```tikz title="Carry-chain 4:2 row compressor, functional view for k=4"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  \draw[dashed,gray] (-0.95,-0.5) rectangle (10.2,0.9);
  \node[anchor=west,font=\footnotesize,gray] at (10.85,0.2) {dedicated carry chain};
  \node[anchor=west,font=\footnotesize,gray] at (10.3,2.4) {1 LUT6 per column};
  \foreach \i/\xx/\ci in {0/9/1, 1/6/2, 2/3/3, 3/0/4} {
    \node[anchor=south] at (\xx-0.9,4.35) {$w_{\i}$};
    \node[anchor=south] at (\xx-0.25,4.35) {$z_{\i}$};
    \node[anchor=south] at (\xx+0.25,4.35) {$y_{\i}$};
    \node[anchor=south] at (\xx+0.9,4.35) {$x_{\i}$};
    \draw[->] (\xx-0.25,4.3) -- (\xx-0.25,2.78);
    \draw[->] (\xx+0.25,4.3) -- (\xx+0.25,2.78);
    \draw[->] (\xx+0.9,4.3) -- (\xx+0.9,2.4) -- (\xx+0.58,2.4);
    \draw[->] (\xx-0.9,4.3) -- (\xx-0.9,1.05) -- (\xx-0.25,1.05) -- (\xx-0.25,0.58);
    \draw[->] (\xx-0.55,2.4) -- (\xx-1.15,2.4) -- (\xx-1.15,-1.2);
    \node[anchor=north] at (\xx-1.15,-1.2) {$c_{\ci}$};
    \node[draw,fill=white,minimum width=1.1cm,minimum height=0.7cm] at (\xx,2.4) {FA};
    \node[draw,fill=white,minimum width=1.1cm,minimum height=0.7cm] at (\xx,0.2) {FA};
    \draw[->] (\xx+0.25,2.05) -- (\xx+0.25,0.58);
    \draw[->] (\xx,-0.15) -- (\xx,-1.2);
    \node[anchor=north] at (\xx,-1.2) {$s_{\i}$};
  }
  \foreach \xx in {9,6,3} { \draw[->] (\xx-0.58,0.2) -- (\xx-2.42,0.2); }
  \draw[->] (10.3,0.2) -- (9.58,0.2);
  \node[anchor=west] at (10.35,0.2) {$0$};
  \draw[->] (-0.58,0.2) -- (-2.0,0.2) -- (-2.0,-1.2);
  \node[anchor=north] at (-2.0,-1.2) {$s_{4}$};
  \node[anchor=north west,font=\footnotesize,text width=15.2cm] at (-2.6,-1.95)
    {Shown for $k=4$. Every $x_i,y_i,z_i,w_i,s_i,c_i$ is 1 bit. Rows
     $X,Y,Z,W$ are $k$ bits each ($4k$ input dots); outputs are
     $S=s_k\dots s_0$ ($k{+}1$ bits, weights $0..k$) and $C=c_k\dots c_1$
     ($k$ bits, weights $1..k$): $2k{+}1$ output dots. Top row: one LUT6
     per column, fractured into $\mathrm{O6}=x_i\oplus y_i\oplus z_i\oplus w_i$
     and $\mathrm{O5}=\mathrm{MAJ}(x_i,y_i,z_i)=c_{i+1}$. Bottom row: the
     slice carry mux and XOR, free silicon.};
\end{circuitikz}
\end{document}
```

*after Fig. 7.24a, p. 186 — with the final carry-out $s_4$ restored; see the warning below.*

**Start from what the ternary adder wastes.** On an AMD slice a LUT layer costs $\tau_L$, local routing costs $\tau_R$, and a carry-chain hop costs $\tau_{CC}$, with $\tau_L\approx\tau_R\approx\tau$ and $\tau_{CC}\lll\tau$ (Table 7.3, p. 184). The [[Ternary Adder]] exploits that by spending one LUT layer on a carry-save row and letting the chain collapse the result, reaching efficiency $E=2-2/k$ — but the carry-save row's carries must be *routed back into the same adder*, one column to the left, and that round trip costs a second LUT layer plus a routing hop: $2\tau_L+\tau_R+k\tau_{CC}\approx 3\tau+k\tau_{CC}$. The slow part is not the propagation; it is the reinsertion.

**Do not reinsert the carry — save it.** Carry-save arithmetic ([[Carry-Save Adder]]) says a carry that is not needed *now* can be deferred to a later stage as an extra row. Applying that to the ternary adder removes the reinsertion path entirely: the row's carries leave as a second output row, and because no carry has to be absorbed, the freed input slot admits a fourth input row for nothing. One extra output row bought one extra input row, at zero delay.

> [!note] The FPGA inversion in one sentence
> An ASIC [[4:2 Compressor]] is designed to avoid carry *propagation*; the FPGA version keeps propagation — it is nearly free on hard carry logic — and avoids carry *routing*, which is the expensive thing on an FPGA.

**Split each column into a saved carry and a propagated sum.** Take four $k$-bit rows $X,Y,Z,W$ at weights $0\dots k-1$. In column $i$, apply the [[Full Adder]] identity to three of the four bits:

$$x_i+y_i+z_i \;=\; 2\,\mathrm{MAJ}(x_i,y_i,z_i)\;+\;(x_i\oplus y_i\oplus z_i),$$

which holds because $\mathrm{MAJ}$ is the indicator of "at least two ones" and $\oplus$ is parity, so both sides count the same population for all eight assignments. Write $c_{i+1}=\mathrm{MAJ}(x_i,y_i,z_i)$ (1 bit) and $t_i=x_i\oplus y_i\oplus z_i$ (1 bit). Multiplying by $2^i$ and summing over $i$, by distributivity of multiplication over the positional sum,

$$X+Y+Z \;=\; \underbrace{\sum_{i=0}^{k-1}2^{i}t_i}_{T,\ k\text{ bits}} \;+\; \underbrace{\sum_{i=0}^{k-1}2^{i+1}c_{i+1}}_{C,\ k\text{ bits at weights }1..k}.$$

The index shift on the second sum is the whole point: $C$ is a $k$-bit word that re-enters the heap one column to the left, exactly as any carry-save row does. Nothing has propagated yet — every $c_{i+1}$ is a function of column $i$ alone.

**Give the fourth row to the hard chain.** $T$ and $W$ are both $k$ bits, so a plain $k$-bit adder produces $S=T+W$ on $k+1$ bits, and this is the one place carry propagation happens. Adding it to the previous line,

$$X+Y+Z+W \;=\; (T+W)+C \;=\; S+C,$$

with $S$ spanning weights $0\dots k$ and $C$ spanning weights $1\dots k$. Both output rows are ordinary bit-heap rows ([[Bit Heaps]]); the compressor does not produce a number, it produces two rows that some later stage will finish.

**Count dots and LUTs.** Input dots $b_i=4k$, output dots $b_o=(k+1)+k=2k+1$, so $\delta=b_i-b_o=2k-1$. The cost is $k$ LUT6 (one per column), giving the GPC efficiency of (7.27), p. 183:

$$E=\frac{\delta}{k}=\frac{2k-1}{k}=2-\frac1k .$$

Compare, at the same $k$ LUT6: a plain 2-input adder sits at $E=1$ for every width, the ternary adder at $2-2/k$. All three approach $E=2$, the ceiling for row adders, but the 4:2 is uniformly above the ternary by exactly $1/k$ — and $1/k$ is not small at the $k\le 8$ widths that a bit-heap plateau actually offers.

**One LUT6 does both jobs.** Each column needs two functions of the same four inputs: the propagate signal $p_i=t_i\oplus w_i=x_i\oplus y_i\oplus z_i\oplus w_i$ (4 inputs) and the saved carry $c_{i+1}=\mathrm{MAJ}(x_i,y_i,z_i)$ (3 inputs). A Virtex/UltraScale+ LUT6 fractures into two 5-input LUTs over a *shared* input set, emitting `O6` and `O5` ([[Lookup-Tables]]) — and $\{x_i,y_i,z_i\}\subset\{x_i,y_i,z_i,w_i\}$, so the sharing constraint is met and both functions come out of one LUT6. The carry logic below it is dedicated silicon and free: the mux passes $c^{\text{chain}}_i$ when $p_i=1$ and its data input $w_i$ when $p_i=0$, which is correct because $p_i=0$ means $t_i=w_i$ and a full adder's carry-out then equals that common value; the XOR forms $s_i=p_i\oplus c^{\text{chain}}_i$.

**Delay is one LUT plus the chain.** The critical path is $\tau_L+k\,\tau_{CC}$ — identical to a plain $k$-bit adder, and about $2\tau$ shorter than the ternary adder's $3\tau+k\tau_{CC}$. Since $\tau_{CC}\lll\tau$, for the widths that fit inside one or two slices the compressor is effectively one LUT delay deep while removing $2k-1$ dots. That combination is what makes it the best row compressor in Table 7.3 and, together with the carry-chain GPCs, is why an FPGA compressor library is irregular enough that Dadda's full-adder-only schedule has nothing useful to say; the objective becomes efficiency, handled by the [[Efficiency-Driven Compression Heuristic]].

**On ASIC none of this holds.** The argument is entirely an artefact of [[FPGAs]]: it assumes carry propagation is orders of magnitude cheaper than routing and that the carry mux is free hardware you have already paid for. Remove the hard chain and the $k\,\tau_{CC}$ term becomes $k$ gate delays, at which point the propagation-free ASIC [[4:2 Compressor]] — constant depth, no chain — is the right cell again.

$$\boxed{\ X+Y+Z+W=S+C,\qquad 4k\ \text{dots}\to 2k{+}1\ \text{dots},\qquad E=2-\tfrac1k,\qquad t=\tau_L+k\,\tau_{CC}\ }$$

## When it breaks

- **$k=1$ is pointless.** $E=2-1/1=1$, no better than a bare full adder, and the chain is doing nothing. $k=2$ gives $E=1.5$; the compressor only starts beating the LUT-only GPCs of Table 7.3 around $k\ge 4$.
- **$E\to2$ flattens fast.** Going from $k=8$ ($E=1.875$) to $k=16$ ($E=1.9375$) buys $3\%$; past a slice column's worth of chain there is nothing left to win, and the asymptotic argument stops being a reason to widen.
- **Four rows must actually be there.** $k$ is bounded by the *plateau* of the heap, not by the operand width: a triangular multiplier heap is $\ge4$ high only across its middle columns, so the compressor is cut to fit that band and the ragged ends fall to other compressors.
- **It is a compressor, not an adder.** Two rows come out, so the heap still needs a final carry-propagate stage — see [[Split Final Adder]] for why that stage should not be one uniform fast adder.

> [!warning] Fig. 7.24a of the source drops an output bit
> Panel (a) labels the outputs $c_4,s_3,c_3,s_2,c_2,s_1,c_1,s_0$ and draws no carry-out from the leftmost bottom full adder, so $s_4$ is missing. That is not a labelling slip, it loses information: with $x=y=z=w=1111_2$ the true total is $60$, while the drawn outputs give $C=1111_2$ at weights $1..4$ ($=30$) and $s_3s_2s_1s_0=1110_2$ ($=14$), i.e. $44$. The missing $s_4=1$ carries the remaining $16$. Panel (b) has it right ($c_k,s_k,s_{k-1},\dots$), and so does the dot transformation in Fig. 7.23, p. 185, which shows $k+1$ sum dots. The diagram above restores it.

> [!warning] Not covered in the source — needs outside research
> Table 7.3 treats $\tau_{CC}$ as uniform over the whole row. Real AMD carry logic is segmented (`CARRY8` per slice on UltraScale+), so a chain crossing a CLB boundary picks up a routing term the model does not carry, and the delay stops being $\tau_L+k\tau_{CC}$ at some $k$ the book does not name.

> [!warning] Not covered in the source — needs outside research
> Table 7.3 and Fig. 7.24b are AMD Virtex/UltraScale+ specific. The Intel/Altera ALM equivalent — whether shared arithmetic mode can emit the saved carry alongside the propagate — is not given, and neither is the cost of *pipelining* a carry-chain row compressor, which cannot be cut mid-row.

## RTL (Spade)

```spade
/// Carry-chain 4:2 row compressor over K columns.
/// Returns (S, C): S is K+1 bits at weights 0..K, C is K bits that the
/// bit heap re-inserts at weights 1..K.
fn cc42<#uint K>(x: uint<K>, y: uint<K>, z: uint<K>, w: uint<K>)
    -> (uint<{K + 1}>, uint<K>)
{
    let t: uint<K> = (x ^ y) ^ z;                 // LUT: FA sum row
    let c: uint<K> = (x & y) | ((x ^ y) & z);     // LUT: FA carry row, saved
    (t + w, c)                                    // dedicated carry chain
}
```

`t` is the top row of FAs in the diagram and `c` is their carry outputs — both purely bitwise, hence `uint<K>` in and `uint<K>` out with no width growth, which is the formal statement that this half of the circuit has no carry propagation. `t + w` is the bottom row: Spade's `+` widens $K\to K+1$, and that extra bit *is* $s_k$, the output Fig. 7.24a forgets. The whole entity is combinational; the `(S, C)` tuple is a return convention only, since `C` never travels as a number — it is a row of dots the scheduler places one weight to the left. What synthesis does differently from the drawing: it will not infer two full adders per column but one fractured LUT6 plus a `CARRYn` primitive, and the `(x & y) | ((x ^ y) & z)` majority never becomes gates at all — it is a truth-table entry.

## Related Notes

- [[4:2 Compressor]] – compares: the ASIC cell that avoids carry propagation entirely, at two full adders per column instead of one LUT6.
- [[Ternary Adder]] – compares: same $E\to2$ ceiling, but $2-2/k$ against $2-1/k$ and roughly $2\tau$ more delay, because it routes its carries back instead of saving them.
- [[Carry-Save Adder]] – depends-on: "save the carry as a row" is exactly the deferral this circuit applies to the ternary adder.
- [[Full Adder]] – depends-on: the per-column $\mathrm{MAJ}/\mathrm{XOR}$ identity the derivation starts from.
- [[Lookup-Tables]] – depends-on: the O5/O6 fracturing that lets one LUT6 emit both the propagate and the saved carry.
- [[FPGAs]] – counter-example: the entire cost argument reverses without hard carry logic.
- [[Bit Heaps]] – supports: the $4k\to2k{+}1$ dot transformation is what the heap scheduler consumes.
- [[Efficiency-Driven Compression Heuristic]] – extends: row width $k$ is a free parameter, so the heuristic sweeps $k$ from 2 upward and keeps the best effective efficiency.
- [[Split Final Adder]] – extends: what happens to the two rows this leaves behind.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §7.3.2, pp. 182–183 — efficiency $E=\delta/k$ (7.27) and compression ratio $\gamma=b_i/b_o$ (7.28).
- §7.3.2.4, Table 7.3, p. 184 — LUT6 counts, efficiencies and delays for GPCs, counters and row adders on AMD FPGAs.
- §7.3.2.5 *Row Compressors for FPGAs*, pp. 184–186 — the carry-save argument for saving rather than reinserting the carry.
- Fig. 7.23, p. 185 — dot transformations, including 4:2 compressor variants (a) and (b).
- Fig. 7.24, p. 186 — functional view and AMD Virtex/UltraScale+ slice mapping [KZ14a].
