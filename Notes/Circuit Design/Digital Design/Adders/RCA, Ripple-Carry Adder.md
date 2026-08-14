---
title: "RCA, Ripple-Carry Adder"
description: "w full adders chained carry-to-carry: minimal area, O(w) latency, and the baseline delay every fast adder is trying to beat."
kind: circuit
source: "ASA §5.1–5.2, pp. 104–112"
status: seed
spade: verified
tags: [digital, adders, carry, fpga]
aliases:
  - "Ripple-Carry Adder"
  - "Ripple-Carry Adders"
  - "Ripple-Carry Addition"
  - "RCA"
---

# RCA, Ripple-Carry Adder

The ripple-carry adder is $w$ [[Full Adder|full adders]] wired carry-out to carry-in, which makes it the smallest correct $w$-bit adder and the one whose latency grows linearly in $w$.

```tikz title="8-bit ripple-carry adder: the carry chain is the critical path"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize]
  \foreach \i [evaluate=\i as \X using -1.55*\i] in {0,...,7} {
    \node[draw,fill=gray!8,minimum width=0.95cm,minimum height=0.62cm] at (\X,0) {FA};
    \draw[->] (\X-0.24,0.95) -- (\X-0.24,0.32);  \node at (\X-0.24,1.15) {$x_{\i}$};
    \draw[->] (\X+0.24,0.95) -- (\X+0.24,0.32);  \node at (\X+0.24,1.15) {$y_{\i}$};
    \draw[->] (\X,-0.32) -- (\X,-0.95);          \node at (\X+0.24,-1.15) {$s_{\i}$};
  }
  \foreach \i/\j [evaluate=\i as \X using -1.55*\i] in {0/1,1/2,2/3,3/4,4/5,5/6,6/7} {
    \draw[very thick,->] (\X-0.48,0) -- (\X-1.07,0) node[midway,above] {$c_{\j}$};
  }
  \draw[->] (1.9,0) -- (0.48,0) node[midway,below=2pt] {$c_0\!=\!c_\text{in}$};
  \draw[very thick,->] (-11.33,0) -- (-12.4,0) node[left] {$c_8\!=\!s_8\!=\!c_\text{out}$};
  \node[align=center] at (-5.4,2.15)
    {$X,Y$ : $8$ bits each \quad|\quad $S=c_8s_7\ldots s_0$ : $9$ bits \quad|\quad every wire drawn is $1$ bit};
  \draw[<->,thick] (-12.4,-1.7) -- (0.48,-1.7)
     node[midway,below] {critical path: $\tau_\text{add}(8)=7\,\tau_\text{cp}+\max(\tau_\text{cp},\tau_\text{fa})$};
\end{circuitikz}
\end{document}
```

*after Fig. 5.5, p. 108.* The thick wires are the carry chain; the thin ones are all off the critical path.

**Chain the cell and the carry becomes a schedule.** A full adder computes $(c_{i+1},s_i)=\text{FA}(x_i,y_i,c_i)$ on three $1$-bit inputs, with $s_i=x_i\oplus y_i\oplus c_i$ and $c_{i+1}$ the **majority** of the three (Eqs. 5.2–5.4, p. 107). Instantiate it once per bit position $i=0,\ldots,w-1$ and identify cell $i$'s carry-out with cell $i+1$'s carry-in. Nothing else is added — no control, no global wiring — and the resulting circuit computes $S=X+Y+c_\text{in}$ exactly. Widths: $X,Y$ are $w$ bits each, $c_\text{in}=c_0$ is $1$ bit of weight $2^0$, every internal $c_i$ is $1$ bit of weight $2^i$, and the output $S=c_w s_{w-1}\ldots s_0$ is $w+1$ bits. The MSB $s_w=c_w$ is what everyone calls $c_\text{out}$.

**The width bound is why the carry-in is free.** Two $w$-bit unsigned operands live in $[0,2^w-1]$, so $X+Y\in[0,2^{w+1}-2]$ — one short of the $2^{w+1}-1$ that $w+1$ bits can hold. That one spare slot is exactly where $c_\text{in}$ goes, so $X+Y+c_\text{in}$ still fits in $w+1$ bits with no further growth (p. 105). Signed $w$-bit operands live in $[-2^{w-1},2^{w-1}-1]$, giving $X+Y\in[-2^w,2^w-2]$ — the same story, $w+1$ signed bits with room for a unit carry-in (§5.1.2, p. 105). The RCA never rounds and never overflows *internally*; error, if any, is introduced downstream by the format you force the result into.

**Read the latency off the chain, not off the gate count.** The critical path starts at an input of the rightmost cell and ends at an output of the leftmost, so it traverses one full-adder input-to-output delay and $w-1$ carry-to-carry hops:

$$\tau_\text{add}(w)=(w-1)\,\tau_\text{cp}+\max(\tau_\text{cp},\tau_\text{fa}) \tag{5.7}$$

