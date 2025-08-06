# PowerShell Commands Reference

**Last Updated:** July 25, 2025  
**Environment:** Windows PowerShell

## 🚨 CRITICAL: PowerShell Environment

**IMPORTANT:** This project runs on Windows with PowerShell. Always use PowerShell-compatible commands instead of Unix/Linux commands.

## 📁 File and Directory Operations

### **Listing Files and Directories**
```powershell
# List files in current directory
Get-ChildItem

# List files with details (like ls -la)
Get-ChildItem | Format-Table Name, Length, LastWriteTime

# List only directories
Get-ChildItem -Directory

# List files recursively
Get-ChildItem -Recurse

# List specific file types
Get-ChildItem -Filter "*.ts"
Get-ChildItem -Filter "*.md"

# List files with specific patterns
Get-ChildItem -Recurse | Where-Object { $_.Name -like "*component*" }
```

### **File Content Operations**
```powershell
# View file content (like cat)
Get-Content file.txt

# View first few lines (like head)
Get-Content file.txt | Select-Object -First 10

# View last few lines (like tail)
Get-Content file.txt | Select-Object -Last 10

# Search for patterns in files (like grep)
Get-Content file.txt | Select-String "pattern"
Get-ChildItem -Recurse -Filter "*.ts" | Get-Content | Select-String "console.log"

# Count lines in file
(Get-Content file.txt).Count
```

### **File Management**
```powershell
# Create new file
New-Item -ItemType File -Name "newfile.txt"

# Create new directory
New-Item -ItemType Directory -Name "newfolder"

# Copy file
Copy-Item "source.txt" "destination.txt"

# Move file
Move-Item "oldname.txt" "newname.txt"

# Delete file
Remove-Item "file.txt" -Force

# Delete directory and contents
Remove-Item "folder" -Recurse -Force

# Check if file exists
if (Test-Path "file.txt") { Write-Host "File exists" }
```

## 🔍 Search and Filter Operations

### **Finding Files**
```powershell
# Find files by name pattern
Get-ChildItem -Recurse | Where-Object { $_.Name -like "*component*" }

# Find files by extension
Get-ChildItem -Recurse | Where-Object { $_.Extension -eq ".ts" }

# Find files modified today
Get-ChildItem -Recurse | Where-Object { $_.LastWriteTime.Date -eq (Get-Date).Date }

# Find large files (> 1MB)
Get-ChildItem -Recurse | Where-Object { $_.Length -gt 1MB }
```

### **Searching Content**
```powershell
# Search for text in all TypeScript files
Get-ChildItem -Recurse -Filter "*.ts" | Get-Content | Select-String "import"

# Search for text in specific files
Get-Content "package.json" | Select-String "dependencies"

# Search with case-insensitive pattern
Get-Content file.txt | Select-String "pattern" -CaseSensitive:$false

# Search with context (lines before and after)
Get-Content file.txt | Select-String "pattern" -Context 2
```

## 📊 Process and System Operations

### **Process Management**
```powershell
# List running processes
Get-Process

# Find specific process
Get-Process | Where-Object { $_.ProcessName -like "*node*" }

# Kill process by name
Stop-Process -Name "processname" -Force

# Kill process by ID
Stop-Process -Id 1234 -Force
```

### **System Information**
```powershell
# Get current directory
Get-Location

# Change directory
Set-Location "path/to/directory"

# Get system information
Get-ComputerInfo

# Get environment variables
Get-ChildItem Env:

# Get specific environment variable
$env:NODE_ENV
```

## 🛠️ Development-Specific Commands

### **Node.js and npm**
```powershell
# Check Node.js version
node --version

# Check npm version
npm --version

# Install dependencies
npm install

# Run scripts
npm run dev
npm run build
npm run lint

# List installed packages
npm list --depth=0
```

### **Git Operations**
```powershell
# Check git status
git status

# List branches
git branch

# Check git log
git log --oneline -10

# Check git diff
git diff
```

### **Supabase Operations**
```powershell
# Check Supabase status
supabase status

# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset local database
supabase db reset

# Generate types
npx supabase gen types typescript --local > types/database.ts
```

## 🔧 Common Development Patterns

### **Finding and Replacing Text**
```powershell
# Find files containing specific text
Get-ChildItem -Recurse -Filter "*.ts" | Get-Content | Select-String "console.log"

# Count occurrences of text
(Get-ChildItem -Recurse -Filter "*.ts" | Get-Content | Select-String "console.log").Count
```

### **File Size Analysis**
```powershell
# Get total size of directory
(Get-ChildItem -Recurse | Measure-Object -Property Length -Sum).Sum

# List files by size (largest first)
Get-ChildItem -Recurse | Sort-Object Length -Descending | Select-Object Name, Length -First 10
```

### **Date and Time Operations**
```powershell
# Get current date and time
Get-Date

# Get files modified today
Get-ChildItem -Recurse | Where-Object { $_.LastWriteTime.Date -eq (Get-Date).Date }

# Get files modified in last 7 days
Get-ChildItem -Recurse | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }
```

## ❌ Common Mistakes to Avoid

### **Don't Use These Unix Commands**
```powershell
# ❌ WRONG - These don't work in PowerShell
ls -la
cat file.txt
grep "pattern" file.txt
head -10 file.txt
tail -10 file.txt
find . -name "*.ts"
```

### **Use These PowerShell Commands Instead**
```powershell
# ✅ CORRECT - PowerShell equivalents
Get-ChildItem | Format-Table Name, Length, LastWriteTime
Get-Content file.txt
Get-Content file.txt | Select-String "pattern"
Get-Content file.txt | Select-Object -First 10
Get-Content file.txt | Select-Object -Last 10
Get-ChildItem -Recurse -Filter "*.ts"
```

## 📝 Quick Reference

| Unix Command | PowerShell Equivalent |
|-------------|----------------------|
| `ls` | `Get-ChildItem` |
| `ls -la` | `Get-ChildItem \| Format-Table Name, Length, LastWriteTime` |
| `cat` | `Get-Content` |
| `grep` | `Select-String` |
| `head` | `Select-Object -First` |
| `tail` | `Select-Object -Last` |
| `find` | `Get-ChildItem -Recurse` |
| `cp` | `Copy-Item` |
| `mv` | `Move-Item` |
| `rm` | `Remove-Item` |
| `mkdir` | `New-Item -ItemType Directory` |
| `touch` | `New-Item -ItemType File` |

## 🚀 Tips and Tricks

### **Aliases for Common Commands**
```powershell
# You can create aliases for frequently used commands
Set-Alias ll Get-ChildItem
Set-Alias grep Select-String
Set-Alias cat Get-Content
```

### **Piping and Filtering**
```powershell
# Chain commands with pipes
Get-ChildItem -Recurse -Filter "*.ts" | Where-Object { $_.Name -like "*component*" } | ForEach-Object { Write-Host $_.FullName }

# Use Select-Object for specific properties
Get-ChildItem | Select-Object Name, Length, LastWriteTime
```

### **Error Handling**
```powershell
# Use try-catch for error handling
try {
    Get-Content "nonexistent.txt"
} catch {
    Write-Host "File not found: $($_.Exception.Message)"
}
```

---

**Remember: Always use PowerShell commands in this Windows environment!** 