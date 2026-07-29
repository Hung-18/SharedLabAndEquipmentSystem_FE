import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import type { Observable } from 'rxjs'
import { env } from '../config/env'
import type {
  AuditLogResponse,
  BookingDetailResponse,
  BookingItemRequest,
  BookingResponse,
  CalendarEventResponse,
  CategoryCountResponse,
  DepartmentResponse,
  DepartmentUtilizationResponse,
  EquipmentDetailResponse,
  EquipmentResponse,
  LabRoomDetailResponse,
  LabRoomResponse,
  MaintenanceCostResponse,
  MaintenanceDetailResponse,
  MaintenanceResponse,
  MostUsedResourceResponse,
  NoShowRateResponse,
  NotificationResponse,
  PagedAuditLogResponse,
  PagedMaintenanceHistoryResponse,
  PagedResponse,
  PenaltyUserReportResponse,
  PriorityRuleResponse,
  ResourceUtilizationResponse,
  RoleResponse,
  SuggestedSlotResponse,
  UsageLogResponse,
  UsageTrendResponse,
  UserManagementResponse,
  UserPenaltyResponse,
  UserViolationSummaryResponse,
  ViolationResponse,
  ViolationSummaryResponse,
  WaitlistResponse,
} from './system.models'

export interface LabSearch {
  keyword?: string
  status?: number | string
  managerId?: number
  minimumCapacity?: number
  pageNumber?: number
  pageSize?: number
}

export interface EquipmentSearch {
  keyword?: string
  labId?: number
  status?: number | string
  pageNumber?: number
  pageSize?: number
}

export interface CreateBookingPayload {
  purposeType: number
  purposeDescription: string
  startTime: string
  endTime: string
  items: BookingItemRequest[]
}

export interface MaintenancePayload {
  labId: number | null
  equipmentId: number | null
  startTime: string
  endTime: string
  maintenanceCost: number
  notes: string | null
  recurrenceType: number
  recurrenceInterval: number
  recurrenceEndDate: string | null
}

@Injectable({ providedIn: 'root' })
export class SystemService {
  private readonly http = inject(HttpClient)
  private readonly base = env.apiBaseUrl

  labs(): Observable<LabRoomResponse[]> {
    return this.http.get<LabRoomResponse[]>(`${this.base}/LabRooms`)
  }

  searchLabs(query: LabSearch): Observable<PagedResponse<LabRoomResponse>> {
    return this.http.get<PagedResponse<LabRoomResponse>>(`${this.base}/LabRooms/search`, {
      params: this.params(query),
    })
  }

  lab(id: number): Observable<LabRoomDetailResponse> {
    return this.http.get<LabRoomDetailResponse>(`${this.base}/LabRooms/${id}`)
  }

  createLab(payload: {
    labName: string
    roomCode: string
    location: string
    capacity: number
    description: string | null
    imageUrl: string | null
    usageGuideline: string | null
    managerId: number
  }): Observable<LabRoomDetailResponse> {
    return this.http.post<LabRoomDetailResponse>(`${this.base}/LabRooms`, payload)
  }

  updateLab(
    id: number,
    payload: {
      labName: string
      location: string
      capacity: number
      description: string | null
      imageUrl: string | null
      usageGuideline: string | null
    },
  ): Observable<void> {
    return this.http.put<void>(`${this.base}/LabRooms/${id}`, payload)
  }

