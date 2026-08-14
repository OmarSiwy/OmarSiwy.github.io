---
title: "CLA, Carry-Lookahead Adder"
description: "Unroll the carry recurrence into two levels of logic — AND rank into a wide OR — then cap the group at m=4 because fan-in, not depth, is what actually costs."
kind: circuit
source: "ASA §5.3.4, p. 117"
status: seed
spade: simulated
tags: [digital, adders, carry, lookahead]
aliases:
  - "Carry-Lookahead Adder"
  - "Carry-Lookahead Adders"
  - "Carry Lookahead Adder"
  - "Carry-Lookahead"
  - "CLA"
  - "CLA-4"
---

# CLA, Carry-Lookahead Adder

The carry-lookahead adder unrolls the carry recurrence into an explicit sum-of-products, so every carry is two gate levels from the inputs — and it is the architecture whose asymptotics are destroyed not by depth but by gate fan-in.

```tikz title="16-bit carry-lookahead adder: four CLA-4 groups chained"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize]
  \foreach \i/\hi/\lo in {0/3/0, 1/7/4, 2/11/8, 3/15/12} {
    \pgfmathsetmacro\X{-3.7*\i}
    \node[draw,fill=gray!8,minimum width=1.9cm,minimum height=0.85cm] at (\X,0) {CLA-4};
    \draw[->] (\X-0.5,1.25) -- (\X-0.5,0.43);
    \node at (\X-0.5,1.47) {$g_{\hi:\lo}$};
    \draw[->] (\X+0.5,1.25) -- (\X+0.5,0.43);
    \node at (\X+0.5,1.47) {$p_{\hi:\lo}$};
    \draw[->] (\X,-0.43) -- (\X,-1.45);
    \node[anchor=west] at (\X+0.1,-0.95) {$c_{\hi:\lo}$};
    \node[anchor=east] at (\X-0.12,-0.95) {$4$};
    \draw (\X-0.16,-1.05) -- (\X+0.16,-0.85);
  }
  \foreach \i/\c in {0/4, 1/8, 2/12} {
    \pgfmathsetmacro\X{-3.7*\i}
    \draw[very thick,->] (\X-0.95,0) -- (\X-2.75,0) node[midway,above] {$c_{\c}$};
  }
  \draw[->] (1.95,0) -- (0.95,0);
  \node[anchor=west] at (2.05,0) {$c_\text{in}=c_0$};
  \draw[very thick,->] (-12.05,0) -- (-13.15,0);
  \node[anchor=east] at (-13.25,0) {$c_\text{out}=c_{16}$};

  \node[draw,fill=gray!4,minimum width=12.6cm,minimum height=0.62cm]
        at (-5.55,-1.78) {$s_i=p_i\oplus c_i$ \; -- \; $16$ XOR gates, all in parallel};
  \draw[->] (-5.55,-2.09) -- (-5.55,-2.75) node[anchor=north] {$S_{15:0}$};
  \node[anchor=west] at (-5.45,-2.45) {$16$};

  \node[align=center] at (-5.55,2.35)
    {$X,Y$ : $16$ bits each \quad|\quad $g_i=x_iy_i$, $p_i=x_i\oplus y_i$ : $16$ bits each, one gate delay\\
     inside a CLA-4 : depth $2$ (AND rank $\to$ wide OR), max fan-in $m+1=5$};
  \draw[<->,thick] (-13.15,-3.35) -- (1.95,-3.35)
    node[midway,below] {critical path: $\lceil w/m\rceil=4$ CLA-4 blocks in series -- linear in $w$, constant $\tau_\text{cla}(4)$ per block};
\end{circuitikz}
\end{document}
```

*after Fig. 5.14, p. 117.* The book's figure draws only the carry-generation network; the XOR row is (5.11) and is drawn here to make the adder complete.

**Start from the propagate form of the recurrence, and note that it is not the obvious one.** Every fast adder begins at $c_{i+1}=g_i\vee a_ic_i$ (5.13), with $g_i=x_iy_i$ and the *alive* signal $a_i=x_i\vee y_i$, both $1$ bit wide and both available one gate delay after the inputs. Lookahead uses the *propagate* variant instead (Eq. 5.18, p. 117):

