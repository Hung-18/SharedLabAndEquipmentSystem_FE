import { DatePipe, NgClass } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { forkJoin } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import type { BookingItemRequest, EquipmentResponse, LabRoomResponse, PriorityRuleResponse, SuggestedSlotResponse } from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { ToastService } from '../../shared/ui/toast.service'
import { labelOf, toIso, toLocalDateTimeInput } from '../../shared/utils/presentation'

interface SelectedResource {
  key: string
  resourceType: number
  labId: number | null
  equipmentId: number | null
  name: string
  note: string
}

@Component({
  selector: 'app-booking-form-page',
  imports: [DatePipe, NgClass, FormsModule, RouterLink, PageHeaderComponent, IconComponent, DataStateComponent],
  template: `
    <section class="space-y-6">
      <app-page-header title="Tạo yêu cầu booking" subtitle="Quy trình 4 bước giúp chọn đúng tài nguyên, thời gian và mức ưu tiên trước khi gửi duyệt.">
        <a routerLink="/app/calendar" class="btn-secondary"><app-icon name="calendar" [size]="17" /> Kiểm tra lịch</a>
      </app-page-header>

      @if (store.user()?.status !== 'Active') {
        <div class="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-amber-900"><div class="flex gap-3"><app-icon name="alert" [size]="21" /><div><p class="font-black">Tài khoản hiện không thể tạo booking</p><p class="mt-1 text-sm leading-6 text-amber-800/75">Trạng thái hiện tại: {{ store.user()?.status }}. Liên hệ quản trị viên hoặc chờ hết thời gian hạn chế.</p></div></div></div>
      }

      <div class="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div class="space-y-6">
          <div class="card-surface p-3 sm:p-4"><div class="grid grid-cols-4 gap-2">@for (item of steps; track item.id) { <button type="button" class="relative rounded-2xl px-2 py-3 text-center transition" [ngClass]="step() === item.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' : step() > item.id ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'" (click)="goTo(item.id)"><span class="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-current/20 text-xs font-black">{{ step() > item.id ? '✓' : item.id }}</span><span class="mt-2 hidden text-[10px] font-black uppercase tracking-[.08em] sm:block">{{ item.label }}</span></button> }</div></div>

          @if (step() === 1) {
            <article class="card-surface p-5 sm:p-7"><div class="flex items-start gap-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><app-icon name="microscope" [size]="23" /></div><div><h2 class="text-xl font-black text-slate-950">Chọn tài nguyên</h2><p class="mt-1 text-sm text-slate-500">Một booking chỉ được chứa tài nguyên thuộc cùng một phòng lab.</p></div></div>
              <div class="mt-6 grid gap-4 md:grid-cols-2"><button type="button" class="rounded-[24px] border p-5 text-left transition" [ngClass]="mode() === 'lab' ? 'border-violet-300 bg-violet-50 shadow-lg shadow-violet-100' : 'border-slate-200 bg-white hover:border-violet-200'" (click)="setMode('lab')"><div class="flex items-center gap-3"><span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm"><app-icon name="building" [size]="22" /></span><div><p class="font-black text-slate-900">Đặt cả phòng</p><p class="mt-1 text-xs text-slate-500">Sử dụng toàn bộ không gian</p></div></div></button><button type="button" class="rounded-[24px] border p-5 text-left transition" [ngClass]="mode() === 'equipment' ? 'border-cyan-300 bg-cyan-50 shadow-lg shadow-cyan-100' : 'border-slate-200 bg-white hover:border-cyan-200'" (click)="setMode('equipment')"><div class="flex items-center gap-3"><span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-600 shadow-sm"><app-icon name="microscope" [size]="22" /></span><div><p class="font-black text-slate-900">Đặt thiết bị</p><p class="mt-1 text-xs text-slate-500">Có thể chọn nhiều thiết bị</p></div></div></button></div>
              <div class="mt-6"><label class="field-label">Phòng lab *</label><select class="input-shell" [(ngModel)]="labId" (ngModelChange)="onLabChange()"><option [ngValue]="null">Chọn phòng lab</option>@for (lab of labs(); track lab.labId) { <option [ngValue]="lab.labId" [disabled]="lab.status !== 'Available'">{{ lab.labName }} · {{ lab.roomCode }} · {{ lab.status }}</option> }</select></div>
              @if (mode() === 'lab' && selected().length) { <div class="mt-5 rounded-[24px] border border-violet-200 bg-violet-50 p-5"><p class="font-black text-violet-900">{{ selected()[0].name }}</p><label class="field-label mt-4">Ghi chú cho phòng</label><input class="input-shell" [ngModel]="selected()[0].note" (ngModelChange)="updateNote(0, $event)" placeholder="Yêu cầu bố trí, lưu ý khi sử dụng..." /></div> }
              @if (mode() === 'equipment' && labId) { <div class="mt-6"><div class="flex items-center justify-between"><div><p class="font-black text-slate-900">Thiết bị trong phòng</p><p class="mt-1 text-xs text-slate-400">Chọn một hoặc nhiều thiết bị sẵn sàng</p></div><span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{{ selected().length }} đã chọn</span></div>@if (availableEquipments().length === 0) { <div class="mt-4"><app-data-state title="Không có thiết bị" message="Phòng này chưa có thiết bị hoặc không thể tải dữ liệu." icon="microscope" /></div> } @else { <div class="mt-4 grid gap-3 md:grid-cols-2">@for (equipment of availableEquipments(); track equipment.equipmentId) { <button type="button" class="flex items-center gap-3 rounded-2xl border p-4 text-left transition" [ngClass]="isSelected(equipment.equipmentId) ? 'border-cyan-300 bg-cyan-50 shadow-sm' : 'border-slate-200 hover:border-cyan-200'" [disabled]="equipment.status !== 'Available'" (click)="toggleEquipment(equipment)"><span class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm"><app-icon name="microscope" [size]="19" /></span><span class="min-w-0 flex-1"><span class="block truncate text-sm font-black text-slate-900">{{ equipment.equipmentName }}</span><span class="mt-1 block text-[10px] font-bold text-slate-400">{{ equipment.status }}</span></span>@if (isSelected(equipment.equipmentId)) { <span class="text-cyan-600"><app-icon name="check" [size]="18" /></span> }</button> }</div> }</div> }
              <div class="mt-7 flex justify-end"><button class="btn-primary" [disabled]="selected().length === 0" (click)="step.set(2)">Tiếp tục <app-icon name="arrow-right" [size]="17" /></button></div>
            </article>
          }

          @if (step() === 2) {
            <article class="card-surface p-5 sm:p-7"><div class="flex items-start gap-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"><app-icon name="clock" [size]="23" /></div><div><h2 class="text-xl font-black text-slate-950">Chọn thời gian</h2><p class="mt-1 text-sm text-slate-500">Thời gian sẽ được chuyển sang UTC trước khi gửi backend.</p></div></div><div class="mt-6 grid gap-4 sm:grid-cols-2"><div><label class="field-label">Bắt đầu *</label><input class="input-shell" type="datetime-local" [(ngModel)]="startTime" /></div><div><label class="field-label">Kết thúc *</label><input class="input-shell" type="datetime-local" [(ngModel)]="endTime" /></div></div><div class="mt-5 flex flex-wrap gap-2"><button class="btn-secondary" (click)="checkAvailability()" [disabled]="checking()"><app-icon name="search" [size]="17" /> {{ checking() ? 'Đang kiểm tra...' : 'Kiểm tra khung giờ' }}</button><a routerLink="/app/calendar" [queryParams]="{ labId: labId }" class="btn-secondary"><app-icon name="calendar" [size]="17" /> Mở lịch phòng</a></div>
              @if (availabilityMessage()) { <div class="mt-5 rounded-2xl border p-4" [ngClass]="available() ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'"><div class="flex flex-wrap items-center gap-3"><p class="flex min-w-0 flex-1 items-center gap-2 font-black"><app-icon [name]="available() ? 'check' : 'alert'" [size]="18" /> {{ availabilityMessage() }}</p>@if(!available()){<button type="button" class="btn-secondary shrink-0" [disabled]="joiningWaitlist() || selected().length !== 1" (click)="joinWaitlist()"><app-icon name="hourglass" [size]="16" /> {{joiningWaitlist()?'Đang tham gia...':'Tham gia hàng chờ'}}</button>}</div>@if(!available()&&selected().length>1){<p class="mt-3 text-xs leading-5 opacity-75">Hàng chờ hiện chỉ nhận một phòng hoặc một thiết bị mỗi lượt. Hãy giữ lại một thiết bị nếu muốn tham gia.</p>}</div> }
              @if (suggestions().length) { <div class="mt-6"><p class="font-black text-slate-900">Khung giờ thay thế</p><div class="mt-3 grid gap-3 md:grid-cols-2">@for (slot of suggestions(); track slot.startTime) { <button class="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left hover:bg-violet-100" (click)="chooseSlot(slot)"><p class="text-sm font-black text-violet-900">{{ slot.startTime | date:'HH:mm dd/MM/yyyy' }}</p><p class="mt-1 text-xs text-violet-700">đến {{ slot.endTime | date:'HH:mm dd/MM/yyyy' }}</p></button> }</div></div> }
              <div class="mt-7 flex justify-between"><button class="btn-secondary" (click)="step.set(1)"><app-icon name="arrow-left" [size]="17" /> Quay lại</button><button class="btn-primary" [disabled]="!validTime()" (click)="step.set(3)">Tiếp tục <app-icon name="arrow-right" [size]="17" /></button></div>
            </article>
          }

          @if (step() === 3) {
            <article class="card-surface p-5 sm:p-7"><div class="flex items-start gap-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><app-icon name="sparkles" [size]="23" /></div><div><h2 class="text-xl font-black text-slate-950">Mục đích & ưu tiên</h2><p class="mt-1 text-sm text-slate-500">Mức ưu tiên được đọc từ quy tắc đang Active trong backend.</p></div></div><div class="mt-6 grid gap-3 sm:grid-cols-2">@for (purpose of purposes; track purpose.value) { <button type="button" class="rounded-2xl border p-4 text-left transition" [ngClass]="purposeType === purpose.value ? 'border-violet-300 bg-violet-50 shadow-sm' : 'border-slate-200 hover:border-violet-200'" (click)="purposeType = purpose.value"><div class="flex items-start justify-between gap-3"><div><p class="font-black text-slate-900">{{ purpose.label }}</p><p class="mt-1 text-xs leading-5 text-slate-500">{{ purpose.description }}</p></div><span class="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-violet-700 shadow-sm">P{{ priorityFor(purpose.key) }}</span></div></button> }</div><div class="mt-5"><label class="field-label">Mô tả mục đích *</label><textarea class="textarea-shell min-h-36" [(ngModel)]="purposeDescription" placeholder="Mô tả nội dung thực hành, dự án, số người tham gia và kết quả mong đợi..."></textarea></div><div class="mt-7 flex justify-between"><button class="btn-secondary" (click)="step.set(2)"><app-icon name="arrow-left" [size]="17" /> Quay lại</button><button class="btn-primary" [disabled]="!purposeDescription.trim()" (click)="step.set(4)">Xem lại <app-icon name="arrow-right" [size]="17" /></button></div></article>
          }

          @if (step() === 4) {
            <article class="card-surface p-5 sm:p-7"><div class="flex items-start gap-4"><div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><app-icon name="check" [size]="23" /></div><div><h2 class="text-xl font-black text-slate-950">Xác nhận yêu cầu</h2><p class="mt-1 text-sm text-slate-500">Kiểm tra lần cuối trước khi gửi booking ở trạng thái Pending.</p></div></div><div class="mt-6 grid gap-4 md:grid-cols-2"><div class="rounded-2xl bg-slate-50 p-5"><p class="text-[10px] font-black uppercase tracking-[.15em] text-slate-400">Thời gian</p><p class="mt-2 font-black text-slate-900">{{ startTime | date:'HH:mm dd/MM/yyyy' }}</p><p class="mt-1 text-sm text-slate-500">đến {{ endTime | date:'HH:mm dd/MM/yyyy' }}</p></div><div class="rounded-2xl bg-slate-50 p-5"><p class="text-[10px] font-black uppercase tracking-[.15em] text-slate-400">Mục đích</p><p class="mt-2 font-black text-slate-900">{{ purposeLabel() }}</p><p class="mt-1 text-sm text-slate-500">Mức ưu tiên P{{ priorityFor(purposeKey()) }}</p></div></div><div class="mt-4 rounded-2xl border border-slate-200 p-5"><p class="text-xs font-black text-slate-700">Tài nguyên đã chọn</p><div class="mt-3 space-y-3">@for (resource of selected(); track resource.key) { <div class="flex items-center gap-3"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><app-icon [name]="resource.resourceType === 1 ? 'building' : 'microscope'" [size]="17" /></span><div class="min-w-0 flex-1"><p class="truncate text-sm font-black text-slate-900">{{ resource.name }}</p><p class="truncate text-xs text-slate-400">{{ resource.note || 'Không có ghi chú' }}</p></div></div> }</div></div><div class="mt-4 rounded-2xl bg-violet-50 p-5"><p class="text-xs font-black text-violet-800">Mô tả</p><p class="mt-2 whitespace-pre-line text-sm leading-6 text-violet-900/70">{{ purposeDescription }}</p></div><div class="mt-7 flex justify-between"><button class="btn-secondary" (click)="step.set(3)"><app-icon name="arrow-left" [size]="17" /> Quay lại</button><button class="btn-primary" [disabled]="submitting() || store.user()?.status !== 'Active'" (click)="submit()"><app-icon name="send" [size]="17" /> {{ submitting() ? 'Đang gửi...' : 'Gửi yêu cầu booking' }}</button></div></article>
          }
        </div>

        <aside class="space-y-4 xl:sticky xl:top-28 xl:self-start"><article class="card-surface p-5"><p class="text-[10px] font-black uppercase tracking-[.16em] text-violet-500">Tóm tắt nhanh</p><div class="mt-4 space-y-4"><div class="flex items-center justify-between text-sm"><span class="text-slate-500">Phòng lab</span><strong class="max-w-40 truncate text-slate-900">{{ selectedLabName() }}</strong></div><div class="h-px bg-slate-100"></div><div class="flex items-center justify-between text-sm"><span class="text-slate-500">Tài nguyên</span><strong class="text-slate-900">{{ selected().length }}</strong></div><div class="h-px bg-slate-100"></div><div class="flex items-center justify-between text-sm"><span class="text-slate-500">Ưu tiên</span><strong class="text-violet-700">P{{ priorityFor(purposeKey()) }}</strong></div></div></article><article class="rounded-[24px] border border-cyan-200 bg-gradient-to-br from-cyan-50 to-indigo-50 p-5"><div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-600 shadow-sm"><app-icon name="lightbulb" [size]="21" /></div><p class="mt-4 font-black text-slate-900">Mẹo đặt lịch</p><p class="mt-2 text-sm leading-6 text-slate-600">Kiểm tra lịch trước khi gửi. Pending không khóa tài nguyên; booking chỉ khóa slot sau khi được duyệt.</p></article></aside>
      </div>
    </section>
  `,
})
export class BookingFormPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly toast = inject(ToastService)
  protected readonly store = inject(AuthStore)
  protected readonly labs = signal<LabRoomResponse[]>([])
  protected readonly equipments = signal<EquipmentResponse[]>([])
  protected readonly rules = signal<PriorityRuleResponse[]>([])
  protected readonly selected = signal<SelectedResource[]>([])
  protected readonly mode = signal<'lab' | 'equipment'>('lab')
  protected readonly step = signal(1)
  protected readonly suggestions = signal<SuggestedSlotResponse[]>([])
  protected readonly checking = signal(false)
  protected readonly submitting = signal(false)
  protected readonly joiningWaitlist = signal(false)
  protected readonly available = signal(false)
  protected readonly availabilityMessage = signal('')
  protected labId: number | null = null
  protected startTime = toLocalDateTimeInput(new Date(Date.now() + 24 * 60 * 60 * 1000))
  protected endTime = toLocalDateTimeInput(new Date(Date.now() + 26 * 60 * 60 * 1000))
  protected purposeType = 1
  protected purposeDescription = ''
  private sourceWaitlistId: number | null = null
  protected readonly steps = [{ id: 1, label: 'Tài nguyên' }, { id: 2, label: 'Thời gian' }, { id: 3, label: 'Mục đích' }, { id: 4, label: 'Xác nhận' }]
  protected readonly purposes = [
    { value: 1, key: 'ResearchProject', label: 'Dự án nghiên cứu', description: 'Nghiên cứu khoa học, đề tài hoặc dự án.' },
    { value: 2, key: 'CoursePractice', label: 'Thực hành môn học', description: 'Buổi thực hành theo kế hoạch môn học.' },
    { value: 3, key: 'SelfStudy', label: 'Tự học', description: 'Tự nghiên cứu hoặc luyện tập cá nhân.' },
    { value: 4, key: 'Other', label: 'Mục đích khác', description: 'Các nhu cầu hợp lệ ngoài ba nhóm trên.' },
  ]
  protected readonly availableEquipments = computed(() => this.equipments().filter((item) => item.labId === this.labId))
  protected readonly selectedLabName = computed(() => this.labs().find((lab) => lab.labId === this.labId)?.labName ?? 'Chưa chọn')

  ngOnInit(): void {
    forkJoin({ labs: this.api.labs(), equipments: this.api.equipments(), rules: this.api.priorityRules(true) }).subscribe({
      next: ({ labs, equipments, rules }) => {
        this.labs.set(labs)
        this.equipments.set(equipments)
        this.rules.set(rules)

        const query = this.route.snapshot.queryParamMap
        const qLab = Number(query.get('labId'))
        const qEquipment = Number(query.get('equipmentId'))
        const qStart = query.get('start')
        const qEnd = query.get('end')
        const qWaitlist = Number(query.get('waitlistId'))
        if (qStart && !Number.isNaN(new Date(qStart).getTime())) this.startTime = toLocalDateTimeInput(qStart)
        if (qEnd && !Number.isNaN(new Date(qEnd).getTime())) this.endTime = toLocalDateTimeInput(qEnd)
        this.sourceWaitlistId = qWaitlist > 0 ? qWaitlist : null

        if (qLab) {
          this.labId = qLab
          this.mode.set(qEquipment ? 'equipment' : 'lab')
          this.onLabChange()
          if (qEquipment) {
            const item = equipments.find((equipment) => equipment.equipmentId === qEquipment)
            if (item) this.toggleEquipment(item)
          }
        }
      },
      error: () => this.toast.error('Không tải được dữ liệu tạo booking'),
    })
  }

  protected setMode(mode: 'lab' | 'equipment'): void { this.mode.set(mode); this.selected.set([]); if (this.labId) this.onLabChange() }
  protected onLabChange(): void { this.selected.set([]); const lab = this.labs().find((item) => item.labId === this.labId); if (lab && this.mode() === 'lab') this.selected.set([{ key: `lab-${lab.labId}`, resourceType: 1, labId: lab.labId, equipmentId: null, name: lab.labName, note: '' }]) }
  protected toggleEquipment(item: EquipmentResponse): void { if (item.status !== 'Available') return; this.selected.update((current) => current.some((selected) => selected.equipmentId === item.equipmentId) ? current.filter((selected) => selected.equipmentId !== item.equipmentId) : [...current, { key: `equipment-${item.equipmentId}`, resourceType: 2, labId: null, equipmentId: item.equipmentId, name: item.equipmentName, note: '' }]) }
  protected isSelected(id: number): boolean { return this.selected().some((item) => item.equipmentId === id) }
  protected updateNote(index: number, note: string): void { this.selected.update((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, note } : item)) }
  protected validTime(): boolean { return Boolean(this.startTime && this.endTime && new Date(this.startTime) < new Date(this.endTime) && new Date(this.startTime) > new Date()) }
  protected goTo(target: number): void { if (target <= this.step()) this.step.set(target) }
  protected checkAvailability(): void {
    if (!this.validTime() || !this.selected().length) {
      this.toast.info('Hãy chọn thời gian và tài nguyên hợp lệ')
      return
    }
    this.checking.set(true)
    this.suggestions.set([])
    this.api.calendar(toIso(this.startTime), toIso(this.endTime), this.labId ?? undefined).subscribe({
      next: (events) => {
        const selectedEquipmentIds = new Set(this.selected().map((item) => item.equipmentId).filter((id): id is number => id !== null))
        const blocking = events.some((event) => {
          const overlapsTime = event.blocking && new Date(event.startTime) < new Date(this.endTime) && new Date(event.endTime) > new Date(this.startTime)
          if (!overlapsTime) return false
          if (this.mode() === 'lab') return event.resources.some((resource) => resource.labId === this.labId)
          return event.resources.some((resource) =>
            (resource.resourceType === 'LabRoom' && resource.labId === this.labId)
            || (resource.resourceType === 'Equipment' && selectedEquipmentIds.has(resource.resourceId)),
          )
        })
        this.available.set(!blocking)
        this.availabilityMessage.set(blocking ? 'Khung giờ đang có sự kiện chặn tài nguyên. Hãy xem các gợi ý bên dưới.' : 'Khung giờ hiện chưa có sự kiện chặn tài nguyên.')
        if (blocking) this.loadSuggestions()
        else this.checking.set(false)
      },
      error: () => { this.checking.set(false); this.toast.error('Không kiểm tra được lịch') },
    })
  }
  protected chooseSlot(slot: SuggestedSlotResponse): void { this.startTime = toLocalDateTimeInput(slot.startTime); this.endTime = toLocalDateTimeInput(slot.endTime); this.available.set(true); this.availabilityMessage.set('Đã chọn một khung giờ thay thế.') }
  protected priorityFor(purpose: string): number { return this.rules().find((rule) => rule.purposeType === purpose)?.priorityLevel ?? this.purposes.findIndex((item) => item.key === purpose) + 1 }
  protected purposeKey(): string { return this.purposes.find((item) => item.value === this.purposeType)?.key ?? 'Other' }
  protected purposeLabel(): string { return labelOf('purpose', this.purposeKey()) }
  protected submit(): void {
    if (!this.validTime() || !this.selected().length || !this.purposeDescription.trim()) {
      this.toast.info('Thông tin booking chưa đầy đủ')
      return
    }
    this.submitting.set(true)
    this.api.createBooking({ purposeType: this.purposeType, purposeDescription: this.purposeDescription.trim(), startTime: toIso(this.startTime), endTime: toIso(this.endTime), items: this.itemPayload() }).subscribe({
      next: (booking) => {
        const finish = (): void => {
          this.submitting.set(false)
          this.toast.success('Đã gửi yêu cầu booking', `Booking #${booking.bookingId} đang chờ duyệt.`)
          void this.router.navigate(['/app/bookings', booking.bookingId])
        }
        if (!this.sourceWaitlistId) {
          finish()
          return
        }
        this.api.markWaitlistBooked(this.sourceWaitlistId).subscribe({
          next: finish,
          error: () => {
            this.toast.info('Booking đã tạo nhưng hàng chờ chưa cập nhật', 'Bạn có thể kiểm tra lại tại màn hình Hàng chờ của tôi.')
            finish()
          },
        })
      },
      error: () => {
        this.submitting.set(false)
        this.toast.error('Không thể tạo booking', 'Khung giờ có thể vừa phát sinh xung đột. Hãy kiểm tra lại lịch.')
      },
    })
  }

  protected joinWaitlist(): void {
    if (this.selected().length !== 1 || !this.validTime()) {
      this.toast.info('Hãy chọn đúng một tài nguyên và khung giờ hợp lệ')
      return
    }
    const resource = this.selected()[0]
    this.joiningWaitlist.set(true)
    this.api.createWaitlist({
      labId: resource.resourceType === 1 ? resource.labId : null,
      equipmentId: resource.resourceType === 2 ? resource.equipmentId : null,
      requestedStart: toIso(this.startTime),
      requestedEnd: toIso(this.endTime),
    }).subscribe({
      next: (entry) => {
        this.joiningWaitlist.set(false)
        this.toast.success('Đã tham gia hàng chờ', `Vị trí hiện tại của bạn: ${entry.queuePosition}.`)
      },
      error: () => {
        this.joiningWaitlist.set(false)
        this.toast.error('Không thể tham gia hàng chờ')
      },
    })
  }
  private loadSuggestions(): void { this.api.suggestSlots({ startTime: toIso(this.startTime), endTime: toIso(this.endTime), items: this.itemPayload(), maxSuggestions: 4, searchDays: 14, stepMinutes: 30 }).subscribe({ next: (slots) => { this.suggestions.set(slots); this.checking.set(false) }, error: () => { this.checking.set(false); this.suggestions.set([]) } }) }
  private itemPayload(): BookingItemRequest[] { return this.selected().map((item) => ({ resourceType: item.resourceType, labId: item.labId, equipmentId: item.equipmentId, note: item.note || null })) }
}
