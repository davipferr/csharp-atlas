# Legacy & Other Collections

The pre-generics collections you'll meet in old code, and the other generic collections worth knowing.

## ArrayList (Legacy)

> A non-generic, resizable list of `object`. It accepts anything, so you lose type safety and pay for boxing.

```csharp
using System.Collections;

var list = new ArrayList();
list.Add(42);            // boxed
list.Add("hello");       // mixed types allowed
list.Add(DateTime.Now);

int n = (int)list[0]!;   // must cast, and a wrong cast throws InvalidCastException at runtime

foreach (object item in list)
    if (item is int i) Console.WriteLine(i * 2);
```

::: tip When to use
Never in new code; use `List<T>` (or `List<object>` if you really need mixed types). Recognize it when maintaining .NET Framework 1.x/2.0-era code or old WinForms projects.
:::

## Hashtable (Legacy)

> A non-generic key/value store of `object` → `object`. It's the ancestor of `Dictionary<TKey, TValue>`.

```csharp
var table = new Hashtable
{
    { "host", "localhost" },
    { "port", 5432 }
};

int port = (int)table["port"]!;     // cast required
object? missing = table["nope"];   // returns null (Dictionary would throw)

foreach (DictionaryEntry entry in table)
    Console.WriteLine($"{entry.Key} = {entry.Value}");
```

::: tip When to use
Only in legacy code. Replace with `Dictionary<K,V>`. Note the behavioral difference when migrating: a missing key returns `null` in Hashtable but throws in Dictionary (use `TryGetValue`).
:::

## Other Generic Collections <Badge type="tip" text="extra" />

> Pick the collection by the operation you need most: uniqueness, FIFO, LIFO, ordering or thread safety.

| Collection | What it is | Real use |
| --- | --- | --- |
| `HashSet<T>` | unique items, O(1) `Contains` | dedupe emails, visited nodes, tags |
| `Queue<T>` | FIFO: `Enqueue` / `Dequeue` | job queue, BFS, print spooler |
| `Stack<T>` | LIFO: `Push` / `Pop` | undo history, expression parsing, DFS |
| `LinkedList<T>` | O(1) insert/remove at known node | LRU caches |
| `SortedDictionary<K,V>` / `SortedList<K,V>` | keys kept sorted | leaderboards, time-ordered events |
| `SortedSet<T>` | unique + sorted | ranges, scheduling |
| `PriorityQueue<T,P>` | dequeue lowest priority first (.NET 6) | Dijkstra, task scheduling |
| `ConcurrentDictionary<K,V>` | thread-safe dictionary | shared caches across threads |
| `ConcurrentQueue<T>` / `Channel<T>` | thread-safe producer/consumer | background workers |
| `ImmutableList<T>` / `FrozenDictionary<K,V>` | never changes after creation | shared config, lookup tables |

```csharp
var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
if (!seen.Add(email)) Console.WriteLine("Duplicate!");   // Add returns false if it exists

var undo = new Stack<string>();
undo.Push("typed A"); undo.Push("typed B");
string last = undo.Pop();                                // "typed B"

var jobs = new Queue<Job>();
jobs.Enqueue(job);
while (jobs.TryDequeue(out var next)) next.Run();

var pq = new PriorityQueue<string, int>();
pq.Enqueue("low", 5); pq.Enqueue("urgent", 1);
Console.WriteLine(pq.Dequeue());                         // urgent
```

**Choosing interfaces for parameters and returns:** accept the most general type you need (`IEnumerable<T>` to iterate, `IReadOnlyCollection<T>` when you need `Count`, `IList<T>` to index and mutate) and return a concrete or read-only type.
