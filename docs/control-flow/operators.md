# Operators

Logical, relational, equality and null-handling operators, and the details that cause bugs.

## Logical Operators (AND, OR, NOT, XOR)

> `&&` and `||` combine booleans and **short-circuit**; `!` negates; `^` is exclusive-or.

```csharp
bool canCheckout = isLoggedIn && cart.Count > 0;
bool isWeekend = day == DayOfWeek.Saturday || day == DayOfWeek.Sunday;
bool isBlocked = !user.IsActive;
bool exactlyOne = hasCoupon ^ hasGiftCard;       // true if one but not both

// Short-circuit makes this null-safe: the right side never runs if user is null
if (user != null && user.IsAdmin) { /* ... */ }

// & and | on bools evaluate BOTH sides (rarely what you want)
if (ValidateName() & ValidateEmail()) { }        // runs both, e.g. to show all errors
```

**Truth table**

| a | b | `a && b` | `a \|\| b` | `a ^ b` | `!a` |
| --- | --- | --- | --- | --- | --- |
| true | true | true | true | false | false |
| true | false | false | true | true | false |
| false | true | false | true | true | true |
| false | false | false | false | false | true |

**Precedence:** `!` → relational (`<`, `>`) → equality (`==`) → `&&` → `||`. When mixing `&&` and `||`, add parentheses for readability.

::: tip When to use
- Put the cheap or null-check condition first so `&&` skips the expensive or unsafe one.
- `&`, `|` and `^` on integers are **bitwise** operators (flags, masks). See [Flags enums](/types/structs-enums).
:::

## Relational and Equality Operators

> `<`, `>`, `<=`, `>=` compare order; `==` and `!=` compare equality, by value for built-ins and **by reference** for classes unless overloaded.

```csharp
bool adult = age >= 18;
bool inRange = value >= min && value <= max;
bool inRange2 = value is >= 1 and <= 10;     // relational pattern (C# 9)

"abc" == "abc";                // true: string overloads == to compare content
new Person("A") == new Person("A");   // false for classes (different references)
                                      // true for records (value equality)

string.Equals(a, b, StringComparison.OrdinalIgnoreCase); // case-insensitive
ReferenceEquals(x, y);                // force a reference comparison
a.CompareTo(b);                        // <0, 0, >0 → used by sorting
```

::: warning Gotchas
- `=` assigns, `==` compares. C# protects you in `if (x = 5)` because it won't compile for non-bools.
- Never compare `double` with `==`. Use a tolerance.
- `null == null` is `true`; comparisons with `int?` follow "lifted" rules: `null < 5` is `false`, and so is `null >= 5`.
:::

## Ternary Operator (One-Line If)

> `condition ? whenTrue : whenFalse` is an *expression* that picks one of two values.

```csharp
string label = stock > 0 ? "In stock" : "Sold out";
decimal shipping = total >= 100 ? 0 : 9.90m;
Console.ForegroundColor = passed ? ConsoleColor.Green : ConsoleColor.Red;

// Nesting works but gets unreadable fast → use a switch expression instead
string size = n < 10 ? "small" : n < 100 ? "medium" : "large";
```

::: tip When to use
Choosing between two values in an assignment, argument or interpolation. If either branch has side effects or more than one statement, use a regular `if`.
:::

## Null-Handling Operators

> `?.` stops at null, `??` provides a fallback, `??=` assigns only if null, and `!` silences a nullable warning.

```csharp
int? length = customer?.Address?.Street?.Length;  // null if anything in the chain is null
string city = customer?.Address?.City ?? "Unknown";
var first = orders?[0];                            // null-conditional indexer
onChanged?.Invoke(this, EventArgs.Empty);          // raise event only if there are subscribers

_cache ??= LoadCache();                            // lazy init: assign if null
string name = input ?? throw new ArgumentNullException(nameof(input)); // guard clause

string definitelySet = maybeNull!;                 // null-forgiving: compiler trust only
```

::: tip When to use
- `?.` for optional object graphs (DTOs, JSON, optional relations).
- `??` for defaults from config or user input.
- `??=` for lazy caches.
- `?? throw` for argument validation in one line.
:::

## Bitwise and Shift Operators <Badge type="tip" text="extra" />

> `&`, `|`, `^`, `~`, `<<` and `>>` work on individual bits of integers.

```csharp
const int Read = 1 << 0;   // 0001
const int Write = 1 << 1;  // 0010
const int Exec = 1 << 2;   // 0100

int perms = Read | Write;           // combine → 0011
bool canWrite = (perms & Write) != 0; // test
perms &= ~Write;                    // remove
perms ^= Exec;                      // toggle

int doubled = x << 1;               // ×2
int half = x >> 1;                  // ÷2
```

::: tip When to use
Permission sets, feature flags, hardware/protocol bit fields, hashing. In app code prefer a `[Flags]` enum.
:::
