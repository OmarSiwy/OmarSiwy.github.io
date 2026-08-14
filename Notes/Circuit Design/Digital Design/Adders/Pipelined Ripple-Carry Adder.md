---
title: "Pipelined Ripple-Carry Adder"
description: "On FPGA an unused flip-flop is wasted, not saved, so cut the RCA into m-bit stages; the DNP10 variant puts real adders in early stages to halve the balancing registers."
kind: circuit
source: "ASA §5.5.1, pp. 134-137"
status: seed
spade: simulated
tags: [digital, adders, fpga, pipelining, carry]
aliases:
  - "Pipelined Adder"
  - "Pipelined Adders"
  - "Pipelined RCA"
  - "IntAdder"
---

# Pipelined Ripple-Carry Adder

A [[RCA, Ripple-Carry Adder|ripple-carry adder]] sliced into $k=w/m$ groups of $m$ bits with a register between consecutive groups, trading $k-1$ cycles of latency for a clock period set by $m$ instead of by $w$.

```tikz title="16-bit pipelined ripple-carry adder, m = 4: classic pipelining versus the DNP10 variant"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\scriptsize,
  ff/.style={draw,fill=black!14,minimum width=0.52cm,minimum height=0.30cm,inner sep=1pt},
  cff/.style={draw,fill=black!45,text=white,minimum width=0.52cm,minimum height=0.30cm,inner sep=1pt},
  cpa/.style={draw,fill=gray!8,minimum width=1.55cm,minimum height=0.50cm,inner sep=1pt}]

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% (a) classic pipelining %%%%%%%%%%%%%%%%%%%%%%%%%
\node[font=\footnotesize] at (4.4,1.55) {(a) classic pipelining: group $j$ is added in stage $j$};

% ---- group 0 (LSBs, rightmost): CPA in stage 0, three output registers
\node[cpa] (a0) at (8.85,-0.575) {CPA};
\draw[->] (8.45,0.75) -- (8.45,-0.325); \node at (8.45,0.95) {$x_{3..0}$};
\draw[->] (9.25,0.75) -- (9.25,-0.325); \node at (9.25,0.95) {$y_{3..0}$};
\draw[->] (10.5,-0.575) -- (9.63,-0.575) node[midway,above] {$c_{\text{in}}$};
\node[ff] (a0r1) at (8.65,-1.15) {}; \node[ff] (a0r2) at (8.65,-2.30) {};
\node[ff] (a0r3) at (8.65,-3.45) {};
\draw[->] (8.65,-0.825) -- (a0r1); \draw[->] (a0r1) -- (a0r2);
\draw[->] (a0r2) -- (a0r3); \draw[->] (a0r3) -- (8.65,-4.55);
\node at (8.65,-4.75) {$s_{3..0}$};

% ---- group 1: one input register pair, CPA in stage 1, two output registers
\node[ff] (a1x) at (5.40,-1.15) {}; \node[ff] (a1y) at (6.40,-1.15) {};
\draw[->] (5.40,0.75) -- (a1x); \node at (5.40,0.95) {$x_{7..4}$};
\draw[->] (6.40,0.75) -- (a1y); \node at (6.40,0.95) {$y_{7..4}$};
\node[cpa] (a1) at (5.90,-1.725) {CPA};
\draw[->] (a1x) -- (5.40,-1.475); \draw[->] (a1y) -- (6.40,-1.475);
\node[ff] (a1r2) at (5.70,-2.30) {}; \node[ff] (a1r3) at (5.70,-3.45) {};
\draw[->] (5.70,-1.975) -- (a1r2); \draw[->] (a1r2) -- (a1r3);
\draw[->] (a1r3) -- (5.70,-4.55); \node at (5.70,-4.75) {$s_{7..4}$};

% ---- group 2
\node[ff] (a2x) at (2.45,-1.15) {}; \node[ff] (a2y) at (3.45,-1.15) {};
\node[ff] (a2x2) at (2.45,-2.30) {}; \node[ff] (a2y2) at (3.45,-2.30) {};
\draw[->] (2.45,0.75) -- (a2x); \node at (2.45,0.95) {$x_{11..8}$};
\draw[->] (3.45,0.75) -- (a2y); \node at (3.45,0.95) {$y_{11..8}$};
\draw[->] (a2x) -- (a2x2); \draw[->] (a2y) -- (a2y2);
\node[cpa] (a2) at (2.95,-2.875) {CPA};
\draw[->] (a2x2) -- (2.45,-2.625); \draw[->] (a2y2) -- (3.45,-2.625);
\node[ff] (a2r3) at (2.75,-3.45) {};
\draw[->] (2.75,-3.125) -- (a2r3); \draw[->] (a2r3) -- (2.75,-4.55);
\node at (2.75,-4.75) {$s_{11..8}$};

% ---- group 3 (MSBs): three input register pairs, CPA in stage 3, no output register
\node[ff] (a3x) at (-0.50,-1.15) {}; \node[ff] (a3y) at (0.50,-1.15) {};
\node[ff] (a3x2) at (-0.50,-2.30) {}; \node[ff] (a3y2) at (0.50,-2.30) {};
\node[ff] (a3x3) at (-0.50,-3.45) {}; \node[ff] (a3y3) at (0.50,-3.45) {};
\draw[->] (-0.50,0.75) -- (a3x); \node at (-0.50,0.95) {$x_{15..12}$};
\draw[->] (0.50,0.75) -- (a3y);  \node at (0.50,0.95) {$y_{15..12}$};
\draw[->] (a3x) -- (a3x2); \draw[->] (a3y) -- (a3y2);
\draw[->] (a3x2) -- (a3x3); \draw[->] (a3y2) -- (a3y3);
\node[cpa] (a3) at (0,-4.025) {CPA};
\draw[->] (a3x3) -- (-0.50,-3.775); \draw[->] (a3y3) -- (0.50,-3.775);
\draw[->] (0.20,-4.275) -- (0.20,-4.55); \node at (0.20,-4.75) {$s_{15..12}$};
\draw[->] (-0.78,-4.025) -- (-1.55,-4.025); \node at (-1.90,-4.025) {$c_{\text{out}}$};

% ---- the carry chain: the only registers that shorten the critical path
\draw[very thick] (8.075,-0.575) -- (7.55,-0.575) |- (7.36,-1.725);
\draw[very thick,->] (6.84,-1.725) -- (6.675,-1.725);
\node[cff] at (7.10,-1.725) {}; \node at (7.90,-1.15) {$c_4$};
\draw[very thick] (5.125,-1.725) -- (4.60,-1.725) |- (4.41,-2.875);
\draw[very thick,->] (3.89,-2.875) -- (3.725,-2.875);
\node[cff] at (4.15,-2.875) {}; \node at (4.95,-2.30) {$c_8$};
\draw[very thick] (2.175,-2.875) -- (1.65,-2.875) |- (1.46,-4.025);
\draw[very thick,->] (0.94,-4.025) -- (0.775,-4.025);
\node[cff] at (1.20,-4.025) {}; \node at (2.05,-3.45) {$c_{12}$};

%%%%%%%%%%%%%%%%%%%%%%%%%%%% (b) DNP10 / FPGA-optimised %%%%%%%%%%%%%%%%%%%%%%%
\begin{scope}[yshift=-6.9cm]
\node[font=\footnotesize] at (4.4,1.55)
  {(b) DNP10: every group added in stage 0, later stages only fold in the carry};

% ---- group 0
\node[cpa] (b0) at (8.85,-0.575) {CPA};
\draw[->] (8.45,0.75) -- (8.45,-0.325); \node at (8.45,0.95) {$x_{3..0}$};
\draw[->] (9.25,0.75) -- (9.25,-0.325); \node at (9.25,0.95) {$y_{3..0}$};
\draw[->] (10.5,-0.575) -- (9.63,-0.575) node[midway,above] {$c_{\text{in}}$};
\node[ff] (b0r1) at (8.65,-1.15) {}; \node[ff] (b0r2) at (8.65,-2.30) {};
\node[ff] (b0r3) at (8.65,-3.45) {};
\draw[->] (8.65,-0.825) -- (b0r1); \draw[->] (b0r1) -- (b0r2);
\draw[->] (b0r2) -- (b0r3); \draw[->] (b0r3) -- (8.65,-4.55);
\node at (8.65,-4.75) {$s_{3..0}$};

% ---- group 1: adder first, then ONE (m+1)-bit balancing register
\node[cpa] (b1) at (5.90,-0.575) {CPA};
\draw[->] (5.40,0.75) -- (5.40,-0.325); \node at (5.40,0.95) {$x_{7..4}$};
\draw[->] (6.40,0.75) -- (6.40,-0.325); \node at (6.40,0.95) {$y_{7..4}$};
\draw[->] (6.95,-0.575) -- (6.675,-0.575); \node at (7.10,-0.575) {$0$};
\node[ff] (b1v) at (5.70,-1.15) {};
\draw[->] (5.70,-0.825) -- (b1v);
\node[cpa] (b1b) at (5.90,-1.725) {CPA};
\draw[->] (b1v) -- (5.70,-1.475);
\node[ff] (b1r2) at (5.70,-2.30) {}; \node[ff] (b1r3) at (5.70,-3.45) {};
\draw[->] (5.70,-1.975) -- (b1r2); \draw[->] (b1r2) -- (b1r3);
\draw[->] (b1r3) -- (5.70,-4.55); \node at (5.70,-4.75) {$s_{7..4}$};

% ---- group 2
\node[cpa] (b2) at (2.95,-0.575) {CPA};
\draw[->] (2.45,0.75) -- (2.45,-0.325); \node at (2.45,0.95) {$x_{11..8}$};
\draw[->] (3.45,0.75) -- (3.45,-0.325); \node at (3.45,0.95) {$y_{11..8}$};
\draw[->] (4.00,-0.575) -- (3.725,-0.575); \node at (4.15,-0.575) {$0$};
\node[ff] (b2v) at (2.75,-1.15) {}; \node[ff] (b2v2) at (2.75,-2.30) {};
\draw[->] (2.75,-0.825) -- (b2v); \draw[->] (b2v) -- (b2v2);
\node[cpa] (b2b) at (2.95,-2.875) {CPA};
\draw[->] (b2v2) -- (2.75,-2.625);
\node[ff] (b2r3) at (2.75,-3.45) {};
\draw[->] (2.75,-3.125) -- (b2r3); \draw[->] (b2r3) -- (2.75,-4.55);
\node at (2.75,-4.75) {$s_{11..8}$};

% ---- group 3
\node[cpa] (b3) at (0,-0.575) {CPA};
\draw[->] (-0.50,0.75) -- (-0.50,-0.325); \node at (-0.50,0.95) {$x_{15..12}$};
\draw[->] (0.50,0.75) -- (0.50,-0.325);   \node at (0.50,0.95) {$y_{15..12}$};
\draw[->] (1.05,-0.575) -- (0.775,-0.575); \node at (1.20,-0.575) {$0$};
\node[ff] (b3v) at (-0.20,-1.15) {}; \node[ff] (b3v2) at (-0.20,-2.30) {};
\node[ff] (b3v3) at (-0.20,-3.45) {};
\draw[->] (-0.20,-0.825) -- (b3v); \draw[->] (b3v) -- (b3v2); \draw[->] (b3v2) -- (b3v3);
\node[cpa] (b3b) at (0,-4.025) {CPA};
\draw[->] (b3v3) -- (-0.20,-3.775);
\draw[->] (0.20,-4.275) -- (0.20,-4.55); \node at (0.20,-4.75) {$s_{15..12}$};
\draw[->] (-0.78,-4.025) -- (-1.55,-4.025); \node at (-1.90,-4.025) {$c_{\text{out}}$};

\draw[very thick] (8.075,-0.575) -- (7.55,-0.575) |- (7.36,-1.725);
\draw[very thick,->] (6.84,-1.725) -- (6.675,-1.725);
\node[cff] at (7.10,-1.725) {}; \node at (7.90,-1.15) {$c_4$};
\draw[very thick] (5.125,-1.725) -- (4.60,-1.725) |- (4.41,-2.875);
\draw[very thick,->] (3.89,-2.875) -- (3.725,-2.875);
\node[cff] at (4.15,-2.875) {}; \node at (4.95,-2.30) {$c_8$};
\draw[very thick] (2.175,-2.875) -- (1.65,-2.875) |- (1.46,-4.025);
\draw[very thick,->] (0.94,-4.025) -- (0.775,-4.025);
\node[cff] at (1.20,-4.025) {}; \node at (2.05,-3.45) {$c_{12}$};
\end{scope}

% ---- legend
\node[align=left,anchor=west,font=\scriptsize] at (-2.6,-12.6)
 {light box $=$ balancing register\quad|\quad dark box $=$ the one carry FF per stage that shortens the critical path\quad|\quad
thick wire $=$ carry, $1$ bit\\[1pt]
  $w=16$, group size $m=4$, latency $w/m-1=3$ cycles\quad|\quad
  every $x$, $y$, $s$ bus drawn is $m=4$ bits\\[1pt]
  (a) balances $2m=8$ raw operand bits per stage\quad|\quad
  (b) balances $m{+}1=5$ partial-sum bits per stage instead};
\end{circuitikz}
\end{document}
```

