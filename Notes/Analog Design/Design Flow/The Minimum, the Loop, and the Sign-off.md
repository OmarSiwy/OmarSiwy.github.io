---
title: The minimum, the loop, and the sign-off
description: Three refinements to the analog flow, taken to the literature. Sizing for the least area under a yield guarantee instead of for the center; when sizing and post-layout are one loop; and which sign-off criterion actually tracks first-pass silicon success.
publishedAt: 2026-10-23
updatedAt: 2026-10-23
slug: minimum-loop-signoff
tags:
  - analog
  - tooling
draft: true
---

Research note, 2026-10-23. Three questions that [[Analog Design Flow]] and [[Design Centering]] left open, taken to the literature. Sources are numbered at the end. A claim taken only from a search snippet, or that could not be checked against the source, is marked (unverified). Nothing here is implemented.

## 1. The minimum, not the center

### The question

Centering maximizes the smallest normalized slack. Often the objective is the opposite: the least area, or the least power, that still passes post-layout Monte Carlo at every corner. The center is then the wrong answer by construction. The minimum sits on the boundary of the yield constraint, which is exactly where a noisy estimate or a wrong model does the most damage. How do you reach the minimum and still know P(pass)?

### What the literature calls it

Swap the objective and the constraint. Instead of maximizing $t$, solve

$$
\min_{x}\; \mathrm{cost}(x) \quad \text{subject to} \quad \beta_{w,i}(x) \ge \beta_{\min} \quad \text{for every spec } i \text{ and corner } c,
$$

where $\beta_{w,i}$ is the worst-case distance in sigmas from the centering note. This is the worst-case-distance-constrained sizing of the Antreich and Graeb school: $\beta_w$ is read as "$\beta_w$-sigma circuit robustness", the partial yield is $\Phi(\beta_{w,i})$, and $\beta_w = 3$ is a 3-sigma design [1][2]. Structural engineering solved the same problem under the name reliability-based design optimization: minimize cost subject to $P_\mathrm{fail} \le$ target, with the FORM reliability index $\beta$ the distance from the origin to the most probable failure point in standard-normal space [3]. That $\beta$ and $\beta_w$ are the same object, so the RBDO literature tells you how to solve the analog problem. The nested form, an optimizer around a reliability analysis around a simulator, has "very high computational costs". The decoupled form, SORA, freezes the worst-case points from the previous cycle as deterministic constraints, minimizes cost against them, recomputes the worst-case points, and repeats. The performance-measure form constrains the worst performance on the $\beta_{\min}$ sphere instead of the distance to the boundary, and "is more stable, efficient and has a lower dependence on the distribution of random variables" [3][4]. The analog version of SORA predates it: Schenkel et al. linearize each performance at its own worst-case point, optimize on the linearized models inside the feasibility region set by sizing rules, and then run "a line search based on real circuit simulations" from the feasible start to the optimum [5]. Schwencker et al. recompute the worst-case parameter sets from sensitivities as the sizing moves (unverified) [6]. The slide in the flow post, fix one coordinate, re-center, bisect, is the one-dimensional case of this.

A cleaner way to say it with the code the centering note already has: let $t^*(A)$ be the centered slack under an area budget, the maximum of $t$ subject to $\mathrm{area}(x) \le A$. The feasible set grows with $A$, so $t^*(A)$ is nondecreasing, and the least area with $t^*(A) \ge$ floor is a bisection on $A$ with the existing maximin inside. (This follows from the definitions; no source states it in these words.) That curve is the yield-optimized Pareto front of Mueller-Gritschneder and Graeb [7], and the minimum is where it crosses the floor.

### Why the naive version is unsafe

Three failure modes, each with a name and a remedy.

