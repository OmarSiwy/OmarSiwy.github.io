> Copied from ARPice `dev/research/design-centering.md` (2026-10-12). Relative links (`../analysis/…`, `optimizer-caching.md`, `src/…`) point into the ARPice repo: `~/Documents/Projects/Zig/ARPice/dev/`. Corrected here (not in ARPice): BAG2 is CICC 2018, doi:10.1109/CICC.2018.8357061 (the 2019 DOI is a different paper, "BAG: A Process-Portable Framework…", Chang, Narevsky, Settaluri, Alon); Jespers–Murmann layout dependence is Appendix 3, not ch. 9 (Crossref, Cambridge Core).

# Design centering over corners and mismatch

Research note, 2026-10-08. Nothing here is implemented and no code changed.
ESPice measurements use the `zig-out/bin/espice` built at 04:35 that day
(the binary `optimizer-caching.md` also measured), on a
32-thread machine at load average 3 to 5, so read the ratios rather than the
digits. The worked examples ran in a scratch directory. Their decks and
scripts are reproduced below so they can be run again. Sources are numbered
at the end. A claim taken only from a search-index snippet, or that could
not be checked, is marked (unverified).

## 1. The question

A designer sizes an amplifier with gm/Id tables and finds a family of
sizings that all meet the spec at nominal. They want to pick the member with
the most margin, so the design survives post-layout parasitics, process
corners (TT/SS/SF/FS/FF, PVT), statistical corners and local mismatch. Three
constraints:

- Margin is the objective. Where to sit along the power/performance
  trade-off (least power, most performance) is a target the designer sets.
- Corners are an arbitrary set: foundry sections, PVT, statistical corners,
  a parasitic-scale stand-in for post-layout.
- Mismatch counts against margin, whatever form it takes.

Table generation is out of scope. The two questions are how industry does
this, and whether ESPice lets the designer do it today.

## 2. Short answer

**Industry.** The standard formulation is design centering. Choose the
sizing x that maximizes the smallest normalized spec slack over every spec
and every corner, with mismatch entering each spec as k sigmas:

    maximize t over x
    subject to  sense_i * (f_i(x, c) - b_i) / s_i >= t   for every spec i and corner c

The scale s_i decides what "margin" means. With s_i = |b_i| it is relative
margin. With s_i = sigma_i(x) it is the worst-case distance in sigmas,
which ties directly to parametric yield, Phi(t) [1, 2]. Most teams do this
by hand: they size at nominal, find the corner that limits each spec, and
re-size against those corners. Teams with optimizer licences size over all
corners at once. Of the commercial tools, MunEDA WiCkeD publicly describes
worst-case-distance centering with mismatch included; Cadence's Variation
Option has a yield-improvement flow and Keysight ADS a Monte Carlo yield
optimizer (§3.10).

**ESPice.** Yes, the designer can do this today. The robust way is an
external loop: a script that writes one deck per corner, runs `espice` on
each, reads the `.meas` lines and maximizes the smallest slack (§4.3). The
in-deck optimizer can also do it with corner copies in one netlist plus a
bisection on the margin (§4.2), but it has hard limits. On the example OTA,
both methods found the same center (t = 0.406, every spec 40.6 % inside its
limit at every corner) and the same least power for a 20 % margin floor
(ib = 9.0 to 9.3 µA). On sky130, with the PDK's own corner sections and
seeded mismatch, the external loop centered the same OTA in 31 s on 32
threads (§4.4). Section 5 lists what is awkward or missing. The worst
items are a crash at eight subcircuit copies, a full PDK re-parse at every
sizing point, and mismatch sigmas that `.dcmatch` cannot get from a PDK.

## 3. Industry practice

### 3.1 Feasible region and Pareto front

Write the design parameters as x (W, L, or gm/Id, L and Id per device). The
operating and corner conditions are θ in a finite set Θ: supply,
temperature, foundry section, parasitic scenario. The statistical
parameters are s ~ N(0, C(x)), global and local. C depends on x because
local mismatch scales as 1/(WL) [14]. Write every spec as f_i ≥ b_i.

- The acceptance (feasible) region lives in parameter space:
  A(x) = {s : f_i(x, s, θ) ≥ b_i for every i and every θ in Θ}. The
  parametric yield is Y(x) = P[s ∈ A(x)] [2, ch. 3 and 6].
- The Pareto front lives in performance space. It is the set of
  attainable performance vectors that no other attainable vector beats in
  every component [2, ch. 4].

The family of sizings that "meets the measurements" is a slice of the
feasible region, not a Pareto set. A nominal optimizer that pushes along a
Pareto front drives some specs, or sizing constraints, to equality. If
f_i(x*) = b_i and the variation is smooth and symmetric, the worst-case
distance for that spec is 0 and its partial yield is Phi(0) = 50 %. That is
why a point taken off a nominal front has to be backed off. (This follows
from the definitions in §3.3; no source states it in these words.)

The front that matters for robustness is a different one: power against
worst-case margin t. Yield-aware and yield-optimized Pareto fronts compute
exactly that [23, 24]. The designer picks the power target on that front,
and the margin at that power is the best t any sizing reaches there. Section
4 computes this front on an example.

### 3.2 Geometric centering

- Chebyshev center: for a polyhedral feasible set {a_iᵀx ≤ b_i},
  maximize r subject to a_iᵀx_c + r‖a_i‖₂ ≤ b_i. The maximum-volume
  inscribed ellipsoid is the ellipsoidal version [7, §8.5].
- Simplicial approximation (Director and Hachtel): fit a polyhedron of
  (n-1)-simplices to the boundary of the feasible region, then inscribe the
  largest hyperellipsoid. The ellipsoid's axes give tolerances, and Monte
  Carlo on the polyhedron estimates yield [3].
- Tolerance design: Brayton, Director and Hachtel linearize the region
  and place a tolerance hypercube, for arbitrary distributions [4]. Bandler
  poses tolerance assignment as nonlinear programming [5].

The maximin problem of §2 is the Chebyshev center written in normalized
slack space rather than parameter space. Normalized slack is what makes the
formulation agnostic to corners: Θ is just a finite set of conditions, and
the formulation never asks what kind of corner each one is.

### 3.3 Worst-case distance

Antreich, Graeb and Wieser define nominal design, worst-case analysis,
yield optimization and centering through one quantity [1; 2, ch. 5 to 7]:

- Operating parameters are worst-cased deterministically:
  θ_w,i = argmin over θ in Θ of f_i.
- Statistical parameters are handled by distance:
  β_w,i = min over s of sqrt(sᵀ C⁻¹ s) subject to f_i(x, s, θ_w,i) = b_i.
  β is positive when the nominal point passes.
- Linearized, β_w,i ≈ (f_i(x, 0, θ_w,i) - b_i) / σ_i with
  σ_i = sqrt(∇ₛf_iᵀ C ∇ₛf_i), and the partial yield is Y_i ≈ Phi(β_w,i).
- Design centering (geometric yield optimization) maximizes min_i β_w,i(x).

β is the same quantity as the first-order reliability index ("most probable
point") in Dakota [42]. The Graeb book's chapters are 3 (parameters and
tolerances), 4 (sizing tasks), 5 (worst-case analysis), 6 (yield analysis)
and 7 (yield optimization and design centering) [2].

The scale choice in §2 decides what kind of margin t measures:

| s_i | t is | Notes |
|---|---|---|
| \|b_i\| | relative margin | Keysight ADS minimax uses this form, with an error (R - g)/d per goal [40] |
| ‖∇ₓf_i‖ | distance in sizing space | Chebyshev center against sizing error |
| σ_i(x, θ_c) | linearized worst-case distance in sigmas | every partial yield is at least Phi(t); mismatch enters through σ_i(x) |

