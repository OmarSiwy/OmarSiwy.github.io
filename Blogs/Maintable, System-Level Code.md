---
title: Writing Clean System-Level Code
description: How I keep simulators, compilers and kernels fast and changeable in Zig and Rust. The cache decides the layout, every abstraction earns its place with an assembly probe, the GPU gets its own rules, and tests hold all of it to account.
publishedAt: 2026-08-15
updatedAt: 2026-10-21
slug: writing-clean-code
tags:
  - engineering
  - llm
draft: false
---
I write simulators, compilers and kernels in Zig and Rust. In that work a wrong number is worse than a crash, and a slow loop is a bug. Five commitments decide every design choice:

1. **Lean storage.** Anything that exists a million times is as small as it can be.
2. **No runtime residue.** An abstraction may cost compile time, build time or test time. It may not cost the user a cycle that a hand-written loop would not.
3. **Cheap change.** A likely change touches one place, and the compiler lists every other place that must follow.
4. **Contained failure.** An error returns to the caller that can handle it. A bug stops the program before it corrupts anything downstream.
5. **Proof by test.** Untested code is not good code, and neither is code with weak tests.

The first four are claims. The fifth is how I find out whether they hold. Below is how each one shows up when I write, starting where the hardware does.

## The cache decides the layout

A core executes a few hundred instructions in the time one main-memory read takes. Rough latencies: L1 about 1 ns, L2 about 3 ns, L3 about 10 ns, DRAM about 100 ns. Memory moves in 64-byte lines, so the unit of cost is not the byte you asked for but the line it sits in. Two things follow. Bytes read together must sit together. Access must be predictable, because the hardware prefetcher follows sequential streams and gives up on pointer chasing, hash probes and strides past a couple of kilobytes.

That is why an array of structs is the wrong default for a hot loop. A loop that integrates positions over a `{pos, vel, name, created_at}` record drags the name and the timestamp through the cache on every element. Figure 1 shows what such a loop uses.

```tikz title="Figure 1. One 64-byte cache line of 4-byte words. Shaded words are the ones a loop over p reads. With an array of structs the line is a quarter useful; with one array per field it is entirely useful, and the prefetcher streams it."
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

Before I write a line of code I answer Mike Acton's question, "what is the data?", as six smaller ones, out loud. What goes in and what comes out? How many are there? How wide is each field, from the spec? Which fields are read together, how often, in what order? How long does each live? Can the work be split into independent pieces? An unanswered question means I do not understand the problem yet, and reaching for `u64` to cover the gap is how structs get fat.

The answers decide the layout, and the rules are short:

- **One array per field** by default. Array of structs only when every pass touches every field of an element.
- **Fields as narrow as their stated range.** A value in 0 to 1000 is a `u16`. A row of `id: u32, hp: u16, team: u8` costs 7 bytes in parallel arrays and 12 padded in a struct, nearly twice the rows per cache line for free. The two costs: an accumulator must be wide enough for the sum, and widening later is a deliberate change.
- **Indices, not pointers.** A pointer is 8 bytes and pins the storage. A `u32` index is 4, relocates with its table and serializes as it is. The index gets its own type, so a node index cannot index the pin table. The "none" value is a sentinel in the same 4 bytes: `?u32` is 8 bytes in Zig, `Option<u32>` is 8 in Rust, `Option<NonZero<u32>>` is 4. A million of them is 4 MB instead of 8.
- **Existence instead of flags.** A `burning: bool` on every row costs a byte plus padding and a branch per iteration. A `burning` table holding only the rows that burn costs nothing per row that does not, and its loop has no branch.
- **Hot and cold split.** A field read in fewer than one iteration in ten moves to a side table keyed by the same index.
- **Tables before trees before graphs.** A graph is one array of nodes and one of edges, never a heap allocation per node.
- **Allocation by lifetime.** Phase data lives in an arena named for the phase and dies in one call. Hot tables are sized once from a stated capacity, so nothing grows inside a loop; 2^20 pushes into an unsized Rust `Vec` reallocate about 19 times.
- **Working set under L1** where I can get it, 32 to 64 KB. Inside L1 the loop is compute bound. Outside it the loop waits on memory, and the only fix is fewer bytes.

The layout is checked, not assumed. Every struct that lives in a hot table carries a compile-time size assertion, so a new field is a decision rather than an accident:

```zig
const Body = struct { pos_y_m: f32, vel_y_ms: f32, kind: Kind };
comptime {
    assert(@sizeOf(Body) == 12);
    assert(@sizeOf(?u32) == 8); // why handles are enum(u32) with a sentinel, not ?u32
}
```

Andrew Kelley's version is the one I repeat most: find where you have many of something, and make each one smaller. A struct that exists once can be any size. A struct that exists a million times is the memory footprint and the cache-miss rate.

## Residue: the cost of an abstraction, measured

Abstraction is not the enemy. Overhead is. I call the overhead **residue**: whatever an abstraction leaves in the machine code beyond the loop a careful person would have written by hand. An extra call, an indirect call, a lost inline, a lost vector loop, a panic path, a copy. Three cases:

- **Zero residue.** The abstraction compiles to the hand loop. Fine anywhere.
- **Negative residue.** The abstraction carries an invariant the compiler exploits, and compiles to something better than the obvious hand loop. These are worth seeking.
- **Any residue on a hot path.** Out, however clean it reads.

Stroustrup's zero-overhead principle says what you do not use you do not pay for, and what you do use you could not hand-code better. I treat that as a test to run, not a property of a language feature. Every abstraction on a hot path gets a probe: the generated version and the hand-written version side by side as exported functions, built to assembly for the target CPU, compared by a script that returns one of five verdicts. FOLDED (the compiler merged both into one body), IDENTICAL, EQUIVALENT (same instructions, different registers), NEGATIVE (the abstraction does less static work, or vectorizes where the hand loop does not), or RESIDUE, which fails the build. The probe step runs inside `zig build test`, so a compiler upgrade that quietly reintroduces an indirect call turns CI red.

Verdicts from my lab, Zig 0.17 at ReleaseFast and Rust 1.95 at `opt-level=3`, both for x86-64-v3:

| Abstraction | Verdict | What the listing shows |
|---|---|---|
| Zig comptime generic `Map(T, f)` | FOLDED | one body for the generic and the hand loop |
| Zig `enum(u32)` handle indexing a table | FOLDED | the type disappears |
| Zig `packed struct(u8)` field reads | NEGATIVE | 54 instructions against 59 for hand shifts and masks |
| Zig tagged union plus exhaustive `switch` | IDENTICAL | same as a hand tag and payload |
| Zig context pointer plus function pointer, per element | RESIDUE | an indirect `call` per element, no inlining: 1.055 ns/element against 0.264 |
| Rust `#[repr(transparent)]` newtype over `f64` | FOLDED | one body, 4x `ymm` unrolled |
| Rust generic `run<O: Op>` | IDENTICAL | 59 instructions, 15 vector, 0 calls |
| Rust `&dyn Op` per element | RESIDUE | `call r12` inside the loop, 0 vector instructions |
| Rust `iter().sum::<f32>()` against an indexed sum | both scalar | strict float order blocks vectorization either way |
| Rust `zip` store loop against indexed | RESIDUE | the same vector loop, 98 instructions against 54 |

