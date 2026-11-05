Pre-req reads: [[Tooling]] · [[The Workflow]]

Replacing COFFE: https://github.com/vaughnbetz/COFFE

**Thesis.** COFFE has three problems:
1. **It is slow.** Its sizing search is naive: an exhaustive grid over at most 5–6 transistors at a time.
2. **The tile hardware is fixed.** Changing the analog circuits means forking COFFE.
3. **It sizes on estimates.** Area, delay and power come from fitted models, not real layout.

**Proposal.** A faster simulator (ESpice), drop-in analog hardware described in a config file, and optional substrate2 layout generators. Without a generator the tool falls back to other methods that should still beat COFFE's estimates.

## What COFFE does today

These are facts from the source, so the proposal fixes real problems.

| Fact | Where |
|---|---|
| Cost is `area^b · delay^c`. Power is measured but not in the cost. | `tran_sizing.py: cost_function` |
| Sizes groups of ≤ 5–6 transistors as an exhaustive grid. Ranges shift when the best point hits an edge. | `_divide_problem_into_sets`, `expand_ranges` |
| P/N ratios are balanced by a separate loop (10% tolerance, ≤ 4 iterations). | `erf()` |
| One group's grid = one HSPICE run (`.DATA` rows), called serially. Missing output is retried up to 10 times (licence workaround). | `spice.py: run` |
| Area comes from a fitted model (e.g. `0.447 + 0.128x + 0.391√x`). Wire lengths come from `√area`. | `fpga.py: _area_model` |
| The stop test is commented out, so every run does all `max_iterations` (default 6). | `tran_sizing.py: check_if_done` |
| Each hardware kind is a Python class. The sizing loop calls into them from 32 hard-coded places. | `fpga.py`, `mux_subcircuits.py` |
| Needs HSPICE (no ngspice). Tests rerun 4 reference architectures at 5% tolerance. | `tests/test_references/` |

The circuit COFFE spends most of its time on is the routing mux. It is a two-level NMOS pass-transistor tree, then a level restorer, then a two-inverter buffer. The transmission-gate option swaps each NMOS for a T-gate.

```tikz title="Figure 1. A 4:1 two-level pass-transistor routing mux as COFFE builds it. Gates s and t come from configuration SRAM. The PMOS level restorer pulls the node x up to VDD after the NMOS pass gates have passed a degraded high. The sizable widths are the parameters the search sweeps: W_L1, W_L2, W_rest (pinned to minimum in COFFE), W_inv1 and W_inv2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \coordinate (X) at (5.8,2.8);
  \node[nmos, rotate=-90] (a0) at (1.6,5.4) {};
  \node[nmos, rotate=-90] (a1) at (1.6,3.8) {};
  \node[nmos, rotate=-90] (b0) at (1.6,1.8) {};
  \node[nmos, rotate=-90] (b1) at (1.6,0.2) {};
  \foreach \nm/\lab in {a0/i_0,a1/i_1,b0/i_2,b1/i_3} \draw (\nm.S) -- ++(-0.6,0) node[anchor=east] {$\lab$};
  \foreach \nm/\lab in {a0/s_0,a1/s_1,b0/s_0,b1/s_1} \draw (\nm.G) -- ++(0,0.2) node[anchor=south,font=\scriptsize] {$\lab$};
  \draw (a0.D) -| (3.0,4.6);
  \draw (a1.D) -| (3.0,4.6);
  \draw (b0.D) -| (3.0,1.0);
  \draw (b1.D) -| (3.0,1.0);
  \node[nmos, rotate=-90] (c0) at (4.4,4.8) {};
  \node[nmos, rotate=-90] (c1) at (4.4,1.2) {};
  \draw (3.0,4.6) |- (c0.S);
  \draw (3.0,1.0) |- (c1.S);
  \draw (c0.G) -- ++(0,0.2) node[anchor=south,font=\scriptsize] {$t_0$};
  \draw (c1.G) -- ++(0,0.2) node[anchor=south,font=\scriptsize] {$t_1$};
  \draw (c0.D) -| (X);
  \draw (c1.D) -| (X);
  \node[not port] (i1) at (7.6,2.8) {};
  \node[not port] (i2) at (10.0,2.8) {};
  \draw (X) -- (i1.in);
  \draw (i1.out) -- (i2.in);
  \draw (i2.out) -- ++(0.8,0) node[anchor=west] {to routing wire};
  \node[pmos, xscale=-1] (rp) at (6.4,4.6) {};
  \draw (rp.S) -- ++(0,0.25) node[anchor=south,font=\scriptsize] {$V_{DD}$};
  \draw (rp.D) -- (rp.D |- X) node[circ] {};
  \draw (rp.G) -| (8.8,2.8) node[circ] {};
  \node[anchor=north,font=\scriptsize] at (X) {$x$};
  \node[font=\scriptsize] at (1.6,-0.7) {level 1: $W_{L1}$};
  \node[font=\scriptsize] at (4.4,-0.7) {level 2: $W_{L2}$};
  \node[font=\scriptsize] at (7.9,5.0) {restorer: $W_{rest}$};
  \node[font=\scriptsize] at (8.8,1.9) {buffer: $W_{inv1}$, $W_{inv2}$};
\end{circuitikz}
\end{document}
```

