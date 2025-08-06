# Performance Monitoring Script for TOTL Agency
# Date: 2025-01-01
# Purpose: Monitor database performance after optimization

param(
    [string]$SupabaseUrl = "",
    [string]$SupabaseKey = "",
    [switch]$Verbose
)

Write-Host "🔍 TOTL Agency Performance Monitor" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if Supabase credentials are provided
if (-not $SupabaseUrl -or -not $SupabaseKey) {
    Write-Host "❌ Error: Please provide Supabase URL and API key" -ForegroundColor Red
    Write-Host "Usage: .\monitor-performance.ps1 -SupabaseUrl 'your-url' -SupabaseKey 'your-key'" -ForegroundColor Yellow
    exit 1
}

# Function to make API calls to Supabase
function Invoke-SupabaseQuery {
    param(
        [string]$Query,
        [string]$Description
    )
    
    try {
        $headers = @{
            "apikey" = $SupabaseKey
            "Authorization" = "Bearer $SupabaseKey"
            "Content-Type" = "application/json"
        }
        
        $body = @{
            query = $Query
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body
        
        if ($Verbose) {
            Write-Host "✅ $Description" -ForegroundColor Green
            Write-Host "Result: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
        } else {
            Write-Host "✅ $Description" -ForegroundColor Green
        }
        
        return $response
    }
    catch {
        Write-Host "❌ Error executing $Description`: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Check Index Usage
Write-Host "`n📊 Checking Index Usage..." -ForegroundColor Yellow
$indexQuery = @"
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
"@

$indexUsage = Invoke-SupabaseQuery -Query $indexQuery -Description "Index usage statistics"

# 2. Check Table Statistics
Write-Host "`n📈 Checking Table Statistics..." -ForegroundColor Yellow
$statsQuery = @"
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;
"@

$tableStats = Invoke-SupabaseQuery -Query $statsQuery -Description "Table statistics"

# 3. Check RLS Policy Performance
Write-Host "`n🔒 Checking RLS Policy Performance..." -ForegroundColor Yellow
$rlsQuery = @"
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
"@

$rlsPolicies = Invoke-SupabaseQuery -Query $rlsQuery -Description "RLS policy information"

# 4. Check Recent Performance Metrics
Write-Host "`n⚡ Checking Recent Query Performance..." -ForegroundColor Yellow
$performanceQuery = @"
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%public.%'
ORDER BY total_time DESC
LIMIT 10;
"@

$queryPerformance = Invoke-SupabaseQuery -Query $performanceQuery -Description "Recent query performance"

# 5. Check Database Size
Write-Host "`n💾 Checking Database Size..." -ForegroundColor Yellow
$sizeQuery = @"
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"@

$tableSizes = Invoke-SupabaseQuery -Query $sizeQuery -Description "Table sizes"

# 6. Run Maintenance Cleanup
Write-Host "`n🔧 Running Maintenance Cleanup..." -ForegroundColor Yellow
$maintenanceQuery = "SELECT maintenance_cleanup();"
$maintenance = Invoke-SupabaseQuery -Query $maintenanceQuery -Description "Maintenance cleanup"

# 7. Get Performance Hints
Write-Host "`n💡 Getting Performance Hints..." -ForegroundColor Yellow
$hintsQuery = "SELECT * FROM get_query_hints();"
$performanceHints = Invoke-SupabaseQuery -Query $hintsQuery -Description "Performance optimization hints"

# Summary Report
Write-Host "`n📋 Performance Summary Report" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

if ($indexUsage) {
    $unusedIndexes = $indexUsage | Where-Object { $_.scans -eq 0 }
    if ($unusedIndexes) {
        Write-Host "⚠️  Found $($unusedIndexes.Count) unused indexes:" -ForegroundColor Yellow
        $unusedIndexes | ForEach-Object {
            Write-Host "   - $($_.tablename).$($_.indexname)" -ForegroundColor Gray
        }
    } else {
        Write-Host "✅ All indexes are being used" -ForegroundColor Green
    }
}

if ($tableSizes) {
    $totalSize = ($tableSizes | Measure-Object -Property size_bytes -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    Write-Host "💾 Total database size: $totalSizeMB MB" -ForegroundColor Blue
}

if ($queryPerformance) {
    $slowQueries = $queryPerformance | Where-Object { $_.mean_time -gt 100 }
    if ($slowQueries) {
        Write-Host "⚠️  Found $($slowQueries.Count) slow queries (>100ms average):" -ForegroundColor Yellow
        $slowQueries | ForEach-Object {
            Write-Host "   - $($_.mean_time)ms average: $($_.query.Substring(0, [math]::Min(50, $_.query.Length)))..." -ForegroundColor Gray
        }
    } else {
        Write-Host "✅ No slow queries detected" -ForegroundColor Green
    }
}

Write-Host "`n🎯 Recommendations:" -ForegroundColor Cyan
if ($performanceHints) {
    $performanceHints | ForEach-Object {
        Write-Host "   • $($_.hint_description): $($_.recommendation)" -ForegroundColor White
    }
}

Write-Host "`n✅ Performance monitoring completed!" -ForegroundColor Green
Write-Host "Run this script regularly to monitor database performance." -ForegroundColor Gray 