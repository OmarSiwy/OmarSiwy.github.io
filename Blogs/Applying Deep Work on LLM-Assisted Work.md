---
title: Applying Deep Work to LLM-Assisted Work
description: Agentic coding drifts into shallow work and wears down the ability to think. How I stay in the design at every layer, from the first table to the release, with the books, talks and skills behind each step, and an AGENTS.md that hands it to an agent.
publishedAt: 2026-11-07
updatedAt: 2026-11-07
slug: deep-work-llm-assisted
tags:
  - engineering
  - llm
  - testing
draft: false
---
I've been re-reading [_Deep Work_](https://www.amazon.com/dp/1455586692) by Cal Newport. Some of it has aged, and some of it matters more now than in 2016, because of AI. Newport wrote that one of three groups to thrive would be "those who can work well and creatively with intelligent machines". In 2026 that is every programmer with an agent open.

This is my method for it: how to think with an LLM, what to learn first, the order to build in, and how to test, build and ship. It ends with an `AGENTS.md` that hands the method to an agent.

## Deep and shallow

> **Deep work:** Professional activities performed in a state of distraction-free concentration that push your cognitive capabilities to their limit. These efforts create new value, improve your skill, and are hard to replicate.
>
> **Shallow work:** Noncognitively demanding, logistical-style tasks, often performed while distracted. These efforts tend to not create much new value in the world and are easy to replicate.

In code, deep work needs concentration and accuracy and involves problem solving, memorization or creativity. Shallow work can be done while multitasking and doesn't tire you at all.

## Hypothesis

