import React, { useState, useEffect, useRef, useCallback } from 'react'
import sleepingImg1 from '../assets/pets/pixel-art/sleeping_1.png'
import sleepingImg2 from '../assets/pets/pixel-art/sleeping_2.png'
import standImg1 from '../assets/pets/pixel-art/stand_1.png'
import standImg2 from '../assets/pets/pixel-art/stand_2.png'
import standWalkImg from '../assets/pets/pixel-art/stand_walk.png'
import walkingImg1 from '../assets/pets/pixel-art/walking_v4_1.png'
import walkingImg2 from '../assets/pets/pixel-art/walking_v4_2.png'
import walkingImg3 from '../assets/pets/pixel-art/walking_v4_3.png'
import sadImg from '../assets/pets/pixel-art/sad.png'
import angryImg from '../assets/pets/pixel-art/angry.png'
import happyImg from '../assets/pets/pixel-art/happy.png'
import usePetStore from '../store/usePetStore'
import useTimerStore from '../store/useTimerStore'
import { MOODS, IDLE_BEHAVIORS, pickWeightedBehavior, getMoodForSnoozeCount } from '../engine/moods'
import { getMilestoneMessage } from '../engine/streak'

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── Pet face pixel art using divs ─────────────────────────────────────────────
function Eye({ state, side }) {
  if (state === 'closed') {
    return <div className="w-3 h-0.5 bg-white/70 rounded-full" />
  }
  if (state === 'half') {
    return <div className="w-3 h-1 bg-white/80 rounded-t-full" />
  }
  if (state === 'squint') {
    return (
      <div className="w-3 h-0.5 bg-white/70 rounded-full"
        style={{ transform: side === 'left' ? 'rotate(-10deg)' : 'rotate(10deg)' }} />
    )
  }
  if (state === 'droopy') {
    return (
      <div className="w-3 h-2 bg-white/60 rounded-full relative overflow-hidden">
        <div className="absolute bottom-0 w-full h-1 bg-white/20" />
      </div>
    )
  }
  if (state === 'glare') {
    return (
      <div className="w-3 h-2 bg-red-300 rounded-full flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-red-900 rounded-full" />
      </div>
    )
  }
  if (state === 'wide' || state === 'open') {
    return (
      <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
      </div>
    )
  }
  if (state === 'happy') {
    return <div className="w-3 h-1.5 bg-white rounded-t-full" style={{ borderRadius: '50% 50% 0 0' }} />
  }
  // default open
  return (
    <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
    </div>
  )
}

