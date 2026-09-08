# Revision 7A

Mode: built-in image generation; precise layout edit of `07-combined-flame.png`. Saved asset: `10-contained-flame.png`. Original retained.

Measured outer bracket margins at 256px: left/top 4.9px, right/bottom 5.1px. Color-segmented bounds confirm the flame lies inside the bracket inner rectangle. Run `check-layout.ps1` to repeat the sampled check. These are raster concept measurements, not a claim of pixel-exact source preservation.

## Prompt

Use case: precise-object-edit. Edit supplied greenflame icon #7. Preserve the exact flame silhouette (filled lime green, tall curved tongue, small RIGHT tongue, round base), its orientation, charcoal bracket style, colors and ivory background. Change ONLY layout: move upper-left bracket to near top-left canvas edge and lower-right bracket to near bottom-right canvas edge. BOTH brackets must have approximately 1.95% of canvas width clearance from the respective image edges: equivalent to 5px on a 256x256 icon, or 20px on a 1024 canvas. This means tiny equal ivory margins on TOP, LEFT, BOTTOM, RIGHT, not the original large margins. Keep their current long L arms, stroke thickness and rounded elbows; do NOT add the other two brackets or close the border. Fit the WHOLE flame inside the rectangle defined by bracket INNER edges, including the top tip: visible ivory gap above flame tip below top bracket inner horizontal line, and below flame base above bottom bracket inner horizontal line. Recenter/scale flame uniformly only if necessary for containment. Square image, no text, no labels, no extra decoration. The two L corners should span nearly the full canvas diagonal, while the flame remains completely contained with clear breathing room.
