import { DatePipe, NgClass } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { catchError, forkJoin, of } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import type {
  CalendarEventResponse,
  EquipmentResponse,
  LabRoomDetailResponse,
  MaintenanceResponse,
  UserManagementResponse,
} from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { ModalComponent } from '../../shared/ui/modal'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { SmartImageComponent } from '../../shared/ui/smart-image'
import { ToastService } from '../../shared/ui/toast.service'

@Component({
  selector: 'app-lab-detail-page',
  imports: [
    DatePipe,
    NgClass,
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    IconComponent,
    ModalComponent,
    StatusBadgeComponent,
    DataStateComponent,
    SmartImageComponent,
  ],
  template: `
    <section class="space-y-6">
      @if (loading()) {
        <div class="card-surface p-7">
          <div class="skeleton h-7 w-2/5 rounded"></div>
          <div class="skeleton mt-4 h-52 rounded-3xl"></div>
        </div>
      } @else if (!lab()) {
        <app-data-state
          title="Không tìm thấy phòng lab"
          message="Phòng lab có thể đã bị xóa hoặc bạn không có quyền truy cập."
          icon="building"
          ><a routerLink="/app/labs" class="btn-primary mt-5">Về danh sách</a></app-data-state
        >
      } @else {
        <app-page-header
          [title]="lab()!.labName"
          [subtitle]="lab()!.roomCode + ' · ' + lab()!.location"
        >
          @if (store.isRequester()) {
            <a
              [routerLink]="['/app/bookings/new']"
              [queryParams]="{ labId: lab()!.labId }"
              class="btn-primary"
              ><app-icon name="calendar-plus" [size]="17" /> Đặt cả phòng</a
            >
          }
          @if (store.isManager()) {
            <a
              routerLink="/app/management/maintenances/new"
              [queryParams]="{ labId: lab()!.labId }"
              class="btn-secondary"
              ><app-icon name="wrench" [size]="17" /> Lên lịch bảo trì</a
            >
          }
          @if (store.isAdmin()) {
            <button class="btn-secondary" (click)="openEdit()">
              <app-icon name="edit" [size]="17" /> Chỉnh sửa
            </button>
          }
        </app-page-header>

        <div class="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <article class="card-surface overflow-hidden">
            <div
              class="relative h-64 bg-linear-to-br from-[#111a3a] via-indigo-950 to-violet-800 sm:h-80"
            >
              <app-smart-image
                [src]="lab()!.imageUrl"
                [alt]="lab()!.labName"
                fallbackIcon="building"
                [priority]="true"
              />
              <div
                class="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/78 via-slate-950/10 to-transparent"
              ></div>
              <div
                class="pointer-events-none absolute right-0 bottom-0 left-0 flex items-end justify-between gap-4 p-6"
              >
                <div>
                  <p class="text-xs font-black tracking-[.2em] text-cyan-300 uppercase">
                    {{ lab()!.roomCode }}
                  </p>
                  <p class="mt-2 text-2xl font-black text-white">{{ lab()!.labName }}</p>
                </div>
                <app-status-badge [value]="lab()!.status" domain="lab" />
              </div>
            </div>
            <div class="grid gap-px bg-slate-100 sm:grid-cols-3">
              <div class="bg-white p-5">
                <p class="text-[10px] font-black tracking-[.15em] text-slate-400 uppercase">
                  Vị trí
                </p>
                <p class="mt-2 font-bold text-slate-800">{{ lab()!.location }}</p>
              </div>
              <div class="bg-white p-5">
                <p class="text-[10px] font-black tracking-[.15em] text-slate-400 uppercase">
                  Sức chứa
                </p>
                <p class="mt-2 font-bold text-slate-800">{{ lab()!.capacity }} người</p>
              </div>
              <div class="bg-white p-5">
                <p class="text-[10px] font-black tracking-[.15em] text-slate-400 uppercase">
                  Quản lý
                </p>
                <p class="mt-2 font-bold text-slate-800">
                  {{ lab()!.managerName || 'Chưa phân công' }}
                </p>
              </div>
            </div>
          </article>

          <article class="card-surface p-6">
            <p class="text-xs font-black tracking-[.17em] text-violet-500 uppercase">Tổng quan</p>
            <h2 class="mt-2 text-xl font-black text-slate-950">Không gian nghiên cứu</h2>
            <p class="mt-4 text-sm leading-7 text-slate-500">
              {{ lab()!.description || 'Chưa có mô tả cho phòng lab này.' }}
            </p>
            <div class="mt-6 rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-black text-slate-700">Hướng dẫn sử dụng</p>
              <p class="mt-2 text-sm leading-6 whitespace-pre-line text-slate-500">
                {{
                  lab()!.usageGuideline || 'Liên hệ LabManager để được hướng dẫn trước khi sử dụng.'
                }}
              </p>
            </div>
            <a
              routerLink="/app/calendar"
              [queryParams]="{ labId: lab()!.labId }"
              class="btn-secondary mt-5 w-full"
              ><app-icon name="calendar" [size]="17" /> Xem lịch phòng</a
            >
          </article>
        </div>

        <div class="flex gap-2 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm">
          @for (item of tabs; track item.key) {
            <button
              type="button"
              class="shrink-0 rounded-xl px-4 py-2.5 text-xs font-black"
              [ngClass]="
                tab() === item.key
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                  : 'text-slate-500 hover:bg-slate-50'
              "
              (click)="tab.set(item.key)"
            >
              {{ item.label }} <span class="ml-1 opacity-65">{{ item.count }}</span>
            </button>
          }
        </div>

        @if (tab() === 'equipment') {
          @if (equipments().length === 0) {
            <app-data-state
              title="Phòng chưa có thiết bị"
              message="Admin có thể bổ sung thiết bị từ màn hình quản lý thiết bị."
              icon="microscope"
            />
          } @else {
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              @for (item of equipments(); track item.equipmentId) {
                <a
                  [routerLink]="['/app/equipments', item.equipmentId]"
                  class="card-surface group flex items-center gap-4 p-5 transition hover:-translate-y-1"
                  ><div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"
                  >
                    <app-icon name="microscope" [size]="22" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-black text-slate-900">{{ item.equipmentName }}</p>
                    <div class="mt-2">
                      <app-status-badge [value]="item.status" domain="equipment" />
                    </div>
                  </div>
                  <app-icon name="arrow-right" [size]="18"
                /></a>
              }
            </div>
          }
        } @else if (tab() === 'schedule') {
          @if (events().length === 0) {
            <app-data-state
              title="Không có lịch trong 30 ngày tới"
              message="Phòng hiện chưa có booking hoặc bảo trì trong khoảng thời gian này."
              icon="calendar"
            />
          } @else {
            <div class="card-surface divide-y divide-slate-100">
              @for (event of events(); track event.eventType + event.sourceId) {
                <button
                  class="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50"
                  (click)="openEvent(event)"
                >
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-2xl"
                    [ngClass]="
                      event.eventType === 'Maintenance'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-indigo-50 text-indigo-600'
                    "
                  >
                    <app-icon
                      [name]="event.eventType === 'Maintenance' ? 'wrench' : 'calendar'"
                      [size]="20"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-black text-slate-900">{{ event.title }}</p>
                    <p class="mt-1 text-xs text-slate-400">
                      {{ event.startTime | date: 'HH:mm dd/MM/yyyy' }} –
                      {{ event.endTime | date: 'HH:mm dd/MM/yyyy' }}
                    </p>
                  </div>
                  <app-status-badge
                    [value]="event.status"
                    [domain]="event.eventType === 'Maintenance' ? 'maintenance' : 'booking'"
                  />
                </button>
              }
            </div>
          }
        } @else {
          @if (maintenances().length === 0) {
            <app-data-state
              title="Chưa có lịch bảo trì"
              message="Không có lịch bảo trì trực tiếp hoặc thiết bị thuộc phòng trong dữ liệu hiện tại."
              icon="wrench"
            />
          } @else {
            <div class="grid gap-4 md:grid-cols-2">
              @for (item of maintenances(); track item.maintenanceId) {
                <a
                  [routerLink]="['/app/management/maintenances', item.maintenanceId]"
                  class="card-surface flex items-center gap-4 p-5 hover:-translate-y-1"
                  ><div
                    class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
                  >
                    <app-icon name="wrench" [size]="21" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-black text-slate-900">Bảo trì #{{ item.maintenanceId }}</p>
                    <p class="mt-1 text-xs text-slate-400">
                      {{ item.startTime | date: 'HH:mm dd/MM' }} –
                      {{ item.endTime | date: 'HH:mm dd/MM' }}
                    </p>
                  </div>
                  <app-status-badge [value]="item.status" domain="maintenance"
                /></a>
              }
            </div>
          }
        }

        <app-modal
          [open]="editOpen()"
          title="Chỉnh sửa phòng lab"
          subtitle="Cập nhật thông tin hiển thị của phòng thí nghiệm."
          (close)="editOpen.set(false)"
        >
          <form class="grid gap-4 sm:grid-cols-2" (ngSubmit)="save()">
            <div>
              <label class="field-label">Tên phòng</label
              ><input class="input-shell" [(ngModel)]="editForm.labName" name="labName" required />
            </div>
            <div>
              <label class="field-label">Vị trí</label
              ><input
                class="input-shell"
                [(ngModel)]="editForm.location"
                name="location"
                required
              />
            </div>
            <div>
              <label class="field-label">Sức chứa</label
              ><input
                class="input-shell"
                type="number"
                min="1"
                [(ngModel)]="editForm.capacity"
                name="capacity"
                required
              />
            </div>
            <div>
              <label class="field-label">Đổi LabManager</label
              ><select class="input-shell" [(ngModel)]="managerId" name="managerId">
                <option [ngValue]="null">Giữ nguyên</option>
                @for (manager of managers(); track manager.userId) {
                  <option [ngValue]="manager.userId">{{ manager.fullName }}</option>
                }
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="field-label">Mô tả</label
              ><textarea
                class="textarea-shell"
                [(ngModel)]="editForm.description"
                name="description"
              ></textarea>
            </div>
            <div class="sm:col-span-2">
              <label class="field-label">URL ảnh</label
              ><input class="input-shell" [(ngModel)]="editForm.imageUrl" name="imageUrl" />
            </div>
            <div class="sm:col-span-2">
              <label class="field-label">Hướng dẫn</label
              ><textarea
                class="textarea-shell"
                [(ngModel)]="editForm.usageGuideline"
                name="usageGuideline"
              ></textarea>
            </div>
            <div class="flex justify-between gap-2 sm:col-span-2">
              <button type="button" class="btn-secondary btn-danger" (click)="remove()">
                <app-icon name="trash" [size]="16" /> Ngừng sử dụng
              </button>
              <div class="flex gap-2">
                <button type="button" class="btn-secondary" (click)="editOpen.set(false)">
                  Hủy</button
                ><button class="btn-primary" [disabled]="saving()">
                  {{ saving() ? 'Đang lưu...' : 'Lưu thay đổi' }}
                </button>
              </div>
            </div>
          </form>
        </app-modal>
      }
    </section>
  `,
})
export class LabDetailPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly toast = inject(ToastService)
  protected readonly store = inject(AuthStore)
  protected readonly lab = signal<LabRoomDetailResponse | null>(null)
  protected readonly equipments = signal<EquipmentResponse[]>([])
  protected readonly maintenances = signal<MaintenanceResponse[]>([])
  protected readonly events = signal<CalendarEventResponse[]>([])
  protected readonly managers = signal<UserManagementResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly saving = signal(false)
  protected readonly editOpen = signal(false)
  protected readonly tab = signal<'equipment' | 'schedule' | 'maintenance'>('equipment')
  protected readonly tabs = [
    { key: 'equipment' as const, label: 'Thiết bị', count: 0 },
    { key: 'schedule' as const, label: 'Lịch tài nguyên', count: 0 },
    { key: 'maintenance' as const, label: 'Bảo trì', count: 0 },
  ]
  protected editForm = {
    labName: '',
    location: '',
    capacity: 1,
    description: '',
    imageUrl: '',
    usageGuideline: '',
  }
  protected managerId: number | null = null
  private id = 0

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('labId'))
    this.load()
  }
  protected openEdit(): void {
    const lab = this.lab()
    if (!lab) return
    this.editForm = {
      labName: lab.labName,
      location: lab.location,
      capacity: lab.capacity,
      description: lab.description ?? '',
      imageUrl: lab.imageUrl ?? '',
      usageGuideline: lab.usageGuideline ?? '',
    }
    this.managerId = null
    this.editOpen.set(true)
    if (!this.managers().length)
      this.api.users({ roleName: 'LabManager', pageSize: 100 }).subscribe({
        next: (result) =>
          this.managers.set(
            result.items.filter(
              (manager) =>
                manager.status === 1 || manager.status === '1' || manager.status === 'Active',
            ),
          ),
        error: () => this.toast.error('Không tải được danh sách LabManager đang hoạt động'),
      })
  }
  protected save(): void {
    if (
      this.editForm.labName.trim().length < 2 ||
      !this.editForm.location.trim() ||
      !Number.isFinite(this.editForm.capacity) ||
      this.editForm.capacity <= 0
    ) {
      this.toast.info('Vui lòng nhập tên phòng, vị trí và sức chứa hợp lệ')
      return
    }
    this.saving.set(true)
    this.api
      .updateLab(this.id, {
        labName: this.editForm.labName,
        location: this.editForm.location,
        capacity: this.editForm.capacity,
        description: this.editForm.description || null,
        imageUrl: this.editForm.imageUrl || null,
        usageGuideline: this.editForm.usageGuideline || null,
      })
      .subscribe({
        next: () => {
          if (this.managerId) {
            this.api.changeLabManager(this.id, this.managerId).subscribe({
              next: () => this.finishSave(),
              error: () => {
                this.saving.set(false)
                this.toast.error('Đã lưu thông tin nhưng chưa đổi được quản lý')
              },
            })
          } else this.finishSave()
        },
        error: () => {
          this.saving.set(false)
          this.toast.error('Không thể cập nhật phòng lab')
        },
      })
  }
  protected remove(): void {
    if (!confirm('Ngừng sử dụng phòng lab này?')) return
    this.api.deleteLab(this.id).subscribe({
      next: () => {
        this.toast.success('Đã ngừng sử dụng phòng lab')
        void this.router.navigate(['/app/labs'])
      },
      error: () => this.toast.error('Không thể ngừng sử dụng phòng'),
    })
  }
  protected openEvent(event: CalendarEventResponse): void {
    void this.router.navigate(
      event.eventType === 'Maintenance'
        ? ['/app/management/maintenances', event.sourceId]
        : ['/app/bookings', event.sourceId],
    )
  }
  private load(showSkeleton = true): void {
    if (showSkeleton) this.loading.set(true)
    this.api.lab(this.id).subscribe({
      next: (lab) => {
        this.lab.set(lab)
        const from = new Date()
        const to = new Date()
        to.setDate(to.getDate() + 30)
        forkJoin({
          equipments: this.api.equipmentsByLab(this.id).pipe(catchError(() => of([]))),
          maintenances: this.api.maintenancesByLab(this.id).pipe(catchError(() => of([]))),
          events: this.api
            .calendar(from.toISOString(), to.toISOString(), this.id)
            .pipe(catchError(() => of([]))),
        }).subscribe(({ equipments, maintenances, events }) => {
          this.equipments.set(equipments)
          this.maintenances.set(maintenances)
          this.events.set(events)
          this.tabs[0].count = equipments.length
          this.tabs[1].count = events.length
          this.tabs[2].count = maintenances.length
          this.loading.set(false)
        })
      },
      error: () => {
        this.loading.set(false)
        this.lab.set(null)
      },
    })
  }
  private finishSave(): void {
    this.saving.set(false)
    this.editOpen.set(false)
    this.toast.success('Đã cập nhật phòng lab')
    this.load(false)
  }
}
