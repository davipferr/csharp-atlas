# LINQ to XML

Reading, querying and creating XML with `System.Xml.Linq`.

## Reading and Querying XML

> `XDocument` and `XElement` load XML into an in-memory tree you can query with normal LINQ operators.

```xml
<!-- students.xml -->
<University name="Tech U">
  <Student id="1" gender="female"><Name>Ana</Name><Age>21</Age></Student>
  <Student id="2" gender="male"><Name>Bruno</Name><Age>19</Age></Student>
</University>
```

```csharp
using System.Xml.Linq;

XDocument doc = XDocument.Load("students.xml");          // or XDocument.Parse(xmlString)

var adults = doc.Descendants("Student")                  // all <Student> at any depth
    .Where(s => (int)s.Element("Age")! >= 20)            // explicit casts convert values
    .Select(s => new
    {
        Id = (int)s.Attribute("id")!,
        Name = s.Element("Name")!.Value,
        Gender = s.Attribute("gender")?.Value
    });

string uniName = doc.Root!.Attribute("name")!.Value;     // Tech U
int count = doc.Root.Elements("Student").Count();        // direct children only
```

::: tip When to use
Legacy integrations and SOAP responses, `.csproj`/config files, RSS feeds, NF-e/XML invoices, SVG. For JSON, use `System.Text.Json` instead.
:::

## Creating and Modifying XML

> Build XML declaratively with nested `XElement`/`XAttribute` constructors (functional construction) and edit the tree in place.

```csharp
var xml = new XElement("Orders",
    orders.Select(o =>
        new XElement("Order",
            new XAttribute("id", o.Id),
            new XElement("Customer", o.Customer),
            new XElement("Total", o.Total))));

xml.Save("orders.xml");

// Modify
var student = doc.Descendants("Student").First(s => (string?)s.Attribute("id") == "2");
student.SetElementValue("Age", 20);
student.Add(new XElement("Email", "bruno@uni.edu"));
student.Attribute("gender")?.Remove();
doc.Root!.Add(new XElement("Student", new XAttribute("id", 3), new XElement("Name", "Carla")));
doc.Save("students.xml");
```

::: tip When to use
Generating XML exports or feeds (sitemaps, invoices), transforming one XML format into another, and patching config files from scripts.
:::
