# Roadmap

## Overview

**Project:** Cacimbo Print - Sistema de Impressão Distribuído  
**Milestone:** v1.1 (Production Improvements)  
**Created:** 2026-03-24  
**Phases:** 5 phases  
**Status:** Planning

## Progress

```
Phase 1  ░░░░░░░░░░  0%  (Reliability Core)
Phase 2  ░░░░░░░░░░  0%  (Desktop App UX)
Phase 3  ░░░░░░░░░░  0%  (API Security)
Phase 4  ░░░░░░░░░░  0%  (Operations)
Phase 5  ░░░░░░░░░░  0%  (Polish)
```

## Phases

### Phase 1: Reliability Core

**Goal:** Print agent se recupera automaticamente de falhas sem perder jobs ou sobrecarregar a API.

**Requirements:** REQ-013, REQ-021

**Success Criteria:**
- [ ] Print jobs com falha são automaticamente retentados (3x com backoff exponencial)
- [ ] Circuit breaker detecta API offline e pausa polling temporariamente
- [ ] Logs mostram claramente retry attempts e circuit breaker state
- [ ] Testes automatizados validam retry logic e circuit breaker
- [ ] Jobs não são perdidos mesmo com falhas temporárias de rede ou impressora

**Research flag:** None (padrões conhecidos)

**Complexity:** Medium  
**Est. Plans:** 2-3 plans

**Rationale:** Confiabilidade é crítica para produção. Falhas de rede/impressora são comuns e o sistema precisa se recuperar sozinho.

---

### Phase 2: Desktop App UX

**Goal:** Usuários não conseguem salvar configurações inválidas e recebem feedback claro sobre erros.

**Requirements:** REQ-015, REQ-016, REQ-017

**Depends on:** None (independente)

**Success Criteria:**
- [ ] Validação em tempo real de campos de configuração (API URL, printer interface, etc)
- [ ] Tipos de impressora consistentes em todo sistema (kitchen/bar/receipt)
- [ ] Error boundaries capturam crashes do renderer e mostram UI de recuperação
- [ ] Mensagens de erro claras e acionáveis (não stack traces)
- [ ] Impossível salvar config com valores inválidos

**Research flag:** None (validação padrão)

**Complexity:** Medium  
**Est. Plans:** 3 plans

**Rationale:** Parceiros instalam o sistema e precisam de feedback claro. Configurações inválidas causam suporte desnecessário.

---

### Phase 3: API Security

**Goal:** API protegida contra abuso com rate limiting em endpoints públicos.

**Requirements:** REQ-019

**Depends on:** None (independente)

**Success Criteria:**
- [ ] Rate limiting implementado em rotas públicas (registro de impressoras)
- [ ] Throttling configurável via .env (requests por minuto)
- [ ] Headers de rate limit retornados (X-RateLimit-Limit, X-RateLimit-Remaining)
- [ ] Testes validam rate limiting funciona corretamente
- [ ] Logs registram tentativas de abuso

**Research flag:** None (Laravel throttle middleware)

**Complexity:** Low  
**Est. Plans:** 1-2 plans

**Rationale:** Endpoint de registro é público e pode ser abusado. Rate limiting é proteção básica necessária.

---

### Phase 4: Operations

**Goal:** Logs não crescem infinitamente e API não trava com muitos jobs pendentes.

**Requirements:** REQ-018, REQ-020

**Depends on:** None (independente)

**Success Criteria:**
- [ ] Winston configurado com rotação diária de logs (max 7 dias)
- [ ] Logs antigos automaticamente comprimidos e deletados
- [ ] Endpoint /api/print-jobs/pending retorna paginado (20 por página)
- [ ] Desktop app lida com paginação corretamente
- [ ] Performance mantida mesmo com 1000+ jobs pendentes

**Research flag:** None (winston-daily-rotate-file, Laravel pagination)

**Complexity:** Low  
**Est. Plans:** 2 plans

**Rationale:** Operação de longo prazo requer manutenção automática. Logs infinitos enchem disco, muitos jobs travam memória.

---

### Phase 5: Polish

**Goal:** Desktop app tem identidade visual profissional com ícone customizado.

**Requirements:** REQ-022

**Depends on:** None (independente)

**Success Criteria:**
- [ ] Ícone .ico criado para Windows (múltiplos tamanhos: 16x16, 32x32, 48x48, 256x256)
- [ ] Ícone aplicado no Electron (window icon, tray icon, installer)
- [ ] Ícone visível no taskbar, alt-tab, e system tray
- [ ] Build process inclui ícone automaticamente

**Research flag:** None (design + electron-builder config)

**Complexity:** Low  
**Est. Plans:** 1 plan

**Rationale:** Profissionalismo e branding. Baixa prioridade mas melhora percepção do produto.

---

## Requirement Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-013 | 1 | Pending |
| REQ-021 | 1 | Pending |
| REQ-015 | 2 | Pending |
| REQ-016 | 2 | Pending |
| REQ-017 | 2 | Pending |
| REQ-019 | 3 | Pending |
| REQ-018 | 4 | Pending |
| REQ-020 | 4 | Pending |
| REQ-022 | 5 | Pending |

**Coverage:** 9/9 v1 requirements mapped (100%)

## Timeline Estimate

| Phase | Complexity | Est. Plans | Est. Time |
|-------|------------|------------|-----------|
| 1 - Reliability Core | Medium | 2-3 | 2-3 days |
| 2 - Desktop App UX | Medium | 3 | 2-3 days |
| 3 - API Security | Low | 1-2 | 1 day |
| 4 - Operations | Low | 2 | 1-2 days |
| 5 - Polish | Low | 1 | 0.5 day |

**Total:** ~7-10 days for v1.1 milestone

## Execution Strategy

**Mode:** YOLO (auto-approve)  
**Depth:** Standard (5 phases, 9-11 plans total)

**Recommended order:**
1. Phase 1 (Reliability) - Crítico para produção
2. Phase 2 (UX) - Previne problemas de suporte
3. Phase 3 (Security) - Proteção básica
4. Phase 4 (Operations) - Manutenção de longo prazo
5. Phase 5 (Polish) - Nice to have

**Parallel execution possible:**
- Phases 1, 2, 3, 4 são independentes
- Podem ser executadas em qualquer ordem
- Phase 5 pode ser executada a qualquer momento

## Notes

- Sistema já está em produção (12 requisitos validados)
- v1.1 foca em **confiabilidade, UX e operações**
- Todas as fases são melhorias incrementais (não breaking changes)
- Testes existentes (20 Pest tests) devem continuar passando
- Cada fase deve incluir testes para novos comportamentos

---
*Last updated: 2026-03-24 after requirements definition*
