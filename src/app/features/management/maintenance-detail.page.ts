import { DatePipe } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { SystemService } from '../../core/api/system.service'
import type {
  EquipmentResponse,
  LabRoomResponse,
  MaintenanceDetailResponse,
} from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'
import { formatMoney, labelOf } from '../../shared/utils/presentation'

@Component({
  selector: 'app-maintenance-detail-page',
  imports: [
    DatePipe,
    RouterLink,
    PageHeaderComponent,
    IconComponent,
    StatusBadgeComponent,
    DataStateComponent,
  ],
  template: `<section class="space-y-6">
    @if (loading()) {
      <div class="card-surface p-7">
        <div class="skeleton h-8 w-1/3 rounded"></div>
        <div class="skeleton mt-5 h-80 rounded-3xl"></div>
      </div>
    } @else if (!item()) {
      <app-data-state
        title="Không tìm thấy lịch bảo trì"
        message="Bản ghi không tồn tại hoặc ngoài phạm vi truy cập."
        icon="wrench"
        ><a routerLink="/app/management/maintenances" class="btn-primary mt-5"
          >Về danh sách</a
        ></app-data-state
      >
    } @else {
      <app-page-header
        [title]="'Bảo trì #MT-' + item()!.maintenanceId.toString().padStart(4, '0')"
        [subtitle]="resourceName() + ' · ' + labelOf('recurrence', item()!.recurrenceType)"
      >
        @if (canManage() && item()!.status === 'Scheduled') {
          <a
            [routerLink]="['/app/management/maintenances', item()!.maintenanceId, 'edit']"
            class="btn-secondary"
            ><app-icon name="edit" [size]="17" /> Chỉnh sửa</a
          ><button
            class="btn-primary"
            [disabled]="!canStart()"
            [title]="startHint()"
            (click)="action('start')"
          >
            <app-icon name="play" [size]="17" /> Bắt đầu
          </button>
        }
        @if (canManage() && item()!.status === 'InProgress') {
          <button class="btn-primary" (click)="action('complete')">
            <app-icon name="check" [size]="17" /> Hoàn thành
          </button>
        }
      </app-page-header>
      <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div class="space-y-6">
          <article class="card-surface p-6 sm:p-7">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-black tracking-[.16em] text-amber-500 uppercase">
                  Thông tin lịch bảo trì
                </p>
                <h2 class="mt-2 text-2xl font-black text-slate-950">{{ resourceName() }}</h2>
              </div>
              <app-status-badge [value]="item()!.status" domain="maintenance" />
            </div>
            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl bg-slate-50 p-5">
                <p class="text-[10px] font-black text-slate-400 uppercase">Bắt đầu</p>
                <p class="mt-2 font-black text-slate-900">
                  {{ item()!.startTime | date: 'HH:mm dd/MM/yyyy' }}
                </p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-5">
                <p class="text-[10px] font-black text-slate-400 uppercase">Kết thúc</p>
                <p class="mt-2 font-black text-slate-900">
                  {{ item()!.endTime | date: 'HH:mm dd/MM/yyyy' }}
                </p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-5">
                <p class="text-[10px] font-black text-slate-400 uppercase">Thời lượng</p>
                <p class="mt-2 font-black text-slate-900">{{ duration() }} giờ</p>
              </div>
              <div class="rounded-2xl bg-slate-50 p-5">
                <p class="text-[10px] font-black text-slate-400 uppercase">Chi phí</p>
                <p class="mt-2 font-black text-slate-900">
                  {{ formatMoney(item()!.maintenanceCost) }}
                </p>
              </div>
            </div>
            <div class="mt-5 rounded-2xl border border-slate-200 p-5">
              <p class="text-xs font-black text-slate-700">Ghi chú</p>
              <p class="mt-2 text-sm leading-7 whitespace-pre-line text-slate-500">
                {{ item()!.notes || 'Không có ghi chú.' }}
              </p>
            </div>
          </article>
          <article class="card-surface p-6">
            <h2 class="font-black text-slate-950">Cấu hình định kỳ</h2>
            <div class="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p class="text-xs text-slate-400">Loại lặp</p>
                <p class="mt-1 font-black text-slate-800">
                  {{ labelOf('recurrence', item()!.recurrenceType) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-400">Khoảng lặp</p>
                <p class="mt-1 font-black text-slate-800">{{ item()!.recurrenceInterval }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400">Kết thúc chuỗi</p>
                <p class="mt-1 font-black text-slate-800">
                  {{
                    item()!.recurrenceEndDate
                      ? (item()!.recurrenceEndDate | date: 'dd/MM/yyyy HH:mm')
                      : '—'
                  }}
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-400">Parent ID</p>
                <p class="mt-1 font-black text-slate-800">
                  {{ item()!.parentMaintenanceId ?? '—' }}
                </p>
              </div>
            </div>
          </article>
        </div>
        <aside class="space-y-5">
          <article class="card-surface p-5">
            <p class="text-xs font-black tracking-[.16em] text-violet-500 uppercase">Người tạo</p>
            <p class="mt-3 text-lg font-black text-slate-900">User #{{ item()!.createdById }}</p>
          </article>
          @if (canManage() && ['Scheduled', 'InProgress'].includes(item()!.status)) {
            <article class="rounded-[24px] border border-rose-200 bg-rose-50 p-5">
              <p class="font-black text-rose-900">Hủy lịch bảo trì</p>
              <p class="mt-2 text-sm leading-6 text-rose-800/75">
                Hủy một kỳ không dừng các kỳ sau. Hủy cả chuỗi sẽ dừng toàn bộ lịch định kỳ còn hoạt
                động.
              </p>
              <div class="mt-4 grid gap-2">
                <button class="btn-secondary btn-danger" (click)="action('cancel')">
                  Hủy lần này
                </button>
                @if (item()!.recurrenceType !== 'None' && !item()!.recurrenceStopped) {
                  <button class="btn-secondary btn-danger" (click)="action('cancel-series')">
                    Hủy cả chuỗi
                  </button>
                }
              </div>
            </article>
          }
        </aside>
      </div>
    }
  </section>`,
})
export class MaintenanceDetailPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly toast = inject(ToastService)
  private readonly store = inject(AuthStore)
  protected readonly item = signal<MaintenanceDetailResponse | null>(null)
  protected readonly labs = signal<LabRoomResponse[]>([])
  protected readonly equipments = signal<EquipmentResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly labelOf = labelOf
  protected readonly formatMoney = formatMoney
  private id = 0
  protected readonly canManage = computed(() => this.store.isManager())
  protected readonly resourceName = computed(() => {
    const item = this.item()
    if (!item) return ''
    if (item.labId)
      return this.labs().find((x) => x.labId === item.labId)?.labName ?? `Phòng #${item.labId}`
    return (
      this.equipments().find((x) => x.equipmentId === item.equipmentId)?.equipmentName ??
      `Thiết bị #${item.equipmentId}`
    )
  })
  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'))
    this.api.labs().subscribe((x) => this.labs.set(x))
    this.api.equipments().subscribe((x) => this.equipments.set(x))
    this.load()
  }
  protected duration(): number {
    const x = this.item()
    return x ? Math.round((+new Date(x.endTime) - +new Date(x.startTime)) / 360000) / 10 : 0
  }

  protected canStart(): boolean {
    const current = this.item()
    if (!current || current.status !== 'Scheduled') return false
    const now = Date.now()
    return now >= +new Date(current.startTime) && now < +new Date(current.endTime)
  }

  protected startHint(): string {
    if (this.canStart()) return 'Bắt đầu lịch bảo trì'
    const current = this.item()
    if (!current) return ''
    if (Date.now() < +new Date(current.startTime)) return 'Chưa đến thời gian bắt đầu'
    return 'Lịch bảo trì đã quá thời gian kết thúc'
  }

  protected action(action: 'start' | 'complete' | 'cancel' | 'cancel-series'): void {
    if (action === 'start' && !this.canStart()) {
      this.toast.info(this.startHint())
      return
    }
    if (!confirm(`Xác nhận ${action} lịch bảo trì #${this.id}?`)) return
    const request =
      action === 'start'
        ? this.api.startMaintenance(this.id)
        : action === 'complete'
          ? this.api.completeMaintenance(this.id)
          : action === 'cancel'
            ? this.api.cancelMaintenance(this.id)
            : this.api.cancelMaintenanceSeries(this.id)
    request.subscribe({
      next: () => {
        this.toast.success('Đã cập nhật lịch bảo trì')
        this.load()
      },
      error: () => this.toast.error('Không thể cập nhật lịch bảo trì'),
    })
  }
  private load(): void {
    this.loading.set(true)
    this.api.maintenance(this.id).subscribe({
      next: (x) => {
        this.item.set(x)
        this.loading.set(false)
      },
      error: () => {
        this.loading.set(false)
        this.item.set(null)
      },
    })
  }
}
