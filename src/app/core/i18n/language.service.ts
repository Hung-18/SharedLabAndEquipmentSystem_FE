import { Injectable, inject, signal } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { env } from '../config/env'

export type AppLocale = (typeof env.supportedLocales)[number]

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService)
  private readonly _locale = signal<AppLocale>(this.resolveInitialLocale())

  readonly locale = this._locale.asReadonly()

  constructor() {
    this.apply(this._locale())
  }

  use(locale: AppLocale): void {
    if (!(env.supportedLocales as readonly string[]).includes(locale)) return
    this._locale.set(locale)
    localStorage.setItem('app.locale', locale)
    this.apply(locale)
  }

  toggle(): void {
    this.use(this._locale() === 'vi' ? 'en' : 'vi')
  }

  private apply(locale: AppLocale): void {
    document.documentElement.lang = locale
    this.translate.use(locale).subscribe()
  }

  private resolveInitialLocale(): AppLocale {
    const stored = localStorage.getItem('app.locale')
    if ((env.supportedLocales as readonly string[]).includes(stored ?? '')) {
      return stored as AppLocale
    }
    const browserLocale = navigator.language.split('-')[0]
    return (env.supportedLocales as readonly string[]).includes(browserLocale)
      ? (browserLocale as AppLocale)
      : (env.defaultLocale as AppLocale)
  }
}
