import { NgClass } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { SystemService } from '../../core/api/system.service'
import type { EquipmentResponse, LabRoomResponse } from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { ModalComponent } from '../../shared/ui/modal'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'

@Component({
  selector: 'app-equipments-page',
  imports: [NgClass, FormsModule, RouterLink, PageHeaderComponent, IconComponent, ModalComponent, StatusBadgeComponent, DataStateComponent],
  template: `
    <section class="space-y-6">
      <app-page-header title="Danh mục thiết bị" subtitle="Tìm kiếm, kiểm tra trạng thái và đặt lịch các thiết bị dùng chung trong hệ thống.">
        <a routerLink="/app/calendar" class="btn-secondary"><app-icon name="calendar" [size]="17" /> Lịch thiết bị</a>
        @if (store.isAdmin()) { <button class="btn-primary" (click)="openCreate()"><app-icon name="plus" [size]="17" /> Thêm thiết bị</button> }
      </app-page-header>

      <div class="filter-bar md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto]">
        <div><label class="field-label">Tìm thiết bị</label><div class="relative"><span class="absolute left-4 top-3.5 text-slate-400"><app-icon name="search" [size]="18" /></span><input class="input-shell pl-11" [(ngModel)]="keyword" (keyup.enter)="load()" placeholder="Tên thiết bị, model..." /></div></div>
        <div><label class="field-label">Phòng lab</label><select class="input-shell" [(ngModel)]="labId"><option [ngValue]="null">Tất cả phòng</option>@for (lab of labs(); track lab.labId) { <option [ngValue]="lab.labId">{{ lab.labName }}</option> }</select></div>
        <div><label class="field-label">Trạng thái</label><select class="input-shell" [(ngModel)]="status"><option value="">Tất cả</option><option [value]="1">Sẵn sàng</option><option [value]="2">Đang sử dụng</option><option [value]="3">Bảo trì</option><option [value]="4">Bị hỏng</option><option [value]="5">Ngừng sử dụng</option></select></div>
        <div class="flex items-end"><button class="btn-primary w-full" (click)="load()"><app-icon name="filter" [size]="17" /> Lọc</button></div>
      </div>

      @if (loading()) { <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">@for (i of [1,2,3,4,5,6,7,8]; track i) { <div class="card-surface p-5"><div class="skeleton h-36 rounded-2xl"></div><div class="skeleton mt-4 h-5 w-3/4 rounded"></div><div class="skeleton mt-3 h-4 rounded"></div></div> }</div> }
      @else if (items().length === 0) { <app-data-state title="Không có thiết bị phù hợp" message="Hãy thử đổi từ khóa, phòng lab hoặc trạng thái thiết bị." icon="microscope" /> }
      @else {
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          @for (item of items(); track item.equipmentId; let index = $index) {
            <article class="group card-surface overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,.1)]">
              <div class="relative flex h-40 items-center justify-center overflow-hidden" [ngClass]="index % 4 === 0 ? 'bg-indigo-950' : index % 4 === 1 ? 'bg-cyan-950' : index % 4 === 2 ? 'bg-violet-950' : 'bg-slate-900'">
                <div class="absolute inset-0 opacity-35" style="background-image: radial-gradient(circle at 20% 20%, #a78bfa, transparent 26%), radial-gradient(circle at 80% 80%, #22d3ee, transparent 28%)"></div>
                <div class="relative flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/15 bg-white/10 text-white backdrop-blur"><app-icon name="microscope" [size]="38" /></div>
                <div class="absolute right-4 top-4"><app-status-badge [value]="item.status" domain="equipment" /></div>
              </div>
              <div class="p-5"><p class="truncate text-base font-black text-slate-950">{{ item.equipmentName }}</p><p class="mt-2 flex items-center gap-2 truncate text-xs text-slate-400"><app-icon name="building" [size]="15" /> {{ labName(item.labId) }}</p><div class="mt-5 flex gap-2"><a [routerLink]="['/app/equipments', item.equipmentId]" class="btn-primary flex-1">Chi tiết</a><a routerLink="/app/bookings/new" [queryParams]="{ equipmentId: item.equipmentId, labId: item.labId }" class="btn-secondary px-3"><app-icon name="calendar-plus" [size]="18" /></a></div></div>
            </article>
          }
        </div>
      }

      @if (totalPages() > 1) { <div class="flex justify-center gap-2"><button class="btn-secondary" [disabled]="page() <= 1" (click)="page.set(page()-1); load()">Trước</button><span class="rounded-xl bg-white px-4 py-3 text-xs font-black">{{ page() }}/{{ totalPages() }}</span><button class="btn-secondary" [disabled]="page() >= totalPages()" (click)="page.set(page()+1); load()">Sau</button></div> }

      <app-modal [open]="createOpen()" title="Thêm thiết bị mới" subtitle="Thiết bị phải thuộc một phòng lab đang tồn tại." (close)="createOpen.set(false)">
        <form class="grid gap-4" (ngSubmit)="create()"><div><label class="field-label">Phòng lab *</label><select class="input-shell" required [(ngModel)]="form.labId" name="labId"><option [ngValue]="null">Chọn phòng lab</option>@for (lab of labs(); track lab.labId) { <option [ngValue]="lab.labId">{{ lab.labName }} · {{ lab.roomCode }}</option> }</select></div><div><label class="field-label">Tên thiết bị *</label><input class="input-shell" required [(ngModel)]="form.equipmentName" name="equipmentName" placeholder="Máy quang phổ FTIR" /></div><div><label class="field-label">Model / thông số</label><textarea class="textarea-shell" [(ngModel)]="form.modelSpecs" name="modelSpecs" placeholder="Hãng, model, dải đo..."></textarea></div><div><label class="field-label">URL ảnh</label><input class="input-shell" [(ngModel)]="form.imageUrl" name="imageUrl" placeholder="https://..." /></div><div><label class="field-label">Hướng dẫn sử dụng</label><textarea class="textarea-shell" [(ngModel)]="form.usageGuideline" name="usageGuideline"></textarea></div><div class="flex justify-end gap-2"><button type="button" class="btn-secondary" (click)="createOpen.set(false)">Hủy</button><button class="btn-primary" [disabled]="saving()">{{ saving() ? 'Đang lưu...' : 'Tạo thiết bị' }}</button></div></form>
      </app-modal>
    </section>
  `,
})
export class EquipmentsPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly toast = inject(ToastService)
  protected readonly store = inject(AuthStore)
  protected readonly labs = signal<LabRoomResponse[]>([])
  protected readonly items = signal<EquipmentResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly saving = signal(false)
  protected readonly createOpen = signal(false)
  protected readonly page = signal(1)
  protected readonly totalPages = signal(1)
  protected keyword = ''
  protected labId: number | null = null
  protected status: string | number = ''
  protected form = { labId: null as number | null, equipmentName: '', modelSpecs: '', imageUrl: '', usageGuideline: '' }
  protected readonly labMap = computed(() => new Map(this.labs().map((lab) => [lab.labId, lab.labName])))

  ngOnInit(): void { this.api.labs().subscribe({ next: (labs) => { this.labs.set(labs); this.load() }, error: () => { this.loading.set(false); this.toast.error('Không tải được phòng lab') } }) }
  protected load(): void { this.loading.set(true); this.api.searchEquipments({ keyword: this.keyword || undefined, labId: this.labId ?? undefined, status: this.status || undefined, pageNumber: this.page(), pageSize: 16 }).subscribe({ next: (result) => { this.items.set(result.items); this.totalPages.set(result.totalPages || 1); this.loading.set(false) }, error: () => { this.loading.set(false); this.toast.error('Không tải được thiết bị') } }) }
  protected labName(id: number): string { return this.labMap().get(id) ?? `Phòng #${id}` }
  protected openCreate(): void { this.form = { labId: null, equipmentName: '', modelSpecs: '', imageUrl: '', usageGuideline: '' }; this.createOpen.set(true) }
  protected create(): void { if (!this.form.labId) { this.toast.info('Hãy chọn phòng lab'); return } this.saving.set(true); this.api.createEquipment({ labId: this.form.labId, equipmentName: this.form.equipmentName, modelSpecs: this.form.modelSpecs || null, imageUrl: this.form.imageUrl || null, usageGuideline: this.form.usageGuideline || null }).subscribe({ next: () => { this.saving.set(false); this.createOpen.set(false); this.toast.success('Đã thêm thiết bị'); this.load() }, error: () => { this.saving.set(false); this.toast.error('Không thể thêm thiết bị') } }) }
}
