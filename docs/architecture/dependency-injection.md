# Dependency Injection

Giving objects their dependencies from the outside instead of creating them inside.

## What Is a Dependency

> If class A uses class B to do its job, B is a **dependency** of A. When A creates B itself with `new`, they're tightly coupled.

```csharp
// Tightly coupled: OrderService decides which logger and DB to use
public class OrderService
{
    private readonly SqlOrderRepository _repo = new("Server=prod;...");   // hard to test
    private readonly FileLogger _logger = new(@"C:\logs\orders.txt");     // can't swap

    public void Place(Order o) { _repo.Save(o); _logger.Log("Placed"); }
}
```

Problems: you can't unit test without a real database, you can't switch to another logger without editing this class, and configuration is buried inside.

## Decoupling and Testability

> Depend on **abstractions** (interfaces) and receive them from outside. Then tests can pass fakes and production can pass real implementations.

```csharp
public interface IOrderRepository { void Save(Order o); }
public interface ILogger { void Log(string message); }

public class OrderService
{
    private readonly IOrderRepository _repo;
    private readonly ILogger _logger;

    public OrderService(IOrderRepository repo, ILogger logger)   // injected
    {
        _repo = repo;
        _logger = logger;
    }

    public void Place(Order o) { _repo.Save(o); _logger.Log($"Placed {o.Id}"); }
}

// Unit test: no database, no files
public class FakeRepo : IOrderRepository
{
    public List<Order> Saved { get; } = [];
    public void Save(Order o) => Saved.Add(o);
}

[Fact]
public void Place_SavesOrder()
{
    var repo = new FakeRepo();
    var service = new OrderService(repo, new NullLogger());
    service.Place(new Order());
    Assert.Single(repo.Saved);
}
```

## Constructor Injection

> Dependencies are required constructor parameters. It's the standard and recommended form.

```csharp
public class InvoiceService(IInvoiceRepository repository, IEmailSender email, TimeProvider clock)
{
    public async Task SendAsync(int invoiceId)
    {
        var invoice = await repository.GetAsync(invoiceId);
        invoice.SentAt = clock.GetUtcNow();
        await email.SendAsync(invoice.CustomerEmail, "Your invoice", invoice.ToHtml());
    }
}
```

::: tip When to use
Default for every **required** dependency. The object can't exist without them, dependencies are explicit in the signature, and fields can be `readonly`.
:::

## Setter (Property) Injection

> Dependencies are set through a public property after construction. They're **optional** and can be changed later.

```csharp
public class ReportGenerator
{
    public ILogger Logger { get; set; } = NullLogger.Instance;   // sensible default

    public void Generate()
    {
        Logger.Log("Generating report...");
    }
}

var gen = new ReportGenerator { Logger = new ConsoleLogger() };
```

::: tip When to use
Optional dependencies with a safe default (logging, telemetry), or frameworks that create the object for you and can't use constructors. Downside: the object can exist with a missing dependency.
:::

## Interface (Method) Injection

> The dependency is passed as a **method parameter** (or through an interface method like `SetDependency`), only for that call.

```csharp
public interface IDataExporter { void Export(IEnumerable<Sale> data, IOutputWriter writer); }

public class CsvExporter : IDataExporter
{
    public void Export(IEnumerable<Sale> data, IOutputWriter writer)   // dependency per call
    {
        foreach (var s in data) writer.WriteLine($"{s.Date:d};{s.Total}");
    }
}

exporter.Export(sales, new FileOutputWriter("sales.csv"));
exporter.Export(sales, new ConsoleOutputWriter());
```

| Type | How | Best for |
| --- | --- | --- |
| Constructor | constructor parameters | required, long-lived dependencies (**default**) |
| Setter / property | public settable property | optional dependencies with defaults |
| Method / interface | method parameter | dependency that changes per call |

::: tip When to use
When the dependency varies on each call (output target, current user, cancellation token), or in ASP.NET minimal APIs and `[FromServices]` parameters.
:::

## DI Container (Microsoft.Extensions.DependencyInjection) <Badge type="tip" text="extra" />

> A container builds the whole object graph for you. You register interface → implementation and a **lifetime**, then ask for the top-level service.

```csharp
var builder = WebApplication.CreateBuilder(args);   // or Host.CreateApplicationBuilder for console/workers

builder.Services.AddSingleton(TimeProvider.System);                     // one instance for the app
builder.Services.AddScoped<IOrderRepository, EfOrderRepository>();      // one per HTTP request
builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();         // new every time
builder.Services.AddScoped<OrderService>();
builder.Services.AddHttpClient<IWeatherClient, WeatherClient>();        // typed HttpClient

var app = builder.Build();
app.MapPost("/orders", (Order o, OrderService service) => service.Place(o));  // injected automatically
```

| Lifetime | Instance | Typical use |
| --- | --- | --- |
| `Singleton` | one for the whole app | caches, config, `TimeProvider`, stateless clients |
| `Scoped` | one per request/scope | `DbContext`, repositories, unit of work |
| `Transient` | new on every resolve | lightweight stateless services |

::: warning Gotcha
Never inject a **scoped** service into a **singleton** (captive dependency). The singleton keeps one `DbContext` forever, shared across requests and threads.
:::
