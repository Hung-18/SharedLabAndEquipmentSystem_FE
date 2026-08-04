import { DatePipe } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import type { NotificationResponse } from '../../core/api/api.models'
import { NotificationBadgeService } from '../../core/api/notification-badge.service'
import { WorkspaceService } from '../../core/api/workspace.service'
import { AuthStore } from '../../core/auth/auth.store'
import { ApiError } from '../../core/http/api-error'
import { IconComponent } from '../../shared/ui/icon'
import { ToastService } from '../../shared/ui/toast.service'

type NotificationTab = 'all' | 'unread'

@Component({
  selector: 'app-notifications-page',
  imports: [FormsModule, DatePipe, IconComponent],
  template: `
    <section class="space-y-6">
      <header class="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div class="flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            Cập nhật theo thời gian thực
          </div>
          <h1 class="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Trung tâm thông báo
          </h1>
          <p class="mt-2 text-sm text-slate-500">
            Theo dõi booking, hàng chờ, vi phạm, bảo trì và thông báo hệ thống.
          </p>
        </div>
        <button
          type="button"
          [disabled]="unreadCount() === 0 || actionLoading()"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45"
          (click)="markAllRead()"
        >
          <app-icon name="check" [size]="18" />
          Đánh dấu tất cả đã đọc
        </button>
      </header>

      <div class="grid gap-6 xl:grid-cols-[1fr_330px]">
        <article class="card-surface overflow-hidden">
          <div class="border-b border-slate-100 p-4 sm:p-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  class="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition"
                  [class.bg-white]="tab() === 'all'"
                  [class.text-slate-900]="tab() === 'all'"
                  [class.shadow-sm]="tab() === 'all'"
                  [class.text-slate-500]="tab() !== 'all'"
                  (click)="changeTab('all')"
                >
                  Tất cả
                  <span class="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold">{{
                    tab() === 'all' ? notifications().length : ''
                  }}</span>
                </button>
                <button
                  type="button"
                  class="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition"
                  [class.bg-white]="tab() === 'unread'"
                  [class.text-slate-900]="tab() === 'unread'"
                  [class.shadow-sm]="tab() === 'unread'"
                  [class.text-slate-500]="tab() !== 'unread'"
                  (click)="changeTab('unread')"
                >
                  Chưa đọc
                  @if (unreadCount() > 0) {
                    <span
                      class="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white"
                      >{{ unreadCount() }}</span
                    >
                  }
                </button>
              </div>

              <div class="flex flex-col gap-3 sm:flex-row">
                <div class="relative min-w-[220px]">
                  <span
                    class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"
                    ><app-icon name="search" [size]="17"
                  /></span>
                  <input
                    [(ngModel)]="searchText"
                    type="search"
                    placeholder="Tìm trong thông báo..."
                    class="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-400"
                  />
                </div>
                <div class="relative">
                  <span
                    class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"
                    ><app-icon name="filter" [size]="16"
                  /></span>
                  <select
                    [(ngModel)]="typeFilter"
                    class="h-10 min-w-[170px] appearance-none rounded-xl border border-slate-200 bg-white pr-9 pl-9 text-xs font-semibold text-slate-600"
                  >
                    <option value="all">Tất cả loại</option>
                    @for (type of availableTypes(); track type) {
                      <option [value]="type">{{ typeLabel(type) }}</option>
                    }
                  </select>
                  <span
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
                    ><app-icon name="chevron-down" [size]="15"
                  /></span>
                </div>
              </div>
            </div>
          </div>

          @if (loading()) {
            <div class="divide-y divide-slate-100">
              @for (item of [1, 2, 3, 4, 5]; track item) {
                <div class="flex animate-pulse gap-4 px-5 py-5 sm:px-6">
                  <div class="h-12 w-12 rounded-2xl bg-slate-100"></div>
                  <div class="flex-1">
                    <div class="h-4 w-2/5 rounded bg-slate-100"></div>
                    <div class="mt-3 h-3 w-4/5 rounded bg-slate-100"></div>
                    <div class="mt-2 h-3 w-1/3 rounded bg-slate-100"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (filteredNotifications().length === 0) {
            <div
              class="flex min-h-[460px] flex-col items-center justify-center px-6 py-16 text-center"
            >
              <div
                class="flex h-20 w-20 items-center justify-center rounded-[28px] bg-indigo-50 text-indigo-500"
              >
                <app-icon name="bell" [size]="34" />
              </div>
              <h2 class="mt-6 text-lg font-bold text-slate-800">Không tìm thấy thông báo</h2>
              <p class="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                Thử đổi tab, loại thông báo hoặc từ khóa tìm kiếm.
              </p>
              @if (searchText || typeFilter !== 'all') {
                <button
                  type="button"
                  class="mt-5 text-sm font-bold text-indigo-600 hover:underline"
                  (click)="clearFilters()"
                >
                  Xóa bộ lọc
                </button>
              }
            </div>
          } @else {
            <div class="divide-y divide-slate-100">
              @for (notification of filteredNotifications(); track notification.notificationId) {
                <button
                  type="button"
                  class="group flex w-full items-start gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6"
                  [class.bg-indigo-50/40]="!notification.isRead"
                  (click)="openNotification(notification)"
                >
                  <div
                    class="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-105"
                    [class.bg-emerald-50]="tone(notification.notificationType) === 'emerald'"
                    [class.text-emerald-600]="tone(notification.notificationType) === 'emerald'"
                    [class.bg-rose-50]="tone(notification.notificationType) === 'rose'"
                    [class.text-rose-600]="tone(notification.notificationType) === 'rose'"
                    [class.bg-amber-50]="tone(notification.notificationType) === 'amber'"
                    [class.text-amber-600]="tone(notification.notificationType) === 'amber'"
                    [class.bg-indigo-50]="tone(notification.notificationType) === 'indigo'"
                    [class.text-indigo-600]="tone(notification.notificationType) === 'indigo'"
                    [class.bg-cyan-50]="tone(notification.notificationType) === 'cyan'"
                    [class.text-cyan-600]="tone(notification.notificationType) === 'cyan'"
                  >
                    <app-icon [name]="icon(notification.notificationType)" [size]="22" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-start gap-3">
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <p class="font-semibold text-slate-900">
                            {{ displayNotificationText(notification.title) }}
                          </p>
                          <span
                            class="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold tracking-wider text-slate-500 uppercase shadow-sm"
                            >{{ typeLabel(notification.notificationType) }}</span
                          >
                        </div>
                        <p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {{ displayNotificationText(notification.message) }}
                        </p>
                        <p class="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                          <app-icon name="clock" [size]="13" />{{
                            notification.createdAt | date: 'HH:mm, dd/MM/yyyy'
                          }}
                        </p>
                      </div>
                      @if (!notification.isRead) {
                        <span
                          class="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,.12)]"
                        ></span>
                      }
                    </div>
                  </div>
                  <span
                    class="mt-4 hidden text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500 sm:block"
                    ><app-icon name="arrow-right" [size]="18"
                  /></span>
                </button>
              }
            </div>

            @if (tab() === 'all') {
              <div
                class="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6"
              >
                <p class="text-xs text-slate-400">
                  Trang {{ pageNumber() }} • tối đa {{ pageSize }} thông báo/trang
                </p>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    [disabled]="pageNumber() === 1 || loading()"
                    (click)="previousPage()"
                  >
                    <app-icon name="arrow-left" [size]="15" />Trước
                  </button>
                  <button
                    type="button"
                    class="flex h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    [disabled]="!hasNextPage() || loading()"
                    (click)="nextPage()"
                  >
                    Sau<app-icon name="arrow-right" [size]="15" />
                  </button>
                </div>
              </div>
            }
          }
        </article>

        <aside class="space-y-6">
          <article class="rounded-[24px] bg-[#111a3a] p-6 text-white shadow-xl shadow-slate-900/15">
            <div class="flex items-start justify-between gap-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300"
              >
                <app-icon name="bell" [size]="23" />
              </div>
              @if (unreadCount() > 0) {
                <span class="rounded-full bg-rose-500 px-3 py-1 text-xs font-bold"
                  >{{ unreadCount() }} chưa đọc</span
                >
              } @else {
                <span
                  class="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200"
                  >Đã đọc hết</span
                >
              }
            </div>
            <h2 class="mt-6 text-xl font-bold">Tổng quan hộp thư</h2>
            <p class="mt-2 text-sm leading-6 text-white/55">
              Thông báo chưa đọc sẽ có nền tím nhạt và chấm trạng thái ở bên phải.
            </p>
            <div class="mt-6 grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-white/[0.07] p-4">
                <p class="text-2xl font-bold">{{ notifications().length }}</p>
                <p class="mt-1 text-[10px] text-white/40">Đang hiển thị</p>
              </div>
              <div class="rounded-2xl bg-white/[0.07] p-4">
                <p class="text-2xl font-bold">{{ availableTypes().length }}</p>
                <p class="mt-1 text-[10px] text-white/40">Nhóm thông báo</p>
              </div>
            </div>
          </article>

          <article class="card-surface p-5">
            <h2 class="font-bold text-slate-950">Phân loại nhanh</h2>
            <div class="mt-4 space-y-2">
              @for (summary of typeSummaries(); track summary.type) {
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-slate-50"
                  (click)="typeFilter = summary.type"
                >
                  <span
                    class="flex h-9 w-9 items-center justify-center rounded-xl"
                    [class.bg-emerald-50]="tone(summary.type) === 'emerald'"
                    [class.text-emerald-600]="tone(summary.type) === 'emerald'"
                    [class.bg-rose-50]="tone(summary.type) === 'rose'"
                    [class.text-rose-600]="tone(summary.type) === 'rose'"
                    [class.bg-amber-50]="tone(summary.type) === 'amber'"
                    [class.text-amber-600]="tone(summary.type) === 'amber'"
                    [class.bg-indigo-50]="tone(summary.type) === 'indigo'"
                    [class.text-indigo-600]="tone(summary.type) === 'indigo'"
                    [class.bg-cyan-50]="tone(summary.type) === 'cyan'"
                    [class.text-cyan-600]="tone(summary.type) === 'cyan'"
                    ><app-icon [name]="icon(summary.type)" [size]="17"
                  /></span>
                  <span class="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600">{{
                    typeLabel(summary.type)
                  }}</span>
                  <strong class="text-xs text-slate-900">{{ summary.count }}</strong>
                </button>
              }
              @if (typeSummaries().length === 0) {
                <p class="py-6 text-center text-xs text-slate-400">Chưa có dữ liệu phân loại.</p>
              }
            </div>
          </article>
        </aside>
      </div>
    </section>

    @if (selected(); as notification) {
      <button
        type="button"
        class="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
        aria-label="Đóng chi tiết"
        (click)="selected.set(null)"
      ></button>
      <aside
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col bg-white shadow-2xl shadow-slate-950/25"
      >
        <div class="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p class="text-xs font-bold tracking-[0.15em] text-indigo-500 uppercase">
              Chi tiết thông báo
            </p>
            <p class="mt-1 text-sm text-slate-400">#{{ notification.notificationId }}</p>
          </div>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
            (click)="selected.set(null)"
          >
            <app-icon name="x" [size]="19" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-[22px]"
            [class.bg-emerald-50]="tone(notification.notificationType) === 'emerald'"
            [class.text-emerald-600]="tone(notification.notificationType) === 'emerald'"
            [class.bg-rose-50]="tone(notification.notificationType) === 'rose'"
            [class.text-rose-600]="tone(notification.notificationType) === 'rose'"
            [class.bg-amber-50]="tone(notification.notificationType) === 'amber'"
            [class.text-amber-600]="tone(notification.notificationType) === 'amber'"
            [class.bg-indigo-50]="tone(notification.notificationType) === 'indigo'"
            [class.text-indigo-600]="tone(notification.notificationType) === 'indigo'"
            [class.bg-cyan-50]="tone(notification.notificationType) === 'cyan'"
            [class.text-cyan-600]="tone(notification.notificationType) === 'cyan'"
          >
            <app-icon [name]="icon(notification.notificationType)" [size]="29" />
          </div>
          <span
            class="mt-6 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase"
            >{{ typeLabel(notification.notificationType) }}</span
          >
          <h2 class="mt-4 text-2xl leading-tight font-bold tracking-[-0.025em] text-slate-950">
            {{ displayNotificationText(notification.title) }}
          </h2>
          <p class="mt-4 text-sm leading-7 whitespace-pre-line text-slate-600">
            {{ displayNotificationText(notification.message) }}
          </p>
          <div class="mt-7 rounded-2xl bg-slate-50 p-4">
            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-slate-400">Thời gian gửi</span
              ><strong class="text-right text-slate-700">{{
                notification.createdAt | date: 'HH:mm, dd/MM/yyyy'
              }}</strong>
            </div>
            <div class="my-3 h-px bg-slate-200"></div>
            <div class="flex items-center justify-between gap-4 text-sm">
              <span class="text-slate-400">Trạng thái</span
              ><strong
                [class.text-emerald-600]="notification.isRead"
                [class.text-indigo-600]="!notification.isRead"
                >{{ notification.isRead ? 'Đã đọc' : 'Chưa đọc' }}</strong
              >
            </div>
          </div>

          @if (
            notification.notificationType.toLowerCase().includes('waitlist') ||
            notification.notificationType.toLowerCase().includes('available')
          ) {
            <div
              class="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700"
            >
              <strong>Hàng chờ đã được cập nhật.</strong><br />Hãy tạo booking trước khi thời gian
              giữ chỗ kết thúc.
            </div>
          }
          @if (notification.notificationType.toLowerCase().includes('violation')) {
            <div
              class="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-rose-700"
            >
              <strong>Thông báo liên quan vi phạm.</strong><br />Xem trạng thái và điểm phạt ở trang
              Tài khoản cá nhân.
            </div>
          }
        </div>
        <div class="border-t border-slate-100 p-5">
          <button
            type="button"
            class="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#111a3a] text-sm font-bold text-white hover:bg-[#17234c]"
            (click)="selected.set(null)"
          >
            Đóng chi tiết
          </button>
        </div>
      </aside>
    }
  `,
})
export class NotificationsPage implements OnInit {
  private readonly workspace = inject(WorkspaceService)
  private readonly badge = inject(NotificationBadgeService)
  private readonly store = inject(AuthStore)
  private readonly toast = inject(ToastService)
  protected readonly notifications = signal<NotificationResponse[]>([])
  protected readonly unreadCount = this.badge.count
  protected readonly loading = signal(true)
  protected readonly actionLoading = signal(false)
  protected readonly tab = signal<NotificationTab>('all')
  protected readonly pageNumber = signal(1)
  protected readonly hasNextPage = signal(false)
  protected readonly selected = signal<NotificationResponse | null>(null)
  protected readonly pageSize = 20
  protected searchText = ''
  protected typeFilter = 'all'

