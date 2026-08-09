import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { Observable, catchError, finalize, shareReplay, switchMap, tap, throwError } from 'rxjs'
import { AuthStore } from '../auth/auth.store'
import { TokenStorage } from '../auth/token-storage'
import type { AuthTokens } from '../auth/auth.types'
import { env } from '../config/env'
import { ApiError } from './api-error'

const USER_KEY = 'auth.user'
let refreshInFlight$: Observable<AuthTokens> | null = null

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router)
  const tokens = inject(TokenStorage)
  const authStore = inject(AuthStore)
  const http = new HttpClient(inject(HttpBackend))

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = /\/Auth\/(login|refresh|forgot-password|reset-password)$/i.test(
        req.url,
      )
      const refreshToken = tokens.refresh

      if (error.status === 401 && refreshToken && !isAuthEndpoint) {
        if (!refreshInFlight$) {
          refreshInFlight$ = http
            .post<AuthTokens>(`${env.apiBaseUrl}/Auth/refresh`, { refreshToken })
            .pipe(
              tap((fresh) => tokens.set(fresh.accessToken, fresh.refreshToken)),
              shareReplay({ bufferSize: 1, refCount: false }),
              finalize(() => {
                refreshInFlight$ = null
              }),
            )
        }

        return refreshInFlight$.pipe(
          switchMap((fresh) =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${fresh.accessToken}` } })),
          ),
          catchError((refreshError: HttpErrorResponse) => {
            // Only end the local session when the backend actually rejects the refresh token.
            // Network/5xx failures are temporary and must not log the user out.
            if (isRefreshTokenRejected(refreshError)) {
              clearSession(tokens, authStore)
              void router.navigate(['/login'], {
                replaceUrl: true,
                queryParams: { reason: 'session-invalidated' },
              })
            }
            return throwError(() => normalize(refreshError))
          }),
        )
      }

      if (error.status === 401 && !isAuthEndpoint) {
        clearSession(tokens, authStore)
        void router.navigate(['/login'], {
          replaceUrl: true,
          queryParams: { reason: 'session-expired' },
        })
      }

      return throwError(() => normalize(error))
    }),
  )
}

function isRefreshTokenRejected(error: HttpErrorResponse): boolean {
  return error.status === 400 || error.status === 401 || error.status === 403
}

function clearSession(tokens: TokenStorage, authStore: AuthStore): void {
  // Clear both persisted tokens and the reactive user state so the old header/user
  // does not remain visible while redirecting to the login page.
  authStore.clearLocalSession()
  tokens.clear()
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(USER_KEY)
}

function normalize(error: HttpErrorResponse): ApiError {
  const body = error.error as
    | { message?: string; title?: string; code?: string; errors?: Record<string, string[]> }
    | string
    | undefined
  const message =
    typeof body === 'string'
      ? body
      : (body?.message ?? body?.title ?? error.message ?? 'Đã xảy ra lỗi kết nối.')
  return new ApiError(
    error.status,
    message,
    typeof body === 'object' ? body?.code : undefined,
    typeof body === 'object' ? body?.errors : undefined,
  )
}
