---
title: Register Sandwich
description: "Wraps the preceding operator in input and output registers so the backend measures a real register-to-register f_max instead of an unbounded combinatorial path."
kind: circuit
source: "ASA §A.2.5, pp. 766-769; §A.3.3, p. 772"
status: seed
spade: simulated
tags: [digital, flopoco, pipelining, timing, fpga]
aliases:
  - RegisterSandwich
  - Register Sandwiching
  - Sandwiching an Operator with Registers
---

# Register Sandwich

One launch register per input port and one capture register on the output, clamped around an otherwise purely combinatorial operator — the minimum structure that gives static timing analysis two clocked endpoints and therefore turns a delay into a frequency.

```tikz title="A combinatorial operator sandwiched between launch and capture registers, and the resulting timing: one new input every critical-path delay"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,every node/.style={font=\footnotesize},>=stealth]
  % ================= datapath =================
  \draw[->] (-2.4,2.4) -- (-0.55,2.4);
  \node[anchor=south,font=\tiny] at (-1.45,2.45) {$X_{\text{in}}$ [$w$\,b]};
  \draw[fill=black!15] (-0.55,1.75) rectangle (-0.15,3.05);
  \node[anchor=south,font=\tiny,align=center] at (-0.35,3.1) {launch\\ register};

  \draw[fill=black!5] (0.55,1.9) rectangle (6.35,2.9);
  \draw[->] (-0.15,2.4) -- (0.85,2.4);
  \node[anchor=south,font=\tiny] at (0.2,2.45) {$X$};
  \foreach \x in {0.85,2.25,3.65,5.05}{
    \draw[fill=white] (\x,2.1) rectangle (\x+1.0,2.7);
  }
  \foreach \x in {1.85,3.25,4.65}{ \draw[->] (\x,2.4) -- (\x+0.4,2.4); }
  \node[anchor=north,font=\tiny] at (3.45,1.85) {combinatorial operator: acyclic, no memory};

  \draw[->] (6.05,2.4) -- (6.95,2.4);
  \node[anchor=south,font=\tiny] at (6.6,2.45) {$Y$};
  \draw[fill=black!15] (6.95,1.75) rectangle (7.35,3.05);
  \node[anchor=south,font=\tiny,align=center] at (7.15,3.1) {capture\\ register};
  \draw[->] (7.35,2.4) -- (8.05,2.4);
  \node[anchor=west,font=\tiny] at (8.05,2.4) {$Y_{\text{out}}$ [$r$\,b]};

  \draw[thick,->] (-0.15,4.0) -- (7.35,4.0);
  \node[anchor=south,font=\small] at (3.6,4.05) {$\overline{\Delta t}$ = critical path delay, the only path the backend must close};

  % ================= waveforms =================
  \foreach \a/\b/\lab in {0/3/{$X_0$}, 3/6/{$X_1$}, 6/9/{$X_2$}}{
    \draw (\a+0.12,1.05) -- (\b-0.12,1.05) -- (\b,0.9) -- (\b-0.12,0.75)
       -- (\a+0.12,0.75) -- (\a,0.9) -- cycle;
    \node at ({(\a+\b)/2},0.9) {\lab};
  }
  \node[anchor=east] at (-0.25,0.9) {$X$};
  \foreach \a/\b/\lab in {3/6/{$Y_0$}, 6/9/{$Y_1$}}{
    \draw (\a+0.12,0.35) -- (\b-0.12,0.35) -- (\b,0.2) -- (\b-0.12,0.05)
       -- (\a+0.12,0.05) -- (\a,0.2) -- cycle;
    \node at ({(\a+\b)/2},0.2) {\lab};
  }
  \draw (0,0.35) -- (2.9,0.35);
  \draw (0,0.05) -- (2.9,0.05);
  \node[anchor=east] at (-0.25,0.2) {$Y$};

  \node[anchor=east] at (-0.25,-0.45) {clk};
  \draw (0,-0.3) -- (0,-0.6) -- (1.5,-0.6) -- (1.5,-0.3) -- (3,-0.3)
     -- (3,-0.6) -- (4.5,-0.6) -- (4.5,-0.3) -- (6,-0.3)
     -- (6,-0.6) -- (7.5,-0.6) -- (7.5,-0.3) -- (9,-0.3);
  \draw[->] (-0.1,-1.05) -- (9.3,-1.05) node[anchor=west] {$t$};
  \foreach \x in {0,3,6,9}{ \draw[dotted] (\x,1.2) -- (\x,-1.05); }
  \draw[<->] (0,-1.5) -- (3,-1.5);
  \node[anchor=south,font=\small] at (1.5,-1.45) {$T=\overline{\Delta t}$};
  \node[anchor=north,font=\tiny,align=center] at (4.5,-1.75)
    {one new input every $T$; the result of $X_i$ is captured at the end of period $i$,\\
     so the operator sustains $f_{\max}=1/\overline{\Delta t}$ with a two-edge latency};
\end{circuitikz}
\end{document}
```

