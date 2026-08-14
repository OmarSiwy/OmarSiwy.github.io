---
title: "LUT-Merged Adder"
description: "An adder barely uses the LUT in front of it, so arbitrary logic rides along for free: a third addend, a sub select, a source mux, a KCM table or partial products, at zero extra resources."
kind: circuit
source: "ASA §5.4.3, pp. 128-130"
status: seed
spade: simulated
tags: [digital, adders, fpga, lut, carry-chain]
aliases:
  - LUT-Merged Adders
  - Merged Adder
  - Merging Additional Functionality in an Adder
  - Adder with Merged Logic
---

# LUT-Merged Adder

An FPGA adder occupies a whole LUT to compute a two-input XOR, so an arbitrary function of the LUT's full input set can be folded in front of each full-adder input at zero extra area and zero extra delay.

```tikz title="One BLE of an AMD Virtex/UltraScale+ adder: two LUT5s over a shared input set feeding the hardened XOR and carry MUX"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,
  blk/.style={draw,thick,minimum width=3.4cm,minimum height=1.0cm,align=center}]

  % --- the fracturable LUT: two LUT5s over one shared input set -------------
  \node[blk] (lut) at (0,3.4) {$2\times$ LUT5\\(shared inputs)};
  \foreach \x/\l in {-1.4/a,-0.7/b,0/c,0.7/d,1.4/e} {
    \draw[->] (\x,4.7) -- (\x,3.92);
    \node[above] at (\x,4.7) {$\l$};
  }
  \node[anchor=west] at (1.85,3.4) {FPGA LUT};

  % --- LUT outputs ----------------------------------------------------------
  \draw (-0.9,2.88) -- (-0.9,-0.6);                     % p_i  (O6)
  \node[anchor=east] at (-0.95,2.65) {$p_i$\,/1};
  \draw (1.0,2.88) -- (1.0,1.75) -- (2.2,1.75);         % q_i  (O5)
  \node[anchor=south west] at (1.06,1.8) {$q_i$\,/1};

  % --- carry in -------------------------------------------------------------
  \draw (-3.6,0.95) -- (2.2,0.95);
  \node[anchor=east] at (-3.62,0.95) {$c_i$\,/1};
  \draw[fill] (-2.0,0.95) circle (1.6pt);

  % --- the hardened MUX (carry chain) --------------------------------------
  \draw[thick] (2.2,2.1) -- (3.0,1.8) -- (3.0,0.9) -- (2.2,0.6) -- cycle;
  \node[anchor=west] at (2.24,1.75) {\scriptsize 0};
  \node[anchor=west] at (2.24,0.95) {\scriptsize 1};
  \draw[fill] (-0.9,-0.6) circle (1.6pt);
  \draw (-0.9,-0.6) -- (2.6,-0.6) -- (2.6,0.73);        % p_i drives the select
  \node[anchor=west] at (2.64,0.25) {\scriptsize sel};
  \draw[->] (3.0,1.35) -- (4.0,1.35);
  \node[anchor=west] at (4.02,1.35) {$c_{i+1}$\,/1};

  % --- the hardened XOR (sum) ----------------------------------------------
  \node[xor port,scale=0.9] (sx) at (0.1,-1.45) {};
  \draw (-0.9,-0.6) |- (sx.in 1);
  \draw (-2.0,0.95) |- (sx.in 2);
  \draw[->] (sx.out) -- (1.6,-1.45);
  \node[anchor=west] at (1.62,-1.45) {$s_i$\,/1};

  % --- framing --------------------------------------------------------------
  \draw[dashed,gray] (-3.1,-2.15) rectangle (3.55,2.3);
  \node[anchor=west,gray] at (-3.05,-2.5)
    {hardened carry logic: one BLE, replicated $w$ times along the carry chain};
\end{circuitikz}
\end{document}
```

*after Fig. 5.25a, p. 130.*

**Measure how idle the LUT is.** A $w$-bit adder on an AMD FPGA is $w$ basic logic elements, each holding one hardened XOR and one hardened MUX ([[FPGA Hard Carry Chain Adder]]). Everything those two gates need from the fabric is $p_i=x_i\oplus y_i$, one bit, a function of two variables. The LUT that supplies it is a LUT6: a 64-bit truth table over six 1-bit inputs, of which two are used and four are tied off, so the table has only $2^2=4$ independent entries and the remaining 60 configuration bits are copies. Four input pins and 60 bits of programmability are paid for and doing nothing. There is no way to reclaim them for a *different* BLE — the LUT is physically wired to this carry cell — so the only way to spend them is on this bit of this adder.

**Turn the carry cell into a full adder over two programmable functions.** Write the adder bit as $(c_{i+1},s_i)=\mathrm{FA}(p,q,c_i)$ and ask what $p$ and $q$ are allowed to be. The plain adder answers $p=x_i$, $q=y_i$: two wires. The book's observation (§5.4.3, p. 128) is that they may be *any* pair of functions the LUT layer can hold, which each vendor bounds differently:

