import { Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import { AuthStore } from '../../core/auth/auth.store'
import { landingPath } from '../../core/auth/auth.guard'
import { IconComponent } from '../../shared/ui/icon'

@Component({
  selector: 'app-not-found-page',
  imports: [IconComponent],
  template: `
    <main
      class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#111a3a] p-5 text-center text-white"
    >
      <div class="absolute top-10 -left-24 h-96 w-96 rounded-full bg-violet-500/25 blur-3xl"></div>
      <div class="absolute right-0 -bottom-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl"></div>
      <div
        class="absolute inset-0 opacity-[0.06]"
        style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 30px 30px"
      ></div>
      <section class="relative max-w-3xl">
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-cyan-300 backdrop-blur"
        >
          <app-icon name="flask" [size]="30" />
        </div>
        <p
          class="mt-8 bg-linear-to-r from-violet-300 to-cyan-300 bg-clip-text text-8xl font-black tracking-[-0.07em] text-transparent sm:text-9xl"
        >
          404
        </p>
        <h1 class="mt-5 text-3xl font-bold tracking-[-0.035em] sm:text-5xl">
          Trang này đã rời khỏi phòng lab
        </h1>
        <p class="mx-auto mt-5 max-w-xl text-base leading-7 text-white/55">
          Đường dẫn bạn đang mở không tồn tại, đã được di chuyển hoặc không còn khả dụng trong hệ
          thống.
        </p>
        <div class="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-bold text-[#111a3a] shadow-xl shadow-black/20 hover:-translate-y-0.5"
            (click)="goHome()"
          >
            <app-icon name="home" [size]="18" />
            Trở về trang chủ
          </button>
          <button
            type="button"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur hover:bg-white/15"
            (click)="goBack()"
          >
            <app-icon name="arrow-left" [size]="18" />
            Trang trước
          </button>
        </div>
      </section>
    </main>
  `,
})
export class NotFoundPage {
  private readonly router = inject(Router)
  private readonly store = inject(AuthStore)

  protected goHome(): void {
    void this.router.navigateByUrl(
      this.store.isAuthenticated() ? landingPath(this.store.role()) : '/login',
    )
  }

  protected goBack(): void {
    history.length > 1 ? history.back() : this.goHome()
  }
}
