# Correção - Erro SumatraPDF ENOENT

## Problema
```
spawn C:\Cacimbo Print Agent\resources\app.asar.unpacked.unpacked\node_modules\pdf-to-printer\dist\SumatraPDF-3.4.6-32.exe ENOENT
```

O caminho estava **duplicado** (`unpacked.unpacked`) e o SumatraPDF não era encontrado.

## Causa
Quando o Electron empacota a aplicação com ASAR e depois desempacota certos módulos, o `pdf-to-printer` não conseguia encontrar o executável do SumatraPDF no caminho correto.

## Solução Aplicada

### Arquivo: `agent/pdf-printer.js`

1. **Detecção de ambiente empacotado**
   - Verifica se está rodando como processo filho do Electron
   - Detecta se `process.resourcesPath` existe

2. **Configuração do caminho correto**
   ```javascript
   const sumatraPath = path.join(
     process.resourcesPath, 
     'app.asar.unpacked', 
     'node_modules', 
     'pdf-to-printer', 
     'dist', 
     'SumatraPDF-3.4.6-32.exe'
   );
   ```

3. **Passa o caminho para o pdf-to-printer**
   ```javascript
   printOptions.sumatraPdfPath = sumatraPath;
   ```

## Como Reconstruir

Execute no PowerShell:

```powershell
cd "c:\Users\Arnaldo\Downloads\PROJECTS\LARAVEL PROJECTS\cacimbo-print\print-agent-desktop"
.\REBUILD.bat
```

Ou manualmente:

```powershell
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue
npm run build
```

## Teste Após Instalação

1. Desinstale a versão antiga
2. Instale a nova versão gerada
3. Envie um job de impressão HTML
4. Verifique os logs - deve aparecer:
   ```
   [INFO] Usando SumatraPDF em: C:\...\app.asar.unpacked\node_modules\pdf-to-printer\dist\SumatraPDF-3.4.6-32.exe
   [INFO] PDF impresso com sucesso
   ```

## Logs Esperados (Sucesso)

```
[INFO] Processando conteúdo HTML para impressora POS-80C 001...
[INFO] Iniciando conversão HTML → PDF...
[INFO] Usando Chrome: C:\Program Files\Google\Chrome\Application\chrome.exe
[INFO] HTML convertido para PDF: C:\Users\...\html-xxx.pdf (46972 bytes)
[INFO] Imprimindo PDF na impressora: \\cacimbo-dev3\POS-80C 001
[INFO] Usando SumatraPDF em: C:\...\app.asar.unpacked\node_modules\pdf-to-printer\dist\SumatraPDF-3.4.6-32.exe
[INFO] PDF impresso com sucesso: C:\Users\...\html-xxx.pdf
```

## Arquivos Modificados

- ✅ `agent/pdf-printer.js` - Adicionada detecção e configuração do caminho do SumatraPDF
- ✅ `package.json` - `node_modules/**/*` já está em `asarUnpack`
- ✅ `main.js` - Já usa caminhos corretos para `app.asar.unpacked`

## Próximos Passos

1. Execute `.\REBUILD.bat`
2. Aguarde o build completar (~2-5 minutos)
3. Instale o novo instalador em produção
4. Teste a impressão de jobs HTML
5. Verifique que não há mais erros ENOENT
