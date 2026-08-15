---
title: Speculative Switch Allocation
description: Runs switch allocation in parallel with VC allocation and squashes the grant on VA failure — buys a whole pipeline stage for a small misspeculation rate.
kind: circuit
source: "6.3) Network-On-Chip, §Router microarchitecture"
status: seed
spade: simulated
tags: [digital, network-on-chip, router, allocator, arbiter, pipeline, speculation]
aliases:
  - Speculative Allocation
  - Speculative SA
  - Speculative Switch Allocator
  - Speculative Router Pipeline
---

# Speculative Switch Allocation

Switch allocation issued in the same cycle as VC allocation on the assumption that VA will succeed, with the crossbar grant killed before the ST register when it does not — the one pipeline collapse that removes a stage without adding the two allocators' delays together.

```tikz title="Speculative switch allocation: two switch allocators run beside VC allocation, the speculative grant is squashed by the VA result, and a priority select gives the port to the committed flit"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---- merged stage boundary
  \draw[dashed,gray] (4.3,-3.0) rectangle (13.7,4.0);
  \node[anchor=south] at (9.0,4.02) {\textbf{one pipeline stage: VA $\parallel$ SA}};

  % ---- input VC state
  \draw (0,-2.6) rectangle (2.8,3.6);
  \node[align=center] at (1.4,2.9) {input VC\\buffers\\$pV$ entries};
  \node[align=center] at (1.4,0.4) {per VC:\\$\mathit{req}$\\$\mathit{has\_vc}$\\$\mathit{credit}$};

  % ---- request wires
  \draw[->] (2.8,2.9) -- (4.4,2.9);
  \node[anchor=south] at (3.5,2.95) {$r_{ns}$: $pV$};
  \draw[->] (2.8,0.9) -- (4.4,0.9);
  \node[anchor=south] at (3.5,0.95) {$r_{sp}$: $pV$};
  \draw[->] (2.8,-1.9) -- (4.4,-1.9);
  \node[anchor=south] at (3.5,-1.85) {$r_{sp}$: $pV$};

  % ---- three parallel allocators
  \draw (4.4,2.2) rectangle (7.0,3.6);
  \node[align=center] at (5.7,2.9) {SA$_{ns}$: $pV\!\to\!p$\\committed flits};
  \draw (4.4,0.2) rectangle (7.0,1.6);
  \node[align=center] at (5.7,0.9) {SA$_{sp}$: $pV\!\to\!p$\\head flits};
  \draw (4.4,-2.6) rectangle (7.0,-1.2);
  \node[align=center] at (5.7,-1.9) {VA: $pV\!\times\!pV$\\once per packet};

  % ---- squash AND
  \node[and port, anchor=in 1] (sq) at (7.9,0.9) {};
  \draw[->] (7.0,0.9) -- (sq.in 1);
  \node[anchor=south] at (7.45,0.95) {$g_{sp}$};
  \draw[->] (7.0,-1.9) -- (7.5,-1.9) |- (sq.in 2);
  \node[anchor=west] at (7.55,-1.55) {$v$: VA succeeded, $pV$};
  \node[anchor=north] at (8.4,-0.15) {squash};

  % ---- priority select
  \draw (10.0,0.2) rectangle (13.4,3.2);
  \node[align=center] at (11.7,1.7)
    {priority select\\per output port $j$:\\$a_j=\bigvee_i g_{ns,i}$\\$g=g_{ns}\vee(g_{sq}\wedge\overline{a_j})$};
  \draw[->] (7.0,2.6) -- (10.0,2.6);
  \node[anchor=south] at (8.5,2.65) {$g_{ns}$: $p$};
  \draw[->] (sq.out) -- (10.0,0.65);
  \node[anchor=south] at (9.6,0.7) {$g_{sq}$};

  % ---- outputs
  \draw (15.0,1.1) rectangle (17.0,2.5);
  \node[align=center] at (16.0,1.8) {ST reg\\crossbar sel};
  \draw[->] (13.4,1.8) -- (15.0,1.8);
  \node[anchor=south] at (14.2,1.9) {$p\lceil\log_2 p\rceil$};
  \draw[->] (17.0,1.8) -- (18.0,1.8);

  \draw[->] (7.0,-2.4) -- (15.8,-2.4) -- (15.8,1.1);
  \node[anchor=south] at (11.2,-2.35) {granted output VC: $\lceil\log_2 V\rceil$, to the next flit};

  \node[anchor=north,align=center] at (9.0,-3.1)
    {misspeculation ($v=0$) squashes the grant and idles that crossbar port for one cycle;\\
     the $\overline{a_j}$ term guarantees the port was one no committed flit had asked for};
\end{circuitikz}
\end{document}
```

