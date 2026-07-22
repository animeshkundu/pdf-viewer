import type { CSSProperties } from 'react'
import type { TextBounds } from '@/types/text-edit.types'

export function getTextRotation(
  direction: [number, number],
  pageRotation: number
): number {
  const directionRotation = Math.round(
    Math.atan2(direction[1], direction[0]) * 180 / Math.PI / 90
  ) * 90
  return ((directionRotation + pageRotation) % 360 + 360) % 360
}

export function getRotatedContentStyle(
  bounds: TextBounds,
  rotation: number
): CSSProperties {
  const normalized = ((rotation % 360) + 360) % 360

  switch (normalized) {
    case 90:
      return {
        left: bounds.width,
        top: 0,
        width: bounds.height,
        height: bounds.width,
        transform: 'rotate(90deg)',
        transformOrigin: 'top left',
      }
    case 180:
      return {
        left: bounds.width,
        top: bounds.height,
        width: bounds.width,
        height: bounds.height,
        transform: 'rotate(180deg)',
        transformOrigin: 'top left',
      }
    case 270:
      return {
        left: 0,
        top: bounds.height,
        width: bounds.height,
        height: bounds.width,
        transform: 'rotate(270deg)',
        transformOrigin: 'top left',
      }
    default:
      return {
        left: 0,
        top: 0,
        width: bounds.width,
        height: bounds.height,
      }
  }
}
