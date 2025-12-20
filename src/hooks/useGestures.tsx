import { useEffect, useRef, RefObject } from 'react'

interface GestureHandlers {
  onPinch?: (scale: number, center: { x: number; y: number }) => void
  onPinchStart?: () => void
  onPinchEnd?: () => void
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', distance: number) => void
}

interface Touch {
  x: number
  y: number
}

function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch2.x - touch1.x
  const dy = touch2.y - touch1.y
  return Math.sqrt(dx * dx + dy * dy)
}

function getCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
  return {
    x: (touch1.x + touch2.x) / 2,
    y: (touch1.y + touch2.y) / 2
  }
}

export function useGestures(
  elementRef: RefObject<HTMLElement | null>,
  handlers: GestureHandlers,
  enabled = true
) {
  const gestureStateRef = useRef({
    initialDistance: 0,
    initialCenter: { x: 0, y: 0 },
    startTouch: { x: 0, y: 0 },
    isPinching: false,
    isTracking: false
  })

  useEffect(() => {
    const element = elementRef.current
    if (!element || !enabled) return

    const getTouches = (e: TouchEvent): Touch[] => {
      return Array.from(e.touches).map(touch => ({
        x: touch.clientX,
        y: touch.clientY
      }))
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touches = getTouches(e)

      if (touches.length === 2) {
        e.preventDefault()
        const [touch1, touch2] = touches
        gestureStateRef.current.initialDistance = getDistance(touch1, touch2)
        gestureStateRef.current.initialCenter = getCenter(touch1, touch2)
        gestureStateRef.current.isPinching = true
        handlers.onPinchStart?.()
      } else if (touches.length === 1) {
        gestureStateRef.current.startTouch = touches[0]
        gestureStateRef.current.isTracking = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touches = getTouches(e)

      if (touches.length === 2 && gestureStateRef.current.isPinching) {
        e.preventDefault()
        const [touch1, touch2] = touches
        const currentDistance = getDistance(touch1, touch2)
        const currentCenter = getCenter(touch1, touch2)
        
        const scale = currentDistance / gestureStateRef.current.initialDistance
        
        handlers.onPinch?.(scale, currentCenter)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touches = getTouches(e)

      if (gestureStateRef.current.isPinching && touches.length < 2) {
        gestureStateRef.current.isPinching = false
        handlers.onPinchEnd?.()
      }

      if (gestureStateRef.current.isTracking && touches.length === 0) {
        const endTouch = Array.from(e.changedTouches).map(touch => ({
          x: touch.clientX,
          y: touch.clientY
        }))[0]

        if (endTouch) {
          const dx = endTouch.x - gestureStateRef.current.startTouch.x
          const dy = endTouch.y - gestureStateRef.current.startTouch.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance > 50) {
            const angle = Math.atan2(dy, dx) * (180 / Math.PI)
            let direction: 'left' | 'right' | 'up' | 'down'

            if (angle >= -45 && angle < 45) {
              direction = 'right'
            } else if (angle >= 45 && angle < 135) {
              direction = 'down'
            } else if (angle >= -135 && angle < -45) {
              direction = 'up'
            } else {
              direction = 'left'
            }

            handlers.onSwipe?.(direction, distance)
          }
        }

        gestureStateRef.current.isTracking = false
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)
    element.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [elementRef, handlers, enabled])
}
