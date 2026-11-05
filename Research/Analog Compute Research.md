LThesis: As analog gets more and more explored by LLMs, they have a higher ceiling than systollic arrays on throughput.

https://github.com/OmarSiwy/HT-AIMC

> [!summary] TL;DR
> - **The route:** sum more rows per conversion (8 → 64–128) so the ADC is shared by more MACs. The repo's 128-row macro is at 4.5 fJ/MAC before ADCs, but is not yet scored end to end.
> - **Blockers before any accuracy claim:** the ADC reference droops 35× over spec, and only ~8.4–9.5 of the 12 ADC bits are real.

Theory and citations: [[Analog Compute]]. Design point: the owner's ASAP7 study ([[Analog IMC v Systollic Arrays.txt]]). Measured anchor: the sky130 chip in the repo (`METRICS.md`, `ARCH_METRIC.md`). Tooling: [[Tooling]]. Format follows [[The Workflow]].

**Source labels:** M measured (SPICE/RTL in repo) · D derived from M · O owner's table · A assumed here. Nothing is a silicon result.

## How the comparison works

Both machines are scored by one script on Llama-3-8B shapes: tok/s per 100 mm² die first, then TOPS/W. That keeps the comparison fair.

- **Systolic density** is fixed: $f/A_{PE}$ MAC/s/mm².
- **Analog density** is $NM/(t_{pass}A_{tile})$. $N$ (rows summed per conversion) is a knob: more rows share one ADC. The thesis is that this knob reaches further than $f/A_{PE}$ at equal model quality.
- **Memory is not the edge here.** Weights stream from HBM, so the analog design gives up "weights never move". Both machines hit the same HBM limit.

## Architecture

One die streams weights from HBM into analog tiles, multiplies and sums them as charge, converts each column with an ADC, and finishes in digital. This is the 8 × 256 bit-serial point, chosen because it is the only one with a full system score (see Gap 1).

```tikz title="Figure 1. Data flow of one HT-AIMC die (ASAP7 design study). Weights stream from HBM into the tiles just before the activations that use them. Each tile multiplies by charge (Q = CV) and sums by charge sharing, a 12-b SAR converts each column, and a digital rail recombines the results and runs attention. The dashed box is the analog macro."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[fill=black!4] (0,4.0) rectangle (2.8,5.2);
  \node[align=center,font=\scriptsize] at (1.4,4.6) {\textbf{HBM stream}\\ W8 codes, 819 GB/s};
  \node[font=\scriptsize] at (1.4,5.5) {compiler: GGUF to cap codes};
  \draw[fill=black!4] (0,1.6) rectangle (2.8,2.8);
  \node[align=center,font=\scriptsize] at (1.4,2.2) {\textbf{Row drive (B2)}\\ bit-serial $|x|$ planes\\ 7 slots of 0.849 ns};
  \draw[dashed] (3.6,-0.2) rectangle (10.8,5.4);
  \node[font=\scriptsize,anchor=south west] at (3.6,5.4) {analog macro};
  \draw[fill=black!4] (3.8,1.6) rectangle (6.8,5.2);
  \node[align=center,font=\scriptsize] at (5.3,3.4) {\textbf{Weight tile (B1)}\\ 8 rows $\times$ 256 cols\\ $\times$ 2 slices, differential\\ gain cell on MOM caps\\[3pt] multiply: $Q=CV$\\ add: charge sharing};
  \draw[fill=black!4] (7.8,3.8) rectangle (10.6,5.2);
  \node[align=center,font=\scriptsize] at (9.2,4.5) {\textbf{Column banks (B3)}\\ 56 fF, ping-pong\\ 1:16 slice merge};
  \draw[fill=black!4] (7.8,1.6) rectangle (10.6,3.0);
  \node[align=center,font=\scriptsize] at (9.2,2.3) {\textbf{Column ADC (B4)}\\ 12-b SAR, 3 cols/ADC\\ 86 per tile};
  \draw[fill=black!4] (7.8,0.0) rectangle (10.6,0.9);
  \node[align=center,font=\scriptsize] at (9.2,0.45) {\textbf{Reference (B5)}\\ class-A CDAC ref};
  \draw[fill=black!4] (11.6,2.8) rectangle (14.6,5.2);
  \node[align=center,font=\scriptsize] at (13.1,4.0) {\textbf{Digital rail}\\ slice/plane shift-add\\ K accumulate, ABFT\\ requant to INT8};
  \draw[fill=black!4] (11.6,0.0) rectangle (14.6,1.8);
  \node[align=center,font=\scriptsize] at (13.1,0.9) {\textbf{Attention rail}\\ KV cache, $QK^T$,\\ softmax, $AV$};
  \draw[->] (2.8,4.6) -- (3.8,4.6);
  \node[font=\scriptsize,above] at (3.3,4.6) {write};
  \draw[->] (2.8,2.2) -- (3.8,2.2);
  \draw[->] (6.8,4.5) -- (7.8,4.5);
  \draw[->] (9.2,3.8) -- (9.2,3.0);
  \draw[->] (9.2,0.9) -- (9.2,1.6);
  \draw[->] (10.6,2.3) -- (11.1,2.3) -- (11.1,3.4) -- (11.6,3.4);
  \draw[->] (13.1,2.8) -- (13.1,1.8);
  \node[font=\scriptsize,right] at (13.1,2.3) {Q, K, V};
  \draw[->] (13.1,0.0) -- (13.1,-0.7) -- (1.4,-0.7) -- (1.4,1.6);
  \node[font=\scriptsize,above] at (5.3,-0.7) {next-layer INT8 activations};
\end{circuitikz}
\end{document}
```

