import { DatePipe } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { catchError, forkJoin, map, of } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import type { BookingResponse } from '../../core/api/system.models'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'
import { labelOf, toDateInput } from '../../shared/utils/presentation'
import { searchIncludes } from '../../shared/utils/search'

type BookingManagementView = BookingResponse & { userName: string }

@Component({
  selector: 'app-bookings-management-page',
  imports: [
    DatePipe,
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
        title="Quản lý toàn bộ booking"
        subtitle="Tra cứu, theo dõi và xử lý vòng đời booking trong phạm vi quyền quản lý."
        ><a routerLink="/app/management/bookings/pending" class="btn-primary"
          ><app-icon name="clock" [size]="17" /> Hàng chờ duyệt</a
        ><a routerLink="/app/calendar" class="btn-secondary"
          ><app-icon name="calendar" [size]="17" /> Lịch tài nguyên</a
        ></app-page-header
      >
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        @for (card of cards(); track card.status) {
          <button
            type="button"
            class="kpi-card text-left transition hover:-translate-y-1"
            (click)="status = card.status"
          >
            <p class="text-[10px] font-black tracking-[.14em] text-slate-400 uppercase">
              {{ card.label }}
            </p>
            <p class="mt-2 text-3xl font-black" [class]="card.className">{{ card.count }}</p>
          </button>
        }
      </div>
      <div class="filter-bar md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
        <div>
          <label class="field-label">Tìm kiếm</label
          ><input
            type="search"
            class="input-shell"
            [(ngModel)]="keyword"
            placeholder="Mã booking, tên người đặt, mục đích..."
          />
        </div>
        <div>
          <label class="field-label">Trạng thái</label
          ><select class="input-shell" [(ngModel)]="status">
            <option value="">Tất cả</option>
            @for (tab of statuses; track tab.value) {
              <option [value]="tab.value">{{ tab.label }}</option>
            }
          </select>
        </div>
        <div>
          <label class="field-label">Từ ngày</label
          ><input class="input-shell" type="date" [(ngModel)]="from" />
        </div>
        <div>
          <label class="field-label">Đến ngày</label
          ><input class="input-shell" type="date" [(ngModel)]="to" />
        </div>
        <div class="flex items-end">
          <button class="btn-secondary w-full" (click)="reset()">
            <app-icon name="refresh" [size]="17" /> Đặt lại
          </button>
        </div>
      </div>
      <article class="card-surface overflow-hidden">
        <header class="flex items-center justify-between border-b border-slate-100 px-5 py-5">
          <div>
            <h2 class="font-black text-slate-950">Danh sách booking</h2>
            <p class="mt-1 text-xs text-slate-400">{{ filtered().length }} bản ghi sau bộ lọc</p>
          </div>
          <button class="btn-secondary" (click)="load()">
            <app-icon name="refresh" [size]="16" /> Làm mới
          </button>
        </header>
        @if (loading()) {
          <div class="p-6"><div class="skeleton h-80 rounded-2xl"></div></div>
        } @else if (filtered().length === 0) {
          <div class="p-6">
            <app-data-state
              title="Không tìm thấy dữ liệu phù hợp"
              message="Không có bản ghi nào khớp bộ lọc hiện tại."
              icon="calendar"
            />
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="table-shell">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Người đặt</th>
                  <th>Mục đích</th>
                  <th>Thời gian</th>
                  <th>Ưu tiên</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (item of filtered(); track item.bookingId) {
                  <tr>
                    <td>
                      <a
                        [routerLink]="['/app/bookings', item.bookingId]"
                        class="font-black text-violet-700"
                        >#BK-{{ item.bookingId.toString().padStart(5, '0') }}</a
                      >
                      <p class="mt-1 text-xs text-slate-400">
                        {{ item.createdAt | date: 'dd/MM/yyyy' }}
                      </p>
                    </td>
                    <td>
                      <p class="font-bold text-slate-800">{{ item.userName }}</p>
                    </td>
                    <td>{{ labelOf('purpose', item.purposeType) }}</td>
                    <td>
                      <p class="font-bold text-slate-700">
                        {{ item.startTime | date: 'HH:mm dd/MM' }}
                      </p>
                      <p class="mt-1 text-xs text-slate-400">
                        {{ item.endTime | date: 'HH:mm dd/MM' }}
                      </p>
                    </td>
                    <td>
                      <span
                        class="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700"
                        >P{{ item.priorityLevel ?? '—' }}</span
                      >
                    </td>
                    <td><app-status-badge [value]="item.status" domain="booking" /></td>
                    <td>
                      <div class="flex items-center gap-2">
                        <a
                          [routerLink]="['/app/bookings', item.bookingId]"
                          class="btn-secondary h-9 min-h-9 px-3"
                          >Chi tiết</a
                        >
                        @if (item.status === 'Approved') {
                          <button
                            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                            [disabled]="!canAttemptComplete(item)"
                            [title]="
                              canAttemptComplete(item)
                                ? 'Complete'
                                : 'Chỉ hoàn thành sau giờ kết thúc'
                            "
                            (click)="action(item, 'complete')"
                          >
                            <app-icon name="check" [size]="16" /></button
                          ><button
                            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                            [disabled]="!canAttemptNoShow(item)"
                            [title]="
                              canAttemptNoShow(item)
                                ? 'Không đến'
                                : 'Chỉ đánh dấu sau 30 phút kể từ giờ bắt đầu'
                            "
                            (click)="action(item, 'no-show')"
                          >
                            <app-icon name="alert" [size]="16" />
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </article>
    </section>
  `,
})
export class BookingsManagementPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly toast = inject(ToastService)
  protected readonly items = signal<BookingManagementView[]>([])
  protected readonly loading = signal(true)
  protected keyword = ''
  protected status = ''
  protected from = ''
  protected to = ''
  protected readonly labelOf = labelOf
  protected readonly statuses = [
    { value: 'Pending', label: 'Chờ duyệt' },
    { value: 'Approved', label: 'Đã duyệt' },
    { value: 'Rejected', label: 'Từ chối' },
    { value: 'Cancelled', label: 'Đã hủy' },
    { value: 'Completed', label: 'Hoàn thành' },
    { value: 'NoShow', label: 'Không đến' },
    { value: 'EmergencyCancelled', label: 'Hủy khẩn cấp' },
    { value: 'EmergencyEnded', label: 'Kết thúc khẩn cấp' },
  ]
  protected filtered(): BookingManagementView[] {
    return [...this.items()]
      .filter((item) => {
        const date = toDateInput(new Date(item.startTime))
        return (
          (!this.status || item.status === this.status) &&
          (!this.from || date >= this.from) &&
          (!this.to || date <= this.to) &&
          searchIncludes(
            this.keyword,
            item.bookingId,
            item.userName,
            labelOf('purpose', item.purposeType),
          )
        )
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }
  protected readonly cards = computed(() => [
    { status: '', label: 'Tổng booking', count: this.items().length, className: 'text-slate-950' },
    ...this.statuses.map((item, index) => ({
      status: item.value,
      label: item.label,
      count: this.items().filter((booking) => booking.status === item.value).length,
      className: [
        'text-amber-600',
        'text-emerald-600',
        'text-rose-600',
        'text-slate-500',
        'text-indigo-600',
        'text-rose-600',
      ][index],
    })),
  ])
  ngOnInit(): void {
    this.load()
  }
  protected load(): void {
    this.loading.set(true)
    this.api.bookings().subscribe({
      next: (items) => {
        if (items.length === 0) {
          this.items.set([])
          this.loading.set(false)
          return
        }

        forkJoin(
          items.map((item) =>
            this.api.booking(item.bookingId).pipe(
              map((detail) => ({
                ...item,
                userName: detail.userName?.trim() || 'Chưa xác định người đặt',
              })),
              catchError(() => of({ ...item, userName: 'Chưa xác định người đặt' })),
            ),
          ),
        ).subscribe({
          next: (resolvedItems) => {
            this.items.set(resolvedItems)
            this.loading.set(false)
          },
          error: () => {
            this.loading.set(false)
            this.toast.error('Không tải được tên người đặt')
          },
        })
      },
      error: () => {
        this.loading.set(false)
        this.toast.error('Không tải được danh sách booking')
      },
    })
  }
  protected reset(): void {
    this.keyword = ''
    this.status = ''
    this.from = ''
    this.to = ''
  }
  protected canAttemptComplete(item: BookingResponse): boolean {
    return item.status === 'Approved' && Date.now() >= new Date(item.endTime).getTime()
  }

  protected canAttemptNoShow(item: BookingResponse): boolean {
    return (
      item.status === 'Approved' && Date.now() >= new Date(item.startTime).getTime() + 30 * 60_000
    )
  }

  protected action(item: BookingResponse, action: 'complete' | 'no-show'): void {
    if (action === 'complete' && !this.canAttemptComplete(item)) {
      this.toast.info('Chỉ có thể hoàn thành booking sau giờ kết thúc')
      return
    }
    if (action === 'no-show' && !this.canAttemptNoShow(item)) {
      this.toast.info('Chỉ có thể đánh dấu không đến sau 30 phút kể từ giờ bắt đầu')
      return
    }
    if (!confirm(`Xác nhận ${action} booking #${item.bookingId}?`)) return
    const request =
      action === 'complete'
        ? this.api.completeBooking(item.bookingId)
        : this.api.noShowBooking(item.bookingId)
    request.subscribe({
      next: () => {
        this.toast.success('Đã cập nhật booking')
        this.load()
      },
      error: () => this.toast.error('Không thể cập nhật booking'),
    })
  }
}
