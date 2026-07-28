export interface BookingResponse {
  bookingId: number
  userId: number
  priorityRuleId: number | null
  priorityLevel: number | null
  purposeType: string
  startTime: string
  endTime: string
  status: string
  createdAt: string
}

export interface WaitlistResponse {
  waitlistId: number
  userId: number
  labId: number | null
  equipmentId: number | null
  requestedStart: string
  requestedEnd: string
  queuePosition: number
  notifiedAt: string | null
  status: string
}

export interface ViolationResponse {
  violationId: number
  userId: number
  bookingId: number
  violationType: string
  penaltyPointsAdded: number
  loggedAt: string
  status: string
}

export interface UserViolationSummaryResponse {
  userId: number
  fullName: string
  penaltyPoints: number
  userStatus: string
  restrictionUntil: string | null
  activeViolationCount: number
  activePenaltyPoints: number
  activeViolations: ViolationResponse[]
}

export interface NotificationResponse {
  notificationId: number
  userId: number
  title: string
  message: string
  notificationType: string
  isRead: boolean
  createdAt: string
}

export interface UnreadNotificationCountResponse {
  userId: number
  unreadCount: number
}

export interface CategoryCountResponse {
  key: string
  displayName: string
  count: number
  percentage: number
}

export interface ResourceUtilizationResponse {
  resourceType: string
  resourceId: number
  resourceName: string
  labId: number | null
  labName: string | null
  bookingCount: number
  reservedHours: number
  usageCount: number
  actualUsageHours: number
  availableHours: number
  utilizationRate: number
}

export interface DepartmentUtilizationResponse {
  departmentId: number
  departmentName: string
  bookingCount: number
  reservedHours: number
  usageCount: number
  actualUsageHours: number
  availableResourceHours: number
  utilizationRate: number
  usageSharePercentage: number
}

export interface MostUsedResourceResponse {
  resourceType: string
  resourceId: number
  resourceName: string
  labId: number | null
  labName: string | null
  bookingCount: number
  reservedHours: number
  usageCount: number
  actualUsageHours: number
}

export interface PenaltyUserReportResponse {
  userId: number
  fullName: string
  departmentName: string
  penaltyPoints: number
  penaltyPointsInPeriod: number
  activeViolationCount: number
  totalViolationCount: number
  userStatus: string
  restrictionUntil: string | null
}

export interface UsageTrendResponse {
  periodStart: string
  periodEnd: string
  usageCount: number
  totalUsageHours: number
}

export interface DashboardResponse {
  from: string
  to: string
  totalBookings: number
  totalUsageLogs: number
  totalViolations: number
  totalMaintenanceCost: number
  noShow: {
    noShowCount: number
    completedCount: number
    concludedBookingCount: number
    noShowRate: number
  }
  bookingStatusCounts: CategoryCountResponse[]
  bookingPurposeCounts: CategoryCountResponse[]
  bookingDepartmentCounts: CategoryCountResponse[]
  labUtilization: ResourceUtilizationResponse[]
  equipmentUtilization: ResourceUtilizationResponse[]
  departmentUtilization: DepartmentUtilizationResponse[]
  mostUsedLabRooms: MostUsedResourceResponse[]
  mostUsedEquipments: MostUsedResourceResponse[]
  usersWithMostPenaltyPoints: PenaltyUserReportResponse[]
  usageTrend: UsageTrendResponse[]
}
