# Exceptions

Catching, throwing and designing exceptions, and how they travel up the call stack.

## Try, Catch and Finally

> `try` wraps code that might fail, `catch` handles specific exceptions, and `finally` **always** runs, for cleanup.

```csharp
FileStream? file = null;
try
{
    file = File.OpenRead(path);
    var config = JsonSerializer.Deserialize<Config>(file);
    Apply(config!);
}
catch (FileNotFoundException ex)
{
    Console.WriteLine($"Config not found: {ex.FileName}. Using defaults.");
    Apply(Config.Default);
}
catch (JsonException ex)
{
    Console.WriteLine($"Invalid config: {ex.Message}");
    throw;                          // can't recover → let it bubble up
}
finally
{
    file?.Dispose();                // runs on success, on catch, and on rethrow
}
```

`finally` runs even if the `try` or `catch` executes `return`. In practice, `using` replaces most `finally` blocks used for disposal.

::: tip When to use
- `catch` only what you can **handle** (retry, fallback, translate to a user message).
- `finally` for cleanup that isn't `IDisposable`: releasing a lock, restoring UI state (`button.Enabled = true`), stopping a stopwatch.
:::

## Multiple Catch Blocks and Exception Filters

> Catch blocks are checked **top to bottom**, so put specific exceptions before general ones. `when` adds a condition.

```csharp
try
{
    var response = await http.GetAsync(url, ct);
    response.EnsureSuccessStatusCode();
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
{
    return null;                                    // 404 is an expected case
}
catch (HttpRequestException ex) when (ex.StatusCode >= HttpStatusCode.InternalServerError)
{
    logger.LogWarning(ex, "Server error, retrying");
    return await RetryAsync(url);
}
catch (TaskCanceledException) when (ct.IsCancellationRequested)
{
    throw;                                          // caller cancelled: propagate
}
catch (Exception ex)                                // last-resort catch-all
{
    logger.LogError(ex, "Unexpected failure calling {Url}", url);
    throw;
}
```

::: tip When to use
Filters (`when`) let you catch the same type differently by status code, error number or message without catching and rethrowing. The stack trace stays untouched when the filter is false.
:::

## Throw, Rethrow and Guard Clauses

> `throw new X(...)` signals an error; `throw;` rethrows the current exception **preserving its stack trace**.

```csharp
public void Withdraw(decimal amount)
{
    ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount);   // .NET 8 guard helpers
    if (amount > Balance)
        throw new InsufficientFundsException(Balance, amount);
    Balance -= amount;
}

public User GetUser(string id)
{
    ArgumentException.ThrowIfNullOrWhiteSpace(id);
    return _repo.Find(id) ?? throw new KeyNotFoundException($"User {id} not found");  // throw expression
}

catch (Exception ex)
{
    throw;                                   // ✅ keeps the original stack trace
    // throw ex;                             // ❌ resets the stack trace to this line
    // throw new ServiceException("Failed to load profile", ex);  // ✅ wrap, keep InnerException
}
```

::: tip When to use
- Throw when a method **can't do what its name promises** (invalid arguments, broken invariants, missing required resource).
- Wrap low-level exceptions in domain ones at layer boundaries, always passing the original as `innerException`.
:::

## Custom Exceptions

> Derive from `Exception` to represent a domain-specific failure that callers might want to catch specifically.

```csharp
public class InsufficientFundsException : Exception
{
    public decimal Balance { get; }
    public decimal Requested { get; }

    public InsufficientFundsException(decimal balance, decimal requested)
        : base($"Insufficient funds: balance {balance:C}, requested {requested:C}")
    {
        Balance = balance;
        Requested = requested;
    }

    public InsufficientFundsException(string message, Exception inner) : base(message, inner) { }
}

try { account.Withdraw(500); }
catch (InsufficientFundsException ex)
{
    Console.WriteLine($"You need {ex.Requested - ex.Balance:C} more.");
}
```

::: tip When to use
When callers need to react to *that specific* failure (e.g. map `NotFoundException` → HTTP 404 in middleware). Name it `…Exception` and add properties with the context.
:::

## Why the Default Exceptions Rock

> The BCL already has exceptions for the common cases. Reuse them so callers recognize them.

