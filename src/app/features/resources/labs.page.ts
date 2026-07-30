import { NgClass } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { finalize } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import type { LabRoomResponse, UserManagementResponse } from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { ModalComponent } from '../../shared/ui/modal'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { SmartImageComponent } from '../../shared/ui/smart-image'
import { ToastService } from '../../shared/ui/toast.service'
import { isAvailableLabStatus } from '../../shared/utils/presentation'

interface LabForm {
  labName: string
  roomCode: string
  location: string
  capacity: number
  description: string
  imageUrl: string
  usageGuideline: string
  managerId: number | null
}

@Component({
  selector: 'app-labs-page',
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
        title="Không gian phòng thí nghiệm"
        subtitle="Khám phá phòng lab, sức chứa, vị trí và trạng thái tài nguyên trước khi tạo booking."
      >
        <a routerLink="/app/calendar" class="btn-secondary"
          ><app-icon name="calendar" [size]="17" /> Xem lịch</a
        >
        @if (store.isAdmin()) {
          <button type="button" class="btn-primary" (click)="openCreate()">
            <app-icon name="plus" [size]="17" /> Thêm phòng lab
          </button>
        }
      </app-page-header>

      <div class="filter-bar md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <div>
          <label class="field-label">Tìm kiếm</label>
          <div class="relative">
            <span class="pointer-events-none absolute top-3.5 left-4 text-slate-400"
              ><app-icon name="search" [size]="18" /></span
            ><input
              class="input-shell pl-11"
              [(ngModel)]="keyword"
              (keyup.enter)="load()"
              placeholder="Tên phòng, mã phòng, vị trí..."
            />
          </div>
        </div>
        @if (!store.isRequester()) {
          <div>
            <label class="field-label">Trạng thái</label
            ><select class="input-shell" [(ngModel)]="status" (ngModelChange)="page.set(1); load()">
              <option value="">Tất cả</option>
              <option [value]="1">Có thể sử dụng</option>
              <option [value]="2">Tạm không khả dụng</option>
              <option [value]="3">Đang bảo trì</option>
              <option [value]="4">Ngừng hoạt động</option>
            </select>
          </div>
        }
        <div>
          <label class="field-label">Sức chứa tối thiểu</label
          ><input
            class="input-shell"
            type="number"
            min="1"
            [(ngModel)]="minimumCapacity"
            (change)="page.set(1); load()"
          />
        </div>
        <div>
          <label class="field-label">Kiểu hiển thị</label>
          <div class="flex h-12 rounded-2xl bg-slate-100 p-1">
            <button
              class="flex-1 rounded-xl text-xs font-black"
              [ngClass]="
                view() === 'grid' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-400'
              "
              (click)="view.set('grid')"
            >
              <app-icon name="grid" [size]="17" /></button
            ><button
              class="flex-1 rounded-xl text-xs font-black"
              [ngClass]="
                view() === 'table' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-400'
              "
              (click)="view.set('table')"
            >
              <app-icon name="list" [size]="17" />
            </button>
          </div>
        </div>
        <div class="flex items-end">
          <button class="btn-primary w-full" type="button" (click)="load()">
            <app-icon name="filter" [size]="17" /> Áp dụng
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          @for (i of [1, 2, 3, 4, 5, 6]; track i) {
            <div class="card-surface overflow-hidden">
              <div class="skeleton h-40"></div>
              <div class="p-5">
                <div class="skeleton h-5 w-2/3 rounded"></div>
                <div class="skeleton mt-3 h-4 rounded"></div>
                <div class="skeleton mt-5 h-10 rounded-xl"></div>
              </div>
            </div>
          }
        </div>
      } @else if (labs().length === 0) {
        <app-data-state
          icon="building"
          title="Chưa tìm thấy phòng lab"
          message="Không có phòng nào khớp bộ lọc hiện tại. Hãy thay đổi từ khóa hoặc trạng thái."
        />
      } @else if (view() === 'grid') {
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          @for (lab of labs(); track lab.labId; let index = $index) {
            <article
              class="group card-surface overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,.1)]"
            >
              <a
                [routerLink]="['/app/labs', lab.labId]"
                class="relative block h-44 overflow-hidden bg-linear-to-br from-slate-900 via-indigo-950 to-violet-900"
                [attr.aria-label]="'Xem phòng ' + lab.labName"
              >
                <app-smart-image [src]="lab.imageUrl" [alt]="lab.labName" fallbackIcon="building" />
                <div
                  class="pointer-events-none absolute inset-0 opacity-25"
                  [style.background-image]="
                    'radial-gradient(circle at ' +
                    ((index % 3) + 1) * 24 +
                    '% 28%, #a78bfa 0, transparent 28%), radial-gradient(circle at 82% 80%, #22d3ee 0, transparent 24%)'
                  "
                ></div>
                <div
                  class="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/90 via-slate-950/30 to-transparent p-5 pt-14"
                >
                  <div class="flex items-end justify-between gap-3">
                    <div>
                      <p class="text-xs font-bold tracking-[.18em] text-cyan-300 uppercase">
                        {{ lab.roomCode }}
                      </p>
                      <h2 class="mt-1 text-xl font-black text-white">{{ lab.labName }}</h2>
                    </div>
                    <span
                      class="rounded-2xl bg-white/12 px-3 py-2 text-xs font-black text-white backdrop-blur"
                      ><app-icon name="users" [size]="15" /> {{ lab.capacity }}</span
                    >
                  </div>
                </div>
              </a>
              <div class="p-5">
                <div class="flex items-center justify-between gap-3">
                  <p class="flex min-w-0 items-center gap-2 truncate text-sm text-slate-500">
                    <app-icon name="map-pin" [size]="17" /> {{ lab.location }}
                  </p>
                  <app-status-badge [value]="lab.status" domain="lab" />
                </div>
                <div class="mt-5 flex gap-2">
                  <a [routerLink]="['/app/labs', lab.labId]" class="btn-primary flex-1"
                    >Xem chi tiết</a
                  >
                  @if (store.isRequester()) {
                    <a
                      [routerLink]="['/app/bookings/new']"
                      [queryParams]="{ labId: lab.labId }"
                      class="btn-secondary px-3"
                      title="Tạo booking"
                      ><app-icon name="calendar-plus" [size]="18"
                    /></a>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="card-surface overflow-x-auto">
          <table class="table-shell">
            <thead>
              <tr>
                <th>Phòng lab</th>
                <th>Vị trí</th>
                <th>Sức chứa</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (lab of labs(); track lab.labId) {
                <tr>
                  <td>
                    <p class="font-black text-slate-900">{{ lab.labName }}</p>
                    <p class="mt-1 text-xs text-slate-400">{{ lab.roomCode }}</p>
                  </td>
                  <td>{{ lab.location }}</td>
                  <td>{{ lab.capacity }} người</td>
                  <td><app-status-badge [value]="lab.status" domain="lab" /></td>
                  <td class="text-right">
                    <a
                      [routerLink]="['/app/labs', lab.labId]"
                      class="font-black text-violet-600 hover:text-violet-800"
                      >Chi tiết →</a
                    >
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (totalPages() > 1) {
        <div class="flex items-center justify-center gap-2">
          <button class="btn-secondary" [disabled]="page() === 1" (click)="changePage(page() - 1)">
            Trước</button
          ><span class="rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-600 shadow-sm"
            >Trang {{ page() }}/{{ totalPages() }}</span
          ><button
            class="btn-secondary"
            [disabled]="page() === totalPages()"
            (click)="changePage(page() + 1)"
          >
            Sau
          </button>
        </div>
      }

      <app-modal
        [open]="createOpen()"
        title="Thêm phòng thí nghiệm"
        subtitle="Nhập thông tin phòng thí nghiệm và người phụ trách."
        (close)="createOpen.set(false)"
      >
        <form class="grid gap-4 sm:grid-cols-2" (ngSubmit)="create()">
          <div>
            <label class="field-label">Tên phòng *</label
            ><input
              class="input-shell"
              required
              [(ngModel)]="form.labName"
              name="labName"
              placeholder="Phòng Nghiên cứu AI"
            />
          </div>
          <div>
            <label class="field-label">Mã phòng *</label
            ><input
              class="input-shell"
              required
              [(ngModel)]="form.roomCode"
              name="roomCode"
              placeholder="LAB-AI-01"
            />
          </div>
          <div>
            <label class="field-label">Vị trí *</label
            ><input
              class="input-shell"
              required
              [(ngModel)]="form.location"
              name="location"
              placeholder="Tầng 4, nhà A"
            />
          </div>
          <div>
            <label class="field-label">Sức chứa *</label
            ><input
              class="input-shell"
              type="number"
              min="1"
              required
              [(ngModel)]="form.capacity"
              name="capacity"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="field-label">Quản lý phòng thí nghiệm *</label
            ><select class="input-shell" required [(ngModel)]="form.managerId" name="managerId">
              <option [ngValue]="null">Chọn người quản lý</option>
              @for (manager of managers(); track manager.userId) {
                <option [ngValue]="manager.userId">
                  {{ manager.fullName }} · {{ manager.email }}
                </option>
              }
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="field-label">Mô tả</label
            ><textarea
              class="textarea-shell"
              [(ngModel)]="form.description"
              name="description"
              placeholder="Mô tả ngắn về không gian và mục đích sử dụng..."
            ></textarea>
          </div>
          <div class="sm:col-span-2">
            <label class="field-label">URL ảnh</label
            ><input
              class="input-shell"
              [(ngModel)]="form.imageUrl"
              name="imageUrl"
              placeholder="https://..."
            />
          </div>
          <div class="sm:col-span-2">
            <label class="field-label">Hướng dẫn sử dụng</label
            ><textarea
              class="textarea-shell"
              [(ngModel)]="form.usageGuideline"
              name="usageGuideline"
            ></textarea>
          </div>
          <div class="mt-2 flex justify-end gap-2 sm:col-span-2">
            <button type="button" class="btn-secondary" (click)="createOpen.set(false)">Hủy</button
            ><button class="btn-primary" [disabled]="saving()">
              {{ saving() ? 'Đang lưu...' : 'Tạo phòng lab' }}
            </button>
          </div>
        </form>
      </app-modal>
    </section>
  `,
})
export class LabsPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly toast = inject(ToastService)
  protected readonly store = inject(AuthStore)
  protected readonly labs = signal<LabRoomResponse[]>([])
  protected readonly managers = signal<UserManagementResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly saving = signal(false)
  protected readonly createOpen = signal(false)
  protected readonly view = signal<'grid' | 'table'>('grid')
  protected readonly page = signal(1)
  protected readonly totalPages = signal(1)
  protected keyword = ''
  protected status: string | number = ''
  protected minimumCapacity: number | null = null
  protected form: LabForm = this.emptyForm()
  private loadVersion = 0

  ngOnInit(): void {
    this.load()
    if (this.store.isAdmin()) this.loadManagers()
  }
  protected load(): void {
    const version = ++this.loadVersion
    this.loading.set(true)
    this.api
      .searchLabs({
        keyword: this.keyword || undefined,
        status: this.store.isRequester() ? 1 : this.status || undefined,
        minimumCapacity: this.minimumCapacity ?? undefined,
        pageNumber: this.page(),
        pageSize: 12,
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
            ? result.items.filter((item) => isAvailableLabStatus(item.status))
            : result.items
          this.labs.set(visibleItems)
          this.hydrateImages(visibleItems, version)
          this.totalPages.set(result.totalPages || 1)
        },
        error: () => {
          if (version !== this.loadVersion) return
          this.toast.error('Không tải được danh sách phòng lab')
        },
      })
  }
  protected changePage(page: number): void {
    this.page.set(page)
    this.load()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  protected openCreate(): void {
    this.form = this.emptyForm()
    this.createOpen.set(true)
  }
  protected create(): void {
    if (
      !this.form.labName.trim() ||
      !this.form.roomCode.trim() ||
      !this.form.location.trim() ||
      !Number.isFinite(Number(this.form.capacity)) ||
      Number(this.form.capacity) < 1 ||
      !this.form.managerId
    ) {
      this.toast.info('Hãy nhập đầy đủ tên phòng, mã phòng, vị trí, sức chứa và người quản lý phòng thí nghiệm')
      return
    }
    this.saving.set(true)
    this.api
      .createLab({
        ...this.form,
        labName: this.form.labName.trim(),
        roomCode: this.form.roomCode.trim(),
        location: this.form.location.trim(),
        capacity: Number(this.form.capacity),
        managerId: this.form.managerId,
        description: this.form.description.trim() || null,
        imageUrl: this.form.imageUrl.trim() || null,
        usageGuideline: this.form.usageGuideline.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false)
          this.createOpen.set(false)
          this.toast.success('Đã tạo phòng lab')
          this.load()
        },
        error: () => {
          this.saving.set(false)
          this.toast.error('Không thể tạo phòng lab')
        },
      })
  }
  private hydrateImages(items: LabRoomResponse[], version: number): void {
    for (const item of items) {
      if (item.imageUrl) continue
      this.api.lab(item.labId).subscribe({
        next: (detail) => {
          if (version !== this.loadVersion || !detail.imageUrl) return
          this.labs.update((current) =>
            current.map((lab) =>
              lab.labId === item.labId ? { ...lab, imageUrl: detail.imageUrl } : lab,
            ),
          )
        },
        error: () => undefined,
      })
    }
  }

  private loadManagers(): void {
    this.api.users({ roleName: 'LabManager', pageNumber: 1, pageSize: 100 }).subscribe({
      next: (result) =>
        this.managers.set(
          result.items.filter(
            (manager) =>
              manager.status === 1 || manager.status === '1' || manager.status === 'Active',
          ),
        ),
      error: () => this.managers.set([]),
    })
  }
  private emptyForm(): LabForm {
    return {
      labName: '',
      roomCode: '',
      location: '',
      capacity: 20,
      description: '',
      imageUrl: '',
      usageGuideline: '',
      managerId: null,
    }
  }
}
