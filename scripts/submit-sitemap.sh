#!/bin/bash

# Script to submit sitemap to Google and Bing
# Run this after deploying changes

DOMAIN="https://www.hentaidiscord.com"

echo "Submitting sitemap to Google..."
curl -X GET "https://www.google.com/ping?sitemap=${DOMAIN}/sitemap.xml"
curl -X GET "https://www.google.com/ping?sitemap=${DOMAIN}/api/sitemap"

echo "Submitting sitemap to Bing..."
curl -X GET "https://www.bing.com/ping?sitemap=${DOMAIN}/sitemap.xml"
curl -X GET "https://www.bing.com/ping?sitemap=${DOMAIN}/api/sitemap"

echo "Sitemap submission completed!"

# You can also manually submit in Google Search Console:
echo "Manual submission URLs:"
echo "Google Search Console: https://search.google.com/search-console"
echo "Bing Webmaster Tools: https://www.bing.com/webmasters"
