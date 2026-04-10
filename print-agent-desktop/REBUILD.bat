@echo off
echo ========================================
echo  Reconstruir Instalador com Correcao
echo ========================================
echo.

echo [1/3] Limpando builds anteriores...
if exist dist rmdir /s /q dist

echo.
echo [2/3] Construindo instalador...
call npm run build

echo.
echo [3/3] Verificando resultado...
if exist "dist\Cacimbo Print Agent Setup 1.0.0.exe" (
    for %%F in ("dist\Cacimbo Print Agent Setup 1.0.0.exe") do (
        set /a sizeMB=%%~zF / 1048576
        echo.
        echo ========================================
        echo  Build Concluido com Sucesso!
        echo ========================================
        echo Instalador: %%F
        echo Tamanho: !sizeMB! MB
        echo.
        echo Correcao aplicada:
        echo - SumatraPDF agora usa caminho correto
        echo - app.asar.unpacked/node_modules/pdf-to-printer/dist/
        echo.
    )
) else (
    echo.
    echo ========================================
    echo  Erro no Build
    echo ========================================
    echo O instalador nao foi gerado.
    echo Verifique os erros acima.
    echo.
)

pause
