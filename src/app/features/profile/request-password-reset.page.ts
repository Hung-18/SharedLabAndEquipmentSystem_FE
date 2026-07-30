import { Component, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { firstValueFrom, timeout } from 'rxjs'
import { AuthService } from '../../core/auth/auth.service'
import { AuthStore } from '../../core/auth/auth.store'
import { ApiError } from '../../core/http/api-error'
import { IconComponent } from '../../shared/ui/icon'

@Component({
  selector: 'app-request-password-reset-page',
  imports: [RouterLink, TranslatePipe, IconComponent],
  template: `
    <section class="mx-auto max-w-3xl space-y-6">
      <a
        routerLink="/app/profile"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
      >
        <app-icon name="arrow-left" [size]="18" />
        {{ 'auth.requestReset.backProfile' | translate }}
      </a>

      <article class="card-surface overflow-hidden">
        <div class="bg-linear-to-r from-[#111a3a] via-indigo-950 to-violet-900 px-6 py-8 text-white sm:px-9">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
            <app-icon name="shield" [size]="27" />
          </div>
          <h1 class="mt-5 text-3xl font-bold tracking-[-0.035em]">
            {{ 'auth.requestReset.title' | translate }}
          </h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-white/65">
            {{ 'auth.requestReset.subtitle' | translate }}
          </p>
        </div>

        <div class="p-6 sm:p-9">
          <div class="grid gap-4 sm:grid-cols-3">
            @for (step of steps; track step.key; let index = $index) {
              <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-xs font-bold text-indigo-700">
                  {{ index + 1 }}
                </span>
                <p class="mt-3 text-sm font-bold text-slate-900">
                  {{ step.key | translate }}
                </p>
              </div>
            }
          </div>

          @if (success()) {
            <div class="mt-7 rounded-3xl border border-emerald-200 bg-emerald-50 p-6" role="status" aria-live="polite">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <app-icon name="check" [size]="24" />
              </div>
              <h2 class="mt-4 text-lg font-bold text-emerald-900">
                {{ 'auth.requestReset.sentTitle' | translate }}
              </h2>
              <p class="mt-2 text-sm leading-6 text-emerald-800">
                {{ 'auth.requestReset.sentText' | translate }}
                <strong>{{ accountEmail() }}</strong>.
              </p>
              <div class="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"
                  (click)="openGmail()"
                >
                  <app-icon name="mail" [size]="18" />
                  {{ 'auth.requestReset.openGmail' | translate }}
                </button>
                <a
                  routerLink="/app/profile"
                  class="inline-flex h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  {{ 'auth.requestReset.backProfile' | translate }}
                </a>
              </div>
            </div>
          } @else {
            <div class="mt-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">
                  {{ 'auth.requestReset.accountEmail' | translate }}
                </span>
                <div class="input-shell flex items-center gap-3 bg-slate-50 text-slate-700">
                  <app-icon name="mail" [size]="19" />
                  <span class="min-w-0 truncate">{{ accountEmail() }}</span>
                </div>
              </label>

              <p class="mt-4 text-xs leading-5 text-slate-500">
                {{ 'auth.requestReset.emailHint' | translate }}
              </p>

              @if (errorMessage()) {
                <div
                  id="request-reset-error"
                  role="alert"
                  aria-live="assertive"
                  tabindex="-1"
                  class="mt-5 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 outline-none focus:ring-2 focus:ring-rose-200"
                >
                  <app-icon name="alert" [size]="19" />
                  <div>
                    <p class="font-bold">{{ 'auth.requestReset.errorTitle' | translate }}</p>
                    <p class="mt-1 leading-5">{{ errorMessage() }}</p>
                  </div>
                </div>
              }

              <button
                type="button"
                [disabled]="loading() || !accountEmail()"
                class="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                (click)="submit()"
              >
                @if (loading()) {
                  <span class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                  {{ 'auth.requestReset.submitting' | translate }}
                } @else {
                  {{ 'auth.requestReset.submit' | translate }}
                  <app-icon name="send" [size]="18" />
                }
              </button>
            </div>
          }
        </div>
      </article>

      <p class="text-center text-xs leading-5 text-slate-400">
        {{ 'auth.requestReset.distinction' | translate }}
      </p>
    </section>
  `,
})
export class RequestPasswordResetPage {
  private readonly auth = inject(AuthService)
  private readonly store = inject(AuthStore)
  private readonly translate = inject(TranslateService)

  protected readonly accountEmail = signal(this.store.user()?.email?.trim() ?? '')
  protected readonly loading = signal(false)
  protected readonly success = signal(false)
  protected readonly errorMessage = signal('')
  protected readonly steps = [
    { key: 'auth.requestReset.step1' },
    { key: 'auth.requestReset.step2' },
    { key: 'auth.requestReset.step3' },
  ]

  protected async submit(): Promise<void> {
    const email = this.accountEmail()
    if (!email || this.loading()) return

    this.loading.set(true)
    this.errorMessage.set('')

    try {
      await firstValueFrom(this.auth.forgotPassword({ email }).pipe(timeout(20000)))
      this.success.set(true)
    } catch (error) {
      const message =
        error instanceof ApiError && error.message.trim()
          ? error.message
          : this.translate.instant('auth.requestReset.connectionError')
      this.errorMessage.set(message)
      window.setTimeout(() => document.getElementById('request-reset-error')?.focus())
    } finally {
      this.loading.set(false)
    }
  }

  protected openGmail(): void {
    window.location.href = 'https://mail.google.com/mail/u/0/#inbox'
  }
}
