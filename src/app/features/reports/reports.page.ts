import { DatePipe, DecimalPipe, NgClass } from '@angular/common'
import { Component, OnInit, computed, inject, input, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Observable, catchError, forkJoin, of } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import type {
  CategoryCountResponse,
  DepartmentUtilizationResponse,
  MaintenanceCostResponse,
  MostUsedResourceResponse,
  NoShowRateResponse,
  PagedMaintenanceHistoryResponse,
  PenaltyUserReportResponse,
  ResourceUtilizationResponse,
  UsageTrendResponse,
  ViolationSummaryResponse,
} from '../../core/api/system.models'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'
import { formatMoney, toDateInput } from '../../shared/utils/presentation'

@Component({
  selector: 'app-report-bars',
  imports: [DecimalPipe],
  template: `
    <article class="card-surface p-6">
      <h2 class="font-black text-slate-950">{{ title() }}</h2>
      @if (items().length === 0) {
        <div class="py-14 text-center text-sm font-semibold text-slate-400">Chưa có dữ liệu.</div>
      } @else {
        <div class="mt-6 space-y-5">
          @for (item of items(); track item.key) {
            <div>
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="truncate font-bold text-slate-600">{{
                  item.displayName || item.key
                }}</span
                ><strong class="shrink-0 text-slate-900"
                  >{{ item.count }} · {{ item.percentage | number: '1.1-1' }}%</strong
                >
              </div>
              <div class="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-linear-to-r from-violet-500 to-cyan-400"
                  [style.width.%]="item.percentage"
                ></div>
              </div>
            </div>
          }
        </div>
      }
    </article>
  `,
})
export class ReportBarsComponent {
  readonly title = input('')
  readonly items = input<CategoryCountResponse[]>([])
}

@Component({
  selector: 'app-utilization-table',
  imports: [DecimalPipe],
  template: `
    <article class="card-surface overflow-hidden">
      <header class="border-b border-slate-100 px-5 py-5">
        <h2 class="font-black text-slate-950">{{ title() }}</h2>
      </header>
      @if (items().length === 0) {
        <div class="p-10 text-center text-sm font-semibold text-slate-400">Chưa có dữ liệu.</div>
      } @else {
        <div class="overflow-x-auto">
          <table class="table-shell">
            <thead>
              <tr>
                <th>Tài nguyên</th>
                <th>Booking</th>
                <th>Giờ đặt</th>
                <th>Giờ dùng</th>
                <th>Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.resourceType + item.resourceId) {
                <tr>
                  <td>
                    <p class="font-black text-slate-800">{{ item.resourceName }}</p>
                    <p class="mt-1 text-xs text-slate-400">
                      {{ item.labName || item.resourceType }}
                    </p>
                  </td>
                  <td>{{ item.bookingCount }}</td>
                  <td>{{ item.reservedHours | number: '1.1-1' }}h</td>
                  <td>{{ item.actualUsageHours | number: '1.1-1' }}h</td>
                  <td>
                    <span class="font-black text-violet-700"
                      >{{ item.utilizationRate | number: '1.1-2' }}%</span
                    >
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </article>
  `,
})
export class UtilizationTableComponent {
  readonly title = input('')
  readonly items = input<ResourceUtilizationResponse[]>([])
}

@Component({
  selector: 'app-ranking-card',
  imports: [DecimalPipe, IconComponent],
  template: `
    <article class="card-surface overflow-hidden">
      <header class="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"
        >
          <app-icon [name]="icon()" [size]="19" />
        </div>
        <h2 class="font-black text-slate-950">{{ title() }}</h2>
      </header>
      <div class="divide-y divide-slate-100">
        @for (item of items(); track item.resourceType + item.resourceId; let rank = $index) {
          <div class="flex items-center gap-4 px-5 py-4">
            <span
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 font-black text-slate-600"
              >{{ rank + 1 }}</span
            >
            <div class="min-w-0 flex-1">
              <p class="truncate font-black text-slate-800">{{ item.resourceName }}</p>
              <p class="mt-1 text-xs text-slate-400">
                {{ item.usageCount }} lượt · {{ item.actualUsageHours | number: '1.1-1' }} giờ
              </p>
            </div>
            <strong class="text-violet-700">{{ item.bookingCount }}</strong>
          </div>
        } @empty {
          <div class="px-5 py-12 text-center text-sm font-semibold text-slate-400">
            Chưa có dữ liệu.
          </div>
        }
      </div>
    </article>
  `,
})
export class RankingCardComponent {
  readonly title = input('')
  readonly icon = input('chart')
  readonly items = input<MostUsedResourceResponse[]>([])
}

