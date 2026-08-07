import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { Observable, from, map } from 'rxjs'
import { env } from '../config/env'
import { ApiError } from '../http/api-error'
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
    const identifier = (payload.email ?? payload.username ?? '').trim()
    const request: LoginPayload = {
      email: identifier,
      username: identifier,
      password: payload.password,
    }

    return this.http.post<AuthTokens>(`${this.baseUrl}/login`, request)
  }

  me(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.baseUrl}/me`)
      .pipe(map((user) => ({ ...user, status: normalizeUserStatus(user.status) })))
  }

  refresh(refreshToken: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.baseUrl}/refresh`, { refreshToken })
  }

  logout(refreshToken: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/logout`, { refreshToken })
  }

  forgotPassword(
    payload: ForgotPasswordPayload,
  ): Observable<{ success: boolean; message: string }> {
    // Use a keepalive fetch for this public endpoint. The backend currently waits
    // for SMTP to finish before returning, so navigating to Gmail must not abort
    // the already-started password-reset request.
    const request = fetch(`${this.baseUrl}/forgot-password`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      credentials: 'same-origin',
      keepalive: true,
    })
      .then(async (response) => {
        const rawBody = await response.text()
        let body: { success?: boolean; message?: string } = {}

        if (rawBody) {
          try {
            body = JSON.parse(rawBody) as { success?: boolean; message?: string }
          } catch {
            body = {}
          }
        }

        if (!response.ok) {
          throw new ApiError(
            response.status,
            body.message?.trim() || 'Không thể gửi liên kết đặt lại mật khẩu.',
          )
        }

        return {
          success: body.success ?? true,
          message: body.message ?? 'Nếu email tồn tại, hệ thống đã gửi liên kết đặt lại mật khẩu.',
        }
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError) throw error
        throw new ApiError(0, 'Không thể kết nối tới máy chủ. Vui lòng thử lại.')
      })

    return from(request)
  }

  resetPassword(payload: ResetPasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset-password`, payload)
  }
}

function normalizeUserStatus(value: UserStatus): Exclude<UserStatus, number> {
  if (typeof value === 'string') return value
  return (
    (
      {
        1: 'Active',
        2: 'Inactive',
        3: 'Restricted',
        4: 'Locked',
      } as Record<number, Exclude<UserStatus, number>>
    )[value] ?? 'Inactive'
  )
}
