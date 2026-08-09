import { NgClass } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { forkJoin } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import type { EquipmentResponse, LabRoomResponse } from '../../core/api/system.models'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { ToastService } from '../../shared/ui/toast.service'
import { toDateInput, toIso, toLocalDateTimeInput } from '../../shared/utils/presentation'

type MaintenanceTimeMode = 'slots' | 'custom'
type MaintenanceSlotPeriod = 'morning' | 'afternoon'

interface MaintenanceSlot {
  id: number
  start: string
  end: string
  period: MaintenanceSlotPeriod
}

interface ResolvedSchedule {
  startTime: string
  endTime: string
  recurrenceType: number
  recurrenceInterval: number
  recurrenceEndDate: string | null
}

@Component({
  selector: 'app-maintenance-form-page',
  imports: [NgClass, FormsModule, RouterLink, PageHeaderComponent, IconComponent],
  template: `<section class="space-y-6">
    <app-page-header
      [title]="editing() ? 'Chỉnh sửa lịch bảo trì' : 'Tạo lịch bảo trì'"
      subtitle="Bảo trì có kế hoạch có thể chọn theo slot; trường hợp khẩn cấp có thể bắt đầu ngay."
      ><a routerLink="/app/management/maintenances" class="btn-secondary"
        ><app-icon name="arrow-left" [size]="17" /> Quay lại</a
      ></app-page-header
    >

    <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
      <form class="card-surface p-5 sm:p-7" (ngSubmit)="submit()">
        <div class="flex items-start gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
          >
            <app-icon name="wrench" [size]="22" />
          </div>
          <div>
            <h2 class="text-xl font-black text-slate-950">Tài nguyên & thời gian</h2>
            <p class="mt-1 text-sm text-slate-500">
              Backend sẽ kiểm tra booking Approved, lịch bảo trì khác và lượt sử dụng đang mở trước khi lưu.
            </p>
          </div>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            class="rounded-[22px] border p-4 text-left"
            [ngClass]="
              resourceType === 'lab' ? 'border-violet-300 bg-violet-50' : 'border-slate-200'
            "
            (click)="setType('lab')"
          >
            <p class="font-black text-slate-900">Bảo trì phòng lab</p>
            <p class="mt-1 text-xs text-slate-500">Khóa toàn bộ phòng trong thời gian thực hiện</p>
          </button>
          <button
            type="button"
            class="rounded-[22px] border p-4 text-left"
            [ngClass]="
              resourceType === 'equipment' ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200'
            "
            (click)="setType('equipment')"
          >
            <p class="font-black text-slate-900">Bảo trì thiết bị</p>
            <p class="mt-1 text-xs text-slate-500">Chỉ khóa thiết bị được chọn</p>
          </button>
        </div>

        @if (resourceType === 'lab') {
          <div class="mt-5">
            <label class="field-label">Phòng lab *</label>
            <select class="input-shell" required [(ngModel)]="labId" name="labId">
              <option [ngValue]="null">Chọn phòng lab</option>
              @for (lab of labs(); track lab.labId) {
                <option [ngValue]="lab.labId">{{ lab.labName }} · {{ lab.roomCode }}</option>
              }
            </select>
          </div>
        } @else {
          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="field-label">Phòng chứa thiết bị</label>
              <select
                class="input-shell"
                [(ngModel)]="equipmentLabId"
                name="equipmentLabId"
                (ngModelChange)="equipmentId = null"
              >
                <option [ngValue]="null">Tất cả phòng</option>
                @for (lab of labs(); track lab.labId) {
                  <option [ngValue]="lab.labId">{{ lab.labName }}</option>
                }
              </select>
            </div>
            <div>
              <label class="field-label">Thiết bị *</label>
              <select class="input-shell" required [(ngModel)]="equipmentId" name="equipmentId">
                <option [ngValue]="null">Chọn thiết bị</option>
                @for (eq of equipmentOptions(); track eq.equipmentId) {
                  <option [ngValue]="eq.equipmentId">{{ eq.equipmentName }}</option>
                }
              </select>
            </div>
          </div>
        }

        @if (!editing()) {
          <div class="mt-6 rounded-[22px] border border-rose-200 bg-rose-50 p-4">
            <label class="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                class="mt-1 h-4 w-4 accent-rose-600"
                [(ngModel)]="startImmediately"
                name="startImmediately"
                (ngModelChange)="onEmergencyChange()"
              />
              <span>
                <strong class="text-sm text-rose-900">Bảo trì khẩn cấp — bắt đầu ngay</strong>
                <span class="mt-1 block text-xs leading-5 text-rose-800/75">
                  Tài nguyên chuyển sang Maintenance ngay sau khi tạo. Không dùng lặp định kỳ và backend sẽ chặn nếu còn lượt sử dụng chưa checkout.
                </span>
              </span>
            </label>
          </div>
        }

        @if (!startImmediately) {
          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="rounded-2xl border p-4 text-left"
              [ngClass]="timeMode === 'slots' ? 'border-violet-300 bg-violet-50' : 'border-slate-200'"
              (click)="setTimeMode('slots')"
              [disabled]="editing()"
            >
              <p class="font-black text-slate-900">Theo slot cố định</p>
              <p class="mt-1 text-xs text-slate-500">07–09, 09–11, 13–15, 15–17; hỗ trợ nhiều ngày.</p>
            </button>
            <button
              type="button"
              class="rounded-2xl border p-4 text-left"
              [ngClass]="timeMode === 'custom' ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200'"
              (click)="setTimeMode('custom')"
            >
              <p class="font-black text-slate-900">Thời gian tùy chỉnh</p>
              <p class="mt-1 text-xs text-slate-500">Dùng cho khoảng liên tục hoặc lịch tuần/tháng.</p>
            </button>
          </div>
        }

        @if (startImmediately) {
          <div class="mt-5">
            <label class="field-label">Thời gian kết thúc dự kiến *</label>
            <input
              class="input-shell"
              type="datetime-local"
              required
              [min]="minimumDateTime()"
              [(ngModel)]="endTime"
              name="emergencyEndTime"
            />
            <p class="mt-2 text-xs text-slate-500">
              Đây chỉ là thời gian dự kiến. Đến giờ hệ thống sẽ nhắc, nhưng không tự Complete; LabManager/Admin phải xác nhận hoàn thành.
            </p>
          </div>
        } @else if (timeMode === 'slots') {
          <div class="mt-5 rounded-[22px] border border-slate-200 p-5">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="field-label">Từ ngày *</label>
                <input
                  class="input-shell"
                  type="date"
                  required
                  [min]="minimumDate()"
                  [(ngModel)]="slotStartDate"
                  name="slotStartDate"
                  (ngModelChange)="normalizeSlotEndDate()"
                />
              </div>
              <div>
                <label class="field-label">Đến ngày *</label>
                <input
                  class="input-shell"
                  type="date"
                  required
                  [min]="slotStartDate || minimumDate()"
                  [(ngModel)]="slotEndDate"
                  name="slotEndDate"
                />
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-black text-slate-900">Chọn slot mỗi ngày</p>
                <p class="mt-1 text-xs text-slate-500">Có thể chọn 1–2 slot liên tiếp trong cùng một buổi.</p>
              </div>
              <button
                type="button"
                class="rounded-xl border px-3 py-2 text-xs font-black"
                [ngClass]="allDay ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600'"
                (click)="toggleAllDay()"
              >
                Cả ngày 07:00–17:00
              </button>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              @for (slot of maintenanceSlots; track slot.id) {
                <button
                  type="button"
                  class="rounded-2xl border p-4 text-left transition"
                  [ngClass]="slotSelected(slot.id) && !allDay ? 'border-violet-400 bg-violet-600 text-white shadow-md shadow-violet-100' : allDay ? 'border-violet-200 bg-violet-50 text-violet-900' : 'border-slate-200 bg-white text-slate-900'"
                  (click)="toggleSlot(slot)"
                  [disabled]="allDay"
                >
                  <p class="text-[10px] font-black tracking-[.14em] uppercase">Slot {{ slot.id }}</p>
                  <p class="mt-2 font-black">{{ slot.start }}–{{ slot.end }}</p>
                </button>
              }
            </div>

            <div class="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <strong class="text-slate-900">{{ slotScheduleSummary() }}</strong>
              @if (isMultiDaySlotSchedule()) {
                <p class="mt-1 text-xs text-slate-500">
                  Backend lưu chuỗi Daily để chỉ khóa đúng khoảng slot của từng ngày, không khóa liên tục qua đêm.
                </p>
              }
            </div>
          </div>
        } @else {
          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="field-label">Bắt đầu *</label>
              <input
                class="input-shell"
                type="datetime-local"
                required
                [min]="minimumDateTime()"
                [(ngModel)]="startTime"
                name="startTime"
              />
            </div>
            <div>
              <label class="field-label">Kết thúc *</label>
              <input
                class="input-shell"
                type="datetime-local"
                required
                [min]="startTime || minimumDateTime()"
                [(ngModel)]="endTime"
                name="endTime"
              />
            </div>
            <div>
              <label class="field-label">Loại lặp</label>
              <select class="input-shell" [(ngModel)]="recurrenceType" name="recurrenceType">
                <option [ngValue]="0">Không lặp</option>
                <option [ngValue]="1">Hằng ngày</option>
                <option [ngValue]="2">Hằng tuần</option>
                <option [ngValue]="3">Hằng tháng</option>
              </select>
            </div>
            @if (recurrenceType !== 0) {
              <div>
                <label class="field-label">Khoảng lặp</label>
                <input
                  class="input-shell"
                  type="number"
                  min="1"
                  [(ngModel)]="recurrenceInterval"
                  name="recurrenceInterval"
                />
              </div>
              <div class="sm:col-span-2">
                <label class="field-label">Ngày kết thúc chuỗi</label>
                <input
                  class="input-shell"
                  type="datetime-local"
                  [min]="endTime"
                  [(ngModel)]="recurrenceEndDate"
                  name="recurrenceEndDate"
                />
              </div>
            }
          </div>
        }

        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label class="field-label">Chi phí bảo trì</label>
            <input class="input-shell" type="number" min="0" [(ngModel)]="cost" name="cost" />
          </div>
        </div>

        <div class="mt-5">
          <label class="field-label">Ghi chú</label>
          <textarea
            class="textarea-shell"
            [(ngModel)]="notes"
            name="notes"
            placeholder="Nội dung bảo trì, đơn vị thực hiện, linh kiện thay thế..."
          ></textarea>
        </div>

        <div class="mt-7 flex justify-end gap-2">
          <a routerLink="/app/management/maintenances" class="btn-secondary">Hủy</a>
          <button type="submit" class="btn-primary" [disabled]="saving() || !isFormValid()">
            <app-icon name="save" [size]="17" />
            {{ saving() ? 'Đang lưu...' : editing() ? 'Lưu thay đổi' : startImmediately ? 'Bắt đầu bảo trì ngay' : 'Tạo lịch bảo trì' }}
          </button>
        </div>
      </form>

      <aside class="space-y-5">
        <article class="card-surface p-5">
          <p class="text-[10px] font-black tracking-[.16em] text-violet-500 uppercase">
            Luồng tự động
          </p>
          <div class="mt-4 space-y-3">
            @for (rule of rules; track rule) {
              <div class="flex gap-3 text-sm text-slate-600">
                <span class="mt-0.5 text-emerald-500"><app-icon name="check" [size]="16" /></span>
                <span>{{ rule }}</span>
              </div>
            }
          </div>
        </article>
        <article class="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
          <p class="font-black text-amber-900">Tác động tài nguyên</p>
          <p class="mt-2 text-sm leading-6 text-amber-800/75">
            Lịch thường tự chuyển sang InProgress đúng StartTime. Đến EndTime hệ thống chỉ cảnh báo; tài nguyên vẫn Maintenance cho tới khi người quản lý xác nhận Complete.
          </p>
        </article>
      </aside>
    </div>
  </section>`,
})
export class MaintenanceFormPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly toast = inject(ToastService)

  protected readonly labs = signal<LabRoomResponse[]>([])
  protected readonly equipments = signal<EquipmentResponse[]>([])
  protected readonly saving = signal(false)
  protected readonly editing = signal(false)
  protected readonly selectedSlotIds = signal<number[]>([1])

  protected resourceType: 'lab' | 'equipment' = 'lab'
  protected labId: number | null = null
  protected equipmentLabId: number | null = null
  protected equipmentId: number | null = null

  protected timeMode: MaintenanceTimeMode = 'slots'
  protected startImmediately = false
  protected allDay = false
  protected slotStartDate = toDateInput(new Date(Date.now() + 24 * 60 * 60_000))
  protected slotEndDate = this.slotStartDate
  protected startTime = toLocalDateTimeInput(new Date(Date.now() + 24 * 60 * 60_000))
  protected endTime = toLocalDateTimeInput(new Date(Date.now() + 26 * 60 * 60_000))

  protected cost = 0
  protected notes = ''
  protected recurrenceType = 0
  protected recurrenceInterval = 1
  protected recurrenceEndDate = ''
  private id = 0

  protected readonly maintenanceSlots: readonly MaintenanceSlot[] = [
    { id: 1, start: '07:00', end: '09:00', period: 'morning' },
    { id: 2, start: '09:00', end: '11:00', period: 'morning' },
    { id: 3, start: '13:00', end: '15:00', period: 'afternoon' },
    { id: 4, start: '15:00', end: '17:00', period: 'afternoon' },
  ]

  protected readonly rules = [
    'Trước 15 phút: LabManager nhận notification + email; Admin nhận notification.',
    'Đến StartTime: backend tự Start và chuyển tài nguyên sang Maintenance.',
    'Đến EndTime: không tự Complete; hệ thống cảnh báo để người quản lý xác nhận.',
    'Admin và LabManager đều có thể quản lý maintenance theo phạm vi backend cho phép.',
  ]

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'))
    this.editing.set(Boolean(this.id))
    if (this.editing()) this.timeMode = 'custom'

    forkJoin({ labs: this.api.labs(), equipments: this.api.equipments() }).subscribe(
      ({ labs, equipments }) => {
        this.labs.set(labs)
        this.equipments.set(equipments)

        if (!this.id) {
          const query = this.route.snapshot.queryParamMap
          const labId = Number(query.get('labId'))
          const equipmentId = Number(query.get('equipmentId'))
          if (equipmentId > 0) {
            this.resourceType = 'equipment'
            this.equipmentId = equipmentId
            this.equipmentLabId =
              equipments.find((item) => item.equipmentId === equipmentId)?.labId ?? null
          } else if (labId > 0) {
            this.resourceType = 'lab'
            this.labId = labId
          }
          return
        }

        this.api.maintenance(this.id).subscribe({
          next: (item) => {
            this.resourceType = item.labId ? 'lab' : 'equipment'
            this.labId = item.labId
            this.equipmentId = item.equipmentId
            this.equipmentLabId =
              equipments.find((equipment) => equipment.equipmentId === item.equipmentId)?.labId ??
              null
            this.startTime = toLocalDateTimeInput(item.startTime)
            this.endTime = toLocalDateTimeInput(item.endTime)
            this.cost = item.maintenanceCost
            this.notes = item.notes ?? ''
            this.recurrenceType = ['None', 'Daily', 'Weekly', 'Monthly'].indexOf(
              item.recurrenceType,
            )
            this.recurrenceInterval = item.recurrenceInterval
            this.recurrenceEndDate = item.recurrenceEndDate
              ? toLocalDateTimeInput(item.recurrenceEndDate)
              : ''
          },
          error: () => this.toast.error('Không tải được lịch bảo trì'),
        })
      },
    )
  }

  protected equipmentOptions(): EquipmentResponse[] {
    return this.equipmentLabId
      ? this.equipments().filter((item) => item.labId === this.equipmentLabId)
      : this.equipments()
  }

  protected setType(type: 'lab' | 'equipment'): void {
    this.resourceType = type
    if (type === 'lab') {
      this.equipmentId = null
      this.equipmentLabId = null
    } else {
      this.labId = null
    }
  }

  protected setTimeMode(mode: MaintenanceTimeMode): void {
    if (this.editing() && mode === 'slots') return
    this.timeMode = mode
  }

  protected onEmergencyChange(): void {
    if (!this.startImmediately) return
    this.timeMode = 'custom'
    this.recurrenceType = 0
    this.recurrenceInterval = 1
    this.recurrenceEndDate = ''
    this.endTime = toLocalDateTimeInput(new Date(Date.now() + 2 * 60 * 60_000))
  }

  protected minimumDate(): string {
    return toDateInput(new Date())
  }

  protected minimumDateTime(): string {
    return toLocalDateTimeInput(new Date())
  }

  protected normalizeSlotEndDate(): void {
    if (!this.slotEndDate || this.slotEndDate < this.slotStartDate) {
      this.slotEndDate = this.slotStartDate
    }
  }

  protected slotSelected(slotId: number): boolean {
    return this.selectedSlotIds().includes(slotId)
  }

  protected toggleAllDay(): void {
    this.allDay = !this.allDay
    this.selectedSlotIds.set(this.allDay ? this.maintenanceSlots.map((slot) => slot.id) : [1])
  }

  protected toggleSlot(slot: MaintenanceSlot): void {
    if (this.allDay) return
    const current = this.selectedSlotIds()
    if (current.includes(slot.id)) {
      this.selectedSlotIds.set(current.filter((id) => id !== slot.id))
      return
    }

    const currentSlots = this.maintenanceSlots.filter((item) => current.includes(item.id))
    if (currentSlots.length && currentSlots[0].period !== slot.period) {
      this.selectedSlotIds.set([slot.id])
      return
    }

    this.selectedSlotIds.set([...current, slot.id].sort((a, b) => a - b))
  }

  protected isMultiDaySlotSchedule(): boolean {
    return this.timeMode === 'slots' && Boolean(this.slotStartDate && this.slotEndDate) && this.slotEndDate > this.slotStartDate
  }

  protected slotScheduleSummary(): string {
    const schedule = this.resolveSlotSchedule()
    if (!schedule) return 'Chưa chọn lịch slot hợp lệ.'
    const time = this.allDay
      ? '07:00–17:00'
      : this.selectedSlots()
          .map((slot) => `Slot ${slot.id}`)
          .join(' + ')
    return this.isMultiDaySlotSchedule()
      ? `${time}, lặp hằng ngày từ ${this.slotStartDate} đến ${this.slotEndDate}.`
      : `${time} ngày ${this.slotStartDate}.`
  }

  protected isFormValid(): boolean {
    const resourceValid =
      (this.resourceType === 'lab' && Boolean(this.labId)) ||
      (this.resourceType === 'equipment' && Boolean(this.equipmentId))
    const costValid = Number.isFinite(Number(this.cost)) && Number(this.cost) >= 0
    if (!resourceValid || !costValid) return false

    if (this.startImmediately) {
      const end = +new Date(this.endTime)
      return !this.editing() && Number.isFinite(end) && end > Date.now()
    }

    if (this.timeMode === 'slots') return this.resolveSlotSchedule() !== null

    const start = +new Date(this.startTime)
    const end = +new Date(this.endTime)
    const timeValid =
      Number.isFinite(start) && Number.isFinite(end) && start < end && start > Date.now()
    const recurrenceValid =
      this.recurrenceType === 0 ||
      (Number.isInteger(Number(this.recurrenceInterval)) &&
        Number(this.recurrenceInterval) > 0 &&
        Boolean(this.recurrenceEndDate) &&
        +new Date(this.recurrenceEndDate) > end)
    return timeValid && recurrenceValid
  }

  protected submit(): void {
    if (!this.isFormValid()) {
      this.toast.info(
        'Thông tin bảo trì chưa hợp lệ',
        'Kiểm tra tài nguyên, thời gian/slot, chi phí và cấu hình lặp.',
      )
      return
    }

    const schedule = this.resolveSchedule()
    if (!schedule) {
      this.toast.info('Không xác định được thời gian bảo trì')
      return
    }

    const payload = {
      labId: this.resourceType === 'lab' ? this.labId : null,
      equipmentId: this.resourceType === 'equipment' ? this.equipmentId : null,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      maintenanceCost: Number(this.cost),
      notes: this.notes.trim() || null,
      recurrenceType: schedule.recurrenceType,
      recurrenceInterval: schedule.recurrenceInterval,
      recurrenceEndDate: schedule.recurrenceEndDate,
    }

    const completed = (maintenanceId: number): void => {
      this.saving.set(false)
      this.toast.success(
        this.editing()
          ? 'Đã cập nhật lịch bảo trì'
          : this.startImmediately
            ? 'Đã bắt đầu bảo trì khẩn cấp'
            : 'Đã tạo lịch bảo trì',
      )
      void this.router.navigate(['/app/management/maintenances', maintenanceId])
    }

    const failed = (): void => {
      this.saving.set(false)
      this.toast.error('Không thể lưu lịch bảo trì', 'Kiểm tra xung đột và phạm vi quyền quản lý.')
    }

    this.saving.set(true)
    if (this.editing()) {
      this.api
        .updateMaintenance(this.id, payload)
        .subscribe({ next: () => completed(this.id), error: failed })
      return
    }

    this.api
      .createMaintenance({ ...payload, startImmediately: this.startImmediately })
      .subscribe({ next: (result) => completed(result.maintenanceId), error: failed })
  }

  private selectedSlots(): MaintenanceSlot[] {
    return this.maintenanceSlots
      .filter((slot) => this.selectedSlotIds().includes(slot.id))
      .sort((a, b) => a.id - b.id)
  }

  private resolveSlotSchedule(): ResolvedSchedule | null {
    if (!this.slotStartDate || !this.slotEndDate || this.slotEndDate < this.slotStartDate) return null

    let startClock = '07:00'
    let endClock = '17:00'

    if (!this.allDay) {
      const slots = this.selectedSlots()
      if (!slots.length) return null
      const period = slots[0].period
      if (slots.some((slot) => slot.period !== period)) return null
      if (slots.some((slot, index) => index > 0 && slot.id !== slots[index - 1].id + 1)) return null
      startClock = slots[0].start
      endClock = slots[slots.length - 1].end
    }

    const firstStartLocal = `${this.slotStartDate}T${startClock}`
    const firstEndLocal = `${this.slotStartDate}T${endClock}`
    const firstStart = +new Date(firstStartLocal)
    const firstEnd = +new Date(firstEndLocal)
    if (!Number.isFinite(firstStart) || !Number.isFinite(firstEnd) || firstStart <= Date.now() || firstStart >= firstEnd) {
      return null
    }

    const multiDay = this.slotEndDate > this.slotStartDate
    return {
      startTime: toIso(firstStartLocal),
      endTime: toIso(firstEndLocal),
      recurrenceType: multiDay ? 1 : 0,
      recurrenceInterval: 1,
      recurrenceEndDate: multiDay ? toIso(`${this.slotEndDate}T${endClock}`) : null,
    }
  }

  private resolveSchedule(): ResolvedSchedule | null {
    if (this.startImmediately) {
      const end = +new Date(this.endTime)
      if (!Number.isFinite(end) || end <= Date.now()) return null
      return {
        startTime: toIso(toLocalDateTimeInput(new Date())),
        endTime: toIso(this.endTime),
        recurrenceType: 0,
        recurrenceInterval: 1,
        recurrenceEndDate: null,
      }
    }

    if (this.timeMode === 'slots') return this.resolveSlotSchedule()

    const start = +new Date(this.startTime)
    const end = +new Date(this.endTime)
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return null
    return {
      startTime: toIso(this.startTime),
      endTime: toIso(this.endTime),
      recurrenceType: this.recurrenceType,
      recurrenceInterval: this.recurrenceType === 0 ? 1 : Number(this.recurrenceInterval),
      recurrenceEndDate:
        this.recurrenceType === 0 || !this.recurrenceEndDate
          ? null
          : toIso(this.recurrenceEndDate),
    }
  }
}