Only the last measures margin in the space where process variation and
mismatch act. The first is what a designer usually means by "x % margin on
every spec", and it is what the examples in §4 use. They count mismatch as
a fixed k-sigma shift in the spec value instead, which is a hybrid of the
two.

### 3.4 Statistical yield optimization

- The Monte Carlo estimate Ŷ = (1/N)·Σ pass has standard error
  sqrt(Y(1-Y)/N). Importance sampling and other variance reduction methods
  lower N [6].
- Yield maximization under arbitrary distributions [47].
- Keysight ADS's YldOpt "adjusts nominal values ... to maximize yield. Also
  referred to as design centering". It sizes the sample count dynamically
  and recommends a separate yield run afterwards [40].

### 3.5 Foundry corners and statistical corners

- Digital corner models are inaccurate for analog circuits and for
  performances they were not targeted at [11]. Corner-based global
  modelling has "fundamental limitations in predicting the circuit
  performance variation" [12].
- The geometry, as reasoned here rather than quoted: a corner that moves k
  correlated parameters to 3σ each sits about 3·sqrt(k) from nominal in
  normalized space. It is pessimistic for the performances aligned with
  that direction. It misses performances whose 3σ point lies elsewhere
  (n/p ratio, mismatch-dominated specs), and so is optimistic for those.
- The fixes all compute a worst-case point per spec at a target β:
  application-specific corners from response surfaces [13], Graeb's
  worst-case parameter sets [2, ch. 5], sigma-driven corners [10, ch. 4],
  Cadence statistical corners [32], and Solido's "worst-case corner for
  any target sigma" [38].
- Do not count global process twice. If the foundry corners already span
  global variation, the statistical part should be local mismatch only.
  This follows from Graeb's split between operating and statistical
  parameters [2]. sky130 is packaged that way: `tt_mm` is `tt` plus local
  mismatch, and `mc` carries global variation as well.

### 3.6 High sigma

Statistical blockade [9]. Scaled-sigma sampling samples at inflated σ and
extrapolates the failure rate, and beats importance sampling in spaces of
several hundred dimensions [8]. Cadence offers both scaled-sigma sampling
and WCD for 4 to 6σ. Its datasheet says scaled-sigma sampling is "more
accurate than WCD for nonlinear behavior" and that WCD "typically requires
under 100 simulations for each spec" [32]. A per-instance yield of Y^(1/N)
for N instances is why memory and many-instance cells sign off near 6σ
[10, ch. 4 and 5].

### 3.7 Mismatch

- Pelgrom: σ²(ΔP) = A_P²/(WL) + S_P²·D² [14]. Kinget derives the
  bandwidth-accuracy-power trade-off this sets, and notes that for MOS
  "some bias point optimizations are possible" [15]. See also [16].
- For a differential pair, σ²(V_os) ≈ A_VT²/(WL) + (I_D/g_m)²·A_β²/(WL).
  This is the standard form; it was not checked against a specific
  equation number.
- In gm/Id sizing, (I_D, gm/Id, L) fixes W through the current density
  I_D/W. Offset is therefore a function of the sizing variables, and it
  belongs inside σ_i(x) in the margin function rather than in a fixed
  guardband.
- How tools get σ: Monte Carlo with local variation; linearized analysis
  such as Spectre DCMatch, which "computes the deviation in the DC
  operation point ... due to the variation of devices" [35] and ranks
  devices by contribution (that part from a search-index snippet,
  unverified); Cadence's Monte Carlo mismatch-contribution analysis [32].
  WiCkeD includes mismatch in synthesis [26].

### 3.8 Post-layout margin

- Performance constraints can be turned into bounds on critical parasitics
  plus matching constraints, which then drive placement [18].
- Pre-layout extraction inside the synthesis loop [19], and parasitic-aware
  gm/Id sizing with parasitic-mismatch constraints [20].
- Layout-dependent effects (well proximity, STI stress) can move bias
  points by 20 to 30 % [17]. Jespers and Murmann have a chapter on layout
  dependence [22, App. 3].
- Practice: add estimated R and C to the schematic before layout (Cadence
  ADE parasitic estimation; source found only in a search index,
  unverified), then extract, re-run corners and Monte Carlo, and iterate.
  The common rule of sizing for 20 to 30 % extra capacitance on
  high-impedance nodes has no primary source that this research found
  (unverified).

### 3.9 gm/Id sources and robustness

The Silveira, Flandre and Jespers abstract covers the gm/Id against
I_D/(W/L) universal curve and an SOI OTA. It says nothing about corners
[21]. Jespers and Murmann have chapters on mismatch (ch. 4) and layout
dependence (Appendix 3) [22]. Their starter kit builds one lookup table per
corner and temperature (`c.corner = 'NOM'`, `c.temp = 300`) [43], so a
gm/Id flow handles corners by re-reading the tables, not by centering.

### 3.10 Tools: centering or corner checking

| Tool | What it computes | Centering? |
|---|---|---|
| Cadence Virtuoso ADE Explorer/Assembler [32, 33] | Corners, Monte Carlo, "worst-case corners and statistically derived corners", "design migration with parameter re-centering". Worst-Case Corners builds one worst corner per spec by design of experiments ([34], search index only). Size Over Corners runs a global optimizer, optionally followed by a local one ([36], search index only) | Sizes to meet every spec at every corner. The Variation Option adds fast Monte Carlo, 3σ statistical corners (at most 200 samples), high-yield estimation (scaled-sigma sampling, WCD), mismatch contribution and an "integrated yield improvement flow" that runs "a series of analyses to tighten your yield factor" [32]: the closest Cadence comes to centering |
| MunEDA WiCkeD [37, 26, 1] | Circuit constraint and feasibility optimization (sizing rules [25], the link is inferred), deterministic and global nominal optimization, yield optimization, fast PVT, Monte Carlo at 3 to 5σ, high-sigma worst-case analysis at 6 to 9σ, global and mismatch yield analysis | Yes: yield optimization is WCD-based design centering. muneda.com redirected to a Cadence Virtuoso page when fetched on 2026-10-08; the acquisition date is unverified |
| Siemens Solido Design Environment [38] | PVTMC Verifier ("identifies the worst-case corner for any target sigma"), High-Sigma Verifier, DesignSense (sizing sweeps at worst PVT and statistical corners), Cell Optimizer ("optimizes designs across worst-case PVT and statistical corners, improving yield") | Corner-based, not WCD |
| Synopsys PrimeWave, ASO.ai, PrimeSim Design Robustness [39] | Optimizes "simultaneously across hundreds of PVT corners", post-layout parasitics included; high-sigma Monte Carlo and a variation profiler | No public statement of statistical centering |
| Keysight ADS [40] | Nominal optimization including minimax; Yield and YldOpt (design centering by Monte Carlo yield); design of experiments | Yes (YldOpt). MBP/MQA are foundry-side model extraction and corner QA, not sizing tools |
| ngspice [41] | Monte Carlo through `agauss` and control scripts; optimization through scripts or ASCO (differential evolution), whose tutorial adds Monte Carlo and corners | Only if you write the objective |
| Xyce + Dakota [41, 42] | `.SAMPLING`, `.EMBEDDEDSAMPLING`, `.PCE`; Dakota optimization; Dakota FORM/MPP reliability (β = WCD) | WCD centering can be built on it |
| spicelib [44] | Monte Carlo and 2^N tolerance-extreme worst case, no optimizer | No |
| BAG, BAG2 [29, 45] | Generator framework; the transistor database is indexed by simulation environment (`env_list`), so a design script can query several corners | Script-level only |
| AutoCkt [28] | Reinforcement learning toward a nominal target spec; post-layout loop through BAG. The abstract does not mention corners | No |
| ALIGN, MAGICAL, OpenFASoC [30, 31] | Layout and generators; take a sized netlist | No (OpenFASoC unverified) |
| Mosplot (medwatt/gmid) [46] | Sizes on a reference corner with gm/Id, freezes geometry, re-solves the operating point at the other corners, and minimizes a weighted sum of squared per-spec worst-over-corner violations with CMA-ES | Feasibility over corners, not maximin; no mismatch term |

