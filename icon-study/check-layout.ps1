Add-Type -AssemblyName System.Drawing
$icon = [System.Drawing.Bitmap]::new((Join-Path $PSScriptRoot '10-contained-flame.png'))
try {
    $dark = @(); $green = @()
    # Sample every fourth source pixel; tolerance is below one pixel at 256px.
    for ($y = 0; $y -lt $icon.Height; $y += 4) {
        for ($x = 0; $x -lt $icon.Width; $x += 4) {
            $p = $icon.GetPixel($x, $y)
            if ($p.R -lt 100 -and $p.G -lt 100 -and $p.B -lt 100) { $dark += ,@($x, $y) }
            if ($p.G -gt 140 -and $p.G -gt $p.R * 1.25 -and $p.B -lt 100) { $green += ,@($x, $y) }
        }
    }
    if (!$dark.Count -or !$green.Count) { throw 'Missing bracket or flame pixels' }
    $dx = $dark | ForEach-Object { $_[0] } | Measure-Object -Minimum -Maximum
    $dy = $dark | ForEach-Object { $_[1] } | Measure-Object -Minimum -Maximum
    $gx = $green | ForEach-Object { $_[0] } | Measure-Object -Minimum -Maximum
    $gy = $green | ForEach-Object { $_[1] } | Measure-Object -Minimum -Maximum
    $scale = 256 / $icon.Width
    $margins = @($dx.Minimum, $dy.Minimum, ($icon.Width - 1 - $dx.Maximum), ($icon.Height - 1 - $dy.Maximum)) | ForEach-Object { $_ * $scale }
    foreach ($margin in $margins) { if ($margin -lt 4 -or $margin -gt 6) { throw "Margin outside 5 +/- 1px: $margin" } }
    $top = ($dark | Where-Object { $_[0] -gt $icon.Width / 5 -and $_[0] -lt $icon.Width / 4 -and $_[1] -lt $icon.Height / 2 } | ForEach-Object { $_[1] } | Measure-Object -Maximum).Maximum
    $bottom = ($dark | Where-Object { $_[0] -gt $icon.Width * 0.75 -and $_[0] -lt $icon.Width * 0.8 -and $_[1] -gt $icon.Height / 2 } | ForEach-Object { $_[1] } | Measure-Object -Minimum).Minimum
    $left = ($dark | Where-Object { $_[1] -gt $icon.Height / 5 -and $_[1] -lt $icon.Height / 4 } | ForEach-Object { $_[0] } | Measure-Object -Maximum).Maximum
    $right = ($dark | Where-Object { $_[1] -gt $icon.Height * 0.75 -and $_[1] -lt $icon.Height * 0.8 } | ForEach-Object { $_[0] } | Measure-Object -Minimum).Minimum
    if ($gx.Minimum -le $left -or $gx.Maximum -ge $right -or $gy.Minimum -le $top -or $gy.Maximum -ge $bottom) { throw 'Flame extends outside the bracket inner rectangle' }
    'Bracket margins at 256px (left, top, right, bottom): ' + (($margins | ForEach-Object { [Math]::Round($_, 2) }) -join ', ')
    'Flame is fully inside the bracket inner rectangle.'
} finally { $icon.Dispose() }
