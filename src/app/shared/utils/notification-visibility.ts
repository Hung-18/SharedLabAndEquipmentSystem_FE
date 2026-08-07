import type { NotificationResponse } from '../../core/api/api.models'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Backend notifications remain the source of truth. This helper only prevents
 * Admin UI from showing operational reminders that belong to LabManager.
 */
export function isNotificationVisibleForRole(
  role: string | null | undefined,
  notification: NotificationResponse,
): boolean {
  if (role !== 'Admin') return true

  const text = normalize(`${notification.title} ${notification.message}`)
  const managerTaskPatterns = [
    'nhiem vu quan ly',
    'ho tro check-out',
    'ho tro checkout',
    'ho tro check-in',
    'ho tro checkin',
    'kiem tra va check-out ho',
    'kiem tra va checkout ho',
    'kiem tra va check-in ho',
    'kiem tra va checkin ho',
  ]

  return !managerTaskPatterns.some((pattern) => text.includes(pattern))
}
