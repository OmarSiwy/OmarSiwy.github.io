---
title: "ATA, Addition-Table-Addition"
description: "Adds before the lookup as well as after: two reads of one table give f(A) and f(A+B), and their scaled forward difference replaces the derivative table entirely."
kind: circuit
source: "ASA §17.3.1, pp. 523-526"
status: seed
spade: simulated
tags: [digital, table-based-function-evaluation, function-evaluation, rom, fpga]
aliases:
  - ATA
  - Addition-Table-Addition
  - Addition-Table-Addition Methods
  - First-Order ATA
  - Forward-Difference ATA
---

# ATA, Addition-Table-Addition

Wong and Goto's family puts an adder *in front of* the table as well as behind it, so that a second read of the same table at $A+B$ supplies the derivative every other order-one method has to tabulate separately.

```tikz title="First-order ATA: the chord through the two table entries, sampled close to its left end, and the datapath that computes it"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ================= (a) geometry: the chord over [A, A+B] read at X =============
\begin{scope}
% grid of table addresses (step 2^-alpha) and of input codes (step 2^-wX)
\foreach \x in {0,2,4,6,8} \draw[red!70,thick] (\x,-0.2) -- (\x,6.2);
\foreach \x in {0,0.5,...,8} \draw[gray] (\x,-0.2) -- (\x,0);
\draw[->,gray] (-0.3,0) -- (8.6,0) node[right,font=\tiny]{$X$};
% the function
\draw[blue,thick,smooth,samples=100,domain=0:8] plot (\x,{6*sin(12*\x)});
\node[blue,font=\tiny] at (7.6,5.9) {$f$};
% chord through the two table entries
\draw[red,dashed,thick] (2,2.441) -- (6.6,6.10);
\draw[gray,densely dotted] (2,2.441) -- (6,2.441);
% the two lookups
\fill[green!50!black] (2,2.441) circle (0.08);
\fill[green!50!black] (6,5.706) circle (0.08);
\node[green!50!black,font=\tiny,anchor=east] at (1.85,2.55) {$f(A)$};
\node[green!50!black,font=\tiny,anchor=west] at (6.15,5.60) {$f(A{+}B)$};
% the difference
\draw[<->,green!50!black] (6.0,2.441) -- (6.0,5.706);
\node[green!50!black,font=\tiny,anchor=west] at (6.08,4.05) {$f(A{+}B)-f(A)$};
% the result and the true value
\fill[blue] (3,3.526) circle (0.08);
\fill[red] (3,3.257) circle (0.08);
\node[blue,font=\tiny,anchor=south east] at (2.95,3.62) {$f(X)$};
\node[red,font=\tiny,anchor=north west] at (3.06,3.13) {$R$};
\draw[<->,thick] (3.62,3.30) -- (3.62,3.62);
\node[font=\tiny,anchor=west] at (3.72,3.46) {$\delta\approx\tfrac12 2^{-\beta}B^{2}f''$};
\draw[gray,densely dotted] (3,3.257) -- (3.7,3.30);
\draw[gray,densely dotted] (3,3.526) -- (3.7,3.62);
% x-axis annotations
\draw[<->,gray] (2,-0.55) -- node[below,font=\tiny]{$2^{-\beta}B$} (3,-0.55);
\draw[<->,gray] (2,-1.15) -- node[below,font=\tiny]{$B=t\,2^{-\alpha}$ (here $t=2$)} (6,-1.15);
\draw[<->,gray] (0,-1.75) -- node[below,font=\tiny]{$A$} (2,-1.75);
\node[font=\tiny,anchor=west] at (0.1,-2.35)
  {red lines $=$ table addresses, step $2^{-\alpha}$ \ \ $\vert$ \ \ ticks $=$ input codes};
\end{scope}
% ================= (b) datapath ===============================================
\begin{scope}[xshift=11.2cm,yshift=-2.3cm]
% input word
\draw[thick] (0,6.6) rectangle (5,7.1);
\draw[very thick] (3.4,6.6) -- (3.4,7.1);
\node[font=\small,anchor=east] at (-0.15,6.85) {$X$};
\node[font=\tiny] at (1.7,7.35) {$A$ ($\alpha=4$)};
\node[font=\tiny] at (4.2,7.35) {$B$ ($\beta=2$)};
% alpha-bit adder
\node[draw,thick,minimum width=1.9cm,minimum height=0.55cm] (add1) at (3.6,5.3) {$+$};
\draw[->] (1.2,6.6) -- (1.2,3.3);
\node[font=\tiny,anchor=east] at (1.15,4.4) {$A$, $\alpha$};
\draw[->] (2.9,6.6) -- (2.9,5.6);
\draw[->] (4.3,6.6) -- (4.3,5.6);
\node[font=\tiny,anchor=west] at (4.38,6.1) {$B$ aligned on $A$'s LSB};
\draw[->] (3.6,5.0) -- (3.6,3.3);
\node[font=\tiny,anchor=west] at (3.68,4.4) {$A{+}B$, $\alpha{+}1$};
% dual-port table
\node[draw,thick,minimum width=5.2cm,minimum height=1.15cm,align=center] (tab) at (2.4,2.7)
  {table $T$, dual-port\\[-3pt]{\tiny $2^{\alpha}{+}2^{\beta}{-}1=19$ words of $w_R{+}g=7$ bits}};
\draw[->] (1.2,2.1) -- (1.2,1.3);
\node[font=\tiny,anchor=east] at (1.15,1.7) {$f(A)$, 7};
\draw[->] (3.6,2.1) -- (3.6,1.3);
\node[font=\tiny,anchor=west] at (3.68,1.7) {$f(A{+}B)$, 7};
% subtracter
\node[draw,thick,minimum width=3.4cm,minimum height=0.55cm] (sub) at (2.4,1.0) {$-$};
\draw[->] (2.4,0.7) -- (2.4,0.1);
\node[font=\tiny,anchor=west] at (2.48,0.4) {$d$, signed, $w_R{+}g{+}1=8$};
% shift (wiring only)
\node[draw,thick,dashed,minimum width=2.4cm,minimum height=0.55cm] (sh) at (2.4,-0.2) {$\gg\beta$: wiring only};
\draw[->] (2.4,-0.5) -- (2.4,-1.1);
% final adder
\node[draw,thick,minimum width=4.4cm,minimum height=0.55cm] (add2) at (1.6,-1.4) {$+$};
\draw[->] (1.2,1.3) -- (0.3,1.3) -- (0.3,-1.1);
\draw[->] (1.6,-1.7) -- (1.6,-2.4);
\node[font=\tiny,anchor=west] at (1.68,-2.05) {$S$, $w_R{+}g$};
\node[draw,thick,minimum width=2.0cm,minimum height=0.55cm] (tr) at (1.6,-2.7) {truncate};
\draw[->] (1.6,-3.0) -- (1.6,-3.7) node[below,font=\small]{$R(X)$};
\node[font=\tiny,anchor=west] at (1.68,-3.35) {$w_R=6$};
\end{scope}
\node[font=\small] at (4.0,-3.1) {(a)};
\node[font=\small] at (12.8,-6.6) {(b)};
\end{circuitikz}
\end{document}
```