$$c_{i+1}=g_i\vee p_ic_i,\qquad p_i=x_i\oplus y_i$$

The two are the same function, and it is worth seeing why before substituting either one $w$ times. Since $a_i=p_i\vee g_i$ — the alive case is exactly "propagate or generate" — expanding by **distributivity of AND over OR** gives $g_i\vee(p_i\vee g_i)c_i=g_i\vee p_ic_i\vee g_ic_i$, and $g_i\vee g_ic_i=g_i$ **by absorption** ([[Boolean Algebra]]), leaving $g_i\vee p_ic_i$. The $p_i$ form is preferred here because $p_i$ is already needed for the sum $s_i=p_i\oplus c_i$ (5.11), so the AND rank below reuses a wire that exists anyway.

**Unroll the recurrence instead of iterating it.** The [[RCA, Ripple-Carry Adder|ripple-carry adder]] *evaluates* the recurrence, one substitution per clock of gate delay. Lookahead *substitutes symbolically* before building anything: replace $c_i$ in (5.18) by its own definition, repeatedly, and flatten with distributivity at every step (Eqs. 5.19–5.23, p. 117):

$$
\begin{aligned}
c_1&=g_0\vee p_0c_0\\
c_2&=g_1\vee p_1c_1=g_1\vee p_1g_0\vee p_1p_0c_0\\
c_3&=g_2\vee p_2c_2=g_2\vee p_2g_1\vee p_2p_1g_0\vee p_2p_1p_0c_0\\
c_4&=g_3\vee p_3c_3=g_3\vee p_3g_2\vee p_3p_2g_1\vee p_3p_2p_1g_0\vee p_3p_2p_1p_0c_0
\end{aligned}
$$

$$c_k=g_{k-1}\vee p_{k-1}g_{k-2}\vee p_{k-1}p_{k-2}g_{k-3}\vee\cdots\vee p_{k-1}p_{k-2}\cdots p_0c_0 \tag{5.23}$$

Read (5.23) as a statement about *where the carry was born*: term $j$ says "bit $j$ generated a carry and every bit above it up to $k-1$ propagated it", and the last term says "no bit generated, $c_0$ walked the whole way". The terms are pairwise disjoint — at most one can be true — which is why the $\vee$ could equally be an XOR or a sum, and why no term needs a $k_i$ (kill) literal.

**Every carry is now depth two, and every carry is independent.** (5.23) is a sum of products, so its circuit is one rank of AND gates feeding one OR gate: **depth $2$ for every $k$, independent of $k$** ([[Combinational Logic]]). Nothing is chained, so all $w$ carries are computed at once, and (5.11) turns them into sums with one further XOR level. On a unit-delay gate model that is a *constant-time* $w$-bit adder — three levels total, whatever $w$ is.

> [!important] The constant depth is an accounting trick, and fan-in is where it is hidden
> A unit-delay model prices a $32$-input AND the same as a $2$-input one. Silicon does not: a CMOS gate stacks one series transistor per input, so beyond roughly $4$ inputs the gate is slower, weaker and must be decomposed into a tree of $\Theta(\log k)$ levels — at which point the depth is back. Area is worse than the depth: by direct count off (5.23), $c_k$ has $k+1$ product terms whose literal counts are $1,2,\ldots,k+1$, i.e. $\binom{k+2}{2}=\Theta(k^2)$ AND inputs for one carry, hence $\Theta(w^2)$ product terms and $\Theta(w^3)$ gate inputs for all $w$ carries if nothing is shared. The book's phrasing is that fan-in "will introduce more levels of logic as well as a high area complexity" (p. 117); the exponents are what that sentence costs you.

**Cap the group, chain the groups.** The fix is not to fix (5.23) but to stop applying it past a width where it is honest. Restrict lookahead to $m$-bit groups — the book uses $m=4$ (Fig. 5.14, p. 117) — so a CLA-$m$ block takes $g_{j+m-1:j}$, $p_{j+m-1:j}$ ($m$ bits each) plus a $1$-bit carry-in, and emits the $m$ internal carries plus $c_{j+m}$ using exactly (5.19)–(5.22). Max fan-in is $m+1=5$, the total is $2+3+4+5=14$ product terms per block, and every block is genuinely two levels. Then chain $\lceil w/m\rceil$ blocks carry-out to carry-in:

