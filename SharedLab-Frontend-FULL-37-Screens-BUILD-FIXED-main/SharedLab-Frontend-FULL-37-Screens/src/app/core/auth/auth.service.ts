import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, map } from 'rxjs'
import { env } from '../config/env'
import type {
  AuthTokens,
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  UserStatus,
} from './auth.types'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient)
  private readonly baseUrl = `${env.apiBaseUrl}/Auth`

  login(payload: LoginPayload): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.baseUrl}/login`, payload)
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/me`).pipe(
      map((user) => ({ ...user, status: normalizeUserStatus(user.status) })),
    )
  }

  refresh(refreshToken: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.baseUrl}/refresh`, { refreshToken })
  }

  logout(refreshToken: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/logout`, { refreshToken })
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/forgot-password`,
      payload,
    )
  }

  resetPassword(payload: ResetPasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, payload)
  }
}

function normalizeUserStatus(value: UserStatus): Exclude<UserStatus, number> {
  if (typeof value === 'string') return value
  return ({
    1: 'Active',
    2: 'Inactive',
    3: 'Restricted',
    4: 'Locked',
  } as Record<number, Exclude<UserStatus, number>>)[value] ?? 'Inactive'
}
