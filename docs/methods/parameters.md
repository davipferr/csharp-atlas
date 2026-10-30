# Parameters & Arguments

How arguments are passed, the `ref`/`out`/`in` modifiers, optional, named and `params` parameters, and argument promotion.

## Passing by Value vs by Reference

> By default **everything is passed by value**: a copy of the variable. For reference types the copy is *of the reference*, so the method can mutate the object but can't replace the caller's variable.

```csharp
void Increase(int n) => n += 10;                 // copy of the int
void Rename(Person p) => p.Name = "Changed";     // copy of the reference → same object
void Replace(Person p) => p = new Person("New"); // only the local copy points elsewhere

int x = 5;            Increase(x);   // x is still 5
var ana = new Person("Ana");
Rename(ana);          // ana.Name == "Changed"  ← mutation visible
Replace(ana);         // ana.Name == "Changed"  ← reassignment NOT visible

void ReplaceRef(ref Person p) => p = new Person("New");
ReplaceRef(ref ana);  // ana.Name == "New"      ← with ref, the variable itself is shared
```

| | Value type arg | Reference type arg |
| --- | --- | --- |
| By value (default) | method gets a copy; caller unaffected | method can mutate the object; can't reassign caller's variable |
| `ref` | method can change caller's value | method can mutate *and* reassign caller's variable |

::: tip When to use
Know this to avoid surprises: a method that receives your `List<T>` can add to it. Pass `IReadOnlyList<T>` or a copy if it shouldn't.
:::

## ref, out and in

> Parameter modifiers that pass the **variable itself** (an alias) instead of a copy.

```csharp
// ref: read AND write; caller must initialize first
void Swap(ref int a, ref int b) => (a, b) = (b, a);
int p = 1, q = 2;
Swap(ref p, ref q);

// out: method MUST assign; caller doesn't need to initialize. Used for "Try" patterns
bool TryParseCoordinates(string text, out double lat, out double lng)
{
    lat = lng = 0;
    var parts = text.Split(',');
    return parts.Length == 2
        && double.TryParse(parts[0], CultureInfo.InvariantCulture, out lat)
        && double.TryParse(parts[1], CultureInfo.InvariantCulture, out lng);
}
if (TryParseCoordinates("-23.5,-46.6", out var lat, out var lng)) { }
_ = int.TryParse("12", out _);          // discard an out value you don't need

// in: read-only reference; avoids copying a LARGE struct
double Distance(in Vector3 a, in Vector3 b)
{
    // a.X = 1;  ❌ compile error: read-only
    return Math.Sqrt(Math.Pow(a.X - b.X, 2) + Math.Pow(a.Y - b.Y, 2) + Math.Pow(a.Z - b.Z, 2));
}
```

| Modifier | Must initialize before call | Method must assign | Method can modify |
| --- | --- | --- | --- |
| `ref` | ✅ | ❌ | ✅ |
| `out` | ❌ | ✅ | ✅ |
| `in` | ✅ | ❌ | ❌ |

::: tip When to use
- `out`: the `TryXxx(input, out result)` pattern.
- `ref`: swapping, or updating a caller's value type in performance-sensitive code.
- `in`: passing large readonly structs (math, game engines) without copying.
- Otherwise prefer returning a tuple or record. It's easier to read.
:::

## Optional Parameters

> Give a parameter a default value and callers can omit it. Optional parameters must come after the required ones.

```csharp
public Task<List<Product>> SearchAsync(
    string term,
    int page = 1,
    int pageSize = 20,
    string sortBy = "name",
    CancellationToken ct = default)
{ /* ... */ }

await SearchAsync("mouse");
await SearchAsync("mouse", 2);
```

::: warning Gotcha
Defaults are **baked into the caller** at compile time. If you change a default in a library, already-compiled callers keep the old value until they recompile. For public library APIs, overloads are safer.
:::

## Named Arguments

> Pass arguments by parameter name: `Method(name: value)`. Order no longer matters and calls document themselves.

```csharp
await SearchAsync("mouse", pageSize: 50);            // skip page, keep its default
var user = CreateUser(name: "Ana", isAdmin: true, sendWelcomeEmail: false);

// Instead of the unreadable
CreateUser("Ana", true, false);
```

::: tip When to use
Boolean and numeric literals whose meaning isn't obvious, skipping some optional parameters, and methods with many parameters of the same type.
:::

## params Arrays

> `params` lets a method take a variable number of arguments that arrive as an array (or, since C# 13, any collection type).

```csharp
public static int Sum(params int[] numbers) => numbers.Sum();
Sum();              // 0
Sum(1, 2, 3);       // 6
Sum([1, 2, 3]);     // array works too

public void Log(string template, params object[] args)
    => Console.WriteLine(template, args);
Log("{0} bought {1} items", "Ana", 3);
```

::: tip When to use
Utility methods (`Math.Max`-like helpers, logging, `string.Join`, `Path.Combine`), and builder methods like `AddTags("a", "b", "c")`.
:::

## Argument Promotion

> When an argument's type doesn't match, C# **implicitly widens** it to the parameter type if that's safe.

```csharp
double Square(double x) => x * x;
int side = 4;
Square(side);            // int promoted to double → 16.0

void Save(long id) { }
Save(42);                // int → long

void Pay(decimal amount) { }
Pay(10);                 // int → decimal ✅
// Pay(10.5);            // ❌ double → decimal is NOT implicit: use 10.5m

// Overload resolution prefers the closest match
void Show(int n) => Console.WriteLine("int");
void Show(double n) => Console.WriteLine("double");
Show(5);    // int
Show(5f);   // double (float promoted)
```

::: tip When to use
Mostly something to understand: it explains which overload gets called, and why `decimal` APIs need the `m` suffix on literals.
:::
