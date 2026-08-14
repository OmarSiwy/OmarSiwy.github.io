---
title: Intel ALM
description: "Intel's half-ALM: one LUT4, two LUT3s, a HARDENED full adder and two FFs — the adder costs no LUT, so both LUT layers stay free to feed it."
kind: circuit
source: "ASA §4.1.3, pp. 93-94; §5.4.2-5.4.4, pp. 128-132"
status: seed
spade: simulated
tags: [digital, fpgas, lut, adder, carry, intel]
aliases:
  - ALM
  - Adaptive Logic Module
  - Intel Adaptive Logic Module
  - Altera ALM
  - Stratix ALM
  - Logic Array Block
  - LAB
---

# Intel ALM

The adaptive logic module is Intel's two-BLE cell whose full adder is **hardened silicon rather than a LUT configuration**, so unlike the [[AMD BLE]] its entire LUT layer survives an addition and can compute an arbitrary function of the operands for free.

```tikz title="Half ALM: LUT4 and two LUT3s feeding a hardened full adder, then two flip-flops"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex,line width=0.5pt]

% ---- outer BLE boundary -------------------------------------------------
\draw[dashed,rounded corners=3pt] (-1.5,-3.8) rectangle (7.4,3.0);
\node[anchor=south west] at (-1.5,3.05) {half ALM = one Intel BLE (Stratix III \ldots\ V)};

% ---- the eight shared ALM input lines -----------------------------------
\draw[gray] (0.4,2.45) -- (4.40,2.45);
\node[anchor=south west,gray] at (4.45,2.52) {\tiny 8 shared ALM input lines};
\foreach \x/\n in {0.4/a,1.0/b,1.6/c,2.2/d,2.8/e} {
  \draw[->] (\x,2.9) -- (\x,2.47);
  \node[anchor=south] at (\x,2.9) {$\n$};
}
\foreach \x in {0.9,2.4,3.8} { \draw[->] (\x,2.45) -- (\x,2.15); }

% ---- LUT layer ----------------------------------------------------------
\draw (0.25,1.45) rectangle (1.55,2.15);
\node at (0.9,1.92) {LUT4}; \node[gray] at (0.9,1.62) {\tiny 16 cfg bits};
\draw (1.90,1.45) rectangle (2.90,2.15);
\node at (2.40,1.92) {LUT3}; \node[gray] at (2.40,1.62) {\tiny 8 bits};
\draw (3.30,1.45) rectangle (4.30,2.15);
\node at (3.80,1.92) {LUT3}; \node[gray] at (3.80,1.62) {\tiny 8 bits};

% ---- fracturing MUX: two LUT3 + MUX = one LUT4 (Boole expansion) --------
\draw (2.35,0.95) -- (3.85,0.95) -- (3.55,0.60) -- (2.65,0.60) -- cycle;
\node at (3.10,0.79) {\tiny MUX};
\draw (2.40,1.45) -- (2.40,1.20) -- (2.75,1.20) -- (2.75,0.95);
\draw (3.80,1.45) -- (3.80,1.20) -- (3.45,1.20) -- (3.45,0.95);
\draw[->] (4.60,0.775) -- (3.71,0.775); \node[anchor=west] at (4.62,0.775) {$e$};

% ---- hardened full adder ------------------------------------------------
\draw[line width=0.9pt] (1.35,-0.75) rectangle (2.65,-0.05);
\node at (2.00,-0.40) {\textbf{FA}};
\node[anchor=west,gray] at (2.85,-0.72) {\tiny hardened: costs no LUT};
\draw (0.90,1.45) -- (0.90,0.25) -- (1.65,0.25) -- (1.65,-0.05);
\node[anchor=east] at (0.88,0.80) {\tiny 1};
\draw (3.10,0.60) -- (3.10,0.25) -- (2.35,0.25) -- (2.35,-0.05);
\node[anchor=west] at (3.12,0.42) {\tiny 1};
\draw[->] (7.4,-0.40) -- (2.65,-0.40); \node[anchor=south east] at (7.35,-0.36) {$c_{\mathrm{in}}$};
\draw[->] (1.35,-0.40) -- (-1.5,-0.40); \node[anchor=south west] at (-1.45,-0.36) {$c_{\mathrm{out}}$};
\node[anchor=south,gray] at (4.9,-0.36) {\tiny dedicated wire to next ALM};

% ---- sum fan-out --------------------------------------------------------
\draw (2.00,-0.75) -- (2.00,-1.15);
\node[anchor=west] at (2.05,-0.98) {\tiny 1};
\draw (0.35,-1.15) -- (5.40,-1.15);
\draw (0.35,-1.15) -- (0.35,-1.75); \draw[->] (0.35,-1.75) -- (0.75,-1.75);
\draw (4.05,-1.15) -- (4.05,-1.75); \draw[->,gray] (4.05,-1.75) -- (3.65,-1.75);
\draw (0.55,-1.15) -- (0.55,-2.40) -- (1.55,-2.40) -- (1.55,-2.60);
\draw[gray] (5.40,-1.15) -- (5.40,-2.60);

% ---- two flip-flops -----------------------------------------------------
\draw (0.75,-2.20) rectangle (1.75,-1.50);
\node[anchor=west] at (0.78,-1.75) {D}; \node[anchor=east] at (1.72,-1.75) {Q};
\draw (0.75,-2.05) -- (0.92,-1.95) -- (0.75,-1.85);
\draw[gray] (2.65,-2.20) rectangle (3.65,-1.50);
\node[anchor=west,gray] at (2.68,-1.75) {D}; \node[anchor=east,gray] at (3.62,-1.75) {Q};
\draw[gray] (2.65,-2.05) -- (2.82,-1.95) -- (2.65,-1.85);
\node[anchor=north,gray] at (3.15,-2.26) {\tiny Stratix V+};

% ---- bypass MUXes: registered or combinational --------------------------
\draw (1.75,-1.75) -- (2.05,-1.75) -- (2.05,-2.60);
\draw (1.30,-2.60) -- (2.30,-2.60) -- (2.15,-2.95) -- (1.45,-2.95) -- cycle;
\node at (1.80,-2.80) {\tiny MUX};
\draw[->] (1.80,-2.95) -- (1.80,-3.40); \node[anchor=north] at (1.80,-3.42) {$y_1$};

\draw[gray] (3.65,-1.75) -- (4.65,-1.75) -- (4.65,-2.60);
\draw[gray] (4.35,-2.60) -- (5.55,-2.60) -- (5.40,-2.95) -- (4.70,-2.95) -- cycle;
\node[gray] at (5.05,-2.80) {\tiny MUX};
\draw[gray,->] (5.05,-2.95) -- (5.05,-3.40); \node[anchor=north,gray] at (5.05,-3.42) {$y_2$};

\end{circuitikz}
\end{document}
```

