import { HttpClient, HttpParams } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable } from 'rxjs'
import { env } from '../config/env'
import type {
  BookingResponse,
  DashboardResponse,
  NotificationResponse,
  UnreadNotificationCountResponse,
  UserViolationSummaryResponse,
  WaitlistResponse,
} from './api.models'

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly http = inject(HttpClient)
  private readonly base = env.apiBaseUrl

  bookingsByUser(userId: number): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.base}/Bookings/user/${userId}`)
  }

  waitlistsByUser(userId: number): Observable<WaitlistResponse[]> {
    return this.http.get<WaitlistResponse[]>(`${this.base}/Waitlists/user/${userId}`)
  }

  violationSummary(userId: number): Observable<UserViolationSummaryResponse> {
    return this.http.get<UserViolationSummaryResponse>(
      `${this.base}/Violations/user/${userId}/summary`,
    )
  }

  notifications(userId: number, pageNumber = 1, pageSize = 20): Observable<NotificationResponse[]> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
    return this.http.get<NotificationResponse[]>(`${this.base}/Notifications/user/${userId}`, {
      params,
    })
  }

  unreadNotifications(userId: number): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(
      `${this.base}/Notifications/user/${userId}/unread`,
    )
  }

  unreadCount(userId: number): Observable<UnreadNotificationCountResponse> {
    return this.http.get<UnreadNotificationCountResponse>(
      `${this.base}/Notifications/user/${userId}/unread-count`,
    )
  }

  markNotificationRead(notificationId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Notifications/${notificationId}/read`, {})
  }

  markAllNotificationsRead(userId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Notifications/user/${userId}/read-all`, {})
  }

  dashboard(from: string, to: string): Observable<DashboardResponse> {
    const params = new HttpParams().set('from', from).set('to', to)
    return this.http.get<DashboardResponse>(`${this.base}/Dashboard`, { params })
  }
}
