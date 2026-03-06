'use client'

import type { FC } from 'react'

import { cn } from '@/lib/utils'
import { memo, useEffect } from 'react'

export type PersonaState = 'idle' | 'streaming'

interface PersonaProps {
  state: PersonaState
  onReady?: () => void
  className?: string
  variant?: string
}

export const Persona: FC<PersonaProps> = memo(({ state = 'idle', onReady, className, variant }) => {
  void variant

  useEffect(() => {
    onReady?.()
  }, [onReady])

  return (
    <span
      aria-hidden
      className={cn('persona-avatar', state === 'streaming' && 'persona-avatar-streaming', className)}
      data-state={state}
    >
      <span className="persona-avatar__bar" />
    </span>
  )
})

Persona.displayName = 'Persona'
