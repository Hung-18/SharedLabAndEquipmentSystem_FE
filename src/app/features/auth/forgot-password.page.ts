import { Component, DestroyRef, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'
import { Subscription, finalize } from 'rxjs'
import { PasswordResetFlowService } from '../../core/auth/password-reset-flow.service'
import { AuthService } from '../../core/auth/auth.service'
import { ApiError } from '../../core/http/api-error'
import { IconComponent } from '../../shared/ui/icon'
import { LanguageSwitcherComponent } from '../../shared/ui/language-switcher'

@Component({
  selector: 'app-forgot-password-page',
  imports: [FormsModule, RouterLink, TranslatePipe, IconComponent, LanguageSwitcherComponent],
  template: `
    <main
      class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fb] p-4 sm:p-6"
    >
      <div class="absolute top-5 right-5 z-20 sm:top-7 sm:right-7">
        <app-language-switcher />
      </div>
      <div
        class="absolute top-[12%] left-[8%] h-72 w-72 rounded-full bg-violet-200/55 blur-3xl"
      ></div>
      <div
        class="absolute right-[8%] bottom-[10%] h-80 w-80 rounded-full bg-cyan-200/55 blur-3xl"
      ></div>

      <section
        class="relative w-full max-w-[520px] rounded-[32px] border border-white bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-10"
      >
        <a
          routerLink="/login"
          class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
        >
          <app-icon name="arrow-left" [size]="18" />
          {{ 'common.backLogin' | translate }}
        </a>

        <div
          class="mt-9 flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-100 to-violet-100 text-indigo-600 shadow-inner"
        >
          <app-icon [name]="completed() ? 'check' : 'mail'" [size]="28" />
        </div>
        <h1 class="mt-6 text-3xl font-bold tracking-[-0.035em] text-slate-950">
          {{ (completed() ? 'auth.forgot.completedTitle' : 'auth.forgot.title') | translate }}
        </h1>
        <p class="mt-3 text-sm leading-6 text-slate-500">
          {{ (completed() ? 'auth.forgot.completedText' : 'auth.forgot.subtitle') | translate }}
        </p>

        @if (completed()) {
          <div class="mt-8 rounded-3xl border border-indigo-100 bg-indigo-50 p-6">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700"
            >
              <app-icon name="check" [size]="24" />
            </div>
            <p class="mt-4 text-sm leading-6 text-indigo-800">
              {{ 'auth.forgot.closeHint' | translate }}
            </p>
            <div class="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                class="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"
                (click)="closeCurrentTab()"
              >
                {{ 'common.closeTab' | translate }}
              </button>
              <a
                routerLink="/login"
                class="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-indigo-200 bg-white px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
              >
                {{ 'common.goLogin' | translate }}
              </a>
            </div>
          </div>
        } @else if (sent()) {
          <div class="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"
            >
              <app-icon name="check" [size]="24" />
            </div>
            <h2 class="mt-4 text-lg font-bold text-emerald-900">
              {{ 'auth.forgot.sentTitle' | translate }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-emerald-700">
              @if (requestConfirmed()) {
                {{ 'auth.forgot.sentText' | translate }}
                <strong>{{ email }}</strong
                >.
              } @else {
                {{ 'auth.forgot.timeout' | translate }}
              }
            </p>
            @if (deliveryWarning()) {
              <p
                class="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800"
              >
                {{ deliveryWarning() }}
              </p>
            }
            <p class="mt-3 text-xs leading-5 text-emerald-700/75">
              {{ 'auth.forgot.gmailSameTabHint' | translate }}
            </p>
            <div class="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                class="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/15 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                (click)="openGmail()"
              >
                <app-icon name="mail" [size]="18" />
                {{ 'auth.forgot.openGmail' | translate }}
              </button>
              <a
                routerLink="/login"
                class="inline-flex h-11 flex-1 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                {{ 'common.goLogin' | translate }}
              </a>
            </div>
            <button
              type="button"
              class="mt-4 text-sm font-bold text-emerald-800 hover:underline"
              (click)="resetForm()"
            >
              {{ 'auth.forgot.another' | translate }}
            </button>
          </div>
        } @else {
          <form class="mt-8" (ngSubmit)="submit()" #form="ngForm">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">
                {{ 'auth.forgot.email' | translate }}
              </span>
              <div class="relative">
                <span
                  class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400"
                  ><app-icon name="mail" [size]="19"
                /></span>
                <input
                  [(ngModel)]="email"
                  name="email"
                  type="email"
                  email
                  required
                  autocomplete="email"
                  placeholder="name@university.edu.vn"
                  class="input-shell !pl-12"
                />
              </div>
            </label>

            @if (errorMessage()) {
              <p class="mt-3 text-sm text-rose-600">{{ errorMessage() }}</p>
            }

            <button
              type="submit"
              [disabled]="form.invalid || loading()"
              class="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#111a3a] px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-[#17234c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              @if (loading()) {
                <span
                  class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                ></span>
                {{ 'auth.forgot.submitting' | translate }}
              } @else {
                {{ 'auth.forgot.submit' | translate }}
                <app-icon name="arrow-right" [size]="18" />
              }
            </button>
          </form>
        }

        <p class="mt-8 text-center text-xs leading-5 text-slate-400">
          {{ 'auth.forgot.security' | translate }}
        </p>
      </section>
    </main>
  `,
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService)
  private readonly flow = inject(PasswordResetFlowService)
  private readonly destroyRef = inject(DestroyRef)
  private readonly router = inject(Router)
  private activeRequest?: Subscription

  protected email = ''
  protected readonly loading = signal(false)
  private visualLoadingTimer?: number
  protected readonly sent = signal(false)
  protected readonly requestConfirmed = signal(false)
  protected readonly deliveryWarning = signal('')
  protected readonly completed = signal(false)
  protected readonly errorMessage = signal('')

  constructor() {
    this.flow.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (!this.email || event.email.toLowerCase() === this.email.trim().toLowerCase()) {
        this.loading.set(false)
        this.sent.set(false)
        this.completed.set(true)
      }
    })
  }

  protected submit(): void {
    const normalizedEmail = this.email.trim()
    if (this.loading() || !normalizedEmail) return

    window.clearTimeout(this.visualLoadingTimer)
    this.activeRequest?.unsubscribe()

    this.loading.set(true)
    this.sent.set(false)
    this.completed.set(false)
    this.requestConfirmed.set(false)
    this.deliveryWarning.set('')
    this.errorMessage.set('')

    // Never leave the user looking at an endless spinner. If SMTP is slow,
    // switch to a safe "check your inbox" state while the keepalive request
    // continues in the background. Immediate network failures still surface
    // before this timer fires.
    this.visualLoadingTimer = window.setTimeout(() => {
      if (!this.sent()) {
        this.loading.set(false)
        this.sent.set(true)
      }
    }, 900)

    this.activeRequest = this.auth
      .forgotPassword({ email: normalizedEmail })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          window.clearTimeout(this.visualLoadingTimer)
          this.loading.set(false)
        }),
      )
      .subscribe({
        next: () => {
          this.sent.set(true)
          this.requestConfirmed.set(true)
          this.deliveryWarning.set('')
          this.errorMessage.set('')
        },
        error: (error: unknown) => {
          const message =
            error instanceof ApiError && error.status > 0
              ? error.message
              : 'Không thể kết nối tới máy chủ. Vui lòng thử lại.'

          if (this.sent()) {
            // The request may have reached SMTP before the connection failed. Keep
            // the inbox guidance visible, but clearly allow the user to retry.
            this.deliveryWarning.set(message)
            return
          }

          this.sent.set(false)
          this.requestConfirmed.set(false)
          this.errorMessage.set(message)
        },
      })
  }

  protected openGmail(): void {
    if (!this.sent() || this.loading()) return
    window.location.replace('https://mail.google.com/mail/u/0/#inbox')
  }

  protected resetForm(): void {
    window.clearTimeout(this.visualLoadingTimer)
    this.activeRequest?.unsubscribe()
    this.loading.set(false)
    this.sent.set(false)
    this.completed.set(false)
    this.requestConfirmed.set(false)
    this.deliveryWarning.set('')
    this.errorMessage.set('')
  }

  protected closeCurrentTab(): void {
    window.close()
    window.setTimeout(() => {
      if (!window.closed) void this.router.navigateByUrl('/login', { replaceUrl: true })
    }, 120)
  }
}
