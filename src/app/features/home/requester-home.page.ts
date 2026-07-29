import { DatePipe } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { catchError, forkJoin, of } from 'rxjs'
import type {
  BookingResponse,
  NotificationResponse,
  UserViolationSummaryResponse,
  WaitlistResponse,
} from '../../core/api/api.models'
import { WorkspaceService } from '../../core/api/workspace.service'
import { AuthStore } from '../../core/auth/auth.store'
import { IconComponent } from '../../shared/ui/icon'
import { ToastService } from '../../shared/ui/toast.service'

@Component({
  selector: 'app-requester-home-page',
  imports: [DatePipe, RouterLink, IconComponent],
  template: `
    <section class="space-y-6">
      <header class="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div class="flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            {{ today | date: 'EEEE, dd/MM/yyyy' }}
          </div>
          <h1 class="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Chào {{ firstName() }}, sẵn sàng nghiên cứu chưa?
          </h1>
          <p class="mt-2 text-sm text-slate-500">
            Theo dõi lịch đặt, hàng chờ và trạng thái tài khoản của bạn tại một nơi.
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <a
            routerLink="/app/calendar"
            class="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <app-icon name="calendar" [size]="18" />
            Xem lịch tài nguyên
          </a>
          <a
            routerLink="/app/bookings/new"
            class="inline-flex h-11 items-center gap-2 rounded-2xl bg-linear-to-r from-indigo-600 to-violet-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <span class="text-lg leading-none">+</span>
            Tạo booking nhanh
          </a>
        </div>
      </header>

      @if (loading()) {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="card-surface h-36 animate-pulse bg-slate-100"></div>
          }
        </div>
      } @else {
        @if (accountWarning()) {
          <div
            class="flex flex-col gap-4 rounded-3xl border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 p-5 sm:flex-row sm:items-center"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"
            >
              <app-icon name="alert" [size]="23" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-bold text-amber-950">Tài khoản cần chú ý</p>
              <p class="mt-1 text-sm leading-6 text-amber-700">{{ accountWarning() }}</p>
            </div>
            <a
              routerLink="/app/profile"
              class="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-amber-900 px-4 text-xs font-bold text-white hover:bg-amber-800"
              >Xem chi tiết</a
            >
          </div>
        }

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (card of kpiCards(); track card.label) {
            <article
              class="card-surface group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
            >
              <div
                class="absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-55 blur-2xl"
                [class.bg-indigo-200]="card.tone === 'indigo'"
                [class.bg-cyan-200]="card.tone === 'cyan'"
                [class.bg-amber-200]="card.tone === 'amber'"
                [class.bg-rose-200]="card.tone === 'rose'"
                [class.bg-emerald-200]="card.tone === 'emerald'"
              ></div>
              <div class="relative flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-medium text-slate-500">{{ card.label }}</p>
                  <p class="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                    {{ card.value }}
                  </p>
                  <p class="mt-2 text-xs text-slate-400">{{ card.note }}</p>
                </div>
                <div
                  class="flex h-11 w-11 items-center justify-center rounded-2xl"
                  [class.bg-indigo-50]="card.tone === 'indigo'"
                  [class.text-indigo-600]="card.tone === 'indigo'"
                  [class.bg-cyan-50]="card.tone === 'cyan'"
                  [class.text-cyan-600]="card.tone === 'cyan'"
                  [class.bg-amber-50]="card.tone === 'amber'"
                  [class.text-amber-600]="card.tone === 'amber'"
                  [class.bg-rose-50]="card.tone === 'rose'"
                  [class.text-rose-600]="card.tone === 'rose'"
                  [class.bg-emerald-50]="card.tone === 'emerald'"
                  [class.text-emerald-600]="card.tone === 'emerald'"
                >
                  <app-icon [name]="card.icon" [size]="21" />
                </div>
              </div>
            </article>
          }
        </div>

        <div class="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <article class="card-surface overflow-hidden">
            <div
              class="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"
            >
              <div>
                <h2 class="text-lg font-bold text-slate-950">Booking sắp tới</h2>
                <p class="mt-1 text-xs text-slate-400">
                  Các lịch đã được duyệt và chuẩn bị diễn ra
                </p>
              </div>
              <a
                routerLink="/app/bookings/my"
                class="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Xem tất cả
              </a>
            </div>

            @if (upcomingBookings().length === 0) {
              <div class="flex flex-col items-center px-6 py-14 text-center">
                <div
                  class="flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500"
                >
                  <app-icon name="calendar" [size]="25" />
                </div>
                <p class="mt-4 font-semibold text-slate-800">Chưa có booking sắp tới</p>
                <p class="mt-1 text-sm text-slate-400">
                  Khi booking được duyệt, lịch sẽ xuất hiện ở đây.
                </p>
              </div>
            } @else {
              <div class="divide-y divide-slate-100">
                @for (booking of upcomingBookings().slice(0, 4); track booking.bookingId) {
                  <a
                    [routerLink]="['/app/bookings', booking.bookingId]"
                    class="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
                  >
                    <div
                      class="flex w-14 shrink-0 flex-col items-center rounded-2xl bg-[#111a3a] py-2 text-white"
                    >
                      <span class="text-[10px] font-semibold text-cyan-300 uppercase">{{
                        booking.startTime | date: 'MMM'
                      }}</span>
                      <span class="text-xl leading-6 font-bold">{{
                        booking.startTime | date: 'dd'
                      }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="truncate font-semibold text-slate-900">
                          {{ purposeLabel(booking.purposeType) }}
                        </p>
                        <span
                          class="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700"
                          >Đã duyệt</span
                        >
                      </div>
                      <p class="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                        <app-icon name="clock" [size]="14" />
                        {{ booking.startTime | date: 'HH:mm' }} –
                        {{ booking.endTime | date: 'HH:mm, dd/MM/yyyy' }}
                      </p>
                    </div>
                    <span class="text-slate-300"><app-icon name="arrow-right" [size]="18" /></span>
                  </a>
                }
              </div>
            }
          </article>

          <article class="card-surface p-5 sm:p-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-bold text-slate-950">Sức khỏe tài khoản</h2>
                <p class="mt-1 text-xs text-slate-400">Cập nhật theo điểm phạt hiện tại</p>
              </div>
              <div
                class="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
              >
                <app-icon name="shield" [size]="22" />
              </div>
            </div>

            <div class="mt-7 flex items-center gap-5">
              <div
                class="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
                [style.background]="healthRing()"
              >
                <div
                  class="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white shadow-inner"
                >
                  <span class="text-2xl font-bold text-slate-950">{{ healthScore() }}</span>
                  <span class="text-[10px] font-semibold text-slate-400 uppercase">/ 100</span>
                </div>
              </div>
              <div class="min-w-0">
                <span
                  class="inline-flex rounded-full px-3 py-1.5 text-xs font-bold"
                  [class.bg-emerald-50]="statusText() === 'Active'"
                  [class.text-emerald-700]="statusText() === 'Active'"
                  [class.bg-amber-50]="statusText() === 'Restricted'"
                  [class.text-amber-700]="statusText() === 'Restricted'"
                  [class.bg-rose-50]="statusText() === 'Locked' || statusText() === 'Inactive'"
                  [class.text-rose-700]="statusText() === 'Locked' || statusText() === 'Inactive'"
                  >{{ statusLabel(statusText()) }}</span
                >
                <p class="mt-3 text-sm leading-6 text-slate-500">
                  {{ violationSummary().activeViolationCount }} vi phạm đang hoạt động,
                  {{ violationSummary().activePenaltyPoints }} điểm phạt hiệu lực.
                </p>
              </div>
            </div>

            <div class="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Tổng điểm phạt</span
                ><strong class="text-slate-900">{{ violationSummary().penaltyPoints }}</strong>
              </div>
              <div class="h-px bg-slate-200"></div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Hạn chế đến</span
                ><strong class="text-slate-900">{{
                  violationSummary().restrictionUntil
                    ? (violationSummary().restrictionUntil | date: 'dd/MM/yyyy HH:mm')
                    : 'Không có'
                }}</strong>
              </div>
            </div>
          </article>
        </div>

        <div class="grid gap-6 xl:grid-cols-3">
          <article class="card-surface overflow-hidden xl:col-span-2">
            <div
              class="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"
            >
              <div>
                <h2 class="text-lg font-bold text-slate-950">Thông báo mới nhất</h2>
                <p class="mt-1 text-xs text-slate-400">Những cập nhật bạn cần xử lý</p>
              </div>
              <a
                routerLink="/app/notifications"
                class="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >Trung tâm thông báo</a
              >
            </div>
            @if (recentNotifications().length === 0) {
              <div class="px-6 py-12 text-center text-sm text-slate-400">
                M chưa có thông báo nào.
              </div>
            } @else {
              <div class="divide-y divide-slate-100">
                @for (notification of recentNotifications(); track notification.notificationId) {
                  <a
                    routerLink="/app/notifications"
                    class="flex items-start gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                  >
                    <div
                      class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                      [class.bg-indigo-50]="
                        notificationTone(notification.notificationType) === 'indigo'
                      "
                      [class.text-indigo-600]="
                        notificationTone(notification.notificationType) === 'indigo'
                      "
                      [class.bg-emerald-50]="
                        notificationTone(notification.notificationType) === 'emerald'
                      "
                      [class.text-emerald-600]="
                        notificationTone(notification.notificationType) === 'emerald'
                      "
                      [class.bg-amber-50]="
                        notificationTone(notification.notificationType) === 'amber'
                      "
                      [class.text-amber-600]="
                        notificationTone(notification.notificationType) === 'amber'
                      "
                      [class.bg-rose-50]="
                        notificationTone(notification.notificationType) === 'rose'
                      "
                      [class.text-rose-600]="
                        notificationTone(notification.notificationType) === 'rose'
                      "
                    >
                      <app-icon
                        [name]="notificationIcon(notification.notificationType)"
                        [size]="19"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-start gap-3">
                        <p class="min-w-0 flex-1 font-semibold text-slate-900">
                          {{ notification.title }}
                        </p>
                        @if (!notification.isRead) {
                          <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500"></span>
                        }
                      </div>
                      <p class="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                        {{ notification.message }}
                      </p>
                      <p class="mt-2 text-[11px] text-slate-400">
                        {{ notification.createdAt | date: 'HH:mm, dd/MM/yyyy' }}
                      </p>
                    </div>
                  </a>
                }
              </div>
            }
          </article>

          <article class="card-surface overflow-hidden">
            <div class="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 class="text-lg font-bold text-slate-950">Hàng chờ của bạn</h2>
              <p class="mt-1 text-xs text-slate-400">Theo dõi vị trí và thời gian được giữ chỗ</p>
            </div>
            @if (activeWaitlists().length === 0) {
              <div class="flex flex-col items-center px-6 py-12 text-center">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"
                >
                  <app-icon name="clock" [size]="22" />
                </div>
                <p class="mt-4 text-sm font-semibold text-slate-700">Không có hàng chờ hoạt động</p>
              </div>
            } @else {
              <div class="space-y-3 p-4">
                @for (waitlist of activeWaitlists().slice(0, 3); track waitlist.waitlistId) {
                  <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div class="flex items-center justify-between gap-3">
                      <span
                        class="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm"
                        >#{{ waitlist.queuePosition }} trong hàng chờ</span
                      >
                      <span
                        class="text-[10px] font-bold"
                        [class.text-amber-600]="waitlist.status === 'Waiting'"
                        [class.text-emerald-600]="waitlist.status === 'Notified'"
                        >{{ waitlistStatusLabel(waitlist.status) }}</span
                      >
                    </div>
                    <p class="mt-3 text-sm font-semibold text-slate-800">
                      {{
                        waitlist.labId
                          ? 'Phòng lab #' + waitlist.labId
                          : 'Thiết bị #' + waitlist.equipmentId
                      }}
                    </p>
                    <p class="mt-1 text-xs text-slate-400">
                      {{ waitlist.requestedStart | date: 'HH:mm dd/MM' }} –
                      {{ waitlist.requestedEnd | date: 'HH:mm dd/MM' }}
                    </p>
                    @if (waitlist.notifiedAt) {
                      <p
                        class="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
                      >
                        Đã thông báo lúc {{ waitlist.notifiedAt | date: 'HH:mm dd/MM' }}
                      </p>
                    }
                  </div>
                }
              </div>
            }
          </article>
        </div>
      }
    </section>
  `,
})
export class RequesterHomePage implements OnInit {
  private readonly workspace = inject(WorkspaceService)
  protected readonly store = inject(AuthStore)
  private readonly toast = inject(ToastService)
  protected readonly today = new Date()
  protected readonly loading = signal(true)
  protected readonly bookings = signal<BookingResponse[]>([])
  protected readonly waitlists = signal<WaitlistResponse[]>([])
  protected readonly notifications = signal<NotificationResponse[]>([])
  protected readonly unreadCount = signal(0)
  protected readonly violationSummary = signal<UserViolationSummaryResponse>({
    userId: 0,
    fullName: '',
    penaltyPoints: 0,
    userStatus: 'Active',
    restrictionUntil: null,
    activeViolationCount: 0,
    activePenaltyPoints: 0,
    activeViolations: [],
  })

