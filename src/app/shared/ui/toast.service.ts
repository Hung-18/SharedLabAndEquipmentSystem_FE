import { Injectable, signal } from '@angular/core'

export type ToastKind = 'success' | 'error' | 'info'
export interface ToastMessage {
  id: number
  kind: ToastKind
  title: string
  message?: string
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _items = signal<ToastMessage[]>([])
  readonly items = this._items.asReadonly()
  private sequence = 0

  show(kind: ToastKind, title: string, message?: string): void {
    const item: ToastMessage = { id: ++this.sequence, kind, title, message }
    this._items.update((items) => [...items, item])
    window.setTimeout(() => this.dismiss(item.id), 4200)
  }

  success(title: string, message?: string): void {
    this.show('success', title, message)
  }

  error(title: string, message?: string): void {
    this.show('error', title, message)
  }

  info(title: string, message?: string): void {
    this.show('info', title, message)
  }

  dismiss(id: number): void {
    this._items.update((items) => items.filter((item) => item.id !== id))
  }
}
