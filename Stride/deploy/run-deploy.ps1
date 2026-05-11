# One-shot remote deploy via Posh-SSH using password auth.
# Usage: .\run-deploy.ps1 -ServerIp 192.168.31.30 -RootPassword 'xxx'
[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $ServerIp,
    [Parameter(Mandatory)] [string] $RootPassword,
    [string] $StrideDir = (Resolve-Path "$PSScriptRoot\..").Path,
    [switch] $SkipSetup,
    [switch] $SkipUpload
)

$ErrorActionPreference = 'Stop'
Import-Module Posh-SSH

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "[ok] $msg"  -ForegroundColor Green }
function Errx($msg) { Write-Host "[!!] $msg" -ForegroundColor Red }

$secPwd  = ConvertTo-SecureString $RootPassword -AsPlainText -Force
$cred    = New-Object System.Management.Automation.PSCredential('root', $secPwd)

# -- open SSH + SFTP sessions --
Step "Opening SSH and SFTP to $ServerIp"
$ssh  = New-SSHSession  -ComputerName $ServerIp -Credential $cred -AcceptKey -ConnectionTimeout 30 -ErrorAction Stop
$sftp = New-SFTPSession -ComputerName $ServerIp -Credential $cred -AcceptKey -ConnectionTimeout 30 -ErrorAction Stop
Ok "Sessions opened (ssh=$($ssh.SessionId) sftp=$($sftp.SessionId))"

function Run([string]$cmd, [int]$timeoutSec = 1200) {
    Write-Host "    $ $cmd" -ForegroundColor DarkGray
    $r = Invoke-SSHCommand -SessionId $ssh.SessionId -Command $cmd -TimeOut $timeoutSec
    if ($r.ExitStatus -ne 0) {
        Errx "Exit $($r.ExitStatus): $($r.Error)"
        Write-Host ($r.Output -join "`n")
        throw "Remote command failed"
    }
    return $r.Output
}

function Upload([string]$local, [string]$remote) {
    Write-Host "    upload $local -> $remote" -ForegroundColor DarkGray
    Set-SFTPItem -SessionId $sftp.SessionId -Path $local -Destination $remote -Force
}