Two lessons sit in that table. "Iterators are free" is folklore: on 1.95 an iterator was sometimes better (no panic path), sometimes worse (more code for the same vector loop), and never vectorized a float sum the indexed loop did not. Write what reads best and probe the hot ones. And the line is not "generics good, dynamic dispatch bad". It is per element against per batch. A vtable call once per device kind per Newton step is fine. Once per element it blocks inlining and vectorization, and that is the entire 4x in the fifth row:

```zig
/// `F` is any type with `pub fn apply(F, f32) f32`. Resolved at compile time: FOLDED.
fn mapWith(comptime F: type, f: F, xs: []f32) void {
    for (xs) |*x| x.* = f.apply(x.*);
}

/// The same loop through a runtime interface: one indirect call per element. RESIDUE.
const Iface = struct { ctx: *const anyopaque, apply: *const fn (*const anyopaque, f32) f32 };
fn mapDyn(i: Iface, xs: []f32) void {
    for (xs) |*x| x.* = i.apply(i.ctx, x.*);
}
```

Negative residue has a source people do not expect: an assertion. In a safe build, an indexed loop that stores through several slices carries a bounds check per slice per iteration, and those checks keep the loop from unrolling. One length assertion before the loop proves every index in range, so the checks disappear:

```zig
fn addInto(out: []u32, a: []const u32, b: []const u32) void {
    assert(b.len >= a.len);
    assert(out.len >= a.len);
    for (0..a.len) |i| out[i] = a[i] +% b[i]; // ReleaseSafe: 8x unrolled, no checks inside
}
```

Without the two asserts, Zig 0.17 at ReleaseSafe emits two bounds checks per iteration and a rolled loop. The contract made the code faster. That is what negative overhead means in practice.

The probe is static. It counts instructions in a listing, not instructions executed, so it proves an abstraction is free; it does not prove the loop is fast. A speed claim cites a benchmark. A "no residue" claim cites the probe. The two get confused constantly, and a vectorized loop that benchmarks slower is a normal result, reported as such, with the scalar version kept.

### Clean code, kept and dropped

I grew up on the Gang of Four and Robert Martin, and most of what they describe is a real need. The part of *Clean Code* I keep is the one its readers skip: chapter 6 separates objects, which hide data behind behaviour, from data structures, which expose data and have none. Procedural code over data structures makes adding an operation cheap; objects make adding a type cheap. Systems code adds operations far more often than types, so mine lives in the data-structure quadrant: transparent tables, and transforms as free functions over them.

Three of the book's prescriptions fight the optimizer or the data, and in hot code they lose:

