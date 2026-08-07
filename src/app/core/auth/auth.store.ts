import { Injectable, computed, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { firstValueFrom, timeout } from 'rxjs'
import { ApiError } from '../http/api-error'
import { AuthService } from './auth.service'
import { PasswordResetFlowService } from './password-reset-flow.service'
import { TokenStorage } from './token-storage'
import type { AuthUser, LoginPayload, UserRole, UserStatus } from './auth.types'

const USER_KEY = 'auth.user'
const STATUS_HINTS_KEY = 'auth.user-status-hints'
const STATUS_HINT_TTL_MS = 24 * 60 * 60 * 1000

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly auth = inject(AuthService)
  private readonly tokens = inject(TokenStorage)
  private readonly resetFlow = inject(PasswordResetFlowService)
  private readonly router = inject(Router)

  private readonly _user = signal<AuthUser | null>(this.restore())
  private readonly _status = signal<'idle' | 'loading' | 'error'>('idle')
  private readonly _error = signal<string | null>(null)

  readonly user = this._user.asReadonly()
  readonly status = this._status.asReadonly()
  readonly error = this._error.asReadonly()
  readonly isAuthenticated = computed(() => Boolean(this._user() && this.tokens.access))
  readonly role = computed(() => this._user()?.roleName ?? '')
  readonly isRequester = computed(() => this.role() === 'Requester')
  readonly isManager = computed(() => this.role() === 'LabManager')
  readonly isAdmin = computed(() => this.role() === 'Admin')

  constructor() {
    // Password reset in another tab invalidates the browser session immediately.
    // Backend token-version validation is still the source of truth if this event is missed.
    this.resetFlow.remoteEvents$.subscribe(() => {
      this.clearLocalSession()
      void this.router.navigate(['/login'], {
        replaceUrl: true,
        queryParams: { reason: 'password-reset' },
      })
    })
  }

  async login(payload: LoginPayload, remember = true): Promise<AuthUser> {
    this._status.set('loading')
    this._error.set(null)

    try {
      const tokens = await firstValueFrom(this.auth.login(payload).pipe(timeout(15000)))
      this.tokens.set(tokens.accessToken, tokens.refreshToken, remember)
      const user = await firstValueFrom(this.auth.me().pipe(timeout(10000)))
      this.setUser(user, remember)
      this._status.set('idle')
      return user
    } catch (error) {
      this.tokens.clear()
      this._status.set('error')
      this._error.set(this.resolveMessage(error, payload.email ?? payload.username ?? ''))
      throw error
    }
  }

  async hydrate(): Promise<void> {
    if (!this.tokens.access) return
    try {
      const user = await firstValueFrom(this.auth.me().pipe(timeout(8000)))
      this.setUser(user)
    } catch {
      this.clearLocalSession()
    }
  }

  async logout(): Promise<void> {
    const refreshToken = this.tokens.refresh
    this.clearLocalSession()
    if (!refreshToken) return
    try {
      await firstValueFrom(this.auth.logout(refreshToken))
    } catch {
      // Local logout is still complete when the API is unavailable.
    }
  }

  hasRole(roles: readonly UserRole[]): boolean {
    return roles.includes(this.role() as UserRole)
  }

  rememberUserStatusHint(
    email: string,
    status: UserStatus,
    restrictionUntil: string | null = null,
  ): void {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedStatus = normalizeStatus(status)
    if (!normalizedEmail || !normalizedStatus) return

    const hints = this.readStatusHints()
    hints[normalizedEmail] = {
      status: normalizedStatus,
      restrictionUntil,
      updatedAt: Date.now(),
    }
    localStorage.setItem(STATUS_HINTS_KEY, JSON.stringify(hints))
  }

  clearLocalSession(): void {
    this.tokens.clear()
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(USER_KEY)
    this._user.set(null)
    this._status.set('idle')
    this._error.set(null)
  }

  private setUser(user: AuthUser, persistent = this.tokens.isPersistent): void {
    this._user.set(user)
    this.rememberUserStatusHint(user.email, user.status, user.restrictionUntil)
    const target = persistent ? localStorage : sessionStorage
    const other = persistent ? sessionStorage : localStorage
    other.removeItem(USER_KEY)
    target.setItem(USER_KEY, JSON.stringify(user))
  }

  private restore(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      localStorage.removeItem(USER_KEY)
      sessionStorage.removeItem(USER_KEY)
      return null
    }
  }

  private resolveMessage(error: unknown, email: string): string {
    const apiMessage =
      error instanceof ApiError
        ? error.message.trim()
        : error instanceof Error
          ? error.message.trim()
          : ''
    const normalizedMessage = apiMessage.toLowerCase()

    if (/bị khóa|locked/.test(normalizedMessage)) {
      return 'Tài khoản đã bị khóa. Hãy liên hệ quản trị viên để được mở khóa.'
    }
    if (/ngừng hoạt động|inactive/.test(normalizedMessage)) {
      return 'Tài khoản đã ngừng hoạt động. Hãy liên hệ quản trị viên để được hỗ trợ.'
    }
    if (/hạn chế|restricted/.test(normalizedMessage)) {
      return 'Tài khoản đang bị hạn chế. Bạn vẫn có thể đăng nhập nhưng không thể tạo booking mới trong thời gian hạn chế.'
    }

    if (error instanceof ApiError && error.status === 401) {
      const hint = this.statusHint(email)
      if (hint?.status === 'Locked') {
        return 'Tài khoản đã bị khóa. Hãy liên hệ quản trị viên để được mở khóa.'
      }
      if (hint?.status === 'Inactive') {
        return 'Tài khoản đã ngừng hoạt động. Hãy liên hệ quản trị viên để được hỗ trợ.'
      }
      if (hint?.status === 'Restricted') {
        const until = hint.restrictionUntil
          ? ` đến ${new Date(hint.restrictionUntil).toLocaleString('vi-VN')}`
          : ''
        return `Tài khoản đang bị hạn chế${until}. Vui lòng kiểm tra thời hạn hạn chế hoặc liên hệ quản trị viên.`
      }
    }

    return apiMessage || 'Không thể đăng nhập. Vui lòng thử lại.'
  }

  private statusHint(email: string): StatusHint | null {
    const normalizedEmail = email.trim().toLowerCase()
    const hints = this.readStatusHints()
    const hint = hints[normalizedEmail]
    if (!hint) return null
    if (Date.now() - hint.updatedAt > STATUS_HINT_TTL_MS) {
      delete hints[normalizedEmail]
      localStorage.setItem(STATUS_HINTS_KEY, JSON.stringify(hints))
      return null
    }
    return hint
  }

  private readStatusHints(): Record<string, StatusHint> {
    try {
      const raw = localStorage.getItem(STATUS_HINTS_KEY)
      return raw ? (JSON.parse(raw) as Record<string, StatusHint>) : {}
    } catch {
      localStorage.removeItem(STATUS_HINTS_KEY)
      return {}
    }
  }
}

interface StatusHint {
  status: 'Active' | 'Inactive' | 'Restricted' | 'Locked'
  restrictionUntil: string | null
  updatedAt: number
}

function normalizeStatus(
  status: UserStatus,
): 'Active' | 'Inactive' | 'Restricted' | 'Locked' | null {
  const key = String(status).trim()
  const values: Record<string, 'Active' | 'Inactive' | 'Restricted' | 'Locked'> = {
    '1': 'Active',
    '2': 'Inactive',
    '3': 'Restricted',
    '4': 'Locked',
    Active: 'Active',
    Inactive: 'Inactive',
    Restricted: 'Restricted',
    Locked: 'Locked',
  }
  return values[key] ?? null
}
