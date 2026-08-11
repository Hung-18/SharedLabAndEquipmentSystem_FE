import { DOCUMENT } from '@angular/common'
import type { HttpEvent, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import type { Observable } from 'rxjs'
import { finalize, shareReplay } from 'rxjs'

const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const inFlightMutations = new Map<string, Observable<HttpEvent<unknown>>>()

export const mutationDedupInterceptor: HttpInterceptorFn = (request, next) => {
  if (!mutationMethods.has(request.method.toUpperCase())) return next(request)

  const key = `${request.method}:${request.urlWithParams}:${stableBody(request.body)}`
  const existing = inFlightMutations.get(key)
  if (existing) return existing

  const document = inject(DOCUMENT)
  const active = document.activeElement
  const Button = document.defaultView?.HTMLButtonElement
  const button = Button && active instanceof Button ? active : null
  const previousDisabled = button?.disabled ?? false
  const previousBusy = button?.getAttribute('aria-busy') ?? null

  if (button) {
    button.disabled = true
    button.setAttribute('aria-busy', 'true')
    button.classList.add('api-action-pending')
  }

  const shared = next(request).pipe(
    finalize(() => {
      inFlightMutations.delete(key)
      if (!button) return
      button.disabled = previousDisabled
      button.classList.remove('api-action-pending')
      if (previousBusy === null) button.removeAttribute('aria-busy')
      else button.setAttribute('aria-busy', previousBusy)
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  )

  inFlightMutations.set(key, shared)
  return shared
}

function stableBody(body: unknown): string {
  if (body === null || body === undefined) return ''
  if (typeof body !== 'object') return String(body)
  try {
    return JSON.stringify(body, objectKeysSorted)
  } catch {
    return String(body)
  }
}

function objectKeysSorted(_key: string, value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  )
}
