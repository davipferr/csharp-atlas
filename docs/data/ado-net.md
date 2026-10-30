# Databases with ADO.NET

Talking to SQL Server directly with connections, commands, parameters and DataTables.

## Connecting and Querying

> ADO.NET is the low-level data API: `SqlConnection` opens a connection, `SqlCommand` runs SQL, and `SqlDataReader` streams rows.

```csharp
using Microsoft.Data.SqlClient;   // NuGet (System.Data.SqlClient is the legacy package)

string connString = builder.Configuration.GetConnectionString("Zoo")!;
// "Server=localhost;Database=ZooDb;Trusted_Connection=True;TrustServerCertificate=True"

await using var conn = new SqlConnection(connString);
await conn.OpenAsync();

await using var cmd = new SqlCommand("SELECT Id, Name FROM Zoo ORDER BY Name", conn);
await using var reader = await cmd.ExecuteReaderAsync();

var zoos = new List<Zoo>();
while (await reader.ReadAsync())
    zoos.Add(new Zoo(reader.GetInt32(0), reader.GetString(1)));
```

| Method | Returns | Use for |
| --- | --- | --- |
| `ExecuteReader` | `SqlDataReader` (rows) | `SELECT` many rows |
| `ExecuteScalar` | first column of first row | `SELECT COUNT(*)`, new identity |
| `ExecuteNonQuery` | rows affected | `INSERT`, `UPDATE`, `DELETE` |

::: tip When to use
When you need full control or maximum performance. In practice, most apps use **Dapper** (a thin layer over ADO.NET) or **EF Core** on top of it.
:::

## Parameters (Preventing SQL Injection)

> Never concatenate user input into SQL. Pass values as **parameters**; the database treats them as data, not code.

```csharp
// ❌ SQL injection: name = "x'; DROP TABLE Animal; --"
var bad = new SqlCommand($"SELECT * FROM Animal WHERE Name = '{name}'", conn);

// ✅ Parameterized
var cmd = new SqlCommand("INSERT INTO Animal (Name) VALUES (@Name); SELECT SCOPE_IDENTITY();", conn);
cmd.Parameters.AddWithValue("@Name", name);
int newId = Convert.ToInt32(await cmd.ExecuteScalarAsync());

var update = new SqlCommand("UPDATE Animal SET Name = @Name WHERE Id = @Id", conn);
update.Parameters.Add("@Name", SqlDbType.NVarChar, 100).Value = newName;   // explicit type & size
update.Parameters.Add("@Id", SqlDbType.Int).Value = id;
int affected = await update.ExecuteNonQueryAsync();

var delete = new SqlCommand("DELETE FROM Animal WHERE Id = @Id", conn);
delete.Parameters.AddWithValue("@Id", id);
await delete.ExecuteNonQueryAsync();
```

::: tip When to use
**Always**, for every value that isn't a hardcoded constant. Parameters also let SQL Server reuse cached execution plans.
:::

## DataAdapter, DataSet and DataTable

> `SqlDataAdapter` fills an in-memory `DataTable` (rows and columns) that can be bound directly to UI controls.

```csharp
var adapter = new SqlDataAdapter("SELECT Id, Name FROM Zoo", conn);
var table = new DataTable();
adapter.Fill(table);                       // opens/closes the connection itself

foreach (DataRow row in table.Rows)
    Console.WriteLine($"{row["Id"]}: {row["Name"]}");

// WinForms / WPF binding (the course's ListBox example)
listZoos.DisplayMemberPath = "Name";       // WPF
listZoos.SelectedValuePath = "Id";
listZoos.ItemsSource = table.DefaultView;
```

::: tip When to use
Legacy desktop apps and dynamic queries where columns aren't known at compile time (generic report viewers, Excel exports). For typed code, map rows into classes.
:::

## Associative Tables (Many-to-Many)

> A junction table (e.g. `ZooAnimal(ZooId, AnimalId)`) links two tables in a many-to-many relationship. You query across it with `JOIN`s.

```sql
CREATE TABLE Zoo       (Id INT IDENTITY PRIMARY KEY, Location NVARCHAR(100) NOT NULL);
CREATE TABLE Animal    (Id INT IDENTITY PRIMARY KEY, Name NVARCHAR(100) NOT NULL);
CREATE TABLE ZooAnimal (
    Id INT IDENTITY PRIMARY KEY,
    ZooId    INT NOT NULL FOREIGN KEY REFERENCES Zoo(Id)    ON DELETE CASCADE,
    AnimalId INT NOT NULL FOREIGN KEY REFERENCES Animal(Id) ON DELETE CASCADE
);
```

```csharp
// Animals in the selected zoo
const string sql = """
    SELECT a.Id, a.Name
    FROM Animal a
    INNER JOIN ZooAnimal za ON a.Id = za.AnimalId
    WHERE za.ZooId = @ZooId
    """;

var cmd = new SqlCommand(sql, conn);
cmd.Parameters.AddWithValue("@ZooId", selectedZooId);

// Add an animal to a zoo = insert a row in the junction table
var link = new SqlCommand("INSERT INTO ZooAnimal (ZooId, AnimalId) VALUES (@Z, @A)", conn);
link.Parameters.AddWithValue("@Z", zooId);
link.Parameters.AddWithValue("@A", animalId);
await link.ExecuteNonQueryAsync();

// Remove an animal from a zoo (not from the database)
var unlink = new SqlCommand("DELETE FROM ZooAnimal WHERE ZooId = @Z AND AnimalId = @A", conn);
```

::: tip When to use
Students ↔ courses, products ↔ tags, users ↔ roles, orders ↔ products (with quantity on the junction row).
:::

## Transactions <Badge type="tip" text="extra" />

> Group several commands so they all succeed or all roll back.

```csharp
await using var tx = (SqlTransaction)await conn.BeginTransactionAsync();
try
{
    await new SqlCommand("UPDATE Account SET Balance -= @V WHERE Id = @From", conn, tx) { /* params */ }.ExecuteNonQueryAsync();
    await new SqlCommand("UPDATE Account SET Balance += @V WHERE Id = @To", conn, tx) { /* params */ }.ExecuteNonQueryAsync();
    await tx.CommitAsync();
}
catch
{
    await tx.RollbackAsync();
    throw;
}
```

::: tip When to use
Money transfers, order + stock updates, and anything where a half-applied change would corrupt data.
:::