*(a) after Fig. 17.16, p. 524; (b) drawn here from the operation list on p. 524*

**Re-align the tail instead of splitting off a slope index.** Take the input $X$ on $w_X$ bits, $\ell_X=-w_X$ ([[Number Formats]]), and cut it as the multipartite methods do: $A$ is the leading $\alpha$ bits, an address on the grid $2^{-\alpha}\mathbb{Z}$, and $t$ is the trailing $\beta=w_X-\alpha$ bits read as an integer. ATA then *re-weights* that tail, defining $B=2^{-\alpha}t$ — the same bit pattern, moved up so its LSB sits on $A$'s LSB — so that

$$X = A + 2^{-\beta}B,\qquad B\in 2^{-\alpha}\mathbb{Z}\cap[0,2^{\beta-\alpha}),\qquad \alpha>\beta$$

which is the book's decomposition (p. 523). The point of the re-weighting is that $A+B$ is *still an address*: it is a multiple of $2^{-\alpha}$, so one table answers both queries. In hardware $A+B$ is the $\alpha$-bit sum of the head and the zero-extended tail, $\alpha+1$ bits with the carry out.

**Replace the derivative with a forward difference on the table itself.** Start from the first-order Taylor expansion at $A$ with the remainder in Lagrange form,

$$f(A+2^{-\beta}B)=f(A)+2^{-\beta}B\,f'(A)+\tfrac12\left(2^{-\beta}B\right)^{2}f''(\xi),\qquad \xi\in(A,X)$$

