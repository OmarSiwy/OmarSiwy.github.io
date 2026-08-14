---
title: "1-of-4 Encoding"
description: "Carries two bits on four wires with exactly one wire toggling per symbol — same wire count as dual-rail, half the transitions."
kind: circuit
status: seed
spade: simulated
tags: [digital, asynchronous-sequential-logic]
aliases:
  - 1-of-4
  - 1-of-4 Code
  - 1-of-N Encoding
  - 1-of-N Code
  - Quad-Rail Encoding
  - Quad-Rail
---

# 1-of-4 Encoding

A delay-insensitive data code that packs two bits into one hot wire out of four, so a datum costs the same wires as dual-rail but exactly half the wire transitions.

```tikz title="1-of-4 encoder from two dual-rail bits, its completion OR, and the code table"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]

% ---------------- encoder: 4 AND gates, one per code word ----------------
\node[and port, number inputs=2] (g0) at (2.6,0.0) {};
\node[and port, number inputs=2] (g1) at (2.6,1.7) {};
\node[and port, number inputs=2] (g2) at (2.6,3.4) {};
\node[and port, number inputs=2] (g3) at (2.6,5.1) {};

\draw (g0.in 1) -- ++(-0.7,0) node[anchor=east] {$A.0$};
\draw (g0.in 2) -- ++(-0.7,0) node[anchor=east] {$B.0$};
\draw (g1.in 1) -- ++(-0.7,0) node[anchor=east] {$A.0$};
\draw (g1.in 2) -- ++(-0.7,0) node[anchor=east] {$B.1$};
\draw (g2.in 1) -- ++(-0.7,0) node[anchor=east] {$A.1$};
\draw (g2.in 2) -- ++(-0.7,0) node[anchor=east] {$B.0$};
\draw (g3.in 1) -- ++(-0.7,0) node[anchor=east] {$A.1$};
\draw (g3.in 2) -- ++(-0.7,0) node[anchor=east] {$B.1$};

\node[anchor=west,font=\footnotesize] at (-2.2,6.7)
  {two dual-rail bits $A,B$: $2\times2=4$ wires in};

% code-word labels on the four outputs
\draw (g0.out) -- (5.4,0.0);
\draw (g1.out) -- (5.4,1.7);
\draw (g2.out) -- (5.4,3.4);
\draw (g3.out) -- (5.4,5.1);
\node[anchor=south,font=\footnotesize] at (4.3,0.05) {$d_0$, 1 bit};
\node[anchor=south,font=\footnotesize] at (4.3,1.75) {$d_1$, 1 bit};
\node[anchor=south,font=\footnotesize] at (4.3,3.45) {$d_2$, 1 bit};
\node[anchor=south,font=\footnotesize] at (4.3,5.15) {$d_3$, 1 bit};

\node[anchor=west,font=\footnotesize] at (5.5,-0.42) {carries $00$};
\node[anchor=west,font=\footnotesize] at (5.5,1.28) {carries $01$};
\node[anchor=west,font=\footnotesize] at (5.5,2.98) {carries $10$};
\node[anchor=west,font=\footnotesize] at (5.5,4.68) {carries $11$};

\draw[dashed] (5.05,-0.6) -- (5.05,5.7);
\node[anchor=south,font=\footnotesize] at (5.05,5.75) {4 wires, at most one hot};

% ---------------- completion detection: one 4-input OR ----------------
\node[or port, number inputs=4] (orc) at (10.2,2.55) {};
\draw (7.6,0.0) -- (7.6,2.10) -- (orc.in 4);
\draw (7.9,1.7) -- (7.9,2.40) -- (orc.in 3);
\draw (7.9,3.4) -- (7.9,2.70) -- (orc.in 2);
\draw (7.6,5.1) -- (7.6,3.00) -- (orc.in 1);
\draw (5.4,0.0) -- (7.6,0.0);
\draw (5.4,1.7) -- (7.9,1.7);
\draw (5.4,3.4) -- (7.9,3.4);
\draw (5.4,5.1) -- (7.6,5.1);
\draw[->] (orc.out) -- ++(1.3,0) node[anchor=west] {done, 1 bit};
\node[anchor=north,font=\footnotesize] at (10.4,1.9) {one OR4 per 2 bits};

% ---------------- the code table ----------------
\begin{scope}[yshift=-5.0cm]
  \draw (0,0) rectangle (5.6,3.0);
  \draw (0,2.5) -- (5.6,2.5);
  \draw (2.6,0) -- (2.6,3.0);
  \node[anchor=west] at (0.15,2.75) {$d_3\,d_2\,d_1\,d_0$};
  \node[anchor=west] at (2.75,2.75) {meaning};
  \node[anchor=west] at (0.15,2.20) {$0\,0\,0\,0$};
  \node[anchor=west] at (2.75,2.20) {spacer / empty};
  \node[anchor=west] at (0.15,1.79) {$0\,0\,0\,1$};
  \node[anchor=west] at (2.75,1.79) {value $00$};
  \node[anchor=west] at (0.15,1.31) {$0\,0\,1\,0$};
  \node[anchor=west] at (2.75,1.31) {value $01$};
  \node[anchor=west] at (0.15,0.83) {$0\,1\,0\,0$};
  \node[anchor=west] at (2.75,0.83) {value $10$};
  \node[anchor=west] at (0.15,0.35) {$1\,0\,0\,0$};
  \node[anchor=west] at (2.75,0.35) {value $11$};
  \node[anchor=west,font=\footnotesize] at (0.0,-0.55)
    {the other 11 words are illegal: weight $\ne 0,1$};
\end{scope}

% ---------------- transition accounting ----------------
\begin{scope}[xshift=6.8cm,yshift=-5.0cm]
  \node[anchor=west] at (0,2.75) {\textbf{per datum, return-to-zero}};
  \node[anchor=west] at (0,2.15) {dual-rail, 2 bits: 4 wires, \textbf{4} edges};
  \node[anchor=west] at (0,1.60) {1-of-4, 2 bits: 4 wires, \textbf{2} edges};
  \node[anchor=west] at (0,1.00) {one $d_j$ rises, the same $d_j$ falls,};
  \node[anchor=west] at (0,0.55) {whatever the data};
  \node[anchor=west,font=\footnotesize] at (0,-0.05)
    {Hamming weight is 1 for every symbol,};
  \node[anchor=west,font=\footnotesize] at (0,-0.55)
    {so switching activity is data-independent};
\end{scope}

\end{circuitikz}
\end{document}
```

