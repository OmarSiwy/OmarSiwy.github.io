---
title: Fused Normalizer
description: "Merges the naive LZC into the shifter: each level NORs its top 2^j bits, emits c_j and immediately shifts under it, so the MSB-first count bits are consumed as they are produced. O(w_X log w_X) area, and near log w_X delay on FPGA — but no place to do arithmetic on the count, so not for IEEE-754."
kind: circuit
status: stub
spade: verified
tags: [digital, shifters]
---

# Fused Normalizer

ZETTEL-TODO
