# Data Types

The C# type system: what every built-in type is, how big it is, and how value and reference types behave.

## Overview of Data Types

> Every type is either a **value type** (holds the data itself) or a **reference type** (holds a pointer to data on the heap), and they all derive from `object`.

C# keywords are aliases for .NET types: `int` *is* `System.Int32`, `string` *is* `System.String`.

**Integral types (whole numbers)**

| Keyword | .NET type | Size | Range | Literal |
| --- | --- | --- | --- | --- |
| `sbyte` | `SByte` | 8-bit signed | -128 … 127 | |
| `byte` | `Byte` | 8-bit unsigned | 0 … 255 | |
| `short` | `Int16` | 16-bit signed | -32,768 … 32,767 | |
| `ushort` | `UInt16` | 16-bit unsigned | 0 … 65,535 | |
| `int` | `Int32` | 32-bit signed | ±2.1 billion | `42` |
| `uint` | `UInt32` | 32-bit unsigned | 0 … 4.29 billion | `42u` |
| `long` | `Int64` | 64-bit signed | ±9.2 × 10¹⁸ | `42L` |
| `ulong` | `UInt64` | 64-bit unsigned | 0 … 1.8 × 10¹⁹ | `42ul` |
| `nint` / `nuint` | `IntPtr` / `UIntPtr` | 32 or 64-bit (platform) | | |
| — | `Int128` / `UInt128` | 128-bit (.NET 7+) | huge | |

*Signed* types reserve one bit for the sign; *unsigned* types use it for magnitude, so they go twice as high but can't be negative.

**Floating-point & decimal**

| Keyword | Size | Precision | Literal | Use for |
| --- | --- | --- | --- | --- |
| `float` | 32-bit | ~6–9 digits | `3.14f` | graphics, games, sensors |
| `double` | 64-bit | ~15–17 digits | `3.14` / `3.14d` | science, math, default |
| `decimal` | 128-bit | 28–29 digits (base 10) | `3.14m` | **money**, exact decimals |

**Other built-ins**

| Keyword | Kind | Notes |
| --- | --- | --- |
| `bool` | value | `true` / `false` (not convertible to/from int) |
| `char` | value | one UTF-16 code unit, `'A'` |
| `string` | reference | immutable sequence of `char` |
| `object` | reference | root of every type |
| `dynamic` | reference | type checking deferred to runtime |

**Composite / user-defined**

| Kind | Value or reference | Example |
| --- | --- | --- |
| `struct` | value | `DateTime`, `Guid`, `Point` |
| `enum` | value | `DayOfWeek.Monday` |
| `record struct` | value | `record struct Money(decimal Amount);` |
| `class` | reference | `List<T>`, your services |
| `record` (class) | reference | `record Person(string Name);` |
| `interface` | reference | `IEnumerable<T>` |
| `delegate` | reference | `Func<int, int>` |
| array `T[]` | reference | `int[]` — even arrays of value types |
| tuple `(int, string)` | value | `ValueTuple<int, string>` |
| `T?` on a value type | value | `Nullable<int>` |

```csharp
Console.WriteLine(int.MaxValue);     // 2147483647
Console.WriteLine(sizeof(long));     // 8 (bytes)
Console.WriteLine(typeof(int));      // System.Int32
Console.WriteLine(default(decimal)); // 0
int million = 1_000_000;             // digit separators
int mask = 0b1010_0001;              // binary literal
int color = 0xFF_A0_33;              // hex literal
```

::: tip When to use
- `int` by default for counts and indexes; `long` for IDs/timestamps that may exceed 2.1 billion.
- `byte` / `byte[]` for raw binary data (files, network, images).
- Unsigned types mostly for interop and bit manipulation; the BCL uses `int` everywhere (e.g. `List.Count`).
- `decimal` for money, `double` for measurements.
:::

## Value Types vs Reference Types

> Assigning a value type **copies the data**; assigning a reference type **copies the reference**, so both variables point to the same object.

