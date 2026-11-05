---
title: Large-Project Maintainer
description: How a compiler or simulator keeps moving on GitHub while every consumer keeps a working version. Pinned pointers instead of a dev branch, a merge gate instead of discipline, releases whose numbers are measured, and the CI tiers each project needs, learned from git, Rust, Linux, nixpkgs, TigerBeetle, Zig, SQLite and curl.
publishedAt: 2026-10-21
updatedAt: 2026-10-21
slug: large-project-maintainer
tags:
  - engineering
  - tooling
draft: false
---
Two of my projects depend on each other. ESPice compiles 86 Verilog-A models through VerA at build time, pins VerA by commit and content hash, and installs with `nix run github:OmarSiwy/ESPice`, which resolves whatever `main` is at that second. VerA tagged eleven releases between 18 and 20 October. This article answers how both stay usable while both move: what a consumer follows, what proves it works, and what a `dev` branch would and would not buy. Most of it I learned from projects that have run longer than mine: git, Rust, Linux, nixpkgs, TigerBeetle, Zig, SQLite and curl. The rest I learned by auditing my own repositories, and that part is not flattering.

## Who follows what

```tikz title="Figure 1. Three pointers a consumer can follow, and what has to be true for each. Only the bottom row follows the working branch, and a merge gate protects it more cheaply than a second branch would."
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

A consumer follows one of three pointers, and each needs a different proof.

A **pinned revision**: a commit plus a content hash in `build.zig.zon`, a version in `Cargo.lock`, a tarball in `sources.json`. Nothing I do on `main` can break it. Zig's package manager fetches the URL and verifies a hash computed from the file contents when `zig fetch --save` recorded it; Cargo resolves a registry version or a locked git revision. These consumers need the revision's CI to have been green when I tagged it, and nothing else.

A **release pointer** that moves only when I say: a tag with assets and `SHA256SUMS`, or VerA's `#latest`, a Nix output built from `sources.json`, which a workflow regenerates after every published release. nixpkgs calls this a channel: `nixos-unstable` advances only when Hydra's `tested` job passes for a commit. These consumers need the release job to prove what it ships.

The **default branch head**: `nix run github:owner/repo` with no ref, `go get` of an untagged module, anyone who clones and builds. These consumers follow my working branch whether I like it or not, and this is the only pointer a `dev` branch would protect. The cheaper protection is the one nixpkgs chose: never let a red commit onto the branch at all.

## Main is green by machine

Graydon Hoare wrote the rule in 2014 for Rust's bors: automatically maintain a repository of code that always passes all the tests. Automatically is the word. The machine tests the merge result, not the branch, and merges only on green, so `main` cannot be red by accident. GitHub's merge queue has done this natively since July 2023: a pull request joins a `merge_group` built from the current base plus the queue ahead of it, a workflow on the `merge_group` event tests exactly that commit, and a failure removes the request from the queue. Classic branch protection's "require branches to be up to date" approximates it with a manual rebase per merge.

The rule has a price, and Rust shows it. Each approved change is tested alone against a CI of about three and a half hours, so the project merges roughly ten changes a day and batches small ones into rollups. LLVM and Chromium chose the other side: land first, test after, and revert to green rather than fix forward, which LLVM's developer policy calls normal and healthy. That works because a gardener rotation watches the tree all day, with the single priority that the tree stays open. A project without a rotation gets a red `main` nobody owns. Below a few merges an hour, pre-merge gating is free and the queue is the whole mechanism. Above it you are Rust, and you need rollups, or LLVM, and you need people.

My repositories have the gate and not the machine. VerA's `test`, `cross`, `conformance`, `external` and `nix` workflows run on every push to `main` and every pull request, but `main` has no protection rule, VerA has merged two pull requests in its life and ESPice none, so the gate runs after the commit is already what consumers resolve. Two of the last ten commits on VerA's `main` were made by `github-actions[bot]`, pushing with `GITHUB_TOKEN` because that triggers no workflow and so cannot loop. It also means those commits were never tested. The fix costs nothing: a ruleset requiring the gate's jobs, a queue, and generated files kept out of the branch.

## The dev branch

`dev` is git-flow's `develop`. Vincent Driessen published the model in 2010 and added a note in 2020: it was designed for explicitly versioned software, and a team doing continuous delivery should adopt something simpler such as GitHub flow, whose first rule is that anything in `master` is deployable. Trunk-based development says the same in fewer words: one branch, release branches cut just in time and deleted after.

