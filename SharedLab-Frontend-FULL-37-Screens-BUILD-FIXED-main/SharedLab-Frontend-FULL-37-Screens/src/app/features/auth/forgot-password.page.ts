import { Component, inject, ChangeDetectorRef } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { firstValueFrom } from 'rxjs'
import { AuthService } from '../../core/auth/auth.service'
import { ApiError } from '../../core/http/api-error'
import { IconComponent } from '../../shared/ui/icon'
@Component({
  selector: 'app-forgot-password-page',
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fb] p-4 sm:p-6">
      <div class="absolute left-[8%] top-[12%] h-72 w-72 rounded-full bg-violet-200/55 blur-3xl"></div>
      <div class="absolute bottom-[10%] right-[8%] h-80 w-80 rounded-full bg-cyan-200/55 blur-3xl"></div>

      <section class="relative w-full max-w-[520px] rounded-[32px] border border-white bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-10">
        <a routerLink="/login" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600">
          <app-icon name="arrow-left" [size]="18" />
          Quay lại đăng nhập
        </a>

        <div class="mt-9 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 shadow-inner">
          <app-icon name="mail" [size]="28" />
        </div>
        <h1 class="mt-6 text-3xl font-bold tracking-[-0.035em] text-slate-950">Quên mật khẩu?</h1>
        <p class="mt-3 text-sm leading-6 text-slate-500">Nhập email của bạn. Hệ thống sẽ gửi một liên kết đặt lại mật khẩu có hiệu lực trong 1 giờ.</p>

        @if (sent) {
          <div class="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <app-icon name="check" [size]="24" />
            </div>
            <h2 class="mt-4 text-lg font-bold text-emerald-900">Kiểm tra hộp thư của bạn</h2>
            <p class="mt-2 text-sm leading-6 text-emerald-700">Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi tới <strong>{{ email }}</strong>.</p>
            <button type="button" class="mt-5 text-sm font-bold text-emerald-800 hover:underline" (click)="sent = false">Gửi lại với email khác</button>
          </div>
        } @else {
          <form class="mt-8" (ngSubmit)="submit()" #form="ngForm">
            <label class="block">
              <span class="mb-2 block text-sm font-semibold text-slate-700">Email tài khoản</span>
              <div class="relative">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400"><app-icon name="mail" [size]="19" /></span>
                <input [(ngModel)]="email" name="email" type="email" email required autocomplete="email" placeholder="name@university.edu.vn" class="input-shell !pl-12" />
              </div>
            </label>

            @if (errorMessage) {
              <p class="mt-3 text-sm text-rose-600">{{ errorMessage }}</p>
            }

            <button
              type="submit"
              [disabled]="form.invalid || loading"
              class="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#111a3a] px-5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-[#17234c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              @if (loading) {
                <span class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                Đang gửi...
              } @else {
                Gửi liên kết đặt lại
                <app-icon name="arrow-right" [size]="18" />
              }
            </button>
          </form>
        }

        <p class="mt-8 text-center text-xs leading-5 text-slate-400">Vì lý do bảo mật, hệ thống không tiết lộ email có tồn tại hay không.</p>
      </section>
    </main>
  `,
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService)
  private readonly cdr = inject(ChangeDetectorRef)
  protected email = ''
  protected loading = false
  protected sent = false
  protected errorMessage = ''

  protected async submit(): Promise<void> {
  this.loading = true
  this.errorMessage = ''
  console.log('Bắt đầu gọi API...'); // Thêm dòng này

  try {
    const result = await firstValueFrom(this.auth.forgotPassword({ email: this.email.trim() }))
    console.log('API đã trả về kết quả:', result); // Thêm dòng này
    this.sent = true
    this.cdr.detectChanges()
  } catch (error) {
    console.error('Lỗi rồi:', error); // Thêm dòng này
    this.errorMessage = error instanceof ApiError ? error.message : 'Không thể gửi yêu cầu.'
  } finally {
    this.loading = false
    this.cdr.detectChanges()
    console.log('Kết thúc tiến trình.'); // Thêm dòng này
  }
}
}
