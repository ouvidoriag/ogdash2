# Script para parar todos os servidores e processos Node.js
# Execute: .\stop-all-servers.ps1

Write-Host "🛑 Parando todos os servidores e processos Node.js..." -ForegroundColor Yellow

# Parar processos Node.js
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Encontrados $($nodeProcesses.Count) processo(s) Node.js" -ForegroundColor Cyan
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Processos Node.js parados" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Nenhum processo Node.js encontrado" -ForegroundColor Gray
}

# Parar processos npm
$npmProcesses = Get-Process npm -ErrorAction SilentlyContinue
if ($npmProcesses) {
    Write-Host "Encontrados $($npmProcesses.Count) processo(s) npm" -ForegroundColor Cyan
    $npmProcesses | Stop-Process -Force
    Write-Host "✅ Processos npm parados" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Nenhum processo npm encontrado" -ForegroundColor Gray
}

# Parar processos em portas comuns
$ports = @(3000, 5000, 8000, 8080, 4000, 5001)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Parando processo na porta $port (PID: $($conn.OwningProcess), Nome: $($process.ProcessName))" -ForegroundColor Cyan
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# Parar PM2 se estiver instalado
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    Write-Host "Parando PM2..." -ForegroundColor Cyan
    pm2 stop all 2>$null
    pm2 delete all 2>$null
    Write-Host "✅ PM2 parado" -ForegroundColor Green
}

Write-Host "`n✅ Concluído! Todos os servidores foram parados." -ForegroundColor Green