- **Intel** — two parallel LUT4s in front of the ALM's hardened FA, sharing most inputs: $(c_{i+1},s_i)=\mathrm{FA}\big(p(a,b,c,d),\,q(b,c,d,e),\,c_i\big)$ (Eq. 5.57, p. 129, Fig. 4.6, p. 93). Five distinct 1-bit inputs, three of them shared.
- **AMD Virtex 5-7 / UltraScale+** — the fracturable LUT6 split into two LUT5s that *must* share all five inputs: $\mathrm{FA}\big(p(a,b,c,d,e),\,q(a,b,c,d,e),\,c_i\big)$ (Eq. 5.58, Fig. 5.25a — the diagram above).
- **AMD, alternatively** — one undivided LUT6 on one FA input, the other input a raw bypass signal: $\mathrm{FA}\big(p(a,b,c,d,e,f),\,a,\,c_i\big)$ (Eq. 5.59, Fig. 5.25b). Six inputs of programmable logic, but only on one side.
- **Versal** — two LUT4s with shared inputs per FA input: $\mathrm{FA}\big(p(a,b,c,d),\,q(a,b,c,d),\,c_i\big)$ (Eq. 5.60, Fig. 5.25c).

> [!note] The BLE has an XOR port and a MUX port, not two symmetric adder inputs
> Nothing in the silicon adds $p$ and $q$. One LUT output drives the XOR, giving $s_i=p_i\oplus c_i$; the other drives the MUX *data* input, and the carry is the mux form $c_{i+1}=p_ic_i\vee\overline{p_i}\,x_i$ (Eqs. 5.50-5.51, p. 126, valid because $p_i=0$ forces $x_i=y_i$ — see [[Switched Ripple-Carry Adder]]). To realize $\mathrm{FA}(p,q,c_i)$ you therefore program the XOR-side LUT with $p\oplus q$ and the MUX-side LUT with $q$. That substitution is always available because the set of Boolean functions on a fixed support is **closed under $\oplus$**: if $p$ and $q$ are each realizable on those five shared inputs, so is $p\oplus q$, in the same LUT5 at the same cost. Closure is what makes the $\mathrm{FA}(p,q,c_i)$ notation an honest description of a structure that contains no adder.

**Check that the delay does not grow either.** A LUT is a multiplexer tree over its configuration bits, so its propagation delay $\tau_\text{LUT}=0.14\ldots0.32$ ns depends on *which input drives which output* (p. 127) and not at all on what the table holds — the same path is traversed whether the LUT computes an XOR or a 5-input arctangent correction term. The merged logic therefore hides entirely inside the one $\tau_\text{LUT}$ the plain adder already pays before the carry chain starts, against $\tau_\text{cp}=0.015$ ns per bit of chain. Zero area *and* zero delay is the unusual part; free area alone would be much less interesting. On **ASIC** none of this exists: front-end logic there is real gates with real delay, and merging costs exactly what it costs. This is the book's canonical example of a **target-specific optimization**.

**Spend the free layer.** What fits in a function of $\le 5$ shared 1-bit inputs per bit position turns out to be most of what one wants in front of an adder (p. 129):

