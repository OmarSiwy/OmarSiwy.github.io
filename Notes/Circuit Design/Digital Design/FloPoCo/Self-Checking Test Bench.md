---
title: "Self-Checking Test Bench"
description: "Vectors derived from the operator's mathematical specification in GMP/MPFR, not from the generated VHDL, with an operator-specific random generator skewed toward the hard path — so a VHDL bug must be mirrored to hide."
kind: circuit
source: "ASA §A.2.3, pp. 764-766"
status: seed
spade: simulated
tags: [digital, flopoco, verification, testbench, rounding]
aliases:
  - TestBench
  - Self-Checking Testbench
  - FloPoCo TestBench
  - Test Bench Generator
---

# Self-Checking Test Bench

A generated VHDL test bench whose expected values come from an independent C++ implementation of the operator's *specification* rather than from the operator's *architecture*, so that a datapath bug can only escape if an independent bug in the reference model mirrors it exactly.

```tikz title="FloPoCo self-checking test bench: vectors from the C++ specification, acceptance test on the DUT output, error counter"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm]
  % reference side
  \node[draw,dashed,rounded corners=2pt,align=center,minimum width=3.8cm,minimum height=1.2cm] (spec) at (-5.0,3.4)
    {\footnotesize independent C++ model\\ \footnotesize $\circ(f(X))$ via GMP / MPFR};
  \node[draw,rounded corners=2pt,align=center,minimum width=3.8cm,minimum height=1.3cm] (file) at (-5.0,0.8)
    {\footnotesize \texttt{test.input}\\ \footnotesize $X_k$: corner cases first,\\ \footnotesize then skewed random};
  % DUT
  \node[draw,rounded corners=2pt,align=center,minimum width=3.2cm,minimum height=1.4cm] (dut) at (0.2,3.4)
    {\footnotesize DUT\\ \footnotesize \texttt{flopoco.vhdl}\\ \footnotesize (pipeline depth $d$)};
  % exact value, split at the output ulp
  \node[draw,rounded corners=2pt,align=center,minimum width=3.2cm,minimum height=1.3cm] (exact) at (0.2,0.0)
    {\footnotesize exact result, split\\ \footnotesize at the output ulp};
  % checker
  \node[draw,rounded corners=2pt,align=center,minimum width=3.4cm,minimum height=1.7cm] (chk) at (7.2,1.7)
    {\footnotesize acceptance test\\ $R \in \{X_h,\ X_h{+}1\}$\\ \footnotesize (single value if $X_\ell = 0$)};
  \node[draw,rounded corners=2pt,align=center,minimum width=3.0cm,minimum height=1.1cm] (cnt) at (11.6,1.7)
    {\footnotesize error counter\\ \footnotesize \texttt{0 error(s)}};
  % edges
  \draw[->] (spec) -- (file);
  \draw[->] (file.east) -- (-2.6,0.8) -- (-2.6,3.4) -- (dut.west);
  \draw[->] (file.east) -- (exact.west);
  \draw[->] (dut.east) -- (3.8,3.4) -- (3.8,2.4) -- (5.5,2.4);
  \draw[->] (exact.east) -- (3.8,0.0) -- (3.8,1.0) -- (5.5,1.0);
  \draw[->] (chk) -- node[above]{\footnotesize $1$ b} (cnt);
  % annotations
  \node[anchor=north] at (-5.0,-0.1) {\footnotesize $X_k$: $w_{\text{in}}$ b};
  \node[anchor=west,align=left] at (-2.45,2.3) {\footnotesize same vector,\\ \footnotesize both sides};
  \node[anchor=south west] at (3.9,2.45) {\footnotesize $R$: $w$ b};
  \node[anchor=south west,align=left] at (3.9,1.05) {\footnotesize $X_h$: $w$ b\\ \footnotesize $X_\ell$: $g$ b};
  \node[anchor=north,align=center] at (2.0,-1.1)
    {\footnotesize the vectors are built without ever looking at the DUT};
\end{circuitikz}
\end{document}
```

*Own construction; the appendix has no figure for the test bench flow.*