- **"Functions must be very small."** Past the point of cohesion, fragmentation scatters one transformation across call sites, and neither the reader nor the vectorizer can see the loop. A 200-line function that does one thing in order is cohesive. A 20-line function that branches between three jobs is not. I extract when a piece is used three or more times, is an interface worth documenting, or has its own table of inputs and expected outputs. John Carmack's note on inlined code and John Ousterhout's deep modules say the same thing from two directions: a deep module with a small interface beats eight shallow ones you must read together.
- **"Prefer polymorphism to conditionals."** A `switch` over a closed enum is clearer and faster than a vtable, and it is exhaustive: add a variant and the compiler lists every site. Runtime polymorphism is for a set of implementations that genuinely lives outside the crate.
- **"Encapsulate everything."** A getter around a field with no invariant adds friction and no safety, and it blocks the struct-of-arrays transformation. Data with no reason to be opaque is transparent.

Everywhere else, which is most code, the book's naming and sizing advice is fine and cheaper to follow than to argue with. The tell for which regime you are in is a measurement.

### The ladder

So when behaviour varies I do not reach for a pattern. I name what varies (kind, backend, platform, dialect, policy, plugin), check that a second case exists today or that a planned change needs it, and place the seam on the cheapest rung that handles it. One case and no planned change means no seam: the code stays concrete.

| Rung | Mechanism | Residue | Adding a case costs |
|---|---|---|---|
| 1 | Concrete code | none | editing the body |
| 2 | Free function over plain data | none | one body |
| 3 | Table plus transform: a value table indexed by kind, or one table per kind | one indexed load per element, or none | one row, or one table and one spine line |
| 4 | Closed enum plus exhaustive switch | a select or a branch per element | one arm per site, compiler-listed |
| 5 | Comptime or generic parameter | none; code size per instantiation, about 264 B for a small loop | one instantiation |
| 6 | Request table the owner drains | a store and a load per request | one variant and one arm in the owner |
| 7 | Function-pointer table indexed by kind | one indirect call per kind per pass | one function and one row |
| 8 | `dyn` or vtable at a cold boundary | one indirect call per call | one implementation |
| 9 | Process, wasm or ABI plugin | serialization per call | one plugin |

Rungs 7 to 9 leave residue by design; the proof is where it sits, per request or per kind, never per element. Rung 5 and above needs the probe. The Gang of Four patterns map onto rungs rather than onto classes. Strategy is a comptime parameter (5). Visitor is an exhaustive switch (4). Observer is a request table (6). Composite is flat arrays with parent indices (3). State is an enum plus a transition table (3 and 4). Singleton is a context passed as a parameter (2). Decorator is a transform inserted in the spine (3). Iterator is `for` over a slice (1).

One probe settles rung 3 against rung 4 for the common case of kinds that differ only in numbers: a value table `g[kind[i]]` costs 58 instructions and 5 branches in Rust where a per-element `match` costs 90 and 10. Both vectorize; the table wins. Kinds that differ in behaviour get a table each, and no branch on kind exists anywhere.

## API design: write the caller first

A library boundary is the one decision a later step cannot fix, so it comes first, and it starts with the code a caller would write against the API I wish existed. That draft is the specification. Casey Muratori's five characteristics then grade it:

- **Granularity.** Can I do A, or must I do ABC? Every call I would not call atomic decomposes into two to four smaller ones, and the smaller ones ship too. The reason is rarely to change the math. It is to run the halves on different threads, or defer one to the end of the frame.
- **Redundancy.** Write the orthogonal primitives first, then add the diagonal shortcut for the common case on top. A caller drops a tier by replacing one call with its primitive.
- **Coupling.** Does A secretly require B? Hidden state, unnamed begin/end scopes, shared scratch buffers, allocation welded to initialization, and "only our types, only our file format" are all coupling, and coupling only ever removes options.
- **Retention.** State the caller must mirror into the library and keep in sync is retention, and the caller ends up writing diff code. Every retained construct gets an immediate-mode twin that takes the same data as parameters.
- **Flow control.** A callback puts the library in the middle of the caller's stack. Inheriting from a library class is the same thing with a vtable. The alternative is to invert the request: the library yields what it needs, the caller supplies it and resumes.

In Zig the shape falls out of the language. The allocator is a parameter, so allocation is never welded to initialization, and below that tier sits the pair where the caller owns the memory:

```zig
pub fn parse(gpa: Allocator, input: []const u8) !Ast;     // convenience: I allocate
pub fn parseNodeCount(input: []const u8) usize;           // query
pub fn parseInto(nodes: []Node, input: []const u8) !Ast;  // caller sizes and owns the memory
```

And instead of a callback, a request union the caller drives:

```zig
pub const Request = union(enum) {
    file_mapping: struct { offset: usize, len: usize },
    output_memory: struct { size: usize },
    done,
};
pub fn unzip(state: *Unzip, req: *Request) bool;

while (unzip(&state, &req)) switch (req) {
    .file_mapping => |m| supplyMemory(&state, try mapFile(f, m.offset, m.len)),
    .output_memory => |o| supplyMemory(&state, try arena.alloc(u8, o.size)),
    .done => break,
}
```

The library only ever knows about memory blocks. The caller picks mmap or read, picks every allocator, and extracts in parallel by handing one shared table of contents to N states, with no change inside the library. Rust reaches the same place with `&[T]` and `&str` at the boundary, `decode_into(&mut [u8])` under `decode`, iterators where a returned `Vec` would be retention, and typestate only where a wrong call order would otherwise be a runtime panic.

