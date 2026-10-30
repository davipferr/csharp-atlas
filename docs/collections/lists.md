# Lists

`List<T>`: the default growable collection, plus searching with predicates and lambdas.

## `List<T>` Basics

> A dynamically sized, type-safe, indexed collection. It's an array that resizes itself.

```csharp
var tasks = new List<string>();                  // empty
var primes = new List<int> { 2, 3, 5, 7 };       // collection initializer
List<string> tags = ["csharp", "dotnet"];        // collection expression (C# 12)
var big = new List<Order>(capacity: 10_000);     // pre-size if you know the count

tasks.Add("Write docs");
tasks.AddRange(["Review PR", "Deploy"]);
tasks.Insert(0, "Coffee");                       // insert at index
string first = tasks[0];
tasks[1] = "Write better docs";                  // replace
int count = tasks.Count;                         // NOT .Length

bool has = tasks.Contains("Deploy");
int index = tasks.IndexOf("Deploy");             // -1 if missing

tasks.Remove("Coffee");          // first match, returns bool
tasks.RemoveAt(0);               // by index
tasks.RemoveAll(t => t.StartsWith("Review")); // by condition, returns count
tasks.Clear();

string[] asArray = tasks.ToArray();
IReadOnlyList<string> readOnly = tasks.AsReadOnly(); // expose without allowing changes
```

::: tip When to use
The default choice whenever you need an ordered collection that grows: shopping cart items, results from a DB query, lines to write. Expose it as `IReadOnlyList<T>` or `IEnumerable<T>` from your classes.
:::

## Sorting Lists

> `Sort()` sorts **in place** using the default comparer, a lambda, or an `IComparer<T>`.

```csharp
var names = new List<string> { "Carla", "ana", "Bruno" };
names.Sort();                                            // in place, default order
names.Sort(StringComparer.OrdinalIgnoreCase);
names.Reverse();

var products = GetProducts();
products.Sort((a, b) => a.Price.CompareTo(b.Price));     // ascending by price
products.Sort((a, b) => b.Price.CompareTo(a.Price));     // descending

// LINQ alternative: returns a NEW sequence, original untouched, easy multi-key
var sorted = products.OrderBy(p => p.Category).ThenByDescending(p => p.Price).ToList();

// Make a type naturally sortable
public class Product : IComparable<Product>
{
    public decimal Price { get; set; }
    public int CompareTo(Product? other) => Price.CompareTo(other?.Price);
}
```

::: tip When to use
`List.Sort` when you own the list and want it reordered. `OrderBy` when you need multiple keys, want to keep the original order, or are already in a LINQ pipeline.
:::

## Find, FindAll, Exists and Any

> Search a list with a **predicate**, a function that returns `bool` for each item.

```csharp
var users = GetUsers();

User? admin = users.Find(u => u.Role == "Admin");            // first match or null
List<User> inactive = users.FindAll(u => !u.IsActive);        // all matches (List<T>)
int idx = users.FindIndex(u => u.Email == email);
bool anyBlocked = users.Exists(u => u.IsBlocked);             // List method
bool anyBlocked2 = users.Any(u => u.IsBlocked);               // LINQ, works on any IEnumerable
bool allVerified = users.All(u => u.EmailConfirmed);
bool notEmpty = users.Any();                                  // has at least one element
```

| `List<T>` method | LINQ equivalent |
| --- | --- |
| `Find` | `FirstOrDefault` |
| `FindAll` | `Where(...).ToList()` |
| `Exists` | `Any` |
| `TrueForAll` | `All` |
| `RemoveAll` | (no equivalent, LINQ never mutates) |

::: tip When to use
`Any()` instead of `Count() > 0` (it stops at the first item). `Find`/`FindAll` are slightly faster on a `List`; LINQ works on everything.
:::

## Predicates and Lambdas

> A lambda (`x => expression`) is an inline anonymous function. A `Predicate<T>` is a delegate `T → bool`, which is what `Find` and `FindAll` take.

```csharp
// All three are the same predicate
Predicate<int> isEven1 = delegate (int n) { return n % 2 == 0; }; // anonymous method (old)
Predicate<int> isEven2 = n => n % 2 == 0;                          // lambda
static bool IsEven(int n) => n % 2 == 0;                            // named method
var evens = numbers.FindAll(IsEven);                                // method group

// Lambdas can capture local variables (closures)
decimal minPrice = 50;
var expensive = products.FindAll(p => p.Price > minPrice);

// Statement lambda (multiple lines)
var valid = orders.FindAll(o =>
{
    if (o.Items.Count == 0) return false;
    return o.Total > 0 && o.Customer is not null;
});
```

::: tip When to use
Anywhere an API asks for behavior: filtering, sorting, event handlers, LINQ, `Task.Run`. Name it as a method when it's long or reused. See [Delegates & Lambdas](/delegates/delegates).
:::

## Lists of Complex Objects

> Lists usually hold your own classes or records. Searching and sorting then work on their properties.

```csharp
public record Product(int Id, string Name, string Category, decimal Price, int Stock);

var catalog = new List<Product>
{
    new(1, "Keyboard", "Peripherals", 199.90m, 12),
    new(2, "Monitor", "Displays", 1299m, 0),
    new(3, "Mouse", "Peripherals", 89.90m, 40),
};

var available = catalog.Where(p => p.Stock > 0).OrderBy(p => p.Price);
var cheapest = catalog.MinBy(p => p.Price);
decimal inventoryValue = catalog.Sum(p => p.Price * p.Stock);
catalog.RemoveAll(p => p.Stock == 0);

foreach (var p in available)
    Console.WriteLine($"{p.Name,-10} {p.Price,10:C}");
```

::: warning Gotcha
`list.Contains(obj)` and `list.Remove(obj)` use `Equals`. For classes that means *reference* equality, so a new object with the same data won't be found. Records compare by value.
:::
