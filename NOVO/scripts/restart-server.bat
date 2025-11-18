@echo off
echo 🛑 Parando servidor na porta 3000...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo 📌 Processo encontrado: PID %%a
    taskkill /F /PID %%a >nul 2>&1
    echo ✅ Processo parado
    timeout /t 2 /nobreak >nul
    goto :found
)

:found
echo.
echo 🔄 Regenerando Prisma Client...
cd /d "%~dp0\.."
call npm run prisma:generate

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Prisma Client regenerado com sucesso!
    echo.
    echo 🚀 Você pode iniciar o servidor com: npm start
) else (
    echo.
    echo ⚠️  Erro ao regenerar Prisma Client. Tente novamente.
)

pause

