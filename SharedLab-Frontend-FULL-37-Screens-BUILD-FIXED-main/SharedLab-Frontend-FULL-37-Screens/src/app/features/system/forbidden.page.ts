import { Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import { AuthStore } from '../../core/auth/auth.store'
import { landingPath } from '../../core/auth/auth.guard'
import { IconComponent } from '../../shared/ui/icon'

@Component({
  selector: 'app-forbidden-page',
  imports: [IconComponent],
  template: `
    <main
      class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fb] p-5 text-center"
    >
      <div
        class="absolute top-[15%] left-[10%] h-72 w-72 rounded-full bg-violet-200/60 blur-3xl"
      ></div>
      <div
        class="absolute right-[10%] bottom-[12%] h-80 w-80 rounded-full bg-cyan-200/60 blur-3xl"
      ></div>
      <section
        class="relative w-full max-w-2xl rounded-[36px] border border-white bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-14"
      >
        <div
          class="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-linear-to-br from-amber-100 to-orange-100 text-amber-600 shadow-inner"
        >
          <app-icon name="shield" [size]="44" />
        </div>
        <p class="mt-8 text-sm font-bold tracking-[0.22em] text-amber-600 uppercase">Lỗi 403</p>
        <h1 class="mt-3 text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl">
          M không có quyền truy cập
        </h1>
        <p class="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-500">
          Trang này chỉ dành cho một số vai trò nhất định. Hệ thống đã bảo vệ nội dung và không hiển
          thị bất kỳ thông tin kỹ thuật nào.
        </p>
        <div class="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#111a3a] px-6 text-sm font-bold text-white shadow-lg shadow-slate-900/15 hover:bg-[#17234c]"
            (click)="goHome()"
          >
            <app-icon name="home" [size]="18" />
            Về trang chủ
          </button>
          <button
            type="button"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 hover:bg-slate-50"
            (click)="goBack()"
          >
            <app-icon name="arrow-left" [size]="18" />
            Quay lại trang trước
          </button>
        </div>
      </section>
    </main>
  `,
})
export class ForbiddenPage {
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
