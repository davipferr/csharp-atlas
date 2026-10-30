# Delegates & Lambdas

Type-safe references to methods: passing behavior around as data.

## Delegates

> A delegate is a **type** that represents a method signature. A delegate variable holds a reference to any method with that signature.

```csharp
// 1. Declare the delegate type (usually at namespace level, next to classes)
public delegate decimal DiscountRule(decimal total);

// 2. Methods that match the signature
static decimal NoDiscount(decimal t) => t;
static decimal BlackFriday(decimal t) => t * 0.7m;

// 3. Assign and invoke
DiscountRule rule = DateTime.Today.Month == 11 ? BlackFriday : NoDiscount;
decimal final = rule(200m);            // same as rule.Invoke(200m)

// Passing behavior into a method
decimal Checkout(Cart cart, DiscountRule discount) => discount(cart.Total);
Checkout(cart, t => t > 500 ? t - 50 : t);   // lambda matches the delegate too
```

**Where to declare delegates:** at the namespace level (like a class) when shared, or nested inside a class when tied to it. In modern code you rarely declare your own; you use `Func`, `Action` and `Predicate` (see [Generic Delegates](/generics/generic-delegates)).

::: tip When to use
Callbacks, strategies chosen at runtime, plug-in behavior (sorting comparisons, validation rules, retry policies), and the base of events and LINQ.
:::

## Lambda Expressions

> `(params) => expression` or `(params) => { statements }` is an anonymous function that can be assigned to any compatible delegate.

```csharp
Func<int, int> square = x => x * x;
Func<int, int, int> add = (a, b) => a + b;
Action<string> log = msg => Console.WriteLine($"[{DateTime.Now:T}] {msg}");
Func<bool> isOpen = () => DateTime.Now.Hour is >= 9 and < 18;

Func<Order, bool> isLarge = order =>
{
    var threshold = order.IsCorporate ? 10_000m : 1_000m;
    return order.Total > threshold;
};

var lambda = (string s) => s.Length;        // C# 10: natural type → Func<string, int>
Func<int, int> twice = static x => x * 2;   // static lambda: can't capture (no allocation)

// Closures: lambdas capture variables, not values
int counter = 0;
Action increment = () => counter++;
increment(); increment();
Console.WriteLine(counter);   // 2
```

::: warning Gotcha
Captured variables are shared. Lambdas created in a loop that capture a variable declared *outside* the loop all see its final value. Copy it into a loop-local variable first.
:::

## Multicast Delegates

> A delegate can hold **multiple methods**. `+=` adds, `-=` removes, and invoking calls them all in order.

```csharp
Action<string> notify = SendEmail;
notify += SendSms;
notify += WriteAuditLog;

notify("Order #123 shipped");    // calls SendEmail, SendSms, WriteAuditLog in order

notify -= SendSms;               // unsubscribe

static void SendEmail(string m) => Console.WriteLine($"Email: {m}");
static void SendSms(string m) => Console.WriteLine($"SMS: {m}");
static void WriteAuditLog(string m) => Console.WriteLine($"Audit: {m}");
```

::: warning Gotchas
- With a return value, only the **last** method's result is returned.
- If one handler throws, the remaining ones **don't run**.
- Invoking a delegate with no methods (null) throws, so use `notify?.Invoke(...)`.
:::

## GetInvocationList

> Returns the individual delegates inside a multicast delegate, so you can inspect them or invoke each one yourself.

```csharp
foreach (Delegate d in notify.GetInvocationList())
    Console.WriteLine($"{d.Method.DeclaringType?.Name}.{d.Method.Name}");

// Collect every result and isolate failures
Func<Order, bool>? validators = HasStock;
validators += HasValidAddress;
validators += IsUnderCreditLimit;

var failures = new List<string>();
foreach (Func<Order, bool> validate in validators.GetInvocationList())
{
    try
    {
        if (!validate(order)) failures.Add(validate.Method.Name);
    }
    catch (Exception ex) { failures.Add($"{validate.Method.Name}: {ex.Message}"); }
}
```

::: tip When to use
Getting all return values from a multicast delegate, making one failing subscriber not block the others, or debugging which handlers are attached.
:::