Most AI work done by [_vibe coding_](https://x.com/karpathy/status/1886192184808149383) is shallow work. A working life of mostly shallow work wears down the ability to do deep work, and in the long run you can't think for yourself. The early evidence agrees:

- **Anthropic, 2026.** In a randomized trial, developers learning a new library with AI scored 50% on a comprehension quiz, against 67% for those who coded by hand, and saved no significant time. The AI users who only asked conceptual questions scored 65% and were the second fastest. ([Shen and Tamkin](https://www.anthropic.com/research/AI-assistance-coding-skills))
- **MIT, 2025.** 83% of people who wrote an essay with ChatGPT could not correctly quote a sentence from it afterwards, against 11% of those who wrote without it. ([Kosmyna et al.](https://arxiv.org/abs/2506.08872), preprint)
- **Microsoft and CMU, 2025.** The more knowledge workers trust the AI, the less critical thinking they report. ([Lee et al.](https://doi.org/10.1145/3706598.3713778), CHI)

The remedy is to bring deep work back into AI development while keeping productivity high. Naval Ravikant: ["To write a great book, you must first become the book."](https://x.com/naval/status/996460948029362176) [_Atomic Habits_](https://www.amazon.com/dp/0735211299) says the same about identity: "The goal is not to read a book, the goal is to become a reader." To write good code with an LLM, you stay the engineer who could write it. I've already been through this switch, and below is what worked.

## Why LLM work turns shallow

```tikz title="Figure 1. The two loops. In the shallow one you answer questions about code you have never read. In the deep one the LLM writes one layer at a time, and you read it before the next one exists."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[font=\scriptsize\bfseries,anchor=west] at (0,4.3) {shallow};
  \draw[fill=black!4] (0,2.9) rectangle (2.8,3.9);
  \node[align=center,font=\footnotesize] at (1.4,3.4) {\textbf{grill}\\{\scriptsize you and the LLM}};
  \draw[fill=black!4] (4.0,2.9) rectangle (7.6,3.9);
  \node[align=center,font=\footnotesize] at (5.8,3.4) {\textbf{LLM writes it all}\\{\scriptsize until it hits a gap}};
  \draw[fill=black!4] (8.8,2.9) rectangle (12.4,3.9);
  \node[align=center,font=\footnotesize] at (10.6,3.4) {\textbf{you answer}\\{\scriptsize at a high level}};
  \draw[->] (2.8,3.4) -- (4.0,3.4);
  \draw[->] (7.6,3.6) -- (8.8,3.6);
  \draw[->] (8.8,3.2) -- (7.6,3.2);
  \node[align=left,font=\scriptsize,anchor=west] at (12.8,3.4) {you read:\\\textbf{nothing}};
  \node[font=\scriptsize\bfseries,anchor=west] at (0,1.9) {deep};
  \draw[fill=black!4] (0,0.5) rectangle (2.8,1.5);
  \node[align=center,font=\footnotesize] at (1.4,1.0) {\textbf{grill}\\{\scriptsize you and the LLM}};
  \draw[fill=black!4] (4.0,0.5) rectangle (7.6,1.5);
  \node[align=center,font=\footnotesize] at (5.8,1.0) {\textbf{LLM writes one layer}\\{\scriptsize step 0, then A to E}};
  \draw[fill=black!4] (8.8,0.5) rectangle (12.4,1.5);
  \node[align=center,font=\footnotesize] at (10.6,1.0) {\textbf{you review it}\\{\scriptsize then one level deeper}};
  \draw[->] (2.8,1.0) -- (4.0,1.0);
  \draw[->] (7.6,1.2) -- (8.8,1.2);
  \draw[->] (8.8,0.8) -- (7.6,0.8);
  \node[align=left,font=\scriptsize,anchor=west] at (12.8,1.0) {you read:\\\textbf{every layer}};
\end{circuitikz}
\end{document}
```

1. **Grill.** The workflow [Matt Pocock](https://github.com/mattpocock/skills) promotes ([video](https://www.youtube.com/watch?v=M6mYodf0dJM), [/grill-me](https://www.aihero.dev/skills-grill-me)): start a session, write down the idea, and let the LLM grill you on features and architecture until you're both comfortable. Mine are [`grilling`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/productivity/grilling) and [`grill-with-docs`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/productivity/grill-with-docs), which also writes the glossary and decision records.
2. **Implement.** The LLM writes until it hits a gap you never discussed, then asks. You don't know the code, so you answer at a high level.

You never read the code, so you lose the ability to judge its quality and style. The LLM gets more freedom, which in practice makes it work better, but nobody head-butts the way two engineers would. Newport calls that friction the whiteboard effect: "The presence of the other party waiting for your next insight [...] can short-circuit the natural instinct to avoid depth." Without it, nothing in the loop is worth remembering. Waiting on the agent adds what Sophie Leroy calls [attention residue](https://doi.org/10.1016/j.obhdp.2009.04.002): switch tasks and, in Newport's words, "a residue of your attention remains stuck thinking about the original task."

## What to know first

The deep loop only works if you know what good code is. Each item says what it buys, where to learn it, and which skill in my [NixOSConfig](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills) applies it. [`codebase-rules`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/codebase-rules) orders them and settles their conflicts.

1. **Clean code** is cheap to change: a likely change should edit zero existing function bodies. In hot code the data layout beats tiny functions and polymorphism.
   - Learn: [_Clean Code_](https://www.amazon.com/dp/0132350882) ([2nd ed.](https://www.amazon.com/dp/0135398576)), [_A Philosophy of Software Design_](https://www.amazon.com/dp/173210221X) ([talk](https://www.youtube.com/watch?v=bmSAYlu0NcY)), [_Working Effectively with Legacy Code_](https://www.amazon.com/dp/0131177052) ([seams](https://www.informit.com/articles/article.aspx?p=359417&seqNum=2)), [_The Pragmatic Programmer_](https://www.amazon.com/dp/0135957052), [_Refactoring_](https://www.amazon.com/dp/0134757599), ["Clean" Code, Horrible Performance](https://www.computerenhance.com/p/clean-code-horrible-performance) ([video](https://www.youtube.com/watch?v=tD5NrevFtbU)).
   - Skills: [`codebase-clean-code`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/codebase-clean-code), [`codebase-design`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/codebase-design), [`pragmatic-programmer`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/pragmatic-programmer), [`refactoring-patterns`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/refactoring-patterns).
2. **API design**, by Casey Muratori, keeps callers in control. Write the caller's code first, then grade granularity, redundancy, coupling, retention and flow control. Factor out at the second real instance, never before.
   - Learn: [Designing and Evaluating Reusable Components](https://caseymuratori.com/blog_0024) ([video](https://www.youtube.com/watch?v=ZQ5_u8Lgvyk)), [Semantic Compression](https://caseymuratori.com/blog_0015).
   - Skill: [`api-design`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/api-design).
3. **Data-oriented design**, by Mike Acton and Andrew Kelley, lays data out for the cache (Figure 2). Answer six questions first: what goes in and out, how many, how wide, what is read together, how long it lives, and whether it splits. Then one array per field, fields as narrow as their range, indices instead of pointers, tables instead of flags, a hot/cold split, and arenas by lifetime. Zig ships [`MultiArrayList`](https://ziglang.org/documentation/master/std/#std.MultiArrayList), [`StaticStringMap`](https://ziglang.org/documentation/master/std/#std.StaticStringMap) and [`StaticBitSet`](https://ziglang.org/documentation/master/std/#std.StaticBitSet).
   - Learn: Acton's [Data-Oriented Design and C++](https://www.youtube.com/watch?v=rX0ItVEVjHc) (CppCon 2014, the Hawaiian shirt), Kelley's [Practical DOD](https://vimeo.com/649009599) (Handmade Seattle 2021), Richard Fabian's [_Data-Oriented Design_](https://www.dataorienteddesign.com/dodbook/) (free online, or [in print](https://www.amazon.com/dp/1916478700)).
   - Skill: [`data-oriented-design`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/dod/data-oriented-design).
4. **Zero-cost abstraction.** An abstraction may cost compile time, never a cycle the hand loop wouldn't. What it leaves in the machine code is _residue_: probe its assembly against the hand loop, and residue fails the build. Put each seam on the cheapest rung that handles what varies: concrete code, free function, table, enum and switch, comptime generic, request table, function-pointer table, `dyn` at a cold boundary, plugin. Dispatch per batch, never per element.
   - Skills: `zero-cost.md` in [`zig`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/dod/zig) and [`rust`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/dod/rust), `LADDER.md` in [`codebase-clean-code`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/codebase-clean-code).
5. **SIMD**, by Mitchell Hashimoto, uses the hardware you already have. Delete the branch, then make it branchless, then vectorize. Look for a lane axis across independent instances before fighting a chain inside one. Check the assembly, and test against the `W == 1` instance of the same kernel.
   - Learn: [Everyone Should Know SIMD](https://mitchellh.com/writing/everyone-should-know-simd), [Ghostty Devlog 006](https://mitchellh.com/writing/ghostty-devlog-006).
   - Skills: [`branchless`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/dod/branchless), [`simd-loops`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/dod/simd-loops), `simd-first.md` in [`zig`](https://github.com/OmarSiwy/NixOSConfig/blob/main/skills/dod/zig/simd-first.md) and [`rust`](https://github.com/OmarSiwy/NixOSConfig/blob/main/skills/dod/rust/simd-first.md).
6. **The GPU is a different machine.** Parallel warps hide latency, not caches. Struct-of-arrays is mandatory, a branch diverges the warp, and launches and copies cost more than kernels. Name the [roofline](https://doi.org/10.1145/1498765.1498785) ceiling before optimizing, and port the dependency graph, not the CPU loop.
   - Learn: NVIDIA's [CUDA C++ Best Practices Guide](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/).
   - Skills: [`gpu-parallel-algorithm-thinking`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/hardware/gpu-parallel-algorithm-thinking), [`gpu-kernel-optimization`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/hardware/gpu-kernel-optimization).
7. **Data structures and algorithms**: thinking algorithmically, the way competitive programming trains it.
   - Learn: [cp-algorithms.com](https://cp-algorithms.com/), the free [_Competitive Programmer's Handbook_](https://cses.fi/book/book.pdf) with the [CSES problems](https://cses.fi/problemset/), [_Guide to Competitive Programming_](https://www.amazon.com/dp/3031617932), the [USACO Guide](https://usaco.guide/).
   - Skill: none. This is what Step C asks you to bring.
8. **Contracts.** An operating error (bad input, a missing file, out of memory) returns to a caller that can decide. A bug hits an assertion and stops the program. Validate input once, at the edge, then assert: two per function on average, entry and exit, the positive and the negative space, paired across every boundary. Rust's `assert!` runs in release and `debug_assert!` doesn't; Zig's `assert` panics in Debug and ReleaseSafe and becomes an optimizer assumption in ReleaseFast.
   - Learn: [TigerStyle](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md), [It Takes Two to Contract](https://tigerbeetle.com/blog/2023-12-27-it-takes-two-to-contract), Joran Dirk Greef's [TigerStyle!](https://www.youtube.com/watch?v=w3WYdYyjek4) talk.
   - Skill: [`assertions`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/dod/assertions).
9. **Doc comments** let the next person, or an agent on another machine, pick up the code without redoing the same fix. Each carries a fact the signature can't: a precondition, what the call invalidates, who owns the result, how it fails, what it costs, or why. TigerStyle: "Always motivate, always say why."
   - Learn: [Rust API Guidelines: Documentation](https://rust-lang.github.io/api-guidelines/documentation.html).
   - Skill: [`doc-comments`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/doc-comments).
10. **Ponytail** is the simplest code that obeys all of the above. Its ladder says when you've reached it: does this need to exist, is it already here, does the standard library do it, and only then the least code that works.
    - Learn: [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail).
    - Skills: [`ponytail`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/productivity/ponytail), [`ponytail-review`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/productivity/ponytail-review), [`ponytail-audit`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/productivity/ponytail-audit).
11. **Style guides**: Google's [C++](https://google.github.io/styleguide/cppguide.html) and [Rust](https://google.github.io/styleguide/rustguide.html) guides (Google has no C guide), the official [Rust Style Guide](https://doc.rust-lang.org/style-guide/), and [TigerStyle](https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md) for Zig.
    - Skill: [`code-style`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/code-style), whose `check_style.py` every file passes before review.

```tikz title="Figure 2. One 64-byte cache line of 4-byte words. Shaded words are the ones a loop over p reads. With an array of structs the line is a quarter useful; with one array per field it is entirely useful, and the prefetcher streams it."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % AoS: four 16-byte records {p,v,n,t} fill one line; a loop over p touches 4 of 16 words
  \node[anchor=east] at (-0.3,2.25) {AoS};
  \foreach \x in {0,2,4,6} \fill[black!25] (\x,2) rectangle (\x+0.5,2.5);
  \draw (0,2) rectangle (8,2.5);
  \foreach \x in {0.5,1,...,7.5} \draw (\x,2) -- (\x,2.5);
  \foreach \x/\t in {0.25/p,0.75/v,1.25/n,1.75/t,2.25/p,2.75/v,3.25/n,3.75/t,4.25/p,4.75/v,5.25/n,5.75/t,6.25/p,6.75/v,7.25/n,7.75/t} \node[font=\scriptsize] at (\x,2.25) {\t};
  \node[anchor=west,font=\scriptsize] at (8.2,2.25) {4 of 16 words read};
  % SoA: the p column alone fills the line
  \node[anchor=east] at (-0.3,0.75) {SoA};
  \fill[black!25] (0,0.5) rectangle (8,1);
  \draw (0,0.5) rectangle (8,1);
  \foreach \x in {0.5,1,...,7.5} \draw (\x,0.5) -- (\x,1);
  \foreach \x in {0.25,0.75,...,7.75} \node[font=\scriptsize] at (\x,0.75) {p};
  \node[anchor=west,font=\scriptsize] at (8.2,0.75) {16 of 16};
  \node[font=\scriptsize] at (4,-0.1) {one cache line, 64 bytes};
\end{circuitikz}
\end{document}
```

The target: clean, fast, readable, simple code, proven by tests.

## The build order

Step 1, the grill, stays, now with these skills loaded and the knowledge **you** need. Step 2 splits into layers: much more human-involved, without giving up the speed. You read each layer before the next one exists. TigerStyle: "An hour or day of design is worth weeks or months in production."

```tikz title="Figure 3. The build order. Each step is written, tested and read before the next one starts. The middle column is the test work each step adds; the right column names the skills that drive it."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[font=\scriptsize\bfseries] at (3.0,10.2) {step: what gets written};
  \node[font=\scriptsize\bfseries] at (9.3,10.2) {tests};
  \node[font=\scriptsize\bfseries] at (14.3,10.2) {skills};
  \foreach \y/\step/\what/\testA/\testB/\skillA/\skillB in {
      9.3/{0. Blocks}/{independent blocks and their seams}/{name the oracle}/{for every output}/{grilling}/{codebase-clean-code},
      7.7/{A. Definitions}/{signatures only, bodies \texttt{todo!()}}/{sizes and layouts}/{asserted at compile time}/{data-oriented-design}/{api-design, ponytail},
      6.1/{B. Seams}/{public bodies call other units}/{agree which seams}/{get tests}/{codebase-design}/{doc-comments, assertions},
      4.5/{C. Private functions}/{algorithms and data movement}/{red, then green,}/{one slice at a time}/{tdd}/{simd-loops, branchless},
      2.9/{D. Seam checks}/{every call between units proven}/{paired asserts; property,}/{differential, fuzz, exhaustive}/{assertions}/{test-plan},
      1.3/{E. Final pass}/{style and simplicity}/{coverage as a gap map,}/{mutation score, the gate}/{code-style, code-review}/{ponytail-review}} {
    \draw[fill=black!4] (0,\y-0.5) rectangle (6.0,\y+0.5);
    \node[align=center,font=\footnotesize] at (3.0,\y) {\textbf{\step}\\{\scriptsize \what}};
    \draw[fill=black!4] (7.0,\y-0.5) rectangle (11.6,\y+0.5);
    \node[align=center,font=\scriptsize] at (9.3,\y) {\testA\\\testB};
    \draw[fill=black!4] (12.4,\y-0.5) rectangle (16.2,\y+0.5);
    \node[align=center,font=\scriptsize] at (14.3,\y) {\texttt{\skillA}\\\texttt{\skillB}};
    \draw[->] (6.0,\y) -- (7.0,\y);
    \draw[->] (11.6,\y) -- (12.4,\y);
  }
  \foreach \y in {8.8,7.2,5.6,4.0,2.4} { \draw[->] (3.0,\y) -- (3.0,\y-0.6); }
\end{circuitikz}
\end{document}
```

- **0. Blocks.** Split the architecture into independent blocks with their own types, and define the seams between blocks, types and functions: the data first, then the one owner that writes each table, then one _spine_ per pipeline. Name the oracle for every output now.
- **A. Definitions.** Every type, field and signature; every body is `todo!()` (`@panic("todo")` in Zig). Weigh the data movement, the architecture and simplicity. Assert struct sizes at compile time.
- **B. Seams.** Public bodies call other units, with a doc comment above each saying how it's used. Decide which inputs are errors at a boundary and which are asserted preconditions, and agree which seams get tests.
- **C. Private functions.** The algorithm and data movement for each, discussed before the LLM writes it. A seam test goes red, the private functions turn it green, one slice at a time.
- **D. Seam checks.** Walk every call between units. Each assertion gets its partner across the seam, and the property, differential, fuzz and exhaustive tests named in Step 0 land here.
- **E. Final pass.** Style, review, then cut what should not exist. The doc-comment audit runs last, so comments describe what shipped.

The public functions end up super thin, algorithms bound together, so each reads like a LeetCode solution and most of the code lives in helpers. A spine and one of its transforms:

```zig
pub fn step(world: *World, dt_s: f32) void {
    const s = world.bodies.slice();
    applyGravity(s.items(.vel_y_ms), s.items(.kind), dt_s);
    integrateBodies(s.items(.pos_y_m), s.items(.vel_y_ms), dt_s);
    world.ground_hits.clearRetainingCapacity();
    collectGroundHits(s.items(.pos_y_m), &world.ground_hits);
    resolveGroundHits(world.ground_hits.items, s.items(.pos_y_m), s.items(.vel_y_ms), s.items(.kind));
}

fn integrateBodies(pos_y_m: []f32, vel_y_ms: []const f32, dt_s: f32) void {
    assert(pos_y_m.len == vel_y_ms.len);
    assert(dt_s > 0);
    for (pos_y_m, vel_y_ms) |*p, v| p.* += v * dt_s;
}
```

Not every task deserves the layers. Newport's test for depth: "How long would it take (in months) to train a smart recent college graduate with no specialized training in my field to complete this task?" Near zero months, hand it to the agent whole. Everything else gets the layers, and that is deep work by Newport's definition: it pushes a skill and produces something hard to replicate.

## Tests: name the oracle first

Richard Hipp ranks where bugs get found: what developers hit, what users report, full branch coverage, fuzzing with properties checked, then LLM review ([restated by Andrew Kelley](https://www.youtube.com/watch?v=zwi5b5xSsKA)). [SQLite](https://sqlite.org/testing.html) reached 100% branch coverage and fuzzers still found bugs, then a new oracle found more, then LLMs did. Each stage fell to a new **oracle** or a new input distribution, never to more coverage. An oracle is the independent thing that says "this output is wrong", and every test names one. That is why Step 0 names it before any code exists.

```tikz title="Figure 4. The three oracle shapes. Differential: a second implementation must agree within a tolerance. Metamorphic: a transformed input must give a predictably transformed output, with no reference needed. Certificate: the answer is checked by a computation cheaper than the one that produced it."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % differential
  \node[font=\scriptsize] at (1.5,3.1) {\textbf{differential}};
  \node at (0,2.2) {$x$};
  \draw[fill=black!4] (0.8,1.9) rectangle (1.7,2.5); \node at (1.25,2.2) {$f$};
  \draw[->] (0.25,2.2) -- (0.8,2.2); \draw[->] (1.7,2.2) -- (2.4,2.2); \node at (2.7,2.2) {$y$};
  \node at (0,0.9) {$x$};
  \draw[fill=black!4] (0.8,0.6) rectangle (1.7,1.2); \node[font=\scriptsize] at (1.25,0.9) {ref};
  \draw[->] (0.25,0.9) -- (0.8,0.9); \draw[->] (1.7,0.9) -- (2.4,0.9); \node at (2.7,0.9) {$y'$};
  \draw[<->] (2.7,1.95) -- (2.7,1.15) node[midway,right,font=\scriptsize] {$|y-y'| \le \mathrm{tol}$};
  % metamorphic
  \node[font=\scriptsize] at (6.3,3.1) {\textbf{metamorphic}};
  \node at (4.2,2.2) {$x$};
  \draw[fill=black!4] (6.4,1.9) rectangle (7.3,2.5); \node at (6.85,2.2) {$f$};
  \draw[->] (4.45,2.2) -- (6.4,2.2); \draw[->] (7.3,2.2) -- (8,2.2); \node at (8.3,2.2) {$y$};
  \node at (4.2,0.9) {$x$};
  \draw[fill=black!4] (4.8,0.6) rectangle (5.5,1.2); \node at (5.15,0.9) {$T$};
  \draw[->] (4.45,0.9) -- (4.8,0.9); \draw[->] (5.5,0.9) -- (6.4,0.9);
  \draw[fill=black!4] (6.4,0.6) rectangle (7.3,1.2); \node at (6.85,0.9) {$f$};
  \draw[->] (7.3,0.9) -- (8,0.9); \node at (8.3,0.9) {$y'$};
  \draw[<->] (8.3,1.95) -- (8.3,1.15) node[midway,right,font=\scriptsize] {$y' = T'(y)$};
  % certificate
  \node[font=\scriptsize] at (11.3,3.1) {\textbf{certificate}};
  \node at (9.8,2.2) {$x$};
  \draw[fill=black!4] (10.6,1.9) rectangle (11.5,2.5); \node at (11.05,2.2) {$f$};
  \draw[->] (10.05,2.2) -- (10.6,2.2); \draw[->] (11.5,2.2) -- (12.2,2.2); \node at (12.5,2.2) {$y$};
  \draw[fill=black!4] (10.6,0.6) rectangle (12.3,1.2); \node[font=\scriptsize] at (11.45,0.9) {check$(x, y)$};
  \draw[->] (9.8,1.95) -- (9.8,0.9) -- (10.6,0.9);
  \draw[->] (12.5,1.95) -- (12.5,1.2);
  \draw[->] (12.3,0.9) -- (12.9,0.9); \node[font=\scriptsize,anchor=west] at (12.9,0.9) {ok};
  \node[font=\scriptsize] at (11.45,0.2) {cheaper than $f$};
\end{circuitikz}
\end{document}
```

| Oracle | Use when |
|---|---|
| Assertions | always: silent corruption becomes a crash a fuzzer sees |
| Reference implementation | another tool, a naive version, or the scalar or CPU path exists |
| Round trip | parse and print, encode and decode |
| Certificate | checking the answer is cheaper than finding it: a residual, a finite difference |
| Metamorphic relation | no exact answer exists, but a transformation has a known effect |
| Model | a stateful system; a small in-memory model defines legal behaviour |
| Exhaustive | the domain fits: every byte, every `f32`, every length up to three vector widths |

Layer them cheapest first: assertions, example tests at public seams, property and differential tests, fuzzing at every untrusted boundary, exhaustive small domains, deterministic simulation for anything stateful or parallel, fault injection, coverage as a gap map, and mutation testing to prove the tests can fail.

| Tier | Budget | Runs |
|---|---|---|
| Pre-commit | under 10 s | format, compile, fast unit and property tests |
| Merge | under 15 min | every example, property and differential test, sanitizers, all targets, fuzz corpus replay |
| Nightly | hours | long fuzzing, simulation seeds, mutation testing, benchmarks, reference-tool diffs, GPU |
| Release | unbounded | the full target matrix and fixture set |

A release ships on numbers a script checks: the corpus passes, fuzzers ran their hours with no new crash, differential agreement holds, `jobs=1` and `jobs=N` are byte-identical, CPU and GPU agree, the coverage and mutation ratchets hold, no crash bug is open, and a written list says what is still untested.

Skills: [`test-plan`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/test-plan), [`tdd`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/tdd).

## Keep the loop fast

The layers are affordable only when feedback takes seconds. A build is a cache keyed on its declared inputs ([Build Systems à la Carte](https://doi.org/10.1145/3236774)), so:

- Every step that produces something has an output argument, and every check has an exit-code check. Zig never caches a Run step without one.
- Every file a step reads is declared, and keys hash contents, never paths.
- The artifact graph is cut where edits land: one object per generated unit, narrow imports for shared ones.
- The edit loop is `zig build check --watch -fincremental`, under a second; the gate is a plain build.
- In Rust: LLD or mold, `debug = "line-tables-only"`, flags in `.cargo/config.toml`, rust-analyzer in its own target directory, and `cargo nextest`.
- Nothing collects `target/` or `.zig-cache`, so each gets a byte budget.

Skill: [`long-term-garbage-collection`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/long-term-garbage-collection).

## Ship it

```tikz title="Figure 5. Three pointers a consumer can follow, and what has to be true for each. Only the bottom row follows the working branch, and a merge gate protects it more cheaply than a second branch would."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[font=\scriptsize\bfseries] at (1.8,5.0) {consumer};
  \node[font=\scriptsize\bfseries] at (6.8,5.0) {what it resolves};
  \node[font=\scriptsize\bfseries] at (12.2,5.0) {what must be true};
  \draw[fill=black!4] (0,3.6) rectangle (3.6,4.6);
  \node[align=center,font=\footnotesize] at (1.8,4.1) {\textbf{build.zig.zon}\\{\scriptsize url\#commit + hash}};
  \draw[fill=black!4] (4.8,3.6) rectangle (8.8,4.6);
  \node[align=center,font=\footnotesize] at (6.8,4.1) {\textbf{one immutable commit}\\{\scriptsize nothing on main can move it}};
  \draw[fill=black!4] (10,3.6) rectangle (14.4,4.6);
  \node[align=center,font=\footnotesize] at (12.2,4.1) {\textbf{that commit was green}\\{\scriptsize gate on every push}};
  \draw[fill=black!4] (0,2.0) rectangle (3.6,3.0);
  \node[align=center,font=\footnotesize] at (1.8,2.5) {\textbf{\#latest, tarball}\\{\scriptsize nix profile, SHA256SUMS}};
  \draw[fill=black!4] (4.8,2.0) rectangle (8.8,3.0);
  \node[align=center,font=\footnotesize] at (6.8,2.5) {\textbf{a tag I moved}\\{\scriptsize sources.json follows the release}};
  \draw[fill=black!4] (10,2.0) rectangle (14.4,3.0);
  \node[align=center,font=\footnotesize] at (12.2,2.5) {\textbf{the release job proved it}\\{\scriptsize measured changelog, smoke}};
  \draw[fill=black!4] (0,0.4) rectangle (3.6,1.4);
  \node[align=center,font=\footnotesize] at (1.8,0.9) {\textbf{nix run github:...}\\{\scriptsize clone and build}};
  \draw[fill=black!4] (4.8,0.4) rectangle (8.8,1.4);
  \node[align=center,font=\footnotesize] at (6.8,0.9) {\textbf{HEAD of main, now}\\{\scriptsize my working branch}};
  \draw[fill=black!4] (10,0.4) rectangle (14.4,1.4);
  \node[align=center,font=\footnotesize] at (12.2,0.9) {\textbf{main is never red}\\{\scriptsize merge queue, required checks}};
  \foreach \y in {4.1,2.5,0.9} { \draw[->] (3.6,\y) -- (4.8,\y); \draw[->] (8.8,\y) -- (10,\y); }
\end{circuitikz}
\end{document}
```

- **Main is green by machine.** A merge queue tests the merged result and merges only on green: Graydon Hoare's [not rocket science](https://graydon2.dreamwidth.org/1597.html) rule, now [built into GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue).
- **A dev branch needs a person** running it, the way git and Linux have one. Release branches hold backports, not work.
- **Versions are promises, pins are facts.** Pin the toolchain in the repository and mirror every third-party input you hash.
- **The changelog is written by hand**, and the release job re-measures every number in it.
- **CI:** the merge gate on every shipped OS, gated on the exit code (`| tail` once turned a failing build green); every target compiled; docs that execute; reference suites gated by name; a nightly tier; downstream contracts; a release job that checks every artifact and smoke-tests it.
- **Issues move through triage states:** reproduced, minimal, bisected. A stale bot closes real bugs to improve a number.

Skills: [`pr`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/pr), [`triage`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/triage), [`resolving-merge-conflicts`](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills/engineering/resolving-merge-conflicts).

## AGENTS.md

Paste this into a repository's `AGENTS.md`. It is this post condensed for an agent, and every name in backticks is a skill in my [NixOSConfig](https://github.com/OmarSiwy/NixOSConfig/tree/main/skills).

````markdown
# Working in this repository

The human designs; you type. Work in layers: finish one, show it, and wait for approval before going one level deeper. Every step ends on its "Done when".

Read `codebase-rules` before starting a module: it orders the skills below and settles their conflicts. Run `setup-matt-pocock-skills` once so `to-spec`, `to-tickets` and `triage` know the tracker. In their domains, `compiler-construction`, `gui-architecture`, `spice-engine` and `writing-perfect-verilog` apply on top of every step.

## Add a feature

1. Grill. Run `grill-with-docs` (it runs `grilling` and `domain-modeling`) and name the oracle for every output. Too big for one session: `wayfinder`. A question only running code can answer: `prototype`. Done when the human confirms a shared understanding; then `to-spec` and `to-tickets`.
2. Blocks. `codebase-clean-code` steps 1 to 4 (data, owners, spines, seams), the six questions of `data-oriented-design`, and `test-plan` for each bug class's oracle and layer. Done when the human approves the tables, the ownership map and the seams.
3. Definitions. Every type, field and signature, each body `todo!()` or `@panic("todo")`; `api-design` at any boundary another program calls; `ponytail` throughout. Done when it compiles and the human approves.
4. Seams. Public bodies call other units, placed with `codebase-design`, each call carrying a `doc-comments` comment and `assertions` at entry and exit. Done when the human approves the list of seams under test.
5. Private functions. Per seam, one `tdd` slice: write the test and watch it go red, propose the algorithm and its data movement, implement once approved, watch it go green. In `.zig` or `.rs`, the `zig` or `rust` skill; a hot branch, `branchless` then `simd-loops`; GPU work, `gpu-parallel-algorithm-thinking` then `gpu-kernel-optimization`. Done when every agreed seam has a green test.
6. Seam checks. Pair every assertion across its seam, and add the property, differential, fuzz and exhaustive tests `test-plan` named. Done when every bug class names a test file.
7. Final pass. `code-style`, the `doc-comments` audit, `code-review`, then `ponytail-review`. Done when the gate passes.

A ticket with no design decision left goes through `implement` in one piece.

## Fix a bug

1. Reproduce with `diagnosing-bugs`. Done when one command goes red on the bug.
2. Find the root cause: grep every caller of the function you will change, and fix it where they all route through. Done when the command goes green.
3. Add the oracle that would have caught it (`test-plan`): a property, a reference or a generator feature. Done when it goes red on the old code.
4. Final pass, as in feature step 7.

## Change a feature

1. State the change radius: run a `codebase-clean-code` change drill and list every existing function body the change edits. Done when the human accepts the number.
2. Pin the current behaviour. Untested code gets `legacy-code` characterization tests at the seam first; restructure in `refactoring-patterns` steps. Done when the tests pass on the current code.
3. Re-enter the feature steps at the highest layer the change touches: a new seam at step 4, a new algorithm at step 5. A rewrite is `rewrite-clean`, a port is `clean-room-pseudocode-pipeline`, and a whole repository is `codebase-improvement` or `improve-codebase-architecture`.

## Rulings

- Data layout beats code brevity; in hot code, small functions yield to it.
- `ponytail` decides how little code to write, never the shape of the data.
- A seam at ladder rung 5 or above enters hot code only with a zero-cost probe verdict.
- Measure every performance change; a vector loop that benchmarks slower is reported, and the scalar loop stays.
- Keep every NaN gate, allocation-failure path, `errdefer`, trust-boundary validation and numerical tolerance.

## The gate

Done means: `check_style.py` exits 0; the suite passes in a safe build (Zig Debug or ReleaseSafe, Rust with debug assertions); touched files average two assertions per function; every rung-5+ seam has its probe verdict; the doc audit ran after the code. While iterating, run only your unit's tests, and use `long-term-garbage-collection` when builds queue or caches grow. Then `pr` for the description, `resolving-merge-conflicts` when the merge fights back, and `handoff` before the context fills. Repository-wide: `ponytail-audit` for bloat, `ponytail-debt` for deferred shortcuts.
````
