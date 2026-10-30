# Numbers & Culture

Choosing between `double` and `decimal`, integer pitfalls, and why `"1,5"` may parse differently on another machine.

## Decimal vs Double

> `double` is fast binary floating point and can't represent 0.1 exactly. `decimal` is base-10 and exact for decimal fractions, which is what money needs.

```csharp
Console.WriteLine(0.1 + 0.2);            // 0.30000000000000004
Console.WriteLine(0.1 + 0.2 == 0.3);     // False
Console.WriteLine(0.1m + 0.2m == 0.3m);  // True

decimal price = 19.99m;                  // m suffix is required
decimal total = price * 3;               // 59.97 exactly
decimal rounded = Math.Round(2.345m, 2, MidpointRounding.AwayFromZero); // 2.35
```

| | `double` | `decimal` |
| --- | --- | --- |
| Base | binary (base 2) | decimal (base 10) |
| Precision | ~15–17 digits | 28–29 digits |
| Range | ±1.7 × 10³⁰⁸ | ±7.9 × 10²⁸ |
| Speed | hardware, very fast | software, ~10× slower |
| Divide by zero | `Infinity` / `NaN` | throws `DivideByZeroException` |

::: tip When to use
- **`decimal`**: prices, balances, taxes, invoices, anything a user expects to add up to the cent.
- **`double`**: physics, statistics, geometry, ML, sensor readings, where tiny errors don't matter and speed does.
- Comparing doubles: use a tolerance, `Math.Abs(a - b) < 1e-9`, never `==`.
:::

## Integer Division, Overflow & Mixing Types

> `int / int` gives an `int` (it truncates). Integer overflow wraps around silently unless you use `checked`.

```csharp
int total = 7, count = 2;
Console.WriteLine(total / count);          // 3   ← truncated
Console.WriteLine((double)total / count);  // 3.5 ← promote one operand first
Console.WriteLine(total / (double)count);  // 3.5
Console.WriteLine((double)(total / count));// 3   ← too late, division already happened

int max = int.MaxValue;
int wrapped = max + 1;                     // -2147483648, no error!
int safe = checked(max + 1);               // throws OverflowException

checked
{
    long bytes = fileCount * avgSize;      // every operation in the block is checked
}
```

When types are mixed, the smaller one is promoted: `int + double → double`, `int + long → long`, `int + decimal → decimal`. `double + decimal` doesn't compile; you must cast one of them.

::: tip When to use
- Averages: cast before dividing (`sum / (double)count`).
- `checked` around financial or size calculations where silent overflow would corrupt data. You can also turn it on project-wide with `<CheckForOverflowUnderflow>true</CheckForOverflowUnderflow>`.
:::

## Increment, Decrement & Modulo

> `x++` returns the old value then increments; `++x` increments first. `%` gives the remainder.

```csharp
int i = 5;
int a = i++;   // a = 5, i = 6  (post-increment)
int b = ++i;   // b = 7, i = 7  (pre-increment)

int score = 10;
score += 5;  score -= 2;  score *= 2;  score /= 3;  score %= 4; // compound assignment

bool isEven = n % 2 == 0;
int column = index % columns;          // wrap into a grid
int row = index / columns;
int slot = (current + 1) % slots.Length; // circular buffer / round robin
int minutes = totalSeconds / 60, seconds = totalSeconds % 60;
```

::: warning Gotcha
`%` with negatives keeps the sign of the left operand: `-7 % 3 == -1`. For a true positive modulo use `((x % m) + m) % m`.
:::

## CultureInfo: Dots and Commas

> Parsing and formatting numbers and dates use the **current culture** by default, so `"1,5"` is 1.5 in pt-BR but 15 in en-US.

```csharp
using System.Globalization;

double.Parse("1.5", CultureInfo.InvariantCulture);           // 1.5 everywhere
double.Parse("1,5", new CultureInfo("pt-BR"));               // 1.5
decimal price = 1234.5m;

price.ToString("C", new CultureInfo("en-US"));   // $1,234.50
price.ToString("C", new CultureInfo("pt-BR"));   // R$ 1.234,50
price.ToString("N2", CultureInfo.InvariantCulture); // 1,234.50

// Set it for the whole app (e.g. console tool that must behave the same on every machine)
CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture;
CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;

// Accept user input with either separator
bool ok = decimal.TryParse(input, NumberStyles.Number, CultureInfo.CurrentCulture, out var value);
```

::: tip When to use
- **InvariantCulture** for machine-to-machine data: files, CSV, JSON, config, logs, database strings.
- **CurrentCulture** (or a specific culture) for anything a human reads or types.
- Turn on the CA1305 analyzer to get warned when you forget to pass a culture.
:::

## Random Numbers

> `Random` generates pseudo-random numbers; `Random.Shared` is a thread-safe instance; `RandomNumberGenerator` is for security.

```csharp
int dice = Random.Shared.Next(1, 7);        // 1..6  (upper bound is EXCLUSIVE)
double chance = Random.Shared.NextDouble(); // 0.0 .. <1.0
bool crit = Random.Shared.NextDouble() < 0.15;

var seeded = new Random(42);                // same seed → same sequence (tests, replays, procedural maps)

string[] colors = ["red", "green", "blue"];
string pick = colors[Random.Shared.Next(colors.Length)];
Random.Shared.Shuffle(colors);              // .NET 8

// Tokens, passwords, keys → cryptographically secure
using System.Security.Cryptography;
int code = RandomNumberGenerator.GetInt32(100_000, 1_000_000); // 6-digit OTP
```

::: warning Gotcha
Don't create `new Random()` inside a loop on old .NET Framework: instances created at the same moment share a time-based seed and produce identical numbers. Reuse one instance or use `Random.Shared`.
:::