  changeLabManager(id: number, managerId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/LabRooms/${id}/manager`, { managerId })
  }

  deleteLab(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/LabRooms/${id}`)
  }

  equipments(): Observable<EquipmentResponse[]> {
    return this.http.get<EquipmentResponse[]>(`${this.base}/Equipments`)
  }

  searchEquipments(query: EquipmentSearch): Observable<PagedResponse<EquipmentResponse>> {
    return this.http.get<PagedResponse<EquipmentResponse>>(`${this.base}/Equipments/search`, {
      params: this.params(query),
    })
  }

  equipment(id: number): Observable<EquipmentDetailResponse> {
    return this.http.get<EquipmentDetailResponse>(`${this.base}/Equipments/${id}`)
  }

  equipmentsByLab(labId: number): Observable<EquipmentResponse[]> {
    return this.http.get<EquipmentResponse[]>(`${this.base}/Equipments/lab/${labId}`)
  }

  createEquipment(payload: {
    labId: number
    equipmentName: string
    modelSpecs: string | null
    imageUrl: string | null
    usageGuideline: string | null
  }): Observable<EquipmentDetailResponse> {
    return this.http.post<EquipmentDetailResponse>(`${this.base}/Equipments`, payload)
  }

  updateEquipment(
    id: number,
    payload: {
      labId: number
      equipmentName: string
      modelSpecs: string | null
      imageUrl: string | null
      usageGuideline: string | null
    },
  ): Observable<void> {
    return this.http.put<void>(`${this.base}/Equipments/${id}`, payload)
  }

  deleteEquipment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/Equipments/${id}`)
  }

  calendar(
    from: string,
    to: string,
    labId?: number,
    equipmentId?: number,
  ): Observable<CalendarEventResponse[]> {
    // The backend explicitly accepts either LabId or EquipmentId, never both. Equipment is the
    // more specific filter, so it takes precedence when a page happens to provide both values.
    const resourceFilter = equipmentId ? { equipmentId } : labId ? { labId } : {}

    return this.http.get<CalendarEventResponse[]>(`${this.base}/Bookings/calendar`, {
      params: this.params({ from, to, ...resourceFilter }),
    })
  }

  bookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.base}/Bookings`)
  }

  pendingBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.base}/Bookings/pending`)
  }

  booking(id: number): Observable<BookingDetailResponse> {
    return this.http.get<BookingDetailResponse>(`${this.base}/Bookings/${id}`)
  }

  bookingsByUser(userId: number): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.base}/Bookings/user/${userId}`)
  }

  createBooking(payload: CreateBookingPayload): Observable<BookingDetailResponse> {
    return this.http.post<BookingDetailResponse>(`${this.base}/Bookings`, payload)
  }

  updateBooking(id: number, payload: Omit<CreateBookingPayload, 'items'>): Observable<void> {
    return this.http.put<void>(`${this.base}/Bookings/${id}`, payload)
  }

  suggestSlots(payload: {
    startTime: string
    endTime: string
    items: BookingItemRequest[]
    maxSuggestions: number
    searchDays: number
    stepMinutes: number
  }): Observable<SuggestedSlotResponse[]> {
    return this.http.post<SuggestedSlotResponse[]>(`${this.base}/Bookings/suggested-slots`, payload)
  }

  approveBooking(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Bookings/${id}/approve`, {})
  }

  rejectBooking(id: number, rejectionReason: string): Observable<void> {
    return this.http.post<void>(`${this.base}/Bookings/${id}/reject`, { rejectionReason })
  }

  cancelBooking(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Bookings/${id}/cancel`, {})
  }

  completeBooking(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Bookings/${id}/complete`, {})
  }

  noShowBooking(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Bookings/${id}/no-show`, {})
  }

  maintenances(): Observable<MaintenanceResponse[]> {
    return this.http.get<MaintenanceResponse[]>(`${this.base}/Maintenances`)
  }

  maintenance(id: number): Observable<MaintenanceDetailResponse> {
    return this.http.get<MaintenanceDetailResponse>(`${this.base}/Maintenances/${id}`)
  }

  maintenancesByLab(id: number): Observable<MaintenanceResponse[]> {
    return this.http.get<MaintenanceResponse[]>(`${this.base}/Maintenances/lab/${id}`)
  }

  maintenancesByEquipment(id: number): Observable<MaintenanceResponse[]> {
    return this.http.get<MaintenanceResponse[]>(`${this.base}/Maintenances/equipment/${id}`)
  }

  createMaintenance(payload: MaintenancePayload): Observable<MaintenanceDetailResponse> {
    return this.http.post<MaintenanceDetailResponse>(`${this.base}/Maintenances`, payload)
  }

  updateMaintenance(id: number, payload: MaintenancePayload): Observable<void> {
    return this.http.put<void>(`${this.base}/Maintenances/${id}`, payload)
  }

  startMaintenance(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Maintenances/${id}/start`, {})
  }

  completeMaintenance(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Maintenances/${id}/complete`, {})
  }

  cancelMaintenance(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Maintenances/${id}/cancel`, {})
  }

  cancelMaintenanceSeries(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Maintenances/${id}/cancel-series`, {})
  }

  usageLogs(): Observable<UsageLogResponse[]> {
    return this.http.get<UsageLogResponse[]>(`${this.base}/UsageLogs`)
  }

  usageLog(id: number): Observable<UsageLogResponse> {
    return this.http.get<UsageLogResponse>(`${this.base}/UsageLogs/${id}`)
  }

  usageLogsByBooking(bookingId: number): Observable<UsageLogResponse[]> {
    return this.http.get<UsageLogResponse[]>(`${this.base}/UsageLogs/booking/${bookingId}`)
  }

  incidentLogs(from?: string, to?: string): Observable<UsageLogResponse[]> {
    return this.http.get<UsageLogResponse[]>(`${this.base}/UsageLogs/incidents`, {
      params: this.params({ from, to }),
    })
  }

  checkIn(
    bookingItemId: number,
    actualCheckin: string | null = null,
  ): Observable<UsageLogResponse> {
    return this.http.post<UsageLogResponse>(`${this.base}/UsageLogs/check-in`, {
      bookingItemId,
      actualCheckin,
    })
  }

  checkOut(id: number, actualCheckout: string | null = null): Observable<void> {
    return this.http.post<void>(`${this.base}/UsageLogs/${id}/check-out`, { actualCheckout })
  }

  reportIncident(
    id: number,
    payload: {
      incidentStatus: number
      incidentDescription: string
      affectedEquipmentId: number | null
    },
  ): Observable<void> {
    return this.http.post<void>(`${this.base}/UsageLogs/${id}/incident`, payload)
  }

  reviewIncident(
    id: number,
    action: 'confirm' | 'reject',
    reviewNote: string | null,
  ): Observable<void> {
    return this.http.post<void>(`${this.base}/UsageLogs/${id}/incident/${action}`, { reviewNote })
  }

  waitlists(): Observable<WaitlistResponse[]> {
    return this.http.get<WaitlistResponse[]>(`${this.base}/Waitlists`)
  }

  waitlist(id: number): Observable<WaitlistResponse> {
    return this.http.get<WaitlistResponse>(`${this.base}/Waitlists/${id}`)
  }

  waitlistsByUser(userId: number): Observable<WaitlistResponse[]> {
    return this.http.get<WaitlistResponse[]>(`${this.base}/Waitlists/user/${userId}`)
  }

  waitlistQueue(query: {
    labId?: number
    equipmentId?: number
    requestedStart: string
    requestedEnd: string
  }): Observable<WaitlistResponse[]> {
    return this.http.get<WaitlistResponse[]>(`${this.base}/Waitlists/queue`, {
      params: this.params(query),
    })
  }

  createWaitlist(payload: {
    labId: number | null
    equipmentId: number | null
    requestedStart: string
    requestedEnd: string
  }): Observable<WaitlistResponse> {
    return this.http.post<WaitlistResponse>(`${this.base}/Waitlists`, payload)
  }

  notifyNextWaitlist(payload: {
    labId: number | null
    equipmentId: number | null
    requestedStart: string
    requestedEnd: string
  }): Observable<WaitlistResponse> {
    return this.http.post<WaitlistResponse>(`${this.base}/Waitlists/notify-next`, payload)
  }

  markWaitlistBooked(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Waitlists/${id}/booked`, {})
  }

  cancelWaitlist(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Waitlists/${id}/cancel`, {})
  }

  expireWaitlist(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Waitlists/${id}/expire`, {})
  }

  violations(): Observable<ViolationResponse[]> {
    return this.http.get<ViolationResponse[]>(`${this.base}/Violations`)
  }

  violation(id: number): Observable<ViolationResponse> {
    return this.http.get<ViolationResponse>(`${this.base}/Violations/${id}`)
  }

  violationsByUser(userId: number): Observable<ViolationResponse[]> {
    return this.http.get<ViolationResponse[]>(`${this.base}/Violations/user/${userId}`)
  }

  activeViolationsByUser(userId: number): Observable<ViolationResponse[]> {
    return this.http.get<ViolationResponse[]>(`${this.base}/Violations/user/${userId}/active`)
  }

  violationSummary(userId: number): Observable<UserViolationSummaryResponse> {
    return this.http.get<UserViolationSummaryResponse>(
      `${this.base}/Violations/user/${userId}/summary`,
    )
  }

  violationsByBooking(bookingId: number): Observable<ViolationResponse[]> {
    return this.http.get<ViolationResponse[]>(`${this.base}/Violations/booking/${bookingId}`)
  }

  createViolation(payload: {
    userId: number
    bookingId: number
    violationType: number
  }): Observable<ViolationResponse> {
    return this.http.post<ViolationResponse>(`${this.base}/Violations`, payload)
  }

  resolveViolation(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Violations/${id}/resolve`, {})
  }

  cancelViolation(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Violations/${id}/cancel`, {})
  }

  departments(activeOnly = false): Observable<DepartmentResponse[]> {
    return this.http.get<DepartmentResponse[]>(`${this.base}/Departments`, {
      params: this.params({ activeOnly }),
    })
  }

  createDepartment(payload: {
    departmentName: string
    description: string | null
  }): Observable<DepartmentResponse> {
    return this.http.post<DepartmentResponse>(`${this.base}/Departments`, payload)
  }

  updateDepartment(
    id: number,
    payload: { departmentName: string; description: string | null },
  ): Observable<DepartmentResponse> {
    return this.http.put<DepartmentResponse>(`${this.base}/Departments/${id}`, payload)
  }

  deactivateDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/Departments/${id}`)
  }

  activateDepartment(id: number): Observable<DepartmentResponse> {
    return this.http.post<DepartmentResponse>(`${this.base}/Departments/${id}/activate`, {})
  }

  users(query: {
    keyword?: string
    roleName?: string | number
    departmentId?: number
    status?: number
    pageNumber?: number
    pageSize?: number
  }): Observable<PagedResponse<UserManagementResponse>> {
    return this.http.get<PagedResponse<UserManagementResponse>>(`${this.base}/Users`, {
      params: this.params(query),
    })
  }

  user(id: number): Observable<UserManagementResponse> {
    return this.http.get<UserManagementResponse>(`${this.base}/Users/${id}`)
  }

  updateUser(
    id: number,
    payload: { fullName: string; username: string; email: string },
  ): Observable<void> {
    return this.http.put<void>(`${this.base}/Users/${id}`, payload)
  }

  changeUserRole(id: number, roleId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/Users/${id}/role`, { roleId })
  }

  changeUserDepartment(id: number, departmentId: number): Observable<void> {
    return this.http.put<void>(`${this.base}/Users/${id}/department`, { departmentId })
  }

  userAction(id: number, action: 'lock' | 'unlock' | 'deactivate' | 'activate'): Observable<void> {
    return this.http.post<void>(`${this.base}/Users/${id}/${action}`, {})
  }

  setUserStatus(id: number, status: number, restrictionUntil: string | null): Observable<void> {
    return this.http.put<void>(`${this.base}/Users/${id}/status`, { status, restrictionUntil })
  }

  userPenalty(id: number): Observable<UserPenaltyResponse> {
    return this.http.get<UserPenaltyResponse>(`${this.base}/Users/${id}/penalty`)
  }

  createUser(payload: {
    fullName: string
    username: string
    email: string
    password: string
    departmentId: number
    role: number
  }): Observable<unknown> {
    return this.http.post<unknown>(`${this.base}/Auth/create-user`, payload)
  }

  priorityRules(activeOnly = false): Observable<PriorityRuleResponse[]> {
    const path = activeOnly ? 'active' : ''
    return this.http.get<PriorityRuleResponse[]>(
      `${this.base}/PriorityRules${path ? `/${path}` : ''}`,
    )
  }

  createPriorityRule(payload: {
    purposeType: number
    priorityLevel: number
    description: string | null
  }): Observable<PriorityRuleResponse> {
    return this.http.post<PriorityRuleResponse>(`${this.base}/PriorityRules`, payload)
  }

  updatePriorityRule(
    id: number,
    payload: { priorityLevel: number; description: string | null },
  ): Observable<void> {
    return this.http.put<void>(`${this.base}/PriorityRules/${id}`, payload)
  }

  priorityRuleAction(id: number, action: 'activate' | 'deactivate'): Observable<void> {
    return this.http.post<void>(`${this.base}/PriorityRules/${id}/${action}`, {})
  }

  roles(): Observable<RoleResponse[]> {
    return this.http.get<RoleResponse[]>(`${this.base}/Roles`)
  }

  sendNotification(payload: {
    userId: number
    title: string
    message: string
    notificationType: number
  }): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(`${this.base}/Notifications/send`, payload)
  }

  auditLogs(query: object): Observable<PagedAuditLogResponse> {
    return this.http.get<PagedAuditLogResponse>(`${this.base}/AuditLogs`, {
      params: this.params(query),
    })
  }

  auditLog(id: number): Observable<AuditLogResponse> {
    return this.http.get<AuditLogResponse>(`${this.base}/AuditLogs/${id}`)
  }

  reportLabUtilization(from: string, to: string): Observable<ResourceUtilizationResponse[]> {
    return this.report<ResourceUtilizationResponse[]>('lab-utilization', { from, to })
  }

  reportEquipmentUtilization(from: string, to: string): Observable<ResourceUtilizationResponse[]> {
    return this.report<ResourceUtilizationResponse[]>('equipment-utilization', { from, to })
  }

  reportBookingsByDepartment(from: string, to: string): Observable<CategoryCountResponse[]> {
    return this.report<CategoryCountResponse[]>('bookings/by-department', { from, to })
  }

  reportDepartmentUtilization(
    from: string,
    to: string,
  ): Observable<DepartmentUtilizationResponse[]> {
    return this.report<DepartmentUtilizationResponse[]>('department-utilization', { from, to })
  }

  reportBookingsByPurpose(from: string, to: string): Observable<CategoryCountResponse[]> {
    return this.report<CategoryCountResponse[]>('bookings/by-purpose', { from, to })
  }

  reportBookingsByStatus(from: string, to: string): Observable<CategoryCountResponse[]> {
    return this.report<CategoryCountResponse[]>('bookings/by-status', { from, to })
  }

  reportMaintenanceByLab(from: string, to: string): Observable<MaintenanceCostResponse[]> {
    return this.report<MaintenanceCostResponse[]>('maintenance-costs/by-lab', { from, to })
  }

  reportMaintenanceByEquipment(from: string, to: string): Observable<MaintenanceCostResponse[]> {
    return this.report<MaintenanceCostResponse[]>('maintenance-costs/by-equipment', { from, to })
  }

  reportMaintenanceHistory(query: object): Observable<PagedMaintenanceHistoryResponse> {
    return this.report<PagedMaintenanceHistoryResponse>('maintenance-history', query)
  }

  reportMostUsedLabs(
    from: string,
    to: string,
    top: number,
  ): Observable<MostUsedResourceResponse[]> {
    return this.report<MostUsedResourceResponse[]>('most-used/labs', { from, to, top })
  }

  reportMostUsedEquipments(
    from: string,
    to: string,
    top: number,
  ): Observable<MostUsedResourceResponse[]> {
    return this.report<MostUsedResourceResponse[]>('most-used/equipments', { from, to, top })
  }

  reportViolations(from: string, to: string): Observable<ViolationSummaryResponse> {
    return this.report<ViolationSummaryResponse>('violations', { from, to })
  }

  reportPenaltyUsers(
    from: string,
    to: string,
    top: number,
  ): Observable<PenaltyUserReportResponse[]> {
    return this.report<PenaltyUserReportResponse[]>('penalty-users', { from, to, top })
  }

  reportNoShow(from: string, to: string): Observable<NoShowRateResponse> {
    return this.report<NoShowRateResponse>('no-show-rate', { from, to })
  }

  reportUsageTrend(from: string, to: string, groupBy: string): Observable<UsageTrendResponse[]> {
    return this.report<UsageTrendResponse[]>('usage-trend', { from, to, groupBy })
  }

  private report<T>(path: string, query: object): Observable<T> {
    return this.http.get<T>(`${this.base}/Reports/${path}`, { params: this.params(query) })
  }

  private params(query: object): HttpParams {
    let params = new HttpParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '')
        params = params.set(key, String(value))
    }
    return params
  }
}
