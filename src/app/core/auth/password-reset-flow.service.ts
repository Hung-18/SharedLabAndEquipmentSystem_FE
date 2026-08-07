import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'

export interface PasswordResetEvent {
  type: 'completed'
  email: string
  at: number
}

const CHANNEL_NAME = 'shared-lab-password-reset'
const STORAGE_KEY = 'shared-lab.password-reset.completed'

@Injectable({ providedIn: 'root' })
export class PasswordResetFlowService {
  private readonly eventsSubject = new Subject<PasswordResetEvent>()
  private readonly remoteEventsSubject = new Subject<PasswordResetEvent>()
  readonly events$ = this.eventsSubject.asObservable()
  readonly remoteEvents$ = this.remoteEventsSubject.asObservable()
  private readonly channel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null

  constructor() {
    this.channel?.addEventListener('message', (event: MessageEvent<PasswordResetEvent>) => {
      if (event.data?.type !== 'completed') return
      this.eventsSubject.next(event.data)
      this.remoteEventsSubject.next(event.data)
    })
    window.addEventListener('storage', (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const value = JSON.parse(event.newValue) as PasswordResetEvent
        if (value.type === 'completed') {
          this.eventsSubject.next(value)
          this.remoteEventsSubject.next(value)
        }
      } catch {
        // Ignore malformed cross-tab values.
      }
    })
  }

  notifyCompleted(email: string): void {
    const event: PasswordResetEvent = { type: 'completed', email, at: Date.now() }
    this.eventsSubject.next(event)
    this.channel?.postMessage(event)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(event))
  }
}
