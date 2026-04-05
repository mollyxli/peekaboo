const { Tray, Menu, nativeImage, app } = require('electron')
const path = require('path')

let tray = null

/**
 * Creates a tiny 22x22 purple icon from raw pixel data.
 * Used as fallback when no icon file is present.
 */
function createFallbackIcon() {
  // 22x22 RGBA purple square — nativeImage accepts raw Buffer with size hint
  const size = 22
  const buf = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4
    buf[idx] = 124      // R
    buf[idx + 1] = 58   // G
    buf[idx + 2] = 237  // B
    buf[idx + 3] = 200  // A
  }
  try {
    return nativeImage.createFromBuffer(buf, { width: size, height: size })
  } catch {
    return nativeImage.createEmpty()
  }
}

function buildMenu({ onTakeBreakNow, onSnooze5, onSnooze15, onOpenSettings, onPauseToday, onQuit, getStreak }) {
  const streak = getStreak()
  const streakLabel = streak > 0 ? `🔥 ${streak}-day streak` : 'No streak yet'
  return Menu.buildFromTemplate([
    { label: '🐾 Pixel Pal', enabled: false },
    { label: streakLabel, enabled: false },
    { type: 'separator' },
    { label: 'Take a break now', click: onTakeBreakNow },
    { type: 'separator' },
    { label: 'Snooze 5 min', click: onSnooze5 },
    { label: 'Snooze 15 min', click: onSnooze15 },
    { type: 'separator' },
    { label: 'Open Settings', click: onOpenSettings },
    { label: 'Pause Today', click: onPauseToday },
    { type: 'separator' },
    { label: 'Quit', click: onQuit },
  ])
}

function setupTray(callbacks) {
  const iconPath = path.join(__dirname, '../src/assets/tray-icon.png')
  let icon

  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) throw new Error('empty')
  } catch {
    icon = createFallbackIcon()
  }

  tray = new Tray(icon)
  tray.setToolTip('Pixel Pal')
  tray.setContextMenu(buildMenu(callbacks))
}

function updateTrayStreak(callbacks) {
  if (tray) tray.setContextMenu(buildMenu(callbacks))
}

module.exports = { setupTray, updateTrayStreak }