$$\tau_\text{add}(w)\approx\Big\lceil\tfrac{w}{m}\Big\rceil\,\tau_\text{cla}(m)$$

with $\tau_\text{cla}(m)$ the block's carry-in-to-carry-out delay, two gate delays. **Linear in $w$ again** — the asymptotics of the [[RCA, Ripple-Carry Adder|RCA]] — but with the constant divided by roughly $m/2$: $16$ bits cost $4$ block delays instead of $16$ cell delays. That is the whole trade, and the book states it plainly: "the delay still grows linearly with the word size of the adder, but with a smaller factor" (p. 117). $m$ is the tuning knob, and it is set by the fan-in your standard-cell library is actually fast at, not by any property of the arithmetic.

**One group is a $\text{ufix}$ adder unchanged.** $g_i$ and $p_i$ depend only on $x_i,y_i$, so nothing in this note knows the operands' scale: two operands in the same format add with the scale factored out, and different formats are aligned by wiring before the adder ([[Number Formats]]). The block emits $w$ sum bits plus $c_\text{out}=s_w$, exactly $w+1$ bits, so the CLA is exact and introduces no error of its own ([[Error Accuracy]]).

**The recursion you are one step away from.** A CLA-$m$ block already computes the products $p_{j+m-1}\cdots p_j$ and the OR of the generate terms internally, so it can emit the *group* signals $g_{i:j},p_{i:j}$ at no extra gate cost, and then the same equations apply one level up with groups as digits — see [[Hierarchical Carry-Lookahead Adder]]. Take that observation to its limit and the AND-OR pair becomes an associative operator, at which point CLA is one bracketing among many and the design space opens: [[Parallel Prefix Adders]].

$$\boxed{\ c_k=\bigvee_{j=0}^{k-1}\Big(g_j\!\!\prod_{i=j+1}^{k-1}\!\!p_i\Big)\ \vee\ c_0\!\!\prod_{i=0}^{k-1}\!\!p_i,\qquad \tau_\text{add}(w)\approx\Big\lceil\tfrac{w}{m}\Big\rceil\tau_\text{cla}(m)\ }$$

**When it breaks.**

- **Ungrouped lookahead past $m\approx4$.** The two-level claim assumes unbounded fan-in. Past four or five series transistors the gate is decomposed and you have paid $\Theta(w^3)$ gate inputs for a depth you did not keep.
- **On FPGAs, at essentially any width.** The natural group size is set by LUT inputs, not by transistor stacking: $c_k$ depends on $2k+1$ signals, so a $K$-input LUT absorbs a carry only while $2k+1\le K$ — a $6$-LUT reaches $k=2$, never a CLA-4. Meanwhile the hard carry chain propagates a carry in a small fraction of a LUT delay, so the [[FPGA Hard Carry Chain Adder]] wins on both counts up to and past $32$ bits.
- **When you need $O(\log w)$, not a smaller constant.** Chained CLA-$m$ is still linear. A [[Conditional-Sum Adder]] or a [[Kogge-Stone Tree]] is what actually breaks the linearity; CLA's value is that it is cheap and local.
- **Fan-out on $c_0$ and on the group propagates.** Within a group, $c_0$ drives $m$ AND terms and the $p_i$ drive up to $m-j$ each. It is far milder than the [[Conditional-Sum Adder|conditional-sum]] adder's $w/2$-wide mux load (p. 116), but it is not free, and it is why $m$ is capped by drive strength as well as by stacking.
- **Below about $8$ bits.** The block overhead buys nothing an [[RCA, Ripple-Carry Adder|RCA]] does not already give you at lower area.

**RTL (Spade).**