*After Fig. A.2a, p. 767.*

**A combinatorial operator has a delay, and a delay is not a frequency.** Almost every operator in this book is combinatorial: no memory, the output depends only on the present input and not on the operator's history. That is not an implementation choice but a consequence of the definition — an operator is a mathematical function composed with a well-defined rounding ([[Rounding]]), and a function has no history. The directed graph of subcomponents is therefore *acyclic* (p. 766). Present an input at time $t_0$ and the correct output appears after some delay $\Delta t$, which may itself depend on the input; the maximum of $\Delta t$ over all admissible inputs is the **critical path delay**, written $\overline{\Delta t}$ (p. 768). Nothing in that description mentions a clock. Ask a synthesis tool for the $f_{\max}$ of such a netlist and it has nothing to answer with: every timing path begins at a primary input port and ends at a primary output port, and both endpoints are unconstrained until someone declares when the input is launched and when the output is sampled.

**The sandwich supplies exactly those two endpoints and nothing else.** Put a register on every input and a register on the output, as in Fig. A.2a. The input registers may now present a new input every $\overline{\Delta t}$, and the combinatorial cloud has the full period to compute the result and settle before the output register captures it and before the next input arrives (p. 768). Every path in the design is now register-to-register, the tool has a launch edge and a capture edge for each, and the reported worst slack is a statement about the operator's logic rather than about the testbench. The cost is one clock cycle of latency at the input and one at the output — the waveform shows $Y_0$, the response to $X_0$, only becoming valid one full period after $X_0$ was launched.

**Nothing about the sandwich is generic, so it cannot live inside the operator.** FloPoCo deliberately adds **no input or output registers** to any operator it generates; the automatic pipeliner inserts intermediate registers only, and the "pipeline depth" it reports counts *synchronization barriers*, so a depth of 3 means 4 stages (p. 768, Fig. A.3a). That restraint is what makes operators composable — an operator that registered its own ports would double-register the moment it appeared as a subcomponent of another operator, and the pipeliner would have to unpick it. The consequence is that a freshly generated entity is untimeable, and the sandwich has to be requested separately. `RegisterSandwich` is therefore a command-line-level operator that wraps *the operator preceding it on the command line*, in exactly the same way `TestBench` tests the preceding operator ([[Self-Checking Test Bench]]):

```sh
flopoco frequency=400 FPAdd wE=8 wF=23 RegisterSandwich
```

**The register widths are the operator's port widths, and that is the whole area cost.** FloPoCo's simplified floating-point format lays out a word as `exn|s|E|F`, two exception bits plus a sign bit plus the exponent and fraction fields (Sect. 2.5.3, Fig. 2.15, p. 54 — see [[Number Formats]]), so $w_E=8$, $w_F=23$ gives $2+1+8+23 = 34$-bit ports. The sandwich around that `FPAdd` is two 34-bit launch registers and one 34-bit capture register, $3 \times 34 = 102$ flip-flops and no combinational logic whatsoever. Because it adds no logic it cannot change $\overline{\Delta t}$ itself; it only changes what the timing engine is allowed to say about it. On an FPGA the addition is close to free in area as well: every LUT in a slice already has a flip-flop on its output ([[FPGAs]]), and the I/O blocks have their own registers, so the placer usually absorbs the sandwich into cells that were being paid for anyway. On an ASIC those 102 flops are 102 real flops, which is why the sandwich is a measurement harness there and not something you would leave in a shipping datapath.

