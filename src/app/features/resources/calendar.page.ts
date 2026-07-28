import { DatePipe, NgClass } from '@angular/common'
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
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'
import { labelOf, toDateInput } from '../../shared/utils/presentation'

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
        subtitle="Theo dõi booking và bảo trì trên toàn bộ phòng lab, thiết bị theo tháng hoặc dạng danh sách."
      >
        @if (store.isRequester()) {
          <a
            routerLink="/app/bookings/new"
            [queryParams]="{ labId: labId, equipmentId: equipmentId }"
            class="btn-primary"
            ><app-icon name="plus" [size]="17" /> Tạo booking</a
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
          <label class="field-label">Phòng lab</label
          ><select class="input-shell" [(ngModel)]="labId" (ngModelChange)="onLabChange()">
            <option [ngValue]="null">Tất cả phòng</option>
            @for (lab of labs(); track lab.labId) {
              <option [ngValue]="lab.labId">{{ lab.labName }} · {{ lab.roomCode }}</option>
            }
          </select>
        </div>
        <div>
          <label class="field-label">Thiết bị</label
          ><select class="input-shell" [(ngModel)]="equipmentId" (ngModelChange)="load()">
            <option [ngValue]="null">Tất cả thiết bị</option>
            @for (item of filteredEquipments(); track item.equipmentId) {
              <option [ngValue]="item.equipmentId">{{ item.equipmentName }}</option>
            }
          </select>
        </div>
        <div>
          <label class="field-label">Loại sự kiện</label
          ><select class="input-shell" [(ngModel)]="eventType">
            <option value="">Booking & bảo trì</option>
            <option value="Booking">Booking</option>
            <option value="Maintenance">Bảo trì</option>
          </select>
        </div>
        <div class="flex items-end gap-2">
          <button class="btn-secondary" type="button" (click)="shiftMonth(-1)">
            <app-icon name="chevron-left" [size]="17" /></button
          ><button class="btn-secondary" type="button" (click)="today()">Hôm nay</button
          ><button class="btn-secondary" type="button" (click)="shiftMonth(1)">
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
              {{ monthTitle() }}
            </p>
            <h2 class="mt-1 text-xl font-black text-slate-950">
              {{ filteredEvents().length }} sự kiện trong kỳ
            </h2>
          </div>
          <div class="inline-flex rounded-2xl bg-slate-100 p-1">
            <button
              class="rounded-xl px-4 py-2 text-xs font-extrabold"
              [ngClass]="
                view() === 'month' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'
              "
              (click)="view.set('month')"
            >
              Tháng</button
            ><button
              class="rounded-xl px-4 py-2 text-xs font-extrabold"
              [ngClass]="
                view() === 'list' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'
              "
              (click)="view.set('list')"
            >
              Danh sách
            </button>
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
            @for (day of weekdays; track day) {
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
                  <span
                    class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black"
                    [ngClass]="isToday(day.date) ? 'bg-violet-600 text-white' : 'text-slate-600'"
                    >{{ day.date.getDate() }}</span
                  ><span class="text-[10px] font-bold text-slate-300">{{
                    day.events.length || ''
                  }}</span>
                </div>
                <div class="mt-2 space-y-1.5">
                  @for (event of day.events.slice(0, 3); track event.eventType + event.sourceId) {
                    <button
                      type="button"
                      class="block w-full truncate rounded-lg border px-2 py-1.5 text-left text-[10px] font-bold"
                      [ngClass]="
                        event.eventType === 'Maintenance'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      "
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
        } @else if (filteredEvents().length === 0) {
          <div class="p-6">
            <app-data-state
              title="Không có sự kiện"
              message="Thử đổi tháng hoặc bỏ bớt bộ lọc để xem lịch tài nguyên."
              icon="calendar"
            />
          </div>
        } @else {
          <div class="divide-y divide-slate-100">
            @for (event of filteredEvents(); track event.eventType + event.sourceId) {
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
            }
          </div>
        }
      </article>
    </section>
  `,
})
export class CalendarPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly toast = inject(ToastService)
  protected readonly store = inject(AuthStore)
  protected readonly labs = signal<LabRoomResponse[]>([])
  protected readonly equipments = signal<EquipmentResponse[]>([])
  protected readonly events = signal<CalendarEventResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly view = signal<'month' | 'list'>('month')
  protected readonly focus = signal(new Date())
  protected labId: number | null = null
  protected equipmentId: number | null = null
  protected eventType = ''
  protected readonly weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  protected readonly skeletons = Array.from({ length: 35 }, (_, index) => index)

  protected readonly monthTitle = computed(() =>
    new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(this.focus()),
  )
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
    const mondayIndex = (first.getDay() + 6) % 7
    const start = new Date(first)
    start.setDate(first.getDate() - mondayIndex)
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      const key = toDateInput(date)
      return {
        date,
        inMonth: date.getMonth() === focus.getMonth(),
        events: this.filteredEvents().filter(
          (event) => toDateInput(new Date(event.startTime)) === key,
        ),
      }
    })
  })

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
      this.labs.set(labs)
      this.equipments.set(equipments)
      if (!labs.length || !equipments.length) {
        this.toast.info('Một phần danh mục tài nguyên chưa tải được, lịch vẫn tiếp tục hoạt động.')
      }
      this.load()
    })
  }

  protected load(): void {
    this.loading.set(true)
    const focus = this.focus()
    const from = new Date(focus.getFullYear(), focus.getMonth(), 1)
    const to = new Date(focus.getFullYear(), focus.getMonth() + 1, 1)
    this.api
      .calendar(
        from.toISOString(),
        to.toISOString(),
        this.labId ?? undefined,
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
          this.toast.error('Không tải được lịch', 'Kiểm tra backend hoặc quyền truy cập.')
        },
      })
  }

  protected onLabChange(): void {
    this.equipmentId = null
    this.load()
  }
  protected shiftMonth(offset: number): void {
    const current = this.focus()
    this.focus.set(new Date(current.getFullYear(), current.getMonth() + offset, 1))
    this.load()
  }
  protected today(): void {
    this.focus.set(new Date())
    this.load()
  }
  protected isToday(date: Date): boolean {
    return toDateInput(date) === toDateInput(new Date())
  }
  protected resourceText(event: CalendarEventResponse): string {
    return (
      event.resources
        .map((item) => `${labelOf('resource', item.resourceType)}: ${item.resourceName}`)
        .join(' · ') || 'Chưa có thông tin tài nguyên'
    )
  }
  protected openEvent(event: CalendarEventResponse): void {
    void this.router.navigate(
      event.eventType === 'Maintenance'
        ? ['/app/management/maintenances', event.sourceId]
        : ['/app/bookings', event.sourceId],
    )
  }
}
