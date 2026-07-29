import { Component, inject, input } from '@angular/core'
import { LanguageService } from '../../core/i18n/language.service'

@Component({
  selector: 'app-language-switcher',
  template: `
    <div
      class="inline-flex items-center rounded-2xl border p-1 shadow-sm backdrop-blur"
      [class.border-white/15]="tone() === 'dark'"
      [class.bg-white/10]="tone() === 'dark'"
      [class.border-slate-200]="tone() === 'light'"
      [class.bg-white/90]="tone() === 'light'"
      role="group"
      aria-label="Language switcher"
    >
      <button
        type="button"
        class="rounded-xl px-3 py-2 text-[11px] font-black transition"
        [class.bg-white]="language.locale() === 'vi'"
        [class.text-slate-950]="language.locale() === 'vi'"
        [class.shadow-sm]="language.locale() === 'vi'"
        [class.text-white/65]="language.locale() !== 'vi' && tone() === 'dark'"
        [class.text-slate-500]="language.locale() !== 'vi' && tone() === 'light'"
        (click)="language.use('vi')"
      >
        VI
      </button>
      <button
        type="button"
        class="rounded-xl px-3 py-2 text-[11px] font-black transition"
        [class.bg-white]="language.locale() === 'en'"
        [class.text-slate-950]="language.locale() === 'en'"
        [class.shadow-sm]="language.locale() === 'en'"
        [class.text-white/65]="language.locale() !== 'en' && tone() === 'dark'"
        [class.text-slate-500]="language.locale() !== 'en' && tone() === 'light'"
        (click)="language.use('en')"
      >
        EN
      </button>
    </div>
  `,
})
export class LanguageSwitcherComponent {
  protected readonly language = inject(LanguageService)
  readonly tone = input<'light' | 'dark'>('light')
}
