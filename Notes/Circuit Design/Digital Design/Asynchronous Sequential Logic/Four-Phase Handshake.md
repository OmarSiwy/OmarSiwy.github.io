---
title: "Four-Phase Handshake"
description: "Return-to-zero level signalling — req up, ack up, req down, ack down — so latch control is literally a wire, paid for with two round trips per datum."
kind: circuit
source: "No assigned book source; standard canon (Sparsø & Furber, Unger, Weste & Harris)"
status: seed
spade: not-expressible
tags: [digital, asynchronous-sequential-logic, handshake, protocol, bundled-data]
aliases:
  - Four-Phase Handshaking
  - Four-Phase Protocol
  - Four-Phase Signalling
  - Return-to-Zero Handshake
  - RTZ Handshake
---

# Four-Phase Handshake

A request/acknowledge protocol whose two control wires return to zero after every datum, so each transfer costs four level transitions — `req↑`, `ack↑`, `req↓`, `ack↓` — and every control signal is a *level* that can drive a latch enable directly instead of an event that has to be decoded.

```tikz title="Four-phase handshake: the two-wire link and its four numbered edges"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- the link: one k-bit bundle, two 1-bit control wires -----------------
  \draw[thick] (0.0,6.1) rectangle (2.2,8.1);
  \node at (1.1,7.1) {Sender};
  \draw[thick] (9.4,6.1) rectangle (11.6,8.1);
  \node at (10.5,7.1) {Receiver};
  \draw[->,>=latex,thick] (2.2,7.75) -- (9.4,7.75);
  \node[anchor=south] at (5.8,7.83) {$d$ \;--\; $k$ bits, single-rail};
  \draw[->,>=latex] (2.2,7.00) -- (9.4,7.00);
  \node[anchor=south] at (5.8,7.08) {$\mathit{req}$ \;--\; 1 bit, level};
  \draw[<-,>=latex] (2.2,6.35) -- (9.4,6.35);
  \node[anchor=south] at (5.8,6.43) {$\mathit{ack}$ \;--\; 1 bit, level};

  % ---- phase boundaries ----------------------------------------------------
  \foreach \t in {1.5,2.8,5.5,7.2,11.5}
    \draw[gray,dashed] (\t,0.35) -- (\t,4.35);

  % ---- data validity (broad protocol) --------------------------------------
  \draw (0,4.75) -- (0.9,4.75);
  \draw (0.9,4.75) -- (1.15,5.15) -- (7.15,5.15) -- (7.4,4.75)
        -- (7.15,4.35) -- (1.15,4.35) -- cycle;
  \node at (4.15,4.75) {$d$ valid};
  \draw (7.4,4.75) -- (10.9,4.75);
  \draw (10.9,4.75) -- (11.15,5.15) -- (12.0,5.15);
  \draw (10.9,4.75) -- (11.15,4.35) -- (12.0,4.35);
  \node[anchor=east] at (-0.15,4.75) {$d\;[k]$};

  % ---- req -----------------------------------------------------------------
  \draw[thick] (0,3.05) -- (1.5,3.05) -- (1.5,3.75) -- (5.5,3.75)
        -- (5.5,3.05) -- (11.5,3.05) -- (11.5,3.75) -- (12.0,3.75);
  \node[anchor=east] at (-0.15,3.4) {$\mathit{req}$};
  \node[circle,draw,inner sep=1.3pt] at (1.5,4.05) {1};
  \node[circle,draw,inner sep=1.3pt] at (5.5,4.05) {3};

  % ---- ack -----------------------------------------------------------------
  \draw[thick] (0,1.45) -- (2.8,1.45) -- (2.8,2.15) -- (7.2,2.15)
        -- (7.2,1.45) -- (12.0,1.45);
  \node[anchor=east] at (-0.15,1.8) {$\mathit{ack}$};
  \node[circle,draw,inner sep=1.3pt] at (2.8,2.55) {2};
  \node[circle,draw,inner sep=1.3pt] at (7.2,2.55) {4};

  % ---- (req,ack) state, Gray order -----------------------------------------
  \node at (0.75,0.80) {$00$};
  \node at (2.15,0.80) {$10$};
  \node at (4.15,0.80) {$11$};
  \node at (6.35,0.80) {$01$};
  \node at (9.35,0.80) {$00$};
  \node[anchor=east] at (-0.15,0.80) {$(\mathit{req},\mathit{ack})$};

  % ---- one datum = one full lap --------------------------------------------
  \draw[<->,>=latex] (1.5,-0.35) -- (11.5,-0.35);
  \node[anchor=south] at (6.5,-0.20) {one datum $=$ two round trips};
\end{circuitikz}
\end{document}
```