The projects that run several integration branches run them with a person. git's own `maint`, `master`, `next` and `seen` take each fix on the oldest branch that needs it and merge upwards; a topic forks from the oldest branch it will eventually join and graduates from `next` to `master` once stable; `seen` is a throw-away nobody bases work on. That machine turns because the maintainer reads every topic and posts a "What's cooking" report saying which topics in `next` are ready. Linux opens a two-week merge window, then releases a candidate a week until about the seventh, and `linux-next` previews the next window; its first rule is no regressions, in Linus's words that if the kernel used to work for you, it continues to work for you. nixpkgs sends a change that rebuilds 500 packages to `staging` and one that rebuilds 1,000 there without discussion, promotes to `staging-next` under Hydra, and merges to `master` only when nothing major regressed.

Without that person, `dev` is a second branch to keep green and a merge into `main` that nothing tests. It defers integration; it does not remove it. The one case for a long-lived second branch is the default-branch consumer who cannot pin, and even there the channel pattern wins: keep `main` gated and give them a pointer that moves on green.

Release branches are a different thing, a place for backports and not for work. Rust marks a fix `beta-nominated`, a team marks it `beta-accepted`, and it lands in one rollup against `beta`. LLVM branches twice a year and ships a point release every two weeks for about five months. TigerBeetle pushes `main` to a `release` branch before the weekend so the fuzzers can run on it for two days, and cuts Monday's release only if nothing failed; it skips a week without ceremony, because skipping is cheap. A branch as quarantine, with an owner and an expiry, is fine. A branch as a parallel workspace is a second project.

## Versions are promises, pins are facts

Semantic versioning says a major bump means an incompatible change, and that at 0.y.z anything may change at any time. Cargo narrows the second clause: only the left-most non-zero component is breaking, so 0.11.5 to 0.12.0 may break and 0.11.4 to 0.11.5 may not, and raising the minimum compiler version counts as possibly breaking. Hyrum's law overrides all of it: with enough users, every observable behaviour is depended on, whatever the contract says. `cargo-semver-checks` turns part of the Cargo contract into a CI lint over rustdoc JSON and says plainly that it does not yet cover every way to break semver. Zig has no equivalent, and `minimum_zig_version` in `build.zig.zon` is advisory; the compiler does nothing with it. How to keep the surface small enough to promise anything is in [Writing Clean System-Level Code](/blog/writing-clean-code/).

The toolchain is a dependency and breaks like one. Zig shipped 0.14 in March 2025, 0.15.1 in August, 0.16 in April 2026 and 0.17 on 1 October, each breaking the last. Ghostty pins 0.17.0 and carries a patch that backports a Zig commit; TigerBeetle was still on 0.16.0 three weeks after 0.17.0 shipped. So the pin lives in the repository, enforced by whatever installs the compiler (zig-overlay, `mlugg/setup-zig`, a download script with checksums), and it ships with the release: VerA's `sources.json` records the Zig each release was built with, because `vera` spawns `zig` on the code it emits.

Pins rot when the thing pinned moves. ESPice's compact models come from vendor web servers that rename files, so the archives are re-hosted as assets of a `models-si2-2026-10` release in ESPice itself, and the `build.zig.zon` hashes point at files I control. Mirror every third-party input you hash.

The changelog is for humans. Keep a Changelog says so and calls commit-log diffs a bad idea because they are full of noise. Conventional Commits promises versions and changelogs derived from `fix:` and `feat:` prefixes; the strongest critique is that commit messages and changelogs have different readers, so a tool that merges them serves neither. Mine are written by hand, one line per change, each fix citing its issue, and the numbers in them are measured rather than typed: VerA's publish job re-measures the conformance figures, refuses the tag if the `CHANGELOG.md` section disagrees, and then uses that section verbatim as the release body. A release that misreports a measure is worse than no release.

What is worth automating is the mechanical part. ESPice's release job refuses a tag whose version differs from `build.zig.zon`, reuses the merge gate through `workflow_call`, builds the target matrix with `fail-fast: false`, checks that every expected artifact exists before writing `SHA256SUMS` and a build manifest, marks any version containing a hyphen as a pre-release, and smokes the Linux bundle in a container with no `/nix` and no network. GitHub's `actions/attest` adds a Sigstore provenance statement that `gh attestation verify` checks. release-plz, cargo-release, release-please and GoReleaser each package some of this. None of them knows which number in your changelog has to be re-measured.