| Block | In → Out | Does | Key number |
|---|---|---|---|
| Compiler (offline) | GGUF Q8_0 → cap codes, bit-plane schedule, golden code per pass | Splits each $I\times O$ matrix into $\lceil I/8\rceil\lceil O/256\rceil$ tiles; picks which 12 of 19 output bits survive | 4096² layer = 8192 tiles ᴰ |
| B1 Weight store | W8 from HBM (819 GB/s, 4 pJ/bit) → charge on MOM caps (1 fF / 0.25 fF units) | Writes a tile just before use, holds it as charge. Cell needs 5 T/bit, not 3 ᴼᴹ | holds ≥ 1.32 µs ᴼ |
| B2 Row drive | INT8 activations → 0/V on each row, one bit plane per slot | Bit-serial input, so the row DAC is just an inverter. Sign handling undocumented (Gap 3) | 7 slots × 0.849 ns = **5.94 ns/word**; 108 pJ/pass ᴼ |
| B1+B3 Tile + column | 8 rows × 256 cols × 2 slices → charge on a 56 fF bank | Multiply by $Q=CV$, add by charge sharing. Two banks ping-pong; slice merge runs on the idle one | **0.69 TOPS/tile**; 88 pF banks = 18.4k µm²/tile ᴼ |
| B4 Column ADC | bank charge → 12-b code | SAR: 6 fast decisions, 1 redundant, 7 quiet ones. 3 columns per ADC | 86 ADCs/tile; 3 × 1.61 = 4.83 ns ≤ 5.94 ns |
| B5 Reference | supply → ADC reference | Class-A buffer holds $V_{ref}$ for all 14 decisions | droop **130 µV vs 3.7 µV spec** ᴹ |
| Digital rail | 12-b codes → INT8, fault flag | Shift-adds planes and slices, sums partials along K, checksum (ABFT), requantizes | 512 partials in a 21-b acc for $I=4096$ ᴰ |
| Attention rail | Q, K, V → next layer | KV cache, $QK^T$, softmax, $AV$, all digital | 16 MB KV holds 256 tokens; one 640-token request needs 40 MiB ᴰ |

