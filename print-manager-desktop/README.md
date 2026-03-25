# Cacimbo Print Manager

Aplicação desktop para VPS que monitora uma pasta de impressão e envia automaticamente PDFs para a API Laravel, permitindo impressão remota em impressoras locais.

## 🎯 Objetivo

Esta aplicação resolve o problema de imprimir do VPS (IP público) para impressoras locais (IP privado) sem VPN ou port forwarding.

## 🏗️ Arquitetura

```
VPS (Windows - Contabo)
├── ERP Sistema
│   └── Imprime para "Impressora Virtual"
│
├── Print Manager Desktop (esta aplicação)
│   └── Monitora pasta de impressão
│   └── Envia PDFs via API Laravel
│
└── API Laravel

──────────────────────────────────────

PC Local (Restaurante)
└── Print Agent Desktop
    └── Faz polling da API
    └── Imprime localmente
```

## 📋 Funcionalidades

- ✅ Monitora pasta de impressão em tempo real (File Watcher)
- ✅ Detecta novos PDFs automaticamente
- ✅ Envia PDFs via API Laravel (base64)
- ✅ Move arquivos processados para pasta `processed/`
- ✅ Move arquivos com erro para pasta `failed/`
- ✅ Interface gráfica moderna (Electron)
- ✅ Configuração via UI (sem editar arquivos)
- ✅ System tray integration
- ✅ Logs com Winston
- ✅ Auto-start opcional

## 🚀 Instalação

### 1. Instalar Dependências

```bash
cd print-manager-desktop
npm install
```

### 2. Configurar Impressora Virtual no Windows

1. Abra **Configurações → Dispositivos → Impressoras e scanners**
2. Adicione **Microsoft Print to PDF**
3. Configure para salvar PDFs em: `C:\CacimboPrint\Queue`
4. No seu ERP, selecione esta impressora

### 3. Configurar a Aplicação

1. Inicie a aplicação: `npm start`
2. Vá em **Configuração**
3. Configure:
   - **URL da API**: `http://seu-servidor:8000/api`
   - **UUID da Impressora**: UUID do Print Agent local
   - **Pasta para Monitorar**: `C:\CacimboPrint\Queue`
4. Salve a configuração
5. Clique em **Iniciar** no Dashboard

## 📦 Build para Produção

```bash
npm run build
```

O instalador será gerado em `dist/Cacimbo Print Manager Setup.exe`

## 🔧 Configuração

A configuração é salva em:
```
%APPDATA%\cacimbo-print-manager\config.json
```

Logs são salvos em:
```
%APPDATA%\cacimbo-print-manager\logs\
```

## 📝 Estrutura de Pastas

```
C:\CacimboPrint\Queue\
├── arquivo.pdf          # Arquivos aguardando processamento
├── processed/           # Arquivos enviados com sucesso
│   └── 2026-03-25_arquivo.pdf
└── failed/              # Arquivos com erro
    └── 2026-03-25_arquivo.pdf
```

## 🔄 Fluxo de Trabalho

1. **ERP imprime** → Impressora Virtual → PDF salvo em `Queue/`
2. **Print Manager detecta** novo PDF
3. **Converte para base64** e envia via API
4. **API Laravel** cria print job
5. **Print Agent local** pega o job e imprime
6. **PDF movido** para `processed/`

## 🛠️ Desenvolvimento

```bash
# Modo desenvolvimento
npm run dev

# Build
npm run build

# Build sem instalador
npm run build:dir
```

## 📚 Dependências

- **Electron 33**: Framework desktop
- **Chokidar**: File watcher
- **Axios**: HTTP client
- **Winston**: Logger

## ⚙️ Configurações Avançadas

### Auto-start

Marque a opção "Iniciar watcher automaticamente" na configuração.

### Pasta Customizada

Você pode configurar qualquer pasta para monitoramento, mas certifique-se de que a impressora virtual salva PDFs nela.

## 🐛 Troubleshooting

### Watcher não detecta arquivos

- Verifique se a pasta existe
- Confirme que a impressora virtual salva PDFs na pasta correta
- Verifique os logs em `%APPDATA%\cacimbo-print-manager\logs\`

### Erro ao enviar para API

- Confirme que a URL da API está correta
- Verifique se o UUID da impressora está configurado
- Teste a conexão com a API manualmente

### Arquivos vão para `failed/`

- Verifique os logs para ver o erro específico
- Confirme que o UUID da impressora existe na API
- Teste enviar um PDF manualmente via Postman

## 📄 Licença

MIT
