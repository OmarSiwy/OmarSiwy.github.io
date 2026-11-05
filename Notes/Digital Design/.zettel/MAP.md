# MAP — Digital Design zettelkasten

427 circuits · 12 concepts · 32 comparisons · 35 hubs = **506 files**
88 low-traffic concepts folded into hub prose.

## S1 Boolean Algebra  (7)

- **Choosing a Logic Realization** — comparison
- Two-Level SOP Network
- Two-Level POS Network
- NAND-NAND Network
- NOR-NOR Network
- Multi-Level Factored Network
- Shannon Expansion Multiplexer — aka Shannon Expansion
- Karnaugh Map _(concept)_ — aka Karnaugh Maps

  folded into hub: Minterm and Maxterm Canonical Forms · Quine-McCluskey · Huntington's Postulates · De Morgan's Laws · Consensus Theorem · Functional Completeness · Literal Count and Logic Depth

## S2 Combinational Logic  (12)

- **Choosing a Combinational Block** — comparison
- Binary Decoder
- Predecoder
- Demultiplexer
- Binary Encoder
- Priority Encoder
- Multiplexer Tree
- One-Hot Multiplexer
- Transmission-Gate Multiplexer
- XOR Parity Tree
- Logic Hazards _(concept)_ — aka Hazards and Glitches
- Hazard-Free Two-Level Cover
- Logical Effort _(concept)_ `n-a`

  folded into hub: Propagation and Contamination Delay

## S3 Flip-Flops and Latches  (12)

- **Choosing a Storage Element** — comparison
- Cross-Coupled Inverter Bistable `not-expressible`
- SR Latch `not-expressible`
- Transparent D Latch `not-expressible` — aka Level-Sensitive D Latch
- Switch Debouncer `not-expressible`
- Master-Slave D Flip-Flop — aka D Flip-Flop
- JK Flip-Flop
- T Flip-Flop
- Setup and Hold Constraints _(concept)_ `n-a` — aka Setup and Hold Time, Single-Cycle Timing Constraint
- Clock Skew and Jitter _(concept)_ `n-a` — aka Clock Skew
- Synchronizer Chain — aka Two-Flop Synchronizer
- Clock Enable Flip-Flop — aka Enable Flip-Flop
- Integrated Clock-Gating Cell `not-expressible` — aka Integrated Clock Gating Cell

  folded into hub: Metastability and MTBF

## S4 Dual-Phase Latches  (8)

- **Choosing a Latch Timing Scheme** — comparison
- Two-Phase Latch Pipeline `not-expressible`
- Non-Overlapping Two-Phase Clock Generator `not-expressible`
- Pulsed Latch `not-expressible`
- Clock Pulse Generator `not-expressible`
- Clock-Gated Latch Bank `not-expressible`
- Recirculating-Mux Latch Bank `not-expressible`
- LSSD Scan Latch Pair `not-expressible`
- Programmable Local Clock Buffer `not-expressible`

  folded into hub: Time Borrowing · Latch Race-Through · Latch Loop Timing Analysis · Flip-Flop to Latch Conversion

## S5 Synchronous Sequential Logic  (13)

- **Choosing an FSM Encoding** — comparison
- Canonical FSM Structure
- Moore Machine — aka Moore
- Mealy Machine — aka Mealy
- State Transition Graph — aka State Table
- Binary State Encoding — aka State Encoding
- One-Hot State Encoding
- Gray Code State Encoding
- Safe-State FSM Recovery
- FSMD Controller-Datapath Split
- Pipeline Register Insertion
- Retiming
- C-Slow Retiming
- 1011 Sequence Detector

  folded into hub: Synchronous Discipline · State Minimization

## S6 Asynchronous Sequential Logic  (15)

- **Choosing an Asynchronous Style** — comparison
- Huffman Feedback Model `not-expressible`
- Race-Free State Assignment `not-expressible`
- Asynchronous Cycle `not-expressible`
- Muller C-Element `not-expressible`
- Muller Pipeline `not-expressible`
- Micropipeline `not-expressible`
- Bundled-Data Interface `not-expressible`
- Four-Phase Handshake `not-expressible`
- Two-Phase Handshake `not-expressible`
- Dual-Rail Encoding
- 1-of-4 Encoding
- Completion Detection Tree
- Matched Delay Line `n-a`
- Mutual Exclusion Element `not-expressible`
- Asynchronous FIFO

  folded into hub: Primitive Flow Table · Essential Hazard · Quasi-Delay-Insensitive Circuits

## S7 Number Formats  (10)

