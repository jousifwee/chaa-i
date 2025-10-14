param()

Continue = 'Stop'

 = Split-Path -Parent (Split-Path -Parent System.Management.Automation.InvocationInfo.MyCommand.Definition)
 = Join-Path  'client_angular\dist\chaa-i-client-angular'
 = Join-Path  'server_spring\src\main\resources\static\app\angular'

if (-not (Test-Path )) {
    Write-Error "Build-Verzeichnis '' nicht gefunden. Bitte zuerst 'npm run build' ausfuehren."
}

if (Test-Path ) {
    Remove-Item -Path  -Recurse -Force
}

Copy-Item -Path  -Destination  -Recurse

Write-Host "Angular-Build nach  kopiert."
