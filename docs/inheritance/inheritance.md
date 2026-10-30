# Inheritance

Reusing and specializing behavior through base and derived classes.

## Base Class vs Derived Class

> A derived class (`class Dog : Animal`) inherits all non-private members of its base class and can add or specialize behavior.

```csharp
public class Employee                                 // base class
{
    public string Name { get; }
    public decimal BaseSalary { get; }

    public Employee(string name, decimal baseSalary) => (Name, BaseSalary) = (name, baseSalary);

    public virtual decimal CalculatePay() => BaseSalary;
    public string Badge() => $"[{GetType().Name}] {Name}";
}

public class Manager : Employee                       // derived class
{
    public decimal Bonus { get; }

    public Manager(string name, decimal salary, decimal bonus) : base(name, salary)
        => Bonus = bonus;

    public override decimal CalculatePay() => BaseSalary + Bonus;  // specialize
    public void ApproveVacation(Employee e) { }                     // add
}

Employee e = new Manager("Ana", 10_000, 2_000);   // a Manager IS an Employee
Console.WriteLine(e.CalculatePay());               // 12000 (virtual dispatch)
Console.WriteLine(e.Badge());                      // [Manager] Ana
```

**Inheritance matters because:** shared code lives in one place (DRY), derived types can be used anywhere the base is expected ([polymorphism](/inheritance/polymorphism)), and frameworks expose extension points (`ControllerBase`, `DbContext`, `BackgroundService`, `Exception`).

::: tip When to use
When there's a true **IS-A** relationship *and* shared behavior. For sharing only a contract, use an [interface](/inheritance/interfaces). For sharing implementation without IS-A, use composition.
:::

## IS-A vs HAS-A (Inheritance vs Composition)

> **IS-A** → inheritance (`Car : Vehicle`). **HAS-A** → composition, a field holding another object (`Car` has an `Engine`).

```csharp
// IS-A
public class Vehicle { public int Wheels { get; init; } }
public class Car : Vehicle { }

// HAS-A
public class Engine { public void Start() => Console.WriteLine("Vroom"); }
public class Car2
{
    private readonly Engine _engine = new();       // composition
    public void Start() => _engine.Start();         // delegate the work
}

// Classic mistake: inheriting to reuse code
public class Stack<T> : List<T> { }   // ❌ a Stack is not a List; it now exposes Insert, RemoveAt...
public class Stack2<T>                 // ✅ HAS-A list
{
    private readonly List<T> _items = [];
    public void Push(T item) => _items.Add(item);
    public T Pop() { var x = _items[^1]; _items.RemoveAt(_items.Count - 1); return x; }
}
```

::: tip When to use
"Favor composition over inheritance." Composition is more flexible: you can swap parts at runtime and inject them for tests. Inherit only when the subtype really can be used everywhere the base can (see [LSP](/architecture/solid)).
:::

## Types of Inheritance

> C# supports **single**, **multilevel** and **hierarchical** class inheritance. **Multiple** inheritance is possible only through interfaces.

```csharp
// Single: one base
class Animal { }
class Dog : Animal { }

// Multilevel: a chain
class Puppy : Dog { }              // Puppy → Dog → Animal → object

// Hierarchical: many classes share one base
class Cat : Animal { }
class Bird : Animal { }

// Multiple: NOT allowed with classes
// class Robot : Machine, Animal { }   ❌ CS1721
class Robot : Machine, IWalk, ITalk { } // ✅ one class + many interfaces
```

::: tip When to use
Keep hierarchies shallow (2–3 levels). Deep chains are hard to understand because behavior is scattered across many files.
:::

## The base Keyword

> `base` accesses the parent class's members, to call the original implementation from an override or to pick which base constructor runs.

```csharp
public class TimestampedLogger : ConsoleLogger
{
    public override void Log(string message)
        => base.Log($"[{DateTime.Now:HH:mm:ss}] {message}");   // extend, don't replace
}

public class AuditedRepository : Repository
{
    public override void Save(Entity e)
    {
        e.UpdatedAt = DateTime.UtcNow;   // before
        base.Save(e);                    // original behavior
        _audit.Record(e);                // after
    }
}
```

::: tip When to use
Decorating behavior: adding logging, validation or auditing around the base implementation instead of copy-pasting it.
:::

## Constructor Inheritance

> Constructors are **not inherited**. A derived class must call a base constructor with `: base(...)`, and the base constructor always runs first.

```csharp
public class Shape
{
    public string Color { get; }
    public Shape(string color)
    {
        Color = color;
        Console.WriteLine("1. Shape ctor");
    }
}

public class Circle : Shape
{
    public double Radius { get; }
    public Circle(string color, double radius) : base(color)   // pass what the base needs
    {
        Radius = radius;
        Console.WriteLine("2. Circle ctor");
    }
}

public class Wheel : Circle
{
    public Wheel(double radius) : base("black", radius) { }    // multilevel: chain continues
}

new Wheel(30);   // prints 1. Shape ctor, then 2. Circle ctor
```

**Rules**
- Order: field initializers (derived → base), then constructors (base → derived).
- If you omit `: base(...)`, the parameterless base constructor is called, and it's a compile error if the base doesn't have one.
- Several derived classes can each call a different base constructor overload.

```csharp
public abstract class HttpException : Exception
{
    public int StatusCode { get; }
    protected HttpException(int status, string msg) : base(msg) => StatusCode = status;
}
public class NotFoundException(string what) : HttpException(404, $"{what} not found");
public class ConflictException(string msg) : HttpException(409, msg);
```

::: tip When to use
Whenever the base class has required state. The base constructor guarantees every subclass initializes it (custom exceptions, entities with `Id`, base controllers with injected services).
:::

## Every Class Inherits from object

> If you don't specify a base, the class derives from `System.Object`, so every type has `ToString`, `Equals`, `GetHashCode` and `GetType`.

```csharp
class Point { }               // same as class Point : object { }

object[] things = [1, "two", new Point(), DateTime.Now];   // anything fits in object
foreach (var t in things)
    Console.WriteLine($"{t.GetType().Name}: {t}");
```

See [Object Class Members](/oop/operators-and-type-checks#object-class-members) for overriding `ToString`, `Equals` and `GetHashCode`.

::: tip When to use
Overriding `ToString()` on your domain classes makes logs and the debugger far more useful, and it costs one line.
:::
