---
title: Boolean Algebra
description: "Map of the 7 Boolean Algebra notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, boolean-algebra, hub]
aliases:
  - Boolean Algebra
  - "0.1) Boolean Algebra"
  - "De Morgan's Laws"
  - "Quine-McCluskey"
---

# Boolean Algebra

Every other note in this vault eventually writes "by distributivity" or "by De Morgan" and moves on. This is where those steps point back to, and where the two numbers the rest of the vault trades in — **literal count** and **logic depth** — get their definitions.

**The specification every note below answers to.** Input: an $n$-bit vector $x\in\{0,1\}^n$ — no format, no scaling, a bit is just a bit; weighting bits into numbers is [[Number Formats]]. Output: $m$ bits, each an independent $f_j:\{0,1\}^n\to\{0,1\}$, specified by its truth table, all $2^n$ rows, exhaustively. Accuracy: **exact, $0$ ulp, always** — this is the one layer of the stack with no error budget, since approximation cannot enter before bits have weights ([[Error Accuracy]]). Optimised for: area, proxied by **literal count** $L$, and delay, proxied by **logic depth** $D$ — which pull in opposite directions, and that tension is the entire subject. Every note below is a different point on that curve for the *same* function.

### Start here

- [[Choosing a Logic Realization]] – the trade-off table: all six realizations costed in $L$, gates and $D$ on the same three functions, plus the fan-in-2 column that exposes which "depth 2" claims are honest. Read it before any individual note; none of them repeats it.

### Two levels — minimum depth, unbounded fan-in

- [[Two-Level SOP Network]] – the default. Read it for why $D=2$ is available for *every* function and what that costs; every other structure in this topic is measured against it.
- [[Two-Level POS Network]] – the dual. Read it when your function has far fewer zeros than ones, or when you need the algebra to come out of the *other* side of duality.

### The same two levels, one gate type

- [[NAND-NAND Network]] – read it once and then use it always on static CMOS: the transform is free and it deletes an inverter per gate.
- [[NOR-NOR Network]] – read it to see why the exact dual of a free transform is *not* free once the PMOS stack is series rather than parallel. Algebra and silicon disagree here.

### More than two levels

- [[Multi-Level Factored Network]] – read it when literal count dominates, or when several outputs share a subexpression. This is the only note in the topic whose cost is measured across all outputs at once.
- [[Shannon Expansion Multiplexer]] – read it for the bridge out of two-level thinking entirely: the recursion that is a mux tree on an ASIC, a LUT on an FPGA, and a BDD in a synthesis tool.

### Getting a cover in the first place

- [[Karnaugh Map]] – read it for where minimal covers come from, and for the Quine–McCluskey tabulation and prime-implicant chart that mechanise it. It produces the input the two-level notes consume.

### Not separate notes — they live here

**Huntington's postulates and duality.** Boolean algebra is $(B,+,\cdot,\bar{\ },0,1)$ with closure, identity ($a+0=a$), commutativity, distributivity ($a(b+c)=ab+ac$), complement ($a+\bar a=1$) and $|B|\ge 2$. Switching algebra is the instance $B=\{0,1\}$. Note what is *not* an axiom: associativity, idempotence, absorption and De Morgan are all theorems. Every postulate comes in a pair related by swapping $+\leftrightarrow\cdot$ and $0\leftrightarrow 1$, so the axiom set is closed under that swap and **any theorem derived from it stays true under the same swap** — prove one form, get the other free. Duality is not complementation: $f^D$ swaps operators and leaves literals alone, $\bar f$ swaps operators *and* complements every literal, with $f^D(x)=\overline{f(\bar x)}$.

**Absorption** — $a+ab=a$ and $a+\bar ab=a+b$ — is the algebraic content of adjacency: $ab+a\bar b=a(b+\bar b)=a$ drops a literal. **Associativity** is the structurally important one, because it is what turns a chain of $n$ operations at depth $n$ into a balanced tree at depth $\lceil\log_2 n\rceil$; every parallel-prefix carry tree in [[Adders]] is associativity applied to one operator.

**Consensus.** $ab+\bar ac+bc=ab+\bar ac$: the consensus term $bc$ is logically redundant, provable by writing $bc=bc(a+\bar a)$ and absorbing. It is redundant but **hazard-suppressing** — with $b=c=1$ and $a$ falling, $ab$ turns off before $\bar ac$ turns on and the output glitches low for one gate delay. Two-level minimization deletes exactly the terms a hazard-free implementation needs, which is why [[Asynchronous Sequential Logic]] minimizes *less* than synchronous logic does.

