import { DatePipe, NgClass } from '@angular/common'
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { SystemService } from '../../core/api/system.service'
import type { UserManagementResponse, ViolationResponse } from '../../core/api/system.models'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { ModalComponent } from '../../shared/ui/modal'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { PositiveIntegerDirective } from '../../shared/ui/positive-integer.directive'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'
import { labelOf } from '../../shared/utils/presentation'
import { searchIncludes } from '../../shared/utils/search'
import { apiErrorMessage } from '../../core/http/api-error'

@Component({
  selector: 'app-violations-management-page',
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
    PositiveIntegerDirective,
  ],
  template: `<section class="space-y-6">
    <app-page-header
      title="Quản lý vi phạm"
      subtitle="Tạo, xử lý hoặc hủy vi phạm; theo dõi điểm phạt phát sinh từ booking và sự cố."
      ><button class="btn-primary" (click)="openCreate()">
        <app-icon name="plus" [size]="17" /> Tạo vi phạm
      </button></app-page-header
    >
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      @for (tab of tabs; track tab.value) {
        <button
          class="kpi-card text-left transition hover:-translate-y-1"
          (click)="status = tab.value"
        >
          <p class="text-xs font-bold text-slate-400">{{ tab.label }}</p>
          <p class="mt-2 text-3xl font-black" [ngClass]="tab.className">{{ count(tab.value) }}</p>
        </button>
      }
    </div>
    <div class="filter-bar md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_auto]">
      <div>
        <label class="field-label">Tìm kiếm</label
        ><input
          type="search"
          class="input-shell"
          [(ngModel)]="keyword"
          placeholder="Violation ID, tên người dùng, Booking ID..."
        />
      </div>
      <div>
        <label class="field-label">Loại vi phạm</label
        ><select class="input-shell" [(ngModel)]="type">
          <option value="">Tất cả</option>
          @for (item of violationTypes; track item.key) {
            <option [value]="item.key">{{ item.label }}</option>
          }
        </select>
      </div>
      <div>
        <label class="field-label">Trạng thái</label
        ><select class="input-shell" [(ngModel)]="status">
          <option value="">Tất cả</option>
          <option value="Active">Đang hiệu lực</option>
          <option value="Resolved">Đã xử lý</option>
          <option value="Cancelled">Đã hủy</option>
        </select>
      </div>
      <div class="flex items-end">
        <button class="btn-secondary w-full" (click)="reset()">
          <app-icon name="refresh" [size]="17" /> Đặt lại
        </button>
      </div>
    </div>
    <article class="card-surface overflow-hidden">
      @if (loading()) {
        <div class="p-6"><div class="skeleton h-80 rounded-2xl"></div></div>
      } @else if (filtered().length === 0) {
        <div class="p-6">
          <app-data-state
            title="Không tìm thấy dữ liệu phù hợp"
            message="Không có bản ghi phù hợp với bộ lọc."
            icon="shield"
          />
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="table-shell">
            <thead>
              <tr>
                <th>Vi phạm</th>
                <th>Người dùng</th>
                <th>Booking</th>
                <th>Loại</th>
                <th>Điểm</th>
                <th>Ngày ghi nhận</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filtered(); track item.violationId) {
                <tr>
                  <td class="font-black text-slate-900">#VP-{{ item.violationId }}</td>
                  <td>
                    <a
                      [routerLink]="['/app/admin/users', item.userId]"
                      class="font-black text-violet-700"
                      >{{ item.userName || 'Chưa xác định người dùng' }}</a
                    >
                  </td>
                  <td>
                    <a
                      [routerLink]="['/app/bookings', item.bookingId]"
                      class="font-black text-indigo-700"
                      >#BK-{{ item.bookingId }}</a
                    >
                  </td>
                  <td>{{ labelOf('violationType', item.violationType) }}</td>
                  <td>
                    <span
                      class="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700"
                      >+{{ item.penaltyPointsAdded }}</span
                    >
                  </td>
                  <td>{{ item.loggedAt | date: 'HH:mm dd/MM/yyyy' }}</td>
                  <td><app-status-badge [value]="item.status" domain="violation" /></td>
                  <td>
                    @if (item.status === 'Active') {
                      <div class="flex gap-2">
                        <button
                          class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700"
                          title="Resolve"
                          (click)="action(item, 'resolve')"
                        >
                          <app-icon name="check" [size]="16" /></button
                        ><button
                          class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700"
                          title="Cancel"
                          (click)="action(item, 'cancel')"
                        >
                          <app-icon name="x" [size]="16" />
                        </button>
                      </div>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </article>
    <app-modal
      [open]="createOpen()"
      title="Tạo vi phạm thủ công"
      subtitle="Điểm phạt được tính tự động theo loại vi phạm."
      (close)="createOpen.set(false)"
      ><form class="grid gap-4" novalidate (ngSubmit)="create()">
        <div>
          <label class="field-label">Tìm người dùng</label>
          <div class="relative">
            <input
              class="input-shell"
              autocomplete="off"
              [(ngModel)]="userSearch"
              name="userSearch"
              placeholder="Nhập ít nhất 2 ký tự..."
              (focus)="openUserResults()"
              (blur)="closeUserResults()"
              (ngModelChange)="onUserSearchChange()"
            />
            @if (userResultsOpen()) {
              <div
                class="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
              >
                @if (usersLoading()) {
                  <p class="px-3 py-2 text-sm text-slate-500">Đang tìm người dùng...</p>
                } @else if (userSearch.trim().length < 2) {
                  <p class="px-3 py-2 text-sm text-slate-500">Nhập ít nhất 2 ký tự để tìm kiếm.</p>
                } @else if (userSearchError()) {
                  <p class="px-3 py-2 text-sm font-semibold text-rose-600">
                    {{ userSearchError() }}
                  </p>
                } @else if (users().length === 0) {
                  <p class="px-3 py-2 text-sm text-slate-500">Không tìm thấy người dùng.</p>
                } @else {
                  @for (user of users(); track user.userId) {
                    <button
                      type="button"
                      class="block w-full rounded-xl px-3 py-2 text-left transition hover:bg-violet-50"
                      (mousedown)="$event.preventDefault()"
                      (click)="selectUser(user)"
                    >
                      <span class="block font-black text-slate-900">{{ user.fullName }}</span>
                      <span class="block text-xs text-slate-500">
                        {{ user.username }} · {{ user.email }}
                      </span>
                    </button>
                  }
                }
              </div>
            }
          </div>

          @if (selectedUser(); as user) {
            <div class="mt-3 rounded-2xl border border-violet-200 bg-violet-50 p-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-bold tracking-wide text-violet-600 uppercase">
                    Người dùng đã chọn
                  </p>
                  <p class="mt-1 font-black text-slate-900">{{ user.fullName }}</p>
                  <p class="text-xs text-slate-600">{{ user.username }} · {{ user.email }}</p>
                </div>
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white"
                  title="Bỏ chọn"
                  (click)="clearSelectedUser()"
                >
                  <app-icon name="x" [size]="15" />
                </button>
              </div>
            </div>
          }
          @if (userValidationError()) {
            <p class="mt-1.5 text-sm font-semibold text-rose-600">
              {{ userValidationError() }}
            </p>
          }
        </div>
        <div>
          <label class="field-label">Booking ID *</label
          ><input
            class="input-shell"
            type="number"
            appPositiveInteger
            min="1"
            required
            [(ngModel)]="form.bookingId"
            name="bookingId"
            (ngModelChange)="bookingValidationError.set('')"
          />
          @if (bookingValidationError()) {
            <p class="mt-1.5 text-sm font-semibold text-rose-600">
              {{ bookingValidationError() }}
            </p>
          }
        </div>
        <div>
          <label class="field-label">Loại vi phạm *</label
          ><select class="input-shell" [(ngModel)]="form.violationType" name="violationType">
            @for (item of violationTypes; track item.value) {
              <option [ngValue]="item.value">{{ item.label }}</option>
            }
          </select>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" (click)="createOpen.set(false)">Hủy</button
          ><button type="submit" class="btn-primary" [disabled]="saving()">
            {{ saving() ? 'Đang tạo...' : 'Tạo vi phạm' }}
          </button>
        </div>
      </form></app-modal
    >
  </section>`,
})
export class ViolationsManagementPage implements OnInit, OnDestroy {
  private readonly api = inject(SystemService)
  private readonly toast = inject(ToastService)
  protected readonly items = signal<ViolationResponse[]>([])
  protected readonly users = signal<UserManagementResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly saving = signal(false)
  protected readonly createOpen = signal(false)
  protected readonly usersLoading = signal(false)
  protected readonly userResultsOpen = signal(false)
  protected readonly selectedUser = signal<UserManagementResponse | null>(null)
  protected readonly userSearchError = signal('')
  protected readonly userValidationError = signal('')
  protected readonly bookingValidationError = signal('')
  protected keyword = ''
  protected status = ''
  protected type = ''
  protected userSearch = ''
  private userSearchTimer: ReturnType<typeof setTimeout> | null = null
  private userSearchRequestId = 0
  protected form = {
    userId: null as number | null,
    bookingId: null as number | null,
    violationType: 1,
  }
  protected readonly labelOf = labelOf
  protected readonly tabs = [
    { value: '', label: 'Tất cả', className: 'text-slate-950' },
    { value: 'Active', label: 'Đang hiệu lực', className: 'text-rose-600' },
    { value: 'Resolved', label: 'Đã xử lý', className: 'text-emerald-600' },
    { value: 'Cancelled', label: 'Đã hủy', className: 'text-slate-500' },
  ]
  protected readonly violationTypes = [
    { value: 1, key: 'NoShow', label: 'Không đến' },
    { value: 2, key: 'LateCheckout', label: 'Trả muộn' },
    { value: 3, key: 'DamageEquipment', label: 'Làm hỏng thiết bị' },
    { value: 4, key: 'MisuseEquipment', label: 'Sử dụng sai' },
    { value: 5, key: 'UnauthorizedUse', label: 'Sử dụng trái phép' },
  ]
  protected filtered(): ViolationResponse[] {
    return this.items()
      .filter(
        (item) =>
          (!this.status || item.status === this.status) &&
          (!this.type || item.violationType === this.type) &&
          searchIncludes(
            this.keyword,
            item.violationId,
            item.userId,
            item.userName,
            item.bookingId,
          ),
      )
      .sort((a, b) => +new Date(b.loggedAt) - +new Date(a.loggedAt))
  }
  ngOnInit(): void {
    this.load()
  }
  ngOnDestroy(): void {
    if (this.userSearchTimer) clearTimeout(this.userSearchTimer)
    this.userSearchRequestId++
  }
  protected count(status: string): number {
    return status ? this.items().filter((x) => x.status === status).length : this.items().length
  }
  protected reset(): void {
    this.keyword = ''
    this.status = ''
    this.type = ''
  }
  protected openCreate(): void {
    this.form = { userId: null, bookingId: null, violationType: 1 }
    this.userSearch = ''
    this.users.set([])
    this.selectedUser.set(null)
    this.userResultsOpen.set(false)
    this.userSearchError.set('')
    this.userValidationError.set('')
    this.bookingValidationError.set('')
    this.createOpen.set(true)
  }

