# Clean Code

Conventions and principles that make C# code easy to read, change and trust.

## Naming Convention Cases

> C# uses **PascalCase** for types and public members, **camelCase** for locals and parameters, and **_camelCase** for private fields.

| Element | Case | Example |
| --- | --- | --- |
| Namespace, class, record, struct, enum | PascalCase | `OrderService`, `PaymentStatus` |
| Interface | `I` + PascalCase | `IOrderRepository` |
| Method, property, event | PascalCase | `CalculateTotal()`, `CreatedAt`, `PriceChanged` |
| Public field, constant | PascalCase | `MaxRetries` |
| Local variable, parameter | camelCase | `orderTotal`, `customerId` |
| Private / internal field | `_camelCase` | `_repository`, `_logger` |
| Static private field | `s_camelCase` (runtime style) or `_camelCase` | `s_instance` |
| Generic type parameter | `T` or `T` + name | `T`, `TKey`, `TEntity` |
| Async method | `…Async` suffix | `GetUserAsync` |
| Enum values | PascalCase, singular enum name | `OrderStatus.Shipped` |
| `[Flags]` enum | plural name | `Permissions` |

Other cases you'll meet: `kebab-case` (URLs, CSS, file names on the web), `snake_case` (Python, PostgreSQL columns), `SCREAMING_CASE` (env vars). Don't use them in C# identifiers.

::: tip When to use
Always. Enforce it with an `.editorconfig` so the IDE warns and the formatter fixes it for the whole team.
:::

## Meaningful Names

> Names should reveal intent: what it is, why it exists and how it's used, without needing a comment.

```csharp
// ❌
int d;                          // elapsed time in days
List<int[]> list1;
void Proc(Customer c, bool f) { }
var data = GetData();

// ✅
int elapsedDays;
List<Cell> flaggedCells;
void SendInvoice(Customer customer, bool includeAttachments) { }
var overdueInvoices = GetOverdueInvoices();
```

**Classes** are nouns (`Invoice`, `EmailSender`, `PriceCalculator`); avoid vague `Manager`, `Helper`, `Processor`, `Data`. **Methods** are verbs (`Send`, `CalculateTax`, `TryParse`). **Booleans** read like yes/no questions: `isActive`, `hasPermission`, `canEdit`, `shouldRetry`, `IsEnabled`. Avoid negatives like `isNotValid`, since `!isNotValid` hurts.

```csharp
if (user.IsActive && user.HasVerifiedEmail && order.CanBeCancelled) { }
```

::: tip When to use
Rename as soon as a name stops matching what the code does (F2 / Ctrl+R+R). Long, precise names beat short, cryptic ones; the IDE autocompletes them anyway.
:::

## Writing Good Comments

> Code explains **what** and **how**; comments explain **why**. Delete comments that just repeat the code.

```csharp
// ❌ Noise
i++;                              // increment i
// Get the user
var user = GetUser(id);

// ❌ Commented-out code (that's what git is for)
// var oldTotal = CalculateLegacy(order);

// ✅ Why: intent, constraints, non-obvious decisions
// The payment provider rejects amounts with more than 2 decimals, so round before sending.
var amount = Math.Round(order.Total, 2, MidpointRounding.AwayFromZero);

// ✅ Warning of consequences
// Must run before EnsureCreated(): migrations assume the schema doesn't exist yet.
```

::: tip When to use
Business rules that came from outside the code (legal, a client request, a bug in a third-party API), workarounds with links to issues, and performance trade-offs.
:::

## Code TODOs

> `// TODO:` marks known unfinished work. IDEs collect them in the Task List (View → Task List).

```csharp
// TODO: Replace with IHttpClientFactory before going to production
// FIXME: Fails for orders with more than 100 items (#482)
// HACK: Provider returns dates in local time; convert until they fix it
```

::: tip When to use
Temporarily, during development, with context (what, why, ticket number). A TODO that's months old should become a backlog ticket or be deleted.
:::

## XML Documentation Comments

> `///` comments document public APIs. They show up in IntelliSense and can generate docs.

```csharp
/// <summary>
/// Calculates the final price after applying the customer's discount and taxes.
/// </summary>
/// <param name="basePrice">Price before discounts, in the store currency.</param>
/// <param name="customer">Customer whose tier determines the discount.</param>
/// <returns>The final price, rounded to 2 decimal places.</returns>
/// <exception cref="ArgumentOutOfRangeException">When <paramref name="basePrice"/> is negative.</exception>
/// <example>
/// <code>var price = calculator.FinalPrice(100m, vipCustomer);</code>
/// </example>
public decimal FinalPrice(decimal basePrice, Customer customer) { /* ... */ }
```

