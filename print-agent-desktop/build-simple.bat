@echo off
echo ========================================
echo  Cacimbo Print Agent - Build Simples
echo ========================================
echo.

echo Limpando pasta dist...
if exist dist rmdir /s /q dist

echo.
echo Construindo aplicacao (sem assinatura)...
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npx electron-builder --win --x64 --dir

echo.
echo ========================================
echo  Build concluido!
echo ========================================
echo.
echo A aplicacao foi gerada em: dist\win-unpacked\
echo Executavel: dist\win-unpacked\Cacimbo Print Agent.exe
echo.

for /f "tokens=3" %%a in ('dir /-c "dist\win-unpacked" ^| find "File(s)"') do set size=%%a
set /a sizeMB=%size:~0,-3% / 1024
echo Tamanho total: %sizeMB% MB

echo.
pause
