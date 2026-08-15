---
title: eY DSP and BRAM Mapping
description: "The single-precision case study: both tables packed into one 36 Kbit dual-port BRAM as 2^10 x 36, one 18x18 DSP whose product is therefore exact and can be rounded to nearest — killing the multiplier error term for one extra bit of final adder."
kind: circuit
status: seed
spade: simulated
source: "ASA §22.5.4, p. 661"
tags: [digital, fixed-point-computation-of-ey, fpga, dsp, bram, exponential]
aliases:
  - e^Y DSP and BRAM Mapping
  - eY FPGA Case Study
  - Single-Precision eY FPGA Mapping
---

# eY DSP and BRAM Mapping

The IEEE-single instance of the [[Higher-Order eY Architecture]] in which the DSP block's operand width and the block RAM's word geometry independently select the same $k=10$, so the whole $e^Y$ evaluator costs exactly one BRAM and one DSP — and the product, being exact, can be rounded to nearest instead of truncated.

```tikz title="Single-precision e^Y mapped onto one 36 Kbit dual-port BRAM and one 18x18 DSP block"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- inputs ----
  \draw[->] (0.6,10.6) -- (0.6,9.7);
  \node[anchor=west,font=\footnotesize] at (0.65,10.25) {$A$ \ 10 b};
  \draw[->] (4.4,10.6) -- (4.4,9.7);
  \node[anchor=west,font=\footnotesize] at (4.45,10.25) {$Z_{\mathrm{trunc}}$ \ 8 b, zero-ext.\ to 10};
  \draw[->] (10.4,10.6) -- (10.4,5.55);
  \node[anchor=west,font=\footnotesize] at (10.45,10.25) {$Z$ \ 17 b \ \texttt{ufix}$(-11,-27)$};

  % ---- BRAM ----
  \draw (-0.6,6.3) rectangle (6.4,9.7);
  \node[anchor=north west,font=\footnotesize] at (-0.55,9.65) {36\,Kbit block RAM --- $2^{10}\times36$, true dual port};
  \node[anchor=north,font=\footnotesize] at (0.6,9.15) {port A};
  \node[anchor=north,font=\footnotesize] at (4.4,9.15) {port B};

  % word layout bar: 28 + 2 + 6 = 36 bits, drawn to scale over 5.6 cm
  \draw (0.2,7.4) rectangle (5.8,8.0);
  \draw (4.56,7.4) -- (4.56,8.0);
  \draw (4.87,7.4) -- (4.87,8.0);
  \node[font=\footnotesize] at (2.38,7.7) {$e^A$ entry, 28 b};
  \node[font=\footnotesize] at (5.34,7.7) {$h$, 6 b};
  \node[anchor=south,font=\footnotesize] at (3.0,8.05) {one 36-bit word $\times$ 1024 addresses};
  \node[anchor=north,font=\scriptsize] at (4.71,7.35) {2 b spare};

  % ---- table outputs ----
  \draw[->] (1.4,6.3) -- (1.4,0.7);
  \node[anchor=west,font=\footnotesize] at (1.45,2.6) {$T=e^A$ \ 28 b \ \texttt{ufix}$(0,-27)$};

  \draw (5.6,6.3) -- (5.6,5.80) -- (8.4,5.80);
  \draw[->] (8.4,5.80) -- (8.4,5.54);
  \node[anchor=south,font=\footnotesize] at (7.6,5.83) {$H$ \ 6 b \ \texttt{ufix}$(-22,-27)$};

  % ---- F adder ----
  \draw (7.4,4.8) rectangle (11.4,5.55);
  \node[font=\footnotesize] at (9.4,5.17) {$+$ \ \ aligned at LSB $-27$};
  \draw[->] (9.4,4.8) -- (9.4,4.1);
  \node[anchor=west,font=\footnotesize] at (9.45,4.45) {$F=Z+H$ \ 18 b \ \texttt{ufix}$(-10,-27)$};

  % ---- T_trunc tap ----
  \draw (1.4,4.4) -- (7.0,4.4);
  \draw[->] (7.0,4.4) -- (7.0,4.1);
  \node[anchor=west,font=\footnotesize] at (1.55,4.62) {$T_{\mathrm{trunc}}=T[27{:}10]$ \ 18 b, \ $t=k=10$};

  % ---- DSP ----
  \draw (6.0,2.9) rectangle (11.4,4.1);
  \node[font=\footnotesize] at (8.7,3.72) {DSP block --- one $18\times18$ multiplier};
  \node[font=\footnotesize] at (8.7,3.25) {product is \emph{exact}: 36 b, \texttt{ufix}$(-9,-44)$};
  \draw[->] (8.7,2.9) -- (8.7,2.2);

  \draw (6.4,1.45) rectangle (11.0,2.2);
  \node[font=\footnotesize] at (8.7,1.82) {truncate to LSB $-28$ \ 20 b};
  \draw[->] (8.7,1.45) -- (8.7,0.7);

  % ---- final adder ----
  \draw (0.2,-0.1) rectangle (10.5,0.7);
  \node[font=\footnotesize] at (4.4,0.30) {$+$ \ \ at LSB $-28$: 29 b, one bit wider than $T$};
  \draw[->] (12.2,0.30) -- (10.5,0.30);
  \node[anchor=west,font=\footnotesize] at (12.25,0.30) {$2^{-28}$ (half ulp)};

  \draw[->] (4.4,-0.1) -- (4.4,-0.8);
  \node[anchor=west,font=\footnotesize] at (4.45,-0.45) {$M_{\mathrm{full}}$ \ 29 b \ \texttt{ufix}$(0,-28)$};
  \draw (3.0,-1.55) rectangle (5.8,-0.8);
  \node[font=\footnotesize] at (4.4,-1.18) {round by truncation};
  \draw[->] (4.4,-1.55) -- (4.4,-2.25);
  \node[anchor=west,font=\footnotesize] at (4.45,-1.9) {$M$ \ 28 b \ \texttt{ufix}$(0,-27)$};
\end{circuitikz}
\end{document}
```