### 3.11 By hand

1. Size at TT from the gm/Id tables with targets set to spec plus a
   guardband [10, ch. 2; 40].
2. Sweep PVT and record which corner limits each spec [34, 38].
3. Run Monte Carlo with global and local variation, or extract per-spec 3σ
   statistical corners, and re-size against the limiting set
   [32; 10, ch. 4]. 3σ is the usual level for analog, RF and I/O blocks.
4. Budget offset with the Pelgrom area law, so that kσ fits the budget
   [14, 15; 27, ch. 15], and check it with DCMatch or Monte Carlo
   contributions [32, 35]. A 3σ offset budget is common practice, with no
   single primary source found.
5. Before layout, simulate with estimated parasitics, derive parasitic
   budgets from sensitivities [18], and watch LOD and WPE [17].
6. Extract, re-run corners and Monte Carlo, iterate.

To get "maximum margin at my Pareto target" without a centering tool, fix
the power (or performance) target as a constraint and maximize
min over (i, c) of (f_i - b_i)/s_i, with mismatch entering each spec as k
sigmas. Treat supply, temperature and parasitic scenarios as deterministic
corners, and process as foundry corners plus local statistics [1, 2]. That
is what §4 does.

## 4. Doing it with ESPice today

### 4.1 What applies

| Feature | Use for centering | Limits found | Pointer |
|---|---|---|---|
| `OPTIMIZE=`/`RESULTS=`, `.model OPT`, LM, bisection, pass/fail | In-deck sizing to goals; corner copies in one netlist (§4.2) | Least squares, not maximin; one OPTIMIZE card; RESULTS only from the optimizing card's analysis; no `.alter`; `.step` runs one independent fit per point | `optimize.md` §1, §6 |
| `GOAL=`, `GOAL >`, `GOAL <`, `WEIGHT`, `MINVAL` | One inequality per spec per corner at spec·(1 ± m) | GOAL takes a `.param` expression (`goal > {spec*(1+m)}` works), but a swept name cannot reach a `.meas`, so m cannot be stepped | §4.2, gap 6 |
| `.meas ... PARAM='expr'` | Derived specs (phase margin from `vp`) as RESULTS | | `docs/using/reference.md` `.meas` |
| `.step`, `.data`/`SWEEP DATA=`, `SWEEP` tails | Many sizing or corner points in one process, binned models included since #101 | `.step` + `SWEEP` refused together; a point that leaves its bin builds a circuit of its own | `variants.md` §1, §4 |
| `.alter` | Corners as blocks (`.lib file ss`, `.temp`, `.param`) | Blocks that swap a `.lib` cost about a full parse each and run one after another, even under `--jobs` | `src/espice.zig:333` |
| `.lib file section` | Foundry corners | Two sections in one netlist collide on model names | |
| `.variation` + `.dcmatch` / `.acmatch` / `.dcsens` | Linearized offset σ, one adjoint solve | Sigmas are numbers only (no W·L expression); without a `.variation` block every parameter gets unit variance | `src/frontend/netlist.zig:1900`, `dcmatch.md` §3 |
| `SWEEP MONTE=N`, `agauss`, `DEV`/`LOT`, `.variation` | Monte Carlo σ for every `.meas` (prints `mean`, `sigma`, `min`, `max`) | Leaves sky130's in-model AGAUSS draws at nominal | gap 4 |
| `.option seed=N` | One mismatch sample per run on PDKs like sky130 | One run per sample | `sky130.md` |
| Instance `delvto`, `dtemp` | Per-copy process shift and temperature in one netlist | Per model: level 3 has both, BSIM4 has `delvto`, level 1 has neither | `models/mos3.va:45,93` |
| CLI | One process per corner run, `.meas` lines on stdout | No `-D name=value` override; measures only on stdout | `espice --help` |
| C API | In-process create, run, read results | No measures, no parameter change on a live Problem (`append_directives` takes analysis cards only); static library only | `include/espice.h`, `src/espice.zig:277` |
| Output formats | Raw/CSV/PSF for vectors | Measures are not in any of them | |

### 4.2 Example (a): every corner in one netlist, the LM optimizer, a margin bisection

The idea: one subcircuit copy per corner, so one LM evaluation simulates
every corner at once. Every spec at every corner is a `GOAL >` or `GOAL <`
inequality at spec·(1+m) (or spec·(1-m) for an upper limit). A satisfied
inequality adds no error. If LM drives the residual to zero, every spec
holds with relative margin m. A bisection on m, one `espice` run per m,
finds the largest m that LM can meet. That m is the max-min relative slack
of §3.3 (row 1), and the parameters at that m are the centered design.

The circuit is a 5-transistor OTA in unity-gain DC feedback (open loop in
AC through a 1 GΩ/1 F network) with MOS level 3. Four variables: wn, wp,
ln and ib. Specs: open-loop gain ≥ 100 V/V, UGF ≥ 20 MHz (1 pF load),
phase margin ≥ 60°, |offset| ≤ 10 mV. Seven corners:

| Corner | NMOS ΔVT | PMOS ΔVT | Temperature | Supply | Parasitics | Mismatch |
|---|---|---|---|---|---|---|
| tt | 0 | 0 | 27 °C | 1.8 V | | |
| ss | +50 mV | -50 mV (|VT| up) | 85 °C | 1.62 V | load +50 %, 50 fF on the mirror node | |
| ff | -50 mV | +50 mV | -40 °C | 1.98 V | | |
| sf, fs | ±50 mV | ±50 mV | 27 °C | 1.8 V | | |
| mm_p, mm_n | 0 | 0 | 27 °C | 1.8 V | | m1 shifted by ±3·A_VT·sqrt(2/(W·L)), A_VT = 5 mV·µm |