function PetFace({ mood }) {
  const config = MOODS[mood] || MOODS.sleeping
  const eye = config.eyeState

  return (
    <div className="flex flex-col items-center gap-1.5 pointer-events-none">
      {/* Ears */}
      <div className="flex gap-5 -mb-1">
        <div className="w-2.5 h-3 bg-white/30 rounded-t-full" />
        <div className="w-2.5 h-3 bg-white/30 rounded-t-full" />
      </div>

      {/* Eyes */}
      <div className="flex gap-2.5">
        <Eye state={eye} side="left" />
        <Eye state={eye} side="right" />
      </div>

      {/* Nose */}
      <div className="w-2 h-1 bg-white/60 rounded-full" />

      {/* Mouth — expression-aware */}
      {mood === 'yawning' && (
        <div className="w-6 h-4 bg-white/80 rounded-full border border-white/40 flex items-center justify-center">
          <div className="w-4 h-2.5 bg-pink-400/60 rounded-full" />
        </div>
      )}
      {mood === 'happy' && (
        <div className="w-6 h-3 border-b-2 border-white/80 rounded-b-full" />
      )}
      {mood === 'sad' && (
        <div className="w-4 h-2 border-t-2 border-white/60 rounded-t-full mt-0.5" />
      )}
      {mood === 'reminder' && (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-4 h-1 bg-white/70 rounded-full" />
          <div className="text-[6px] text-white/80 leading-none">!</div>
        </div>
      )}
      {!['yawning', 'happy', 'sad', 'reminder'].includes(mood) && (
        <div className="w-3 h-0.5 bg-white/50 rounded-full" />
      )}

      {/* Tail (happy) */}
      {mood === 'happy' && (
        <div className="absolute right-0 top-1/2 w-2 h-5 bg-white/40 rounded-full origin-bottom animate-tail-wag"
          style={{ transform: 'translateX(6px) rotate(-20deg)' }} />
      )}

      {/* Teardrop (sad) */}
      {mood === 'sad' && (
        <div className="absolute bottom-3 right-5 w-1 h-2 bg-blue-300/80 rounded-b-full" />
      )}

      {/* Stretch arms */}
      {mood === 'stretching' && (
        <div className="flex gap-8 -mt-1">
          <div className="w-3 h-1 bg-white/40 rounded-full -rotate-45" />
          <div className="w-3 h-1 bg-white/40 rounded-full rotate-45" />
        </div>
      )}

      {/* Paw reaching toward corner */}
      {mood === 'pawing' && (
        <div className="absolute bottom-1 right-1 flex flex-col items-end gap-0.5">
          <div className="w-4 h-1.5 bg-white/50 rounded-full" />
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1 h-1 bg-white/40 rounded-full" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ZzzParticles() {
  return (
    <div className="absolute top-1 right-1 pointer-events-none overflow-visible">
      <span className="absolute text-white/70 text-[8px] font-bold animate-float-up" style={{ top: 0, right: 0 }}>z</span>
      <span className="absolute text-white/50 text-[9px] font-bold animate-float-up-delayed" style={{ top: -4, right: 4 }}>z</span>
      <span className="absolute text-white/30 text-[11px] font-bold animate-float-up-slow" style={{ top: -10, right: 8 }}>Z</span>
    </div>
  )
}

const SPRITE_MAP = {
  looking: standImg1,
  stretching: standImg1,
  yawning: standImg1,
  pawing: standWalkImg,
  alert: standImg1,
  reminder: standImg1,
  sad: sadImg,
  angry: angryImg,
  happy: happyImg,
}

const BREATHE_FRAMES = [sleepingImg1, sleepingImg2]
const BREATHE_INTERVAL = 2500 // ms per frame
const BLINK_DURATION = 150    // ms eyes stay closed

function getSpriteForMood(mood) {
  return SPRITE_MAP[mood] || sleepingImg1
}

const imgStyle = {
  position: 'absolute', inset: 0,
  width: '100%', height: '100%',
  objectFit: 'contain',
  objectPosition: 'center bottom',
  imageRendering: 'pixelated',
  transformOrigin: 'center bottom',
}

function CrossfadeSprite({ displayMood }) {
  const isSleeping = displayMood === 'sleeping'
  const isStanding = !isSleeping && SPRITE_MAP[displayMood] === standImg1
  const [showBreatheFrame2, setShowBreatheFrame2] = useState(false)
  const [blinkClosed, setBlinkClosed] = useState(false)

  // Sleeping: toggle between frames for smooth crossfade breathing
  useEffect(() => {
    if (!isSleeping) {
      setShowBreatheFrame2(false)
      return
    }
    const id = setInterval(() => {
      setShowBreatheFrame2(prev => !prev)
    }, BREATHE_INTERVAL)
    return () => clearInterval(id)
  }, [isSleeping])

  // Standing: natural blink with random intervals
  useEffect(() => {
    if (!isStanding) {
      setBlinkClosed(false)
      return
    }
    let timeout
    const scheduleBlink = (first) => {
      const delay = first ? randomBetween(400, 800) : randomBetween(1500, 4000)
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
  }, [isStanding])

  if (isSleeping) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <img src={sleepingImg1} alt="pet" style={{
          ...imgStyle,
          transition: `opacity ${BREATHE_INTERVAL}ms ease-in-out`,
          opacity: showBreatheFrame2 ? 0 : 1,
        }} />
        <img src={sleepingImg2} alt="pet" style={{
          ...imgStyle,
          transition: `opacity ${BREATHE_INTERVAL}ms ease-in-out`,
          opacity: showBreatheFrame2 ? 1 : 0,
        }} />
      </div>
    )
  }

  const src = isStanding
    ? (blinkClosed ? standImg2 : standImg1)
    : getSpriteForMood(displayMood)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img src={src} alt="pet" style={imgStyle} />
    </div>
  )
}

// ── Main widget component ─────────────────────────────────────────────────────
export default function Widget() {
  const { mood, setMood, streak, setStreak, setIsHovered, idleBehavior, setIdleBehavior } = usePetStore()
  const { countdown, setCountdown, snoozeCount, setSnoozeCount, setIsPaused, formatTime } = useTimerStore()

  const [speechBubble, setSpeechBubble] = useState(null)
  const [milestoneMsg, setMilestoneMsg] = useState(null)
  const [walkingFrame, setWalkingFrame] = useState(null) // null | 0 | 1 | 2
  const [walkingDir, setWalkingDir] = useState(1) // 1 = facing right (default), -1 = facing left (flipped)
  const walkTimeoutRef = useRef(null)
  const walkIntervalRef = useRef(null)

  // Refs for stable callbacks
  const isSleepingRef = useRef(true)
  const isDragging = useRef(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 })
  const idleIntervalRef = useRef(null)
  const idleTimeoutRef = useRef(null)
  const speechTimerRef = useRef(null)

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showSpeech = useCallback((msg, duration = 4000) => {
    clearTimeout(speechTimerRef.current)
    setSpeechBubble(msg)
    if (duration > 0) {
      speechTimerRef.current = setTimeout(() => setSpeechBubble(null), duration)
    }
  }, [])

  const enterActiveMode = useCallback(() => {
    isSleepingRef.current = false
    clearInterval(idleIntervalRef.current)
    clearTimeout(idleTimeoutRef.current)
  }, [])

  // ── Idle life cycle ────────────────────────────────────────────────────────
  const runIdleBehavior = useCallback(() => {
    if (!isSleepingRef.current) return
    const behavior = pickWeightedBehavior()
    setIdleBehavior(behavior)
    if (behavior !== 'sleeping') {
      const duration = behavior === 'yawning' ? randomBetween(4000, 6000) : randomBetween(2000, 4000)
      idleTimeoutRef.current = setTimeout(() => {
        if (isSleepingRef.current) setIdleBehavior('sleeping')
      }, duration)
    }
  }, [setIdleBehavior])

  const startIdleCycle = useCallback(() => {
    clearInterval(idleIntervalRef.current)
    clearTimeout(idleTimeoutRef.current)
    isSleepingRef.current = true
    setIdleBehavior('sleeping')

    idleTimeoutRef.current = setTimeout(() => {
      runIdleBehavior()
      idleIntervalRef.current = setInterval(
        runIdleBehavior,
        randomBetween(8000, 45000)
      )
    }, randomBetween(5000, 10000))
  }, [runIdleBehavior, setIdleBehavior])

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const [settings, streakData, timerState] = await Promise.all([
        window.electronAPI.getSettings(),
        window.electronAPI.getStreak(),
        window.electronAPI.getTimerState(),
      ])
      setStreak(streakData.currentStreak || 0)
      setCountdown(timerState.seconds)
      setSnoozeCount(timerState.snoozeCount)
    }
    init()
    startIdleCycle()
    return () => {
      clearInterval(idleIntervalRef.current)
      clearTimeout(idleTimeoutRef.current)
      clearTimeout(speechTimerRef.current)
    }
  }, [])

  // ── IPC event listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const handlers = {
      'timer:tick': (seconds) => {
        setCountdown(seconds)
      },

      'timer:alert': () => {
        enterActiveMode()
        setMood('alert')
        showSpeech('Almost time…', 0)
      },

      'timer:fire': ({ snoozeCount: sc }) => {
        enterActiveMode()
        setMood('reminder')
        setSnoozeCount(sc)
        showSpeech('Hey… your eyes need this.', 0)
      },

      'timer:snooze': ({ snoozeCount: sc, minutes }) => {
        setSnoozeCount(sc)
        const newMood = getMoodForSnoozeCount(sc)
        setMood(newMood)
        const msg =
          sc >= 3
            ? 'THREE snoozes?! Pixel is devastated.'
            : sc === 1
            ? 'Fine. Pixel will wait. (disappointed)'
            : `${minutes} more minutes, then.`
        showSpeech(msg, 5000)
      },

      'timer:break-complete': ({ streak: s }) => {
        setStreak(s)
        setMood('happy')
        showSpeech("See? That wasn't so hard.", 0)

        const milestone = getMilestoneMessage(s)
        if (milestone) {
          setTimeout(() => {
            setMilestoneMsg(milestone)
            setTimeout(() => setMilestoneMsg(null), 4000)
          }, 2000)
        }

        // After celebrating, return to idle
        setTimeout(() => {
          setSpeechBubble(null)
          setMood('sleeping')
          startIdleCycle()
        }, 4500)
      },

      'timer:paused': (paused) => {
        setIsPaused(paused)
      },

      'settings:updated': () => {},
    }

    const wrappedHandlers = {}
    for (const [channel, fn] of Object.entries(handlers)) {
      wrappedHandlers[channel] = window.electronAPI.on(channel, fn)
    }

    return () => {
      for (const [channel, wrapped] of Object.entries(wrappedHandlers)) {
        window.electronAPI.off(channel, wrapped)
      }
    }
  }, [enterActiveMode, showSpeech, startIdleCycle])

  // ── Drag handling ──────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(async (e) => {
    if (e.button !== 0) return
    e.preventDefault()
    const pos = await window.electronAPI.getWindowPosition()
    dragStart.current = {
      mouseX: e.screenX,
      mouseY: e.screenY,
      winX: pos[0],
      winY: pos[1],
    }
    isDragging.current = true
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return
    const dx = e.screenX - dragStart.current.mouseX
    const dy = e.screenY - dragStart.current.mouseY
    window.electronAPI.moveWindow(dragStart.current.winX + dx, dragStart.current.winY + dy)
  }, [])

  const startWalking = useCallback(async () => {
    clearTimeout(walkTimeoutRef.current)
    clearInterval(walkIntervalRef.current)
    setWalkingFrame(0)

    // Grab current window position and screen bounds
    const pos = await window.electronAPI.getWindowPosition()
    const work = await window.electronAPI.getScreenWorkArea()
    const widgetW = window.innerWidth || 160

    let x = pos[0]
    const y = pos[1]
    let direction = Math.random() < 0.5 ? -1 : 1
    setWalkingDir(direction)
    const pxPerTick = 3 // 3px per tick
    const tickMs = 200 // slower stroll

    const frameSeq = [0, 1, 2, 1] // 1→2→3→2 ping-pong
    let frameIdx = 0
    walkIntervalRef.current = setInterval(() => {
      frameIdx = (frameIdx + 1) % frameSeq.length
      setWalkingFrame(frameSeq[frameIdx])
      let nextX = x + direction * pxPerTick

      // Turn around (and flip body) when hitting screen edges
      const minX = work.x
      const maxX = work.x + work.width - widgetW
      if (nextX <= minX) {
        nextX = minX
        direction = 1
        setWalkingDir(direction)
      } else if (nextX >= maxX) {
        nextX = maxX
        direction = -1
        setWalkingDir(direction)
      }

      x = nextX
      window.electronAPI.moveWindow(x, y)
    }, tickMs)

    walkTimeoutRef.current = setTimeout(async () => {
      clearInterval(walkIntervalRef.current)
      setWalkingFrame(null)
      await window.electronAPI.dragEnd(x, y)
    }, 10000)
  }, [])

  const handleMouseUp = useCallback(async (e) => {
    if (!isDragging.current) return
    isDragging.current = false
    const dx = e.screenX - dragStart.current.mouseX
    const dy = e.screenY - dragStart.current.mouseY
    // Click (not drag) if mouse barely moved — trigger walking
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
      startWalking()
      return
    }
    const finalX = dragStart.current.winX + dx
    const finalY = dragStart.current.winY + dy
    await window.electronAPI.dragEnd(finalX, finalY)
  }, [startWalking])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // Cleanup walking timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(walkTimeoutRef.current)
      clearInterval(walkIntervalRef.current)
    }
  }, [])

  // ── Hover wake-up ──────────────────────────────────────────────────────────
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    if (isSleepingRef.current) {
      setIdleBehavior('looking')
      setTimeout(() => {
        if (isSleepingRef.current) setIdleBehavior('sleeping')
      }, 2500)
    }
  }, [setIdleBehavior, setIsHovered])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [setIsHovered])

  // ── Render ─────────────────────────────────────────────────────────────────
  const isIdleMood = mood === 'sleeping'
  const displayMood = isIdleMood ? idleBehavior : mood
  const moodConfig = MOODS[displayMood] || MOODS.sleeping
  const minutes = Math.floor(countdown / 60)
  const timeDisplay = minutes > 0 ? `${minutes}m` : '🔔'

  return (
    <div
      className="w-full h-full relative select-none"
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Speech bubble — floats above the sprite */}
      {speechBubble && (
        <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-white text-gray-800 text-[9px] px-2 py-1.5 rounded-xl shadow-lg max-w-[160px] text-center leading-snug z-50 pointer-events-none whitespace-nowrap">
          {speechBubble}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full"
            style={{
              width: 0, height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid white',
            }}
          />
        </div>
      )}

      {/* Milestone banner */}
      {milestoneMsg && (
        <div className="absolute bottom-[calc(100%+32px)] left-1/2 -translate-x-1/2 bg-amber-400 text-gray-900 text-[8px] font-bold px-2 py-1 rounded-lg shadow-lg whitespace-nowrap text-center z-50 animate-bob">
          ✨ {milestoneMsg}
        </div>
      )}

      {/* Sprite — grounded in the corner, no container chrome */}
      <div className={['relative w-full h-full flex items-end justify-center', moodConfig.animation].join(' ')}>

        {/* Soft shadow ellipse — makes it look like it's sitting on a surface */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
          style={{
            width: '70%',
            height: '10px',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
            filter: 'blur(4px)',
          }}
        />

        {walkingFrame !== null ? (
          <img
            src={[walkingImg1, walkingImg2, walkingImg3][walkingFrame]}
            alt="walking"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              objectPosition: 'center bottom',
              imageRendering: 'pixelated',
              // transform: walkingDir === -1 ? 'scaleX(-1)' : 'scaleX(1)',
              transform: walkingDir === 1 ? 'scaleX(-1)' : 'scaleX(1)'
            }}
          />
        ) : (
          <>
            <CrossfadeSprite displayMood={displayMood} />
            {displayMood === 'sleeping' && <ZzzParticles />}
          </>
        )}

      </div>
    </div>
  )
}
