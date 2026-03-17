# .NET Development Best Practices

## ⚠️ CRITICAL FILE ORGANIZATION RULE

**ALWAYS ONE TYPE PER FILE - NO EXCEPTIONS**
- Each class, interface, record, struct, or enum MUST be in its own separate file
- NEVER put multiple classes, interfaces, records, structs, or enums in the same file
  - ❌ WRONG: `SearchService.cs` containing both `SearchOptions` and `SearchResult<T>`
  - ✅ CORRECT: `SearchOptions.cs`, `SearchResult.cs` in separate files
- File names MUST exactly match the type name (e.g., `UserService.cs` for `UserService` class)
- Use appropriate folder structure to organize related files by feature or layer
- When creating DTOs, models, or configuration classes, each must have its own file

## File Organization

**DO NOT create unnecessary documentation files** unless explicitly requested by the user:
- ❌ NEVER create: `QUICK_REFERENCE.md`, `US-XXX_IMPLEMENTATION.md`, `SUMMARY.md`, `CHANGES.md`, etc.
- ❌ NEVER create implementation summaries, quick reference guides, or change logs
- ✅ ONLY create documentation files when the user specifically asks for them
- ✅ Update existing documentation (like README.md) instead of creating new files
- The code itself and existing README.md should be the primary documentation

## Naming Conventions

- **PascalCase** for: classes, interfaces, methods, properties, events, namespaces
- **camelCase** for: private fields, local variables, method parameters
- **Interfaces**: Prefix with `I` (e.g., `IUserService`)
- **Async Methods**: Suffix with `Async` (e.g., `GetUserAsync`)
- **Private Fields**: Prefix with underscore `_` (e.g., `_userRepository`)
- **Constants**: Use PascalCase or UPPER_CASE for public constants

## Code Structure

- Keep classes focused and follow Single Responsibility Principle
- Use meaningful, descriptive names that convey intent
- Prefer composition over inheritance
- Use dependency injection for loose coupling
- Maximum method length: 20-30 lines (extract complex logic into smaller methods)
- Maximum class length: 200-300 lines (consider splitting if larger)

## Async/Await Pattern

- Use `async`/`await` for all I/O-bound operations
- Never use `.Result` or `.Wait()` (causes deadlocks)
- Suffix async methods with `Async`
- Return `Task` or `Task<T>` from async methods
- Use `ConfigureAwait(false)` in library code when appropriate

## Error Handling

- Use specific exception types over generic `Exception`
- Create custom exception classes for domain-specific errors
- Don't catch exceptions you can't handle
- Log exceptions with sufficient context
- Use `try-catch-finally` or `using` statements for resource cleanup

## LINQ and Collections

- Prefer LINQ for readable queries and transformations
- Use `List<T>` for mutable collections, `IReadOnlyList<T>` for immutable
- Return `IEnumerable<T>` when returning collections from methods
- Use `FirstOrDefault()` and check for null instead of `First()` when item might not exist
- Avoid multiple enumeration of `IEnumerable<T>` (materialize with `.ToList()` if needed)

## Null Safety

- Enable nullable reference types at the project level in `.csproj` with `<Nullable>enable</Nullable>` (not per-file)
- Check for null before using reference types
- Use null-conditional operators: `?.` and `??`
- Use `ArgumentNullException.ThrowIfNull()` for parameter validation
- Consider using `required` modifier for required properties (C# 11+)

## Dependency Injection

- Register services in appropriate lifetime scope (Scoped, Transient, Singleton)
- Inject interfaces, not concrete implementations
- Use constructor injection (avoid property injection)
- Keep constructors simple (don't do work in constructors)

## Entity Framework Core

- Use async methods for all database operations
- Use `.AsNoTracking()` for read-only queries
- Include related entities explicitly with `.Include()`
- Use migrations for schema changes
- Configure entities using `IEntityTypeConfiguration<T>` in separate files
- Use indexes for frequently queried properties

## API Development

- Use appropriate HTTP verbs (GET, POST, PUT, PATCH, DELETE)
- Return proper status codes (200, 201, 400, 404, 500, etc.)
- Use DTOs for API contracts (separate from domain entities)
- Implement proper validation using FluentValidation or Data Annotations
- Version APIs appropriately

## Testing

- Write unit tests for business logic
- Use meaningful test names that describe what's being tested
- Follow Arrange-Act-Assert pattern
- Mock external dependencies using interfaces
- Aim for high code coverage on critical paths

## Performance

- Use `StringBuilder` for string concatenation in loops
- Dispose of `IDisposable` objects properly (use `using` statements)
- Avoid boxing/unboxing when possible
- Use `ValueTask<T>` for hot paths when appropriate
- Profile before optimizing (avoid premature optimization)

## Security

- Never store sensitive data in plain text
- Use parameterized queries to prevent SQL injection
- Validate and sanitize all user input
- Use HTTPS for all endpoints
- Implement proper authentication and authorization

## Comments and Documentation

- Write self-documenting code with clear names
- Add XML documentation comments for public APIs
- Comment "why" not "what" (code should be self-explanatory)
- Keep comments up-to-date with code changes
- Document complex algorithms or business rules

## Modern C# Features

- Use records for immutable data structures
- Use pattern matching where appropriate
- Use file-scoped namespaces (C# 10+)
- Use global usings for commonly used namespaces
- Consider primary constructors (C# 12+)
- Use collection expressions where applicable (C# 12+)

## Repository Pattern

- Keep repositories focused on data access only
- Return domain entities from repositories
- Use generic repository pattern with caution (consider specific repositories)
- Async all the way down

## Logging

- Use structured logging (e.g., with Serilog)
- Log at appropriate levels (Trace, Debug, Information, Warning, Error, Critical)
- Include correlation IDs for request tracing
- Don't log sensitive information

## Configuration

- Use `IOptions<T>` pattern for strongly-typed configuration
- Store secrets in secure locations (Azure Key Vault, User Secrets for dev)
- Never commit secrets to source control
- Use environment-specific configuration files
