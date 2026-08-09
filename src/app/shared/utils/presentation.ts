import type { ApiEnum } from '../../core/api/system.models'

const maps: Record<string, Record<string, string>> = {
  user: {
    '1': 'Đang hoạt động',
    '2': 'Ngừng hoạt động',
    '3': 'Bị hạn chế',
    '4': 'Bị khóa',
    Active: 'Đang hoạt động',
    Inactive: 'Ngừng hoạt động',
    Restricted: 'Bị hạn chế',
    Locked: 'Bị khóa',
  },
  department: {
    '1': 'Đang hoạt động',
    '2': 'Ngừng hoạt động',
    Active: 'Đang hoạt động',
    Inactive: 'Ngừng hoạt động',
  },
  booking: {
    Pending: 'Chờ duyệt',
    Approved: 'Đã duyệt',
    Rejected: 'Bị từ chối',
    Cancelled: 'Đã hủy',
    Completed: 'Hoàn thành',
    NoShow: 'Không đến',
  },
  lab: {
    Available: 'Có thể sử dụng',
    Unavailable: 'Tạm không khả dụng',
    Maintenance: 'Đang bảo trì',
    Inactive: 'Ngừng hoạt động',
  },
  equipment: {
    Available: 'Sẵn sàng',
    InUse: 'Đang sử dụng',
    Maintenance: 'Đang bảo trì',
    Broken: 'Bị hỏng',
    Retired: 'Ngừng sử dụng',
  },
  maintenance: {
    Scheduled: 'Đã lên lịch',
    InProgress: 'Đang thực hiện',
    Completed: 'Hoàn thành',
    Cancelled: 'Đã hủy',
  },
  waitlist: {
    Waiting: 'Đang chờ',
    Notified: 'Đã thông báo',
    Booked: 'Đã tạo booking',
    Cancelled: 'Đã hủy',
    Expired: 'Hết hạn',
  },
  violation: { Active: 'Đang hiệu lực', Resolved: 'Đã xử lý', Cancelled: 'Đã hủy' },
  incident: {
    NotRequired: 'Không cần duyệt',
    Pending: 'Chờ duyệt',
    Confirmed: 'Đã xác nhận',
    Rejected: 'Đã từ chối',
  },
  purpose: {
    ResearchProject: 'Dự án nghiên cứu',
    CoursePractice: 'Thực hành môn học',
    SelfStudy: 'Tự học',
    Other: 'Khác',
  },
  resource: { LabRoom: 'Phòng lab', Equipment: 'Thiết bị' },
  recurrence: { None: 'Không lặp', Daily: 'Hằng ngày', Weekly: 'Hằng tuần', Monthly: 'Hằng tháng' },
  violationType: {
    NoShow: 'Không đến',
    LateCheckout: 'Trả muộn',
    DamageEquipment: 'Làm hỏng thiết bị',
    MisuseEquipment: 'Sử dụng sai',
    UnauthorizedUse: 'Sử dụng trái phép',
  },
  incidentType: {
    None: 'Không có',
    DamageReported: 'Báo hư hỏng',
    LateCheckout: 'Trả muộn',
    MissingEquipment: 'Thiếu thiết bị',
    Other: 'Khác',
  },
  notification: {
    BookingApproved: 'Booking được duyệt',
    BookingRejected: 'Booking bị từ chối',
    BookingReminder: 'Nhắc lịch booking',
    WaitlistAvailable: 'Có chỗ từ hàng chờ',
    Maintenance: 'Bảo trì',
    Violation: 'Vi phạm',
    System: 'Hệ thống',
  },
}

export function labelOf(domain: string, value: ApiEnum | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const key = String(value)
  return maps[domain]?.[key] ?? key
}

export function toneOf(domain: string, value: ApiEnum | null | undefined): string {
  const key = String(value ?? '')
  const tones: Record<string, Record<string, string>> = {
    user: {
      '1': 'emerald',
      '2': 'rose',
      '3': 'amber',
      '4': 'rose',
      Active: 'emerald',
      Inactive: 'rose',
      Restricted: 'amber',
      Locked: 'rose',
    },
    department: { '1': 'emerald', '2': 'rose', Active: 'emerald', Inactive: 'rose' },
    booking: {
      Pending: 'amber',
      Approved: 'emerald',
      Rejected: 'rose',
      Cancelled: 'rose',
      Completed: 'emerald',
      NoShow: 'rose',
    },
    lab: { Available: 'emerald', Unavailable: 'rose', Maintenance: 'indigo', Inactive: 'rose' },
    equipment: {
      Available: 'emerald',
      InUse: 'indigo',
      Maintenance: 'indigo',
      Broken: 'rose',
      Retired: 'rose',
    },
    maintenance: {
      Scheduled: 'amber',
      InProgress: 'indigo',
      Completed: 'emerald',
      Cancelled: 'rose',
    },
    waitlist: {
      Waiting: 'amber',
      Notified: 'indigo',
      Booked: 'emerald',
      Cancelled: 'rose',
      Expired: 'rose',
    },
    violation: { Active: 'rose', Resolved: 'emerald', Cancelled: 'slate' },
    incident: { NotRequired: 'slate', Pending: 'amber', Confirmed: 'rose', Rejected: 'slate' },
  }
  return tones[domain]?.[key] ?? 'slate'
}

export type NormalizedUserStatus = 'Active' | 'Inactive' | 'Restricted' | 'Locked'

export function normalizeUserStatus(value: ApiEnum | null | undefined): NormalizedUserStatus | '' {
  const key = String(value ?? '').trim()
  const numeric: Record<string, NormalizedUserStatus> = {
    '1': 'Active',
    '2': 'Inactive',
    '3': 'Restricted',
    '4': 'Locked',
  }
  if (numeric[key]) return numeric[key]
  if (key === 'Active' || key === 'Inactive' || key === 'Restricted' || key === 'Locked') {
    return key
  }
  return ''
}

export function isAvailableLabStatus(value: ApiEnum | null | undefined): boolean {
  const key = String(value ?? '').trim().toLowerCase()
  return key === '1' || key === 'available'
}

export function isInactiveLabStatus(value: ApiEnum | null | undefined): boolean {
  const key = String(value ?? '').trim().toLowerCase()
  return key === '4' || key === 'inactive'
}

export function isAvailableEquipmentStatus(value: ApiEnum | null | undefined): boolean {
  const key = String(value ?? '').trim().toLowerCase()
  return key === '1' || key === 'available'
}

export function isRetiredEquipmentStatus(value: ApiEnum | null | undefined): boolean {
  const key = String(value ?? '').trim().toLowerCase()
  return key === '5' || key === 'retired'
}

export function toIso(localValue: string): string {
  return localValue ? new Date(localValue).toISOString() : ''
}

export function toDateInput(value: Date): string {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function toLocalDateTimeInput(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function stripTechnicalIds(value: string): string {
  return value
    .replace(/\s*#(?:[A-Z]{1,12}-)?\d+\b/gi, '')
    .replace(/\bID\s+\d+\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim()
}
