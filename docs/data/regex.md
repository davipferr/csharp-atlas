# Regular Expressions

A pattern language for matching, extracting, validating and replacing text.

## What Is Regex

> A regular expression is a pattern that describes a set of strings. The regex engine scans text looking for matches of that pattern.

```text
Pattern:  \d{3}-\d{4}
Matches:  "555-1234" in "Call 555-1234 now"
```

::: tip When to use
Validation (emails, phone numbers, postal codes), extraction (URLs, IDs, dates from logs), search-and-replace, and tokenizing. For simple checks (`StartsWith`, `Contains`, `Split`), plain string methods are clearer and faster.
:::

## Characters, Wildcards and Quantifiers

> Metacharacters match *kinds* of characters; quantifiers say *how many*.

| Token | Matches | Token | Matches |
| --- | --- | --- | --- |
| `.` | any char except newline | `\.` | a literal dot |
| `\d` | digit `[0-9]` | `\D` | non-digit |
| `\w` | word char `[a-zA-Z0-9_]` | `\W` | non-word char |
| `\s` | whitespace | `\S` | non-whitespace |
| `^` | start of string/line | `$` | end of string/line |
| `\b` | word boundary | `\B` | not a word boundary |

| Quantifier | Meaning | Quantifier | Meaning |
| --- | --- | --- | --- |
| `*` | 0 or more | `{3}` | exactly 3 |
| `+` | 1 or more | `{2,}` | 2 or more |
| `?` | 0 or 1 (optional) | `{2,5}` | 2 to 5 |
| `*?` `+?` | lazy (as few as possible) | | |

```text
colou?r          → color, colour
\d+              → 7, 42, 2026
^\d{5}-\d{3}$    → 01310-100 (BR CEP, whole string)
<.+?>            → each HTML tag separately (lazy); <.+> would grab everything greedy
```

## Groups, Ranges and Alternation

> `[...]` defines a character set, `( )` groups and captures, and `|` means OR.

| Syntax | Meaning |
| --- | --- |
| `[abc]` | a, b or c |
| `[a-z]`, `[A-Z0-9]` | ranges |
| `[^0-9]` | anything **except** digits |
| `(abc)` | capture group (numbered: `$1`) |
| `(?<year>\d{4})` | named group |
| `(?:abc)` | group without capturing |
| `cat\|dog` | alternation: cat or dog |
| `(?=...)` / `(?!...)` | lookahead / negative lookahead |
| `(?<=...)` / `(?<!...)` | lookbehind / negative lookbehind |

```text
^(Mr|Mrs|Ms)\.?\s[A-Z][a-z]+$          → "Mr. Smith", "Mrs Jones"
\(?\d{2}\)?\s?9?\d{4}-?\d{4}            → (11) 91234-5678, 1191234 5678…
https?://(www\.)?[\w-]+(\.[\w-]+)+(/\S*)? → web URLs
^(?=.*[A-Z])(?=.*\d).{8,}$              → password: 8+ chars, one uppercase, one digit
[\w.+-]+@[\w-]+\.[\w.-]+                → email addresses (simplified)
```

## Using Regex in C#

> The `Regex` class (`System.Text.RegularExpressions`) provides `IsMatch`, `Match`, `Matches`, `Replace` and `Split`.

```csharp
using System.Text.RegularExpressions;

// Validate
bool isCep = Regex.IsMatch(input, @"^\d{5}-?\d{3}$");

// Extract all
string text = "Contact ana@mail.com or support@company.io for help";
foreach (Match m in Regex.Matches(text, @"[\w.+-]+@[\w-]+\.[\w.-]+"))
    Console.WriteLine(m.Value);

// Named groups
var m2 = Regex.Match("2026-10-30", @"(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})");
if (m2.Success)
    Console.WriteLine($"Year {m2.Groups["year"].Value}");

// Replace (with group references or a function)
string masked = Regex.Replace(cardNumber, @"\d(?=\d{4})", "*");          // ************1234
string iso = Regex.Replace("30/10/2026", @"(\d{2})/(\d{2})/(\d{4})", "$3-$2-$1");
string title = Regex.Replace("hello world", @"\b\w", m => m.Value.ToUpper());

// Split on any whitespace or punctuation
string[] words = Regex.Split(sentence, @"\W+");

// Options
Regex.IsMatch(s, "^yes$", RegexOptions.IgnoreCase);
// RegexOptions.Multiline (^ $ per line), Singleline (. matches \n), Compiled, IgnorePatternWhitespace

// Reuse: a static instance, or (best) a source generator (.NET 7)
public static partial class Patterns
{
    [GeneratedRegex(@"^[\w.+-]+@[\w-]+\.[\w.-]+$", RegexOptions.IgnoreCase)]
    public static partial Regex Email();
}
bool valid = Patterns.Email().IsMatch(email);
```

::: warning Gotchas
- Always use **verbatim strings** (`@"\d"`) so you don't have to double every backslash.
- Untrusted input + complex patterns can cause catastrophic backtracking (ReDoS). Pass a timeout: `new Regex(p, RegexOptions.None, TimeSpan.FromMilliseconds(100))` or use `RegexOptions.NonBacktracking`.
- Don't parse HTML/JSON with regex; use a parser.
:::

::: tip When to use
Form validation, log parsing (extract IP, status, duration), data cleanup (normalize phone numbers), masking sensitive data, and simple template replacements.
:::
