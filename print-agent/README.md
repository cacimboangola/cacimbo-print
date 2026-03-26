# Cacimbo Print Agent

Agente local de impressão que conecta o PDV na VPS com impressoras térmicas locais.

## Como Funciona

1. O agente roda no PC onde as impressoras estão conectadas
2. Faz polling à API do PDV a cada 3 segundos (configurável)
3. Quando encontra jobs pendentes, imprime na impressora local
4. Marca o job como completo na API

## Requisitos

- Node.js 18+
- Impressora (qualquer tipo)
- Conexão com internet para acessar a VPS

**Impressoras compatíveis:**

**Térmicas (recomendado para restaurantes):**
- ✅ Epson (TM-T20, TM-T88, etc.)
- ✅ Star Micronics
- ✅ Daruma
- ✅ Bematech (usar driver `epson`)
- ✅ Elgin (usar driver `epson`)
- ✅ Impressoras genéricas/chinesas (usar driver `epson`)
- ✅ Qualquer impressora com protocolo ESC/POS

**Outras impressoras:**
- ✅ Impressoras A4/Carta (HP, Canon, Brother, Epson, etc.)
- ✅ Matriciais (Epson LX-300, etc.)
- ✅ Jato de tinta
- ✅ Laser
- ✅ **Qualquer impressora instalada no sistema operacional**

## Instalação

```bash
cd print-agent
npm install
```

## Configuração

### Opção 1: Interface Web (Recomendado)

Execute o servidor de configuração:

```bash
npm run config
```

O navegador abrirá automaticamente em `http://localhost:3001` com uma interface amigável onde você pode:

1. **Configurar a API**: Inserir a URL da API e testar a conexão
2. **Registrar Impressora**: Criar uma nova impressora e obter o identificador automaticamente
3. **Configurar Impressora**: Definir tipo, interface e outras opções
4. **Salvar**: Gravar todas as configurações no `.env`

Após salvar, feche o navegador e execute `npm start`.

### Opção 2: Configuração Manual

Copie o arquivo de exemplo e edite o `.env`:

```env
# URL da API na VPS
API_URL=https://seu-servidor.com/api

# Identificador da impressora (gerado ao registrar via API)
PRINTER_IDENTIFIER=uuid-da-impressora

# Tipo da impressora
PRINTER_TYPE=epson

# Interface da impressora
# USB Windows: \\\\localhost\\NomeDaImpressora
# USB Linux: /dev/usb/lp0
# Rede: tcp://192.168.1.100:9100
PRINTER_INTERFACE=tcp://localhost:9100
```

```bash
cp .env.example .env
# Editar .env manualmente
```

### Registrar Impressora Manualmente

Se não usar a interface web, registre via curl:

```bash
curl -X POST https://seu-servidor.com/api/printers/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Cozinha Principal", "type": "kitchen"}'
```

O `identifier` retornado deve ser colocado em `PRINTER_IDENTIFIER` no `.env`.

## Executar

```bash
# Produção
npm start

# Desenvolvimento (auto-reload)
npm run dev
```

## Logs

Os logs são salvos em `print-agent/logs/`:
- `agent.log` - Log geral
- `error.log` - Apenas erros

## Tipos de Impressora

| Tipo     | Descrição                    |
|----------|------------------------------|
| kitchen  | Impressora da cozinha        |
| bar      | Impressora do bar            |
| receipt  | Impressora de recibos/caixa  |

## Solução de Problemas

### Impressora não detectada
- Verifique se a impressora está ligada e conectada
- Confirme o endereço em `PRINTER_INTERFACE`
- Para USB no Windows: compartilhe a impressora e use `\\\\localhost\\NomeDaImpressora`

### Jobs não aparecem
- Confirme o `PRINTER_IDENTIFIER` no `.env`
- Verifique se a impressora está ativa (`is_active: true`)
