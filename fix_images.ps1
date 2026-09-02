Add-Type -AssemblyName System.Drawing

$assetsPath = "c:\Users\melik\Desktop\python\RafOmrum\assets"

# Convert icon.png (actually JPG) to real PNG
$iconPath = Join-Path $assetsPath "icon.png"
$iconBackup = Join-Path $assetsPath "icon_backup.jpg"
$iconImg = [System.Drawing.Image]::FromFile($iconPath)
Copy-Item $iconPath $iconBackup
$iconImg.Dispose()

$iconJpg = [System.Drawing.Image]::FromFile($iconPath)
$iconBmp = New-Object System.Drawing.Bitmap($iconJpg)
$iconBmp.Save($iconPath + ".tmp.png", [System.Drawing.Imaging.ImageFormat]::Png)
$iconJpg.Dispose()
$iconBmp.Dispose()
Move-Item ($iconPath + ".tmp.png") $iconPath -Force
Write-Host "icon.png converted to real PNG"

# Convert splash.png (actually JPG) to real PNG
$splashPath = Join-Path $assetsPath "splash.png"
$splashBackup = Join-Path $assetsPath "splash_backup.jpg"
Copy-Item $splashPath $splashBackup
$splashJpg = [System.Drawing.Image]::FromFile($splashPath)
$splashBmp = New-Object System.Drawing.Bitmap($splashJpg)
$splashBmp.Save($splashPath + ".tmp.png", [System.Drawing.Imaging.ImageFormat]::Png)
$splashJpg.Dispose()
$splashBmp.Dispose()
Move-Item ($splashPath + ".tmp.png") $splashPath -Force
Write-Host "splash.png converted to real PNG"

# Check favicon too
$faviconPath = Join-Path $assetsPath "favicon.png"
if (Test-Path $faviconPath) {
    $faviconJpg = [System.Drawing.Image]::FromFile($faviconPath)
    $faviconBmp = New-Object System.Drawing.Bitmap($faviconJpg)
    $faviconBmp.Save($faviconPath + ".tmp.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $faviconJpg.Dispose()
    $faviconBmp.Dispose()
    Move-Item ($faviconPath + ".tmp.png") $faviconPath -Force
    Write-Host "favicon.png converted to real PNG"
}

Write-Host "All images converted successfully!"
