export type ApiEnum = string | number

export interface PagedResponse<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface LabRoomResponse {
  labId: number
  labName: string
  roomCode: string
  location: string
  capacity: number
  status: string
  imageUrl?: string | null
}

export interface LabRoomDetailResponse extends LabRoomResponse {
  description: string | null
  imageUrl: string | null
  usageGuideline: string | null
  managerName: string | null
}

export interface EquipmentResponse {
  equipmentId: number
  labId: number
  equipmentName: string
  status: string
  imageUrl?: string | null
}

export interface EquipmentDetailResponse extends EquipmentResponse {
  modelSpecs: string | null
  imageUrl: string | null
  usageGuideline: string | null
}

export interface CalendarResourceResponse {
  resourceType: string
  resourceId: number
  labId: number
  resourceName: string
}

export interface CalendarEventResponse {
  eventType: string
  sourceId: number
  title: string
  startTime: string
  endTime: string
  status: string
  blocking: boolean
  userId: number | null
  resources: CalendarResourceResponse[]
}

export interface BookingItemRequest {
  resourceType: number
  labId: number | null
  equipmentId: number | null
  note: string | null
}

export interface BookingItemResponse {
  bookingItemId: number
  resourceType: string
  labId: number | null
  labName: string | null
  equipmentId: number | null
  equipmentName: string | null
  note: string | null
}

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

export interface BookingDetailResponse extends BookingResponse {
  userName: string | null
  approvedById: number | null
  approvedByName: string | null
  purposeDescription: string
  rejectionReason: string | null
  approvedAt: string | null
  items: BookingItemResponse[]
}

export interface SuggestedSlotResponse {
  startTime: string
  endTime: string
}

export interface MaintenanceResponse {
  maintenanceId: number
  labId: number | null
  equipmentId: number | null
  startTime: string
  endTime: string
  status: string
  recurrenceType: string
  recurrenceInterval: number
  recurrenceEndDate: string | null
  parentMaintenanceId: number | null
  recurrenceStopped: boolean
}

export interface MaintenanceDetailResponse extends MaintenanceResponse {
  createdById: number
  maintenanceCost: number
  notes: string | null
}

export interface UsageLogResponse {
  logId: number
  bookingItemId: number
  actualCheckin: string
  actualCheckout: string | null
  incidentStatus: string
  incidentDescription: string | null
  affectedEquipmentId: number | null
  incidentReviewStatus: string
  incidentReviewedById: number | null
  incidentReviewedAt: string | null
  incidentReviewNote: string | null
}

export interface BookingUsageSessionResponse {
  bookingId: number
  bookingStatus: string
  actionTime: string
  logs: UsageLogResponse[]
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

export interface DepartmentResponse {
  departmentId: number
  departmentName: string
  description: string | null
  status: ApiEnum
}

export interface UserManagementResponse {
  userId: number
  fullName: string
  username: string
  email: string
  roleId: number
  roleName: string
  departmentId: number
  departmentName: string
  penaltyPoints: number
  restrictionUntil: string | null
  status: ApiEnum
}

export interface UserPenaltyResponse {
  userId: number
  fullName: string
  penaltyPoints: number
  status: ApiEnum
  restrictionUntil: string | null
}

export interface PriorityRuleResponse {
  priorityRuleId: number
  purposeType: string
  priorityLevel: number
  description: string | null
  status: string
}

export interface RoleResponse {
  roleId: number
  roleName: string
  description: string | null
}

export interface AuditLogResponse {
  auditLogId: number
  userId: number
  userName: string | null
  actionType: string
  entityName: string
  entityId: number
  oldValue: string | null
  newValue: string | null
  ipAddress: string | null
  createdAt: string
}

export interface PagedAuditLogResponse extends PagedResponse<AuditLogResponse> {}

export interface NotificationResponse {
  notificationId: number
  userId: number
  title: string
  message: string
  notificationType: string
  isRead: boolean
  createdAt: string
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

export interface MaintenanceCostResponse {
  resourceType: string
  resourceId: number
  resourceName: string
  labId: number | null
  labName: string | null
  maintenanceCount: number
  totalCost: number
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

export interface ViolationReportResponse {
  violationId: number
  userId: number
  userName: string
  departmentName: string
  bookingId: number
  violationType: string
  penaltyPointsAdded: number
  status: string
  loggedAt: string
}

export interface ViolationSummaryResponse {
  totalCount: number
  activeCount: number
  resolvedCount: number
  cancelledCount: number
  violationTypeCounts: CategoryCountResponse[]
  items: ViolationReportResponse[]
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

export interface NoShowRateResponse {
  noShowCount: number
  completedCount: number
  concludedBookingCount: number
  noShowRate: number
}

export interface UsageTrendResponse {
  periodStart: string
  periodEnd: string
  usageCount: number
  totalUsageHours: number
}

export interface MaintenanceHistoryItemResponse {
  maintenanceId: number
  resourceType: string
  resourceId: number
  resourceName: string
  labId: number | null
  labName: string | null
  createdById: number
  createdByName: string
  startTime: string
  endTime: string
  durationHours: number
  maintenanceCost: number
  notes: string | null
  status: string
  recurrenceType: string
  recurrenceInterval: number
  recurrenceEndDate: string | null
  parentMaintenanceId: number | null
}

export interface PagedMaintenanceHistoryResponse extends PagedResponse<MaintenanceHistoryItemResponse> {
  from: string
  to: string
  totalCost: number
}
