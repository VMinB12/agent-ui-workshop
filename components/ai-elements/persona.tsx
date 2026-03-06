'use client'

import type { FC } from 'react'

import { cn } from '@/lib/utils'
import { memo, useEffect, useMemo, useRef, useState } from 'react'

const IDLE_ANGLE = 35
const MAX_SPEED = 420
const ACCELERATION = 520
const DECELERATION = 340
const SNAP_SPEED = 160

export type PersonaState = 'idle' | 'streaming'

interface PersonaProps {
  state: PersonaState
  onReady?: () => void
  className?: string
  variant?: string
}

export const Persona: FC<PersonaProps> = memo(({ state = 'idle', onReady, className, variant }) => {
  void variant

  const personaRef = useRef<HTMLSpanElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const angleRef = useRef(IDLE_ANGLE)
  const velocityRef = useRef(0)
  const activeRef = useRef(false)
  const [isHovered, setIsHovered] = useState(false)

  const isActive = useMemo(() => state === 'streaming' || isHovered, [isHovered, state])

  const updateAngle = (angle: number) => {
    angleRef.current = angle
    personaRef.current?.style.setProperty('--persona-angle', `${angle}deg`)
  }

  useEffect(() => {
    updateAngle(IDLE_ANGLE)
  }, [])

  useEffect(() => {
    onReady?.()
  }, [onReady])

  useEffect(() => {
    activeRef.current = isActive

    if (frameRef.current !== null) {
      return
    }

    const tick = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp
        frameRef.current = requestAnimationFrame(tick)
        return
      }

      const deltaSeconds = Math.min((timestamp - lastTimestampRef.current) / 1000, 0.05)
      lastTimestampRef.current = timestamp

      const active = activeRef.current
      let velocity = velocityRef.current

      if (active) {
        velocity = Math.min(MAX_SPEED, velocity + ACCELERATION * deltaSeconds)
      } else {
        velocity = Math.max(0, velocity - DECELERATION * deltaSeconds)
      }

      let angle = angleRef.current + velocity * deltaSeconds

      if (!active && velocity === 0) {
        // Snap toward the nearest idle-equivalent angle so the mark settles cleanly.
        const nearestIdleAngle = IDLE_ANGLE + Math.round((angle - IDLE_ANGLE) / 360) * 360
        const deltaToIdle = nearestIdleAngle - angle

        if (Math.abs(deltaToIdle) <= SNAP_SPEED * deltaSeconds) {
          angle = nearestIdleAngle
          updateAngle(angle)
          velocityRef.current = 0
          lastTimestampRef.current = null
          frameRef.current = null
          return
        }

        angle += Math.sign(deltaToIdle) * SNAP_SPEED * deltaSeconds
      }

      velocityRef.current = velocity
      updateAngle(angle)
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      lastTimestampRef.current = null
    }
  }, [isActive])

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return (
    <span
      aria-hidden
      className={cn('persona-avatar', isActive && 'persona-avatar-streaming', className)}
      data-state={state}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={personaRef}
    >
      <span className="persona-avatar__bar" />
    </span>
  )
})

Persona.displayName = 'Persona'