## What the user does

You write netlists and one config file, then run one command. (proposal)

Each piece of tile hardware is one `[[block]]` entry. Adding hardware COFFE has never heard of is one more entry, not a fork.

```toml
[arch]
import = "coffe/input_files/finfet_example.txt"   # reuse COFFE's arch params as-is

[process]
models = "spice_models/ptm_20nm_finfet_hp.l"
vdd    = 0.9
pdk    = "sky130"                    # only needed for real layout

[[block]]
name    = "sb_mux"
netlist = "blocks/sb_mux_2lvl.sp"
size    = { ptran_L1 = [1, 8], ptran_L2 = [1, 8], inv_1 = [1, 12], inv_2 = [2, 32], rest = "min" }
measure = { delay = "in_0 -> out, both edges", power = "avg vdd" }
load    = "routing_wire"
layout  = "crates/sb_mux_gen"        # optional layout generator

[[block]]
name    = "my_bus_iface"             # hardware COFFE has no class for
netlist = "blocks/iface.va"          # Verilog-A works too (via VerA)
size    = { w_drv = [1, 16] }
measure = { delay = "d -> q, rise" }

[path]                               # critical path: block = weight
sb_mux       = 1.0
my_bus_iface = 0.5
```

```
<tool> check tile.toml                  # validate the config; no simulation
<tool> eval  tile.toml --sizes s.csv    # simulate one set of sizes
<tool> size  tile.toml                  # full run: search + layout + report
<tool> diff  tile.toml --against coffe  # run COFFE on the same inputs and compare
```

You get sized netlists for each point on the trade-off curve, a report of area, delay and power, and the VPR architecture values COFFE emits today.

## How it is faster

The speed comes from simulating many candidate sizes at once instead of one grid per HSPICE call. (proposal)