**Start from why the generator cannot be trusted operator by operator.** [[FloPoCo]] can emit an unbounded family of operators, and its developers have obviously not tested each of them (p. 764). That is not sloppiness, it is the defining condition of application-specific arithmetic: the whole point of a generator is that the operator you are asking for has never been built before, so no amount of regression testing on *other* parameter values covers yours. Two structural consequences follow. Invalid parameter combinations "may lead to unexpected crashes or nonworking VHDL" (p. 764) because users have more imagination than developers can anticipate. And the only testing that can possibly scale is testing that is *generated alongside* the operator, from the same parameters — one test bench generator per operator class, exercising exactly the instance that was just built.

**Independence of the oracle is the entire argument.** The test vectors are not built out of the generated VHDL. They are built out of the operator's mathematical specification — a function $f$ composed with a well-defined rounding $\circ$, per the book's definition of an operator (Sect. 1.3, p. 7) — implemented separately in C++ (p. 765). A hardware bug and a reference bug are then independent events, so for a fault to survive it must be *mirrored*: the C++ has to be wrong in precisely the way the VHDL is wrong, on precisely the vectors tested. The book's second reason is quantitative rather than logical: the reference code is small, boilerplate-heavy, and delegates all arithmetic to GMP and MPFR, which are far better specified and far more heavily exercised than any freshly generated datapath. The conclusion is deliberately provocative — confidence in the test bench is higher than confidence in the circuit it tests.

**The accuracy contract becomes a membership test, not an equality test.** This is where [[Error Accuracy]] cashes out mechanically. Let the operator have output format with ulp $2^{\ell_{\text{out}}}$, let $y = f(x)$ be the exact real result, and split it at the output ulp:

$$X_h = \left\lfloor \frac{y}{2^{\ell_{\text{out}}}} \right\rfloor, \qquad X_\ell = \frac{y}{2^{\ell_{\text{out}}}} - X_h \in [0,1)$$

so $X_h$ is $w$ bits wide and the residue $X_\ell$ is carried in $g$ guard bits. A **faithful** result is any representable value at distance strictly less than one ulp from $y$, and by the definition of the floor there are at most two such values, $X_h$ and $X_h+1$. When $X_\ell = 0$ the exact result is on the output grid and the two candidates collapse to one, because $X_h + 1$ is then a full ulp away and no longer faithful. A **correctly rounded** operator promises a singleton set for every vector, fixed by the rounding mode of [[Rounding]] — including the tie rule, which the reference model must reproduce exactly. So the checker is a comparator against a set whose cardinality depends on the data, and the width of that comparator is $w$ bits regardless of $g$: the guard bits only ever produce the one-bit sticky flag $X_\ell \neq 0$.

**Exhaustive testing is available and should be taken whenever it is affordable.** For a small input word size, all $2^{w_{\text{in}}}$ vectors fit:

```sh
flopoco IntConstDiv wIn=16 d=3 TestBench
```

emits the VHDL plus a human-readable `test.input` holding every one of the $2^{16}$ inputs with its expected output, and prints the invocations for a choice of VHDL simulators (p. 765). Exhaustive is the only regime in which the coverage question has no answer to argue about, and it is exactly the regime FPGA-oriented arithmetic lives in most often — a table-driven or LUT-mapped operator on 12 to 18 input bits is common, and a laptop enumerates it in seconds. An ASIC-oriented 53-bit datapath never gets this luxury.

**Above that size the random generator has to be operator-specific, or it tests nothing.** For large word sizes the command takes a vector budget:

```sh
flopoco FPAdd we=8 wf=23 TestBench n=100000
```

The sequence *begins* with every corner case the `FPAdd` developers could think of, including regression vectors from past bugs, and only then goes random (p. 765). The reason the random part cannot be uniform is a counting argument. Subtractive cancellation in a floating-point adder requires the two exponents to differ by at most 1 (Sect. 11.1, p. 331); with $w_E$-bit exponents drawn uniformly from $N = 2^{w_E}$ values, the number of ordered pairs satisfying $|E_x - E_y| \le 1$ is $N + 2(N-1) = 3N-2$, so