**The measurement is the first half of FloPoCo's two-step design method.** Writing an operator splits cleanly (p. 772). Step one builds a *functional combinatorial datapath*: the concern is correctness, the criterion is that it passes `TestBench`, and the performance metric is the critical path delay measured register-to-register with `RegisterSandwich`. Step two adds timing information — `target->logicDelay()`, `target->adderDelay(n)` — which does not change the function computed and does not touch a line of the emitted VHDL, so the worst a bad timing model can do is produce an inefficient pipeline. Step two therefore cannot break step one. The sandwich is what closes the loop between them: the model predicts $\sum_i \delta_i$ along the longest chain of `declare()`d delays, the sandwiched synthesis reports the delay the silicon actually has, and the gap between the two is the error in your model. Without the sandwich you can request a frequency ([[Frequency-Directed Pipelining]]) but you can never find out whether you got it. The `tools/` directory holds small Python scripts that read the target out of the generated VHDL, drive Vivado or Quartus, and print the synthesis result on the console (p. 769).

**Pipelining is the same drawing with the cloud cut into $N$ slices, and the sandwich stays on the outside.** Fig. A.2b divides the operator graph into $N$ pipeline stages, each with a critical path of about $\overline{\Delta t}/N$, with registers between slices holding the intermediate computations. If the pipeline is perfectly balanced and the added registers contribute no delay, the frequency becomes $N/\overline{\Delta t}$ — multiplied by $N$ for the cost of the extra registers (p. 768). Neither idealisation is exact in practice, which is precisely why the outer sandwich survives into the pipelined case: it is the $N=1$ instance of the same structure, and it is the instrument that tells you how much of the promised $\times N$ actually materialised.

$$\boxed{\ f_{\max} \;=\; \frac{1}{t_{\text{c}\to\text{q}} + \overline{\Delta t} + t_{\text{su}}} \;\xrightarrow[\ \text{register overhead} \to 0\ ]{}\; \frac{1}{\overline{\Delta t}} \ }$$

The book states the idealised right-hand form; the left-hand form is what the sandwiched netlist actually reports, and the difference between them is the register overhead the book flags as the reason a real pipeline never reaches $N/\overline{\Delta t}$.

**When it breaks.**

- **The overhead terms stop being negligible.** As $\overline{\Delta t}$ shrinks toward $t_{\text{c}\to\text{q}} + t_{\text{su}}$ the sandwich measures its own flip-flops. This is the same wall that stops deeper pipelining from paying: the registers add some delay which limits the achievable frequency [Hri+02; SC02] (p. 768).
- **$\Delta t$ depends on the input; static timing analysis does not.** $\overline{\Delta t}$ is a maximum over all inputs, but the tool computes a topological maximum over all *structural* paths, including false paths no input can sensitise. The reported number is an upper bound on the real worst case, and for wide carry-select or multi-branch datapaths the bound can be loose.
- **Small operators measure routing, not logic.** If the cloud is a couple of LUT ranks, the sandwich's own placement dominates: the flops land wherever the placer likes and the number you get is interconnect and clock skew. Sandwiching an 8-bit adder tells you about the fabric, not the adder.
- **The number is a best case, not the number the operator gets in a design.** Inside a larger circuit the operator's inputs arrive already delayed from other logic and its output feeds more logic before the next flop. The sandwich deliberately removes both, so it reports the operator's ceiling.
- **Operators with memory are not measured by it.** For the exact accumulators and the LTI filters — the book's stated exceptions to combinatoriality (p. 767, footnote 1) — the frequency is capped by the feedback recurrence, an internal register-to-register loop. Sandwiching the ports leaves that loop untouched and reports a path that is not the critical one.

