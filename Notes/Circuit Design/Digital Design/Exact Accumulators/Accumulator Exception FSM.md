---
title: Accumulator Exception FSM
description: "Four states — finite, +inf, -inf, NaN — reproducing an FP adder's behaviour on exceptional inputs alongside a datapath that has no notion of them."
kind: circuit
source: "ASA §21.2.2.2, pp. 633-634; transition table from Table 11.1, p. 331"
status: seed
spade: simulated
tags: [digital, exact-accumulators, floating-point, exceptions, fsm]
aliases:
  - Exception Management
  - Accumulator Exception Handling
  - Exception FSM
---

# Accumulator Exception FSM

A three-flip-flop Moore machine that runs beside the fixed-point accumulator and carries the IEEE exception status the datapath cannot represent, its transition function being the join on a four-element lattice and therefore as order-independent as the exact sum it accompanies.

```tikz title="Four-state accumulator exception FSM: finite, +infinity, -infinity, NaN, with the summand class on every edge"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \tikzset{st/.style={circle,draw,minimum size=1.75cm,inner sep=1pt,align=center}}
  \tikzset{lb/.style={scale=0.72,inner sep=1.5pt}}

  \node[st] (f)  at (0,0)     {finite\\[-2pt]\scriptsize $\mathrm{exn}_A{=}01$};
  \node[st] (pi) at (4.2,2.3) {$+\infty$\\[-2pt]\scriptsize $10,\ s_A{=}0$};
  \node[st] (ni) at (4.2,-2.3){$-\infty$\\[-2pt]\scriptsize $10,\ s_A{=}1$};
  \node[st] (nn) at (8.4,0)   {NaN\\[-2pt]\scriptsize $\mathrm{exn}_A{=}11$};

  % ---------- reset
  \draw[->] (-2.6,0) -- (f.west);
  \node[lb,anchor=south] at (-1.75,0.06) {reset};

  % ---------- finite -> infinities
  \draw[->] (f) -- (pi);
  \node[lb,anchor=south east] at (2.28,1.38) {$X=+\infty$};
  \draw[->] (f) -- (ni);
  \node[lb,anchor=north east] at (2.28,-1.38) {$X=-\infty$};

  % ---------- infinities -> NaN
  \draw[->] (pi) -- (nn);
  \node[lb,anchor=south west] at (6.25,1.18) {$X\in\{\mathrm{NaN},-\infty\}$};
  \draw[->] (ni) -- (nn);
  \node[lb,anchor=north west] at (6.25,-1.18) {$X\in\{\mathrm{NaN},+\infty\}$};

  % ---------- finite -> NaN, straight through the middle
  \draw[->] (f) -- (nn);
  \node[lb,anchor=south] at (4.2,0.12) {$X=\mathrm{NaN}$};

  % ---------- self loops
  \draw[->] (f.north west) .. controls (-1.2,2.0) and (1.2,2.0) .. (f.north east);
  \node[lb,anchor=south] at (0,1.72) {$X\in\{$finite$,\,0\}$};

  \draw[->] (pi.north west) .. controls (3.0,4.6) and (5.4,4.6) .. (pi.north east);
  \node[lb,anchor=south] at (4.2,4.25) {$X\in\{$finite$,\,0,+\infty\}$};

  \draw[->] (ni.south west) .. controls (3.0,-4.6) and (5.4,-4.6) .. (ni.south east);
  \node[lb,anchor=north] at (4.2,-4.25) {$X\in\{$finite$,\,0,-\infty\}$};

  \draw[->] (nn.north east) .. controls (11.0,1.6) and (11.0,-1.6) .. (nn.south east);
  \node[lb,anchor=west] at (10.6,0) {any $X$};

  % ---------- port annotation
  \node[lb,anchor=west] at (-2.9,-5.05)
    {input $(\mathrm{exn}_X,s_X)$: $2+1$ bits, unpacked from the summand $X$};
  \node[lb,anchor=west] at (-2.9,-5.55)
    {state $=$ output $(\mathrm{exn}_A,s_A)$: $2+1$ bits, held in $3$ flip-flops};
\end{circuitikz}
\end{document}
```

