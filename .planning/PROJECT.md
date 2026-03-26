# Cacimbo Print

## Vision

Sistema de impressão distribuído que permite PDVs/restaurantes na nuvem imprimirem em impressoras locais (IP privado) sem VPN ou port forwarding. Solução elegante para o problema de impressão remota usando polling pattern com agente local.

## Problem Statement

Restaurantes e PDVs que operam sistemas na nuvem (VPS) precisam imprimir comandas e recibos em impressoras térmicas locais que estão em redes privadas. Soluções tradicionais (VPN, port forwarding, impressão em nuvem) são complexas, caras ou não confiáveis. Cacimbo Print resolve isso com um agente local que faz polling da API e imprime localmente.

## Target User

**Primário:** Restaurantes e estabelecimentos comerciais que usam sistemas PDV na nuvem e precisam imprimir localmente.

**Secundário:** Parceiros/revendedores que instalam e configuram o sistema para clientes finais.

**Necessidades:**
- Instalação simples sem conhecimento técnico
- Configuração via interface gráfica
- Suporte para impressoras térmicas ESC/POS
- Impressão de HTML e PDF além de comandas
- Confiabilidade e logs para troubleshooting

## Success Criteria

- ✅ PDV na nuvem cria pedidos via API REST
- ✅ Print agent local detecta jobs pendentes via polling
- ✅ Impressão funciona para ESC/POS, HTML e PDF
- ✅ Desktop app permite configuração sem editar arquivos
- ✅ Parceiros conseguem instalar sem suporte técnico
- ✅ Sistema funciona 24/7 com retry automático em falhas

## Technical Approach

**Stack:**
- **Backend:** Laravel 12 + PHP 8.2 + Sanctum (API REST stateless)
- **Database:** SQLite (dev), MySQL/PostgreSQL (prod)
- **Print Agent:** Node.js 20 + Electron 33 (desktop app)
- **Printing:** pdf-to-printer (SumatraPDF), puppeteer-core (HTML→PDF), node-thermal-printer (ESC/POS)
- **Testing:** Pest PHP (20 testes passando)

**Architecture:**
- Client-Server com Polling Pattern
- Action Pattern para business logic (Laravel)
- Electron wrapper para facilitar instalação
- Stateless API com autenticação via Sanctum tokens

**Constraints:**
- Windows-only para desktop app (por enquanto)
- Polling interval mínimo 1s (carga na API)
- Requer impressora instalada no Windows
- Desktop app ~400MB (inclui Chromium)

## Requirements

### Validated (Produção)
- ✅ REQ-001: API REST para criação de pedidos
- ✅ REQ-002: Registro de impressoras via API
- ✅ REQ-003: Print jobs com status (pending/completed)
- ✅ REQ-004: Polling de jobs pendentes por UUID
- ✅ REQ-005: Impressão térmica ESC/POS
- ✅ REQ-006: Impressão de PDF via SumatraPDF
- ✅ REQ-007: Conversão HTML→PDF via Puppeteer
- ✅ REQ-008: Desktop app Electron com GUI
- ✅ REQ-009: Configuração via interface gráfica
- ✅ REQ-010: System tray integration
- ✅ REQ-011: Logs com Winston
- ✅ REQ-012: 20 testes Pest passando

### Active (Melhorias Identificadas)
- [ ] REQ-013: Retry logic para falhas de impressão
- [ ] REQ-015: Validação de configuração no desktop app
- [ ] REQ-016: Consistência de tipos de impressora
- [ ] REQ-017: Error boundaries no desktop app
- [ ] REQ-018: Rotação de logs (Winston)
- [ ] REQ-019: Rate limiting na API
- [ ] REQ-020: Paginação em jobs pendentes
- [ ] REQ-021: Circuit breaker no polling
- [ ] REQ-022: Ícone customizado para desktop app

### Out of Scope (v1)
- Suporte Linux/macOS — Foco em Windows primeiro
- WebSockets/real-time — Polling suficiente para v1
- Mobile app — Desktop app resolve o problema
- Multi-idioma — Português suficiente para mercado inicial
- Cloud print history — Logs locais suficientes
- Auto-update — Instalação manual aceitável
- Descoberta automática de impressoras — Configuração manual OK
- Analytics/reporting — Foco em funcionalidade core

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Polling vs WebSockets** | Polling é mais simples, funciona com firewalls, suficiente para 3s interval | ✅ Implemented |
| **Electron vs instalador Node.js** | Parceiros não entendem Node.js, Electron empacota tudo | ✅ Implemented |
| **Action Pattern** | Separa business logic dos controllers, testável, reutilizável | ✅ Implemented |
| **Sanctum vs Passport** | Sanctum mais simples para API stateless, sem OAuth complexity | ✅ Implemented |
| **SQLite vs MySQL** | SQLite para dev, MySQL/PostgreSQL para prod | ✅ Implemented |
| **Pest vs PHPUnit** | Pest mais moderno, sintaxe clara, melhor DX | ✅ Implemented |
| **puppeteer-core vs puppeteer** | Core usa Chromium do Electron, evita download duplicado | ✅ Implemented |
| **Portable app vs NSIS installer** | Electron Builder tem problemas de permissão, portable funciona | ✅ Workaround |

## Current State

**Status:** ✅ **Produção** - Sistema funcional com desktop app

**Completed:**
- Backend Laravel API completo
- Print agent com suporte HTML/PDF/ESC/POS
- Desktop app Electron com GUI
- 20 testes Pest passando
- Documentação completa (GUIA-COMPLETO.md)
- Codebase mapeado (7 documentos)

**Next Phase:** Melhorias de produção (segurança, confiabilidade, UX)

---
*Last updated: 2026-03-24 after codebase mapping*