**The optimizer exploits the noise.** A yield estimated from $N$ samples is a random variable, and an optimizer that minimizes area subject to that estimate picks the candidate whose noise happened to land high. Smith and Winkler call it the optimizer's curse: "even if the value estimates are unbiased, the uncertainty in these estimates coupled with the optimization-based selection process leads the value estimates for the recommended action to be biased high" [8]. Mak, Morton and Wood prove the sampled optimum is an optimistic bound on the true one, $E[z^*_n] \le z^*$, and that common random numbers, the same seeds for every candidate, "ensures nonnegative gap estimates and provides significant variance reduction" [9]. Remedies, in order: fixed seeds and a fixed sample set during the search; the Clopper-Pearson lower bound on yield as the constraint instead of the point estimate, which is what Cadence's auto-stop rule and Thalia's acceptance rule both do [10][11]; and a verification run with fresh seeds at the final point, which Keysight's manual asks for because the yield optimizer's trial count is dynamic and "the yield estimate derived from yield optimization often differs from that for a single yield analysis" [12]. A 2026 circuit paper does all three: paired perturbations evaluated on the same process sample, then a held-out sample set "disjoint from those used during optimization" [13].

**The mismatch model is worst where the minimum lives.** Area is the price of matching, so a minimum-area search drives the matched devices toward the smallest $WL$ the offset budget allows [14]. Drennan and McAndrew show that $V_T$ mismatch "does not follow a simplistic $1/\sqrt{\text{area}}$ law, especially for wide/short and narrow/long devices", and that "without an accurate mismatch model, designers are forced to include substantial design margin or risk yield loss" [15]. Lovett et al. report up to a threefold matching difference from the $W/L$ choice at fixed $WL$ (unverified) [16]. So the sizing rules and geometry floors of the Graeb school belong in the constraint set [5], and $\sigma_i(x)$ in the margin has to come from the kit's own mismatch model, seeded Monte Carlo on sky130, not from a Pelgrom constant.

**The model is wrong by an unknown amount.** No statistical margin covers it. Pan, He, Guo and Zhang write down the yield-constrained problem and then note that "the actual density function of process variations almost always differs from the given model", and solve it as a distributionally robust program over a divergence ball around the kit's distribution [17]. The Synopsys 7 nm study is the other side of the same fact: calibrating the models to silicon bought a 6 % correlation improvement and a 3.5 % margin reduction [18]. Without silicon data the honest substitute is a $\beta_{\min}$ bump above the yield target; with it, size the ball from the measured discrepancy.

### What a guarantee costs in samples

If the specs are enforced per sample, "minimize area such that all $N$ sampled instances pass", the problem is a scenario program and the scenario theory gives the certificate. For convex problems Campi and Garatti's bound is exact: $P\{\text{violation} > \varepsilon\} \le \sum_{i<d} \binom{N}{i}\varepsilon^i(1-\varepsilon)^{N-i}$, and for $d = 10$ decision variables, confidence $1 - 10^{-5}$ and $\varepsilon = 1\,\%$, $N = 2{,}942$; at $\varepsilon = 0.1\,\%$, $N = 29{,}513$ [19]. The closed form is $N \ge \frac{e}{e-1}\frac{1}{\varepsilon}\left(\ln\frac{1}{\beta} + d - 1\right)$ [20]. Sizing is not convex, but the non-convex theorem of Campi, Garatti and Ramponi drops convexity: for any algorithm whose output satisfies all $N$ sampled constraints, count the support samples $s^*$ at the optimum, the ones that were active, and read off $\varepsilon(s^*)$ a posteriori [21]. For 3σ, $\varepsilon \approx 1.35 \times 10^{-3}$ and $N$ is of order $10^4$ per spec, which is why industry verifies with a binomial bound instead. About 2,200 to 2,300 passes with zero fails give 3σ at 95 % confidence, the "rule of three" ($P_\mathrm{fail} \le 3/N$) in another form [10][22][23], and the TCAD 2022 Bayesian yield optimizer verifies its final point with 50,000 samples [24]. The one explicitly yield-constrained Bayesian sizer, RSizing, constrains a value-at-risk quantile from a heteroscedastic Gaussian process during the search and then refines with "more comprehensive MC simulations" to get "reliable yield guarantees" [25].

### The recipe

