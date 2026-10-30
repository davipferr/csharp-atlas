# Arrays

Fixed-size, indexed collections: one-dimensional, multidimensional and jagged.

## Single-Dimensional Arrays

> A fixed-length block of elements of one type, indexed from 0. It's a reference type even when it holds value types.

```csharp
int[] scores = new int[5];                   // [0,0,0,0,0] — default values
string[] days = { "Mon", "Tue", "Wed" };     // declare + initialize in one line
var primes = new[] { 2, 3, 5, 7 };           // type inferred
int[] empty = [];                            // collection expression (C# 12)

scores[0] = 90;
string last = days[^1];                       // "Wed" — index from end
string[] firstTwo = days[..2];               // range → new array
Console.WriteLine(scores.Length);            // 5

// Useful static helpers
Array.Sort(scores);
Array.Reverse(scores);
int pos = Array.IndexOf(days, "Tue");        // 1, or -1
bool has = Array.Exists(scores, s => s > 80);
int[] copy = (int[])scores.Clone();
Array.Resize(ref scores, 10);                // actually creates a new array
Array.Fill(scores, -1);
```

::: warning Gotchas
- Accessing `arr[arr.Length]` throws `IndexOutOfRangeException`.
- Arrays can't grow. If the size changes, use `List<T>`.
:::

::: tip When to use
Fixed-size data (days of week, a game board, RGB values), performance-critical code, `params`, and APIs that return `T[]` (`string.Split`, `File.ReadAllLines`).
:::

## Multidimensional Arrays

> A rectangular grid `T[,]` (or `T[,,]` for 3D). All rows have the same length and it's stored as one block.

```csharp
int[,] board = new int[3, 3];              // tic-tac-toe
board[1, 1] = 1;

int[,] matrix =
{
    { 1, 2, 3 },
    { 4, 5, 6 }
};

int rows = matrix.GetLength(0);  // 2
int cols = matrix.GetLength(1);  // 3
Console.WriteLine(matrix.Length); // 6 — total elements

for (int r = 0; r < rows; r++)
{
    for (int c = 0; c < cols; c++)
        Console.Write($"{matrix[r, c],4}");
    Console.WriteLine();
}

// 3D: e.g. [floor, row, seat] in a stadium, or voxels
var seats = new bool[3, 20, 30];
seats[0, 5, 12] = true;
```

::: tip When to use
Grids with fixed dimensions: game boards, tile maps, images (pixels), matrices, spreadsheet-like tables, seat maps.
:::

## Jagged Arrays

> An array of arrays (`T[][]`). Each inner array can have a **different length**.

```csharp
int[][] jagged = new int[3][];
jagged[0] = [1, 2];
jagged[1] = [3, 4, 5, 6];
jagged[2] = [];

// Real case: monthly sales per salesperson (each has a different number of sales)
decimal[][] sales =
[
    [120m, 80m],
    [300m, 45m, 99m, 10m],
    [500m]
];

foreach (var person in sales)
    Console.WriteLine($"{person.Length} sales, total {person.Sum():C}");

Console.WriteLine(jagged[1][2]); // 5 — note [i][j] not [i, j]
```

| `T[,]` multidimensional | `T[][]` jagged |
| --- | --- |
| Rectangular, all rows equal | Rows can differ |
| `GetLength(0)`, `GetLength(1)` | `arr.Length`, `arr[i].Length` |
| One allocation | One allocation per row |
| Can't use LINQ directly | Each row is a normal array, so LINQ works |

::: tip When to use
Uneven data: lines of a file split into words, weekly schedules with different slot counts, triangle structures (Pascal's triangle), adjacency lists.
:::
