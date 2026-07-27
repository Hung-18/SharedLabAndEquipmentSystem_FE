import { Component, inject } from '@angular/core'
import { ToastService } from './toast.service'

@Component({
  selector: 'app-toast-outlet',
  template: `
    <div class="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-3">
      @for (toast of service.items(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur"
          [class.border-emerald-200]="toast.kind === 'success'"
          [class.border-rose-200]="toast.kind === 'error'"
          [class.border-indigo-200]="toast.kind === 'info'"
        >
          <div
            class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
            [class.bg-emerald-50]="toast.kind === 'success'"
            [class.text-emerald-600]="toast.kind === 'success'"
            [class.bg-rose-50]="toast.kind === 'error'"
            [class.text-rose-600]="toast.kind === 'error'"
            [class.bg-indigo-50]="toast.kind === 'info'"
            [class.text-indigo-600]="toast.kind === 'info'"
          >
            {{ toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '!' : 'i' }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-slate-900">{{ toast.title }}</p>
            @if (toast.message) {
              <p class="mt-1 text-sm leading-5 text-slate-500">{{ toast.message }}</p>
            }
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            (click)="service.dismiss(toast.id)"
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastOutletComponent {
  protected readonly service = inject(ToastService)
}