Process shifts use the instance `delvto`, and temperature uses `dtemp` on
every device in the copy. Mismatch is a deterministic ±3σ input-pair
shift whose σ follows the optimized W and L through the Pelgrom law. The
`ss` corner also carries the post-layout parasitic guess. There are seven
corners rather than eight because eight copies crash the current build
(gap 1, #98).

Two tricks were needed:

- **DC specs in an AC optimization.** RESULTS must be `.meas` cards of the
  optimizing card's analysis, so one optimization cannot mix a `.dc`
  offset with `.ac` gain. A B source multiplies the DC offset by a source
  that is 0 V DC and 1 V AC, so the AC plot carries the DC offset as a
  magnitude: `bx x 0 v={(v(out)-v(inp))*v(one)}` with
  `vone one 0 dc 0 ac 1`.
- **PARMIN.** With the default PARMIN = 0.1, the RELIN test divides each
  step by max(|x|, 0.1). A parameter in SI units (20e-6 A) then "converges"
  after one iteration. A one-parameter fit of ib stopped at iteration 1
  with a 10.7 % goal error, and needed 8 iterations to reach 4e-8 once
  `parmin=1e-12` was set (`src/core/lm.zig:31,187`).

The generated deck, one corner shown, at m = 0.40625:

```spice
* 5T OTA, one subcircuit copy per corner, margin m=0.40625
.param wn=opt1(10u, 2u, 100u) wp=opt1(10u, 2u, 100u) ln=opt1(1u, 0.35u, 4u)
.param ib=opt1(20u, 2u, 60u) avtn=5m k=3 m=0.40625
.model nin nmos level=3 vto=0.5 kp=200u gamma=0.4 phi=0.8 kappa=0.4 nsub=5e16 nfs=1e11 theta=0.1 tox=4n cgso=0.3n cgdo=0.3n cj=1m cjsw=0.2n
.model pld pmos level=3 vto=-0.5 kp=80u gamma=0.4 phi=0.8 kappa=0.4 nsub=5e16 nfs=1e11 theta=0.1 tox=4n cgso=0.3n cgdo=0.3n cj=1m cjsw=0.2n
.subckt ota inp out vdd one dvn=0 dvp=0 dt=0 cpx=0 dvm=0
ib  vdd nb {ib}
mt0 nb nb 0 0 nin w=10u l=2u delvto={dvn} dtemp={dt}
mt  tail nb 0 0 nin w=10u l=2u delvto={dvn} dtemp={dt}
m1 d1 inp tail 0 nin w={wn} l={ln} delvto={dvn+dvm} dtemp={dt}
m2 out inn tail 0 nin w={wn} l={ln} delvto={dvn} dtemp={dt}
m3 d1 d1 vdd vdd pld w={wp} l={ln} delvto={dvp} dtemp={dt}
m4 out d1 vdd vdd pld w={wp} l={ln} delvto={dvp} dtemp={dt}
rfb out inn 1e9
cfb inn 0 1
cl out 0 {1p*(1+cpx)}
cpd d1 0 {cpx*50f}
* the DC offset carried into the AC plot, so an AC .meas can read it
bx x 0 v={(v(out)-v(inp))*v(one)}
.ends
vcm inp 0 dc 0.9 ac 1
vone one 0 dc 0 ac 1
.model om opt parmin=1e-12 itropt=40
v_ss vdd_ss 0 1.62
x_ss inp out_ss vdd_ss one ota dvn=0.05 dvp=-0.05 dt=58 cpx=0.5 dvm={0*k*avtn*1e-6*sqrt(2/(wn*ln))}
.meas ac gain_ss find vm(out_ss) at=1 goal > 140.625
.meas ac ugf_ss when vdb(out_ss)=0 goal > 2.8125e+07
.meas ac ph_ss find vp(out_ss) when vdb(out_ss)=0
.meas ac pm_ss param='180+ph_ss*180/3.141592653589793' goal > 84.375
.meas ac offs_ss find vm(x_ss.x) at=1 goal < 0.0059375
* ... the other six corners the same way; mm_p and mm_n pass dvm={1*k*...} and {-1*k*...}
.ac dec 10 1 1g sweep optimize=opt1 results=gain_tt,ugf_tt,pm_tt,offs_tt,gain_ss,... model=om
.end
```

The driver is a deck generator and two bisections, about 110 lines of
Python (`corners_lm.py`). It runs `espice /dev/stdin`, reads the
`error(name) = ...` lines, and calls an m feasible when every goal error at
the optimum is zero:

```python
def bisect(meets, lo, hi, tol):
    """Largest x in [lo, hi] with meets(x), assuming meets is monotone."""
    while hi - lo > tol:
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if meets(mid) else (lo, mid)
    return lo

m = bisect(lambda m: run(m, ib_max=60)[0], 0.0, 1.0, 0.005)          # 1. center
ib = -bisect(lambda x: run(0.2, ib_max=-x)[0], -60.0, -2.0, 0.5)     # 2. least ib at m >= 0.2
```

Results:

| Step | Result | Cost |
|---|---|---|
| Center, ib ≤ 60 µA | m = 0.406 at wn = 19.6 µm, wp = 4.5 µm, ln = 0.89 µm, ib = 23.2 µA | 8 bisection runs, 370 LM evaluations of 7 corners, 1.8 s (4.9 ms per evaluation) |
| Binding specs at the center | ugf@ss +0.406, offs@mm_n +0.406, gain@ss +0.407, pm@ff +0.408 | |
| Least power with m ≥ 0.2 | ib = 9.25 µA (33 µW), bisection tolerance 0.5 µA | 7 runs, about 1.7 s |

Four specs binding at the same slack is what a maximin optimum looks like:
no single parameter move can raise all four at once. The center does not
sit at the power cap. Above about 23 µA, more current lowers gm/Id and
gain faster than it raises UGF.

Where this method falls short:

- LM stops at the first point where every inequality holds, and it is a
  local method. A failed m is "LM could not find it from the start point",
  so the bisection gives a lower bound on the true max-min slack.
- Only relative margin s_i = |b_i| is expressible, and mismatch enters as a
  fixed-sign deterministic shift, not as σ_i(x).
- One process per m. The margin cannot be a `.step` (gap 6).
- Corners must be expressible as instance parameters of one subcircuit.
  Foundry `.lib` sections cannot be combined in one netlist, and binned PDK
  models cannot have W or L optimized across a bin edge (gap 2). So on
  sky130 this method optimizes currents, voltages, passives, and W or L
  within one bin.
- Seven copies at most until #98 is fixed (gap 1).

### 4.3 Example (b): an external maximin loop

The general method. A script writes one deck per (sizing point, corner),
runs them in parallel, reads the `.meas` lines and maximizes
t(x) = min over specs and corners of the normalized slack. Mismatch enters
as k linearized sigmas from `.dcmatch` at each corner, with the
`.variation` σ written per point from Pelgrom A_VT and the current W·L,
because the deck cannot compute it (gap 4). The optimizer is a compass
search on ln(x). t(x) is a min() with kinks wherever the binding spec or
corner changes, so a derivative-free method is the honest default.
`scipy.optimize` Nelder-Mead or COBYLA would do as well. Nothing here needs
numpy.

The second step slides along the power axis. It does not penalize power
directly: a compass search on "least ib with t ≥ floor" stalls on the
constraint boundary, as a first try did (it stopped at ib = 12.5 µA because
no single-coordinate move kept t above the floor). Instead it fixes ib at
the target, re-centers the other variables, and bisects on ib. That is the
§3.11 formulation, power as a constraint and margin as the objective.

Same OTA, specs and process/temperature/supply/parasitic corners as §4.2
(five corners, no mismatch copies), the full script:

```python
#!/usr/bin/env python3
"""Example (b): an external maximin loop around the espice CLI.

t(x) = min over specs i and corners c of the normalized slack
s_ic = sense_i * (f_i(x, c) - b_i) / |b_i|, with mismatch entering each spec
at each corner as k linearized sigmas (here the offset sigma from .dcmatch).
Step 1 maximizes t(x) (the design center). Step 2 slides along the power
axis: it fixes ib (the Pareto coordinate the user targets), re-centers the
other variables, and bisects for the least ib whose centered t still meets a
margin floor.
Derivative-free compass search in log space, because t(x) is a min() and has
kinks where the binding spec or corner changes. Pure Python, no numpy.
"""
import math, os, re, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor

ESPICE = "espice"
K = 3                               # mismatch sigmas counted against margin
AVT = {"nin": 5e-9, "ntail": 5e-9, "pld": 5e-9}   # Pelgrom A_VT, V*m

# Any corner set: here process shifts, temperature, supply, and a parasitic
# scale; a sky130 template would carry `.lib ... ss` and the like instead.
CORNERS = {
    "tt": dict(dvn=0,     dvp=0,     T=27,  vdd=1.8,  cpx=0),
    "ss": dict(dvn=0.05,  dvp=-0.05, T=85,  vdd=1.62, cpx=0.5),
    "ff": dict(dvn=-0.05, dvp=0.05,  T=-40, vdd=1.98, cpx=0),
    "sf": dict(dvn=0.05,  dvp=0.05,  T=27,  vdd=1.8,  cpx=0),
    "fs": dict(dvn=-0.05, dvp=-0.05, T=27,  vdd=1.8,  cpx=0),
}
SPECS = {"gain": (100, 1), "ugf": (20e6, 1), "pm": (60, 1), "offs": (10e-3, -1)}
NAMES = ("wn", "wp", "ln", "ib")
LO = dict(wn=2e-6, wp=2e-6, ln=0.35e-6, ib=2e-6)
HI = dict(wn=100e-6, wp=100e-6, ln=4e-6, ib=60e-6)

MOS = "kp={kp} gamma=0.4 phi=0.8 kappa=0.4 nsub=5e16 nfs=1e11 theta=0.1 tox=4n cgso=0.3n cgdo=0.3n cj=1m cjsw=0.2n"
DECK = f"""* 5T OTA at one corner
.temp {{T}}
.model nin nmos level=3 vto={{vn}} {MOS.format(kp="200u")}
.model ntail nmos level=3 vto={{vn}} {MOS.format(kp="200u")}
.model pld pmos level=3 vto={{vp}} {MOS.format(kp="80u")}
vdd vdd 0 {{vdd}}
vcm inp 0 dc 0.9 ac 1
ib vdd nb {{ib}}
mt0 nb nb 0 0 ntail w=10u l=2u
mt tail nb 0 0 ntail w=10u l=2u
m1 d1 inp tail 0 nin w={{wn}} l={{ln}}
m2 out inn tail 0 nin w={{wn}} l={{ln}}
m3 d1 d1 vdd vdd pld w={{wp}} l={{ln}}
m4 out d1 vdd vdd pld w={{wp}} l={{ln}}
rfb out inn 1e9
cfb inn 0 1
cl out 0 {{cl}}
cpd d1 0 {{cpd}}
.variation
.local_variation
nmos nin vto={{s_nin}}
nmos ntail vto={{s_ntail}}
pmos pld vto={{s_pld}}
.end_local_variation
.end_variation
.ac dec 10 1 1g
.meas ac gain find vm(out) at=1
.meas ac ugf when vdb(out)=0
.meas ac ph find vp(out) when vdb(out)=0
.dc vcm 0.89 0.91 0.01
.meas dc off find par('v(out)-v(inp)') at=0.9
.dcmatch v(out,inp)
.meas dcmatch s3 find total_3sigma
.end
"""

def deck(x, c):
    p = CORNERS[c]
    # Pelgrom: sigma(VT) of one device; the deck's .variation takes numbers only
    sig = dict(s_nin=AVT["nin"] / math.sqrt(x["wn"] * x["ln"]),
               s_ntail=AVT["ntail"] / math.sqrt(10e-6 * 2e-6),
               s_pld=AVT["pld"] / math.sqrt(x["wp"] * x["ln"]))
    return DECK.format(T=p["T"], vn=0.5 + p["dvn"], vp=-0.5 + p["dvp"], vdd=p["vdd"],
                       cl=1e-12 * (1 + p["cpx"]), cpd=50e-15 * p["cpx"], **x, **sig)

def measure(x, c):
    r = subprocess.run([ESPICE, "/dev/stdin"], input=deck(x, c), capture_output=True, text=True)
    m = {k: float(v) for k, v in re.findall(r"^(\w+)\s+=\s+(\S+)$", r.stdout, flags=re.M)}
    if r.returncode or len(m) < 5:
        return None                      # a failed run counts as a violated spec
    return dict(gain=m["gain"], ugf=m["ugf"], pm=180 + math.degrees(m["ph"]),
                offs=abs(m["off"]) + K * m["s3"] / 3)

POOL = ThreadPoolExecutor(os.cpu_count())
RUNS = [0]

def margins(xs):
    """t(x) for every x in xs; all (point, corner) runs go out at once."""
    jobs = [[POOL.submit(measure, x, c) for c in CORNERS] for x in xs]
    RUNS[0] += len(xs) * len(CORNERS)
    out = []
    for js in jobs:
        f = [j.result() for j in js]
        out.append(-1.0 if None in f else
                   min(s * (fc[k] - b) / abs(b) for fc in f for k, (b, s) in SPECS.items()))
    return out

def compass(score, x, names=NAMES, step=0.5, tol=0.01):
    """Maximize score(x) over `names` by compass search on ln(x), clamped to [LO, HI]."""
    best = score([x])[0]
    while step > tol:
        polls = []
        for n in names:
            for d in (step, -step):
                y = dict(x)
                y[n] = min(HI[n], max(LO[n], x[n] * math.exp(d)))
                polls.append(y)
        s = score(polls)
        i = max(range(len(polls)), key=s.__getitem__)
        if s[i] > best:
            x, best = polls[i], s[i]
        else:
            step /= 2
    return x, best

if __name__ == "__main__":
    x0 = dict(wn=10e-6, wp=10e-6, ln=1e-6, ib=20e-6)
    t0 = time.perf_counter()
    xc, tc = compass(margins, x0)
    dt = time.perf_counter() - t0
    print(f"center: t = {tc:.4f} at " + " ".join(f"{n}={xc[n]:.4g}" for n in NAMES))
    print(f"  {RUNS[0]} corner runs in {dt:.2f} s, {1e3 * dt / RUNS[0]:.1f} ms per run wall "
          f"({len(CORNERS)} corners per point)")
    floor = float(sys.argv[1]) if len(sys.argv) > 1 else 0.2
    # Step 2: the least ib whose re-centered margin still meets the floor.
    RUNS[0], t0 = 0, time.perf_counter()
    lo, hi, xp = LO["ib"], xc["ib"], xc
    while hi / lo > 1.02:
        ib = math.sqrt(lo * hi)
        x, t = compass(margins, dict(xp, ib=ib), names=("wn", "wp", "ln"))
        print(f"  ib={ib:.4g}: centered t = {t:.4f}")
        if t >= floor:
            hi, xp = ib, x
        else:
            lo = ib
    dt = time.perf_counter() - t0
    print(f"least power with t >= {floor}: " + " ".join(f"{n}={xp[n]:.4g}" for n in NAMES))
    print(f"  {RUNS[0]} corner runs in {dt:.2f} s")
```

Results (`python3 maximin.py 0.2`, 2.5 s wall in total):

| Step | Result | Cost |
|---|---|---|
| Center | t = 0.406 at wn = 27.2 µm, wp = 2.2 µm, ln = 0.91 µm, ib = 23.0 µA | 145 points × 5 corners = 725 runs in 0.46 s |
| Binding specs at the center | pm@ss +0.406, offs@ff +0.406, offs@ss +0.407, pm@ff +0.408 | |
| Margin against power (the front of §3.1) | ib = 6.8 / 7.9 / 8.5 / 8.9 / 9.0 / 9.2 / 12.5 µA gives centered t = -0.085 / 0.072 / 0.156 / 0.196 / 0.216 / 0.238 / 0.395 | |
| Least power with t ≥ 0.2 | ib = 9.04 µA (33 µW) at wn = 23.6 µm, wp = 2.5 µm, ln = 0.61 µm; binding ugf@ss and offs@ff | 3365 runs in 2.0 s |

Per run: an `espice` process on this 13-device deck takes 4.2 ms from a
shell loop, and about 9 ms through `subprocess` from Python. With 32 threads
in flight the wall time is 0.6 ms per corner run.

The two examples agree on the center (t = 0.406 in both) and on the least
power for a 20 % floor (9.04 µA against 9.25 µA, inside (a)'s 0.5 µA
bisection tolerance). They reach t = 0.406 with different sizings and
different binding sets. The maximin optimum here is a set rather than a
point: with four variables and three or four binding specs, some directions
leave t unchanged. A second objective (power, area, the tt value of the
most important spec) picks within the set, and the slide step is one such
choice. Note also that (b) counts the whole offset σ from `.dcmatch` (input
pair and load) at every corner, while (a) shifts only the input pair.

**The C API instead of the CLI.** `capi.py` (ctypes) creates a Problem from
netlist text, runs it, finds the AC query, reads `v(out)` through
`espice_result_view`, and computes gain and UGF itself, because `.meas`
values do not cross the C API. On the same deck it takes 1.71 ms per
create, run and read, against 4.2 ms per CLI process. The UGF it computes
by log-log interpolation (30.34 MHz) differs from `.meas WHEN` (30.45 MHz)
by 0.3 %, which is the cost of re-implementing measures outside ESPice.
The release ships only `libespice.a`. A shared library for ctypes links
with `zig cc -shared -o libespice.so -Wl,--whole-archive
zig-out/lib/libespice.a -Wl,--no-whole-archive -lc`. A plain `cc` link
fails at load time with `undefined symbol: __zig_probe_stack`, because the
archive carries no compiler-rt. The essential calls:

```python
lib.espice_default_options(byref(o))
o.source_kind, o.source = ESPICE_BYTES, Bytes(raw, len(raw))
lib.espice_create(byref(o), byref(p), diag, 256)
lib.espice_run_all(p)
# find the query whose espice_query_info.kind == ESPICE_AC (the struct is 56 bytes)
lib.espice_get_result_info(p, q, byref(info))          # variable_count, point_count
lib.espice_result_view(p, q, byref(data), byref(n))   # point-major, re/im pairs
lib.espice_copy_result_name(p, q, col, name, 64, byref(req))
lib.espice_destroy(p)
```

### 4.4 Example (b) on sky130

The same loop on the SkyWater sky130 PDK (`sky130A`, ngspice library),
with the PDK's own corners and mismatch. Three things change:

- Corners are `.lib "sky130.lib.spice" ss` and so on, plus `.temp`,
  supply and the parasitic scale: (tt, 27 °C, 1.8 V), (ss, 85 °C, 1.62 V,
  +50 % parasitics), (ff, -40 °C, 1.98 V), (sf, 27 °C), (fs, 27 °C).
- W and L cannot vary in one process at all (gap 2), so every point is a
  fresh parse of the PDK.
- `.dcmatch` has no sigmas for sky130: its mismatch is `AGAUSS` inside the
  binned model cards, so `.dcmatch` falls back to unit variance on 5,721
  model parameters. `SWEEP MONTE=30` gave 30 identical trials. What works
  is N runs of the `tt_mm` section with `.option seed=1..N`, one mismatch
  sample per run (seeds 1 to 8 gave offsets from -6.65 to -1.79 mV around a
  -3.27 mV systematic offset). The script uses 16 seeds at tt, takes each
  spec's standard deviation, and moves every corner's value K = 3 sigmas
  toward its limit.

Specs: gain ≥ 80 V/V, UGF ≥ 10 MHz, phase margin ≥ 60°,
|offset| + 3σ ≤ 15 mV. W and L in µm (the PDK's `.option scale`). The
script (`maximin_sky130.py`) imports the one above and swaps the deck,
the corner table and the margin function:

```python
LIB = ".../sky130A/libs.tech/ngspice/sky130.lib.spice"
SEEDS = range(1, 17)
M.CORNERS = {"tt": ("tt", 27, 1.8, 0), "ss": ("ss", 85, 1.62, 0.5), "ff": ("ff", -40, 1.98, 0),
             "sf": ("sf", 27, 1.8, 0), "fs": ("fs", 27, 1.8, 0)}
# deck(x, c): `.lib "{LIB}" {sec}`, `.temp {T}`, and for an integer c (a seed)
# section tt_mm with `.option seed={c}`; x1/x2 sky130_fd_pr__nfet_01v8 w={wn} l={ln},
# x3/x4 sky130_fd_pr__pfet_01v8 w={wp} l={ln}; the same .ac/.dc/.meas cards as above.

def margins(xs):
    runs = list(M.CORNERS) + list(SEEDS)
    jobs = [[M.POOL.submit(measure, x, c) for c in runs] for x in xs]
    out = []
    for js in jobs:
        f = [j.result() for j in js]
        if None in f:
            out.append(-1.0)
            continue
        corners, mc = f[:len(M.CORNERS)], f[len(M.CORNERS):]
        sig = {k: statistics.stdev(r[k] for r in mc) for k in M.SPECS}
        out.append(min(s * ((abs(fc[k]) if k == "offs" else fc[k]) - s * M.K * sig[k] - b) / abs(b)
                       for fc in corners for k, (b, s) in M.SPECS.items()))
    return out
```

Cost per run: 142 ms, of which 115 ms is parsing the PDK
(`--timing-in-depth`: "frontend (source, parsing, HDL): 114.9 ms") and the
analyses take a few ms. Peak RSS is 149 MB per process. One point is
5 corners + 16 seeds = 21 runs.

Results (`python3 maximin_sky130.py`, run through `tools/zq`):

| Step | Result | Cost |
|---|---|---|
| Start, W = 4 µm, L = 1 µm, ib = 20 µA | t = -0.123 (fails) | |
| Center | t = 0.134 at wn = wp = 4.98 µm, ln = 0.78 µm, ib = 22.7 µA | 130 points × 21 runs = 2,730 runs in 31.1 s: 0.24 s per point, 11.4 ms per run wall on 32 threads |
| Binding specs at the center | offs@ss +0.134 (\|-4.77 mV\| + 3 × 2.74 mV against 15 mV), ugf@ss +0.134 (12.55 MHz - 3 × 0.40 MHz against 10 MHz), then gain@ss +0.206 | |

The mismatch sigmas at the center, from 16 seeds: gain 1.11 V/V, UGF
0.40 MHz, phase margin 0.07°, offset 2.74 mV. With N = 16 a sample
standard deviation carries about 1/sqrt(2(N-1)) = 18 % relative error, so
the k = 3 shift is itself uncertain by that much. Every point reuses the
same 16 seeds (common random numbers), so the error is a smooth bias in
t(x) rather than noise between points, and the compass search still
converges. A final check at the chosen point should use more samples.

The power slide of §4.3 was not run on sky130. At about 30 s per centering
it would take a few minutes, nearly all of it spent re-parsing the PDK
(gap 2).

### 4.5 The recipe

1. Write the testbench once as a template: the sizing variables (W or, with
   your tables, gm/Id and L per device mapped to W), one corner per run
   (`.lib` section, `.temp`, supply, parasitic scale), and one `.meas` per
   spec.
2. Choose how mismatch enters:
   - `.variation` + `.dcmatch` for DC specs on models without PDK
     statistics, with the σ rows computed by your script from A_VT and W·L;
   - `SWEEP MONTE=N` + `.variation` for every `.meas` (it prints `sigma(name)`);
   - N runs with `.option seed=s` on a PDK whose mismatch lives in its model
     cards (sky130).
3. For each candidate x, run every corner and sample in parallel, one
   `espice` process each, and parse the `name = value` lines.
4. Compute s_ic = sense·(f_ic ∓ kσ_i - b_i)/|b_i| (or divide by σ_i for
   margin in sigmas) and t(x) = min.
5. Maximize t(x) with a derivative-free method. That is the center.
6. Slide: fix power (or ib, or whichever coordinate you target), re-center
   the rest, and bisect for the least power with t ≥ your floor, or report
   t at your power budget.
7. Verify the chosen point with full Monte Carlo at each corner, then again
   after extraction.

## 5. Gaps

Findings only; nothing was changed.

1. **Eight or more copies of a MOS subcircuit crash the operating point.**
   `panic: for loop over objects with non-equal lengths` in `.op`, `.dc`,
   `.ac` and `.tran`. Seven copies run, and the same circuit flattened by
   hand runs. Minimal deck: `.model pld pmos`,
   `.subckt s out vdd` / `m4 out d1 vdd vdd pld` / `.ends`, `x1 o1 v1 s`
   through `x8 o8 v8 s`, `.op`. A chain of ten buffer subcircuits does not
   crash. This caps example (a) at seven corners. Not traced (no debug
   build was available). Filed as #98.
2. **W and L of a binned PDK model cannot vary in one process.** `.step
   param wn list 1 1.05` on a sky130 nfet fails with a bare `Error: m1.sp:
   UnsupportedDevice`, with no line and no reason, even for a 5 % step. An
   OPTIMIZE over wn fails the same way. The documented refusal is "a swept
   or sampled l/w on a binned model" (`src/frontend/netlist.zig:2735`,
   `variants.md` §4), but that message is not what
   the user sees. Consequence: on sky130 every sizing point re-parses the
   PDK, 115 of 142 ms per run.
   Since #101 a `.step` or `set_params` change of W or L picks the bin the
   new geometry selects, and a point outside the nominal bin runs on a
   circuit built for it without a re-parse. OPTIMIZE and a DC ensemble
   still refuse a point that leaves its bin.
3. **No way to change a parameter without a new Problem.** The C API's
   `espice_append_directives` takes analysis cards only (`src/espice.zig:277`,
   `src/frontend/prepare.zig:386`). The CLI has no `-D name=value`. So an
   external loop pays parse and setup at every point: 4.2 ms on a 13-device
   deck, 142 ms on sky130. In-process `.step` amortizes it only for models
   that are not binned.
   Since #101 `Options.live_params` and `Problem.set_params` (C
   `espice_set_params`) rerun the queries at new `.param` values on the
   same Problem; earlier results stay until `espice_release_results`, as
   ngspice keeps plots until `destroy`.