```csharp
struct PointS { public int X; }
class PointC { public int X; }

var a = new PointS { X = 1 };
var b = a;          // full copy
b.X = 99;
Console.WriteLine(a.X); // 1  ← a is untouched

var c = new PointC { X = 1 };
var d = c;          // copy of the reference, same object
d.X = 99;
Console.WriteLine(c.X); // 99 ← c changed too
```

| | Value type | Reference type |
| --- | --- | --- |
| Examples | `int`, `double`, `bool`, `char`, `decimal`, `DateTime`, structs, enums | `string`, arrays, classes, records, interfaces, delegates |
| Variable holds | the data | a reference (address) |
| Default | zero-ish (`0`, `false`) | `null` |
| Lives | inline (stack, or inside the containing object) | on the managed heap, cleaned by the GC |
| `==` default | compares values (for built-ins) | compares references (unless overloaded) |

- **`string` is a special reference type**: it's immutable and `==` compares content, so it *behaves* like a value.
- **Boxing**: putting a value type into an `object` (or interface) allocates a copy on the heap. Unboxing copies it back. It's hidden in old APIs like `ArrayList` and costs performance.

```csharp
int n = 42;
object boxed = n;        // boxing: heap allocation
int back = (int)boxed;   // unboxing
```

::: warning Gotcha
Passing a reference type to a method lets the method mutate the object, even without `ref`. See [Passing by value vs by reference](/methods/parameters).
:::

## Nullable Value Types

> `int?` (short for `Nullable<int>`) lets a value type also hold `null`, meaning "no value".

```csharp
int? age = null;                 // e.g. optional field from a form or DB column
if (age.HasValue) Console.WriteLine(age.Value);

int years = age ?? 0;            // fallback
int alsoYears = age.GetValueOrDefault();

decimal? discount = order.Coupon?.Percent;   // null if Coupon is null

if (age is int a) Console.WriteLine($"Age {a}"); // pattern: unwrap safely
```

**Nullable reference types (NRT)** are a different feature: with `<Nullable>enable</Nullable>` the compiler *warns* when a `string` might be null. `string?` declares "this may be null". It's static analysis only; the runtime type is the same.

```csharp
string? middleName = null;     // allowed
string firstName = null;       // warning CS8600
int len = middleName!.Length;  // ! = "trust me, it's not null" (null-forgiving)
```

::: tip When to use
- `int?`, `DateTime?`, `bool?` for optional DB columns, optional API fields, or "not answered yet".
- Keep NRT enabled in new projects. It catches most `NullReferenceException`s at compile time.
:::

## Implicitly Typed Variables (var)

> `var` lets the compiler infer the type from the right-hand side. It's still **statically typed**, not dynamic.

```csharp
var customers = new Dictionary<string, List<Order>>(); // avoid repeating long types
var total = 0m;                                        // decimal
var query = orders.Where(o => o.Total > 100);          // IEnumerable<Order>
var anon = new { Name = "Ana", Age = 30 };             // anonymous type: var is required

Dictionary<string, int> stock = new();                 // target-typed new (C# 9): type on the left
List<string> names = ["Ana", "Bia"];                   // collection expression (C# 12)
```

| `var` | explicit type |
| --- | --- |
| Type is obvious from the right side (`new`, cast, literal) | Type isn't obvious (`var x = GetData();` hides what you get) |
| Long generic types | You want a specific type: `double ratio = 1;` vs `var ratio = 1;` (int!) |
| Anonymous types / LINQ projections | Public API signatures (fields, params and returns can't use `var`) |

::: warning Gotcha
`var` can only be used for local variables, it must be initialized, and it can't be initialized to `null`.
:::

## dynamic <Badge type="tip" text="extra" />

> `dynamic` turns off compile-time type checking. Members are resolved at runtime and throw if they don't exist.

```csharp
dynamic data = JsonConvert.DeserializeObject(json); // Newtonsoft
Console.WriteLine(data.user.name);                    // no IntelliSense, checked at runtime
```

::: tip When to use
Rarely: COM/Office interop, interop with dynamic languages, or quick exploration of loosely shaped JSON. Prefer strongly typed models.
:::
