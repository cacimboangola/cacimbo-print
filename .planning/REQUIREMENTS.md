# Requirements

## Overview

**Project:** Cacimbo Print - Sistema de Impressão Distribuído  
**Defined:** 2026-03-24  
**Total:** 22 requirements (9 v1, 13 v2)  
**Status:** Brownfield project - 12 requirements já validados em produção

## Validated Requirements (Produção)

Estes requisitos já estão implementados e funcionando em produção:

| ID | Requirement | Status |
|----|-------------|--------|
| REQ-001 | API REST para criação de pedidos | ✅ Validated |
| REQ-002 | Registro de impressoras via API | ✅ Validated |
| REQ-003 | Print jobs com status (pending/completed) | ✅ Validated |
| REQ-004 | Polling de jobs pendentes por UUID | ✅ Validated |
| REQ-005 | Impressão térmica ESC/POS | ✅ Validated |
| REQ-006 | Impressão de PDF via SumatraPDF | ✅ Validated |
| REQ-007 | Conversão HTML→PDF via Puppeteer | ✅ Validated |
| REQ-008 | Desktop app Electron com GUI | ✅ Validated |
| REQ-009 | Configuração via interface gráfica | ✅ Validated |
| REQ-010 | System tray integration | ✅ Validated |
| REQ-011 | Logs com Winston | ✅ Validated |
| REQ-012 | 20 testes Pest passando | ✅ Validated |

## v1 Requirements (Melhorias de Produção)

Melhorias críticas identificadas no mapeamento do codebase (CONCERNS.md - Alta Prioridade).

### Confiabilidade

| ID | Requirement | Priority | Phase | Source |
|----|-------------|----------|-------|--------|
| REQ-013 | Retry logic para falhas de impressão | Must | TBD | CONCERNS.md - High Priority #1 |
| REQ-021 | Circuit breaker no polling | Must | TBD | CONCERNS.md - High Priority #10 |

**Rationale:** Sistema em produção precisa se recuperar de falhas automaticamente. Jobs perdidos causam problemas operacionais.

### Validação e UX

| ID | Requirement | Priority | Phase | Source |
|----|-------------|----------|-------|--------|
| REQ-015 | Validação de configuração no desktop app | Must | TBD | CONCERNS.md - High Priority #3 |
| REQ-016 | Consistência de tipos de impressora (kitchen/bar/receipt) | Must | TBD | CONCERNS.md - High Priority #4 |
| REQ-017 | Error boundaries no desktop app | Must | TBD | CONCERNS.md - High Priority #5 |

**Rationale:** Prevenir configurações inválidas e melhorar experiência do usuário. Parceiros precisam de feedback claro.

### Operações

| ID | Requirement | Priority | Phase | Source |
|----|-------------|----------|-------|--------|
| REQ-018 | Rotação de logs (Winston) | Should | TBD | CONCERNS.md - Medium Priority #6 |
| REQ-020 | Paginação em jobs pendentes | Should | TBD | CONCERNS.md - Medium Priority #9 |

**Rationale:** Evitar crescimento infinito de logs e problemas de memória com muitos jobs.

### Segurança

| ID | Requirement | Priority | Phase | Source |
|----|-------------|----------|-------|--------|
| REQ-019 | Rate limiting na API | Should | TBD | CONCERNS.md - Medium Priority #7 |

**Rationale:** Proteger API contra abuso, especialmente endpoint de registro de impressoras.

### Branding

| ID | Requirement | Priority | Phase | Source |
|----|-------------|----------|-------|--------|
| REQ-022 | Ícone customizado para desktop app | Could | TBD | CONCERNS.md - Low Priority #11 |

**Rationale:** Profissionalismo e identidade visual. Baixa prioridade mas melhora percepção.

## v2 Requirements (Melhorias Futuras)

Melhorias importantes mas não críticas para operação atual.

### Documentação

| ID | Requirement | Rationale for v2 |
|----|-------------|------------------|
| REQ-101 | Documentação OpenAPI/Swagger da API | Sistema funciona sem, mas facilita integração futura |

### Escalabilidade