```tikz title="Figure 2. One differential charge-domain column (3 of 8 rows drawn). The bit-plane driver sets the bottom plates of C+ and C-, whose sizes encode the weight code. The share switches dump each column onto its bank, and a comparator plus SAR logic converts the difference. The MSB bank doubles as the SAR CDAC."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \y/\i in {4.4/1,3.0/2,1.4/8} {
    \draw[fill=black!4] (1.85,\y-0.25) rectangle (2.65,\y+0.25);
    \node[font=\scriptsize] at (2.25,\y) {drv};
    \node[above,font=\scriptsize] at (2.25,\y+0.25) {$x_{\i}[k]$};
    \draw (1.85,\y) to[C,l_=$C^{+}_{\i}$] (0,\y);
    \draw (2.65,\y) to[C,l=$C^{-}_{\i}$] (4.5,\y);
    \fill (0,\y) circle (1.5pt);
    \fill (4.5,\y) circle (1.5pt);
  }
  \node at (2.25,2.15) {$\vdots$};
  \draw (0,4.9) -- (0,0) -- (5.4,0);
  \node[above,font=\scriptsize] at (0,4.9) {col$^{+}$};
  \draw (4.5,4.9) -- (4.5,0.9) -- (5.4,0.9);
  \node[above,font=\scriptsize] at (4.5,4.9) {col$^{-}$};
  \draw (5.4,0.9) to[nos,l=$\phi_s$] (6.6,0.9);
  \draw (5.4,0) to[nos,l_=$\phi_s$] (6.6,0);
  \draw (6.6,0.9) to[C,l=$C_{col}$] (6.6,2.1);
  \node[above,font=\scriptsize] at (6.6,2.1) {$V_{CM}$};
  \draw (6.6,0) to[C,l_=$C_{col}$] (6.6,-1.2);
  \node[below,font=\scriptsize] at (6.6,-1.2) {$V_{CM}$};
  \fill (6.6,0.9) circle (1.5pt);
  \fill (6.6,0) circle (1.5pt);
  \node[op amp,scale=0.8] (A) at (8.6,0.45) {};
  \draw (6.6,0.9) -- (7.1,0.9) |- (A.-);
  \draw (6.6,0) -- (7.25,0) |- (A.+);
  \draw (A.out) -- ++(0.4,0) node[right,draw,fill=black!4,font=\scriptsize,align=center] {SAR logic\\ 12 b\\ 3 cols/ADC};
  \node[font=\scriptsize,anchor=west,align=left] at (5.2,4.3) {$V^{+}-V^{-}\propto\sum_i x_i[k]\,(C^{+}_i-C^{-}_i)$\\ $k$: bit plane; slices merged 1:16\\ on the idle bank};
\end{circuitikz}
\end{document}
```

### Throughput

A token needs $7.50\times10^9$ MACs. One tile pass is 2048 MACs in 5.94 ns.

- Per tile: $2048/5.94\ \text{ns}=344.6$ GMAC/s.
- At 49,168 tok/s, **1070 tiles** are busy at once ᴰ.

### Weight reuse

Streaming weights only pays if each loaded weight serves many tokens. The tiles cannot hold weights long enough for that.

| | Tokens per weight load | Src |
|---|---|---|
| Needed to keep HBM fed ($t_{sweep}=7.5\ \text{GB}/819\ \text{GB/s}=9.16$ ms) | **450** | D |
| Needed once KV-cache traffic (372 GB/s) shares HBM | **825** | D |
| What one write survives ($1.32\ \mu\text{s}/5.94\ \text{ns}$) | **222** | D |

DRAM costs 0.53 mJ/token at 450 reuse vs 1.14 mJ of compute, so it adds **47 %** ᴰ. Cell writes (42 µJ per sweep) are negligible.

### Precision

The ADC outputs 12 bits but only about 8.4–9.5 are real. The rest is range, which is acceptable if the 7 dropped bits are chosen well (Gap 4).

| Limit | Bits | Src |
|---|---|---|
| Exact result needs $\log_2 8+8+8$ | 19 | D |
| ADC output | 12 | O |
| kT/C noise, 56 fF at 0.7 V (true 12 b needs 1.7 pF) | ~9.5 | A |
| Quiet comparator, 0.60 mV rms (52.3 dB) | **8.4 ENOB** | D |
| Settling error 0.067 % = 2.7 LSB at 12 b, 0.69 at 10 b | fine at ≤ 10 b | M |

### Energy

The ADC dominates energy, on paper and that is true

