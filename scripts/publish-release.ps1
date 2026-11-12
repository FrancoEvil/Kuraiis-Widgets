param([string]$Repository = $env:GITHUB_REPOSITORY)
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
if (-not $Repository) { throw 'GITHUB_REPOSITORY no está configurado.' }
$version = node -p "require('./package.json').version"
$tag = "v$version"
$installer = "dist/Kuraiis-Widgets-Setup-$version.exe"
foreach ($file in @($installer, "$installer.blockmap", 'dist/latest.yml')) {
    if (-not (Test-Path -LiteralPath $file)) { throw "Falta el archivo: $file" }
}
function Invoke-Gh {
    & gh @args
    if ($LASTEXITCODE -ne 0) { throw 'Falló la operación de GitHub Releases.' }
}
& gh release view $tag --repo $Repository --json tagName 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Invoke-Gh release edit $tag --repo $Repository --draft=true
} else {
    Invoke-Gh release create $tag --repo $Repository --target $env:GITHUB_SHA --draft --title "Kuraii's Widgets $version" --generate-notes
}
# Publish only after all update assets have finished uploading.
Invoke-Gh release upload $tag $installer "$installer.blockmap" 'dist/latest.yml' --repo $Repository --clobber
Invoke-Gh release edit $tag --repo $Repository --draft=false --latest --title "Kuraii's Widgets $version"
