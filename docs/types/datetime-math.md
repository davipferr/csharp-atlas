# DateTime & Math

Working with dates, times and durations, and the `Math` class.

## DateTime

> An immutable struct representing a date and time. Every operation returns a **new** value.

```csharp
DateTime now = DateTime.Now;              // local time
DateTime utc = DateTime.UtcNow;           // ✅ store and compare in UTC
DateTime today = DateTime.Today;          // midnight today
var birthday = new DateTime(1995, 7, 14);
var meeting = new DateTime(2026, 11, 5, 14, 30, 0, DateTimeKind.Utc);

DateTime due = now.AddDays(30).AddHours(2);   // returns a new DateTime
DateTime lastMonth = now.AddMonths(-1);

int year = now.Year; int month = now.Month; DayOfWeek dow = now.DayOfWeek;
int dayOfYear = now.DayOfYear;
bool isWeekend = now.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
bool leap = DateTime.IsLeapYear(2028);
int daysInFeb = DateTime.DaysInMonth(2026, 2);

string iso = now.ToString("O");                     // 2026-10-30T14:05:09.1234567-03:00
string br = now.ToString("dd/MM/yyyy HH:mm");
var parsed = DateTime.ParseExact("30/10/2026", "dd/MM/yyyy", CultureInfo.InvariantCulture);
bool ok = DateTime.TryParse(input, out var d);

var firstOfMonth = new DateTime(now.Year, now.Month, 1);
var lastOfMonth = firstOfMonth.AddMonths(1).AddDays(-1);
```

::: tip When to use
Timestamps (`CreatedAt = DateTime.UtcNow`), deadlines and due dates, scheduling, reports by period. Store UTC and convert to local only for display.
:::

## TimeSpan, DateOnly and DateTimeOffset

> `TimeSpan` is a duration, `DateOnly`/`TimeOnly` hold half of a DateTime, and `DateTimeOffset` keeps the UTC offset.

```csharp
TimeSpan elapsed = DateTime.UtcNow - startedAt;    // subtracting dates gives a TimeSpan
Console.WriteLine(elapsed.TotalMinutes);
var timeout = TimeSpan.FromSeconds(30);
var shift = new TimeSpan(8, 30, 0);                // 08:30:00
bool expired = DateTime.UtcNow - token.IssuedAt > TimeSpan.FromHours(1);
Console.WriteLine($"{elapsed:hh\\:mm\\:ss}");

int age = DateTime.Today.Year - birth.Year;
if (birth.Date > DateTime.Today.AddYears(-age)) age--;   // correct age calculation

DateOnly birthDate = new(1995, 7, 14);   // .NET 6: no time part, so no timezone bugs
TimeOnly opening = new(9, 0);
bool isOpen = TimeOnly.FromDateTime(DateTime.Now).IsBetween(opening, new TimeOnly(18, 0));

DateTimeOffset placedAt = DateTimeOffset.Now;   // 2026-10-30 14:05 -03:00, an unambiguous instant

// Testability: inject the clock instead of calling DateTime.Now directly
public class SubscriptionService(TimeProvider clock)       // .NET 8
{
    public bool IsExpired(Subscription s) => clock.GetUtcNow() > s.ExpiresAt;
}
```

::: tip When to use
- `TimeSpan`: timeouts, durations, SLA calculations, countdowns.
- `DateOnly`: birthdays, holidays, due dates.
- `DateTimeOffset`: events across time zones (APIs, distributed systems).
- `TimeProvider`: unit tests that need to "travel in time".
:::

## Math Class

> A static class with constants and functions for rounding, powers, roots, trigonometry and limits.

```csharp
Math.Abs(-5)              // 5
Math.Max(a, b)            Math.Min(a, b)
Math.Clamp(value, 0, 100) // keep in range (volume, percentages, health bars)
Math.Pow(2, 10)           // 1024 (double)
Math.Sqrt(16)             // 4
Math.Cbrt(27)             // 3
Math.Round(2.5)           // 2   ← banker's rounding (to even) by default!
Math.Round(2.5, MidpointRounding.AwayFromZero) // 3
Math.Round(3.14159, 2)    // 3.14
Math.Floor(2.9)           // 2
Math.Ceiling(2.1)         // 3 → e.g. number of pages: Math.Ceiling(total / (double)pageSize)
Math.Truncate(-2.7)       // -2
Math.Sign(-3)             // -1
Math.PI  Math.E  Math.Tau
Math.Sin(angle)  Math.Cos(angle)  Math.Atan2(y, x)  // radians
Math.Log(x)  Math.Log10(x)  Math.Log2(x)

double radians = degrees * Math.PI / 180;
int pages = (int)Math.Ceiling(totalItems / (double)pageSize);
```

`MathF` has the same API for `float`; `decimal` has its own `Math.Round(decimal, …)` overloads.

::: warning Gotcha
`Math.Round` uses **banker's rounding** (`MidpointRounding.ToEven`) by default, so 2.5 → 2 and 3.5 → 4. For money shown to users, pass `MidpointRounding.AwayFromZero`.
:::
