# Loops & Console

Every loop in C#, how to control it, and console tricks for interactive programs.

## For Loop

> Runs a counter from a start to an end. Use it when you need the **index** or a specific step or direction.

```csharp
for (int i = 0; i < items.Length; i++)
    Console.WriteLine($"{i + 1}. {items[i]}");

for (int i = 10; i >= 0; i--)          // countdown
    Console.WriteLine(i);

for (int i = 0; i < data.Length; i += 2) { } // every other element

for (int i = list.Count - 1; i >= 0; i--)    // iterate backwards to REMOVE safely
    if (list[i].IsExpired) list.RemoveAt(i);

for (int row = 0, col = 0; row < n; row++, col += 2) { } // multiple variables
```

::: tip When to use
Index math (neighbors `i - 1` / `i + 1`), countdowns, fixed repetitions, iterating backwards, or modifying array elements in place.
:::

## While Loop

> Repeats **while** a condition is true. The condition is checked before each iteration, so the body may run zero times.

```csharp
// Unknown number of iterations: shines for input validation and game loops
int secret = Random.Shared.Next(1, 101), guess = 0, attempts = 0;
while (guess != secret)
{
    Console.Write("Guess: ");
    if (!int.TryParse(Console.ReadLine(), out guess)) continue;
    attempts++;
    Console.WriteLine(guess < secret ? "Higher" : guess > secret ? "Lower" : $"Got it in {attempts}!");
}

// Reading a stream until the end
using var reader = new StreamReader("log.txt");
string? line;
while ((line = reader.ReadLine()) != null)
    Process(line);

// Retry with a limit
int tries = 0;
while (!TryConnect() && ++tries < 3)
    Thread.Sleep(1000 * tries);
```

::: tip When to use
When you don't know how many iterations you'll need: polling, retries, reading streams, menus, game loops, "keep asking until valid".
:::

## Do-While Loop

> Like `while`, but the condition is checked **after** the body, so it always runs **at least once**.

```csharp
string? choice;
do
{
    Console.WriteLine("1) New game  2) Load  3) Quit");
    choice = Console.ReadLine();
} while (choice is not ("1" or "2" or "3"));

// Average calculator: read numbers until the user types 0
double sum = 0; int count = 0; double n;
do
{
    n = double.Parse(Console.ReadLine()!);
    if (n != 0) { sum += n; count++; }
} while (n != 0);
Console.WriteLine($"Average: {sum / count:F2}");
```

::: tip When to use
Menus and prompts, where you must show or ask something before you can evaluate the condition.
:::

## Foreach Loop

> Iterates over any `IEnumerable` (arrays, lists, dictionaries, LINQ results) without managing an index.

```csharp
foreach (var product in cart.Items)
    total += product.Price * product.Quantity;

foreach (var (key, value) in dictionary)      // deconstruction
    Console.WriteLine($"{key}: {value}");

foreach (var (item, index) in items.Select((x, i) => (x, i))) { } // need the index too
foreach (var (index, item) in items.Index()) { }                   // .NET 9
```

::: warning Gotchas
- The loop variable is read-only, so you can't reassign it (you *can* mutate its properties if it's a class).
- Adding or removing items from a `List<T>` during `foreach` throws `InvalidOperationException: Collection was modified`. Use a backwards `for` loop, `RemoveAll`, or iterate a copy (`.ToList()`).
:::

## Break and Continue

> `break` exits the loop immediately; `continue` skips to the next iteration.

```csharp
foreach (var file in files)
{
    if (file.Length == 0) continue;       // skip empty files
    if (processed >= limit) break;        // stop when the limit is reached
    Import(file);
    processed++;
}

// Searching: stop at the first match
User? found = null;
foreach (var u in users)
    if (u.Email == email) { found = u; break; }   // LINQ: users.FirstOrDefault(...)

// break only exits the INNERMOST loop; for nested loops use a flag,
// extract a method and `return`, or (rarely) goto.
```

::: tip When to use
`continue` for filtering out items at the top of the loop (guard style). `break` for search or limits. Inside a `switch` inside a loop, `break` exits the *switch*, not the loop.
:::

## Console Tricks: \r, Colors and Thread.Sleep

> `\r` returns the cursor to the start of the line so you can overwrite it, `Thread.Sleep` pauses, and `ForegroundColor` colors output.

```csharp
// Progress bar / countdown that updates in place
for (int altitude = 100; altitude >= 0; altitude -= 10)
{
    Console.Write($"\rAltitude: {altitude,3} m  ");  // \r → overwrite same line
    Thread.Sleep(300);                               // ms; use await Task.Delay in async code
}
Console.WriteLine("\nTouchdown! 🚀");

Console.ForegroundColor = ConsoleColor.Green;
Console.WriteLine("✔ Correct");
Console.ResetColor();

Console.Write("Name: ");               // Write: no newline (prompt on the same line)
string name = Console.ReadLine() ?? "";
var key = Console.ReadKey(intercept: true);  // single key, not echoed
if (key.Key == ConsoleKey.Escape) return;
Console.Clear();
Console.SetCursorPosition(0, 5);
Console.CursorVisible = false;
```

::: tip When to use
CLI tools (progress, colored success/error), simple games and simulations. For serious CLIs, the **Spectre.Console** library gives tables, spinners and prompts.
:::
