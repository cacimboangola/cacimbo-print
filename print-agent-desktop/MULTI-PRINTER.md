# Configuração de Múltiplas Impressoras

O Print Agent Desktop agora suporta **múltiplas impressoras** em uma única instância do agente. Isso permite que você imprima em diferentes impressoras (bar, cozinha, recepção, etc.) a partir do mesmo agente.

## 🎯 Como Funciona

1. **Um único agente** gerencia múltiplas impressoras
2. Cada impressora tem um **UUID único** registrado na API
3. O print job especifica qual impressora usar via `printer_id`
4. O agente roteia automaticamente para a impressora correta

## 📋 Configuração

### Opção 1: Arquivo `printers.json` (Recomendado)

Crie o arquivo `agent/printers.json` com suas impressoras:

```json
[
  {
    "id": "cozinha-uuid-123",
    "name": "Cozinha Principal",
    "type": "epson",
    "interface": "\\\\COMPUTADOR\\ImpressoraCozinha",
    "width": 48
  },
  {
    "id": "bar-uuid-456",
    "name": "Bar",
    "type": "epson",
    "interface": "\\\\COMPUTADOR\\ImpressoraBar",
    "width": 48
  },
  {
    "id": "recibo-uuid-789",
    "name": "Recibo",
    "type": "epson",
    "interface": "\\\\COMPUTADOR\\ImpressoraRecibo",
    "width": 48
  }
]
```

**Campos:**
- `id`: UUID da impressora (deve corresponder ao `identifier` registrado na API)
- `name`: Nome descritivo da impressora
- `type`: Tipo da impressora (`epson`, `star`, `daruma`)
- `interface`: Caminho da impressora no Windows (ex: `\\COMPUTADOR\IMPRESSORA`)
- `width`: Largura da impressora térmica em caracteres (padrão: 48)

### Opção 2: Arquivo `.env` (Compatibilidade)

Se você já usa o `.env`, o agente continuará funcionando com uma única impressora:

```env
PRINTER_IDENTIFIER=cozinha-uuid-123
PRINTER_NAME=Cozinha Principal
PRINTER_TYPE=epson
PRINTER_INTERFACE=\\COMPUTADOR\ImpressoraCozinha
PRINTER_WIDTH=48
```

## 🔄 Fluxo de Impressão

### 1. Registrar Impressoras na API

Registre cada impressora na API Laravel:

**Produção:**
```bash
POST https://cacimbo-print-main-so67gi.laravel.cloud/api/printers/register
{
  "name": "Cozinha Principal",
  "type": "kitchen"
}
```

**Local:**
```bash
POST http://localhost:8000/api/printers/register
{
  "name": "Cozinha Principal",
  "type": "kitchen"
}
```

A API retorna o UUID da impressora. Use este UUID no `printers.json`.

### 2. Criar Print Job com Impressora Específica

Ao criar um print job, especifique a impressora:

```bash
POST /api/print-jobs
{
  "printer_id": 1,  # ID da impressora na API
  "content": {
    "type": "pdf",
    "content": "JVBERi0x..."
  }
}
```

### 3. Agent Roteia Automaticamente

O print agent:
1. Faz polling dos jobs pendentes
2. Identifica a impressora de destino pelo `printer_id`
3. Busca a configuração correspondente no `printers.json`
4. Imprime na impressora correta

## 📝 Exemplo Completo

### 1. Configure `printers.json`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Cozinha",
    "type": "epson",
    "interface": "\\\\SERVIDOR\\Cozinha",
    "width": 48
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Bar",
    "type": "epson",
    "interface": "\\\\SERVIDOR\\Bar",
    "width": 48
  }
]
```

### 2. Registre na API

```javascript
// Registrar Cozinha
const cozinha = await axios.post('/api/printers/register', {
  name: 'Cozinha',
  type: 'kitchen'
});
// Use o UUID retornado no printers.json

// Registrar Bar
const bar = await axios.post('/api/printers/register', {
  name: 'Bar',
  type: 'bar'
});
```

### 3. Imprimir em Impressora Específica

```javascript
// Imprimir na Cozinha
await axios.post('/api/print-jobs', {
  printer_id: cozinha.data.id,
  content: { type: 'pdf', content: pdfBase64 }
});

// Imprimir no Bar
await axios.post('/api/print-jobs', {
  printer_id: bar.data.id,
  content: { type: 'pdf', content: pdfBase64 }
});
```

## 🔍 Logs

O agente mostra qual impressora está sendo usada:

```
[CONFIG] 3 impressora(s) configurada(s):
  - Cozinha Principal (cozinha-uuid-123) → \\COMPUTADOR\ImpressoraCozinha
  - Bar (bar-uuid-456) → \\COMPUTADOR\ImpressoraBar
  - Recibo (recibo-uuid-789) → \\COMPUTADOR\ImpressoraRecibo

[Job 123] Tipo: pdf, Impressora: Bar
Imprimindo PDF na impressora: ImpressoraBar
PDF impresso com sucesso
```

## ⚠️ Notas Importantes

1. **UUIDs devem corresponder**: O `id` no `printers.json` deve ser o mesmo `identifier` registrado na API
2. **Impressora padrão**: Se `printer_id` não for especificado, usa a primeira impressora do `printers.json`
3. **Compatibilidade**: Se não houver `printers.json`, o agente usa a configuração do `.env` (modo legado)
4. **Nomes de impressora**: Para impressoras compartilhadas Windows (`\\SERVIDOR\NOME`), o agente extrai automaticamente o nome

## 🛠️ Troubleshooting

### Impressora não encontrada

```
[WARN] Impressora com ID xxx não encontrada. Usando impressora padrão.
```

**Solução**: Verifique se o UUID no `printers.json` corresponde ao registrado na API.

### Nenhuma impressora configurada

```
[ERRO] Nenhuma impressora configurada. Configure printers.json ou .env
```

**Solução**: Crie o arquivo `agent/printers.json` ou configure o `.env`.

### Arquivo não encontrado

Se `printers.json` não existir, use o exemplo:

```bash
cp agent/printers.json.example agent/printers.json
# Edite agent/printers.json com suas impressoras
```

## 📚 Referências

- [Documentação da API](../public/api-docs.html)
- [Configuração do Agent](./README.md)
- [Exemplo de printers.json](./agent/printers.json.example)