Muratori's other rule says when any of this gets written: compress, do not plan. Write the concrete usage, get it working, and factor out a shared piece at the second real instance. One instance is not enough information to factor correctly. The architecture is the residue of compression.

## Architecture: owners, spines, drills

Inside the boundary, "maintainable" is a number, and I measure it before committing to a design. I take three changes the project is likely to make, list every edit each one needs, and count the existing function bodies touched. That count is the **change radius**. The target is zero: a change lands as new tables, transforms, rows, variants or spine lines, and the compiler lists anything else.

The structure that keeps it there has four words:

- A **table** holds data: a plural noun, laid out as above.
- A **transform** holds behaviour: a verb phrase, a straight loop over whole tables, one per file. Its signature takes every table it reads as `const` and every table it writes as mutable, so the signature list is the data-flow graph.
- The **spine** is one function per pipeline (a frame, a request, a compiler pass) that calls every transform in order, one line each. Every branch that chooses *which* work happens lives in the spine; a transform never branches on it. Push ifs up and fors down.
- An **owner** is the one module that writes a table. Anyone else reads it, or appends to a **request table** the owner drains in spine order.

```tikz title="Figure 2. One owner per table. Readers depend on the owner; anything that wants to change a table appends a request the owner drains at a fixed point in its spine. No table has two writers, so the dependency graph has no cycle."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[fill=black!4] (0,1.0) rectangle (7.2,4.2);
  \node[anchor=north west] at (0.1,4.15) {\textbf{sim}\quad{\scriptsize owner of \texttt{bodies}, \texttt{ground\_hits}, \texttt{despawn\_requests}}};
  \node[anchor=north west,font=\scriptsize] at (0.3,3.5) {spine \texttt{step(world, dt)}:};
  \node[anchor=north west,font=\scriptsize] at (0.6,3.1) {\texttt{applyGravity(vel, kind)}};
  \node[anchor=north west,font=\scriptsize] at (0.6,2.7) {\texttt{integrateBodies(pos, vel)}};
  \node[anchor=north west,font=\scriptsize] at (0.6,2.3) {\texttt{collectGroundHits(pos) $\to$ ground\_hits}};
  \node[anchor=north west,font=\scriptsize] at (0.6,1.9) {\texttt{resolveGroundHits(ground\_hits, pos, vel)}};
  \node[anchor=north west,font=\scriptsize] at (0.6,1.5) {\texttt{applyDespawns(despawn\_requests)}};
  \draw[fill=black!4] (9.8,3.0) rectangle (12.4,3.9);
  \node at (11.1,3.45) {\textbf{render}};
  \draw[->] (9.8,3.45) -- (7.2,3.45) node[midway,above,font=\scriptsize] {reads \texttt{bodies}};
  \draw[fill=black!4] (9.8,1.4) rectangle (12.4,2.3);
  \node at (11.1,1.85) {\textbf{ui}};
  \draw[->,dashed] (9.8,1.85) -- (7.2,1.85) node[midway,above,font=\scriptsize] {appends a request};
  \node[font=\scriptsize] at (6.2,0.5) {solid: depends on. dashed: a request table, drained by its owner in spine order.};
\end{circuitikz}
\end{document}
```

Modules are grouped by what they own, never by topic. A `utils` or `common` folder collects files that touch several owners' data, each owner imports it, and the cycle closes through the folder. The build enforces the module graph, not code review: Cargo rejects a crate cycle outright, and in Zig the `build.zig` lists modules in dependency order and resolves each import only against the modules above it, so a cycle cannot be written.

The rest is letting the compiler do the impact analysis. Every `switch` over a boundary enum is exhaustive with no catch-all, so a new variant is a list of compile errors naming every site. Handles have distinct types. Sizes are asserted at compile time. The whole shape fits in one file, from a test that passes on 0.17:

```zig
pub const Kind = enum(u8) { rock, balloon };

// Seam, rung 3: kinds differ only in numbers. One row per kind, and `EnumArray.init`
// refuses to compile until every kind has a row. No switch on kind anywhere.
const gravity_scale = std.EnumArray(Kind, f32).init(.{ .rock = 1.0, .balloon = -0.2 });
const bounce = std.EnumArray(Kind, f32).init(.{ .rock = 0.3, .balloon = 0.9 });

const Body = struct { pos_y_m: f32, vel_y_ms: f32, kind: Kind };
const Hit = struct { body: u32 };

pub const World = struct {
    bodies: std.MultiArrayList(Body) = .empty, // owner: sim
    ground_hits: std.ArrayList(Hit) = .empty, // request table, cleared per frame
};

// The spine: the whole frame, top to bottom.
pub fn step(world: *World, dt_s: f32) void {
    const s = world.bodies.slice();
    applyGravity(s.items(.vel_y_ms), s.items(.kind), dt_s);
    integrateBodies(s.items(.pos_y_m), s.items(.vel_y_ms), dt_s);
    world.ground_hits.clearRetainingCapacity();
    collectGroundHits(s.items(.pos_y_m), &world.ground_hits);
    resolveGroundHits(world.ground_hits.items, s.items(.pos_y_m), s.items(.vel_y_ms), s.items(.kind));
}

fn applyGravity(vel_y_ms: []f32, kind: []const Kind, dt_s: f32) void {
    assert(vel_y_ms.len == kind.len);
    for (vel_y_ms, kind) |*v, k| v.* -= 9.81 * gravity_scale.get(k) * dt_s;
}

fn integrateBodies(pos_y_m: []f32, vel_y_ms: []const f32, dt_s: f32) void {
    assert(pos_y_m.len == vel_y_ms.len);
    assert(dt_s > 0);
    for (pos_y_m, vel_y_ms) |*p, v| p.* += v * dt_s;
}
```

