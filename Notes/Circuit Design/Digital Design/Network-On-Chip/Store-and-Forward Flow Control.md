---
title: "Store-and-Forward Flow Control"
description: "Allocates buffer and channel per packet and forwards nothing until the tail lands — trivial control, at H*(t_r+L) latency and B >= L buffering."
kind: circuit
source: "6.3) Network-On-Chip §Flow control — no book source"
status: seed
spade: simulated
tags: [digital, network-on-chip, flow-control, buffering, latency]
aliases:
  - Store-and-Forward
  - Store and Forward
  - Store-and-Forward Switching
  - Store-and-Forward Routing
  - Packet-Buffer Flow Control
  - SAF Flow Control
---

# Store-and-Forward Flow Control

The flow control that allocates the input buffer and the output channel per packet and releases no flit until the tail flit has been written — the only scheme whose zero-load latency multiplies hop count by packet length instead of adding them.

```tikz title="Store-and-forward over three hops: each hop fully serializes the packet before the next begins, and the input-port gate that enforces it"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ================= time-space diagram: L=4, t_r=2, H=3 =================
  \node[anchor=west] at (-2.7,3.55) {\textbf{store-and-forward, $L=4$, $t_r=2$, $H=3$}};

  % --- hop 1 : link 0 -> 1 ---
  \node[anchor=east] at (-0.15,2.55) {link $0\!\to\!1$};
  \draw[fill=black!10] (0,2.3) rectangle (0.9,2.8);
  \node at (0.45,2.55) {$t_r$};
  \draw (0.9,2.3) rectangle (2.7,2.8);
  \foreach \k in {1,2,3} { \draw (0.9+0.45*\k,2.3) -- (0.9+0.45*\k,2.8); }
  \node at (1.125,2.55) {\tiny h};
  \node at (2.475,2.55) {\tiny t};
  \node[anchor=south] at (1.8,2.82) {$L$ cycles of serialization};

  % --- hop 2 : link 1 -> 2 ---
  \node[anchor=east] at (-0.15,1.65) {link $1\!\to\!2$};
  \draw[fill=black!10] (2.7,1.4) rectangle (3.6,1.9);
  \node at (3.15,1.65) {$t_r$};
  \draw (3.6,1.4) rectangle (5.4,1.9);
  \foreach \k in {1,2,3} { \draw (3.6+0.45*\k,1.4) -- (3.6+0.45*\k,1.9); }
  \node at (3.825,1.65) {\tiny h};
  \node at (5.175,1.65) {\tiny t};

  % --- hop 3 : link 2 -> 3 ---
  \node[anchor=east] at (-0.15,0.75) {link $2\!\to\!3$};
  \draw[fill=black!10] (5.4,0.5) rectangle (6.3,1.0);
  \node at (5.85,0.75) {$t_r$};
  \draw (6.3,0.5) rectangle (8.1,1.0);
  \foreach \k in {1,2,3} { \draw (6.3+0.45*\k,0.5) -- (6.3+0.45*\k,1.0); }
  \node at (6.525,0.75) {\tiny h};
  \node at (7.875,0.75) {\tiny t};

  % --- "tail landed" barriers: the next hop cannot start before these ---
  \draw[dashed] (2.7,0.1) -- (2.7,2.3);
  \draw[dashed] (5.4,0.1) -- (5.4,1.4);
  \draw[dashed] (8.1,0.1) -- (8.1,0.5);

  % --- time axis ---
  \draw[->] (-0.15,0.1) -- (9.0,0.1);
  \node[anchor=west] at (9.0,0.35) {$t$};
  \foreach \x in {0,2.7,5.4,8.1} { \draw (\x,0.1) -- (\x,-0.05); }
  \node[anchor=north] at (0,-0.05) {$0$};
  \node[anchor=north] at (2.7,-0.05) {$t_r{+}L$};
  \node[anchor=north] at (5.4,-0.05) {$2(t_r{+}L)$};
  \node[anchor=north] at (8.1,-0.05) {$H(t_r{+}L)$};

  % ================= input-port control datapath =================
  \node[anchor=west] at (-2.7,-1.05) {\textbf{one input port: the gate that enforces it}};

  % incoming flit stream
  \draw[->] (-2.3,-3.1) -- (0,-3.1);
  \node[anchor=south] at (-1.7,-3.06) {$w$};
  \node[anchor=north] at (-1.7,-3.14) {flits};

  % buffer
  \draw (0,-3.6) rectangle (2.4,-2.6);
  \node[align=center] at (1.2,-3.1) {input buffer\\$B\times w$, $B\ge L$};

  % tail-bit tap into the control
  \fill (-1.0,-3.1) circle (1.5pt);
  \draw[->] (-1.0,-3.1) -- (-1.0,-1.85) -- (0,-1.85);
  \node[anchor=east] at (-1.1,-2.05) {tail: $1$};

  % flit counter / tail detect
  \draw (0,-2.3) rectangle (2.4,-1.4);
  \node[align=center] at (1.2,-1.85) {flit counter\\$\lceil\log_2(B{+}1)\rceil$ bits};

  % AND gate: buffer read enable
  \node[and port] (g) at (4.6,-2.95) {};
  \draw (2.4,-3.15) -- (g.in 2);
  \node[anchor=south] at (3.2,-3.11) {$w$};
  \draw (2.4,-1.85) -- (3.6,-1.85) -- (3.6,-2.75) -- (g.in 1);
  \node[anchor=south west] at (2.45,-1.8) {packet\_ready: $1$};

  % out to crossbar
  \draw[->] (g.out) -- (6.4,-2.95);
  \node[anchor=south] at (5.7,-2.91) {$w$};
  \draw (6.4,-3.55) rectangle (8.8,-2.35);
  \node[align=center] at (7.6,-2.95) {crossbar $+$\\output link};

  \node[anchor=west] at (-2.7,-4.15) {no flit leaves until the tail flit has been written: $B\ge L$, and $B\ge 2L$ to keep the input link busy};

\end{circuitikz}
\end{document}
```

