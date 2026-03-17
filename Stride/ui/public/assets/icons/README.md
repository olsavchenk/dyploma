# PWA Icons

This directory should contain the following icon files for the Progressive Web App:

## Required Icons:
- `icon-72x72.png` (72x72 pixels)
- `icon-96x96.png` (96x96 pixels)
- `icon-128x128.png` (128x128 pixels)
- `icon-144x144.png` (144x144 pixels)
- `icon-152x152.png` (152x152 pixels)
- `icon-192x192.png` (192x192 pixels)
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels)
- `icon-192x192-maskable.png` (192x192 pixels, maskable)
- `icon-512x512-maskable.png` (512x512 pixels, maskable)

## Generating Icons:

You can generate all required icons from a single source SVG or PNG using tools like:

1. **PWA Asset Generator**: https://github.com/elegantapp/pwa-asset-generator
   ```bash
   npx pwa-asset-generator source-logo.svg public/assets/icons --icon-only --path-override assets/icons
   ```

2. **RealFaviconGenerator**: https://realfavicongenerator.net/

3. **PWA Builder**: https://www.pwabuilder.com/imageGenerator

## Design Guidelines:
- Use the Stride brand colors (primary: #6366f1)
- Ensure the logo is centered and has sufficient padding
- Maskable icons should follow the safe zone guidelines (80% of the canvas)
- Test icons on both light and dark backgrounds
