# Methods

Declaring methods, how scope and fields work, expression-bodied members, recursion and local functions.

## Method Anatomy

> `[modifiers] ReturnType Name(parameters) { body }`. `void` returns nothing; any other type must `return` a value on every path.

```csharp
public class InvoiceService
{
    // void, no parameters
    public void PrintHeader() => Console.WriteLine("=== INVOICE ===");

    // void with parameters
    public void PrintLine(string product, int qty, decimal price)
        => Console.WriteLine($"{product,-15}{qty,4} x {price,8:C}");

    // returns a value
    public decimal CalculateTotal(IEnumerable<decimal> prices, decimal taxRate)
    {
        decimal subtotal = prices.Sum();
        return subtotal + subtotal * taxRate;
    }

    // returns multiple values with a tuple
    public (decimal Min, decimal Max, decimal Avg) Stats(decimal[] values)
        => (values.Min(), values.Max(), values.Average());

    // async method
    public async Task<string> DownloadAsync(string url) => await _http.GetStringAsync(url);
}

var (min, max, avg) = service.Stats(prices);   // deconstruct the tuple
```

**Overloading**: same name, different parameter lists. The compiler picks the best match.

```csharp
public void Log(string message) { }
public void Log(string message, LogLevel level) { }
public void Log(Exception ex) { }
```

::: tip When to use
- A method should do one thing and its name should say what (`CalculateTotal`, not `Process`).
- Return a tuple for 2–3 related values inside your own code; return a record or class for public APIs.
:::

## Fields vs Local Variables

> Fields belong to the **object** and live as long as it does; locals belong to a **method call** and disappear when it returns.

```csharp
public class WeatherSimulator
{
    private readonly Random _random = new();       // field: shared by all methods
    private int _daysSimulated;                     // field: state that persists between calls

    public int[] Simulate(int days)
    {
        int[] temps = new int[days];                // local: only during this call
        for (int i = 0; i < days; i++)
            temps[i] = _random.Next(-10, 40);
        _daysSimulated += days;
        return temps;
    }
}
```

| | Field | Local variable |
| --- | --- | --- |
| Declared | in the class body | inside a method/block |
| Lifetime | the object (or the app, if `static`) | the method call |
| Default value | yes (`0`, `null`, `false`) | none; must assign before use |
| Access modifiers | yes | no |

::: tip When to use
Fields hold *state* the object needs across calls (injected services, counters, caches). Everything else should stay local. Fewer fields means fewer side effects.
:::

## Expression-Bodied Members

> `=>` replaces `{ return ...; }` for members whose body is a single expression.

```csharp
public class Rectangle
{
    private double _width, _height;

    public Rectangle(double w, double h) => (_width, _height) = (w, h);  // constructor

    public double Area => _width * _height;                 // read-only property
    public double Width { get => _width; set => _width = Math.Max(0, value); } // accessors
    public double Perimeter() => 2 * (_width + _height);   // method
    public override string ToString() => $"{_width}x{_height}";
    public void Print() => Console.WriteLine(this);        // void works too
}
```

::: tip When to use
One-liners: computed properties, simple getters, forwarding methods, `ToString` overrides. Switch back to a block body as soon as you need a second statement.
:::

## Recursion

> A method that calls itself on a smaller version of the problem, with a **base case** to stop.

```csharp
long Factorial(int n) => n <= 1 ? 1 : n * Factorial(n - 1);

// Real use: walking a tree structure (folders, comments, org charts, menus)
long FolderSize(DirectoryInfo dir)
{
    long size = dir.GetFiles().Sum(f => f.Length);
    foreach (var sub in dir.GetDirectories())
        size += FolderSize(sub);                // recursive case
    return size;                                 // base case: no subfolders
}

void PrintMenu(MenuItem item, int depth = 0)
{
    Console.WriteLine($"{new string(' ', depth * 2)}- {item.Title}");
    foreach (var child in item.Children)
        PrintMenu(child, depth + 1);
}
```

::: warning Gotchas
- Forgetting the base case → `StackOverflowException`, which **can't be caught** and kills the process.
- C# doesn't guarantee tail-call optimization. For very deep inputs, use a loop with an explicit `Stack<T>`.
- Naive recursion can repeat work (Fibonacci); cache results (memoization).
:::

::: tip When to use
Hierarchical data (trees, JSON, file systems, category trees), divide-and-conquer algorithms (merge sort, quick sort, binary search), backtracking (sudoku, permutations).
:::

## Local Functions <Badge type="tip" text="extra" />

> A method declared **inside** another method, visible only there. Good for helpers that make no sense elsewhere.

```csharp
public decimal CalculateShipping(Order order)
{
    if (order.Items.Count == 0) return 0;
    return order.Items.Sum(PriceFor);

    decimal PriceFor(Item item) => item.Weight * RatePerKg(order.Region);   // captures `order`
    static decimal RatePerKg(string region) => region == "BR" ? 2.5m : 7m;  // static: no capture
}

// Classic use: validate eagerly, iterate lazily
public static IEnumerable<T> TakeEvery<T>(IEnumerable<T> source, int step)
{
    ArgumentNullException.ThrowIfNull(source);          // runs immediately
    if (step <= 0) throw new ArgumentOutOfRangeException(nameof(step));
    return Iterator();

    IEnumerable<T> Iterator()
    {
        int i = 0;
        foreach (var item in source)
            if (i++ % step == 0) yield return item;
    }
}
```

::: tip When to use
Recursive helpers, iterator/async wrappers with eager argument validation, and breaking a long method into named steps without polluting the class.
:::

## Iterators with yield <Badge type="tip" text="extra" />

> `yield return` produces items one at a time, lazily, without building a list.

```csharp
IEnumerable<string> ReadLargeFile(string path)
{
    using var reader = new StreamReader(path);
    string? line;
    while ((line = reader.ReadLine()) != null)
        yield return line;              // streamed: a 10 GB file uses little memory
}

IEnumerable<int> Fibonacci()
{
    (int a, int b) = (0, 1);
    while (true) { yield return a; (a, b) = (b, a + b); }  // infinite but lazy
}

foreach (var n in Fibonacci().Take(10)) Console.Write($"{n} ");
```

::: tip When to use
Streaming big files or DB results, paging through an API, infinite or generated sequences, and custom LINQ-like operators.
:::