**The stage exists only because of a data dependence, and the dependence is one bit wide.** In the canonical four-stage [[Virtual-Channel Router]] pipeline, switch allocation cannot begin until VC allocation has finished, because an input VC has no business asking for a crossbar port until it knows it owns an output VC to send into. That is a genuine dependence, so the two cannot simply be merged: a merged stage would have delay $t_{VA}+t_{SA}$, and since both are prefix-depth arbitration trees — $\Theta(\log pV)$ each ([[Combinational Logic]]) — the sum roughly doubles the clock period and gives back everything the removed stage bought. But the dependence carries exactly one bit per input VC, the answer to "did VA grant me an output VC", and it arrives at the *end* of the cycle. Speculation is what converts a serial dependence on a late-arriving bit into a parallel computation plus a late gate.

**Split the request vectors by what is already certain, not by what is asking.** Each of the $pV$ input VCs contributes one bit to each of two request vectors. A VC is **committed** when it already holds an output VC and sees a credit downstream, $r_{ns} = \mathit{req}\wedge \mathit{has\_vc}\wedge \mathit{credit}$; this is every body flit of an in-flight worm, and every head flit whose VA landed on a previous cycle. A VC is **speculative** when it has a flit but no output VC yet, $r_{sp} = \mathit{req}\wedge\overline{\mathit{has\_vc}}$; this is a head flit contending in VA *this* cycle. Both vectors are $pV$ bits, both are cheap conjunctions of state the input buffer already holds, and by construction $r_{ns}\wedge r_{sp}=0$ — the two classes partition the requesters, which is what lets two allocators run without either seeing a request the other owns. The committed request is a fact; the speculative one is a bet.

**Run two switch allocators, and make the certain one win by construction.** Instantiate two copies of the [[Separable Input-First Allocator]], SA$_{ns}$ over $r_{ns}$ and SA$_{sp}$ over $r_{sp}$, each producing for every output port $j$ a one-hot grant vector $g^{(j)}_{ns}, g^{(j)}_{sp}$ of $p$ bits (or $pV$ bits if the allocator resolves down to the VC). The VA outcome $v$, one bit per input VC, gates the speculative side: $g_{sq}=g_{sp}\wedge v$, a single AND per bit — the squash. The two candidates are then merged per output port by a *mux*, never by a bitwise OR:

$$a_j=\bigvee_i g^{(j)}_{ns,i},\qquad g^{(j)}_i = g^{(j)}_{ns,i}\ \vee\ \bigl(g^{(j)}_{sp,i}\wedge v_i\wedge\overline{a_j}\bigr)$$

$a_j$ is a NOR-reduction over the committed grant vector, $\lceil\log_2 p\rceil$ levels deep and reusable from the allocator's own internal OR tree. The distinction matters: a bitwise OR of the two grants would satisfy every Boolean identity you might want and still be broken, because it can raise two bits of $g^{(j)}$ and drive two inputs onto one crossbar output. The $\overline{a_j}$ term is what makes the merge a selection, and note that the obvious simplification $x\vee(y\wedge\overline x)=x\vee y$ is *not* available here — $a_j$ is a reduction of the whole vector, not the bit $g^{(j)}_{ns,i}$ it sits beside, so absorption does not apply and the term cannot be optimised away.

**The delay accounting is the entire argument for the technique.** Before: two stages, period $\max(t_{VA},t_{SA})$. A naive merge: one stage, period $t_{VA}+t_{SA}$. Speculative merge: one stage, period $\max(t_{VA},t_{SA})+t_{sel}$, where $t_{sel}$ is one AND gate plus one AND-OR select — two gate levels, independent of $p$ and $V$ once $a_j$ is taken from the allocator's existing reduction tree. The router's stage count drops from $4$ to $3$, or from $2$ to… well, to $2$ with [[Lookahead Routing]] already applied, since that removes RC and this removes VA, leaving RC-free VA$\parallel$SA and ST. And the saving is paid twice, because the credit round trip of [[Credit-Based Flow Control]] contains the router pipeline: $t_{crt}=t^{\rightarrow}_{\text{link}}+t_{\text{router}}+t_{\text{credit}}+t^{\leftarrow}_{\text{link}}$, and link utilisation is $\eta=\min(1,B/t_{crt})$, so a removed stage also lowers the buffer-depth floor by one flit per VC — $pV$ flits of storage across the router, against two gate levels of period.

