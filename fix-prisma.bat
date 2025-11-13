@echo off
echo 🔧 Corrigindo erro EPERM do Prisma...
echo.

echo 1️⃣ Fechando processos Node...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Processos Node finalizados
) else (
    echo ℹ️ Nenhum processo Node encontrado
)

echo.
echo 2️⃣ Aguardando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo 3️⃣ Limpando arquivos temporários do Prisma...
if exist "node_modules\.prisma\client\query_engine-windows.dll.node.tmp*" (
    del /F /Q "node_modules\.prisma\client\query_engine-windows.dll.node.tmp*" >nul 2>&1
    echo ✅ Arquivos temporários removidos
) else (
    echo ℹ️ Nenhum arquivo temporário encontrado
)

if exist "node_modules\.prisma\client\query_engine-windows.dll.node" (
    del /F /Q "node_modules\.prisma\client\query_engine-windows.dll.node" >nul 2>&1
    echo ✅ Arquivo principal removido
)

echo.
echo 4️⃣ Gerando Prisma Client...
call npx prisma generate

if %errorlevel% == 0 (
    echo.
    echo ✅ Prisma Client gerado com sucesso!
    echo.
    echo Agora você pode executar: npm start
) else (
    echo.
    echo ❌ Erro ao gerar Prisma Client
    echo.
    echo 💡 Tente executar manualmente: npx prisma generate
)

pause

