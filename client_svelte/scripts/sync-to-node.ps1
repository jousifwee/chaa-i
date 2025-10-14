param()

Continue = 'Stop'

 = Split-Path -Parent (Split-Path -Parent System.Management.Automation.InvocationInfo.MyCommand.Definition)
 = Join-Path  'client_svelte\dist'
 = Join-Path  'server\public\app\svelte'

if (-not (Test-Path )) {
    Write-Error "Build-Verzeichnis '' nicht gefunden. Bitte zuerst 'npm run build' ausführen."
}

if (Test-Path ) {
    Remove-Item -Path  -Recurse -Force
}

Copy-Item -Path  -Destination  -Recurse

Write-Host "Svelte-Build nach  kopiert."
