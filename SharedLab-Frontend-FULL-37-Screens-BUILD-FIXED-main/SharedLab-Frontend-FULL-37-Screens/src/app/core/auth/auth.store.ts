import { Injectable, computed, inject, signal } from '@angular/core'
import { firstValueFrom, timeout } from 'rxjs'
import { ApiError } from '../http/api-error'
import { AuthService } from './auth.service'
import { TokenStorage } from './token-storage'
import type { AuthUser, LoginPayload, UserRole } from './auth.types'

const USER_KEY = 'auth.user'

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly auth = inject(AuthService)
  private readonly tokens = inject(TokenStorage)

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
      this._error.set(this.resolveMessage(error))
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

  private resolveMessage(error: unknown): string {
    if (error instanceof ApiError) return error.message
    if (error instanceof Error) return error.message
    return 'Không thể đăng nhập. Vui lòng thử lại.'
  }
}
