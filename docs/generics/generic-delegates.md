# Action, Func & Predicate

The built-in generic delegates that replace almost every custom delegate declaration.

## Action Delegate

> `Action<T1, …, T16>` represents a method that takes parameters and returns **void**.

```csharp
Action greet = () => Console.WriteLine("Hi!");
Action<string> log = msg => Console.WriteLine($"[LOG] {msg}");
Action<string, ConsoleColor> print = (msg, color) =>
{
    Console.ForegroundColor = color;
    Console.WriteLine(msg);
    Console.ResetColor();
};

// Real uses
list.ForEach(item => Console.WriteLine(item));
void Measure(string name, Action work)
{
    var sw = Stopwatch.StartNew();
    work();
    Console.WriteLine($"{name}: {sw.ElapsedMilliseconds} ms");
}
Measure("Import", () => importer.Run());

builder.Services.Configure<SmtpOptions>(opts => opts.Port = 587);   // Action<T> configuration
```

::: tip When to use
Callbacks with no result: "do this when finished", configuration lambdas (`Action<Options>`), `ForEach`, timing and retry wrappers.
:::

## Func Delegate

> `Func<T1, …, TResult>` represents a method that **returns a value**. The **last** type argument is the return type.

```csharp
Func<int> rollDice = () => Random.Shared.Next(1, 7);
Func<decimal, decimal> addTax = price => price * 1.1m;
Func<int, int, int> multiply = (a, b) => a * b;
Func<Order, bool> isPriority = o => o.Customer.IsVip || o.Total > 5000;

// Higher-order functions
decimal ApplyAll(decimal value, params Func<decimal, decimal>[] steps)
    => steps.Aggregate(value, (acc, step) => step(acc));
var final = ApplyAll(100m, addTax, p => p - 5, p => Math.Round(p, 2));

// Lazy / deferred values
T GetOrCreate<T>(string key, Func<T> factory) =>
    _cache.TryGetValue(key, out var v) ? (T)v : (T)(_cache[key] = factory()!);
var report = GetOrCreate("monthly", () => BuildExpensiveReport());

// LINQ is built on Func
var names = users.Where(u => u.IsActive).Select(u => u.Name);  // Func<User,bool>, Func<User,string>
```

::: tip When to use
Strategies that compute something (pricing, scoring, mapping), factories (`Func<IDbConnection>`), lazy values, and every LINQ call.
:::

## Predicate Delegate

> `Predicate<T>` is a method that takes a `T` and returns `bool`. It's equivalent to `Func<T, bool>`, but used by older `List<T>` and `Array` APIs.

```csharp
Predicate<string> isValidEmail = e => e.Contains('@') && e.Contains('.');
Predicate<Product> outOfStock = p => p.Stock == 0;

List<Product> toReorder = products.FindAll(outOfStock);
products.RemoveAll(outOfStock);
bool anyInvalid = emails.Exists(e => !isValidEmail(e));
int idx = Array.FindIndex(arr, x => x > 100);

// Composable filters
Predicate<Product> And(Predicate<Product> a, Predicate<Product> b) => p => a(p) && b(p);
var cheapAndAvailable = And(p => p.Price < 50, p => p.Stock > 0);
```

| Delegate | Signature | Typical API |
| --- | --- | --- |
| `Action<T>` | `T → void` | `List.ForEach`, configuration, events |
| `Func<T, TResult>` | `T → TResult` | LINQ, factories, strategies |
| `Predicate<T>` | `T → bool` | `List.Find/FindAll/RemoveAll/Exists`, `Array.Find` |
| `Comparison<T>` | `(T, T) → int` | `List.Sort`, `Array.Sort` |

::: warning Gotcha
`Predicate<T>` and `Func<T, bool>` are **different types**, so you can't assign one variable to the other directly, even though the same lambda fits both. Wrap it: `Func<T,bool> f = x => pred(x);` or `new Predicate<T>(func)`.
:::

## Example: Task Management with Generic Delegates

> Putting `Action`, `Func` and `Predicate` together to make a small system configurable without subclasses.

```csharp
public record TaskItem(string Title, int Priority, DateTime Due, bool Done = false);

public class TaskManager
{
    private readonly List<TaskItem> _tasks = [];
    public Action<TaskItem>? OnAdded { get; set; }                 // notification hook

    public void Add(TaskItem t) { _tasks.Add(t); OnAdded?.Invoke(t); }

    public List<TaskItem> Filter(Predicate<TaskItem> criteria) => _tasks.FindAll(criteria);

    public IEnumerable<TResult> Project<TResult>(Func<TaskItem, TResult> selector) => _tasks.Select(selector);

    public void ForEachMatching(Predicate<TaskItem> criteria, Action<TaskItem> action)
        => _tasks.FindAll(criteria).ForEach(action);
}

var manager = new TaskManager { OnAdded = t => Console.WriteLine($"Added: {t.Title}") };
manager.Add(new("Pay rent", 1, DateTime.Today.AddDays(2)));
manager.Add(new("Study generics", 2, DateTime.Today.AddDays(7)));

var urgent = manager.Filter(t => !t.Done && t.Due <= DateTime.Today.AddDays(3));
var titles = manager.Project(t => t.Title.ToUpper());
manager.ForEachMatching(t => t.Priority == 1, t => Console.WriteLine($"🔥 {t.Title}"));
```