with $\tau_\text{cp}$ the $c_i\to c_{i+1}$ delay and $\tau_\text{fa}$ the input-to-output delay of a cell (p. 108). The $\max$ is not decoration: the last cell may be exited through either its sum output ($\tau_\text{fa}$) or its carry output ($\tau_\text{cp}$), and the path takes whichever is worse. Because $\tau_\text{cp}$ is multiplied by $w$ and $\tau_\text{fa}$ is not, the FA's *carry* path is the only one worth transistor-level effort — which is why foundries ship several hand-tuned FA cells per technology rather than one (p. 107). Area, by contrast, is $w$ cells flat, and the wiring is nearest-neighbour only, so the RCA is simultaneously the area floor and the delay ceiling of the carry-propagate adder (CPA) family.

**One cell can always be downgraded.** If $c_0$ is tied to $0$ — the usual case outside a subtractor or a multi-word add — cell $0$ has a constant input and degenerates to a [[Half Adder]]: $s_0=x_0\oplus y_0$, $c_1=x_0y_0$ (Eqs. 5.5–5.6, p. 107). Free, and it shortens the chain's first hop.

**Three interfaces, one datapath.** What distinguishes an adder's *interface* is only what you do with the two ends of the chain (Fig. 5.1, p. 105). The **generic adder** keeps $c_\text{out}=s_w$ and is exact, at $w+1$ output bits. The **modulo $2^w$ adder** drops $c_\text{in}$ and discards $c_\text{out}$, computing $X+Y \bmod 2^w$ with $w$ bits in and $w$ bits out. A [[Saturating Adder]] has the modulo adder's interface but substitutes the extremal representable value when $c_\text{out}$ fires, via one multiplexer on the output — the standard choice in signal processing, where wraparound is catastrophic and clipping is merely lossy. The chain itself is bit-for-bit identical in all three.

**Signed operands need no new hardware, only a new overflow test.** Two's complement is arithmetic modulo $2^w$ with a different *reading* of the MSB, so the circuit above adds signed numbers unmodified (§5.2.3, p. 108) — this is the main practical advantage of the representation. Only the overflow predicate changes: unsigned overflow is $c_\text{out}=1$; signed overflow occurs iff the two operands share a sign bit and the result's differs. The safe closed form is the XOR of the **top two carries**, $\text{ovf}=c_w\oplus c_{w-1}$.

> [!warning] The book's signed-overflow formula on p. 109 does not hold
> Fig. 5.6 and the surrounding text compute the flag as $s_{w-1}\oplus c_\text{out}$. Counterexample at $w=8$: $X=100=01100100_2$, $Y=-50=11001110_2$ give $S=50=00110010_2$ with $c_\text{out}=1$, so $s_7\oplus c_\text{out}=0\oplus1=1$ — flagged, although $+50$ is representable. $c_w\oplus c_{w-1}=1\oplus1=0$ is correct here and agrees with the book's own prose definition in every case.

**Fixed-point addition is not a thing.** For two operands in the same $\text{ufix}(m,\ell)$ format — an integer of $w=m-\ell+1$ bits scaled by $2^\ell$ — the scale factors out, $S=2^\ell X_\text{int}+2^\ell Y_\text{int}=2^\ell(X_\text{int}+Y_\text{int})$ **by distributivity of multiplication over addition** (Eq. 5.1, p. 106), so the exact sum sits in $\text{ufix}(m+1,\ell)$ and the hardware is the integer RCA above, unchanged. For different formats, first embed both into the smallest common format: zero-extend at the bottom, sign-extend at the top for signed operands, giving $m=\max(m_X,m_Y)+1$ and $\ell=\min(\ell_X,\ell_Y)$ (Fig. 5.2, p. 106). That alignment is pure wiring — no gates, only a wider chain. Forcing the result back into a narrower $\text{ufix}(m_S,\ell_S)$ can overflow iff $m_S<m$ and must round iff $\ell_S>\ell$; both are format decisions, not adder decisions.

> [!important] On FPGAs the RCA's asymptotics stop being a disadvantage
> Carry propagation runs on hardened, non-programmable carry logic with dedicated CLB-to-CLB routing that bypasses the general fabric entirely. On Virtex 6 at the fastest speed grade, carry-in to carry-out across a whole four-BLE slice is $\le 0.06$ ns, i.e. $\tau_\text{cp}=0.015$ ns **per bit**, against a worst-case $\tau_\text{fa}=0.57$ ns — a factor of $38$ (pp. 126–127). Substituting into (5.7): $w=8,16,32$ cost roughly $1$, $1.5$ and $2.5$ ns. Rippling $32$ bits spends only $0.48$ ns in chain; any tree replacing it pays $\log_2 32=5$ levels of general-fabric LUT at $\ge0.14$ ns plus routing, and loses before it starts. Hence the book's verdict that VLSI fast-adder architectures are "useless when targeting FPGAs for typical sizes (up to 32 bits)" (p. 134). Write `+` and let the tool infer the chain.

$$\boxed{\ c_{i+1}=x_ic_i\vee y_ic_i\vee x_iy_i,\qquad s_i=x_i\oplus y_i\oplus c_i,\qquad \tau_\text{add}(w)=(w-1)\tau_\text{cp}+\max(\tau_\text{cp},\tau_\text{fa})\ }$$

## When it breaks

