# Spade 0.19.0 authoring cheat sheet

Every snippet below was compiled with `spade 0.19.0` (source `/tmp/spade-src`) unless marked
`✗ REJECTED` (those are traps and are shown with the real compiler error).

---

## 0. Verify command

Stdlib + core + prelude are **compiled into the binary** (`include_str!` via `stdlib_files()` /
`core_files()` in `spade-compiler/src/lib.rs`). No `-I`, no prelude flag, no `swim.toml` needed.

```sh
/tmp/spade-src/target/release/spade FILE.spade -o /dev/null --no-color
```

Exit 0 = parses, name-resolves, type-checks, monomorphises and lowers to Verilog. `-o` is
**mandatory**; `/dev/null` discards output. Use `-o out.v` to inspect the Verilog.

Multi-file (each arg is `<base_namespace>,<namespace>,<file>`; first file is the root):

```sh
spade "proj,proj,main.spade" "proj,proj::a,a.spade" "proj,proj::b,b.spade" -o /dev/null
```

Other flags: `--omit-stdlib` (drops std + prelude, keeps core — don't use),
`--print-type-traceback`, `--mir-output <f>`, `--item-list <f>`.
There is no `--check`, no `--version`, no subcommands.

---

## 1. Module forms

| form | may contain | how to call it |
|---|---|---|
| `fn` | combinational only. **No `reg`, no `inst`.** | `f(x)` — plain call |
| `entity` | `reg(clk)`, `inst`, ports, `set` | `inst e(clk, x)` |
| `pipeline(N)` | everything `entity` can + `reg;` stage separators | `inst(N) p(clk, x)` |

```spade
fn add_grow(a: uint<8>, b: uint<8>) -> uint<9> { a + b }

entity counter<#uint N>(clk: clock, rst: bool, en: bool) -> uint<N> {
    reg(clk) c reset(rst: 0) = if en { trunc(c + 1) } else { c };
    c
}

pipeline(3) mac(clk: clock, a: int<8>, b: int<8>, c: int<16>) -> int<17> {
        let p = a * b;
    reg;
        let s = p + c;
    reg;
        let out: int<17> = s;
    reg;
        out
}
```

An entity may return nothing (`entity nores(clk: clock, x: uint<8>) { reg(clk) y = x; }`).
The last expression of the body is the return value — **no `;` on it, no `return` keyword**.

---

## 2. Types

```spade
uint<8>          // unsigned, N bits.  N may be 0.
int<8>           // signed two's complement, N bits
bool             // 1 bit
clock            // clock signal; only legal as reg/entity clock or via unsafe casts
tri              // tri-state literal type; values LOW / HIGH / HIGHIMP
[int<8>; 4]      // array
[[bool; 8]; 4]   // nested array
(uint<8>, bool)  // tuple; () is the unit type
Option<uint<8>>  // Some(v) / None  == (valid, data) pair
inv T            // inverted (backward) signal, from `port()`
inout<T>         // bidirectional pad
```

**`bit` does not exist** (`error: Use of undeclared name bit`). Use `bool`, or `uint<1>`.

```spade
struct Sample { re: int<12>, im: int<12> }
enum FsmState { Idle, Load { n: uint<3> }, Done }
```

Construction — three equivalent forms:

```spade
Sample(1, 2)                       // positional
Sample$(re: 1, im: 2)              // named  (note the `$`, not `{ }`)
FsmState::Load(0)                  // struct-variant, positional
FsmState::Load$(n: 0)              // struct-variant, named
let Sample$(re: r, im: i) = s;     // destructuring a struct
```

Field/tuple access: `s.re`, `t.0`. Struct-literal shorthand works: `Acc$(sum, valid: true)`.

Literals: `0`, `13u8`, `-7i8`, `0xFFu8`, `0b1010`, `0o17`, `65_535i32`, `true`, `false`.
Un-suffixed integer literals infer their width from context.

---

## 3. Generics

```spade
fn add_generic<#uint N>(a: uint<N>, b: uint<N>) -> uint<{N + 1}> { a + b }
fn zip<L, R, #uint N>(l: [L; N], r: [R; N]) -> [(L, R); N] { l.zip(r) }
pub pipeline(Depth) pmap<#int Depth, O>(self, clk: clock, ...) -> Option<O>
```

* `#uint N` = const generic (natural), `#int N` = const generic (signed, used for pipeline depth).
* Bare `T` = type generic.
* **Width arithmetic in a type position must be wrapped in braces**: `uint<{N + 1}>`,
  `[T; {L + R}]`, `[[T; C]; {N / C}]`, `uint<{2 * N}>`, `uint<{uint::bits_for(N)}>`.
  Bare `uint<N>` needs no braces.
* Explicit instantiation is turbofish: `zext::<8, 16>(x)`, `counter::<8>`, `x.chunks::<2>()`,
  `unfold::<uint<8>, 5>(...)`, `Methodee::<0>()`.
* Where-clauses with a message:
  ```spade
  pub extern fn zext<#uint N, #uint M>(x: uint<N>) -> uint<M>
  where M >= N else "Zero-extend result must be wider than the input value";
  ```
* Compile-time branching is `gen if` (there is **no `gen for`**):
  ```spade
  fn popcount<#uint N>(x: [bool; N]) -> uint<N> {
      gen if N == 0 {
          0
      } else {
          let head: uint<N> = zext(x[0].as_uint());
          let tail: uint<N> = zext(popcount(x[1..N]));
          trunc(head + tail)
      }
  }
  ```

---

## 4. Registers

```spade
reg(clk) x = next;                              // no reset
reg(clk) x: uint<16> reset(rst: 0) = next;      // sync reset to 0 when rst is true
reg(clk) x initial(123) = x;                    // power-on value only (FPGA init)
reg(clk) x reset(rst: 0) initial(5) = next;     // both
reg(clk) (state, out) reset(rst: (S::A, None)) = next;  // tuple-pattern register
reg * 4;                                        // pipeline only: 4 empty stages
```

`reset(cond: value)` — `cond: bool`, `value` any expression of the register's type
(`reset(rst: [false; N])`, `reset(rst: FsmState::Idle)`).

Self-reference is legal and is how you hold state (`= x`). For a value defined *later* in the
body, forward-declare it:

```spade
entity feedback(clk: clock, rst: bool) -> uint<8> {
    decl next;
    reg(clk) v reset(rst: 0) = next;
    let next = trunc(v + 1);
    v
}
```

---

## 5. Instantiation

```spade
let c = inst counter::<8>(clk, rst, true);          // entity
let m = inst(3) mac(clk, a, b, 0);                  // pipeline; N must equal declared depth
let d = inst(4) delay4$(clk, x: c);                 // named arguments
let s = unsafe { inst std::cdc::sync2(clk, rst) };  // `unsafe` unit
let f = plain_fn(x);                                // fn: NO `inst`
```

`inst` on a `fn` → `error: Unexpected 'inst' for function call`.
Calling an `entity` without `inst` → `error: Expected 'inst' to instantiate entity`.
`inst p(..)` on a pipeline without depth → `error: Expected pipeline depth`.
Wrong depth → `error: Pipeline depth mismatch`.

---

## 6. Expressions

```spade
let x = e;                     let x: uint<8> = e;      // annotation often required
let (a, _) = t;                                          // tuple destructuring
decl name;                                               // forward declaration
if c { a } else { b }                                    // expression, both arms required
match v {
    0 if cond => 0,                                      // guards allowed
    0         => 1,
    _         => 2,
}
match (a, b) { (Some(x), true) => x, _ => 0 }            // tuple scrutinee
set port_field = value;                                  // drive an `inv` signal
assert x != 0;                                           // simulation assertion
a `std::ops::comb_div` b                                 // infix call, backticks
```

Bit access — integers are **not indexable**; go through `.as_bits()`:

```spade
let bits = x.as_bits();     // [bool; N], index 0 = LSB
bits[0]                     // single bit -> bool
bits[2..5]                  // [bool; 3]
bits[0..4].as_uint()        // uint<4>
x.msb()  x.lsb()  x.sign_bit()
x[i]                        // arrays only; i may be a runtime uint
a[Lower..Upper]             // const-generic range on an array
```

Width conversions:

| want | write | width |
|---|---|---|
| concatenate | `x.concat(y)` / `` x `concat` y `` | `N + M`, x is the high part |
| truncate | `trunc(x)` / `x.trunc()` | inferred from target, must be ≤ N |
| zero-extend | `zext(x)` / `zext::<8,16>(x)` | target ≥ N |
| sign-extend | `sext(x)` | target ≥ N |
| reinterpret bits | `u.as_int()`, `i.as_uint()`, `x.as_bits()`, `bits.as_uint()` | same N |
| value-preserving | `u.to_int()` | `N + 1` |

`trunc`/`zext`/`sext` take their result width from context, so annotate:
`let y: uint<16> = zext(x);` or `zext::<8, 16>(x)`.

Lambdas: `fn |x| x + 1`, `fn |acc, v| acc +. v` — used by `map`/`fold`/`all`/`any`.

---

## 7. Operators and width growth

| op | operands | result |
|---|---|---|
| `a + b`, `a - b` | `uint<N>`/`int<N>`, both same | `N + 1` |
| `a * b` | same `N` | `2N` |
| `a / b`, `a % b` | same `N` | `N` (power-of-2 divisor only; else `comb_div`/`comb_mod`) |
| `a +. b`, `-.`, `*.` | same `N` | `N` — **truncating / wrapping** variants |
| `a << b`, `a >> b`, `a >>> b`, `<<.`, `>>.` | **both sides same type** | `N` |
| `-a` (unary) | `int<N>` | `N` |
| `~a` | `uint<N>`/`int<N>` | `N` (bitwise not) |
| `!a` | `bool` only | `bool` |
| `& \| ^` | same `N` ints, or `bool` | `N` |
| `&& \|\| ^^` | `bool` only | `bool` |
| `== != < <= > >=` | same `N` | `bool` |

So `a + b` on two `uint<8>` is `uint<9>`; to keep 8 bits write `trunc(a + b)` or `a +. b`.
Accumulators are the classic case: `reg(clk) acc: uint<16> reset(rst: 0) = trunc(acc + zext::<8,16>(x));`

Shift amount must have the **same type as the shifted value** — `a: uint<8> << s: uint<3>` is
`error: Expected type uint<3>, got uint<8>`. Use `a << zext::<3,8>(s)` or a literal `a << 1`.

---

## 8. Pipelines

```spade
pipeline(2) stage_ref(clk: clock, x: uint<8>) -> uint<8> {
    'first                                  // stage label (optional)
        let a = x;
    reg;                                    // stage separator
        let b = a;
    reg;
        b +. stage(first).a +. stage(-1).b  // cross-stage reads
}
```

* `pipeline(N)` — N = input-to-output latency in cycles = number of `reg;` in the body.
* `reg;` separates stages; `reg * 4;` inserts 4 empty stages.
* A name used after a `reg;` automatically reads its **pipelined** value.
* `stage(-1).x` / `stage(+1).x` read x relative to the current stage; `stage(label).x` absolute.
  Forward references (`stage(+1)`) are legal.
* `reg(clk) y = x;` (a *real* register, not a stage separator) is also allowed inside a pipeline.
* `inst e(clk, ..)` of entities inside a pipeline is allowed.

---

## 9. Attributes, modules, visibility

```spade
#[inline]                      // hint on fn/entity/pipeline
#[no_mangle]                   // keep the Verilog name; also on individual ports:
#[no_mangle]
entity toplevel(#[no_mangle] clk: clock, #[no_mangle] rst: bool) -> uint<8> { .. }
#[deprecated = "message"]

mod util {
    pub fn abs8(x: int<8>) -> uint<8> { x.abs() }
    pub(super) fn helper() -> bool { true }
}
use util::abs8;
use std::ops::{reduce_and, reduce_or};
use lib::cdc as cdc;           // `lib::` = this project's base namespace
```

`pub` is required to use an item outside its `mod`. Items are visible in any order (no
forward-declaration needed at item level). Doc comments are `///` and `//!`.

Standalone file for a compiler check: **no `mod` declarations, no `main`, no project file** —
just top-level `fn`/`entity`/`pipeline`/`struct`/`enum`/`impl`/`mod` items. A `swim` project uses
`swim.toml` + `src/main.spade` that lists `mod foo;` per file, but you don't need that to check
a single file.

---

## 10. Useful stdlib (auto-imported by the prelude unless noted)

```
trunc  sext  zext  concat  default()  undef()  port()
Option<T>: Some/None, is_some, is_none, unwrap_or, unwrap_or_undef, map, and_then
int<N>:  abs, max, min, msb, lsb, sign_bit, as_uint, as_bits, concat, trunc
uint<N>: max, min, msb, lsb, as_int, to_int, as_bits, concat, trunc, interleave, to_gray,
         to_le_bytes, to_be_bytes
[bool;N]: as_int, as_uint, reduce_and, reduce_or, reduce_xor, bit_not/and/or/xor
[T;N]:   map, fold, reduce, zip, unzip, all, any, concat, reversed, first, last, len,
         push_front, push_back, shift_front, shift_back, chunks::<K>, split_at::<K>,
         sliding_window::<M>, flatten, transpose
uint::bits_for(N)                       // compile-time ceil(log2) helper, use inside { }
std::ops::comb_div / comb_mod           // general (slow) divide / modulo
std::io::rising_edge / falling_edge     // entity(clk, bool) -> bool
std::mem::clocked_memory / read_memory / dp_bram / fifo
std::cdc::sync2 (unsafe) / sync2_bool / sync_wide / handshake
std::num::Gray<N>
```

Wrapping ops as trait methods: `wrapping_add`, `wrapping_sub`, `wrapping_mul`, `wrapping_neg`,
`wrapping_shl`, `wrapping_shr`.

---

## 11. Traps

Looks like Rust / Verilog, but wrong here:

1. **`a + b` widens.** `fn f(a: uint<8>, b: uint<8>) -> uint<8> { a + b }`
   → `✗ REJECTED: Output type mismatch. Expected uint<8>, got uint<9>`. `*` doubles the width.
   Use `+.`/`*.` or `trunc(..)`.
2. **`as` is not a cast, it is a type ascription.** `a as int<8>` on a `uint<8>` is
   `✗ REJECTED: Expected type int<8>, got uint<8>`. It only works when the expression could
   already have that type (`13 as uint<8>`). For real conversions use `as_int`/`as_uint`/
   `zext`/`sext`/`trunc`.
3. **No `reg` in `fn`** → `✗ error: register declared in function`. No `inst` in `fn` either
   (`cannot instantiate entities and pipelines in functions`). Anything clocked must be an
   `entity` or `pipeline`.
4. **Entities need `inst`**, functions must not have it. Both directions are hard errors.
5. **Old reset syntax is gone.** `reg(clk) rst: (rst, 0) x = ...`
   → `✗ error: Unexpected 'identifier', expected '='`. Use `reg(clk) x reset(rst: 0) = ...`.
6. **`!` is boolean-only.** `!a` on `uint<8>` → `✗ uint<8> does not implement core::ops::Not`.
   Bitwise not is `~`. Likewise `&&`/`||`/`^^` are bool-only; `&`/`|`/`^` are the bitwise ones.
7. **Integers are not indexable.** `x[0]` on `uint<8>` → `✗ Index target must be an array`.
   Use `x.as_bits()[0]`. Array index 0 is the **LSB**.
8. **Shift operands must be the same type**, not "any integer".
9. **No `let mut`, no `return`, no `;` after the tail expression.**
   `let mut x` → `✗ Unexpected 'mut'`; `return 0;` → `✗ Use of undeclared name return`;
   `fn f() -> uint<8> { 0; }` → `✗ Expected uint<8>, got ()`.
10. **`bit` is not a type**; `tri` is (with `LOW`/`HIGH`/`HIGHIMP`).
11. **Verilog concatenation `{a, b}` does not exist.** Use `a.concat(b)` (ints) or
    `[..].concat([..])` (arrays). `{ .. }` is a block expression.
12. **No `gen for`** — only `gen if`. Repeat with recursion + `gen if`, or with array
    `map`/`fold`/`unfold`.
13. **Generic bodies are only type-checked when instantiated.** A generic `fn` with a width bug
    compiles fine until something calls it with a concrete `N`. Always add a concrete wrapper
    when testing generic code.
14. **`trunc`/`zext`/`sext` infer their output width from context.** In a `let` with no
    annotation, or as an operand of another width-changing op, you get
    `error: Type of expression is not fully known`. Annotate the `let` or use turbofish.
15. **Named-argument struct/instance syntax uses `$`**: `Sample$(re: 1, im: 2)`,
    `inst e$(clk, rst)`. `Sample { re: 1 }` is not struct-literal syntax.
16. **Enum struct-variants are matched positionally**: `FsmState::Load(n) => ..`, even though
    declared as `Load { n: uint<3> }`.
17. **`==` on a user struct/enum needs `impl PartialEq`** — it is not derived.
18. **`clock` is not a `bool`.** Converting requires `unsafe { c.as_bool() }` /
    `unsafe { b.as_clock() }`, and `unsafe` units must be called inside `unsafe { .. }`.
19. **`match` must be exhaustive** and all arms must have the same type; same for `if`/`else`
    (an `else` is mandatory when the value is used).
20. Pipeline depth is checked at every call site: `inst(N)` where N ≠ declared depth is a hard
    error, so bumping a pipeline's depth means updating all instantiations.

---

## Traps found while writing arithmetic notes (pilot, 2026-08-14)

Each of these cost a real agent a compile iteration. Verbatim compiler output.

### Chained `+` does not typecheck — widening breaks the second operator

```
error: Expected type uint<3>, got uint<4>
```

`+` returns `N+1` bits, so in `b0 + b1 + b2 + b3` the first `+` yields `uint<2>`
and the second sees `uint<2> + uint<1>` — mismatched. This kills the obvious way
to sum a bit-heap column. Fix by truncating each step to the width you want, or
by zero-extending every operand to the final width first:

```spade
// summing 4 one-bit values into a 3-bit count
let s: uint<3> = zext(b0) + zext(b1) + zext(b2) + zext(b3);   // still widens
let s = trunc::<3>(zext::<3>(b0) + zext::<3>(b1)) ...          // truncate per step
```

Decide the output width up front and force every intermediate to it. This is the
single most common error in compressor, bit-heap and popcount code.

### Lambda parameters get no type inference and cannot be annotated

```
error: Type of tuple indexee must be known at this point
error: Unexpected `:`, expected `,` or `|`
```

`arr.map(fn |t| t.0 && t.1)` fails — the lambda's parameter type is not inferred
from the array. The obvious repair `fn |t: (bool, bool)|` does not **parse**.
Annotating the `let` that produced the array does not help; inference does not
flow inward. Net effect: **`zip(...).map(...)` is unusable for tuple elements**,
which is exactly the natural way to write a bitwise datapath. Use an explicit
indexed construction or a recursive/generic entity instead.

### Array packing order — element 0 is the LSB

Confirmed by reading emitted Verilog (`assign _e_109 = {\other , \self };`):

- `[T; N]` packs **element 0 into the least-significant position**.
- `as_bits` / `as_uint` are the identity on that packed vector.
- For **arrays**, `x.concat(y)` puts `x` **low**.
- For **integers**, `concat(x, y)` puts `x` **high** — the opposite convention.

Get this backwards and the circuit compiles clean and adds bit-reversed. There is
no simulator in the default toolchain, so nothing will tell you.

### `^^` is the bool XOR

`^` is bitwise and is **not** defined on `bool` ("bool does not implement
core::ops::BitXor"). Use `^^`, or `!=`, which is equivalent for `bool`.