## The CI a project needs

The tiers and their budgets are in [Exhaustive Testing](/blog/exhaustive-testing/). This is the list of jobs, each with the reason it exists.

1. **The merge gate.** Build and test on every operating system a release ships for, and gate on the exit code: `zig build test 2>&1 | tail` once produced a green job over a failing build. Formatting runs inside `test`, so nobody argues about it in review. ESPice runs its gate in ReleaseSafe only and says why in the workflow: Zig's self-hosted Debug backend diverged from LLVM on numeric results.
2. **Every artifact for every target, compiled and not run.** A foreign binary cannot run on the runner; `zig build build-all -Dtarget=<t>` over five targets catches the platform break before the release job does.
3. **Documentation that executes.** Every transcript in VerA's book is re-run against the commit, and a page that no longer matches what the compiler prints fails the job. ESPice compiles and runs the C API example from its docs. Prose that is not executed drifts within one release.
4. **Reference suites gated by name.** Disagreements with ngspice, Xyce, the CMC QA decks and iverilog pass only when a row of a `TRIAGE.md` names them with a verdict. A row that names nothing is stale and fails; an unexpected pass fails too. A known-failure list that cannot rot is the only kind worth keeping.
5. **The nightly tier.** The slow evidence the gate cannot afford: bounded fuzzing, every check re-run with its expected value moved 0.1 percent to expose tolerances that see nothing, Jacobians against finite differences, and a ratchet that fails when any requirement's evidence level drops. Scheduled workflows run on the default branch, and GitHub disables them after 60 days without repository activity; a quiet month turns the nightly off.
6. **Downstream contracts.** VerA's report job checks out ESPice's `models` directory and compiles every model with the commit under test; ESPice's gate compiles its pinned VerA. Rust tests the tools that depend on the compiler in-tree through toolstate and risky changes against the whole ecosystem with crater; TigerBeetle validates `main` against the last released tag; nixpkgs-review builds every package a pull request changes; Debian lengthens a package's stay in unstable when its reverse dependencies' tests regress. Pick the cheapest one that sees your consumers.
7. **The release job**, above, plus a package build per system with a binary cache push, so `nix run` is a download and not a compile.

Three settings decide whether any of this holds. `concurrency` with `cancel-in-progress` on pull-request jobs and never on deploys or releases. Actions pinned by commit SHA, as TigerBeetle does, or an explicit decision to trust `@v4` tags. And the 10 GB per-repository cache, evicted least recently used and after seven idle days, which is why [Fast Incremental Builds on Large Projects (Rust & Zig)](/blog/fast-incremental-builds/) spends CI's budget on the shape of the jobs rather than on uploading a local cache.

## Issues and people

An issue tracker is a state machine, not a mailbox. Rust's triage runs on labels anyone may apply: a bug without a reproduction gets `S-needs-repro`, a reproduction that is not minimal gets `E-needs-mcve`, a bisection is recorded, and only then does a team see it. Linux's `MAINTAINERS` file says of every subsystem whether it is Supported, Maintained, Odd Fixes, Orphan or Obsolete. A README should say the same about the whole project, so a consumer can price the risk.

Stale bots are not triage. `actions/stale` closes after 60 days of silence and 7 more of warning. Drew DeVault's objection stands: an issue is a space for the community to work, the maintainer is not obliged to answer each one, and closing on a timer destroys information to improve a number. An open bug costs nothing. A closed real bug costs a user.

curl is the model for a project led by one person at scale: a release every eight weeks on a Wednesday with a ten-day cool-down before it, more than 220 CI jobs spending over 25 CPU-days per calendar day, a strictly linear history with every pull request merged by hand and its message rewritten, and a security process that acts as its own CVE numbering authority with a four-level severity scale instead of CVSS. Its bug bounty ended in January 2026 because valid reports had fallen below five percent of submissions. Nolan Lawson described the other side in 2017: a line of a few hundred people outside the door, each wanting one thing. The tracker's job is to make the line visible, not to make it look short.

## What I am changing

