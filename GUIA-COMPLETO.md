# 📖 Guia Completo - Cacimbo Print

Sistema de impressão remota para restaurantes que permite imprimir comandas em impressoras locais a partir de um PDV na nuvem.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Instalação do Backend (Laravel)](#instalação-do-backend-laravel)
4. [Instalação do Agente Local](#instalação-do-agente-local)
5. [Configuração Inicial](#configuração-inicial)
6. [Uso Diário](#uso-diário)
7. [Solução de Problemas](#solução-de-problemas)
8. [API Reference](#api-reference)

---

## 🎯 Visão Geral

### O que é o Cacimbo Print?

Sistema que resolve o problema de **imprimir em impressoras locais** a partir de um **PDV hospedado na nuvem (VPS)**.

### Como Funciona?

```
┌─────────────────┐
│  PDV (VPS)      │  ← Servidor Laravel na internet
│  IP Público     │
└────────┬────────┘
         │ API REST
         │
    ┌────▼────────────────┐
    │  Print Jobs (Fila)  │
    └────┬────────────────┘
         │
         │ Polling (a cada 3s)
         │
┌────────▼────────┐
│  Agente Local   │  ← Aplicação Node.js no PC
│  (PC/Windows)   │
└────────┬────────┘
         │
    ┌────▼──────────┐
    │  Impressoras  │  ← Térmicas USB/Rede
    │  Locais       │
    └───────────────┘
```

**Fluxo:**
1. Garçom cria pedido no PDV (navegador)
2. Laravel cria `PrintJob` na fila
3. Agente local consulta API a cada 3 segundos
4. Agente baixa jobs pendentes e imprime
5. Agente marca job como completo

---

## 🏗️ Arquitetura do Sistema

### Backend (Laravel 12)

**Stack:**
- PHP 8.4
- Laravel 12
- MySQL/SQLite
- API REST (sem autenticação)

**Estrutura:**
```
app/
├── Models/
│   ├── Order.php          # Pedidos/comandas
│   ├── Printer.php        # Impressoras registradas
│   └── PrintJob.php       # Jobs de impressão
├── Actions/
│   ├── Orders/
│   │   └── CreateOrderAction.php
│   └── PrintJobs/
│       ├── CreatePrintJobAction.php
│       ├── GetPendingPrintJobsAction.php
│       └── MarkPrintJobAsCompletedAction.php
└── Http/
    └── Controllers/Api/
        ├── OrderController.php
        ├── PrinterController.php
        └── PrintJobController.php
```

### Agente Local (Node.js)

**Stack:**
- Node.js 18+
- Express (servidor de configuração)
- axios (HTTP client)
- node-thermal-printer (driver ESC/POS)
- winston (logging)

**Estrutura:**
```
print-agent/
├── index.js              # Loop principal de polling
├── config-server.js      # Servidor de configuração web
├── config.js             # Carrega .env
├── api-client.js         # Comunicação com API
├── printer.js            # Driver ESC/POS
├── logger.js             # Sistema de logs
└── public/               # Interface web de configuração
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## 🚀 Instalação do Backend (Laravel)

### Pré-requisitos

- PHP 8.4+
- Composer
- MySQL ou SQLite
- Node.js 18+ (para Vite)

### Passo 1: Clonar/Baixar o Projeto

```bash
cd /caminho/do/projeto
```

### Passo 2: Instalar Dependências

```bash
composer install
npm install
```

### Passo 3: Configurar Ambiente

```bash
cp .env.example .env
php artisan key:generate
```

Edite o `.env`:

```env
APP_NAME="Cacimbo Print"
APP_URL=http://seu-servidor.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cacimbo_print
DB_USERNAME=root
DB_PASSWORD=sua-senha
```

### Passo 4: Executar Migrations

```bash
php artisan migrate
```

Isso criará as tabelas:
- `printers` - Impressoras registradas
- `orders` - Pedidos/comandas
- `print_jobs` - Fila de impressão

### Passo 5: Iniciar Servidor

**Desenvolvimento:**
```bash
composer run dev
# Ou separadamente:
php artisan serve
npm run dev
```

**Produção:**
```bash
npm run build
# Configure nginx/apache para servir o Laravel
```

### Passo 6: Testar API

```bash
curl http://localhost:8000/api/printers
# Deve retornar: {"data":[]}
```

---

## 💻 Instalação do Agente Local

### Pré-requisitos

- Node.js 18+
- Impressora (qualquer tipo: térmica, matricial, jato de tinta, laser, A4, etc.)
- Conexão com internet (para acessar a VPS)

**Tipos de impressora suportados:**
- ✅ **Térmicas ESC/POS** - Recomendado para restaurantes (Epson, Bematech, Elgin, etc.)
- ✅ **Matriciais** - Impressoras de impacto tradicionais
- ✅ **Jato de tinta / Laser** - Impressoras de escritório comuns
- ✅ **A4 / Carta** - Qualquer impressora padrão do Windows/Linux
- ✅ **Rede** - Impressoras conectadas via TCP/IP
- ✅ **USB** - Impressoras conectadas localmente

### Passo 1: Navegar até o Diretório

```bash
cd print-agent
```

### Passo 2: Instalar Dependências

```bash
npm install
```

Isso instalará:
- `express` - Servidor de configuração
- `axios` - Cliente HTTP
- `node-thermal-printer` - Driver ESC/POS
- `open` - Abrir navegador
- `winston` - Logging
- `dotenv` - Variáveis de ambiente

---

## ⚙️ Configuração Inicial

### Opção 1: Interface Web (Recomendado) 🌟

#### Passo 1: Iniciar Servidor de Configuração

```bash
npm run config
```

O navegador abrirá automaticamente em `http://localhost:3001`.

#### Passo 2: Configurar API

1. **URL da API**: Insira a URL do seu servidor Laravel
   - Exemplo: `http://seu-servidor.com/api`
   - Local: `http://localhost:8000/api`

2. **Testar Conexão**: Clique no botão para validar

#### Passo 3: Registrar Impressora

1. **Nome**: Ex: "Cozinha Principal"
2. **Tipo**: Escolha entre:
   - `kitchen` - Cozinha
   - `bar` - Bar
   - `receipt` - Recibo/Caixa

3. **Registrar**: Clique no botão

O sistema criará a impressora na API e preencherá automaticamente o campo **Identificador (UUID)**.

#### Passo 4: Configurar Impressora Local

1. **Tipo da Impressora**: Escolha o driver
   - `epson` - **Impressoras térmicas ESC/POS** (padrão - Epson, Bematech, Elgin, genéricas)
   - `star` - Impressoras Star Micronics
   - `daruma` - Impressoras Daruma
   
   **Nota importante**: 
   - Para **impressoras térmicas de restaurante** (bobina 80mm/58mm): use `epson`
   - Para **impressoras A4/Carta comuns** (jato de tinta, laser): o sistema também funciona! A biblioteca `node-thermal-printer` tentará se adaptar, ou você pode usar comandos de impressão padrão do sistema operacional
   - O driver `epson` funciona com a maioria das impressoras, mesmo não sendo térmicas

2. **Interface**:
   - **USB Windows**: `\\localhost\NomeDaImpressora`
   - **USB Linux**: `/dev/usb/lp0`
   - **Rede**: `tcp://192.168.1.100:9100`

3. **Largura do Papel**: Padrão 48 caracteres

#### Passo 5: Configurações Avançadas (Opcional)

- **Polling Interval**: 3000ms (3 segundos) - padrão
- **Log Level**: info, debug, warn, error

#### Passo 6: Salvar

Clique em **Salvar Configurações**. O arquivo `.env` será criado automaticamente.

#### Passo 7: Fechar e Iniciar

Feche o navegador e execute:

```bash
npm start
```

---

### Opção 2: Configuração Manual

#### Passo 1: Criar .env

```bash
cp .env.example .env
```

#### Passo 2: Editar .env

```env
# URL da API
API_URL=http://seu-servidor.com/api

# UUID da impressora (obter via API)
PRINTER_IDENTIFIER=uuid-aqui

# Tipo: epson, star, daruma
PRINTER_TYPE=epson

# Interface da impressora
PRINTER_INTERFACE=tcp://localhost:9100

# Largura do papel
PRINTER_WIDTH=48

# Polling (ms)
POLLING_INTERVAL=3000

# Log level
LOG_LEVEL=info
```

#### Passo 3: Registrar Impressora via API

```bash
curl -X POST http://seu-servidor.com/api/printers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cozinha Principal",
    "type": "kitchen"
  }'
```

Resposta:
```json
{
  "message": "Impressora registrada com sucesso.",
  "data": {
    "id": 1,
    "name": "Cozinha Principal",
    "identifier": "550e8400-e29b-41d4-a716-446655440000",
    "type": "kitchen",
    "is_active": true
  }
}
```

Copie o `identifier` e cole no `.env`.

#### Passo 4: Iniciar Agente

```bash
npm start
```

---

## 📱 Uso Diário

### Criar Pedido (via API ou Frontend)

**Via API:**

```bash
curl -X POST http://seu-servidor.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "table_number": "5",
    "items": [
      {
        "name": "Frango Grelhado",
        "quantity": 2,
        "price": 2500.00,
        "notes": "Sem pimenta"
      },
      {
        "name": "Cerveja",
        "quantity": 3,
        "price": 500.00
      }
    ],
    "total": 6500.00,
    "notes": "Cliente preferencial"
  }'
```

**Via Frontend (criar sua interface):**

```javascript
fetch('http://seu-servidor.com/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table_number: '5',
    items: [
      { name: 'Frango Grelhado', quantity: 2, price: 2500.00 },
      { name: 'Cerveja', quantity: 3, price: 500.00 }
    ],
    total: 6500.00
  })
});
```

### O que Acontece Automaticamente

1. ✅ Laravel cria o pedido (`Order`)
2. ✅ Laravel cria `PrintJob` para cada impressora ativa
3. ✅ Agente local consulta API a cada 3 segundos
4. ✅ Agente detecta job pendente
5. ✅ Agente imprime na impressora local
6. ✅ Agente marca job como completo

### Monitorar Logs do Agente

Os logs ficam em `print-agent/logs/`:

```bash
# Ver logs gerais
tail -f print-agent/logs/agent.log

# Ver apenas erros
tail -f print-agent/logs/error.log
```

**Exemplo de log:**
```
[2026-03-17 17:55:00] INFO: ========================================
[2026-03-17 17:55:00] INFO:   Cacimbo Print Agent - Iniciando...
[2026-03-17 17:55:00] INFO: ========================================
[2026-03-17 17:55:00] INFO: API URL: http://localhost:8000/api
[2026-03-17 17:55:00] INFO: Impressora: 550e8400-e29b-41d4-a716-446655440000
[2026-03-17 17:55:00] INFO: Tipo: epson
[2026-03-17 17:55:00] INFO: Interface: tcp://localhost:9100
[2026-03-17 17:55:00] INFO: Polling: a cada 3000ms
[2026-03-17 17:55:00] INFO: ----------------------------------------
[2026-03-17 17:55:00] INFO: Impressora conectada e pronta!
[2026-03-17 17:55:00] INFO: Iniciando polling de print jobs...
[2026-03-17 17:55:05] INFO: 1 job(s) pendente(s) encontrado(s)
[2026-03-17 17:55:05] INFO: Processando job #1 (Pedido #5)
[2026-03-17 17:55:06] INFO: Comanda #5 impressa com sucesso (Mesa 5)
[2026-03-17 17:55:06] INFO: Job #1 marcado como completed
```

### Gerenciar Impressoras

**Listar impressoras:**
```bash
curl http://seu-servidor.com/api/printers
```

**Ativar/Desativar impressora:**
```bash
curl -X PATCH http://seu-servidor.com/api/printers/1/toggle
```

**Verificar jobs pendentes:**
```bash
curl "http://seu-servidor.com/api/print-jobs/pending?printer_identifier=seu-uuid"
```

---

## 🔧 Solução de Problemas

### Agente não conecta com a API

**Sintoma:**
```
[ERROR] Não foi possível conectar à API. Servidor offline?
```

**Soluções:**
1. Verifique se o servidor Laravel está rodando
2. Teste a URL manualmente: `curl http://seu-servidor.com/api/printers`
3. Verifique firewall/VPN
4. Confirme `API_URL` no `.env`

### Impressora não detectada

**Sintoma:**
```
[WARN] Impressora NAO detectada. O agente vai continuar tentando...
```

**Soluções:**

**Para USB no Windows:**
1. Compartilhe a impressora:
   - Painel de Controle → Dispositivos e Impressoras
   - Clique direito na impressora → Propriedades da Impressora
   - Aba "Compartilhamento" → Marcar "Compartilhar esta impressora"
2. Use: `\\localhost\NomeDaImpressora` no `.env`

**Para Rede:**
1. Descubra o IP da impressora
2. Use: `tcp://192.168.1.100:9100`
3. Teste ping: `ping 192.168.1.100`

**Para USB no Linux:**
1. Verifique: `ls /dev/usb/`
2. Use: `/dev/usb/lp0`
3. Permissões: `sudo chmod 666 /dev/usb/lp0`

### Jobs não aparecem

**Sintoma:**
Agente roda mas não imprime nada.

**Soluções:**
1. Verifique `PRINTER_IDENTIFIER` no `.env`
2. Confirme que a impressora está ativa:
   ```bash
   curl http://seu-servidor.com/api/printers
   # Verifique "is_active": true
   ```
3. Crie um pedido de teste
4. Verifique logs: `tail -f logs/agent.log`

### Impressão com caracteres estranhos

**Sintoma:**
Comanda imprime mas com símbolos estranhos.

**Soluções:**
1. Verifique o tipo da impressora no `.env`:
   - **Maioria das impressoras** → `PRINTER_TYPE=epson` (padrão, compatível com ESC/POS)
   - Star Micronics → `PRINTER_TYPE=star`
   - Daruma → `PRINTER_TYPE=daruma`
2. Se sua impressora não é dessas marcas, comece com `epson` (funciona com 90% das térmicas)
3. Teste com outro tipo se necessário
4. Verifique encoding (UTF-8)

**Impressoras testadas e compatíveis:**

**Térmicas (recomendado para restaurantes):**
- ✅ Epson (TM-T20, TM-T88, etc.)
- ✅ Star Micronics
- ✅ Daruma
- ✅ Bematech (usar driver `epson`)
- ✅ Elgin (usar driver `epson`)
- ✅ Impressoras genéricas chinesas (usar driver `epson`)
- ✅ Qualquer impressora com protocolo ESC/POS

**Outras impressoras (também funcionam):**
- ✅ Impressoras A4/Carta (HP, Canon, Brother, etc.)
- ✅ Impressoras matriciais (Epson LX-300, etc.)
- ✅ Impressoras jato de tinta
- ✅ Impressoras laser
- ✅ Qualquer impressora instalada no Windows/Linux

**O sistema NÃO limita o tipo de impressora!** Se o sistema operacional consegue imprimir nela, o agente também consegue.

### Porta 3001 já em uso

**Sintoma:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solução:**
O sistema detecta automaticamente e usa 3002, 3003, etc. Se persistir:

**Windows:**
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -i :3001
kill -9 <PID>
```

---

## 📚 API Reference

### Base URL

```
http://seu-servidor.com/api
```

### Endpoints

#### **Impressoras**

**Listar impressoras**
```http
GET /printers
```

Resposta:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Cozinha Principal",
      "identifier": "550e8400-e29b-41d4-a716-446655440000",
      "type": "kitchen",
      "is_active": true,
      "pending_print_jobs_count": 0,
      "last_seen_at": "2026-03-17T17:55:00.000000Z"
    }
  ]
}
```

**Registrar impressora**
```http
POST /printers/register
Content-Type: application/json

{
  "name": "Cozinha Principal",
  "type": "kitchen"
}
```

Tipos válidos: `kitchen`, `bar`, `receipt`

**Ativar/Desativar**
```http
PATCH /printers/{id}/toggle
```

---

#### **Pedidos**

**Listar pedidos**
```http
GET /orders
```

**Criar pedido**
```http
POST /orders
Content-Type: application/json

{
  "table_number": "5",
  "items": [
    {
      "name": "Frango Grelhado",
      "quantity": 2,
      "price": 2500.00,
      "notes": "Sem pimenta"
    }
  ],
  "total": 5000.00,
  "notes": "Cliente preferencial",
  "printer_ids": [1, 2]
}
```

Campos:
- `table_number` (obrigatório): Número da mesa
- `items` (obrigatório): Array de itens
  - `name` (obrigatório): Nome do item
  - `quantity` (obrigatório): Quantidade
  - `price` (obrigatório): Preço unitário
  - `notes` (opcional): Observações do item
- `total` (opcional): Total calculado
- `notes` (opcional): Observações gerais
- `printer_ids` (opcional): IDs das impressoras. Se omitido, envia para todas ativas

**Ver pedido**
```http
GET /orders/{id}
```

---

#### **Print Jobs**

**Buscar jobs pendentes** (usado pelo agente)
```http
GET /print-jobs/pending?printer_identifier={uuid}
```

Resposta:
```json
{
  "data": [
    {
      "id": 1,
      "printer_id": 1,
      "order_id": 5,
      "content": {
        "table_number": "5",
        "items": [...],
        "total": 5000.00,
        "order_id": 5,
        "created_at": "2026-03-17 17:55:00"
      },
      "status": "pending",
      "attempts": 0
    }
  ]
}
```

**Marcar como completo** (usado pelo agente)
```http
PATCH /print-jobs/{id}/complete
Content-Type: application/json

{
  "status": "completed"
}
```

Status válidos: `completed`, `failed`

---

## 🖨️ Formatos de Impressão Suportados

O agente suporta **3 formatos** de conteúdo para impressão:

### Formato 1: Comanda/Pedido (JSON estruturado)

Formato original para restaurantes. O agente formata automaticamente.

```json
{
  "table_number": "5",
  "items": [
    { "name": "Frango Grelhado", "quantity": 2, "price": 2500.00 }
  ],
  "total": 5000.00,
  "order_id": 1,
  "created_at": "2026-03-17 17:55:00"
}
```

### Formato 2: HTML (Facturas, Relatórios, etc.)

Envia HTML completo. O agente converte para PDF (via Puppeteer) e imprime.

```json
{
  "type": "html",
  "content": "<html><head><style>body{font-family:Arial}h1{color:#333}</style></head><body><h1>Factura #123</h1><p>Cliente: João Silva</p><table><tr><th>Item</th><th>Qtd</th><th>Preço</th></tr><tr><td>Produto A</td><td>2</td><td>5000 Kz</td></tr></table><p><strong>Total: 10.000 Kz</strong></p></body></html>",
  "format": "A4",
  "landscape": false,
  "margin": "10mm"
}
```

**Opções disponíveis:**
- `format`: Tamanho da página (`A4`, `Letter`, `A5`, `Legal`)
- `landscape`: Orientação paisagem (`true`/`false`)
- `margin`: Margens (`10mm`, `1cm`, `0.5in`)

### Formato 3: PDF (Base64)

Envia um PDF já gerado, codificado em base64. O agente imprime diretamente.

```json
{
  "type": "pdf",
  "content": "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFn..."
}
```

**Como gerar base64 de um PDF em PHP (Laravel):**
```php
$pdfContent = PDF::loadView('invoice', $data)->output();
$base64 = base64_encode($pdfContent);
```

### Integração com Sistema VPS Existente

Para enviar um print job do seu sistema na VPS:

```php
// No seu sistema Laravel na VPS
use Illuminate\Support\Facades\Http;

// Exemplo: Imprimir factura HTML
Http::post('https://seu-servidor.com/api/print-jobs', [
    'printer_id' => 1,
    'content' => [
        'type' => 'html',
        'content' => view('invoices.print', compact('invoice'))->render(),
        'format' => 'A4',
    ],
]);

// Exemplo: Imprimir PDF gerado pelo DomPDF/SnappyPDF
$pdf = PDF::loadView('reports.monthly', $data);
Http::post('https://seu-servidor.com/api/print-jobs', [
    'printer_id' => 1,
    'content' => [
        'type' => 'pdf',
        'content' => base64_encode($pdf->output()),
    ],
]);
```

---

## 🎨 Formato da Comanda Impressa

```
================================
        COMANDA / PEDIDO        
================================

Mesa: 5
Pedido #5
Data: 2026-03-17 17:55:00

--------------------------------
ITENS:

1. 2x Frango Grelhado
                  2500.00 x 2 = 5000.00 Kz
   Obs: Sem pimenta

2. 3x Cerveja
                   500.00 x 3 = 1500.00 Kz

--------------------------------

TOTAL: 6500.00 Kz

--------------------------------
OBSERVACOES:
Cliente preferencial
--------------------------------
Cacimbo Print - Sistema PDV
--------------------------------
```

---

## 🔐 Segurança

### Recomendações

1. **API sem autenticação**: A API atual não tem autenticação. Recomendações:
   - Use firewall para restringir acesso
   - Configure VPN entre VPS e PC local
   - Não exponha a API publicamente na internet

2. **HTTPS em produção**: Configure SSL/TLS no servidor Laravel

3. **Backup**: Faça backup regular do banco de dados

4. **Logs**: Monitore logs regularmente para detectar problemas

---

## 📊 Monitoramento

### Verificar Status do Sistema

**Backend (Laravel):**
```bash
# Ver logs
tail -f storage/logs/laravel.log

# Verificar filas
php artisan queue:work --once

# Limpar cache
php artisan optimize:clear
```

**Agente Local:**
```bash
# Ver logs em tempo real
tail -f logs/agent.log

# Verificar se está rodando
ps aux | grep node
```

### Métricas Importantes

- **Jobs pendentes**: Quantos jobs estão aguardando impressão
- **Taxa de sucesso**: % de jobs completados vs falhados
- **Latência**: Tempo entre criar pedido e imprimir
- **Uptime do agente**: Tempo que o agente está rodando

---

## 🚀 Próximos Passos

1. **Criar Frontend**: Desenvolver interface web para o PDV
2. **Múltiplas impressoras**: Configurar cozinha, bar e caixa
3. **Relatórios**: Implementar dashboard de vendas
4. **Notificações**: Alertas quando impressora fica offline
5. **Backup automático**: Configurar backup do banco

---

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique este guia
2. Consulte os logs (`logs/agent.log`, `storage/logs/laravel.log`)
3. Teste manualmente via curl
4. Verifique conexão de rede

---

## 📝 Changelog

### v1.0.0 (2026-03-17)
- ✅ Sistema de impressão remota funcional
- ✅ Interface web de configuração
- ✅ Suporte **universal**: térmicas ESC/POS, A4, matriciais, jato de tinta, laser - qualquer impressora!
- ✅ API REST completa
- ✅ Polling automático
- ✅ Logs detalhados
- ✅ Sem autenticação (simplificado)

---

**Desenvolvido com ❤️ para restaurantes em Angola**