**Speculation is only free if it is forbidden to displace a certain request, and that is a one-gate rule.** With the $\overline{a_j}$ term in place, a speculative grant can only take an output port that no committed flit asked for this cycle. The matching the router produces therefore contains the matching the non-speculative router would have produced, port for port, in every cycle — so throughput is at least the baseline unconditionally, and the misspeculation rate prices only dynamic power and a crossbar port that was going to idle anyway. Drop the term and let the speculative allocator compete on equal footing, and a mispredicted grant steals a port from a flit that was guaranteed to use it; the network then saturates *earlier* than the non-speculative design, which is the failure mode that gives speculation a bad reputation in interconnect. A pleasant corollary: SA$_{sp}$ may be a cheap [[Fixed-Priority Arbiter]] rather than a [[Round-Robin Arbiter]], because an unfair speculative choice only reallocates a slot nobody had a claim to, and any starved head flit stops being speculative the moment its VA succeeds.

**Misspeculation costs no latency relative to the baseline, which is why the rate can be tolerated.** Let $P$ be the probability that a head flit's VA succeeds in a given cycle. On success the flit reaches ST one cycle after it would have in the four-stage pipeline; on failure it retries VA next cycle — which is precisely what the non-speculative router does on a VA failure too. So the speculative router's per-hop latency is $t_r-1$ regardless of $P$, and $P$ appears nowhere in $T_0=Ht_r+(L-1)$. What $P$ does control is how often SA$_{sp}$ toggles for nothing, and $P$ falls with offered load exactly when the power matters most. The router still computes the identity function on payload, so nothing here touches [[Number Formats]] or the error budget of [[Error Accuracy]] — the only currency traded is cycles, ports and switching energy.

> [!important]
> Speculate only on a predicate whose ground truth arrives before the ST register's setup edge, because a grant that has already been forwarded cannot be squashed. VA qualifies; the credit check does not, and speculating on it drops a flit into a full downstream buffer rather than merely wasting a slot. This is why $\mathit{credit}$ appears in $r_{ns}$ and never in the speculative path.

$$\boxed{\ g^{(j)} = g^{(j)}_{ns} \vee \bigl(g^{(j)}_{sp}\wedge v\wedge\overline{a_j}\bigr),\qquad T_{clk}=\max(t_{VA},t_{SA})+t_{sel}\ \ll\ t_{VA}+t_{SA},\qquad t_r \to t_r-1\ }$$

**When it breaks.**

- **Near saturation.** $P$ collapses and $a_j=1$ for most ports, so SA$_{sp}$ resolves a full arbitration tree every cycle and its grant is discarded every cycle. This is a low-load latency optimisation whose power cost peaks under the traffic it helps least.
- **The $\overline{a_j}$ term omitted.** Throughput drops *below* the non-speculative router. Everything still compiles, still routes, still passes a single-packet test, and only shows up as an earlier saturation knee in a loaded traffic simulation.
- **Small $pV$.** If $t_{VA}+t_{SA}$ already fits the target period — a $p=5$, $V=2$ router at a relaxed clock — merge the stages outright and skip the second allocator entirely. Speculation earns its area only when the serial sum does not fit.
- **Aggressive clocking.** $t_{sel}$ is two gate levels. At a 12–15 FO4 period that is on the order of 10 % of the cycle, and it lands on the stage that was already the router's critical path; past some frequency the added select costs more than the removed stage returned.
- **$V=1$.** There is no VC allocation, so there is nothing to speculate on; the pipeline is RC/SA/ST already ([[Wormhole Flow Control]]).
- **Non-separable allocators.** A [[Wavefront Allocator]] resolves the whole $pV\times p$ match as one wavefront and does not expose a per-port $a_j$ or a per-input grant to squash cleanly; duplicating it for the speculative path also doubles the largest block in the control path rather than a small one.

**RTL (Spade).**

```spade
fn pe<#uint N>(r: uint<N>) -> uint<N> {
    r & (~r +. 1)
}

fn spec_sa<#uint N>(ns_req: uint<N>, sp_req: uint<N>, va_ok: uint<N>) -> uint<N> {
    let g_ns = pe(ns_req);
    let g_sp = pe(sp_req) & va_ok;
    if ns_req != 0 { g_ns } else { g_sp }
}
```

