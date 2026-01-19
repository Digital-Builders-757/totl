Write-Host "== QUICK SANITY GREP =="

Write-Host "`n[1] Browser client imports:"
Select-String -Path "app/**/*.ts","app/**/*.tsx","lib/**/*.ts","lib/**/*.tsx" `
  -Pattern "supabase-browser" -SimpleMatch -ErrorAction SilentlyContinue

Write-Host "`n[2] createSupabaseBrowser usage:"
Select-String -Path "app/**/*.ts","app/**/*.tsx","lib/**/*.ts","lib/**/*.tsx" `
  -Pattern "createSupabaseBrowser" -SimpleMatch -ErrorAction SilentlyContinue

Write-Host "`n[3] select('*') usage:"
Select-String -Path "app/**/*.ts","app/**/*.tsx","lib/**/*.ts","lib/**/*.tsx" `
  -Pattern "select('\*')" -SimpleMatch -ErrorAction SilentlyContinue

Write-Host "`n[4] .single() usage:"
Select-String -Path "app/**/*.ts","app/**/*.tsx","lib/**/*.ts","lib/**/*.tsx" `
  -Pattern ".single()" -SimpleMatch -ErrorAction SilentlyContinue

Write-Host "`nDone."
