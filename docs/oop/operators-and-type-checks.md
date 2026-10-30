# Operator Overloading & Type Checks

Making your types work with `+`, `==` and friends, and safely checking or converting object types at runtime.

## Operator Overloading

> Define what `+`, `-`, `==`, `<`, etc. mean for your own types with `public static T operator +(T a, T b)`.

```csharp
public readonly struct Money : IEquatable<Money>
{
    public decimal Amount { get; }
    public string Currency { get; }
    public Money(decimal amount, string currency) => (Amount, Currency) = (amount, currency);

    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency) throw new InvalidOperationException("Currency mismatch");
        return new Money(a.Amount + b.Amount, a.Currency);
    }
    public static Money operator *(Money m, decimal factor) => new(m.Amount * factor, m.Currency);
    public static bool operator >(Money a, Money b) => a.Amount > b.Amount;
    public static bool operator <(Money a, Money b) => a.Amount < b.Amount;

    // == and != must come in pairs; also override Equals and GetHashCode
    public static bool operator ==(Money a, Money b) => a.Equals(b);
    public static bool operator !=(Money a, Money b) => !a.Equals(b);
    public bool Equals(Money other) => Amount == other.Amount && Currency == other.Currency;
    public override bool Equals(object? obj) => obj is Money m && Equals(m);
    public override int GetHashCode() => HashCode.Combine(Amount, Currency);

    public override string ToString() => $"{Amount:N2} {Currency}";
}

var total = new Money(10, "USD") + new Money(5.5m, "USD");   // 15.50 USD
var withTax = total * 1.1m;
```

**Overloadable:** `+ - * / % ++ -- ! ~ == != < > <= >= & | ^ << >> true false` and conversion operators. **Not overloadable:** `&& || = ?: ?? . new is as`, and the compound `+=` comes for free from `+`.

::: tip When to use
Value-like domain types where the math is natural: `Money`, `Vector2`, `Matrix`, `Fraction`, `TimeRange`, `Point`. Don't overload operators where the meaning isn't obvious (`user + group`?). A named method is clearer there.
:::

## The is Operator

> `is` checks whether an object is compatible with a type, and can **declare a typed variable** in one step (pattern matching).

```csharp
object payload = GetMessage();

if (payload is string text)                  // type pattern: test + cast
    Console.WriteLine(text.ToUpper());

if (shape is Circle { Radius: > 10 } big)    // type + property pattern
    Console.WriteLine($"Big circle {big.Radius}");

if (value is null) { }                       // null check that can't be fooled by an overloaded ==
if (value is not null) { }
if (age is >= 18 and < 65) { }               // relational patterns
if (input is "y" or "yes") { }

// Handle different event types
void Handle(IEvent e)
{
    if (e is OrderPlaced placed) SendConfirmation(placed.OrderId);
    else if (e is OrderCancelled cancelled) Refund(cancelled.OrderId);
}
```

::: tip When to use
Safe downcasting, null checks (`is null` is the idiomatic way), and branching on a type you don't control. If you check types of your *own* hierarchy a lot, a virtual method ([polymorphism](/inheritance/polymorphism)) is usually better.
:::

## The as Operator

> `as` tries a reference conversion and returns **null** instead of throwing if it fails.

```csharp
object obj = GetControl();

var button = obj as Button;      // null if obj isn't a Button
button?.Click();

// Equivalent with is (usually preferred today)
if (obj is Button b) b.Click();

// Cast vs as
var c1 = (Button)obj;            // InvalidCastException if wrong type
var c2 = obj as Button;          // null if wrong type
// int n = obj as int;           ❌ as works only with reference or nullable types
int? n = obj as int?;            // ✅
```

| | `(T)x` | `x as T` | `x is T t` |
| --- | --- | --- | --- |
| Wrong type | throws | `null` | `false` |
| Value types | ✅ | only `T?` | ✅ |
| Use when | you're *sure* of the type | old code / need the variable outside | **default choice** |

::: tip When to use
When failure to convert is a normal case. In modern C#, `is T t` covers almost everything `as` did.
:::

## Object Class Members

> Every type inherits from `System.Object`, so everything has `ToString`, `Equals`, `GetHashCode` and `GetType`.

```csharp
public class Person
{
    public string Name { get; init; } = "";
    public string Cpf { get; init; } = "";

    public override string ToString() => $"{Name} ({Cpf})";      // debugger, logs, string interpolation

    public override bool Equals(object? obj) => obj is Person p && p.Cpf == Cpf; // identity by document
    public override int GetHashCode() => Cpf.GetHashCode();     // MUST match Equals
}

var p = new Person { Name = "Ana", Cpf = "123" };
Console.WriteLine(p);                         // Ana (123)
Console.WriteLine(p.GetType().Name);          // Person
object o = 42; Console.WriteLine(o.GetType()); // System.Int32
```

::: warning Gotcha
If you override `Equals`, override `GetHashCode` too. Otherwise `Dictionary` and `HashSet` break, because equal objects land in different buckets. Records generate both for you.
:::
