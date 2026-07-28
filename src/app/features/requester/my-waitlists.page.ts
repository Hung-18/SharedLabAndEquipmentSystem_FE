import { DatePipe, NgClass } from '@angular/common'
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { SystemService } from '../../core/api/system.service'
import type {
  EquipmentResponse,
  LabRoomResponse,
  WaitlistResponse,
} from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'

@Component({
  selector: 'app-my-waitlists-page',
  imports: [
    DatePipe,
    NgClass,
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    IconComponent,
    StatusBadgeComponent,
    DataStateComponent,
  ],
  template: `
    <section class="space-y-6">
      <app-page-header
        title="Hàng chờ của tôi"
        subtitle="Theo dõi vị trí, thời gian giữ chỗ và tạo booking ngay khi nhận được thông báo."
        ><a routerLink="/app/bookings/new" class="btn-primary"
          ><app-icon name="plus" [size]="17" /> Tạo booking</a
        ></app-page-header
      >
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="kpi-card">
          <p class="text-xs font-bold text-slate-400">Đang chờ</p>
          <p class="mt-2 text-3xl font-black text-amber-600">{{ count('Waiting') }}</p>
        </div>
        <div class="kpi-card">
          <p class="text-xs font-bold text-slate-400">Đã thông báo</p>
          <p class="mt-2 text-3xl font-black text-emerald-600">{{ count('Notified') }}</p>
        </div>
        <div class="kpi-card">
          <p class="text-xs font-bold text-slate-400">Đã booking</p>
          <p class="mt-2 text-3xl font-black text-indigo-600">{{ count('Booked') }}</p>
        </div>
        <div class="kpi-card">
          <p class="text-xs font-bold text-slate-400">Hết hạn / hủy</p>
          <p class="mt-2 text-3xl font-black text-slate-500">
            {{ count('Expired') + count('Cancelled') }}
          </p>
        </div>
      </div>
      <div class="flex gap-2 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm">
        @for (tab of tabs; track tab.value) {
          <button
            class="shrink-0 rounded-xl px-4 py-2.5 text-xs font-black"
            [ngClass]="
              status === tab.value
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                : 'text-slate-500 hover:bg-slate-50'
            "
            (click)="status = tab.value"
          >
            {{ tab.label }}
          </button>
        }
      </div>
      @if (loading()) {
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="card-surface p-5">
              <div class="skeleton h-5 w-2/3 rounded"></div>
              <div class="skeleton mt-4 h-24 rounded-2xl"></div>
            </div>
          }
        </div>
      } @else if (filtered().length === 0) {
        <app-data-state
          title="Không có lượt hàng chờ"
          message="Khi khung giờ mong muốn bị chiếm, bạn có thể tham gia hàng chờ từ luồng tạo booking."
          icon="clock"
        />
      } @else {
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          @for (item of filtered(); track item.waitlistId) {
            <article class="card-surface overflow-hidden">
              <div class="p-5">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-[10px] font-black tracking-[.16em] text-violet-500 uppercase">
                      Waitlist #{{ item.waitlistId }}
                    </p>
                    <h2 class="mt-2 text-lg font-black text-slate-950">{{ resourceName(item) }}</h2>
                  </div>
                  <app-status-badge [value]="item.status" domain="waitlist" />
                </div>
                <div class="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p class="flex items-center gap-2 text-sm font-black text-slate-800">
                    <app-icon name="calendar" [size]="17" />
                    {{ item.requestedStart | date: 'HH:mm dd/MM/yyyy' }}
                  </p>
                  <p class="mt-2 pl-6 text-xs text-slate-400">
                    đến {{ item.requestedEnd | date: 'HH:mm dd/MM/yyyy' }}
                  </p>
                </div>
                <div class="mt-4 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-400">Vị trí trong hàng</span
                  ><span
                    class="flex h-10 min-w-10 items-center justify-center rounded-2xl bg-violet-50 px-3 font-black text-violet-700"
                    >#{{ item.queuePosition }}</span
                  >
                </div>
                @if (item.status === 'Notified') {
                  <div class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p class="text-xs font-black text-emerald-800">Thời gian giữ chỗ còn lại</p>
                    <p class="mt-2 text-2xl font-black text-emerald-700">{{ countdown(item) }}</p>
                    <p class="mt-1 text-[11px] text-emerald-700/70">
                      Backend giữ lượt tối đa 30 phút từ {{ item.notifiedAt | date: 'HH:mm:ss' }}.
                    </p>
                  </div>
                }
              </div>
              <div class="flex gap-2 border-t border-slate-100 p-4">
                @if (item.status === 'Notified') {
                  <button class="btn-primary flex-1" (click)="bookNow(item)">
                    <app-icon name="calendar-plus" [size]="16" /> Tạo booking
                  </button>
                }
                @if (item.status === 'Waiting' || item.status === 'Notified') {
                  <button class="btn-secondary btn-danger" (click)="cancel(item)">Hủy</button>
                }
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class MyWaitlistsPage implements OnInit, OnDestroy {
  private readonly api = inject(SystemService)
  private readonly store = inject(AuthStore)
  private readonly router = inject(Router)
  private readonly toast = inject(ToastService)
  protected readonly items = signal<WaitlistResponse[]>([])
  protected readonly labs = signal<LabRoomResponse[]>([])
  protected readonly equipments = signal<EquipmentResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly clock = signal(Date.now())
  private countdownTimer: ReturnType<typeof setInterval> | null = null
  protected status = ''
  protected readonly tabs = [
    { value: '', label: 'Tất cả' },
    { value: 'Waiting', label: 'Đang chờ' },
    { value: 'Notified', label: 'Đã thông báo' },
    { value: 'Booked', label: 'Đã booking' },
    { value: 'Cancelled', label: 'Đã hủy' },
    { value: 'Expired', label: 'Hết hạn' },
  ]
  protected filtered(): WaitlistResponse[] {
    return this.items()
      .filter((item) => !this.status || item.status === this.status)
      .sort((a, b) => +new Date(b.requestedStart) - +new Date(a.requestedStart))
  }
  ngOnInit(): void {
    this.countdownTimer = setInterval(() => this.clock.set(Date.now()), 1000)
    const userId = this.store.user()?.userId
    if (!userId) return
    this.api.labs().subscribe((labs) => this.labs.set(labs))
    this.api.equipments().subscribe((items) => this.equipments.set(items))
    this.api.waitlistsByUser(userId).subscribe({
      next: (items) => {
        this.items.set(items)
        this.loading.set(false)
      },
      error: () => {
        this.loading.set(false)
        this.toast.error('Không tải được hàng chờ')
      },
    })
  }
  ngOnDestroy(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
  }

  protected count(status: string): number {
    return this.items().filter((item) => item.status === status).length
  }
  protected resourceName(item: WaitlistResponse): string {
    if (item.labId)
      return this.labs().find((lab) => lab.labId === item.labId)?.labName ?? `Phòng #${item.labId}`
    return (
      this.equipments().find((equipment) => equipment.equipmentId === item.equipmentId)
        ?.equipmentName ?? `Thiết bị #${item.equipmentId}`
    )
  }
  protected countdown(item: WaitlistResponse): string {
    if (!item.notifiedAt) return '—'
    const remaining = Math.max(0, +new Date(item.notifiedAt) + 30 * 60_000 - this.clock())
    const minutes = Math.floor(remaining / 60_000)
    const seconds = Math.floor((remaining % 60_000) / 1000)
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  protected bookNow(item: WaitlistResponse): void {
    void this.router.navigate(['/app/bookings/new'], {
      queryParams: {
        labId: item.labId,
        equipmentId: item.equipmentId,
        start: item.requestedStart,
        end: item.requestedEnd,
        waitlistId: item.waitlistId,
      },
    })
  }
  protected cancel(item: WaitlistResponse): void {
    if (!confirm('Hủy lượt hàng chờ này?')) return
    this.api.cancelWaitlist(item.waitlistId).subscribe({
      next: () => {
        this.toast.success('Đã hủy hàng chờ')
        this.items.update((items) =>
          items.map((current) =>
            current.waitlistId === item.waitlistId ? { ...current, status: 'Cancelled' } : current,
          ),
        )
      },
      error: () => this.toast.error('Không thể hủy hàng chờ'),
    })
  }
}
