# .NET, Compilation & Projects

How C# code becomes a running program, and how a project is laid out.

## Frameworks and Compilation

> C# compiles to IL, and the .NET runtime (CLR) JIT-compiles that IL to machine code when it runs.

- **C#** is the language. **.NET** is the platform: runtime (CLR), base class library (BCL) and SDK/tooling.
- `dotnet build` runs the **Roslyn** compiler, which turns `.cs` files into an **assembly** (`.dll`/`.exe`). The assembly holds **IL (Intermediate Language)** plus metadata, not native code.
- At runtime the **CLR** loads the assembly and its **JIT** compiler turns IL into native code method by method. The CLR also handles garbage collection, type safety and exceptions.
- **Target framework (TFM)** decides which runtime and APIs you get: `net8.0`, `net9.0`, `netstandard2.0` (library shared with old .NET Framework), `net48` (legacy Windows-only .NET Framework).

| Name | What it is |
| --- | --- |
| .NET Framework 4.x | Legacy, Windows-only. Maintained but frozen. |
| .NET Core 1–3.1 → .NET 5+ | Modern, cross-platform, open source. Use this. |
| .NET Standard | A *spec* of APIs, used for libraries shared across both worlds. |
| LTS vs STS | Even versions (8, 10) are Long-Term Support (3 years); odd ones get 18–24 months. |

```xml
<!-- MyApp.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
```

```bash
dotnet new console -n MyApp     # create
dotnet build                     # compile to bin/Debug/net8.0
dotnet run                       # build + run
dotnet publish -c Release        # optimized output to deploy
```

::: tip When to use
- Library meant for old and new apps → target `netstandard2.0`.
- Startup time matters (CLI tools, containers, serverless) → look at **ReadyToRun** or **Native AOT** publishing, which compile ahead of time instead of JIT.
:::

## Top-Level Statements

> Write the program's entry point directly in `Program.cs` without declaring `class Program` and `static void Main`.

The compiler generates the `Program` class and `Main` method for you. `args`, `await` and `return` (exit code) all still work.

```csharp
// Program.cs — this is the whole program
using System.Text.Json;

var config = await File.ReadAllTextAsync(args.Length > 0 ? args[0] : "appsettings.json");
var settings = JsonSerializer.Deserialize<Settings>(config);
Console.WriteLine($"Running {settings!.Name}");
return 0; // exit code

// Types must come AFTER the top-level code
record Settings(string Name);
```

The classic template it replaces:

```csharp
namespace MyApp;

internal class Program
{
    static async Task<int> Main(string[] args)
    {
        // ...
        return 0;
    }
}
```

::: warning Gotchas
- Only **one** file in a project can have top-level statements.
- Methods declared in top-level code are **local functions**, so they can't be called from other classes.
- Type declarations must come after the statements.
:::

## Using Directives

> `using` imports a namespace so you can write `List<T>` instead of `System.Collections.Generic.List<T>`.

```csharp
using System.Text;                       // normal import
using static System.Math;                // import static members → Sqrt(16), PI
using Json = System.Text.Json.JsonSerializer; // alias
global using System.Net.Http;            // applies to the WHOLE project (C# 10)
```

With `<ImplicitUsings>enable</ImplicitUsings>` the SDK adds these automatically for console apps: `System`, `System.IO`, `System.Collections.Generic`, `System.Linq`, `System.Net.Http`, `System.Threading`, `System.Threading.Tasks`.

**Cheat sheet — the namespaces you'll keep needing:**

| Namespace | You need it for |
| --- | --- |
| `System` | `Console`, `Math`, `DateTime`, `Guid`, `Random`, `Exception`, primitive types |
| `System.Collections.Generic` | `List<T>`, `Dictionary<K,V>`, `HashSet<T>`, `Queue<T>`, `Stack<T>` |
| `System.Linq` | `Where`, `Select`, `OrderBy`, `GroupBy`, `ToList`… |
| `System.Text` | `StringBuilder`, `Encoding` |
| `System.Text.RegularExpressions` | `Regex` |
| `System.Text.Json` | `JsonSerializer` |
| `System.IO` | `File`, `Directory`, `Path`, `StreamReader/Writer` |
| `System.Globalization` | `CultureInfo`, `NumberStyles` |
| `System.Threading` / `System.Threading.Tasks` | `Thread`, `CancellationToken`, `Task`, `Parallel` |
| `System.Diagnostics` | `Debug`, `Stopwatch`, `Process` |
| `System.Collections.Concurrent` | `ConcurrentDictionary`, `ConcurrentQueue` |
| `System.Net.Http` | `HttpClient` |
| `System.Xml.Linq` | `XDocument`, `XElement` |
| `System.Reflection` | `Type` members, `Assembly`, attributes at runtime |
| `Microsoft.Data.SqlClient` (NuGet) | `SqlConnection`, `SqlCommand` |

::: tip When to use
- Put project-wide imports in one `GlobalUsings.cs` with `global using`.
- Use an alias when two namespaces export the same type name (e.g. `using Timer = System.Timers.Timer;`).
:::

## Project Folder Structure

> A solution (`.sln`) groups projects (`.csproj`); each project compiles to one assembly.

```text
MySolution/
├── MySolution.sln               ← groups projects (open this in the IDE)
├── src/
│   ├── MyApp.Api/
│   │   ├── MyApp.Api.csproj     ← project file: TFM, packages, references
│   │   ├── Program.cs           ← entry point
│   │   ├── appsettings.json
│   │   ├── Properties/launchSettings.json  ← dev run profiles
│   │   ├── bin/                 ← compiled output (Debug/Release) — git-ignored
│   │   └── obj/                 ← intermediate build files — git-ignored
│   └── MyApp.Domain/
│       └── MyApp.Domain.csproj
└── tests/
    └── MyApp.Tests/
```

- Folders inside a project usually map 1:1 to **namespaces** (`MyApp.Api/Services/EmailService.cs` → `namespace MyApp.Api.Services;`).
- Packages come from **NuGet**: `dotnet add package Serilog` adds a `<PackageReference>`.
- Projects reference each other with `dotnet add reference ../MyApp.Domain`.
- `Directory.Build.props` at the root shares settings (TFM, nullable, analyzers) across all projects.

::: tip When to use
Split into multiple projects when you want enforced boundaries (Domain can't reference Api), or to share a library between apps. Otherwise, folders are enough.
:::
