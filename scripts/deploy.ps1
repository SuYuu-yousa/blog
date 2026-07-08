$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")

Set-Location $repoRoot

npm run build

git add .

$changes = git status --porcelain
if (-not $changes) {
  Write-Host "No changes to commit."
  exit 0
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "publish blog: $timestamp"
git push
