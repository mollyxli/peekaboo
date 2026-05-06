import React, { useState, useEffect, useRef, useCallback } from 'react'
import standImg1 from '../assets/pets/pixel-art/stand_1.png'
import standImg2 from '../assets/pets/pixel-art/stand_2.png'
import happySprite from '../assets/pets/pixel-art/happy.png'

const BREAK_DURATION = 20 // seconds
const BLINK_DURATION = 150 // ms eyes stay closed

const COMPLETION_MESSAGES = [
  '{name} approves.',
  'your eyes thank you.',
  'streak intact.',
  "that's what i'm talking about.",
  '{name} is pleased.',
  'well done.',
  'eyes: recharged.',
]

const CONFETTI_COLORS = ['#f5c542', '#D4537E', '#A4D944', '#7AAE1A', '#534AB7', '#f0ead6', '#7F77DD']

// Synthesizes a short two-note bell chime via Web Audio so we don't need an asset.
function playBellChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    const notes = [
      { freq: 988, start: 0,    dur: 1.4 }, // B5
      { freq: 1319, start: 0.18, dur: 1.4 }, // E6
    ]
    notes.forEach(({ freq, start, dur }) => {
      const t0 = now + start
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(0.25, t0 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + dur + 0.05)
    })
    setTimeout(() => ctx.close(), 1800)
  } catch {}
}

// ── Pixel-art CTA button ────────────────────────────────────────────────────
// SVG edges for the stepped shape + uniform border via CSS border on content.
import unionSideDark from '../assets/ui/union-side-dark.svg'
import unionCornerDark from '../assets/ui/union-corner-dark.svg'
import unionSideGreen from '../assets/ui/union-side-green.svg'
import unionCornerGreen from '../assets/ui/union-corner-green.svg'

function pixelClip(s) {
  const c = 2 * s
  return `polygon(
    0 ${c}px, ${s}px ${c}px, ${s}px ${s}px, ${c}px ${s}px, ${c}px 0,
    calc(100% - ${c}px) 0, calc(100% - ${c}px) ${s}px, calc(100% - ${s}px) ${s}px, calc(100% - ${s}px) ${c}px, 100% ${c}px,
    100% calc(100% - ${c}px), calc(100% - ${s}px) calc(100% - ${c}px), calc(100% - ${s}px) calc(100% - ${s}px), calc(100% - ${c}px) calc(100% - ${s}px), calc(100% - ${c}px) 100%,
    ${c}px 100%, ${c}px calc(100% - ${s}px), ${s}px calc(100% - ${s}px), ${s}px calc(100% - ${c}px), 0 calc(100% - ${c}px)
  )`
}

function PixelButton({ children, variant = 'dark', onClick }) {
  const isDark = variant === 'dark'
  const s = isDark ? 3 : 4.5
  const h = isDark ? 37 : 55.5
  const bgColor = isDark ? '#31133B' : '#7AAE1A'
  const borderColor = isDark ? '#05131d' : '#A4D945'
  const textColor = isDark ? 'rgba(214,208,216,0.25)' : 'white'
  const fontSize = isDark ? 17 : 24
  const sideImg = isDark ? unionSideDark : unionSideGreen
  const cornerImg = isDark ? unionCornerDark : unionCornerGreen
  const edgeW = 3 * s
  const borderW = isDark ? 2 : 3 // visual border thickness
  const clip = pixelClip(s)

  const edge = (
    <div className="flex flex-col shrink-0" style={{ height: h }}>
      {/* Side fill shape */}
      <div className="absolute left-0 top-0" style={{ width: edgeW, height: h }}>
        <img alt="" src={sideImg} className="block max-w-none" style={{ width: '100%', height: '100%' }} />
      </div>
      {/* Top corner */}
      <div className="relative shrink-0" style={{ width: edgeW, height: edgeW, zIndex: 1 }}>
        <img alt="" src={cornerImg} className="absolute block max-w-none" style={{ width: '100%', height: '100%' }} />
      </div>
      {/* Border strip */}
      <div className="relative flex-1 min-h-px" style={{ width: isDark ? borderW : s, backgroundColor: borderColor, zIndex: 1 }} />
      {/* Bottom corner (flipped) */}
      <div className="relative shrink-0" style={{ transform: 'scaleY(-1)', width: edgeW, height: edgeW, zIndex: 1 }}>
        <img alt="" src={cornerImg} className="block max-w-none" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )

  return (
    <div className="relative inline-block cursor-pointer" onClick={onClick}>
      {/* Unified shadow */}
      <div className="absolute inset-0" style={{
        clipPath: clip,
        backgroundColor: '#05131d',
        transform: `translate(${s}px, ${s}px)`,
      }} />
      {/* Button body */}
      <div className="relative inline-flex items-start">
        {/* Left edge */}
        <div className="relative shrink-0" style={{ width: edgeW, height: h }}>
          {edge}
        </div>
        {/* Content — border-top and border-bottom instead of bar divs for even thickness */}
        <div
          className="flex items-center justify-center shrink-0 font-silkscreen font-bold whitespace-nowrap"
          style={{
            height: h,
            backgroundColor: bgColor,
            borderTop: `${isDark ? 1 : s}px solid ${borderColor}`,
            borderBottom: `${isDark ? borderW + 2 : s}px solid ${borderColor}`,
            color: textColor,
            fontSize,
            padding: `0 ${isDark ? 10 : 15}px`,
            lineHeight: 1.5,
            boxSizing: 'border-box',
          }}
        >
          {children}
        </div>
        {/* Right edge (mirrored) */}
        <div className="relative shrink-0" style={{ width: edgeW, height: h, transform: 'scaleX(-1)' }}>
          {edge}
        </div>
      </div>
    </div>
  )
}

