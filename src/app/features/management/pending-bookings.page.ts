import { DatePipe } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { SystemService } from '../../core/api/system.service'
import type { BookingResponse } from '../../core/api/system.models'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { ModalComponent } from '../../shared/ui/modal'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { ToastService } from '../../shared/ui/toast.service'
import { labelOf } from '../../shared/utils/presentation'

@Component({
  selector: 'app-pending-bookings-page',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    IconComponent,
    ModalComponent,
    DataStateComponent,
  ],
  template: `<section class="space-y-6">
    <app-page-header
      title="Hàng đợi booking cần duyệt"
      subtitle="Danh sách được sắp theo mức ưu tiên và thời điểm gửi yêu cầu."
      ><a routerLink="/app/management/bookings" class="btn-secondary"
        ><app-icon name="list" [size]="17" /> Tất cả booking</a
      ></app-page-header
    >
    <div
      class="rounded-[26px] border border-violet-200 bg-linear-to-r from-violet-50 to-cyan-50 p-5"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm"
        >
          <app-icon name="sparkles" [size]="22" />
        </div>
        <div class="flex-1">
          <p class="font-black text-slate-900">Nguyên tắc xử lý ưu tiên</p>
          <p class="mt-1 text-sm leading-6 text-slate-600">
            Số ưu tiên càng nhỏ càng được xét trước. Các yêu cầu cùng mức ưu tiên được xử lý theo thời gian gửi.
          </p>
        </div>
        <span
          class="rounded-2xl bg-white px-4 py-3 text-2xl font-black text-violet-700 shadow-sm"
          >{{ items().length }}</span
        >
      </div>
    </div>
    @if (loading()) {
      <div class="card-surface p-6"><div class="skeleton h-96 rounded-2xl"></div></div>
    } @else if (items().length === 0) {
      <app-data-state
        title="Không còn booking chờ duyệt"
        message="Tất cả yêu cầu hiện đã được xử lý."
        icon="check"
      />
    } @else {
      <div class="space-y-4">
        @for (item of items(); track item.bookingId; let rank = $index) {
          <article class="card-surface p-5 transition hover:-translate-y-1 sm:p-6">
            <div class="flex flex-col gap-5 lg:flex-row lg:items-center">
              <div
                class="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl"
                [class.bg-violet-600]="rank === 0"
                [class.text-white]="rank === 0"
                [class.bg-slate-100]="rank !== 0"
                [class.text-slate-600]="rank !== 0"
              >
                <span class="text-[9px] font-black uppercase">Thứ tự</span
                ><span class="text-xl font-black">#{{ rank + 1 }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <a
                    [routerLink]="['/app/bookings', item.bookingId]"
                    class="text-lg font-black text-slate-950 hover:text-violet-700"
                    >Booking #{{ item.bookingId }}</a
                  ><span
                    class="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700"
                    >P{{ item.priorityLevel ?? '—' }}</span
                  >
                </div>
                <p class="mt-2 text-sm font-bold text-slate-600">
                  {{ labelOf('purpose', item.purposeType) }} · User #{{ item.userId }}
                </p>
                <p class="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <app-icon name="clock" [size]="15" />
                  {{ item.startTime | date: 'HH:mm dd/MM/yyyy' }} –
                  {{ item.endTime | date: 'HH:mm dd/MM/yyyy' }}
                </p>
                <p class="mt-1 text-xs text-slate-400">
                  Gửi lúc {{ item.createdAt | date: 'HH:mm:ss dd/MM/yyyy' }}
                </p>
              </div>
              <div class="flex shrink-0 gap-2">
                <a [routerLink]="['/app/bookings', item.bookingId]" class="btn-secondary"
                  >Chi tiết</a
                ><button class="btn-secondary btn-danger" (click)="openReject(item)">
                  <app-icon name="x" [size]="16" /> Từ chối</button
                ><button class="btn-primary" (click)="approve(item)">
                  <app-icon name="check" [size]="16" /> Duyệt
                </button>
              </div>
            </div>
          </article>
        }
      </div>
    }
    <app-modal
      [open]="rejectOpen()"
      title="Từ chối booking"
      [subtitle]="selected() ? 'Booking #' + selected()!.bookingId : ''"
      (close)="rejectOpen.set(false)"
      ><label class="field-label">Lý do từ chối *</label
      ><textarea
        class="textarea-shell"
        [(ngModel)]="reason"
        placeholder="Nêu rõ lý do để người đặt điều chỉnh..."
      ></textarea>
      <div class="mt-5 flex justify-end gap-2">
        <button class="btn-secondary" (click)="rejectOpen.set(false)">Hủy</button
        ><button class="btn-primary" [disabled]="!reason.trim()" (click)="reject()">
          Xác nhận
        </button>
      </div></app-modal
    >
  </section>`,
})
export class PendingBookingsPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly toast = inject(ToastService)
  protected readonly items = signal<BookingResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly rejectOpen = signal(false)
  protected readonly selected = signal<BookingResponse | null>(null)
  protected reason = ''
  protected readonly labelOf = labelOf
  ngOnInit(): void {
    this.load()
  }
  protected approve(item: BookingResponse): void {
    if (!confirm(`Duyệt booking #${item.bookingId}?`)) return
    this.api.approveBooking(item.bookingId).subscribe({
      next: () => {
        this.toast.success('Đã duyệt booking')
        this.load()
      },
      error: () =>
        this.toast.error(
          'Không thể duyệt booking',
          'Slot có thể vừa phát sinh xung đột hoặc booking không còn Pending.',
        ),
    })
  }
  protected openReject(item: BookingResponse): void {
    this.selected.set(item)
    this.reason = ''
    this.rejectOpen.set(true)
  }
  protected reject(): void {
    const item = this.selected()
    if (!item) return
    this.api.rejectBooking(item.bookingId, this.reason.trim()).subscribe({
      next: () => {
        this.rejectOpen.set(false)
        this.toast.success('Đã từ chối booking')
        this.load()
      },
      error: () => this.toast.error('Không thể từ chối booking'),
    })
  }
  private load(): void {
    this.loading.set(true)
    this.api.pendingBookings().subscribe({
      next: (items) => {
        this.items.set(
          [...items].sort(
            (a, b) =>
              (a.priorityLevel ?? 999) - (b.priorityLevel ?? 999) ||
              +new Date(a.createdAt) - +new Date(b.createdAt),
          ),
        )
        this.loading.set(false)
      },
      error: () => {
        this.loading.set(false)
        this.toast.error('Không tải được hàng đợi')
      },
    })
  }
}
