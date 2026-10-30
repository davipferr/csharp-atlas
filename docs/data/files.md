# Files & Folders

Reading and writing text files and managing directories with `System.IO`.

## Writing and Reading Text Files

> The `File` static class has one-liners for whole-file operations; `StreamReader`/`StreamWriter` handle large files line by line.

```csharp
// Whole file at once (small files)
File.WriteAllText("notes.txt", "Hello");                // create/overwrite
File.AppendAllText("app.log", $"{DateTime.Now:O} Started{Environment.NewLine}");
File.WriteAllLines("names.txt", names);
string content = File.ReadAllText("notes.txt");
string[] lines = File.ReadAllLines("names.txt");

// Async versions for servers and UI apps
await File.WriteAllTextAsync(path, json);
string text = await File.ReadAllTextAsync(path);

// Streaming (large files: constant memory)
foreach (var line in File.ReadLines("huge.csv").Skip(1))     // lazy, line by line
    Import(line.Split(';'));

using (var writer = new StreamWriter("report.csv", append: false))
{
    await writer.WriteLineAsync("Name;Total");
    foreach (var c in customers)
        await writer.WriteLineAsync($"{c.Name};{c.Total.ToString(CultureInfo.InvariantCulture)}");
}

bool exists = File.Exists(path);
File.Copy(src, dest, overwrite: true);
File.Move(src, dest);
File.Delete(path);
var info = new FileInfo(path);   // Length, CreationTime, Extension...
```

::: tip When to use
Simple logs, exports (CSV/JSON), config and cache files, import jobs. For logging in real apps use a logging library (Serilog file sink). It handles rotation and concurrency for you.
:::

## Directories and Paths

> `Directory` creates, lists and deletes folders; `Path` builds and inspects paths portably.

```csharp
string logDir = Path.Combine(AppContext.BaseDirectory, "logs");   // no manual "\" or "/"
Directory.CreateDirectory(logDir);           // creates the whole tree; no error if it exists

string logFile = Path.Combine(logDir, $"log_{DateTime.Now:yyyyMMdd}.txt");
File.AppendAllText(logFile, $"[{DateTime.Now:HH:mm:ss}] User logged in{Environment.NewLine}");

string[] csvs = Directory.GetFiles(@"C:\imports", "*.csv", SearchOption.AllDirectories);
IEnumerable<string> lazy = Directory.EnumerateFiles(dir, "*.json");   // streamed

Path.GetFileName(@"C:\a\b\report.pdf")            // report.pdf
Path.GetFileNameWithoutExtension("report.pdf")    // report
Path.GetExtension("report.pdf")                   // .pdf
Path.GetDirectoryName(@"C:\a\b\report.pdf")       // C:\a\b
Path.ChangeExtension("data.csv", ".bak")
Path.GetTempPath()  Path.GetRandomFileName()

string docs = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
string appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
```

::: tip When to use
App data folders, log folders per day, batch-processing every file in a directory, and organizing generated reports. Always `Path.Combine` so the code works on Linux containers too.
:::

## JSON Serialization <Badge type="tip" text="extra" />

> `System.Text.Json` converts objects to JSON and back. It's the usual way to persist objects to files.

```csharp
var options = new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

await File.WriteAllTextAsync("settings.json", JsonSerializer.Serialize(settings, options));
var loaded = JsonSerializer.Deserialize<Settings>(await File.ReadAllTextAsync("settings.json"), options);

await using var stream = File.OpenRead("big.json");
var orders = await JsonSerializer.DeserializeAsync<List<Order>>(stream);
```