and expand the *same* $f$ at the *same* point over the long step $B$ instead of the short one:

$$f(A+B)=f(A)+B\,f'(A)+\tfrac12 B^{2}f''(\eta) \quad\Longrightarrow\quad B\,f'(A)\approx f(A+B)-f(A)$$

Substituting the second line into the first eliminates $f'$ entirely, and every surviving $B$ carries a factor $2^{-\beta}$ — a constant shift, which is free wiring:

$$f(A+2^{-\beta}B)\;\approx\;f(A)+2^{-\beta}\left(f(A+B)-f(A)\right)$$

**Read it as a chord, not as a homothety.** The book describes this as approximating $f$ near $A$ by its own graph shrunk by $2^{\beta}$. The equivalent statement, and the one that makes the error obvious, is panel (a): the right-hand side is exactly the **secant through the two tabulated points** $(A,f(A))$ and $(A+B,f(A+B))$, evaluated at $X=A+2^{-\beta}B$. So this is linear interpolation on an interval of width $B$ — up to $2^{\beta}$ times longer than the distance from $A$ to the point we actually want — with one endpoint, $A$, exact. The error is chord-versus-curve near an interpolation node, and it inherits the $B^{2}$ of the long step, not the $2^{-2\beta}B^{2}$ of the short one.

**That $B^{2}$ is what sets $\alpha$.** Subtracting the two expansions, the $f'$ terms cancel and

$$\delta_{\text{approx}}=\tfrac12 B^{2}\left(2^{-2\beta}f''(\xi)-2^{-\beta}f''(\eta)\right)\;\approx\;-\tfrac12 2^{-\beta}B^{2}f''(\eta)$$

since $2^{-\beta}\gg2^{-2\beta}$. With $B<2^{\beta-\alpha}$ this gives $|\delta_{\text{approx}}|\lesssim 2^{\beta-2\alpha-1}\max|f''|$. Charge it the usual half-ulp share of the one-ulp faithfulness budget ([[Error Accuracy]]), $2^{\ell_R-1}=2^{-w_X-1}$, and use $\alpha+\beta=w_X$:

$$2^{\beta-2\alpha-1}\max|f''|\le 2^{-\alpha-\beta-1}\quad\Longleftrightarrow\quad 2\beta\le\alpha-\log_2\max|f''|$$

For $\max|f''|\le1$ that is just $\alpha\ge2\beta$, i.e. $\alpha\gtrsim\frac{2}{3}w_X$ — the *same* head width the [[Bipartite Table Method]] reaches by minimising $2^{\alpha}+2^{2(w_X-\alpha)}$, and comfortably above the $\alpha\gtrsim w_X/2$ floor Taylor's theorem imposes on every order-one scheme (p. 523). The book states only the weaker condition $\alpha>\beta$; the bound above is derived here and checked by exhaustive evaluation on $f=\sin(\pi x/4)$, whose $\max|f''|=(\pi/4)^{2}\sin(\pi/4)=0.436$ buys back $1.2$ bits. It calls the pass/fail of all twelve $(\alpha,\beta)$ splits with $w_X\in\{6,8,10\}$ correctly, including the two marginal ones.

**What you pay for deleting the offset table.** Per p. 524: one $\alpha$-bit addition ahead of the table, **two lookups in the same table**, one subtraction of two $(w_R+g)$-bit words (its result needs fewer than $\alpha$ bits and can be sized exactly), a constant shift by $\beta$, and one final $w_R$-bit addition. Three adders where bipartite needs one — but an $\alpha$-bit [[RCA, Ripple-Carry Adder]] in front of a table is cheap, and there is no table of offsets and no XOR row at all. The pre-adder sits on the *address* path, so it lengthens the critical path ahead of the table access instead of running beside it; that is the structural reason ATA cannot hide it.

