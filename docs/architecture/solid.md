# SOLID Principles

Five design principles for object-oriented code that's easy to extend and maintain.

| Letter | Principle | One-liner |
| --- | --- | --- |
| **S** | Single Responsibility | one reason to change |
| **O** | Open/Closed | extend without modifying |
| **L** | Liskov Substitution | subtypes must honor the base contract |
| **I** | Interface Segregation | small, focused interfaces |
| **D** | Dependency Inversion | depend on abstractions |

## Single Responsibility Principle (SRP)

> A class should have **one reason to change**, meaning it serves one actor or concern.

```csharp
// ❌ Three reasons to change: business rules, persistence, formatting/emailing
public class Invoice
{
    public decimal CalculateTotal() { /* ... */ return 0; }
    public void SaveToDatabase() { /* SQL */ }
    public void SendByEmail() { /* SMTP + HTML */ }
}

// ✅ Split by responsibility
public class Invoice { public decimal CalculateTotal() { /* ... */ return 0; } }
public class InvoiceRepository { public Task SaveAsync(Invoice i) => Task.CompletedTask; }
public class InvoiceEmailSender { public Task SendAsync(Invoice i) => Task.CompletedTask; }
```

::: tip How to spot violations
Class names with "And"/"Manager", hundreds of lines, many unrelated dependencies in the constructor, or changes for unrelated features always touching the same file.
:::

## Open/Closed Principle (OCP)

> Classes should be **open for extension, closed for modification**: add new behavior by adding code, not by editing working code.

```csharp
// ❌ Every new shipping method edits this switch
public decimal Shipping(Order o, string method) => method switch
{
    "standard" => 10,
    "express" => 25,
    // add "drone" here... and retest everything
    _ => throw new NotSupportedException()
};

// ✅ New behavior = new class
public interface IShippingStrategy
{
    string Name { get; }
    decimal Calculate(Order o);
}
public class StandardShipping : IShippingStrategy { public string Name => "standard"; public decimal Calculate(Order o) => 10; }
public class ExpressShipping : IShippingStrategy { public string Name => "express"; public decimal Calculate(Order o) => 25; }
public class DroneShipping : IShippingStrategy { public string Name => "drone"; public decimal Calculate(Order o) => 40; } // added, nothing edited

public class ShippingCalculator(IEnumerable<IShippingStrategy> strategies)
{
    public decimal Calculate(Order o, string method) => strategies.Single(s => s.Name == method).Calculate(o);
}
```

::: tip When to use
Where you *expect* variation: payment methods, export formats, discount rules, notification channels. Don't add extension points for changes that never come (KISS).
:::

## Liskov Substitution Principle (LSP)

> Objects of a subclass must be usable **anywhere** the base class is expected, without breaking correctness.

```csharp
// ❌ Classic violation: Square changes Rectangle's behavior
public class Rectangle
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }
    public int Area => Width * Height;
}
public class Square : Rectangle
{
    public override int Width { set { base.Width = base.Height = value; } }
    public override int Height { set { base.Width = base.Height = value; } }
}

void Resize(Rectangle r) { r.Width = 5; r.Height = 4; Debug.Assert(r.Area == 20); } // fails for Square

// ❌ Another smell: subclass throwing NotSupportedException for a base method
public class ReadOnlyRepo : Repository { public override void Save(Entity e) => throw new NotSupportedException(); }

// ✅ Model what they share, not a false IS-A
public interface IShape { int Area { get; } }
public record Rect(int Width, int Height) : IShape { public int Area => Width * Height; }
public record Sq(int Side) : IShape { public int Area => Side * Side; }
```

::: tip How to spot violations
Overrides that throw, do nothing, strengthen preconditions or weaken guarantees; and callers doing `if (x is SpecialSubclass)`.
:::

## Interface Segregation Principle (ISP)

> Clients shouldn't be forced to depend on methods they don't use. Prefer several small interfaces over one fat interface.

```csharp
// ❌ A basic printer must implement Scan and Fax
public interface IMachine { void Print(Doc d); void Scan(Doc d); void Fax(Doc d); }
public class BasicPrinter : IMachine
{
    public void Print(Doc d) { }
    public void Scan(Doc d) => throw new NotSupportedException();
    public void Fax(Doc d) => throw new NotSupportedException();
}

// ✅ Role interfaces
public interface IPrinter { void Print(Doc d); }
public interface IScanner { void Scan(Doc d); }
public class BasicPrinter2 : IPrinter { public void Print(Doc d) { } }
public class OfficeMachine : IPrinter, IScanner { public void Print(Doc d) { } public void Scan(Doc d) { } }

// Real world: split read and write sides
public interface IReadRepository<T> { Task<T?> GetAsync(int id); }
public interface IWriteRepository<T> { Task AddAsync(T item); }
```

## Dependency Inversion Principle (DIP)

> High-level modules shouldn't depend on low-level modules; both should depend on **abstractions**. The abstraction belongs to the high-level side.

```csharp
// ❌ Business logic depends directly on infrastructure details
public class SignupService
{
    private readonly SmtpClient _smtp = new("smtp.gmail.com");
    public void Register(User u) { /* ... */ _smtp.Send(/* ... */); }
}

// ✅ Business defines what it needs; infrastructure implements it
public interface IWelcomeNotifier { Task NotifyAsync(User user); }          // lives in the domain/application layer

public class SignupService(IUserRepository users, IWelcomeNotifier notifier)
{
    public async Task RegisterAsync(User u)
    {
        await users.AddAsync(u);
        await notifier.NotifyAsync(u);
    }
}

public class SmtpWelcomeNotifier : IWelcomeNotifier { /* infrastructure layer */ public Task NotifyAsync(User u) => Task.CompletedTask; }
public class SlackWelcomeNotifier : IWelcomeNotifier { public Task NotifyAsync(User u) => Task.CompletedTask; }
```

**DIP vs DI:** Dependency *Inversion* is the design principle (depend on abstractions). Dependency *Injection* is the technique that supplies those abstractions at runtime. See [Dependency Injection](/architecture/dependency-injection).

::: tip When to use
At architectural boundaries: database, email, file storage, payment providers, external APIs, the clock. It's the basis of Clean/Hexagonal Architecture and of testable code.
:::