- **Long chains on the ASIC critical path.** Past roughly $16$ bits the linear term dominates and a [[Parallel Prefix Adders|prefix tree]] wins; below that, or off the critical path, the RCA's area and zero routing pressure make it the right answer.
- **The delay model itself.** (5.7) assumes each stage regenerates the signal. A [[Switched Ripple-Carry Adder]] built from transmission gates does not, so its chain delay is superlinear and (5.7) is simply invalid for it (p. 114).
- **Neighbour-dependent placement.** The chain is only fast if the cells are physically adjacent. On FPGAs a carry chain may be forced to start at a specific ALM within a LAB, and a chain that spills across columns falls back onto general routing.
- **Timing closure at large $w$.** When the chain is the frequency limiter and you cannot shorten it, cut it instead — see [[Pipelined Ripple-Carry Adder]]. Only past ~$256$ bits does a combinatorial FPGA-specific scheme like the [[AAM Carry-Select Adder]] earn its keep (p. 137).
- **Iterative datapaths.** Inside a multiplier or divider loop, propagating the carry at all is the mistake; keep the result redundant with a [[CSA, Carry-Save Adder]] and collapse it once at the end.

## RTL (Spade)

```spade
/// One full-adder cell: (carry-out, sum).
fn fa(x: bool, y: bool, c: bool) -> (bool, bool) {
    let p = x != y;
    ((x && y) || (p && c), p != c)
}

/// The carry chain itself, LSB-first: one FA per recursion step.
fn ripple<#uint W>(x: [bool; W], y: [bool; W], cin: bool) -> [bool; {W + 1}] {
    gen if W == 0 {
        [cin]
    } else {
        let (cout, s) = fa(x[0], y[0], cin);
        [s].concat(ripple(x[1..W], y[1..W], cout))
    }
}

fn rca<#uint W>(x: uint<W>, y: uint<W>, cin: bool) -> uint<{W + 1}> {
    ripple(x.as_bits(), y.as_bits(), cin).as_uint()
}
```

`fa` is one box in the drawing; the `cout` threaded through the recursion is the thick wire, and `cin` at `W == 0` is the diagram's $c_8$ arriving as the MSB of the result — which is why `ripple` returns `[bool; W+1]` and `rca` returns `uint<W+1>` with no `zext`. `p` is reused for both outputs because $x\oplus y$ is a shared subexpression of sum and majority; note `!=` is XOR here, since `^` is not defined on `bool`. Everything is `fn`, hence purely combinational — no clock, no state. Index $0$ of `as_bits()` is the LSB, so `x[0]` is $x_0$ and the array concatenation packs $s_0$ into the low bit. Synthesis will not honour the structure: an ASIC tool re-maps this to whatever adder the library's timing wants, and an FPGA tool collapses `fa` onto the hard carry chain, so treat the recursion as a *specification of the carry order*, not a floorplan.

## Related Notes (with context)

- [[Full Adder]] – depends-on: the single cell this note replicates $w$ times.
- [[Half Adder]] – depends-on: what cell $0$ collapses to when $c_\text{in}=0$.
- [[Choosing an Adder]] – compares: where the RCA sits against every sibling, by width and target.
- [[Parallel Prefix Adders]] – extends: the RCA is the fully right-nested bracketing of the same associative reduction; every tree is a rebracketing.
- [[Kogge-Stone Tree]] – extends: trades the $O(w)$ chain for $\log_2 w$ depth at the cost of nodes and wire tracks.
- [[Carry-Select Adder]] – extends: keeps RCA blocks but overlaps them by speculating on each block's carry-in.
- [[Two's Complement Adder-Subtractor]] – extends: $w$ XOR gates and a driven $c_\text{in}$ turn this exact chain into $X+(-1)^{\texttt{sub}}Y$.
- [[Saturating Adder]] – extends: same chain, one output mux steered by $c_\text{out}$.
- [[CSA, Carry-Save Adder]] – counter-example: the same FA row with the carries *not* chained, giving delay independent of $w$ at the price of a redundant result.
- [[Switched Ripple-Carry Adder]] – counter-example: identical topology, transistor-level cells, and (5.7) no longer applies.
- [[FPGA Hard Carry Chain Adder]] – counter-example: hardened silicon makes this $O(w)$ circuit beat $O(\log w)$ trees up to and past $32$ bits.
- [[Pipelined Ripple-Carry Adder]] – extends: cut the chain into $m$-bit stages when throughput, not latency, is the constraint.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.1 Fixed-point considerations, pp. 104–106 — Fig. 5.1 (adder interfaces), Fig. 5.2 (format alignment), Eq. 5.1.
- §5.2.1 The full adder and half adder cells, p. 107 — Figs. 5.3–5.4, Eqs. 5.2–5.6.
- §5.2.2 Ripple-carry addition, p. 108 — **Fig. 5.5**, Eq. 5.7.
- §5.2.3 Addition of signed numbers in two's complement, pp. 108–109 — Fig. 5.6.
- §5.4 Adders on FPGAs, pp. 125–128 — Virtex 6 carry-chain timing from [Xil14].
- §5.5, p. 134 — the verdict on VLSI fast adders targeting FPGAs.
