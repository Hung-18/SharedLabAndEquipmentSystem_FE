import { DatePipe, DecimalPipe, NgClass } from '@angular/common'
import { Component, OnInit, computed, inject, input, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { forkJoin } from 'rxjs'
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
      @if (items().length === 0) { <div class="py-14 text-center text-sm font-semibold text-slate-400">Chưa có dữ liệu.</div> }
      @else { <div class="mt-6 space-y-5">@for (item of items(); track item.key) { <div><div class="flex items-center justify-between gap-3 text-sm"><span class="truncate font-bold text-slate-600">{{ item.displayName || item.key }}</span><strong class="shrink-0 text-slate-900">{{ item.count }} · {{ item.percentage | number:'1.1-1' }}%</strong></div><div class="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" [style.width.%]="item.percentage"></div></div></div> }</div> }
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
    <article class="card-surface overflow-hidden"><header class="border-b border-slate-100 px-5 py-5"><h2 class="font-black text-slate-950">{{ title() }}</h2></header>
      @if (items().length === 0) { <div class="p-10 text-center text-sm font-semibold text-slate-400">Chưa có dữ liệu.</div> }
      @else { <div class="overflow-x-auto"><table class="table-shell"><thead><tr><th>Tài nguyên</th><th>Booking</th><th>Giờ đặt</th><th>Giờ dùng</th><th>Tỷ lệ</th></tr></thead><tbody>@for (item of items(); track item.resourceType + item.resourceId) { <tr><td><p class="font-black text-slate-800">{{ item.resourceName }}</p><p class="mt-1 text-xs text-slate-400">{{ item.labName || item.resourceType }}</p></td><td>{{ item.bookingCount }}</td><td>{{ item.reservedHours | number:'1.1-1' }}h</td><td>{{ item.actualUsageHours | number:'1.1-1' }}h</td><td><span class="font-black text-violet-700">{{ item.utilizationRate | number:'1.1-2' }}%</span></td></tr> }</tbody></table></div> }
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
    <article class="card-surface overflow-hidden"><header class="flex items-center gap-3 border-b border-slate-100 px-5 py-5"><div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><app-icon [name]="icon()" [size]="19" /></div><h2 class="font-black text-slate-950">{{ title() }}</h2></header><div class="divide-y divide-slate-100">@for (item of items(); track item.resourceType + item.resourceId; let rank = $index) { <div class="flex items-center gap-4 px-5 py-4"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 font-black text-slate-600">{{ rank + 1 }}</span><div class="min-w-0 flex-1"><p class="truncate font-black text-slate-800">{{ item.resourceName }}</p><p class="mt-1 text-xs text-slate-400">{{ item.usageCount }} lượt · {{ item.actualUsageHours | number:'1.1-1' }} giờ</p></div><strong class="text-violet-700">{{ item.bookingCount }}</strong></div> } @empty { <div class="px-5 py-12 text-center text-sm font-semibold text-slate-400">Chưa có dữ liệu.</div> }</div></article>
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
    <article class="card-surface overflow-hidden"><header class="border-b border-slate-100 px-5 py-5"><h2 class="font-black text-slate-950">{{ title() }}</h2></header><div class="divide-y divide-slate-100">@for (item of items(); track item.resourceType + item.resourceId) { <div class="flex items-center gap-4 px-5 py-4"><div class="min-w-0 flex-1"><p class="truncate font-black text-slate-800">{{ item.resourceName }}</p><p class="mt-1 text-xs text-slate-400">{{ item.maintenanceCount }} lần bảo trì</p></div><strong class="text-amber-700">{{ money(item.totalCost) }}</strong></div> } @empty { <div class="px-5 py-12 text-center text-sm font-semibold text-slate-400">Chưa có dữ liệu.</div> }</div></article>
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
    <article class="card-surface p-6"><div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="font-black text-slate-950">Xu hướng sử dụng</h2><p class="mt-1 text-xs text-slate-400">Lượt và tổng giờ sử dụng theo kỳ</p></div><span class="rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700">{{ totalHours() | number:'1.1-1' }} giờ</span></div>
      @if (items().length === 0) { <div class="py-16 text-center text-sm font-semibold text-slate-400">Chưa có dữ liệu xu hướng.</div> }
      @else { <div class="mt-8 flex h-64 items-end gap-2 overflow-x-auto border-b border-slate-200 pb-px">@for (item of items(); track item.periodStart) { <div class="group flex h-full min-w-12 flex-1 flex-col justify-end"><div class="relative rounded-t-xl bg-gradient-to-t from-violet-600 to-cyan-400 transition group-hover:brightness-110" [style.height.%]="height(item.usageCount)"><div class="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-600">{{ item.usageCount }}</div></div><p class="mt-2 truncate text-center text-[9px] font-bold text-slate-400">{{ item.periodStart | date:'dd/MM' }}</p></div> }</div> }
    </article>
  `,
})
export class TrendCardComponent {
  readonly items = input<UsageTrendResponse[]>([])
  protected totalHours(): number { return this.items().reduce((sum, item) => sum + item.totalUsageHours, 0) }
  protected height(value: number): number { const max = Math.max(1, ...this.items().map((item) => item.usageCount)); return Math.max(6, (value / max) * 88) }
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
      <app-page-header title="Trung tâm báo cáo" subtitle="Phân tích mức sử dụng, booking, bảo trì, vi phạm và xu hướng vận hành trong một workspace thống nhất.">
        <button class="btn-secondary" type="button" (click)="exportCurrent()"><app-icon name="download" [size]="17" /> Xuất CSV tab hiện tại</button>
      </app-page-header>

      <div class="filter-bar md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]"><div><label class="field-label">Từ ngày</label><input class="input-shell" type="date" [(ngModel)]="from" /></div><div><label class="field-label">Đến ngày</label><input class="input-shell" type="date" [(ngModel)]="to" /></div><div><label class="field-label">Top N</label><select class="input-shell" [(ngModel)]="top"><option [ngValue]="5">Top 5</option><option [ngValue]="10">Top 10</option><option [ngValue]="20">Top 20</option></select></div><div><label class="field-label">Nhóm xu hướng</label><select class="input-shell" [(ngModel)]="groupBy"><option value="day">Theo ngày</option><option value="week">Theo tuần</option><option value="month">Theo tháng</option></select></div><div class="flex items-end"><button class="btn-primary w-full" type="button" (click)="load()"><app-icon name="refresh" [size]="17" /> Cập nhật</button></div></div>

      <div class="flex gap-2 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm">@for (item of tabs; track item.key) { <button class="shrink-0 rounded-xl px-4 py-2.5 text-xs font-black" [ngClass]="tab() === item.key ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'text-slate-500 hover:bg-slate-50'" (click)="tab.set(item.key)">{{ item.label }}</button> }</div>

      @if (loading()) { <div class="grid gap-5 md:grid-cols-2"><div class="skeleton h-80 rounded-[28px]"></div><div class="skeleton h-80 rounded-[28px]"></div></div> }
      @else {
        @if (tab() === 'overview') {
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div class="kpi-card"><p class="text-xs font-bold text-slate-400">Booking kết luận</p><p class="mt-2 text-3xl font-black text-slate-950">{{ noShow().concludedBookingCount }}</p></div><div class="kpi-card"><p class="text-xs font-bold text-slate-400">NoShow</p><p class="mt-2 text-3xl font-black text-rose-600">{{ noShow().noShowCount }}</p></div><div class="kpi-card"><p class="text-xs font-bold text-slate-400">Tỷ lệ NoShow</p><p class="mt-2 text-3xl font-black text-amber-600">{{ noShow().noShowRate | number:'1.1-2' }}%</p></div><div class="kpi-card"><p class="text-xs font-bold text-slate-400">Lượt sử dụng</p><p class="mt-2 text-3xl font-black text-indigo-600">{{ totalUsage() }}</p></div></div>
          <div class="grid gap-6 xl:grid-cols-2"><app-report-bars title="Booking theo trạng thái" [items]="statusCounts()" /><app-report-bars title="Booking theo mục đích" [items]="purposeCounts()" /></div><app-trend-card [items]="usageTrend()" />
        }
        @if (tab() === 'resources') { <div class="grid gap-6 xl:grid-cols-2"><app-utilization-table title="Mức sử dụng phòng lab" [items]="labUtilization()" /><app-utilization-table title="Mức sử dụng thiết bị" [items]="equipmentUtilization()" /></div> }
        @if (tab() === 'department') { <div class="grid gap-6 xl:grid-cols-[.75fr_1.25fr]"><app-report-bars title="Booking theo khoa/phòng ban" [items]="departmentCounts()" /><article class="card-surface overflow-hidden"><header class="border-b border-slate-100 px-5 py-5"><h2 class="font-black text-slate-950">Mức sử dụng theo khoa</h2></header><div class="overflow-x-auto"><table class="table-shell"><thead><tr><th>Đơn vị</th><th>Booking</th><th>Giờ dùng</th><th>Tỷ lệ thật</th><th>Tỷ trọng</th></tr></thead><tbody>@for (item of departmentUtilization(); track item.departmentId) { <tr><td class="font-black text-slate-800">{{ item.departmentName }}</td><td>{{ item.bookingCount }}</td><td>{{ item.actualUsageHours | number:'1.1-1' }}h</td><td>{{ item.utilizationRate | number:'1.1-2' }}%</td><td>{{ item.usageSharePercentage | number:'1.1-2' }}%</td></tr> } @empty { <tr><td colspan="5" class="py-10 text-center text-slate-400">Chưa có dữ liệu.</td></tr> }</tbody></table></div></article></div> }
        @if (tab() === 'top') { <div class="grid gap-6 xl:grid-cols-2"><app-ranking-card title="Phòng lab dùng nhiều nhất" icon="building" [items]="mostLabs()" /><app-ranking-card title="Thiết bị dùng nhiều nhất" icon="microscope" [items]="mostEquipments()" /></div> }
        @if (tab() === 'maintenance') { <div class="grid gap-6 xl:grid-cols-2"><app-cost-card title="Chi phí theo phòng lab" [items]="maintenanceLabs()" /><app-cost-card title="Chi phí theo thiết bị" [items]="maintenanceEquipments()" /></div> }
        @if (tab() === 'history') { <article class="card-surface overflow-hidden"><header class="flex items-center justify-between border-b border-slate-100 px-5 py-5"><div><h2 class="font-black text-slate-950">Lịch sử bảo trì</h2><p class="mt-1 text-xs text-slate-400">Tổng chi phí: {{ formatMoney(history().totalCost) }}</p></div><span class="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">{{ history().totalCount }} bản ghi</span></header>@if (history().items.length === 0) { <div class="p-6"><app-data-state title="Không có lịch sử" message="Không có maintenance trong khoảng thời gian đã chọn." icon="wrench" /></div> } @else { <div class="overflow-x-auto"><table class="table-shell"><thead><tr><th>Mã</th><th>Tài nguyên</th><th>Người tạo</th><th>Thời gian</th><th>Chi phí</th><th>Trạng thái</th></tr></thead><tbody>@for (item of history().items; track item.maintenanceId) { <tr><td class="font-black">#MT-{{ item.maintenanceId }}</td><td><p class="font-black text-slate-800">{{ item.resourceName }}</p><p class="mt-1 text-xs text-slate-400">{{ item.resourceType }}</p></td><td>{{ item.createdByName }}</td><td>{{ item.startTime | date:'dd/MM/yyyy HH:mm' }}</td><td>{{ formatMoney(item.maintenanceCost) }}</td><td><app-status-badge [value]="item.status" domain="maintenance" /></td></tr> }</tbody></table></div> }</article> }
        @if (tab() === 'violations') { <div class="grid gap-4 sm:grid-cols-4"><div class="kpi-card"><p class="text-xs text-slate-400">Tổng vi phạm</p><p class="mt-2 text-3xl font-black">{{ violations().totalCount }}</p></div><div class="kpi-card"><p class="text-xs text-slate-400">Active</p><p class="mt-2 text-3xl font-black text-rose-600">{{ violations().activeCount }}</p></div><div class="kpi-card"><p class="text-xs text-slate-400">Resolved</p><p class="mt-2 text-3xl font-black text-emerald-600">{{ violations().resolvedCount }}</p></div><div class="kpi-card"><p class="text-xs text-slate-400">Cancelled</p><p class="mt-2 text-3xl font-black text-slate-500">{{ violations().cancelledCount }}</p></div></div><div class="grid gap-6 xl:grid-cols-[.7fr_1.3fr]"><app-report-bars title="Vi phạm theo loại" [items]="violations().violationTypeCounts" /><article class="card-surface overflow-hidden"><header class="border-b border-slate-100 px-5 py-5"><h2 class="font-black text-slate-950">Người dùng nhiều điểm phạt</h2></header><div class="divide-y divide-slate-100">@for (item of penaltyUsers(); track item.userId; let rank = $index) { <div class="flex items-center gap-4 px-5 py-4"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 font-black text-rose-700">{{ rank + 1 }}</span><div class="min-w-0 flex-1"><p class="font-black text-slate-800">{{ item.fullName }}</p><p class="mt-1 text-xs text-slate-400">{{ item.departmentName }} · {{ item.totalViolationCount }} vi phạm</p></div><span class="text-xl font-black text-rose-600">{{ item.penaltyPoints }}</span></div> } @empty { <div class="px-5 py-12 text-center text-sm font-semibold text-slate-400">Chưa có dữ liệu.</div> }</div></article></div> }
        @if (tab() === 'trend') { <app-trend-card [items]="usageTrend()" /> }
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
  protected readonly history = signal<PagedMaintenanceHistoryResponse>({ from: '', to: '', totalCost: 0, totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 0, items: [] })
  protected readonly violations = signal<ViolationSummaryResponse>({ totalCount: 0, activeCount: 0, resolvedCount: 0, cancelledCount: 0, violationTypeCounts: [], items: [] })
  protected readonly penaltyUsers = signal<PenaltyUserReportResponse[]>([])
  protected readonly noShow = signal<NoShowRateResponse>({ noShowCount: 0, completedCount: 0, concludedBookingCount: 0, noShowRate: 0 })
  protected readonly usageTrend = signal<UsageTrendResponse[]>([])
  protected readonly tabs = [{ key: 'overview', label: 'Tổng quan' }, { key: 'resources', label: 'Mức sử dụng' }, { key: 'department', label: 'Khoa/phòng ban' }, { key: 'top', label: 'Top tài nguyên' }, { key: 'maintenance', label: 'Chi phí bảo trì' }, { key: 'history', label: 'Lịch sử bảo trì' }, { key: 'violations', label: 'Vi phạm' }, { key: 'trend', label: 'Xu hướng' }]
  protected readonly totalUsage = computed(() => this.usageTrend().reduce((sum, item) => sum + item.usageCount, 0))

  ngOnInit(): void { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 30); this.from = toDateInput(from); this.to = toDateInput(to); this.load() }

  protected load(): void {
    if (!this.from || !this.to) return
    this.loading.set(true)
    const from = new Date(`${this.from}T00:00:00`).toISOString()
    const to = new Date(`${this.to}T23:59:59`).toISOString()
    forkJoin({
      status: this.api.reportBookingsByStatus(from, to), purpose: this.api.reportBookingsByPurpose(from, to), departments: this.api.reportBookingsByDepartment(from, to), labUtil: this.api.reportLabUtilization(from, to), equipmentUtil: this.api.reportEquipmentUtilization(from, to), departmentUtil: this.api.reportDepartmentUtilization(from, to), mostLabs: this.api.reportMostUsedLabs(from, to, this.top), mostEquipments: this.api.reportMostUsedEquipments(from, to, this.top), maintenanceLabs: this.api.reportMaintenanceByLab(from, to), maintenanceEquipments: this.api.reportMaintenanceByEquipment(from, to), history: this.api.reportMaintenanceHistory({ from, to, pageNumber: 1, pageSize: 50 }), violations: this.api.reportViolations(from, to), penaltyUsers: this.api.reportPenaltyUsers(from, to, this.top), noShow: this.api.reportNoShow(from, to), trend: this.api.reportUsageTrend(from, to, this.groupBy),
    }).subscribe({
      next: (response) => { this.statusCounts.set(response.status); this.purposeCounts.set(response.purpose); this.departmentCounts.set(response.departments); this.labUtilization.set(response.labUtil); this.equipmentUtilization.set(response.equipmentUtil); this.departmentUtilization.set(response.departmentUtil); this.mostLabs.set(response.mostLabs); this.mostEquipments.set(response.mostEquipments); this.maintenanceLabs.set(response.maintenanceLabs); this.maintenanceEquipments.set(response.maintenanceEquipments); this.history.set(response.history); this.violations.set(response.violations); this.penaltyUsers.set(response.penaltyUsers); this.noShow.set(response.noShow); this.usageTrend.set(response.trend); this.loading.set(false) },
      error: () => { this.loading.set(false); this.toast.error('Không tải được báo cáo') },
    })
  }

  protected exportCurrent(): void {
    const rows = this.currentRows()
    if (rows.length === 0) { this.toast.info('Tab hiện tại chưa có dữ liệu'); return }
    const headers = Object.keys(rows[0])
    const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n')
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
    if (key === 'resources') return [...this.labUtilization(), ...this.equipmentUtilization()] as unknown as Record<string, unknown>[]
    if (key === 'department') return this.departmentUtilization() as unknown as Record<string, unknown>[]
    if (key === 'top') return [...this.mostLabs(), ...this.mostEquipments()] as unknown as Record<string, unknown>[]
    if (key === 'maintenance') return [...this.maintenanceLabs(), ...this.maintenanceEquipments()] as unknown as Record<string, unknown>[]
    if (key === 'history') return this.history().items as unknown as Record<string, unknown>[]
    if (key === 'violations') return this.violations().items as unknown as Record<string, unknown>[]
    if (key === 'trend') return this.usageTrend() as unknown as Record<string, unknown>[]
    return [...this.statusCounts(), ...this.purposeCounts()] as unknown as Record<string, unknown>[]
  }
}
