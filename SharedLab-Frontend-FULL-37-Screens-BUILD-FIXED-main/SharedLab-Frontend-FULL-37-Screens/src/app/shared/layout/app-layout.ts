import { NgClass } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { catchError, of } from 'rxjs'
import { NotificationBadgeService } from '../../core/api/notification-badge.service'
import { WorkspaceService } from '../../core/api/workspace.service'
import { AuthStore } from '../../core/auth/auth.store'
import { IconComponent } from '../ui/icon'

interface NavItem {
  label: string
  icon: string
  route: string
  roles?: readonly string[]
  badge?: 'notifications'
}

interface NavGroup {
  label: string
  items: readonly NavItem[]
  roles?: readonly string[]
}

@Component({
  selector: 'app-layout',
  imports: [NgClass, RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  template: `
    <div class="min-h-screen bg-[#f5f7fb] text-slate-900">
      @if (mobileOpen()) {
        <button type="button" class="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm lg:hidden" aria-label="Đóng menu" (click)="mobileOpen.set(false)"></button>
      }

      <aside class="fixed inset-y-0 left-0 z-40 flex w-[292px] flex-col border-r border-white/10 bg-[#101936] text-white shadow-2xl shadow-slate-900/20 transition-transform duration-300 lg:translate-x-0" [ngClass]="mobileOpen() ? 'translate-x-0' : '-translate-x-full'">
        <div class="flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-5">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-cyan-300 text-[#111a3a] shadow-lg shadow-violet-500/20"><app-icon name="flask" [size]="24" /></div>
          <div class="min-w-0"><p class="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Shared Lab</p><p class="mt-1 truncate text-sm font-black">Booking System</p></div>
          <button type="button" class="ml-auto rounded-xl p-2 text-white/55 hover:bg-white/10 hover:text-white lg:hidden" (click)="mobileOpen.set(false)"><app-icon name="x" [size]="20" /></button>
        </div>

        <div class="border-b border-white/10 px-4 py-4">
          <a routerLink="/app/bookings/new" class="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-950/25 transition hover:-translate-y-0.5" (click)="mobileOpen.set(false)"><app-icon name="calendar-plus" [size]="18" /> Tạo booking nhanh</a>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,.15)_transparent]">
          @for (group of visibleGroups(); track group.label) {
            <div class="mb-5">
              <p class="px-3 text-[9px] font-black uppercase tracking-[0.22em] text-white/30">{{ group.label }}</p>
              <nav class="mt-2 space-y-1">
                @for (item of group.items; track item.route) {
                  <a [routerLink]="item.route" routerLinkActive="bg-white text-[#182144] shadow-lg shadow-black/10" class="group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13px] font-bold text-white/64 transition hover:bg-white/10 hover:text-white" (click)="mobileOpen.set(false)">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[.06] transition group-hover:bg-white/10"><app-icon [name]="item.icon" [size]="17" /></span>
                    <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
                    @if (item.badge === 'notifications' && badge.count() > 0) { <span class="min-w-6 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[9px] font-black text-white">{{ badge.count() > 99 ? '99+' : badge.count() }}</span> }
                  </a>
                }
              </nav>
            </div>
          }
        </div>

        <div class="shrink-0 border-t border-white/10 p-3">
          @if (store.user(); as user) {
            <div class="rounded-[22px] border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur">
              <a routerLink="/app/profile" class="flex items-center gap-3 rounded-xl transition hover:bg-white/[.04]" (click)="mobileOpen.set(false)"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-cyan-300 text-xs font-black text-[#111a3a]">{{ initials(user.fullName) }}</div><div class="min-w-0 flex-1"><p class="truncate text-sm font-black">{{ user.fullName }}</p><p class="mt-0.5 truncate text-[10px] font-semibold text-white/40">{{ roleLabel(user.roleName) }}</p></div><app-icon name="chevron-right" [size]="15" /></a>
              <div class="mt-3 flex items-center justify-between border-t border-white/10 pt-3"><span class="inline-flex items-center gap-2 text-[10px] font-bold text-emerald-300"><span class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.12)]"></span> Đã kết nối</span><button type="button" class="rounded-xl p-2 text-white/45 hover:bg-white/10 hover:text-white" title="Đăng xuất" (click)="logout()"><app-icon name="logout" [size]="17" /></button></div>
            </div>
          }
        </div>
      </aside>

      <div class="min-h-screen lg:pl-[292px]">
        <header class="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-slate-200/80 bg-white/88 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button type="button" class="rounded-xl border border-slate-200 p-2.5 text-slate-600 shadow-sm hover:bg-slate-50 lg:hidden" (click)="mobileOpen.set(true)"><app-icon name="menu" [size]="20" /></button>
          <div class="min-w-0 flex-1"><p class="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Shared Lab Workspace</p><p class="mt-1 truncate text-sm font-bold text-slate-600">Quản lý phòng thí nghiệm & thiết bị dùng chung</p></div>
          <a routerLink="/app/calendar" class="hidden h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 sm:flex"><app-icon name="calendar" [size]="18" /> Xem lịch</a>
          <a routerLink="/app/notifications" class="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md" aria-label="Thông báo"><app-icon name="bell" [size]="20" />@if (badge.count() > 0) { <span class="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500"></span> }</a>
          <a routerLink="/app/profile" class="hidden items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-slate-50 md:flex">@if (store.user(); as user) { <div class="text-right"><p class="text-sm font-black text-slate-800">{{ user.fullName }}</p><p class="mt-0.5 text-[10px] font-bold text-slate-400">{{ roleLabel(user.roleName) }}</p></div><div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e9e8ff] text-sm font-black text-indigo-700">{{ initials(user.fullName) }}</div> }</a>
        </header>

        <main class="mx-auto w-full max-w-[1580px] p-4 sm:p-6 lg:p-8"><router-outlet /></main>
      </div>
    </div>
  `,
})
export class AppLayoutComponent implements OnInit {
  protected readonly store = inject(AuthStore)
  private readonly workspace = inject(WorkspaceService)
  protected readonly badge = inject(NotificationBadgeService)
  private readonly router = inject(Router)
  protected readonly mobileOpen = signal(false)

  private readonly groups: readonly NavGroup[] = [
    {
      label: 'Tổng quan',
      items: [
        { label: 'Trang chủ', icon: 'home', route: '/app/home', roles: ['Requester'] },
        { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard', roles: ['Admin', 'LabManager'] },
        { label: 'Lịch tài nguyên', icon: 'calendar', route: '/app/calendar' },
      ],
    },
    {
      label: 'Tài nguyên',
      items: [
        { label: 'Phòng thí nghiệm', icon: 'building', route: '/app/labs' },
        { label: 'Thiết bị', icon: 'microscope', route: '/app/equipments' },
        { label: 'Lịch bảo trì', icon: 'wrench', route: '/app/management/maintenances' },
      ],
    },
    {
      label: 'Cá nhân',
      items: [
        { label: 'Booking của tôi', icon: 'clipboard', route: '/app/bookings/my' },
        { label: 'Hàng chờ của tôi', icon: 'hourglass', route: '/app/waitlists/my' },
        { label: 'Vi phạm & điểm phạt', icon: 'alert', route: '/app/violations/my' },
        { label: 'Thông báo', icon: 'bell', route: '/app/notifications', badge: 'notifications' },
        { label: 'Tài khoản cá nhân', icon: 'user', route: '/app/profile' },
      ],
    },
    {
      label: 'Nghiệp vụ quản lý',
      roles: ['Admin', 'LabManager'],
      items: [
        { label: 'Booking cần duyệt', icon: 'inbox', route: '/app/management/bookings/pending' },
        { label: 'Quản lý booking', icon: 'clipboard', route: '/app/management/bookings' },
        { label: 'Quản lý bảo trì', icon: 'wrench', route: '/app/management/maintenances' },
        { label: 'Nhật ký sử dụng', icon: 'activity', route: '/app/management/usage-logs' },
        { label: 'Duyệt sự cố', icon: 'alert', route: '/app/management/incidents' },
        { label: 'Quản lý hàng chờ', icon: 'hourglass', route: '/app/management/waitlists' },
        { label: 'Quản lý vi phạm', icon: 'shield-alert', route: '/app/management/violations' },
        { label: 'Trung tâm báo cáo', icon: 'chart', route: '/app/reports' },
      ],
    },
    {
      label: 'Quản trị hệ thống',
      roles: ['Admin'],
      items: [
        { label: 'Người dùng', icon: 'users', route: '/app/admin/users' },
        { label: 'Khoa/phòng ban', icon: 'building', route: '/app/admin/departments' },
        { label: 'Quy tắc ưu tiên', icon: 'layers', route: '/app/admin/priority-rules' },
        { label: 'Gửi thông báo', icon: 'send', route: '/app/admin/notifications/send' },
        { label: 'Audit log', icon: 'history', route: '/app/admin/audit-logs' },
        { label: 'Danh sách vai trò', icon: 'shield', route: '/app/admin/roles' },
      ],
    },
  ]

  protected readonly visibleGroups = computed(() => {
    const role = this.store.role()
    return this.groups
      .filter((group) => !group.roles || group.roles.includes(role))
      .map((group) => ({ ...group, items: group.items.filter((item) => !item.roles || item.roles.includes(role)) }))
      .filter((group) => group.items.length > 0)
  })

  ngOnInit(): void {
    const user = this.store.user()
    if (!user) return
    this.workspace.unreadCount(user.userId).pipe(catchError(() => of({ userId: user.userId, unreadCount: 0 }))).subscribe((response) => this.badge.set(response.unreadCount))
  }

  protected initials(name: string): string { return name.trim().split(/\s+/).slice(-2).map((part) => part.charAt(0).toUpperCase()).join('') }
  protected roleLabel(role: string): string { return role === 'Admin' ? 'Quản trị viên' : role === 'LabManager' ? 'Quản lý phòng lab' : 'Người đặt lịch' }
  protected async logout(): Promise<void> { await this.store.logout(); void this.router.navigate(['/login']) }
}
