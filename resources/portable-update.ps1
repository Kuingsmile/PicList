# Runs from an isolated update directory. Keep this script, the journal and backup
# after installation so interrupted updates can be recovered without losing data.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Get-ChildPath([string] $Root, [string] $Name) {
    $rootPath = [IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
    $result = [IO.Path]::GetFullPath((Join-Path $rootPath $Name))
    if (-not $result.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Update path escaped its directory'
    }
    return $result
}

function Write-Status([string] $State, [string] $Failure = '') {
    [IO.File]::WriteAllText((Get-ChildPath $PSScriptRoot 'status.json'), (@{ state = $State; failure = $Failure } | ConvertTo-Json))
}

$moves = [Collections.Generic.List[object]]::new()
$installationStarted = $false
try {
    $settings = Get-Content -LiteralPath (Get-ChildPath $PSScriptRoot 'install.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    $installDir = [IO.Path]::GetFullPath($settings.installDir)
    $payloadDir = Get-ChildPath $PSScriptRoot 'payload'
    $backupDir = Get-ChildPath $PSScriptRoot 'backup'
    $executable = Get-ChildPath $installDir $settings.executableName
    if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) { throw 'Installed executable is missing' }
    if (-not (Test-Path -LiteralPath (Get-ChildPath $payloadDir $settings.executableName) -PathType Leaf)) {
        throw 'Updated executable is missing'
    }
    $entries = @(Get-ChildItem -LiteralPath $payloadDir -Force)
    if ($entries.Count -eq 0) { throw 'Update payload is empty' }
    foreach ($entry in $entries) {
        if ($entry.Name -ieq 'data') { throw 'Update must not replace user data' }
        $target = Get-ChildPath $installDir $entry.Name
        if (Test-Path -LiteralPath $target) {
            if ((Get-Item -LiteralPath $target -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
                throw 'Installed entry is a link'
            }
        }
    }
    [IO.Directory]::CreateDirectory($backupDir) | Out-Null
    # Resolve the actual process before announcing readiness, avoiding a fixed exit delay.
    $parent = Get-Process -Id $settings.processId -ErrorAction Stop
    Write-Status 'waiting-for-exit'
    [IO.File]::WriteAllText((Get-ChildPath $PSScriptRoot 'ready'), '')
    if (-not $parent.WaitForExit(120000)) { throw 'Timed out waiting for application exit' }
    # A timed-out or failed launcher must never install later when the app closes.
    if (-not (Test-Path -LiteralPath (Get-ChildPath $PSScriptRoot 'install-authorized') -PathType Leaf)) {
        throw 'Installation handoff was not completed'
    }

    # Persist the full plan before touching the installation. data/ is never in it.
    $plan = @($entries | ForEach-Object {
        @{ name = $_.Name; existed = (Test-Path -LiteralPath (Get-ChildPath $installDir $_.Name)) }
    })
    [IO.File]::WriteAllText((Get-ChildPath $PSScriptRoot 'journal.json'), (ConvertTo-Json -InputObject $plan))
    Write-Status 'installing'
    $installationStarted = $true
    foreach ($entry in $entries) {
        $source = Get-ChildPath $payloadDir $entry.Name
        $target = Get-ChildPath $installDir $entry.Name
        $backup = Get-ChildPath $backupDir $entry.Name
        $move = @{ source = $source; target = $target; backup = $backup; saved = $false; installed = $false }
        $moves.Add($move)
        if (Test-Path -LiteralPath $target) {
            Move-Item -LiteralPath $target -Destination $backup
            $move.saved = $true
        }
        Move-Item -LiteralPath $source -Destination $target
        $move.installed = $true
    }
    # A launch failure also rolls back. A successful launch keeps the backup for recovery.
    Write-Status 'restarting'
    Start-Process -FilePath $executable -WorkingDirectory $installDir -WindowStyle Hidden -ErrorAction Stop | Out-Null
    # Never roll back underneath a successfully launched app if status writing fails.
    try { Write-Status 'installed' } catch {}
    exit 0
} catch {
    if (-not $installationStarted) {
        Write-Status 'failed-before-install' $_.FullyQualifiedErrorId
        exit 1
    }
    $recovered = $true
    for ($index = $moves.Count - 1; $index -ge 0; $index--) {
        $move = $moves[$index]
        try {
            if ($move.installed) { Move-Item -LiteralPath $move.target -Destination $move.source }
            if ($move.saved) { Move-Item -LiteralPath $move.backup -Destination $move.target }
        } catch {
            $recovered = $false
        }
    }
    if ($recovered) {
        Write-Status 'rolled-back'
        try {
            Start-Process -FilePath $executable -WorkingDirectory $installDir -WindowStyle Hidden -ErrorAction Stop | Out-Null
        } catch {
            Write-Status 'rolled-back-restart-failed'
        }
    } else {
        # Do not launch a partially restored installation. Preserve all recovery files.
        Write-Status 'rollback-failed'
    }
    exit 1
}