1. $\beta_{\min}$ from the yield target and the instance count. Chip yield is the product of block yields, so 32 copies of a comparator at a 3σ chip target need 4σ each [26].
2. Minimize cost subject to $\beta_{w,i} \ge \beta_{\min}$, solved decoupled: worst-case points frozen as corners, deterministic minimization, recompute, repeat until the worst-case points stop moving. Or the budget bisection above with the existing maximin inside.
3. Common random numbers and a fixed sample set during the search.
4. The constraint is the Clopper-Pearson lower bound, never the point yield.
5. Sizing rules and geometry floors in the constraint set; $\sigma_i(x)$ from the kit's mismatch model.
6. Verify the final point with fresh seeds at every corner, at least 2,300 zero-fail passes for 3σ at 95 %, and again after extraction.
7. A model-error margin on top: a $\beta_{\min}$ bump, or a distributionally robust ball sized from silicon correlation data.

## 2. When sizing and post-layout are one loop

The flow post now carries this as the fifth decision of the layout stage, and its figure 2 draws the sizing-layout loop as part of the flow rather than a way back. The short form:

- For an amplifier the sizing space is continuous, the specs are small-signal quantities the schematic predicts to within a parasitic-scale corner, and one layout is generated, extracted and checked. The loop runs once: the extracted parasitics go back into the benches as fixed R and C, and the block is re-centered.
- For a cell or an FPGA tile the area, delay and power do not exist before layout, so sizing, centering, layout and post-layout are one evaluation. The generator is the objective function, DRC and LVS are feasibility inside it, and the number the optimizer sees is the extracted one.
- Nobody runs a full layout, extraction and characterization inside a wide search. Arm enumerates the discrete fin combinations of a cell with real layouts, extracts and simulates each, and picks the most balanced edges [27]. COFFE keeps layout out of the loop because "layout is a very time consuming task", and fits its area model to real layouts after the textbook model over-predicted area "by as much as 143 %" [28]; COFFE 2 shows the wire-load model alone is worth 9 to 82 % of the delay [29]. The 2025 and 2026 cell-synthesis papers put a learned parasitic surrogate inside the loop, 1.24 % capacitance error and 0.92 % delay and power error on ASAP7, and extract only the top-K [30][31]. ParaGraph does the same for analog, cutting the error of designer-estimated parasitics from over 100 % to under 10 %, and the sizing paper built on it says "parasitic prediction removes the need for in-the-loop layout generation" [32][33]. The analog sizers that do lay out every candidate report 40 minutes against 16 for the same amplifier and call layout generation "the bottleneck of layout-aware methodologies" [34].
- So the answer to "linear or merged" is both. The flow is linear at the level of gates, and the iteration lives inside the evaluation function. For the COFFE rewrite: the Substrate2 generator inside the ESPice loop; a model fitted to the generator's own layouts, area and wire length against the sizes, carrying the search and re-fit whenever the generator or the kit changes; the top candidates through the generator, extraction and the bench; the gate number always from extraction. Log the residual between the model and the extracted number for every candidate that gets a layout. If it exceeds the margin, the model is the bug.
- When the sizing space is discrete, fin counts or unit multiples, skip the model and do what Arm does: enumerate, lay out, extract, pick.

## 3. What sign-off tracks P(success)

### Where respins come from

- First-silicon success is falling: about 32 % of ASIC projects in 2020, 24 % in 2022, 14 % in 2024, "the lowest figure in more than twenty years". Logic and functional flaws stay the first cause [35][36][37].
- Analog is the leading second cause, and it is not an advanced-node problem. In 2020, 41 % of respinning projects attributed a flaw to tuning analog circuits, at "almost all nodes, including 150nm and larger"; in 2022, "nearly 50 % of designs less than 1M gates experienced respins due to analog issues" [35][36]. In 2024, 70 % of respins were design errors due to changes in the spec [37].
- The catastrophic analog failures are functional, not parametric. Kundert and Chang: "Increasingly, catastrophic failures in chips are due to functional bugs, and not due to missed performance specifications", and those bugs are "'simple' errors such as inverted signals, swapped bit lines, and incorrect power up sequencing"; a performance miss "is not as fatal because the system development can usually continue while the IC is re-spun" [38]. What analog verification actually finds: control-logic errors in blocks with many settings (a 64-setting programmable gain amplifier where "the typical designer will only simulate a few"), chicken-and-egg start-up between a regulator and a shared bias generator, and errors at the analog-digital interface: swapped buses, an inverted bias current, swapped reset and reset-bar, logic crossing supply domains without level shifters, undriven signals, register-map errors [39][40]. Infineon's mixed-signal simulation of a sensor chip found "power-blackout, incorrect power-up/down sequence, missing levelshifters, incorrect polarity applied in isolation cell insertion" [41].
- The parametric misses trace to parasitics and layout-dependent effects that were not in the models, to variation plus noise in regulators and clocks, and to corner models that misrepresent analog small-signal quantities. MunEDA measured corner-versus-statistical errors above 80 % on $C_{gs}$ and above 30 % on gain on a 65 nm kit, and lists what corners cannot do: check analog performance variability, estimate yield [42][43].
- Field failures are a different population: a Cadence engineer puts 95 % of them on the analog elements (trade press, unverified attribution) [42]. Those are aging and defects, which the end-of-life and fault-simulation tools cover and the pre-silicon statistical gate does not [44][45].

