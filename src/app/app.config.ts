import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core'
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { provideTranslateService, TranslateService } from '@ngx-translate/core'
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader'
import { firstValueFrom } from 'rxjs'
import { AuthStore } from './core/auth/auth.store'

import { routes } from './app.routes'
import { env } from './core/config/env'
import { authInterceptor } from './core/http/auth.interceptor'
import { errorInterceptor } from './core/http/error.interceptor'
import { mutationDedupInterceptor } from './core/http/mutation-dedup.interceptor'

function resolveInitialLocale(): string {
  const stored = localStorage.getItem('app.locale')
  if (stored && (env.supportedLocales as readonly string[]).includes(stored)) {
    return stored
  }
  const nav = navigator.language.split('-')[0] ?? ''
  return (env.supportedLocales as readonly string[]).includes(nav) ? nav : env.defaultLocale
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(
      withInterceptors([authInterceptor, mutationDedupInterceptor, errorInterceptor]),
    ),
    provideTranslateService({
      fallbackLang: env.defaultLocale,
      loader: provideTranslateHttpLoader({
        prefix: './i18n/',
        suffix: '.json?v=20260807-login-username-v2',
      }),
    }),
    // Load the initial language before the app renders to avoid flashes.
    provideAppInitializer(() => {
      const translate = inject(TranslateService)
      const authStore = inject(AuthStore)
      const locale = resolveInitialLocale()
      document.documentElement.lang = locale
      return Promise.all([
        firstValueFrom(translate.use(locale)).catch(() => undefined),
        authStore.hydrate(),
      ])
    }),
  ],
}
