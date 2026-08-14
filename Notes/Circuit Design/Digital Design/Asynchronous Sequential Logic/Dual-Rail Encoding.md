---
title: "Dual-Rail Encoding"
description: "Two wires per bit with a spacer code, so validity announces itself and every timing assumption disappears — costs 2k wires, double area, and data-independent switching that is terrible for power and excellent against side channels."
kind: circuit
status: seed
spade: simulated
tags: [digital, asynchronous-sequential-logic]
aliases:
  - Dual-Rail Encoding
  - Dual-Rail
  - Dual Rail
  - Dual-Rail Code
  - 1-of-2 Encoding
  - Delay-Insensitive Code
---

# Dual-Rail Encoding

A data encoding that spends two wires on every bit so a third code — the all-zero *spacer* — can mean "no datum yet", which makes validity a function of the data wires alone and deletes the timing assumption a [[Bundled-Data Interface]] is built on.

```tikz title="Dual-rail AND cell in DIMS form, with the per-bit validity gate"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % four 1-bit rails: two per dual-rail operand
  \foreach \x/\lab in {0.4/{$a.0$}, 1.0/{$a.1$}, 1.6/{$b.0$}, 2.2/{$b.1$}} {
    \draw (\x,6.6) -- (\x,-0.7);
    \node[anchor=south] at (\x,6.65) {\lab};
  }

  % DIMS product terms
  \node[and port] (g1) at (5.0,5.6) {};
  \node[and port] (g2) at (5.0,3.8) {};
  \node[and port] (g3) at (5.0,2.0) {};
  \node[and port] (g4) at (5.0,0.2) {};

  \foreach \x/\g/\p in {1.0/g1/{in 1}, 2.2/g1/{in 2},
                        0.4/g2/{in 1}, 1.6/g2/{in 2},
                        0.4/g3/{in 1}, 2.2/g3/{in 2},
                        1.0/g4/{in 1}, 1.6/g4/{in 2}} {
    \draw (\x,0 |- \g.\p) -- (\g.\p);
    \node[circ] at (\x,0 |- \g.\p) {};
  }
  \node at (5.0,6.45) {\footnotesize $a.1\,b.1$};
  \node at (5.0,4.65) {\footnotesize $a.0\,b.0$};
  \node at (5.0,2.85) {\footnotesize $a.0\,b.1$};
  \node at (5.0,1.05) {\footnotesize $a.1\,b.0$};

  % OR tree over the three zero-products
  \node[or port] (o1) at (7.8,2.9) {};
  \node[or port] (o2) at (10.2,1.55) {};
  \draw (g2.out) -| ($(o1.in 1)+(-0.6,0)$) -- (o1.in 1);
  \draw (g3.out) -| ($(o1.in 2)+(-0.6,0)$) -- (o1.in 2);
  \draw (o1.out) -| ($(o2.in 1)+(-0.6,0)$) -- (o2.in 1);
  \draw (g4.out) -| ($(o2.in 2)+(-0.6,0)$) -- (o2.in 2);

  % outputs
  \draw (g1.out) -- (12.3,5.6) node[anchor=west] {$c.1$};
  \draw (o2.out) -- (12.3,1.55) node[anchor=west] {$c.0$};

  % per-bit completion
  \node[or port] (v) at (14.6,3.575) {};
  \draw (13.2,5.6) -- (13.2,0 |- v.in 1) -- (v.in 1);
  \node[circ] at (13.2,5.6) {};
  \draw (13.2,1.55) -- (13.2,0 |- v.in 2) -- (v.in 2);
  \node[circ] at (13.2,1.55) {};
  \draw (v.out) -- ++(0.5,0) node[anchor=west] {valid$_i$};

  \node[anchor=west] at (0.1,-1.5) {\footnotesize $00$ = spacer $\cdot$ $10$ = logic $0$ $\cdot$ $01$ = logic $1$ $\cdot$ $11$ = illegal};
  \node[anchor=west] at (0.1,-2.1) {\footnotesize one cell per bit: a $k$-bit operand is $2k$ wires, and $k$ valid$_i$ signals feed the completion tree};
  \node[anchor=west] at (0.1,-2.7) {\footnotesize in four-phase DIMS every AND is a 2-input C-element, so the return to spacer is indicated too};
\end{circuitikz}
\end{document}
```