- a **third addend** — one row of full adders as a carry-save compressor, three $w$-bit vectors in and two out, collapsed by the chain below: [[Ternary Adders on FPGAs]], and [[CSA, Carry-Save Adder]] for why the compression is carry-free;
- an **adder/subtractor select**, choosing addition or subtraction at run time via $-Y=\overline{Y}+1$ — the XORs land in LUTs the adder already occupies, so [[Two's Complement Adder-Subtractor]] is free on FPGA, and [[Sign-Configurable Adder-Subtractor]] extends it to negating both operands;
- a **source multiplexer** picking which of several $w$-bit operands is added, the shape a divider's restoring step needs;
- a **table lookup on fewer than five bits** added into the sum — [[KCM, Table-Based Constant Multiplication]], and the correction tables of function evaluation;
- **partial-product generation** for [[Multipliers]], where the recoding that would otherwise cost a LUT layer of its own becomes part of the summing adder.

**State the widths.** Each $p_i,q_i,c_i,s_i$ is 1 bit; $a\ldots f$ are 1-bit slices of $w$-bit operands, so the whole merged layer is $w$ independent copies of the same 5-input function pair, one per BLE. The adder is $w$ BLEs wide, output $w+1$ bits with the carry out, and merging changes none of those numbers — that is the whole claim.

$$\boxed{\ (c_{i+1},s_i)=\mathrm{FA}\big(p(a,b,c,d,e),\,q(a,b,c,d,e),\,c_i\big)\ \text{ at the resource and delay cost of }\ \mathrm{FA}(x_i,y_i,c_i)\ }$$

**Know where it stops being free.**

- **More inputs than the LUT has.** Six distinct variables per bit on AMD forces you into Eq. 5.59, where only one FA input is programmable; more than that spends a second LUT and a second BLE, and the logic stops being free. Versal's four is tighter still.
- **Disjoint supports.** $p$ and $q$ must live on the *same* input set on AMD — the LUT6 fractures into two LUT5s only over a shared support ([[Lookup-Tables]]). Two unrelated 5-input functions do not fit in one LUT6 no matter how few inputs each uses.
- **The MUX data input is not general routing.** It is reachable from the LUT's second output or a BLE bypass pin. When $q$ must instead arrive through the fabric — as the CSA carries $c_i'$ of a ternary adder do on AMD — the merge is still free in area but the routing delay is real: up to **50 % slower than a binary adder** at small word sizes (p. 132).
- **The tools may not find it.** Quartus infers a ternary adder from `S <= X+Y+Z`; AMD tools will not, so you instantiate primitives or use a generator. Merged forms that change the arithmetic *format* are not free either: on Intel, $X-Y+Z$ and $X+Y-Z$ need the word extended by one bit and $X-Y-Z$ by two, costing extra ALMs (p. 132).
- **Shared arithmetic mode was dropped in Stratix 10** (p. 132), so the Intel mapping that made a ternary adder cost exactly a binary adder's ALM count is not available on current parts.
- **ASIC.** Nothing is free; use the ordinary [[Full Adder]] cost model and pick from [[Choosing an Adder]].

**Write the free layer as one expression.** Nothing in the RTL announces that the mux and the negation are free; the point is that `+` and everything feeding it land in the same $w$ BLEs.

```spade
// The free LUT layer in front of the hard carry chain: a source multiplexer
// and an add/subtract select, both absorbed into the LUTs the adder occupies.
fn merged_front<#uint W>(b: uint<W>, c: uint<W>, selb: bool, sub: bool) -> uint<W> {
    let src = if selb { b } else { c };   // source mux   -- inside the LUT
    if sub { ~src } else { src }          // sub select   -- same LUT
}

fn merged_addsub<#uint W>(
    a: uint<W>,
    b: uint<W>,
    c: uint<W>,
    selb: bool,
    sub: bool,
) -> uint<{W + 1}> {
    let q = merged_front::<W>(b, c, selb, sub);
    // the hard carry chain: one row of W BLEs
    let cin: uint<{W + 1}> = if sub { 1 } else { 0 };
    (a + q) +. cin
}
```

`merged_front` is the LUT layer of the diagram: per bit it is a function of $b_i,c_i,\texttt{selb},\texttt{sub}$ — four shared 1-bit inputs, comfortably inside a LUT5, so it is the $q$ of the boxed identity while $a_i$ is the bypass input. The `+` is the carry chain: `uint<W> + uint<W>` widens to `uint<{W+1}>`, and `+.` adds the subtract carry-in without widening again. Everything is combinational; the BLE flip-flops sit unused on the outputs and are free to register the result. Synthesis will not build the mux and the inverter the source implies — it will collapse both into one LUT truth table per bit and leave the adder's own resource count untouched, which is the point the code cannot show and the diagram can.

Simulated against a behavioural reference: 8 named vectors (including $1+128$ and $128-1$, asymmetric so a reversed operand order fails) plus 3000 random $(a,b,c,\texttt{selb},\texttt{sub})$ tuples, 3008/3008 passing.

**Related notes.**

- [[FPGA Hard Carry Chain Adder]] – depends-on: supplies the hardened XOR/MUX cell whose spare LUT capacity this note spends.
- [[Switched Ripple-Carry Adder]] – supports: the mux form of the carry recurrence that lets one LUT output serve as both propagate and select.
- [[Ternary Adders on FPGAs]] – extends: the largest payload the free layer carries, a whole CSA row.
- [[Two's Complement Adder-Subtractor]] – extends: costs nothing on FPGA precisely because its XORs merge here.
- [[Sign-Configurable Adder-Subtractor]] – extends: negating both operands needs a constant $2$, which does not fit one carry-in, so it borrows the ternary structure.
- [[KCM, Table-Based Constant Multiplication]] – supports: a table on $<5$ bits is exactly what the free LUT layer can hold.
- [[Multipliers]] – supports: partial-product generation merged into the summing adder.
- [[Lookup-Tables]] – depends-on: fracturability and shared support are what bound $p$ and $q$.
- [[FPGAs]] – compares: the architectural differences (Intel ALM, AMD slice, Versal BLE) that set the bound.
- [[Choosing an Adder]] – compares: where a merged adder sits against every sibling.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §5.4.3 "Merging Additional Functionality in an Adder", pp. 128-130 (Eqs. 5.57-5.60, Fig. 5.25).
- §5.4.1 "Addition Support on AMD FPGAs", pp. 125-128 (Eqs. 5.50-5.56, LUT and carry-chain delays, p. 127).
- §5.4.2 "Addition Support on Intel FPGAs", p. 128.
- §5.4.4 "Ternary Adders on FPGAs", pp. 130-132 (Fig. 5.26, shared arithmetic mode, the 50 % penalty).
- §4.1.2 "The BLE of AMD/Xilinx FPGAs", Fig. 4.5b-c, pp. 91-92; Fig. 4.6, p. 93.
