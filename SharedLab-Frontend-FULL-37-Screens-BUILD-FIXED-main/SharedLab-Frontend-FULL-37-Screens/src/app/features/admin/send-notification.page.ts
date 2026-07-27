import { NgClass } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { SystemService } from '../../core/api/system.service'
import type { UserManagementResponse } from '../../core/api/system.models'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { ToastService } from '../../shared/ui/toast.service'

@Component({
  selector: 'app-send-notification-page',
  imports: [NgClass, FormsModule, PageHeaderComponent, IconComponent],
  template: `
    <section class="space-y-6">
      <app-page-header title="Gửi thông báo hệ thống" subtitle="Soạn thông báo trực tiếp cho một người dùng. Backend hiện chưa hỗ trợ gửi hàng loạt theo vai trò hoặc khoa.">
        <button class="btn-secondary" type="button" (click)="resetForm()"><app-icon name="refresh" [size]="17" /> Làm mới</button>
      </app-page-header>

      <div class="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <form class="card-surface overflow-hidden" (ngSubmit)="send()">
          <div class="border-b border-slate-100 bg-gradient-to-r from-violet-50/80 to-cyan-50/70 px-6 py-5"><div class="flex items-center gap-3"><span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200"><app-icon name="send" [size]="20" /></span><div><h2 class="font-black text-slate-950">Nội dung thông báo</h2><p class="mt-1 text-xs text-slate-500">Dữ liệu được gửi tới POST /api/Notifications/send.</p></div></div></div>
          <div class="space-y-5 p-6">
            <div><label class="field-label">Tìm người nhận *</label><div class="relative"><span class="pointer-events-none absolute left-4 top-3.5 text-slate-400"><app-icon name="search" [size]="18" /></span><input class="input-shell pl-11" [(ngModel)]="userSearch" name="userSearch" placeholder="Tìm theo họ tên, username hoặc email..." /></div>
              <div class="mt-3 max-h-56 overflow-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-2">@for (user of filteredUsers(); track user.userId) { <button type="button" class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition" [ngClass]="selectedUserId === user.userId ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : 'hover:bg-white'" (click)="selectedUserId = user.userId"><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black" [ngClass]="selectedUserId === user.userId ? 'bg-white/15 text-white' : 'bg-white text-violet-700 shadow-sm'">{{ initials(user.fullName) }}</span><span class="min-w-0 flex-1"><span class="block truncate text-sm font-black">{{ user.fullName }}</span><span class="mt-0.5 block truncate text-[11px]" [ngClass]="selectedUserId === user.userId ? 'text-white/65' : 'text-slate-400'">{{ user.email }} · {{ user.departmentName }}</span></span>@if (selectedUserId === user.userId) { <app-icon name="check" [size]="18" /> }</button> } @empty { <div class="px-3 py-8 text-center text-sm font-semibold text-slate-400">Không tìm thấy người dùng.</div> }</div>
            </div>
            <div><label class="field-label">Loại thông báo *</label><div class="grid gap-2 sm:grid-cols-2">@for (type of types; track type.value) { <button type="button" class="flex items-center gap-3 rounded-2xl border p-3 text-left transition" [ngClass]="notificationType === type.value ? 'border-violet-300 bg-violet-50 ring-2 ring-violet-100' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'" (click)="notificationType = type.value"><span class="flex h-9 w-9 items-center justify-center rounded-xl" [ngClass]="type.className"><app-icon [name]="type.icon" [size]="17" /></span><span><span class="block text-sm font-black text-slate-800">{{ type.label }}</span><span class="mt-0.5 block text-[11px] text-slate-400">{{ type.hint }}</span></span></button> }</div></div>
            <div><label class="field-label">Tiêu đề *</label><input class="input-shell" required maxlength="150" [(ngModel)]="title" name="title" placeholder="Tiêu đề ngắn gọn, dễ hiểu" /><p class="mt-2 text-right text-[11px] font-bold text-slate-400">{{ title.length }}/150</p></div>
            <div><label class="field-label">Nội dung *</label><textarea class="textarea-shell min-h-36" required maxlength="1000" [(ngModel)]="message" name="message" placeholder="Viết nội dung thông báo chi tiết..."></textarea><p class="mt-2 text-right text-[11px] font-bold text-slate-400">{{ message.length }}/1000</p></div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5"><p class="text-xs font-semibold text-slate-400">Thông báo sẽ xuất hiện ngay trong Trung tâm thông báo của người nhận.</p><button class="btn-primary" [disabled]="sending() || !isValid()"><app-icon name="send" [size]="17" /> {{ sending() ? 'Đang gửi...' : 'Gửi thông báo' }}</button></div>
        </form>

        <div class="space-y-6">
          <article class="card-surface overflow-hidden"><header class="border-b border-slate-100 px-6 py-5"><p class="text-[10px] font-black uppercase tracking-[.2em] text-violet-600">Xem trước</p><h2 class="mt-2 font-black text-slate-950">Thông báo trên giao diện người nhận</h2></header><div class="bg-[#f5f7fb] p-6"><div class="rounded-[24px] border border-white bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,.09)]"><div class="flex items-start gap-4"><span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" [ngClass]="selectedType().className"><app-icon [name]="selectedType().icon" [size]="21" /></span><div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-3"><h3 class="font-black text-slate-900">{{ title || 'Tiêu đề thông báo' }}</h3><span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500"></span></div><p class="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500">{{ message || 'Nội dung thông báo sẽ được hiển thị ở đây để bạn kiểm tra trước khi gửi.' }}</p><p class="mt-4 text-[11px] font-bold text-slate-400">Vừa xong · {{ selectedType().label }}</p></div></div></div></div></article>
          <article class="rounded-[28px] border border-amber-200 bg-amber-50 p-6"><div class="flex items-start gap-4"><span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><app-icon name="lightbulb" [size]="20" /></span><div><h3 class="font-black text-amber-900">Giới hạn API hiện tại</h3><p class="mt-2 text-sm leading-6 text-amber-800">Mỗi request chỉ gửi cho một UserId. Trang này cố ý không lặp request hàng loạt để tránh gửi thiếu, gửi trùng hoặc làm nghẽn backend.</p></div></div></article>
          @if (selectedUser(); as recipient) { <article class="card-surface p-6"><p class="text-xs font-black uppercase tracking-[.18em] text-slate-400">Người nhận đã chọn</p><div class="mt-4 flex items-center gap-4"><div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 font-black text-violet-700">{{ initials(recipient.fullName) }}</div><div><p class="font-black text-slate-900">{{ recipient.fullName }}</p><p class="mt-1 text-xs text-slate-400">{{ recipient.email }}</p><p class="mt-1 text-xs font-bold text-violet-600">{{ recipient.roleName }} · {{ recipient.departmentName }}</p></div></div></article> }
        </div>
      </div>
    </section>
  `,
})
export class SendNotificationPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly toast = inject(ToastService)
  protected readonly users = signal<UserManagementResponse[]>([])
  protected readonly sending = signal(false)
  protected userSearch = ''
  protected selectedUserId: number | null = null
  protected notificationType = 7
  protected title = ''
  protected message = ''
  protected readonly types = [
    { value: 1, label: 'Booking được duyệt', hint: 'Kết quả phê duyệt', icon: 'check', className: 'bg-emerald-100 text-emerald-700' },
    { value: 2, label: 'Booking bị từ chối', hint: 'Thông báo từ chối', icon: 'x', className: 'bg-rose-100 text-rose-700' },
    { value: 3, label: 'Nhắc lịch booking', hint: 'Sắp tới giờ sử dụng', icon: 'clock', className: 'bg-indigo-100 text-indigo-700' },
    { value: 4, label: 'Hàng chờ có chỗ', hint: 'Mời tạo booking', icon: 'users', className: 'bg-cyan-100 text-cyan-700' },
    { value: 5, label: 'Bảo trì', hint: 'Lịch tài nguyên', icon: 'wrench', className: 'bg-amber-100 text-amber-700' },
    { value: 6, label: 'Vi phạm', hint: 'Điểm phạt tài khoản', icon: 'alert', className: 'bg-rose-100 text-rose-700' },
    { value: 7, label: 'Hệ thống', hint: 'Nội dung chung', icon: 'bell', className: 'bg-violet-100 text-violet-700' },
  ] as const
  protected readonly filteredUsers = computed(() => { const query = this.userSearch.trim().toLowerCase(); return this.users().filter((user) => !query || `${user.fullName} ${user.username} ${user.email}`.toLowerCase().includes(query)).slice(0, 20) })
  protected readonly selectedUser = computed(() => this.users().find((user) => user.userId === this.selectedUserId) ?? null)
  protected readonly selectedType = computed(() => this.types.find((type) => type.value === this.notificationType) ?? this.types[this.types.length - 1])

  ngOnInit(): void { this.api.users({ pageNumber: 1, pageSize: 100 }).subscribe({ next: (response) => this.users.set(response.items), error: () => this.toast.error('Không tải được danh sách người nhận') }) }
  protected initials(name: string): string { return name.trim().split(/\s+/).slice(-2).map((part) => part.charAt(0).toUpperCase()).join('') }
  protected isValid(): boolean { return this.selectedUserId !== null && this.title.trim().length > 0 && this.message.trim().length > 0 }
  protected resetForm(): void { this.userSearch = ''; this.selectedUserId = null; this.notificationType = 7; this.title = ''; this.message = '' }

  protected send(): void {
    if (!this.isValid() || this.selectedUserId === null) { this.toast.info('Vui lòng chọn người nhận và nhập đầy đủ nội dung'); return }
    this.sending.set(true)
    this.api.sendNotification({ userId: this.selectedUserId, title: this.title.trim(), message: this.message.trim(), notificationType: this.notificationType }).subscribe({ next: () => { this.sending.set(false); this.toast.success('Đã gửi thông báo', `Thông báo đã được gửi tới ${this.selectedUser()?.fullName ?? 'người nhận'}.`); this.title = ''; this.message = '' }, error: () => { this.sending.set(false); this.toast.error('Không thể gửi thông báo') } })
  }
}
