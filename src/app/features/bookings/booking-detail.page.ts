import { DatePipe, NgClass } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { catchError, forkJoin, of } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import type {
  BookingDetailResponse,
  EquipmentResponse,
  UsageLogResponse,
  ViolationResponse,
} from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { ModalComponent } from '../../shared/ui/modal'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'
import { labelOf } from '../../shared/utils/presentation'
import { apiErrorMessage } from '../../core/http/api-error'

@Component({
  selector: 'app-booking-detail-page',
  imports: [
    DatePipe,
    NgClass,
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    IconComponent,
    ModalComponent,
    StatusBadgeComponent,
    DataStateComponent,
  ],
  template: `
    <section class="space-y-6">
      @if (loading()) {
        <div class="card-surface p-7">
          <div class="skeleton h-8 w-1/3 rounded"></div>
          <div class="skeleton mt-5 h-80 rounded-3xl"></div>
        </div>
      } @else if (!booking()) {
        <app-data-state
          title="Không tìm thấy booking"
          message="Booking không tồn tại hoặc nằm ngoài phạm vi quyền của bạn."
          icon="calendar"
          ><a routerLink="/app/bookings/my" class="btn-primary mt-5"
            >Về danh sách</a
          ></app-data-state
        >
      } @else {
        <app-page-header
          [title]="pageTitle()"
          [subtitle]="
            labelOf('purpose', booking()!.purposeType) +
            ' · Tạo lúc ' +
            (booking()!.createdAt | date: 'HH:mm dd/MM/yyyy')
          "
        >
          @if (canApprove()) {
            <button class="btn-primary" (click)="action('approve')">
              <app-icon name="check" [size]="17" /> Duyệt</button
            ><button class="btn-secondary btn-danger" (click)="rejectOpen.set(true)">
              <app-icon name="x" [size]="17" /> Từ chối
            </button>
          }
          @if (canEdit()) {
            <a [routerLink]="['/app/bookings', booking()!.bookingId, 'edit']" class="btn-secondary">
              <app-icon name="edit" [size]="17" /> Sửa booking
            </a>
          }
          @if (canCancel()) {
            <button class="btn-secondary btn-danger" (click)="action('cancel')">
              <app-icon name="x" [size]="17" /> Hủy booking
            </button>
          }
        </app-page-header>

        <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div class="space-y-6">
            <article class="card-surface p-5 sm:p-7">
              <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-[10px] font-black tracking-[.16em] text-slate-400 uppercase">
                    Trạng thái hiện tại
                  </p>
                  <div class="mt-2">
                    <app-status-badge [value]="booking()!.status" domain="booking" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div class="rounded-2xl bg-violet-50 px-4 py-3 text-center">
                    <p class="text-[10px] font-black text-violet-500 uppercase">Ưu tiên</p>
                    <p class="mt-1 text-xl font-black text-violet-800">
                      P{{ booking()!.priorityLevel ?? '—' }}
                    </p>
                  </div>
                  <div class="rounded-2xl bg-cyan-50 px-4 py-3 text-center">
                    <p class="text-[10px] font-black text-cyan-500 uppercase">Tài nguyên</p>
                    <p class="mt-1 text-xl font-black text-cyan-800">
                      {{ booking()!.items.length }}
                    </p>
                  </div>
                  <div
                    class="col-span-2 rounded-2xl bg-slate-50 px-4 py-3 text-center sm:col-span-1"
                  >
                    <p class="text-[10px] font-black text-slate-400 uppercase">Thời lượng</p>
                    <p class="mt-1 text-xl font-black text-slate-800">{{ durationHours() }}h</p>
                  </div>
                </div>
              </div>
              <div class="mt-6 grid gap-4 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 p-5">
                  <p class="text-xs font-black text-slate-400">Bắt đầu</p>
                  <p class="mt-2 text-lg font-black text-slate-900">
                    {{ booking()!.startTime | date: 'HH:mm' }}
                  </p>
                  <p class="mt-1 text-sm text-slate-500">
                    {{ booking()!.startTime | date: 'EEEE, dd/MM/yyyy' }}
                  </p>
                </div>
                <div class="rounded-2xl border border-slate-200 p-5">
                  <p class="text-xs font-black text-slate-400">Kết thúc</p>
                  <p class="mt-2 text-lg font-black text-slate-900">
                    {{ booking()!.endTime | date: 'HH:mm' }}
                  </p>
                  <p class="mt-1 text-sm text-slate-500">
                    {{ booking()!.endTime | date: 'EEEE, dd/MM/yyyy' }}
                  </p>
                </div>
              </div>
              <div class="mt-5 rounded-2xl bg-slate-50 p-5">
                <p class="text-xs font-black text-slate-700">Mô tả mục đích</p>
                <p class="mt-2 text-sm leading-7 whitespace-pre-line text-slate-500">
                  {{ booking()!.purposeDescription || 'Không có mô tả.' }}
                </p>
              </div>
              @if (booking()!.rejectionReason) {
                <div class="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5">
                  <p class="text-xs font-black text-rose-800">Lý do từ chối</p>
                  <p class="mt-2 text-sm leading-6 text-rose-700">
                    {{ booking()!.rejectionReason }}
                  </p>
                </div>
              }
            </article>

            <article class="card-surface overflow-hidden">
              <header
                class="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div>
                  <h2 class="text-lg font-black text-slate-950">Phòng và thiết bị trong booking</h2>
                  <p class="mt-1 text-xs text-slate-400">
                    Check-in một lần cho toàn bộ booking; check-out sẽ trả toàn bộ phòng và thiết
                    bị.
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  @if (canCheckInBooking()) {
                    <button class="btn-primary" [disabled]="acting()" (click)="checkInBooking()">
                      <app-icon name="login" [size]="16" />
                      {{ acting() ? 'Đang xử lý...' : 'Check-in booking' }}
                    </button>
                  }
                  @if (canCheckOutBooking()) {
                    <button class="btn-primary" [disabled]="acting()" (click)="checkOutBooking()">
                      <app-icon name="logout" [size]="16" />
                      {{ acting() ? 'Đang xử lý...' : 'Check-out toàn bộ' }}
                    </button>
                  }
                </div>
              </header>
              <div class="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span class="font-black text-slate-700">Trạng thái sử dụng</span>
                  <span
                    class="rounded-full px-3 py-1.5 text-xs font-black"
                    [ngClass]="
                      hasOpenUsage()
                        ? 'bg-amber-100 text-amber-800'
                        : logs().length
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                    "
                  >
                    {{
                      hasOpenUsage()
                        ? 'Đang sử dụng toàn bộ booking'
                        : logs().length
                          ? 'Đã check-out toàn bộ'
                          : 'Chưa check-in'
                    }}
                  </span>
                </div>
              </div>
              <div class="divide-y divide-slate-100">
                @for (item of booking()!.items; track item.bookingItemId) {
                  <div class="p-5 sm:p-6">
                    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div
                        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                        [ngClass]="
                          item.resourceType === 'LabRoom'
                            ? 'bg-violet-50 text-violet-600'
                            : 'bg-cyan-50 text-cyan-600'
                        "
                      >
                        <app-icon
                          [name]="item.resourceType === 'LabRoom' ? 'building' : 'microscope'"
                          [size]="22"
                        />
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="font-black text-slate-900">
                          {{
                            item.labName ||
                              item.equipmentName ||
                              'Tài nguyên #' + item.bookingItemId
                          }}
                        </p>
                        <p class="mt-1 text-xs text-slate-400">
                          {{ labelOf('resource', item.resourceType) }} · Item #{{
                            item.bookingItemId
                          }}
                        </p>
                        <p class="mt-2 text-sm text-slate-500">
                          {{ item.note || 'Không có ghi chú.' }}
                        </p>
                      </div>
                      <div class="flex flex-wrap gap-2">
                        @if (logFor(item.bookingItemId); as log) {
                          @if (!log.actualCheckout && canReportIncident(log)) {
                            <button class="btn-secondary" (click)="openIncident(log)">
                              <app-icon name="alert" [size]="16" /> Báo sự cố
                            </button>
                          }
                          <span
                            class="rounded-full px-3 py-2 text-xs font-black"
                            [ngClass]="
                              log.actualCheckout
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            "
                            >{{ log.actualCheckout ? 'Đã trả tài nguyên' : 'Đang sử dụng' }}</span
                          >
                        } @else {
                          <span
                            class="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500"
                            >Chưa check-in</span
                          >
                        }
                      </div>
                    </div>
                    @if (logFor(item.bookingItemId); as log) {
                      <div class="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3">
                        <div>
                          <p class="text-[10px] font-black text-slate-400 uppercase">Check-in</p>
                          <p class="mt-1 text-xs font-bold text-slate-700">
                            {{ log.actualCheckin | date: 'HH:mm dd/MM/yyyy' }}
                          </p>
                        </div>
                        <div>
                          <p class="text-[10px] font-black text-slate-400 uppercase">Check-out</p>
                          <p class="mt-1 text-xs font-bold text-slate-700">
                            {{
                              log.actualCheckout
                                ? (log.actualCheckout | date: 'HH:mm dd/MM/yyyy')
                                : 'Chưa checkout'
                            }}
                          </p>
                        </div>
                        <div>
                          <p class="text-[10px] font-black text-slate-400 uppercase">Sự cố</p>
                          <p class="mt-1 text-xs font-bold text-slate-700">
                            {{ labelOf('incidentType', log.incidentStatus) }} ·
                            {{ labelOf('incident', log.incidentReviewStatus) }}
                          </p>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </article>

            @if (violations().length) {
              <article class="card-surface overflow-hidden">
                <header class="border-b border-slate-100 px-5 py-5">
                  <h2 class="font-black text-slate-950">Vi phạm liên quan</h2>
                </header>
                <div class="divide-y divide-slate-100">
                  @for (item of violations(); track item.violationId) {
                    <div class="flex items-center gap-4 px-5 py-4">
                      <div
                        class="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"
                      >
                        <app-icon name="alert" [size]="18" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="font-black text-slate-800">
                          {{ labelOf('violationType', item.violationType) }}
                        </p>
                        <p class="mt-1 text-xs text-slate-400">
                          {{ item.loggedAt | date: 'HH:mm dd/MM/yyyy' }} · +{{
                            item.penaltyPointsAdded
                          }}
                          điểm
                        </p>
                      </div>
                      <app-status-badge [value]="item.status" domain="violation" />
                    </div>
                  }
                </div>
              </article>
            }
          </div>

          <aside class="space-y-5">
            <article class="card-surface p-5">
              <p class="text-xs font-black tracking-[.15em] text-violet-500 uppercase">Người đặt</p>
              <div class="mt-4 flex items-center gap-3">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 font-black text-violet-700"
                >
                  {{ initials(booking()!.userName || 'U') }}
                </div>
                <div>
                  <p class="font-black text-slate-900">
                    {{ booking()!.userName || 'Chưa xác định người đặt' }}
                  </p>
                </div>
              </div>
            </article>
            <article class="card-surface p-5">
              <p class="text-xs font-black tracking-[.15em] text-slate-400 uppercase">Xét duyệt</p>
              <div class="mt-4 space-y-4">
                <div>
                  <p class="text-xs text-slate-400">Người duyệt</p>
                  <p class="mt-1 font-bold text-slate-800">
                    {{ booking()!.approvedByName || 'Chưa duyệt' }}
                  </p>
                </div>
                <div class="h-px bg-slate-100"></div>
                <div>
                  <p class="text-xs text-slate-400">Thời gian duyệt</p>
                  <p class="mt-1 font-bold text-slate-800">
                    {{
                      booking()!.approvedAt
                        ? (booking()!.approvedAt | date: 'HH:mm dd/MM/yyyy')
                        : '—'
                    }}
                  </p>
                </div>
              </div>
            </article>
            @if (canManageConcluded()) {
              <article class="rounded-[24px] border border-indigo-200 bg-indigo-50 p-5">
                <p class="font-black text-indigo-900">Hoàn tất nghiệp vụ</p>
                <p class="mt-2 text-sm leading-6 text-indigo-800/70">
                  Nút chỉ được bật khi lịch đặt đáp ứng đúng điều kiện thời gian và nhật ký sử dụng.
                </p>
                <div class="mt-4 grid gap-2">
                  <button
                    class="btn-primary"
                    [disabled]="!canComplete()"
                    [title]="completeHint()"
                    (click)="action('complete')"
                  >
                    <app-icon name="check" [size]="16" /> Đánh dấu hoàn thành</button
                  ><button
                    class="btn-secondary btn-danger"
                    [disabled]="!canNoShow()"
                    [title]="noShowHint()"
                    (click)="action('no-show')"
                  >
                    <app-icon name="alert" [size]="16" /> Đánh dấu không đến
                  </button>
                </div>
              </article>
            }
          </aside>
        </div>

        <app-modal
          [open]="rejectOpen()"
          title="Từ chối booking"
          subtitle="Lý do sẽ được lưu và gửi thông báo cho người đặt."
          (close)="rejectOpen.set(false)"
          ><label class="field-label">Lý do từ chối *</label
          ><textarea
            class="textarea-shell"
            [(ngModel)]="rejectionReason"
            placeholder="Nêu rõ lý do để người dùng có thể điều chỉnh..."
          ></textarea>
          <div class="mt-5 flex justify-end gap-2">
            <button class="btn-secondary" (click)="rejectOpen.set(false)">Hủy</button
            ><button class="btn-primary" [disabled]="!rejectionReason.trim()" (click)="reject()">
              Xác nhận từ chối
            </button>
          </div></app-modal
        >
        <app-modal
          [open]="incidentOpen()"
          title="Báo sự cố sử dụng"
          subtitle="Sự cố sẽ chờ quản lý phòng thí nghiệm xác nhận nếu cần."
          (close)="incidentOpen.set(false)"
          ><div class="grid gap-4">
            <div>
              <label class="field-label">Loại sự cố</label
              ><select class="input-shell" [(ngModel)]="incidentStatus">
                <option [ngValue]="2">Báo hư hỏng</option>
                <option [ngValue]="3">Trả muộn</option>
                <option [ngValue]="4">Thiếu thiết bị</option>
                <option [ngValue]="5">Khác</option>
              </select>
            </div>
            <div>
              <label class="field-label">Thiết bị ảnh hưởng</label
              ><select
                class="input-shell"
                [(ngModel)]="affectedEquipmentId"
                [disabled]="incidentEquipmentsLoading()"
              >
                <option [ngValue]="null">
                  {{
                    incidentEquipmentRequired()
                      ? incidentEquipments().length
                        ? 'Chọn thiết bị'
                        : 'Không có thiết bị'
                      : 'Không xác định'
                  }}
                </option>
                @for (equipment of incidentEquipments(); track equipment.equipmentId) {
                  <option [ngValue]="equipment.equipmentId">
                    {{ equipment.equipmentName }}
                  </option>
                }
              </select>
            </div>
            <div>
              <label class="field-label">Mô tả chi tiết</label
              ><textarea class="textarea-shell" [(ngModel)]="incidentDescription"></textarea>
            </div>
            <div class="flex justify-end gap-2">
              <button class="btn-secondary" (click)="incidentOpen.set(false)">Hủy</button
              ><button
                class="btn-primary"
                [disabled]="
                  !incidentDescription.trim() ||
                  incidentEquipmentsLoading() ||
                  (incidentEquipmentRequired() && !affectedEquipmentId)
                "
                (click)="reportIncident()"
              >
                Gửi báo cáo
              </button>
            </div>
          </div></app-modal
        >
      }
    </section>
  `,
})
export class BookingDetailPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly toast = inject(ToastService)
  protected readonly store = inject(AuthStore)
  protected readonly booking = signal<BookingDetailResponse | null>(null)
  protected readonly logs = signal<UsageLogResponse[]>([])
  protected readonly violations = signal<ViolationResponse[]>([])
  protected readonly incidentEquipments = signal<EquipmentResponse[]>([])
  protected readonly incidentEquipmentsLoading = signal(false)
  protected readonly loading = signal(true)
  protected readonly acting = signal(false)
  protected readonly rejectOpen = signal(false)
  protected readonly incidentOpen = signal(false)
  protected rejectionReason = ''
  protected incidentStatus = 2
  protected incidentDescription = ''
  protected affectedEquipmentId: number | null = null
  protected readonly labelOf = labelOf
  private id = 0
  private incidentLogId = 0
  protected readonly durationHours = computed(() => {
    const item = this.booking()
    return item
      ? Math.round((+new Date(item.endTime) - +new Date(item.startTime)) / 360000) / 10
      : 0
  })

  protected pageTitle(): string {
    const item = this.booking()
    if (!item || this.store.isRequester()) return 'Chi tiết lịch đặt'
    return `Booking #BK-${item.bookingId.toString().padStart(5, '0')}`
  }

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('bookingId'))
    this.load()
  }
  protected canApprove(): boolean {
    return Boolean(this.store.isManager() && this.booking()?.status === 'Pending')
  }

  protected isOwnerRequester(): boolean {
    const item = this.booking()
    const user = this.store.user()
    return Boolean(item && user && this.store.isRequester() && item.userId === user.userId)
  }
  protected canEdit(): boolean {
    const item = this.booking()
    return Boolean(item && item.status === 'Pending' && this.isOwnerRequester())
  }

  protected canCancel(): boolean {
    const item = this.booking()
    if (!item || !['Pending', 'Approved'].includes(item.status) || !this.isOwnerRequester()) {
      return false
    }
    if (item.status === 'Pending') return true
    const hasActiveUsage = this.logs().some((log) => !log.actualCheckout)
    return Date.now() < +new Date(item.startTime) && !hasActiveUsage
  }
  protected canCheckInBooking(): boolean {
    const item = this.booking()
    if (!item || !this.isOwnerRequester() || item.status !== 'Approved' || this.acting()) {
      return false
    }
    if (this.logs().some((log) => Boolean(log.actualCheckout))) return false

    const loggedItemIds = new Set(this.logs().map((log) => log.bookingItemId))
    const needsBatchCheckIn = item.items.some(
      (resource) => !loggedItemIds.has(resource.bookingItemId),
    )
    if (!needsBatchCheckIn) return false

    const now = Date.now()
    return (
      now >= +new Date(item.startTime) - 15 * 60_000 &&
      now <= Math.min(+new Date(item.startTime) + 30 * 60_000, +new Date(item.endTime))
    )
  }

  protected hasOpenUsage(): boolean {
    return this.logs().some((log) => !log.actualCheckout)
  }

  protected canCheckOutBooking(): boolean {
    const item = this.booking()
    if (!item || !this.isOwnerRequester() || item.status !== 'Approved' || this.acting()) {
      return false
    }
    const loggedItemIds = new Set(this.logs().map((log) => log.bookingItemId))
    return (
      this.hasOpenUsage() &&
      item.items.length > 0 &&
      item.items.every((resource) => loggedItemIds.has(resource.bookingItemId))
    )
  }
  protected canManageConcluded(): boolean {
    return Boolean(this.store.isManager() && this.booking()?.status === 'Approved')
  }

  protected canReportIncident(log: UsageLogResponse): boolean {
    return this.isOwnerRequester() && !log.actualCheckout
  }

  protected incidentEquipmentRequired(): boolean {
    return this.incidentStatus === 2 || this.incidentStatus === 4
  }

  protected canComplete(): boolean {
    const item = this.booking()
    if (!item || !this.canManageConcluded() || Date.now() < +new Date(item.endTime)) return false
    return this.logs().length > 0 && this.logs().every((log) => Boolean(log.actualCheckout))
  }

  protected completeHint(): string {
    if (this.canComplete()) return 'Đánh dấu booking hoàn thành'
    const item = this.booking()
    if (!item) return ''
    if (Date.now() < +new Date(item.endTime)) return 'Booking chưa kết thúc'
    if (!this.logs().length) return 'Booking chưa có lượt check-in'
    return 'Vẫn còn tài nguyên chưa check-out'
  }

  protected canNoShow(): boolean {
    const item = this.booking()
    if (!item || !this.canManageConcluded()) return false
    return Date.now() >= +new Date(item.startTime) + 30 * 60_000 && this.logs().length === 0
  }

  protected noShowHint(): string {
    if (this.canNoShow()) return 'Đánh dấu người dùng không đến'
    const item = this.booking()
    if (!item) return ''
    if (Date.now() < +new Date(item.startTime) + 30 * 60_000) {
      return 'Chỉ được đánh dấu không đến sau 30 phút kể từ giờ bắt đầu'
    }
    return 'Lịch đặt đã có lượt vào nên không thể đánh dấu không đến'
  }
  protected logFor(itemId: number): UsageLogResponse | undefined {
    return this.logs().find((log) => log.bookingItemId === itemId)
  }
  protected initials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((x) => x[0]?.toUpperCase() ?? '')
      .join('')
  }
  protected action(action: 'approve' | 'cancel' | 'complete' | 'no-show'): void {
    if (action === 'approve' && !this.canApprove()) {
      this.toast.info('Bạn không có quyền duyệt booking này')
      return
    }
    if (action === 'cancel' && !this.canCancel()) {
      this.toast.info('Booking không còn đủ điều kiện để hủy')
      return
    }
    if (action === 'complete' && !this.canComplete()) {
      this.toast.info(this.completeHint())
      return
    }
    if (action === 'no-show' && !this.canNoShow()) {
      this.toast.info(this.noShowHint())
      return
    }
    const bookingLabel = this.store.isRequester() ? 'booking này' : `booking #${this.id}`
    if (!confirm(`Xác nhận thao tác ${action} ${bookingLabel}?`)) return
    const request =
      action === 'approve'
        ? this.api.approveBooking(this.id)
        : action === 'cancel'
          ? this.api.cancelBooking(this.id)
          : action === 'complete'
            ? this.api.completeBooking(this.id)
            : this.api.noShowBooking(this.id)
    request.subscribe({
      next: () => {
        this.toast.success('Đã cập nhật booking')
        this.load()
      },
      error: (error: unknown) =>
        this.toast.error('Không thể cập nhật booking', apiErrorMessage(error)),
    })
  }
  protected reject(): void {
    if (!this.canApprove()) {
      this.rejectOpen.set(false)
      this.toast.info('Bạn không có quyền từ chối booking này')
      return
    }
    this.api.rejectBooking(this.id, this.rejectionReason.trim()).subscribe({
      next: () => {
        this.rejectOpen.set(false)
        this.toast.success('Đã từ chối booking')
        this.load()
      },
      error: () => this.toast.error('Không thể từ chối booking'),
    })
  }
  protected checkInBooking(): void {
    if (!this.canCheckInBooking()) {
      this.toast.info('Booking chưa đủ điều kiện để check-in')
      return
    }
    this.acting.set(true)
    this.api.checkInBooking(this.id).subscribe({
      next: () => {
        this.acting.set(false)
        this.toast.success(
          'Check-in booking thành công',
          'Phòng và toàn bộ thiết bị đã chọn được check-in cùng một lần.',
        )
        this.load()
      },
      error: (error: unknown) => {
        this.acting.set(false)
        this.toast.error(
          'Không thể check-in booking',
          apiErrorMessage(error, 'Kiểm tra khung giờ và trạng thái booking.'),
        )
      },
    })
  }

  protected checkOutBooking(): void {
    if (!this.canCheckOutBooking()) {
      this.toast.info('Booking chưa đủ điều kiện để check-out toàn bộ')
      return
    }
    if (!confirm('Xác nhận check-out toàn bộ phòng và thiết bị trong booking?')) return

    this.acting.set(true)
    this.api.checkOutBooking(this.id).subscribe({
      next: () => {
        this.acting.set(false)
        this.toast.success(
          'Check-out booking thành công',
          'Toàn bộ phòng và thiết bị đã được trả; booking đã hoàn tất.',
        )
        this.load()
      },
      error: (error: unknown) => {
        this.acting.set(false)
        this.toast.error('Không thể check-out toàn bộ booking', apiErrorMessage(error))
      },
    })
  }

  protected openIncident(log: UsageLogResponse): void {
    if (!this.canReportIncident(log)) {
      this.toast.info('Bạn không có quyền báo sự cố cho booking này')
      return
    }
    this.incidentLogId = log.logId
    this.incidentStatus = 2
    this.incidentDescription = ''
    this.affectedEquipmentId = null
    this.incidentEquipments.set([])
    this.incidentEquipmentsLoading.set(false)
    this.incidentOpen.set(true)

    const bookingItem = this.booking()?.items.find(
      (item) => item.bookingItemId === log.bookingItemId,
    )
    if (!bookingItem) return

    if (bookingItem.equipmentId) {
      this.affectedEquipmentId = bookingItem.equipmentId
      this.incidentEquipments.set([
        {
          equipmentId: bookingItem.equipmentId,
          labId: bookingItem.labId ?? 0,
          equipmentName: bookingItem.equipmentName ?? 'Thiết bị',
          status: '',
        },
      ])
      return
    }

    if (!bookingItem.labId) return
    const requestedLogId = log.logId
    this.incidentEquipmentsLoading.set(true)
    this.api.equipmentsByLab(bookingItem.labId).subscribe({
      next: (equipments) => {
        if (this.incidentLogId !== requestedLogId) return
        this.incidentEquipments.set(equipments)
        this.incidentEquipmentsLoading.set(false)
      },
      error: (error: unknown) => {
        if (this.incidentLogId !== requestedLogId) return
        this.incidentEquipmentsLoading.set(false)
        this.toast.error('Không tải được thiết bị', apiErrorMessage(error))
      },
    })
  }
  protected reportIncident(): void {
    const log = this.logs().find((item) => item.logId === this.incidentLogId)
    if (!log || !this.canReportIncident(log)) {
      this.incidentOpen.set(false)
      this.toast.info('Bạn không có quyền báo sự cố cho booking này')
      return
    }
    if (this.incidentEquipmentRequired() && !this.affectedEquipmentId) {
      this.toast.info('Chọn thiết bị')
      return
    }
    this.api
      .reportIncident(this.incidentLogId, {
        incidentStatus: this.incidentStatus,
        incidentDescription: this.incidentDescription.trim(),
        affectedEquipmentId: this.affectedEquipmentId,
      })
      .subscribe({
        next: () => {
          this.incidentOpen.set(false)
          this.toast.success('Đã gửi báo cáo sự cố')
          this.load()
        },
        error: () => this.toast.error('Không thể gửi báo cáo sự cố'),
      })
  }
  private load(): void {
    this.loading.set(true)
    forkJoin({
      booking: this.api.booking(this.id),
      logs: this.api.usageLogsByBooking(this.id).pipe(
        catchError((error: unknown) => {
          this.toast.info('Không tải được nhật ký sử dụng', apiErrorMessage(error))
          return of([] as UsageLogResponse[])
        }),
      ),
      violations: this.api.violationsByBooking(this.id).pipe(
        catchError((error: unknown) => {
          this.toast.info('Không tải được vi phạm liên quan', apiErrorMessage(error))
          return of([] as ViolationResponse[])
        }),
      ),
    }).subscribe({
      next: ({ booking, logs, violations }) => {
        this.booking.set(booking)
        this.logs.set(logs)
        this.violations.set(violations)
        this.loading.set(false)
      },
      error: () => {
        this.booking.set(null)
        this.loading.set(false)
      },
    })
  }
}
