import { DatePipe } from '@angular/common'
import { Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthStore } from '../../core/auth/auth.store'
import { IconComponent } from '../../shared/ui/icon'

@Component({
  selector: 'app-profile-page',
  imports: [DatePipe, RouterLink, IconComponent],
  template: `
    <section class="space-y-6">
      <header>
        <div class="flex items-center gap-2 text-sm font-semibold text-indigo-600">
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
          Hồ sơ cá nhân
        </div>
        <h1 class="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">
          Tài khoản của bạn
        </h1>
        <p class="mt-2 text-sm text-slate-500">
          Thông tin được đồng bộ từ hệ thống và hiện chỉ hỗ trợ chế độ xem.
        </p>
      </header>

      @if (store.user(); as user) {
        <div class="grid gap-6 xl:grid-cols-[360px_1fr]">
          <aside class="space-y-6">
            <article class="card-surface relative overflow-hidden p-6 text-center">
              <div
                class="absolute inset-x-0 top-0 h-28 bg-linear-to-r from-[#111a3a] via-indigo-900 to-violet-800"
              ></div>
              <div class="relative pt-8">
                <div
                  class="mx-auto flex h-28 w-28 items-center justify-center rounded-[34px] border-[6px] border-white bg-linear-to-br from-violet-400 to-indigo-600 text-3xl font-bold text-white shadow-xl shadow-indigo-950/20"
                >
                  {{ initials(user.fullName) }}
                </div>
                <h2 class="mt-5 text-xl font-bold text-slate-950">{{ user.fullName }}</h2>
                <p class="mt-1 text-sm text-slate-400">&#64;{{ user.username }}</p>
                <span
                  class="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
                  [class.bg-indigo-50]="user.roleName === 'Admin'"
                  [class.text-indigo-700]="user.roleName === 'Admin'"
                  [class.bg-cyan-50]="user.roleName === 'LabManager'"
                  [class.text-cyan-700]="user.roleName === 'LabManager'"
                  [class.bg-violet-50]="user.roleName === 'Requester'"
                  [class.text-violet-700]="user.roleName === 'Requester'"
                >
                  <app-icon name="shield" [size]="15" />
                  {{ roleLabel(user.roleName) }}
                </span>
              </div>

              <div class="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-6">
                <div class="rounded-2xl bg-slate-50 p-4">
                  <p class="text-2xl font-bold text-slate-950">{{ user.penaltyPoints }}</p>
                  <p class="mt-1 text-[11px] font-medium text-slate-400">Điểm phạt</p>
                </div>
                <div class="rounded-2xl bg-slate-50 p-4">
                  <p
                    class="text-sm font-bold"
                    [class.text-emerald-600]="statusText() === 'Active'"
                    [class.text-amber-600]="statusText() === 'Restricted'"
                    [class.text-rose-600]="statusText() === 'Locked' || statusText() === 'Inactive'"
                  >
                    {{ statusLabel(statusText()) }}
                  </p>
                  <p class="mt-1 text-[11px] font-medium text-slate-400">Trạng thái</p>
                </div>
              </div>
            </article>

            <article
              class="rounded-[24px] bg-[#111a3a] p-6 text-white shadow-xl shadow-slate-900/15"
            >
              <div
                class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-300"
              >
                <app-icon name="shield" [size]="21" />
              </div>
              <h3 class="mt-5 text-lg font-bold">Bảo mật tài khoản</h3>
              <p class="mt-2 text-sm leading-6 text-white/55">
                Đặt lại mật khẩu qua email để bảo vệ tài khoản và duy trì quyền truy cập an toàn.
              </p>
              <a
                routerLink="/forgot-password"
                class="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-[#111a3a] hover:bg-cyan-50"
              >
                Đặt lại mật khẩu
                <app-icon name="arrow-right" [size]="16" />
              </a>
            </article>
          </aside>

          <div class="space-y-6">
            <article class="card-surface overflow-hidden">
              <div
                class="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"
              >
                <div>
                  <h2 class="text-lg font-bold text-slate-950">Thông tin tài khoản</h2>
                  <p class="mt-1 text-xs text-slate-400">Dữ liệu được đồng bộ từ hồ sơ hệ thống</p>
                </div>
                <span
                  class="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase"
                  >Chỉ xem</span
                >
              </div>
              <div class="grid gap-px bg-slate-100 sm:grid-cols-2">
                @for (item of profileItems(user); track item.label) {
                  <div class="bg-white p-5 sm:p-6">
                    <div class="flex items-start gap-4">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"
                      >
                        <app-icon [name]="item.icon" [size]="19" />
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-semibold tracking-[0.12em] text-slate-400 uppercase">
                          {{ item.label }}
                        </p>
                        <p class="mt-2 text-sm font-semibold break-words text-slate-800">
                          {{ item.value }}
                        </p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </article>

            <div class="grid gap-6 lg:grid-cols-2">
              <article class="card-surface p-5 sm:p-6">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
                  >
                    <app-icon name="activity" [size]="21" />
                  </div>
                  <div>
                    <h2 class="font-bold text-slate-950">Trạng thái hoạt động</h2>
                    <p class="text-xs text-slate-400">Quyền sử dụng hệ thống hiện tại</p>
                  </div>
                </div>
                <div
                  class="mt-6 rounded-2xl border p-5"
                  [class.border-emerald-100]="statusText() === 'Active'"
                  [class.bg-emerald-50]="statusText() === 'Active'"
                  [class.border-amber-100]="statusText() === 'Restricted'"
                  [class.bg-amber-50]="statusText() === 'Restricted'"
                  [class.border-rose-100]="statusText() === 'Locked' || statusText() === 'Inactive'"
                  [class.bg-rose-50]="statusText() === 'Locked' || statusText() === 'Inactive'"
                >
                  <div class="flex items-center justify-between gap-4">
                    <div>
                      <p
                        class="text-sm font-bold"
                        [class.text-emerald-800]="statusText() === 'Active'"
                        [class.text-amber-800]="statusText() === 'Restricted'"
                        [class.text-rose-800]="
                          statusText() === 'Locked' || statusText() === 'Inactive'
                        "
                      >
                        {{ statusLabel(statusText()) }}
                      </p>
                      <p
                        class="mt-1 text-xs leading-5"
                        [class.text-emerald-700]="statusText() === 'Active'"
                        [class.text-amber-700]="statusText() === 'Restricted'"
                        [class.text-rose-700]="
                          statusText() === 'Locked' || statusText() === 'Inactive'
                        "
                      >
                        {{ statusDescription(statusText()) }}
                      </p>
                    </div>
                    <app-icon [name]="statusText() === 'Active' ? 'check' : 'alert'" [size]="26" />
                  </div>
                </div>
              </article>

              <article class="card-surface p-5 sm:p-6">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
                  >
                    <app-icon name="clock" [size]="21" />
                  </div>
                  <div>
                    <h2 class="font-bold text-slate-950">Thời hạn hạn chế</h2>
                    <p class="text-xs text-slate-400">Áp dụng khi tài khoản Restricted</p>
                  </div>
                </div>
                <div class="mt-6 rounded-2xl bg-slate-50 p-5">
                  @if (user.restrictionUntil) {
                    <p class="text-2xl font-bold tracking-[-0.03em] text-slate-950">
                      {{ user.restrictionUntil | date: 'HH:mm' }}
                    </p>
                    <p class="mt-1 text-sm font-semibold text-slate-600">
                      {{ user.restrictionUntil | date: 'dd/MM/yyyy' }}
                    </p>
                    <p class="mt-3 text-xs leading-5 text-slate-400">
                      Sau thời điểm này, quyền đặt lịch sẽ được khôi phục nếu tài khoản đủ điều kiện.
                    </p>
                  } @else {
                    <p class="text-lg font-bold text-slate-800">Không có thời hạn hạn chế</p>
                    <p class="mt-2 text-xs leading-5 text-slate-400">
                      Tài khoản hiện không bị giới hạn thời gian đặt lịch.
                    </p>
                  }
                </div>
              </article>
            </div>

          </div>
        </div>
      }
    </section>
  `,
})
export class ProfilePage {
  protected readonly store = inject(AuthStore)

