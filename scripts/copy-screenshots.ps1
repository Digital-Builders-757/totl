# PowerShell script to copy screenshots from temp to workspace
$sourceDir = "c:\Users\young\AppData\Local\Temp\cursor\screenshots\screenshots\ui-audit-2026-03-03"
$destDir = "c:\Users\young\Desktop\Project Files\totl\screenshots\ui-audit-2026-03-03"

# Ensure destination directory exists
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force
}

# Copy all PNG files
if (Test-Path $sourceDir) {
    Get-ChildItem -Path $sourceDir -Filter "*.png" | ForEach-Object {
        $destPath = Join-Path $destDir $_.Name
        Copy-Item $_.FullName $destPath -Force
        Write-Host "Copied: $($_.Name)"
    }
    Write-Host "`nAll screenshots copied successfully!"
} else {
    Write-Host "Source directory not found: $sourceDir"
}
