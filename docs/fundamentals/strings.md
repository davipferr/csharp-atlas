# Strings & Chars

Building, formatting and manipulating text, plus how `char` and UTF-16 work.

## Concatenation vs Interpolation

> `+` glues strings together; `$"..."` interpolation embeds expressions directly and is easier to read. In loops, use `StringBuilder`.

```csharp
string name = "Ana"; int items = 3; decimal total = 59.9m;

string a = "Hello " + name + ", you have " + items + " items";   // concatenation
string b = string.Concat("Order-", year, "-", id);
string c = $"Hello {name}, you have {items} items";             // interpolation
string d = $"Total: {total:C2} | Due: {DateTime.Today:yyyy-MM-dd}"; // with format
string e = $"{name,-10}|{items,5}";                               // alignment: left 10, right 5
string f = $"Status: {(items > 0 ? "active" : "empty")}";         // expressions need ( ) for ?:
string g = string.Join(", ", tags);                               // join a collection

// Many appends → StringBuilder (strings are immutable; each + creates a new string)
var sb = new StringBuilder();
foreach (var line in invoiceLines)
    sb.AppendLine($"{line.Product,-20}{line.Price,10:N2}");
string report = sb.ToString();
```

::: tip When to use
- Interpolation for almost everything.
- `string.Join` for lists, `StringBuilder` for building text in loops (reports, CSV, HTML).
- **Never** build SQL with interpolation, because that's SQL injection. Use parameters.
- Structured logging: `logger.LogInformation("User {UserId} logged in", id)`, *not* `$"..."`, so the value is stored as a field.
:::

## String Formatting

> Format specifiers control how numbers and dates become text: `{value:format}` in interpolation, `ToString("format")`, or `string.Format`.

```csharp
decimal price = 1234.5678m;
double ratio = 0.256;
int id = 42;

$"{price:C}"      // $1,234.57      currency (culture-dependent)
$"{price:N2}"     // 1,234.57       thousands separator + 2 decimals
$"{price:F1}"     // 1234.6         fixed-point
$"{ratio:P1}"     // 25.6 %         percent
$"{id:D6}"        // 000042         zero-padded integer
$"{id:X}"         // 2A             hexadecimal
$"{price:0.00}"   // 1234.57        custom pattern
$"{price:#,##0}"  // 1,235
$"{1.5e6:E2}"     // 1.50E+006

DateTime now = DateTime.Now;
$"{now:yyyy-MM-dd HH:mm:ss}" // 2026-10-30 14:05:09
$"{now:dd/MM/yyyy}"          // 30/10/2026
$"{now:dddd, MMMM d}"        // Friday, October 30
$"{now:O}"                   // ISO 8601 round-trip

string.Format("{0} owes {1:C}", name, price); // composite formatting (positional)
price.ToString("N2", CultureInfo.InvariantCulture);
```

| Spec | Meaning | Spec | Meaning |
| --- | --- | --- | --- |
| `C` | currency | `D6` | integer, min 6 digits |
| `N2` | number w/ separators | `X` / `x` | hex |
| `F2` | fixed decimals | `P` | percent (×100) |
| `E` | scientific | `G` | general (shortest) |
| `0` | digit or zero | `#` | digit if present |
| `,10` | right-align in 10 chars | `,-10` | left-align |

::: tip When to use
Console tables, receipts and reports (alignment + `N2`), file names with dates (`yyyyMMdd_HHmmss`), padded codes (`D6`).
:::

## Escape Characters, Verbatim and Raw Strings

> Backslash escapes insert special characters; `@"..."` ignores escapes; `"""..."""` raw literals take text exactly as written.

| Escape | Meaning | Escape | Meaning |
| --- | --- | --- | --- |
| `\n` | new line | `\t` | tab |
| `\r` | carriage return (back to line start) | `\\` | backslash |
| `\"` | double quote | `\'` | single quote |
| `\0` | null char | `\u00E9` | Unicode code (é) |

```csharp
string path1 = "C:\\Users\\davi\\file.txt";       // escaped
string path2 = @"C:\Users\davi\file.txt";          // verbatim: \ is literal
string quote = @"She said ""hi""";                // "" = one quote in verbatim
string multi = @"Line 1
Line 2";                                             // verbatim keeps newlines

// Raw string literal (C# 11): no escaping at all, indentation trimmed to the closing """
string json = """
    {
      "name": "Ana",
      "path": "C:\temp"
    }
    """;
string templ = $$"""{ "id": {{id}} }""";   // $$ → interpolation uses double braces

Console.WriteLine($"Name\tAge\n{name}\t{age}");
string nl = Environment.NewLine;          // \r\n on Windows, \n on Linux
```

::: tip When to use
- `@"..."` for Windows paths and regex patterns.
- `"""..."""` for embedded JSON, SQL, HTML or test fixtures.
- `Path.Combine` instead of hand-written separators.
:::

## Common String Methods

> Strings are immutable: every method returns a **new** string. Remember to assign the result.

```csharp
string input = "  Hello, World  ";

input.Trim()               // "Hello, World"   also TrimStart / TrimEnd / Trim('/')
input.ToLower() / ToUpper()
input.Trim().ToLower() == "yes"                    // normalize user input
answer.Equals("yes", StringComparison.OrdinalIgnoreCase) // better: no new string

s.Contains("World")        s.StartsWith("http")     s.EndsWith(".csv")
s.IndexOf(',')             s.LastIndexOf('/')       // -1 when not found
s.Substring(7, 5)          s[7..12]                 s[^3..]   // ranges (C# 8)
s.Replace("World", "C#")   s.Remove(0, 2)           s.Insert(0, ">> ")
s.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
s.PadLeft(10, '0')         s.PadRight(20)
string.IsNullOrEmpty(s)    string.IsNullOrWhiteSpace(s)  // validation
string.Join(";", parts)    string.Concat(parts)
new string('-', 40)        // repeat a char: separator line
s.ToCharArray()            new string(chars.Reverse().ToArray())
```

::: tip When to use
- `IsNullOrWhiteSpace` for form validation.
- `Split` + `TrimEntries` for parsing CSV-ish lines or tags.
- `StringComparison.OrdinalIgnoreCase` for case-insensitive comparisons of identifiers (emails, file names, commands).
:::

## Char and UTF-16

> `char` is a 16-bit UTF-16 code unit. Most characters fit in one, but emoji and some symbols need **two** (a surrogate pair).

```csharp
char letter = 'A';
char unicode = '\u263A';          // ☺
int code = letter;                // 65 (implicit char → int)
char next = (char)(letter + 1);   // 'B'

char.IsDigit('7')  char.IsLetter('a')  char.IsWhiteSpace(' ')
char.IsUpper('A')  char.ToUpper('a')   char.IsLetterOrDigit('_')
int digit = '7' - '0';            // 7: classic digit trick

Console.OutputEncoding = System.Text.Encoding.UTF8; // let the console print emoji
string smile = "😀";
Console.WriteLine(smile.Length);  // 2 ← two UTF-16 code units!
Console.WriteLine(char.IsSurrogate(smile[0])); // True

// Count what users see as characters
int runes = smile.EnumerateRunes().Count();                      // 1 code point
int graphemes = new StringInfo("👍🏽").LengthInTextElements;      // 1 visible symbol
```

::: tip When to use
- Character classification for validation (password rules, tokenizers).
- When truncating user text (tweets, SMS, DB column limits), count with `StringInfo` so you don't cut an emoji in half.
:::