- Drive + conversion: $(108+70.9)\ \text{pJ}/2048=$ **87.4 fJ/MAC**, a 22.9 TOPS/W ceiling for those two blocks ᴰ.
- sky130: conversion is 1345.1 of 2190.5 pJ per pass = **61 %** ᴹ.
- Rail: 3158 cells, 24.6 pJ/pass; ABFT costs 5.9 % of columns and 1268 cells ᴹ.

## Possible Improvements

These are the levers, best gain per risk first. Numbers are the owner's or the repo's, not new estimates.

| Lever | Gain | Cost / risk | Status |
|---|---|---|---|
| Fix B5 reference droop | Required for any accuracy claim | buffer power, area | open |
| Bank caps stacked under the array | **+35 % tok/s** (66,565), −12 % TOPS/W ᴼ | coupling into the share node | Pareto row |
| More rows per conversion (8 → 64–128) | ADC shared $N\times$; analog wins only at large arrays (digital CIM wins ≤ 64×64, Sun 2024) | +$\log_2N$ ADC bits, parasitics, settling, IR drop | 128 × 8 macro at **4.50/4.59 fJ/MAC** (TT27/SS85) before ADCs ᴹ |
| Share conversion across tiles (cascade K) | 0.55× (K=2), 0.41× (K=4) ADC energy; 2.09× tok/J ᴹ | errors grow as $\sqrt K$ | measured, sky130 |
| Time-domain SAR + reservoir reference | **27.17 TOPS/W** at 34,976 tok/s ᴼ | −35 % tok/s | Pareto row |
| Keep weights resident across dies | removes 0.53 mJ/token DRAM and the reuse gap | needs capacity for 8.03 B weights (unsized) | open decision |
| Gain-cell KV / analog attention (Leroux 2025) | attention is the one place stationarity always helps | retention must outlive the context (5 ms in 28 nm) | literature |
| Null-balancing readout | ADC only sees a ≤ 1 LSB residue | only in Mythic patents | repo notes |
| Hardware-aware fine-tuning | absorbs zero-mean noise (Phi-3-mini 8.01 → 3.81 % loss) | not IR drop, clipping or drift; 20 B tokens, must be counted | literature |

**Don't:** PWM inputs (−50 % tok/s, no TOPS/W gain ᴼ). 4-level buffered rows with a StrongARM SAR (buffers miss settling at 0.64 %, comparator misses by 7.9 dB ᴹ).

### Score vs systolic

At tile level the thesis is one inequality. With a 1 GHz systolic clock ᴬ, the tile (array, 86 SARs, banks, drivers) must be smaller than 345 PEs:

$$A_{tile}<\frac{R_{tile}}{f}A_{PE}=\boxed{345\,A_{PE}}$$

At system level, on the owner's table ᴼ:

| Design point | tok/s | vs lit. PE | TOPS/W | fJ/MAC | vs lit. PE |
|---|---|---|---|---|---|
| Chosen (bit-serial, 3 cols/ADC) | 49,168 | −19.4 % | 13.21 | 151.4 | +38 % |
| Bank caps under array | 66,565 | **+9.1 %** | 11.60 | 172.4 | +58 % |
| VTC SAR, reservoir ref | 34,976 | −42.7 % | 27.17 | 73.6 | **−33 %** |
| Systolic, synthesized PE | 46,398 | −23.9 % | 10.61 | 188.5 | +72 % |
| Systolic, literature PE | 61,005 | — | 18.30 | 109.3 | — |

Each analog point wins one axis at most. The verdict: **supported only against the synthesized baseline**; more rows per conversion is the untested route to the ceiling claim.