*Own construction. Edges ①–④ are `req↑`, `ack↑`, `req↓`, `ack↓`; the validity window drawn is the* broad *variant.*

**Fix what the two wires carry.** The link is a $k$-bit single-rail bundle $d$ plus two 1-bit control wires, $\mathit{req}$ driven by the sender and $\mathit{ack}$ driven by the receiver. Nothing in the protocol is per-bit: widening $d$ from $k$ to $2k$ changes the [[Matched Delay Line]] and nothing else, because the control logic never looks at the data. That indifference to the bundle is the defining property of a [[Bundled-Data Interface]], and it is why the format question — fixed-point, floating-point, whatever [[Number Formats]] says $d$ means — is entirely orthogonal to the handshake.

**Order the four edges into one closed cycle.** Write the link's observable state as the pair $(\mathit{req},\mathit{ack}) \in \{0,1\}^2$. The protocol is the cyclic sequence

$$00 \;\xrightarrow{\ \text{①}\ }\; 10 \;\xrightarrow{\ \text{②}\ }\; 11 \;\xrightarrow{\ \text{③}\ }\; 01 \;\xrightarrow{\ \text{④}\ }\; 00$$

with the odd edges owned by the sender and the even edges by the receiver, and every edge causally conditioned on having *seen* the previous one. That mutual conditioning is what makes the protocol correct under arbitrary delays: neither party ever acts on a timeout, only on a level it can read.

**Read the cycle as a Gray code and fundamental mode comes free.** Consecutive states differ in exactly one bit, and on two variables that 4-cycle is the unique cyclic Gray sequence up to rotation and reflection. So the link never changes two state variables at once, which means it never presents a race: the [[Race-Free State Assignment]] problem that dominates flow-table design is solved here by the *shape* of the protocol rather than by a search over encodings. The same argument says the environment always satisfies the fundamental-mode restriction of the [[Huffman Feedback Model]] — the next input change is gated on an output the circuit has already produced, so it cannot arrive before the circuit settles.

> [!note]
> [[Two-Phase Handshake]] walks the **same** 4-cycle. It just delivers a datum every *half* lap: $00 \to 10 \to 11$ is one transfer and $11 \to 01 \to 00$ is the next. Two edges per datum instead of four — that single observation is the entire four-versus-two-phase argument, and it says the saving is exactly a factor of two in control-wire transitions, no more.

**Make the level do the latching.** Because $\mathit{req}$ and $\mathit{ack}$ are levels and not events, the receiver's storage can be a plain [[Transparent D Latch]] with its enable tied to $\mathit{req}$ (or, in a pipeline, to the local C-element output): $G=1$ opens the latch during the active half, $G=0$ closes it during the return-to-zero half, and the closing is *paid for by an edge the protocol was going to spend anyway*. Two-phase has no such spare edge — every transition means "new datum", so the storage must be event-sensitive (capture-pass, double-edge-triggered, or XOR toggle logic), which is materially larger and slower than a level-sensitive latch. Four-phase pays in wire transitions; two-phase pays in storage. That is the whole trade, and it is decided by whether the wire or the logic dominates.