**Fix the two resources a hop allocates, and the whole flow-control taxonomy is a choice of granularity for each.** A packet is $L$ flits of $w$ bits; a flit carries one head bit and one tail bit alongside its $w$ payload bits, and a router has $p$ ports with $B$ flits of buffer per input, so an occupancy count needs $\lceil\log_2(B{+}1)\rceil$ bits. Every hop must claim two things — an input buffer downstream, and the output channel that reaches it. Store-and-forward claims both **per packet**, and adds one further constraint that neither sibling makes: the claim on the output channel is not exercised until the packet is *complete*. [[Virtual Cut-Through Flow Control]] keeps per-packet allocation and drops that last constraint; [[Wormhole Flow Control]] keeps the channel per packet but drops the buffer to per flit. Those three points are the whole design space, and store-and-forward is the corner where control is cheapest and everything else is worst.

**The tail-arrival rule serializes the packet once per hop, which turns a sum into a product.** Take one hop. The link delivers one flit per cycle, so the last flit of an $L$-flit packet lands $L$ cycles after the first; the router pipeline — route computation, switch allocation, switch traversal — contributes $t_r$ cycles. Under store-and-forward the *whole* of one hop must retire before any of the next begins, because hop $h{+}1$ cannot see a head flit until hop $h$ has written its tail. Hops are therefore strictly sequential rather than overlapped, and the latency is a plain sum of $H$ identical terms:

$$T_0=\sum_{h=1}^{H}\bigl(t_r+L\bigr)=H\,(t_r+L)=H\,t_r+H\,L$$

Cut-through and wormhole break the sequencing by letting flit $i$ of hop $h{+}1$ start while flit $i{+}L'$ of hop $h$ is still moving, which pipelines the serialization across all hops so it is paid once: $T_0=H\,t_r+(L-1)$. Subtracting gives the price of the rule in closed form,

$$\Delta T_0 = H(t_r+L)-\bigl(H t_r + L - 1\bigr)= L(H-1)+1$$

so the penalty is the *product* of packet length and hop count, not a constant. At $L=16$, $H=8$, $t_r=3$ that is $152$ cycles against $39$ — a $113$-cycle penalty, and it grows with mesh diameter $\Theta(\sqrt{N})$ ([[Network-On-Chip]]) while the sibling schemes do not.

> [!important] The cost is $L(H-1)+1$, and no amount of buffer buys it back.
> Every other flow-control decision trades area against throughput and can be tuned. This one is a latency term fixed by the *rule*, not by the sizing: deepen the buffers, widen the links, shorten the router pipeline, and $L(H-1)+1$ is untouched. That is why store-and-forward disappeared from on-chip networks even though its control logic is a tenth of wormhole's.

**Full-packet residency forces $B\ge L$, and single-buffering costs a further factor of two on the link.** The buffer must hold every flit of the packet at once, so $B\ge L$ flits, $Bw$ bits per input port and $pBw$ bits per router. Worse, allocation is per packet, so a second packet cannot begin writing into the port while the first is still resident — the port alternates $L$ cycles of receiving with $L$ cycles of draining, and the input link idles for half of every $2L$-cycle period:

