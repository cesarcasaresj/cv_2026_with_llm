# Arranque local sin Docker: Vault en modo dev + carga de secretos + backend.
# Uso (desde la raíz del proyecto):  .\dev-up.ps1
# Requiere: .env completo, PostgreSQL con la base cv_app, Node (fnm o PATH) y el binario de Vault.
# Ruta del binario de Vault: variable VAULT_BIN o el propio PATH.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

# 1. Leer .env (solo pares CLAVE=valor; nunca se imprimen los valores)
$config = @{}
Get-Content (Join-Path $root '.env') | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object {
  $key, $value = $_ -split '=', 2
  $config[$key] = $value
}
if ($config['POSTGRES_PASSWORD'] -like 'PON_AQUI*') { throw 'Completa POSTGRES_PASSWORD en .env antes de arrancar.' }

# 2. Localizar el binario de Vault
$vault = if ($env:VAULT_BIN) { $env:VAULT_BIN } else { (Get-Command vault -ErrorAction SilentlyContinue).Source }
if (-not $vault) { throw 'No encuentro vault. Define VAULT_BIN con la ruta a vault.exe.' }

$address = $config['VAULT_ADDR']
$listenAddress = ($address -replace '^https?://', '')
$env:VAULT_ADDR = $address
$env:VAULT_TOKEN = $config['VAULT_TOKEN']

# 3. Levantar Vault en modo dev si no está escuchando
$running = Test-NetConnection ($listenAddress -split ':')[0] -Port ([int](($listenAddress -split ':')[1])) -WarningAction SilentlyContinue
if (-not $running.TcpTestSucceeded) {
  Start-Process -FilePath $vault -ArgumentList 'server', '-dev', "-dev-root-token-id=$($config['VAULT_TOKEN'])", "-dev-listen-address=$listenAddress" -WindowStyle Hidden | Out-Null
  Start-Sleep -Seconds 4
  Write-Host 'Vault (modo dev) arrancado.'
} else {
  Write-Host 'Vault ya estaba corriendo.'
}

# 4. Cargar las credenciales de la base (en modo dev se pierden al reiniciar)
& $vault kv put secret/cv-app/database `
  host=localhost port=5432 database=cv_app `
  username=$($config['POSTGRES_USER']) password=$($config['POSTGRES_PASSWORD']) | Out-Null
Write-Host 'Credenciales cargadas en secret/cv-app/database.'

# 4b. Clave de firma de las sesiones: se genera solo si todavía no existe (nunca se imprime)
# "No value found" sale por stderr: en PowerShell 5.1 con 'Stop' sería un error fatal, así que se tolera aquí
$ErrorActionPreference = 'Continue'
& $vault kv get -field=signing_key secret/cv-app/jwt *> $null
$jwtMissing = $LASTEXITCODE -ne 0
$ErrorActionPreference = 'Stop'
if ($jwtMissing) {
  $bytes = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  # Entre comillas: sin ellas PowerShell pasa "signing_key=" y el valor como dos argumentos distintos
  & $vault kv put secret/cv-app/jwt "signing_key=$([Convert]::ToBase64String($bytes))" | Out-Null
  Write-Host 'Clave de firma JWT generada en secret/cv-app/jwt.'
}

# 5. Arrancar el backend (lee .env desde backend/)
Write-Host "Arrancando backend en http://localhost:$($config['PORT']) ..."
Set-Location (Join-Path $root 'backend')
npm run dev
