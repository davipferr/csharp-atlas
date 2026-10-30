# Generics

Writing type-safe code once that works with many types.

## Generic Classes

> A class with a **type parameter** (`<T>`) that callers fill in. You get one implementation, full type safety and no casting or boxing.

```csharp
public class Result<T>
{
    public bool Success { get; }
    public T? Value { get; }
    public string? Error { get; }

    private Result(bool ok, T? value, string? error) => (Success, Value, Error) = (ok, value, error);

    public static Result<T> Ok(T value) => new(true, value, null);
    public static Result<T> Fail(string error) => new(false, default, error);
}

Result<User> r1 = Result<User>.Ok(user);
Result<int> r2 = Result<int>.Fail("Not a number");

// Generic in-memory cache with expiration
public class Cache<T>
{
    private readonly Dictionary<string, (T Value, DateTime Expires)> _items = [];
    public void Set(string key, T value, TimeSpan ttl) => _items[key] = (value, DateTime.UtcNow + ttl);
    public bool TryGet(string key, out T? value)
    {
        if (_items.TryGetValue(key, out var e) && e.Expires > DateTime.UtcNow) { value = e.Value; return true; }
        value = default;
        return false;
    }
}
```

**Why generics instead of `object`:** compile-time type checking, no casts, no boxing for value types, and better IntelliSense. That's why `List<T>` replaced `ArrayList`.

::: tip When to use
Containers and wrappers (`Result<T>`, `PagedList<T>`, `Cache<T>`, `ApiResponse<T>`), repositories (`Repository<TEntity>`), and any class you'd otherwise copy-paste per type.
:::

## Multiple Type Parameters

> A generic type or method can take several type parameters, like `Dictionary<TKey, TValue>`.

```csharp
public class Pair<TFirst, TSecond>
{
    public TFirst First { get; }
    public TSecond Second { get; }
    public Pair(TFirst first, TSecond second) => (First, Second) = (first, second);
}

public interface IMapper<TSource, TDestination>
{
    TDestination Map(TSource source);
}

public class UserToDtoMapper : IMapper<User, UserDto>
{
    public UserDto Map(User u) => new(u.Id, u.Name, u.Email);
}
```

::: tip When to use
Mappers and converters (`TIn → TOut`), key/value structures, handlers (`IRequestHandler<TRequest, TResponse>` in MediatR).
:::

## Generic Methods

> A method can have its own type parameters even inside a non-generic class. Type arguments are usually **inferred**.

```csharp
public static class Utils
{
    public static void Swap<T>(ref T a, ref T b) => (a, b) = (b, a);

    public static T? FirstOrFallback<T>(IEnumerable<T> items, T fallback) =>
        items.Any() ? items.First() : fallback;

    public static T Deserialize<T>(string json) =>
        JsonSerializer.Deserialize<T>(json) ?? throw new InvalidDataException();
}

int x = 1, y = 2;
Utils.Swap(ref x, ref y);                         // T inferred as int
var order = Utils.Deserialize<Order>(json);       // must specify: nothing to infer from
```

::: tip When to use
Helpers that work with any type: serialization, swapping, retries (`RetryAsync<T>(Func<Task<T>>)`), conversion, and generic sorting algorithms.
:::

## Generic Constraints

> `where T : …` restricts which types can be used, which unlocks the members those types guarantee.

```csharp
public class Repository<TEntity> where TEntity : class, IEntity, new()
{
    public TEntity Create() => new TEntity { CreatedAt = DateTime.UtcNow };  // new() allows this
    public void Save(TEntity e) => Console.WriteLine($"Saving {e.Id}");     // IEntity gives Id
}

public static T Max<T>(T a, T b) where T : IComparable<T> => a.CompareTo(b) >= 0 ? a : b;

public static T Sum<T>(IEnumerable<T> values) where T : INumber<T>       // generic math (.NET 7)
{
    T total = T.Zero;
    foreach (var v in values) total += v;
    return total;
}
```

