@echo off
echo Parando todos os servidores Node.js...
echo.

taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo Processos Node.js parados
) else (
    echo Nenhum processo Node.js encontrado
)

taskkill /F /IM npm.cmd 2>nul
if %errorlevel% equ 0 (
    echo Processos npm parados
) else (
    echo Nenhum processo npm encontrado
)

echo.
echo Concluido!
pause

