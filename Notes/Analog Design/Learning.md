Sources: Razavi = *Design of Analog CMOS ICs* 2nd ed. · Razavi DC = *Analysis and Design of Data Converters* · Tony = Carusone/Johns/Martin · Sedra · Neamen · Murmann = Jespers & Murmann.

Devices:
1) [[MosFETs]] Razavi Ch2,11,17,19 + Murmann Ch1–2
2) [[BJTs]] Sedra + Tony Ch8
3) [[Diodes]] Tony Ch1 + Neamen + Sedra
4) [[Resistor]] Tony Ch1–2 + Razavi Ch19
5) [[Capacitor]] Tony Ch1–2 + Razavi Ch19
6) [[Inductor]] Tony Ch1–2 + Razavi Ch19

Amplifiers:
7) [[Single-Stage]] Razavi Ch3 + Tony Ch3
8) [[Differential Amplifiers]] Razavi Ch4
9) [[Current Mirrors]] Razavi Ch5 + Tony Ch3
10) [[Biasing]] Razavi Ch5 + Tony Ch7
11) [[Operational Amplifiers]] Razavi Ch9 + Tony Ch6
12) [[The Amplifier's Design Sheet]] summary of 7–11

Analysis:
13) [[Frequency Response]] Razavi Ch6 + Tony Ch4
14) [[Noise]] Razavi Ch7 + Tony Ch9
15) [[Feedback]] Razavi Ch8 + Tony Ch5
16) [[Stability]] Razavi Ch10 + Tony Ch6
17) [[Nonlinearity and Mismatch]] Razavi Ch14 + Tony Ch9

Bandgap References:
18) [[Bandgap References]] Razavi Ch12 + Tony Ch7

Switched-Capacitor Circuits:
19) [[Switched-Capacitor Circuits]] Razavi Ch13 + Tony Ch13–14
20) [[Sampling Circuits]] Razavi DC Ch3–4 + Tony Ch11

PLLs:
21) [[Oscillators]] Razavi Ch15
22) [[Phased-Locked Loops]] Razavi Ch16 + Tony Ch19

Comparators:
23) [[Comparators]] Razavi DC Ch5–7 + Tony Ch10

DACs:
24) [[DACs]] Razavi DC Ch8–11 + Tony Ch16

ADCs:
25) [[Data Converter Fundamentals]] Razavi DC Ch1–2,12 + Tony Ch15
26) [[Flash ADCs]] Razavi DC Ch13
27) [[SAR ADCs]] Razavi DC Ch14–16,19
28) [[Pipelined ADCs]] Razavi DC Ch17–19
29) [[Interleaved ADCs]] Razavi DC Ch20
30) [[Delta-Sigma ADCs]] Razavi DC Ch21–24 + Tony Ch18

SerDes: (P = Palermo ECEN720 lecture, in `ref/SerDes/`)
- [[SerDes Learning Path]] prerequisite hierarchy for the papers in `ref/SerDes/`
- S1) [[Channels]] P2–P4 + Palermo 2011 ch.
- S2) [[Signaling and BER]] P4, P9 + Zhang PAM4 tutorial
- S3) [[Link Noise and Jitter]] P9–P10 + Agilent notes
- S4) [[Equalization]] P7–P8 + Hanumolu, Stojanovic
- S5) [[High-Speed Circuit Techniques]] P5, P14 + Shekhar, Kossel
- S6) [[Transmitters]] P5, P7 + Wong, Won, Fukuda
- S7) [[Receivers]] P6, P8 + Razavi DC Ch5–7, Nikolić, Toifl
- S8) [[Clocking and CDR]] P11–P14 + Razavi CDR, Hsieh, Mansuri
- S9) [[Optical Transceivers]] P16
- Papers, in reading order: P1 → Wong 2004 → Zhang → Won 2024 → Lee 2015 → P16

RF & Microwave: (Pozar = *Microwave Engineering* 4th ed.; ECE 373 binder; each note has its own Physics background section)
- R1) [[EM Foundations]] Pozar Ch1
- R2) [[Transmission Lines]] Pozar Ch2–3 + binder
- R3) [[Microwave Network Analysis]] Pozar Ch4 + binder (S/Z/Y/ABCD, power waves)
- R4) [[Smith Chart and Impedance Matching]] Pozar Ch2.4, Ch5 + binder
- R5) [[Microwave Resonators]] Pozar Ch6
- R6) [[Power Dividers and Couplers]] Pozar Ch7
- R7) [[Microwave Filters]] Pozar Ch8 (prototypes in [[Filters]])
- R8) [[RF Noise and Distortion]] Pozar Ch10 (NF/Friis/system linearity; circuit noise in [[Noise]], IP3 basics in [[Nonlinearity and Mismatch]])
- R9) [[Active RF Devices]] Pozar Ch11 (RF-specific only; physics in Devices)
- R10) [[RF Amplifier Design]] Pozar Ch12 + binder (stability, gains, LNA, PA)
- R11) [[Mixers and Microwave Oscillators]] Pozar Ch13 (general oscillators/phase noise live in [[Oscillators]])
- R12) [[RF Systems]] Pozar Ch14

Analog Compute:
31) [[Notes/Analog Design/Analog Compute/Analog Compute]] research papers (CIM, analog solvers)

Digital ICs:
32) [[Digital CMOS Circuits]] Sedra

Filters:
33) [[Filters]] Sedra + Tony Ch12

Layout: (Hastings = *The Art of Analog Layout* 3rd ed.; heavy on visuals)
34) [[CMOS Processing]] Hastings Ch2,4 + Razavi Ch18 + Tony Ch2
35) [[Layout Fundamentals]] Hastings Ch3 + Razavi Ch19.1 + Tony Ch2
36) [[Failure Mechanisms]] Hastings Ch5 (overstress, latch-up, injection)
37) [[Electromigration]] Lienig & Thiele
38) [[Device Matching]] Hastings Ch8,10.2–10.3,11.3,13.2–13.3 + Pelgrom + mismatch papers
39) [[Common-Centroid Layout]] common-centroid papers + Hastings matching rules
40) [[Guard Rings, ESD and Interconnect]] Hastings Ch14 + Razavi Ch19.2
41) [[Substrate Noise]] Charbon et al.
42) [[Floorplanning and Top-Level Assembly]] Hastings Ch15
43) [[Packaging]] Razavi Ch19.3 + Hastings Ch2.8
44) [[Layout Automation]] Balasa/Graeb + Lampaert + layout-automation papers
- Devices notes also pull layout from Hastings: Resistor/Capacitor/Inductor (Ch6–7), BJTs (Ch9–10), Diodes (Ch11), MosFETs (Ch12–13)

Design Flow:
45) [[gm-ID Design Methodology]] Murmann
- [[Analog Design Flow]] · [[Design Centering]] · [[The Minimum, the Loop, and the Sign-off]]

