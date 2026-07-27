import { Component, OnInit, inject, signal } from '@angular/core'
import { SystemService } from '../../core/api/system.service'
import type { RoleResponse } from '../../core/api/system.models'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { ToastService } from '../../shared/ui/toast.service'

@Component({
  selector: 'app-roles-page',
  imports: [PageHeaderComponent, IconComponent, DataStateComponent],
  template: `
    <section class="space-y-6">
      <app-page-header title="Danh sách vai trò" subtitle="Trang tham chiếu quyền read-only. Backend hiện không hỗ trợ tạo, sửa hoặc xóa role." />

      @if (loading()) { <div class="grid gap-5 lg:grid-cols-3">@for (item of [1,2,3]; track item) { <div class="skeleton h-80 rounded-[30px]"></div> }</div> }
      @else if (roles().length === 0) { <app-data-state icon="shield" title="Chưa có dữ liệu vai trò" message="API Roles chưa trả về bản ghi nào." /> }
      @else {
        <div class="grid gap-5 lg:grid-cols-3">
          @for (role of roles(); track role.roleId; let index = $index) {
            <article class="relative overflow-hidden rounded-[30px] border border-white bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,.08)]">
              <div class="absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl" [class.bg-violet-200]="index === 0" [class.bg-cyan-200]="index === 1" [class.bg-emerald-200]="index === 2"></div>
              <div class="relative"><div class="flex items-start justify-between"><span class="flex h-14 w-14 items-center justify-center rounded-2xl" [class.bg-violet-100]="role.roleName === 'Admin'" [class.text-violet-700]="role.roleName === 'Admin'" [class.bg-cyan-100]="role.roleName === 'LabManager'" [class.text-cyan-700]="role.roleName === 'LabManager'" [class.bg-emerald-100]="role.roleName === 'Requester'" [class.text-emerald-700]="role.roleName === 'Requester'"><app-icon [name]="roleIcon(role.roleName)" [size]="25" /></span><span class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">Role ID {{ role.roleId }}</span></div><p class="mt-7 text-[10px] font-black uppercase tracking-[.2em] text-slate-400">{{ role.roleName }}</p><h2 class="mt-2 text-2xl font-black text-slate-950">{{ roleLabel(role.roleName) }}</h2><p class="mt-3 min-h-16 text-sm leading-6 text-slate-500">{{ role.description || fallbackDescription(role.roleName) }}</p><div class="mt-6 rounded-2xl bg-slate-50 p-4"><p class="text-xs font-black text-slate-700">Phạm vi chính</p><ul class="mt-3 space-y-2">@for (permission of permissions(role.roleName); track permission) { <li class="flex items-start gap-2 text-xs leading-5 text-slate-500"><span class="mt-0.5 text-emerald-500"><app-icon name="check" [size]="14" /></span>{{ permission }}</li> }</ul></div></div>
            </article>
          }
        </div>
      }

      <article class="card-surface overflow-hidden"><header class="border-b border-slate-100 px-6 py-5"><h2 class="font-black text-slate-950">Ma trận truy cập tổng quát</h2><p class="mt-1 text-xs text-slate-400">Route guard trên frontend và [Authorize] ở backend cùng kiểm soát quyền.</p></header><div class="overflow-x-auto"><table class="table-shell"><thead><tr><th>Nhóm chức năng</th><th class="text-center">Requester</th><th class="text-center">LabManager</th><th class="text-center">Admin</th></tr></thead><tbody>@for (row of matrix; track row.name) { <tr><td class="font-black text-slate-800">{{ row.name }}</td><td class="text-center">{{ row.requester ? '✓' : '—' }}</td><td class="text-center">{{ row.manager ? '✓' : '—' }}</td><td class="text-center">{{ row.admin ? '✓' : '—' }}</td></tr> }</tbody></table></div></article>
    </section>
  `,
})
export class RolesPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly toast = inject(ToastService)
  protected readonly roles = signal<RoleResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly matrix = [
    { name: 'Xem tài nguyên và lịch dùng chung', requester: true, manager: true, admin: true },
    { name: 'Tạo và theo dõi booking cá nhân', requester: true, manager: true, admin: true },
    { name: 'Duyệt booking, bảo trì, sự cố', requester: false, manager: true, admin: true },
    { name: 'Dashboard và báo cáo', requester: false, manager: true, admin: true },
    { name: 'Quản trị người dùng và phòng ban', requester: false, manager: false, admin: true },
    { name: 'Audit log và quy tắc ưu tiên', requester: false, manager: false, admin: true },
  ]

  ngOnInit(): void { this.api.roles().subscribe({ next: (items) => { this.roles.set(items); this.loading.set(false) }, error: () => { this.loading.set(false); this.toast.error('Không tải được danh sách vai trò') } }) }
  protected roleLabel(role: string): string { return role === 'Admin' ? 'Quản trị viên' : role === 'LabManager' ? 'Quản lý phòng lab' : 'Người đặt lịch' }
  protected roleIcon(role: string): string { return role === 'Admin' ? 'shield' : role === 'LabManager' ? 'wrench' : 'user' }
  protected fallbackDescription(role: string): string { return role === 'Admin' ? 'Toàn quyền quản trị dữ liệu và nghiệp vụ hệ thống.' : role === 'LabManager' ? 'Quản lý nghiệp vụ trong các phòng lab được phân công.' : 'Xem tài nguyên, tạo booking và theo dõi hoạt động cá nhân.' }
  protected permissions(role: string): string[] { if (role === 'Admin') return ['Quản lý người dùng, đơn vị, tài nguyên', 'Xem toàn bộ báo cáo và audit log', 'Cấu hình quy tắc ưu tiên']; if (role === 'LabManager') return ['Duyệt booking trong phạm vi quản lý', 'Quản lý bảo trì và sự cố', 'Xem dashboard theo phòng phụ trách']; return ['Tạo booking và tham gia hàng chờ', 'Check-in/check-out tài nguyên', 'Xem thông báo và vi phạm cá nhân'] }
}
