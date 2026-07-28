import { NgClass } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import type { Observable } from 'rxjs'
import { SystemService } from '../../core/api/system.service'
import type { PriorityRuleResponse } from '../../core/api/system.models'
import { DataStateComponent } from '../../shared/ui/data-state'
import { IconComponent } from '../../shared/ui/icon'
import { ModalComponent } from '../../shared/ui/modal'
import { PageHeaderComponent } from '../../shared/ui/page-header'
import { StatusBadgeComponent } from '../../shared/ui/status-badge'
import { ToastService } from '../../shared/ui/toast.service'
import { labelOf } from '../../shared/utils/presentation'

@Component({
  selector: 'app-priority-rules-page',
  imports: [
    NgClass,
    FormsModule,
    PageHeaderComponent,
    IconComponent,
    ModalComponent,
    StatusBadgeComponent,
    DataStateComponent,
  ],
  template: `
    <section class="space-y-6">
      <app-page-header
        title="Quy tắc ưu tiên booking"
        subtitle="Điều chỉnh thứ tự xử lý các mục đích đặt lịch. Số càng nhỏ thì mức ưu tiên càng cao."
      >
        <button class="btn-primary" type="button" (click)="openCreate()">
          <app-icon name="plus" [size]="17" /> Thêm quy tắc
        </button>
      </app-page-header>

      <div
        class="relative overflow-hidden rounded-[30px] bg-[#111a3a] p-6 text-white shadow-xl sm:p-8"
      >
        <div
          class="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl"
        ></div>
        <div
          class="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl"
        ></div>
        <div class="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p class="text-xs font-black tracking-[.2em] text-cyan-300 uppercase">
              Nguyên tắc xếp hàng
            </p>
            <h2 class="mt-3 max-w-2xl text-2xl font-black">
              PriorityLevel ↑ cao hơn khi con số ↓ nhỏ hơn
            </h2>
            <p class="mt-3 max-w-3xl text-sm leading-6 text-white/60">
              Booking Pending được sắp xếp theo PriorityLevel tăng dần, sau đó theo thời điểm tạo
              tăng dần. Backend vẫn kiểm tra xung đột lại trong transaction khi duyệt.
            </p>
          </div>
          <div
            class="flex h-24 w-24 items-center justify-center rounded-[26px] bg-white/10 text-cyan-300"
          >
            <app-icon name="layers" [size]="38" />
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="skeleton h-64 rounded-[28px]"></div>
          }
        </div>
      } @else if (sortedRules().length === 0) {
        <app-data-state
          icon="layers"
          title="Chưa có quy tắc ưu tiên"
          message="Thêm quy tắc đầu tiên để hệ thống xác định thứ tự duyệt booking."
        />
      } @else {
        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          @for (rule of sortedRules(); track rule.priorityRuleId; let rank = $index) {
            <article
              class="group card-surface overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,.1)]"
            >
              <div
                class="relative h-32 bg-linear-to-br"
                [ngClass]="
                  rank === 0
                    ? 'from-violet-700 to-indigo-600'
                    : rank === 1
                      ? 'from-cyan-600 to-blue-600'
                      : rank === 2
                        ? 'from-emerald-600 to-teal-600'
                        : 'from-slate-700 to-slate-600'
                "
              >
                <div
                  class="absolute inset-0 opacity-20"
                  style="background-image:radial-gradient(circle at 80% 20%,white 0,transparent 32%)"
                ></div>
                <span
                  class="absolute top-5 left-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-black text-white backdrop-blur"
                  >{{ rule.priorityLevel }}</span
                >
                <div class="absolute inset-x-5 bottom-4 flex items-center justify-between">
                  <p class="text-xs font-black tracking-[.16em] text-white/65 uppercase">
                    Mức ưu tiên
                  </p>
                  <app-status-badge [value]="rule.status" />
                </div>
              </div>
              <div class="p-5">
                <h2 class="text-lg font-black text-slate-950">
                  {{ labelOf('purpose', rule.purposeType) }}
                </h2>
                <p class="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                  {{ rule.description || 'Chưa có mô tả cho quy tắc này.' }}
                </p>
                <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span class="text-xs font-bold text-slate-400"
                    >#PR-{{ rule.priorityRuleId }}</span
                  >
                  <div class="flex gap-1">
                    <button
                      class="rounded-xl p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600"
                      title="Chỉnh sửa"
                      (click)="openEdit(rule)"
                    >
                      <app-icon name="edit" [size]="17" /></button
                    ><button
                      class="rounded-xl p-2 text-slate-400"
                      [ngClass]="
                        isActive(rule)
                          ? 'hover:bg-rose-50 hover:text-rose-600'
                          : 'hover:bg-emerald-50 hover:text-emerald-600'
                      "
                      [title]="isActive(rule) ? 'Tạm ngừng' : 'Kích hoạt'"
                      (click)="toggle(rule)"
                    >
                      <app-icon [name]="isActive(rule) ? 'pause' : 'play'" [size]="17" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          }
        </div>
      }

      <article class="card-surface overflow-hidden">
        <header class="border-b border-slate-100 px-6 py-5">
          <h2 class="font-black text-slate-950">Thứ tự đang áp dụng</h2>
          <p class="mt-1 text-xs text-slate-400">
            Chỉ các quy tắc Active mới được dùng để gán PriorityLevel cho booking.
          </p>
        </header>
        <div class="divide-y divide-slate-100">
          @for (rule of activeRules(); track rule.priorityRuleId; let rank = $index) {
            <div class="flex items-center gap-4 px-6 py-4">
              <span
                class="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 font-black text-violet-700"
                >{{ rank + 1 }}</span
              >
              <div class="min-w-0 flex-1">
                <p class="font-black text-slate-800">{{ labelOf('purpose', rule.purposeType) }}</p>
                <p class="mt-1 truncate text-xs text-slate-400">
                  {{ rule.description || 'Không có mô tả' }}
                </p>
              </div>
              <span class="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600"
                >Priority {{ rule.priorityLevel }}</span
              >
            </div>
          } @empty {
            <div class="px-6 py-10 text-center text-sm font-semibold text-slate-400">
              Chưa có quy tắc Active.
            </div>
          }
        </div>
      </article>

      <app-modal
        [open]="formOpen()"
        [title]="editingId() ? 'Chỉnh sửa quy tắc ưu tiên' : 'Thêm quy tắc ưu tiên'"
        subtitle="Không nên hardcode mức ưu tiên ở frontend; dữ liệu sẽ được lấy từ API active."
        (close)="formOpen.set(false)"
      >
        <form class="space-y-4" (ngSubmit)="save()">
          @if (!editingId()) {
            <div>
              <label class="field-label">Loại mục đích *</label
              ><select
                class="input-shell"
                required
                [(ngModel)]="form.purposeType"
                name="purposeType"
              >
                <option [ngValue]="null">Chọn mục đích</option>
                <option [ngValue]="1">Dự án nghiên cứu</option>
                <option [ngValue]="2">Thực hành môn học</option>
                <option [ngValue]="3">Tự học</option>
                <option [ngValue]="4">Khác</option>
              </select>
            </div>
          }
          <div>
            <label class="field-label">PriorityLevel *</label
            ><input
              class="input-shell"
              type="number"
              min="1"
              required
              [(ngModel)]="form.priorityLevel"
              name="priorityLevel"
            />
            <p class="mt-2 text-xs text-slate-400">Ví dụ: 1 cao hơn 2; 2 cao hơn 3.</p>
          </div>
          <div>
            <label class="field-label">Mô tả</label
            ><textarea
              class="textarea-shell"
              [(ngModel)]="form.description"
              name="description"
              placeholder="Giải thích khi nào quy tắc được sử dụng..."
            ></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" class="btn-secondary" (click)="formOpen.set(false)">Hủy</button
            ><button
              class="btn-primary"
              [disabled]="saving() || !form.priorityLevel || (!editingId() && !form.purposeType)"
            >
              {{ saving() ? 'Đang lưu...' : 'Lưu quy tắc' }}
            </button>
          </div>
        </form>
      </app-modal>
    </section>
  `,
})
export class PriorityRulesPage implements OnInit {
  private readonly api = inject(SystemService)
  private readonly toast = inject(ToastService)
  protected readonly rules = signal<PriorityRuleResponse[]>([])
  protected readonly loading = signal(true)
  protected readonly saving = signal(false)
  protected readonly formOpen = signal(false)
  protected readonly editingId = signal<number | null>(null)
  protected readonly labelOf = labelOf
  protected form = { purposeType: null as number | null, priorityLevel: 1, description: '' }
  protected readonly sortedRules = computed(() =>
    [...this.rules()].sort((a, b) => a.priorityLevel - b.priorityLevel),
  )
  protected readonly activeRules = computed(() =>
    this.sortedRules().filter((item) => this.isActive(item)),
  )