$$\eta=\frac{L}{L+L}=\frac{1}{2}\qquad (B=L)$$

Two packet slots and a $2{:}1$ mux fix it — the port receives into slot $A$ while draining slot $B$ — so **full-rate store-and-forward needs $B\ge 2L$**, i.e. $2pLw$ bits per router. Contrast the wormhole floor, which is $B\ge t_{crt}$ from the credit round trip and is *independent of $L$* ([[Credit-Based Flow Control]]): at $L=16$ and a five-cycle credit loop, wormhole wants $5$ flits of buffer per input and full-rate store-and-forward wants $32$. On ASIC that ratio is the deciding number, because a per-input SRAM macro of $32w$ bits at every one of $p$ ports on every router in the mesh dominates the router area. On FPGA it very nearly reverses: a $B\times w$ FIFO of any depth up to a block RAM's capacity costs exactly one block RAM, so growing $B$ from $5$ to $32$ is free and the buffer objection evaporates ([[FPGAs]]) — store-and-forward's remaining problem there is purely the latency term.

**What you get back is that the control logic is a counter and a comparator.** There is no per-flit credit counter, no virtual-channel state, no worm to track across routers. Backpressure is one wire at packet granularity — "I have room for a packet" — instead of the $\lceil\log_2(B{+}1)\rceil$-bit up/down mirror that per-flit schemes need at every upstream port. Route computation runs once, on the head flit, and its $\lceil\log_2 p\rceil$-bit result stays valid for the whole drain, so it need not be latched into per-VC state and re-consulted; the crossbar select of $p\lceil\log_2 p\rceil$ bits is held for $L$ cycles rather than re-arbitrated per flit ([[Crossbar Switch]]). Deadlock freedom is *not* free — the channel dependency graph must still be acyclic, so [[Turn Model Routing]] or its equivalent is still mandatory — but the dependency chains are short: a blocked packet occupies exactly one buffer at exactly one router, and can never hold a chain of channels the way a stalled worm does. Head-of-line blocking is correspondingly confined to a single node.

**The one thing only this scheme offers is that the entire packet is in one place at every hop.** Anything requiring the whole packet becomes free: a CRC check with drop-and-retransmit at each hop, packet-level reordering, header rewriting, compression, protocol conversion at a bridge. That is exactly the trade that made store-and-forward correct for the long, error-prone, expensive links of 1980s multicomputers and inter-chip networks — per-hop error recovery was worth $L(H-1)$ cycles. On chip the trade inverts on both axes at once: links are short and essentially error-free, so per-hop checking buys nothing, while buffers are the scarcest resource, so $B\ge2L$ is the expensive half. The scheme survives on-chip only at the network *boundary*, where the network interface must reassemble the packet into a burst for the core regardless — the last hop is store-and-forward whether the fabric is or not.

$$\boxed{\ T_0=H(t_r+L),\qquad B\ge L\ \text{(correct)},\quad B\ge 2L\ \text{(full rate)},\qquad \Delta T_0=L(H-1)+1\ }$$

> [!warning] $\eta=\tfrac12$ and the $B\ge 2L$ double-buffering bound are derived here, not quoted
> The source note states only $B\ge L$ and $T_0=H(t_r+L)$. The half-rate result follows from per-packet allocation on a single buffer slot and is standard, but it is a derivation in this note rather than a sourced claim — check it against your own port model before sizing.

> [!warning] No sourced area, power or frequency figures
> This topic has no textbook source in the vault. Every quantity above is structural — cycles, flits, bits of storage, gates of control — and follows from the derivations. Absolute area, static power and $f_{\max}$ depend on process and fabric and must come from synthesis.

**When it breaks**