The drills on this file: a new kind that falls slowly is one enum tag and one row per table, radius 0. Air drag is a new transform and one spine line, radius 0. Drones that steer are a new table of body handles, a new transform, one spine line, radius 0. Balloons that pop on a ground hit would have put a branch on kind inside `resolveGroundHits`, radius 1; the fix was a new transform after it plus a despawn request table, back to 0. That last one is the common case. A failed drill is fixed by restructuring, and climbing the ladder is the second choice.

## Branches and lanes

A data-dependent branch in a hot loop is two problems. A misprediction flushes about 15 to 20 cycles of pipeline, and a per-lane branch is what stops the loop from vectorizing at all. So the order is fixed: delete the branch, then make it branchless, then vectorize.

Delete first. A `visible` table maintained on insert beats `if (o.visible)` on every object. Sorting the data makes the branch predictable: the same loop measured about 14 cycles per element on shuffled input and 4 on sorted. A condition that is constant for the whole loop becomes a comptime parameter and vanishes.

Branchless second, and only after measuring. The hump test needs no profiler: run on sorted and on shuffled input, and a large gap means the predictor is losing. The shape is always the same four parts: produce the condition as a value, widen it to 0/1 or an all-bits mask, combine with arithmetic or a select, commit unconditionally. `if (p) out[n++] = v` becomes `out[n] = v; n += p`. The branch still wins when prediction sits outside roughly 25 to 75 percent, when the taken side is expensive, when it guards a load that could fault, and when the array is larger than the last-level cache, because speculation past the branch was acting as a prefetcher. On one loop the numbers were 14 cycles per element branchy, 7 branchless and 0.3 vectorized, so branchless is a waypoint.

Vectorize third. Triage before writing anything: element type, typical count (SIMD pays from a few hundred elements), and whether the dependency between iterations is none, an accumulator, or a chain. A chain is a wall. Before attacking the wall inside one stream, look for a **lane axis** across streams: N independent instances of the same transformation side by side in one register. Frequency points of an AC sweep, Monte Carlo samples, right-hand sides against one factorization, pixels. Timesteps and Newton iterations are not lanes; they run sequentially inside the kernel, and the independent problems they solve are the lanes. A lane kernel is one function generic over the width `W`. Its `W == 1` instantiation is the scalar oracle, never a second code path, because a twin drifts and an instantiation cannot. It returns a per-lane failure mask, failed lanes peel off to a slower scalar path that re-pivots or takes a smaller step, and the tail is the `W == 1` kernel.

Per-loop vectorization is the compiler's job when it can see the loop. Zig 0.16 and 0.17 shipped with LLVM's loop vectorizer off, so every vector loop was written by hand with `@Vector`. 0.18 turns it back on, and plain loops in the right form matched or beat the explicit-SIMD iterator library I wrote for 0.17 on every kernel I measured, so that library is being removed. The forms matter:

```zig
// Early exit blocks vectorization. Make each 64-element block branchless, branch once per block.
// `!(a <= b)` fails on NaN at no extra cost. 0.56 ns/elem with an early return, 0.155 blocked.
var i: usize = 0;
while (i + 64 <= dx.len) : (i += 64) {
    var bad: u64 = 0;
    for (dx[i..][0..64], x[i..][0..64]) |d, v| bad |= @intFromBool(!(@abs(d) <= rel * @abs(v) + abs));
    if (bad != 0) return false;
}
```

A strict float sum stays scalar on every compiler, because vectorizing it reassociates. `@setFloatMode(.optimized)` is the one place fast-math pays, 6x, and it comes with rules: the arithmetic is written lexically inside the optimized scope, the strict caller gates the result with `std.math.isFinite`, and no NaN test ever sits inside the scope, because LLVM deletes `v != v` there. Where a NaN must reach the result I skip fast-math and use sixteen independent `f64` accumulators combined in a fixed pairwise order: within 15 percent of fast-math, exact NaN propagation, the same bits every run. Max of absolute value reduces the bit pattern as an `i64`, because float `@max` drops NaN, and a convergence norm built on it accepts a NaN update.

Vectorization is verified from the assembly, never from a timing. LLVM can hoist a pure call out of a benchmark loop, and the probe can report FOLDED when the "optimized" version silently became the strict one. The loop body must show packed `ymm` operations, and the pair goes into the codegen-probe step so a later edit cannot turn it scalar again. Then the differential test: every length from 0 to past three times the lane count, several start offsets, NaN and ±inf and ±0 and a subnormal, compared bitwise where the kernel is lane-exact and within a tolerance where a reduction reorders.

