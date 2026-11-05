---
tags: [dsp, ece313, exam-prep]
---
# Sample Exams — DT LTI Systems, Z-Transform, DTFS, DTFT

Related: [[Discrete Signals and Systems]], [[Z-Transform]], [[Discrete-Time Fourier Transform]], [[System Defintiions]]

Two self-contained practice exams. Try each problem cold first (closed-book, like the real thing), *then* read the walkthrough — every algebra step is shown, nothing is "left to the reader."

---

## Exam 1

### 1. (DT signals/systems, 15 pts)
Given $x[n] = (0.8)^n\cos\!\left(\dfrac{3\pi}{4}n\right)u[n]$.

**(a)** Is $x[n]$ periodic? Justify.
**(b)** Is $x[n]$ absolutely summable? Is it square summable (finite energy)?
**(c)** A system is defined by $y[n] = n\,x[n]$. Determine whether it is linear, time-invariant, causal, and BIBO stable.

### 2. (Convolution, 15 pts)
Let $x[n] = \{1, 2, -1\}$ (nonzero for $n=0,1,2$) and $h[n] = \{1,1,1\}$ (nonzero for $n=0,1,2$).
Compute $y[n] = x[n]*h[n]$ by hand, showing every flip/shift/multiply/sum step.

### 3. (Z-transform, 20 pts)
A causal LTI system satisfies
$$y[n] - \tfrac{3}{4}y[n-1] + \tfrac{1}{8}y[n-2] = x[n].$$
**(a)** Find the transfer function $H(z)$ and its ROC.
**(b)** Find the poles/zeros and state whether the system is BIBO stable.
**(c)** Find $h[n]$ by partial fractions.

### 4. (Z-transform, 15 pts)
Find the inverse Z-transform of
$$X(z) = \frac{1 - \tfrac12 z^{-1}}{(1-\tfrac12 z^{-1})(1+\tfrac13 z^{-1})}, \qquad |z| > \tfrac12.$$

### 5. (DTFS, 15 pts)
Let $x[n]$ be periodic with period $N=4$, one period given by $x[0]=1,\ x[1]=0,\ x[2]=-1,\ x[3]=0$.
**(a)** Compute the DTFS coefficients $c_k$, $k=0,1,2,3$.
**(b)** Verify Parseval's relation (average power) directly from $x[n]$ and from $c_k$.

### 6. (DTFT, 20 pts)
**(a)** Find the DTFT of $x[n] = \left(\tfrac12\right)^{n}u[n] - \left(\tfrac12\right)^{n}u[n-4]$ (hint: write it as a rectangular-windowed geometric sequence, or split into two known pairs).
**(b)** A system has frequency response $H(e^{j\omega}) = 1 - e^{-j\omega}$. Given input $x[n] = \cos\!\left(\tfrac{\pi}{2}n\right)$, find the steady-state output $y[n]$ using the eigenfunction property.

---

## Exam 1 — Full Walkthrough

### 1.
**(a) Periodicity.** $x[n]$ has the factor $u[n]$, so it is zero for $n<0$ — **any one-sided (causal, nontrivial) signal cannot be periodic**, since periodicity requires $x[n]=x[n+N]$ for *all* $n\in\mathbb{Z}$, including negative $n$. Here $x[-1]=0\neq x[-1+N]$ in general (it would have to equal a later nonzero sample). So $x[n]$ is **not periodic**, regardless of what $\omega_0=3\pi/4$ gives.

**(b) Summability.**
$$\sum_{n=-\infty}^{\infty}|x[n]| = \sum_{n=0}^{\infty}(0.8)^n\left|\cos\tfrac{3\pi}{4}n\right| \le \sum_{n=0}^\infty (0.8)^n = \frac{1}{1-0.8}=5 <\infty.$$
Bounding $|\cos(\cdot)|\le 1$ gives a convergent geometric series, so $x[n]$ is **absolutely summable**.
Absolute summability $\Rightarrow$ square summability (bounded sequences: $|x[n]|^2 \le |x[n]|\cdot M$ for the max value, and more directly $\ell^1 \subset \ell^2$ for bounded sequences), and directly:
$$\sum_n |x[n]|^2 \le \sum_{n=0}^\infty (0.8)^{2n} = \frac{1}{1-0.64} = 2.78<\infty.$$
So $x[n]$ has **finite energy** too.

