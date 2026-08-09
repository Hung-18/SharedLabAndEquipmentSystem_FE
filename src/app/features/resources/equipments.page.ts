import { NgClass } from '@angular/common'
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { Subscription, catchError, finalize, interval, of } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import type { EquipmentResponse, LabRoomResponse } from '../../core/api/system.models'
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
  selector: 'app-equipments-page',
  imports: [
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
      <app-page-header
        title="Danh mục thiết bị"
        subtitle="Tìm kiếm, kiểm tra trạng thái và đặt lịch các thiết bị dùng chung trong hệ thống."
      >
        <a routerLink="/app/calendar" class="btn-secondary"
          ><app-icon name="calendar" [size]="17" /> Lịch thiết bị</a
        >
        @if (store.isAdmin()) {
          <button class="btn-primary" (click)="openCreate()">
            <app-icon name="plus" [size]="17" /> Thêm thiết bị
          </button>
        }
      </app-page-header>

      <div class="filter-bar md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto]">
        <div>
          <label class="field-label">Tìm thiết bị</label>
          <div class="relative">
            <span class="pointer-events-none absolute top-3.5 left-4 text-slate-400"
              ><app-icon name="search" [size]="18" /></span
            ><input
              class="input-shell pl-11"
              [(ngModel)]="keyword"
              (keyup.enter)="load()"
              placeholder="Tên thiết bị, model..."
            />
          </div>
        </div>
        <div>
          <label class="field-label">Phòng lab</label
          ><select class="input-shell" [(ngModel)]="labId" (ngModelChange)="page.set(1); load()">
            <option [ngValue]="null">Tất cả phòng</option>
            @for (lab of visibleLabs(); track lab.labId) {
              <option [ngValue]="lab.labId">{{ lab.labName }}</option>
            }
          </select>
        </div>
        @if (!store.isRequester()) {
          <div>
            <label class="field-label">Trạng thái</label
            ><select class="input-shell" [(ngModel)]="status" (ngModelChange)="page.set(1); load()">
              <option value="">Tất cả</option>
              <option [value]="1">Sẵn sàng</option>
              <option [value]="2">Đang sử dụng</option>
              <option [value]="3">Bảo trì</option>
              <option [value]="4">Bị hỏng</option>
              <option [value]="5">Ngừng sử dụng</option>
            </select>
          </div>
        }
        <div class="flex items-end">
          <button class="btn-primary w-full" (click)="load()">
            <app-icon name="filter" [size]="17" /> Lọc
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
            <div class="card-surface p-5">
              <div class="skeleton h-36 rounded-2xl"></div>
              <div class="skeleton mt-4 h-5 w-3/4 rounded"></div>
              <div class="skeleton mt-3 h-4 rounded"></div>
            </div>
          }
        </div>
      } @else if (items().length === 0) {
        <app-data-state
          title="Không có thiết bị phù hợp"
          message="Hãy thử đổi từ khóa, phòng lab hoặc trạng thái thiết bị."
          icon="microscope"
        />
      } @else {
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          @for (item of items(); track item.equipmentId; let index = $index) {
            <article
              class="group card-surface overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,.1)]"
            >
              <a
                [routerLink]="['/app/equipments', item.equipmentId]"
                class="relative block h-40 overflow-hidden"
                [ngClass]="
                  index % 4 === 0
                    ? 'bg-indigo-950'
                    : index % 4 === 1
                      ? 'bg-cyan-950'
                      : index % 4 === 2
                        ? 'bg-violet-950'
                        : 'bg-slate-900'
                "
                [attr.aria-label]="'Xem thiết bị ' + item.equipmentName"
              >
                <app-smart-image
                  [src]="item.imageUrl"
                  [alt]="item.equipmentName"
                  fallbackIcon="microscope"
                />
                <div
                  class="pointer-events-none absolute inset-0 opacity-25"
                  style="background-image: radial-gradient(circle at 20% 20%, #a78bfa, transparent 26%), radial-gradient(circle at 80% 80%, #22d3ee, transparent 28%)"
                ></div>
                <div class="absolute top-4 right-4">
                  <app-status-badge [value]="item.status" domain="equipment" />
                </div>
              </a>
              <div class="p-5">
                <p class="truncate text-base font-black text-slate-950">{{ item.equipmentName }}</p>
                <p class="mt-2 flex items-center gap-2 truncate text-xs text-slate-400">
                  <app-icon name="building" [size]="15" /> {{ labName(item.labId) }}
                </p>
                <div class="mt-5 flex gap-2">
                  <a [routerLink]="['/app/equipments', item.equipmentId]" class="btn-primary flex-1"
                    >Chi tiết</a
                  >
                  @if (store.isRequester() && canBook(item)) {
                    <a
                      routerLink="/app/bookings/new"
                      [queryParams]="{ equipmentId: item.equipmentId, labId: item.labId }"
                      class="btn-secondary px-3"
                      title="Đặt phòng với thiết bị này"
                      [attr.aria-label]="'Đặt phòng với thiết bị ' + item.equipmentName"
                      ><app-icon name="calendar-plus" [size]="18"
                    /></a>
                  } @else if (store.isRequester()) {
                    <span class="btn-secondary cursor-not-allowed px-3 text-rose-600" title="Thiết bị hiện không thể đặt">
                      <app-icon name="lock" [size]="18" />
                    </span>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }

      @if (totalPages() > 1) {
        <div class="flex justify-center gap-2">
          <button
            class="btn-secondary"
            [disabled]="page() <= 1"
            (click)="page.set(page() - 1); load()"
          >
            Trước</button
          ><span class="rounded-xl bg-white px-4 py-3 text-xs font-black"
            >{{ page() }}/{{ totalPages() }}</span
          ><button
            class="btn-secondary"
            [disabled]="page() >= totalPages()"
            (click)="page.set(page() + 1); load()"
          >
            Sau
          </button>
        </div>
      }

      <app-modal
        [open]="createOpen()"
        title="Thêm thiết bị mới"
        subtitle="Thiết bị phải thuộc một phòng lab đang tồn tại."
        (close)="createOpen.set(false)"
      >
        <form class="grid gap-4" (ngSubmit)="create()">
          <div>
            <label class="field-label">Phòng lab *</label
            ><select class="input-shell" required [(ngModel)]="form.labId" name="labId">
              <option [ngValue]="null">Chọn phòng lab</option>
              @for (lab of manageableLabs(); track lab.labId) {
                <option [ngValue]="lab.labId">{{ lab.labName }} · {{ lab.roomCode }}</option>
              }
            </select>
          </div>
          <div>
            <label class="field-label">Tên thiết bị *</label
            ><input
              class="input-shell"
              required
              [(ngModel)]="form.equipmentName"
              name="equipmentName"
              placeholder="Máy quang phổ FTIR"
            />
          </div>
          <div>
            <label class="field-label">Model / thông số</label
            ><textarea
              class="textarea-shell"
              [(ngModel)]="form.modelSpecs"
              name="modelSpecs"
              placeholder="Hãng, model, dải đo..."
            ></textarea>
          </div>
          <div>
            <label class="field-label">URL ảnh</label
            ><input
              class="input-shell"
              [(ngModel)]="form.imageUrl"
              name="imageUrl"
              placeholder="https://..."
            />
          </div>
          <div>
            <label class="field-label">Hướng dẫn sử dụng</label
            ><textarea
              class="textarea-shell"
              [(ngModel)]="form.usageGuideline"
              name="usageGuideline"
            ></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" class="btn-secondary" (click)="createOpen.set(false)">Hủy</button
            ><button class="btn-primary" [disabled]="saving()">
              {{ saving() ? 'Đang lưu...' : 'Tạo thiết bị' }}
            </button>
          </div>
        </form>
      </app-modal>
    </section>
  `,
})
export class EquipmentsPage implements OnInit, OnDestroy {
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
  protected form = {
    labId: null as number | null,
    equipmentName: '',
    modelSpecs: '',
    imageUrl: '',
    usageGuideline: '',
  }
  protected readonly labMap = computed(
    () => new Map(this.labs().map((lab) => [lab.labId, lab.labName])),
  )
  protected readonly manageableLabs = computed(() =>
    this.labs().filter((lab) => !isInactiveLabStatus(lab.status)),
  )
  protected readonly visibleLabs = computed(() =>
    this.store.isRequester() ? this.manageableLabs() : this.labs(),
  )
  private loadVersion = 0
  private refreshSubscription?: Subscription

  ngOnInit(): void {
    this.load()
    this.api
      .labs()
      .pipe(catchError(() => of([])))
      .subscribe((labs) => this.labs.set(labs))
    this.refreshSubscription = interval(30_000).subscribe(() => this.load(false))
  }
  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe()
  }
  protected load(showLoading = true): void {
    const version = ++this.loadVersion
    if (showLoading) this.loading.set(true)
    this.api
      .searchEquipments({
        keyword: this.keyword || undefined,
        labId: this.labId ?? undefined,
        status: this.store.isRequester() ? undefined : this.status || undefined,
        pageNumber: this.page(),
        pageSize: 16,
      })
      .pipe(
        finalize(() => {
          if (version === this.loadVersion) this.loading.set(false)
        }),
      )
      .subscribe({
        next: (result) => {
          if (version !== this.loadVersion) return
          const visibleItems = this.store.isRequester()
            ? result.items.filter((item) => !isRetiredEquipmentStatus(item.status))
            : result.items
          this.items.set(visibleItems)
          this.hydrateImages(visibleItems, version)
          this.totalPages.set(result.totalPages || 1)
        },
        error: () => {
          if (version !== this.loadVersion) return
          this.toast.error('Không tải được thiết bị')
        },
      })
  }
  protected labName(id: number): string {
    return this.labMap().get(id) ?? `Phòng #${id}`
  }
  protected canBook(item: EquipmentResponse): boolean {
    const lab = this.labs().find((candidate) => candidate.labId === item.labId)
    return isAvailableEquipmentStatus(item.status) && Boolean(lab && isAvailableLabStatus(lab.status))
  }
  private hydrateImages(items: EquipmentResponse[], version: number): void {
    for (const item of items) {
      if (item.imageUrl) continue
      this.api.equipment(item.equipmentId).subscribe({
        next: (detail) => {
          if (version !== this.loadVersion || !detail.imageUrl) return
          this.items.update((current) =>
            current.map((equipment) =>
              equipment.equipmentId === item.equipmentId
                ? { ...equipment, imageUrl: detail.imageUrl }
                : equipment,
            ),
          )
        },
        error: () => undefined,
      })
    }
  }

  protected openCreate(): void {
    this.form = { labId: null, equipmentName: '', modelSpecs: '', imageUrl: '', usageGuideline: '' }
    this.createOpen.set(true)
  }
  protected create(): void {
    if (!this.form.labId || !this.form.equipmentName.trim()) {
      this.toast.info('Hãy chọn phòng lab và nhập tên thiết bị')
      return
    }
    this.saving.set(true)
    this.api
      .createEquipment({
        labId: this.form.labId,
        equipmentName: this.form.equipmentName.trim(),
        modelSpecs: this.form.modelSpecs.trim() || null,
        imageUrl: this.form.imageUrl.trim() || null,
        usageGuideline: this.form.usageGuideline.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false)
          this.createOpen.set(false)
          this.toast.success('Đã thêm thiết bị')
          this.load()
        },
        error: () => {
          this.saving.set(false)
          this.toast.error('Không thể thêm thiết bị')
        },
      })
  }
}