*after Fig. 4.6, p. 93; the input-to-adder assignment follows eq. 5.57, p. 129.*

**Fix the hierarchy before anything else, because every resource estimate is quoted in the wrong unit otherwise.** Intel's logic cluster is a **logic array block (LAB)** holding **ten ALMs**, and one ALM is *two* BLEs — so a LAB is twenty [[Basic Logic Element]]s, not ten (p. 93). One half-ALM, the unit drawn above, contains one LUT4, two LUT3s, a dedicated full adder and two flip-flops; the second flip-flop arrived with Stratix V and is absent from Stratix III/IV. The eight input lines of an ALM are shared between its two halves, which is the constraint that all the "adaptive" behaviour is really about.

**Count the configuration memory to see where the adaptivity is paid for.** A LUT$\alpha$ is a $2^{\alpha}$-to-1 multiplexer driven by $2^{\alpha}$ SRAM cells, so the LUT4 costs $2^4 = 16$ configuration bits and each LUT3 costs $2^3 = 8$ — $32$ bits per half-ALM, $64$ per ALM, versus the $64$ a single LUT6 would need. The ALM buys its flexibility not with extra memory but with the *muxing* around a fixed budget of it; see [[Lookup-Tables]] for why $\alpha \in \{4,\dots,6\}$ is the area–delay sweet spot in the first place.

**The two LUT3s are a LUT4 in disguise, by Boole's expansion theorem.** Expanding any $f$ about its last variable,

$$f(b,c,d,e) \;=\; \bar{e} \wedge f_{\bar e}(b,c,d) \;\vee\; e \wedge f_{e}(b,c,d)$$

with $f_{\bar e}(b,c,d) = f(b,c,d,0)$ and $f_{e}(b,c,d) = f(b,c,d,1)$ (eqs. 4.1–4.3, p. 90). The two cofactors are exactly what the two LUT3s hold, and the $\vee$ of two mutually exclusive AND terms *is* a 2:1 multiplexer — that step is the definition of a mux, not an approximation. Driving the select from $e$ therefore turns LUT3 + LUT3 + MUX into one LUT4, and the same identity run in reverse is what lets the fitter split the pair apart again. This is the [[Fracturable LUT]] mechanism, applied bottom-up (small LUTs joined) instead of the AMD top-down direction (a LUT6 split).