  protected onUserSearchChange(): void {
    this.form.userId = null
    this.selectedUser.set(null)
    this.userValidationError.set('')
    this.userSearchError.set('')
    this.users.set([])
    this.userResultsOpen.set(true)

    if (this.userSearchTimer) clearTimeout(this.userSearchTimer)
    if (this.userSearch.trim().length < 2) {
      this.usersLoading.set(false)
      this.userSearchRequestId++
      return
    }

    this.userSearchTimer = setTimeout(() => this.loadUsers(), 350)
  }

  protected openUserResults(): void {
    if (!this.selectedUser()) this.userResultsOpen.set(true)
  }

  protected closeUserResults(): void {
    window.setTimeout(() => this.userResultsOpen.set(false), 150)
  }

  protected selectUser(user: UserManagementResponse): void {
    this.form.userId = user.userId
    this.selectedUser.set(user)
    this.userSearch = user.fullName
    this.userResultsOpen.set(false)
    this.userValidationError.set('')
    this.bookingValidationError.set('')
  }

  protected clearSelectedUser(): void {
    this.form.userId = null
    this.selectedUser.set(null)
    this.userSearch = ''
    this.users.set([])
    this.userResultsOpen.set(true)
    this.userValidationError.set('Hãy tìm và chọn người dùng từ danh sách gợi ý.')
  }