*after Fig. 5.29, p. 136.* The carry flip-flops are not drawn in the book's figure; they are counted in its text, and they are the only registers here that do any work.

**The topology is ordinary; the cost model is what makes it an FPGA circuit.** In VLSI a flip-flop costs roughly what a full adder costs, so buying speed with registers is never competitive against buying it with a [[Parallel Prefix Adders|prefix tree]] — and pipelining also delays the result by whole cycles, which forces yet more flip-flops elsewhere to re-synchronize the output with everything it meets downstream (p. 134). FPGAs invert every term of that. The LUT/FF ratio is close to $1$, the flip-flops live inside the BLEs and are already hard-wired to the adder outputs (see [[Lookup-Tables]]), and a BLE's flip-flop that you decline to use is *wasted, not saved*. Cutting the chain therefore costs almost nothing where the fabric was already paid for, which is why pipelining — not a cleverer carry network — is the standard FPGA answer to a slow wide adder.

**Cut the chain, do not touch the recurrence.** Split $X,Y\in\{0,1\}^w$ into $k=w/m$ groups $X_j=x_{(j+1)m-1..jm}$, each $m$ bits. The carry recurrence $c_{i+1}=g_i\vee(p_i\wedge c_i)$ is untouched; only its *schedule* changes. Group $j$'s $m$-bit CPA is placed in pipeline stage $j$, and the single group carry $c_{jm}$ — $1$ bit — crosses one register on its way from stage $j-1$ to stage $j$. Group $0$ takes $c_\text{in}$ combinationally in stage $0$; group $k-1$ emits $c_\text{out}=c_w$ in stage $k-1$. Latency is $k-1=w/m-1$ cycles, throughput one $w$-bit sum per cycle, and the clock period is

