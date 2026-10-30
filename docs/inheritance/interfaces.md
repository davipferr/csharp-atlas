# Interfaces

Contracts that describe *what* a type can do without saying *how*.

## What and Why Interfaces

> An interface declares members a type promises to implement. Code that depends on the interface works with **any** implementation.

```csharp
public interface IPaymentGateway
{
    string Name { get; }
    Task<PaymentResult> ChargeAsync(decimal amount, string token);
    Task RefundAsync(string transactionId);
}

public class StripeGateway : IPaymentGateway
{
    public string Name => "Stripe";
    public async Task<PaymentResult> ChargeAsync(decimal amount, string token) { /* Stripe API */ return new(true); }
    public Task RefundAsync(string transactionId) => Task.CompletedTask;
}

public class FakeGateway : IPaymentGateway       // for tests / local dev
{
    public string Name => "Fake";
    public Task<PaymentResult> ChargeAsync(decimal amount, string token) => Task.FromResult(new PaymentResult(true));
    public Task RefundAsync(string transactionId) => Task.CompletedTask;
}

public class CheckoutService(IPaymentGateway gateway)   // depends on the contract, not Stripe
{
    public Task<PaymentResult> PayAsync(Cart cart, string token) => gateway.ChargeAsync(cart.Total, token);
}
```

**Naming:** prefix with `I` (`IRepository`, `IDisposable`). Members are implicitly `public`.

**Why:** decoupling (swap Stripe for PayPal), testability (inject a fake), [dependency injection](/architecture/dependency-injection), and giving unrelated classes a common capability (`IComparable`, `IDisposable`, `IEnumerable`).

::: tip When to use
At boundaries: data access (`IOrderRepository`), external services (email, payments, storage, clock), and strategies that vary. Don't create an interface for every class "just because". Add one when there's a second implementation or a test double.
:::

## Implementing Multiple Interfaces

> A class can inherit only one class but implement **any number** of interfaces. That's C#'s answer to multiple inheritance.

```csharp
public interface IFlyable { void Fly(); }
public interface ISwimmable { void Swim(); }

public class Duck : Animal, IFlyable, ISwimmable
{
    public void Fly() => Console.WriteLine("Flap flap");
    public void Swim() => Console.WriteLine("Paddle");
}

void MoveToLake(ISwimmable s) => s.Swim();       // accepts ducks, fish, boats...

// Explicit implementation: resolves name clashes and hides the member from the class's API
public interface IPrinter { void Print(); }
public interface IScanner { void Print(); }      // same name, different meaning
public class Copier : IPrinter, IScanner
{
    void IPrinter.Print() => Console.WriteLine("Printing page");
    void IScanner.Print() => Console.WriteLine("Printing scan preview");
}
((IPrinter)new Copier()).Print();
```

::: tip When to use
Mix-in style capabilities: `IComparable<T>` + `IEquatable<T>` + `IDisposable` on the same class, or role interfaces like `IReadRepository` + `IWriteRepository`.
:::

## Default Interface Methods <Badge type="tip" text="extra" />

> Since C# 8, interfaces can have members **with a body**, plus static members, so you can add methods without breaking existing implementers.

```csharp
public interface ILogger
{
    void Log(LogLevel level, string message);

    void Info(string message) => Log(LogLevel.Info, message);    // default implementation
    void Error(Exception ex) => Log(LogLevel.Error, ex.ToString());
}

public interface IParsable<TSelf> where TSelf : IParsable<TSelf>
{
    static abstract TSelf Parse(string s);    // static abstract (C# 11): generic math, factories
}
```

::: warning Gotcha
Default methods are only reachable through the interface type: `((ILogger)myLogger).Info("x")`, not `myLogger.Info` on the class variable.
:::

## Abstract Class vs Interface

> Abstract class = "is a" + shared **state and code**. Interface = "can do" + a **contract** only, and a class can implement many.

| | Abstract class | Interface |
| --- | --- | --- |
| Instantiable | no | no |
| Fields / state | ✅ | ❌ (static only) |
| Constructors | ✅ | ❌ |
| Implemented code | ✅ | default methods only (C# 8+) |
| Access modifiers on members | any | public by default |
| How many per class | **one** | **many** |
| Relationship | IS-A (`Dog` is an `Animal`) | CAN-DO (`Duck` can `IFly`) |
| Versioning | add virtual members freely | add members via default methods |

```csharp
// Often both: interface for the contract, abstract base for shared plumbing
public interface INotificationChannel { Task SendAsync(Message m); }

public abstract class NotificationChannelBase : INotificationChannel
{
    protected readonly ILogger Logger;
    protected NotificationChannelBase(ILogger logger) => Logger = logger;

    public async Task SendAsync(Message m)
    {
        Logger.LogInformation("Sending via {Channel}", GetType().Name);
        await SendCoreAsync(m);
    }
    protected abstract Task SendCoreAsync(Message m);
}

public class EmailChannel(ILogger<EmailChannel> l) : NotificationChannelBase(l)
{
    protected override Task SendCoreAsync(Message m) => Task.CompletedTask;
}
```

::: tip When to use
Default to **interfaces** for dependencies and capabilities. Add an **abstract base class** when several implementations duplicate the same code or state.
:::
