import React, { useState, useEffect } from 'react'

const DEFAULT_SETTINGS = {
  petName: 'Pixel',
  workMinutes: 20,
  soundEnabled: true,
  theme: 'dark',
}

function Label({ children }) {
  return <label className="block text-sm font-medium text-white/70 mb-1">{children}</label>
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">{title}</h2>
      {children}
    </div>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.electronAPI.getSettings().then((s) => {
      setSettings({ ...DEFAULT_SETTINGS, ...s })
      setLoading(false)
    })
  }, [])

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }))

  const handleSave = async () => {
    await window.electronAPI.setSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#12122a] flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#12122a] text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-sm">🐾</div>
        <div>
          <h1 className="text-lg font-bold">Pixel Pal</h1>
          <p className="text-white/40 text-xs">Settings</p>
        </div>
      </div>

      <div className="flex-1">
        {/* Pet section */}
        <Section title="Your Pet">
          <div className="mb-4">
            <Label>Pet Name</Label>
            <input
              type="text"
              value={settings.petName}
              onChange={(e) => update('petName', e.target.value)}
              maxLength={20}
              className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-colors"
              placeholder="Pixel"
            />
          </div>
        </Section>

        {/* Timer section */}
        <Section title="Break Timer">
          <div className="mb-4">
            <Label>Work interval: {settings.workMinutes} minutes</Label>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={settings.workMinutes}
              onChange={(e) => update('workMinutes', Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-white/30 text-[10px] mt-1">
              <span>10 min</span>
              <span>60 min</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <div>
              <div className="text-sm font-medium">Sound alerts</div>
              <div className="text-white/40 text-xs">Chime when break starts</div>
            </div>
            <button
              onClick={() => update('soundEnabled', !settings.soundEnabled)}
              className={[
                'w-10 h-6 rounded-full transition-colors duration-200 relative cursor-pointer',
                settings.soundEnabled ? 'bg-purple-500' : 'bg-white/20',
              ].join(' ')}
            >
              <div className={[
                'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                settings.soundEnabled ? 'translate-x-5' : 'translate-x-1',
              ].join(' ')} />
            </button>
          </div>
        </Section>

        {/* Info section */}
        <Section title="About">
          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Version</span>
              <span className="text-white/80">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Rule</span>
              <span className="text-white/80">20-20-20</span>
            </div>
            <p className="text-white/30 text-xs pt-1">
              Every {settings.workMinutes} minutes, look at something 20 feet away for 20 seconds. Pixel will remind you.
            </p>
          </div>
        </Section>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={[
          'w-full py-3 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer',
          saved
            ? 'bg-green-600 text-white'
            : 'bg-purple-600 hover:bg-purple-500 text-white',
        ].join(' ')}
      >
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