$$T \ \ge\ \tau_\text{add}(m)+\tau_\text{reg}\ =\ (m-1)\tau_\text{cp}+\max(\tau_\text{cp},\tau_\text{fa})+\tau_\text{reg}$$

with $\tau_\text{add}$ the [[RCA, Ripple-Carry Adder|RCA]] delay (5.7) and $\tau_\text{reg}$ the clock-to-Q plus setup of a BLE register. Because $m$ replaces $w$ in a formula that was linear in the width, the frequency is now yours to choose.

**Exactly one flip-flop per stage does any work; the rest are ballast.** Group $j$ must wait $j$ cycles for its carry-in, so its two operand halves are delayed through $2mj$ flip-flops; its sum $S_j$ must then wait $k-1-j$ cycles for the groups above it to finish, costing $m(k-1-j)$ more. Summing over $j$ with $\sum_{j=0}^{k-1}j=\sum_{j=0}^{k-1}(k-1-j)=\tfrac{k(k-1)}{2}$:

$$\text{FF}_\text{bal}=\sum_{j=0}^{k-1}\big[2mj+m(k-1-j)\big]=\Big(m+\tfrac{m}{2}\Big)k(k-1)=\tfrac{3m}{2}\cdot\tfrac{w}{m}\Big(\tfrac{w}{m}-1\Big)=\frac{3w(w-m)}{2m}$$

