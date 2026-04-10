@echo off
echo ========================================
echo  Verificacao de Icones
echo ========================================
echo.

set ICONS_OK=1

echo Verificando arquivos necessarios...
echo.

if exist "build\icon.ico" (
    echo [OK] build\icon.ico encontrado
) else (
    echo [FALTA] build\icon.ico NAO encontrado
    set ICONS_OK=0
)

if exist "build\icon.png" (
    echo [OK] build\icon.png encontrado
) else (
    echo [AVISO] build\icon.png NAO encontrado (opcional)
)

echo.
echo ========================================

if %ICONS_OK%==1 (
    echo  Icones Configurados!
    echo ========================================
    echo.
    echo Pode executar o build:
    echo   .\REBUILD.bat
    echo.
) else (
    echo  Icones Faltando
    echo ========================================
    echo.
    echo Siga os passos em CONFIGURAR-ICONES.md
    echo.
    echo Resumo rapido:
    echo 1. Acesse: https://www.icoconverter.com/
    echo 2. Faca upload da sua logo
    echo 3. Selecione tamanhos: 16, 32, 48, 64, 128, 256
    echo 4. Baixe o icon.ico
    echo 5. Salve em: build\icon.ico
    echo.
)

pause