try {
    if (-not $SkipSetup) {
        Step "Uploading nginx.conf and setup.sh"
        Upload "$PSScriptRoot\nginx.conf"  "/tmp"
        Upload "$PSScriptRoot\setup.sh"    "/tmp"
        Run "sed -i 's/\r$//' /tmp/setup.sh /tmp/nginx.conf && chmod +x /tmp/setup.sh"

        Step "Running setup.sh on server (apt + Docker + Node + nginx + systemd)"
        $out = Run "bash /tmp/setup.sh 2>&1" 1800
        $out | Where-Object { $_ -match '===|---|complete|Setting up|Get:' } | ForEach-Object { Write-Host "    $_" }
        Ok "setup.sh finished"
    }

    Step "Generating .env with TEST secrets and uploading"
    $jwt = -join ((1..48) | ForEach-Object { '{0:X}' -f (Get-Random -Max 16) })
    $pgPass    = [Convert]::ToBase64String((1..24 | ForEach-Object { Get-Random -Max 256 }))
    $mongoPass = [Convert]::ToBase64String((1..24 | ForEach-Object { Get-Random -Max 256 }))
    $valkeyPass= [Convert]::ToBase64String((1..24 | ForEach-Object { Get-Random -Max 256 }))
    $pgPass    = $pgPass -replace '[^a-zA-Z0-9]',''
    $mongoPass = $mongoPass -replace '[^a-zA-Z0-9]',''
    $valkeyPass= $valkeyPass -replace '[^a-zA-Z0-9]',''

    $envContent = @"
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=test-key-replace-later
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
GEMINI_API_KEY=
JWT_SECRET=$jwt
POSTGRES_USER=stride
POSTGRES_PASSWORD=$pgPass
POSTGRES_DB=stride
MONGO_USER=stride
MONGO_PASSWORD=$mongoPass
VALKEY_PASSWORD=$valkeyPass
CORS_ALLOWED_ORIGINS=https://$ServerIp,http://$ServerIp
ASPNETCORE_ENVIRONMENT=Production
"@
    $envFile = "$env:TEMP\stride.env"
    [IO.File]::WriteAllText($envFile, $envContent.Replace("`r`n","`n"))
    Upload $envFile "/opt/stride"
    Run "mv /opt/stride/stride.env /opt/stride/.env && chown stride:stride /opt/stride/.env && chmod 600 /opt/stride/.env"
    Ok ".env in place"

    if (-not $SkipUpload) {
        Step "Tarring backend src/ locally"
        $srcTar = "$env:TEMP\stride-src.tar.gz"
        if (Test-Path $srcTar) { Remove-Item $srcTar }
        Push-Location "$StrideDir\src"
        tar.exe -czf $srcTar --exclude='bin' --exclude='obj' --exclude='*.user' .
        Pop-Location
        Step "Uploading backend src tarball"
        Run "mkdir -p /opt/stride/code/src"
        Upload $srcTar "/tmp"
        Run "cd /opt/stride/code/src && tar -xzf /tmp/stride-src.tar.gz && rm /tmp/stride-src.tar.gz"

        Step "Tarring ui/ locally"
        $uiTar = "$env:TEMP\stride-ui.tar.gz"
        if (Test-Path $uiTar) { Remove-Item $uiTar }
        Push-Location "$StrideDir\ui"
        tar.exe -czf $uiTar --exclude='node_modules' --exclude='dist' --exclude='.angular' .
        Pop-Location
        Step "Uploading ui tarball"
        Run "mkdir -p /opt/stride/code/ui && find /opt/stride/code/ui -mindepth 1 -maxdepth 1 ! -name node_modules ! -name .angular ! -name dist -exec rm -rf {} +"
        Upload $uiTar "/tmp"
        Run "cd /opt/stride/code/ui && tar -xzf /tmp/stride-ui.tar.gz && rm /tmp/stride-ui.tar.gz"

        Step "Uploading Dockerfiles, compose and slnx"
        Upload "$StrideDir\deploy\docker-compose.yml" "/opt/stride/code"
        Upload "$StrideDir\Dockerfile"           "/opt/stride/code"
        Upload "$StrideDir\Dockerfile.adaptive"  "/opt/stride/code"
        Upload "$StrideDir\Stride.slnx"          "/opt/stride/code"
        Upload "$StrideDir\.dockerignore"        "/opt/stride/code"
        Run "sed -i 's/\r$//' /opt/stride/code/Dockerfile /opt/stride/code/Dockerfile.adaptive /opt/stride/code/docker-compose.yml /opt/stride/code/.dockerignore"
        Run "chown -R stride:stride /opt/stride/code"
    }

    Step "Building Angular frontend on server"
    Run "cd /opt/stride/code/ui && npm install --silent" 1800
    Run "cd /opt/stride/code/ui && npx ng build --configuration production --output-path /opt/stride/dist" 1800
    Run "chmod -R 755 /opt/stride/dist && chown -R www-data:www-data /opt/stride/dist"
    Ok "Frontend built"

    Step "Building and starting Docker stack (Postgres / Mongo / Valkey / Api / Adaptive)"
    Run "cd /opt/stride/code && set -a && . /opt/stride/.env && set +a && docker compose up -d --build" 3600
    Ok "Compose finished"

    Step "Reloading nginx"
    Run "nginx -t && nginx -s reload"

    Step "Checking service health"
    Start-Sleep -Seconds 10
    Run "docker compose -f /opt/stride/code/docker-compose.yml ps"
    Run "curl -fsS -o /dev/null -w 'API: %{http_code}\n' http://127.0.0.1:5000/health || true"

    Ok ""
    Ok "Deploy complete: https://$ServerIp"
}
finally {
    Remove-SSHSession  -SessionId $ssh.SessionId  | Out-Null
    Remove-SFTPSession -SessionId $sftp.SessionId | Out-Null
}