  protected readonly firstName = computed(() => {
    const parts = this.store.user()?.fullName.trim().split(/\s+/) ?? []
    return parts.at(-1) ?? 'bạn'
  })
  protected readonly upcomingBookings = computed(() =>
    this.bookings()
      .filter(
        (item) => item.status === 'Approved' && new Date(item.startTime).getTime() > Date.now(),
      )
      .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)),
  )
  protected readonly pendingBookings = computed(
    () => this.bookings().filter((item) => item.status === 'Pending').length,
  )
  protected readonly activeWaitlists = computed(() =>
    this.waitlists().filter((item) => ['Waiting', 'Notified'].includes(item.status)),
  )
  protected readonly recentNotifications = computed(() =>
    [...this.notifications()]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5),
  )
  protected readonly statusText = computed(() => {
    const status = this.store.user()?.status
    if (typeof status === 'string') return status
    return (
      ({ 1: 'Active', 2: 'Inactive', 3: 'Restricted', 4: 'Locked' } as Record<number, string>)[
        status ?? 1
      ] ?? 'Active'
    )
  })
  protected readonly healthScore = computed(() =>
    Math.max(
      0,
      100 -
        this.violationSummary().penaltyPoints * 5 -
        this.violationSummary().activeViolationCount * 5,
    ),
  )
  protected readonly healthRing = computed(
    () => `conic-gradient(#10b981 0 ${this.healthScore()}%, #e2e8f0 ${this.healthScore()}% 100%)`,
  )
  protected readonly accountWarning = computed(() => {
    const status = this.statusText()
    if (status === 'Restricted') {
      const until = this.store.user()?.restrictionUntil
      return until
        ? `Tài khoản đang bị hạn chế đến ${new Date(until).toLocaleString('vi-VN')}. Trong thời gian này bạn có thể không tạo được booking mới.`
        : 'Tài khoản đang bị hạn chế. Vui lòng xem các vi phạm đang hoạt động.'
    }
    if (status === 'Locked') return 'Tài khoản đã bị khóa. Hãy liên hệ Admin để được hỗ trợ.'
    if (status === 'Inactive') return 'Tài khoản đang ngừng hoạt động. Hãy liên hệ Admin.'
    if (this.violationSummary().activeViolationCount > 0)
      return `Bạn đang có ${this.violationSummary().activeViolationCount} vi phạm hoạt động. Hãy kiểm tra để tránh bị hạn chế tài khoản.`
    return ''
  })
  protected readonly kpiCards = computed(() => [
    {
      label: 'Đang chờ duyệt',
      value: this.pendingBookings(),
      note: 'Booking cần quản lý xử lý',
      icon: 'clock',
      tone: 'amber',
    },
    {
      label: 'Sắp diễn ra',
      value: this.upcomingBookings().length,
      note: 'Booking đã được duyệt',
      icon: 'calendar',
      tone: 'indigo',
    },
    {
      label: 'Hàng chờ hoạt động',
      value: this.activeWaitlists().length,
      note: 'Đang giữ vị trí ưu tiên',
      icon: 'activity',
      tone: 'cyan',
    },
    {
      label: 'Thông báo chưa đọc',
      value: this.unreadCount(),
      note: this.unreadCount() > 0 ? 'Cập nhật mới cần xem' : 'Bạn đã đọc hết thông báo',
      icon: 'bell',
      tone: this.unreadCount() > 0 ? 'rose' : 'emerald',
    },
  ])

  ngOnInit(): void {
    const user = this.store.user()
    if (!user) {
      this.loading.set(false)
      return
    }
    forkJoin({
      bookings: this.workspace.bookingsByUser(user.userId).pipe(catchError(() => of([]))),
      waitlists: this.workspace.waitlistsByUser(user.userId).pipe(catchError(() => of([]))),
      notifications: this.workspace
        .notifications(user.userId, 1, 10)
        .pipe(catchError(() => of([]))),
      unread: this.workspace
        .unreadCount(user.userId)
        .pipe(catchError(() => of({ userId: user.userId, unreadCount: 0 }))),
      violations: this.workspace.violationSummary(user.userId).pipe(
        catchError(() =>
          of({
            userId: user.userId,
            fullName: user.fullName,
            penaltyPoints: user.penaltyPoints,
            userStatus: String(user.status),
            restrictionUntil: user.restrictionUntil,
            activeViolationCount: 0,
            activePenaltyPoints: 0,
            activeViolations: [],
          }),
        ),
      ),
    }).subscribe({
      next: (result) => {
        this.bookings.set(result.bookings)
        this.waitlists.set(result.waitlists)
        this.notifications.set(result.notifications)
        this.unreadCount.set(result.unread.unreadCount)
        this.violationSummary.set(result.violations)
        this.loading.set(false)
      },
      error: () => {
        this.loading.set(false)
        this.toast.error('Không tải được trang chủ', 'Vui lòng kiểm tra kết nối và thử lại.')
      },
    })
  }

  protected purposeLabel(value: string): string {
    const labels: Record<string, string> = {
      ResearchProject: 'Dự án nghiên cứu',
      CoursePractice: 'Thực hành môn học',
      SelfStudy: 'Tự học / nghiên cứu cá nhân',
    }
    return labels[value] ?? value
  }

  protected statusLabel(value: string): string {
    return (
      (
        {
          Active: 'Đang hoạt động',
          Restricted: 'Đang hạn chế',
          Inactive: 'Ngừng hoạt động',
          Locked: 'Đã khóa',
        } as Record<string, string>
      )[value] ?? value
    )
  }

  protected waitlistStatusLabel(value: string): string {
    return (
      (
        {
          Waiting: 'Đang chờ',
          Notified: 'Đã có chỗ',
          Booked: 'Đã đặt',
          Cancelled: 'Đã hủy',
          Expired: 'Hết hạn',
        } as Record<string, string>
      )[value] ?? value
    )
  }

  protected notificationTone(type: string): 'indigo' | 'emerald' | 'amber' | 'rose' {
    const normalized = type.toLowerCase()
    if (normalized.includes('approve') || normalized.includes('available')) return 'emerald'
    if (normalized.includes('reject') || normalized.includes('violation')) return 'rose'
    if (normalized.includes('reminder') || normalized.includes('maintenance')) return 'amber'
    return 'indigo'
  }

  protected notificationIcon(type: string): string {
    const tone = this.notificationTone(type)
    if (tone === 'emerald') return 'check'
    if (tone === 'rose') return 'alert'
    if (tone === 'amber') return 'clock'
    return 'bell'
  }
}