@Component({
  selector: 'app-cost-card',
  template: `
    <article class="card-surface overflow-hidden">
      <header class="border-b border-slate-100 px-5 py-5">
        <h2 class="font-black text-slate-950">{{ title() }}</h2>
      </header>
      <div class="divide-y divide-slate-100">
        @for (item of items(); track item.resourceType + item.resourceId) {
          <div class="flex items-center gap-4 px-5 py-4">
            <div class="min-w-0 flex-1">
              <p class="truncate font-black text-slate-800">{{ item.resourceName }}</p>
              <p class="mt-1 text-xs text-slate-400">{{ item.maintenanceCount }} lần bảo trì</p>
            </div>
            <strong class="text-amber-700">{{ money(item.totalCost) }}</strong>
          </div>
        } @empty {
          <div class="px-5 py-12 text-center text-sm font-semibold text-slate-400">
            Chưa có dữ liệu.
          </div>
        }
      </div>
    </article>
  `,
})
export class CostCardComponent {
  readonly title = input('')
  readonly items = input<MaintenanceCostResponse[]>([])
  protected readonly money = formatMoney
}

@Component({
  selector: 'app-trend-card',
  imports: [DatePipe, DecimalPipe],
  template: `
    <article class="card-surface p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-black text-slate-950">Xu hướng sử dụng</h2>
          <p class="mt-1 text-xs text-slate-400">Lượt và tổng giờ sử dụng theo kỳ</p>
        </div>
        <span class="rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700"
          >{{ totalHours() | number: '1.1-1' }} giờ</span
        >
      </div>
      @if (items().length === 0) {
        <div class="py-16 text-center text-sm font-semibold text-slate-400">
          Chưa có dữ liệu xu hướng.
        </div>
      } @else {
        <div class="mt-8 flex h-64 items-end gap-2 overflow-x-auto border-b border-slate-200 pb-px">
          @for (item of items(); track item.periodStart) {
            <div class="group flex h-full min-w-12 flex-1 flex-col justify-end">
              <div
                class="relative rounded-t-xl bg-linear-to-t from-violet-600 to-cyan-400 transition group-hover:brightness-110"
                [style.height.%]="height(item.usageCount)"
              >
                <div
                  class="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-600"
                >
                  {{ item.usageCount }}
                </div>
              </div>
              <p class="mt-2 truncate text-center text-[9px] font-bold text-slate-400">
                {{ item.periodStart | date: 'dd/MM' }}
              </p>
            </div>
          }
        </div>
      }
    </article>
  `,
})
export class TrendCardComponent {
  readonly items = input<UsageTrendResponse[]>([])
  protected totalHours(): number {
    return this.items().reduce((sum, item) => sum + item.totalUsageHours, 0)
  }
  protected height(value: number): number {
    const max = Math.max(1, ...this.items().map((item) => item.usageCount))
    return Math.max(6, (value / max) * 88)
  }
}

