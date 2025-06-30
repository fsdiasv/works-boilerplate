const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// Create a simple base icon with the letter "W" for Works
const createBaseIcon = async (size, isMaskable = false) => {
  const padding = isMaskable ? Math.round(size * 0.1) : 0
  const contentSize = size - padding * 2

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${isMaskable ? `<rect width="${size}" height="${size}" fill="#3b82f6" />` : ''}
      <rect x="${padding}" y="${padding}" width="${contentSize}" height="${contentSize}" rx="${contentSize * 0.15}" fill="#3b82f6" />
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
            font-family="Arial, sans-serif" font-size="${contentSize * 0.5}" font-weight="bold" fill="white">W</text>
    </svg>
  `

  return Buffer.from(svg)
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const maskableSizes = [192, 512]

async function generateIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons')

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
  }

  // Generate regular icons
  for (const size of sizes) {
    const svg = await createBaseIcon(size)
    await sharp(svg)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`))
    console.log(`Generated icon-${size}x${size}.png`)
  }

  // Generate maskable icons
  for (const size of maskableSizes) {
    const svg = await createBaseIcon(size, true)
    await sharp(svg)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}-maskable.png`))
    console.log(`Generated icon-${size}x${size}-maskable.png`)
  }

  // Generate shortcut icons
  const shortcuts = ['dashboard', 'settings']
  for (const shortcut of shortcuts) {
    const svg = await createBaseIcon(96)
    await sharp(svg)
      .png()
      .toFile(path.join(iconsDir, `shortcut-${shortcut}.png`))
    console.log(`Generated shortcut-${shortcut}.png`)
  }

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots')
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true })
  }

  // Generate placeholder screenshots
  const screenshots = [
    { name: 'mobile-home.png', width: 640, height: 1136 },
    { name: 'mobile-dashboard.png', width: 640, height: 1136 },
    { name: 'desktop-home.png', width: 1280, height: 720 },
  ]

  for (const screenshot of screenshots) {
    const svg = `
      <svg width="${screenshot.width}" height="${screenshot.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${screenshot.width}" height="${screenshot.height}" fill="#f3f4f6" />
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial, sans-serif" font-size="24" fill="#6b7280">${screenshot.name}</text>
      </svg>
    `

    await sharp(Buffer.from(svg)).png().toFile(path.join(screenshotsDir, screenshot.name))
    console.log(`Generated ${screenshot.name}`)
  }

  console.log('All PWA assets generated successfully!')
}

generateIcons().catch(console.error)
