import { DatePipe, NgClass } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { SystemService } from '../../core/api/system.service'
import type {
  EquipmentResponse,
  LabRoomResponse,
  MaintenanceResponse,
} from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'
import { labelOf, toDateInput } from '../../shared/utils/presentation'

@Component({
  selector: 'app-maintenances-page',
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
  template: `<section class="space-y-6">
    <app-page-header
      [title]="canManage() ? 'Quản lý bảo trì' : 'Lịch bảo trì tài nguyên'"
      subtitle="Theo dõi lịch đơn lẻ và định kỳ, trạng thái thực hiện và tài nguyên bị khóa."
    >
      @if (canManage()) {
        <a routerLink="/app/management/maintenances/new" class="btn-primary"
          ><app-icon name="plus" [size]="17" /> Tạo lịch bảo trì</a
        >
      }
      <a routerLink="/app/calendar" class="btn-secondary"
        ><app-icon name="calendar" [size]="17" /> Xem lịch</a
      ></app-page-header
    >
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="kpi-card">
        <p class="text-xs font-bold text-slate-400">Tổng lịch</p>
        <p class="mt-2 text-3xl font-black text-slate-950">{{ items().length }}</p>
      </div>
      <div class="kpi-card">
        <p class="text-xs font-bold text-slate-400">Đã lên lịch</p>
        <p class="mt-2 text-3xl font-black text-amber-600">{{ count('Scheduled') }}</p>
      </div>
      <div class="kpi-card">
        <p class="text-xs font-bold text-slate-400">Đang thực hiện</p>
        <p class="mt-2 text-3xl font-black text-indigo-600">{{ count('InProgress') }}</p>
      </div>
      <div class="kpi-card">
        <p class="text-xs font-bold text-slate-400">Hoàn thành</p>
        <p class="mt-2 text-3xl font-black text-emerald-600">{{ count('Completed') }}</p>
      </div>
    </div>
    <div class="filter-bar md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
      <div>
        <label class="field-label">Phòng lab</label
        ><select class="input-shell" [(ngModel)]="labId">
          <option [ngValue]="null">Tất cả phòng</option>
          @for (lab of labs(); track lab.labId) {
            <option [ngValue]="lab.labId">{{ lab.labName }}</option>
          }
        </select>
      </div>
      <div>
        <label class="field-label">Thiết bị</label
        ><select class="input-shell" [(ngModel)]="equipmentId">
          <option [ngValue]="null">Tất cả thiết bị</option>
          @for (eq of filteredEquipmentOptions(); track eq.equipmentId) {
            <option [ngValue]="eq.equipmentId">{{ eq.equipmentName }}</option>
          }
        </select>
      </div>
      <div>
        <label class="field-label">Trạng thái</label
        ><select class="input-shell" [(ngModel)]="status">
          <option value="">Tất cả</option>
          <option value="Scheduled">Đã lên lịch</option>
          <option value="InProgress">Đang thực hiện</option>
          <option value="Completed">Hoàn thành</option>
          <option value="Cancelled">Đã hủy</option>
        </select>
      </div>
      <div>
        <label class="field-label">Từ ngày</label
        ><input class="input-shell" type="date" [(ngModel)]="from" />
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
          <h2 class="font-black text-slate-950">Lịch bảo trì</h2>
          <p class="mt-1 text-xs text-slate-400">{{ filtered().length }} bản ghi</p>
        </div>
        <div class="inline-flex rounded-2xl bg-slate-100 p-1">
          <button
            class="rounded-xl px-3 py-2 text-xs font-black"
            [ngClass]="view() === 'table' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'"
            (click)="view.set('table')"
          >
            Bảng</button
          ><button
            class="rounded-xl px-3 py-2 text-xs font-black"
            [ngClass]="view() === 'cards' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'"
            (click)="view.set('cards')"
          >
            Thẻ
          </button>
        </div>
      </header>
      @if (loading()) {
        <div class="p-6"><div class="skeleton h-80 rounded-2xl"></div></div>
      } @else if (filtered().length === 0) {
        <div class="p-6">
          <app-data-state
            title="Không có lịch bảo trì"
            message="Không có bản ghi nào khớp bộ lọc hiện tại."
            icon="wrench"
          />
        </div>
      } @else if (view() === 'table') {
        <div class="overflow-x-auto">
          <table class="table-shell">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tài nguyên</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Lặp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of filtered(); track item.maintenanceId) {
                <tr>
                  <td class="font-black text-slate-900">
                    #MT-{{ item.maintenanceId.toString().padStart(4, '0') }}
                  </td>
                  <td>
                    <p class="font-bold text-slate-800">{{ resourceName(item) }}</p>
                    <p class="mt-1 text-xs text-slate-400">
                      {{ item.labId ? 'Phòng lab' : 'Thiết bị' }}
                    </p>
                  </td>
                  <td>
                    <p class="font-bold text-slate-700">
                      {{ item.startTime | date: 'HH:mm dd/MM/yyyy' }}
                    </p>
                    <p class="mt-1 text-xs text-slate-400">
                      {{ item.endTime | date: 'HH:mm dd/MM/yyyy' }}
                    </p>
                  </td>
                  <td><app-status-badge [value]="item.status" domain="maintenance" /></td>
                  <td>
                    {{ labelOf('recurrence', item.recurrenceType) }}
                    @if (item.recurrenceInterval > 1) {
                      · mỗi {{ item.recurrenceInterval }} kỳ
                    }
                  </td>
                  <td>
                    <a
                      [routerLink]="['/app/management/maintenances', item.maintenanceId]"
                      class="btn-secondary h-9 min-h-9 px-3"
                      >Chi tiết</a
                    >
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          @for (item of filtered(); track item.maintenanceId) {
            <a
              [routerLink]="['/app/management/maintenances', item.maintenanceId]"
              class="rounded-[24px] border border-slate-200 p-5 transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"
              ><div class="flex items-start justify-between">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
                >
                  <app-icon name="wrench" [size]="22" />
                </div>
                <app-status-badge [value]="item.status" domain="maintenance" />
              </div>
              <p class="mt-5 text-lg font-black text-slate-950">{{ resourceName(item) }}</p>
              <p class="mt-2 text-xs text-slate-400">
                #MT-{{ item.maintenanceId }} · {{ labelOf('recurrence', item.recurrenceType) }}
              </p>
              <div class="mt-4 rounded-2xl bg-slate-50 p-4">
                <p class="text-sm font-black text-slate-700">
                  {{ item.startTime | date: 'HH:mm dd/MM/yyyy' }}
                </p>
                <p class="mt-1 text-xs text-slate-400">
                  đến {{ item.endTime | date: 'HH:mm dd/MM/yyyy' }}
                </p>
              </div></a
            >
          }
        </div>
      }
    </article>
  </section>`,
})
export class MaintenancesPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly toast = inject(ToastService)
  protected readonly store = inject(AuthStore)
  protected readonly items = signal<MaintenanceResponse[]>([])
  protected readonly labs = signal<LabRoomResponse[]>([])
  protected readonly equipments = signal<EquipmentResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly view = signal<'table' | 'cards'>('table')
  protected labId: number | null = null
  protected equipmentId: number | null = null
  protected status = ''
  protected from = ''
  protected readonly labelOf = labelOf
  protected readonly canManage = computed(() => this.store.isManager() || this.store.isAdmin())
  protected filteredEquipmentOptions(): EquipmentResponse[] {
    return this.labId
      ? this.equipments().filter((item) => item.labId === this.labId)
      : this.equipments()
  }

  protected filtered(): MaintenanceResponse[] {
    return this.items()
      .filter(
        (item) =>
          (!this.labId ||
            item.labId === this.labId ||
            this.equipments().some(
              (equipment) =>
                equipment.equipmentId === item.equipmentId && equipment.labId === this.labId,
            )) &&
          (!this.equipmentId || item.equipmentId === this.equipmentId) &&
          (!this.status || item.status === this.status) &&
          (!this.from || toDateInput(new Date(item.startTime)) >= this.from),
      )
      .sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime))
  }
  ngOnInit(): void {
    this.api.labs().subscribe((x) => this.labs.set(x))
    this.api.equipments().subscribe((x) => this.equipments.set(x))
    this.load()
  }
  protected load(): void {
    this.loading.set(true)
    this.api.maintenances().subscribe({
      next: (x) => {
        this.items.set(x)
        this.loading.set(false)
      },
      error: () => {
        this.loading.set(false)
        this.toast.error('Không tải được lịch bảo trì')
      },
    })
  }
  protected count(status: string): number {
    return this.items().filter((x) => x.status === status).length
  }
  protected resourceName(item: MaintenanceResponse): string {
    if (item.labId)
      return this.labs().find((x) => x.labId === item.labId)?.labName ?? `Phòng #${item.labId}`
    return (
      this.equipments().find((x) => x.equipmentId === item.equipmentId)?.equipmentName ??
      `Thiết bị #${item.equipmentId}`
    )
  }
  protected reset(): void {
    this.labId = null
    this.equipmentId = null
    this.status = ''
    this.from = ''
  }
}
