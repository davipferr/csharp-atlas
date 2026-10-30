# Conditionals & Switch

Branching with `if`, `switch` and pattern matching, plus how scope works inside blocks.

## If, Else If and Else

> Conditions are evaluated top to bottom and the **first** true branch wins, so order matters.

```csharp
if (score >= 90) grade = "A";
else if (score >= 80) grade = "B";   // only checked if score < 90
else if (score >= 70) grade = "C";
else grade = "F";

// Wrong order: everything ≥ 70 becomes "C" because that check comes first
if (score >= 70) grade = "C";
else if (score >= 90) grade = "A";   // unreachable for 90+
```

**Guard clauses** (early return) replace deep nesting:

```csharp
// Nested
void Checkout(Cart? cart)
{
    if (cart != null)
    {
        if (cart.Items.Count > 0)
        {
            if (user.HasPaymentMethod) { Pay(); }
        }
    }
}

// Flat
void Checkout(Cart? cart)
{
    if (cart is null) return;
    if (cart.Items.Count == 0) return;
    if (!user.HasPaymentMethod) throw new InvalidOperationException("No payment method");
    Pay();
}
```

::: tip When to use
- Range checks: order `else if` from most specific to least specific.
- More than 2 levels of nesting: refactor to guard clauses or extract a method.
- Always use braces for multi-line bodies (see [Clean Code](/architecture/clean-code)).
:::

## Variable Scope

> A variable exists only inside the `{ }` block where it's declared, including nested blocks, and not before its declaration.

```csharp
int total = 0;                    // method scope

if (order.IsValid)
{
    decimal discount = 0.1m;      // block scope: only inside this if
    total += 10;                  // outer variable visible
}
// Console.WriteLine(discount);   // ❌ error: doesn't exist here

for (int i = 0; i < 3; i++) { }   // i lives only in the loop
for (int i = 0; i < 5; i++) { }   // ✅ a new i

string? result;                   // declare outside to use after the block
if (TryLoad(out var data)) result = data;
else result = null;
```

::: warning Gotcha
C# forbids shadowing a local inside a nested block (`int x` outside and `int x` inside the `if` won't compile), which avoids a whole class of bugs. Fields *can* be shadowed by locals; use `this.` to disambiguate.
:::

## Switch Statement

> Picks one branch by matching a value against `case` labels. Each section must end with `break`, `return`, `throw` or `goto`; there's no fall-through.

```csharp
switch (command.Trim().ToLower())
{
    case "start":
        server.Start();
        break;
    case "stop":
    case "quit":                  // stacked labels share a body
        server.Stop();
        break;
    case "status" when server.IsRunning:   // case guard
        Console.WriteLine("Running");
        break;
    default:
        Console.WriteLine($"Unknown command: {command}");
        break;
}

switch (shape)                    // type patterns
{
    case Circle c:     area = Math.PI * c.Radius * c.Radius; break;
    case Rectangle r:  area = r.Width * r.Height; break;
    case null:         throw new ArgumentNullException(nameof(shape));
}
```

::: tip When to use
Menus, command parsers, state machines, enum handling: whenever you compare **one** value against many constants and each branch runs *statements*.
:::

## Switch Expressions & Pattern Matching <Badge type="tip" text="extra" />

> A switch that **returns a value** (C# 8+), with patterns for types, ranges, properties and tuples.

```csharp
string Classify(int temp) => temp switch
{
    < 0 => "Freezing",
    >= 0 and < 15 => "Cold",
    >= 15 and < 25 => "Mild",
    _ => "Hot"                    // _ = discard / default
};

decimal Shipping(Order o) => o switch
{
    { Total: >= 200 } => 0m,                         // property pattern
    { Country: "BR", Express: true } => 39.90m,
    { Country: "BR" } => 19.90m,
    _ => 59.90m
};

string Describe(object x) => x switch
{
    int n when n < 0 => "negative int",
    int n => $"int {n}",
    string { Length: 0 } => "empty string",
    string s => $"string '{s}'",
    IEnumerable<int> list => $"{list.Count()} ints",
    null => "null",
    _ => x.GetType().Name
};

// Tuple pattern: rock-paper-scissors in 6 lines
string Winner(string a, string b) => (a, b) switch
{
    ("rock", "scissors") or ("scissors", "paper") or ("paper", "rock") => "Player 1",
    var (x, y) when x == y => "Draw",
    _ => "Player 2"
};

if (input is not null and not "") { }   // patterns work in `is` too
if (user is { IsActive: true, Role: "Admin" }) { }
```

::: tip When to use
Mapping a value to another value: status → color, enum → label, price rules, discount tiers. The compiler warns if an enum case isn't handled.
:::

## Switch or If: Which to Choose

> Use `switch` for one value against many constants or patterns; use `if` for unrelated or compound conditions.

| Prefer `if / else if` | Prefer `switch` |
| --- | --- |
| Conditions test *different* variables | Testing *one* value/expression |
| Complex boolean logic (`a && (b \|\| c)`) | Many discrete cases (5+) |
| One or two branches | Enum / string command / type dispatch |
| Ranges in old C# | Ranges with relational patterns (C# 9+) |

::: tip When to use
If you keep writing `x == A || x == B` against the same variable, switch to `switch`. If the switch keeps growing every time a new type is added, consider [polymorphism](/inheritance/polymorphism) instead.
:::
