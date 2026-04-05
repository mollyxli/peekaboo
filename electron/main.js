const { app, BrowserWindow, ipcMain, screen, nativeImage } = require('electron')
const path = require('path')
const Store = require('electron-store')

const isDev = process.env.NODE_ENV === 'development'
const store = new Store()

let widgetWindow = null
let overlayWindow = null
let settingsWindow = null

// ── Timer state ──────────────────────────────────────────────────────────────
let timerInterval = null
let timerSeconds = 20 * 60
let snoozeCount = 0
let isPaused = false
let alertSent = false
let timerActive = false

// ── URL helpers ───────────────────────────────────────────────────────────────
function getURL(page) {
  if (isDev) return `http://localhost:5173/${page}.html`
  return `file://${path.join(__dirname, `../dist/${page}.html`)}`
}

// ── Window creation ───────────────────────────────────────────────────────────
function createWidgetWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const W = 160, H = 160
  const defaultPos = { x: width - W - 16, y: height - H - 16 }
  const saved = store.get('widgetPosition', defaultPos)

  widgetWindow = new BrowserWindow({
    width: W,
    height: H,
    x: Math.max(0, Math.min(saved.x, width - W)),
    y: Math.max(0, Math.min(saved.y, height - H)),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  widgetWindow.loadURL(getURL('widget'))
  widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  widgetWindow.setAlwaysOnTop(true, 'screen-saver')

  if (isDev) {
    widgetWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

function createOverlayWindow() {
  const { bounds } = screen.getPrimaryDisplay()

  overlayWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  overlayWindow.loadURL(getURL('overlay'))
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')

  if (isDev) {
    overlayWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 360,
    height: 520,
    resizable: false,
    title: 'Pixel Pal Settings',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  settingsWindow.loadURL(getURL('settings'))
  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

// ── Timer engine ──────────────────────────────────────────────────────────────
function startTimer(seconds) {
  clearInterval(timerInterval)
  timerSeconds = seconds
  alertSent = false
  timerActive = true

  timerInterval = setInterval(() => {
    if (isPaused) return
    timerSeconds = Math.max(0, timerSeconds - 1)

    broadcast('timer:tick', timerSeconds)

    if (timerSeconds === 120 && !alertSent) {
      alertSent = true
      send(widgetWindow, 'timer:alert')
    }

    if (timerSeconds <= 0) {
      clearInterval(timerInterval)
      timerActive = false
      onTimerFired()
    }
  }, 1000)
}

function onTimerFired() {
  send(widgetWindow, 'timer:fire', { snoozeCount })
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.show()
    overlayWindow.focus()
    const settings = store.get('settings', { petName: 'Pixel' })
    send(overlayWindow, 'overlay:show', { snoozeCount, petName: settings.petName || 'Pixel' })
  } else {
    createOverlayWindow()
    overlayWindow.once('ready-to-show', () => {
      overlayWindow.show()
      overlayWindow.focus()
      const settings = store.get('settings', { petName: 'Pixel' })
      send(overlayWindow, 'overlay:show', { snoozeCount, petName: settings.petName || 'Pixel' })
    })
  }
}

function doSnooze(minutes) {
  snoozeCount++
  if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.hide()
  broadcast('timer:snooze', { snoozeCount, minutes })
  startTimer(minutes * 60)
}

function doBreakComplete() {
  snoozeCount = 0
  if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.hide()
  const streak = updateStreak()
  broadcast('timer:break-complete', { streak })
  if (app.trayCallbacks) app.updateTrayStreak(app.trayCallbacks)
  setTimeout(() => startTimer(20 * 60), 4000)
}

// ── Streak engine ─────────────────────────────────────────────────────────────
function updateStreak() {
  const today = new Date().toDateString()
  const lastBreak = store.get('lastBreakDate', null)
  let streak = store.get('currentStreak', 0)

  if (!lastBreak) {
    streak = 1
  } else {
    const last = new Date(lastBreak)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    if (last.toDateString() === today) {
      // Already completed a break today — no change
    } else if (last.toDateString() === yesterday.toDateString()) {
      streak += 1
    } else {
      streak = 1
    }
  }

  store.set('currentStreak', streak)
  store.set('lastBreakDate', today)
  return streak
}

// ── IPC helpers ───────────────────────────────────────────────────────────────
function send(win, channel, data) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data)
  }
}

function broadcast(channel, data) {
  send(widgetWindow, channel, data)
  send(overlayWindow, channel, data)
  send(settingsWindow, channel, data)
}

// ── IPC handlers ──────────────────────────────────────────────────────────────
function setupIPC() {
  ipcMain.handle('timer:snooze', (_, minutes) => doSnooze(minutes))
  ipcMain.handle('timer:break-complete', () => doBreakComplete())
  ipcMain.handle('timer:skip', () => doBreakComplete())
  ipcMain.handle('timer:start-now', () => {
    snoozeCount = 0
    if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.hide()
    startTimer(20 * 60)
    broadcast('timer:started', {})
  })
  ipcMain.handle('timer:pause-toggle', () => {
    isPaused = !isPaused
    broadcast('timer:paused', isPaused)
    return isPaused
  })
  ipcMain.handle('timer:get-state', () => ({
    seconds: timerSeconds,
    snoozeCount,
    isPaused,
    timerActive,
  }))

  ipcMain.handle('window:get-position', () => {
    if (widgetWindow) return widgetWindow.getPosition()
    return [0, 0]
  })
  ipcMain.handle('screen:get-work-area', () => {
    const wa = screen.getPrimaryDisplay().workArea
    return { x: wa.x, y: wa.y, width: wa.width, height: wa.height }
  })
  ipcMain.handle('window:move', (_, { x, y }) => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.setPosition(Math.round(x), Math.round(y))
    }
  })
  ipcMain.handle('window:drag-end', (_, { x, y }) => {
    store.set('widgetPosition', { x: Math.round(x), y: Math.round(y) })
  })
  ipcMain.handle('window:open-settings', () => createSettingsWindow())

  ipcMain.handle('store:get', (_, key) => store.get(key))
  ipcMain.handle('store:set', (_, key, value) => store.set(key, value))

  ipcMain.handle('streak:get', () => ({
    currentStreak: store.get('currentStreak', 0),
    lastBreakDate: store.get('lastBreakDate', null),
  }))

  ipcMain.handle('settings:get', () =>
    store.get('settings', {
      petName: 'Pixel',
      workMinutes: 20,
      soundEnabled: true,
      theme: 'dark',
    })
  )
  ipcMain.handle('settings:set', (_, settings) => {
    store.set('settings', settings)
    broadcast('settings:updated', settings)
  })
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWidgetWindow()
  createOverlayWindow()
  setupIPC()

  // Setup tray after windows exist
  const { setupTray, updateTrayStreak } = require('./tray')
  const trayCallbacks = {
    onTakeBreakNow: () => {
      if (timerActive) clearInterval(timerInterval)
      onTimerFired()
    },
    onSnooze5: () => doSnooze(5),
    onSnooze15: () => doSnooze(15),
    onOpenSettings: () => createSettingsWindow(),
    onPauseToday: () => {
      isPaused = !isPaused
      broadcast('timer:paused', isPaused)
    },
    onQuit: () => app.quit(),
    getStreak: () => store.get('currentStreak', 0),
  }
  setupTray(trayCallbacks)
  app.trayCallbacks = trayCallbacks
  app.updateTrayStreak = updateTrayStreak

  startTimer(20 * 60)
})

// Keep app alive even with no windows
app.on('window-all-closed', () => {
  // intentional noop — tray keeps app alive
})

app.on('before-quit', () => {
  clearInterval(timerInterval)
})
