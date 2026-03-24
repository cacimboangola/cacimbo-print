# Coding Conventions

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **PHP Classes** | PascalCase | `CreateOrderAction`, `PrintJobController` |
| **PHP Methods** | camelCase | `handle()`, `dispatchPrintJobs()` |
| **PHP Variables** | camelCase | `$printerId`, `$order` |
| **Database Tables** | snake_case (plural) | `printers`, `print_jobs`, `orders` |
| **Database Columns** | snake_case | `table_number`, `is_active`, `created_at` |
| **Routes** | kebab-case | `/api/print-jobs`, `/api/printers/register` |
| **Actions** | Verb + Noun + Action | `CreateOrderAction`, `GetPendingPrintJobsAction` |
| **Controllers** | Noun + Controller | `OrderController`, `PrintJobController` |
| **Models** | Singular PascalCase | `Order`, `PrintJob`, `Printer` |
| **JS Files** | kebab-case | `api-client.js`, `html-to-pdf.js` |
| **JS Functions** | camelCase | `convertHTMLtoPDF()`, `printJob()` |
| **JS Constants** | UPPER_SNAKE_CASE | `CONFIG_PATH`, `API_URL` |

## Code Style

### PHP (PSR-12)

- **Indentation**: 4 spaces
- **Line length**: Soft limit 120 chars
- **Braces**: Opening brace on same line for methods/functions
- **Visibility**: Always declare (public/private/protected)
- **Type hints**: Always use strict types
- **Readonly**: Use `readonly` for immutable classes
- **Final**: Use `final` for classes not meant to be extended

**Example:**
```php
final readonly class CreateOrderAction
{
    public function __construct(private CreatePrintJobAction $action) {}

    public function handle(array $data): Order
    {
        // Implementation
    }
}
```

### JavaScript (ES2020+)

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Arrow functions**: Preferred for callbacks
- **Async/await**: Preferred over promises

**Example:**
```javascript
async function loadConfig() {
  try {
    const config = await window.electronAPI.getConfig();
    // Implementation
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## File Organization

### PHP

- **One class per file**
- **Namespace matches directory structure**
- **Imports at top, alphabetically sorted**
- **Actions in `app/Actions/{Domain}/`**
- **Controllers in `app/Http/Controllers/Api/`**

### JavaScript

- **Exports at bottom of file**
- **Requires at top**
- **Group by: node modules, local modules**

## Documentation

### PHP DocBlocks

```php
/**
 * Create a new order and dispatch print jobs.
 *
 * @param array<string, mixed> $data
 * @return Order
 */
public function handle(array $data): Order
```

### JavaScript JSDoc

```javascript
/**
 * Converte conteúdo HTML para um arquivo PDF.
 * @param {string} htmlContent - Conteúdo HTML completo
 * @param {object} options - Opções de configuração
 * @returns {Promise<string|null>} Caminho do arquivo PDF
 */
async function convertHTMLtoPDF(htmlContent, options = {})
```

## Testing Conventions

### Test Naming

- **Feature tests**: `{Feature}ApiTest.php`
- **Test methods**: `it('description in natural language')`
- **Factories**: Match model name + `Factory`

**Example:**
```php
it('creates order with print jobs for active printers', function () {
    // Arrange
    $printer = Printer::factory()->create(['is_active' => true]);
    
    // Act
    $response = $this->postJson('/api/orders', $data);
    
    // Assert
    $response->assertCreated();
});
```

## API Conventions

### Response Format

```json
{
  "message": "Success message",
  "data": { /* resource */ }
}
```

### Error Format

```json
{
  "message": "Error message",
  "errors": { /* validation errors */ }
}
```

### HTTP Status Codes

- `200 OK`: Successful GET/PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing/invalid token
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation failed

## Git Conventions

### Commit Messages

Format: `type: description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

**Examples:**
- `feat: add HTML/PDF print support`
- `fix: resolve N+1 query in print jobs`
- `docs: update API documentation`

## Environment Variables

- **Naming**: UPPER_SNAKE_CASE
- **Required vars**: Documented in `.env.example`
- **Secrets**: Never commit to git

## Formatting Tools

| Tool | Config | Purpose |
|------|--------|---------|
| **Laravel Pint** | `pint.json` | PHP code formatting (PSR-12) |
| **Prettier** | `.prettierrc` | JS/JSON formatting (if configured) |
| **EditorConfig** | `.editorconfig` | Cross-editor consistency |

## Linting

| Tool | Config | Purpose |
|------|--------|---------|
| **Pint** | Built-in | PHP style enforcement |
| **Pest** | `phpunit.xml` | Test runner with type checking |

## Best Practices

### PHP

- ✅ Use Actions for business logic
- ✅ Use Form Requests for validation
- ✅ Use Eloquent relationships
- ✅ Type hint everything
- ✅ Use `final readonly` for immutable classes
- ❌ No business logic in controllers
- ❌ No raw SQL queries (use Eloquent)
- ❌ No magic numbers (use constants)

### JavaScript

- ✅ Use async/await
- ✅ Handle errors with try/catch
- ✅ Log errors with Winston
- ✅ Use const by default
- ❌ No callback hell
- ❌ No global variables
- ❌ No console.log in production

### Database

- ✅ Use migrations for schema changes
- ✅ Use factories for test data
- ✅ Add indexes for foreign keys
- ✅ Use soft deletes when appropriate
- ❌ No direct schema modifications
- ❌ No data in migrations (use seeders)