## The GPU is a different machine

Everything above assumes one core with a deep cache hierarchy and a branch predictor. A GPU has neither in the same sense, so the same data gets different treatment.

**Latency is hidden by parallelism, not by caches.** A global memory read costs hundreds of cycles, and the hardware covers it by switching among resident warps, not by keeping a working set in L1. So the question is not "does it fit in cache?" but "are there enough independent threads in flight, and does each one touch memory the way the bus wants?" Registers are single-cycle and shared across all resident threads; use too many per thread and the compiler spills to "local" memory, which is DRAM with a misleading name. Shared memory is a software-managed scratchpad about two orders of magnitude faster than global, split into 32 banks, and a tile read column-wise hits one bank 32 times over; the fix is a tile padded to 33 columns.

**Struct of arrays is mandatory, not preferred.** A warp of 32 threads issues a load together, and the memory system serves it in 32, 64 or 128-byte segments. If lane `i` reads `x[i]`, the warp fills contiguous segments in one transaction. If lane `i` reads `p[i].x` from a 16-byte record, the warp spans four times the segments, and every untouched field in each one crosses the bus anyway. Figure 3 draws it. A CPU struct copied to the device unchanged gets exactly this.

```tikz title="Figure 3. Eight lanes of one warp loading one 4-byte field each. With one array per field the eight loads fill one 32-byte segment and cost one transaction. With an array of 16-byte structs the same eight loads touch four segments, and the memory system moves every unshaded word too."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % lanes in the middle
  \foreach \i in {0,...,7} {
    \draw (\i*0.6+2.4,1.9) rectangle (\i*0.6+2.9,2.4);
    \node[font=\scriptsize] at (\i*0.6+2.65,2.15) {\i};
  }
  \node[anchor=east,font=\scriptsize] at (2.2,2.15) {lanes};
  % SoA above: x[0..7] contiguous, one 32 B segment
  \node[anchor=east,font=\scriptsize] at (-0.2,3.45) {SoA \texttt{x[i]}};
  \fill[black!25] (0,3.2) rectangle (2.4,3.7);
  \draw (0,3.2) rectangle (2.4,3.7);
  \foreach \x in {0.3,0.6,...,2.1} \draw (\x,3.2) -- (\x,3.7);
  \foreach \i in {0,...,7} \draw[->] (\i*0.6+2.65,2.4) -- (\i*0.3+0.15,3.2);
  \node[font=\scriptsize,anchor=west] at (2.6,3.45) {8 words, one 32 B segment, one transaction};
  % AoS below: p[i].x strided by 16 B, four segments
  \node[anchor=east,font=\scriptsize] at (-0.2,0.5) {AoS \texttt{p[i].x}};
  \foreach \i in {0,...,7} \fill[black!25] (\i*1.2,0.25) rectangle (\i*1.2+0.3,0.75);
  \draw (0,0.25) rectangle (9.6,0.75);
  \foreach \x in {0.3,0.6,...,9.3} \draw (\x,0.25) -- (\x,0.75);
  \foreach \i in {0,...,7} \draw[->] (\i*0.6+2.65,1.9) -- (\i*1.2+0.15,0.75);
  \foreach \s in {0,2.4,4.8,7.2} \draw (\s,0.1) -- (\s,0) -- (\s+2.4,0) -- (\s+2.4,0.1);
  \node[font=\scriptsize,anchor=north] at (4.8,-0.05) {the same 8 words spread over four segments};
\end{circuitikz}
\end{document}
```

**A branch diverges the warp.** All 32 lanes execute in lockstep. A data-dependent `if` runs both sides with lanes masked off, so the branchless shape above is the only way to run at full width. One thread per element with a divergent body is slower than the CPU.

**A kernel is pinned against one ceiling.** Before touching a kernel I place it on the roofline: arithmetic intensity, useful operations per unavoidable DRAM byte, against the card's ridge point, peak throughput over peak bandwidth. An RTX 4090 sits near 82 FLOP per byte, an A100 near 10. Below the ridge the kernel is memory bound and the only lever is fewer bytes: coalescing, hot/cold split, tiling for reuse, fusing kernels so intermediates stay in registers. Above it the levers are FMA, tensor units, lower precision and independent accumulator chains. A grid too small to fill the machine is latency bound. A timeline that is mostly gaps is overhead bound. Work spent on the wrong ceiling is wasted, so the ceiling gets named first, with the arithmetic shown.

**Launches and copies cost more than kernels.** The numbers here are mine, from Gompute on an RTX 4060 Laptop. The first `init` in a process costs 220 to 255 ms, almost all of it the driver, so it starts on a background thread as the first thing `main` does. A bare launch plus sync is about 5 µs. A convenience `run()` that uploads, launches, syncs and downloads costs 12 µs at 1024 elements and 834 µs at a million, where the CPU does the same map in 266 µs. The GPU wins only once the data stays there: allocate once, launch many times, capture a repeated sequence into a graph (ten small launches cost 19.9 µs as launches and 13.0 µs as one graph replay). Every host synchronization inside an inner loop is a pipeline drain.

