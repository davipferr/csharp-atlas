# Dictionaries

`Dictionary<TKey, TValue>`: fast lookup of values by a unique key.

## Declaring and Initializing Dictionaries

> A hash table mapping unique keys to values, with ~O(1) lookup by key.

```csharp
var stock = new Dictionary<string, int>();

var prices = new Dictionary<string, decimal>       // collection initializer (calls Add)
{
    { "apple", 1.20m },
    { "banana", 0.50m }
};

var statusCodes = new Dictionary<int, string>      // index initializer (uses the indexer)
{
    [200] = "OK",
    [404] = "Not Found",
    [500] = "Server Error"
};

// Case-insensitive string keys: "Apple" and "apple" are the same key
var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

// From a list
var byId = users.ToDictionary(u => u.Id);
var nameById = users.ToDictionary(u => u.Id, u => u.Name);
```

::: tip When to use
Any "look up X by Y": users by ID, config by key, product by SKU, cache entries, translation tables, counting occurrences.
:::

## Adding, Updating and Removing

> `Add` throws on duplicates, the indexer adds **or** overwrites, and `TryAdd` / `TryGetValue` / `Remove` never throw.

```csharp
stock.Add("apple", 10);          // ArgumentException if "apple" already exists
stock["apple"] = 15;             // add or overwrite (upsert)
bool added = stock.TryAdd("pear", 5);   // false if exists, no exception

int qty = stock["kiwi"];         // ❌ KeyNotFoundException if missing

if (stock.TryGetValue("kiwi", out int kiwi))   // ✅ safe read
    Console.WriteLine(kiwi);

int pears = stock.GetValueOrDefault("pear", 0);
bool exists = stock.ContainsKey("apple");
bool removed = stock.Remove("apple");
stock.Remove("pear", out int removedQty);

// Increment a counter gracefully
stock[item] = stock.GetValueOrDefault(item) + 1;

// Word frequency
var freq = new Dictionary<string, int>();
foreach (var word in text.Split(' ', StringSplitOptions.RemoveEmptyEntries))
    freq[word] = freq.TryGetValue(word, out var c) ? c + 1 : 1;
```

::: tip When to use
- Use `TryGetValue` instead of `ContainsKey` + indexer: one lookup instead of two.
- Indexer for upserts, `TryAdd` for "first one wins".
:::

## Iterating a Dictionary

> Iterating yields `KeyValuePair<TKey, TValue>` items. Use `.Keys` or `.Values` for just one side.

```csharp
foreach (KeyValuePair<string, int> pair in stock)
    Console.WriteLine($"{pair.Key}: {pair.Value}");

foreach (var (fruit, amount) in stock)        // deconstruction
    Console.WriteLine($"{fruit}: {amount}");

var lowStock = stock.Where(kv => kv.Value < 5).Select(kv => kv.Key);
int totalUnits = stock.Values.Sum();

// Modifying while iterating throws → iterate a copy of the keys
foreach (var key in stock.Keys.ToList())
    stock[key] = 0;
```

::: warning Gotcha
`Dictionary` doesn't guarantee order. If you need sorted keys, use `SortedDictionary<K,V>` or `OrderBy(kv => kv.Key)`.
:::

## Complex Objects as Values

> Values can be any type: objects, lists, even other dictionaries. Keys should be immutable, simple types.

```csharp
public class Employee
{
    public required string Name { get; init; }
    public decimal Salary { get; set; }
}

var employees = new Dictionary<string, Employee>
{
    ["E001"] = new() { Name = "Ana", Salary = 7000 },
    ["E002"] = new() { Name = "Bruno", Salary = 6500 }
};

employees["E001"].Salary *= 1.10m;                 // mutate the object in place

// One-to-many: grouping lists under a key
var ordersByCustomer = new Dictionary<int, List<Order>>();
foreach (var order in orders)
{
    if (!ordersByCustomer.TryGetValue(order.CustomerId, out var list))
        ordersByCustomer[order.CustomerId] = list = [];
    list.Add(order);
}
// LINQ shortcut: orders.GroupBy(o => o.CustomerId).ToDictionary(g => g.Key, g => g.ToList());

// Composite key with a tuple or record
var seatPrices = new Dictionary<(int Row, int Seat), decimal> { [(1, 5)] = 120m };
```

::: warning Gotcha
If you use your own class as a **key**, override `Equals` and `GetHashCode` (or use a `record`). Otherwise two equal-looking keys are different entries.
:::

## Why a Dictionary Instead of an Array or List

> Lists find items by **position** (or by scanning everything); dictionaries find them by **key** instantly.

| | `List<T>` / array | `Dictionary<K,V>` |
| --- | --- | --- |
| Access by | index (0..n) | any key (string, Guid, ID…) |
| Find by property | O(n): scan everything | O(1): hash lookup |
| Order | preserved | not guaranteed |
| Duplicates | allowed | keys unique |
| Memory | lower | higher |

```csharp
// O(n) on every lookup: slow inside loops
var user = users.First(u => u.Id == id);

// O(1): build once, look up many times
var usersById = users.ToDictionary(u => u.Id);
foreach (var order in orders)
    order.User = usersById[order.UserId];     // n lookups, each instant
```

::: tip When to use
When you look up by a key repeatedly, especially inside a loop (joining two lists in memory). Converting a `List` to a `Dictionary` once can turn O(n²) into O(n).
:::
