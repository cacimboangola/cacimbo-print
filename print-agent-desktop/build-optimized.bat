@echo off
echo ========================================
echo  Cacimbo Print Agent - Build Otimizado
echo ========================================
echo.

echo [1/5] Limpando builds anteriores...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
if exist node_modules rmdir /s /q node_modules

echo [2/5] Instalando dependencias...
call npm install --production --no-optional
call npm install --save-dev electron-builder

echo [3/5] Removendo arquivos desnecessarios...
del /s /q node_modules\**\*.md 2>nul
del /s /q node_modules\**\*.ts 2>nul
del /s /q node_modules\**\*.map 2>nul
del /s /q node_modules\**\LICENSE 2>nul
del /s /q node_modules\**\CHANGELOG 2>nul
for /d /r node_modules %%d in (test tests __tests__ docs examples .github) do @if exist "%%d" rd /s /q "%%d"

echo [4/5] Construindo aplicacao com compressao maxima...
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npm run build

echo [5/5] Verificando tamanho do instalador...
for %%F in (dist\*.exe) do (
    set size=%%~zF
    set /a sizeMB=!size! / 1048576
    echo.
    echo Tamanho do instalador: !sizeMB! MB
    echo Arquivo: %%F
    echo.
    if !sizeMB! GTR 100 (
        echo AVISO: O instalador excede 100MB!
    ) else (
        echo OK: O instalador esta dentro do limite de 100MB
    )
)

echo.
echo ========================================
echo  Build concluido!
echo ========================================
pause