- **Choosing a Number Format** — comparison
- Signed Fixed-Point Format _(concept)_
- Two's Complement Negator
- Sign-Magnitude to Two's Complement Converter
- Sign Extension
- Fixed-Point Format Narrowing
- Carry-Free Signed-Digit Adder
- IEEE 754 Format _(concept)_
- Nfloat Format _(concept)_
- LNS Multiplier
- LNS Adder

  folded into hub: Unsigned Fixed-Point Format · Sign-Magnitude Format · High-Radix Digit Grouping · Signed-Digit Number System · Subnormal Encoding · Biased Exponent Encoding · Minifloat Formats · Logarithmic Number System

## S8 Error Accuracy  (10)

- **Choosing a Rounding Mode** — comparison
- Truncation Unit
- Round-to-Nearest Ties-Up
- Round-to-Nearest Ties-to-Even
- Directed Rounding Unit
- Saturating Overflow Unit
- Half-Unit Biased Format
- Faithful Operator
- Faithful Multiplier by Pi
- Correctly-Rounded Product Table
- Error Analysis _(concept)_ `n-a`

  folded into hub: Absolute and Relative Error · Unit in the Last Place · Parametric Operator Design · Table Maker's Dilemma

## S9 FPGAs  (11)

- **Choosing an FPGA Primitive** — comparison
- Lookup-Tables
- Basic Logic Element
- Fracturable LUT
- AMD BLE
- Intel ALM
- Fast Carry Chain
- DSP Blocks
- Three-Multiplication Complex Product
- Distributed Memory
- Shift Register LUT
- Block Memory

  folded into hub: FPGA Fabric · FPGA-ASIC Performance Gap

## S10 Adders  (25)

- **Choosing an Adder** — comparison
- Full Adder
- Half Adder
- RCA, Ripple-Carry Adder — aka Ripple-Carry Adder
- Saturating Adder
- Two's Complement Adder/Subtractor
- CSA, Carry-Save Adder — aka Carry-Save Adder
- High-Radix Carry-Save Adder
- Switched Ripple-Carry Adder
- Carry-Select Adder
- Conditional-Sum Adder
- CLA, Carry-Lookahead Adder — aka Carry-Lookahead Adder
- Hierarchical Carry-Lookahead Adder
- Parallel Prefix Adders _(concept)_
- Kogge-Stone Tree
- Brent-Kung Tree
- Sklansky Tree
- Compound Adder
- Absolute Difference Operator
- Compound Triple Sum
- FPGA Hard Carry Chain Adder
- LUT-Merged Adder
- Ternary Adders on FPGAs — aka Ternary Adder
- Sign-Configurable Adder/Subtractor
- Pipelined Ripple-Carry Adder
- AAM Carry-Select Adder

## S11 Comparators  (7)

- **Choosing a Comparator** — comparison
- Equality Comparator
- Magnitude Comparator
- Two's-Complement Comparator
- Binary Tree Comparator
- Fast Carry Chain Comparator
- Two-Level Fast Carry Comparator
- Constant Comparator

## S12 Sums of Weighted Bits  (16)

- **Choosing a Compressor Tree** — comparison
- Bit Heaps _(concept)_
- Merged Multiply-Accumulate
- Constant-One Sign Extension
- Single-Heap Polynomial Evaluation
- Truncated Bit Heap
- Compressor Trees
- Dadda Tree
- Reduced Area Compressor Tree
- Wallace Tree
- Parallel Counter
- 4:2 Compressor
- Carry-Chain 4:2 Compressor
- Generalized Parallel Counter
- Efficiency-Driven Compression Heuristic
- Pipelined Compressor Tree
- Split Final Adder

  folded into hub: Operator Fusion vs Resource Sharing · Constant Bit Merging · Algebraic Dot Transformations · ILP-Based Compressor Tree Synthesis

## S13 Multipliers  (17)

- **Choosing a Multiplier** — comparison
- Unsigned Array Multiplier
- Baugh-Wooley Multiplier
- Booth's Algorithm
- Bewick Radix-8 Multiplier
- Unsigned DSP Multiplier Packing
- Signed DSP Multiplier Packing
- Multiplier Tiling
- LUT-Based Multiplier Tiles
- Carry-Chain Multiplier Tile
- DSP Super-Tile
- Correctly Rounded Multiplier
- Truncated Multipliers
- Karatsuba
- Subtractive Karatsuba
- K-Part Karatsuba Splitting
- Recursive Karatsuba
- Rectangular Karatsuba

  folded into hub: Multiplier Tiling ILP · Optimally Truncated Multiplier Tiling · Multiplier Error Propagation