**Double precision is a budget line.** Consumer NVIDIA parts run FP64 at 1/64 of FP32. A circuit simulator's Newton iteration is f64, so on a 4060 one device evaluation costs 7 to 8 percent of a host core's time for the same work, the card is worth about fifteen cores, and a 24-core host beats it. My `auto` policy keeps lanes on the CPU there and admits them only where the reported FP64 rate is at least a quarter of FP32. A datacenter part shrinks the device side 30 to 50x and leaves the host control path where it was, at which point the host becomes 97 percent of each round.

**Reductions are nondeterministic unless you make them not.** Atomics and tree reductions change summation order run to run. A simulator must give the same bytes every run, so every reduction goes through one helper with a fixed order, per-contribution staging cells are reduced in tape order rather than through atomics, GPU against GPU compares bitwise, and CPU against GPU compares within a tolerance per quantity.

**The CPU code is one schedule, not the algorithm.** Porting a loop by mapping one thread per iteration is the characteristic mistake. The method is to recover the dependency graph, classify each edge as required by the problem or only by the fact that a CPU runs one instruction at a time, cut the artificial ones (a global counter becomes count, scan, scatter; an ordered accumulation becomes a tree; recursion becomes level sets), and compare three candidate formulations on work, span, traffic, launches and synchronization. Shorter span is bought with extra work, and the price goes in the table. "This belongs on the CPU" is a legitimate verdict.

In practice this is one source for both machines. Gompute takes a pure scalar function written once and compiles it into a CPU loop, a PTX entry point and an HSACO entry point. The backend is part of the type, `Kernel(spec, .cpu)` is asserted by the codegen check to be the same machine code as the hand loop, and the GPU path pays only what the GPU costs:

```zig
pub const Params = struct { scale: f32 };

// `anytype` makes the body generic: the CPU backend runs it at SIMD width,
// the GPU runs it at scalar width, one thread per element. One body, both targets.
fn scaleRelu(x: anytype, p: Params) @TypeOf(x) {
    const V = @TypeOf(x);
    return @max(x * g.splat(V, p.scale), g.splat(V, @as(f32, 0)));
}
pub const scale_relu = g.map("scale_relu", f32, Params, scaleRelu, .{});
```

The device math is one software body per function on every target, so CPU and GPU agree on every bit; exp, log and pow are within 0.505 ulp of an f128 oracle, and every f32 function was checked exhaustively over all 2^32 inputs. In the simulator, device evaluation runs on the GPU in lane-major layout (element `i` of lane `l` at `i*N + l`, a warp holding 32 lanes of one instance; random order measured 34 percent slower). The sparse LU stays on the host, because tiny sparse systems do not belong on a GPU LU. The current work moves Newton's convergence control and then the timestep controller onto the device, because a round today costs 8 to 14 pipeline drains and two scalar host passes over every lane, and one thread per lane leaves a 256-lane sweep with four blocks of 64 threads, nowhere near enough to fill the card. A synthetic probe of that change ran 2.4x faster with guarded four-iteration chunks and 1.75x with a device-side conditional loop, and in a recorded 256-lane sweep it would remove 77 percent of the host boundaries. Those are design counts, not a delivered speedup. The measurement discipline is the same on both machines: a shorter sync call is not a win, the full solve is.

AMD is the same code with a 64-wide wavefront, so a hard-coded 32 in a shuffle stride or a ballot mask is the number-one portability bug, and a backend that has never run on hardware is untested whatever its assembly checks say.

## Failures stay where they happen

Every failure is one of two kinds, and they get opposite treatment. An **operating error** is expected: bad input, a missing file, out of memory, a matrix that will not factor. It returns as a value from a small named error set to the nearest caller that can decide. A **bug** is a state my own logic says cannot happen. It hits an assertion and the program stops, because continuing spreads corrupt state into everything downstream. Input from outside is validated once, at the edge, into a refined type. Past that point the code trusts its types and asserts its invariants, and a function deep in the core that takes a raw `u32` for something with rules is a validation waiting to be forgotten.

The assertion rules come from TigerBeetle's TigerStyle. At least two per function on average, one on entry and one on exit. Both the positive space and the negative: `if (valid) assert(h < len)` and `if (!valid) assert(h >= len)`. Split, never compound, so the panic names the condition. Paired across any boundary the data crosses: before the write and after the read, in the producer and in the consumer. At compile time where the operands are constants. And a bound on everything: every table has a named capacity, every loop that is not a `for` over a slice carries a counter against a limit, so a bug ends as a crash and not a hang.

Memory follows a ladder of lifetimes. Take what the runtime gives, then allocate nothing after startup where the limits are known, then an arena per phase, and only then owned memory under pairing rules: `defer` or `errdefer` on the line after the allocation, every path frees the same set, `deinit` frees every owning field. The check is mechanical. Every multi-allocation function runs under `checkAllAllocationFailures`, which fails each allocation in turn, and a missing `errdefer` shows up as a leak.

State changes follow one rule: do everything that can fail first, then commit with operations that cannot. A failure halfway leaves nothing half-built.

## Tests hold it to account

