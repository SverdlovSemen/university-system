$body = @{email='admin@example.com'; password='Admin123!'} | ConvertTo-Json
try {
    $resp = Invoke-RestMethod -Uri 'http://localhost:8081/api/auth/login' -Method Post -Body $body -ContentType 'application/json'
    $resp | ConvertTo-Json -Depth 5
} catch {
    Write-Host "ERROR:`n" $_.Exception.Message
    if ($_.Exception.Response) {
        try { $_.Exception.Response | ConvertTo-Json -Depth 5 | Write-Host } catch {}
    }
}
