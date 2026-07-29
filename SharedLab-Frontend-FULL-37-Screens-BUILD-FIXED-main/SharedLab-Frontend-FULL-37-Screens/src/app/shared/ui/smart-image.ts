import { Component, effect, input, signal } from '@angular/core'
import { IconComponent } from './icon'

@Component({
  selector: 'app-smart-image',
  imports: [IconComponent],
  host: { class: 'block h-full w-full' },
  template: `
    <div
      class="relative h-full w-full overflow-hidden bg-linear-to-br from-slate-950 via-indigo-950 to-violet-900"
    >
      @if (src() && !failed()) {
        <img
          [src]="src()!"
          [alt]="alt()"
          [attr.loading]="priority() ? 'eager' : 'lazy'"
          [attr.fetchpriority]="priority() ? 'high' : 'auto'"
          decoding="async"
          class="h-full w-full object-cover transition duration-500"
          [class.opacity-0]="!loaded()"
          [class.scale-[1.02]]="!loaded()"
          (load)="loaded.set(true)"
          (error)="markFailed()"
        />
      }

      @if (!src() || failed()) {
        <div
          class="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(167,139,250,.5),transparent_28%),radial-gradient(circle_at_78%_82%,rgba(34,211,238,.42),transparent_25%)]"
        ></div>
        <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/90">
          <span
            class="flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-sm"
          >
            <app-icon [name]="fallbackIcon()" [size]="38" />
          </span>
          @if (failed()) {
            <span
              class="rounded-full border border-white/10 bg-slate-950/30 px-3 py-1.5 text-[10px] font-bold text-white/70 backdrop-blur-sm"
              >Ảnh không khả dụng</span
            >
          }
        </div>
      } @else if (!loaded()) {
        <div class="skeleton absolute inset-0"></div>
      }
    </div>
  `,
})
export class SmartImageComponent {
  readonly src = input<string | null | undefined>(null)
  readonly alt = input('Ảnh tài nguyên')
  readonly fallbackIcon = input('flask')
  readonly priority = input(false)
  readonly loaded = signal(false)
  readonly failed = signal(false)

  constructor() {
    effect(() => {
      this.src()
      this.loaded.set(false)
      this.failed.set(false)
    })
  }

  protected markFailed(): void {
    this.failed.set(true)
    this.loaded.set(false)
  }
}
