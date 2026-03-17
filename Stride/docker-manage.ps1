# Stride Docker Management Script
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('start', 'stop', 'restart', 'logs', 'clean', 'infra', 'status', 'health')]
    [string]$Command
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput($Message, $Color = "White") {
    Write-Host $Message -ForegroundColor $Color
}

function Start-Services {
    Write-ColorOutput "Starting all Stride services..." "Green"
    docker-compose up --build -d
    Write-ColorOutput "Services started. Check status with: .\docker-manage.ps1 status" "Green"
}

function Start-Infrastructure {
    Write-ColorOutput "Starting infrastructure services only..." "Green"
    docker-compose -f docker-compose.infrastructure.yml up -d
    Write-ColorOutput "Infrastructure services started." "Green"
}

function Stop-Services {
    Write-ColorOutput "Stopping all services..." "Yellow"
    docker-compose down
    Write-ColorOutput "Services stopped." "Yellow"
}

function Restart-Services {
    Write-ColorOutput "Restarting all services..." "Yellow"
    docker-compose restart
    Write-ColorOutput "Services restarted." "Green"
}

function Show-Logs {
    Write-ColorOutput "Showing logs (Ctrl+C to exit)..." "Cyan"
    docker-compose logs -f
}

function Clean-Environment {
    Write-ColorOutput "This will remove all containers, volumes, and data. Are you sure? (y/N)" "Red"
    $confirmation = Read-Host
    if ($confirmation -eq 'y') {
        Write-ColorOutput "Cleaning up..." "Red"
        docker-compose down -v
        docker volume prune -f
        Write-ColorOutput "Environment cleaned." "Green"
    } else {
        Write-ColorOutput "Cancelled." "Yellow"
    }
}

function Show-Status {
    Write-ColorOutput "Service Status:" "Cyan"
    docker-compose ps
}

function Check-Health {
    Write-ColorOutput "Checking API health..." "Cyan"
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 5
        Write-ColorOutput "[OK] API is healthy" "Green"
        $response | ConvertTo-Json
    } catch {
        Write-ColorOutput "[ERROR] API is not responding" "Red"
    }
}

# Main execution
switch ($Command) {
    'start' { Start-Services }
    'stop' { Stop-Services }
    'restart' { Restart-Services }
    'logs' { Show-Logs }
    'clean' { Clean-Environment }
    'infra' { Start-Infrastructure }
    'status' { Show-Status }
    'health' { Check-Health }
}
