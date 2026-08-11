import { DatePipe, NgClass } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { SystemService } from '../../core/api/system.service'
import type { AuditLogResponse, UserManagementResponse } from '../../core/api/system.models'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { PositiveIntegerDirective } from '../../shared/ui/positive-integer.directive'
import { ToastService } from '../../shared/ui/toast.service'
import { toDateInput } from '../../shared/utils/presentation'

@Component({
  selector: 'app-audit-logs-page',
  imports: [
    DatePipe,
    NgClass,
    FormsModule,
    PageHeaderComponent,
    IconComponent,
    DataStateComponent,
    PositiveIntegerDirective,
  ],
  template: `
    <section class="space-y-6">
      <app-page-header
        title="Nhật ký kiểm toán"
        subtitle="Theo dõi ai đã làm gì, trên dữ liệu nào và vào thời điểm nào trong hệ thống."
      >
        <button class="btn-secondary" type="button" (click)="resetFilters()">
          <app-icon name="refresh" [size]="17" /> Đặt lại
        </button>
      </app-page-header>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="kpi-card">
          <p class="text-xs font-bold text-slate-400">Tổng bản ghi</p>
          <p class="mt-3 text-3xl font-black text-slate-950">{{ totalCount() }}</p>
        </article>
        <article class="kpi-card">
          <p class="text-xs font-bold text-slate-400">Trang hiện tại</p>
          <p class="mt-3 text-3xl font-black text-indigo-600">{{ logs().length }}</p>
        </article>
        <article class="kpi-card">
          <p class="text-xs font-bold text-slate-400">Thao tác thay đổi</p>
          <p class="mt-3 text-3xl font-black text-amber-600">{{ changeCount() }}</p>
        </article>
        <article class="kpi-card">
          <p class="text-xs font-bold text-slate-400">Người thao tác</p>
          <p class="mt-3 text-3xl font-black text-emerald-600">{{ uniqueUsers() }}</p>
        </article>
      </div>

      <div class="filter-bar md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label class="field-label">Người thao tác</label
          ><select class="input-shell" [(ngModel)]="userId">
            <option [ngValue]="null">Tất cả</option>
            @for (user of users(); track user.userId) {
              <option [ngValue]="user.userId">{{ user.fullName }}</option>
            }
          </select>
        </div>
        <div>
          <label class="field-label">Loại hành động</label
          ><select class="input-shell" [(ngModel)]="actionType">
            <option [ngValue]="null">Tất cả</option>
            @for (action of actions; track action.value) {
              <option [ngValue]="action.value">{{ action.label }}</option>
            }
          </select>
        </div>
        <div>
          <label class="field-label">Entity</label
          ><input
            class="input-shell"
            [(ngModel)]="entityName"
            placeholder="Booking, User, LabRoom..."
          />
        </div>
        <div>
          <label class="field-label">Entity ID</label
          ><input
            class="input-shell"
            type="number"
            appPositiveInteger
            min="1"
            [(ngModel)]="entityId"
          />
        </div>
        <div>
          <label class="field-label">Từ ngày</label
          ><input class="input-shell" type="date" [(ngModel)]="from" />
        </div>
        <div>
          <label class="field-label">Đến ngày</label
          ><input class="input-shell" type="date" [(ngModel)]="to" />
        </div>
        <div>
          <label class="field-label">Số bản ghi/trang</label
          ><select class="input-shell" [(ngModel)]="pageSize">
            <option [ngValue]="10">10</option>
            <option [ngValue]="20">20</option>
            <option [ngValue]="50">50</option>
          </select>
        </div>
        <div class="flex items-end">
          <button class="btn-primary w-full" type="button" (click)="applyFilters()">
            <app-icon name="filter" [size]="17" /> Tra cứu
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="card-surface p-5">
          <div class="space-y-3">
            @for (item of [1, 2, 3, 4, 5, 6, 7]; track item) {
              <div class="skeleton h-14 rounded-2xl"></div>
            }
          </div>
        </div>
      } @else if (logs().length === 0) {
        <app-data-state
          icon="history"
          title="Không có audit log"
          message="Không tìm thấy hoạt động nào phù hợp với bộ lọc đã chọn."
        />
      } @else {
        <article class="card-surface overflow-hidden">
          <div class="overflow-x-auto">
            <table class="table-shell">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Người thao tác</th>
                  <th>Hành động</th>
                  <th>Đối tượng</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                @for (log of logs(); track log.auditLogId) {
                  <tr>
                    <td>
                      <p class="font-black text-slate-800">
                        {{ log.createdAt | date: 'dd/MM/yyyy' }}
                      </p>
                      <p class="mt-1 text-xs text-slate-400">
                        {{ log.createdAt | date: 'HH:mm:ss' }}
                      </p>
                    </td>
                    <td>
                      <p class="font-black text-slate-800">
                        {{ log.userName || 'Chưa xác định người dùng' }}
                      </p>
                      <p class="mt-1 text-xs text-slate-400">ID {{ log.userId }}</p>
                    </td>
                    <td>
                      <span
                        class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black"
                        [ngClass]="actionClass(log.actionType)"
                        ><app-icon [name]="actionIcon(log.actionType)" [size]="14" />
                        {{ actionLabel(log.actionType) }}</span
                      >
                    </td>
                    <td>
                      <p class="font-black text-slate-800">{{ log.entityName }}</p>
                      <p class="mt-1 text-xs text-slate-400">#{{ log.entityId }}</p>
                    </td>
                    <td class="font-mono text-xs">{{ log.ipAddress || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </article>
      }

      @if (totalPages() > 1) {
        <div
          class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm"
        >
          <p class="px-2 text-xs font-bold text-slate-400">
            Trang {{ page() }} · {{ totalCount() }} bản ghi
          </p>
          <div class="flex gap-2">
            <button class="btn-secondary" [disabled]="page() <= 1" (click)="goPage(page() - 1)">
              <app-icon name="chevron-left" [size]="16" /> Trước</button
            ><button
              class="btn-secondary"
              [disabled]="page() >= totalPages()"
              (click)="goPage(page() + 1)"
            >
              Sau <app-icon name="chevron-right" [size]="16" />
            </button>
          </div>
        </div>
      }
    </section>
  `,
})
export class AuditLogsPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly toast = inject(ToastService)
  protected readonly logs = signal<AuditLogResponse[]>([])
  protected readonly users = signal<UserManagementResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly page = signal(1)
  protected readonly totalPages = signal(0)
  protected readonly totalCount = signal(0)
  protected userId: number | null = null
  protected actionType: number | null = null
  protected entityName = ''
  protected entityId: number | null = null
  protected from = ''
  protected to = ''
  protected pageSize = 20
  protected readonly actions = [
    { value: 1, label: 'Tạo mới' },
    { value: 2, label: 'Cập nhật' },
    { value: 3, label: 'Xóa' },
    { value: 4, label: 'Đăng nhập' },
    { value: 5, label: 'Đăng xuất' },
    { value: 6, label: 'Duyệt booking' },
    { value: 7, label: 'Từ chối booking' },
    { value: 8, label: 'Check-in' },
    { value: 9, label: 'Check-out' },
  ]

  ngOnInit(): void {
    const today = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    this.from = toDateInput(start)
    this.to = toDateInput(today)
    this.api
      .users({ pageNumber: 1, pageSize: 100 })
      .subscribe({ next: (response) => this.users.set(response.items) })
    this.load()
  }
  protected changeCount(): number {
    return this.logs().filter((log) => ['Create', 'Update', 'Delete'].includes(log.actionType))
      .length
  }
  protected uniqueUsers(): number {
    return new Set(this.logs().map((log) => log.userId)).size
  }
  protected applyFilters(): void {
    this.page.set(1)
    this.load()
  }
  protected resetFilters(): void {
    this.userId = null
    this.actionType = null
    this.entityName = ''
    this.entityId = null
    const today = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    this.from = toDateInput(start)
    this.to = toDateInput(today)
    this.page.set(1)
    this.load()
  }
  protected goPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return
    this.page.set(page)
    this.load()
  }
  protected actionLabel(action: string): string {
    return (
      (
        {
          Create: 'Tạo mới',
          Update: 'Cập nhật',
          Delete: 'Xóa',
          Login: 'Đăng nhập',
          Logout: 'Đăng xuất',
          ApproveBooking: 'Duyệt booking',
          RejectBooking: 'Từ chối booking',
          CheckIn: 'Check-in',
          CheckOut: 'Check-out',
        } as Record<string, string>
      )[action] ?? action
    )
  }
  protected actionIcon(action: string): string {
    if (action === 'Create') return 'plus'
    if (action === 'Update') return 'edit'
    if (action === 'Delete') return 'trash'
    if (action === 'Login') return 'login'
    if (action === 'Logout') return 'logout'
    if (action === 'ApproveBooking') return 'check'
    if (action === 'RejectBooking') return 'x'
    if (action === 'CheckIn') return 'login'
    if (action === 'CheckOut') return 'logout'
    return 'history'
  }
  protected actionClass(action: string): string {
    if (['Create', 'ApproveBooking', 'CheckIn'].includes(action))
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    if (['Delete', 'RejectBooking'].includes(action))
      return 'border-rose-200 bg-rose-50 text-rose-700'
    if (action === 'Update') return 'border-amber-200 bg-amber-50 text-amber-700'
    return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  }

  private load(): void {
    this.loading.set(true)
    this.api
      .auditLogs({
        userId: this.userId ?? undefined,
        actionType: this.actionType ?? undefined,
        entityName: this.entityName.trim() || undefined,
        entityId: this.entityId ?? undefined,
        from: this.from ? new Date(`${this.from}T00:00:00`).toISOString() : undefined,
        to: this.to ? new Date(`${this.to}T23:59:59`).toISOString() : undefined,
        pageNumber: this.page(),
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (response) => {
          this.logs.set(response.items)
          this.totalPages.set(response.totalPages)
          this.totalCount.set(response.totalCount)
          this.loading.set(false)
        },
        error: () => {
          this.loading.set(false)
          this.toast.error('Không tải được audit log')
        },
      })
  }
}