**The second read is the real cost, and it is technology-dependent.** The two lookups can go in parallel through a dual-port table, in parallel through two copies of the table, or in sequence in a pipeline (p. 525) — a full spectrum from one read port and two cycles to two copies and one cycle. On an FPGA the first option is free when the table lives in [[Block Memory]]: true dual-port BRAM gives two independent read ports at no extra block cost, so ATA's table-bit count *is* its cost. Below the BRAM crossover, where the table is in [[Lookup-Tables|LUTs]], there is no such thing as a dual-port LUT-ROM — the second read means a second copy, and the bit count doubles in silicon. Same on an ASIC unless the ROM generator offers dual-port cells. That is where the method loses:

| $w_X=8$, $\sin(\pi x/4)$, faithful | parameters | table bits | reads | adders |
| --- | --- | --- | --- | --- |
| plain ROM | — | $2^{8}\times8=2048$ | 1 | 0 |
| bipartite | $\alpha=5,\ \beta=\gamma=3,\ g=1$ | $288+128=416$ | 2, different tables | 1 |
| first-order ATA | $\alpha=6,\ \beta=2,\ g=3$ | $67\times11=737$ | 2, **same** table | 3 |

Both non-trivial rows are computed here by exhaustive evaluation over all $2^{8}$ inputs; the bipartite row is the worked example in [[Table-Based Function Evaluation]]. ATA needs $\alpha=6$ because $\alpha\ge2\beta$ with $\alpha+\beta=8$ rounds up, where bipartite's search settles at $\alpha=5$ — and its single table is full width where bipartite's second table is 4 bits wide. One table is not automatically cheaper than two.

$$\boxed{\ f(A+2^{-\beta}B)\;\approx\;f(A)+2^{-\beta}\!\left(f(A{+}B)-f(A)\right),\qquad 2\beta\le\alpha-\log_2\max|f''|\ }$$

**When it breaks.**

- **$\alpha<2\beta$.** The error is quadratic in the *long* step, so it degrades fast rather than gracefully: at $w_X=6$, moving from $(\alpha,\beta)=(4,2)$ to $(3,3)$ takes the approximation error from $0.09$ ulp to $1.32$ ulp — faithfulness lost, not dented.
- **Addresses run past the domain.** The largest address is $(2^{\alpha}-1)+(2^{\beta}-1)$, so the table holds $2^{\alpha}+2^{\beta}-1$ words, not $2^{\alpha}$, and $f$ must be defined and tabulated on $[0,1+2^{\beta-\alpha})$. Cheap — $2^{\beta}-1$ extra words — but not free, and if $f$ has a singularity or an argument-reduction boundary at the top of the range you must extend the reduction or clamp. Clamping flattens the chord in the top segment, which breaks the very error bound above. The operation list on p. 524 does not mention this.
- **Sequenced reads.** Sharing one read port halves throughput; two copies double the table. Only a genuinely dual-ported memory delivers the bit count the method advertises.
- **Unbounded $f''$.** As for every order-one method the bound is worthless where $\max|f''|$ blows up; split the domain first ([[Fixed-Point Function Approximation]]).
- **Where siblings take over.** [[Central-Difference ATA]] spends a third read on the same table to make the error third-order, which relaxes $\alpha$; [[Multipartite Methods]] beats plain ATA outright in the book's own ranking (p. 526); and past roughly 24 bits $2^{\alpha}$ is unbearable again and you move to [[Polynomial Approximation]].

> [!warning] No cost figures for ATA in the chapter
> Sect. 17.3.1 gives the operation counts and the ranking — better than the original bipartite approaches, worse than generalised multipartite [DT05] — but no table-bit or LUT number for any ATA operator except the 24-bit STAM (6 tables of 12–13 input bits, 9 additions, p. 526). The comparison table above is computed here, not quoted.

**RTL.** $w_X=6$, $\alpha=4$, $\beta=2$, $w_R=6$, one guard bit $g=1$, $f=\sin(\pi x/4)$; the table holds $2^{4}+2^{2}-1=19$ useful words (padded to 20) of $w_R+g=7$ bits, filled by round-to-nearest at $2^{-7}$.

