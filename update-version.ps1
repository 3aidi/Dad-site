# Cache Version Update Script
# Usage: .\update-version.ps1 [new_version]
# If no version is provided, increments PATCH (1.0.0 -> 1.0.1)

param(
    [string]$NewVersion
)

$versionFile = "public/version.js"
$indexHtml = "public/index.html"
$adminHtml = "public/admin.html"

# Get current version from version.js
$defaultVersion = '1.0.0'
if (Test-Path $versionFile) {
    $current = Get-Content $versionFile | Select-String -Pattern "window.APP_VERSION = '([0-9.]+)'" | ForEach-Object { $_.Matches[0].Groups[1].Value }
    if ($current) { $currentVersion = $current } else { $currentVersion = $defaultVersion }
} else {
    $currentVersion = $defaultVersion
}

# Determine new version
if ($NewVersion) {
    $newVersion = $NewVersion
} else {
    $parts = $currentVersion -split '\.'
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2] + 1
    $newVersion = "$major.$minor.$patch"
}

Write-Host "Updating version: $currentVersion -> $newVersion"

# Update version.js
(Get-Content $versionFile) -replace "window.APP_VERSION = '[0-9.]+';", "window.APP_VERSION = '$newVersion';" | Set-Content $versionFile

# Update all asset links in HTML files
$files = @($indexHtml, $adminHtml)
foreach ($file in $files) {
    if (Test-Path $file) {
        (Get-Content $file) -replace "(\.(css|js)\?v=)[0-9.]+", "${1}$newVersion" | Set-Content $file
    }
}

Write-Host "Version updated to $newVersion in version.js and HTML asset links."