| Exception | Throw it when |
| --- | --- |
| `ArgumentException` / `ArgumentNullException` / `ArgumentOutOfRangeException` | a parameter is invalid |
| `InvalidOperationException` | the object's state doesn't allow the call (`Ship()` an unpaid order) |
| `NotSupportedException` | the operation is never supported (read-only collection `Add`) |
| `NotImplementedException` | placeholder, not finished yet |
| `KeyNotFoundException` | lookup by key failed |
| `FormatException` | text in the wrong format |
| `TimeoutException` | an operation exceeded its time |
| `UnauthorizedAccessException` | permission denied (also file system) |
| `ObjectDisposedException` | used after `Dispose` |
| `OperationCanceledException` | cancellation was requested |

Thrown by the runtime (don't throw these yourself): `NullReferenceException`, `IndexOutOfRangeException`, `DivideByZeroException`, `InvalidCastException`, `OverflowException`, `StackOverflowException`, `OutOfMemoryException`.

## Exceptions and the Call Stack

> An unhandled exception **unwinds** the call stack method by method until a matching `catch` is found. If none is found, the app crashes.

```csharp
void Main()  { try { PlaceOrder(); } catch (Exception ex) { Console.WriteLine(ex); } } // 4. caught here
void PlaceOrder() { ValidateStock(); Charge(); }    // 3. skipped, Charge() never runs
void ValidateStock() { GetProduct(99); }            // 2. propagates
Product GetProduct(int id) => throw new KeyNotFoundException($"Product {id}");  // 1. thrown

// ex.StackTrace shows the full path:
//   at GetProduct(Int32 id)
//   at ValidateStock()
//   at PlaceOrder()
//   at Main()
```

Useful properties: `Message`, `StackTrace`, `InnerException`, `Data`, `GetType().Name`, and `ToString()` (everything, including inner exceptions).

::: tip When to use
Catch at the **top** of an operation (controller, message handler, background job loop, UI event handler) where you can log and respond. Low-level methods should usually let exceptions propagate.
:::

## Try-Catch vs If Statements

> Use `if` for **expected** situations and exceptions for **exceptional** ones. Exceptions are slow and hide control flow.

```csharp
// ❌ Exceptions as control flow
int n;
try { n = int.Parse(input); } catch (FormatException) { n = 0; }

// ✅ Expected invalid input → Try pattern
int n = int.TryParse(input, out var v) ? v : 0;

// ✅ Check what you can cheaply check
if (!File.Exists(path)) return Config.Default;

// ...but still catch: the file can be deleted between the check and the read (race condition)
try { return Load(path); }
catch (IOException ex) { logger.LogWarning(ex, "Could not read config"); return Config.Default; }
```

::: tip When to use
`if`/`TryXxx` for user input, optional data and lookups that may miss. `try/catch` for I/O, network, DB and third-party code where failure is outside your control.
:::

## Handling Exceptions Properly

> Catch specific types, log with context, never swallow silently, and keep the stack trace.

```csharp
// ❌ Anti-patterns
try { Save(); } catch { }                                 // swallowed: bug becomes invisible
catch (Exception ex) { Console.WriteLine(ex.Message); }   // lost stack trace and type
catch (Exception ex) { throw ex; }                        // stack trace reset
catch (Exception ex) { throw new Exception("Error"); }    // original cause lost

// ✅ Patterns
catch (DbUpdateConcurrencyException ex)
{
    logger.LogWarning(ex, "Concurrency conflict saving order {OrderId}", order.Id);
    return Result.Conflict("The order was modified by someone else. Reload and try again.");
}

// Global handler in ASP.NET Core (one place for unhandled exceptions)
app.UseExceptionHandler("/error");

// Last-chance handler in console apps
AppDomain.CurrentDomain.UnhandledException += (_, e) => Log((Exception)e.ExceptionObject);
```

**Checklist**
- Catch the most specific type you can handle.
- Log the **exception object** (not just `.Message`) plus context (IDs, inputs).
- Show users a friendly message; keep technical details in logs.
- Use `throw;` to rethrow, and wrap with `innerException` to translate.
- Don't catch `Exception` in library code unless you rethrow.
