import { DatePipe, NgClass } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { forkJoin, of } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import type {
  ApiEnum,
  BookingDetailResponse,
  BookingItemRequest,
  BookingResponse,
  EquipmentResponse,
  LabRoomResponse,
  PriorityRuleResponse,
  SuggestedSlotResponse,
  WaitlistResponse,
} from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { ToastService } from '../../shared/ui/toast.service'
import {
  isAvailableLabStatus,
  labelOf,
  normalizeUserStatus,
  toDateInput,
  toIso,
} from '../../shared/utils/presentation'
import { ApiError, apiErrorMessage } from '../../core/http/api-error'

interface SelectedResource {
  key: string
  resourceType: number
  labId: number | null
  equipmentId: number | null
  name: string
  note: string
}

type BookingSlotPeriod = 'morning' | 'afternoon'

interface FixedBookingSlot {
  id: number
  start: string
  end: string
  period: BookingSlotPeriod
}

interface SlotRangeSelection {
  date: string
  slotIds: number[]
}

function isBookableEquipmentStatus(value: ApiEnum | null | undefined): boolean {
  const status = String(value ?? '')
    .trim()
    .toLowerCase()
  return ['1', '2', '3', 'available', 'inuse', 'maintenance'].includes(status)
}

@Component({
  selector: 'app-booking-form-page',
  imports: [
    DatePipe,
    NgClass,
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    IconComponent,
    DataStateComponent,
  ],
  template: `
    <section class="space-y-6">
      <app-page-header
        [title]="editing() ? 'Chỉnh sửa booking' : 'Tạo yêu cầu booking'"
        [subtitle]="
          editing()
            ? 'Cập nhật thời gian và mục đích của booking đang chờ duyệt. Tài nguyên không thay đổi.'
            : 'Chọn một phòng, tích thiết bị cần mượn, chọn thời gian rồi gửi một booking duy nhất để duyệt.'
        "
      >
        <a routerLink="/app/calendar" class="btn-secondary"
          ><app-icon name="calendar" [size]="17" /> Kiểm tra lịch</a
        >
      </app-page-header>

      @if (!canCreateBooking()) {
        <div class="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div class="flex gap-3">
            <app-icon name="alert" [size]="21" />
            <div>
              <p class="font-black">Tài khoản hiện không thể tạo booking</p>
              <p class="mt-1 text-sm leading-6 text-amber-800/75">
                Trạng thái hiện tại: {{ store.user()?.status }}. Liên hệ quản trị viên hoặc chờ hết
                thời gian hạn chế.
              </p>
            </div>
          </div>
        </div>
      }

      <div class="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div class="space-y-6">
          <div class="card-surface p-3 sm:p-4">
            <div class="grid grid-cols-4 gap-2">
              @for (item of steps; track item.id) {
                <button
                  type="button"
                  class="relative rounded-2xl px-2 py-3 text-center transition"
                  [ngClass]="
                    step() === item.id
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                      : step() > item.id
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-50 text-slate-400'
                  "
                  (click)="goTo(item.id)"
                >
                  <span
                    class="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-current/20 text-xs font-black"
                    >{{ step() > item.id ? '✓' : item.id }}</span
                  ><span
                    class="mt-2 hidden text-[10px] font-black tracking-[.08em] uppercase sm:block"
                    >{{ item.label }}</span
                  >
                </button>
              }
            </div>
          </div>

          @if (step() === 1) {
            <article class="card-surface p-5 sm:p-7">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"
                >
                  <app-icon name="building" [size]="23" />
                </div>
                <div>
                  <h2 class="text-xl font-black text-slate-950">Chọn phòng và thiết bị sử dụng</h2>
                  <p class="mt-1 text-sm text-slate-500">
                    Mỗi booking bắt buộc có một phòng. Thiết bị trong phòng là tùy chọn; chỉ tích
                    những thiết bị cần mượn.
                  </p>
                </div>
              </div>

              <div class="mt-6">
                <label class="field-label">Phòng lab *</label
                ><select
                  class="input-shell"
                  [disabled]="editing()"
                  [(ngModel)]="labId"
                  (ngModelChange)="onLabChange()"
                >
                  <option [ngValue]="null">Chọn phòng lab</option>
                  @for (lab of labs(); track lab.labId) {
                    <option [ngValue]="lab.labId">
                      {{ lab.labName }} · {{ lab.roomCode }} · {{ lab.status }}
                    </option>
                  }
                </select>
              </div>

              @if (selectedRoom(); as room) {
                <div class="mt-5 rounded-[24px] border border-violet-200 bg-violet-50 p-5">
                  <div class="flex items-start gap-3">
                    <span
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm"
                      ><app-icon name="building" [size]="19"
                    /></span>
                    <div class="min-w-0 flex-1">
                      <p class="font-black text-violet-900">{{ room.name }}</p>
                      <p class="mt-1 text-xs text-violet-700/70">
                        Phòng là tài nguyên chính và luôn được gửi trong booking.
                      </p>
                    </div>
                  </div>
                  <label class="field-label mt-4">Ghi chú cho phòng</label
                  ><input
                    class="input-shell"
                    [ngModel]="room.note"
                    (ngModelChange)="updateRoomNote($event)"
                    placeholder="Yêu cầu bố trí, lưu ý khi sử dụng..."
                  />
                </div>

                <div class="mt-6">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p class="font-black text-slate-900">Thiết bị trong phòng</p>
                      <p class="mt-1 text-xs text-slate-400">
                        Không bắt buộc. Không tích thiết bị nếu chỉ cần sử dụng phòng.
                      </p>
                    </div>
                    <span
                      class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"
                      >{{ selectedEquipmentCount() }} thiết bị đã chọn</span
                    >
                  </div>

                  @if (availableEquipments().length === 0) {
                    <div class="mt-4">
                      <app-data-state
                        title="Phòng chưa có thiết bị khả dụng"
                        message="Bạn vẫn có thể tiếp tục và tạo booking chỉ gồm phòng."
                        icon="microscope"
                      />
                    </div>
                  } @else {
                    <div class="mt-4 grid gap-3 md:grid-cols-2">
                      @for (equipment of availableEquipments(); track equipment.equipmentId) {
                        <button
                          type="button"
                          class="flex items-center gap-3 rounded-2xl border p-4 text-left transition"
                          [ngClass]="
                            isSelected(equipment.equipmentId)
                              ? 'border-cyan-300 bg-cyan-50 shadow-sm'
                              : 'border-slate-200 hover:border-cyan-200'
                          "
                          [disabled]="editing()"
                          (click)="toggleEquipment(equipment)"
                        >
                          <span
                            class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm"
                            ><app-icon name="microscope" [size]="19" /></span
                          ><span class="min-w-0 flex-1"
                            ><span class="block truncate text-sm font-black text-slate-900">{{
                              equipment.equipmentName
                            }}</span
                            ><span class="mt-1 block text-[10px] font-bold text-slate-400">{{
                              equipment.status
                            }}</span></span
                          >
                          <span
                            class="flex h-6 w-6 items-center justify-center rounded-lg border"
                            [ngClass]="
                              isSelected(equipment.equipmentId)
                                ? 'border-cyan-500 bg-cyan-500 text-white'
                                : 'border-slate-300 bg-white text-transparent'
                            "
                            ><app-icon name="check" [size]="15"
                          /></span>
                        </button>
                      }
                    </div>
                  }
                </div>
              }

              <div class="mt-7 flex justify-end">
                <button class="btn-primary" [disabled]="!hasSelectedLab()" (click)="step.set(2)">
                  Tiếp tục <app-icon name="arrow-right" [size]="17" />
                </button>
              </div>
            </article>
          }

          @if (step() === 2) {
            <article class="card-surface p-5 sm:p-7">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"
                >
                  <app-icon name="clock" [size]="23" />
                </div>
                <div>
                  <h2 class="text-xl font-black text-slate-950">Chọn ngày và slot sử dụng</h2>
                  <p class="mt-1 text-sm text-slate-500">
                    Chọn một hoặc hai slot liên tiếp trong cùng một buổi. Hệ thống tự tính giờ bắt
                    đầu và kết thúc.
                  </p>
                </div>
              </div>

              <div class="mt-6">
                <label class="field-label">Ngày sử dụng *</label>
                <input
                  class="input-shell max-w-md"
                  type="date"
                  [min]="minimumBookingDate()"
                  [(ngModel)]="bookingDate"
                  (ngModelChange)="onBookingDateChange()"
                />
              </div>

              <div class="mt-6 grid gap-4 lg:grid-cols-2">
                @for (period of slotPeriods; track period.key) {
                  <section class="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="font-black text-slate-900">{{ period.label }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ period.description }}</p>
                      </div>
                      <span
                        class="rounded-full bg-white px-3 py-1 text-[10px] font-black tracking-[.08em] text-slate-500 uppercase shadow-sm"
                        >{{ slotsForPeriod(period.key).length }} slot</span
                      >
                    </div>

                    <div class="mt-4 grid gap-3 sm:grid-cols-2">
                      @for (slot of slotsForPeriod(period.key); track slot.id) {
                        <button
                          type="button"
                          class="rounded-2xl border p-4 text-left transition"
                          [ngClass]="
                            isTimeSlotSelected(slot.id)
                              ? 'border-violet-400 bg-violet-600 text-white shadow-lg shadow-violet-200'
                              : isSlotDisabled(slot)
                                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300'
                                : 'border-slate-200 bg-white text-slate-900 hover:border-violet-300 hover:bg-violet-50'
                          "
                          [disabled]="isSlotDisabled(slot)"
                          (click)="toggleTimeSlot(slot)"
                        >
                          <span class="block text-[10px] font-black tracking-[.12em] uppercase"
                            >Slot {{ slot.id }}</span
                          >
                          <span class="mt-2 block text-lg font-black"
                            >{{ slot.start }}–{{ slot.end }}</span
                          >
                          <span class="mt-1 block text-xs opacity-70">2 giờ</span>
                        </button>
                      }
                    </div>
                  </section>
                }
              </div>

              @if (hasSelectedSlotRange()) {
                <div
                  class="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"
                >
                  <div class="flex items-start gap-3">
                    <span
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm"
                      ><app-icon name="check" [size]="19"
                    /></span>
                    <div class="min-w-0 flex-1">
                      <p class="font-black">{{ selectedSlotSummary() }}</p>
                      <p class="mt-1 text-sm leading-6 text-emerald-800/80">
                        Tạo một booking duy nhất từ
                        <strong>{{ startTime | date: 'HH:mm dd/MM/yyyy' }}</strong> đến
                        <strong>{{ endTime | date: 'HH:mm dd/MM/yyyy' }}</strong
                        >.
                      </p>
                      <p class="mt-2 text-xs leading-5 text-emerald-800/70">
                        Nhắc check-in lúc <strong>{{ checkInReminderTime() }}</strong> và nhắc
                        check-out lúc <strong>{{ checkOutReminderTime() }}</strong
                        >. Không gửi lại thông báo tại ranh giới giữa hai slot.
                      </p>
                    </div>
                  </div>
                </div>
              } @else {
                <div
                  class="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500"
                >
                  Chưa chọn slot. Có thể chọn Slot 1 + 2 hoặc Slot 3 + 4 để tạo một khoảng thời gian
                  liên tục.
                </div>
              }

              <div class="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn-secondary"
                  (click)="checkAvailability()"
                  [disabled]="checking() || !validTime()"
                >
                  <app-icon name="search" [size]="17" />
                  {{ checking() ? 'Đang kiểm tra...' : 'Kiểm tra khung giờ' }}</button
                ><a
                  routerLink="/app/calendar"
                  [queryParams]="{ labId: labId }"
                  class="btn-secondary"
                  ><app-icon name="calendar" [size]="17" /> Mở lịch phòng</a
                >
              </div>
              @if (availabilityMessage()) {
                <div
                  class="mt-5 rounded-2xl border p-4"
                  [ngClass]="
                    available()
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  "
                >
                  <div class="flex flex-wrap items-center gap-3">
                    <p class="flex min-w-0 flex-1 items-center gap-2 font-black">
                      <app-icon [name]="available() ? 'check' : 'alert'" [size]="18" />
                      {{ availabilityMessage() }}
                    </p>
                    @if (canJoinWaitlist()) {
                      <button
                        type="button"
                        class="btn-secondary shrink-0"
                        [disabled]="joiningWaitlist() || hasJoinedCurrentWaitlist() || !validTime()"
                        (click)="joinWaitlist()"
                      >
                        <app-icon name="hourglass" [size]="16" />
                        {{
                          joiningWaitlist()
                            ? 'Đang tham gia...'
                            : hasJoinedCurrentWaitlist()
                              ? 'Đã tham gia hàng chờ'
                              : 'Tham gia hàng chờ'
                        }}
                      </button>
                    }
                  </div>
                  @if (!available() && selectedEquipmentCount() > 0) {
                    <p class="mt-3 text-xs leading-5 opacity-75">
                      Hàng chờ chỉ giữ quyền ưu tiên cho <strong>phòng</strong>. Các thiết bị đang
                      chọn sẽ không được giữ; khi đến lượt, bạn chọn lại thiết bị còn khả dụng rồi
                      tạo booking.
                    </p>
                  }
                </div>
              }
              @if (fixedSlotSuggestions().length) {
                <div class="mt-6">
                  <p class="font-black text-slate-900">Khung giờ thay thế theo slot cố định</p>
                  <div class="mt-3 grid gap-3 md:grid-cols-2">
                    @for (slot of fixedSlotSuggestions(); track slot.startTime) {
                      <button
                        type="button"
                        class="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left hover:bg-violet-100"
                        (click)="chooseSlot(slot)"
                      >
                        <p class="text-sm font-black text-violet-900">
                          {{ suggestedSlotLabel(slot) }}
                        </p>
                        <p class="mt-1 text-xs text-violet-700">
                          {{ slot.startTime | date: 'HH:mm dd/MM/yyyy' }} đến
                          {{ slot.endTime | date: 'HH:mm dd/MM/yyyy' }}
                        </p>
                      </button>
                    }
                  </div>
                </div>
              } @else if (suggestions().length) {
                <div class="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  Các gợi ý hiện tại không khớp bốn slot cố định. Hãy chọn ngày hoặc slot khác.
                </div>
              }
              <div class="mt-7 flex justify-between">
                <button type="button" class="btn-secondary" (click)="step.set(1)">
                  <app-icon name="arrow-left" [size]="17" /> Quay lại</button
                ><button
                  type="button"
                  class="btn-primary"
                  [disabled]="!availabilityIsCurrent()"
                  (click)="continueToPurpose()"
                >
                  Tiếp tục <app-icon name="arrow-right" [size]="17" />
                </button>
              </div>
            </article>
          }

          @if (step() === 3) {
            <article class="card-surface p-5 sm:p-7">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
                >
                  <app-icon name="sparkles" [size]="23" />
                </div>
                <div>
                  <h2 class="text-xl font-black text-slate-950">Mục đích & ưu tiên</h2>
                  <p class="mt-1 text-sm text-slate-500">
                    Mức ưu tiên được áp dụng theo quy tắc hiện hành.
                  </p>
                </div>
              </div>
              <div class="mt-6 grid gap-3 sm:grid-cols-2">
                @for (purpose of purposes; track purpose.value) {
                  <button
                    type="button"
                    class="rounded-2xl border p-4 text-left transition"
                    [ngClass]="
                      purposeType === purpose.value
                        ? 'border-violet-300 bg-violet-50 shadow-sm'
                        : 'border-slate-200 hover:border-violet-200'
                    "
                    (click)="purposeType = purpose.value"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="font-black text-slate-900">{{ purpose.label }}</p>
                        <p class="mt-1 text-xs leading-5 text-slate-500">
                          {{ purpose.description }}
                        </p>
                      </div>
                      <span
                        class="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-violet-700 shadow-sm"
                        >P{{ priorityFor(purpose.key) }}</span
                      >
                    </div>
                  </button>
                }
              </div>
              <div class="mt-5">
                <label class="field-label">Mô tả mục đích *</label
                ><textarea
                  class="textarea-shell min-h-36"
                  [(ngModel)]="purposeDescription"
                  placeholder="Mô tả nội dung thực hành, dự án, số người tham gia và kết quả mong đợi..."
                ></textarea>
              </div>
              <div class="mt-7 flex justify-between">
                <button class="btn-secondary" (click)="step.set(2)">
                  <app-icon name="arrow-left" [size]="17" /> Quay lại</button
                ><button
                  class="btn-primary"
                  [disabled]="!purposeDescription.trim()"
                  (click)="step.set(4)"
                >
                  Xem lại <app-icon name="arrow-right" [size]="17" />
                </button>
              </div>
            </article>
          }

          @if (step() === 4) {
            <article class="card-surface p-5 sm:p-7">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
                >
                  <app-icon name="check" [size]="23" />
                </div>
                <div>
                  <h2 class="text-xl font-black text-slate-950">Xác nhận yêu cầu</h2>
                  <p class="mt-1 text-sm text-slate-500">
                    Kiểm tra lần cuối trước khi gửi booking ở trạng thái chờ duyệt.
                  </p>
                </div>
              </div>
              <div class="mt-6 grid gap-4 md:grid-cols-2">
                <div class="rounded-2xl bg-slate-50 p-5">
                  <p class="text-[10px] font-black tracking-[.15em] text-slate-400 uppercase">
                    Thời gian
                  </p>
                  <p class="mt-2 font-black text-slate-900">
                    {{ startTime | date: 'HH:mm dd/MM/yyyy' }}
                  </p>
                  <p class="mt-1 text-sm text-slate-500">
                    đến {{ endTime | date: 'HH:mm dd/MM/yyyy' }}
                  </p>
                  <p class="mt-3 text-xs font-black text-violet-700">
                    {{ selectedSlotSummary() }}
                  </p>
                </div>
                <div class="rounded-2xl bg-slate-50 p-5">
                  <p class="text-[10px] font-black tracking-[.15em] text-slate-400 uppercase">
                    Mục đích
                  </p>
                  <p class="mt-2 font-black text-slate-900">{{ purposeLabel() }}</p>
                  <p class="mt-1 text-sm text-slate-500">
                    Mức ưu tiên P{{ priorityFor(purposeKey()) }}
                  </p>
                </div>
              </div>
              <div class="mt-4 rounded-2xl border border-slate-200 p-5">
                <p class="text-xs font-black text-slate-700">Phòng và thiết bị đã chọn</p>
                <div class="mt-3 space-y-3">
                  @for (resource of selected(); track resource.key) {
                    <div class="flex items-center gap-3">
                      <span
                        class="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"
                        ><app-icon
                          [name]="resource.resourceType === 1 ? 'building' : 'microscope'"
                          [size]="17"
                      /></span>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-black text-slate-900">
                          {{ resource.name }}
                        </p>
                        <p class="truncate text-xs text-slate-400">
                          {{ resource.note || 'Không có ghi chú' }}
                        </p>
                      </div>
                    </div>
                  }
                </div>
              </div>
              <div class="mt-4 rounded-2xl bg-violet-50 p-5">
                <p class="text-xs font-black text-violet-800">Mô tả</p>
                <p class="mt-2 text-sm leading-6 whitespace-pre-line text-violet-900/70">
                  {{ purposeDescription }}
                </p>
              </div>
              <div class="mt-7 flex justify-between">
                <button class="btn-secondary" (click)="step.set(3)">
                  <app-icon name="arrow-left" [size]="17" /> Quay lại</button
                ><button
                  class="btn-primary"
                  [disabled]="submitting() || !canCreateBooking()"
                  (click)="submit()"
                >
                  <app-icon name="send" [size]="17" />
                  {{
                    submitting()
                      ? 'Đang lưu...'
                      : editing()
                        ? 'Lưu thay đổi'
                        : 'Gửi yêu cầu booking'
                  }}
                </button>
              </div>
            </article>
          }
        </div>

        <aside class="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <article class="card-surface p-5">
            <p class="text-[10px] font-black tracking-[.16em] text-violet-500 uppercase">
              Tóm tắt nhanh
            </p>
            <div class="mt-4 space-y-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Phòng lab</span
                ><strong class="max-w-40 truncate text-slate-900">{{ selectedLabName() }}</strong>
              </div>
              <div class="h-px bg-slate-100"></div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Thiết bị mượn</span
                ><strong class="text-slate-900">{{ selectedEquipmentCount() }}</strong>
              </div>
              <div class="h-px bg-slate-100"></div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Ưu tiên</span
                ><strong class="text-violet-700">P{{ priorityFor(purposeKey()) }}</strong>
              </div>
            </div>
          </article>
        </aside>
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
  protected readonly step = signal(1)
  protected readonly suggestions = signal<SuggestedSlotResponse[]>([])
  protected readonly selectedSlotIds = signal<number[]>([])
  protected readonly checking = signal(false)
  protected readonly submitting = signal(false)
  protected readonly joiningWaitlist = signal(false)
  protected readonly available = signal(false)
  protected readonly editing = signal(false)
  protected readonly availabilityMessage = signal('')
  private readonly availabilityFingerprint = signal<string | null>(null)
  private readonly currentUserBookings = signal<BookingResponse[]>([])
  private readonly currentUserWaitlists = signal<WaitlistResponse[]>([])
  protected readonly personalTimeConflict = signal(false)
  protected readonly canJoinWaitlist = signal(false)
  protected readonly timeSlots: readonly FixedBookingSlot[] = [
    { id: 1, start: '07:00', end: '09:00', period: 'morning' },
    { id: 2, start: '09:00', end: '11:00', period: 'morning' },
    { id: 3, start: '13:00', end: '15:00', period: 'afternoon' },
    { id: 4, start: '15:00', end: '17:00', period: 'afternoon' },
  ]
  protected readonly slotPeriods: readonly {
    key: BookingSlotPeriod
    label: string
    description: string
  }[] = [
    { key: 'morning', label: 'Buổi sáng', description: 'Slot 1 và Slot 2' },
    { key: 'afternoon', label: 'Buổi chiều', description: 'Slot 3 và Slot 4' },
  ]
  protected labId: number | null = null
  protected bookingDate = toDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000))
  protected startTime = ''
  protected endTime = ''
  protected purposeType = 1
  protected purposeDescription = ''
  private sourceWaitlistId: number | null = null
  private bookingId = 0
  protected readonly steps = [
    { id: 1, label: 'Phòng & thiết bị' },
    { id: 2, label: 'Thời gian' },
    { id: 3, label: 'Mục đích' },
    { id: 4, label: 'Xác nhận' },
  ]
  protected readonly purposes = [
    {
      value: 1,
      key: 'ResearchProject',
      label: 'Dự án nghiên cứu',
      description: 'Nghiên cứu khoa học, đề tài hoặc dự án.',
    },
    {
      value: 2,
      key: 'CoursePractice',
      label: 'Thực hành môn học',
      description: 'Buổi thực hành theo kế hoạch môn học.',
    },
    {
      value: 3,
      key: 'SelfStudy',
      label: 'Tự học',
      description: 'Tự nghiên cứu hoặc luyện tập cá nhân.',
    },
    {
      value: 4,
      key: 'Other',
      label: 'Mục đích khác',
      description: 'Các nhu cầu hợp lệ ngoài ba nhóm trên.',
    },
  ]
  protected availableEquipments(): EquipmentResponse[] {
    return this.equipments().filter(
      (item) => item.labId === this.labId && isBookableEquipmentStatus(item.status),
    )
  }

  protected selectedRoom(): SelectedResource | null {
    return this.selected().find((item) => item.resourceType === 1) ?? null
  }

  protected selectedEquipmentCount(): number {
    return this.selected().filter((item) => item.resourceType === 2).length
  }

  protected hasSelectedLab(): boolean {
    return Boolean(this.labId && this.selectedRoom())
  }

  protected selectedLabName(): string {
    return this.labs().find((lab) => lab.labId === this.labId)?.labName ?? 'Chưa chọn'
  }

  ngOnInit(): void {
    this.bookingId = Number(this.route.snapshot.paramMap.get('bookingId'))
    this.editing.set(this.bookingId > 0)

    forkJoin({
      labs: this.api.labs(),
      equipments: this.api.equipments(),
      rules: this.api.priorityRules(true),
      booking: this.bookingId > 0 ? this.api.booking(this.bookingId) : of(null),
      waitlists:
        !this.editing() && this.store.user()?.userId
          ? this.api.waitlistsByUser(this.store.user()!.userId)
          : of([] as WaitlistResponse[]),
    }).subscribe({
      next: ({ labs, equipments, rules, booking, waitlists }) => {
        const availableLabs = labs.filter((lab) => isAvailableLabStatus(lab.status))
        const availableEquipments = equipments.filter((equipment) =>
          isBookableEquipmentStatus(equipment.status),
        )
        this.labs.set(booking ? labs : availableLabs)
        this.equipments.set(booking ? equipments : availableEquipments)
        this.rules.set(rules)
        this.currentUserWaitlists.set(waitlists)

        if (booking) {
          this.initializeEdit(booking, equipments)
          return
        }

        const query = this.route.snapshot.queryParamMap
        const qLab = Number(query.get('labId'))
        const qEquipment = Number(query.get('equipmentId'))
        const qStart = query.get('start')
        const qEnd = query.get('end')
        const qWaitlist = Number(query.get('waitlistId'))
        this.sourceWaitlistId = qWaitlist > 0 ? qWaitlist : null
        if (qStart && !Number.isNaN(new Date(qStart).getTime())) {
          this.bookingDate = toDateInput(new Date(qStart))
          if (qEnd && !Number.isNaN(new Date(qEnd).getTime())) {
            const applied = this.applyRangeToFixedSlots(qStart, qEnd)
            if (!applied) {
              this.toast.info(
                'Khung giờ được truyền vào không thuộc bốn slot cố định',
                'Hãy chọn lại một hoặc hai slot liên tiếp trong cùng một buổi.',
              )
            }
          }
        }

        const preselectedEquipment = qEquipment
          ? availableEquipments.find((equipment) => equipment.equipmentId === qEquipment)
          : undefined
        const targetLabId = qLab || preselectedEquipment?.labId || 0
        if (targetLabId) {
          this.labId = targetLabId
          this.onLabChange()
          if (preselectedEquipment && preselectedEquipment.labId === targetLabId) {
            this.toggleEquipment(preselectedEquipment)
          }
        }
      },
      error: () => this.toast.error('Không tải được dữ liệu tạo booking'),
    })
  }

  private initializeEdit(booking: BookingDetailResponse, equipments: EquipmentResponse[]): void {
    if (booking.status !== 'Pending') {
      this.toast.info('Chỉ booking đang chờ duyệt mới được chỉnh sửa')
      void this.router.navigate(['/app/bookings', booking.bookingId], { replaceUrl: true })
      return
    }
    if (booking.userId !== this.store.user()?.userId) {
      this.toast.info('Bạn chỉ có thể chỉnh sửa booking của chính mình')
      void this.router.navigate(['/app/bookings', booking.bookingId], { replaceUrl: true })
      return
    }

    const equipmentItems = booking.items.filter((item) => item.equipmentId !== null)
    this.labId =
      booking.items.find((item) => item.labId !== null)?.labId ??
      equipments.find((equipment) => equipment.equipmentId === equipmentItems[0]?.equipmentId)
        ?.labId ??
      null
    this.selected.set(
      booking.items.map((item) => ({
        key: item.equipmentId !== null ? `equipment-${item.equipmentId}` : `lab-${item.labId}`,
        resourceType: item.equipmentId !== null ? 2 : 1,
        labId: item.labId,
        equipmentId: item.equipmentId,
        name: item.equipmentName ?? item.labName ?? 'Tài nguyên',
        note: item.note ?? '',
      })),
    )
    if (!this.applyRangeToFixedSlots(booking.startTime, booking.endTime)) {
      this.bookingDate = toDateInput(new Date(booking.startTime))
      this.toast.info(
        'Booking cũ chưa thuộc bốn slot cố định',
        'Hãy chọn lại slot trước khi lưu thay đổi.',
      )
    }
    this.purposeType =
      this.purposes.find((purpose) => purpose.key === booking.purposeType)?.value ?? 4
    this.purposeDescription = booking.purposeDescription
    this.step.set(2)
  }

  protected onLabChange(): void {
    if (this.editing()) return
    this.invalidateAvailability()
    const lab = this.labs().find((item) => item.labId === this.labId)
    this.selected.set(
      lab
        ? [
            {
              key: `lab-${lab.labId}`,
              resourceType: 1,
              labId: lab.labId,
              equipmentId: null,
              name: lab.labName,
              note: '',
            },
          ]
        : [],
    )
  }

  protected toggleEquipment(item: EquipmentResponse): void {
    if (
      this.editing() ||
      !this.hasSelectedLab() ||
      item.labId !== this.labId ||
      !isBookableEquipmentStatus(item.status)
    ) {
      return
    }

    this.selected.update((current) =>
      current.some((selected) => selected.equipmentId === item.equipmentId)
        ? current.filter((selected) => selected.equipmentId !== item.equipmentId)
        : [
            ...current,
            {
              key: `equipment-${item.equipmentId}`,
              resourceType: 2,
              labId: null,
              equipmentId: item.equipmentId,
              name: item.equipmentName,
              note: '',
            },
          ],
    )
    this.invalidateAvailability()
  }

  protected isSelected(id: number): boolean {
    return this.selected().some((item) => item.equipmentId === id)
  }

  protected updateRoomNote(note: string): void {
    this.selected.update((items) =>
      items.map((item) => (item.resourceType === 1 ? { ...item, note } : item)),
    )
  }

  protected canCreateBooking(): boolean {
    return normalizeUserStatus(this.store.user()?.status) === 'Active'
  }

  protected validTime(): boolean {
    const selectedSlots = this.selectedTimeSlots()
    return Boolean(
      this.bookingDate &&
      this.isValidConsecutiveSelection(selectedSlots) &&
      this.startTime &&
      this.endTime &&
      new Date(this.startTime) < new Date(this.endTime) &&
      new Date(this.startTime) > new Date(),
    )
  }
  protected goTo(target: number): void {
    if (target <= this.step()) this.step.set(target)
  }

  protected minimumBookingDate(): string {
    return toDateInput(new Date())
  }

  protected slotsForPeriod(period: BookingSlotPeriod): readonly FixedBookingSlot[] {
    return this.timeSlots.filter((slot) => slot.period === period)
  }

  protected isTimeSlotSelected(slotId: number): boolean {
    return this.selectedSlotIds().includes(slotId)
  }

  protected isSlotDisabled(slot: FixedBookingSlot): boolean {
    return !this.bookingDate || (!this.isTimeSlotSelected(slot.id) && this.slotStartsInPast(slot))
  }

  protected toggleTimeSlot(slot: FixedBookingSlot): void {
    if (this.isSlotDisabled(slot)) return

    const current = this.selectedSlotIds()
    if (current.includes(slot.id)) {
      this.selectedSlotIds.set(current.filter((slotId) => slotId !== slot.id))
      this.syncTimeRangeFromSelectedSlots()
      this.invalidateAvailability()
      return
    }

    const currentSlots = this.selectedTimeSlots()
    if (currentSlots.length && currentSlots.some((item) => item.period !== slot.period)) {
      this.selectedSlotIds.set([slot.id])
      this.toast.info('Chỉ chọn các slot liên tiếp trong cùng một buổi')
    } else {
      const nextIds = [...current, slot.id].sort((left, right) => left - right)
      const nextSlots = this.timeSlots.filter((item) => nextIds.includes(item.id))
      if (!this.isValidConsecutiveSelection(nextSlots)) {
        this.toast.info('Chỉ chọn các slot liên tiếp trong cùng một buổi')
        return
      }
      this.selectedSlotIds.set(nextIds)
    }

    this.syncTimeRangeFromSelectedSlots()
    this.invalidateAvailability()
  }

  protected onBookingDateChange(): void {
    this.selectedSlotIds.update((slotIds) =>
      slotIds.filter((slotId) => {
        const slot = this.timeSlots.find((item) => item.id === slotId)
        return slot ? !this.slotStartsInPast(slot) : false
      }),
    )
    this.syncTimeRangeFromSelectedSlots()
    this.invalidateAvailability()
  }

  protected hasSelectedSlotRange(): boolean {
    return Boolean(this.startTime && this.endTime && this.selectedSlotIds().length)
  }

  protected selectedSlotSummary(): string {
    const slots = this.selectedTimeSlots()
    if (!slots.length) return 'Chưa chọn slot'
    const names = slots.map((slot) => `Slot ${slot.id}`).join(' + ')
    return `${names} · ${slots[0].start}–${slots[slots.length - 1].end}`
  }

  protected checkInReminderTime(): string {
    return this.reminderTime(this.startTime)
  }

  protected checkOutReminderTime(): string {
    return this.reminderTime(this.endTime)
  }

  protected fixedSlotSuggestions(): SuggestedSlotResponse[] {
    const unique = new Map<string, SuggestedSlotResponse>()
    for (const suggestion of this.suggestions()) {
      const selection = this.slotSelectionForRange(suggestion.startTime, suggestion.endTime)
      if (!selection) continue
      const key = `${selection.date}:${selection.slotIds.join('-')}`
      if (!unique.has(key)) unique.set(key, suggestion)
    }
    return [...unique.values()]
  }

  protected suggestedSlotLabel(slot: SuggestedSlotResponse): string {
    const selection = this.slotSelectionForRange(slot.startTime, slot.endTime)
    if (!selection) return 'Khung giờ cố định'
    return selection.slotIds.map((slotId) => `Slot ${slotId}`).join(' + ')
  }

  protected availabilityIsCurrent(): boolean {
    return (
      this.available() && this.availabilityFingerprint() === this.currentAvailabilityFingerprint()
    )
  }

  protected continueToPurpose(): void {
    if (!this.availabilityIsCurrent()) {
      this.toast.info('Hãy kiểm tra lại khung giờ sau khi thay đổi tài nguyên hoặc thời gian')
      return
    }
    this.step.set(3)
  }

  protected checkAvailability(): void {
    if (!this.validTime() || !this.hasSelectedLab()) {
      this.toast.info('Hãy chọn thời gian và tài nguyên hợp lệ')
      return
    }
    this.invalidateAvailability()
    this.checking.set(true)
    const userId = this.store.user()?.userId
    forkJoin({
      events: this.api.calendar(
        toIso(this.startTime),
        toIso(this.endTime),
        this.labId ?? undefined,
      ),
      userBookings: userId ? this.api.bookingsByUser(userId) : of([] as BookingResponse[]),
    }).subscribe({
      next: ({ events, userBookings }) => {
        this.currentUserBookings.set(userBookings)
        const userConflict = this.hasCurrentUserBookingConflict(userBookings)
        // API calendar đã được gọi với labId, nên mọi event trả về đều thuộc phòng
        // đang chọn. Không lọc lại theo event.resources[].labId vì booking thiết bị
        // có thể được serialize thiếu/sai kiểu labId dù event vẫn thuộc đúng phòng.
        const blockingEvents = events.filter(
          (event) =>
            event.blocking &&
            new Date(event.startTime) < new Date(this.endTime) &&
            new Date(event.endTime) > new Date(this.startTime),
        )
        const resourceConflict = blockingEvents.length > 0
        const maintenanceConflict = blockingEvents.some((event) => {
          const eventType = String(event.eventType ?? '')
            .trim()
            .toLowerCase()
          return eventType === 'maintenance' || eventType === '2'
        })
        const approvedBookingConflict = blockingEvents.some((event) => {
          const eventType = String(event.eventType ?? '')
            .trim()
            .toLowerCase()
          return eventType === 'booking' || eventType === '1'
        })
        const blocking = userConflict || resourceConflict
        this.personalTimeConflict.set(userConflict)
        this.canJoinWaitlist.set(
          !userConflict && approvedBookingConflict && !maintenanceConflict,
        )
        this.available.set(!blocking)
        this.availabilityFingerprint.set(blocking ? null : this.currentAvailabilityFingerprint())
        this.availabilityMessage.set(
          userConflict
            ? 'Bạn đã có một booking khác trùng với khung giờ này.'
            : maintenanceConflict
              ? 'Tài nguyên đang có lịch bảo trì trong khung giờ này.'
              : approvedBookingConflict
                ? 'Khung giờ đã được đặt. Bạn có thể tham gia hàng chờ.'
                : resourceConflict
                  ? 'Khung giờ đang có sự kiện chặn tài nguyên.'
                  : 'Khung giờ hiện chưa có sự kiện chặn tài nguyên và không trùng lịch cá nhân.',
        )
        if (blocking) this.loadSuggestions()
        else this.checking.set(false)
      },
      error: () => {
        this.checking.set(false)
        this.toast.error('Không kiểm tra được lịch')
      },
    })
  }
  protected chooseSlot(slot: SuggestedSlotResponse): void {
    if (!this.applyRangeToFixedSlots(slot.startTime, slot.endTime)) {
      this.toast.info('Gợi ý này không thuộc bốn slot cố định')
      return
    }
    this.invalidateAvailability()
    this.availabilityMessage.set('Đã chọn khung giờ thay thế. Hệ thống đang kiểm tra lại.')
    this.checkAvailability()
  }
  protected priorityFor(purpose: string): number {
    return (
      this.rules().find((rule) => rule.purposeType === purpose)?.priorityLevel ??
      this.purposes.findIndex((item) => item.key === purpose) + 1
    )
  }
  protected purposeKey(): string {
    return this.purposes.find((item) => item.value === this.purposeType)?.key ?? 'Other'
  }
  protected purposeLabel(): string {
    return labelOf('purpose', this.purposeKey())
  }
  protected submit(): void {
    if (!this.canCreateBooking()) {
      this.toast.info('Tài khoản hiện không được phép tạo hoặc chỉnh sửa lịch đặt')
      return
    }
    if (!this.validTime() || !this.hasSelectedLab() || !this.purposeDescription.trim()) {
      this.toast.info('Thông tin booking chưa đầy đủ')
      return
    }
    if (!this.availabilityIsCurrent()) {
      this.step.set(2)
      this.toast.info('Khung giờ chưa được kiểm tra hoặc kết quả kiểm tra đã hết hiệu lực')
      return
    }
    if (this.hasCurrentUserBookingConflict(this.currentUserBookings())) {
      this.invalidateAvailability()
      this.step.set(2)
      this.toast.info('Bạn đã có một booking khác trùng với khung giờ này.')
      return
    }
    this.submitting.set(true)
    const commonPayload = {
      purposeType: this.purposeType,
      purposeDescription: this.purposeDescription.trim(),
      startTime: toIso(this.startTime),
      endTime: toIso(this.endTime),
    }

    if (this.editing()) {
      this.api.updateBooking(this.bookingId, commonPayload).subscribe({
        next: () => {
          this.submitting.set(false)
          this.toast.success('Đã cập nhật booking')
          void this.router.navigate(['/app/bookings', this.bookingId])
        },
        error: (error: unknown) => {
          this.submitting.set(false)
          if (error instanceof ApiError && (error as ApiError).status === 409) {
            this.handleConflict(error)
            return
          }
          this.toast.error('Không thể cập nhật booking', apiErrorMessage(error))
        },
      })
      return
    }

    this.api
      .createBooking({
        ...commonPayload,
        items: this.itemPayload(),
      })
      .subscribe({
        next: (booking) => {
          const finish = (): void => {
            this.submitting.set(false)
            this.toast.success('Đã gửi yêu cầu đặt lịch', 'Yêu cầu của bạn đang chờ quản lý duyệt.')
            void this.router.navigate(['/app/bookings', booking.bookingId])
          }
          // Backend mới tự chuyển lượt Notified tương ứng sang Booked trong cùng transaction
          // khi booking được tạo thành công. FE không gọi mark-booked lần hai để tránh cập nhật trùng.
          finish()
        },
        error: (error: unknown) => {
          this.submitting.set(false)
          if (error instanceof ApiError && (error as ApiError).status === 409) {
            this.handleConflict(error)
            return
          }
          this.toast.error('Không thể tạo booking', apiErrorMessage(error))
        },
      })
  }

  protected joinWaitlist(): void {
    const room = this.selectedRoom()
    if (!room || !this.validTime()) {
      this.toast.info('Hãy chọn phòng và khung giờ hợp lệ trước khi tham gia hàng chờ')
      return
    }
    if (this.hasJoinedCurrentWaitlist() || this.joiningWaitlist()) return
    this.joiningWaitlist.set(true)
    this.api
      .createWaitlist({
        labId: room.labId,
        equipmentId: null,
        requestedStart: toIso(this.startTime),
        requestedEnd: toIso(this.endTime),
      })
      .subscribe({
        next: (entry) => {
          this.joiningWaitlist.set(false)
          this.currentUserWaitlists.update((items) => [entry, ...items])
          this.toast.success(
            'Đã tham gia hàng chờ của phòng',
            this.selectedEquipmentCount() > 0
              ? `Vị trí hiện tại: ${entry.queuePosition}. Thiết bị không được giữ và sẽ chọn lại khi đến lượt.`
              : `Vị trí hiện tại của bạn: ${entry.queuePosition}.`,
          )
        },
        error: () => {
          this.joiningWaitlist.set(false)
          this.toast.error('Không thể tham gia hàng chờ')
        },
      })
  }

  protected hasJoinedCurrentWaitlist(): boolean {
    const room = this.selectedRoom()
    if (!room || !this.validTime()) return false
    const start = new Date(toIso(this.startTime)).getTime()
    const end = new Date(toIso(this.endTime)).getTime()
    return this.currentUserWaitlists().some((entry) => {
      const status = String(entry.status).toLowerCase()
      return (
        entry.labId === room.labId &&
        ['waiting', 'notified', 'booked', '1', '2', '3'].includes(status) &&
        new Date(entry.requestedStart).getTime() === start &&
        new Date(entry.requestedEnd).getTime() === end
      )
    })
  }
  private loadSuggestions(): void {
    this.api
      .suggestSlots({
        startTime: toIso(this.startTime),
        endTime: toIso(this.endTime),
        items: this.itemPayload(),
        maxSuggestions: 4,
        searchDays: 14,
        stepMinutes: 120,
      })
      .subscribe({
        next: (slots) => {
          this.suggestions.set(slots)
          this.checking.set(false)
        },
        error: () => {
          this.checking.set(false)
          this.suggestions.set([])
        },
      })
  }
  private handleConflict(error: ApiError): void {
    this.invalidateAvailability()
    this.step.set(2)
    this.toast.error(
      'Khung giờ vừa phát sinh xung đột',
      apiErrorMessage(error, 'Hãy kiểm tra lại và chọn một khung giờ thay thế.'),
    )
    if (this.validTime() && this.hasSelectedLab()) {
      this.checking.set(true)
      this.loadSuggestions()
    }
  }

  private selectedTimeSlots(): FixedBookingSlot[] {
    return this.timeSlots
      .filter((slot) => this.selectedSlotIds().includes(slot.id))
      .sort((left, right) => left.id - right.id)
  }

  private isValidConsecutiveSelection(slots: readonly FixedBookingSlot[]): boolean {
    if (!slots.length) return false
    const ordered = [...slots].sort((left, right) => left.id - right.id)
    const period = ordered[0].period
    return ordered.every(
      (slot, index) =>
        slot.period === period && (index === 0 || slot.id === ordered[index - 1].id + 1),
    )
  }

  private slotStartsInPast(slot: FixedBookingSlot): boolean {
    if (!this.bookingDate) return true
    return new Date(`${this.bookingDate}T${slot.start}`) <= new Date()
  }

  private syncTimeRangeFromSelectedSlots(): void {
    const slots = this.selectedTimeSlots()
    if (!this.bookingDate || !this.isValidConsecutiveSelection(slots)) {
      this.startTime = ''
      this.endTime = ''
      return
    }
    this.startTime = `${this.bookingDate}T${slots[0].start}`
    this.endTime = `${this.bookingDate}T${slots[slots.length - 1].end}`
  }

  private reminderTime(localDateTime: string): string {
    if (!localDateTime) return '—'
    const value = new Date(localDateTime)
    if (Number.isNaN(value.getTime())) return '—'
    value.setMinutes(value.getMinutes() - 15)
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(value)
  }

  private slotSelectionForRange(startValue: string, endValue: string): SlotRangeSelection | null {
    const start = new Date(startValue)
    const end = new Date(endValue)
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start.getTime() >= end.getTime()
    )
      return null
    if (toDateInput(start) !== toDateInput(end)) return null
    if (start.getSeconds() !== 0 || end.getSeconds() !== 0) return null

    const startClock = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
    const endClock = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`

    for (const period of this.slotPeriods) {
      const periodSlots = this.slotsForPeriod(period.key)
      for (let firstIndex = 0; firstIndex < periodSlots.length; firstIndex += 1) {
        for (let lastIndex = firstIndex; lastIndex < periodSlots.length; lastIndex += 1) {
          const first = periodSlots[firstIndex]
          const last = periodSlots[lastIndex]
          if (first.start === startClock && last.end === endClock) {
            return {
              date: toDateInput(start),
              slotIds: periodSlots.slice(firstIndex, lastIndex + 1).map((slot) => slot.id),
            }
          }
        }
      }
    }
    return null
  }

  private applyRangeToFixedSlots(startValue: string, endValue: string): boolean {
    const start = new Date(startValue)
    if (!Number.isNaN(start.getTime())) this.bookingDate = toDateInput(start)

    const selection = this.slotSelectionForRange(startValue, endValue)
    if (!selection) {
      this.selectedSlotIds.set([])
      this.startTime = ''
      this.endTime = ''
      return false
    }

    this.bookingDate = selection.date
    this.selectedSlotIds.set(selection.slotIds)
    this.syncTimeRangeFromSelectedSlots()
    return true
  }

  private hasCurrentUserBookingConflict(bookings: readonly BookingResponse[]): boolean {
    if (!this.startTime || !this.endTime) return false
    const start = new Date(this.startTime)
    const end = new Date(this.endTime)
    return bookings.some((booking) => {
      if (booking.bookingId === this.bookingId) return false
      const status = String(booking.status ?? '')
        .trim()
        .toLowerCase()
      const blocksUser =
        status === 'pending' || status === 'approved' || status === '1' || status === '2'
      return blocksUser && new Date(booking.startTime) < end && new Date(booking.endTime) > start
    })
  }

  private invalidateAvailability(): void {
    this.available.set(false)
    this.personalTimeConflict.set(false)
    this.canJoinWaitlist.set(false)
    this.availabilityFingerprint.set(null)
    this.availabilityMessage.set('')
    this.suggestions.set([])
  }

  private currentAvailabilityFingerprint(): string {
    const resources = this.selected()
      .map((item) => `${item.resourceType}:${item.labId ?? 0}:${item.equipmentId ?? 0}`)
      .sort()
      .join('|')
    return [this.labId ?? 0, resources, this.startTime, this.endTime].join('::')
  }

  private itemPayload(): BookingItemRequest[] {
    return this.selected().map((item) => ({
      resourceType: item.resourceType,
      labId: item.labId,
      equipmentId: item.equipmentId,
      note: item.note || null,
    }))
  }
}