**(c) $y[n]=n\,x[n]$.**
- *Linearity:* Let $x[n]=a x_1[n]+bx_2[n]$. Then $y[n] = n(ax_1[n]+bx_2[n]) = a(nx_1[n])+b(nx_2[n]) = ay_1[n]+by_2[n]$. **Linear** (multiplying by $n$ is a linear operation pointwise).
- *Time invariance:* Let $x'[n]=x[n-n_0]$. Then $\mathcal H\{x'\}[n] = n\,x[n-n_0]$. Compare to $y[n-n_0] = (n-n_0)x[n-n_0]$. These differ by the factor $n$ vs. $(n-n_0)$, so $\mathcal H\{x'\}[n]\neq y[n-n_0]$ in general (e.g. take $x[n]=\delta[n]$: $\mathcal H\{x'\}[n]=n\delta[n-n_0]=n_0\delta[n-n_0]$, while $y[n-n_0] = (n-n_0)\delta[n-n_0]\big|$ evaluated via $x[n]=\delta[n]\Rightarrow y[n]=n\delta[n]=0\Rightarrow y[n-n_0]=0$ for $n_0\ne0$; $n_0\delta[n-n_0]\ne 0$ at $n=n_0$). **Not time-invariant**.
- *Causality:* $y[n_0]=n_0 x[n_0]$ depends only on $x[n_0]$, so it's memoryless, hence **causal**.
- *BIBO stability:* Take $x[n]=u[n]$ (bounded, $|x[n]|\le1$). Then $y[n]=n\,u[n]\to\infty$ as $n\to\infty$, unbounded output from a bounded input. **Not BIBO stable**.

### 2. Convolution
$x[n]=\{1,2,-1\}_{n=0,1,2}$, $h[n]=\{1,1,1\}_{n=0,1,2}$. Output support: $n=0,\dots, (2+2)=4$ (lengths $3+3-1=5$).

Direct sum formula $y[n]=\sum_k x[k]h[n-k]$:

- $n=0$: only $k=0$ overlaps: $x[0]h[0] = 1\cdot1 = 1$.
- $n=1$: $k=0,1$: $x[0]h[1]+x[1]h[0] = 1\cdot1 + 2\cdot1 = 3$.
- $n=2$: $k=0,1,2$: $x[0]h[2]+x[1]h[1]+x[2]h[0] = 1\cdot1+2\cdot1+(-1)\cdot1 = 2$.
- $n=3$: $k=1,2$ (since $h[n-k]$ needs $0\le n-k\le2$, and $x[k]$ needs $0\le k\le2$): $x[1]h[2]+x[2]h[1] = 2\cdot1+(-1)\cdot1 = 1$.
- $n=4$: $k=2$: $x[2]h[2] = (-1)\cdot1 = -1$.

$$y[n] = \{1,\,3,\,2,\,1,\,-1\}_{n=0,1,2,3,4}.$$

**Check:** $\sum y[n] = 1+3+2+1-1=6$, and $\left(\sum x[n]\right)\left(\sum h[n]\right) = (1+2-1)(1+1+1) = 2\cdot3=6$. ✓ (This identity, $\sum y = (\sum x)(\sum h)$, is a quick sanity check since $Y(1)=X(1)H(1)$.)

### 3. Z-transform of the LCCDE
$y[n]-\tfrac34 y[n-1]+\tfrac18 y[n-2] = x[n]$.

**(a)** Z-transform both sides (time-shift property: $y[n-k]\leftrightarrow z^{-k}Y(z)$, zero initial conditions assumed for the transfer-function definition):
$$Y(z)\left(1 - \tfrac34 z^{-1} + \tfrac18 z^{-2}\right) = X(z)$$
$$H(z) = \frac{Y(z)}{X(z)} = \frac{1}{1-\tfrac34 z^{-1}+\tfrac18 z^{-2}}.$$
Causal system $\Rightarrow$ ROC is the exterior of the outermost pole.