4. **Mismatch sigmas.**
   - `.variation` sigmas are numbers only: `vto={expr}` and `vto=name` are
     both `ParseError` (`percentValue`, `src/frontend/netlist.zig:1900`).
     Pelgrom scaling by W·L must come from a generator, and a per-model row
     means one model name per device geometry.
   - No model sets `ParamRef.pelgrom_ap` (`src/device/abi.zig:47`; only
     tests do), so without `.variation`, `.dcmatch` publishes unit-variance
     columns and a `total_3sigma` that means nothing (5,721 columns on a
     sky130 OTA).
   - `SWEEP MONTE=N` leaves sky130's in-model `AGAUSS` draws at nominal
     with no warning: 30 trials of `.ac ... sweep monte=30` on `tt_mm` were
     identical. The only path is one process per `.option seed`
     (`sky130.md`).
5. **The in-deck optimizer is least squares, not maximin.** A satisfied
   inequality adds zero error, so LM stops at the first feasible point and
   never centers; margin comes only from moving the goals. Other limits
   (`optimize.md` §6): one OPTIMIZE card per deck;
   RESULTS only from the optimizing card's analysis, so DC specs need the B
   source trick of §4.2; no `.alter`; `.step` gives independent fits per
   point, not one fit over all corners.
6. **The margin cannot be stepped.** `goal > {spec*(1+m)}` works, but
   `.step param m` fails: "a swept parameter is read outside a device or
   model value" (`src/frontend/netlist.zig:2390`), and the `.meas` card is
   then dropped with a warning, so the optimizer reports "a RESULTS name
   that is no .meas card of this analysis with GOAL=". One process per
   bisection step.