$$\Pr[\,|E_x - E_y| \le 1\,] = \frac{3N-2}{N^2} \approx \frac{3}{2^{w_E}}$$

which for binary32 ($w_E = 8$) is about $1.2\%$ — and the interesting sub-case, near-total cancellation, is a small fraction of that again. A uniform tester therefore spends essentially its whole budget on the easy path and leaves the cancellation logic, which is the hard and error-prone part of [[Floating-Point Operators]], almost untouched. FloPoCo's generator is deliberately skewed to make cancellations frequent (pp. 765–766). The general principle is the one to carry away: **the random generator belongs to the operator, not to the framework**, because only the operator knows where its hard path is.

**The bench also checks the one thing automatic pipelining actually promises.** FloPoCo does not guarantee that a requested frequency is met — that is the backend's business — but it does guarantee that the pipeline is correctly *synchronized*, and `TestBench` adapts itself to pipelined operators so you can confirm it (p. 768). Concretely the bench tracks the reported depth $d$ and compares $R$ against the expected value of the vector applied $d$ cycles earlier; a missing register on one path of [[Pipeline Synchronization Delay Line]] shows up as a mismatch on the first vector where the two paths disagree. This is why [[Frequency-Directed Pipelining]] is allowed to use an approximate timing model: retiming is a purely temporal transformation, so the functional verdict is unchanged and the only thing left to check is that every path was retimed by the same amount.

**The pass criterion is one line of simulator output.** The recommended simulator is the open-source `nvc`, and the bench is judged solely on whether it prints `0 error(s) encountered`; on failure, waveforms are already written for `gtkwave` (p. 765). The book notes the user interface is kept deliberately trivial — appending the word `TestBench` to the command line, exactly as `RegisterSandwich` is appended — specifically to remove any excuse not to test.

$$\boxed{\ \text{accept } R \iff R \in \begin{cases} \{X_h\}, & X_\ell = 0 \\[2pt] \{X_h,\ X_h + 1\}, & X_\ell \neq 0 \end{cases}\ }$$

**When it breaks.**

- **A wrong specification is mirrored perfectly.** Independence buys you protection against implementation bugs on either side, not against both sides implementing the wrong function. If you asked for the wrong $\ell_{\text{out}}$, or your $f$ is not the $f$ your application needs, the bench reports `0 error(s)` and is right to.
- **Exhaustive dies fast.** A two-input 16-bit operator is already $2^{32}$ vectors; a binary32 adder is $2^{64}$. Beyond the exhaustive regime the verdict is statistical, and the appendix offers no rule for choosing $n$.
- **The skew is manual work per operator.** A new operator with a new hard path needs a new generator, or the sweep silently misses that path while still reporting success. Nothing in the framework detects that the skew is absent.
- **The top of the output format.** $X_h + 1$ is not representable when $X_h$ is the largest output value; a checker that lets the increment wrap will accept $R = 0$ for a result at the top of the range. The acceptance set must be $\{X_h\}$ there.
- **A faithful checker cannot audit a correctly rounded operator.** Its two-element set accepts the wrong one of the two, so a correct-rounding bug passes. The bench must be generated from the accuracy the operator actually claims, not the weaker one.
- **The tested operator may not be the operator you asked for.** Invalid parameter combinations can produce nonworking VHDL (p. 764); the bench validates whatever was generated.

> [!important] The test bench is the only executable form of the accuracy contract. An ulp-level promise written in a datasheet is prose; the same promise expressed as an acceptance set is an oracle that runs on every vector. This is the mechanism that makes "computing just right" checkable rather than aspirational.

**RTL (Spade).** The synthesizable core of the bench is the acceptance test itself — the comparator the dashed box on the right of the diagram becomes when you want to run it in hardware (emulation, or a built-in self-test) rather than in a simulator.