**Price the cycle.** Let $t_f$ be forward delay (sender's control to receiver, including the matched delay) and $t_r$ the reverse. Then throughput is limited by

$$T_{\text{cycle}} \;=\; 2\,(t_f + t_r)$$

while *latency* to deliver one datum is only $t_f$ — the sender may prepare the next datum during the return-to-zero half, so the second round trip costs throughput, not delay. The forward path carries the bundled-data timing obligation unchanged from the synchronous world,

$$t_{\text{matched}} \;\ge\; t_{pd,\max}(\text{datapath}) + t_{\text{setup}}$$

which is the clock-period constraint made *local* to one stage: the same worst-case number, but only this stage pays it, and only when this stage is used.

**Choose where the data may change.** The four edges give three sensible validity windows, and the choice is a real specification, not a detail. In the **broad** variant (drawn above) $d$ is held from before `req↑` until after `ack↓`, so the receiver may latch at any point in the cycle and there is no hold-time argument to make. In the **early** variant $d$ need only be valid from `req↑` to `ack↑`, which frees the sender a full round trip earlier but obliges the receiver to have captured by the moment it raises $\mathit{ack}$ — a hold-time constraint on the receiver's latch that the broad protocol simply does not have. A **late** variant places the window in the return-to-zero half instead. Broad is the default because it is the one with no timing side-condition.

**Where the protocol becomes a gate.** The sender and receiver controllers both need to *hold* a level while waiting for the other party, and the primitive that does exactly that is the [[Muller C-Element]]: output goes to 1 when all inputs are 1, to 0 when all are 0, and holds otherwise. For two inputs,

$$Y \;=\; ab + (a+b)\,y \;=\; \mathrm{maj}(a,b,y)$$

Expanding by distributivity of AND over OR gives $Y = ab + ay + by$ — the **complete sum**, all three prime implicants. The third term is the consensus term from [[Boolean Algebra]]; it is redundant for the function and mandatory for the circuit, because dropping it reintroduces a static-1 hazard on the $a{:}1\to0$ transition while $b=y=1$ (see [[Static Hazards]]). "Hold when the inputs disagree" is literally "wait for the other party's phase", which is why one gate implements one handshake.

**Occupancy is the four-phase tax again, one level up.** Chain those C-elements into a [[Muller Pipeline]] and the return-to-zero requirement says a stage may only advance when its successor has *emptied*, so full and empty stages alternate down the chain: $2N$ stages hold at most $N$ tokens. Half the latches of a four-phase [[Micropipeline]] are bubbles at peak throughput. Two-phase does not pay this, because there is no empty phase to wait for.

**FPGA mapping inverts the whole argument.** The C-element's self-loop is a combinational cycle, which static timing analysis cannot traverse; Vivado needs `ALLOW_COMBINATORIAL_LOOPS` plus a `set_disable_timing`, its logic optimiser then deletes the consensus term you added on purpose, and the matched delay line collapses to a wire unless it is a `CARRY4` chain nailed down with `DONT_TOUCH` and a placement constraint. So on [[FPGAs]] a four-phase handshake is almost always built *clocked* — and a clocked four-phase handshake is [[Handshake Ready-Valid]] with a mandatory idle phase bolted on. Ready/valid transfers on every cycle where both are high; four-phase forces a gap after each transfer and buys nothing for it. Four-phase earns its keep only where there is no clock to begin with.

$$\boxed{\;(\mathit{req},\mathit{ack}):\;00 \to 10 \to 11 \to 01 \to 00,\qquad T_{\text{cycle}} = 2(t_f + t_r),\qquad \text{latency} = t_f\;}$$

## When it breaks

- **Reset must land on $00$.** Both wires have to leave reset low *together*. Come up at $11$ or $01$ and each end is waiting for an edge the other already believes it sent; the link deadlocks silently and no amount of data will restart it. This is the single most common bring-up failure of an async link.
- **Long links.** Once $t_f$ and $t_r$ are dominated by wire flight time, the return-to-zero half is pure dead time and [[Two-Phase Handshake]] halves $T_{\text{cycle}}$ for free. That crossover is why [[Network-On-Chip]] links are the canonical two-phase application.
- **Early protocol, slow receiver.** The early variant's hold obligation is a *timing* assumption smuggled into a protocol whose selling point is not having any. If you cannot bound the receiver's capture delay, use broad.
- **The matched delay is a bound, not a guarantee.** It must hold across process, voltage and temperature with margin. Near threshold, $t_{pd}$ spreads by orders of magnitude and no delay line tracks it; that is where [[Dual-Rail Encoding]] takes over and the timing assumption is replaced by [[Completion Detection Tree]] logic — built from C-elements rather than ANDs precisely so the return-to-spacer phase is also acknowledged.
- **FPGA.** Not buildable as drawn — see above. The honest FPGA scope for this material is the [[Asynchronous FIFO]].
- **Two senders.** The protocol assumes a single initiator per link. Contention needs a [[Mutual Exclusion Element]]; a four-phase handshake will not arbitrate for you.

## RTL (Spade)

`spade: not-expressible`. The four-phase link as drawn is level-sensitive combinational feedback, and Spade has no latch primitive — a `let` cannot refer to itself, so the C-element that holds the phase cannot be written:

```spade
fn celem(a: bool, b: bool) -> bool {
    let y = (a && b) || ((a || b) && y);
    y
}
```

```
error: Use of undeclared name y
  ┌─ celem.spade:2:38
  │
2 │     let y = (a && b) || ((a || b) && y);
  │                                      ^ Undeclared name
```

Passing `y` in as an argument would compile, but it would be a mux, not a latch. What Spade *is* native at is the clocked version — the same protocol with a register in place of the hold. Encode the state as the four phases, which are exactly the four $(\mathit{req},\mathit{ack})$ values of the Gray cycle:

```spade
enum Phase {
    Idle,   // (req, ack) = 00
    Req,    // (req, ack) = 10
    Ack,    // (req, ack) = 11
    Rtz,    // (req, ack) = 01
}

entity four_phase_sender(clk: clock, rst: bool, go: bool, ack: bool) -> (bool, bool) {
    reg(clk) phase reset(rst: Phase::Idle) = match phase {
        Phase::Idle => if go  { Phase::Req } else { Phase::Idle },
        Phase::Req  => if ack { Phase::Ack } else { Phase::Req  },
        Phase::Ack  => Phase::Rtz,
        Phase::Rtz  => if ack { Phase::Rtz } else { Phase::Idle },
    };
    let req = match phase {
        Phase::Req => true,
        Phase::Ack => true,
        _          => false,
    };
    let done = match phase {
        Phase::Rtz => !ack,
        _          => false,
    };
    (req, done)
}
```

`req` is the upper wire of the diagram and `ack` the lower one; `go` is the sender's "datum ready" and `done` pulses for one cycle at edge ④. The state register is 2 bits and its encoding *is* the protocol state, so `Idle → Req` is edge ①, `Req → Ack` is the sender observing edge ②, `Ack → Rtz` is edge ③, and `Rtz → Idle` is observing edge ④. The `Ack` state exists only to hold `req` high for the cycle in which the drop is decided — merge it away and you lose the one-to-one correspondence with the four phases.

What this captures: the sequencing, the deadlock-freedom, and the fact that a transaction visits all four states. What it does **not** capture is the entire point of the original — the register means the controller now samples `ack` on a clock edge, so `ack` is a clock-domain crossing needing [[Asynchronous FIFO]]-style synchronisers, the delay-insensitivity is gone, and $T_{\text{cycle}}$ becomes a whole number of clock periods rather than $2(t_f + t_r)$.

## Related Notes

- [[Two-Phase Handshake]] – compares: the same 4-cycle at half a lap per datum; wins when the wire dominates, loses when the storage does.
- [[Muller C-Element]] – depends-on: the gate that holds a phase, and the reason this protocol is not expressible without combinational feedback.
- [[Transparent D Latch]] – depends-on: the level-sensitive storage that four-phase makes free by handing it a level instead of an event.
- [[Bundled-Data Interface]] – extends: wraps this protocol around a single-rail datapath plus a matched delay.
- [[Matched Delay Line]] – supports: supplies the $t_{\text{matched}}$ bound the forward path assumes.
- [[Muller Pipeline]] – extends: chains the handshake into a self-timed FIFO, where return-to-zero costs $2N$ stages per $N$ tokens.
- [[Micropipeline]] – extends: hangs latches off that chain to get a datapath.
- [[Dual-Rail Encoding]] – counter-example: drops the timing assumption entirely by encoding validity into the data, so the handshake needs no request wire at all.
- [[Completion Detection Tree]] – supports: replaces the matched delay with a function of the data when the timing assumption cannot be met.
- [[Choosing an Asynchronous Style]] – compares: where four-phase sits against every sibling protocol.
- [[Handshake Ready-Valid]] – compares: what the clocked degeneration of this protocol is normally called.
- [[Race-Free State Assignment]] – supports: the Gray-cycle property the protocol gets for free is what that note has to work for.

## References

No assigned book source; written from standard digital-design canon.

- J. Sparsø & S. Furber, *Principles of Asynchronous Circuit Design* — four-phase vs. two-phase signalling, bundled data, the early/broad/late validity variants, Muller pipelines.
- S. H. Unger, *Asynchronous Sequential Switching Circuits* — fundamental mode, race classification.
- I. E. Sutherland, "Micropipelines" (Turing Award lecture) — the transition-signalling alternative and its storage cost.
- N. Weste & D. Harris, *CMOS VLSI Design* — C-element circuit forms, latch-based storage, clock-domain crossing.
- M. M. Mano & M. D. Ciletti, *Digital Design* — race-free state assignment, unit-distance encodings.