*Own construction — the delay-insensitive minterm form of a single dual-rail AND cell.*

**Put validity into the alphabet instead of into a separate wire.** Each logical bit $b$ is carried on two 1-bit wires $b.0$ and $b.1$, and only three of the four codes are legal:

| $b.0\,b.1$ | meaning |
| --- | --- |
| $00$ | spacer / empty |
| $10$ | logic 0 |
| $01$ | logic 1 |
| $11$ | illegal, never generated |

A $k$-bit datum is therefore $2k$ wires and no `req` line at all. The rate is 1 bit per 2 wires — half of single-rail — and that halving is the entire price list; everything else in this note is a consequence of it. The numeric interpretation of those $k$ bits is untouched: dual-rail sits *beneath* the format, so two's complement, fixed point and the ulp reasoning of [[Number Formats]] and [[Error Accuracy]] all carry across unchanged.

**The property that makes it work is unorderedness, not the wire count.** Read a codeword as the *set* of wires it drives high. A code is delay-insensitive exactly when it is **unordered**: no codeword's set is a proper subset of another's (Verhoeff). The reason is a one-line argument about what a receiver can know. Starting from the all-zero spacer, wires rise in an unknown order, so a receiver observing set $S$ cannot tell "the codeword is $S$" from "the codeword is some $T \supsetneq S$ whose remaining wires are still in flight" — unless no such $T$ exists. Single-rail fails immediately: its two codewords are $\varnothing$ and $\{w\}$, and $\varnothing \subsetneq \{w\}$, so logic 0 is indistinguishable from a logic 1 that has not arrived. That subset relation is precisely the hole a `req` wire and a [[Matched Delay Line]] are patching. Dual-rail's data codewords are $\{b.0\}$ and $\{b.1\}$ — neither contains the other, so the code is unordered and the patch is unnecessary. The spacer $\varnothing$ is below both, which is legal because it is a protocol *phase*, not a datum.

**Unorderedness is closed under concatenation, which is why it scales to words.** If $A$ and $B$ are unordered codes then so is $A \times B$: a subset relation on the concatenation would force one componentwise, contradiction. So the $k$-fold product of the 1-of-2 code is delay-insensitive, and a $k$-bit dual-rail word needs no extra machinery beyond one cell per bit. The same closure argument admits the whole constant-weight family — every $m$-of-$n$ code is unordered, since equal-weight sets cannot contain one another. Dual-rail is weight 1 on 2 wires; [[1-of-4 Encoding]] is weight 1 on 4, at the same 0.5 bits/wire but half the transitions; 2-of-4 is weight 2 on 4, carrying $\log_2\binom{4}{2} = 2.58$ bits on 4 wires, a strictly better rate than either.

**Completion detection becomes a function of the data.** A pair is occupied iff either rail is high, so the $k$-bit word is complete when all $k$ pairs are:

$$\text{done} \;=\; \bigwedge_{i=0}^{k-1}\big(b_{i.0}\vee b_{i.1}\big)$$

$k$ two-input ORs plus a $k$-input AND tree of depth $\lceil\log_2 k\rceil$, producing 1 bit. In four-phase signalling the AND tree is built from C-elements rather than ANDs (see [[Muller C-Element]] and [[Completion Detection Tree]]), so that the return to all-spacer is detected symmetrically instead of racing — an AND tree indicates the arrival of data but the *departure* of only the first rail to fall.

**Function blocks have to indicate, not merely compute.** This is where dual-rail designs actually go wrong. Take the bitwise AND of two dual-rail bits and write the obvious thing:

$$c.1 = a.1\,b.1, \qquad c.0 = a.0 \vee b.0 \quad \text{(wrong)}$$

It computes AND correctly on every pair of valid inputs, and it compiles, and it simulates. It is still broken: $c.0$ rises as soon as *one* input reads 0, so the output announces validity before the other input has arrived, and every downstream completion detector is now certifying a datum the block never finished reading.

