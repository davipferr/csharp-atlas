# Virtual, Override, Sealed & Abstract

Controlling how derived classes can change inherited behavior.

## Method Overriding (virtual / override)

> Mark a base method `virtual` to allow derived classes to replace it with `override`. The call resolves at **runtime** based on the actual object type.

```csharp
public class Notification
{
    public virtual string Format(string msg) => msg;
    public virtual void Send(string to, string msg) => Console.WriteLine($"Generic to {to}: {Format(msg)}");
}

public class SmsNotification : Notification
{
    public override string Format(string msg) => msg.Length > 160 ? msg[..157] + "..." : msg;
    public override void Send(string to, string msg) => Console.WriteLine($"SMS to {to}: {Format(msg)}");
}

Notification n = new SmsNotification();
n.Send("+55...", longText);   // SMS version runs, because the runtime type decides
```

Rules: same signature and return type (or a more derived return type since C# 9), can't reduce accessibility, and only `virtual`, `abstract` or `override` members can be overridden. Methods are **non-virtual by default** in C#, unlike Java.

::: tip When to use
When subclasses need different behavior for the same operation: pricing rules, rendering, validation, notification channels. Also for overriding framework methods like `ToString`, `Dispose(bool)` and `OnModelCreating`.
:::

## Method Hiding (new)

> A derived method with the same signature but **without** `override` *hides* the base one. Which method runs depends on the **variable's type**, not the object.

```csharp
public class Base
{
    public void Greet() => Console.WriteLine("Base");
    public virtual void Speak() => Console.WriteLine("Base speak");
}

public class Derived : Base
{
    public new void Greet() => Console.WriteLine("Derived");     // hiding
    public override void Speak() => Console.WriteLine("Derived speak"); // overriding
}

Base b = new Derived();
b.Greet();   // "Base"           ← hiding: compile-time type wins
b.Speak();   // "Derived speak"  ← override: runtime type wins

Derived d = new Derived();
d.Greet();   // "Derived"
```

::: warning Gotcha
Hiding is almost always a bug or a smell, since behavior changes based on how you hold the reference. The `new` keyword just tells the compiler "yes, I meant it". Without it you get warning CS0108.
:::

::: tip When to use
Rarely: when a base class you don't control later adds a member that clashes with yours, or to return a more specific type from a non-virtual member.
:::

## Sealed Classes and Methods

> `sealed` on a class prevents inheritance; `sealed override` on a method stops further overriding down the chain.

```csharp
public sealed class JwtTokenService : ITokenService { }    // nobody can derive from it
// public class Hacked : JwtTokenService { }   ❌

public class Payment
{
    public virtual decimal Fee() => 1m;
}
public class CardPayment : Payment
{
    public sealed override decimal Fee() => 2.5m;         // final version
}
public class PremiumCard : CardPayment
{
    // public override decimal Fee() => 0;   ❌ can't override a sealed method
}
```

Built-in sealed classes: `string`, most `System.*` value wrappers, and many framework types.

::: tip When to use
- Seal classes by default when they're not designed for extension. It communicates intent and lets the JIT devirtualize calls (a small speedup).
- Seal security-sensitive types and methods so behavior can't be altered.
- Seal a method to lock down a rule while still allowing other members to change.
:::

## Abstract Classes and Methods

> An `abstract` class can't be instantiated. It's a partially implemented base. `abstract` methods have no body and **must** be overridden.

```csharp
public abstract class DataExporter
{
    // Template method: the algorithm is fixed, the steps vary
    public void Export(IEnumerable<Customer> data, string path)
    {
        var content = Serialize(data);           // abstract step
        File.WriteAllText(path + Extension, content);
        OnExported(path);                        // optional hook
    }

    protected abstract string Extension { get; }                    // abstract property
    protected abstract string Serialize(IEnumerable<Customer> data);
    protected virtual void OnExported(string path) { }              // optional override
}

public class CsvExporter : DataExporter
{
    protected override string Extension => ".csv";
    protected override string Serialize(IEnumerable<Customer> data)
        => "Name,Email\n" + string.Join('\n', data.Select(c => $"{c.Name},{c.Email}"));
}

public class JsonExporter : DataExporter
{
    protected override string Extension => ".json";
    protected override string Serialize(IEnumerable<Customer> data) => JsonSerializer.Serialize(data);
}

// new DataExporter();  ❌ abstract
DataExporter exporter = format == "csv" ? new CsvExporter() : new JsonExporter();
exporter.Export(customers, "out/customers");
```

| `virtual` | `abstract` |
| --- | --- |
| has a default body | no body |
| overriding is optional | overriding is mandatory |
| any non-sealed class | only in abstract classes |

::: tip When to use
Related classes that share **state and code** but differ in some steps: exporters, report generators, game entities, payment processors. If there's no shared code, an interface is lighter. See [Abstract Class vs Interface](/inheritance/interfaces#abstract-class-vs-interface).
:::
