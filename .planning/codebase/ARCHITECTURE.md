# Architecture

## Overview

Cacimbo Print é um sistema de impressão distribuído para restaurantes/PDVs. A arquitetura segue o padrão **Client-Server com Polling**, onde:

- **Backend Laravel (VPS)**: API REST que gerencia pedidos e jobs de impressão
- **Print Agent (Local)**: Aplicação Node.js que faz polling da API e imprime localmente
- **Desktop App (Electron)**: Wrapper desktop do Print Agent para facilitar instalação

O sistema resolve o problema de **impressão remota**: PDV na nuvem precisa imprimir em impressoras locais (IP privado) sem VPN ou port forwarding.

## Design Patterns

| Pattern | Where Used | Notes |
|---------|------------|-------|
| **Action Pattern** | `app/Actions/*` | Encapsula lógica de negócio em classes single-purpose |
| **Repository Pattern** | Eloquent Models | Models atuam como repositories (Active Record) |
| **API Resource Pattern** | Controllers | Respostas JSON padronizadas |
| **Form Request Pattern** | `app/Http/Requests/*` | Validação separada dos controllers |
| **Factory Pattern** | `database/factories/*` | Geração de dados fake para testes |
| **Observer Pattern** | Print Job lifecycle | Agent faz polling de mudanças de estado |
| **Strategy Pattern** | Print Agent | Diferentes estratégias de impressão (ESC/POS, PDF, HTML) |

## Architectural Layers

| Layer | Responsibility | Key Files |
|-------|---------------|-----------|
| **API Layer** | HTTP endpoints, validação, autenticação | `app/Http/Controllers/Api/*` |
| **Business Logic** | Regras de negócio, orquestração | `app/Actions/*` |
| **Data Layer** | Persistência, relacionamentos | `app/Models/*` |
| **Print Agent** | Polling, impressão local | `print-agent-desktop/agent/*` |
| **Desktop UI** | Configuração, monitoramento | `print-agent-desktop/renderer/*` |

## Data Flow

### Fluxo Principal (Criação de Pedido)

```
1. PDV/Cliente → POST /api/orders
2. OrderController → CreateOrderAction
3. CreateOrderAction:
   - Cria Order no banco
   - Para cada Printer ativa:
     → CreatePrintJobAction (cria PrintJob com status 'pending')
4. Response: Order criado com PrintJobs associados
```

### Fluxo de Impressão (Polling)

```
1. Print Agent (local) → GET /api/print-jobs/pending?printer_identifier=UUID
2. PrintJobController → GetPendingPrintJobsAction
3. Response: Lista de PrintJobs pendentes
4. Print Agent:
   - Detecta tipo de conteúdo (HTML/PDF/Order)
   - Imprime localmente (ESC/POS, PDF, ou HTML→PDF)
   - PATCH /api/print-jobs/{id}/complete
5. PrintJobController → MarkPrintJobAsCompletedAction
6. PrintJob.status = 'completed'
```

### Fluxo de Impressão Direta (HTML/PDF)

```
1. Sistema → POST /api/print-jobs
2. PrintJobController → CreateDirectPrintJobAction
3. CreateDirectPrintJobAction:
   - Cria PrintJob sem Order (order_id nullable)
   - content = { type: 'html'|'pdf', content: '...' }
4. Print Agent detecta e imprime
```

## Component Architecture

### Backend (Laravel)

```
app/
├── Actions/               # Business logic
│   ├── Orders/
│   │   └── CreateOrderAction
│   └── PrintJobs/
│       ├── CreatePrintJobAction
│       ├── CreateDirectPrintJobAction
│       ├── GetPendingPrintJobsAction
│       └── MarkPrintJobAsCompletedAction
├── Http/
│   ├── Controllers/Api/   # API endpoints
│   │   ├── OrderController
│   │   ├── PrintJobController
│   │   └── PrinterController
│   └── Requests/          # Validation
│       ├── StoreOrderRequest
│       └── CompletePrintJobRequest
└── Models/                # Eloquent models
    ├── Order
    ├── PrintJob
    └── Printer
```

### Print Agent (Node.js)

```
print-agent-desktop/agent/
├── index.js              # Main polling loop
├── printer.js            # Print dispatcher (detecta tipo)
├── pdf-printer.js        # PDF printing (SumatraPDF)
├── html-to-pdf.js        # HTML→PDF (Puppeteer)
├── windows-printer.js    # ESC/POS thermal printing
├── api-client.js         # HTTP client para Laravel API
├── config.js             # Configuração (.env)
└── logger.js             # Winston logging
```

### Desktop App (Electron)

```
print-agent-desktop/
├── main.js               # Electron main process
├── preload.js            # IPC bridge (segurança)
└── renderer/             # UI (HTML/CSS/JS)
    ├── index.html
    ├── styles.css
    └── app.js
```

## External Services Integration

| Service | Purpose | Integration Point |
|---------|---------|-------------------|
| **Laravel Sanctum** | API token authentication | Middleware em rotas API |
| **SumatraPDF** | PDF printing no Windows | `pdf-printer.js` via `pdf-to-printer` |
| **Chromium** | HTML→PDF conversion | `html-to-pdf.js` via `puppeteer-core` |
| **Electron** | Desktop app wrapper | Gerencia processo Node.js do agent |

## Communication Patterns

### API Authentication

- **Sanctum token-based**: Header `Authorization: Bearer {token}`
- Printer identifier: Query param `?printer_identifier=UUID`

### Polling Strategy

- Intervalo configurável (padrão: 3000ms)
- GET `/api/print-jobs/pending` retorna apenas jobs `status=pending`
- Agent processa e marca como `completed`

### Error Handling

- Laravel: Exceptions → JSON responses
- Print Agent: Winston logging + retry logic
- Desktop App: IPC events para UI feedback

## Scalability Considerations

- **Horizontal**: Múltiplos print agents (diferentes impressoras)
- **Vertical**: Polling interval ajustável para reduzir carga
- **Database**: Indexes em `printer_id`, `status`, `created_at`
- **Caching**: Não implementado (stateless API)

## Security Architecture

- **Authentication**: Sanctum tokens
- **Authorization**: Printer identifier matching
- **Input Validation**: Form Requests
- **SQL Injection**: Eloquent ORM (prepared statements)
- **XSS**: Blade escaping automático
- **CSRF**: Não aplicável (API stateless)