```tikz title="Figure 3. The owner's Pareto points (O): tok/s per 100 mm2 die vs TOPS/W. Filled dots are analog points feasible on paper, open circles are rows marked infeasible, and red squares are the systolic baselines. The shaded quadrant beats the literature systolic PE on both axes; it is empty."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[green!10] (5.15,4.6) rectangle (10.4,5.8);
  \node[font=\scriptsize,align=center] at (7.8,5.2) {beats literature systolic\\ on both axes: empty};
  \draw[->] (0,0) -- (10.6,0);
  \node[below left,font=\scriptsize] at (10.6,-0.35) {TOPS/W};
  \draw[->] (0,0) -- (0,6.0);
  \node[above,font=\scriptsize] at (0,6.0) {tok/s per die (k)};
  \foreach \v/\x in {10/1,15/3.5,20/6,25/8.5} { \draw (\x,0.08) -- (\x,-0.08); \node[below,font=\scriptsize] at (\x,-0.08) {\v}; }
  \foreach \v/\y in {20/0.5,40/2.5,60/4.5} { \draw (0.08,\y) -- (-0.08,\y); \node[left,font=\scriptsize] at (-0.08,\y) {\v}; }
  \draw[dashed] (5.15,0) -- (5.15,5.8);
  \draw[dashed] (0,4.6) -- (10.4,4.6);
  \foreach \x/\y in {2.605/3.417,1.8/5.157,2.39/2.82,1.235/5.349,0.825/4.65,0.89/4.919,1.61/4.584,4.19/3.716,9.585/1.998,9.775/0.255,0.815/3.277,1.225/3.886} { \fill (\x,\y) circle (2pt); }
  \foreach \x/\y in {1.44/5.389,3.78/5.292} { \draw (\x,\y) circle (2.5pt); }
  \fill[red!70] (1.235,3.07) rectangle (1.375,3.21);
  \fill[red!70] (5.08,4.53) rectangle (5.22,4.67);
  \node[font=\scriptsize,anchor=west] at (2.7,3.3) {chosen};
  \node[font=\scriptsize,anchor=west] at (1.9,5.05) {caps under array};
  \node[font=\scriptsize,anchor=north] at (1.305,3.0) {systolic (synth.)};
  \node[font=\scriptsize,anchor=north west] at (5.2,4.5) {systolic (lit.)};
  \node[font=\scriptsize,anchor=south] at (9.585,2.1) {VTC SAR, reservoir};
  \node[font=\scriptsize,anchor=south east] at (9.7,0.3) {PWM};
  \node[font=\scriptsize,anchor=west] at (3.9,5.45) {infeasible};
\end{circuitikz}
\end{document}
```

## Open questions / Gaps

Everything below is unknown, not assumed. Each one can change the verdict.

| # | Gap | Why it matters | To close |
|---|---|---|---|
| 1 | **Which macro is current?** Repo search (`IMC_ARCHITECTURE_SEARCH.md`) picks a passive **128 × 8** tile; this note specs **8 × 256** | All derivations above may move | Redo numbers once the search settles |
| 2 | **Retention vs reuse:** a write lasts 222 words; HBM needs 450 (825 with KV traffic) | Needs an on-die rewrite buffer (not scored) or 2.67 µs retention | Check whether the Pareto model charges for it |
| 3 | **Sign handling** for $\lvert x\rvert$ planes undocumented | Changes the negation test | Write down where sign is applied ($C^+/C^-$ steering?) |
| 4 | **7 dropped bits** (19 → 12) | Clipping rare large sums costs quality | Measure on SmolLM2-135M (N8) |
| 5 | **4 cols/ADC anomaly:** 6.44 ns > 5.94 ns; owner reports −12 % tok/s, pass-bound predicts −19 % | Another bound is active in the model | Find which |
| 6 | **Reference droop 35× over spec** (130 vs 3.7 µV = 0.76 LSB, code-dependent) | Calibration can't remove it; blocks all accuracy claims | Fix B5 |
| 7 | **KV traffic** takes 372 of 819 GB/s, reuse need rises 450 → 825 | Lowers both machines' absolute numbers | Check the Pareto model charges it |
| 8 | **The two areas:** $A_{tile}$ and ASAP7 $A_{PE}$, plus the real systolic clock | Decide the 345-PE threshold, i.e. the thesis | Synthesize `digital/sysreference`, lay out tile |
| 9 | **Compute-SNR requirement** per layer (literature: 10–40 dB) | Sets exit criterion 5 | Get it from N8 |
| 10 | **Rail in analog?** Owner marked it "convert to analog" | Errors would add as $\sigma\sqrt K$ ([[Analog Compute#The ADC Dominates Above About Five Bits]]) | Decide |
| 11 | **Resident weights capacity** for 8.03 B weights | Needed to judge the "keep weights resident" lever | Size it in `ARCH_METRIC` |