> [!warning] The source does not quantify the error you make by *not* sandwiching. Appendix A argues that input and output registers are necessary for an honest measurement but gives no before/after synthesis figures, so how badly an unregistered report misleads on a given target is not established here and needs outside research.

**RTL (Spade).**

```spade
/// The operator under measurement: any purely combinational function.
fn payload<#uint W>(x: uint<W>, y: uint<W>) -> uint<{W + 1}> {
    x + y
}

/// Register sandwich: one launch register per input port, one capture register
/// on the output. The combinational cloud between them is then the only path
/// the backend has to close, so its report is a real register-to-register f_max.
entity register_sandwich<#uint W>(clk: clock, x: uint<W>, y: uint<W>) -> uint<{W + 1}> {
    reg(clk) xr = x;
    reg(clk) yr = y;
    reg(clk) r  = payload::<W>(xr, yr);
    r
}
```

`xr` and `yr` are the two launch registers of the drawing, `payload` is the grey cloud, and `r` is the capture register; the sandwich is generic in $W$ precisely because it contains no logic of its own. Width arithmetic follows the operator, not the wrapper — `+` on `uint<W>` grows to `uint<{W+1}>`, so the capture register is one bit wider than each launch register, the $r > w$ of the figure. The registers carry no reset on purpose: a reset would add a set path to all $2W+1$ flops that can itself become the critical path on an ASIC, and it measures nothing. Synthesis will not build the picture as drawn — on FPGA the launch flops are pulled into the input IOBs or folded into the slice flip-flops of the first LUT rank, so the sandwich typically consumes no additional slices and only the routing changes.

Simulated against a behavioural two-cycle reference: 3008 vectors including the asymmetric $1 + 128$ and its transpose $128 + 1$, the boundary cases $0+255$, $255+255$, $0+0$, the alternating pattern $170 + 85$, and a 3000-vector random sweep, all matching in value *and* in latency. Deleting one of the launch registers — the bug the picture cannot show — fails 2996 of those 3008 checks.

**Related notes.**

- [[Frequency-Directed Pipelining]] – supports: the sandwich is the only way to find out whether the `frequency` parameter's request was granted.
- [[Pipeline Synchronization Delay Line]] – compares: the intermediate registers FloPoCo inserts on its own, as against the boundary registers it refuses to insert.
- [[Pipelined Floating-Point Adder]] – extends: the depth-3 `FPAdd` of Fig. A.3 is the operator this command line sandwiches.
- [[Self-Checking Test Bench]] – compares: the same command-line idiom, wrapping the preceding operator to check values instead of timing.
- [[Synchronous Sequential Logic]] – depends-on: setup, hold and clock-to-Q are what turn the two boundary registers into a frequency bound.
- [[FPGAs]] – depends-on: the slice flip-flop and the IOB register are why the sandwich is nearly free in area here and genuinely additive on an ASIC.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §A.2.5 *Automatic Pipelining, the User Point of View*, pp. 766-769 — operators are combinatorial and their subcomponent graph acyclic (p. 766, and footnote 1 on p. 767 for the accumulator/filter exceptions); Fig. A.2, p. 767, panel (a) the sandwiched combinatorial operator and panel (b) the same operator in $N=4$ stages; $\overline{\Delta t}$, $f = 1/\overline{\Delta t}$, the $N/\overline{\Delta t}$ idealisation and the register-delay caveat [Hri+02; SC02], p. 768; FloPoCo adds no input or output registers and pipeline depth counts synchronization barriers, p. 768; "Hands on: Sandwiching an operator with register" and the `tools/` synthesis scripts, p. 769.
  - §A.3.3 *Automatic Pipelining, the Implementation*, p. 772 — the two-step design method, with the combinatorial critical path measured register-to-register by `RegisterSandwich`.
  - §2.5.3 *A simplified floating-point format*, Fig. 2.15, p. 54 — the `exn|s|E|F` layout giving the $2 + 1 + w_E + w_F$ port width used above.
- Long-form note: [[7.1) FloPoCo]], *Automatic pipelining, the user point of view* and *Automatic pipelining, the implementation*.
