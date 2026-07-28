import { DatePipe, NgClass } from '@angular/common'
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslatePipe, TranslateService } from '@ngx-translate/core'
import { AuthStore } from '../../core/auth/auth.store'
import {
  SystemMaintenanceService,
  type SystemMaintenanceState,
} from '../../core/system-maintenance.service'
import { IconComponent } from '../../shared/ui/icon'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { ToastService } from '../../shared/ui/toast.service'

@Component({
  selector: 'app-system-maintenance-page',
  imports: [DatePipe, NgClass, FormsModule, TranslatePipe, PageHeaderComponent, IconComponent],
  template: `
    <section class="space-y-6">
      <app-page-header
        [title]="'systemMaintenance.title' | translate"
        [subtitle]="'systemMaintenance.subtitle' | translate"
      >
        <span
          class="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black"
          [ngClass]="
            enabled
              ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          "
        >
          <span
            class="h-2.5 w-2.5 rounded-full"
            [ngClass]="enabled ? 'animate-pulse bg-rose-500' : 'bg-emerald-500'"
          ></span>
          {{
            enabled
              ? ('systemMaintenance.status.on' | translate)
              : ('systemMaintenance.status.off' | translate)
          }}
        </span>
      </app-page-header>

      <div class="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <form class="card-surface overflow-hidden" (ngSubmit)="save()">
          <div
            class="border-b border-slate-100 bg-linear-to-r from-violet-50 via-white to-cyan-50 px-6 py-6"
          >
            <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-4">
                <span
                  class="flex h-13 w-13 items-center justify-center rounded-[20px] bg-[#111a3a] text-white shadow-lg shadow-indigo-950/20"
                >
                  <app-icon name="settings" [size]="24" />
                </span>
                <div>
                  <p class="text-[10px] font-black tracking-[.2em] text-violet-600 uppercase">
                    {{ 'systemMaintenance.control.eyebrow' | translate }}
                  </p>
                  <h2 class="mt-1 text-xl font-black text-slate-950">
                    {{ 'systemMaintenance.control.title' | translate }}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                class="relative inline-flex h-12 w-[132px] items-center rounded-2xl p-1.5 text-xs font-black text-white shadow-lg transition duration-300"
                [ngClass]="
                  enabled
                    ? 'justify-end bg-linear-to-r from-rose-500 to-orange-500 shadow-rose-200'
                    : 'justify-start bg-slate-300 shadow-slate-200'
                "
                (click)="enabled = !enabled"
                [attr.aria-pressed]="enabled"
              >
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-800 shadow-sm"
                >
                  <app-icon [name]="enabled ? 'pause' : 'play'" [size]="17" />
                </span>
                <span class="px-2.5">{{ enabled ? 'ON' : 'OFF' }}</span>
              </button>
            </div>
          </div>

          <div class="space-y-5 p-6 sm:p-7">
            <div class="grid gap-5 md:grid-cols-2">
              <div>
                <label class="field-label">{{
                  'systemMaintenance.fields.start' | translate
                }}</label>
                <input
                  class="input-shell"
                  type="datetime-local"
                  [(ngModel)]="expectedStart"
                  name="expectedStart"
                />
              </div>
              <div>
                <label class="field-label">{{ 'systemMaintenance.fields.end' | translate }}</label>
                <input
                  class="input-shell"
                  type="datetime-local"
                  [(ngModel)]="expectedEnd"
                  name="expectedEnd"
                />
              </div>
            </div>

            <div>
              <label class="field-label">{{
                'systemMaintenance.fields.message' | translate
              }}</label>
              <textarea
                class="textarea-shell min-h-36"
                maxlength="500"
                [(ngModel)]="message"
                name="message"
                [placeholder]="'systemMaintenance.fields.placeholder' | translate"
              ></textarea>
              <p class="mt-2 text-right text-[11px] font-bold text-slate-400">
                {{ message.length }}/500
              </p>
            </div>

            @if (validationMessage()) {
              <div
                class="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
              >
                <app-icon name="alert" [size]="18" />
                <span>{{ validationMessage() }}</span>
              </div>
            }
          </div>

          <div
            class="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="text-xs font-semibold text-slate-400">
              {{ 'systemMaintenance.savedLocally' | translate }}
            </p>
            <button class="btn-primary" type="submit" [disabled]="saving()">
              <app-icon name="save" [size]="17" />
              {{
                saving()
                  ? ('systemMaintenance.actions.saving' | translate)
                  : ('systemMaintenance.actions.save' | translate)
              }}
            </button>
          </div>
        </form>

        <div class="space-y-6">
          <article class="card-surface overflow-hidden">
            <header class="border-b border-slate-100 px-6 py-5">
              <p class="text-[10px] font-black tracking-[.2em] text-violet-600 uppercase">
                {{ 'systemMaintenance.preview.eyebrow' | translate }}
              </p>
              <h2 class="mt-2 text-lg font-black text-slate-950">
                {{ 'systemMaintenance.preview.title' | translate }}
              </h2>
            </header>
            <div class="bg-[#f5f7fb] p-6">
              <div
                class="rounded-[26px] border p-5 shadow-[0_18px_50px_rgba(15,23,42,.08)]"
                [ngClass]="
                  enabled ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
                "
              >
                <div class="flex items-start gap-4">
                  <span
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                    [ngClass]="
                      enabled ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    "
                  >
                    <app-icon [name]="enabled ? 'wrench' : 'check'" [size]="21" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <h3 class="font-black text-slate-950">
                      {{
                        enabled
                          ? ('systemMaintenance.preview.activeTitle' | translate)
                          : ('systemMaintenance.preview.normalTitle' | translate)
                      }}
                    </h3>
                    <p class="mt-2 text-sm leading-6 text-slate-600">
                      {{
                        message.trim() ||
                          (enabled
                            ? ('systemMaintenance.preview.defaultMessage' | translate)
                            : ('systemMaintenance.preview.normalMessage' | translate))
                      }}
                    </p>
                    @if (expectedStart || expectedEnd) {
                      <div
                        class="mt-4 flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-bold text-slate-600"
                      >
                        <app-icon name="clock" [size]="16" />
                        <span>{{ formatWindow() }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article class="rounded-[28px] border border-indigo-100 bg-indigo-50/70 p-6">
            <div class="flex items-start gap-4">
              <span
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700"
              >
                <app-icon name="lightbulb" [size]="20" />
              </span>
              <div>
                <h3 class="font-black text-indigo-950">
                  {{ 'systemMaintenance.note.title' | translate }}
                </h3>
                <p class="mt-2 text-sm leading-6 text-indigo-800">
                  {{ 'systemMaintenance.note.text' | translate }}
                </p>
              </div>
            </div>
          </article>

          @if (state().updatedAt) {
            <p class="px-2 text-xs font-semibold text-slate-400">
              {{ 'systemMaintenance.lastUpdated' | translate }}
              {{ state().updatedAt | date: 'dd/MM/yyyy HH:mm' }}
              @if (state().updatedBy) {
                · {{ state().updatedBy }}
              }
            </p>
          }
        </div>
      </div>
    </section>
  `,
})
export class SystemMaintenancePage implements OnInit {
  private readonly maintenance = inject(SystemMaintenanceService)
  private readonly store = inject(AuthStore)
  private readonly toast = inject(ToastService)
  private readonly translate = inject(TranslateService)