**(b)** Factor the denominator. Multiply through by $z^2$: $z^2-\tfrac34 z+\tfrac18 = 0$.
Quadratic formula: $z = \dfrac{\tfrac34 \pm\sqrt{(\tfrac34)^2 - 4\cdot\tfrac18}}{2} = \dfrac{\tfrac34\pm\sqrt{\tfrac9{16}-\tfrac12}}{2} = \dfrac{\tfrac34\pm\sqrt{\tfrac1{16}}}{2} = \dfrac{\tfrac34\pm\tfrac14}{2}$.
So $z = \dfrac{1}{2}$ or $z=\dfrac14$.
In terms of $z^{-1}$: $1-\tfrac34z^{-1}+\tfrac18z^{-2} = (1-\tfrac12z^{-1})(1-\tfrac14z^{-1})$ — check: $(1-\tfrac12z^{-1})(1-\tfrac14z^{-1}) = 1 -\tfrac14z^{-1}-\tfrac12z^{-1}+\tfrac18z^{-2} = 1-\tfrac34z^{-1}+\tfrac18z^{-2}$. ✓

Poles at $z=\tfrac12$ and $z=\tfrac14$. No finite zeros (numerator is constant $1$); there is a zero of order 2 at $z=0$ when written with positive powers of $z$ (not usually asked, but note $H(z)=\dfrac{z^2}{(z-\frac12)(z-\frac14)}$).

Causal ROC: $|z|>\tfrac12$ (outside the outermost pole). Since this ROC includes the unit circle $|z|=1$, the system is **BIBO stable**.

**(c)** Partial fractions:
$$H(z) = \frac{1}{(1-\tfrac12z^{-1})(1-\tfrac14z^{-1})} = \frac{A}{1-\tfrac12z^{-1}} + \frac{B}{1-\tfrac14z^{-1}}.$$
Multiply both sides by $(1-\tfrac12z^{-1})(1-\tfrac14z^{-1})$:
$$1 = A(1-\tfrac14z^{-1}) + B(1-\tfrac12z^{-1}).$$
Set $z^{-1}$ such that $1-\tfrac12z^{-1}=0 \Rightarrow z^{-1}=2$: $1 = A(1-\tfrac14\cdot2) = A(1-\tfrac12)=\tfrac12 A \Rightarrow A=2$.
Set $1-\tfrac14z^{-1}=0 \Rightarrow z^{-1}=4$: $1 = B(1-\tfrac12\cdot4) = B(1-2) = -B \Rightarrow B=-1$.
$$H(z) = \frac{2}{1-\tfrac12z^{-1}} - \frac{1}{1-\tfrac14z^{-1}}, \qquad |z|>\tfrac12.$$
Each term is causal (ROC $|z|>$ pole magnitude) since the overall ROC is $|z|>\tfrac12$ which is outside *both* poles. Using the pair $a^nu[n]\leftrightarrow \dfrac{1}{1-az^{-1}}$, $|z|>|a|$:
$$h[n] = 2\left(\tfrac12\right)^n u[n] - \left(\tfrac14\right)^n u[n].$$

### 4. Inverse Z-transform
$$X(z) = \frac{1-\tfrac12z^{-1}}{(1-\tfrac12z^{-1})(1+\tfrac13z^{-1})}, \quad |z|>\tfrac12.$$
**Cancel the common factor first** — $(1-\tfrac12z^{-1})$ appears in both numerator and denominator:
$$X(z) = \frac{1}{1+\tfrac13z^{-1}}, \qquad |z| > \tfrac12.$$
(Cancellation removes the pole at $z=\tfrac12$, but the stated ROC $|z|>\tfrac12$ is still consistent with — in fact slightly more restrictive than necessary for — the remaining pole at $z=-\tfrac13$; the simplified ROC that matches the single remaining pole is $|z|>\tfrac13$. Either description is acceptable, but note the pole-zero cancellation.)

Match to the standard pair $a^nu[n]\leftrightarrow \dfrac{1}{1-az^{-1}}$, $|z|>|a|$, with $a=-\tfrac13$:
$$x[n] = \left(-\tfrac13\right)^n u[n].$$