plus $k-1$ carry flip-flops. At $w=16,m=4,k=4$ that is $72$ balancing bits — count them in panel (a) — against $3$ carry bits. **Only those $3$ shorten the critical path.** The $72$ exist purely so that operands and results arrive in the same stage as the carry they belong to.

> [!warning] The book's per-stage flip-flop count contradicts its own figure
> p. 135 states that "each pipeline stage except stage 0 requires $2m$ FFs for the inputs, $m$ FFs for the output, and a single FF for the carry", which reads as a total of $(k-1)(3m+1)=3\times13=39$ flip-flops for Fig. 5.29a. The figure itself draws $24+20+16+12=72$ balancing bits, plus the $3$ carry bits it omits, i.e. $75$. The sentence is right *per group per stage waited* and wrong as a per-stage total: a group waiting $j$ stages pays $2mj$, not $2m$.

**Balancing is quadratic in $w$, and that is what actually sets $m$.** Rewriting $\text{FF}_\text{bal}=\tfrac{3}{2}\big(\tfrac{w^2}{m}-w\big)$ shows the cost is monotonically *decreasing* in $m$ while the clock period $\tau_\text{add}(m)$ is increasing in it. There is no optimum to search for: pick the **largest** $m$ whose $m$-bit ripple still closes at the target frequency, and the register cost falls out. That is precisely the knob [[FloPoCo]] turns — `flopoco frequency=300 IntAdder wIn=1024` derives the group size and pipeline depth from the frequency and the target device (p. 137). The scale is worth internalising: at $w=1024$ with $m=32$ the balancing cost is $\tfrac{3\cdot1024\cdot992}{64}=47{,}616$ flip-flops wrapped around an adder containing $1024$ full adders.