*Own construction from the case-study parameters of §22.5.4, p. 661, laid over the dataflow of Fig. 22.6, p. 657. The word-layout bar inside the BRAM is drawn to scale: 28 : 2 : 6 of a 36-bit word.*

**Pin the parameters before touching a width.** The case study takes $w_F=23$, $g'=0$ (no guard bits internal to $e^Y$) and $g=4$, the guard count the $\bar\delta_{\mathrm{arch}}<5u$ budget of the higher-order architecture forces. Hence $\ell=-w_F-g=-27$ and $u=2^{\ell}=2^{-27}$. Choosing $k=10$ then fixes the two truncation parameters: $t=k=10$, and $p=\ell-g'+k-1=-18$. Everything below is a consequence.

**Two hard blocks, one $k$, by coincidence of two different expressions.** The $e^A$ table has $2^k$ entries, so the memory wants $k$ to be the address width of whatever geometry it is in. The multiplier wants $T_{\mathrm{trunc}}$ and $F$ to be the same width — that is what "square multiplier" means, and it is why $t$ was introduced at all ([[Truncated Multipliers]]). Both operand widths come out of the same arithmetic. $T$ is `ufix`$(0,\ell)$, i.e. $|\ell|+1=28$ bits; dropping $t$ LSBs leaves $|\ell|+1-t$ bits. $F=e^Z-1$ has MSB at $-k$ by the bound $0\le f(Z)<2^{-k+1}$ and LSB at $\ell$, so it is $|\ell|+1-k$ bits. With $t=k$ the two expressions are literally the same,

$$w(T_{\mathrm{trunc}}) = w(F) = |\ell| + 1 - k = 28 - k,$$

so a single $k$ sets the multiplier shape *and* the table depth. Demanding $28-k=18$ (the DSP) and $2^k=1024$ (the BRAM) is one equation twice.

$$\boxed{\;28-k=18 \;\wedge\; 2^{k}=2^{10}\;\Longrightarrow\;k=10,\ \ell=-27\;}$$

