import { NgClass } from '@angular/common'
import { Component, computed, input } from '@angular/core'
import type { ApiEnum } from '../../core/api/system.models'
import { labelOf, toneOf } from '../utils/presentation'

@Component({
  selector: 'app-status-badge',
  imports: [NgClass],
  template: `
    <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold" [ngClass]="classes()">
      <span class="h-1.5 w-1.5 rounded-full bg-current opacity-70"></span>{{ text() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly value = input<ApiEnum | null | undefined>()
  readonly domain = input('')
  readonly text = computed(() => labelOf(this.domain(), this.value()))
  readonly classes = computed(() => {
    const tone = toneOf(this.domain(), this.value())
    if (tone === 'emerald') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-700'
    if (tone === 'rose') return 'border-rose-200 bg-rose-50 text-rose-700'
    if (tone === 'indigo') return 'border-indigo-200 bg-indigo-50 text-indigo-700'
    return 'border-slate-200 bg-slate-50 text-slate-600'
  })
}
