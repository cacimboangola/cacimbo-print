@echo off
echo ========================================
echo  Cacimbo Print Agent - Instalador NSIS
echo ========================================
echo.

echo [1/4] Limpando cache e builds anteriores...
if exist dist rmdir /s /q dist
if exist "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"

echo [2/4] Verificando dependencias...
if not exist node_modules\electron-builder (
    echo Instalando electron-builder...
    call npm install
)

echo [3/4] Construindo instalador NSIS...
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npx electron-builder --win nsis --x64

echo.
echo [4/4] Verificando tamanho do instalador...
for %%F in (dist\*.exe) do (
    set size=%%~zF
    set /a sizeMB=%%~zF / 1048576
    echo.
    echo ========================================
    echo  Build Concluido!
    echo ========================================
    echo Arquivo: %%F
    echo Tamanho: !sizeMB! MB
    echo.
    if !sizeMB! GTR 100 (
        echo NOTA: Instalador Electron tipicamente tem 60-90MB
        echo Isso e normal para aplicacoes desktop modernas.
    ) else (
        echo OK: Instalador dentro do esperado
    )
    echo.
)

pause
