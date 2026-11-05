To document and extrapolate my research, here are timelines that I have met, and plan to meet in the future.

https://github.com/OpenFAT For Analog Tooling
https://github.com/OmarSiwy For Analog Projects

Whenever, I write something its for the week of. So Oct7th == Oct7th-Oct14th.

## Oct 7th:
- Discuss the Research Direction
	- Agree on Analog Compute (ideally replacing systollic arrays)
- Discuss tooling, realize that there is a huge need for it because iteration is slow. Do research...
	- [[The Workflow]] [[Tooling]]

## Oct 14th:
- Analog Compute prototype ready
	- Same throughput as Etched Sohu claims (toks/s) better toks/s/W
	- However, project stopped as iteration was too slow.
- Exposed to COFFEE, and it seems like a good application and even more reason to develop the tooling furhter.
=> Will be pursued as tooling gets better.

[[Analog Compute Research]]

## Oct 21st:
- Boring 2 weeks of Tooling, optimizing and optimizing.
	- ESpice Results are MUCH better than HSpice and Spectre and scales much better at post-layout circuits.
		- Can parallelize so many runs accross the GPU.
	- VerA works and is conformant
		- TODO!: Work on getting the executables smaller, which will in turn speed up ESpice as well. Seperate Dependency from Device Logic that should turn 250MB ESpice executable -> 30? rough guess
	- Schemify works
		- For ECE 636, I've created a plugin that allows import/export to Cadence Virtuoso, which will allow me to validate my work at the end for Analog Compute and COFFEE across propietary simulators etc... easily
	- Analog-Skills the private repo, is also done with my Design Team Co-Op verifying it and testing it accross our projects, and it works clean.

## Nov 4th:
- One last push for the tooling.
	- Doing the VerA Change because I want to be done with this, no more tooling, putting my full focus on the projects for the rest of the semester.
	- ESpice has stuff that can be done AFK A/B testing while I'm sleeping to see if its an improvement or not, but functionality and accuracy wise, it is done.
- Starting weekend, get started on Analog Compute again running overnight A/B research.
- Monday, get working on the COFFEE replacement with the decisions made, and running an overnight run on tuesday (A/B research/testing).

## Nov 11th:
[Extrapolation]
- Results for Analog Compute and COFFEE replacement, but still not polished.

## Nov 18th:
[Extrapolation]
- Results should be polished at this stage, tooling should also be good.
- Discuss writing a paper, or possibly papers, and also see if it would be a good idea to message professors about using the tooling before I post it online so I can get internal critiques.

## Nov 25th:
[Extrapolation]
- Rest of the semester is meetings about reviewing the papers and their progress.