### What the flow is missing

Read against gates G0 to G7: every one is legality or parametric. There is no functional gate, and the evidence says the functional bugs are the ones that kill a chip. That is the largest factor in the product the flow does not yet cover, and it is the cheapest to add once the benches are code: every mode and control bit is a loop, and the agent can write the loop.

### Corners and Monte Carlo, together

- Foundry corners carry global variation; local mismatch is always Monte Carlo. The standard combination is global corners × supply × temperature with mismatch-only Monte Carlo at each corner, never process Monte Carlo stacked on a corner model, which counts global variation twice [46][43]. The GLOVA paper names the three configurations in use: corners only, corners plus local MC, corners plus global-and-local MC [47].
- Find the worst corner first, then go high-sigma there for replicated cells. Solido's bandgap example is 36 PVT corners × 300 Monte Carlo samples, then 20,000 high-sigma samples at the worst corner; Google's bitcell flow does the same to beyond 6σ [48][49].
- Digital corner sets break down for analog at advanced nodes; Cadence builds 3σ statistical corners from about 200 samples instead of 2,000 [23].

### The numbers

- 3σ at 95 % confidence: 2,200 to 2,300 Monte Carlo samples with zero fails [10][22][23].
- Block sigma from chip yield: $Y_\mathrm{block} = Y_\mathrm{chip}^{1/N}$ over $N$ instances [26].
- Re-run corners and Monte Carlo on the extracted netlist with coupling. The tuning misses hide there [43][50].

### Insurance that works, and its cost

- Trim, calibration, programmability and observability turn a parametric miss into a register write. Digitally assisted analog cut an amplifier's power 62 % with a post-processor costing 3.6 % of the power and 18 % of the area [51]. Calibration on a 10-bit SAR halved the ENOB sigma, 0.24 to 0.12 bits, over 1,000 Monte Carlo runs [52]. Jennic "put in as much programmability and digital trimming as possible" and kept metal-trim sites a single mask deep; Analog Devices adds an auxiliary ADC and analog muxes for test modes [53].
- The cost is Kundert's: every control bit is a place for a functional bug, so the functional gate has to cover all of them [38].
- Coverage for analog means binned measurements plus assertions on real-valued and electrical nodes, Cadence's metric-driven mixed-signal flow, not line coverage [54]. IEEE 2427-2025 defines defect coverage for the test side [55].

### A sign-off criterion that tracks P(success)

Write P(success) as a product of four factors and give each a measurement.

| Factor | Gate | Green means |
|---|---|---|
| legal | G3, G4, plus ERC, antenna, density, off-grid, ESD path, latch-up | binary, with a written waiver list [56][57] |
| functional | G1f, new | every mode and control bit exercised in a self-checking run; connectivity and polarity assertions; start-up at slow and fast supply ramps; power sequencing; level shifters and isolation; register map; the control path co-simulated with the digital on pin-accurate models [38][39][41][54] |
| parametric | G1, G2, G5 | corners × mismatch-only Monte Carlo on the extracted netlist with coupling; the Clopper-Pearson lower bound at or above the yield target at 95 %, with the sample count that implies; for a minimum-objective block, the least cost whose bound still clears it (section 1); the worst corner found first, then high-sigma for replicated cells [10][46][48] |
| reliable | G6 | end-of-life aging under a mission profile with variation, electromigration, IR drop, safe operating area; defect coverage reported [44][45][55] |

