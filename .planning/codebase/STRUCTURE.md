# Directory Structure

## Root Structure

```
cacimbo-print/
├── app/                          # Laravel application code
│   ├── Actions/                  # Business logic (Action pattern)
│   ├── Http/                     # Controllers, Requests
│   ├── Models/                   # Eloquent models
│   └── Providers/                # Service providers
├── bootstrap/                    # Laravel bootstrap
├── config/                       # Configuration files
├── database/                     # Migrations, factories, seeders
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── print-agent-desktop/          # Electron desktop app
│   ├── agent/                    # Node.js print agent code
│   ├── renderer/                 # UI (HTML/CSS/JS)
│   ├── build/                    # Build assets
│   ├── dist/                     # Compiled app
│   ├── main.js                   # Electron main process
│   └── preload.js                # IPC bridge
├── public/                       # Public web assets
├── resources/                    # Views, CSS, JS
│   ├── css/
│   ├── js/
│   └── views/
├── routes/                       # Route definitions
│   ├── api.php                   # API routes
│   ├── console.php               # Console commands
│   └── web.php                   # Web routes
├── storage/                      # Logs, cache, uploads
├── tests/                        # Pest tests
│   ├── Feature/                  # Feature tests
│   └── Unit/                     # Unit tests
├── vendor/                       # Composer dependencies
├── .planning/                    # GSD planning docs
│   └── codebase/                 # This documentation
├── composer.json                 # PHP dependencies
├── package.json                  # JS dependencies
├── phpunit.xml                   # Test configuration
└── vite.config.js                # Frontend build config
```

## Key Directories

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `app/Actions/` | Business logic encapsulation | CreateOrderAction, CreatePrintJobAction, GetPendingPrintJobsAction |
| `app/Http/Controllers/Api/` | API endpoints | OrderController, PrintJobController, PrinterController |
| `app/Models/` | Database models | Order, PrintJob, Printer |
| `database/migrations/` | Database schema | create_printers_table, create_orders_table, create_print_jobs_table |
| `tests/Feature/` | Integration tests | OrderApiTest, PrintJobApiTest, PrinterApiTest |
| `print-agent-desktop/agent/` | Print agent logic | index.js, printer.js, pdf-printer.js, html-to-pdf.js |
| `print-agent-desktop/renderer/` | Desktop UI | index.html, app.js, styles.css |
| `routes/` | Route definitions | api.php (REST endpoints) |

## Entry Points

| Entry | Type | Purpose |
|-------|------|---------|
| `public/index.php` | Web | Laravel application entry point |
| `artisan` | CLI | Laravel command-line interface |
| `print-agent-desktop/main.js` | Desktop | Electron main process |
| `print-agent-desktop/agent/index.js` | Agent | Print agent polling loop |
| `tests/` | Testing | Pest test suite |

## Configuration Files

| File | Purpose |
|------|---------|
| `composer.json` | PHP dependencies and scripts |
| `package.json` | JS dependencies (Vite, Tailwind) |
| `print-agent-desktop/package.json` | Electron app dependencies |
| `phpunit.xml` | Test configuration |
| `vite.config.js` | Frontend build configuration |
| `.env` | Environment variables (not in git) |
| `.env.example` | Environment template |

## Important Files

| File | Purpose |
|------|---------|
| `routes/api.php` | API route definitions |
| `bootstrap/app.php` | Application bootstrap |
| `config/sanctum.php` | API authentication config |
| `GUIA-COMPLETO.md` | Complete project guide (Portuguese) |
| `README.md` | Project overview |
| `.gitignore` | Git ignore rules |

## Build Artifacts

| Directory | Purpose | Gitignored |
|-----------|---------|------------|
| `vendor/` | Composer packages | ✅ Yes |
| `node_modules/` | npm packages | ✅ Yes |
| `print-agent-desktop/node_modules/` | Electron dependencies | ✅ Yes |
| `print-agent-desktop/dist/` | Built desktop app | ✅ Yes |
| `storage/logs/` | Application logs | ✅ Yes |
| `public/build/` | Compiled frontend assets | ✅ Yes |

## Data Storage

| Location | Purpose |
|----------|---------|
| `database/database.sqlite` | SQLite database (development) |
| `storage/app/` | File uploads |
| `storage/logs/` | Application logs |
| `%APPDATA%/cacimbo-print-agent-desktop/` | Desktop app config (Windows) |