**Pack both tables into one word, not one memory each.** A 36 Kbit block RAM configured $2^{10}\times36$ presents a 36-bit word at each of 1024 addresses, through two ports with independent addresses. The $e^A$ table is $2^{10}\times28$ and the $h(Z)$ table is $2^{8}\times6$ — 28 672 and 1 536 bits — so both fields live side by side in one word: bits 35–8 hold $e^A$, bits 5–0 hold $h$, and 2 bits per word are spare. Port A is addressed by $A$ (10 bits, the full depth) and port B by $Z_{\mathrm{trunc}}$ zero-extended from 8 to 10 bits, so the $h$ field is only meaningful in the low quarter of the address space. The two lookups are concurrent because they are on different ports, not because they are at different addresses; a simple dual-port (one read, one write) memory would not do, since both accesses here are reads at unrelated addresses. Of the 36 864 bits, 30 208 carry data and 6 656 — the 2 spare bits everywhere plus the unused $h$ field above address 255 — are the price of collapsing two tables into one block. Consult [[Block Memory]] for why the depth-times-width menu is discrete in the first place, and [[eA Table]] and [[hZ Table]] for how each table's contents are generated.

> [!warning] Not covered in the source — needs outside research
> Fig. 22.6 (p. 657) declares $H$ as `ufix`$(-2k-1,\ell-g')$, which for $k=10$, $\ell=-27$ is 7 bits, while p. 661 sizes the $h(Z)$ table at $2^8\times6$. The book does not reconcile them. The 6-bit figure follows if the loose bound $0\le h(Z)<2^{-2k}$ of (22.26) is tightened to its leading Taylor term: $h(Z)\approx Z^2/2$, and at the largest *tabulated* argument $Z_{\mathrm{trunc}}=2^{-10}-2^{-18}$ this is $2^{-21}-2^{-28}+O(2^{-33})<2^{-21}$, putting the MSB at $-22$ and giving positions $-22\ldots-27$ — 6 bits. The diagram above follows p. 661. Whether the top table entry is safe against a round-to-nearest carry-out at that width is not addressed anywhere in the chapter.

**The DSP's granularity buys accuracy, not just area.** Three of the error terms in the higher-order budget are set by choices that a hard block makes for free (p. 661). First, $t$ may be *reduced* — a more accurate $T_{\mathrm{trunc}}$ — at zero cost for as long as $T_{\mathrm{trunc}}$ still fits one DSP input; the LUT-fabric version would pay area for every bit. Second, the $e^A$ table's output may be *widened* for free up to the memory's word width, which is where the 2 spare bits per word would go. Third, and the one that changes the error analysis qualitatively: if the multiplier fits in a single DSP block, the block emits the **full** $18+18=36$-bit product, positions $-9$ down to $-44$. That product is exact, so there is no truncated-multiplier error to bound at all — only a final rounding, and rounding an exact value to nearest costs half an ulp instead of the full ulp a faithful truncated multiplier costs ([[Rounding]]). Re-summing the p. 659 budget with $\delta_{\mathrm{mult}}=u/2$ in place of $1u$:

$$\bar\delta_{\mathrm{arch}} = \underbrace{0}_{\text{final round}} + \underbrace{0.5}_{\text{mult}} + \underbrace{1.25}_{\mathrm{trunc}\,T} + \underbrace{0.825}_{H} + \underbrace{1}_{\mathrm{trunc}\,Z} + \underbrace{0.625}_{T} = 4.2u$$

against the $4.7u$ the same choices give with a truncated multiplier — still under $5u$, so $g=4$ stands, now with slack.

**Rounding to nearest is one bit of adder, not an adder.** Round-to-nearest at position $\ell$ means adding $2^{\ell-1}=2^{-28}$ and truncating. Rather than build that as a separate increment on the product, push it into the reconstruction adder $M_{\mathrm{full}}=T+T_{\mathrm{trunc}}\cdot F$: run that adder one position lower, at LSB $-28$ instead of $-27$, feed it the product truncated to $-28$ and a constant 1 in the new bottom position, then drop that bit. The adder grows from 28 to 29 bits and nothing else changes — the half-ulp constant is not an operand, it is a carry-in. The whole manoeuvre is one LUT wide on FPGA, and on the fabrics where the DSP block has a cascade or C input it is not even that, since the constant rides in on the accumulator port.

**Asymmetric DSPs give the rest away.** On a Xilinx-style $25\times18$ DSP the wider port takes $T_{\mathrm{trunc}}$, so $t$ can fall from 10 to 3 and $T_{\mathrm{trunc}}$ becomes the full 25 bits. Since $\delta_{\mathrm{trunc}T}=2^{\ell+t-g'}\cdot1.25\cdot2^{-k}$, this drops that term from $1.25u$ to $1.25\cdot2^{-7}u\approx0.01u$, and the five inner terms sum to about $2.96u$ — inside the $<4u$ window p. 659 identifies as the condition for holding $g$ at its minimum of 3. Taking that route re-opens the whole sizing, since $g=3$ moves $\ell$ to $-26$ and needs $g'>0$; the point is only that the accuracy is there for free, sitting in a DSP port that would otherwise be zero-padded.

$$\boxed{\;\underbrace{2^{10}\!\times\!28 \;\uplus\; 2^{8}\!\times\!6 \;\subset\; 2^{10}\!\times\!36}_{\text{one 36 Kbit BRAM, both ports}}\;+\;\underbrace{18\times18\ \text{exact}}_{\text{one DSP}}\;\Longrightarrow\;\bar\delta_{\mathrm{arch}}=4.2u,\ \ \text{faithful single precision}\;}$$

**When it breaks.**

- **Only single precision lands here.** binary16 wants $k\approx(\ell+1)/2=7$ and the [[First-Order eY Architecture]], whose $6\times8$ multiplier wastes 90 % of a DSP; double precision needs $k=9$ *and* a degree-2 [[Polynomial hZ Evaluator]], which is several DSPs and more than one BRAM. The one-BRAM-one-DSP result is a coincidence of $w_F=23$, not a scaling law.
- **One bit past the DSP and the exactness evaporates.** If either operand exceeds the block's port width the product is no longer emitted whole: it becomes a tiled multi-DSP product ([[Multiplier Tiling]]) or reverts to a truncated multiplier, and $\delta_{\mathrm{mult}}$ goes back to $1u$ — a $0.5u$ cliff for one bit.
- **Both BRAM ports are spent.** The packing consumes the entire memory, both ports included. A surrounding design that wanted the second port — for a coefficient table, a FIFO, a debug read — needs a second BRAM, at which point splitting the two tables into separate memories is free anyway and the packing was pointless.
- **The geometry is vendor-specific.** $2^{10}\times36$ dual-port is the shape the book names; a fabric whose largest memory is a different size, or whose widest true-dual-port word is narrower than 34 bits, does not admit this packing and forces a different $k$ or a second block. The chapter gives no numbers for any device other than the one it describes.
- **$k$ is quantised by the address width.** There is no $k=10.5$. Moving to $k=11$ doubles the $e^A$ table to $2^{11}\times28=57$ Kbit — two BRAMs — to shrink the multiplier to $17\times17$, which still occupies one DSP. The next step in either direction is a whole hard block.

**RTL.**

```spade
/// Field extraction from one packed 36-bit BRAM word.
/// Bits 35..8 = e^A entry, bits 7..6 spare, bits 5..0 = h(Z) entry.
fn ea_field(word: uint<36>) -> uint<28> { word.as_bits()[8..36].as_uint() }
fn h_field(word: uint<36>) -> uint<6> { word.as_bits()[0..6].as_uint() }

/// IEEE-single e^Y reconstruction: w_F=23, g=4, g'=0, k=10, t=10, p=-18.
entity ey_single(
    word_a: uint<36>,   // BRAM port A, addressed by A
    word_z: uint<36>,   // BRAM port B, addressed by zext(Z_trunc)
    z: uint<17>,        // Z, ufix(-11,-27)
) -> uint<28> {
    let t: uint<28> = ea_field(word_a);      // T,  ufix(0,-27)
    let h: uint<6> = h_field(word_z);        // H,  ufix(-22,-27)
    let one: uint<1> = 1;
    let zero: uint<1> = 0;

    let f: uint<18> = trunc(zext::<17, 18>(z) + zext::<6, 18>(h));  // F, ufix(-10,-27)
    let tt: uint<18> = t.as_bits()[10..28].as_uint();               // T_trunc, ufix(0,-17)
    let prod: uint<36> = tt * f;                                    // exact, ufix(-9,-44)
    let ph: uint<20> = prod.as_bits()[16..36].as_uint();            // ufix(-9,-28)

    // final adder one position lower than T: half ulp enters as the bottom constant
    let acc: uint<29> = (t.concat(zero) +. zext::<20, 29>(ph)) +. zext::<1, 29>(one);
    acc.as_bits()[1..29].as_uint()                                  // M, ufix(0,-27)
}
```

`word_a` and `word_z` are the two BRAM data outputs of the diagram, not two memories: the same 36-bit layout is sliced two ways, which is exactly what `ea_field` and `h_field` say. The width arithmetic is the diagram's — `t.as_bits()[10..28]` *is* the $t=10$ truncation, `tt * f` is $18\times18\to36$ with no truncating variant anywhere because the product must stay exact, and `t.concat(zero)` is the one-position shift that turns the 28-bit reconstruction adder into the 29-bit one; the `+. one` is the half ulp. All of it is combinational — the block is a pure function of one BRAM read, so the real design registers it wherever the DSP's own pipeline registers fall, which is the one thing synthesis does differently from the drawing: the multiplier and the adder shown as two boxes collapse into a single DSP slice with its internal registers, and the `truncate to LSB −28` box disappears entirely into which product bits get wired out.

Compiles under `spade 0.19.0` and simulates clean: **5 007 vectors**, seven named plus 5 000 random, against a behavioural reference computing $M = T + \lfloor (T_{\mathrm{trunc}}F + 2^{16})/2^{17}\rfloor$ directly. The named set includes field-isolation vectors (junk in `word_a`'s $h$ field and in `word_z`'s $e^A$ field must not leak), an exact-half-ulp vector that a truncating multiplier would get wrong by one, and asymmetric pairs — small $T$ with large $F$ against large $T$ with small $F$ — which a transposed operand order would fail.

**Related Notes.**

- [[Higher-Order eY Architecture]] – depends-on: this is that architecture with every parameter bound to a hard block; the dataflow, the $t$/$p$ truncations and the error terms are all its.
- [[DSP Blocks]] – depends-on: the $18\times18$ port width is what selects $k=10$, and the block's willingness to emit the full product is what makes $\delta_{\mathrm{mult}}=u/2$ possible.
- [[Block Memory]] – depends-on: the $2^{10}\times36$ dual-port geometry sets the table depth and the packing budget.
- [[eA Table]] – supports: supplies the 28-bit $e^A$ field of every word.
- [[hZ Table]] – supports: supplies the 6-bit $h$ field, valid only in the low $2^8$ addresses.
- [[Truncated Multipliers]] – counter-example: the truncated multiplier is precisely what fitting one DSP deletes; its $1u$ becomes $0.5u$.
- [[Multiplier Tiling]] – extends: the answer once the operands outgrow a single block and the product stops being exact.
- [[Rounding]] – supports: round-to-nearest of an exact value costs half an ulp, and here costs one bit of adder to implement.
- [[Choosing an eY Architecture]] – compares: where this mapping sits against the first-order, polynomial and iterative families.
- [[FPGAs]] – depends-on: the whole argument is about coarse hard-block granularity being free accuracy rather than waste.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §22.5.4 FPGA-Specific Remarks, including the IEEE-single case study — p. 661
- §22.5.1 error budget re-summed here ($\delta_{\mathrm{mult}}$, $\delta_{\mathrm{trunc}T}$, $g$ vs $g'$ trade) — pp. 658–659
- Fig. 22.6, the higher-order dataflow and its signal formats — p. 657
- §22.5.2 first-order architecture, for the binary16 comparison — pp. 659–660
- §22.5.3 polynomial evaluator, for the double-precision comparison — pp. 660–661