  private loadUsers(): void {
    const keyword = this.userSearch.trim()
    if (keyword.length < 2) return

    const requestId = ++this.userSearchRequestId
    this.usersLoading.set(true)
    this.api
      .users({
        keyword,
        roleName: 'Requester',
        pageNumber: 1,
        pageSize: 20,
      })
      .subscribe({
        next: (response) => {
          if (requestId !== this.userSearchRequestId) return
          this.users.set(response.items)
          this.usersLoading.set(false)
        },
        error: () => {
          if (requestId !== this.userSearchRequestId) return
          this.users.set([])
          this.usersLoading.set(false)
          this.userSearchError.set('Không tải được danh sách người dùng. Vui lòng thử lại.')
        },
      })
  }
  protected create(): void {
    if (this.saving()) return

    this.userValidationError.set(
      this.form.userId ? '' : 'Hãy tìm và chọn người dùng từ danh sách gợi ý.',
    )
    this.bookingValidationError.set(
      this.form.bookingId && this.form.bookingId > 0 ? '' : 'Hãy nhập Booking ID hợp lệ.',
    )
    if (this.userValidationError() || this.bookingValidationError()) return

    this.saving.set(true)
    const userId = this.form.userId!
    const bookingId = this.form.bookingId!
    this.api.booking(bookingId).subscribe({
      next: (booking) => {
        if (booking.userId !== userId) {
          this.saving.set(false)
          this.bookingValidationError.set('Booking này không thuộc người dùng đã chọn.')
          return
        }
        this.api
          .createViolation({
            userId,
            bookingId,
            violationType: this.form.violationType,
          })
          .subscribe({
            next: () => {
              this.saving.set(false)
              this.createOpen.set(false)
              this.toast.success('Đã tạo vi phạm')
              this.load()
            },
            error: (error: unknown) => {
              this.saving.set(false)
              this.toast.error('Không thể tạo vi phạm', apiErrorMessage(error))
            },
          })
      },
      error: (error: unknown) => {
        this.saving.set(false)
        this.toast.error('Không xác minh được booking', apiErrorMessage(error))
      },
    })
  }
  protected action(item: ViolationResponse, action: 'resolve' | 'cancel'): void {
    if (!confirm(`${action === 'resolve' ? 'Xử lý' : 'Hủy'} vi phạm #${item.violationId}?`)) return
    const req =
      action === 'resolve'
        ? this.api.resolveViolation(item.violationId)
        : this.api.cancelViolation(item.violationId)
    req.subscribe({
      next: () => {
        this.toast.success('Đã cập nhật vi phạm')
        this.load()
      },
      error: (error: unknown) =>
        this.toast.error('Không thể cập nhật vi phạm', apiErrorMessage(error)),
    })
  }
  private load(): void {
    this.loading.set(true)
    this.api.violations().subscribe({
      next: (x) => {
        this.items.set(x)
        this.loading.set(false)
      },
      error: () => {
        this.loading.set(false)
        this.toast.error('Không tải được vi phạm')
      },
    })
  }
}