`ns_req`/`sp_req` are the two $pV$-bit request vectors of the diagram narrowed to one output port; `pe` is the fixed-priority grant $g = r\wedge(-r) = r\wedge(\overline r+1)$, written `~r +. 1` because Spade's `+` widens to $N{+}1$ and the truncating `+.` is the wrapping increment two's complement wants. `pe(sp_req) & va_ok` is the squash AND; `if ns_req != 0` is the $\overline{a_j}$ select, and using $r_{ns}\neq 0$ rather than $g_{ns}\neq 0$ is the same predicate one gate earlier, since a priority encoder grants iff some bit is set. Everything is combinational — it all belongs inside one stage, and the only register is the ST crossbar-select flop the result feeds. Synthesis will not build two separate encoders as drawn: it shares the `~r + 1` carry chain's prefix structure across both and folds the select into the last AND-OR level, which is why the two-gate-level estimate above survives.

Simulated against a behavioural Verilog reference: **7102 vectors pass** — all 4096 points of the $(r_{ns}, r_{sp}, v)$ space at $N=4$, a 3000-vector random sweep, and six named cases including the asymmetric pair $r_{sp}=\texttt{1001}$ with $v=\texttt{1001}$ (grant `0001`, the low requester wins) against $r_{sp}=\texttt{1001}$ with $v=\texttt{1000}$ (grant `0000` — the arbiter had already picked the low input before VA resolved, so the port idles even though the *high* input's VA succeeded). That pair is the vector a bit-reversed priority encoder passes and a correct one distinguishes. Two mutations confirm the test bites: giving speculation priority over committed requests fails 5073 vectors, and dropping the `& va_ok` squash fails 222.

**Related Notes (with context):**

- [[Virtual-Channel Router]] – extends: the four-stage pipeline this collapses to three, and the source of $p$, $V$, $B$, $w$.
- [[Separable Input-First Allocator]] – depends-on: instantiated twice here, and its internal OR tree is where $a_j$ comes from for free.
- [[Lookahead Routing]] – supports: the orthogonal collapse; RC removed by one, VA by the other, four stages to two.
- [[Fixed-Priority Arbiter]] – depends-on: the $r\wedge(\overline r+1)$ grant the Spade block implements, and the cheap arbiter the speculative path is allowed to use.
- [[Round-Robin Arbiter]] – compares: what SA$_{ns}$ must be for fairness, and what SA$_{sp}$ need not be.
- [[Credit-Based Flow Control]] – depends-on: supplies the credit term that is deliberately excluded from the speculative request, and the $t_{crt}$ that pays the removed stage back a second time.
- [[Crossbar Switch]] – depends-on: the resource being allocated; a squashed grant is one crossbar output idle for one cycle.
- [[Wavefront Allocator]] – counter-example: matches better but exposes no per-port grant to squash, so it does not speculate cleanly.
- [[Choosing a Router Architecture]] – compares: where a three-stage speculative router sits against the bufferless and store-and-forward alternatives.

## References

- Local: [[6.3) Network-On-Chip]] §"Router microarchitecture" — the four-stage RC/VA/SA/ST pipeline, the separable input-first allocator and its $\Theta(\log V+\log p)$ delay, the fixed-priority arbiter identity $g=r\wedge(\overline r+1)$ and its prefix reassociation, the area table for $p{=}5,V{=}4,B{=}6,w{=}128$, and the statement of the two standard pipeline collapses; §"Flow control" for $t_{crt}$, $\eta=\min(1,B/t_{crt})$ and $T_0=Ht_r+(L-1)$.
- Peh & Dally, "A Delay Model and Speculative Architecture for Pipelined Routers", *HPCA*, 2001 — the speculative switch allocator, the duplicated-allocator structure and the rule that non-speculative requests take priority.
- Dally & Towles, *Principles and Practices of Interconnection Networks* (Morgan Kaufmann, 2004) — ch. 16–17 router pipeline and speculation, ch. 18–19 allocators and arbiters.
- Mano & Ciletti, *Digital Design*, and Wakerly, *Digital Design: Principles and Practices* — priority encoders and the AND-OR select the merge reduces to.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 — gate-level delay accounting in FO4 for the two added levels.
