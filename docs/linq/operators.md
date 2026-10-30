# Joining, Grouping & Aggregating

Combining sequences, grouping data and computing totals.

## Aggregation

> `Count`, `Sum`, `Average`, `Min`, `Max` and `Aggregate` reduce a sequence to a single value.

```csharp
int totalOrders = orders.Count();
int paidOrders = orders.Count(o => o.IsPaid);
decimal revenue = orders.Sum(o => o.Total);
double avgRating = reviews.Average(r => r.Stars);
decimal biggest = orders.Max(o => o.Total);
Order biggestOrder = orders.MaxBy(o => o.Total)!;
DateTime firstSale = orders.Min(o => o.Date);

bool anyPending = orders.Any(o => o.Status == Status.Pending);
bool allShipped = orders.All(o => o.Status == Status.Shipped);
bool hasVip = customers.Any(c => c.IsVip);

// Aggregate: a custom fold
string csv = names.Aggregate((acc, n) => acc + "," + n);
decimal compound = Enumerable.Range(1, 12).Aggregate(1000m, (bal, _) => bal * 1.01m);
```

::: warning Gotcha
`Average`, `Max` and `Min` throw on an **empty** sequence of non-nullable numbers. Guard with `Any()` or use `DefaultIfEmpty()`.
:::

## Grouping (GroupBy)

> `GroupBy` splits a sequence into groups that share a key. Each group is an `IGrouping<TKey, T>`, which is a key plus its items.

```csharp
// Sales report by category
var report = sales
    .GroupBy(s => s.Category)
    .Select(g => new
    {
        Category = g.Key,
        Count = g.Count(),
        Revenue = g.Sum(s => s.Amount),
        BestSeller = g.MaxBy(s => s.Amount)!.Product
    })
    .OrderByDescending(x => x.Revenue);

// Group by multiple keys
var byYearMonth = orders.GroupBy(o => new { o.Date.Year, o.Date.Month });

// Query syntax
var byCity = from c in customers
             group c by c.City into g
             where g.Count() > 10
             select new { City = g.Key, Customers = g.Count() };

// Count occurrences quickly (.NET 9)
var wordCounts = words.CountBy(w => w.ToLower());
```

::: tip When to use
Reports and dashboards (revenue per month, students per course, errors per type), and bucketing data before display.
:::

## Joining (Join and GroupJoin)

> `Join` matches elements of two sequences by a key (SQL inner join). `GroupJoin` pairs each element with **all** its matches (a basis for left joins).

```csharp
// Inner join: each enrollment with its student and course names
var enrollments =
    from e in enrollmentList
    join s in students on e.StudentId equals s.Id
    join c in courses on e.CourseId equals c.Id
    select new { Student = s.Name, Course = c.Title, e.Grade };

// Method syntax
var withCustomer = orders.Join(customers,
    o => o.CustomerId,
    c => c.Id,
    (o, c) => new { o.Id, o.Total, Customer = c.Name });

// GroupJoin: each university with its students
var universities =
    from u in universityList
    join s in students on u.Id equals s.UniversityId into uniStudents
    select new { u.Name, Students = uniStudents.ToList() };

// Left join: customers even without orders
var leftJoin =
    from c in customers
    join o in orders on c.Id equals o.CustomerId into co
    from o in co.DefaultIfEmpty()
    select new { c.Name, OrderId = o?.Id };

// .NET 10 adds LeftJoin / RightJoin operators directly
```

::: tip When to use
Combining data from two sources in memory (CSV + API, two lists), and many-to-many relations through an associative table (Student ↔ Enrollment ↔ Course). With EF Core you'll usually navigate relations (`o.Customer.Name`) instead of writing joins.
:::

## Set Operators

> Treat sequences like sets: `Distinct`, `Union`, `Intersect`, `Except`, plus the `…By` variants that compare by a key.

```csharp
var allEmails = newsletter.Union(customers.Select(c => c.Email));      // unique combined
var both = teamA.Intersect(teamB);                                     // in both
var toNotify = allUsers.Except(alreadyNotified);                       // in first, not in second
var newProducts = incoming.ExceptBy(existing.Select(e => e.Sku), p => p.Sku); // .NET 6
bool same = listA.SequenceEqual(listB);
var combined = first.Concat(second);                                   // keeps duplicates
```

::: tip When to use
Syncing data (what's new, what was removed), deduplication, and permission checks (roles a user has ∩ roles required).
:::
