import { DatePipe, NgClass } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { catchError, forkJoin, of } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import { apiErrorMessage } from '../../core/http/api-error'
import type {
  CalendarEventResponse,
  EquipmentDetailResponse,
  LabRoomDetailResponse,
  LabRoomResponse,
  MaintenanceResponse,
} from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { ModalComponent } from '../../shared/ui/modal'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { SmartImageComponent } from '../../shared/ui/smart-image'
import { ToastService } from '../../shared/ui/toast.service'
import {
  isAvailableEquipmentStatus,
  isAvailableLabStatus,
  isInactiveLabStatus,
  isRetiredEquipmentStatus,
} from '../../shared/utils/presentation'

@Component({
  selector: 'app-equipment-detail-page',
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
          <div class="skeleton h-8 w-1/3 rounded"></div>
          <div class="skeleton mt-5 h-72 rounded-3xl"></div>
        </div>
      } @else if (!item()) {
        <app-data-state
          title="Không tìm thấy thiết bị"
          message="Thiết bị có thể đã ngừng sử dụng hoặc không tồn tại."
          icon="microscope"
          ><a routerLink="/app/equipments" class="btn-primary mt-5">Về danh sách</a></app-data-state
        >
      } @else {
        <app-page-header
          [title]="item()!.equipmentName"
          [subtitle]="
            'Thiết bị #' +
            item()!.equipmentId +
            ' · ' +
            (lab()?.labName || 'Phòng #' + item()!.labId)
          "
        >
          @if (store.isRequester() && canBook()) {
            <a
              routerLink="/app/bookings/new"
              [queryParams]="{ labId: item()!.labId, equipmentId: item()!.equipmentId }"
              class="btn-primary"
              ><app-icon name="calendar-plus" [size]="17" /> Đặt phòng với thiết bị này</a
            >
          } @else if (store.isRequester()) {
            <span class="btn-secondary cursor-not-allowed text-rose-600">
              <app-icon name="lock" [size]="17" /> Không thể đặt
            </span>
          }
          @if (store.isManager() && lab()?.managerId === store.user()?.userId) {
            <a
              routerLink="/app/management/maintenances/new"
              [queryParams]="{ equipmentId: item()!.equipmentId }"
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

        <div class="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
          <article class="card-surface overflow-hidden">
            <div class="relative h-80 bg-linear-to-br from-slate-950 via-indigo-950 to-violet-900">
              <app-smart-image
                [src]="item()!.imageUrl"
                [alt]="item()!.equipmentName"
                fallbackIcon="microscope"
                [priority]="true"
              />
              <div
                class="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/45 via-transparent to-transparent"
              ></div>
              <div class="absolute top-5 left-5">
                <app-status-badge [value]="item()!.status" domain="equipment" />
              </div>
            </div>
          </article>
          <article class="card-surface p-6 sm:p-7">
            <p class="text-xs font-black tracking-[.18em] text-violet-500 uppercase">
              Thông tin kỹ thuật
            </p>
            <h2 class="mt-2 text-2xl font-black text-slate-950">{{ item()!.equipmentName }}</h2>
            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-[10px] font-black tracking-[.15em] text-slate-400 uppercase">
                  Phòng chứa
                </p>
                <a
                  [routerLink]="['/app/labs', item()!.labId]"
                  class="mt-2 block font-black text-violet-700 hover:text-violet-900"
                  >{{ lab()?.labName || 'Phòng #' + item()!.labId }}</a
                >
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-[10px] font-black tracking-[.15em] text-slate-400 uppercase">
                  Mã thiết bị
                </p>
                <p class="mt-2 font-black text-slate-800">
                  EQ-{{ item()!.equipmentId.toString().padStart(4, '0') }}
                </p>
              </div>
            </div>
            <div class="mt-5">
              <p class="text-xs font-black text-slate-700">Model / thông số</p>
              <p class="mt-2 text-sm leading-7 whitespace-pre-line text-slate-500">
                {{ item()!.modelSpecs || 'Chưa cập nhật thông số kỹ thuật.' }}
              </p>
            </div>
            <div class="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
              <p class="flex items-center gap-2 text-xs font-black text-cyan-800">
                <app-icon name="book-open" [size]="17" /> Hướng dẫn sử dụng
              </p>
              <p class="mt-2 text-sm leading-6 whitespace-pre-line text-cyan-900/65">
                {{ item()!.usageGuideline || 'Liên hệ quản lý phòng thí nghiệm để được hướng dẫn.' }}
              </p>
            </div>
          </article>
        </div>

        <div class="grid gap-6 xl:grid-cols-2">
          <article class="card-surface overflow-hidden">
            <header class="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h2 class="font-black text-slate-950">Lịch 30 ngày tới</h2>
                <p class="mt-1 text-xs text-slate-400">
                  {{ store.isRequester() ? 'Lịch đặt của thiết bị' : 'Booking và bảo trì của thiết bị' }}
                </p>
              </div>
              <a
                routerLink="/app/calendar"
                [queryParams]="{ equipmentId: item()!.equipmentId }"
                class="text-xs font-black text-violet-600"
                >Xem toàn bộ</a
              >
            </header>
            @if (events().length === 0) {
              <div class="p-5">
                <app-data-state
                  title="Lịch đang trống"
                  message="Thiết bị chưa có sự kiện trong 30 ngày tới."
                  icon="calendar"
                />
              </div>
            } @else {
              <div class="divide-y divide-slate-100">
                @for (event of events().slice(0, 6); track event.eventType + event.sourceId) {
                  <button
                    class="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50"
                    (click)="openEvent(event)"
                  >
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-2xl"
                      [ngClass]="
                        event.eventType === 'Maintenance'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-indigo-50 text-indigo-600'
                      "
                    >
                      <app-icon
                        [name]="event.eventType === 'Maintenance' ? 'wrench' : 'calendar'"
                        [size]="18"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-black text-slate-800">{{ event.title }}</p>
                      <p class="mt-1 text-xs text-slate-400">
                        {{ event.startTime | date: 'HH:mm dd/MM' }} –
                        {{ event.endTime | date: 'HH:mm dd/MM' }}
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
          </article>
          @if (!store.isRequester()) {
            <article class="card-surface overflow-hidden">
            <header class="border-b border-slate-100 px-5 py-5">
              <h2 class="font-black text-slate-950">Lịch sử bảo trì</h2>
              <p class="mt-1 text-xs text-slate-400">Các lịch bảo trì gắn với thiết bị</p>
            </header>
            @if (maintenances().length === 0) {
              <div class="p-5">
                <app-data-state
                  title="Chưa có lịch bảo trì"
                  message="Thiết bị chưa có bản ghi bảo trì."
                  icon="wrench"
                />
              </div>
            } @else {
              <div class="divide-y divide-slate-100">
                @for (maintenance of maintenances().slice(0, 6); track maintenance.maintenanceId) {
                  <a
                    [routerLink]="['/app/management/maintenances', maintenance.maintenanceId]"
                    class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50"
                    ><div
                      class="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
                    >
                      <app-icon name="wrench" [size]="18" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="font-black text-slate-800">
                        Bảo trì #{{ maintenance.maintenanceId }}
                      </p>
                      <p class="mt-1 text-xs text-slate-400">
                        {{ maintenance.startTime | date: 'dd/MM/yyyy HH:mm' }}
                      </p>
                    </div>
                    <app-status-badge [value]="maintenance.status" domain="maintenance"
                  /></a>
                }
              </div>
            }
            </article>
          }
        </div>

        <app-modal
          [open]="editOpen()"
          title="Chỉnh sửa thiết bị"
          subtitle="Cập nhật thông tin kỹ thuật hoặc chuyển thiết bị sang phòng khác."
          (close)="editOpen.set(false)"
          ><form class="grid gap-4" (ngSubmit)="save()">
            <div>
              <label class="field-label">Tên thiết bị</label
              ><input
                class="input-shell"
                required
                [(ngModel)]="form.equipmentName"
                name="equipmentName"
              />
            </div>
            <div>
              <label class="field-label">Phòng lab</label
              ><select class="input-shell" required [(ngModel)]="form.labId" name="labId">
                @for (room of labs(); track room.labId) {
                  <option [ngValue]="room.labId">{{ room.labName }}</option>
                }
              </select>
            </div>
            <div>
              <label class="field-label">Model / thông số</label
              ><textarea
                class="textarea-shell"
                [(ngModel)]="form.modelSpecs"
                name="modelSpecs"
              ></textarea>
            </div>
            <div>
              <label class="field-label">URL ảnh</label
              ><input class="input-shell" [(ngModel)]="form.imageUrl" name="imageUrl" />
            </div>
            <div>
              <label class="field-label">Hướng dẫn</label
              ><textarea
                class="textarea-shell"
                [(ngModel)]="form.usageGuideline"
                name="usageGuideline"
              ></textarea>
            </div>
            <div class="flex justify-between gap-2">
              <div>
                @if (!isRetiredEquipmentStatus(item()!.status)) {
                  <button type="button" class="btn-secondary btn-danger" (click)="remove()">
                    <app-icon name="trash" [size]="16" /> Ngừng sử dụng
                  </button>
                } @else {
                  <button
                    type="button"
                    class="btn-secondary"
                    [disabled]="saving()"
                    (click)="reactivate()"
                  >
                    <app-icon name="refresh" [size]="16" />
                    {{ saving() ? 'Đang kích hoạt...' : 'Kích hoạt lại' }}
                  </button>
                }
              </div>
              <div class="flex gap-2">
                <button type="button" class="btn-secondary" (click)="editOpen.set(false)">
                  Hủy</button
                ><button class="btn-primary" [disabled]="saving()">
                  {{ saving() ? 'Đang lưu...' : 'Lưu thay đổi' }}
                </button>
              </div>
            </div>
          </form></app-modal
        >
      }
    </section>
  `,
})
export class EquipmentDetailPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly toast = inject(ToastService)
  protected readonly store = inject(AuthStore)
  protected readonly isRetiredEquipmentStatus = isRetiredEquipmentStatus
  protected readonly item = signal<EquipmentDetailResponse | null>(null)
  protected readonly lab = signal<LabRoomDetailResponse | null>(null)
  protected readonly labs = signal<LabRoomResponse[]>([])
  protected readonly maintenances = signal<MaintenanceResponse[]>([])
  protected readonly events = signal<CalendarEventResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly saving = signal(false)
  protected readonly editOpen = signal(false)
  protected form = { labId: 0, equipmentName: '', modelSpecs: '', imageUrl: '', usageGuideline: '' }
  private id = 0

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('equipmentId'))
    this.load()
  }
  protected openEdit(): void {
    const item = this.item()
    if (!item) return
    this.form = {
      labId: item.labId,
      equipmentName: item.equipmentName,
      modelSpecs: item.modelSpecs ?? '',
      imageUrl: item.imageUrl ?? '',
      usageGuideline: item.usageGuideline ?? '',
    }
    this.editOpen.set(true)
    if (!this.labs().length)
      this.api.labs().subscribe((items) =>
        this.labs.set(
          items.filter(
            (lab) => lab.labId === item.labId || !isInactiveLabStatus(lab.status),
          ),
        ),
      )
  }
  protected save(): void {
    this.saving.set(true)
    this.api
      .updateEquipment(this.id, {
        labId: this.form.labId,
        equipmentName: this.form.equipmentName,
        modelSpecs: this.form.modelSpecs || null,
        imageUrl: this.form.imageUrl || null,
        usageGuideline: this.form.usageGuideline || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false)
          this.editOpen.set(false)
          this.toast.success('Đã cập nhật thiết bị')
          this.load(false)
        },
        error: () => {
          this.saving.set(false)
          this.toast.error('Không thể cập nhật thiết bị')
        },
      })
  }

  protected reactivate(): void {
    const equipment = this.item()
    if (!equipment || !isRetiredEquipmentStatus(equipment.status)) return
    if (!confirm('Kích hoạt lại thiết bị này?')) return

    this.saving.set(true)
    this.api.activateEquipment(this.id).subscribe({
      next: () => {
        this.saving.set(false)
        this.editOpen.set(false)
        this.toast.success('Đã kích hoạt lại thiết bị')
        this.load(false)
      },
      error: (error) => {
        this.saving.set(false)
        this.toast.error(apiErrorMessage(error, 'Không thể kích hoạt lại thiết bị'))
      },
    })
  }

  private load(showSkeleton = true): void {
    if (showSkeleton) this.loading.set(true)
    this.api.equipment(this.id).subscribe({
      next: (item) => {
        this.item.set(item)
        const from = new Date()
        const to = new Date()
        to.setDate(to.getDate() + 30)
        forkJoin({
          lab: this.api.lab(item.labId).pipe(catchError(() => of(null))),
          maintenances: this.store.isRequester()
            ? of([] as MaintenanceResponse[])
            : this.api.maintenancesByEquipment(this.id).pipe(catchError(() => of([]))),
          events: this.api
            .calendar(from.toISOString(), to.toISOString(), undefined, this.id)
            .pipe(catchError(() => of([]))),
        }).subscribe(({ lab, maintenances, events }) => {
          this.lab.set(lab)
          this.maintenances.set(maintenances)
          this.events.set(
            this.store.isRequester()
              ? events.filter((event) => event.eventType !== 'Maintenance')
              : events,
          )
          this.loading.set(false)
        })
      },
      error: () => {
        this.loading.set(false)
        this.item.set(null)
      },
    })
  }

  protected remove(): void {
    if (!confirm('Ngừng sử dụng thiết bị này?')) return
    this.api.deleteEquipment(this.id).subscribe({
      next: () => {
        this.toast.success('Đã ngừng sử dụng thiết bị')
        void this.router.navigate(['/app/equipments'])
      },
      error: (error) =>
        this.toast.error(
          apiErrorMessage(
            error,
            'Không thể ngừng sử dụng thiết bị. Hãy kiểm tra booking, lượt sử dụng, bảo trì hoặc hàng chờ đang hoạt động.',
          ),
        ),
    })
  }
  protected openEvent(event: CalendarEventResponse): void {
    if (this.store.isRequester() && event.eventType === 'Maintenance') return
    void this.router.navigate(
      event.eventType === 'Maintenance'
        ? ['/app/management/maintenances', event.sourceId]
        : ['/app/bookings', event.sourceId],
    )
  }
  protected canBook(): boolean {
    const equipment = this.item()
    const lab = this.lab()
    return Boolean(
      equipment &&
        lab &&
        isAvailableEquipmentStatus(equipment.status) &&
        isAvailableLabStatus(lab.status),
    )
  }
}
