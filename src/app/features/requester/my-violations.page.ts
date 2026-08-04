import { DatePipe } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { SystemService } from '../../core/api/system.service'
import type { UserViolationSummaryResponse, ViolationResponse } from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'
import { labelOf } from '../../shared/utils/presentation'

@Component({
  selector: 'app-my-violations-page',
  imports: [
    DatePipe,
    RouterLink,
    PageHeaderComponent,
    IconComponent,
    StatusBadgeComponent,
    DataStateComponent,
  ],
  template: `
    <section class="space-y-6">
      <app-page-header
        title="Vi phạm & điểm phạt"
        subtitle="Theo dõi các vi phạm liên quan tới booking, tổng điểm phạt và trạng thái hạn chế tài khoản."
      />
      @if (loading()) {
        <div class="grid gap-5 lg:grid-cols-3">
          <div class="skeleton h-64 rounded-[28px]"></div>
          <div class="skeleton h-64 rounded-[28px] lg:col-span-2"></div>
        </div>
      } @else {
        <div class="grid gap-6 xl:grid-cols-[360px_1fr]">
          <article
            class="relative overflow-hidden rounded-[30px] bg-linear-to-br from-[#111a3a] via-indigo-950 to-violet-900 p-6 text-white shadow-2xl shadow-indigo-950/15"
          >
            <div
              class="absolute -top-14 -right-14 h-44 w-44 rounded-full bg-violet-400/20 blur-2xl"
            ></div>
            <div class="relative">
              <div class="flex items-center justify-between">
                <p class="text-[10px] font-black tracking-[.18em] text-cyan-300 uppercase">
                  Sức khỏe tài khoản
                </p>
                <app-status-badge [value]="summary().userStatus" domain="user" />
              </div>
              <div class="mt-8 flex items-end gap-3">
                <span class="text-6xl font-black">{{ summary().penaltyPoints }}</span
                ><span class="pb-2 text-sm font-bold text-white/55">điểm phạt</span>
              </div>
              <div class="mt-7 grid grid-cols-2 gap-3">
                <div class="rounded-2xl bg-white/8 p-4 backdrop-blur">
                  <p class="text-[10px] font-black text-white/45 uppercase">Active</p>
                  <p class="mt-2 text-2xl font-black">{{ summary().activeViolationCount }}</p>
                </div>
                <div class="rounded-2xl bg-white/8 p-4 backdrop-blur">
                  <p class="text-[10px] font-black text-white/45 uppercase">Điểm hiệu lực</p>
                  <p class="mt-2 text-2xl font-black">{{ summary().activePenaltyPoints }}</p>
                </div>
              </div>
              @if (summary().restrictionUntil) {
                <div class="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <p class="text-xs font-black text-amber-200">Hạn chế đến</p>
                  <p class="mt-1 text-sm text-white">
                    {{ summary().restrictionUntil | date: 'HH:mm dd/MM/yyyy' }}
                  </p>
                </div>
              }
            </div>
          </article>
          <article class="card-surface p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-black tracking-[.15em] text-violet-500 uppercase">
                  Tổng hợp
                </p>
                <h2 class="mt-2 text-xl font-black text-slate-950">Phân bố vi phạm</h2>
              </div>
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"
              >
                <app-icon name="alert" [size]="22" />
              </div>
            </div>
            <div class="mt-6 space-y-4">
              @for (type of types(); track type.name) {
                <div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="font-bold text-slate-600">{{
                      labelOf('violationType', type.name)
                    }}</span
                    ><strong class="text-slate-900">{{ type.count }}</strong>
                  </div>
                  <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full bg-linear-to-r from-rose-400 to-violet-500"
                      [style.width.%]="type.percent"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </article>
        </div>

        @if (violations().length === 0) {
          <app-data-state
            title="Bạn chưa có vi phạm"
            message="Duy trì check-in/check-out đúng giờ và sử dụng tài nguyên đúng hướng dẫn."
            icon="shield"
          />
        } @else {
          <div class="card-surface overflow-x-auto">
            <table class="table-shell">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Booking</th>
                  <th>Loại vi phạm</th>
                  <th>Điểm cộng</th>
                  <th>Ngày ghi nhận</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (item of violations(); track item.violationId) {
                  <tr>
                    <td class="font-black text-slate-900">
                      #VP-{{ item.violationId.toString().padStart(4, '0') }}
                    </td>
                    <td>
                      <a
                        [routerLink]="['/app/bookings', item.bookingId]"
                        class="font-black text-violet-600"
                        >Xem lịch đặt</a
                      >
                    </td>
                    <td>{{ labelOf('violationType', item.violationType) }}</td>
                    <td>
                      <span
                        class="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700"
                        >+{{ item.penaltyPointsAdded }}</span
                      >
                    </td>
                    <td>{{ item.loggedAt | date: 'HH:mm dd/MM/yyyy' }}</td>
                    <td><app-status-badge [value]="item.status" domain="violation" /></td>
                    <td>
                      <a
                        [routerLink]="['/app/bookings', item.bookingId]"
                        class="text-slate-400 hover:text-violet-600"
                        ><app-icon name="arrow-right" [size]="18"
                      /></a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </section>
  `,
})
export class MyViolationsPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly store = inject(AuthStore)
  private readonly toast = inject(ToastService)
  protected readonly summary = signal<UserViolationSummaryResponse>({
    userId: 0,
    fullName: '',
    penaltyPoints: 0,
    userStatus: 'Active',
    restrictionUntil: null,
    activeViolationCount: 0,
    activePenaltyPoints: 0,
    activeViolations: [],
  })
  protected readonly violations = signal<ViolationResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly labelOf = labelOf
  protected readonly types = computed(() => {
    const counts = new Map<string, number>()
    for (const item of this.violations())
      counts.set(item.violationType, (counts.get(item.violationType) ?? 0) + 1)
    const max = Math.max(1, ...counts.values())
    return [...counts.entries()].map(([name, count]) => ({
      name,
      count,
      percent: (count / max) * 100,
    }))
  })
  ngOnInit(): void {
    const userId = this.store.user()?.userId
    if (!userId) return
    this.api.violationSummary(userId).subscribe({
      next: (summary) => {
        this.summary.set(summary)
        this.api.violationsByUser(userId).subscribe({
          next: (items) => {
            this.violations.set(items)
            this.loading.set(false)
          },
          error: () => this.loading.set(false),
        })
      },
      error: () => {
        this.loading.set(false)
        this.toast.error('Không tải được thông tin vi phạm')
      },
    })
  }
}