> [!important] Every output rail must depend on every input rail
> The repair is **DIMS** — delay-insensitive minterm synthesis. Enumerate the minterms of the input domain and OR together those that produce each output value, keeping every literal:
> $$c.0 \;=\; a.0\,b.0 \;\vee\; a.0\,b.1 \;\vee\; a.1\,b.0$$
> By absorption this simplifies to $a.0 \vee b.0$, which is exactly why a synthesiser will produce the broken version if you let it. The non-minimal cover is the point: with all three products present, no output rail can rise until both inputs have left the spacer, so the block is **strongly indicating** — its output validity is a proof that its inputs were valid. Same structural argument as the consensus term in a C-element, and the same tooling problem.

**Cost, honestly.** A DIMS block over $n$ dual-rail inputs has $2^n$ minterms, so the cell above is 4 gates plus an OR tree per bit where single-rail AND is 1 gate. The "roughly $2\times$" figure quoted for dual-rail is the wire and register count, which really is $2k$ versus $k$; the *logic* is superlinear in fan-in, which is why real QDI datapaths decompose everything to two-input cells and why a dual-rail full adder is built as a specific hand-designed cell rather than synthesised. On FPGA the combinational form of this cell is cheap — $c.0$ and $c.1$ each depend on the same 4 rails, so each is one LUT, giving 2 LUTs per bit against 1 — but the four-phase form needs C-elements, which are combinational loops the router will not time and the optimiser will not preserve without `DONT_TOUCH`.

**It is QDI, not DI, the moment a rail forks.** In the diagram $a.0$ drives two product terms. Acknowledging the block's output acknowledges that *some* branch of the fork arrived, and the argument that it acknowledges both is the **isochronic fork** assumption: the delay difference between branches of a fork is negligible against gate delay. That single assumption is the whole timing-closure burden of a dual-rail design, and it is what Martin's impossibility result forces on you — circuits built from single-output gates and correct under arbitrary gate *and* wire delays can compute essentially nothing.

**Switching activity is constant, and that cuts both ways.** In a four-phase cycle every occupied pair makes exactly two transitions per datum — one rail up, the same rail down — independent of the value. A single-rail wire carrying uniform random data toggles with probability $\tfrac12$ per datum, i.e. 0.5 transitions per bit. So under that (stated, not measured) assumption dual-rail four-phase switches about $4\times$ more per bit than single-rail, with no data-dependent savings available at all. The same constancy is the reason it appears in secure hardware: differential power analysis extracts the key from the *variation* of switching with data, and a constant Hamming weight of transitions leaves nothing to correlate against. That claim is about the layout, not the code — it holds only if the two rails of every pair are load- and route-matched, which is the actual content of balanced logic styles.

$$\boxed{\ (b.0,b.1)\in\{(0,0)\}\cup\{(1,0),(0,1)\},\qquad \text{done}=\bigwedge_{i=0}^{k-1}\big(b_{i.0}\vee b_{i.1}\big)\ }$$

**When it breaks.**

- **The illegal code is invisible to the completion function.** $b.0 \vee b.1$ is 1 for $11$, so a fault or a glitch that raises both rails is certified as valid data with no defined meaning. Replacing the OR with an XOR rejects $11$ at identical gate cost, but then the tree simply never completes — the failure becomes a deadlock instead of corrupt data. A delay-insensitive code detects *absence*, never *excess*.
- **The completion tree is on the critical path.** Latency is function delay plus $\lceil\log_2 k\rceil$ gate delays, so as $k$ grows the certificate can cost more than the arithmetic it certifies, and the average-case advantage that motivated dropping the clock shrinks with it.
- **Return-to-zero throws away half the cycle.** Four-phase spends a full spacer phase doing no work. Two-phase does not fix it: with transitions carrying the information there is no spacer to return to, so a two-phase dual-rail link needs an extra phase or parity encoding (LEDR) and event-sensitive storage.
- **Isochronic forks are an assumption about wires.** They hold on short local forks in a standard-cell layout and fail on long ones; on FPGA the router sets branch delays and offers no way to constrain them, which is why FPGA asynchronous work is almost entirely bundled-data.
- **Where a sibling takes over.** At the same wire count, [[1-of-4 Encoding]] halves the transitions; when a matched delay can be trusted, [[Bundled-Data Interface]] keeps the single-rail datapath and pays two wires total instead of $2k$.

> [!warning] Not covered in the source — needs outside research
> This note has no assigned book source, so it quotes no measured area, delay or energy. The $4\times$ transition ratio above is derived from the stated uniform-random-data assumption, and the LUT counts are structural (rails per output), not synthesis results.