What none of this fixes stays as the flow post lists it: model error, integration, defects, test. The claim that analog is avoided because of tapeout variability is half right. The studies say the respins are dominated by functional and interface errors and by spec churn, and the parametric misses by models that were wrong, not by statistical variation that was analysed and missed. Variation is the part a flow can bound at design time, to a stated confidence. The functional part it can bound with exhaustive mode simulation, which is cheap once the benches are code. The model part it can only insure against, with trim and observability.

## Sources

1. K. Antreich, H. Graeb, C. Wieser, "Circuit analysis and optimization driven by worst-case distances", IEEE TCAD 13(1), 1994, doi:10.1109/43.273749; H. Graeb, *Analog Design Centering and Sizing*, Springer, 2007, ch. 5 to 7, doi:10.1007/978-1-4020-6004-5
2. X. Pan, H. Graeb, "Lifetime yield optimization of analog circuits considering process variations and parameter degradations", in *Advances in Analog Circuits*, InTech, 2011: https://cdn.intechopen.com/pdfs/13832/InTech-Lifetime_yield_optimization_of_analog_circuits_considering_process_variations_and_parameter_degradations.pdf
3. R. H. Lopez, A. T. Beck, "Reliability-based design optimization strategies based on FORM: a review", J. Braz. Soc. Mech. Sci. Eng. 34(4), 2012, doi:10.1590/S1678-58782012000400012
4. X. Du, W. Chen, "Sequential optimization and reliability assessment method for efficient probabilistic design", J. Mech. Des. 126(2), 2004 (unverified); Y. Aoues, A. Chateauneuf, "Benchmark study of numerical methods for reliability-based design optimization", Struct. Multidisc. Optim. 41, 2010, doi:10.1007/s00158-009-0412-2
5. F. Schenkel, M. Pronath, S. Zizala, R. Schwencker, H. Graeb, K. Antreich, "Mismatch analysis and direct yield optimization by spec-wise linearization and feasibility-guided search", DAC 2001: https://www.cs.york.ac.uk/rts/docs/SIGDA-Compendium-1994-2004/papers/2001/dac01/pdffiles/50_3.pdf
6. R. Schwencker, F. Schenkel, M. Pronath, H. Graeb, "Analog circuit sizing using adaptive worst-case parameter sets", DATE 2002 (unverified)
7. D. Mueller-Gritschneder, H. Graeb, "Computation of yield-optimized Pareto fronts for analog integrated circuit specifications", DATE 2010, doi:10.1109/DATE.2010.5456971
8. J. E. Smith, R. L. Winkler, "The optimizer's curse: Skepticism and postdecision surprise in decision analysis", Management Science 52(3), 2006, doi:10.1287/mnsc.1050.0451
9. W.-K. Mak, D. P. Morton, R. K. Wood, "Monte Carlo bounding techniques for determining solution quality in stochastic programs", Operations Research Letters 24, 1999: https://calhoun.nps.edu/server/api/core/bitstreams/5dc4883b-9992-4814-924a-a70b1e7cf3cf/content
10. Cadence, US patent 9,805,158, "binomial pass confidence" via a one-sided Clopper-Pearson interval, more than 2,300 points for 3σ at 95 %: https://patents.google.com/patent/US9805158B1/en; A. Schaldenbrand (Cadence), "Tools and techniques for the implementation of variation-aware custom IC designs", eeNews Europe, 2017: https://www.eenewseurope.com/en/tools-and-techniques-for-the-implementation-of-variation-aware-custom-ic-designs/
11. Thalia Design Automation, US patent 10,055,527: https://patents.google.com/patent/US10055527B2/en
12. Keysight, ADS 2011.01 "Tuning, Optimization, and Statistical Design": https://edadownload.software.keysight.com/eedl/ads/2011_01/pdf/optstat.pdf
13. L. Tan, Y. Zhao, B. F. Jamroz, A. Feldman, Z. Zhang, "Simulation-Efficient Analog Circuit Yield Optimization via Monte Carlo Zeroth-Order Gradient Estimation", arXiv:2609.30678, 2026: https://arxiv.org/abs/2609.30678
14. P. Kinget, "Device mismatch and tradeoffs in the design of analog circuits", IEEE JSSC 40(6), 2005, doi:10.1109/JSSC.2005.848021; P. Kinget, "Device mismatch: an analog design perspective", ISCAS 2007: https://designers-guide.org/forum/Attachments/Device_Mismatch__An_Analog_Design_Perspective.pdf
15. P. Drennan, C. McAndrew, "Understanding MOSFET mismatch for analog design", IEEE JSSC 38(3), 2003, doi:10.1109/JSSC.2002.808305
16. S. J. Lovett, M. Welten, A. Mathewson, B. Mason, "Optimizing MOS transistor mismatch", IEEE JSSC 33(1), 1998, doi:10.1109/4.654947 (unverified)
17. Y. Pan, Z. He, N. Guo, Z. Zhang, "Distributionally Robust Circuit Design Optimization under Variation Shifts", arXiv:2308.08111, 2023: https://arxiv.org/abs/2308.08111
18. M. Cortez, R. Laird (Synopsys), "Reducing design margins with silicon model calibration", Semiconductor Engineering, 2024: https://semiengineering.com/reducing-design-margins-with-silicon-model-calibration/
19. M. C. Campi, S. Garatti, "The exact feasibility of randomized solutions of uncertain convex programs", SIAM J. Optim. 19(3), 2008: https://garatti.faculty.polimi.it/Publications/Journals/2008_campi-garatti.pdf; G. Calafiore, M. C. Campi, "The scenario approach to robust control design", IEEE TAC 51(5), 2006, doi:10.1109/TAC.2006.875041
20. T. Alamo, R. Tempo, A. Luque, D. R. Ramirez, "Randomized Methods for Design of Uncertain Systems: Sample Complexity and Sequential Algorithms", arXiv:1304.0678: https://arxiv.org/abs/1304.0678
21. M. C. Campi, S. Garatti, F. A. Ramponi, "A general scenario theory for nonconvex optimization and decision making", IEEE TAC 63(12), 2018, doi:10.1109/TAC.2018.2808446; M. C. Campi, S. Garatti, "Wait-and-judge scenario optimization", Math. Program. 167, 2018, doi:10.1007/s10107-016-1056-9
22. Rule of three (statistics): https://en.wikipedia.org/wiki/Rule_of_three_(statistics)
23. Cadence, "Monte Carlo analysis at advanced nodes", white paper: https://www.cadence.com/en_US/home/resources/white-papers/monte-carlo-analysis-at-advanced-nodes-wp.html; Cadence blog, "The Art of Analog Design, Part 2: Monte Carlo Sampling": https://community.cadence.com/cadence_blogs_8/b/cic/posts/the-art-of-analog-design-part-2-monte-carlo-sampling
24. X. Wang, C. Yan, Y. Ma, B. Yu, F. Yang, D. Zhou, X. Zeng, "Analog Circuit Yield Optimization via Freeze-Thaw Bayesian Optimization Technique", IEEE TCAD 41(11), 2022: https://www.cse.cuhk.edu.hk/~byu/papers/J74-TCAD2022-Yield-OPT.pdf; the earlier GP-based optimizer: IEEE TCAD 37, 2018, doi:10.1109/TCAD.2017.2778061
25. J. Tu et al., "RSizing: Robust Bayesian Optimization for Analog Circuit Sizing Under Process Variations", ICCAD 2025: https://www.cse.cuhk.edu.hk/~byu/papers/C287-ICCAD2025-RSizing.pdf
26. P. B. Y. Tan, A. V. Kordesch, O. Sidek (Silterra), "How to Design for Analog Yield using Monte Carlo Mismatch SPICE Models", Nanotech 2005 WCM: https://briefs.techconnect.org/wp-content/volumes/Nanotech2005WCM/pdf/1031.pdf
27. X. Xu, N. Shah, A. Evans, S. Sinha, B. Cline, G. Yeric (Arm), "Standard Cell Library Design and Optimization Methodology for ASAP7 PDK", ICCAD 2017: https://arxiv.org/abs/1807.11396
28. C. Chiasson, V. Betz, "COFFE: Fully-automated transistor sizing for FPGAs", FPT 2013: https://www.eecg.utoronto.ca/~vaughn/papers/fpt2013_coffe.pdf
29. S. Yazdanshenas, V. Betz, "COFFE 2: Automatic Modelling and Optimization of Complex and Heterogeneous FPGA Architectures", ACM TRETS 12(1), 2019, doi:10.1145/3301298; S. Yazdanshenas, *Datacenter-optimized FPGAs*, PhD thesis, University of Toronto, 2019, ch. 9: https://utoronto.scholaris.ca/bitstream/1807/97003/3/Yazdanshenas_Sadegh_201906_PhD_thesis.pdf
30. K. Guo, J. Huang, W. Yu, Y. Lin, "CAPCell: Standard Cell Layout Synthesis with Parasitic Capacitance Aware Parallel Sampling", ISEDA 2026: https://yibolin.com/publications/papers/CELL_ISEDA2026_Guo.pdf
31. H. Zhang, K. Guo, B. Zhang, Y. Lin, R. Wang, "FusionCell: Cross-Attentive Fusion of Layout Geometry and Netlist Topology for Standard-Cell Performance Prediction", arXiv:2605.20287, 2026: https://arxiv.org/abs/2605.20287
32. H. Ren, G. F. Kokai, W. J. Turner, T. Ku, "ParaGraph: Layout Parasitics and Device Parameter Prediction using Graph Neural Networks", DAC 2020, doi:10.1109/DAC18072.2020.9218515
33. M. Liu, W. J. Turner, G. F. Kokai, B. Khailany, D. Z. Pan, H. Ren, "Parasitic-Aware Analog Circuit Sizing with Graph Neural Networks and Bayesian Optimization", DATE 2021, doi:10.23919/DATE51398.2021.9474253
34. N. Lourenço, R. Martins, N. Horta, "Layout-Aware Sizing of Analog ICs using Floorplan & Routing Estimates for Parasitic Extraction", DATE 2015: https://past.date-conference.com/proceedings-archive/2015/pdf/0411.pdf
35. H. Foster (Siemens), 2020 Wilson Research Group functional verification study, part 12: https://blogs.sw.siemens.com/verificationhorizons/2021/02/03/part-12-the-2020-wilson-research-group-functional-verification-study/
36. H. Foster (Siemens), 2022 Wilson Research Group functional verification study, part 12: https://blogs.sw.siemens.com/verificationhorizons/2023/01/09/part-12-the-2022-wilson-research-group-functional-verification-study/; Semiconductor Engineering, "Analog creates ripples in digital verification": https://semiengineering.com/analog-creates-ripples-in-digital-verification/
37. Siemens, "Why first-silicon success is getting harder for system companies", 2025: https://blogs.sw.siemens.com/verificationhorizons/2025/09/03/why-first-silicon-success-is-getting-harder-for-system-companies/; Semiconductor Engineering, "First-time silicon success plummets": https://semiengineering.com/first-time-silicon-success-plummets/; 2024 trend report: https://verificationacademy.com/topics/planning-measurement-and-analysis/wrg-industry-data-and-trends/2024-siemens-eda-and-wilson-research-group-ic-asic-functional-verification-trend-report/
38. K. Kundert, H. Chang, "Verification of complex analog and RF IC designs", Proc. IEEE 95(3), 2007, doi:10.1109/JPROC.2006.889383; CICC 2006 version: https://kenkundert.com/docs/cicc06.pdf
39. H. Chang, K. Kundert, "Introduction to analog verification", 2009: https://kenkundert.com/docs/av-intro.pdf
40. K. Kundert, "Analog verification", IEEE SSCS Santa Clara Valley chapter talk, 2009: https://ewh.ieee.org/r6/scv/ssc/pdfs/Jan1509.pdf
41. Infineon and Mentor, "Power-aware verification in mixed-signal simulation", DVCon: https://dvcon-proceedings.org/wp-content/uploads/power-aware-verification-in-mixed-signal-simulation.pdf
42. Semiconductor Engineering, "Increase in analog problems": https://semiengineering.com/increase-in-analog-problems/; "Making analog more reliable": https://semiengineering.com/making-analog-more-reliable/
43. M. Sylvester (MunEDA), MOS-AK Munich 2013: https://www.mos-ak.org/munich_2013/presentations/02_Matthias_Sylvester_MOS-AK_Munich_2013.pdf
44. Cadence, Legato Reliability Solution datasheet: https://www.cadence.com/en_US/home/resources/datasheets/legato-reliability-solution-ds.html; T. Guo (Cadence), MOS-AK Beijing 2018: https://www.mos-ak.org/beijing_2018/presentations/Tianlei_Guo_MOS-AK_Beijing_2018.pdf
45. Synopsys, PrimeSim Reliability Analysis: https://www.synopsys.com/implementation-and-signoff/ams-simulation/primesim-reliability-analysis.html; datasheet: https://www.synopsys.com/content/dam/synopsys/implementation&signoff/datasheets/primesim-reliability-analysis-ds.pdf
46. A. Beckett (Cadence), "Monte Carlo simulation: global/local vs local, and process vs mismatch", Cadence Community: https://community.cadence.com/cadence_technology_forums/f/custom-ic-design/20466/monte-carlo-simulation-global-local-vs-local-and-process-vs-mismatch
47. D. Kim et al., "GLOVA: Global and Local Variation-Aware Analog Circuit Design with Risk-Sensitive Reinforcement Learning", arXiv:2505.11208, 2025: https://arxiv.org/abs/2505.11208
48. SemiWiki, "Using ML for statistical circuit verification" (Solido PVTMC Verifier): https://semiwiki.com/eda/siemens-eda/328065-using-ml-for-statistical-circuit-verification/; DeepChip, DAC 2019 user report on Solido: http://www.deepchip.com/items/dac19-06a.html
49. Siemens, "Google team accelerates high-sigma bitcell validation with Solido Design Environment", 2026: https://blogs.sw.siemens.com/cicv/2026/03/04/google-team-accelerates-high-sigma-bitcell-validation-with-solido-design-environment/
50. X-Fab, "Getting to first-time-right in analog/mixed-signal designs", EDN: https://www.edn.com/getting-to-first-time-right-in-analog-mixed-signal-designs/; C. Wulff, AIC 2026 design review checklists: https://analogicus.com/aic2026/analog_design
51. B. Murmann, "Digitally assisted analog circuits", Hot Chips 17, 2005: https://old.hotchips.org/wp-content/uploads/hc_archives/hc17/3_Tue/HC17.S5/HC17.S5T3.pdf; IEEE Micro 26(2), 2006, doi:10.1109/MM.2006.33
52. 10-bit SAR ADC with calibration, Sensors 18(10):3486, 2018, doi:10.3390/s18103486: https://pmc.ncbi.nlm.nih.gov/articles/PMC6210042/
53. R. Wilson, "Design for debugging: the unspoken imperative in chip design", EDN: https://www.edn.com/design-for-debugging-the-unspoken-imperative-in-chip-design/; Synopsys, Silicon Lifecycle Management SHS IP: https://www.synopsys.com/solutions/silicon-lifecycle-management/synopsys-ip-shs.html
54. Cadence (Brennan et al.), "The how-tos of advanced mixed-signal verification", DVCon: https://dvcon-proceedings.org/wp-content/uploads/the-how-tosof-advanced-mixed-signal-verification.pdf
55. IEEE 2427-2025, Standard for Analog Defect Modeling and Coverage; Semiconductor Engineering, "Standardizing defect coverage in analog/mixed-signal test": https://semiengineering.com/standardizing-defect-coverage-in-analog-mixed-signal-test/
56. HiSilicon-style tapeout checklist: https://www.ic-online.com/blog/post/avoid-tape-out-failure-with-this-hisilicon-checklist
57. University tapeout checklist: https://docs-ee.readthedocs.io/en/latest/design/tapeout.html; Efabless MPW precheck: https://github.com/efabless/mpw_precheck; Tiny Tapeout analog specs: https://tinytapeout.com/specs/analog/