**De Morgan.** $\overline{a+b}=\bar a\bar b$, $\overline{ab}=\bar a+\bar b$, and for whole functions $\overline{f(x_i,+,\cdot)}=f(\bar x_i,\cdot,+)$. This is the law behind both single-gate-type networks above, and behind the two's-complement identity $-x=\bar x+1$ used throughout [[Number Formats]]: bitwise, $\bar x_i = 1-x_i$, so $\sum_i 2^i\bar x_i=(2^n-1)-x$.

**Canonical forms.** A minterm $m_k$ is a product of all $n$ variables, true at exactly one assignment; a maxterm is its complement. Every function has exactly one canonical SOP $\sum_{f(k)=1} m_k$ and one canonical POS $\prod_{f(k)=0} M_k$. These are unique — which is what *canonical* means, and why they are a normal form for equivalence checking and a terrible netlist: $t$ ones cost $t\cdot n$ literals. There are $2^{2^n}$ functions of $n$ variables ($65\,536$ at $n=4$, about $1.8\times10^{19}$ at $n=6$), so exhaustive anything dies around $n=5$.

**Functional completeness.** $\{\text{AND},\text{OR},\text{NOT}\}$ is complete by construction, since the canonical SOP uses nothing else. NAND alone is complete — $\bar a=a\uparrow a$, $ab=(a\uparrow b)\uparrow(a\uparrow b)$, $a+b=(a\uparrow a)\uparrow(b\uparrow b)$ — and NOR alone by duality. Among the sixteen binary functions these are the *only* two single-operator complete sets, which is why exactly two single-gate-type network notes exist above and not more.

**Literal count and logic depth.** $L$ counts variable instances, complements separately: $ab+\bar ac$ has $L=4$. It proxies area because a static CMOS complex gate spends one NMOS and one PMOS per literal — $2L$ transistors — plus inverters for complemented literals; gate count is the cruder alternative because it ignores fan-in. $D$ counts gates on the longest input-to-output path, and it is only honest under a fan-in bound: a two-level SOP is $D=2$ by definition, but a 64-input OR does not cost two gate delays. Under fan-in $k$, a $p$-product SOP really costs $D=\lceil\log_k p\rceil+\lceil\log_k n\rceil$ and the "two-level" claim quietly becomes logarithmic.

> [!important] $L$ and $D$ are different minimization problems
> Two-level minimization minimizes product count then literals, at fixed depth $2$. Multi-level synthesis minimizes literals across a network of arbitrary depth. They disagree by orders of magnitude: 4-input parity needs $32$ literals as a minimal SOP and $6$ as an XOR tree. Never quote a two-level minimal form as "the" minimum without saying which cost you minimized.

**On an FPGA, both metrics are the wrong ones.** A $k$-input LUT implements *any* function of $k$ variables at one LUT and one level, so literal count and product count are invisible to it. What matters is the **support size** of each logic cone. A minimal SOP with $30$ literals over $4$ variables and the canonical SOP with $64$ literals over the same $4$ variables map to the identical single 4-LUT. The real problem is decomposition into $\le k$-support pieces, not minimization — which is why running Quine–McCluskey ahead of FPGA synthesis is wasted effort. Details in [[FPGAs]].

### Where this sits

Upstream: nothing — this is the bottom of [[Digital Design]], the layer with no error budget. Downstream, [[Combinational Logic]] takes these networks and adds what physical gates do that algebra does not: fan-in limits, CMOS gate structure, static hazards, and the named blocks (multiplexers, decoders) that recur as datapath primitives. [[FPGAs]] replaces both cost metrics with support size. [[Number Formats]] is where bits first acquire weights, and from there every arithmetic topic — starting with the full adder in [[Adders]] — is a Boolean function large enough that none of the methods here scales to it.

## References

No book source; this topic sits below de Dinechin & Kumm, which starts at number formats. Cross-checked against the standard references:

- Huntington's postulates and duality — Mano & Ciletti, *Digital Design*, ch. 2.
- Prime implicants, don't-cares, Quine–McCluskey and prime-implicant charts — Mano & Ciletti ch. 3; Wakerly, *Digital Design: Principles and Practices*, ch. 4. Prime-implicant growth $\Theta(3^n/n)$: Chandra & Markowsky, *Discrete Mathematics* 24(1), 1978.
- Literal count as a transistor proxy, NAND versus NOR in static CMOS, depth and logic effort — Weste & Harris, *CMOS VLSI Design*, ch. 1 and 4.
- Espresso-style heuristic two-level minimization — Brayton et al., *Logic Minimization Algorithms for VLSI Synthesis*, 1984.
- Every literal, gate and depth count quoted here or in [[Choosing a Logic Realization]] was computed from the truth tables, not quoted from a source.