- **At $L=1$ the taxonomy collapses.** Single-flit packets make store-and-forward, cut-through and wormhole the same circuit: $T_0=H(t_r+1)=Ht_r+(L{-}1)+H$ reduces to the common case and $B\ge L$ is vacuous. Every claim in this note is a statement about $L>1$.
- **It is dominated, not merely worse.** [[Virtual Cut-Through Flow Control]] needs the *same* $B\ge L$ buffer, has the *same* packet-granular single-router blocking, and costs $L(H-1)+1$ fewer cycles. There is no buffer budget at which store-and-forward is the better of the two; the only reason to choose it is a per-hop operation that needs the whole packet.
- **$B$ becomes a function of the longest message in the protocol.** One burst-write transaction with a long payload sizes every input port of every router in the network, because $B\ge L$ must hold for the worst-case $L$. Wormhole's decoupling of $B$ from $L$ exists precisely to break this coupling.
- **A packet with no tail wedges the port forever.** `packet_ready` is only ever set by a tail flit, so a truncated or malformed packet leaves the buffer occupied and the gate closed permanently, and the occupancy counter wraps once more than $2^{\lceil\log_2(B+1)\rceil}-1$ flits arrive. A timeout-and-flush is mandatory in any real port and is not shown here.
- **Virtual channels are unaffordable on top of it.** A single packet buffer per input saturates at $2-\sqrt2\approx0.586$ of capacity under uniform random traffic (Karol's input-queued bound), and the standard escape — $V$ independent heads for the arbiter to choose from ([[Virtual Channel Buffer]]) — costs $V$ *whole-packet* buffers here, $VLw$ bits per port against wormhole's $V t_{crt} w$. Store-and-forward and virtual channels are therefore almost never combined, which leaves the $0.586$ ceiling standing.

**RTL (Spade)**

```spade
entity sf_ctrl<#uint CW>(
    clk: clock,
    rst: bool,
    in_valid: bool,
    in_tail: bool,
    grant: bool,
) -> (bool, uint<CW>) {
    decl fill;
    decl whole;

    let accept    = in_valid && !whole;
    let out_valid = whole && (fill != 0);
    let drain     = out_valid && grant;

    reg(clk) whole: bool reset(rst: false) =
        if accept && in_tail {
            true
        } else if drain && (fill == 1) {
            false
        } else {
            whole
        };

    reg(clk) fill: uint<CW> reset(rst: 0) =
        match (accept, drain) {
            (true, false) => trunc(fill + 1),
            (false, true) => trunc(fill - 1),
            _ => fill,
        };

    (out_valid, fill)
}
```

`fill` is the flit-counter box of the diagram and `out_valid` is the AND gate: `whole` is the registered `packet_ready`, set by the tail flit and cleared as the last flit leaves, and it gates the read port for exactly $L$ cycles. `accept = in_valid && !whole` *is* per-packet buffer allocation — writes are refused while a complete packet is resident, which is the single-slot $B=L$ port whose $\eta$ is $\tfrac12$; double-buffering is two of these plus a $2{:}1$ mux on the read side. Widths: `fill` is `uint<CW>` with $CW=\lceil\log_2(B{+}1)\rceil$, and both `fill + 1` and `fill - 1` return $CW{+}1$ bits in Spade, so each is `trunc`ed back — which is exactly the silent wrap of the missing-tail case above, not a guard against it. Everything but the two registers is combinational, one gate deep; the $B\times w$ datapath FIFO is not modelled here (it is `std::mem::fifo`), and synthesis will fold the two `trunc`ed adders into one adder with an inverted operand rather than the two the `match` reads as.

**Related Notes**

- [[Virtual Cut-Through Flow Control]] – compares: identical per-packet allocation and identical $B\ge L$, minus the wait for the tail — strictly dominates this on latency.
- [[Wormhole Flow Control]] – compares: allocates buffers per flit instead, decoupling $B$ from $L$ at the cost of a worm that stalls across several routers.
- [[Credit-Based Flow Control]] – extends: the per-flit backpressure this scheme does not need, and the $t_{crt}$ floor that replaces $B\ge L$ once you have it.
- [[Virtual Channel Buffer]] – counter-example: the standard cure for the $0.586$ head-of-line ceiling, priced at one whole-packet buffer per VC here.
- [[Turn Model Routing]] – depends-on: packet-granular blocking shortens dependency chains but does not remove the need for an acyclic channel dependency graph.
- [[Crossbar Switch]] – supports: what the gated output drives, with its select held for the whole $L$-flit drain.
- [[Choosing a Router Architecture]] – compares: where this sits against every sibling.

## References

- [[6.3) Network-On-Chip]] — §Flow control: the three-scheme taxonomy and which resource each allocates per packet versus per flit; $T_0=H(t_r+L)$ and the $B\ge L$ requirement; the comparison table (buffer per input, $T_0$, head-of-line granularity); the credit round-trip $t_{crt}$ and $\eta=\min(1,B/t_{crt})$ used here only for the wormhole contrast; the $2-\sqrt2\approx0.586$ input-queued switch bound and the virtual-channel escape.
- No textbook source for this topic in the vault. The material is standard: the store-and-forward / cut-through / wormhole taxonomy and the $H(t_r+L)$ latency model are treated at length in Dally & Towles, *Principles and Practices of Interconnection Networks*, ch. 12–13, which is the source the long-form note itself cites. Page numbers are deliberately omitted — no copy was consulted for this note.