  protected readonly statusText = computed(() => {
    const status = this.store.user()?.status
    if (typeof status === 'string') return status
    return (
      ({ 1: 'Active', 2: 'Restricted', 3: 'Inactive', 4: 'Locked' } as Record<number, string>)[
        status ?? 1
      ] ?? 'Active'
    )
  })

  protected initials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  }

  protected roleLabel(role: string): string {
    if (role === 'Admin') return 'Quản trị viên'
    if (role === 'LabManager') return 'Quản lý phòng lab'
    return 'Người đặt lịch'
  }

  protected statusLabel(status: string): string {
    return (
      (
        {
          Active: 'Đang hoạt động',
          Restricted: 'Đang hạn chế',
          Inactive: 'Ngừng hoạt động',
          Locked: 'Đã khóa',
        } as Record<string, string>
      )[status] ?? status
    )
  }

  protected statusDescription(status: string): string {
    return (
      (
        {
          Active: 'Bạn có thể sử dụng đầy đủ các chức năng theo vai trò được cấp.',
          Restricted: 'Một số thao tác như tạo booking mới có thể bị hạn chế.',
          Inactive: 'Tài khoản không còn hoạt động trên hệ thống.',
          Locked: 'Tài khoản đã bị khóa và cần quản trị viên mở lại.',
        } as Record<string, string>
      )[status] ?? 'Không xác định trạng thái tài khoản.'
    )
  }

  protected profileItems(user: {
    userId: number
    fullName: string
    username: string
    email: string
    roleName: string
    departmentName: string
  }): { label: string; value: string; icon: string }[] {
    return [
      { label: 'Mã người dùng', value: `#${user.userId}`, icon: 'user' },
      { label: 'Họ và tên', value: user.fullName, icon: 'user' },
      { label: 'Tên đăng nhập', value: user.username, icon: 'shield' },
      { label: 'Email', value: user.email, icon: 'mail' },
      { label: 'Vai trò', value: this.roleLabel(user.roleName), icon: 'shield' },
      {
        label: 'Khoa / phòng ban',
        value: user.departmentName || 'Chưa cập nhật',
        icon: 'building',
      },
    ]
  }
}
