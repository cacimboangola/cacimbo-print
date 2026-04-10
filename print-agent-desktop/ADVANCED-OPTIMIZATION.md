# Otimizações Avançadas (Se Necessário)

## Se o instalador ainda exceder 100MB após build-optimized.bat

### 1. Usar 7-Zip para Compressão Ultra

Após gerar o build, comprima manualmente com 7-Zip:

```bash
# 1. Gerar build sem instalador
npm run build:dir

# 2. Comprimir com 7-Zip Ultra
"C:\Program Files\7-Zip\7z.exe" a -t7z -m0=lzma2 -mx=9 -mfb=64 -md=32m -ms=on "CacimboPrintAgent.7z" "dist\win-unpacked\*"

# 3. Criar Self-Extracting Archive
"C:\Program Files\7-Zip\7z.exe" a -sfx7z.sfx "CacimboPrintAgent.exe" "CacimboPrintAgent.7z"
```

**Economia esperada**: 30-40%

### 2. Remover Dependências Não Críticas

Se não estiver usando conversão HTML→PDF, remova puppeteer:

```bash
npm uninstall puppeteer-core
```

**Economia**: ~50-70 MB

### 3. Usar Electron Fuses

Desabilite recursos não usados do Electron:

```javascript
// scripts/fuses.js
const { FusesPlugin } = require('@electron/fuses');

module.exports = {
  afterPack: async (context) => {
    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== 'win32') return;

    await FusesPlugin({
      version: FusesVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }).apply(appOutDir);
  }
};
```

### 4. Portable ZIP em vez de Instalador

Gere apenas a pasta portátil e comprima:

```bash
npm run build:dir
cd dist\win-unpacked
tar -a -c -f ..\CacimboPrintAgent-Portable.zip *
```

**Tamanho final**: ~50-70 MB

### 5. Otimizar node_modules Manualmente

Antes do build, remova módulos específicos não usados:

```bash
# Remover binários não usados
rmdir /s /q node_modules\puppeteer-core\.local-chromium

# Remover locales não usados do Electron
cd node_modules\electron\dist\locales
for /f %f in ('dir /b ^| findstr /v "en-US.pak"') do del %f
```

### 6. Usar UPX para Comprimir Executável

Comprima o executável final com UPX:

```bash
# Baixar UPX: https://upx.github.io/
upx --best --lzma "dist\win-unpacked\Cacimbo Print Agent.exe"
```

**Economia**: 40-60% no executável

⚠️ **Aviso**: Alguns antivírus podem marcar executáveis UPX como suspeitos

### 7. Split Build (Avançado)

Separe a aplicação em:
- **Launcher** (~5MB): Executável mínimo que baixa o resto
- **Core** (~100MB): Baixado na primeira execução

Estrutura:
```
CacimboPrintAgent-Launcher.exe (5MB)
  └─> Baixa CacimboPrintAgent-Core.zip (100MB) na primeira execução
```

## Comparação de Tamanhos

| Método | Tamanho Aproximado |
|--------|-------------------|
| Build padrão | ~120-150 MB |
| Build otimizado (build-optimized.bat) | ~70-90 MB ✅ |
| Build + 7-Zip SFX | ~50-70 MB ✅ |
| Portable ZIP | ~50-70 MB ✅ |
| Build + UPX | ~40-60 MB ✅ |
| Launcher + Core | ~5 MB (launcher) |

## Recomendação

Para a maioria dos casos, **build-optimized.bat** já deve gerar um instalador < 100MB.

Se ainda precisar reduzir mais, use a **opção Portable ZIP** que é simples e eficaz.