If there are no tests it is not good code, and if the tests are weak it is not either. The measure of a test is whether it can tell a right answer from a wrong one, and the thing that tells is the **oracle**: a closed form, a certificate cheaper than the answer (a KCL residual, a Jacobian against finite differences, a scaled LU residual), a reference implementation (ngspice, KLayout, the scalar loop, the CPU path), a metamorphic relation (renumber the nodes and nothing may change), or the assertions above, which turn every fuzz run into a contract check. Coverage is a map of what never ran, not a target. SQLite reached 100 percent branch coverage, and then fuzzers, then a new oracle, then LLMs each found bugs it could not. Every bug report gets a regression test and the oracle that would have caught it. Main always passes, tests run in tiers from seconds to overnight, and a release ships on numbers.

How I build that stack, from a primer on the kinds of testing to the exit criteria, is its own article: [Exhaustive Testing](/blog/exhaustive-testing/).

## How the passes run

Most of the typing in my projects is done by agents, and the method above is what makes that safe. The order is fixed by which decisions a later step cannot undo: the boundary first, then where each piece lives, then the data, then the language's zero-cost proof, then contracts, then the test loop, then branches, then lanes. Three rulings settle conflicts. Data layout beats code brevity. The zero-cost proof comes before the abstraction. Measure before accepting any performance rung.

A cleanup pass is one agent per smallest independent unit, each with a disjoint file set, three steps in order, and no change to a `pub` signature used outside the unit; those become seam notes for a later agent that works the boundaries with the API rules above.

1. **Shape.** A deletion pass first: dead code, unused fields and parameters, speculative flexibility, forwarding wrappers, reimplemented std functions, with net lines removed reported. Then a data pass that may not answer "already data-oriented" without numbers: for every struct a hot loop touches, `@sizeOf` and `@alignOf`, padding, bytes the loop reads against bytes it loads, AoS or SoA, pointer or index, narrowable widths, hot/cold candidates. Reordering fields to kill padding is free and lands at once. Doc comments get written here, and each must carry a fact the signature cannot: a precondition, what the call invalidates, who frees what, each error's condition, a cost, or a reason.
2. **Testability.** Every bug class gets an oracle and a layer, until any corner case is covered. A function that fails tests believed correct is handed to step 3.
3. **Implementation.** Fix what step 2 flagged. Plain loops in the measured forms, hand-written `@Vector` only for lane axes, shuffles and gathers, every replacement verified from the assembly and differential-tested against the strict scalar loop, one source for CPU and GPU.

Builds stay fast so the loop stays tight: Debug without the GPU, incremental where the compiler supports it, each agent running only its unit's test step, with the full suite and corpus left to the coordinator between waves. Nothing in a pass may simplify away a NaN gate, an allocation-failure path, an `errdefer`, validation at a trust boundary, or a numerical tolerance.

None of this is new. It is Acton, Kelley, Muratori, Ousterhout, Hipp and the TigerBeetle team, applied in a fixed order: data first, compile-time abstraction second, the compiler as change-tracker third, contained failure fourth, the GPU on its own terms, and tests holding all of it to account.

## References

**Data and hardware**

- Mike Acton, "Data-Oriented Design and C++", CppCon 2014
- Andrew Kelley, "Practical Data-Oriented Design", Handmade Seattle 2021
- Richard Fabian, _Data-Oriented Design_ (2018)
- Ulrich Drepper, "What Every Programmer Should Know About Memory" (2007)
- Andre Weissflog, "Handles are the better pointers" (2018)
- Agner Fog, _Optimizing software in C++_, on when a conditional move loses to a predicted branch

**Abstraction and architecture**

- Bjarne Stroustrup, _The Design and Evolution of C++_ (1994), the zero-overhead principle
- Robert C. Martin, _Clean Code_ (2008), chapter 6, "Objects and Data Structures"
- John Ousterhout, _A Philosophy of Software Design_, 2nd ed. (2021)
- John Carmack, on inlined code (2014), published by Jonathan Blow
- Gamma, Helm, Johnson and Vlissides, _Design Patterns_ (1994)
- Michael Feathers, _Working Effectively with Legacy Code_ (2004), seams
- Alex Kladov, "Push Ifs Up and Fors Down" (2023) and "ARCHITECTURE.md" (2021)
- Casey Muratori, "'Clean' Code, Horrible Performance" (2023)
- Nicholas Nethercote, _The Rust Performance Book_

**API design**

- Casey Muratori, "Designing and Evaluating Reusable Components" (2004) and "Semantic Compression" (2014)
- Chris Hecker, "API Design"
- Micha Mettke (vurtun), "API Design: Coroutine APIs"
- Rust API Guidelines, rust-lang.github.io/api-guidelines

**GPU**

- NVIDIA, _CUDA C++ Best Practices Guide_ and "Floating Point and IEEE 754 Compliance for NVIDIA GPUs"
- Samuel Williams et al., "Roofline: An Insightful Visual Performance Model for Multicore Architectures" (2009)
- Gompute, github.com/OmarSiwy/Gompute, including its measured overhead table

**Failure and tests**

- TigerBeetle, TigerStyle, github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md
- Richard Hipp, "Reliability Lessons From SQLite", Software Should Work 2026
- Andrew Kelley, "State of the (Tagged) Union Address", Systems Distributed '26