**Enumerate what a whole ALM can therefore be.** Because the muxes sit between the two halves as well as inside them, one ALM configures as two independent LUT4s; one independent LUT3 plus one independent LUT5; one independent LUT6; various combinations up to six inputs where some inputs are shared; and some specific 7-input functions [Alt13] (p. 93). The "some specific" is doing real work in that sentence — it is not a LUT7, it is the subset of 7-variable functions that happen to decompose across the available mux tree.

**Now the part that distinguishes this cell from every AMD one: the full adder is silicon.** On AMD fabric the LUT must compute the propagate signal $p_i = x_i \oplus y_i$ and the hardened logic supplies only the XOR and the carry mux, so the addition *consumes* the LUT (eqs. 5.50–5.51, p. 126). On Intel there is a complete 1-bit [[Full Adder]] in the BLE with dedicated carry wires to its neighbours, and the LUT layer sits entirely *in front* of it (§5.4.2, p. 128). The consequence, written out as eq. 5.57 on p. 129, is that a ripple-carry chain built from these cells computes not $x_i + y_i$ but

$$(c_{i+1},\, s_i) \;=\; \mathrm{FA}\big(\,p(a_i,b_i,c_i,d_i),\; q(b_i,c_i,d_i,e_i),\; c_i\,\big)$$

where $p$ and $q$ are **arbitrary** bit-parallel 4-input Boolean functions of the shared inputs, at zero additional cost. Every signal here is 1 bit wide: the five inputs, the two LUT outputs, the sum $s_i$, and both carries; an $N$-bit operator is $N$ of these tiled vertically.

> [!important]
> This is the whole reason the note exists. On an ASIC the LUT layer would be pure overhead and the right question is "how fast is the adder"; on an Intel ALM the right question is "what else can I fold into $p$ and $q$ before the adder sees them", because that logic is already paid for and idle.

**Price an adder in the correct units.** An $N$-bit ripple-carry adder occupies $N$ BLEs $=\lceil N/2 \rceil$ ALMs $=\lceil N/20 \rceil$ LABs, with the LUT layer of all $N$ cells left over. The carry chain is fast for the same reason it is on AMD — it bypasses the generic programmable routing entirely, which is where the delay lives (see [[Fast Carry Chain]]) — but it is also *placement-quantised*: a chain may only start at the 1st or the 6th ALM of a LAB (p. 128), so a short adder still reserves a chain segment whether or not it fills one.

**Read the Stratix 10 change as a deliberate retreat.** Stratix 10 replaces the two LUT3s with a single LUT4, giving two LUT4s per half-ALM [Int17] (p. 93). Fewer configurations, simpler fitting, and — more consequentially — the *shared arithmetic mode* that let the LUT layer implement a second row of full adders was dropped (§5.4.4.1, p. 132). Everything in this note about the LUT layer being free still holds; what no longer holds is the specific three-input trick built on it.

> [!warning] Not covered in the source — needs outside research
> The book quotes concrete carry-chain and LUT delays only for AMD Virtex 6 ($\tau_{cp} = 0.015$ ns per BLE, $\tau_{\mathrm{LUT}} = 0.14\ldots0.32$ ns, p. 126–127). It gives no equivalent numbers for any Stratix ALM, so no Intel delay figure is quoted here.

$$\boxed{\ \text{1 LAB} = 10\ \text{ALM} = 20\ \text{BLE},\qquad (c_{i+1},\, s_i) = \mathrm{FA}\big(p(a,b,c,d),\, q(b,c,d,e),\, c_i\big)\ }$$

**When it breaks.**

- **Eight shared input lines per ALM, not ten.** Two independent LUT4s need eight *distinct* inputs and only just fit; two independent LUT5s do not fit at all. Most of the advertised configurations are conditional on inputs being shared, and a netlist whose logic cones have disjoint support will pack at closer to one BLE per ALM.
- **"Some specific 7-input LUTs" is not a LUT7.** Rely on it only through the vendor's own packing, never in a hand-instantiated design.
- **The free LUT layer is free only for logic that fits in 4 inputs and lands on the *same* operand bit.** Anything needing a carry or a cross-bit dependency falls back to ordinary LUTs plus generic routing.
- **Stratix 10 removes shared arithmetic mode**, so a design tuned around three-input addition on Stratix V loses that mapping and needs extra LUTs on the successor part ([Int18a], p. 132) — see [[Ternary Adders on FPGAs]].
- **Quartus infers the merged form from `S <= X+Y+Z` only in the unnegated case**; $X-Y+Z$ and friends need the operand inverted by hand and the carry-in tied to 1, which costs one extra bit of word size (two for $X-Y-Z$) and therefore extra ALMs (p. 132).
- **The registered path is only free if you use it.** Both flip-flops sit inside the cell already, so an unregistered design wastes them; see [[Basic Logic Element]] for why this makes pipelining on FPGA a different economic decision than on ASIC.

