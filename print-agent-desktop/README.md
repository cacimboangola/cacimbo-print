# Cacimbo Print Agent - Desktop App

Aplicação desktop Windows para o Cacimbo Print Agent. Permite que parceiros instalem e usem o agente de impressão sem conhecimento de Node.js.

## 🎯 Características

- ✅ **Instalador Windows** (.exe) - instalação simples Next → Next → Finish
- ✅ **Interface gráfica** moderna para configuração
- ✅ **System tray** - ícone na bandeja do sistema
- ✅ **Auto-start** - inicia automaticamente com o Windows
- ✅ **Sem dependências** - Node.js e todas dependências empacotadas
- ✅ **Suporte completo** - HTML, PDF e impressão térmica

## 📦 Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm

### Instalação
```bash
npm install
```

### Executar em modo desenvolvimento
```bash
npm start
```

### Build do instalador Windows
```bash
npm run build
```

O instalador será gerado em `dist/Cacimbo-Print-Agent-Setup-1.0.0.exe`

## 🚀 Como Usar

### 1. Instalação
- Execute o instalador `Cacimbo-Print-Agent-Setup-1.0.0.exe`
- Siga o wizard de instalação
- A aplicação iniciará automaticamente após a instalação

### 2. Configuração Inicial
1. A janela de configuração abrirá automaticamente
2. Preencha os campos:
   - **URL da API**: Endereço do servidor Laravel
     - Produção: `https://cacimbo-print-main-so67gi.laravel.cloud/api`
     - Local: `http://192.168.1.100:8000/api`
   - **Identificador da Impressora**: UUID gerado no registro da impressora
   - **Tipo**: Tipo da impressora térmica (Epson, Star, Daruma)
   - **Interface**: Caminho UNC da impressora (ex: `\\COMPUTADOR\IMPRESSORA`)
   - **Intervalo**: Intervalo de polling em ms (padrão: 3000)
3. Configure opções de PDF se necessário
4. Clique em **Testar Conexão** para validar
5. Clique em **Salvar Configuração**

### 3. Iniciar o Agent
- Clique no botão **▶ Iniciar**
- O agent começará a fazer polling de jobs pendentes
- Logs aparecerão na seção de logs

### 4. System Tray
- O ícone do Cacimbo Print Agent aparecerá na bandeja do sistema
- Clique com botão direito para:
  - Abrir configuração
  - Iniciar/Parar agent
  - Sair da aplicação
- Fechar a janela minimiza para a bandeja (não fecha o app)

## 📁 Estrutura do Projeto

```
print-agent-desktop/
├── main.js                 # Processo principal Electron
├── preload.js              # Bridge IPC seguro
├── renderer/               # Interface gráfica
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── agent/                  # Código do print agent
│   ├── index.js
│   ├── printer.js
│   ├── pdf-printer.js
│   ├── html-to-pdf.js
│   ├── api-client.js
│   ├── config.js
│   ├── logger.js
│   └── windows-printer.js
├── build/                  # Assets do instalador
│   └── icon.ico
└── package.json
```

## 🔧 Configuração Avançada

### Arquivo de Configuração
A configuração é salva em:
```
%APPDATA%\cacimbo-print-agent-desktop\.env
```

### Logs
Os logs são salvos em:
```
%APPDATA%\cacimbo-print-agent-desktop\logs\
├── agent.log
└── error.log
```

### Variáveis de Ambiente Suportadas
- `API_URL` - URL da API Laravel
- `PRINTER_IDENTIFIER` - UUID da impressora
- `PRINTER_TYPE` - Tipo da impressora (epson, star, daruma)
- `PRINTER_INTERFACE` - Interface da impressora
- `POLLING_INTERVAL` - Intervalo de polling em ms
- `PDF_PAGE_FORMAT` - Formato da página PDF (A4, Letter, A5, Legal)
- `PDF_ORIENTATION` - Orientação (portrait, landscape)
- `PDF_MARGIN` - Margem do PDF (ex: 10mm, 1cm)

## 🐛 Troubleshooting

### Agent não inicia
1. Verifique se a configuração está salva
2. Teste a conexão com a API
3. Verifique os logs em `%APPDATA%\cacimbo-print-agent-desktop\logs\error.log`

### Impressora não encontrada
1. Verifique se o caminho UNC está correto
2. Teste imprimir manualmente na impressora
3. Verifique permissões de rede

### Jobs não são detectados
1. Verifique se o UUID da impressora está correto
2. Confirme que a impressora está ativa no sistema Laravel
3. Verifique a URL da API

## 📝 Notas Técnicas

- **Tamanho do instalador**: ~400-500MB (inclui Node.js + Chromium para Puppeteer)
- **Plataforma**: Windows 7+ (64-bit)
- **Electron**: v33.0.0
- **Puppeteer**: Usa Chromium embutido para conversão HTML→PDF

## 🔄 Atualização

Para atualizar a aplicação:
1. Baixe o novo instalador
2. Execute o instalador (sobrescreverá a versão antiga)
3. A configuração será preservada

## 📄 Licença

MIT