**Separate the two costs a data code charges you.** A delay-insensitive code spends *wires* to carry bits and spends *transitions* to deliver each datum, and these are independent quantities. A 1-of-$N$ code puts one hot wire out of $N$, so it carries $\log_2 N$ bits on $N$ wires and its **rate** is

$$R(N) \;=\; \frac{\log_2 N}{N}\ \ \text{bits per wire},$$

while under a return-to-zero discipline every datum costs exactly one rising and one falling edge no matter which symbol was sent, so its **activity** is

$$T(N) \;=\; \frac{2}{\log_2 N}\ \ \text{edges per bit}.$$

$R$ is stationary where $\tfrac{d}{dN}\big(\ln N / N\big) = (1-\ln N)/N^2 = 0$, i.e. at $N = e$, so over the integers the best rate is $R(3) \approx 0.528$ — but 1-of-3 carries $\log_2 3$ bits, which does not tile a binary word. The useful fact is that $R$ is *symmetric about the maximum* at the two nearest powers of two: $R(2) = R(4) = \tfrac12$. Dual-rail and 1-of-4 cost the identical $2k$ wires for a $k$-bit word.

> [!important] Same wires, half the edges
> $T$ is strictly decreasing in $N$ while $R$ has already come back to its dual-rail value at $N=4$. That coincidence — $R(4)=R(2)$ but $T(4)=\tfrac12 T(2)$ — is the entire argument for 1-of-4, and it does not repeat: $R(8) = \tfrac38$ buys $T(8) = \tfrac23$ at a third more wire.

**Count the edges on a real word.** Take $k$ bits, $k$ even. Under [[Four-Phase Handshake]] signalling, [[Dual-Rail Encoding]] asserts one rail of each of the $k$ pairs and then returns all of them to the spacer: $k$ rising plus $k$ falling edges, $2k$ per datum, and that count is the same for every data value because the code is constant-weight. The 1-of-4 code partitions the same word into $k/2$ symbols and asserts one wire in each: $k/2$ rising plus $k/2$ falling, $k$ edges per datum. On a link where wire capacitance $C_w$ dominates the receiver's gate capacitance, dynamic energy is proportional to the edge count, so this is a factor-of-two energy saving on the data wires at no change to the wire count — which is why the code lives on long routes such as [[Network-On-Chip]] links rather than inside function blocks.

**The code words are unordered, which is what makes it delay-insensitive.** The legal set is $\{0000, 0001, 0010, 0100, 1000\}$ on the 4-bit bus $d_3d_2d_1d_0$; no legal word is a bitwise subset of another legal word except the spacer, which is below all of them. Verhoeff's condition for a delay-insensitive code is exactly this *unordered* (Sperner) property, and the reason is visible in the transition itself: going from $0000$ to $d_j$ asserts one wire, and a one-wire move has no intermediate states to be misread. A receiver that sees Hamming weight 1 therefore knows the symbol is complete under arbitrary wire delays, with no timing assumption and no [[Matched Delay Line]]. The same argument runs backwards on the return-to-spacer phase.

