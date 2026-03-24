# Twin Development Plan
Generated: 2026-03-24 14:49:00
Task: Criar app desktop do print-agent para Windows que não requer conhecimento de Node.js
Quality Level: pragmatic

## Análise Técnica

### Estado Atual
- **Print Agent**: Aplicação Node.js que roda via `npm start`
- **Dependências**: Node.js 18+, npm, múltiplas dependências (axios, puppeteer, pdf-to-printer, etc.)
- **Configuração**: Via interface web (`npm run config`) ou arquivo `.env`
- **Problema**: Parceiros não entendem de Node.js e precisam de instalação simples

### O Que Precisa Mudar
Criar um executável Windows (.exe) standalone que:
1. Empacota Node.js + todas dependências + código do agent
2. Não requer instalação de Node.js no sistema
3. Instalação via wizard simples (Next → Next → Finish)
4. Interface gráfica para configuração (substituir interface web)
5. Roda como serviço Windows (opcional, inicia com o sistema)

### Constraints Técnicos
- Windows como plataforma alvo
- Puppeteer requer Chromium (grande, ~300MB)
- Executável final será grande (~400-500MB)
- Precisa manter toda funcionalidade atual (HTML/PDF/thermal printing)

## Plano de Implementação

### Tecnologia Escolhida: **Electron**

**Por quê Electron:**
- Empacota Node.js + Chromium automaticamente
- Puppeteer funciona nativamente (usa o Chromium do Electron)
- Interface gráfica nativa com HTML/CSS/JS
- Electron Builder para criar instalador Windows (.exe)
- Suporte a system tray e auto-start
- Amplamente usado (VS Code, Slack, Discord)

**Alternativas descartadas:**
- `pkg` / `nexe`: Não suportam Puppeteer bem
- `node-windows`: Apenas serviço, sem GUI
- Tauri: Requer Rust, mais complexo

### Arquivos a Criar

1. **`print-agent-desktop/package.json`**
   - Configuração Electron
   - Scripts de build
   - Dependências (electron, electron-builder)

2. **`print-agent-desktop/main.js`**
   - Processo principal Electron
   - Gerencia janela de configuração
   - Inicia/para o print agent
   - System tray icon

3. **`print-agent-desktop/preload.js`**
   - Bridge seguro entre renderer e main process
   - Expõe APIs para UI

4. **`print-agent-desktop/renderer/`**
   - `index.html`: Interface de configuração
   - `styles.css`: Estilos da UI
   - `app.js`: Lógica da UI (salvar config, testar conexão)

5. **`print-agent-desktop/agent/`**
   - Copiar todo código atual do print-agent
   - Manter estrutura existente
   - Adaptar apenas paths para funcionar no Electron

6. **`print-agent-desktop/build/`**
   - Ícone da aplicação (.ico)
   - Assets do instalador

### Arquivos a Modificar

1. **`print-agent/config.js`** (copiar e adaptar)
   - Ajustar paths para funcionar no Electron (app.getPath)

2. **`print-agent/logger.js`** (copiar e adaptar)
   - Logs em diretório acessível ao usuário

### Ordem de Implementação

1. **Setup inicial do projeto Electron**
   - Criar estrutura de diretórios
   - Configurar package.json com Electron e electron-builder
   - Criar main.js básico (janela vazia)

2. **Copiar código do print-agent**
   - Copiar todos arquivos .js do print-agent para `agent/`
   - Ajustar imports e paths

3. **Criar interface gráfica de configuração**
   - UI moderna com formulário de configuração
   - Campos: API URL, Printer Identifier, Type, Interface
   - Botões: Salvar, Testar Conexão, Registrar Impressora
   - Status do agent (rodando/parado)

4. **Integrar agent com Electron**
   - Main process inicia agent como child process ou thread
   - IPC para comunicação UI ↔ Agent
   - Logs visíveis na UI

5. **System tray e auto-start**
   - Ícone na bandeja do sistema
   - Menu: Abrir, Iniciar/Parar Agent, Sair
   - Opção para iniciar com Windows

6. **Configurar Electron Builder**
   - Target: Windows (NSIS installer)
   - Incluir todas dependências
   - Configurar ícone e metadata

7. **Build e teste**
   - Gerar instalador .exe
   - Testar instalação em Windows limpo
   - Validar funcionamento completo

### Estrutura Final

```
print-agent-desktop/
├── package.json
├── main.js                 # Electron main process
├── preload.js              # Secure bridge
├── renderer/
│   ├── index.html          # Config UI
│   ├── styles.css
│   └── app.js
├── agent/                  # Print agent code (copiado)
│   ├── index.js
│   ├── printer.js
│   ├── pdf-printer.js
│   ├── html-to-pdf.js
│   ├── api-client.js
│   ├── config.js
│   ├── logger.js
│   └── windows-printer.js
├── build/
│   └── icon.ico
└── dist/                   # Output do build
    └── Cacimbo-Print-Agent-Setup-1.0.0.exe
```

### Riscos Técnicos

1. **Tamanho do executável (~400-500MB)**
   - Mitigation: Normal para apps Electron com Puppeteer
   - Usuários têm banda larga, download único

2. **Puppeteer no Electron**
   - Mitigation: Usar `puppeteer-core` e apontar para Chromium do Electron
   - Alternativa: Manter `puppeteer` standalone (mais simples)

3. **Permissões de impressora no Windows**
   - Mitigation: Instalador pede permissões de admin
   - Agent roda com permissões do usuário

4. **Atualização automática**
   - Não implementar na v1 (pragmatic)
   - Futuro: electron-updater

## Próximo Passo
Para implementar este plano, digite: **ok**, **continue**, ou **approve**
Para cancelar, digite: **cancel** ou inicie uma nova tarefa
