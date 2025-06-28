# PowerShell script to check Google indexing status

$domain = "hentaidiscord.com"
$serverPath = "/server/945923877941416018"
$fullUrl = "https://www.$domain$serverPath"

Write-Host "Checking Google indexing status for your server page..." -ForegroundColor Green
Write-Host "URL: $fullUrl" -ForegroundColor Yellow

# Check if page is indexed using site: search
$siteQuery = "site:$domain$serverPath"
$googleSearchUrl = "https://www.google.com/search?q=" + [System.Web.HttpUtility]::UrlEncode($siteQuery)

Write-Host "`nGoogle Search Query: $siteQuery" -ForegroundColor Cyan
Write-Host "Manual Check URL: $googleSearchUrl" -ForegroundColor White

# Check specific search terms
$searchTerms = @(
    "Anime Empire Discord server site:$domain",
    '"Anime Empire" Discord site:$domain',
    "Anime Empire hentaidiscord.com"
)

Write-Host "`nSuggested search terms to test:" -ForegroundColor Green
foreach ($term in $searchTerms) {
    $encodedTerm = [System.Web.HttpUtility]::UrlEncode($term)
    $searchUrl = "https://www.google.com/search?q=$encodedTerm"
    Write-Host "- $term" -ForegroundColor White
    Write-Host "  Search URL: $searchUrl" -ForegroundColor Gray
    Write-Host ""
}

# Instructions for manual verification
Write-Host "Manual verification steps:" -ForegroundColor Yellow
Write-Host "1. Open Google Search Console: https://search.google.com/search-console" -ForegroundColor White
Write-Host "2. Add your domain if not already added" -ForegroundColor White
Write-Host "3. Go to 'URL Inspection' tool" -ForegroundColor White
Write-Host "4. Enter your server URL: $fullUrl" -ForegroundColor White
Write-Host "5. Click 'Request Indexing' if not indexed" -ForegroundColor White

Write-Host "`nSEO Improvements Made:" -ForegroundColor Green
Write-Host "✓ Created dynamic sitemap.ts with all server pages" -ForegroundColor Green
Write-Host "✓ Updated robots.txt with correct sitemap URLs" -ForegroundColor Green
Write-Host "✓ Enhanced server page metadata with better titles and descriptions" -ForegroundColor Green
Write-Host "✓ Added structured data for better search visibility" -ForegroundColor Green
Write-Host "✓ Created sitemap submission scripts" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy these changes to production" -ForegroundColor White
Write-Host "2. Submit sitemap to Google Search Console" -ForegroundColor White
Write-Host "3. Use 'Request Indexing' for your server page" -ForegroundColor White
Write-Host "4. Wait 24-48 hours for indexing" -ForegroundColor White
Write-Host "5. Monitor search console for any indexing issues" -ForegroundColor White