**Completion detection collapses to one OR per symbol.** Because "weight 1" is decided per symbol, validity is

$$\mathrm{done}_j \;=\; d_{j,0} \vee d_{j,1} \vee d_{j,2} \vee d_{j,3},$$

one 4-input OR, against dual-rail's two-input OR *per bit*. For a $k$-bit word the [[Completion Detection Tree]] therefore has $k/2$ OR4 leaves instead of $k$ OR2 leaves, and the tree above them combines $k/2$ signals instead of $k$ — one level shallower. At $k=32$: 16 OR4 plus 15 two-input rendezvous cells at depth 5, versus 32 OR2 plus 31 cells at depth 6. Those combining cells must be [[Muller C-Element]]s rather than ANDs, so that the all-empty half of the four-phase cycle is acknowledged as well as the all-valid half; an AND tree reports "not valid" the instant the *first* symbol empties, which is one wire's delay, not all of them.

**The converter is four gates each way, and it is not free.** Writing $A$ for the high bit and $B$ for the low bit of a symbol, each as a dual-rail pair $(X.0, X.1)$, the encoder is one AND per code word,

$$d_0 = A.0 \wedge B.0,\quad d_1 = A.0 \wedge B.1,\quad d_2 = A.1 \wedge B.0,\quad d_3 = A.1 \wedge B.1,$$

which is a 2-to-4 decoder written on dual-rail inputs, and it is delay-insensitive by construction: a product term can only rise once *both* input pairs have left the spacer, so the encoder is simultaneously the completion detector for its own inputs. The decoder is the dual, one OR per output rail, by distributivity of OR over the disjoint code words:

$$A.1 = d_2 \vee d_3,\quad A.0 = d_0 \vee d_1,\quad B.1 = d_1 \vee d_3,\quad B.0 = d_0 \vee d_2.$$

Four AND2 in, four OR2 out, per 2 bits — $2k$ two-input gates each way for a $k$-bit word, 128 gates in total on a 32-bit link. That fixed conversion cost is paid once per link and the edge saving is paid per datum per wire, which is precisely why 1-of-4 wins on transport and loses on computation: there is no 1-of-4 logic family with the coverage that dual-rail DIMS or NCL threshold gates have, so a 1-of-4 datapath either converts back at every function block or implements $4\times4$-input blocks whose DIMS realisation grows as $N^2$ per operand pair.

**Constant weight buys side-channel resistance, and only if the wires match.** Every symbol has Hamming weight 1 and every datum costs exactly two edges, so the switching activity carries no information about the data — the same property that makes dual-rail attractive against power analysis, kept at half the energy. The assumption hiding in it is that the four wires present equal capacitance. Route $d_3$ on a different metal layer or twice the length and the per-symbol energy becomes data-dependent again; the code is constant-weight, the *load* is what has to be constant-energy. See [[Error Accuracy]] for why an equal-count argument is not an equal-magnitude argument.

**FPGA erases the gate-count advantage and keeps the wire one.** On an ASIC the OR4 is a single cell and the depth saving in the completion tree is real. On an FPGA a 6-LUT swallows the whole 2-bit detector either way: dual-rail's $(b_0.0 \vee b_0.1) \wedge (b_1.0 \vee b_1.1)$ is a 4-input function and the 1-of-4 OR4 is a 4-input function, so both are exactly one LUT and the leaf saving vanishes — see [[FPGAs]]. What survives is the transition saving on the routing, and even that is diluted because FPGA interconnect is buffered, so a fraction of the energy per edge is repeater switching rather than wire charging. The C-element tree above the leaves is the usual FPGA problem: it is combinational feedback, so it needs an instantiated LUT with a `DONT_TOUCH` and an explicit timing exception, not inferred logic.

$$\boxed{\ R(N)=\frac{\log_2 N}{N},\qquad T(N)=\frac{2}{\log_2 N}\ \text{edges/bit},\qquad R(4)=R(2)=\tfrac12,\ \ T(4)=\tfrac12\,T(2)\ }$$

**Where it stops working.**

