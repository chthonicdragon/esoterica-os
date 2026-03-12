$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent $root
Set-Location $repo

$tokenPath = Join-Path $repo '.supabase_access_token'
if (-not (Test-Path $tokenPath)) {
  throw "Missing $tokenPath. Create a Supabase access token and paste it into this file."
}

$token = (Get-Content $tokenPath -Raw).Trim()
if (-not $token) {
  throw "Empty $tokenPath."
}

[Environment]::SetEnvironmentVariable('SUPABASE_ACCESS_TOKEN', $token, 'Process')

$supabaseExe = Join-Path $repo '.tools\supabase.exe'
if (-not (Test-Path $supabaseExe)) {
  throw "Missing $supabaseExe. Download Supabase CLI into .tools first."
}

& $supabaseExe link --project-ref dgcuqrmxaghrchzpkadx
& $supabaseExe functions download sync-knowledge-graph