### 5. DTFS
$N=4$, $x[0]=1,x[1]=0,x[2]=-1,x[3]=0$.
$$c_k = \frac14\sum_{n=0}^{3}x[n]e^{-j\frac{2\pi}{4}kn} = \frac14\sum_{n=0}^3 x[n]e^{-j\frac{\pi}{2}kn}.$$
Only $n=0$ and $n=2$ contribute ($x[0]=1$, $x[2]=-1$):
$$c_k = \frac14\left(1\cdot e^{0} + (-1)e^{-j\pi k}\right) = \frac14\left(1-e^{-j\pi k}\right).$$
Now evaluate for each $k$, using $e^{-j\pi k} = (-1)^k$:
- $k=0$: $c_0 = \tfrac14(1-1) = 0$.
- $k=1$: $c_1 = \tfrac14(1-(-1)) = \tfrac14(2) = \tfrac12$.
- $k=2$: $c_2 = \tfrac14(1-1) = 0$.
- $k=3$: $c_3 = \tfrac14(1-(-1)) = \tfrac12$.

$$\boxed{c_0=0,\ c_1=\tfrac12,\ c_2=0,\ c_3=\tfrac12.}$$

**Sanity check:** $x[n] = \sum_k c_k e^{j\frac{\pi}{2}kn} = \tfrac12 e^{j\frac\pi2 n} + \tfrac12 e^{j\frac{3\pi}{2}n} = \tfrac12 e^{j\frac\pi2n}+\tfrac12 e^{-j\frac\pi2 n} = \cos\!\left(\tfrac\pi2 n\right)$.
Check against given samples: $\cos(0)=1$ ✓, $\cos(\pi/2)=0$ ✓, $\cos(\pi)=-1$ ✓, $\cos(3\pi/2)=0$ ✓. Matches $x[n]$ exactly — makes sense since $x[n]$ *is* $\cos(\frac\pi2 n)$.

**(b) Parseval.**
Time domain: $\dfrac1N\sum_{n=0}^{3}|x[n]|^2 = \dfrac14(1^2+0^2+(-1)^2+0^2) = \dfrac14(2) = \dfrac12$.
Frequency domain: $\sum_{k=0}^3 |c_k|^2 = 0^2+(\tfrac12)^2+0^2+(\tfrac12)^2 = \tfrac14+\tfrac14 = \tfrac12$.
Both equal $\tfrac12$. ✓

### 6. DTFT

**(a)** Write $x[n] = (\tfrac12)^n\big(u[n]-u[n-4]\big)$, i.e. it's $(\tfrac12)^n$ only for $n=0,1,2,3$ and zero elsewhere (since for $n\ge4$, $u[n]-u[n-4]=0$). Direct sum:
$$X(e^{j\omega}) = \sum_{n=0}^{3}\left(\tfrac12\right)^n e^{-j\omega n} = \sum_{n=0}^{3}\left(\tfrac12 e^{-j\omega}\right)^n.$$
This is a finite geometric series with ratio $r=\tfrac12e^{-j\omega}$, 4 terms:
$$X(e^{j\omega}) = \frac{1-r^4}{1-r} = \frac{1-\left(\tfrac12e^{-j\omega}\right)^4}{1-\tfrac12e^{-j\omega}} = \frac{1-\tfrac1{16}e^{-j4\omega}}{1-\tfrac12e^{-j\omega}}.$$

**(b)** Eigenfunction property: for $x[n]=\cos(\omega_0 n)$ with $\omega_0=\pi/2$, the steady-state output of an LTI system is
$$y[n] = |H(e^{j\omega_0})|\cos\big(\omega_0 n + \angle H(e^{j\omega_0})\big).$$
Compute $H(e^{j\pi/2}) = 1-e^{-j\pi/2} = 1-(-j) = 1+j$.
Magnitude: $|1+j| = \sqrt{1^2+1^2}=\sqrt2$.
Phase: $\angle(1+j) = \arctan\!\left(\tfrac11\right) = \dfrac{\pi}{4}$.
$$y[n] = \sqrt2\,\cos\!\left(\frac\pi2 n + \frac\pi4\right).$$

---

## Exam 2

### 1. (DT signals/systems, 15 pts)
A system is described by $y[n] = x[n]x[n-1]$.
**(a)** Is it linear? Is it time-invariant?
**(b)** Is it BIBO stable? Is it causal?
**(c)** Find the output for $x[n]=u[n]-u[n-3]$.