  protected readonly state = this.maintenance.state
  protected readonly saving = signal(false)
  protected enabled = false
  protected expectedStart = ''
  protected expectedEnd = ''
  protected message = ''

  ngOnInit(): void {
    this.patch(this.state())
  }

  protected validationMessage(): string {
    if (!this.enabled) return ''
    if (!this.expectedStart || !this.expectedEnd) {
      return this.translate.instant('systemMaintenance.validation.timeRequired')
    }
    if (new Date(this.expectedStart).getTime() >= new Date(this.expectedEnd).getTime()) {
      return this.translate.instant('systemMaintenance.validation.timeOrder')
    }
    if (!this.message.trim())
      return this.translate.instant('systemMaintenance.validation.messageRequired')
    return ''
  }

  protected save(): void {
    const error = this.validationMessage()
    if (error) {
      this.toast.error(this.translate.instant('systemMaintenance.toast.invalidTitle'), error)
      return
    }

    this.saving.set(true)
    const user = this.store.user()
    this.maintenance.save({
      enabled: this.enabled,
      expectedStart: this.expectedStart,
      expectedEnd: this.expectedEnd,
      message: this.message.trim(),
      updatedBy: user?.fullName ?? '',
    })
    this.saving.set(false)
    this.toast.success(
      this.translate.instant(
        this.enabled
          ? 'systemMaintenance.toast.enabledTitle'
          : 'systemMaintenance.toast.disabledTitle',
      ),
      this.translate.instant(
        this.enabled
          ? 'systemMaintenance.toast.enabledText'
          : 'systemMaintenance.toast.disabledText',
      ),
    )
  }

  protected formatWindow(): string {
    const start = this.formatDate(this.expectedStart)
    const end = this.formatDate(this.expectedEnd)
    if (start && end) return `${start} → ${end}`
    return start || end || ''
  }

  private formatDate(value: string): string {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat(document.documentElement.lang === 'en' ? 'en-GB' : 'vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  }

  private patch(state: SystemMaintenanceState): void {
    this.enabled = state.enabled
    this.expectedStart = state.expectedStart
    this.expectedEnd = state.expectedEnd
    this.message = state.message
  }
}
