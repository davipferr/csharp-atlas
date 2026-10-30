# Structs, Enums & Records

Lightweight value types, named constants, and data-centric types with built-in value equality.

## Structs

> A `struct` is a user-defined **value type**: copied on assignment, no heap allocation of its own, and no inheritance.

```csharp
public readonly struct Point                     // readonly struct: immutable, safe to copy
{
    public double X { get; }
    public double Y { get; }
    public Point(double x, double y) => (X, Y) = (x, y);

    public double DistanceTo(Point other)
        => Math.Sqrt(Math.Pow(other.X - X, 2) + Math.Pow(other.Y - Y, 2));

    public override string ToString() => $"({X}, {Y})";
}

var a = new Point(0, 0);
var b = new Point(3, 4);
Console.WriteLine(a.DistanceTo(b));   // 5

Point c = default;                    // (0, 0): structs always have a zeroed default
```

**Struct rules:** can't inherit from or be inherited by other types (but can implement interfaces); always have a default (all-zero) value; can be `readonly` and `ref struct` (stack-only, e.g. `Span<T>`).

Built-in structs you use daily: `int`, `double`, `DateTime`, `TimeSpan`, `Guid`, `decimal`, `KeyValuePair`, `ValueTuple`, `CancellationToken`.

::: tip When to use
Small (≤ ~16 bytes), immutable values that represent a single value: coordinates, colors, money, ranges, IDs. Many of them in arrays → much less GC pressure.
:::

## Struct vs Class

> Structs are copied by value and live inline; classes are referenced and live on the heap.

| | `struct` | `class` |
| --- | --- | --- |
| Kind | value type | reference type |
| Assignment | copies all data | copies the reference |
| `null` | no (unless `T?`) | yes |
| Inheritance | ❌ (interfaces only) | ✅ |
| Default `Equals` | compares fields (reflection, slow, so override it) | reference equality |
| Allocation | inline (stack / inside array or object) | heap + GC |
| Good size | small | any |

```csharp
var p1 = new PointStruct { X = 1 };
var p2 = p1; p2.X = 99;          // p1.X still 1

var list = new List<PointStruct> { new() { X = 1 } };
// list[0].X = 5;                ❌ CS1612: list[0] returns a COPY, so the change would be lost
var tmp = list[0]; tmp.X = 5; list[0] = tmp;   // must replace the whole value
```

::: warning Gotcha
Mutable structs cause "lost update" bugs because you modify a copy. Make structs `readonly` and create new values instead.
:::

## Enums

> Named integer constants that make code readable and type-safe.

```csharp
public enum OrderStatus
{
    Pending,          // 0
    Paid,             // 1
    Shipped,          // 2
    Delivered = 10,   // explicit values (stable for DB storage)
    Cancelled = 99
}

var status = OrderStatus.Paid;
int code = (int)status;                              // 1
var fromDb = (OrderStatus)dbValue;                   // int → enum
string name = status.ToString();                     // "Paid"
var parsed = Enum.Parse<OrderStatus>("Shipped");
bool ok = Enum.TryParse("shipped", ignoreCase: true, out OrderStatus s);
bool valid = Enum.IsDefined(typeof(OrderStatus), 42); // false: casts don't validate!
OrderStatus[] all = Enum.GetValues<OrderStatus>();   // fill a dropdown

string label = status switch
{
    OrderStatus.Pending => "Waiting for payment",
    OrderStatus.Paid => "Preparing",
    OrderStatus.Shipped => "On the way",
    _ => status.ToString()
};
```

::: tip When to use
Fixed sets of options: statuses, roles, days, directions, log levels, game states. Store the numeric value in the DB, and give members explicit numbers so reordering doesn't corrupt data.
:::

## Flags Enums <Badge type="tip" text="extra" />

> With `[Flags]` and power-of-two values, an enum variable can hold a **combination** of options.

```csharp
[Flags]
public enum Permissions
{
    None = 0,
    Read = 1,
    Write = 2,
    Delete = 4,
    Admin = Read | Write | Delete
}

var perms = Permissions.Read | Permissions.Write;
bool canWrite = perms.HasFlag(Permissions.Write);   // true
perms |= Permissions.Delete;                        // add
perms &= ~Permissions.Write;                        // remove
Console.WriteLine(perms);                           // "Read, Delete"
```

::: tip When to use
Permission sets, file attributes, feature toggles, days-of-week selections. One `int` column stores many booleans.
:::

## Records <Badge type="tip" text="extra" />

> `record` (C# 9) is a type built for data: value-based equality, immutability, `with` copies, deconstruction and a readable `ToString`, all generated.

```csharp
public record Address(string Street, string City, string Zip);   // positional record (class)

var a1 = new Address("Main St", "Springfield", "12345");
var a2 = new Address("Main St", "Springfield", "12345");
Console.WriteLine(a1 == a2);     // True: compares values, not references
Console.WriteLine(a1);           // Address { Street = Main St, City = Springfield, Zip = 12345 }

var moved = a1 with { City = "Shelbyville" };   // non-destructive mutation
var (street, city, _) = a1;                     // deconstruction

public record struct Coordinate(double Lat, double Lng);   // value-type record
public record Customer(int Id, string Name)                // can still have members
{
    public string Display => $"#{Id} {Name}";
}
```

::: tip When to use
DTOs, API request/response models, events and messages, value objects (Money, Address), and results returned from methods. Use classes for entities with identity and mutable lifecycle.
:::