## S14 Dividers  (18)

- **Choosing a Divider** — comparison
- Restoring Division
- Non-Restoring Division
- SRT Division
- Radix-4 Maximally Redundant Divider
- Quotient Digit Selection Table
- Comparison-Based Digit Selection
- Divisor Prescaling
- On-the-Fly Quotient Conversion
- Carry-Save Partial Remainder
- Radix-64 Speculative Divider
- Division by Reciprocal
- Reciprocal Seed Table
- Newton-Raphson Reciprocal
- Quadratic Series Divider
- Goldschmidt Division
- Halley Reciprocal Iteration
- VFloat Ad Hoc Series Divider
- Newton-Raphson Square Root

  folded into hub: P-D Diagram

## S15 Shifters  (16)

- **Choosing a Shifter** — comparison
- Exact Full Shifter
- Barrel Shifters — aka Barrel Shifter
- Truncated Shifter
- Shifter with Sticky Bit Computation — aka Sticky Bit Computation
- Bidirectional Shifter
- One-Hot Shifter
- Shift by Multiplier
- Sporadic Shifter
- Leading Zero Counters — aka Leading Zero Counter
- Leading Bit Counter
- Oklobdzija LZC Tree
- Monotonic String Leading Zero Counter
- Leading Zero Anticipation
- Normalizers — aka Normalizer
- Fused Normalizer
- Sequential Normalizer

## S16 Floating-Point Operators  (18)

- **Choosing a Floating-Point Operator** — comparison
- Exponent Difference and Swap Unit
- Floating-Point Adder
- Dual-Path Floating-Point Adder
- Leading Zero Anticipator
- Speculative Floating-Point Adder
- Sticky Bit Generator
- Floating-Point Rounding Adder
- Floating-Point Exception Handling
- Subnormal Normalization Unit
- Floating-Point Multiplier
- Faithful Floating-Point Multiplier
- Injection Rounding
- Floating-Point Divider
- Correct Rounding from Faithful Quotient
- Floating-Point Square Root
- Faithful Square Root Normalization Unit
- Left-Truncated Squarer
- Floating-Point Comparator

## S17 Counters  (17)

- **Choosing a Counter** — comparison
- Incrementer
- Prefix Incrementer
- Synchronous Counters
- Up-Down Counter
- Asynchronous Counters
- Cascaded Counter Chain
- Two-Stage Prescaled Counter
- Modulo-N Counter
- Preload-and-Overflow Counter
- Zero-Detect Down Counter
- Gray Counter — aka Gray Code Counter
- Gray Code Converter — aka Gray Code
- Fibonacci LFSR
- Galois LFSR
- De Bruijn Counter
- Ring Counter
- Johnson Counter

## S18 Multiplication by Constants  (20)

- **Choosing a Constant Multiplier** — comparison
- Binary Shift-and-Add Constant Multiplier — aka Shift-and-Add
- CSD Constant Multiplier
- Minimum-Adder Constant Multiplier
- Ternary-Adder Constant Multiplier
- Minimum Full-Adder Constant Multiplier
- Tabulated Constant Multiplier
- KCM, Table-Based Constant Multiplication
- Tabulated Perfectly Rounded Constant Multiplier
- Faithful Shift-and-Add Real Constant Multiplier
- Fix-by-Real KCM
- Periodic Shift-and-Add Rational Constant Multiplier
- Rational-Constant KCM Table
- Multiple Constant Multiplication
- Pipelined Adder Graph
- Table-Based Multiple Constant Multiplication
- Sum of Constant Products
- Constant Matrix Multiplier
- KCM-Based Sum of Products
- DSP-Block Constant Multiplier
- Reconfigurable Constant Coefficient Multiplier

  folded into hub: SCM ILP Model

## S19 Division by Constants  (8)

- **Choosing a Constant Divider** — comparison
- Recip Constant Divider
- Constant Division Digit Table
- Sequential Constant Divider
- LinArch Divider
- Remainder-Only LinArch
- Binary Tree Constant Divider
- Remainder-Only BTCD
- Composite Constant Divider

  folded into hub: Magic Constant Exactness Condition · Divisor Factorisation Search

## S20 Squarers and Integer Powers  (11)

- **Choosing a Squarer** — comparison
- Folded Array Squarer
- High-Radix Squarer
- DSP-Cascade Squarer
- Booth-Recoded Squarer
- Truncated Squarer
- Squarer Tiling
- Squarer Staircase Tile
- Diagonal-Straddling Squarer Tile
- Cube Bit Heap
- Square-and-Multiply Power Chain
- Faithful Fixed-Point Power

  folded into hub: Integer Power Output Format