```tikz title="Figure 2. Top: COFFE's loop, per subcircuit, in a fixed order. Bottom: the proposed loop. Candidates form the lane axis of one ESpice batch, the search keeps a three-objective front instead of one scalar cost, and real layout corrects the area model between rounds."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[anchor=west,font=\scriptsize\bfseries] at (0,4.75) {COFFE (tran\_sizing.py)};
  \foreach \x/\ti/\sub in {0/{pick subcircuit}/{fixed order, 32 sites},3.0/{product grid}/{$\le$6 transistors},6.0/{area + wire RC}/{fitted model, $\sqrt{A}$},9.0/{one HSPICE run}/{.DATA rows, plain call},12.0/{min $A^b D^c$}/{shift ranges}} {
    \draw[fill=black!4] (\x,3.4) rectangle (\x+2.6,4.4);
    \node[align=center,font=\footnotesize] at (\x+1.3,3.9) {\textbf{\ti}\\{\scriptsize \sub}};
  }
  \foreach \x in {2.6,5.6,8.6,11.6} \draw[->] (\x,3.9) -- (\x+0.4,3.9);
  \draw[->] (13.3,3.4) -- (13.3,3.05) -| (1.3,3.4);
  \node[font=\scriptsize,anchor=north] at (7.3,3.05) {repeat until max\_iterations (default 6); termination test is commented out};
  \node[anchor=west,font=\scriptsize\bfseries] at (0,1.95) {proposed};
  \foreach \x/\ti/\sub in {0/{propose $W$ points}/{all params, from front},3.0/{area}/{layout rung per block},6.0/{ESpice batch}/{one lane per point},9.0/{update front}/{area, delay, power},12.0/{lay out front}/{substrate2, refit model}} {
    \draw[fill=black!4] (\x,0.6) rectangle (\x+2.6,1.6);
    \node[align=center,font=\footnotesize] at (\x+1.3,1.1) {\textbf{\ti}\\{\scriptsize \sub}};
  }
  \foreach \x in {2.6,5.6,8.6,11.6} \draw[->] (\x,1.1) -- (\x+0.4,1.1);
  \draw[->] (13.3,0.6) -- (13.3,0.25) -| (1.3,0.6);
  \node[font=\scriptsize,anchor=north] at (7.3,0.25) {until the front and the area model stop moving (exit rule in config)};
\end{circuitikz}
\end{document}
```

- **Parallel candidates.** All candidate sizes for one block share a circuit and differ only in widths. ESpice solves them side by side, one GPU "lane" each. A lane that fails to converge is rerun alone.
- **Wider search.** Each round proposes points over *all* of a block's widths, so cost depends on how many points run, not on a grid that explodes past 6 transistors. Try the simplest search first (batched pattern search) and keep it only if it beats COFFE's grid.
- **Trade-off curve, not one score.** Keep every point that nothing else beats on area, delay *and* power (the Pareto front). The user picks afterwards, or ranks with COFFE's `A^b·D^c` to compare like for like.
- **P/N balancing in parallel.** Sweep a batch of P/N ratios at once instead of up to 4 serial reruns.
- **Cache.** Each result is keyed on its exact inputs. Editing one block only re-simulates that block.

## How it gets real area, delay and power

Each block uses the best source of area and parasitics it has, and every reported number names its source. (proposal)

1. **Your generator.** A substrate2 Rust crate that draws the block. The tool sends sizes and gets back GDS, an extracted netlist and the area, all checked by DRC and LVS.
2. **Generic layout.** No generator but a supported PDK: place devices with substrate2's Atoll tiling. Worse than a hand generator, but still real parasitics.
3. **Fitted model.** COFFE's area formula, refitted to the real layouts from 1–2 for this PDK. This is the default for blocks without a generator.
4. **COFFE's estimate.** Original coefficients. Used only with no PDK (e.g. COFFE's PTM models), and as the baseline for `<tool> diff`.

Real layout is slow, so the loop runs at two speeds. The inner search uses the fitted model. Each outer round lays out only the current front, refits the model, and stops once model error is under the user's tolerance.

## Architecture

Hardware is data, not code: a block is one row in a table, so the search never has special code per block kind. (proposal)

| What changes | COFFE | `<tool>` |
|---|---|---|
| New block or topology (e.g. 3-level mux) | new class, generator, and edits in ~6 places | one netlist + one `[[block]]` entry |
| Pass transistor vs T-gate | code path | a different netlist |
| Add a layout generator | not possible | one `layout =` line |
| Swap simulator (ESpice / ngspice / HSPICE) | rewrite `spice.py` | pick a backend |

Layout generators run as a separate process. That keeps third-party Rust crates out of our build, and the cost per call is tiny next to DRC and extraction.