**Output registers are free; balancing registers are the bill.** The $m(k-1-j)$ registers holding a finished $S_j$ can use the BLE registers of the very BLEs that computed the addition, so the first of them is genuinely free. Everything else must come from other BLEs. The standard mitigation is that a run of several registers on the same bus with no taps is a *shift register*, and an FPGA LUT can be reconfigured as one — the SRL (§4.3.2) — collapsing a $j$-stage $m$-bit delay from $jm$ BLE registers to roughly $m$ LUTs. Either way, "the number of BLEs for pipeline balancing may be higher than the BLEs required for the actual summation" (p. 135) is the normal case, not the pathological one.

**DNP10: compress the operands before you store them.** In BLE terms a bare flip-flop costs about the same as a flip-flop *plus* the full adder sitting in front of it — the adder is already there and unused. So spend it. Give **every** group an $m$-bit CPA in stage $0$ with carry-in $0$, producing

$$v_j = X_j + Y_j \in [0,\,2^{m+1}-2], \qquad m+1 \text{ bits},$$

and balance $v_j$ instead of the pair $(X_j,Y_j)$. Stage $j$ then only has to fold in the carry, $v_j+c_{jm}$. This needs no extra width and no carry-merging OR gate: since $v_j\le 2^{m+1}-2$ and $c_{jm}\le1$, the sum $v_j+c_{jm}\le 2^{m+1}-1$ still fits in $m+1$ bits, so the $(m+1)$-bit result *is* $[\,c_{(j+1)m}\,|\,S_j\,]$ with the outgoing group carry sitting in bit $m$. Correctness follows from associativity of integer addition alone — $(X_j+Y_j)+c_{jm}=X_j+(Y_j+c_{jm})$ — so panel (b) computes bit-for-bit what panel (a) computes, at the same latency. The balancing cost becomes

$$\text{FF}_\text{bal}^{\text{DNP10}}=\sum_{j=0}^{k-1}\big[(m+1)j+m(k-1-j)\big]=\frac{2m+1}{2}\,k(k-1),$$

$54$ bits at $w=16,m=4$ against $72$.

> [!warning] "About half" is asymptotic, not the figure's own number
> p. 137 says the DNP10 scheme "avoids about half of the BLEs required for input balancing". The input-balancing term drops from $2m$ to $m+1$ bits per waited stage, a ratio $\tfrac{m+1}{2m}$ that tends to $\tfrac12$ only as $m$ grows. At the book's own $m=4$ it is $\tfrac58$: $48$ input-balancing bits become $30$, an economy of $37.5\,\%$ — and $25\,\%$ once the untouched output registers are counted back in.