  protected readonly availableTypes = computed(() =>
    [...new Set(this.notifications().map((item) => item.notificationType))].sort(),
  )
  protected filteredNotifications(): NotificationResponse[] {
    const query = this.searchText.trim().toLowerCase()
    return this.notifications().filter((item) => {
      const matchesType = this.typeFilter === 'all' || item.notificationType === this.typeFilter
      const matchesQuery = !query || `${item.title} ${item.message}`.toLowerCase().includes(query)
      return matchesType && matchesQuery
    })
  }
  protected readonly typeSummaries = computed(() => {
    const counts = new Map<string, number>()
    for (const item of this.notifications())
      counts.set(item.notificationType, (counts.get(item.notificationType) ?? 0) + 1)
    return [...counts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  })

  ngOnInit(): void {
    this.load()
    this.loadUnreadCount()
  }

  protected changeTab(tab: NotificationTab): void {
    if (this.tab() === tab) return
    this.tab.set(tab)
    this.pageNumber.set(1)
    this.typeFilter = 'all'
    this.searchText = ''
    this.load()
  }

  protected load(): void {
    const user = this.store.user()
    if (!user) return
    this.loading.set(true)
    const request =
      this.tab() === 'unread'
        ? this.workspace.unreadNotifications(user.userId)
        : this.workspace.notifications(user.userId, this.pageNumber(), this.pageSize + 1)
    request.subscribe({
      next: (items) => {
        this.hasNextPage.set(this.tab() === 'all' && items.length > this.pageSize)
        this.notifications.set(
          [...items]
            .slice(0, this.pageSize)
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
        )
        this.loading.set(false)
      },
      error: (error: unknown) => {
        this.loading.set(false)
        const message = error instanceof ApiError ? error.message : 'Không thể tải thông báo.'
        this.toast.error('Tải thông báo thất bại', message)
      },
    })
  }

  protected openNotification(notification: NotificationResponse): void {
    this.selected.set(notification)
    if (!notification.isRead) this.markRead(notification)
  }

  protected markAllRead(): void {
    const user = this.store.user()
    if (!user || this.unreadCount() === 0) return
    this.actionLoading.set(true)
    this.workspace.markAllNotificationsRead(user.userId).subscribe({
      next: () => {
        this.notifications.update((items) => items.map((item) => ({ ...item, isRead: true })))
        this.badge.clear()
        this.actionLoading.set(false)
        this.toast.success('Đã đánh dấu tất cả là đã đọc')
        if (this.tab() === 'unread') this.notifications.set([])
      },
      error: (error: unknown) => {
        this.actionLoading.set(false)
        this.toast.error(
          'Không thể cập nhật',
          error instanceof ApiError ? error.message : undefined,
        )
      },
    })
  }

  protected previousPage(): void {
    if (this.pageNumber() <= 1) return
    this.pageNumber.update((page) => page - 1)
    this.load()
  }

  protected nextPage(): void {
    if (!this.hasNextPage()) return
    this.pageNumber.update((page) => page + 1)
    this.load()
  }

  protected clearFilters(): void {
    this.searchText = ''
    this.typeFilter = 'all'
  }

  protected displayNotificationText(value: string): string {
    if (!this.store.isRequester()) return value
    return value.replace(/\bbooking\s*#(?:BK-)?\d+\b/gi, (match) =>
      match.startsWith('B') ? 'Booking' : 'booking',
    )
  }

  protected typeLabel(type: string): string {
    const normalized = type.toLowerCase()
    if (normalized.includes('approve')) return 'Booking được duyệt'
    if (normalized.includes('reject')) return 'Booking bị từ chối'
    if (normalized.includes('reminder')) return 'Nhắc lịch booking'
    if (normalized.includes('waitlist') || normalized.includes('available'))
      return 'Hàng chờ có chỗ'
    if (normalized.includes('maintenance')) return 'Bảo trì'
    if (normalized.includes('violation')) return 'Vi phạm'
    if (normalized.includes('booking')) return 'Booking'
    return type || 'Hệ thống'
  }

  protected tone(type: string): 'emerald' | 'rose' | 'amber' | 'indigo' | 'cyan' {
    const normalized = type.toLowerCase()
    if (
      normalized.includes('approve') ||
      normalized.includes('available') ||
      normalized.includes('waitlist')
    )
      return 'emerald'
    if (normalized.includes('reject') || normalized.includes('violation')) return 'rose'
    if (normalized.includes('reminder')) return 'amber'
    if (normalized.includes('maintenance')) return 'cyan'
    return 'indigo'
  }

  protected icon(type: string): string {
    const tone = this.tone(type)
    if (tone === 'emerald') return 'check'
    if (tone === 'rose') return 'alert'
    if (tone === 'amber') return 'clock'
    if (tone === 'cyan') return 'wrench'
    return 'bell'
  }

  private markRead(notification: NotificationResponse): void {
    this.workspace.markNotificationRead(notification.notificationId).subscribe({
      next: () => {
        this.notifications.update((items) =>
          items.map((item) =>
            item.notificationId === notification.notificationId ? { ...item, isRead: true } : item,
          ),
        )
        this.selected.update((item) => (item ? { ...item, isRead: true } : item))
        this.badge.decrement()
        if (this.tab() === 'unread')
          this.notifications.update((items) =>
            items.filter((item) => item.notificationId !== notification.notificationId),
          )
      },
      error: () => this.toast.error('Không thể đánh dấu đã đọc'),
    })
  }

  private loadUnreadCount(): void {
    const user = this.store.user()
    if (!user) return
    this.workspace.unreadCount(user.userId).subscribe({
      next: (response) => this.badge.set(response.unreadCount),
      error: () => this.badge.clear(),
    })
  }
}