### 2. (Convolution / LCCDE, 15 pts)
A causal LTI system has impulse response $h[n] = (0.5)^n u[n]$.
**(a)** Find the output $y[n]$ for input $x[n]=u[n]$ using the convolution sum directly (not Z-transforms).
**(b)** Confirm your answer using the LCCDE $y[n]=0.5y[n-1]+x[n]$ by computing $y[0],y[1],y[2]$ recursively and comparing.

### 3. (Z-transform, 20 pts)
Find $X(z)$ and its ROC, and state whether the DTFT exists, for
$$x[n] = \left(\tfrac13\right)^n u[n] + \left(\tfrac12\right)^n u[-n-1].$$

### 4. (Z-transform, 15 pts)
A stable, causal LTI system has
$$H(z) = \frac{1}{1-1.5z^{-1}+0.5z^{-2}}.$$
**(a)** Factor the denominator and find the poles.
**(b)** Explain carefully why "causal" and "stable" together are contradictory for this $H(z)$ — i.e., show no valid ROC choice gives both.

### 5. (DTFS, 15 pts)
$x[n]$ is periodic with period $N=3$: $x[0]=2, x[1]=1, x[2]=1$.
**(a)** Find $c_0,c_1,c_2$.
**(b)** Write $x[n]$ as a sum of (at most) one cosine and a DC term, using the fact that $c_1=c_2^*$ should hold for real $x[n]$ (verify this holds, then simplify).

### 6. (DTFT, 20 pts)
**(a)** State and prove (from the defining sum) the time-shift property: $x[n-n_0] \leftrightarrow e^{-j\omega n_0}X(e^{j\omega})$.
**(b)** Use properties (not the defining sum) to find the DTFT of $y[n] = (n-1)\left(\tfrac13\right)^{n-1}u[n-1]$, given that $\left(\tfrac13\right)^n u[n] \leftrightarrow \dfrac{1}{1-\tfrac13e^{-j\omega}}$.

---

## Exam 2 — Full Walkthrough

### 1.
**(a)** *Linearity:* test with $x[n]=x_1[n]+x_2[n]$:
$$\mathcal H\{x_1+x_2\}[n] = (x_1[n]+x_2[n])(x_1[n-1]+x_2[n-1])$$
$$= x_1[n]x_1[n-1] + x_1[n]x_2[n-1] + x_2[n]x_1[n-1] + x_2[n]x_2[n-1].$$
This is not equal to $y_1[n]+y_2[n] = x_1[n]x_1[n-1]+x_2[n]x_2[n-1]$ (extra cross terms). **Not linear.**

*Time invariance:* Let $x'[n]=x[n-n_0]$. Then $\mathcal H\{x'\}[n] = x'[n]x'[n-1] = x[n-n_0]x[n-1-n_0]$. Compare to $y[n-n_0] = x[n-n_0]x[(n-n_0)-1] = x[n-n_0]x[n-1-n_0]$. These are identical. **Time-invariant.**

**(b)** *Stability:* if $|x[n]|\le M_x$ for all $n$, then $|y[n]| = |x[n]||x[n-1]| \le M_x^2 <\infty$. **BIBO stable.**
*Causality:* $y[n_0]=x[n_0]x[n_0-1]$ depends only on present and past values of $x$. **Causal.**

**(c)** $x[n]=u[n]-u[n-3] = \{1,1,1,0,0,\dots\}$ for $n=0,1,2$, zero otherwise (and zero for $n<0$).
$y[n]=x[n]x[n-1]$:
- $n=0$: $x[0]x[-1] = 1\cdot0=0$.
- $n=1$: $x[1]x[0]=1\cdot1=1$.
- $n=2$: $x[2]x[1]=1\cdot1=1$.
- $n=3$: $x[3]x[2]=0\cdot1=0$.
- $n\ge4$ or $n<0$: $0$.

$$y[n] = \delta[n-1]+\delta[n-2].$$