$$\boxed{\ k=\frac{w}{m},\quad \text{latency}=k-1,\quad T\ge\tau_\text{add}(m)+\tau_\text{reg},\quad \text{FF}_\text{bal}=\frac{3w(w-m)}{2m}\ \xrightarrow{\ \text{DNP10}\ }\ \frac{2m+1}{2}k(k-1)\ }$$

## When it breaks

- **Anything with a loop around the adder.** An accumulator, the final CPA collapsing a [[CSA, Carry-Save Adder|carry-save]] datapath inside an iteration, or a comparison feeding back into address generation cannot absorb $w/m-1$ cycles of latency without an initiation interval to match.
- **Late-arriving $c_\text{in}$.** Group $0$ consumes $c_\text{in}$ combinationally in stage $0$. A carry-in produced by another operator in the same cycle lands on the *tightest* path in the design, not the loosest.
- **Very large $w$.** $\text{FF}_\text{bal}=\Theta(w^2/m)$ means registers, not adders, dominate the area long before the carry chain does. Beyond ~$256$ bits the [[AAM Carry-Select Adder]] is reported to match this architecture's resource count at equal speed while keeping **single-cycle** latency (p. 139).
- **ASIC.** With $\text{cost}(\text{FF})\approx\text{cost}(\text{FA})$ the $72$ balancing bits above are worth $72$ full adders, i.e. $4.5$ copies of the adder being pipelined. Use a tree.
- **SRL folding needs a plain shift.** Collapsing a balancing chain into an SRL requires an untapped, un-reset, un-enabled delay line. A synchronous reset or a per-stage clock enable on the balancing registers forces real flip-flops back and the area estimate above doubles or worse.
- **$m\nmid w$.** The last group is short; it costs no more, but $k=\lceil w/m\rceil$ and the closed forms above become upper bounds.
- **Below ~$32$ bits on FPGA.** The [[FPGA Hard Carry Chain Adder|hard carry chain]] already runs the whole width in $\approx2.5$ ns; pipelining buys nothing but latency.

## RTL (Spade)

```spade
/// m-bit group adder: m sum bits plus the group carry-out, packed as uint<m+1>.
fn grp(x: uint<4>, y: uint<4>, c: bool) -> uint<5> {
    (x + y) +. zext::<1, 5>(c.as_uint())
}

/// Fig. 5.29a: classic pipelining, w = 16, m = 4, four groups, latency 3.
pipeline(3) prca16(clk: clock, x: uint<16>, y: uint<16>, cin: bool) -> uint<17> {
        let (xg0, yg0) = (x.as_bits()[0..4].as_uint(),   y.as_bits()[0..4].as_uint());
        let (xg1, yg1) = (x.as_bits()[4..8].as_uint(),   y.as_bits()[4..8].as_uint());
        let (xg2, yg2) = (x.as_bits()[8..12].as_uint(),  y.as_bits()[8..12].as_uint());
        let (xg3, yg3) = (x.as_bits()[12..16].as_uint(), y.as_bits()[12..16].as_uint());
        let r0 = grp(xg0, yg0, cin);
        let s0 = r0.as_bits()[0..4].as_uint();
        let c1 = r0.as_bits()[4];
    reg;
        let r1 = grp(xg1, yg1, c1);
        let s1 = r1.as_bits()[0..4].as_uint();
        let c2 = r1.as_bits()[4];
    reg;
        let r2 = grp(xg2, yg2, c2);
        let s2 = r2.as_bits()[0..4].as_uint();
        let c3 = r2.as_bits()[4];
    reg;
        let r3 = grp(xg3, yg3, c3);
        r3.concat(s2).concat(s1).concat(s0)
}

/// Fig. 5.29b: DNP10, every group added in stage 0; later stages only fold in the carry.
pipeline(3) prca16_dnp(clk: clock, x: uint<16>, y: uint<16>, cin: bool) -> uint<17> {
        let v0 = grp(x.as_bits()[0..4].as_uint(), y.as_bits()[0..4].as_uint(), cin);
        let v1 = x.as_bits()[4..8].as_uint()   + y.as_bits()[4..8].as_uint();
        let v2 = x.as_bits()[8..12].as_uint()  + y.as_bits()[8..12].as_uint();
        let v3 = x.as_bits()[12..16].as_uint() + y.as_bits()[12..16].as_uint();
        let s0 = v0.as_bits()[0..4].as_uint();
        let c1 = v0.as_bits()[4];
    reg;
        let r1 = v1 +. zext::<1, 5>(c1.as_uint());
        let s1 = r1.as_bits()[0..4].as_uint();
        let c2 = r1.as_bits()[4];
    reg;
        let r2 = v2 +. zext::<1, 5>(c2.as_uint());
        let s2 = r2.as_bits()[0..4].as_uint();
        let c3 = r2.as_bits()[4];
    reg;
        let r3 = v3 +. zext::<1, 5>(c3.as_uint());
        r3.concat(s2).concat(s1).concat(s0)
}
```

