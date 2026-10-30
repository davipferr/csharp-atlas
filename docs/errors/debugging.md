# Debugging & Logging

Tools for seeing what your code is doing while it runs.

## Debug and Trace Output

> `Debug.WriteLine` prints to the debugger's Output window and is **removed from Release builds**. `Trace` stays in Release.

```csharp
using System.Diagnostics;

Debug.WriteLine($"Cart has {cart.Items.Count} items");      // Debug builds only
Debug.WriteLineIf(total < 0, "Negative total!");
Debug.Assert(order.Total >= 0, "Order total can't be negative"); // breaks into the debugger if false
Trace.WriteLine("Service started");                          // Debug + Release

[Conditional("DEBUG")]                                       // calls to this vanish in Release
static void DumpState(object state) => Console.WriteLine(JsonSerializer.Serialize(state));

#if DEBUG
    services.AddSingleton<IEmailSender, ConsoleEmailSender>();   // preprocessor directive
#else
    services.AddSingleton<IEmailSender, SmtpEmailSender>();
#endif
```

::: tip When to use
Quick diagnostics while developing, and `Debug.Assert` for "this should never happen" invariants. For anything you'll need in production, use real logging.
:::

## Stopwatch <Badge type="tip" text="extra" />

> A high-precision timer for measuring how long code takes.

```csharp
var sw = Stopwatch.StartNew();
await ImportAsync(file);
sw.Stop();
logger.LogInformation("Import took {Ms} ms", sw.ElapsedMilliseconds);

long start = Stopwatch.GetTimestamp();                  // allocation-free (.NET 7)
DoWork();
TimeSpan elapsed = Stopwatch.GetElapsedTime(start);
```

::: tip When to use
Finding slow spots, logging operation durations. For real benchmarks, use **BenchmarkDotNet**.
:::

## Structured Logging with ILogger <Badge type="tip" text="extra" />

> `ILogger<T>` from `Microsoft.Extensions.Logging` is the standard logging abstraction. It supports levels, categories and structured properties.

```csharp
public class OrderService(ILogger<OrderService> logger)
{
    public void Place(Order order)
    {
        logger.LogInformation("Placing order {OrderId} for {CustomerId}", order.Id, order.CustomerId);
        try { /* ... */ }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to place order {OrderId}", order.Id);
            throw;
        }
    }
}
```

Levels: `Trace` < `Debug` < `Information` < `Warning` < `Error` < `Critical`. Configure the minimum level in `appsettings.json`. Providers: console, Serilog, Seq, Application Insights, OpenTelemetry.

::: tip When to use
Any app that runs somewhere you can't attach a debugger. Use message *templates* (`{OrderId}`), not string interpolation, so log tools can filter by field.
:::

## Debugger Essentials

> Breakpoints and inspection beat `Console.WriteLine` debugging.

| Tool | What it does |
| --- | --- |
| Breakpoint (F9) | pause on a line |
| Conditional breakpoint | pause only when `order.Id == 42` or after N hits |
| Tracepoint / logpoint | print a message without stopping or editing code |
| Step over / into / out (F10 / F11 / Shift+F11) | move through execution |
| Watch / Locals / Autos | inspect variables |
| Immediate window | evaluate expressions while paused |
| Call Stack window | see how you got here |
| Exception settings | break when an exception is **thrown**, even if it's caught later |
| `[DebuggerDisplay("{Name} ({Id})")]` | customize how an object appears in the debugger |