```spade
/// Faithful-rounding acceptance test: the oracle a FloPoCo TestBench applies to
/// one vector of a faithful operator. `xh` is the exact result truncated to the
/// output format; `xl` holds the G bits of the exact result below the output ulp.
fn faithful_ok<#uint W, #uint G>(r: uint<W>, xh: uint<W>, xl: uint<G>) -> bool {
    let zero: uint<W> = 0;
    let top: uint<W> = ~zero;             // largest representable output
    let inexact: bool = xl != 0;          // exact result not on the output grid
    let up: uint<W> = trunc(xh + 1);      // the other faithful candidate
    (r == xh) || (inexact && (xh != top) && (r == up))
}
```

`r` is the DUT output $R$, `xh` and `xl` are the two halves of the exact value the reference model wrote into `test.input`, and the returned bool is the one-bit error flag feeding the counter. All of it is combinational — a $w$-bit equality against `xh`, an incrementer plus a second $w$-bit equality, and a $g$-input OR reduction for `inexact`; `trunc` is what keeps `xh + 1` at $W$ bits rather than growing to $W+1$, and the explicit `xh != top` guard is what stops that truncation from wrapping the acceptance set around zero. Synthesis will not build two independent comparators: both compare against `r`, so the tool shares the XOR bank and only the OR trees differ, and on an FPGA the whole test folds into roughly $w/2$ LUT6 plus the carry chain of the incrementer.

Verified by simulation: 6012 vectors, comprising 12 named cases (exact/inexact, the asymmetric pairs $R=1$ against $X_h=128$ and $R=128$ against $X_h=1$, and the top-of-format wrap) and two 3000-vector random sweeps against a behavioural reference — one uniform, one skewed so that $R$ lands within $\{X_h, X_h{+}1, X_h{+}2\}$, which is the same "aim the randomness at the hard path" trick the note is about. Zero mismatches.

> [!warning] Not covered in the source — needs outside research
> The appendix gives no guidance on choosing the number of random vectors $n$, no coverage metric of any kind (functional, toggle, or branch), and no data on how many real bugs the skewed generator has caught versus a uniform one. It also does not say how the reference model is derived for operators whose specification is itself an approximation with a tolerance, rather than a rounding of an exactly defined function. Those are pointers to the FloPoCo developer manual, not to this book.

**Related notes.**

- [[FloPoCo]] – depends-on: the generator this bench ships with, and the source of the two-part functional/performance specification that parameterizes both.
- [[Error Accuracy]] – depends-on: the ulp-level accuracy contract that the acceptance set is a direct transcription of.
- [[Rounding]] – depends-on: fixes whether the acceptance set has one element or two, and the tie rule the reference model must reproduce.
- [[Floating-Point Operators]] – supports: the class of operators where a uniform random tester has near-zero coverage of the hard path, motivating the skewed generator.
- [[Pipelined Floating-Point Adder]] – supports: the book's own example, whose subtractive-cancellation path is what the skew is aimed at.
- [[Pipeline Synchronization Delay Line]] – supports: the bench is the automatic check that these delay lines were inserted on every path, which is the one thing pipelining is guaranteed to get right.
- [[Frequency-Directed Pipelining]] – compares: chooses *when* signals arrive and is allowed an approximate model precisely because the bench independently fixes *what* they carry.
- [[Register Sandwich]] – compares: the same command-line idiom, appended to wrap the preceding operator, but measuring timing where this one measures correctness.
- [[Shared Bit Heap]] – depends-on: merging several roundings into one compression changes the error expression, and only a specification-derived oracle can confirm the merged result is still within the promised ulp.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- A.2.2 More on Parameters, pp. 763–764 (invalid parameter combinations, nonworking VHDL)
- A.2.3 Do Not Trust FloPoCo, the Test Bench Is Included, pp. 764–766; "Hands on: Test bench generation in FloPoCo" and "Hands on: Operation-specific test bench generation", p. 765
- A.2.5 Automatic Pipelining, the User Point of View, p. 768 (`TestBench` adapts to pipelined operators; synchronization is guaranteed, frequency is not)
- Sect. 1.3, p. 7 (operator as a mathematical function composed with a rounding)
- Sect. 11.1, p. 331 (cancellation requires exponents differing by at most 1)
