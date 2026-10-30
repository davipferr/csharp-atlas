# Threads

Running code in parallel with OS threads, the thread pool, and keeping shared data safe.

## Thread Basics

> A `Thread` is an independent path of execution. Starting threads lets work run **at the same time** as the main thread.

```csharp
var worker = new Thread(() =>
{
    for (int i = 0; i < 5; i++)
    {
        Console.WriteLine($"Worker: {i} (thread {Environment.CurrentManagedThreadId})");
        Thread.Sleep(200);
    }
});

worker.Name = "ReportGenerator";
worker.Start();                         // begins running in parallel

for (int i = 0; i < 5; i++)
{
    Console.WriteLine($"Main: {i}");
    Thread.Sleep(150);
}
// Output interleaves: the order between threads isn't deterministic

// Passing data
var t = new Thread(file => Process((string)file!));
t.Start("data.csv");
```

::: tip When to use
Rarely directly in modern code: prefer [Tasks](/concurrency/tasks). Use raw threads for long-running dedicated loops that need special settings (priority, STA apartment for COM/clipboard, a dedicated background poller).
:::

## Join and IsAlive

> `Join()` blocks the caller until the thread finishes; `IsAlive` tells whether it's still running.

```csharp
var download = new Thread(() => DownloadFile(url));
download.Start();

while (download.IsAlive)
{
    Console.Write(".");
    Thread.Sleep(100);
}

var t1 = new Thread(() => ProcessPart(1));
var t2 = new Thread(() => ProcessPart(2));
t1.Start(); t2.Start();
t1.Join();                               // wait for both before merging results
t2.Join();
bool finished = t1.Join(TimeSpan.FromSeconds(5));   // with timeout
MergeResults();
```

::: tip When to use
Waiting for workers to complete before continuing (fork/join). With tasks, the equivalent is `await Task.WhenAll(...)`.
:::

## Foreground vs Background Threads

> The process stays alive while any **foreground** thread runs. **Background** threads are killed when the last foreground thread ends.

```csharp
var heartbeat = new Thread(() =>
{
    while (true) { SendHeartbeat(); Thread.Sleep(5000); }
})
{
    IsBackground = true          // don't keep the app alive just for this
};
heartbeat.Start();
```

Threads from the **thread pool** (and therefore Tasks) are always background threads.

::: tip When to use
Background for helpers (heartbeats, monitoring, cache refresh) that shouldn't block shutdown. Foreground for work that must finish (writing a file); better still, signal it to stop and `Join` it.
:::

## ThreadPool

> A pool of reusable worker threads managed by the runtime. Creating threads is expensive, so the pool recycles them for short work items.

```csharp
ThreadPool.QueueUserWorkItem(_ => SendWelcomeEmail(user));   // fire-and-forget on the pool

ThreadPool.GetAvailableThreads(out int workers, out int io);
Console.WriteLine(Thread.CurrentThread.IsThreadPoolThread);
```

`Task.Run`, `Parallel.For`, timers and async continuations all use the thread pool under the hood.

::: tip When to use
Through Tasks, almost always. Don't block pool threads with long `Thread.Sleep` or synchronous I/O, because that starves the pool and slows the whole app (especially ASP.NET).
:::

## Thread Safety and Locks

> When threads share mutable data, unsynchronized access causes race conditions. `lock`, `Interlocked` and concurrent collections fix it.

```csharp
int counter = 0;
Parallel.For(0, 100_000, _ => counter++);      // ❌ race: result < 100000
Console.WriteLine(counter);

int safe = 0;
Parallel.For(0, 100_000, _ => Interlocked.Increment(ref safe));  // ✅ atomic

private readonly Lock _sync = new();            // .NET 9 Lock type (or a private readonly object)
private decimal _balance;
public void Withdraw(decimal amount)
{
    lock (_sync)                                // one thread at a time
    {
        if (_balance < amount) throw new InvalidOperationException();
        _balance -= amount;                     // check + update is now atomic
    }
}

var cache = new ConcurrentDictionary<string, Product>();
var p = cache.GetOrAdd(sku, LoadProduct);       // thread-safe without explicit locks
```

::: warning Gotchas
- Never `lock(this)` or lock on a public object or string. Lock on a private field.
- Don't `await` inside a `lock` (the compiler forbids it). Use `SemaphoreSlim.WaitAsync` instead.
- Acquiring two locks in different orders in different places → **deadlock**.
:::
