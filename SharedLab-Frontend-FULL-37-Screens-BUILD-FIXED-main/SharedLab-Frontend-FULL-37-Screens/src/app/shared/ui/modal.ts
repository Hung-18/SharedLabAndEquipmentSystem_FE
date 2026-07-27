import { Component, input, output } from '@angular/core'
import { IconComponent } from './icon'

@Component({
  selector: 'app-modal',
  imports: [IconComponent],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-5">
        <button type="button" class="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" aria-label="Đóng" (click)="close.emit()"></button>
        <section class="relative z-10 max-h-[94vh] w-full overflow-auto rounded-t-[30px] border border-white/60 bg-white shadow-2xl sm:max-w-2xl sm:rounded-[30px]" [style.max-width]="width()">
          <header class="sticky top-0 z-10 flex items-start gap-4 border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur sm:px-6">
            <div class="min-w-0 flex-1"><h2 class="text-lg font-black text-slate-950">{{ title() }}</h2><p class="mt-1 text-xs leading-5 text-slate-500">{{ subtitle() }}</p></div>
            <button type="button" class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" (click)="close.emit()"><app-icon name="x" [size]="19" /></button>
          </header>
          <div class="p-5 sm:p-6"><ng-content /></div>
        </section>
      </div>
    }
  `,
})
export class ModalComponent {
  readonly open = input(false)
  readonly title = input.required<string>()
  readonly subtitle = input('')
  readonly width = input('720px')
  readonly close = output<void>()
}
