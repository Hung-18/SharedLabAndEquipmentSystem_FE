import { Injectable } from '@angular/core'

/**
 * Single source of truth for auth tokens.
 * Persistent sessions use localStorage; non-persistent sessions use sessionStorage.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly ACCESS = 'auth.accessToken'
  private readonly REFRESH = 'auth.refreshToken'

  get access(): string | null {
    return localStorage.getItem(this.ACCESS) ?? sessionStorage.getItem(this.ACCESS)
  }

  get refresh(): string | null {
    return localStorage.getItem(this.REFRESH) ?? sessionStorage.getItem(this.REFRESH)
  }

  get isPersistent(): boolean {
    return Boolean(localStorage.getItem(this.ACCESS) || localStorage.getItem(this.REFRESH))
  }

  set(access: string, refresh?: string, persistent = this.isPersistent): void {
    const target = persistent ? localStorage : sessionStorage
    const other = persistent ? sessionStorage : localStorage

    other.removeItem(this.ACCESS)
    other.removeItem(this.REFRESH)
    target.setItem(this.ACCESS, access)
    if (refresh) target.setItem(this.REFRESH, refresh)
  }

  clear(): void {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem(this.ACCESS)
      storage.removeItem(this.REFRESH)
    }
  }
}