7. **PARMIN = 0.1 by default** (`src/core/lm.zig:31`). For parameters in
   SI units, max(|x|, PARMIN) is PARMIN, so the RELIN test passes after any
   step under 1e-4 absolute. A fit of ib stopped at iteration 1 with a
   10.7 % goal error and reported "optimization completed: RELIN". The
   default is HSPICE's (optimize.md §1 cites the manual), but nothing warns
   about it.
8. **Measures are stdout text only.** Not in any output format, not in the
   C API (`include/espice.h` has no measure call; `print_measures` writes to
   a writer, `src/espice.zig:502`). The headers carry no variant label:
   under `.step` or `.alter` every block is titled `Measurements for AC
   Analysis` (`src/output/measure.zig:31`), so a script must map blocks to
   variants by order. Step labels also print full precision
   (`ibx=0.000009999999999999999`).
9. **`.alter` runs are serial.** Five sky130 corners as `.alter` blocks
   took 0.62 s at both `--jobs=1` and `--jobs=5`, about one full parse per
   block. Runs with their own circuit go after the main session, one at a
   time (`src/espice.zig:333`). Separate processes are faster on a multicore
   machine.
10. **No shared library.** Only `libespice.a` ships, and it carries no
    compiler-rt, so linking it into a `.so` with a plain C compiler gives
    `undefined symbol: __zig_probe_stack` at load time. `zig cc` works.
