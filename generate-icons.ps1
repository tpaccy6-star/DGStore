Add-Type -AssemblyName System.Drawing

$logoPath = 'd:\PROJECTS\DGStore\src\assets\logo.png'
$resBase = 'd:\PROJECTS\DGStore\android\app\src\main\res'

$sizes = @{
    'mipmap-mdpi'    = 48
    'mipmap-hdpi'    = 72
    'mipmap-xhdpi'   = 96
    'mipmap-xxhdpi'  = 144
    'mipmap-xxxhdpi' = 192
}

$srcImg = [System.Drawing.Image]::FromFile($logoPath)

foreach ($folder in $sizes.Keys) {
    $sz = $sizes[$folder]
    $outDir = Join-Path $resBase $folder

    # 1. Square Icon
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Deep luxury dark background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#151714'))
    $g.FillRectangle($bgBrush, 0, 0, $sz, $sz)

    # Logo scaled and centered with 12% padding
    $pad = [int]($sz * 0.12)
    $maxW = $sz - ($pad * 2)
    $maxH = $sz - ($pad * 2)

    $scale = [Math]::Min($maxW / $srcImg.Width, $maxH / $srcImg.Height)
    $w = [int]($srcImg.Width * $scale)
    $h = [int]($srcImg.Height * $scale)
    $x = [int](($sz - $w) / 2)
    $y = [int](($sz - $h) / 2)

    $g.DrawImage($srcImg, $x, $y, $w, $h)
    $squarePath = Join-Path $outDir 'ic_launcher.png'
    $bmp.Save($squarePath, [System.Drawing.Imaging.ImageFormat]::Png)

    # 2. Round Icon
    $roundBmp = New-Object System.Drawing.Bitmap($sz, $sz)
    $rg = [System.Drawing.Graphics]::FromImage($roundBmp)
    $rg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $rg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $clipPath.AddEllipse(1, 1, $sz - 2, $sz - 2)
    $rg.SetClip($clipPath)
    $rg.FillRectangle($bgBrush, 0, 0, $sz, $sz)
    $rg.DrawImage($srcImg, $x, $y, $w, $h)
    $rg.ResetClip()

    # Subtle gold rim
    $goldPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#C59B27'), [Math]::Max(1.5, [float]($sz * 0.03)))
    $rg.DrawEllipse($goldPen, 1, 1, $sz - 2, $sz - 2)

    $roundPath = Join-Path $outDir 'ic_launcher_round.png'
    $roundBmp.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    $rg.Dispose()
    $roundBmp.Dispose()
}

$srcImg.Dispose()
Write-Host "Icons generated successfully in all mipmap directories!"
