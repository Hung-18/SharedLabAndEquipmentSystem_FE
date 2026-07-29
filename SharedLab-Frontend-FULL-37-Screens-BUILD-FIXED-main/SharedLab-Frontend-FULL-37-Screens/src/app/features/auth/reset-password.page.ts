import { Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'
import { firstValueFrom, timeout } from 'rxjs'
import { PasswordResetFlowService } from '../../core/auth/password-reset-flow.service'
import { AuthService } from '../../core/auth/auth.service'
import { AuthStore } from '../../core/auth/auth.store'
import { ApiError } from '../../core/http/api-error'
import { IconComponent } from '../../shared/ui/icon'
import { LanguageSwitcherComponent } from '../../shared/ui/language-switcher'

@Component({
  selector: 'app-reset-password-page',
  imports: [FormsModule, RouterLink, TranslatePipe, IconComponent, LanguageSwitcherComponent],
  template: `
    <main
      class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#111a3a] p-4 sm:p-6"
    >
      <div class="absolute top-5 right-5 z-20 sm:top-7 sm:right-7">
        <app-language-switcher tone="dark" />
      </div>
      <div class="absolute top-0 -left-20 h-96 w-96 rounded-full bg-violet-500/25 blur-3xl"></div>
      <div class="absolute right-0 -bottom-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl"></div>
      <div
        class="absolute inset-0 opacity-[0.06]"
        style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 30px 30px"
      ></div>

      <section
        class="relative w-full max-w-[560px] rounded-[32px] bg-white p-6 shadow-2xl shadow-black/25 sm:p-10"
      >
        @if (success) {
          <div class="py-6 text-center" aria-live="polite">
            <div
              class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
            >
              <app-icon name="check" [size]="36" />
            </div>
            <h1 class="mt-6 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              {{ 'auth.reset.successTitle' | translate }}
            </h1>
            <p class="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
              {{ 'auth.reset.successText' | translate }}
            </p>
            <div
              class="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600"
            >
              <span
                class="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"
              ></span>
              {{ 'auth.reset.redirect' | translate }}
            </div>
            <button
              type="button"
              class="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-7 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
              (click)="goLogin()"
            >
              {{ 'common.goLogin' | translate }}
              <app-icon name="arrow-right" [size]="18" />
            </button>
          </div>
        } @else {
          <a
            routerLink="/login"
            class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
          >
            <app-icon name="arrow-left" [size]="18" />
            {{ 'common.backLogin' | translate }}
          </a>

          <div
            class="mt-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600"
          >
            <app-icon name="lock" [size]="29" />
          </div>
          <h1 class="mt-6 text-3xl font-bold tracking-[-0.035em] text-slate-950">
            {{ 'auth.reset.title' | translate }}
          </h1>
          <p class="mt-3 text-sm leading-6 text-slate-500">
            {{ 'auth.reset.subtitle' | translate }}
          </p>

          <form class="mt-8 space-y-5" (ngSubmit)="submit()" #form="ngForm">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">
                {{ 'auth.reset.email' | translate }}
              </span>
              <input
                [(ngModel)]="email"
                name="email"
                type="email"
                email
                required
                autocomplete="email"
                class="input-shell"
              />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">
                {{ 'auth.reset.newPassword' | translate }}
              </span>
              <div class="relative">
                <input
                  [(ngModel)]="newPassword"
                  (ngModelChange)="passwordSignal.set($event)"
                  name="newPassword"
                  [type]="showPassword ? 'text' : 'password'"
                  required
                  minlength="8"
                  autocomplete="new-password"
                  [placeholder]="'auth.reset.placeholder' | translate"
                  class="input-shell !pr-12"
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-600"
                  (click)="showPassword = !showPassword"
                >
                  <app-icon [name]="showPassword ? 'eye-off' : 'eye'" [size]="19" />
                </button>
              </div>
              <div class="mt-3 grid grid-cols-4 gap-1.5">
                @for (index of [1, 2, 3, 4]; track index) {
                  <span
                    class="h-1.5 rounded-full"
                    [class.bg-slate-200]="passwordStrength() < index"
                    [class.bg-rose-400]="passwordStrength() >= index && passwordStrength() === 1"
                    [class.bg-amber-400]="passwordStrength() >= index && passwordStrength() === 2"
                    [class.bg-indigo-500]="passwordStrength() >= index && passwordStrength() === 3"
                    [class.bg-emerald-500]="passwordStrength() >= index && passwordStrength() === 4"
                  ></span>
                }
              </div>
              <p class="mt-2 text-xs text-slate-400">
                {{ 'auth.reset.strengthHint' | translate }}
              </p>
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">
                {{ 'auth.reset.confirm' | translate }}
              </span>
              <input
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autocomplete="new-password"
                class="input-shell"
              />
              @if (confirmPassword && confirmPassword !== newPassword) {
                <p class="mt-2 text-xs font-medium text-rose-600">
                  {{ 'auth.reset.mismatch' | translate }}
                </p>
              }
            </label>

            @if (errorMessage) {
              <div
                class="flex gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700"
              >
                <app-icon name="alert" [size]="18" />
                <p>{{ errorMessage }}</p>
              </div>
            }

            <button
              type="submit"
              [disabled]="
                form.invalid ||
                loading ||
                newPassword !== confirmPassword ||
                !token ||
                !isPasswordValid()
              "
              class="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              @if (loading) {
                <span
                  class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                ></span>
                {{ 'auth.reset.submitting' | translate }}
              } @else {
                {{ 'auth.reset.submit' | translate }}
                <app-icon name="arrow-right" [size]="18" />
              }
            </button>
          </form>

          @if (!token) {
            <p class="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
              {{ 'auth.reset.missingToken' | translate }}
            </p>
          }
        }
      </section>
    </main>
  `,
})
export class ResetPasswordPage {
  private readonly auth = inject(AuthService)
  private readonly authStore = inject(AuthStore)
  private readonly flow = inject(PasswordResetFlowService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private redirectTimer?: number

  protected email = this.route.snapshot.queryParamMap.get('email') ?? ''
  protected token = this.route.snapshot.queryParamMap.get('token') ?? ''
  protected newPassword = ''
  protected confirmPassword = ''
  protected showPassword = false
  protected loading = false
  protected success = false
  protected errorMessage = ''
  protected readonly passwordSignal = signal('')
  protected readonly passwordStrength = computed(() => {
    const value = this.passwordSignal()
    if (!value) return 0
    let score = value.length >= 8 ? 1 : 0
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
    if (/\d/.test(value)) score += 1
    if (/[^A-Za-z0-9]/.test(value)) score += 1
    return score
  })

  protected isPasswordValid(): boolean {
    return (
      this.newPassword.length >= 8 &&
      /[A-Z]/.test(this.newPassword) &&
      /[a-z]/.test(this.newPassword) &&
      /\d/.test(this.newPassword)
    )
  }

  protected async submit(): Promise<void> {
    if (
      !this.token ||
      this.loading ||
      this.newPassword !== this.confirmPassword ||
      !this.isPasswordValid()
    )
      return
    this.loading = true
    this.errorMessage = ''
    try {
      await firstValueFrom(
        this.auth
          .resetPassword({
            email: this.email.trim(),
            token: this.token,
            newPassword: this.newPassword,
          })
          .pipe(timeout(15000)),
      )

      // A reset must never reuse an existing authenticated session. This also prevents the guest
      // guard from sending the user to dashboard/home instead of the login page.
      this.authStore.clearLocalSession()
      this.flow.notifyCompleted(this.email.trim())
      this.success = true
      this.redirectTimer = window.setTimeout(() => this.goLogin(), 900)
    } catch (error) {
      this.errorMessage =
        error instanceof ApiError
          ? error.message
          : 'Yêu cầu mất quá nhiều thời gian hoặc kết nối bị gián đoạn. Vui lòng thử lại.'
    } finally {
      this.loading = false
    }
  }

  protected goLogin(): void {
    window.clearTimeout(this.redirectTimer)
    void this.router.navigate(['/login'], {
      replaceUrl: true,
      queryParams: { reset: 'success' },
      state: { resetSuccess: true },
    })
  }
}
