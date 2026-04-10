# Guia de Build Otimizado - Cacimbo Print Agent

## Objetivo
Gerar um executável Windows (.exe) com **menos de 100MB**.

## Otimizações Aplicadas

### 1. Compressão Máxima
- `compression: "maximum"` - Compressão LZMA máxima
- `asar: true` - Empacotamento ASAR para reduzir arquivos

### 2. Exclusão de Arquivos Desnecessários
- Arquivos de teste (`.test.js`, `.spec.js`)
- Documentação (`.md`, `LICENSE`, `CHANGELOG`)
- Source maps (`.map`)
- TypeScript definitions (`.ts`, `.d.ts`)
- Pastas de desenvolvimento (`test`, `tests`, `docs`, `examples`)

### 3. Dependências de Produção Apenas
- Instalação com `--production` (sem devDependencies)
- `--no-optional` (sem dependências opcionais)

## Como Construir

### Método 1: Script Automatizado (Recomendado)
```bash
build-optimized.bat
```

Este script:
1. Limpa builds anteriores
2. Instala apenas dependências de produção
3. Remove arquivos desnecessários
4. Constrói com compressão máxima
5. Verifica o tamanho final

### Método 2: Manual
```bash
# 1. Limpar
rmdir /s /q dist node_modules

# 2. Instalar dependências de produção
npm install --production --no-optional

# 3. Build
npm run build
```

## Tamanho Esperado

Com as otimizações aplicadas:
- **Instalador NSIS**: ~60-80 MB
- **Aplicação instalada**: ~150-200 MB

## Otimizações Adicionais (se necessário)

### Se ainda exceder 100MB:

1. **Remover Puppeteer-core** (se não estiver usando)
   ```bash
   npm uninstall puppeteer-core
   ```
   Economia: ~50-70 MB

2. **Usar Electron Fuses** para desabilitar recursos não usados
   ```json
   "afterPack": "./scripts/fuses.js"
   ```

3. **Portable Build** (sem instalador)
   ```bash
   npm run build:dir
   ```
   Gera pasta portátil em vez de instalador NSIS

4. **7-Zip Self-Extracting Archive**
   - Comprimir `dist/win-unpacked` com 7-Zip Ultra
   - Criar SFX (Self-Extracting Archive)
   - Economia: ~20-30%

## Verificar Tamanho

Após o build:
```bash
dir dist\*.exe
```

Ou use o script que mostra automaticamente.

## Troubleshooting

### Erro: "Cannot find module"
- Verifique se todas as dependências estão em `dependencies` (não `devDependencies`)
- Adicione módulos críticos em `asarUnpack`

### Instalador muito grande
- Verifique se `node_modules` foi limpo antes do build
- Confirme que está usando `--production`
- Remova dependências não utilizadas

### Aplicação não inicia
- Módulos nativos devem estar em `asarUnpack`
- Verifique logs em `%APPDATA%\Cacimbo Print Agent\logs`