| ID | Requirement | Rationale for v2 |
|----|-------------|------------------|
| REQ-102 | Migração SQLite → PostgreSQL para produção | SQLite funciona para volume atual, migrar quando escalar |
| REQ-103 | Sistema de filas Laravel para background jobs | Polling síncrono suficiente para v1 |
| REQ-104 | Cache Redis para respostas da API | Performance aceitável sem cache |

### Monitoramento

| ID | Requirement | Rationale for v2 |
|----|-------------|------------------|
| REQ-105 | APM/Monitoring (Sentry, New Relic) | Logs Winston suficientes para troubleshooting atual |
| REQ-106 | Métricas e analytics de impressão | Operação funciona sem analytics |

### Automação

| ID | Requirement | Rationale for v2 |
|----|-------------|------------------|
| REQ-107 | Auto-update para desktop app | Instalação manual aceitável, parceiros podem atualizar |
| REQ-108 | Scripts de deployment automatizado | Deploy manual funciona para volume atual |
| REQ-109 | Backup automatizado do banco | Backups manuais suficientes |

### Funcionalidades Avançadas

| ID | Requirement | Rationale for v2 |
|----|-------------|------------------|
| REQ-110 | WebSocket para notificações real-time | Polling 3s suficientemente rápido |
| REQ-111 | Descoberta automática de impressoras | Configuração manual OK, evita complexidade |
| REQ-112 | Cloud-based print job history | Logs locais suficientes |
| REQ-113 | Webhooks para eventos de impressão | Polling pattern resolve o problema atual |

## Out of Scope

Funcionalidades explicitamente excluídas do roadmap atual.

| Item | Reason |
|------|--------|
| **Suporte Linux/macOS** | Foco em Windows onde está o mercado. pdf-to-printer é Windows-only. |
| **Mobile app** | Desktop app resolve o problema. Impressoras são fixas, não móveis. |
| **Multi-idioma (i18n)** | Mercado inicial é português. Adicionar quando expandir. |
| **Impressão em nuvem** | Contradiz arquitetura local. Polling pattern é a solução. |
| **OAuth/SSO** | Sanctum tokens suficientes. Complexidade desnecessária. |
| **Multi-tenant SaaS** | Foco em instalação local por cliente. |
| **Relatórios avançados** | Logs básicos suficientes para troubleshooting. |
| **Gestão de estoque** | Fora do escopo de impressão. |
| **Integração com ERPs** | API REST permite integração, mas não vamos criar conectores específicos. |

## Traceability

Mapeamento de requisitos para fases e planos (será preenchido durante criação do roadmap).

### v1 Requirements

| Requirement | Phase | Plan | Status |
|-------------|-------|------|--------|
| REQ-013 | 1 - Reliability Core | TBD | Pending |
| REQ-021 | 1 - Reliability Core | TBD | Pending |
| REQ-015 | 2 - Desktop App UX | TBD | Pending |
| REQ-016 | 2 - Desktop App UX | TBD | Pending |
| REQ-017 | 2 - Desktop App UX | TBD | Pending |
| REQ-019 | 3 - API Security | TBD | Pending |
| REQ-018 | 4 - Operations | TBD | Pending |
| REQ-020 | 4 - Operations | TBD | Pending |
| REQ-022 | 5 - Polish | TBD | Pending |

### v2 Requirements (Backlog)

| Requirement | Status |
|-------------|--------|
| REQ-101 | Backlog |
| REQ-102 | Backlog |
| REQ-103 | Backlog |
| REQ-104 | Backlog |
| REQ-105 | Backlog |
| REQ-106 | Backlog |
| REQ-107 | Backlog |
| REQ-108 | Backlog |
| REQ-109 | Backlog |
| REQ-110 | Backlog |
| REQ-111 | Backlog |
| REQ-112 | Backlog |
| REQ-113 | Backlog |

## Priority Definitions

- **Must:** Crítico para operação confiável em produção
- **Should:** Importante para qualidade mas não bloqueia operação
- **Could:** Desejável mas pode ser adiado

## Notes

- Sistema já está em produção com 12 requisitos validados
- v1 foca em **confiabilidade, validação e segurança**
- v2 foca em **escalabilidade, automação e features avançadas**
- Requisitos baseados em análise técnica do codebase (CONCERNS.md)
- Priorização considera impacto operacional vs esforço de implementação

---
*Last updated: 2026-03-24 after codebase mapping*
