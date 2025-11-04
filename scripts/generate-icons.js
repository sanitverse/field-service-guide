// Simple icon generation script for PWA
// This creates basic colored squares as placeholders for the PWA icons

const fs = require('fs')
const path = require('path')

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Create a simple SVG icon template
function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <g transform="translate(${size * 0.25}, ${size * 0.25})">
    <path d="M${size * 0.15} ${size * 0.1}L${size * 0.35} ${size * 0.1}L${size * 0.25} ${size * 0.4}Z" fill="white"/>
    <rect x="${size * 0.1}" y="${size * 0.15}" width="${size * 0.3}" height="${size * 0.05}" fill="white"/>
  </g>
</svg>`
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

console.log('Generating PWA icons...')

// Generate SVG files for each size
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size)
  const filename = `icon-${size}x${size}.svg`
  const filepath = path.join(iconsDir, filename)
  
  fs.writeFileSync(filepath, svgContent)
  console.log(`Created ${filename}`)
})

// Create a simple PNG placeholder message
const pngMessage = `
PWA Icon Placeholders Generated

To complete the PWA setup, you should:

1. Replace the SVG files in public/icons/ with proper PNG icons
2. Use a tool like ImageMagick or an online converter to convert SVGs to PNGs
3. Or create custom icons using design software

For now, the SVG files will work as placeholders for development.

Required PNG files:
${iconSizes.map(size => `- icon-${size}x${size}.png`).join('\n')}

You can also create shortcut icons:
- shortcut-task.png (96x96)
- shortcut-upload.png (96x96) 
- shortcut-ai.png (96x96)
`

fs.writeFileSync(path.join(iconsDir, 'README.txt'), pngMessage)

console.log('Icon generation complete!')
console.log('Check public/icons/README.txt for next steps')