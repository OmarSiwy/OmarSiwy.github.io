There are a few pieces of tooling that are part of my research, and the reasoning for them are below.

Thesis: Analog Design involves a lot of *iterative* work, and using LLMs, the design work can be accelerated, but the bottleneck remains the tooling that is used by LLMs (Simulators & Design Aiding tools), as a result, these tools become more crucial than ever to be (1) fast, and an undervalued aspect is FULLY customizable from the user's prespective so they aren't limiting in terms of degrees of freedom (2).

As a result, I've undertaken a few Analog Tooling Projects that have been continious for a year, recently picking up the pace more (because I made this prediction a year ago).
1) ESpice [A SPICE Simulator]
github.com/OpenFAT/ESpice

Based on a heavy bet. Most simulators have heavy floating point math, meaning SIMD, Multithreading, and offloading to the GPU (if there is one), WOULD GREATLY IMPROVE PERFORMANCE. You would be surprised about the LACK of all these optimziations in NGSpice, Xyce, and Vacask. Leading to slower device evaluation (that depends on FLOPS). Hence thats the whole purpose of my simulator, how can we offload our circuits to the gpu for faster evaluation, and another consequence that wasn't initially explored but discovered is that a size sweep can be done much faster because we can run 10 different points at once, or even many more points so we can converge faster or find the *Pareto Range* (range of values that produces a correct answer) faster.

2) VerA [A Verilog-A/AMS Simulator]
github.com/OpenFAT/VerA

The only open-source software that allows me to

3) Schemify [A Schematic Editor]
github.com/OpenFAT/Schemify
A Schematic Editor seems redundant, we have Cadence Virtuoso, XSchem, etc.. However if you realize, to interact with such a software with LLMs they use a scripting language SKILL or TCL, and those aren't user-friendly as much as programming language like (Python, etc...) are.

As a result, LLMs also struggle because their dataset for that is much smaller, so the best approach is a fully customizable (allowing plugins) schematic editor that allows you to use real languages to interface with it.

Q: Why not fork XSchem? Its heavily dependant on TCL, from the rendering, to the ABI.

This Schematic Editor wasn't the main idea, it was the plugins below that will let me Co-Work with the LLM. What do I mean Co-Work? LLMs work best with netlists, Humans work best with Visual schematics, we need a middleground to work with, thats why the LLM can write netlists and use the plugin below (cktImg) to generate a circuit for us to see, and we can modify it and dump a netlist for him if we have any changes. SpiceRack exists because there are testbenches that are just redundant so its easier to have them pre-ready for the LLM to use instead of having to waste his thinking on creating them. Also, to work later on with propietary PDKs that use spectre dialect by translating it (heavily helps with benchmarking against other SPICE softwares btw because it allows me to switch their dialect to ours).

- SpiceRack [Python -> Spice + built-in testbenches, to dump different Spice Dialects]
- cktImg [Uses SpiceRack's SPICE dump to generate schematic to visualize circuit for user]

