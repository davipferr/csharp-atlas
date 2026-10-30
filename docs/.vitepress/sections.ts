// Single source of truth for the site structure.
// Used by the sidebar (config.mts) and by the feature index loader (features.data.ts).

export interface Page {
  text: string
  link: string
}

export interface Section {
  text: string
  icon: string
  description: string
  items: Page[]
}

export const sections: Section[] = [
  {
    text: 'Fundamentals',
    icon: '🧱',
    description: '.NET, compilation, data types, numbers, conversions and strings.',
    items: [
      { text: '.NET, Compilation & Projects', link: '/fundamentals/dotnet-and-projects' },
      { text: 'Data Types', link: '/fundamentals/data-types' },
      { text: 'Numbers & Culture', link: '/fundamentals/numbers' },
      { text: 'Type Conversions', link: '/fundamentals/conversions' },
      { text: 'Strings & Chars', link: '/fundamentals/strings' }
    ]
  },
  {
    text: 'Control Flow',
    icon: '🔀',
    description: 'Operators, conditionals, switch, pattern matching and loops.',
    items: [
      { text: 'Operators', link: '/control-flow/operators' },
      { text: 'Conditionals & Switch', link: '/control-flow/conditionals' },
      { text: 'Loops & Console', link: '/control-flow/loops' }
    ]
  },
  {
    text: 'Collections',
    icon: '📦',
    description: 'Arrays, lists, dictionaries and the legacy collections.',
    items: [
      { text: 'Arrays', link: '/collections/arrays' },
      { text: 'Lists', link: '/collections/lists' },
      { text: 'Dictionaries', link: '/collections/dictionaries' },
      { text: 'Legacy & Other Collections', link: '/collections/other-collections' }
    ]
  },
  {
    text: 'Methods',
    icon: '⚙️',
    description: 'Method anatomy, scope, parameters, ref/out/in and recursion.',
    items: [
      { text: 'Methods', link: '/methods/methods' },
      { text: 'Parameters & Arguments', link: '/methods/parameters' }
    ]
  },
  {
    text: 'Object-Oriented Programming',
    icon: '🧩',
    description: 'Classes, constructors, properties, static members and access modifiers.',
    items: [
      { text: 'Classes & Constructors', link: '/oop/classes' },
      { text: 'Properties', link: '/oop/properties' },
      { text: 'Static, Const & Readonly', link: '/oop/static-const-readonly' },
      { text: 'Access Modifiers', link: '/oop/access-modifiers' },
      { text: 'Operator Overloading & Type Checks', link: '/oop/operators-and-type-checks' }
    ]
  },
  {
    text: 'Inheritance & Polymorphism',
    icon: '🌳',
    description: 'Base classes, overriding, abstract classes, interfaces and polymorphism.',
    items: [
      { text: 'Inheritance', link: '/inheritance/inheritance' },
      { text: 'Virtual, Override, Sealed & Abstract', link: '/inheritance/overriding' },
      { text: 'Interfaces', link: '/inheritance/interfaces' },
      { text: 'Polymorphism', link: '/inheritance/polymorphism' }
    ]
  },
  {
    text: 'Value Types & Runtime',
    icon: '🧮',
    description: 'Structs, enums, records, DateTime, Math and garbage collection.',
    items: [
      { text: 'Structs, Enums & Records', link: '/types/structs-enums' },
      { text: 'DateTime & Math', link: '/types/datetime-math' },
      { text: 'Memory & Garbage Collection', link: '/types/memory' }
    ]
  },
  {
    text: 'Error Handling',
    icon: '🚨',
    description: 'Exceptions, the call stack, custom exceptions and debugging.',
    items: [
      { text: 'Exceptions', link: '/errors/exceptions' },
      { text: 'Debugging & Logging', link: '/errors/debugging' }
    ]
  },
  {
    text: 'Delegates & Events',
    icon: '📣',
    description: 'Delegates, lambdas, multicast delegates and the event pattern.',
    items: [
      { text: 'Delegates & Lambdas', link: '/delegates/delegates' },
      { text: 'Events', link: '/delegates/events' }
    ]
  },
  {
    text: 'Generics',
    icon: '🧬',
    description: 'Generic classes, methods, constraints, interfaces and generic delegates.',
    items: [
      { text: 'Generics', link: '/generics/generics' },
      { text: 'Action, Func & Predicate', link: '/generics/generic-delegates' }
    ]
  },
  {
    text: 'LINQ',
    icon: '🔎',
    description: 'Querying collections, XML and databases with LINQ.',
    items: [
      { text: 'LINQ Fundamentals', link: '/linq/basics' },
      { text: 'Joining, Grouping & Aggregating', link: '/linq/operators' },
      { text: 'LINQ to XML', link: '/linq/xml' },
      { text: 'LINQ to SQL & EF Core', link: '/linq/databases' }
    ]
  },
  {
    text: 'Data, Files & Text',
    icon: '🗄️',
    description: 'File system, SQL Server with ADO.NET and regular expressions.',
    items: [
      { text: 'Files & Folders', link: '/data/files' },
      { text: 'Databases with ADO.NET', link: '/data/ado-net' },
      { text: 'Regular Expressions', link: '/data/regex' }
    ]
  },
  {
    text: 'Concurrency',
    icon: '🧵',
    description: 'Threads, the thread pool, tasks and async/await.',
    items: [
      { text: 'Threads', link: '/concurrency/threads' },
      { text: 'Tasks & async/await', link: '/concurrency/tasks' }
    ]
  },
  {
    text: 'Architecture & Clean Code',
    icon: '🏛️',
    description: 'Dependency injection, clean code conventions and SOLID.',
    items: [
      { text: 'Dependency Injection', link: '/architecture/dependency-injection' },
      { text: 'Clean Code', link: '/architecture/clean-code' },
      { text: 'SOLID Principles', link: '/architecture/solid' }
    ]
  }
]
