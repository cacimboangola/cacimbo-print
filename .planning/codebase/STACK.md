# Technology Stack

## Languages

| Language | Version | Usage |
|----------|---------|-------|
| PHP | ^8.2 | Backend API (Laravel) |
| JavaScript | ES2020+ | Print Agent (Node.js), Frontend build |
| Blade | - | Laravel templating |

## Frameworks

| Framework | Version | Purpose |
|-----------|---------|---------|
| Laravel | ^12.0 | Backend REST API framework |
| Vite | ^7.0.7 | Frontend build tool |
| Tailwind CSS | ^4.0.0 | CSS framework |
| Electron | ^33.0.0 | Desktop app wrapper (print-agent-desktop) |

## Dependencies

### Backend (Production)

| Package | Version | Purpose |
|---------|---------|---------|
| laravel/framework | ^12.0 | Core framework |
| laravel/sanctum | ^4.0 | API authentication (token-based) |
| laravel/tinker | ^2.10.1 | REPL for debugging |

### Backend (Development)

| Package | Version | Purpose |
|---------|---------|---------|
| pestphp/pest | ^3.8 | Testing framework |
| pestphp/pest-plugin-laravel | ^3.2 | Laravel integration for Pest |
| laravel/pint | ^1.24 | Code style fixer (PSR-12) |
| laravel/sail | ^1.41 | Docker development environment |
| laravel/pail | ^1.2.2 | Log viewer |
| fakerphp/faker | ^1.23 | Fake data generation for tests |
| mockery/mockery | ^1.6 | Mocking framework |
| nunomaduro/collision | ^8.6 | Error handler for CLI |

### Frontend (Development)

| Package | Version | Purpose |
|---------|---------|---------|
| @tailwindcss/vite | ^4.0.0 | Tailwind CSS Vite plugin |
| axios | ^1.11.0 | HTTP client |
| concurrently | ^9.0.1 | Run multiple commands |
| laravel-vite-plugin | ^2.0.0 | Laravel integration for Vite |

### Desktop App (print-agent-desktop)

| Package | Version | Purpose |
|---------|---------|---------|
| electron | ^33.0.0 | Desktop app framework |
| electron-builder | ^25.1.0 | Build Windows installer |
| electron-packager | ^17.1.2 | Package app for distribution |
| axios | ^1.7.0 | HTTP client for API calls |
| puppeteer-core | ^24.40.0 | HTML to PDF conversion |
| pdf-to-printer | ^5.7.0 | PDF printing via SumatraPDF |
| node-thermal-printer | ^4.4.0 | ESC/POS thermal printer support |
| winston | ^3.14.0 | Logging library |

## Build Tools

| Tool | Config File | Purpose |
|------|-------------|---------|
| Composer | composer.json | PHP dependency management |
| npm | package.json | JavaScript dependency management |
| Vite | vite.config.js | Frontend bundling |
| Pest | phpunit.xml | Testing |
| Pint | pint.json | Code formatting |
| Electron Builder | package.json (build section) | Desktop app packaging |

## Runtime Environments

| Environment | Version | Purpose |
|-------------|---------|---------|
| PHP | 8.2+ | Backend runtime |
| Node.js | 20.18.3 | Print agent runtime |
| MySQL/SQLite | - | Database |

## External Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| SumatraPDF | PDF printing on Windows | Via pdf-to-printer package |
| Chromium | HTML to PDF conversion | Via puppeteer-core (bundled with Electron) |
