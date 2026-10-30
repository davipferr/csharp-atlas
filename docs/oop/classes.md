# Classes & Constructors

Defining classes, creating objects, constructors and their variations, and class-level features like nested and partial classes.

## Classes and Objects

> A **class** is a blueprint (data + behavior); an **object** is an instance of it created with `new` and stored on the heap.

```csharp
public class BankAccount
{
    // fields (state)
    private decimal _balance;

    // properties (controlled access to state)
    public string Owner { get; }
    public decimal Balance => _balance;

    // constructor
    public BankAccount(string owner, decimal initialDeposit)
    {
        Owner = owner;
        _balance = initialDeposit;
    }

    // methods (behavior)
    public void Deposit(decimal amount)
    {
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount));
        _balance += amount;
    }

    public bool TryWithdraw(decimal amount)
    {
        if (amount > _balance) return false;
        _balance -= amount;
        return true;
    }
}

var account = new BankAccount("Ana", 100);   // object (instance)
account.Deposit(50);
Console.WriteLine(account.Balance);          // 150
```

::: tip When to use
Model a concept that has both **data and rules**: the object protects its own invariants (balance can't go negative) instead of letting callers poke at raw fields. That's encapsulation.
:::

## Constructors

> A special method with the class's name and no return type. It runs on `new` and sets the object up in a valid state.

```csharp
public class Order
{
    public Guid Id { get; }
    public string Customer { get; }
    public DateTime CreatedAt { get; }
    public List<OrderItem> Items { get; } = [];      // property initializer

    public Order(string customer)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(customer);  // validate early
        Id = Guid.NewGuid();
        Customer = customer;
        CreatedAt = DateTime.UtcNow;
    }
}
```

**Default constructor**: if you write *no* constructor, the compiler adds a public parameterless one. Once you write any constructor, that implicit one is gone and you must declare it explicitly if you still want it.

```csharp
public class Settings
{
    public int Timeout { get; set; } = 30;
    public Settings() { }                  // needed for serializers, EF Core, new()-constraints
    public Settings(int timeout) => Timeout = timeout;
}
```

::: tip When to use
Put *required* data and validation in the constructor so an invalid object can never exist. Keep a parameterless constructor when frameworks (JSON deserializers, EF Core, generic `new()` constraints) need it.
:::

## Multiple Constructors and Chaining

> Overload constructors for different ways to create an object, and chain them with `: this(...)` so the logic lives in one place.

```csharp
public class Product
{
    public string Name { get; }
    public decimal Price { get; }
    public string Currency { get; }

    public Product(string name, decimal price, string currency)
    {
        Name = name;
        Price = price;
        Currency = currency;
    }

    public Product(string name, decimal price) : this(name, price, "USD") { }  // reuses the main one
    public Product(string name) : this(name, 0m) { }
}
```

::: tip When to use
Provide convenient defaults without duplicating validation. Optional parameters (`string currency = "USD"`) are an alternative for simple cases.
:::

## Primary Constructors <Badge type="tip" text="extra" />

> C# 12 lets you declare constructor parameters on the class itself. They're in scope for the whole class body.

```csharp
public class OrderService(IOrderRepository repository, ILogger<OrderService> logger)
{
    public async Task PlaceAsync(Order order)
    {
        logger.LogInformation("Placing order {Id}", order.Id);
        await repository.AddAsync(order);
    }
}

public class Money(decimal amount, string currency)
{
    public decimal Amount { get; } = amount;     // capture into a property
    public string Currency { get; } = currency;
}
```

::: tip When to use
Dependency injection in services and controllers. It removes the field + constructor boilerplate. Parameters are mutable captures, not readonly fields; assign them to a `readonly` field if that matters.
:::

## Object Initializers <Badge type="tip" text="extra" />

> Set accessible properties right after construction: `new T { Prop = value }`.

```csharp
var request = new HttpRequestMessage(HttpMethod.Post, url)
{
    Content = JsonContent.Create(payload),
    Version = HttpVersion.Version20
};

var user = new User { Name = "Ana", Email = "ana@mail.com", Roles = { "Admin" } }; // collection add
var copy = user with { Email = "new@mail.com" };   // records only: non-destructive copy
```

::: tip When to use
DTOs and options classes with many optional properties. Combine with `required` and `init` for objects that must be fully set and then never change.
:::

## The this Keyword

> `this` refers to the current instance. Use it to disambiguate, pass the object along, or chain constructors.

```csharp
public class Player
{
    private string name;
    private int score;

    public Player(string name, int score)
    {
        this.name = name;          // field vs parameter with the same name
        this.score = score;
    }

    public void JoinTeam(Team team) => team.Add(this);   // pass the current object

    public Player AddPoints(int points)                  // fluent API: return this
    {
        score += points;
        return this;
    }
}

player.AddPoints(10).AddPoints(5);
```

`this` also appears in [extension methods](/oop/static-const-readonly) (`static void M(this string s)`) and indexers (`public T this[int i]`).

::: tip When to use
Fluent builders, event registration (`button.Click += this.OnClick`), and constructor chaining. Using the `_field` naming convention removes most of the need for `this.field`.
:::

## Nested (Inner) Classes

> A class declared inside another class. It can access the outer class's **private** members and can itself be private.

```csharp
public class LinkedStack<T>
{
    private Node? _top;

    private class Node                    // implementation detail, hidden from the outside
    {
        public T Value { get; }
        public Node? Next { get; }
        public Node(T value, Node? next) => (Value, Next) = (value, next);
    }

    public void Push(T value) => _top = new Node(value, _top);
}

public class HttpClientWrapper
{
    public class Options { public int Retries { get; set; } = 3; }  // public nested: HttpClientWrapper.Options
}
```

::: tip When to use
Helper types that only make sense for one class (nodes, enumerators, builders, internal state) or options/result types tightly coupled to it. If other code uses it a lot, make it top-level.
:::

## Partial Classes and Methods

> `partial` splits one class across multiple files. The compiler merges them. Partial methods let one part declare a hook that another part implements.

```csharp
// Customer.cs — your code
public partial class Customer
{
    public string FullName => $"{FirstName} {LastName}";
    partial void OnNameChanged() => Console.WriteLine("Name changed");
}

// Customer.Generated.cs — tool-generated, regenerated on every build
public partial class Customer
{
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    partial void OnNameChanged();          // declared; removed if not implemented (void, private)
}

// Source generators use it heavily (C# 11+ regex generator)
public partial class Validators
{
    [GeneratedRegex(@"^\d{5}-\d{3}$")]
    public static partial Regex ZipCode();
}
```

::: tip When to use
Separating generated code (WinForms designer, EF scaffolding, source generators, gRPC) from hand-written code. Splitting a huge class across files is usually a sign the class should be split for real.
:::
