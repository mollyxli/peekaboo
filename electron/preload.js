const { contextBridge, ipcRenderer } = require('electron')

const VALID_CHANNELS = new Set([
  'timer:tick',
  'timer:alert',
  'timer:fire',
  'timer:snooze',
  'timer:break-complete',
  'timer:paused',
  'timer:started',
  'overlay:show',
  'settings:updated',
])

contextBridge.exposeInMainWorld('electronAPI', {
  // Timer controls
  snooze: (minutes) => ipcRenderer.invoke('timer:snooze', minutes),
  breakComplete: () => ipcRenderer.invoke('timer:break-complete'),
  skipBreak: () => ipcRenderer.invoke('timer:skip'),
  startTimerNow: () => ipcRenderer.invoke('timer:start-now'),
  pauseToggle: () => ipcRenderer.invoke('timer:pause-toggle'),
  getTimerState: () => ipcRenderer.invoke('timer:get-state'),

  // Widget window drag
  getWindowPosition: () => ipcRenderer.invoke('window:get-position'),
  moveWindow: (x, y) => ipcRenderer.invoke('window:move', { x, y }),
  dragEnd: (x, y) => ipcRenderer.invoke('window:drag-end', { x, y }),
  getScreenWorkArea: () => ipcRenderer.invoke('screen:get-work-area'),

  // App windows
  openSettings: () => ipcRenderer.invoke('window:open-settings'),

  // Persistence
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store:set', key, value),

  // Domain
  getStreak: () => ipcRenderer.invoke('streak:get'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings) => ipcRenderer.invoke('settings:set', settings),

  // IPC event bus — only whitelisted channels
  on: (channel, callback) => {
    if (!VALID_CHANNELS.has(channel)) return
    const wrapped = (_event, ...args) => callback(...args)
    ipcRenderer.on(channel, wrapped)
    return wrapped // return so caller can remove it
  },
  off: (channel, callback) => {
    if (!VALID_CHANNELS.has(channel)) return
    ipcRenderer.removeListener(channel, callback)
  },
})
