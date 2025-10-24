# PowerShell script to help update MVP_STATUS_NOTION.md
# Usage: .\scripts\update-mvp-status.ps1 "Description of changes"

param(
    [Parameter(Mandatory=$true)]
    [string]$Description
)

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$statusEntry = "- ✅ **$Description** - $(Get-Date -Format 'MMM dd, yyyy')"

# Read current MVP_STATUS_NOTION.md
$content = Get-Content "MVP_STATUS_NOTION.md" -Raw

# Find the line with the last status entry and add new entry after it
$lines = $content -split "`n"
$newLines = @()

$foundLastEntry = $false
foreach ($line in $lines) {
    $newLines += $line
    
    # Look for the last status entry (starts with - ✅)
    if ($line -match "^- ✅ \*\*.*\*\* - .*$" -and -not $foundLastEntry) {
        # Check if this is the last status entry by looking ahead
        $currentIndex = [array]::IndexOf($lines, $line)
        $nextLine = if ($currentIndex + 1 -lt $lines.Length) { $lines[$currentIndex + 1] } else { "" }
        
        # If next line doesn't start with - ✅, this is the last entry
        if ($nextLine -notmatch "^- ✅ \*\*.*\*\* - .*$") {
            $newLines += $statusEntry
            $foundLastEntry = $true
        }
    }
}

# Write back to file
$newContent = $newLines -join "`n"
Set-Content "MVP_STATUS_NOTION.md" -Value $newContent -NoNewline

Write-Host "✅ Updated MVP_STATUS_NOTION.md with: $Description" -ForegroundColor Green
Write-Host "📝 Don't forget to stage the file: git add MVP_STATUS_NOTION.md" -ForegroundColor Yellow