Common tags: `<summary>`, `<param>`, `<returns>`, `<exception>`, `<remarks>`, `<example>`, `<see cref="Type"/>`, `<inheritdoc/>`. Enable `<GenerateDocumentationFile>true</GenerateDocumentationFile>` in the `.csproj` to export them (Swagger uses them too).

::: tip When to use
Public APIs of libraries and shared projects, and controllers (Swagger descriptions). Don't document the obvious: `/// Gets the name` on `Name` adds nothing.
:::

## Formatting, Braces and File Organization

> Consistent formatting, always using braces, and one type per file with namespaces matching folders.

```csharp
// ❌ Braceless multi-line trap
if (isAdmin)
    GrantAccess();
    LogAccess();            // ALWAYS runs: indentation lies

// ✅ Allman braces (C# standard), one statement per line
if (isAdmin)
{
    GrantAccess();
    LogAccess();
}

// File-scoped namespace (C# 10): one less indentation level
namespace MyApp.Billing.Services;

public class InvoiceService { }
```

**Organizing files and namespaces**
- One public type per file, file named after the type (`InvoiceService.cs`).
- Namespace = project + folder path (`MyApp.Billing.Services`).
- Organize by **feature** (`Orders/`, `Billing/`) rather than by technical type (`Services/`, `Models/`) as projects grow.
- Member order: constants → fields → constructors → properties → public methods → private methods.
- Run `dotnet format` and commit an `.editorconfig`.

## Method Structuring

> Small methods that do one thing, at one level of abstraction, with few parameters.

```csharp
// ❌ One method doing everything at different levels
public void ProcessOrder(Order order) { /* 120 lines: validate, compute, save, email, log */ }

// ✅ Reads like a table of contents
public async Task ProcessOrderAsync(Order order)
{
    Validate(order);
    ApplyDiscounts(order);
    await _repository.SaveAsync(order);
    await _notifier.SendConfirmationAsync(order);
}
```

**Guidelines:** aim for methods that fit on one screen; ≤ 3–4 parameters (group the rest into an object); use guard clauses instead of nesting; avoid boolean flag parameters (`Save(order, true)`; split into two methods); return early.

## DRY: Don't Repeat Yourself

> Every piece of knowledge should have one single, authoritative place in the code.

```csharp
// ❌ Same rule copied in 3 places: the next change will miss one
if (customer.Orders.Count > 10 && customer.TotalSpent > 5000) discount = 0.1m;

// ✅ One place
public bool IsLoyal => Orders.Count > 10 && TotalSpent > 5000;
```

::: warning Gotcha
DRY is about *knowledge*, not similar-looking code. Two pieces of code that look alike but change for different reasons should stay separate. Premature abstraction is worse than a little duplication ("rule of three": abstract on the third repetition).
:::

## KISS: Keep It Simple, Stupid

> Prefer the simplest solution that works. Complexity must earn its place.

```csharp
// ❌ Over-engineered
var isEven = new NumberParityStrategyFactory().Create(ParityType.Even).Evaluate(number);

// ✅
bool isEven = number % 2 == 0;
```

::: tip When to use
Before adding a pattern, layer, interface or library, ask "what problem does this solve *today*?" (see also YAGNI, "You Aren't Gonna Need It").
:::

## Exception Handling as Clean Code

> Prefer exceptions over error codes, don't return or pass `null` carelessly, and keep error handling separate from the happy path.

```csharp
// ❌ Error codes mixed with logic
int result = SaveUser(user);
if (result == -1) { /* ... */ } else if (result == -2) { /* ... */ }

// ✅ Exceptions for failures, a Result type for expected outcomes
public Result<User> Register(RegisterRequest req)
{
    if (_users.EmailExists(req.Email)) return Result<User>.Fail("Email already registered");
    return Result<User>.Ok(_users.Add(new User(req.Email)));
}

// ✅ Return empty collections, not null
public IReadOnlyList<Order> GetOrders(int customerId) => _orders.Where(o => o.CustomerId == customerId).ToList();
```

See [Exceptions](/errors/exceptions#handling-exceptions-properly) for the full checklist.
