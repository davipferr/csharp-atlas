# Static, Const & Readonly

Members that belong to the type instead of an instance, and values that can't change.

## Static Methods

> Belong to the **class**, not an object. Call them with `ClassName.Method()`. They can't access instance members.

```csharp
public static class TemperatureConverter      // static class: only static members, can't be instantiated
{
    public static double ToFahrenheit(double celsius) => celsius * 9 / 5 + 32;
    public static double ToCelsius(double f) => (f - 32) * 5 / 9;
}

double f = TemperatureConverter.ToFahrenheit(25);

// Static factory method on a normal class
public class Money
{
    public decimal Amount { get; }
    private Money(decimal amount) => Amount = amount;
    public static Money FromCents(long cents) => new(cents / 100m);
    public static Money Zero { get; } = new(0);
}
```

Examples you already use: `Math.Max`, `Console.WriteLine`, `int.Parse`, `Guid.NewGuid`, `File.ReadAllText`, `string.IsNullOrEmpty`.

::: tip When to use
Pure functions that don't need object state (conversions, math, validation helpers), factory methods (`FromCents`, `Create`), and utility classes. Avoid static for things you'll want to mock or swap in tests (database, clock, HTTP). Inject those instead.
:::

## Static Fields and Constructors

> A static field has **one copy shared by all instances** for the lifetime of the app.

```csharp
public class Ticket
{
    private static int _nextNumber = 1;           // shared counter
    public static int IssuedCount { get; private set; }

    public int Number { get; }

    public Ticket()
    {
        Number = _nextNumber++;                   // each instance gets a unique number
        IssuedCount++;
    }

    static Ticket()                               // static constructor: runs once, before first use
    {
        _nextNumber = LoadLastNumberFromDisk() + 1;
    }
}
```

::: warning Gotchas
- Static mutable state is **global state**: hard to test, and not thread-safe (use `Interlocked.Increment` or `lock`).
- In web apps, a static field is shared by **all users and requests**. Never store per-user data there.
:::

::: tip When to use
Caches, counters, shared configuration, singletons, and expensive objects that are safe to share (`static readonly HttpClient`, compiled `Regex`, `JsonSerializerOptions`).
:::

## Extension Methods <Badge type="tip" text="extra" />

> Static methods in a static class whose first parameter has `this`. They can be called as if they were instance methods of that type.

```csharp
public static class StringExtensions
{
    public static string Truncate(this string value, int max)
        => value.Length <= max ? value : value[..max] + "…";

    public static bool IsValidEmail(this string value)
        => MailAddress.TryCreate(value, out _);
}

string preview = post.Body.Truncate(100);   // looks like a string method
```

::: tip When to use
Adding helpers to types you don't own (`string`, `IEnumerable<T>`, `IServiceCollection.AddMyServices()`). LINQ itself is a set of extension methods.
:::

## Const vs Readonly

> `const` is a compile-time constant baked into callers; `readonly` is a field set once at runtime (in its declaration or the constructor).

```csharp
public class Physics
{
    public const double Gravity = 9.81;              // compile-time, implicitly static
    public const string AppName = "Atlas";           // only primitives, strings, enums, null
    public static readonly DateTime StartedAt = DateTime.UtcNow; // runtime value
    public static readonly HttpClient Http = new();  // any type

    private readonly ILogger _logger;                // per-instance, set in constructor
    private readonly List<string> _items = [];       // reference is readonly, contents are NOT

    public Physics(ILogger logger)
    {
        _logger = logger;
        _items.Add("ok");                            // ✅ allowed: mutating, not reassigning
        // _items = new();                           // ❌ only in constructor
    }
}
```

| | `const` | `readonly` |
| --- | --- | --- |
| Value known | at compile time | at runtime |
| Allowed types | primitives, `string`, enums | any type |
| Static | always (implicitly) | instance or `static readonly` |
| Assigned | at declaration only | declaration or constructor |
| Versioning | value copied into callers' assemblies | read at runtime |

::: tip When to use
- `const`: true constants that will *never* change (math constants, fixed protocol values) and switch-case labels.
- `static readonly`: "constants" that might change between versions, or non-primitive values.
- `readonly` instance fields: injected dependencies and anything set once in the constructor.
:::

::: warning Gotcha
`public const` in a library is copied into consumers at compile time. If you change it, they keep the old value until recompiled. Prefer `public static readonly` for public values.
:::

## Readonly IDs and Keys

> Combine `readonly` / get-only properties with a static counter or `Guid` to give every object an identity that can't be tampered with.

```csharp
public class Student
{
    private static int _lastId;
    public int Id { get; }                            // no setter
    public string Name { get; set; }

    public Student(string name)
    {
        Id = Interlocked.Increment(ref _lastId);      // thread-safe unique ID
        Name = name;
    }
}
```

::: tip When to use
Entities that need a stable identifier: database keys (`Guid` or DB-generated), correlation IDs, order numbers.
:::
