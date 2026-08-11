import { DatePipe, NgClass, NgTemplateOutlet } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { catchError, forkJoin, of } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import type {
  CalendarEventResponse,
  EquipmentResponse,
  LabRoomResponse,
} from '../../core/api/system.models'
import { AuthStore } from '../../core/auth/auth.store'
import { LanguageService } from '../../core/i18n/language.service'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'
import {
  isAvailableEquipmentStatus,
  isAvailableLabStatus,
  labelOf,
  toDateInput,
} from '../../shared/utils/presentation'

type CalendarView = 'day' | 'week' | 'month' | 'list'

interface CalendarDay {
  date: Date
  inMonth: boolean
  events: CalendarEventResponse[]
}

@Component({
  selector: 'app-calendar-page',
  imports: [
    DatePipe,
    NgClass,
    NgTemplateOutlet,
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    IconComponent,
    StatusBadgeComponent,
    DataStateComponent,
  ],
  template: `
    <section class="space-y-6">
      <app-page-header
        title="Lịch tài nguyên dùng chung"
        subtitle="Theo dõi lịch đặt và bảo trì theo ngày, tuần, tháng hoặc dạng danh sách."
      >
        @if (store.isRequester()) {
          <a
            routerLink="/app/bookings/new"
            [queryParams]="{ labId: labId, equipmentId: equipmentId }"
            class="btn-primary"
            ><app-icon name="plus" [size]="17" /> Tạo lịch đặt</a
          >
        }
        @if (store.isManager()) {
          <a
            routerLink="/app/management/maintenances/new"
            [queryParams]="{ labId: labId, equipmentId: equipmentId }"
            class="btn-secondary"
            ><app-icon name="wrench" [size]="17" /> Lên lịch bảo trì</a
          >
        }
      </app-page-header>

      <div class="filter-bar lg:grid-cols-[1fr_1fr_1fr_auto]">
        <div>
          <label class="field-label">Phòng thí nghiệm</label
          ><select class="input-shell" [(ngModel)]="labId" (ngModelChange)="onLabChange()">
            <option [ngValue]="null">Tất cả phòng</option>
            @for (lab of labs(); track lab.labId) {
              <option [ngValue]="lab.labId">{{ lab.labName }} · {{ lab.roomCode }}</option>
            }
          </select>
        </div>
        <div>
          <label class="field-label">Thiết bị</label
          ><select
            class="input-shell"
            [(ngModel)]="equipmentId"
            (ngModelChange)="onEquipmentChange()"
          >
            <option [ngValue]="null">Tất cả thiết bị</option>
            @for (item of filteredEquipments(); track item.equipmentId) {
              <option [ngValue]="item.equipmentId">{{ item.equipmentName }}</option>
            }
          </select>
        </div>
        <div>
          <label class="field-label">Loại sự kiện</label>
          <select class="input-shell" [(ngModel)]="eventType">
            <option value="">Lịch đặt và bảo trì</option>
            <option value="Booking">Lịch đặt</option>
            <option value="Maintenance">Không khả dụng</option>
          </select>
        </div>
        <div class="flex items-end gap-2">
          <button class="btn-secondary" type="button" (click)="shift(-1)">
            <app-icon name="chevron-left" [size]="17" /></button
          ><button class="btn-secondary" type="button" (click)="today()">Hôm nay</button
          ><button class="btn-secondary" type="button" (click)="shift(1)">
            <app-icon name="chevron-right" [size]="17" />
          </button>
        </div>
      </div>

      <article class="card-surface overflow-hidden">
        <header
          class="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div>
            <p class="text-xs font-bold tracking-[.18em] text-violet-500 uppercase">
              {{ periodTitle() }}
            </p>
            <h2 class="mt-1 text-xl font-black text-slate-950">
              {{ filteredEvents().length }} sự kiện trong kỳ
            </h2>
          </div>
          <div class="inline-flex flex-wrap rounded-2xl bg-slate-100 p-1">
            @for (option of viewOptions; track option.value) {
              <button
                type="button"
                class="rounded-xl px-4 py-2 text-xs font-extrabold"
                [ngClass]="
                  view() === option.value ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'
                "
                (click)="setView(option.value)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </header>

        @if (loading()) {
          <div class="grid grid-cols-7 gap-px bg-slate-100 p-px">
            @for (i of skeletons; track i) {
              <div class="h-32 bg-white p-3">
                <div class="skeleton h-4 w-8 rounded"></div>
                <div class="skeleton mt-5 h-8 rounded-xl"></div>
              </div>
            }
          </div>
        } @else if (view() === 'month') {
          <div class="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            @for (day of weekdayLabels(); track day) {
              <div
                class="px-2 py-3 text-center text-[10px] font-black tracking-[.14em] text-slate-400 uppercase"
              >
                {{ day }}
              </div>
            }
          </div>
          <div class="grid grid-cols-7 gap-px bg-slate-100">
            @for (day of calendarDays(); track day.date.toISOString()) {
              <div
                class="min-h-32 bg-white p-2 transition hover:bg-violet-50/30"
                [class.opacity-45]="!day.inMonth"
              >
                <div class="flex items-center justify-between">
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black"
                    [ngClass]="isToday(day.date) ? 'bg-violet-600 text-white' : 'text-slate-600'"
                    (click)="openDay(day.date)"
                  >
                    {{ day.date.getDate() }}</button
                  ><span class="text-[10px] font-bold text-slate-300">{{
                    day.events.length || ''
                  }}</span>
                </div>
                <div class="mt-2 space-y-1.5">
                  @for (event of day.events.slice(0, 3); track eventKey(event)) {
                    <button
                      type="button"
                      class="block w-full truncate rounded-lg border px-2 py-1.5 text-left text-[10px] font-bold"
                      [ngClass]="eventClass(event)"
                      (click)="openEvent(event)"
                    >
                      {{ event.startTime | date: 'HH:mm' }} · {{ event.title }}
                    </button>
                  }
                  @if (day.events.length > 3) {
                    <p class="px-1 text-[10px] font-bold text-slate-400">
                      +{{ day.events.length - 3 }} sự kiện khác
                    </p>
                  }
                </div>
              </div>
            }
          </div>
        } @else if (view() === 'week') {
          <div class="grid gap-px bg-slate-100 md:grid-cols-7">
            @for (day of weekDays(); track day.date.toISOString()) {
              <section class="min-h-72 bg-white p-3">
                <button
                  type="button"
                  class="w-full rounded-2xl p-2 text-left"
                  [ngClass]="isToday(day.date) ? 'bg-violet-50 text-violet-700' : 'text-slate-700'"
                  (click)="openDay(day.date)"
                >
                  <p class="text-[10px] font-black tracking-[.12em] uppercase">
                    {{ day.date | date: 'EEE' }}
                  </p>
                  <p class="mt-1 text-xl font-black">{{ day.date | date: 'dd' }}</p>
                </button>
                <div class="mt-3 space-y-2">
                  @for (event of day.events; track eventKey(event)) {
                    <button
                      type="button"
                      class="block w-full rounded-xl border px-3 py-2 text-left text-xs font-bold"
                      [ngClass]="eventClass(event)"
                      (click)="openEvent(event)"
                    >
                      <span class="block">{{ event.startTime | date: 'HH:mm' }}</span>
                      <span class="mt-1 block truncate">{{ event.title }}</span>
                    </button>
                  } @empty {
                    <p class="px-2 py-3 text-xs text-slate-400">Không có sự kiện</p>
                  }
                </div>
              </section>
            }
          </div>
        } @else if (view() === 'day') {
          <div class="p-5 sm:p-6">
            <div class="rounded-2xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-black tracking-[.12em] text-slate-400 uppercase">
                {{ focus() | date: 'EEEE' }}
              </p>
              <p class="mt-1 text-xl font-black text-slate-900">
                {{ focus() | date: 'dd/MM/yyyy' }}
              </p>
            </div>
            @if (dayEvents().length === 0) {
              <app-data-state
                title="Không có sự kiện"
                message="Ngày này chưa có lịch đặt hoặc bảo trì."
                icon="calendar"
              />
            } @else {
              <div class="mt-4 divide-y divide-slate-100">
                @for (event of dayEvents(); track eventKey(event)) {
                  <ng-container
                    [ngTemplateOutlet]="eventRow"
                    [ngTemplateOutletContext]="{ $implicit: event }"
                  />
                }
              </div>
            }
          </div>
        } @else if (filteredEvents().length === 0) {
          <div class="p-6">
            <app-data-state
              title="Không có sự kiện"
              message="Hãy đổi khoảng thời gian hoặc bộ lọc để xem lịch tài nguyên."
              icon="calendar"
            />
          </div>
        } @else {
          <div class="divide-y divide-slate-100">
            @for (event of filteredEvents(); track eventKey(event)) {
              <ng-container
                [ngTemplateOutlet]="eventRow"
                [ngTemplateOutletContext]="{ $implicit: event }"
              />
            }
          </div>
        }
      </article>

      <ng-template #eventRow let-event>
        <button
          type="button"
          class="flex w-full flex-col gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:px-6"
          (click)="openEvent(event)"
        >
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            [ngClass]="
              event.eventType === 'Maintenance'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-indigo-50 text-indigo-600'
            "
          >
            <app-icon
              [name]="event.eventType === 'Maintenance' ? 'wrench' : 'calendar'"
              [size]="21"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-black text-slate-900">{{ event.title }}</p>
              <app-status-badge
                [value]="event.status"
                [domain]="event.eventType === 'Maintenance' ? 'maintenance' : 'booking'"
              />
            </div>
            <p class="mt-1 text-sm text-slate-500">
              {{ event.startTime | date: 'HH:mm dd/MM/yyyy' }} –
              {{ event.endTime | date: 'HH:mm dd/MM/yyyy' }}
            </p>
            <p class="mt-2 truncate text-xs text-slate-400">{{ resourceText(event) }}</p>
          </div>
          <span class="text-slate-300"><app-icon name="arrow-right" [size]="19" /></span>
        </button>
      </ng-template>
    </section>
  `,
})
export class CalendarPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly toast = inject(ToastService)
  private readonly language = inject(LanguageService)
  protected readonly store = inject(AuthStore)
  protected readonly labs = signal<LabRoomResponse[]>([])
  protected readonly equipments = signal<EquipmentResponse[]>([])
  protected readonly events = signal<CalendarEventResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly view = signal<CalendarView>('month')
  protected readonly focus = signal(new Date())
  protected labId: number | null = null
  protected equipmentId: number | null = null
  protected eventType = ''
  protected readonly viewOptions: readonly { value: CalendarView; label: string }[] = [
    { value: 'day', label: 'Ngày' },
    { value: 'week', label: 'Tuần' },
    { value: 'month', label: 'Tháng' },
    { value: 'list', label: 'Danh sách' },
  ]
  protected readonly skeletons = Array.from({ length: 35 }, (_, index) => index)

  protected readonly weekdayLabels = computed(() => {
    const locale = this.language.locale() === 'en' ? 'en-US' : 'vi-VN'
    const monday = startOfWeek(new Date(2026, 0, 5))
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(monday, index)
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)
    })
  })

  protected readonly periodTitle = computed(() => {
    const locale = this.language.locale() === 'en' ? 'en-US' : 'vi-VN'
    const focus = this.focus()
    if (this.view() === 'day') {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(focus)
    }
    if (this.view() === 'week') {
      const start = startOfWeek(focus)
      const end = addDays(start, 6)
      return `${formatDate(start, locale)} – ${formatDate(end, locale)}`
    }
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(focus)
  })

  protected filteredEquipments(): EquipmentResponse[] {
    return this.labId
      ? this.equipments().filter((item) => item.labId === this.labId)
      : this.equipments()
  }

  protected filteredEvents(): CalendarEventResponse[] {
    return this.events()
      .filter((event) => !this.eventType || event.eventType === this.eventType)
      .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
  }

  protected readonly calendarDays = computed<CalendarDay[]>(() => {
    const focus = this.focus()
    const first = new Date(focus.getFullYear(), focus.getMonth(), 1)
    const start = startOfWeek(first)
    return Array.from({ length: 42 }, (_, index) => {
      const date = addDays(start, index)
      return {
        date,
        inMonth: date.getMonth() === focus.getMonth(),
        events: this.eventsForDate(date),
      }
    })
  })

  protected readonly weekDays = computed<CalendarDay[]>(() => {
    const start = startOfWeek(this.focus())
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index)
      return { date, inMonth: true, events: this.eventsForDate(date) }
    })
  })

  protected readonly dayEvents = computed(() => this.eventsForDate(this.focus()))

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap
    const qLab = Number(query.get('labId'))
    const qEquipment = Number(query.get('equipmentId'))
    const qFrom = query.get('from')
    if (qLab > 0) this.labId = qLab
    if (qEquipment > 0) this.equipmentId = qEquipment
    if (qFrom && !Number.isNaN(new Date(qFrom).getTime())) this.focus.set(new Date(qFrom))

    forkJoin({
      labs: this.api.labs().pipe(catchError(() => of([] as LabRoomResponse[]))),
      equipments: this.api.equipments().pipe(catchError(() => of([] as EquipmentResponse[]))),
    }).subscribe(({ labs, equipments }) => {
      const visibleLabs = this.store.isRequester()
        ? labs.filter((lab) => isAvailableLabStatus(lab.status))
        : labs
      const visibleEquipments = this.store.isRequester()
        ? equipments.filter((equipment) => isAvailableEquipmentStatus(equipment.status))
        : equipments
      this.labs.set(visibleLabs)
      this.equipments.set(visibleEquipments)
      if (this.store.isRequester()) {
        if (this.labId && !visibleLabs.some((lab) => lab.labId === this.labId)) this.labId = null
        if (
          this.equipmentId &&
          !visibleEquipments.some((equipment) => equipment.equipmentId === this.equipmentId)
        ) {
          this.equipmentId = null
        }
      }
      if (!visibleLabs.length || !visibleEquipments.length) {
        this.toast.info('Một phần danh mục tài nguyên chưa tải được, lịch vẫn tiếp tục hoạt động.')
      }
      this.load()
    })
  }

  protected load(): void {
    this.loading.set(true)
    const [from, to] = this.periodRange()
    this.api
      .calendar(
        from.toISOString(),
        to.toISOString(),
        this.equipmentId ? undefined : (this.labId ?? undefined),
        this.equipmentId ?? undefined,
      )
      .subscribe({
        next: (items) => {
          this.events.set(items)
          this.loading.set(false)
        },
        error: () => {
          this.events.set([])
          this.loading.set(false)
          this.toast.error('Không tải được lịch', 'Vui lòng kiểm tra kết nối hoặc quyền truy cập.')
        },
      })
  }

  protected setView(view: CalendarView): void {
    if (this.view() === view) return
    this.view.set(view)
    this.load()
  }

  protected onLabChange(): void {
    this.equipmentId = null
    this.load()
  }

  protected onEquipmentChange(): void {
    if (this.equipmentId) {
      const equipment = this.equipments().find((item) => item.equipmentId === this.equipmentId)
      this.labId = equipment?.labId ?? this.labId
    }
    this.load()
  }

  protected shift(offset: number): void {
    const current = this.focus()
    const next =
      this.view() === 'day'
        ? addDays(current, offset)
        : this.view() === 'week'
          ? addDays(current, offset * 7)
          : new Date(current.getFullYear(), current.getMonth() + offset, 1)
    this.focus.set(next)
    this.load()
  }

  protected today(): void {
    this.focus.set(new Date())
    this.load()
  }

  protected openDay(date: Date): void {
    this.focus.set(new Date(date))
    this.view.set('day')
    this.load()
  }

  protected isToday(date: Date): boolean {
    return toDateInput(date) === toDateInput(new Date())
  }

  protected eventKey(event: CalendarEventResponse): string {
    const resourceKey = event.resources
      .map((item) => `${item.resourceType}-${item.resourceId}`)
      .join('_')
    return `${event.eventType}-${event.sourceId}-${event.startTime}-${resourceKey}`
  }

  protected eventClass(event: CalendarEventResponse): string {
    return event.eventType === 'Maintenance'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-indigo-200 bg-indigo-50 text-indigo-700'
  }

  protected resourceText(event: CalendarEventResponse): string {
    return (
      event.resources
        .map((item) => `${labelOf('resource', item.resourceType)}: ${item.resourceName}`)
        .join(' · ') || 'Chưa có thông tin tài nguyên'
    )
  }

  protected openEvent(event: CalendarEventResponse): void {
    if (
      this.store.isRequester() &&
      (event.eventType === 'Maintenance' ||
        event.sourceId <= 0 ||
        event.userId !== this.store.user()?.userId)
    ) {
      return
    }
    void this.router.navigate(
      event.eventType === 'Maintenance'
        ? ['/app/management/maintenances', event.sourceId]
        : ['/app/bookings', event.sourceId],
    )
  }

  private eventsForDate(date: Date): CalendarEventResponse[] {
    const start = startOfDay(date).getTime()
    const end = addDays(startOfDay(date), 1).getTime()
    return this.filteredEvents().filter((event) => {
      const eventStart = new Date(event.startTime).getTime()
      const eventEnd = new Date(event.endTime).getTime()
      return eventStart < end && eventEnd > start
    })
  }

  private periodRange(): [Date, Date] {
    const focus = this.focus()
    if (this.view() === 'day') {
      const from = startOfDay(focus)
      return [from, addDays(from, 1)]
    }
    if (this.view() === 'week') {
      const from = startOfWeek(focus)
      return [from, addDays(from, 7)]
    }
    const from = new Date(focus.getFullYear(), focus.getMonth(), 1)
    return [from, new Date(focus.getFullYear(), focus.getMonth() + 1, 1)]
  }
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function startOfWeek(value: Date): Date {
  const start = startOfDay(value)
  const mondayOffset = (start.getDay() + 6) % 7
  return addDays(start, -mondayOffset)
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value)
  result.setDate(result.getDate() + days)
  return result
}

function formatDate(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(value)
}