Each `reg;` is one horizontal cut across the drawing, and every balancing register in the figure is implicit in the source: reading `xg3` after three `reg;` separators is what makes Spade insert the $2m\times3$ light boxes of panel (a)'s left column, and reading `v3` the same way inserts the $(m{+}1)\times3$ boxes of panel (b) — the two architectures differ only by *where the `+` sits relative to the first `reg;`*. `c1`/`c2`/`c3` are the thick wires; each crosses exactly one stage boundary and so becomes one dark carry flip-flop. `grp` returns `uint<5>` because `uint<4> + uint<4>` already widens to $5$ bits, and the trailing `+.` folds the carry in without widening again — legal exactly because of the $v_j+c_{jm}\le2^{m+1}-1$ bound above. `concat` on integers puts its receiver in the **high** bits, so `r3.concat(s2)...` assembles $c_\text{out}s_{15..0}$, $17$ bits. Synthesis will not preserve `grp` as four separate adders: an FPGA tool maps each `+` onto the hard carry chain and it is retiming, not this source, that finally decides which physical flip-flop holds which bit.

## Related Notes (with context)

- [[RCA, Ripple-Carry Adder]] – depends-on: the chain this note cuts; (5.7) with $m$ in place of $w$ is the clock period.
- [[Synchronous Sequential Logic]] – depends-on: the register discipline that makes stage $j$'s carry legal to consume in stage $j+1$.
- [[Lookup-Tables]] – supports: the BLE's LUT+FF pairing is the whole economic argument, and the SRL that folds balancing chains is the same LUT reconfigured.
- [[FloPoCo]] – supports: `flopoco frequency=300 IntAdder wIn=1024` picks $m$ and the depth for you.
- [[Choosing an Adder]] – compares: where pipelining sits against every combinational sibling.
- [[FPGA Hard Carry Chain Adder]] – compares: the thing being pipelined; below ~$32$ bits it needs no help.
- [[AAM Carry-Select Adder]] – counter-example: comparable resources at the same frequency, but single-cycle latency past $256$ bits.
- [[Parallel Prefix Adders]] – counter-example: the ASIC answer to the same problem, and the one that loses on FPGA.
- [[Carry-Select Adder]] – compares: also splits into $m$-bit groups, but speculates on the group carry instead of registering it.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.5, p. 134 — the verdict that VLSI fast adders are useless on FPGA below ~$32$ bits, and the two escape routes (pipelining, combinational optimisation).
- §5.5.1 Pipelined adders, pp. 135–137 — VLSI vs FPGA flip-flop economics; the per-stage FF accounting; SRL folding (forward ref. to §4.3.2); the DNP10 variant; the FloPoCo `IntAdder` hands-on.
- **Fig. 5.29, p. 136** — (a) classic and (b) FPGA-optimised pipelining of a $16$-bit RCA at $m=4$.
- §5.2.2, p. 108 — Eq. 5.7, the RCA delay $\tau_\text{add}$, specialised here to $m$.
- §5.4, pp. 126–127 — Virtex 6 carry-chain and BLE timing behind $\tau_\text{cp}$ and $\tau_\text{fa}$.
- §5.5.2, p. 139 — [NPP11]'s comparison against the AAM architecture beyond $256$ bits.
