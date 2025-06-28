# PowerShell script to submit sitemap to Google and Bing
# Run this after deploying changes

$domain = "https://www.hentaidiscord.com"

Write-Host "Submitting sitemap to Google..." -ForegroundColor Green
try {
    Invoke-WebRequest -Uri "https://www.google.com/ping?sitemap=$domain/sitemap.xml" -Method GET
    Invoke-WebRequest -Uri "https://www.google.com/ping?sitemap=$domain/api/sitemap" -Method GET
    Write-Host "Google submission completed!" -ForegroundColor Green
} catch {
    Write-Host "Google submission failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Submitting sitemap to Bing..." -ForegroundColor Green
try {
    Invoke-WebRequest -Uri "https://www.bing.com/ping?sitemap=$domain/sitemap.xml" -Method GET
    Invoke-WebRequest -Uri "https://www.bing.com/ping?sitemap=$domain/api/sitemap" -Method GET
    Write-Host "Bing submission completed!" -ForegroundColor Green
} catch {
    Write-Host "Bing submission failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nSitemap submission completed!" -ForegroundColor Cyan
Write-Host "`nManual submission URLs:" -ForegroundColor Yellow
Write-Host "Google Search Console: https://search.google.com/search-console" -ForegroundColor White
Write-Host "Bing Webmaster Tools: https://www.bing.com/webmasters" -ForegroundColor White
