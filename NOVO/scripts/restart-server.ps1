# Script para parar servidor e regenerar Prisma Client

Write-Host "🛑 Parando servidor na porta 3000..." -ForegroundColor Yellow

# Encontrar processo na porta 3000
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1

if ($process) {
    Write-Host "📌 Processo encontrado: PID $process" -ForegroundColor Cyan
    Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Processo parado" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "ℹ️  Nenhum processo encontrado na porta 3000" -ForegroundColor Gray
}

Write-Host "`n🔄 Regenerando Prisma Client..." -ForegroundColor Yellow
Set-Location $PSScriptRoot\..
npm run prisma:generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Prisma Client regenerado com sucesso!" -ForegroundColor Green
    Write-Host "`n🚀 Você pode iniciar o servidor com: npm start" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Erro ao regenerar Prisma Client. Tente novamente." -ForegroundColor Red
}

