# LINQ to SQL & EF Core

Querying a relational database with LINQ instead of SQL strings.

## LINQ to SQL (Legacy)

> The original ORM (.NET Framework 3.5): a designer-generated `DataContext` maps tables to classes, and LINQ queries are translated to SQL.

```csharp
// .dbml designer generates UniversityDataContext, Student, University, Course, StudentCourse
var db = new UniversityDataContext(connectionString);

// Insert
var uni = new University { Name = "Tech U" };
db.Universities.InsertOnSubmit(uni);
db.Students.InsertOnSubmit(new Student { Name = "Ana", Gender = "female", University = uni });
db.SubmitChanges();                                    // generates and runs INSERTs

// Query (translated to SQL)
var techStudents = from s in db.Students
                   where s.University.Name == "Tech U"
                   select s;

// Associative table (many-to-many): Student ↔ StudentCourse ↔ Course
var anasCourses = from sc in db.StudentCourses
                  where sc.Student.Name == "Ana"
                  select sc.Course;

// Update
var ana = db.Students.First(s => s.Name == "Ana");
ana.Name = "Ana Maria";
db.SubmitChanges();

// Delete
db.Students.DeleteOnSubmit(ana);
db.SubmitChanges();
```

::: warning Status
LINQ to SQL is SQL Server-only and **.NET Framework only**. It's not available in modern .NET. Recognize it in legacy code, but use **EF Core** for anything new. The concepts (context, tracked entities, save changes) carry over directly.
:::

## Entity Framework Core <Badge type="tip" text="extra" />

> The modern ORM: a `DbContext` with `DbSet<T>` properties; LINQ on `IQueryable<T>` becomes SQL; `SaveChangesAsync` persists tracked changes.

```csharp
public class UniversityContext(DbContextOptions<UniversityContext> options) : DbContext(options)
{
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Course> Courses => Set<Course>();
}

public class Student
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public List<Course> Courses { get; set; } = [];   // many-to-many: EF creates the join table
}

// Query: Include loads related data; AsNoTracking for read-only queries
var students = await db.Students
    .AsNoTracking()
    .Include(s => s.Courses)
    .Where(s => s.Courses.Any(c => c.Title == "Algorithms"))
    .OrderBy(s => s.Name)
    .Select(s => new { s.Name, Courses = s.Courses.Count })   // projection → SELECT only those columns
    .ToListAsync();

// Insert / update / delete
db.Students.Add(new Student { Name = "Ana" });
var bruno = await db.Students.FindAsync(2);
bruno!.Name = "Bruno S.";                              // change tracking detects it
db.Students.Remove(oldStudent);
await db.SaveChangesAsync();                           // one transaction

// Bulk operations without loading entities (EF Core 7)
await db.Students.Where(s => s.LastLogin < cutoff).ExecuteDeleteAsync();
```

**`IEnumerable` vs `IQueryable`:** `IQueryable` builds an expression tree that the provider translates to SQL, so filters run **in the database**. Calling `.AsEnumerable()` or `.ToList()` too early pulls everything into memory and filters there.

::: tip When to use
Default data access for CRUD apps and APIs. Drop to raw SQL (`FromSql`, Dapper) for complex reports or performance-critical queries.
:::
