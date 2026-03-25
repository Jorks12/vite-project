import type { MaterialType } from '../domain/types'

export function formatMaterialType(type: MaterialType): string {
  switch (type) {
    case 'lesson':
      return 'урок'
    case 'article':
      return 'статия'
    case 'video':
      return 'видео'
    case 'task':
      return 'задача'
    default:
      return type
  }
}

export function clampLevel(value: number): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(value)
  if (n <= 1) return 1
  if (n === 2) return 2
  if (n === 3) return 3
  if (n === 4) return 4
  return 5
}
