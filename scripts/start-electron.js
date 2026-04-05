/**
 * Waits for the Vite dev server then launches Electron.
 * Used instead of `wait-on ... && electron .` because concurrently v8
 * does not evaluate shell operators in command strings.
 */
const http = require('http')
const { spawn } = require('child_process')
const path = require('path')

const VITE_URL = 'http://localhost:5173'
const POLL_MS = 500
const TIMEOUT_MS = 30_000

function checkServer(url) {
  return new Promise((resolve) => {
    http
      .get(url, (res) => resolve(res.statusCode < 500))
      .on('error', () => resolve(false))
  })
}

async function waitForServer() {
  const deadline = Date.now() + TIMEOUT_MS
  while (Date.now() < deadline) {
    if (await checkServer(VITE_URL)) return true
    await new Promise((r) => setTimeout(r, POLL_MS))
  }
  return false
}

async function main() {
  console.log('[start-electron] Waiting for Vite server…')
  const ready = await waitForServer()
  if (!ready) {
    console.error('[start-electron] Vite server did not start in time.')
    process.exit(1)
  }

  console.log('[start-electron] Vite is up. Launching Electron…')
  const electronBin = path.join(
    __dirname,
    '../node_modules/.bin/electron'
  )

  const child = spawn(electronBin, ['.', '--disable-gpu'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' },
  })

  child.on('exit', (code) => process.exit(code ?? 0))
}

main()
