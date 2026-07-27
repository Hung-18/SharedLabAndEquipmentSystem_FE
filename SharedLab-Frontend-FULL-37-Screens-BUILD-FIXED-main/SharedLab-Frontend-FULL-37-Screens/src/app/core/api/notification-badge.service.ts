import { Injectable, signal } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class NotificationBadgeService {
  private readonly _count = signal(0)
  readonly count = this._count.asReadonly()

  set(value: number): void {
    this._count.set(Math.max(0, value))
  }

  decrement(): void {
    this._count.update((value) => Math.max(0, value - 1))
  }

  clear(): void {
    this._count.set(0)
  }
}
