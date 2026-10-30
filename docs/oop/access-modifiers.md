# Access Modifiers

Who can see and use a type or member.

## Public, Private, Protected and Internal

> Access modifiers control visibility. Expose the minimum and hide the rest; that's what encapsulation means in practice.

| Modifier | Visible to |
| --- | --- |
| `public` | everyone |
| `private` | the same class only (**default for members**) |
| `protected` | the class and its derived classes |
| `internal` | anything in the same assembly/project (**default for top-level types**) |
| `protected internal` | same assembly **or** derived classes anywhere |
| `private protected` | derived classes **in the same assembly** |
| `file` | the same source file only (C# 11, types only) |

```csharp
public class PaymentProcessor                 // usable from other projects
{
    private readonly IGateway _gateway;       // implementation detail
    protected decimal FeeRate = 0.03m;        // subclasses may adjust
    internal int RetryCount = 3;              // tests in this assembly / friends

    public PaymentProcessor(IGateway gateway) => _gateway = gateway;

    public Receipt Charge(decimal amount) => _gateway.Charge(amount + CalculateFee(amount));

    protected virtual decimal CalculateFee(decimal amount) => amount * FeeRate;

    private void Audit(string msg) { }        // only this class
}

internal class GatewayResponseParser { }      // invisible outside this project
```

```xml
<!-- Let the test project see internal members -->
<ItemGroup>
  <InternalsVisibleTo Include="MyApp.Tests" />
</ItemGroup>
```

::: tip When to use
- Start everything as `private` (members) or `internal` (types) and widen only when needed.
- `protected` for extension points meant for subclasses.
- `internal` for helpers that other projects shouldn't depend on. It keeps your public API small, so you can change internals freely.
:::

## Protected and Inheritance

> `protected` members are hidden from the outside world but available to subclasses. Use it to build a base class with hooks.

```csharp
public abstract class Report
{
    protected string Title { get; }
    protected Report(string title) => Title = title;     // only subclasses can call it

    public string Render() => $"{Header()}\n{Body()}\n{Footer()}";

    protected virtual string Header() => $"== {Title} ==";
    protected abstract string Body();
    protected virtual string Footer() => $"Generated {DateTime.Now:g}";
}

public class SalesReport(IEnumerable<Sale> sales) : Report("Sales")
{
    protected override string Body() => string.Join('\n', sales.Select(s => $"{s.Date:d} {s.Total:C}"));
}

// new SalesReport(...).Body();   ❌ not accessible from outside
```

::: tip When to use
Template-method style base classes, frameworks (ASP.NET `ControllerBase` has many protected helpers), and constructors of abstract classes.
:::