**Start from the fact that the datapath is closed under nothing.** The exact accumulator's loop is a sign-padding shifter feeding a $w_A$-bit two's-complement register ([[Two's-Complement Exact Accumulator]]): every one of its $2^{w_A}$ code words denotes a finite dyadic rational, and there is no spare encoding. [[Number Formats]] shows where the exceptional values live instead — IEEE-754 reserves the all-ones exponent field, so $\pm\infty$ and `NaN` are exactly the inputs with no image in the fixed-point domain. Unpacking $X$ therefore splits it into a classification $\mathrm{exn}_X$ on 2 bits (zero, finite, infinity, `NaN`), a sign $s_X$ on 1 bit, an exponent on $w''_E=w_E+1$ bits and an unnormalised significand on $w''_F=2w_F+2$ bits. The last two go to the shifter; the first two go nowhere near it, and the exception status has to be carried in a register of its own. The particular 2-bit code assignment below is a choice, not a standard — only the four classes are.

**Read the transition function off the floating-point adder, not off the accumulator.** The specification is that the accumulator behave as a chain of floating-point additions would, so the transitions are Table 11.1 (p. 331) restricted to a running left operand:

| state, incoming $X$ | zero or finite | $+\infty$ | $-\infty$ | `NaN` |
|---|---|---|---|---|
| finite | finite | $+\infty$ | $-\infty$ | `NaN` |
| $+\infty$ | $+\infty$ | $+\infty$ | `NaN` | `NaN` |
| $-\infty$ | $-\infty$ | `NaN` | $-\infty$ | `NaN` |
| `NaN` | `NaN` | `NaN` | `NaN` | `NaN` |

Three facts do all the work: an infinity absorbs every finite summand, two infinities of opposite sign produce `NaN` (the invalid operation $\infty-\infty$), and `NaN` propagates through everything. Zero is not a fifth class as far as the FSM is concerned — it is a self-loop in every state, which is what lets the flush cycles of the [[High-Radix Carry-Save Accumulator]] feed $X_{\text{fix}}=0$ for $k$ cycles without disturbing the exception status.

**Recognise the table as a join, because that is what licenses the circuit.** Order the four states $\text{finite}\sqsubset\pm\infty\sqsubset\texttt{NaN}$ with $+\infty$ and $-\infty$ incomparable. That is the diamond lattice $M_2$: finite is the bottom, `NaN` the top, and the two infinities are incomparable atoms whose least upper bound is forced all the way to the top — which is precisely why $(+\infty)+(-\infty)$ is `NaN` and not something in between. Every entry of the table above is the lattice join $\sqcup$ of its row and column labels, with no exception, so by idempotence, commutativity and associativity of a join the state after $k$ summands is

$$\mathrm{state}_k \;=\; \bigsqcup_{i\le k}\iota(X_i)$$

where $\iota$ maps a summand to its class. The right-hand side is a function of the *multiset* of inputs, not of their order.

> [!important] The FSM had to be order-independent or the headline property would be a lie
> The exact accumulator's selling point is reproducibility: the same summands in any order give bit-identical results, because the fixed-point sum is associative where the floating-point one is not. An exception mechanism with an order-dependent outcome would have reintroduced exactly the defect the wide register was built to remove. It does not, and the reason is structural rather than lucky — the guard on every edge depends only on the class of the incoming summand and never on the accumulator's value.

**Take the output straight off the register, Moore-style.** The state *is* the output: $\mathrm{exn}_A$ on 2 bits and $s_A$ on 1 bit, with no logic between the flip-flops and the port ([[Moore]], [[Synchronous Sequential Logic]]). A Mealy output — the status of the accumulator *including* the summand presented this cycle — is available a cycle earlier for one extra level of logic, and here that trade is worthless twice over. Its consumer is the `rounding, exception handling & pack` block of [[Accumulator-to-Float Converter]] (Fig. 21.11, p. 637), which reads the accumulator register itself, so it wants the status as of the same clock edge, not before it. And the design's frequency is set by the $\alpha$-bit chunk adder inside the loop; putting combinational depth on a path that is already orders of magnitude shorter buys nothing and risks creating a second, pointless timing constraint.

**Merge, do not resolve, in the pack block.** The FSM is only one of three sources of exception information reaching the converter. The others are the zero flag $z$, raised when the leading-sign count reaches $C=w_A$, and the overflow that the final $w'_F+w'_E$-bit rounding adder detects for free — the biased format encoding puts the exponent field immediately above the fraction field, so a carry out of the fraction lands in the exponent, and the same adder catches both a rounding overflow and the extreme value $-2^{m_A}$. Which of the three wins, and how the winner is encoded, depends on the output format (IEEEfloat versus Nfloat); the book leaves that encoding as an exercise (p. 637).

**Add one input class when the accumulator is application-specific.** With $w_A$ chosen so no overflow is possible, the finite state is genuinely closed and the FSM only ever moves on an exceptional *input*. Once $m_A$ is finite ([[Application-Specific Exact Accumulator]]), a summand too large to align into the register must also be detected: compare the input exponent $E$ against the constant $m_A$ corrected by the bias, and drive the resulting overflow bit together with $s_X$ onto the same edges as $\mathrm{exn}_X=\text{infinity}$ (p. 634). Because that comparison is on the input exponent and not on the register contents, the guard still depends only on the summand, and order-independence survives the change.

**On FPGA the machine is free; on ASIC it is nearly free.** Three flip-flops and one level of gates driven by a 4-bit input, entirely outside the loop that sets the accumulator's frequency ([[FPGAs]]). On an FPGA the next-state function fits in a couple of LUTs and the state uses the flip-flops sitting behind them in the same logic cells — cells the accumulator's carry chain leaves idle. Against a $w_A$ of several hundred bits the exception path is not a cost item in either technology; it is a correctness item, and the reason to get it right is that a silently wrong `NaN` is indistinguishable from a correct answer downstream.

$$\boxed{\;(\mathrm{exn}_A,s_A)_{k}=\bigsqcup_{i\le k}\iota(X_i),\qquad \text{finite}=\bot\ \sqsubset\ {+\infty},\,{-\infty}\ \sqsubset\ \texttt{NaN}=\top\;}$$

**When it breaks.**

- **Signed zero is not reproduced.** Two's complement has one zero and the FSM has no state for $-0$, so an accumulation of nothing but $-0$ converts back as $+0$, where Table 11.1 (p. 331) says $-0 + -0 = -0$. Recovering it needs a fifth state, or a sticky "every summand was $-0$" bit qualified by the converter's $z$ flag.

  > [!warning] Not covered in the source — needs outside research
  > The book states the FSM has exactly four states and does not discuss signed zero anywhere in the accumulator chapter. The deviation above follows from the architecture; whether the generated operators handle it is not said.

- **Register overflow is invisible to it.** In the application-specific variant the FSM sees overflow of an *input*, detected on $E$ against $m_A$. A long run of in-range summands whose sum exceeds $2^{m_A}$ wraps the two's-complement register silently and leaves the state at finite. That is a parameterization failure — the $m_A$ bound of [[Application-Specific Exact Accumulator]] exists to make it impossible — but nothing in the datapath catches it if the bound was set wrong.
- **No payload, no flags.** Every `NaN` collapses to one state, so payloads are not propagated and signalling versus quiet `NaN` is not distinguished. The invalid-operation condition raised when $+\infty$ meets $-\infty$ is likewise exposed only as a state, not as a sticky IEEE flag.
- **It says nothing about accuracy.** The FSM is exact by construction because its domain is finite and discrete; every rounding question in the operator lives in the converter ([[Error Accuracy]]). A design that is bit-exact on exceptions can still be wrong at $0.5$ ulp.
- **Its independence is fragile to redesign, not to reordering.** Re-derive the guards from the accumulator's current value — "if $A$ has already saturated" — and the join structure collapses along with the reproducibility argument, even though the state diagram looks unchanged.

**RTL (Spade).**

```spade
// exn codes: 0 = zero, 1 = finite, 2 = infinity, 3 = NaN
entity acc_exn_fsm(clk: clock, rst: bool, exn_x: uint<2>, s_x: bool) -> (uint<2>, bool) {
    decl next;
    reg(clk) st reset(rst: (0b01, false)) = next;
    let (e, s) = st;
    let next = match (e, exn_x) {
        (0b11, _)    => (0b11, false),
        (_, 0b11)    => (0b11, false),
        (0b10, 0b10) => if s != s_x { (0b11, false) } else { (0b10, s) },
        (_, 0b10)    => (0b10, s_x),
        _            => st,
    };
    st
}
```

`st` is the three flip-flops of the diagram: `e` carries the two state bits, `s` the sign that separates $+\infty$ from $-\infty$ and is a don't-care in the other two states, driven to `false` so the register never toggles pointlessly. The five match arms are the five edge classes in priority order — `NaN` absorbing, `NaN` arriving, the opposite-sign infinity collision, an infinity arriving, and the self-loop `_ => st` covering zero and finite. Everything but the register is one level of combinational logic on a 4-bit input, and the body returns `st` rather than `next`, which is what makes it Moore. Synthesis will not keep the tuple the way the diagram draws it: it packs to a 3-bit vector and folds the three `(0b11, false)` constants into one shared decode.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §21.2.2.2 "Exception Management", pp. 633-634 — the four states and their role.
- §21.2.2.3 "Application-Specific Accumulator", p. 634 — overflow detected on $E$ against $m_A$, fed to the same FSM.
- §21.2.4 and Fig. 21.11, p. 637 — the `exn` bus arriving at the pack block, the zero flag $z$, and the overflow caught by the rounding adder.
- Table 11.1, p. 331 — special cases of floating-point addition; the FSM's transition table.

**Related Notes**

- [[Two's-Complement Exact Accumulator]] – depends-on: the datapath this machine runs beside, and the reason it cannot encode $\pm\infty$ itself.
- [[Application-Specific Exact Accumulator]] – extends: adds input overflow as a fifth transition class once $m_A$ is finite.
- [[Accumulator-to-Float Converter]] – supports: consumes the state and merges it with the zero flag and the rounding adder's overflow.
- [[High-Radix Carry-Save Accumulator]] – compares: its $k$ flush cycles feed zero summands, which are self-loops here, so the two mechanisms are independent.
- [[Floating-Point Operators]] – depends-on: the adder whose exceptional behaviour this reproduces, via Table 11.1.
- [[Moore]] – depends-on: output taken straight from the state register, which is what keeps the exception logic off the accumulator loop.
- [[Synchronous Sequential Logic]] – depends-on: the state-transition formalism and the synchronous reset that returns the machine to finite.
- [[Number Formats]] – supports: where $\pm\infty$ and `NaN` live in the IEEE encoding, and why fixed point has no room for them.
- [[Exact Accumulators]] – compares: the reproducibility claim this FSM must not break.
