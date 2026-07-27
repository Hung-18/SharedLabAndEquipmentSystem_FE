import { Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { AuthStore } from '../../core/auth/auth.store'
import { landingPath } from '../../core/auth/auth.guard'
import { IconComponent } from '../../shared/ui/icon'

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <main class="min-h-screen bg-[#f6f7fb] p-3 sm:p-5">
      <div class="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1480px] overflow-hidden rounded-[32px] bg-white shadow-2xl shadow-slate-900/10 sm:min-h-[calc(100vh-40px)] lg:grid-cols-[1.08fr_.92fr]">
        <section class="relative hidden overflow-hidden bg-[#111a3a] p-10 text-white lg:flex lg:flex-col xl:p-14">
          <div class="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl"></div>
          <div class="absolute -bottom-28 -right-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl"></div>
          <div class="absolute inset-0 opacity-[0.08]" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 28px 28px"></div>

          <div class="relative flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-cyan-300 text-[#111a3a] shadow-xl shadow-violet-950/30">
              <app-icon name="flask" [size]="27" />
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Shared Lab</p>
              <p class="mt-0.5 text-base font-bold">Booking System</p>
            </div>
          </div>

          <div class="relative my-auto max-w-xl py-16">
            <span class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur">
              <app-icon name="sparkles" [size]="16" />
              Không gian nghiên cứu thông minh
            </span>
            <h1 class="mt-8 text-5xl font-bold leading-[1.08] tracking-[-0.04em] xl:text-6xl">
              Đặt phòng lab.<br />
              Quản lý thiết bị.<br />
              <span class="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">Tối ưu nghiên cứu.</span>
            </h1>
            <p class="mt-7 max-w-lg text-base leading-7 text-white/60 xl:text-lg">
              Một nền tảng thống nhất giúp sinh viên, giảng viên và quản lý vận hành tài nguyên phòng thí nghiệm hiệu quả hơn mỗi ngày.
            </p>

            <div class="mt-10 grid max-w-lg grid-cols-3 gap-3">
              @for (stat of stats; track stat.label) {
                <div class="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                  <p class="text-xl font-bold">{{ stat.value }}</p>
                  <p class="mt-1 text-xs text-white/45">{{ stat.label }}</p>
                </div>
              }
            </div>
          </div>

          <p class="relative text-xs text-white/35">© 2026 Shared Lab & Equipment Booking System</p>
        </section>

        <section class="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div class="w-full max-w-[460px]">
            <div class="mb-10 flex items-center gap-3 lg:hidden">
              <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111a3a] text-cyan-300">
                <app-icon name="flask" [size]="24" />
              </div>
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">Shared Lab</p>
                <p class="text-sm font-bold text-slate-900">Booking System</p>
              </div>
            </div>

            <p class="text-sm font-semibold text-indigo-600">Chào mừng trở lại</p>
            <h2 class="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">Đăng nhập tài khoản</h2>
            <p class="mt-3 text-sm leading-6 text-slate-500">Sử dụng email do quản trị viên cấp để truy cập hệ thống.</p>

            <form class="mt-9 space-y-5" (ngSubmit)="submit()" #form="ngForm">
              <label class="block">
                <span class="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <app-icon name="mail" [size]="19" />
                  </span>
                  <input
                    [(ngModel)]="email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    required
                    email
                    placeholder="name@university.edu.vn"
                    class="input-shell !pl-12"
                  />
                </div>
              </label>

              <label class="block">
                <div class="mb-2 flex items-center justify-between gap-3">
                  <span class="text-sm font-semibold text-slate-700">Mật khẩu</span>
                  <a routerLink="/forgot-password" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Quên mật khẩu?</a>
                </div>
                <div class="relative">
                  <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <app-icon name="lock" [size]="19" />
                  </span>
                  <input
                    [(ngModel)]="password"
                    name="password"
                    [type]="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    required
                    placeholder="Nhập mật khẩu"
                    class="input-shell !px-12"
                  />
                  <button
                    type="button"
                    class="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-indigo-600"
                    (click)="showPassword = !showPassword"
                    [attr.aria-label]="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                  >
                    <app-icon [name]="showPassword ? 'eye-off' : 'eye'" [size]="19" />
                  </button>
                </div>
              </label>

              <label class="flex items-center gap-3 text-sm text-slate-600">
                <input [(ngModel)]="remember" name="remember" type="checkbox" class="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
                Ghi nhớ đăng nhập trên thiết bị này
              </label>

              @if (store.error()) {
                <div class="flex gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                  <span class="mt-0.5"><app-icon name="alert" [size]="18" /></span>
                  <p>{{ store.error() }}</p>
                </div>
              }

              <button
                type="submit"
                [disabled]="form.invalid || store.status() === 'loading'"
                class="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
              >
                @if (store.status() === 'loading') {
                  <span class="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white"></span>
                  Đang xác thực...
                } @else {
                  Đăng nhập
                  <app-icon name="arrow-right" [size]="18" />
                }
              </button>
            </form>

            <div class="mt-8 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
              <span class="text-indigo-500"><app-icon name="shield" [size]="18" /></span>
              Tài khoản được quản lý tập trung bởi Admin. Liên hệ quản trị viên nếu bạn chưa được cấp tài khoản.
            </div>
          </div>
        </section>
      </div>
    </main>
  `,
})
export class LoginPage {
  protected readonly store = inject(AuthStore)
  private readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)

  protected email = ''
  protected password = ''
  protected remember = true
  protected showPassword = false
  protected readonly stats = [
    { value: '24/7', label: 'Truy cập lịch' },
    { value: '1 nơi', label: 'Quản lý tập trung' },
    { value: 'Realtime', label: 'Cập nhật trạng thái' },
  ]

  protected async submit(): Promise<void> {
    if (!this.email || !this.password) return
    try {
      const user = await this.store.login({ email: this.email.trim(), password: this.password }, this.remember)
      const requestedRedirect = this.route.snapshot.queryParamMap.get('redirect')
      const destination = requestedRedirect && requestedRedirect !== '/' ? requestedRedirect : landingPath(user.roleName)
      void this.router.navigateByUrl(destination)
    } catch {
      // Error is rendered from AuthStore.
    }
  }
}
