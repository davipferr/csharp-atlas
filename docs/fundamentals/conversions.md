# Type Conversions

Moving values between types: automatic widening, explicit casts, and parsing text.

## Implicit Conversion

> A conversion the compiler does automatically because it can never lose data (widening).

```csharp
int count = 1_000;
long big = count;          // int → long
double ratio = count;      // int → double
decimal money = count;     // int → decimal
float f = 'A';             // char → float (65)

object o = count;          // any type → object (boxing)
IEnumerable<int> seq = new List<int>(); // derived → base / interface
```

**Widening chain:** `byte → short → int → long → float → double`, and integral types → `decimal`. `char` widens to `ushort` and up.

::: tip When to use
You don't "use" it so much as rely on it: passing an `int` to a method that takes `double`, or assigning a `List<T>` to an `IEnumerable<T>` variable.
:::

## Explicit Conversion (Casting)

> `(T)value` forces a conversion that may lose data or fail, so the compiler makes you write it.

```csharp
double price = 9.99;
int whole = (int)price;           // 9  ← truncates, does NOT round
int rounded = (int)Math.Round(price); // 10

long bigNumber = 3_000_000_000;
int overflowed = (int)bigNumber;  // -1294967296 (silently wraps)
int safe = checked((int)bigNumber); // OverflowException

decimal amount = (decimal)price;  // double → decimal needs a cast
int code = (int)ConsoleColor.Red; // enum → int
var color = (ConsoleColor)12;     // int → enum

object boxed = 42;
int unboxed = (int)boxed;         // unboxing must match the exact type
long wrong = (long)boxed;         // InvalidCastException!

Animal animal = new Dog();
Dog dog = (Dog)animal;            // downcast: throws if it isn't a Dog
```

::: tip When to use
- Truncating on purpose (array index from a double).
- Converting between enums and their numeric codes.
- Downcasts: prefer `is` / `as` (see [Type Checks](/oop/operators-and-type-checks)) so a wrong type doesn't throw.
:::

## Parse, TryParse and Convert

> Turn strings (and other types) into numbers, dates, enums… `Parse` throws on bad input, `TryParse` returns `false`, and `Convert` handles `null` and many source types.

```csharp
int a = int.Parse("42");              // FormatException on "abc", OverflowException on huge
bool ok = int.TryParse("abc", out int b); // ok = false, b = 0, no exception

// Typical user-input loop
int age;
while (!int.TryParse(Console.ReadLine(), out age) || age < 0)
    Console.Write("Please type a valid age: ");

int c = Convert.ToInt32("42");        // like Parse, but...
int d = Convert.ToInt32(null as string); // 0 (Parse would throw ArgumentNullException)
int e = Convert.ToInt32(3.7);         // 4 ← ROUNDS (banker's rounding), unlike a cast
bool f = Convert.ToBoolean("true");
byte[] bytes = Convert.FromBase64String(base64);
string hex = Convert.ToHexString(bytes);

DateTime date = DateTime.Parse("2026-10-30", CultureInfo.InvariantCulture);
var day = Enum.Parse<DayOfWeek>("Friday");
Guid.TryParse(idText, out Guid id);
```

| Method | Bad input | `null` | Use when |
| --- | --- | --- | --- |
| `T.Parse` | throws | throws | input is guaranteed valid (config you control) |
| `T.TryParse` | returns `false` | returns `false` | **user input, files, external data** |
| `Convert.ToX` | throws | returns default | converting from `object`/other types, DB values |
| `(T)x` cast | n/a | n/a | between numeric types, not strings |

::: tip When to use
Default to `TryParse` whenever the text comes from outside your code. Exceptions are expensive and invalid input is *expected*, not exceptional.
:::

## Implicit and Explicit Operators <Badge type="tip" text="extra" />

> Your own types can define how they convert to and from other types.

```csharp
public readonly record struct Celsius(double Value)
{
    public static implicit operator double(Celsius c) => c.Value;           // safe
    public static explicit operator Celsius(Fahrenheit f) => new((f.Value - 32) * 5 / 9); // lossy
}

Celsius temp = (Celsius)new Fahrenheit(98.6);
double raw = temp; // implicit
```

::: tip When to use
Strongly typed wrappers (`UserId`, `Email`, `Money`) that should still flow easily into APIs expecting the primitive.
:::