**RTL (Spade).**

```spade
fn lut3(mask: uint<8>, i0: bool, i1: bool, i2: bool) -> bool {
    mask.as_bits()[[i0, i1, i2].as_uint()]
}

fn lut4(mask: uint<16>, i0: bool, i1: bool, i2: bool, i3: bool) -> bool {
    mask.as_bits()[[i0, i1, i2, i3].as_uint()]
}

fn full_adder(x: bool, y: bool, cin: bool) -> (bool, bool) {
    (x ^^ y ^^ cin, (x && y) || (cin && (x ^^ y)))
}

entity half_alm(
    clk: clock,
    cfg_p: uint<16>, cfg_q0: uint<8>, cfg_q1: uint<8>,
    a: bool, b: bool, c: bool, d: bool, e: bool,
    cin: bool,
) -> (bool, bool, bool) {
    let x = lut4(cfg_p, a, b, c, d);                                  // p(a,b,c,d)
    let y = if e { lut3(cfg_q1, b, c, d) } else { lut3(cfg_q0, b, c, d) };  // q(b,c,d,e)
    let (s, cout) = full_adder(x, y, cin);
    reg(clk) s_q = s;
    (s, cout, s_q)
}
```

`cfg_p` is the LUT4's 16 SRAM cells and `cfg_q0`/`cfg_q1` the two LUT3s' 8 each; the `if e` is the fracturing MUX of the diagram, written as Boole's expansion rather than as a mux so the identity above is visible in the code. `.as_bits()` indexes LSB-first, so `i0` is index bit 0 — get that backwards and the LUT is transposed while still compiling cleanly, which is the specific bug the asymmetric test vectors below exist to catch. Everything except `s_q` is combinational, and the tuple `(s, cout, s_q)` exposes the sum, the carry to the neighbouring cell, and the registered output; `s_q` corresponds to the left flip-flop, the bypass mux is the reader's choice of which tuple element to use. **What synthesis does differently:** on a real part the LUT contents are configuration state loaded at boot, not runtime inputs, so `cfg_*` would be generic parameters; they are ports here only so a testbench can sweep every truth table.

Simulated with `.zettel/sim.sh`: 3212 vectors — named cases for AND-of-four, the Boole-expansion mux, the plain full adder ($1+1+1$ and the asymmetric $1+0+0$), explicit index-order checks distinguishing LUT4 mask bit 1 from bit 8, and a 3000-vector random sweep over all three masks and all six inputs against a behavioural reference, plus 200 clocked vectors checking `s_q` against the previous cycle's sum. Zero failures.

**Related Notes.**

- [[Basic Logic Element]] – depends-on: the LUT + FF template this cell specialises, and the source of the "flip-flops are free" argument.
- [[AMD BLE]] – compares: the same three-layer pattern with the adder built *from* the LUT instead of beside it.
- [[Fracturable LUT]] – extends: the Boole-expansion identity above, run in the splitting direction on a LUT6.
- [[Lookup-Tables]] – depends-on: why $2^\alpha$ SRAM cells and $\alpha \in \{4,\dots,6\}$.
- [[Fast Carry Chain]] – supports: the dedicated neighbour wire that makes the hardened FA worth having.
- [[Full Adder]] – depends-on: the 1-bit primitive that is hardened here.
- [[Adders]] – extends: what the free LUT layer is actually spent on once you have it.
- [[Ternary Adders on FPGAs]] – counter-example: the one construction that exploited this cell and then stopped working, when Stratix 10 dropped shared arithmetic mode.
- [[Choosing an FPGA Primitive]] – compares: when the answer is a DSP block or a memory instead of ALMs.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §4.1.1, pp. 89–91 — LUT realisation, $2^\alpha$ SRAM cells, Boole's expansion (eqs. 4.1–4.3), Fig. 4.4.
  - §4.1.3, p. 93 — ALM and LAB structure, Fig. 4.6, the configuration list [Alt13], the Stratix 10 simplification [Int17].
  - §4.1.4, p. 94 — the common three-layer BLE pattern.
  - §5.4.1–5.4.2, pp. 126–128 — AMD propagate/carry equations and delays; Intel carry-chain start constraints.
  - §5.4.3, p. 129 — merged functionality, eq. 5.57.
  - §5.4.4.1, p. 132 — shared arithmetic mode, its use for ternary addition, and its removal in Stratix 10.
