import { DatePipe } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { SystemService } from '../../core/api/system.service'
import type { DepartmentResponse, UserManagementResponse } from '../../core/api/system.models'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'

@Component({
  selector: 'app-users-page',
  imports: [DatePipe, FormsModule, RouterLink, PageHeaderComponent, IconComponent, StatusBadgeComponent, DataStateComponent],
  template: `
    <section class="space-y-6">
      <app-page-header title="Quản lý người dùng" subtitle="Tìm kiếm, phân quyền và theo dõi trạng thái toàn bộ tài khoản trong hệ thống.">
        <a routerLink="/app/admin/users/new" class="btn-primary"><app-icon name="user-plus" [size]="17" /> Tạo người dùng</a>
      </app-page-header>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article class="kpi-card"><div class="flex items-center justify-between"><p class="text-xs font-bold text-slate-400">Tổng tài khoản</p><span class="rounded-xl bg-indigo-50 p-2 text-indigo-600"><app-icon name="users" [size]="18" /></span></div><p class="mt-3 text-3xl font-black text-slate-950">{{ totalCount() }}</p><p class="mt-2 text-xs text-slate-400">Theo bộ lọc hiện tại</p></article>
        <article class="kpi-card"><div class="flex items-center justify-between"><p class="text-xs font-bold text-slate-400">Đang hiển thị</p><span class="rounded-xl bg-cyan-50 p-2 text-cyan-600"><app-icon name="list" [size]="18" /></span></div><p class="mt-3 text-3xl font-black text-slate-950">{{ users().length }}</p><p class="mt-2 text-xs text-slate-400">Trang {{ page() }} / {{ totalPages() || 1 }}</p></article>
        <article class="kpi-card"><div class="flex items-center justify-between"><p class="text-xs font-bold text-slate-400">Tổng điểm phạt</p><span class="rounded-xl bg-rose-50 p-2 text-rose-600"><app-icon name="alert" [size]="18" /></span></div><p class="mt-3 text-3xl font-black text-rose-600">{{ pagePenaltyPoints() }}</p><p class="mt-2 text-xs text-slate-400">Trong danh sách đang hiển thị</p></article>
        <article class="kpi-card"><div class="flex items-center justify-between"><p class="text-xs font-bold text-slate-400">Khoa/phòng ban</p><span class="rounded-xl bg-emerald-50 p-2 text-emerald-600"><app-icon name="building" [size]="18" /></span></div><p class="mt-3 text-3xl font-black text-slate-950">{{ departments().length }}</p><p class="mt-2 text-xs text-slate-400">Đơn vị có trong hệ thống</p></article>
      </div>

      <div class="filter-bar md:grid-cols-2 xl:grid-cols-[2fr_1fr_1.2fr_1fr_auto]">
        <div><label class="field-label">Tìm kiếm</label><div class="relative"><span class="pointer-events-none absolute left-4 top-3.5 text-slate-400"><app-icon name="search" [size]="18" /></span><input class="input-shell pl-11" [(ngModel)]="keyword" (keyup.enter)="applyFilters()" placeholder="Họ tên, username hoặc email..." /></div></div>
        <div><label class="field-label">Vai trò</label><select class="input-shell" [(ngModel)]="roleName"><option value="">Tất cả</option><option value="Admin">Admin</option><option value="LabManager">LabManager</option><option value="Requester">Requester</option></select></div>
        <div><label class="field-label">Khoa/phòng ban</label><select class="input-shell" [(ngModel)]="departmentId"><option [ngValue]="null">Tất cả</option>@for (department of departments(); track department.departmentId) { <option [ngValue]="department.departmentId">{{ department.departmentName }}</option> }</select></div>
        <div><label class="field-label">Trạng thái</label><select class="input-shell" [(ngModel)]="status"><option [ngValue]="null">Tất cả</option><option [ngValue]="1">Đang hoạt động</option><option [ngValue]="2">Ngừng hoạt động</option><option [ngValue]="3">Bị hạn chế</option><option [ngValue]="4">Bị khóa</option></select></div>
        <div class="flex items-end"><button type="button" class="btn-primary w-full" (click)="applyFilters()"><app-icon name="filter" [size]="17" /> Áp dụng</button></div>
      </div>

      @if (loading()) {
        <div class="card-surface overflow-hidden"><div class="space-y-3 p-5">@for (item of [1,2,3,4,5,6]; track item) { <div class="skeleton h-16 rounded-2xl"></div> }</div></div>
      } @else if (users().length === 0) {
        <app-data-state icon="users" title="Không tìm thấy người dùng" message="Không có tài khoản nào phù hợp với bộ lọc hiện tại."><a routerLink="/app/admin/users/new" class="btn-primary mt-5">Tạo tài khoản đầu tiên</a></app-data-state>
      } @else {
        <article class="card-surface overflow-hidden">
          <div class="overflow-x-auto">
            <table class="table-shell">
              <thead><tr><th>Người dùng</th><th>Vai trò</th><th>Khoa/phòng ban</th><th>Điểm phạt</th><th>Trạng thái</th><th>Hạn chế đến</th><th></th></tr></thead>
              <tbody>
                @for (user of users(); track user.userId) {
                  <tr>
                    <td><div class="flex items-center gap-3"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 text-sm font-black text-violet-700">{{ initials(user.fullName) }}</div><div><p class="font-black text-slate-900">{{ user.fullName }}</p><p class="mt-1 text-xs text-slate-400">{{ user.username }} · {{ user.email }}</p></div></div></td>
                    <td><span class="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">{{ roleLabel(user.roleName) }}</span></td>
                    <td>{{ user.departmentName }}</td>
                    <td><span class="font-black" [class.text-rose-600]="user.penaltyPoints > 0" [class.text-slate-700]="user.penaltyPoints === 0">{{ user.penaltyPoints }}</span></td>
                    <td><app-status-badge [value]="user.status" domain="user" /></td>
                    <td>{{ user.restrictionUntil ? (user.restrictionUntil | date:'dd/MM/yyyy HH:mm') : '—' }}</td>
                    <td class="text-right"><a [routerLink]="['/app/admin/users', user.userId]" class="inline-flex items-center gap-1 font-black text-violet-600 hover:text-violet-800">Chi tiết <app-icon name="arrow-right" [size]="15" /></a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </article>
      }

      @if (totalPages() > 1) {
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <p class="px-2 text-xs font-bold text-slate-400">Hiển thị {{ users().length }} / {{ totalCount() }} tài khoản</p>
          <div class="flex items-center gap-2"><button class="btn-secondary" [disabled]="page() <= 1" (click)="goPage(page() - 1)"><app-icon name="chevron-left" [size]="16" /> Trước</button><span class="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-600">{{ page() }} / {{ totalPages() }}</span><button class="btn-secondary" [disabled]="page() >= totalPages()" (click)="goPage(page() + 1)">Sau <app-icon name="chevron-right" [size]="16" /></button></div>
        </div>
      }
    </section>
  `,
})
export class UsersPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly toast = inject(ToastService)
  protected readonly users = signal<UserManagementResponse[]>([])
  protected readonly departments = signal<DepartmentResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly page = signal(1)
  protected readonly totalPages = signal(0)
  protected readonly totalCount = signal(0)
  protected keyword = ''
  protected roleName = ''
  protected departmentId: number | null = null
  protected status: number | null = null

  ngOnInit(): void {
    this.api.departments(false).subscribe({ next: (items) => this.departments.set(items), error: () => this.toast.error('Không tải được danh sách khoa/phòng ban') })
    this.load()
  }

  protected pagePenaltyPoints(): number { return this.users().reduce((sum, user) => sum + user.penaltyPoints, 0) }
  protected applyFilters(): void { this.page.set(1); this.load() }
  protected goPage(page: number): void { if (page < 1 || page > this.totalPages()) return; this.page.set(page); this.load() }
  protected initials(name: string): string { return name.trim().split(/\s+/).slice(-2).map((part) => part.charAt(0).toUpperCase()).join('') }
  protected roleLabel(role: string): string { return role === 'Admin' ? 'Quản trị viên' : role === 'LabManager' ? 'Quản lý phòng lab' : 'Người đặt lịch' }

  private load(): void {
    this.loading.set(true)
    this.api.users({ keyword: this.keyword.trim() || undefined, roleName: this.roleName || undefined, departmentId: this.departmentId ?? undefined, status: this.status ?? undefined, pageNumber: this.page(), pageSize: 20 }).subscribe({
      next: (response) => { this.users.set(response.items); this.totalPages.set(response.totalPages); this.totalCount.set(response.totalCount); this.loading.set(false) },
      error: () => { this.loading.set(false); this.toast.error('Không tải được danh sách người dùng') },
    })
  }
}
