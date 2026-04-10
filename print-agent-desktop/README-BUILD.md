# Como Gerar o Executável (< 100MB)

## Método Rápido

Execute o script otimizado:

```bash
build-optimized.bat
```

O instalador será gerado em `dist\Cacimbo Print Agent Setup X.X.X.exe`

## Tamanho Esperado

- **Instalador NSIS**: 60-80 MB ✅
- **Versão Portátil**: 150-200 MB (pasta completa)

## Alternativas se Exceder 100MB

### Opção 1: Build Portátil (sem instalador)
```bash
npm run build:portable
```
Gera um executável portátil menor em `dist\`

### Opção 2: Build Manual Otimizado
```bash
# 1. Limpar tudo
rmdir /s /q dist node_modules

# 2. Instalar apenas produção
npm install --production --no-optional

# 3. Construir
npm run build
```

## Verificar Tamanho

```bash
dir dist\*.exe
```

## Estrutura do Build

```
dist/
├── Cacimbo Print Agent Setup X.X.X.exe  (Instalador NSIS - ~70MB)
└── win-unpacked/                         (Aplicação descompactada)
    └── Cacimbo Print Agent.exe           (Executável principal)
```

## Otimizações Aplicadas

✅ Compressão máxima (LZMA)  
✅ ASAR packaging  
✅ Exclusão de arquivos de teste  
✅ Exclusão de documentação  
✅ Apenas dependências de produção  
✅ Remoção de source maps  

## Troubleshooting

**Erro: "Instalador muito grande"**
- Execute `build-optimized.bat` que limpa tudo antes
- Verifique se não há `node_modules` antigos

**Erro: "Cannot find module"**
- Adicione o módulo em `asarUnpack` no `package.json`

**Aplicação não inicia após instalação**
- Verifique logs em: `%APPDATA%\Cacimbo Print Agent\logs\`
