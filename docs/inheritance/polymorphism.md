# Polymorphism

One interface, many forms: treating different types uniformly while each one behaves its own way.

## What Is Polymorphism

> Code written against a base type or interface automatically runs the right implementation for the actual object at runtime.

Two kinds:
- **Compile-time (static):** method overloading and operator overloading. The compiler picks the method.
- **Runtime (dynamic):** `virtual`/`override` and interfaces. The runtime picks the method based on the actual object.

```csharp
public abstract class Shape
{
    public abstract double Area();
    public virtual string Describe() => $"{GetType().Name} with area {Area():F2}";
}
public class Circle(double r) : Shape { public override double Area() => Math.PI * r * r; }
public class Square(double s) : Shape { public override double Area() => s * s; }
public class Triangle(double b, double h) : Shape { public override double Area() => b * h / 2; }

List<Shape> shapes = [new Circle(2), new Square(3), new Triangle(4, 5)];

foreach (var shape in shapes)
    Console.WriteLine(shape.Describe());   // each type's own Area() runs

double total = shapes.Sum(s => s.Area()); // no switch, no type checks
```

::: tip When to use
Whenever you'd otherwise write `if (x is A) … else if (x is B) …` or `switch (type)` scattered across the code. Polymorphism moves that decision into the types themselves, and adding a new type doesn't touch existing code ([Open/Closed](/architecture/solid)).
:::

## Polymorphism with Interfaces

> The most common form in real apps: many classes implement one interface, and consumers depend only on that interface.

```csharp
public interface IPaymentMethod
{
    string Name { get; }
    bool Pay(decimal amount);
}

public class CreditCard(string number) : IPaymentMethod
{
    public string Name => "Credit card";
    public bool Pay(decimal amount) { Console.WriteLine($"Charging {amount:C} to card ****{number[^4..]}"); return true; }
}

public class Pix(string key) : IPaymentMethod
{
    public string Name => "Pix";
    public bool Pay(decimal amount) { Console.WriteLine($"Pix of {amount:C} to {key}"); return true; }
}

public class PayPal(string email) : IPaymentMethod
{
    public string Name => "PayPal";
    public bool Pay(decimal amount) { Console.WriteLine($"PayPal {amount:C} from {email}"); return true; }
}

public class Checkout
{
    public void Complete(Order order, IPaymentMethod method)   // knows nothing about cards or Pix
    {
        if (!method.Pay(order.Total)) throw new PaymentFailedException(method.Name);
        order.MarkPaid();
    }
}

// Choosing the implementation happens once, at the edge (factory, DI, user choice)
IPaymentMethod method = choice switch
{
    "card" => new CreditCard(cardNumber),
    "pix" => new Pix(pixKey),
    _ => new PayPal(email)
};
checkout.Complete(order, method);
```

**Polymorphism vs interfaces:** an *interface* is a language feature (a contract); *polymorphism* is the behavior you get from it, where one call site runs many implementations. Inheritance with `virtual` gives polymorphism too.

::: tip When to use
Strategies (payment, shipping, pricing, export formats), plugins, notification channels, storage providers. It's the foundation of DI and testable code.
:::

## Polymorphism and Collections

> A collection typed as the base or interface can hold every derived type, so you can process heterogeneous objects in one loop.

```csharp
List<IRule> rules =
[
    new MinimumAgeRule(18),
    new BlacklistRule(blockedEmails),
    new CreditScoreRule(minScore: 600)
];

var failures = rules
    .Where(rule => !rule.IsSatisfiedBy(applicant))
    .Select(rule => rule.ErrorMessage)
    .ToList();
```

::: tip When to use
Validation pipelines, middleware chains, game update loops (`foreach (var entity in entities) entity.Update(dt);`), and rendering lists of UI widgets.
:::