The audit of my own two repositories, ordered by cost to a consumer:

- A ruleset on `main` requiring `test`, `cross` and `conformance`, and the merge queue the day there is a second contributor.
- Generated files out of `main`. The charts and `sources.json` that bots push are untested by construction, and a wrong `sources.json` breaks `#latest` for every Nix user until the next push.
- Actions pinned by SHA, with grouped Dependabot updates for them.
- A manual run before the nightly's 60-day cutoff, or acceptance that it stops.
- One `CONTRIBUTING.md` with the status line and the pin policy, and a `SECURITY.md` that says where to report.

None of these needs a `dev` branch. All of them need the machine to say no before a consumer does.

## References

**Gating and branches**

- Graydon Hoare, "The Not Rocket Science Rule Of Software Engineering" (2014), as preserved at bors.tech and in Mergify's "The origin story of merge queues" (2025)
- GitHub Docs, "Managing a merge queue", docs.github.com, and "GitHub merge queue is generally available", github.blog, 2023-07-12
- rustc dev guide, "Continuous integration", rustc-dev-guide.rust-lang.org/tests/ci.html; Rust Forge, "Rollups" and "Backporting"
- LLVM, "Developer Policy", llvm.org/docs/DeveloperPolicy.html; Chromium, "Gardener", chromium.googlesource.com/chromium/src/+/main/docs/gardener.md
- git, `gitworkflows(7)`, git-scm.com/docs/gitworkflows, and "How to maintain Git", git-scm.com/docs/howto/maintain-git
- Vincent Driessen, "A successful Git branching model" (2010) with the 2020 note of reflection, nvie.com; Scott Chacon, "GitHub Flow" (2011); trunkbaseddevelopment.com
- Linux, "How the development process works" and "Handling regressions", kernel.org/doc/html/latest/process
- nixpkgs, `CONTRIBUTING.md` on staging, and "Channel branches", wiki.nixos.org/wiki/Channel_branches

**Releases and versions**

- TigerBeetle, `docs/internals/releases.md`, `docs/internals/upgrades.md` and `docs/internals/HACKING.md`, github.com/tigerbeetle/tigerbeetle
- Zig, `doc/build.zig.zon.md`, codeberg.org/ziglang/zig; ziglang.org/download/index.json; "Migrating from GitHub to Codeberg" (2025)
- SQLite, "How SQLite Is Tested" and "Long Term Support", sqlite.org; Go, "Go 1 and the Future of Go Programs", go.dev/doc/go1compat; LLVM, "How To Release LLVM"
- semver.org 2.0.0; Cargo, "SemVer Compatibility" and "Rust Version", doc.rust-lang.org/cargo/reference; obi1kenobi/cargo-semver-checks; hyrumslaw.com
- Keep a Changelog 1.1.0, keepachangelog.com; Conventional Commits 1.0.0; Sophia Willows, "Conventional changelogs suck" (2024)
- release-plz.dev; crate-ci/cargo-release; googleapis/release-please; goreleaser.com; GitHub Docs, "Using artifact attestations"

**GitHub mechanics**

- GitHub Docs: "About rulesets", "About protected branches", "About code owners", "Dependabot options reference", "Control the concurrency of workflows and jobs", "Events that trigger workflows", "Caching dependencies to speed up workflows"
- Renovate, "Configuration options", docs.renovatebot.com

**Downstream testing, issues and people**

- rust-lang/crater and its bot usage docs; Rust Forge, "Toolstate" and "Issue triaging"; Mic92/nixpkgs-review; Paul Gevers, "autopkgtest results influence migration" (debian-devel-announce, 2018)
- Linux, "MAINTAINERS", kernel.org/doc/html/latest/process/maintainers.html
- actions/stale README; Drew DeVault, "Stale bot considered harmful" (2021)
- Daniel Stenberg, curl release procedure and security process, curl.se/dev; "A curl 2025 review" and "The end of the curl bug bounty" (2026), daniel.haxx.se; Nolan Lawson, "What it feels like to be an open-source maintainer" (2017)
- VerA, github.com/OmarSiwy/VerA (`.github/workflows`, `tools/conformance.py`, `sources.json`); ESPice, github.com/OmarSiwy/ESPice (`.github/workflows/release.yml`, `tools/release.py`, `build.zig.zon`)
