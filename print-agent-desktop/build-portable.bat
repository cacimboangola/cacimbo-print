@echo off
echo ========================================
echo  Build Portátil Otimizado
echo ========================================
echo.

echo [1/3] Limpando...
if exist dist rmdir /s /q dist

echo [2/3] Construindo versão portátil...
call npx electron-builder --win portable --x64 --config electron-builder.yml

echo.
echo [3/3] Verificando tamanho...
for %%F in (dist\*.exe) do (
    set size=%%~zF
    set /a sizeMB=%%~zF / 1048576
    echo.
    echo Arquivo: %%F
    echo Tamanho: !sizeMB! MB
    echo.
)

echo ========================================
echo  Concluído!
echo ========================================
pause