11. **Per-instance temperature and process shift depend on the model.**
    `delvto` and `dtemp` exist on MOS level 3 (`models/mos3.va:45,93`),
    BSIM4 has `delvto`, and level 1 (`models/mos1.va`) has neither. One-netlist corners need them, or one
    model card per corner.
12. **Two sections of one corner library cannot share a netlist**: they
    define the same model names (not run; it follows from the library's
    layout). Foundry corners in one netlist would need renamed copies of
    the library.

## Sources

1. K. Antreich, H. Graeb, C. Wieser, "Circuit analysis and optimization driven by worst-case distances," IEEE TCAD 13(1):57-71, 1994. doi:10.1109/43.273749
2. H. Graeb, *Analog Design Centering and Sizing*, Springer, 2007, ch. 3-7. doi:10.1007/978-1-4020-6004-5
3. S. Director, G. Hachtel, "The simplicial approximation approach to design centering," IEEE TCAS 24(7):363-372, 1977. doi:10.1109/TCS.1977.1084353
4. R. Brayton, S. Director, G. Hachtel, "Yield maximization and worst-case design with arbitrary statistical distributions," IEEE TCAS 27(9):756-764, 1980. doi:10.1109/TCS.1980.1084889
5. J. Bandler, "Optimization of design tolerances using nonlinear programming," JOTA 14:99-114, 1974. doi:10.1007/BF00933176
6. D. Hocevar, M. Lightner, T. Trick, "A study of variance reduction techniques for estimating circuit yields," IEEE TCAD 2:180-192, 1983. doi:10.1109/TCAD.1983.1270035
7. S. Boyd, L. Vandenberghe, *Convex Optimization*, Cambridge University Press, 2004, §8.5 "Centering". doi:10.1017/CBO9780511804441
8. S. Sun, X. Li, H. Liu, K. Luo, B. Gu, "Fast statistical analysis of rare circuit failure events via scaled-sigma sampling for high-dimensional variation space," IEEE TCAD 34(7):1096-1109, 2015. doi:10.1109/TCAD.2015.2404895
9. A. Singhee, R. Rutenbar, "Statistical blockade," DATE 2007. doi:10.1109/DATE.2007.364490
10. T. McConaghy, K. Breen, J. Dyck, A. Gupta, *Variation-Aware Design of Custom Integrated Circuits: A Hands-on Field Guide*, Springer, 2013, ch. 2, 4, 5. doi:10.1007/978-1-4614-2269-3
11. C. McAndrew, I.-S. Lim, B. Braswell, D. Garrity, "Corner models: Inaccurate at best, and it only gets worst...," CICC 2013. doi:10.1109/CICC.2013.6658428
12. S. Dongaonkar, S. Mudanai, M. Giles, "From process corners to statistical circuit design methodology," IEEE TED 66(1):19-27, 2019. doi:10.1109/TED.2018.2860929
13. M. Sengupta et al., "Application-specific worst case corners using response surfaces and statistical models," IEEE TCAD 24(9):1372-1380, 2005. doi:10.1109/TCAD.2005.852037
14. M. Pelgrom, A. Duinmaijer, A. Welbers, "Matching properties of MOS transistors," IEEE JSSC 24(5):1433-1439, 1989. doi:10.1109/JSSC.1989.572629
15. P. Kinget, "Device mismatch and tradeoffs in the design of analog circuits," IEEE JSSC 40(6):1212-1224, 2005. doi:10.1109/JSSC.2005.848021
16. P. Drennan, C. McAndrew, "Understanding MOSFET mismatch for analog design," IEEE JSSC 38(3):450-456, 2003. doi:10.1109/JSSC.2002.808305
17. P. Drennan, M. Kniffin, D. Locascio, "Implications of proximity effects for analog design," CICC 2006, pp. 169-176. doi:10.1109/CICC.2006.320869
18. K. Lampaert, G. Gielen, W. Sansen, "A performance-driven placement tool for analog integrated circuits," IEEE JSSC 30(7):773-780, 1995. doi:10.1109/4.391116
19. M. Ranjan et al., "Fast, layout-inclusive analog circuit synthesis using pre-compiled parasitic-aware symbolic performance models," DATE 2004, pp. 604-609 (DOI unverified).
20. T. Liao, L. Zhang, "Efficient parasitic-aware gm/ID-based hybrid sizing methodology for analog and RF integrated circuits," ACM TODAES 26(2), 2020. doi:10.1145/3416946
21. F. Silveira, D. Flandre, P. Jespers, "A gm/ID based methodology for the design of CMOS analog circuits and its application to the synthesis of a silicon-on-insulator micropower OTA," IEEE JSSC 31(9):1314-1319, 1996. doi:10.1109/4.535416
22. P. Jespers, B. Murmann, *Systematic Design of Analog CMOS Circuits*, Cambridge University Press, 2017, ch. 4 and Appendix 3 "Layout Dependence". doi:10.1017/9781108125840
23. S. Tiwary, P. Tiwary, R. Rutenbar, "Generation of yield-aware Pareto surfaces for hierarchical circuit design space exploration," DAC 2006. doi:10.1145/1146909.1146921
24. D. Mueller-Gritschneder, H. Graeb, "Computation of yield-optimized Pareto fronts for analog integrated circuit specifications," DATE 2010, pp. 1088-1093. doi:10.1109/DATE.2010.5456971
25. H. Graeb, S. Zizala, J. Eckmueller, K. Antreich, "The sizing rules method for analog integrated circuit design," ICCAD 2001. doi:10.1109/ICCAD.2001.968645
26. K. Antreich et al., "WiCkeD: analog circuit synthesis incorporating mismatch," CICC 2000, pp. 511-514. doi:10.1109/CICC.2000.852720
27. W. Sansen, *Analog Design Essentials*, Springer, 2006, ch. 15 "Offset and CMRR: Random and systematic". doi:10.1007/0-387-25747-0_15
28. K. Settaluri et al., "AutoCkt: Deep reinforcement learning of analog circuit designs," DATE 2020, pp. 490-495. doi:10.23919/DATE48585.2020.9116200
29. J. Crossley et al., "BAG: A designer-oriented integrated framework for the development of AMS circuit generators," ICCAD 2013. doi:10.1109/ICCAD.2013.6691100. E. Chang et al., "BAG2: A process-portable framework for generator-based AMS circuit design," CICC 2018, pp. 1-8. doi:10.1109/CICC.2018.8357061
30. K. Kunal et al., "ALIGN," DAC 2019. doi:10.1145/3316781.3323471. H. Chen et al., "MAGICAL," IEEE Design & Test, 2021. doi:10.1109/MDAT.2020.3024153
31. A. Hammoud et al., "OpenFASOC," ISDCS 2023. doi:10.1109/ISDCS58735.2023.10153547
32. Cadence, Virtuoso Variation Option datasheet. https://www.cadence.com/en_US/home/resources/datasheets/virtuoso-variation-option-ds.html
33. Cadence, Virtuoso ADE Assembler datasheet. https://www.cadence.com/en_US/home/resources/datasheets/virtuoso-ade-assembler-ds.html
34. Cadence blog, "What's the Worst that Could Happen?: Worst-Case Corners in ADE GXL" (search index only). https://community.cadence.com/cadence_blogs_8/b/cic/posts/what-s-the-worst-that-could-happen
35. Cadence Support, "DCMatch Analysis." https://support1.cadence.com/public/docs/content/20488065.html
36. S. Weber (Cadence), "Variation-Aware Design with Virtuoso ADE," CDNLive EMEA 2016 (search index only). https://www.researchgate.net/publication/320559729
37. MunEDA, "Optimization of Complex Circuits at System Level," COSEDA user group meeting slides. https://www.coseda-tech.com/files/Files/Dokumente/Optimization_of_Complex_Circuits_at_System_Level_COSEDA_UGM_2018.pdf
38. Siemens, Solido Design Environment fact sheet, 2023. https://www.europractice.stfc.ac.uk/media/pdf/siemens/Siemens-SW-Solido-Design-Environment-FS.pdf
39. Synopsys, PrimeWave https://www.synopsys.com/implementation-and-signoff/ams-simulation/primewave.html ; ASO.ai https://www.synopsys.com/ai/ai-powered-eda/aso-ai.html ; PrimeSim Design Robustness https://www.synopsys.com/implementation-and-signoff/ams-simulation/primesim-design-robustness.html
40. Keysight, ADS 2011.01 "Tuning, Optimization, and Statistical Design." https://edadownload.software.keysight.com/eedl/ads/2011_01/pdf/optstat.pdf
41. ngspice manual, ch. 18-19, https://ngspice.sourceforge.io/docs/ngspice-html-manual/manual.xhtml ; Xyce Reference Guide 7.8, SAND2023-13759, https://xyce.sandia.gov/files/xyce/Xyce_Reference_Guide_7.8.pdf ; "Zener Diode Compact Model Parameter Extraction Using Xyce-Dakota Optimization," SAND2017-13790, https://www.osti.gov/biblio/1415117
42. Dakota UQ documentation (reliability methods). https://snl-dakota.github.io/docs/6.19.0/users/usingdakota/studytypes/uq.html
43. B. Murmann, Book-on-gm-ID-design repository, `techsweep_config_bsim4_28_spectre.m`. https://github.com/bmurmann/Book-on-gm-ID-design
44. spicelib, Sim Analysis Toolkit. https://spicelib.readthedocs.io/en/latest/modules/sim_analysis.html
45. BAG_framework, `bag/tech/mos.py`. https://github.com/ucb-art/BAG_framework
46. Mosplot (medwatt/gmid), `src/mosplot/optimizer/evaluate.py`. https://github.com/medwatt/gmid . pygmid (table lookup only): https://github.com/dreoilin/pygmid
47. A. Seifi, K. Ponnambalam, J. Vlach, "Maximization of manufacturing yield of systems with arbitrary distributions of component values," Annals of Operations Research 99:373-383, 2000. doi:10.1023/A:1019288220413