### 2.
**(a)** $y[n] = x[n]*h[n] = \sum_{k=-\infty}^{\infty} x[k]h[n-k] = \sum_{k=0}^{n} 1\cdot(0.5)^{n-k}$ for $n\ge0$ (since $x[k]=u[k]$ is nonzero for $k\ge0$, and $h[n-k]=(0.5)^{n-k}u[n-k]$ is nonzero for $k\le n$; for $n<0$ there's no overlap, $y[n]=0$).
$$y[n] = \sum_{k=0}^{n}(0.5)^{n-k} = (0.5)^n\sum_{k=0}^n (0.5)^{-k} = (0.5)^n\sum_{m=0}^n 2^m \quad (m=k)$$
$$= (0.5)^n\cdot\frac{2^{n+1}-1}{2-1} = (0.5)^n(2^{n+1}-1) = 2\cdot(0.5)^n\cdot2^n - (0.5)^n = 2 - (0.5)^n.$$
So $$y[n] = \left(2-(0.5)^n\right)u[n].$$

**(b)** Recursion $y[n]=0.5y[n-1]+x[n]$, $x[n]=u[n]$, zero initial conditions ($y[-1]=0$):
- $y[0] = 0.5(0) + 1 = 1$. Formula: $2-(0.5)^0 = 2-1=1$. ✓
- $y[1] = 0.5(1)+1 = 1.5$. Formula: $2-0.5=1.5$. ✓
- $y[2] = 0.5(1.5)+1 = 1.75$. Formula: $2-0.25=1.75$. ✓

Matches exactly.

### 3.
$x[n] = (\tfrac13)^n u[n] + (\tfrac12)^n u[-n-1]$ — a sum of a causal part and an anticausal part.

Term 1: $(\tfrac13)^nu[n] \leftrightarrow \dfrac{1}{1-\tfrac13z^{-1}}$, ROC $|z|>\tfrac13$ (standard pair).

Term 2: use the pair $-a^nu[-n-1]\leftrightarrow \dfrac{1}{1-az^{-1}}$, ROC $|z|<|a|$. Here we have $+(\tfrac12)^nu[-n-1]$ (no minus sign), so flip the sign of the transform: $(\tfrac12)^nu[-n-1] \leftrightarrow -\dfrac{1}{1-\tfrac12z^{-1}}$, ROC $|z|<\tfrac12$.

By linearity:
$$X(z) = \frac{1}{1-\tfrac13z^{-1}} - \frac{1}{1-\tfrac12z^{-1}}, \qquad \text{ROC} = \{|z|>\tfrac13\}\cap\{|z|<\tfrac12\} = \tfrac13<|z|<\tfrac12.$$

This ROC is a nonempty annulus since $\tfrac13<\tfrac12$, so $X(z)$ is valid. Combine over a common denominator if a single expression is wanted:
$$X(z) = \frac{(1-\tfrac12z^{-1}) - (1-\tfrac13z^{-1})}{(1-\tfrac13z^{-1})(1-\tfrac12z^{-1})} = \frac{-\tfrac16z^{-1}}{(1-\tfrac13z^{-1})(1-\tfrac12z^{-1})}.$$

**DTFT existence:** the DTFT exists iff the ROC includes the unit circle $|z|=1$. Here the ROC is $\tfrac13<|z|<\tfrac12$, which does **not** include $|z|=1$ (since $\tfrac12<1$). So **the DTFT does not exist** for this $x[n]$ (equivalently, $x[n]$ is not absolutely summable — the $(\tfrac12)^nu[-n-1]$ term grows without bound as $n\to-\infty$).

### 4.
$$H(z) = \frac{1}{1-1.5z^{-1}+0.5z^{-2}}.$$
**(a)** Multiply denominator by $z^2$: $z^2 - 1.5z+0.5=0$.
$$z = \frac{1.5\pm\sqrt{1.5^2-4(0.5)}}{2} = \frac{1.5\pm\sqrt{2.25-2}}{2} = \frac{1.5\pm\sqrt{0.25}}{2} = \frac{1.5\pm0.5}{2}.$$
$z=1$ or $z=0.5$. Check factorization in $z^{-1}$: $(1-z^{-1})(1-0.5z^{-1}) = 1-0.5z^{-1}-z^{-1}+0.5z^{-2} = 1-1.5z^{-1}+0.5z^{-2}$ ✓.
Poles: $z=1$ and $z=0.5$.

**(b)** For a **causal** system, the ROC must be the exterior of the outermost pole: $|z|>1$ (outermost pole magnitude is $1$).
For **stability**, the ROC must include the unit circle $|z|=1$.
But $|z|>1$ is an *open* region that excludes the circle $|z|=1$ itself (the pole sits exactly on it). So the causal ROC $|z|>1$ does **not** include the unit circle — the unit circle is the boundary, not the interior, of that ROC.
Hence there is no single ROC that is simultaneously "exterior of outermost pole" (required for causality) and "contains $|z|=1$" (required for stability): a pole sitting exactly on the unit circle makes causal + stable mutually exclusive for this $H(z)$. (The system can be made causal — unstable — by taking $|z|>1$; or stable — noncausal — by choosing an ROC that includes the unit circle but then is not exterior to the pole at $z=1$, e.g. $0.5<|z|<1$, which excludes the $z=1$ pole from "outside" and makes $h[n]$ two-sided.)

### 5.
$N=3$, $x[0]=2,x[1]=1,x[2]=1$.
$$c_k = \frac13\sum_{n=0}^{2}x[n]e^{-j\frac{2\pi}{3}kn}.$$

$k=0$: $c_0 = \tfrac13(2+1+1) = \tfrac13(4) = \tfrac43$.

$k=1$: $c_1 = \tfrac13\left(2 + 1\cdot e^{-j2\pi/3} + 1\cdot e^{-j4\pi/3}\right)$.
Recall $e^{-j2\pi/3} = \cos(120^\circ)-j\sin(120^\circ) = -\tfrac12 - j\tfrac{\sqrt3}2$, and $e^{-j4\pi/3}=\cos(240^\circ)-j\sin(240^\circ)\cdot(-1)$; more carefully: $e^{-j4\pi/3} = \cos(-240^\circ)+j\sin(-240^\circ)$. $-240^\circ$ is the same as $120^\circ$, so $e^{-j4\pi/3} = \cos(120^\circ)+j\sin(120^\circ) = -\tfrac12+j\tfrac{\sqrt3}2$.
Sum: $\left(-\tfrac12-j\tfrac{\sqrt3}2\right) + \left(-\tfrac12+j\tfrac{\sqrt3}2\right) = -1$ (imaginary parts cancel).
$$c_1 = \tfrac13(2 + (-1)) = \tfrac13(1) = \tfrac13.$$

$k=2$: $c_2 = \tfrac13\left(2 + e^{-j4\pi/3} + e^{-j8\pi/3}\right)$. Note $e^{-j8\pi/3} = e^{-j8\pi/3+j2\pi} = e^{-j2\pi/3}$ (periodicity, subtract $2\pi$). So this is the same two exponentials as above just swapped:
$$c_2 = \tfrac13\left(2 + \left(-\tfrac12+j\tfrac{\sqrt3}2\right) + \left(-\tfrac12-j\tfrac{\sqrt3}2\right)\right) = \tfrac13(2-1) = \tfrac13.$$

$$\boxed{c_0=\tfrac43,\quad c_1=\tfrac13,\quad c_2=\tfrac13.}$$

**(b)** Check conjugate symmetry for real $x[n]$: we need $c_2 = c_1^*$ (since for $N=3$, $k=-1\equiv k=2\pmod3$, and $c_{-1}=c_1^*$ for real signals). Here $c_1=\tfrac13$ and $c_2=\tfrac13$ are both real, so $c_1^*=\tfrac13=c_2$. ✓ Holds.

Since $c_1=c_2=\tfrac13$ are both real (no imaginary part), write $x[n]$ back out:
$$x[n] = c_0 + c_1e^{j\frac{2\pi}{3}n} + c_2 e^{j\frac{4\pi}{3}n} = \tfrac43 + \tfrac13\left(e^{j\frac{2\pi}{3}n}+e^{-j\frac{2\pi}{3}n}\right)$$
(using $e^{j4\pi/3 n} = e^{-j2\pi/3\,n}$ mod $2\pi$, i.e. $c_2$ pairs with frequency $-2\pi/3$)
$$x[n] = \tfrac43 + \tfrac23\cos\!\left(\tfrac{2\pi}{3}n\right).$$
**Check:** $n=0$: $\tfrac43+\tfrac23(1) = 2$ ✓. $n=1$: $\cos(2\pi/3)=-\tfrac12$, so $\tfrac43+\tfrac23(-\tfrac12)=\tfrac43-\tfrac13=1$ ✓. $n=2$: $\cos(4\pi/3)=-\tfrac12$, same result $=1$ ✓.

### 6.
**(a) Proof of time-shift property.** Start from the DTFT definition applied to $x[n-n_0]$:
$$\mathcal{F}\{x[n-n_0]\} = \sum_{n=-\infty}^{\infty} x[n-n_0]e^{-j\omega n}.$$
Substitute $m=n-n_0$ (so $n=m+n_0$); as $n$ ranges over all integers, so does $m$:
$$= \sum_{m=-\infty}^{\infty} x[m]e^{-j\omega(m+n_0)} = e^{-j\omega n_0}\sum_{m=-\infty}^{\infty}x[m]e^{-j\omega m} = e^{-j\omega n_0}X(e^{j\omega}).$$
This proves $x[n-n_0]\leftrightarrow e^{-j\omega n_0}X(e^{j\omega})$. $\blacksquare$

**(b)** We're given $g[n]=(\tfrac13)^nu[n] \leftrightarrow G(e^{j\omega}) = \dfrac{1}{1-\tfrac13e^{-j\omega}}$.

First build $n g[n] = n(\tfrac13)^nu[n]$ using the differentiation-in-frequency property: $ng[n] \leftrightarrow j\dfrac{dG}{d\omega}$.
$$\frac{dG}{d\omega} = \frac{d}{d\omega}\left(1-\tfrac13e^{-j\omega}\right)^{-1} = -\left(1-\tfrac13e^{-j\omega}\right)^{-2}\cdot\left(-\tfrac13\right)(-j)e^{-j\omega} \cdot(-1)$$
Carefully, let $u(\omega) = 1-\tfrac13 e^{-j\omega}$, so $G=u^{-1}$, $dG/d\omega = -u^{-2}\,du/d\omega$.
$\dfrac{du}{d\omega} = -\tfrac13\cdot(-j)e^{-j\omega} = \tfrac{j}{3}e^{-j\omega}$.
$$\frac{dG}{d\omega} = -u^{-2}\cdot\frac{j}{3}e^{-j\omega} = \frac{-j\tfrac13 e^{-j\omega}}{\left(1-\tfrac13e^{-j\omega}\right)^2}.$$
So
$$n g[n] \leftrightarrow j\cdot\frac{-j\tfrac13e^{-j\omega}}{(1-\tfrac13e^{-j\omega})^2} = \frac{\tfrac13e^{-j\omega}}{\left(1-\tfrac13e^{-j\omega}\right)^2}.$$
(This matches the standard pair $na^nu[n]\leftrightarrow \dfrac{ae^{-j\omega}}{(1-ae^{-j\omega})^2}$ with $a=\tfrac13$ — good consistency check.)

Now $y[n] = (n-1)(\tfrac13)^{n-1}u[n-1]$ is exactly $ng[n]$ **shifted** by $n_0=1$: let $w[n]=ng[n] = n(\tfrac13)^nu[n]$; then $w[n-1] = (n-1)(\tfrac13)^{n-1}u[n-1] = y[n]$. So $y[n]=w[n-1]$.

Apply the time-shift property proved in (a) with $n_0=1$:
$$Y(e^{j\omega}) = e^{-j\omega}\cdot W(e^{j\omega}) = e^{-j\omega}\cdot\frac{\tfrac13e^{-j\omega}}{\left(1-\tfrac13e^{-j\omega}\right)^2} = \frac{\tfrac13e^{-j2\omega}}{\left(1-\tfrac13e^{-j\omega}\right)^2}.$$

---

> [!tip] Study order
> Do Exam 1 cold, grade yourself against the walkthrough, note which property/rule tripped you up, re-read that section in [[Discrete Signals and Systems]] / [[Z-Transform]] / [[Discrete-Time Fourier Transform]], then do Exam 2 cold a day later.

ponytail: two exams × 6 problems covers every topic you named at least twice with full algebra shown; didn't build a DTFS-specific note or a third exam since these two already exercise every rule in the four source PDFs — say the word if you want a dedicated [[Discrete-Time Fourier Series]] reference note too.