@Component({
  selector: 'app-reports-page',
  imports: [
    DatePipe,
    DecimalPipe,
    NgClass,
    FormsModule,
    PageHeaderComponent,
    IconComponent,
    StatusBadgeComponent,
    DataStateComponent,
    ReportBarsComponent,
    UtilizationTableComponent,
    RankingCardComponent,
    CostCardComponent,
    TrendCardComponent,
  ],
  template: `
    <section class="space-y-6">
      <app-page-header
        title="Trung tâm báo cáo"
        subtitle="Phân tích mức sử dụng, booking, bảo trì, vi phạm và xu hướng vận hành trong một workspace thống nhất."
      >
        <button class="btn-secondary" type="button" (click)="exportCurrent()">
          <app-icon name="download" [size]="17" /> Xuất CSV tab hiện tại
        </button>
      </app-page-header>

      <div class="filter-bar md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <div>
          <label class="field-label">Từ ngày</label
          ><input class="input-shell" type="date" [(ngModel)]="from" />
        </div>
        <div>
          <label class="field-label">Đến ngày</label
          ><input class="input-shell" type="date" [(ngModel)]="to" />
        </div>
        <div>
          <label class="field-label">Top N</label
          ><select class="input-shell" [(ngModel)]="top">
            <option [ngValue]="5">Top 5</option>
            <option [ngValue]="10">Top 10</option>
            <option [ngValue]="20">Top 20</option>
          </select>
        </div>
        <div>
          <label class="field-label">Nhóm xu hướng</label
          ><select class="input-shell" [(ngModel)]="groupBy">
            <option value="day">Theo ngày</option>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
          </select>
        </div>
        <div class="flex items-end">
          <button class="btn-primary w-full" type="button" (click)="load()">
            <app-icon name="refresh" [size]="17" /> Cập nhật
          </button>
        </div>
      </div>

      <div class="flex gap-2 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm">
        @for (item of tabs; track item.key) {
          <button
            class="shrink-0 rounded-xl px-4 py-2.5 text-xs font-black"
            [ngClass]="
              tab() === item.key
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                : 'text-slate-500 hover:bg-slate-50'
            "
            (click)="selectTab(item.key)"
          >
            {{ item.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="grid gap-5 md:grid-cols-2">
          <div class="skeleton h-80 rounded-[28px]"></div>
          <div class="skeleton h-80 rounded-[28px]"></div>
        </div>
      } @else {
        @if (tab() === 'overview') {
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div class="kpi-card">
              <p class="text-xs font-bold text-slate-400">Booking kết luận</p>
              <p class="mt-2 text-3xl font-black text-slate-950">
                {{ noShow().concludedBookingCount }}
              </p>
            </div>
            <div class="kpi-card">
              <p class="text-xs font-bold text-slate-400">Không đến</p>
              <p class="mt-2 text-3xl font-black text-rose-600">{{ noShow().noShowCount }}</p>
            </div>
            <div class="kpi-card">
              <p class="text-xs font-bold text-slate-400">Tỷ lệ không đến</p>
              <p class="mt-2 text-3xl font-black text-amber-600">
                {{ noShow().noShowRate | number: '1.1-2' }}%
              </p>
            </div>
            <div class="kpi-card">
              <p class="text-xs font-bold text-slate-400">Lượt sử dụng</p>
              <p class="mt-2 text-3xl font-black text-indigo-600">{{ totalUsage() }}</p>
            </div>
          </div>
          <div class="grid gap-6 xl:grid-cols-2">
            <app-report-bars
              title="Booking theo trạng thái"
              [items]="statusCounts()"
            /><app-report-bars title="Booking theo mục đích" [items]="purposeCounts()" />
          </div>
          <app-trend-card [items]="usageTrend()" />
        }
        @if (tab() === 'resources') {
          <div class="grid gap-6 xl:grid-cols-2">
            <app-utilization-table
              title="Mức sử dụng phòng lab"
              [items]="labUtilization()"
            /><app-utilization-table
              title="Mức sử dụng thiết bị"
              [items]="equipmentUtilization()"
            />
          </div>
        }
        @if (tab() === 'department') {
          <div class="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
            <app-report-bars title="Booking theo khoa/phòng ban" [items]="departmentCounts()" />
            <article class="card-surface overflow-hidden">
              <header class="border-b border-slate-100 px-5 py-5">
                <h2 class="font-black text-slate-950">Mức sử dụng theo khoa</h2>
              </header>
              <div class="overflow-x-auto">
                <table class="table-shell">
                  <thead>
                    <tr>
                      <th>Đơn vị</th>
                      <th>Booking</th>
                      <th>Giờ dùng</th>
                      <th>Tỷ lệ thật</th>
                      <th>Tỷ trọng</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of departmentUtilization(); track item.departmentId) {
                      <tr>
                        <td class="font-black text-slate-800">{{ item.departmentName }}</td>
                        <td>{{ item.bookingCount }}</td>
                        <td>{{ item.actualUsageHours | number: '1.1-1' }}h</td>
                        <td>{{ item.utilizationRate | number: '1.1-2' }}%</td>
                        <td>{{ item.usageSharePercentage | number: '1.1-2' }}%</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="5" class="py-10 text-center text-slate-400">
                          Chưa có dữ liệu.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        }
        @if (tab() === 'top') {
          <div class="grid gap-6 xl:grid-cols-2">
            <app-ranking-card
              title="Phòng lab dùng nhiều nhất"
              icon="building"
              [items]="mostLabs()"
            /><app-ranking-card
              title="Thiết bị dùng nhiều nhất"
              icon="microscope"
              [items]="mostEquipments()"
            />
          </div>
        }
        @if (tab() === 'maintenance') {
          <div class="grid gap-6 xl:grid-cols-2">
            <app-cost-card
              title="Chi phí theo phòng lab"
              [items]="maintenanceLabs()"
            /><app-cost-card title="Chi phí theo thiết bị" [items]="maintenanceEquipments()" />
          </div>
        }
        @if (tab() === 'history') {
          <article class="card-surface overflow-hidden">
            <header class="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h2 class="font-black text-slate-950">Lịch sử bảo trì</h2>
                <p class="mt-1 text-xs text-slate-400">
                  Tổng chi phí: {{ formatMoney(history().totalCost) }}
                </p>
              </div>
              <span class="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-black text-amber-700"
                >{{ history().totalCount }} bản ghi</span
              >
            </header>
            @if (history().items.length === 0) {
              <div class="p-6">
                <app-data-state
                  title="Không có lịch sử"
                  message="Không có maintenance trong khoảng thời gian đã chọn."
                  icon="wrench"
                />
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="table-shell">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Tài nguyên</th>
                      <th>Người tạo</th>
                      <th>Thời gian</th>
                      <th>Chi phí</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of history().items; track item.maintenanceId) {
                      <tr>
                        <td class="font-black">#MT-{{ item.maintenanceId }}</td>
                        <td>
                          <p class="font-black text-slate-800">{{ item.resourceName }}</p>
                          <p class="mt-1 text-xs text-slate-400">{{ item.resourceType }}</p>
                        </td>
                        <td>{{ item.createdByName }}</td>
                        <td>{{ item.startTime | date: 'dd/MM/yyyy HH:mm' }}</td>
                        <td>{{ formatMoney(item.maintenanceCost) }}</td>
                        <td><app-status-badge [value]="item.status" domain="maintenance" /></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </article>
        }
        @if (tab() === 'violations') {
          <div class="grid gap-4 sm:grid-cols-4">
            <div class="kpi-card">
              <p class="text-xs text-slate-400">Tổng vi phạm</p>
              <p class="mt-2 text-3xl font-black">{{ violations().totalCount }}</p>
            </div>
            <div class="kpi-card">
              <p class="text-xs text-slate-400">Active</p>
              <p class="mt-2 text-3xl font-black text-rose-600">{{ violations().activeCount }}</p>
            </div>
            <div class="kpi-card">
              <p class="text-xs text-slate-400">Resolved</p>
              <p class="mt-2 text-3xl font-black text-emerald-600">
                {{ violations().resolvedCount }}
              </p>
            </div>
            <div class="kpi-card">
              <p class="text-xs text-slate-400">Cancelled</p>
              <p class="mt-2 text-3xl font-black text-slate-500">
                {{ violations().cancelledCount }}
              </p>
            </div>
          </div>
          <div class="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
            <app-report-bars title="Vi phạm theo loại" [items]="violations().violationTypeCounts" />
            <article class="card-surface overflow-hidden">
              <header class="border-b border-slate-100 px-5 py-5">
                <h2 class="font-black text-slate-950">Người dùng nhiều điểm phạt</h2>
              </header>
              <div class="divide-y divide-slate-100">
                @for (item of penaltyUsers(); track item.userId; let rank = $index) {
                  <div class="flex items-center gap-4 px-5 py-4">
                    <span
                      class="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 font-black text-rose-700"
                      >{{ rank + 1 }}</span
                    >
                    <div class="min-w-0 flex-1">
                      <p class="font-black text-slate-800">{{ item.fullName }}</p>
                      <p class="mt-1 text-xs text-slate-400">
                        {{ item.departmentName }} · {{ item.totalViolationCount }} vi phạm
                      </p>
                    </div>
                    <span class="text-xl font-black text-rose-600">{{ item.penaltyPoints }}</span>
                  </div>
                } @empty {
                  <div class="px-5 py-12 text-center text-sm font-semibold text-slate-400">
                    Chưa có dữ liệu.
                  </div>
                }
              </div>
            </article>
          </div>
        }
        @if (tab() === 'trend') {
          <app-trend-card [items]="usageTrend()" />
        }
      }
    </section>
  `,
})
export class ReportsPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly toast = inject(ToastService)
  protected readonly loading = signal(true)
  protected readonly tab = signal('overview')
  protected from = ''
  protected to = ''
  protected top = 10
  protected groupBy = 'day'
  protected readonly formatMoney = formatMoney
  protected readonly statusCounts = signal<CategoryCountResponse[]>([])
  protected readonly purposeCounts = signal<CategoryCountResponse[]>([])
  protected readonly departmentCounts = signal<CategoryCountResponse[]>([])
  protected readonly labUtilization = signal<ResourceUtilizationResponse[]>([])
  protected readonly equipmentUtilization = signal<ResourceUtilizationResponse[]>([])
  protected readonly departmentUtilization = signal<DepartmentUtilizationResponse[]>([])
  protected readonly mostLabs = signal<MostUsedResourceResponse[]>([])
  protected readonly mostEquipments = signal<MostUsedResourceResponse[]>([])
  protected readonly maintenanceLabs = signal<MaintenanceCostResponse[]>([])
  protected readonly maintenanceEquipments = signal<MaintenanceCostResponse[]>([])
  protected readonly history = signal<PagedMaintenanceHistoryResponse>({
    from: '',
    to: '',
    totalCost: 0,
    totalCount: 0,
    pageNumber: 1,
    pageSize: 20,
    totalPages: 0,
    items: [],
  })
  protected readonly violations = signal<ViolationSummaryResponse>({
    totalCount: 0,
    activeCount: 0,
    resolvedCount: 0,
    cancelledCount: 0,
    violationTypeCounts: [],
    items: [],
  })
  protected readonly penaltyUsers = signal<PenaltyUserReportResponse[]>([])
  protected readonly noShow = signal<NoShowRateResponse>({
    noShowCount: 0,
    completedCount: 0,
    concludedBookingCount: 0,
    noShowRate: 0,
  })
  protected readonly usageTrend = signal<UsageTrendResponse[]>([])
  protected readonly tabs = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'resources', label: 'Mức sử dụng' },
    { key: 'department', label: 'Khoa/phòng ban' },
    { key: 'top', label: 'Top tài nguyên' },
    { key: 'maintenance', label: 'Chi phí bảo trì' },
    { key: 'history', label: 'Lịch sử bảo trì' },
    { key: 'violations', label: 'Vi phạm' },
    { key: 'trend', label: 'Xu hướng' },
  ]
  protected readonly totalUsage = computed(() =>
    this.usageTrend().reduce((sum, item) => sum + item.usageCount, 0),
  )

  ngOnInit(): void {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)
    this.from = toDateInput(from)
    this.to = toDateInput(to)
    this.load()
  }

  protected selectTab(key: string): void {
    if (this.tab() === key) return
    this.tab.set(key)
    this.load()
  }

  protected load(): void {
    if (!this.from || !this.to) return

    const fromDate = new Date(`${this.from}T00:00:00`)
    const toDate = new Date(`${this.to}T23:59:59`)
    if (fromDate > toDate) {
      this.toast.error('Khoảng ngày không hợp lệ', 'Ngày bắt đầu phải trước ngày kết thúc.')
      return
    }

    const from = fromDate.toISOString()
    const to = toDate.toISOString()
    this.loading.set(true)

    switch (this.tab()) {
      case 'resources':
        this.loadResources(from, to)
        break
      case 'department':
        this.loadDepartment(from, to)
        break
      case 'top':
        this.loadTopResources(from, to)
        break
      case 'maintenance':
        this.loadMaintenanceCosts(from, to)
        break
      case 'history':
        this.loadMaintenanceHistory(from, to)
        break
      case 'violations':
        this.loadViolations(from, to)
        break
      case 'trend':
        this.loadTrend(from, to)
        break
      default:
        this.loadOverview(from, to)
        break
    }
  }

  private loadOverview(from: string, to: string): void {
    const failed = { count: 0 }
    forkJoin({
      status: this.safe(
        this.api.reportBookingsByStatus(from, to),
        [] as CategoryCountResponse[],
        failed,
      ),
      purpose: this.safe(
        this.api.reportBookingsByPurpose(from, to),
        [] as CategoryCountResponse[],
        failed,
      ),
      noShow: this.safe(
        this.api.reportNoShow(from, to),
        {
          noShowCount: 0,
          completedCount: 0,
          concludedBookingCount: 0,
          noShowRate: 0,
        } as NoShowRateResponse,
        failed,
      ),
      trend: this.safe(
        this.api.reportUsageTrend(from, to, this.groupBy),
        [] as UsageTrendResponse[],
        failed,
      ),
    }).subscribe({
      next: (response) => {
        this.statusCounts.set(response.status)
        this.purposeCounts.set(response.purpose)
        this.noShow.set(response.noShow)
        this.usageTrend.set(response.trend)
        this.completeLoad(failed.count, 4)
      },
      error: () => this.failLoad(),
    })
  }

  private loadResources(from: string, to: string): void {
    const failed = { count: 0 }
    forkJoin({
      labs: this.safe(
        this.api.reportLabUtilization(from, to),
        [] as ResourceUtilizationResponse[],
        failed,
      ),
      equipments: this.safe(
        this.api.reportEquipmentUtilization(from, to),
        [] as ResourceUtilizationResponse[],
        failed,
      ),
    }).subscribe({
      next: (response) => {
        this.labUtilization.set(response.labs)
        this.equipmentUtilization.set(response.equipments)
        this.completeLoad(failed.count, 2)
      },
      error: () => this.failLoad(),
    })
  }

  private loadDepartment(from: string, to: string): void {
    const failed = { count: 0 }
    forkJoin({
      counts: this.safe(
        this.api.reportBookingsByDepartment(from, to),
        [] as CategoryCountResponse[],
        failed,
      ),
      utilization: this.safe(
        this.api.reportDepartmentUtilization(from, to),
        [] as DepartmentUtilizationResponse[],
        failed,
      ),
    }).subscribe({
      next: (response) => {
        this.departmentCounts.set(response.counts)
        this.departmentUtilization.set(response.utilization)
        this.completeLoad(failed.count, 2)
      },
      error: () => this.failLoad(),
    })
  }

  private loadTopResources(from: string, to: string): void {
    const failed = { count: 0 }
    forkJoin({
      labs: this.safe(
        this.api.reportMostUsedLabs(from, to, this.top),
        [] as MostUsedResourceResponse[],
        failed,
      ),
      equipments: this.safe(
        this.api.reportMostUsedEquipments(from, to, this.top),
        [] as MostUsedResourceResponse[],
        failed,
      ),
    }).subscribe({
      next: (response) => {
        this.mostLabs.set(response.labs)
        this.mostEquipments.set(response.equipments)
        this.completeLoad(failed.count, 2)
      },
      error: () => this.failLoad(),
    })
  }

  private loadMaintenanceCosts(from: string, to: string): void {
    const failed = { count: 0 }
    forkJoin({
      labs: this.safe(
        this.api.reportMaintenanceByLab(from, to),
        [] as MaintenanceCostResponse[],
        failed,
      ),
      equipments: this.safe(
        this.api.reportMaintenanceByEquipment(from, to),
        [] as MaintenanceCostResponse[],
        failed,
      ),
    }).subscribe({
      next: (response) => {
        this.maintenanceLabs.set(response.labs)
        this.maintenanceEquipments.set(response.equipments)
        this.completeLoad(failed.count, 2)
      },
      error: () => this.failLoad(),
    })
  }

  private loadMaintenanceHistory(from: string, to: string): void {
    const failed = { count: 0 }
    const fallback = {
      items: [],
      pageNumber: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 0,
      from,
      to,
      totalCost: 0,
    } as PagedMaintenanceHistoryResponse

    this.safe(
      this.api.reportMaintenanceHistory({ from, to, pageNumber: 1, pageSize: 50 }),
      fallback,
      failed,
    ).subscribe({
      next: (response) => {
        this.history.set(response)
        this.completeLoad(failed.count, 1)
      },
      error: () => this.failLoad(),
    })
  }

  private loadViolations(from: string, to: string): void {
    const failed = { count: 0 }
    forkJoin({
      summary: this.safe(
        this.api.reportViolations(from, to),
        {
          totalCount: 0,
          activeCount: 0,
          resolvedCount: 0,
          cancelledCount: 0,
          violationTypeCounts: [],
          items: [],
        } as ViolationSummaryResponse,
        failed,
      ),
      users: this.safe(
        this.api.reportPenaltyUsers(from, to, this.top),
        [] as PenaltyUserReportResponse[],
        failed,
      ),
    }).subscribe({
      next: (response) => {
        this.violations.set(response.summary)
        this.penaltyUsers.set(response.users)
        this.completeLoad(failed.count, 2)
      },
      error: () => this.failLoad(),
    })
  }

  private loadTrend(from: string, to: string): void {
    const failed = { count: 0 }
    this.safe(
      this.api.reportUsageTrend(from, to, this.groupBy),
      [] as UsageTrendResponse[],
      failed,
    ).subscribe({
      next: (response) => {
        this.usageTrend.set(response)
        this.completeLoad(failed.count, 1)
      },
      error: () => this.failLoad(),
    })
  }

  private safe<T>(
    request: Observable<T>,
    fallback: T,
    failed: { count: number },
  ): Observable<T> {
    return request.pipe(
      catchError(() => {
        failed.count += 1
        return of(fallback)
      }),
    )
  }

  private completeLoad(failedRequests: number, totalRequests: number): void {
    this.loading.set(false)
    if (failedRequests === 0) return

    if (failedRequests >= totalRequests) {
      this.toast.error('Không tải được báo cáo')
      return
    }

    this.toast.info(
      'Một phần báo cáo chưa tải được',
      `${failedRequests} nhóm dữ liệu chưa tải được; các phần còn lại vẫn được hiển thị.`,
    )
  }

  private failLoad(): void {
    this.loading.set(false)
    this.toast.error('Không tải được báo cáo')
  }

  protected exportCurrent(): void {
    const rows = this.currentRows()
    if (rows.length === 0) {
      this.toast.info('Tab hiện tại chưa có dữ liệu')
      return
    }
    const headers = Object.keys(rows[0])
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','),
      ),
    ].join('\n')
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `report-${this.tab()}-${this.from}-${this.to}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  private currentRows(): Record<string, unknown>[] {
    const key = this.tab()
    if (key === 'resources')
      return [...this.labUtilization(), ...this.equipmentUtilization()] as unknown as Record<
        string,
        unknown
      >[]
    if (key === 'department')
      return this.departmentUtilization() as unknown as Record<string, unknown>[]
    if (key === 'top')
      return [...this.mostLabs(), ...this.mostEquipments()] as unknown as Record<string, unknown>[]
    if (key === 'maintenance')
      return [...this.maintenanceLabs(), ...this.maintenanceEquipments()] as unknown as Record<
        string,
        unknown
      >[]
    if (key === 'history') return this.history().items as unknown as Record<string, unknown>[]
    if (key === 'violations') return this.violations().items as unknown as Record<string, unknown>[]
    if (key === 'trend') return this.usageTrend() as unknown as Record<string, unknown>[]
    return [...this.statusCounts(), ...this.purposeCounts()] as unknown as Record<string, unknown>[]
  }
}
