param(
  [string]$DB_HOST = "localhost",
  [string]$DB_USER = "root",
  [string]$DB_PASSWORD = "",
  [string]$DB_PORT = "3306",
  [string]$DB_NAME = "crm"
)

$env:DB_HOST = $DB_HOST
$env:DB_USER = $DB_USER
$env:DB_PASSWORD = $DB_PASSWORD
$env:DB_PORT = $DB_PORT
$env:DB_NAME = $DB_NAME

$backendCommand = "cd backend; npm install; npm run dev"
$frontendCommand = "cd frontend; npm install; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand

Write-Host "Started backend and frontend in separate PowerShell windows."
