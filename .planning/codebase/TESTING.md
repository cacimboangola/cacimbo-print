# Testing

## Framework

| Type | Framework | Config |
|------|-----------|--------|
| **Unit** | Pest PHP | `phpunit.xml` |
| **Feature** | Pest PHP | `phpunit.xml` |
| **Integration** | Pest PHP | `phpunit.xml` |

## Test Configuration

**File:** `phpunit.xml`

Key settings:
- Database: SQLite in-memory (`:memory:`)
- Environment: `testing`
- Bootstrap: `vendor/autoload.php`

## Test Location

| Type | Location | Pattern |
|------|----------|---------|
| **Feature** | `tests/Feature/` | `*Test.php` |
| **Unit** | `tests/Unit/` | `*Test.php` |

## Test Structure

### Feature Tests

```
tests/Feature/
├── OrderApiTest.php          # Order creation and management
├── PrintJobApiTest.php       # Print job lifecycle
└── PrinterApiTest.php        # Printer registration and management
```

### Test Coverage

| Domain | Test File | Coverage |
|--------|-----------|----------|
| **Orders** | `OrderApiTest.php` | Create orders, validation, print job dispatch |
| **Print Jobs** | `PrintJobApiTest.php` | Pending jobs, completion, direct print jobs |
| **Printers** | `PrinterApiTest.php` | Registration, listing, activation |

## Running Tests

### All Tests
```bash
php artisan test
```

### Specific Test File
```bash
php artisan test tests/Feature/OrderApiTest.php
```

### Specific Test
```bash
php artisan test --filter="creates order with print jobs"
```

### With Coverage (if configured)
```bash
php artisan test --coverage
```

### Via Composer
```bash
composer test
```

## Test Patterns

### Pest Syntax

```php
it('creates order with print jobs for active printers', function () {
    // Arrange
    $printer = Printer::factory()->create(['is_active' => true]);
    
    $data = [
        'table_number' => 5,
        'items' => [['name' => 'Pizza', 'quantity' => 1]],
        'total' => 25.00,
    ];
    
    // Act
    $response = $this->postJson('/api/orders', $data);
    
    // Assert
    $response->assertCreated();
    expect(PrintJob::count())->toBe(1);
});
```

### Common Assertions

```php
// HTTP Response
$response->assertOk();
$response->assertCreated();
$response->assertNotFound();
$response->assertUnprocessable();

// JSON Structure
$response->assertJsonStructure(['data' => ['id', 'status']]);

// Database
$this->assertDatabaseHas('orders', ['table_number' => 5]);
$this->assertDatabaseCount('print_jobs', 1);

// Pest Expectations
expect($order->status)->toBe('pending');
expect(PrintJob::count())->toBe(1);
```

## Test Data

### Factories

```
database/factories/
├── OrderFactory.php
├── PrinterFactory.php
└── PrintJobFactory.php
```

**Usage:**
```php
// Create single model
$printer = Printer::factory()->create();

// Create with attributes
$printer = Printer::factory()->create(['is_active' => true]);

// Create multiple
$printers = Printer::factory()->count(3)->create();

// Make without saving
$order = Order::factory()->make();
```

## Database Refresh

All tests use `RefreshDatabase` trait:

```php
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);
```

This ensures:
- Fresh database for each test
- Migrations run automatically
- No test pollution

## Test Organization

### Arrange-Act-Assert Pattern

```php
it('marks print job as completed', function () {
    // Arrange: Set up test data
    $printJob = PrintJob::factory()->create(['status' => 'pending']);
    
    // Act: Perform action
    $response = $this->patchJson("/api/print-jobs/{$printJob->id}/complete");
    
    // Assert: Verify results
    $response->assertOk();
    expect($printJob->fresh()->status)->toBe('completed');
});
```

## API Testing

### Authentication

Tests use Sanctum for API authentication:

```php
$user = User::factory()->create();
$token = $user->createToken('test')->plainTextToken;

$response = $this->withToken($token)
    ->postJson('/api/orders', $data);
```

### JSON Validation

```php
$response->assertJson([
    'message' => 'Order created successfully',
    'data' => [
        'table_number' => 5,
        'status' => 'pending',
    ],
]);
```

## Current Test Status

**Total Tests:** 20 (as of last checkpoint)

**Test Files:**
- `OrderApiTest.php` - Order creation and management
- `PrintJobApiTest.php` - Print job lifecycle and polling
- `PrinterApiTest.php` - Printer registration and status

**All tests passing** ✅

## Test Best Practices

### Do's
- ✅ Use factories for test data
- ✅ Test happy path and edge cases
- ✅ Use descriptive test names
- ✅ Keep tests isolated
- ✅ Test API responses and database state
- ✅ Use RefreshDatabase trait

### Don'ts
- ❌ Don't share state between tests
- ❌ Don't use real external services
- ❌ Don't test framework code
- ❌ Don't skip assertions
- ❌ Don't use sleep() for timing

## Continuous Integration

Tests should run on:
- Pre-commit (optional)
- Pull requests
- Main branch pushes

**Command for CI:**
```bash
composer test
```

## Future Testing Improvements

- [ ] Add code coverage reporting
- [ ] Add mutation testing (Infection PHP)
- [ ] Add E2E tests for print agent
- [ ] Add performance tests for polling
- [ ] Add integration tests with real printers (manual)
