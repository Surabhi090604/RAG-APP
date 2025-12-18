# Download Berkshire Hathaway PDFs from Google Drive
# Google Drive Folder: https://drive.google.com/drive/folders/1IdPSENw-efKI6S0QiMrSxk12YqxW3eRU

Write-Host "📥 Downloading Berkshire Hathaway Shareholder Letters..." -ForegroundColor Cyan
Write-Host ""

$pdfDir = "$PSScriptRoot\data\pdfs"

# Create directory if it doesn't exist
if (-not (Test-Path $pdfDir)) {
    New-Item -ItemType Directory -Path $pdfDir -Force | Out-Null
}

Write-Host "📁 PDF Directory: $pdfDir" -ForegroundColor Yellow
Write-Host ""

# Google Drive folder ID
$folderId = "1IdPSENw-efKI6S0QiMrSxk12YqxW3eRU"

Write-Host "To download PDFs from Google Drive:" -ForegroundColor Green
Write-Host ""
Write-Host "Option 1: Manual Download (Recommended)" -ForegroundColor White
Write-Host "  1. Open: https://drive.google.com/drive/folders/$folderId" -ForegroundColor Gray
Write-Host "  2. Click 'Download all' or select individual PDFs" -ForegroundColor Gray
Write-Host "  3. Extract to: $pdfDir" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2: Using Browser" -ForegroundColor White
Write-Host "  Opening Google Drive folder in your default browser..." -ForegroundColor Gray
Start-Process "https://drive.google.com/drive/folders/$folderId"
Write-Host "  ✓ Opened in browser" -ForegroundColor Green
Write-Host ""

Write-Host "After downloading:" -ForegroundColor Yellow
Write-Host "  • Place PDFs in: data\pdfs\" -ForegroundColor Gray
Write-Host "  • Name with years (e.g., 2023.pdf, 2022.pdf)" -ForegroundColor Gray
Write-Host "  • Then run: npm.cmd run ingest" -ForegroundColor Gray
Write-Host ""

# Check if any PDFs exist
$existingPdfs = Get-ChildItem -Path $pdfDir -Filter "*.pdf" -ErrorAction SilentlyContinue

if ($existingPdfs) {
    Write-Host "✓ Found $($existingPdfs.Count) existing PDF(s):" -ForegroundColor Green
    $existingPdfs | ForEach-Object { Write-Host "  • $($_.Name)" -ForegroundColor Gray }
} else {
    Write-Host "⚠️  No PDFs found yet in data\pdfs\" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