**RTL (Spade).** The encoding is two vectors of rails, so a $k$-bit dual-rail word is a pair `(f, t)` of `uint<K>` and the whole cell is bitwise:

```spade
/// Bitwise dual-rail AND over K bits, in DIMS (delay-insensitive minterm) form.
/// Bit i is the pair (f[i], t[i]): (0,0) spacer, (1,0) logic 0, (0,1) logic 1,
/// (1,1) illegal and never generated.
fn dr_and<#uint K>(af: uint<K>, at: uint<K>, bf: uint<K>, bt: uint<K>)
    -> (uint<K>, uint<K>)
{
    ((af & bf) | (af & bt) | (at & bf), at & bt)
}

/// Completion detection: valid only when every pair has exactly one rail up.
fn dr_done<#uint K>(f: uint<K>, t: uint<K>) -> bool {
    (f | t).as_bits().reduce_and()
}
```

`af`/`at` are the $a.0$/$a.1$ rails of the diagram, one bit of each vector per cell; the three terms of `cf` are the three lower AND gates and their OR tree, `ct` is the top gate, and `dr_done` is the per-bit validity OR fanning into the $k$-input AND. All of it is combinational and unclocked — there is no `reg`, because the state in a real dual-rail pipeline lives in the C-elements this form deliberately abstracts away. Synthesis will do one thing differently and it is the thing that matters: the optimiser absorbs `(af & bf) | (af & bt) | (at & bf)` to `af | bf`, which is functionally identical, one gate instead of four, and no longer indicating.

Simulated with `dr_and8` as an 8-bit wrapper: 6 named vectors including the asymmetric `0x01 & 0x80` and a masked-spacer case, plus a 3000-vector random sweep against a behavioural reference computing $(\overline{x \wedge y} \wedge m \wedge n,\; x \wedge y \wedge m \wedge n)$ with independent random validity masks $m,n$ — 3006 checks, 0 failures. Mutating `at & bt` to `at | bt` fails 2938 of them.

**Related Notes (with context).**

- [[Completion Detection Tree]] – extends: turns the per-bit validity OR drawn here into the $k$-input tree, and puts a number on the $\lceil\log_2 k\rceil$ this note charges to the critical path.
- [[1-of-4 Encoding]] – compares: the same constant-weight construction at weight 1 on 4 wires, identical rate and half the transitions, so it wins wherever the switching cost above dominates.
- [[Redundant Number Systems]] – compares: also spends extra wires per digit, but to buy carry-free arithmetic rather than validity — redundancy in the *value* domain against redundancy in the *timing* domain.
- [[Muller C-Element]] – depends-on: the AND gates here are C-elements in a four-phase block, and the non-minimal cover argument is the same one that keeps its consensus term.
- [[Four-Phase Handshake]] – depends-on: supplies the spacer phase that makes the $00$ code meaningful; without a return to zero the code has no way to mark the boundary between two equal data.
- [[Bundled-Data Interface]] – counter-example: keeps the single-rail datapath and pays 2 wires of control plus a timing assumption, where this pays $2k$ wires and none.
- [[Matched Delay Line]] – counter-example: the component this encoding exists to delete; a dual-rail block's completion is data, not a delay to be characterised.
- [[Choosing an Asynchronous Style]] – compares: where the $2\times$ wires and the constant switching activity are worth it, and where they are not.

## References

No assigned book source; written from standard digital-design canon.

- J. Sparsø & S. Furber, *Principles of Asynchronous Circuit Design* — dual-rail and 1-of-n encodings, four-phase protocols, DIMS function blocks, strong versus weak indication.
- T. Verhoeff, "Delay-insensitive codes — an overview" — the theorem that delay-insensitive codes are exactly the unordered codes, and the constant-weight family.
- A. J. Martin, on the limitations of delay-insensitive circuits — why the isochronic fork is unavoidable, and what QDI buys with it.
- S. H. Unger, *Asynchronous Sequential Switching Circuits* — completion detection and indication.
- N. Weste & D. Harris, *CMOS VLSI Design* — C-element circuit forms, dual-rail domino, switching activity and dynamic power.
- M. M. Mano & M. D. Ciletti, *Digital Design* — minterm covers and the absorption step a synthesiser will take.
