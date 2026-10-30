# Tasks & async/await

The modern model for concurrent and asynchronous work in .NET.

## Tasks

> A `Task` represents an operation that will complete in the future; `Task<T>` also produces a result. Tasks run on the thread pool and compose easily.

```csharp
Task<int> countTask = Task.Run(() => CountLinesInHugeFile(path));   // CPU work off the current thread
// ... do other things meanwhile ...
int lines = await countTask;

// Continuations (older style; prefer await)
Task.Run(() => Compute()).ContinueWith(t => Console.WriteLine(t.Result));

// Already-completed tasks (handy in interface implementations and tests)
Task done = Task.CompletedTask;
Task<int> cached = Task.FromResult(42);
```

| Thread | Task |
| --- | --- |
| A real OS thread | A *unit of work*, scheduled on pool threads |
| Expensive to create | Cheap |
| No return value | `Task<T>` returns a result |
| Exceptions are hard to observe | Exceptions captured and rethrown on `await` |
| `Join` | `await` / `WhenAll` / `WhenAny` |
| No built-in cancellation | `CancellationToken` |

::: tip When to use
Any background or parallel work in modern .NET. `Task.Run` specifically for **CPU-bound** work you want off the UI or request thread.
:::

## async and await

> `await` pauses the method **without blocking the thread** until the task finishes, then resumes. `async` enables `await` in a method.

```csharp
public async Task<WeatherReport> GetReportAsync(string city, CancellationToken ct = default)
{
    var json = await _http.GetStringAsync($"https://api.weather.dev/{city}", ct); // thread is free while waiting
    var report = JsonSerializer.Deserialize<WeatherReport>(json)!;
    await _db.SaveAsync(report, ct);
    return report;
}

// UI apps: the window stays responsive during the download
private async void DownloadButton_Click(object sender, EventArgs e)   // async void ONLY for event handlers
{
    statusLabel.Text = "Downloading...";
    var report = await _service.GetReportAsync("Lisbon");
    statusLabel.Text = $"{report.Temperature}°C";   // back on the UI thread automatically
}
```

**Rules of thumb**
- Return `Task` / `Task<T>`, never `async void` (except event handlers), because exceptions in `async void` crash the process.
- Suffix async methods with `Async`.
- Go "async all the way". Don't block with `.Result` or `.Wait()`; it can deadlock and wastes threads.
- I/O-bound work (HTTP, DB, files) → just `await` the async API. No `Task.Run` needed.
- Library code: `ConfigureAwait(false)` avoids capturing the UI context.

::: tip When to use
Every I/O call: HTTP, database, file system, message queues. It's what lets a web server handle thousands of requests with few threads.
:::

## Running Tasks in Parallel (WhenAll / WhenAny)

> Start several tasks first, then await them together. Total time ≈ the slowest one, not the sum.

```csharp
// Sequential: ~3 seconds
var user = await GetUserAsync(id);          // 1s
var orders = await GetOrdersAsync(id);      // 1s
var recs = await GetRecommendationsAsync(id); // 1s

// Concurrent: ~1 second
var userTask = GetUserAsync(id);
var ordersTask = GetOrdersAsync(id);
var recsTask = GetRecommendationsAsync(id);
await Task.WhenAll(userTask, ordersTask, recsTask);
var dashboard = new Dashboard(userTask.Result, ordersTask.Result, recsTask.Result); // safe: already completed

// Many items
var pages = await Task.WhenAll(urls.Select(u => http.GetStringAsync(u)));

// First one wins (e.g. mirrors, or timeout)
var winner = await Task.WhenAny(FromMirrorA(), FromMirrorB());

// Limit concurrency (.NET 6)
await Parallel.ForEachAsync(files, new ParallelOptions { MaxDegreeOfParallelism = 4 },
    async (file, ct) => await UploadAsync(file, ct));
```

::: tip When to use
Aggregating data from independent sources (dashboards, API gateways), batch HTTP calls, uploading many files. Throttle with `Parallel.ForEachAsync` or `SemaphoreSlim` so you don't flood a server.
:::

## Cancellation and Timeouts

> A `CancellationToken` lets callers ask a running operation to stop cooperatively.

```csharp
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));   // auto-cancel after 10s

try
{
    await ImportAsync(file, cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Import cancelled or timed out");
}

async Task ImportAsync(string file, CancellationToken ct)
{
    foreach (var line in File.ReadLines(file))
    {
        ct.ThrowIfCancellationRequested();           // check periodically in loops
        await SaveLineAsync(line, ct);               // pass it down to every async call
    }
}

cancelButton.Click += (_, _) => cts.Cancel();        // user clicks "Cancel"
var result = await SlowCallAsync().WaitAsync(TimeSpan.FromSeconds(5)); // .NET 6 timeout helper
```

::: tip When to use
Every long-running or I/O operation: accept a `CancellationToken` as the last parameter. ASP.NET Core gives you one that fires when the client disconnects.
:::

## Parallel Class and PLINQ <Badge type="tip" text="extra" />

> `Parallel.For`/`ForEach` and `.AsParallel()` split **CPU-bound** work across all cores.

```csharp
Parallel.ForEach(images, img => img.ApplyFilter());                // uses all cores

var primes = Enumerable.Range(1, 5_000_000)
    .AsParallel()
    .Where(IsPrime)
    .Count();
```

::: tip When to use
CPU-heavy, independent work items: image processing, simulations, hashing, number crunching. Not for I/O (use async), and not when items depend on each other.
:::