| Constraint | Means T must be… |
| --- | --- |
| `where T : class` | a reference type |
| `where T : struct` | a non-nullable value type |
| `where T : notnull` | a non-nullable type |
| `where T : unmanaged` | a struct with no references (raw memory) |
| `where T : new()` | have a public parameterless constructor (must come last) |
| `where T : BaseClass` | that class or a subclass |
| `where T : IInterface` | an implementer of the interface (your own custom interfaces too) |
| `where T : U` | the same as or derived from another type parameter |
| `where T : Enum` / `Delegate` | an enum / a delegate type |

::: tip When to use
Whenever a generic method needs to *do something* with T: compare it, create it, call an interface member, or do math with it.
:::

## Generic Interfaces

> Interfaces can be generic, which gives contracts that stay type-safe for every entity or message type.

```csharp
public interface IRepository<T> where T : IEntity
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IReadOnlyList<T>> ListAsync();
    Task AddAsync(T entity);
}

public class EfRepository<T>(AppDbContext db) : IRepository<T> where T : class, IEntity
{
    public Task<T?> GetByIdAsync(Guid id) => db.Set<T>().FirstOrDefaultAsync(e => e.Id == id);
    public async Task<IReadOnlyList<T>> ListAsync() => await db.Set<T>().ToListAsync();
    public async Task AddAsync(T entity) { db.Add(entity); await db.SaveChangesAsync(); }
}

// Register once for every entity in DI
services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));

// Built-in generic interfaces you implement often
public class Money : IComparable<Money>, IEquatable<Money> { /* ... */ }
```

**Variance:** `out T` (covariant) lets `IEnumerable<string>` be used as `IEnumerable<object>`; `in T` (contravariant) lets `IComparer<object>` be used as `IComparer<string>`.

::: tip When to use
Repositories, handlers (`IHandler<TCommand>`), validators (`IValidator<T>`), converters. Combined with an open-generic DI registration, one class serves every type.
:::

## Generics and Reflection

> At runtime you can inspect generic types, read their type arguments, and even construct closed generic types dynamically.

```csharp
Type listType = typeof(List<int>);
Console.WriteLine(listType.IsGenericType);                    // True
Console.WriteLine(listType.GetGenericTypeDefinition());       // System.Collections.Generic.List`1[T]
Console.WriteLine(listType.GetGenericArguments()[0]);         // System.Int32

Type open = typeof(Dictionary<,>);                            // open generic
Type closed = open.MakeGenericType(typeof(string), typeof(int));
object dict = Activator.CreateInstance(closed)!;

Console.WriteLine(typeof(T).Name);   // inside a generic method: find out what T is

// Scan an assembly for all IHandler<T> implementations
var handlers = typeof(Program).Assembly.GetTypes()
    .Where(t => t.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IHandler<>)));
```

::: tip When to use
Framework-style code: plugin discovery, auto-registering handlers in DI, serializers and mappers. Avoid it in regular business code because it's slow and loses compile-time safety.
:::

## Generic Sorting with Delegates

> Combine a generic method with a comparison delegate to sort any type by any rule. This is how `List<T>.Sort(Comparison<T>)` works.

```csharp
public static void BubbleSort<T>(T[] items, Func<T, T, bool> isOutOfOrder)
{
    for (int i = 0; i < items.Length - 1; i++)
    {
        bool swapped = false;
        for (int j = 0; j < items.Length - 1 - i; j++)
        {
            if (isOutOfOrder(items[j], items[j + 1]))
            {
                (items[j], items[j + 1]) = (items[j + 1], items[j]);
                swapped = true;
            }
        }
        if (!swapped) break;             // already sorted
    }
}

BubbleSort(numbers, (a, b) => a > b);                       // ascending ints
BubbleSort(employees, (a, b) => a.Salary < b.Salary);       // employees by salary, descending
BubbleSort(names, (a, b) => string.Compare(a, b, StringComparison.OrdinalIgnoreCase) > 0);
```

Bubble sort is O(n²), fine for learning, never for production. The *pattern* (generic algorithm + injected comparison) is the real lesson. In practice: `Array.Sort`, `List.Sort`, `OrderBy`.
