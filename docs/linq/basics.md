# LINQ Fundamentals

Language-Integrated Query: declarative filtering, sorting and shaping of any data source.

## What Is LINQ

> A set of extension methods on `IEnumerable<T>` (in-memory) and `IQueryable<T>` (databases), plus an optional SQL-like query syntax.

The same operators work over lists, arrays, dictionaries, XML, databases (EF Core) and more. You describe **what** you want, not **how** to loop.

```csharp
using System.Linq;

// Without LINQ
var result = new List<string>();
foreach (var s in students)
    if (s.Grade >= 7)
        result.Add(s.Name);
result.Sort();

// With LINQ
var approved = students.Where(s => s.Grade >= 7).Select(s => s.Name).OrderBy(n => n).ToList();
```

::: tip When to use
Almost any collection transformation: filtering, mapping, sorting, grouping, aggregating, searching. Keep plain loops for complex stateful logic or very hot paths.
:::

## Query Syntax vs Method Syntax

> Two ways to write the same query. The compiler translates query syntax into method calls.

```csharp
// Query syntax: reads like SQL, nicer for joins / let / multiple from
var q1 = from s in students
         where s.Grade >= 7
         orderby s.Grade descending, s.Name
         select new { s.Name, s.Grade };

// Method syntax: more operators available, chains well, the most common style
var q2 = students
    .Where(s => s.Grade >= 7)
    .OrderByDescending(s => s.Grade).ThenBy(s => s.Name)
    .Select(s => new { s.Name, s.Grade });

// Mixed: query syntax has no Count/First/Distinct keyword
int count = (from s in students where s.Age > 18 select s).Count();
```

::: tip When to use
Method syntax by default. Query syntax shines for joins, `let` (intermediate variables) and nested `from` clauses.
:::

## Deferred vs Immediate Execution

> Most LINQ operators build a query that runs **only when enumerated**. `ToList()`, `Count()`, `First()` and similar execute it immediately.

```csharp
var numbers = new List<int> { 1, 2, 3 };
var evens = numbers.Where(n => n % 2 == 0);   // nothing runs yet (deferred)

numbers.Add(4);
Console.WriteLine(string.Join(",", evens));   // 2,4 ← sees the new item

var snapshot = numbers.Where(n => n > 1).ToList();   // runs now (immediate)

// ⚠ Multiple enumeration runs the query again every time
IEnumerable<User> active = db.Users.Where(u => u.IsActive);
var c = active.Count();       // query #1
var l = active.ToList();      // query #2: materialize once instead
```

| Deferred (lazy) | Immediate (executes) |
| --- | --- |
| `Where`, `Select`, `SelectMany`, `OrderBy`, `Skip`, `Take`, `Distinct`, `GroupBy`, `Join` | `ToList`, `ToArray`, `ToDictionary`, `Count`, `Sum`, `Max`, `First`, `Single`, `Any`, `All`, `foreach` |

::: tip When to use
Build queries step by step (e.g. adding optional filters) and materialize **once** with `ToList()` when you need the results more than once.
:::

## Filtering and Sorting

> `Where` filters, `OrderBy`/`OrderByDescending` sort, and `ThenBy` adds secondary keys. `Skip`/`Take` page the results.

```csharp
var page = products
    .Where(p => p.IsActive)
    .Where(p => p.Price >= minPrice && p.Price <= maxPrice)
    .Where(p => p.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
    .OrderByDescending(p => p.Rating)
    .ThenBy(p => p.Price)
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .ToList();

var distinctCities = customers.Select(c => c.City).Distinct();
var uniqueByEmail = users.DistinctBy(u => u.Email.ToLower());      // .NET 6
var firstFive = scores.OrderDescending().Take(5);                  // .NET 7: Order/OrderDescending
var chunks = ids.Chunk(100);                                       // batches of 100

// Optional filters (common in search endpoints)
IQueryable<Product> query = db.Products;
if (categoryId is not null) query = query.Where(p => p.CategoryId == categoryId);
if (onlyInStock) query = query.Where(p => p.Stock > 0);
var results = await query.ToListAsync();
```

::: tip When to use
Search pages, reports, dashboards, API endpoints with filters and pagination. Put `Where` **before** `OrderBy` and `Select` so less data flows through.
:::

## Projection (Select and SelectMany)

> `Select` transforms each element into a new shape; `SelectMany` flattens nested collections into one sequence.

```csharp
// Entity → DTO
var dtos = users.Select(u => new UserDto(u.Id, u.FullName, u.Email));

// Anonymous types for ad-hoc shapes
var summary = orders.Select(o => new { o.Id, o.Customer.Name, ItemCount = o.Items.Count });

// With index
var ranked = players.OrderByDescending(p => p.Score)
                    .Select((p, i) => $"{i + 1}. {p.Name} — {p.Score}");

// SelectMany: all items from all orders
IEnumerable<OrderItem> allItems = orders.SelectMany(o => o.Items);
var allTags = posts.SelectMany(p => p.Tags).Distinct();

// Creating collections from other collections
Dictionary<int, string> namesById = users.ToDictionary(u => u.Id, u => u.Name);
HashSet<string> emails = users.Select(u => u.Email).ToHashSet();
ILookup<string, Product> byCategory = products.ToLookup(p => p.Category);
var pairs = names.Zip(scores, (n, s) => $"{n}: {s}");
```

::: tip When to use
Mapping entities to DTOs or view models, extracting one column, flattening one-to-many relations, and building lookups.
:::

## Element Operators

> Get a single element: `First`, `FirstOrDefault`, `Single`, `Last`, `ElementAt`, and the `OrDefault` variants that don't throw.

```csharp
var newest = orders.OrderByDescending(o => o.Date).First();          // throws if empty
var admin = users.FirstOrDefault(u => u.Role == "Admin");            // null if none
var me = users.Single(u => u.Id == id);                              // throws if 0 OR more than 1
var config = settings.SingleOrDefault(s => s.Key == "Theme");
var top = scores.MaxBy(s => s.Points);                               // element with max key (.NET 6)
var fallback = list.FirstOrDefault(x => x.IsDefault, defaultItem);   // custom default (.NET 6)
```

| Method | Empty | More than one match |
| --- | --- | --- |
| `First` | throws | returns first |
| `FirstOrDefault` | `default` | returns first |
| `Single` | throws | **throws** |
| `SingleOrDefault` | `default` | **throws** |

::: tip When to use
`Single` when duplicates would mean corrupted data (lookup by unique key). `FirstOrDefault` for "find if it exists". `First` only when emptiness is truly impossible.
:::
