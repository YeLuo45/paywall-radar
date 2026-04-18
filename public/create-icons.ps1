Add-Type -AssemblyName System.Drawing
$targetDir = "C:\Users\YeZhimin\.openclaw\workspace-dev\proposals\paywall-radar\public"
$sizes = @(192, 512)
foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.Clear([System.Drawing.Color]::FromArgb(79, 70, 229))
    $fontSize = [int]($size * 0.5)
    $font = New-Object System.Drawing.Font("Segoe UI Emoji", $fontSize, [System.Drawing.FontStyle]::Bold)
    $brush = [System.Drawing.Brushes]::White
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = 'Center'
    $sf.LineAlignment = 'Center'
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $g.DrawString("`u{1F3AF}", $font, $brush, $rect, $sf)
    $g.Dispose()
    $outPath = Join-Path $targetDir "icon-${size}.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $outPath"
}