## S21 Floating-Point Specialization  (16)

- **Choosing a Specialized Floating-Point Operator** — comparison
- Floating-Point Multiplier by a Power of Two
- Faithful Floating-Point Constant Multiplier
- Product Normalization Predictor
- Correctly Rounded Floating-Point Constant Multiplier
- Pseudo-Sticky Tie Anticipation
- Floating-Point Multiplier by a Rational Constant
- Saturated Normalizer
- Constant Multiplier with Subnormal Support
- Floating-Point Divider by a Small Odd Constant
- Dividend Bias Rounding
- Floating-Point Power Operator
- Positive-Term Floating-Point Adder
- Fused Add-Subtract Unit
- Fused Multiply-Add
- Fused Sum of Squares
- Divide-by-Self Specialization

  folded into hub: Constant Truncation for Correct Rounding · Unsafe Floating-Point Rewrites

## S22 Fixed-Point Function Approximation  (11)

- **Choosing a Function Approximation Method** — comparison
- Function Table ROM
- LUT-Array Function Table
- Synthesized Logic Table
- Hard ROM Macro
- Output Format Widening
- Saturating Output Clamp
- Round-Down Table Fill
- Output Range Scaling
- Tabulated Reciprocal
- Modular Squaring Table
- Residual-Sign Rounding Unit

  folded into hub: Fixed-Point Range Wrap · Faithful Rounding Monotonicity · Function Domain Normalization

## S23 Table-Based Function Evaluation  (12)

- **Choosing a Table Method** — comparison
- LDTC, Lossless Differential Table Compression
- Bipartite Table Method
- Symmetric Table of Offsets
- Multipartite Methods
- Multipartite with Compressed TIV
- HUB Table Filling
- Monotonic Multipartite Tables
- ILP-Optimized Multipartite Tables
- ATA, Addition-Table-Addition
- Central-Difference ATA
- STAM, Symmetric Table Addition Method
- Partial Product Array Function Evaluation

  folded into hub: LDTC Parameter Search · Multipartite Guard-Bit Budget · Multipartite Decomposition Search

## S24 Polynomial Approximation  (15)

- **Choosing a Polynomial Evaluator** — comparison
- Remez Minimax _(concept)_ `n-a`
- Polynomial Coefficient Table
- Uniform Piecewise Segmentation
- Logarithmic Segmentation
- Hierarchical Segmentation
- Dichotomy-Based Segmentation
- Function-Value Interpolation
- Addition-Theorem Coefficient Generation
- Horner Evaluation
- Parallel Polynomial Evaluator
- HOTBM
- Estrin's Scheme
- SquareRich Evaluation
- ILP-Optimized Polynomial Evaluator
- Floating-Point Polynomial Function Evaluator

  folded into hub: Machine-Efficient Coefficient Quantization · Polynomial Evaluator Error Budget · Polynomial Approximator Generator Flow · Rational Fraction Approximation

## S25 Digit Recurrence for Algebraic Functions  (10)

- **Choosing a Digit Recurrence** — comparison
- Square Root Range Reduction
- Restoring Square Root
- Non-Restoring Square Root
- SRT Square Root
- Square Root Digit Selection Function
- Square Root Seed Table
- On-the-Fly Converter
- Digit-Recurrence Cube Root
- Digit-Recurrence Euclidean Norm
- E-Method

  folded into hub: Simple E-Fractions

## S26 CORDIC  (10)

- **Choosing a CORDIC Architecture** — comparison
- Octant Argument Reduction
- Sine-Cosine Octant Reconstruction
- CORDIC Rotation Mode
- Unrolled CORDIC
- Reduced-Z CORDIC Datapath
- Iterative CORDIC
- Reduced-Iteration CORDIC
- Table-and-Multiplier Sine and Cosine
- Small-Angle Taylor Sine and Cosine
- Generic Polynomial Sine Evaluator

  folded into hub: Binary Angle Representation · CORDIC Scale Factor Compensation · CORDIC Error Budget

## S27 Exact Accumulators  (12)

- **Choosing an Accumulator** — comparison
- Floating-Point Accumulator Loop
- Exact Sum-of-Products Operator
- Exact Unnormalized Multiplier
- Sign-Padding Alignment Shifter
- Two's-Complement Exact Accumulator
- Kulisch Accumulator
- Application-Specific Exact Accumulator
- High-Radix Carry-Save Accumulator
- Sign-Magnitude Accumulator
- Accumulator Exception FSM
- Accumulator-to-Float Converter
- Three-Zone Accumulator Converter

  folded into hub: Exact Accumulation Reproducibility