```spade
/// One CLA-4 group: the unrolled carry equations (5.19)-(5.22).
/// Returns the four carries entering the group's bits, plus the group carry-out.
fn cla4(g: [bool; 4], p: [bool; 4], c0: bool) -> ([bool; 4], bool) {
    let c1 = g[0] || (p[0] && c0);
    let c2 = g[1] || (p[1] && g[0]) || (p[1] && p[0] && c0);
    let c3 = g[2] || (p[2] && g[1]) || (p[2] && p[1] && g[0])
                  || (p[2] && p[1] && p[0] && c0);
    let c4 = g[3] || (p[3] && g[2]) || (p[3] && p[2] && g[1])
                  || (p[3] && p[2] && p[1] && g[0])
                  || (p[3] && p[2] && p[1] && p[0] && c0);
    ([c0, c1, c2, c3], c4)
}

/// 16-bit adder: four CLA-4 groups chained, then one XOR per bit.
fn cla16_add(x: uint<16>, y: uint<16>, cin: bool) -> uint<17> {
    let p = x ^ y;
    let gg = (x & y).as_bits().chunks::<4>();
    let pp = p.as_bits().chunks::<4>();
    let (k0, c4)   = cla4(gg[0], pp[0], cin);
    let (k1, c8)   = cla4(gg[1], pp[1], c4);
    let (k2, c12)  = cla4(gg[2], pp[2], c8);
    let (k3, cout) = cla4(gg[3], pp[3], c12);
    let c = k0.concat(k1).concat(k2).concat(k3).as_uint();
    cout.as_uint().concat(p ^ c)
}
```

`cla4` is one box in the drawing and the four `||` chains are its four wide ORs; `c4`, `c8`, `c12` are the thick horizontal wires. The $16$-bit $g$ and $p$ vectors are computed as whole words (`x & y`, `x ^ y`) because they are bitwise and share no logic, then split into groups with `chunks::<4>()`; array element $0$ is the LSB, so `gg[0]` is $g_{3:0}$. `k0..k3` are the carries *into* each bit, so the sum is one word-wide XOR `p ^ c` and the result is `cout` concatenated on top — integer `concat` puts its first argument high, giving $17$ bits with no `zext`. Everything is `fn`, so the whole thing is combinational, no clock. Synthesis will not preserve the grouping: an ASIC tool re-factors these expressions against its own gate library, and an FPGA tool throws the structure away entirely for the hard carry chain — treat the code as a statement of *which carry depends on what*, not a netlist.

**Related Notes (with context).**

- [[Boolean Algebra]] – depends-on: absorption and distributivity are the only two laws the unrolling uses.
- [[Combinational Logic]] – depends-on: the sum-of-products-is-depth-two argument, and the fan-in caveat that undoes it.
- [[RCA, Ripple-Carry Adder]] – compares: evaluates the same recurrence instead of unrolling it; CLA beats its constant, not its exponent.
- [[Full Adder]] – depends-on: $g_i$, $p_i$ and $s_i=p_i\oplus c_i$ are the FA split into an input-only part and a carry-dependent part.
- [[Hierarchical Carry-Lookahead Adder]] – extends: emit the group $g_{i:j},p_{i:j}$ for free and apply the same equations to groups, giving $\log_m w$ levels.
- [[Parallel Prefix Adders]] – extends: once the group signals compose, the AND-OR pair is an associative operator and CLA is one bracketing of the prefix reduction.
- [[Carry-Select Adder]] – compares: same "cap the group at $m$, chain the groups" plan, paying with a duplicated CPA instead of with fan-in.
- [[Conditional-Sum Adder]] – compares: genuinely $O(\log w)$, at a fan-out on the mid-word carry that CLA never incurs.
- [[FPGA Hard Carry Chain Adder]] – counter-example: on FPGAs the lookahead network cannot be folded into LUTs and the linear chain is faster anyway.
- [[Choosing an Adder]] – compares: where CLA-$m$ sits against every sibling, by width and target.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.3.4 Carry-Lookahead Adder, p. 117 — Eqs. 5.18–5.23, **Fig. 5.14** (16-bit adder with CLA-4 groups), the fan-in and area-complexity remark, and the linear-delay-with-smaller-factor verdict.
- §5.3.3 Recursive carry-select, p. 116 — the fan-out problem CLA does *not* have.
- §5.3.5 Recursive Carry-Lookahead Adder, p. 118 — Eqs. 5.24–5.27, the group $g_{i:j},p_{i:j}$ hand-off.
- §5.2.1–5.2.2, pp. 107–108 — Eqs. 5.11, 5.13 for $g_i$, $a_i$, $p_i$ and the sum row.