  ngOnInit(): void {
    this.load()
  }
  protected isActive(rule: PriorityRuleResponse): boolean {
    return rule.status === 'Active' || rule.status === '1'
  }
  protected openCreate(): void {
    this.editingId.set(null)
    this.form = { purposeType: null, priorityLevel: this.rules().length + 1, description: '' }
    this.formOpen.set(true)
  }
  protected openEdit(rule: PriorityRuleResponse): void {
    this.editingId.set(rule.priorityRuleId)
    this.form = {
      purposeType: null,
      priorityLevel: rule.priorityLevel,
      description: rule.description ?? '',
    }
    this.formOpen.set(true)
  }

  protected save(): void {
    if (!this.form.priorityLevel || (!this.editingId() && !this.form.purposeType)) return
    this.saving.set(true)
    const request: Observable<unknown> = this.editingId()
      ? this.api.updatePriorityRule(this.editingId()!, {
          priorityLevel: this.form.priorityLevel,
          description: this.form.description.trim() || null,
        })
      : this.api.createPriorityRule({
          purposeType: this.form.purposeType!,
          priorityLevel: this.form.priorityLevel,
          description: this.form.description.trim() || null,
        })
    request.subscribe({
      next: () => {
        this.saving.set(false)
        this.formOpen.set(false)
        this.toast.success(this.editingId() ? 'Đã cập nhật quy tắc' : 'Đã thêm quy tắc ưu tiên')
        this.load(false)
      },
      error: () => {
        this.saving.set(false)
        this.toast.error('Không thể lưu quy tắc ưu tiên')
      },
    })
  }

  protected toggle(rule: PriorityRuleResponse): void {
    const action = this.isActive(rule) ? 'deactivate' : 'activate'
    this.api.priorityRuleAction(rule.priorityRuleId, action).subscribe({
      next: () => {
        this.toast.success(action === 'activate' ? 'Đã kích hoạt quy tắc' : 'Đã tạm ngừng quy tắc')
        this.load(false)
      },
      error: () => this.toast.error('Không thể đổi trạng thái quy tắc'),
    })
  }

  private load(showLoading = true): void {
    if (showLoading) this.loading.set(true)
    this.api.priorityRules(false).subscribe({
      next: (items) => {
        this.rules.set(items)
        this.loading.set(false)
      },
      error: () => {
        this.loading.set(false)
        this.toast.error('Không tải được quy tắc ưu tiên')
      },
    })
  }
}