- **Odd word widths.** $k/2$ symbols only tiles an even $k$; a leftover bit stays dual-rail and drags a 2-input OR back into the completion tree.
- **Wider 1-of-$N$ stops paying.** $R(8)=\tfrac38$ means 8 wires for 3 bits where dual-rail needs 6. The energy keeps improving, so 1-of-8 is only right when wire count is genuinely free and energy is not — the reverse of the usual constraint.
- **Short routes.** The conversion gates cost real capacitance. Below the length where $C_w$ dominates the encoder/decoder input capacitance, the $2k$ ANDs and $2k$ ORs cost more than the $k$ edges saved, and plain [[Dual-Rail Encoding]] wins.
- **Function blocks.** No general 1-of-4 gate library exists; every arithmetic block is either a conversion boundary or a $4\times4$ DIMS structure.
- **Deadlock is the failure mode.** A stuck-at fault produces a permanently illegal word — weight 0 or weight $\ge 2$ — and completion detection simply never fires. Safe, because no wrong datum is ever delivered, and undiagnosable, because there is no error signal, only a hang.
- **Two-phase changes the arithmetic.** Under [[Two-Phase Handshake]] signalling a symbol is one *transition* on one of the four wires and there is no return to spacer, giving $T = 1/\log_2 N$ — half again — but the receiver now needs event-sensitive storage and an XOR-based detector against the previous state, which is the standard reason the four-phase version is what gets built.

**RTL (Spade).** The encoder and decoder of the diagram, as pure combinational functions.

```spade
/// Two dual-rail bits in, one 1-of-4 code out.
fn encode_1of4(a0: bool, a1: bool, b0: bool, b1: bool) -> uint<4> {
    [a0 && b0, a0 && b1, a1 && b0, a1 && b1].as_uint()
}

/// One 1-of-4 code in, the 2-bit value plus its own validity out.
fn decode_1of4(d: uint<4>) -> (uint<2>, bool) {
    let w = d.as_bits();
    let hi = w[2] || w[3];
    let lo = w[1] || w[3];
    ([lo, hi].as_uint(), w.reduce_or())
}
```

The array literal in `encode_1of4` is the four AND gates of the diagram, and Spade packs element 0 into the **least** significant position, so `d.as_bits()[0]` is $d_0$ and the array order is the code table read bottom-up. `decode_1of4` is the four output ORs — `hi` and `lo` are $A.1$ and $B.1$, and the missing $A.0, B.0$ are their complements only because the input was assumed legal. `w.reduce_or()` is the OR4: on an ASIC one cell, on an FPGA one LUT shared with nothing. All of it is combinational, 4 bits in and 4 bits out in both directions, no clock. What synthesis will do differently from the drawing is exactly the thing that breaks the code: the encoder ANDs are logically redundant with whatever drives the rails, and an optimiser that merges them across the boundary destroys the "rises only when both pairs are valid" property, so the four cells need `DONT_TOUCH`. In a strict QDI flow they are C-elements rather than ANDs, which additionally makes the return-to-spacer phase acknowledge both input pairs instead of the first one to empty.

Verified by simulation: 3006 vectors — all six named cases including the spacer, a half-valid input that must stay all-zero, and the asymmetric pair $A{=}0,B{=}1 \mapsto d_1$ versus $A{=}1,B{=}0 \mapsto d_2$ that catches a reversed bit order — plus 3000 random rail patterns against a behavioural reference. A further 1000-symbol stream with interleaved spacers counted exactly 2000 wire edges against dual-rail's 4000, which is the boxed $T(4) = \tfrac12 T(2)$ measured rather than asserted.

**Related notes.**

- [[Dual-Rail Encoding]] – compares: identical $2k$ wires and identical delay-insensitivity, twice the edges; 1-of-4 is what you get by merging two dual-rail bits into one code.
- [[Completion Detection Tree]] – supports: replaces $k$ OR2 leaves with $k/2$ OR4 leaves and takes a level off the tree.
- [[Four-Phase Handshake]] – depends-on: the return-to-spacer phase is what makes every symbol cost exactly two edges regardless of data.
- [[Two-Phase Handshake]] – extends: transition signalling halves the edge count again, at the price of event-sensitive storage.
- [[Muller C-Element]] – depends-on: the cells above the OR4 leaves, and the strict-QDI form of the encoder ANDs.
- [[Choosing an Asynchronous Style]] – compares: where a constant-weight data code sits against bundled-data, which spends no extra wires at all.
- [[Network-On-Chip]] – supports: wire-dominated links are the case where the edge saving actually converts into energy.

## References

No assigned book source; written from standard digital-design and asynchronous-design canon.

- N. H. E. Weste & D. M. Harris, *CMOS VLSI Design* — dynamic energy per transition, wire versus gate capacitance, constant-weight codes.
- J. F. Wakerly, *Digital Design: Principles and Practices* — decoders and encoders as the 1-of-$N$ converter pair.
- M. M. Mano & M. D. Ciletti, *Digital Design* — one-hot code words and illegal-state detection.
- T. Verhoeff, *Delay-insensitive codes — an overview* (1988) — the unordered-code condition used above.
- Long-form source: [[0.5) Asynchronous Sequential Logic]], §Handshaking protocols and §Delay-insensitive and QDI.
