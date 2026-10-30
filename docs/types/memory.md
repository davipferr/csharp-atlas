# Memory & Garbage Collection

Where data lives, how the garbage collector frees it, and how to release resources the GC doesn't manage.

## Stack vs Heap

> Locals and value types live in the method's stack frame; objects created with `new` (reference types) live on the managed heap.

```csharp
void Process()
{
    int count = 5;                 // stack
    Point p = new(1, 2);           // struct → stack
    var order = new Order();       // reference on the stack → object on the HEAP
    int[] nums = [1, 2, 3];        // arrays are objects → heap
}   // stack frame popped instantly; heap objects wait for the GC
```

- **Stack:** very fast, automatically freed when the method returns, small (~1 MB per thread).
- **Heap:** flexible lifetime, managed by the **garbage collector**.
- A value type *inside* a class (a field) lives on the heap with that object.

## Garbage Collection

> The GC automatically frees heap objects that are no longer reachable from "roots" (locals, statics, CPU registers).

**Generational model**

| Generation | Contains | Collected |
| --- | --- | --- |
| Gen 0 | newly allocated objects | very often, very cheap |
| Gen 1 | survived one GC | buffer between 0 and 2 |
| Gen 2 | long-lived (caches, singletons) | rarely, expensive (full GC) |
| LOH | objects ≥ 85 KB (big arrays) | with Gen 2 |

Most objects die young, so collecting Gen 0 frequently is efficient.

```csharp
Console.WriteLine(GC.GetTotalMemory(false));     // bytes in use
Console.WriteLine(GC.CollectionCount(0));
GC.Collect();   // ❌ almost never call this yourself
```

**Reducing GC pressure:** reuse objects (`ArrayPool<T>`, `ObjectPool`), use `StringBuilder` in loops, use structs and `Span<T>` for small hot-path data, avoid boxing, and avoid closures in hot loops.

::: warning Gotcha
"Memory leaks" in .NET are references you forgot to drop: event subscriptions (the publisher keeps subscribers alive), static collections that only grow, caches without eviction, timers.
:::

## IDisposable and using

> The GC frees *memory*, not *resources* like files, DB connections and sockets. `IDisposable.Dispose()` releases them, and `using` guarantees it's called.

```csharp
// using declaration (C# 8): disposed at the end of the enclosing scope
using var connection = new SqlConnection(connString);
using var reader = new StreamReader("data.csv");

// using statement: disposed at the end of the block, even if an exception is thrown
using (var stream = File.OpenWrite("out.bin"))
{
    stream.Write(bytes);
}   // stream.Dispose() → file closed

await using var db = new AppDbContext();   // IAsyncDisposable

// Implementing it for your own wrapper
public sealed class TempFile : IDisposable
{
    public string Path { get; } = System.IO.Path.GetTempFileName();
    public void Dispose() => File.Delete(Path);
}
```

`using` compiles to `try { … } finally { x?.Dispose(); }`.

::: tip When to use
Any type that implements `IDisposable`: streams, files, `SqlConnection`, `HttpResponseMessage`, `Timer`, `CancellationTokenSource`. Exception: `HttpClient` should be **reused** (`IHttpClientFactory` or a static instance), not disposed per request.
:::