// ── Pixel progress bar ──────────────────────────────────────────────────────
function PixelProgressBar({ progress, isComplete }) {
  const filledCount = isComplete ? 20 : Math.round(progress * 20)
  return (
    <div className="flex gap-[4px]">
      {Array.from({ length: 20 }, (_, i) => {
        const filled = i < filledCount
        if (isComplete) {
          return (
            <div
              key={i}
              className="w-4 h-4"
              style={{ backgroundColor: i % 2 === 0 ? '#92D11F' : '#7AAE1A' }}
            />
          )
        }
        return filled ? (
          <div key={i} className="w-4 h-4 bg-[#f5c542]" />
        ) : (
          <div
            key={i}
            className="w-4 h-4 bg-[#13132a]"
            style={{ border: '1px solid rgba(240,234,214,0.12)' }}
          />
        )
      })}
    </div>
  )
}

// ── Main overlay ───────────────────────────────────────────────────────────────
export default function Overlay() {
  const [visible, setVisible] = useState(false)
  const [countdown, setCountdown] = useState(BREAK_DURATION)
  const [snoozeCount, setSnoozeCount] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [completionMessage, setCompletionMessage] = useState(null)
  const petName = 'vector'
  const [blinkClosed, setBlinkClosed] = useState(false)

  const countdownRef = useRef(BREAK_DURATION)
  const timerRef = useRef(null)
  const confettiRef = useRef(null)
  const soundEnabledRef = useRef(true)

  const startBreak = useCallback((sc) => {
    setSnoozeCount(sc)
    setCountdown(BREAK_DURATION)
    countdownRef.current = BREAK_DURATION
    setIsComplete(false)
    setCompletionMessage(null)
    setVisible(true)
  }, [])

  const endBreak = useCallback(async () => {
    clearInterval(timerRef.current)
    // Clean up any remaining confetti
    if (confettiRef.current) {
      confettiRef.current.innerHTML = ''
    }
    setVisible(false)
    await window.electronAPI.breakComplete()
  }, [])

  const handleSnooze = useCallback(async (minutes) => {
    clearInterval(timerRef.current)
    if (confettiRef.current) {
      confettiRef.current.innerHTML = ''
    }
    setVisible(false)
    await window.electronAPI.snooze(minutes)
  }, [])

  // Confetti spawner
  const spawnConfetti = useCallback(() => {
    const container = confettiRef.current
    if (!container) return
    const count = 20 + Math.floor(Math.random() * 5)

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div')
      const size = Math.random() > 0.5 ? 4 : 6
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]

      el.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:${color};border-radius:0;pointer-events:none;`

      const startX = container.offsetWidth / 2 + (Math.random() - 0.5) * 80
      const startY = container.offsetHeight * 0.35
      el.style.left = `${startX}px`
      el.style.top = `${startY}px`
      container.appendChild(el)

      const driftX = (Math.random() - 0.5) * 120
      const duration = 600 + Math.random() * 800
      const delay = Math.random() * 400

      el.animate([
        { transform: 'translateY(0) translateX(0)', opacity: 1 },
        { transform: `translateY(-50px) translateX(${driftX * 0.4}px)`, opacity: 1, offset: 0.3 },
        { transform: `translateY(150px) translateX(${driftX}px)`, opacity: 0 },
      ], { duration, delay, easing: 'ease-out', fill: 'forwards' })

      setTimeout(() => el.remove(), duration + delay + 50)
    }
  }, [])

  // Fire confetti + bell when complete. The bell matters most here: the user
  // is looking 20ft away, so the audio cue is how they know they can come back.
  useEffect(() => {
    if (!isComplete) return
    spawnConfetti()
    if (soundEnabledRef.current) playBellChime()
  }, [isComplete, spawnConfetti])

  // Warm assets only used on the completion screen so the Back-to-work button
  // and happy pet don't pop in unstyled when isComplete first flips.
  useEffect(() => {
    ;[unionSideGreen, unionCornerGreen, happySprite].forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [])

  // Load sound preference and stay in sync with settings updates.
  useEffect(() => {
    let cancelled = false
    const apply = (s) => { soundEnabledRef.current = s?.soundEnabled !== false }
    window.electronAPI.getSettings().then((s) => {
      if (!cancelled) apply(s)
    }).catch(() => {})
    const wrapped = window.electronAPI.on('settings:updated', apply)
    return () => {
      cancelled = true
      window.electronAPI.off('settings:updated', wrapped)
    }
  }, [])

  // Countdown tick
  useEffect(() => {
    if (!visible) return
    clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      countdownRef.current -= 1
      setCountdown(countdownRef.current)
      if (countdownRef.current <= 0) {
        clearInterval(timerRef.current)
        setIsComplete(true)
        const msg = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]
        setCompletionMessage(msg)
      }
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [visible])

  // IPC listener
  useEffect(() => {
    const wrapped = window.electronAPI.on('overlay:show', ({ snoozeCount: sc, petName: name }) => {
      startBreak(sc ?? 0, name)
    })
    return () => window.electronAPI.off('overlay:show', wrapped)
  }, [startBreak])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      if (confettiRef.current) confettiRef.current.innerHTML = ''
    }
  }, [])

  // Blink animation during countdown (not when complete)
  useEffect(() => {
    if (!visible || isComplete) {
      setBlinkClosed(false)
      return
    }
    let timeout
    const scheduleBlink = (first) => {
      const delay = first ? 400 + Math.random() * 400 : 1500 + Math.random() * 2500
      timeout = setTimeout(() => {
        setBlinkClosed(true)
        setTimeout(() => {
          setBlinkClosed(false)
          scheduleBlink(false)
        }, BLINK_DURATION)
      }, delay)
    }
    scheduleBlink(true)
    return () => clearTimeout(timeout)
  }, [visible, isComplete])

  if (!visible) {
    return <div className="fixed inset-0 bg-transparent" />
  }

  const progress = (BREAK_DURATION - countdown) / BREAK_DURATION

  const countdownColor = isComplete
    ? 'rgba(214,208,216,0.4)'
    : countdown <= 5
      ? '#f5c542'
      : '#D6D0D8'

  const headerText = isComplete
    ? (completionMessage || '').replace('{name}', petName.toLowerCase())
    : 'look 20 feet away'

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#190A1E]">
      {/* Confetti container */}
      <div ref={confettiRef} className="absolute inset-0 pointer-events-none overflow-hidden" />

      {/* Header */}
      <p className="font-press-start text-[24px] text-[#D6D0D8] text-center px-4" style={{ lineHeight: 1, marginBottom: 0 }}>
        {headerText}
      </p>

      {/* Pet sprite — blinks during countdown, happy on complete */}
      <img
        src={isComplete ? happySprite : (blinkClosed ? standImg2 : standImg1)}
        alt={petName}
        className="animate-bob"
        style={{ width: '221px', height: '221px', imageRendering: 'pixelated', marginBottom: 0 }}
      />

      {/* Countdown number */}
      <div
        className="font-silkscreen font-bold text-center leading-none"
        style={{
          fontSize: '128px',
          color: countdownColor,
          transition: 'color 0.3s ease',
          marginBottom: '22px',
        }}
      >
        {String(countdown).padStart(2, '0')}
      </div>

      {/* Label */}
      <div
        className="font-silkscreen font-bold text-[16px] text-center"
        style={{
          color: isComplete ? '#7AAE1A' : '#D6D0D8',
          transition: 'color 0.3s ease',
          marginBottom: '27px',
        }}
      >
        {isComplete ? 'done' : 'seconds'}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '84px' }}>
        <PixelProgressBar progress={progress} isComplete={isComplete} />
      </div>

      {/* Buttons */}
      <div>
        {isComplete ? (
          <PixelButton variant="green" onClick={endBreak}>
            Back to work
          </PixelButton>
        ) : (
          <div className="flex gap-6">
            <PixelButton variant="dark" onClick={() => handleSnooze(5)}>
              Snooze 5 min
            </PixelButton>
            <PixelButton variant="dark" onClick={() => handleSnooze(15)}>
              Snooze 15 min
            </PixelButton>
          </div>
        )}
      </div>
    </div>
  )
}