```spade
fn tab(k: uint<5>) -> uint<7> {
    let t: [uint<7>; 20] = [0, 6, 13, 19, 25, 31, 37, 43, 49, 55,
                            60, 66, 71, 76, 81, 86, 91, 95, 99, 103];
    t[k]
}

entity ata6(x: uint<6>) -> uint<6> {
    let b = x.as_bits();
    let a: uint<5> = zext(b[2..6].as_uint());     // A, alpha=4 bits, zero-extended for the add
    let t: uint<5> = zext(b[0..2].as_uint());     // B, beta=2 bits, aligned on A's LSB
    let f_a: int<8> = tab(a).to_int();            // f(A)
    let f_ab: int<8> = tab(a +. t).to_int();      // f(A+B), same table
    let d: int<9> = f_ab - f_a;                   // forward difference, signed
    let s: int<10> = sext::<8, 9>(f_a) + (d >>> 2);   // >>> beta is the free scaling
    trunc((s >>> 1).as_uint())                    // drop the guard bit
}
```

`a +. t` is the $\alpha$-bit pre-adder of panel (b); it truncates because the operands were already widened to 5 bits to hold the $\alpha+1$-bit sum. `tab` is read twice from one array — that is the dual-port table, and synthesis will not honour it as drawn: two combinational reads of a LUT-ROM infer two copies, and one physical block only comes from instantiating [[Block Memory]]. The difference is signed even though this $f$ is monotone, hence `to_int` (value-preserving, $N{+}1$ bits) and the arithmetic `>>>`; a logical shift corrupts every decreasing segment. Everything is combinational — the table reads are the only thing anyone would register.

Simulated with iverilog over **3068 vectors**: four named asymmetric splits (among them $A{=}9,B{=}1$ and $A{=}4,B{=}3$, which a swapped field order fails), all $2^{6}$ inputs exhaustively, and a 3000-vector random sweep, each checked against $64\sin(\pi X/4)$ in double precision. Worst error **0.991 ulp** — faithful, at $\alpha=2\beta$ exactly, with nothing to spare.

**Related Notes.**

- [[Central-Difference ATA]] – extends: a third read of the same table swaps the forward difference for a centred one and pushes the error to third order.
- [[Bipartite Table Method]] – compares: lands on the same $\alpha\gtrsim\frac23 w_X$, but spends it on a narrow second table instead of a second read of a wide one.
- [[STAM, Symmetric Table Addition Method]] – extends: Wong and Goto's actual architecture, which splits $B$ further and adds a correction table.
- [[Multipartite Methods]] – counter-example: generalised multipartite beats every ATA variant in the book's own ranking, so ATA survives mainly where a spare dual-port memory makes the second read free.
- [[Block Memory]] – depends-on: the whole cost argument turns on whether the two reads share one physical table.
- [[RCA, Ripple-Carry Adder]] – depends-on: the pre-adder sits on the address path, ahead of the table access rather than beside it.
- [[Polynomial Approximation]] – compares: order two moves the intrinsic bound from $\alpha\gtrsim w_X/2$ to $w_X/3$, which is where you go when $2^{\alpha}$ becomes unbearable.
- [[Choosing a Table Method]] – compares: where this sits against the rest of the family.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 17.

- Sect. 17.3.1 "Addition-Table-Addition Methods", pp. 523–526 — the decomposition $X=A+2^{-\beta}B$ with $\alpha>\beta$ and the first-order formula, p. 524; Fig. 17.16 and the five-operation cost list, p. 524; dual-port / duplicated / sequenced lookups, p. 525; ranking against bipartite and generalised multipartite [WG95], [DT05], p. 526
- Sect. 17.2.12 "Multipartite Architectures Are Close to Optimal Among Order-One Methods", p. 523 — the intrinsic $\alpha\gtrsim w_X/2$ bound
- Sect. 17.2.2, p. 506 — the bipartite $\alpha\approx2w_X/3$ rule of thumb that the ATA bound reproduces
- [[Table-Based Function Evaluation]] — the 8-bit bipartite worked example used in the comparison table
