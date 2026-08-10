import { DatePipe } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { catchError, forkJoin, of, switchMap } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import { apiErrorMessage } from '../../core/http/api-error'
import type {
  DepartmentResponse,
  RoleResponse,
  UserManagementResponse,
  UserPenaltyResponse,
  UserViolationSummaryResponse,
} from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { ModalComponent } from '../../shared/ui/modal'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'
import {
  labelOf,
  normalizeUserStatus,
  toIso,
  toLocalDateTimeInput,
} from '../../shared/utils/presentation'

type ModalMode = 'profile' | 'role' | 'department' | 'status' | 'action' | null

@Component({
  selector: 'app-user-detail-page',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    IconComponent,
    ModalComponent,
    StatusBadgeComponent,
    DataStateComponent,
  ],
  template: `
    <section class="space-y-6">
      @if (loading()) {
        <div class="skeleton h-40 rounded-[30px]"></div>
        <div class="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
          <div class="skeleton h-96 rounded-[28px]"></div>
          <div class="skeleton h-96 rounded-[28px]"></div>
        </div>
      } @else if (!user()) {
        <app-data-state
          icon="user"
          title="Không tìm thấy người dùng"
          message="Tài khoản có thể đã bị xóa hoặc mã người dùng không hợp lệ."
          ><a routerLink="/app/admin/users" class="btn-primary mt-5"
            >Quay lại danh sách</a
          ></app-data-state
        >
      } @else if (user(); as current) {
        <app-page-header
          [title]="current.fullName"
          [subtitle]="current.email + ' · @' + current.username"
        >
          <a routerLink="/app/admin/users" class="btn-secondary"
            ><app-icon name="arrow-left" [size]="17" /> Danh sách</a
          >
          <button class="btn-primary" type="button" (click)="openProfile()">
            <app-icon name="edit" [size]="17" /> Chỉnh sửa
          </button>
        </app-page-header>

        @if (isCurrentAccount()) {
          <div
            class="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800"
          >
            <app-icon name="alert" [size]="20" />
            <div>
              <p class="font-black">Đây là tài khoản đang đăng nhập</p>
              <p class="mt-1 text-xs leading-5 text-amber-700">
                Không thể tự đổi vai trò hoặc vô hiệu hóa tài khoản đang đăng nhập.
              </p>
            </div>
          </div>
        }

        <div class="grid gap-6 xl:grid-cols-[.82fr_1.18fr]">
          <div class="space-y-6">
            <article
              class="relative overflow-hidden rounded-[30px] bg-[#111a3a] p-6 text-white shadow-2xl shadow-indigo-950/15"
            >
              <div
                class="absolute -top-16 -right-16 h-52 w-52 rounded-full bg-violet-500/25 blur-3xl"
              ></div>
              <div
                class="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-cyan-400/15 blur-3xl"
              ></div>
              <div class="relative">
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-20 w-20 items-center justify-center rounded-[24px] bg-linear-to-br from-violet-400 to-cyan-300 text-2xl font-black text-[#111a3a] shadow-xl"
                  >
                    {{ initials(current.fullName) }}
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-xl font-black">{{ current.fullName }}</p>
                    @if (current.roleName !== 'Admin') {
                      <p class="mt-1 truncate text-sm text-white/55">
                        {{ current.departmentName }}
                      </p>
                    }
                    <div class="mt-3">
                      <app-status-badge [value]="current.status" domain="user" />
                    </div>
                  </div>
                </div>
                <div class="mt-7 grid grid-cols-2 gap-3">
                  <div class="rounded-2xl bg-white/[.07] p-4">
                    <p class="text-[10px] font-bold tracking-[.15em] text-white/40 uppercase">
                      Vai trò
                    </p>
                    <p class="mt-2 text-sm font-black">{{ roleLabel(current.roleName) }}</p>
                  </div>
                  <div class="rounded-2xl bg-white/[.07] p-4">
                    <p class="text-[10px] font-bold tracking-[.15em] text-white/40 uppercase">
                      {{
                        current.roleName === 'Requester'
                          ? 'Điểm phạt'
                          : current.roleName === 'LabManager'
                            ? 'Phòng quản lý'
                            : 'Giới hạn booking'
                      }}
                    </p>
                    <p
                      class="mt-2 text-2xl font-black"
                      [class.text-rose-300]="current.roleName === 'Requester'"
                    >
                      {{
                        current.roleName === 'Requester'
                          ? current.penaltyPoints
                          : current.roleName === 'LabManager'
                            ? (current.managedLabRooms?.length ?? 0)
                            : '—'
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            @if (current.roleName === 'LabManager') {
              <article class="card-surface overflow-hidden">
                <header class="border-b border-slate-100 px-6 py-5">
                  <h2 class="font-black text-slate-950">Phòng đang quản lý</h2>
                  <p class="mt-1 text-xs text-slate-400">Phạm vi dựa trên LabRoom.ManagerId</p>
                </header>
                @if ((current.managedLabRooms?.length ?? 0) === 0) {
                  <p class="p-6 text-sm text-slate-500">
                    Chưa được phân công quản lý phòng lab nào.
                  </p>
                } @else {
                  <div class="divide-y divide-slate-100">
                    @for (lab of current.managedLabRooms; track lab.labId) {
                      <a
                        [routerLink]="['/app/labs', lab.labId]"
                        class="flex items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50"
                      >
                        <div>
                          <p class="font-black text-slate-800">{{ lab.labName }}</p>
                          <p class="mt-1 text-xs text-slate-400">{{ lab.roomCode }}</p>
                        </div>
                        <app-icon name="arrow-right" [size]="16" />
                      </a>
                    }
                  </div>
                }
              </article>
            }

            <article class="card-surface p-6">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="font-black text-slate-950">
                    {{ current.roleName === 'Admin' ? 'Vai trò' : 'Quyền và đơn vị' }}
                  </h2>
                  <p class="mt-1 text-xs text-slate-400">Cấu hình phạm vi hoạt động</p>
                </div>
                <span class="rounded-2xl bg-indigo-50 p-3 text-indigo-600"
                  ><app-icon name="shield" [size]="20"
                /></span>
              </div>
              <div class="mt-6 space-y-4">
                <div class="rounded-2xl border border-slate-100 p-4">
                  <p class="text-xs font-bold text-slate-400">Vai trò hiện tại</p>
                  <div class="mt-2 flex items-center justify-between gap-3">
                    <p class="font-black text-slate-800">{{ roleLabel(current.roleName) }}</p>
                    <button
                      class="text-xs font-black text-violet-600"
                      [disabled]="isCurrentAccount()"
                      (click)="openRole()"
                    >
                      Thay đổi
                    </button>
                  </div>
                </div>
                @if (current.roleName !== 'Admin') {
                  <div class="rounded-2xl border border-slate-100 p-4">
                    <p class="text-xs font-bold text-slate-400">Khoa/phòng ban</p>
                    <div class="mt-2 flex items-center justify-between gap-3">
                      <p class="font-black text-slate-800">{{ current.departmentName }}</p>
                      <button class="text-xs font-black text-violet-600" (click)="openDepartment()">
                        Thay đổi
                      </button>
                    </div>
                  </div>
                }
              </div>
            </article>
          </div>

          <div class="space-y-6">
            <article class="card-surface overflow-hidden">
              <header class="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 class="font-black text-slate-950">Thông tin tài khoản</h2>
                  <p class="mt-1 text-xs text-slate-400">Dữ liệu định danh và trạng thái</p>
                </div>
                <button class="btn-secondary" (click)="openProfile()">
                  <app-icon name="edit" [size]="16" /> Sửa
                </button>
              </header>
              <div class="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
                <div>
                  <p class="text-xs font-bold text-slate-400">Họ và tên</p>
                  <p class="mt-2 font-black text-slate-800">{{ current.fullName }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-400">Tên đăng nhập</p>
                  <p class="mt-2 font-black text-slate-800">{{ current.username }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-400">Email</p>
                  <p class="mt-2 font-black break-all text-slate-800">{{ current.email }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-400">Mã người dùng</p>
                  <p class="mt-2 font-black text-slate-800">#USR-{{ current.userId }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-400">Trạng thái</p>
                  <div class="mt-2">
                    <app-status-badge [value]="current.status" domain="user" />
                  </div>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-400">Hạn chế đến</p>
                  <p class="mt-2 font-black text-slate-800">
                    {{
                      current.roleName === 'Requester' && current.restrictionUntil
                        ? (current.restrictionUntil | date: 'dd/MM/yyyy HH:mm')
                        : '—'
                    }}
                  </p>
                </div>
              </div>
            </article>

            <article class="card-surface overflow-hidden">
              <header
                class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5"
              >
                <div>
                  <h2 class="font-black text-slate-950">Trạng thái tài khoản</h2>
                  <p class="mt-1 text-xs text-slate-400">Khóa, hạn chế hoặc kích hoạt tài khoản</p>
                </div>
                <button class="btn-primary" [disabled]="isCurrentAccount()" (click)="openStatus()">
                  <app-icon name="settings" [size]="16" /> Đổi trạng thái
                </button>
              </header>
              <div class="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left transition hover:-translate-y-0.5"
                  [disabled]="isCurrentAccount()"
                  (click)="openAction('activate')"
                >
                  <app-icon name="check" [size]="20" />
                  <p class="mt-3 text-sm font-black text-emerald-800">Kích hoạt</p>
                </button>
                @if (current.roleName === 'Requester') {
                  <button
                    class="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-left transition hover:-translate-y-0.5"
                    [disabled]="isCurrentAccount()"
                    (click)="openStatus(3)"
                  >
                    <app-icon name="clock" [size]="20" />
                    <p class="mt-3 text-sm font-black text-amber-800">Hạn chế</p>
                  </button>
                }
                <button
                  class="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-left transition hover:-translate-y-0.5"
                  [disabled]="isCurrentAccount()"
                  (click)="openAction('lock')"
                >
                  <app-icon name="lock" [size]="20" />
                  <p class="mt-3 text-sm font-black text-rose-800">Khóa</p></button
                ><button
                  class="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5"
                  [disabled]="isCurrentAccount()"
                  (click)="openAction('deactivate')"
                >
                  <app-icon name="user-x" [size]="20" />
                  <p class="mt-3 text-sm font-black text-slate-700">Ngừng hoạt động</p>
                </button>
              </div>
            </article>

            @if (current.roleName === 'Requester') {
              <article class="card-surface overflow-hidden">
                <header
                  class="flex items-center justify-between border-b border-slate-100 px-6 py-5"
                >
                  <div>
                    <h2 class="font-black text-slate-950">Vi phạm và điểm phạt</h2>
                    <p class="mt-1 text-xs text-slate-400">Tổng hợp các vi phạm đang hiệu lực</p>
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-black text-rose-600">
                      {{ summary()?.activePenaltyPoints ?? penalty()?.penaltyPoints ?? 0 }}
                    </p>
                    <p class="text-[10px] font-bold tracking-[.14em] text-slate-400 uppercase">
                      điểm active
                    </p>
                  </div>
                </header>
                @if (!summary() || summary()!.activeViolations.length === 0) {
                  <div class="p-6">
                    <app-data-state
                      icon="shield"
                      title="Không có vi phạm đang hiệu lực"
                      message="Tài khoản hiện không có bản ghi vi phạm Active."
                    />
                  </div>
                } @else {
                  <div class="divide-y divide-slate-100">
                    @for (violation of summary()!.activeViolations; track violation.violationId) {
                      <div class="flex flex-wrap items-center gap-4 px-6 py-4">
                        <span
                          class="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"
                          ><app-icon name="alert" [size]="18"
                        /></span>
                        <div class="min-w-0 flex-1">
                          <p class="font-black text-slate-800">
                            {{ labelOf('violationType', violation.violationType) }}
                          </p>
                          <p class="mt-1 text-xs text-slate-400">
                            Booking #{{ violation.bookingId }} ·
                            {{ violation.loggedAt | date: 'dd/MM/yyyy HH:mm' }}
                          </p>
                        </div>
                        <span
                          class="rounded-xl bg-rose-50 px-3 py-2 text-sm font-black text-rose-700"
                          >+{{ violation.penaltyPointsAdded }}</span
                        >
                      </div>
                    }
                  </div>
                }
              </article>
            }
          </div>
        </div>
      }

      <app-modal
        [open]="modal() === 'profile'"
        title="Chỉnh sửa thông tin"
        subtitle="Cập nhật họ tên, username và email của người dùng."
        (close)="closeModal()"
      >
        <form class="space-y-4" (ngSubmit)="saveProfile()">
          <div>
            <label class="field-label">Họ và tên *</label
            ><input
              class="input-shell"
              required
              [(ngModel)]="profileForm.fullName"
              name="fullName"
            />
          </div>
          <div>
            <label class="field-label">Tên đăng nhập *</label
            ><input
              class="input-shell"
              required
              [(ngModel)]="profileForm.username"
              name="username"
            />
          </div>
          <div>
            <label class="field-label">Email *</label
            ><input
              class="input-shell"
              type="email"
              required
              [(ngModel)]="profileForm.email"
              name="email"
            />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn-secondary" (click)="closeModal()">Hủy</button
            ><button class="btn-primary" [disabled]="saving()">
              {{ saving() ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </button>
          </div>
        </form>
      </app-modal>

      <app-modal
        [open]="modal() === 'role'"
        title="Đổi vai trò"
        subtitle="Vai trò quyết định phạm vi route và chức năng người dùng có thể truy cập."
        (close)="closeModal()"
      >
        <div class="space-y-4">
          <div>
            <label class="field-label">Vai trò mới</label
            ><select class="input-shell" [(ngModel)]="roleId">
              @for (role of roles(); track role.roleId) {
                <option [ngValue]="role.roleId">
                  {{ roleLabel(role.roleName) }} · {{ role.description || role.roleName }}
                </option>
              }
            </select>
          </div>
          <div
            class="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs leading-5 text-amber-800"
          >
            Không thể đổi vai trò của quản lý phòng thí nghiệm khi người này vẫn đang được phân công
            quản lý phòng lab.
          </div>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" (click)="closeModal()">Hủy</button
            ><button class="btn-primary" [disabled]="saving()" (click)="saveRole()">
              Xác nhận
            </button>
          </div>
        </div>
      </app-modal>

      <app-modal
        [open]="modal() === 'department'"
        title="Đổi khoa/phòng ban"
        subtitle="Di chuyển người dùng sang đơn vị mới."
        (close)="closeModal()"
      >
        <div class="space-y-4">
          <div>
            <label class="field-label">Khoa/phòng ban mới</label
            ><select class="input-shell" [(ngModel)]="departmentId">
              @for (department of departments(); track department.departmentId) {
                <option [ngValue]="department.departmentId">{{ department.departmentName }}</option>
              }
            </select>
          </div>
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" (click)="closeModal()">Hủy</button
            ><button class="btn-primary" [disabled]="saving()" (click)="saveDepartment()">
              Xác nhận
            </button>
          </div>
        </div>
      </app-modal>

      <app-modal
        [open]="modal() === 'status'"
        title="Cập nhật trạng thái"
        subtitle="Chọn trạng thái tài khoản và thời hạn hạn chế nếu cần."
        (close)="closeModal()"
      >
        <div class="space-y-4">
          <div>
            <label class="field-label">Trạng thái mới</label
            ><select class="input-shell" [(ngModel)]="statusValue">
              <option [ngValue]="1">Đang hoạt động</option>
              <option [ngValue]="2">Ngừng hoạt động</option>
              @if (user()?.roleName === 'Requester') {
                <option [ngValue]="3">Bị hạn chế đặt lịch</option>
              }
              <option [ngValue]="4">Bị khóa</option>
            </select>
          </div>
          @if (statusValue === 3) {
            <div>
              <label class="field-label">Hạn chế đến *</label
              ><input class="input-shell" type="datetime-local" [(ngModel)]="restrictionUntil" />
            </div>
          }
          <div class="flex justify-end gap-2">
            <button class="btn-secondary" (click)="closeModal()">Hủy</button
            ><button
              class="btn-primary"
              [disabled]="saving() || (statusValue === 3 && !restrictionUntil)"
              (click)="saveStatus()"
            >
              Lưu trạng thái
            </button>
          </div>
        </div>
      </app-modal>

      <app-modal
        [open]="modal() === 'action'"
        title="Xác nhận thao tác"
        [subtitle]="actionMessage()"
        width="520px"
        (close)="closeModal()"
        ><div class="flex justify-end gap-2">
          <button class="btn-secondary" (click)="closeModal()">Quay lại</button
          ><button class="btn-primary" [disabled]="saving()" (click)="confirmAction()">
            {{ saving() ? 'Đang xử lý...' : 'Xác nhận' }}
          </button>
        </div></app-modal
      >
    </section>
  `,
})
export class UserDetailPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly route = inject(ActivatedRoute)
  private readonly toast = inject(ToastService)
  protected readonly store = inject(AuthStore)
  protected readonly user = signal<UserManagementResponse | null>(null)
  protected readonly penalty = signal<UserPenaltyResponse | null>(null)
  protected readonly summary = signal<UserViolationSummaryResponse | null>(null)
  protected readonly departments = signal<DepartmentResponse[]>([])
  protected readonly roles = signal<RoleResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly saving = signal(false)
  protected readonly modal = signal<ModalMode>(null)
  protected readonly labelOf = labelOf
  protected profileForm = { fullName: '', username: '', email: '' }
  protected roleId = 3
  protected departmentId = 0
  protected statusValue = 1
  protected restrictionUntil = ''
  private userId = 0
  private pendingAction: 'lock' | 'unlock' | 'deactivate' | 'activate' = 'lock'

  ngOnInit(): void {
    this.userId = Number(this.route.snapshot.paramMap.get('userId'))
    this.load()
  }
  protected initials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  }
  protected roleLabel(role: string): string {
    return role === 'Admin'
      ? 'Quản trị viên'
      : role === 'LabManager'
        ? 'Quản lý phòng lab'
        : 'Người đặt lịch'
  }
  protected isCurrentAccount(): boolean {
    return this.store.user()?.userId === this.userId
  }
  protected closeModal(): void {
    this.modal.set(null)
  }

  protected openProfile(): void {
    const current = this.user()
    if (!current) return
    this.profileForm = {
      fullName: current.fullName,
      username: current.username,
      email: current.email,
    }
    this.modal.set('profile')
  }
  protected openRole(): void {
    const current = this.user()
    if (!current || this.isCurrentAccount()) return
    this.roleId = current.roleId
    this.modal.set('role')
  }
  protected openDepartment(): void {
    const current = this.user()
    if (!current) return
    this.departmentId = current.departmentId
    this.modal.set('department')
  }
  protected openStatus(status?: number): void {
    const current = this.user()
    if (!current || this.isCurrentAccount()) return
    const normalized = normalizeUserStatus(current.status)
    const statusNumber =
      normalized === 'Inactive'
        ? 2
        : normalized === 'Restricted'
          ? 3
          : normalized === 'Locked'
            ? 4
            : 1
    this.statusValue = status ?? statusNumber
    this.restrictionUntil = current.restrictionUntil
      ? toLocalDateTimeInput(current.restrictionUntil)
      : ''
    this.modal.set('status')
  }
  protected openAction(action: 'lock' | 'unlock' | 'deactivate' | 'activate'): void {
    if (this.isCurrentAccount()) return
    this.pendingAction = action
    this.modal.set('action')
  }
  protected actionMessage(): string {
    const name = this.user()?.fullName ?? 'người dùng này'
    const labels = {
      lock: 'khóa',
      unlock: 'mở khóa',
      deactivate: 'ngừng hoạt động',
      activate: 'kích hoạt',
    }
    return `Bạn sắp ${labels[this.pendingAction]} tài khoản của ${name}. Thao tác sẽ có hiệu lực ngay.`
  }

  protected saveProfile(): void {
    if (
      !this.profileForm.fullName.trim() ||
      !this.profileForm.username.trim() ||
      !this.profileForm.email.trim()
    )
      return
    this.perform(
      this.api.updateUser(this.userId, {
        fullName: this.profileForm.fullName.trim(),
        username: this.profileForm.username.trim(),
        email: this.profileForm.email.trim(),
      }),
      'Đã cập nhật thông tin người dùng',
    )
  }
  protected saveRole(): void {
    this.perform(this.api.changeUserRole(this.userId, this.roleId), 'Đã thay đổi vai trò')
  }
  protected saveDepartment(): void {
    this.perform(
      this.api.changeUserDepartment(this.userId, this.departmentId),
      'Đã thay đổi khoa/phòng ban',
    )
  }
  protected saveStatus(): void {
    const until =
      this.statusValue === 3 && this.restrictionUntil ? toIso(this.restrictionUntil) : null
    const email = this.user()?.email ?? ''
    this.perform(
      this.api.setUserStatus(this.userId, this.statusValue, until),
      'Đã cập nhật trạng thái tài khoản',
      () => this.store.rememberUserStatusHint(email, this.statusValue, until),
    )
  }
  protected confirmAction(): void {
    const email = this.user()?.email ?? ''
    const statusByAction = { lock: 4, unlock: 1, deactivate: 2, activate: 1 } as const
    this.perform(
      this.api.userAction(this.userId, this.pendingAction),
      'Thao tác tài khoản thành công',
      () => this.store.rememberUserStatusHint(email, statusByAction[this.pendingAction]),
    )
  }

  private perform(
    request: ReturnType<SystemService['updateUser']>,
    message: string,
    onSuccess?: () => void,
  ): void {
    this.saving.set(true)
    request.subscribe({
      next: () => {
        onSuccess?.()
        this.saving.set(false)
        this.closeModal()
        this.toast.success(message)
        this.load(false)
      },
      error: (error: unknown) => {
        this.saving.set(false)
        this.toast.error(apiErrorMessage(error, 'Không thể thực hiện thao tác'))
      },
    })
  }

  private load(showLoading = true): void {
    if (!Number.isFinite(this.userId) || this.userId <= 0) {
      this.loading.set(false)
      return
    }
    if (showLoading) this.loading.set(true)
    this.api
      .user(this.userId)
      .pipe(
        switchMap((user) => {
          const requesterOnly = user.roleName === 'Requester'
          return forkJoin({
            user: of(user),
            penalty: requesterOnly
              ? this.api
                  .userPenalty(this.userId)
                  .pipe(catchError(() => of(null as UserPenaltyResponse | null)))
              : of(null as UserPenaltyResponse | null),
            summary: requesterOnly
              ? this.api
                  .violationSummary(this.userId)
                  .pipe(catchError(() => of(null as UserViolationSummaryResponse | null)))
              : of(null as UserViolationSummaryResponse | null),
            departments: this.api
              .departments(true)
              .pipe(catchError(() => of([] as DepartmentResponse[]))),
            roles: this.api.roles().pipe(catchError(() => of([] as RoleResponse[]))),
          })
        }),
      )
      .subscribe({
        next: (response) => {
          this.user.set(response.user)
          this.penalty.set(response.penalty)
          this.summary.set(response.summary)
          this.departments.set(response.departments)
          this.roles.set(response.roles)
          this.loading.set(false)
        },
        error: () => {
          this.loading.set(false)
          this.toast.error('Không tải được chi tiết người dùng')
        },
      })
  }
}
