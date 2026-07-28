import { Injectable, signal } from '@angular/core'

export interface SystemMaintenanceState {
  enabled: boolean
  expectedStart: string
  expectedEnd: string
  message: string
  updatedAt: string
  updatedBy: string
}

const STORAGE_KEY = 'sharedlab.system-maintenance'

const DEFAULT_STATE: SystemMaintenanceState = {
  enabled: false,
  expectedStart: '',
  expectedEnd: '',
  message: '',
  updatedAt: '',
  updatedBy: '',
}

@Injectable({ providedIn: 'root' })
export class SystemMaintenanceService {
  private readonly _state = signal<SystemMaintenanceState>(this.read())
  readonly state = this._state.asReadonly()

  constructor() {
    window.addEventListener('storage', (event) => {
      if (event.key !== STORAGE_KEY) return
      this._state.set(this.read())
    })
  }

  save(state: Omit<SystemMaintenanceState, 'updatedAt'>): void {
    const next: SystemMaintenanceState = {
      ...state,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    this._state.set(next)
  }

  private read(): SystemMaintenanceState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { ...DEFAULT_STATE }
      const value = JSON.parse(raw) as Partial<SystemMaintenanceState>
      return {
        enabled: Boolean(value.enabled),
        expectedStart: typeof value.expectedStart === 'string' ? value.expectedStart : '',
        expectedEnd: typeof value.expectedEnd === 'string' ? value.expectedEnd : '',
        message: typeof value.message === 'string' ? value.message : '',
        updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
        updatedBy: typeof value.updatedBy === 'string' ? value.updatedBy : '',
      }
    } catch {
      return { ...DEFAULT_STATE }
    }
  }
}
