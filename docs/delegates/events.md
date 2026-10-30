# Events

The publisher/subscriber pattern built into the language.

## Events: Publishers and Subscribers

> An `event` is a delegate field that outsiders can only subscribe to (`+=`) or unsubscribe from (`-=`). Only the owning class can raise it.

```csharp
public class TemperatureMonitor                       // publisher
{
    public event Action<double>? TemperatureExceeded;  // event
    public double Threshold { get; set; } = 30;

    public void Record(double celsius)
    {
        if (celsius > Threshold)
            TemperatureExceeded?.Invoke(celsius);      // raise (only the owner can)
    }
}

var monitor = new TemperatureMonitor();                // subscribers
monitor.TemperatureExceeded += t => Console.WriteLine($"⚠ {t}°C — turning on AC");
monitor.TemperatureExceeded += t => alertService.Notify($"High temperature: {t}");

monitor.Record(25);    // nothing
monitor.Record(34);    // both handlers run
// monitor.TemperatureExceeded = null;     ❌ outsiders can't overwrite
// monitor.TemperatureExceeded(50);        ❌ outsiders can't raise
```

**Event vs plain delegate field:** a public delegate field could be overwritten (`= handler` removes everyone else) or invoked by anyone. `event` restricts outsiders to `+=` and `-=`.

::: tip When to use
When an object needs to announce that something happened without knowing who cares: UI (button clicks), domain notifications (order placed, stock low), file watchers, progress reporting, game events.
:::

## EventHandler and EventArgs

> The standard .NET event signature is `(object? sender, TEventArgs e)`, using `EventHandler<TEventArgs>`.

```csharp
public class PriceChangedEventArgs(string symbol, decimal oldPrice, decimal newPrice) : EventArgs
{
    public string Symbol { get; } = symbol;
    public decimal OldPrice { get; } = oldPrice;
    public decimal NewPrice { get; } = newPrice;
    public decimal ChangePercent => (NewPrice - OldPrice) / OldPrice * 100;
}

public class Stock(string symbol, decimal price)
{
    public event EventHandler<PriceChangedEventArgs>? PriceChanged;

    public decimal Price
    {
        get => price;
        set
        {
            if (value == price) return;
            var old = price;
            price = value;
            OnPriceChanged(new PriceChangedEventArgs(symbol, old, value));
        }
    }

    protected virtual void OnPriceChanged(PriceChangedEventArgs e)   // convention: On + EventName
        => PriceChanged?.Invoke(this, e);
}

var petr4 = new Stock("PETR4", 38.50m);
petr4.PriceChanged += (sender, e) =>
{
    if (Math.Abs(e.ChangePercent) >= 5)
        Console.WriteLine($"ALERT {e.Symbol}: {e.OldPrice:C} → {e.NewPrice:C} ({e.ChangePercent:+0.0;-0.0}%)");
};
petr4.Price = 41m;
```

**Conventions:** event names are verbs or nouns in past or present tense (`Click`, `PriceChanged`, `Closing`); the args class ends with `EventArgs`; raise through a `protected virtual OnXxx` method so subclasses can hook in; use `EventArgs.Empty` when there's no data.

::: tip When to use
Any public event in a library or a class others consume. Following the convention makes it work with designers, reflection-based tools and other developers' expectations.
:::

## Unsubscribing and Memory Leaks

> The publisher holds a reference to every subscriber. If the publisher lives longer, forgotten subscriptions keep subscribers alive.

```csharp
public class Dashboard : IDisposable
{
    private readonly Stock _stock;
    public Dashboard(Stock stock)
    {
        _stock = stock;
        _stock.PriceChanged += OnPriceChanged;      // named method → can unsubscribe
    }

    private void OnPriceChanged(object? s, PriceChangedEventArgs e) => Render(e);

    public void Dispose() => _stock.PriceChanged -= OnPriceChanged;   // ✅ release
}
```

::: tip When to use
Always unsubscribe when the subscriber's lifetime is shorter than the publisher's (UI views subscribing to app-wide services, short-lived objects listening to singletons). An anonymous lambda can't be unsubscribed unless you store it in a variable.
:::