## S28 Floating-Point Exponential  (14)

- **Choosing an Exponential Architecture** — comparison
- FPExp Operator
- Exponential Special-Case Unit
- Direct Tabulation Exponential
- Split-Table Exponential
- Exponential Fixed-Point Converter
- Tentative Exponent Unit
- Reduced Argument Subtractor
- Exponential Normalize-Round-Pack
- Fixed-Point-In Exponential
- Tabulated e^Y
- Higher-Order e^Y Evaluator
- First-Order e^Y Evaluator
- Polynomial h(Z) Evaluator
- Iterative Table-Based Exponential

  folded into hub: Exponential Guard-Bit Budget

## S29 Fixed-Point Computation of eY  (9)

- **Choosing an eY Architecture** — comparison
- Direct eY Table
- eA Table
- hZ Table
- Polynomial hZ Evaluator
- Higher-Order eY Architecture
- First-Order eY Architecture
- eY DSP and BRAM Mapping
- eY Iterative Reduction Step
- eY Iterative Reconstruction Step

  folded into hub: eY Additive Argument Split · eY Error Budget

## S30 LTI Filters  (13)

- **Choosing a Filter Structure** — comparison
- Tapped Delay Line
- Direct-Form FIR Filter
- Transposed Direct-Form FIR Filter
- Direct Form I IIR Filter
- Transposed Direct Form I IIR Filter
- Direct Form II IIR Filter
- Transposed Direct Form II IIR Filter
- SOPC, Sum of Products by Constants
- Biquad Section
- Biquad Cascade
- Additive Synthesis Filter Bank
- Linear-Phase FIR Filter
- Minimum-Adder FIR Filter

  folded into hub: Worst-Case Peak Gain · IIR Guard-Bit Sizing · Faithful Hardware Digital Filter · FixIIR Generator

## S31 Arithmetic for Deep Learning  (16)

- **Choosing a Deep Learning Datapath** — comparison
- Quantized MAC Neuron
- Requantization Unit
- ReLU Unit
- Softmax Unit
- Argmax Unit
- Max Pooling Unit
- Average Pooling Unit
- Convolution Line Buffer
- Winograd Convolution
- TPU
- XNOR-Popcount Neuron
- Ternary MAC Unit
- Digit-Serial Adder
- LogicNet Neuron
- LNS Neuron
- Log-Activation Shift Neuron

  folded into hub: Batch Normalization Folding · Straight-Through Estimator

## S32 Network-On-Chip  (22)

- **Choosing a Router Architecture** — comparison
- Virtual-Channel Router
- Dimension-Order Routing Unit
- Turn Model Routing
- Dateline Virtual Channel Allocation
- Virtual Channel Buffer
- Crossbar Switch
- Fixed-Priority Arbiter
- Round-Robin Arbiter
- Separable Input-First Allocator
- Wavefront Allocator
- Credit-Based Flow Control
- Store-and-Forward Flow Control
- Virtual Cut-Through Flow Control
- Wormhole Flow Control
- Lookahead Routing
- Speculative Switch Allocation
- Mesochronous Link FIFO
- Dual-Clock Asynchronous FIFO
- Bundled-Data Handshake Link `not-expressible`
- TDM Slot Table Scheduler
- Priority Aging Arbiter
- Deficit Round Robin Scheduler

  folded into hub: Channel Dependency Graph · Interconnect Topology Metrics

## S33 FloPoCo  (6)

- Frequency-Directed Pipelining
- Pipeline Synchronization Delay Line
- Register Sandwich
- Pipelined Floating-Point Adder
- Self-Checking Test Bench
- Shared Bit Heap

  folded into hub: Functional and Performance Specification · FloPoCo Operator Class · Target Class Hierarchy · Lexicographic Circuit Time · ASAP Pipeline Scheduling · Leiserson-Saxe Retiming · BitHeap Framework

## S34 ILP for Arithmetic Design  (2)

- Trailing Zero Counter
- Minimal-Adder Adder Graph

  folded into hub: Linear Programming Relaxation · Mixed-Integer Linear Program · Branch-and-Bound · Boolean Constraint Gadgets · Exactly-One Constraint · Big-M Constraint · Bit-Split Product Constraint · Integer Feasibility Tolerance · ScaLP Solver Interface

