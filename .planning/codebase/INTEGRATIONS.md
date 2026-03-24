# External Integrations

## APIs

| API | Purpose | Auth Method |
|-----|---------|-------------|
| **Laravel REST API** | Print job management | Sanctum Bearer token |
| **Print Agent Polling** | Fetch pending print jobs | Printer UUID identifier |

## Third-Party Services

| Service | Purpose | Config |
|---------|---------|--------|
| **SumatraPDF** | PDF printing on Windows | Installed locally, called via CLI |
| **Chromium** | HTML to PDF conversion | Bundled with Electron |

## External Libraries

### Backend (Laravel)

| Library | Purpose | Integration Point |
|---------|---------|-------------------|
| **Laravel Sanctum** | API token authentication | Middleware on API routes |
| **Pest PHP** | Testing framework | Test suite |
| **Laravel Pint** | Code formatting | CLI tool |

### Print Agent (Node.js)

| Library | Purpose | Integration Point |
|---------|---------|-------------------|
| **axios** | HTTP client for API calls | `api-client.js` |
| **puppeteer-core** | HTML→PDF conversion | `html-to-pdf.js` |
| **pdf-to-printer** | PDF printing via SumatraPDF | `pdf-printer.js` |
| **node-thermal-printer** | ESC/POS thermal printing | `windows-printer.js` |
| **winston** | Logging | `logger.js` |

### Desktop App (Electron)

| Library | Purpose | Integration Point |
|---------|---------|-------------------|
| **Electron** | Desktop app framework | `main.js` |
| **electron-builder** | Windows installer creation | Build process |

## Environment Variables

### Backend (.env)

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `APP_NAME` | Application name | No | Laravel |
| `APP_ENV` | Environment (local/production) | Yes | local |
| `APP_KEY` | Encryption key | Yes | - |
| `APP_DEBUG` | Debug mode | No | false |
| `APP_URL` | Application URL | Yes | http://localhost |
| `DB_CONNECTION` | Database driver | Yes | sqlite |
| `DB_DATABASE` | Database path | Yes | database/database.sqlite |
| `SANCTUM_STATEFUL_DOMAINS` | Sanctum domains | No | localhost |

### Print Agent Desktop (.env in %APPDATA%)

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `API_URL` | Laravel API endpoint | Yes | http://127.0.0.1:8000/api |
| `PRINTER_IDENTIFIER` | Printer UUID | Yes | - |
| `PRINTER_NAME` | Printer display name | No | - |
| `PRINTER_TYPE` | Printer type (kitchen/bar/receipt) | Yes | kitchen |
| `PRINTER_INTERFACE` | Windows printer path | Yes | - |
| `POLLING_INTERVAL` | Polling frequency (ms) | No | 3000 |
| `PDF_PAGE_FORMAT` | PDF page size | No | A4 |
| `PDF_ORIENTATION` | PDF orientation | No | portrait |
| `PDF_MARGIN` | PDF margins | No | 10mm |
| `LOG_LEVEL` | Logging level | No | info |

## API Endpoints

### Authentication

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/printers/register` | POST | Register new printer | None |

### Printers

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/printers` | GET | List all printers | Token |
| `/api/printers/{id}` | GET | Get printer details | Token |
| `/api/printers/register` | POST | Register printer | None |

### Orders

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/orders` | POST | Create order | Token |
| `/api/orders` | GET | List orders | Token |
| `/api/orders/{id}` | GET | Get order details | Token |

### Print Jobs

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/print-jobs` | POST | Create direct print job | Token |
| `/api/print-jobs/pending` | GET | Get pending jobs | Printer UUID |
| `/api/print-jobs/{id}/complete` | PATCH | Mark job as completed | Printer UUID |

## External Service Dependencies

### SumatraPDF

**Purpose:** PDF printing on Windows

**Installation:**
- Automatically installed by `pdf-to-printer` package
- Located in `node_modules/pdf-to-printer/dist/SumatraPDF.exe`

**Usage:**
```javascript
const ptp = require('pdf-to-printer');
await ptp.print(pdfPath, { printer: printerName });
```

**Requirements:**
- Windows OS
- Printer installed and accessible

### Chromium (via Electron)

**Purpose:** HTML to PDF conversion

**Integration:**
- Bundled with Electron
- Accessed via `puppeteer-core`
- No separate installation needed

**Usage:**
```javascript
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: chromiumPath
});
```

## Network Communication

### Polling Pattern

**Flow:**
1. Print Agent → GET `/api/print-jobs/pending?printer_identifier=UUID`
2. Laravel API → Returns JSON array of pending jobs
3. Print Agent → Processes jobs locally
4. Print Agent → PATCH `/api/print-jobs/{id}/complete`

**Frequency:** Configurable (default 3000ms)

**Error Handling:**
- Network errors: Retry with exponential backoff
- API errors: Log and continue polling
- Print errors: Log and mark job as failed

## Security Considerations

### API Security

- **Authentication:** Sanctum token-based
- **Authorization:** Printer UUID matching
- **HTTPS:** Recommended for production
- **Rate Limiting:** Not implemented (future)

### Desktop App Security

- **IPC Security:** Context isolation enabled
- **Node Integration:** Disabled in renderer
- **Preload Script:** Secure bridge between main/renderer
- **Config Storage:** %APPDATA% (user-specific)

## Configuration Management

### Backend

**File:** `.env`
**Location:** Project root
**Management:** Manual editing or `php artisan env:set`

### Desktop App

**File:** `.env`
**Location:** `%APPDATA%/cacimbo-print-agent-desktop/`
**Management:** GUI configuration screen

## Monitoring & Logging

### Backend

**Tool:** Laravel Log
**Location:** `storage/logs/laravel.log`
**Levels:** emergency, alert, critical, error, warning, notice, info, debug

### Print Agent

**Tool:** Winston
**Location:** `%APPDATA%/cacimbo-print-agent-desktop/logs/`
**Files:**
- `agent.log` - All logs
- `error.log` - Errors only

**Levels:** error, warn, info, debug

## Future Integrations

- [ ] Webhook support for real-time notifications
- [ ] Cloud storage for print job history
- [ ] Email notifications for failed jobs
- [ ] Metrics/analytics service (e.g., Sentry)
- [ ] Auto-update service for desktop app
