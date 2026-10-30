# Properties

Getters and setters that look like fields but run code: auto, validated, computed, read-only, write-only, `init` and `required`.

## Auto-Implemented Properties

> `{ get; set; }` creates a hidden backing field for you. It's the standard way to expose data publicly instead of using public fields.

```csharp
public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";          // with initializer
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow; // public read, private write
    public List<Address> Addresses { get; } = [];   // get-only: reference can't be replaced
}
```

::: tip When to use
Always prefer a property over a public field. You can add validation later without breaking callers, and serializers, data binding and EF Core work with properties.
:::

## Full Properties with Validation

> Write the `get`/`set` bodies yourself with a backing field to validate, normalize or react to changes. `value` is the incoming value.

```csharp
public class Product
{
    private decimal _price;
    private string _sku = "";

    public decimal Price
    {
        get => _price;
        set
        {
            if (value < 0) throw new ArgumentOutOfRangeException(nameof(value), "Price can't be negative");
            _price = Math.Round(value, 2);
        }
    }

    public string Sku
    {
        get => _sku;
        set => _sku = value.Trim().ToUpperInvariant();   // normalize
    }
}

// C# 14 `field` keyword: refers to the compiler-generated backing field
public string Name { get; set => field = value.Trim(); }
```

```csharp
// Change notification: the basis of MVVM / data binding
private string _status = "";
public string Status
{
    get => _status;
    set
    {
        if (_status == value) return;
        _status = value;
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(Status)));
    }
}
```

::: tip When to use
Enforcing invariants (no negative price, age 0–150), normalizing input, lazy loading, change notification (`INotifyPropertyChanged`), logging access.
:::

## Computed Properties

> A get-only property calculated from other state every time it's read. No backing field.

```csharp
public class Rectangle
{
    public double Width { get; set; }
    public double Height { get; set; }

    public double Area => Width * Height;           // always up to date
    public bool IsSquare => Width == Height;
}

public class Cart
{
    public List<CartItem> Items { get; } = [];
    public decimal Subtotal => Items.Sum(i => i.Price * i.Quantity);
    public decimal Shipping => Subtotal >= 200 ? 0 : 19.90m;
    public decimal Total => Subtotal + Shipping;
    public bool IsEmpty => Items.Count == 0;
}
```

::: tip When to use
Derived values that must never go out of sync (totals, full names, age, status flags). Classes made only of properties and computed properties often need no constructor at all; object initializers do the job. If it's expensive, cache it or make it a method so callers know it's costly.
:::

## Read-Only Properties

> A property with only `get` (or `private set`) that callers can read but not change.

```csharp
public class Order
{
    public Guid Id { get; } = Guid.NewGuid();     // set only here or in the constructor
    public string Number { get; }                 // assigned in constructor
    public OrderStatus Status { get; private set; } = OrderStatus.Pending; // changed only by methods

    public Order(string number) => Number = number;

    public void Ship()
    {
        if (Status != OrderStatus.Paid) throw new InvalidOperationException("Order not paid");
        Status = OrderStatus.Shipped;             // state changes through behavior
    }
}
```

| Syntax | Who can set |
| --- | --- |
| `{ get; }` | constructor / initializer only |
| `{ get; private set; }` | any member of the class |
| `{ get; init; }` | constructor + object initializer |
| `=> expr` | nobody (computed) |

::: tip When to use
IDs, creation dates, and anything that should change only through a method that enforces business rules (`Ship()`, `Cancel()`), not by a random `order.Status = ...`.
:::

## Write-Only Properties

> A property with only `set`. Rare, but useful for secrets that must go in and never come out.

```csharp
public class UserAccount
{
    private string _passwordHash = "";

    public string Password
    {
        set => _passwordHash = BCrypt.Net.BCrypt.HashPassword(value);  // store the hash only
    }

    public bool VerifyPassword(string attempt) => BCrypt.Net.BCrypt.Verify(attempt, _passwordHash);
}
```

::: tip When to use
Passwords and API keys being set on an object. Many style guides prefer a `SetPassword(string)` method instead, because write-only properties surprise people.
:::

## init and required <Badge type="tip" text="extra" />

> `init` allows setting a property only during object creation; `required` forces callers to set it.

```csharp
public class CreateUserRequest
{
    public required string Email { get; init; }
    public required string Name { get; init; }
    public string? Phone { get; init; }
}

var req = new CreateUserRequest { Email = "a@b.com", Name = "Ana" }; // ✅
// var bad = new CreateUserRequest { Name = "Ana" };   ❌ compile error: Email is required
// req.Email = "x";                                      ❌ init-only
```

::: tip When to use
Immutable DTOs, configuration and messages: they're easy to create with object initializers and safe to share afterward.
:::

## Indexers <Badge type="tip" text="extra" />

> Let an object be accessed with `[]` like an array or dictionary.

```csharp
public class Matrix
{
    private readonly double[,] _data;
    public Matrix(int rows, int cols) => _data = new double[rows, cols];

    public double this[int row, int col]
    {
        get => _data[row, col];
        set => _data[row, col] = value;
    }
}

var m = new Matrix(3, 3);
m[0, 1] = 5;
```

::: tip When to use
Custom collections, grids, settings bags (`config["Key"]`), and wrappers around arrays or dictionaries.
:::
