import { DecimalPipe } from '@angular/common'
import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import type {
  CategoryCountResponse,
  DashboardResponse,
  ResourceUtilizationResponse,
} from '../../core/api/api.models'
import { WorkspaceService } from '../../core/api/workspace.service'
import { AuthStore } from '../../core/auth/auth.store'
import { ApiError } from '../../core/http/api-error'
import { IconComponent } from '../../shared/ui/icon'
import { ToastService } from '../../shared/ui/toast.service'

const EMPTY_DASHBOARD: DashboardResponse = {
  from: '',
  to: '',
  totalBookings: 0,
  totalUsageLogs: 0,
  totalViolations: 0,
  totalMaintenanceCost: 0,
  noShow: { noShowCount: 0, completedCount: 0, concludedBookingCount: 0, noShowRate: 0 },
  bookingStatusCounts: [],
  bookingPurposeCounts: [],
  bookingDepartmentCounts: [],
  labUtilization: [],
  equipmentUtilization: [],
  departmentUtilization: [],
  mostUsedLabRooms: [],
  mostUsedEquipments: [],
  usersWithMostPenaltyPoints: [],
  usageTrend: [],
}

@Component({
  selector: 'app-dashboard-page',
  imports: [FormsModule, DecimalPipe, IconComponent],
  template: `
    <section class="space-y-6">
      <header class="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div class="flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            Dữ liệu vận hành trực tiếp
          </div>
          <h1 class="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Dashboard tổng quan
          </h1>
          <p class="mt-2 text-sm text-slate-500">
            {{ store.isAdmin() ? 'Toàn bộ hệ thống' : 'Các phòng lab bạn đang quản lý' }} • cập nhật
            theo khoảng thời gian đã chọn.
          </p>
        </div>

        <div
          class="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
        >
          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-slate-500">Từ</label>
            <input
              [(ngModel)]="fromDate"
              type="date"
              class="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
            />
          </div>
          <div class="hidden h-6 w-px bg-slate-200 sm:block"></div>
          <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-slate-500">Đến</label>
            <input
              [(ngModel)]="toDate"
              type="date"
              class="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
            />
          </div>
          <button
            type="button"
            class="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#111a3a] px-4 text-xs font-bold text-white hover:bg-[#17234c]"
            [disabled]="loading()"
            (click)="load()"
          >
            <app-icon name="refresh" [size]="16" />
            Áp dụng
          </button>
        </div>
      </header>

      <div class="flex flex-wrap gap-2">
        @for (preset of presets; track preset.days) {
          <button
            type="button"
            class="dashboard-chip"
            [class.border-indigo-200]="activePreset() === preset.days"
            [class.bg-indigo-50]="activePreset() === preset.days"
            [class.text-indigo-700]="activePreset() === preset.days"
            [class.border-slate-200]="activePreset() !== preset.days"
            [class.bg-slate-50]="activePreset() !== preset.days"
            [class.text-slate-500]="activePreset() !== preset.days"
            (click)="applyPreset(preset.days)"
          >
            {{ preset.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          @for (item of [1, 2, 3, 4, 5, 6]; track item) {
            <div class="card-surface h-32 animate-pulse bg-slate-100"></div>
          }
        </div>
        <div class="grid gap-6 xl:grid-cols-2">
          <div class="card-surface h-96 animate-pulse bg-slate-100"></div>
          <div class="card-surface h-96 animate-pulse bg-slate-100"></div>
        </div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          @for (card of metricCards(); track card.label) {
            <article class="dashboard-metric group relative overflow-hidden p-5">
              <div
                class="pointer-events-none absolute -top-7 -right-7 h-20 w-20 rounded-full opacity-55 blur-xl transition duration-300 group-hover:scale-110 group-hover:opacity-75"
                [class.bg-indigo-200]="card.tone === 'indigo'"
                [class.bg-cyan-200]="card.tone === 'cyan'"
                [class.bg-violet-200]="card.tone === 'violet'"
                [class.bg-amber-200]="card.tone === 'amber'"
                [class.bg-rose-200]="card.tone === 'rose'"
                [class.bg-emerald-200]="card.tone === 'emerald'"
              ></div>
              <div class="relative">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-2xl"
                  [class.bg-indigo-50]="card.tone === 'indigo'"
                  [class.text-indigo-600]="card.tone === 'indigo'"
                  [class.bg-cyan-50]="card.tone === 'cyan'"
                  [class.text-cyan-600]="card.tone === 'cyan'"
                  [class.bg-violet-50]="card.tone === 'violet'"
                  [class.text-violet-600]="card.tone === 'violet'"
                  [class.bg-amber-50]="card.tone === 'amber'"
                  [class.text-amber-600]="card.tone === 'amber'"
                  [class.bg-rose-50]="card.tone === 'rose'"
                  [class.text-rose-600]="card.tone === 'rose'"
                  [class.bg-emerald-50]="card.tone === 'emerald'"
                  [class.text-emerald-600]="card.tone === 'emerald'"
                >
                  <app-icon [name]="card.icon" [size]="19" />
                </div>
                <p class="mt-5 text-2xl font-bold tracking-[-0.04em] text-slate-950">
                  {{ card.value }}
                </p>
                <p class="mt-1 text-xs font-medium text-slate-500">{{ card.label }}</p>
              </div>
            </article>
          }
        </div>

        <div class="grid gap-6 xl:grid-cols-[1.22fr_.78fr]">
          <article class="card-surface overflow-hidden">
            <div
              class="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div>
                <h2 class="text-lg font-bold text-slate-950">Xu hướng sử dụng</h2>
                <p class="mt-1 text-xs text-slate-400">Số lượt sử dụng thực tế theo thời gian</p>
              </div>
              <div class="flex items-center gap-4 text-xs text-slate-500">
                <span class="flex items-center gap-2"
                  ><i class="h-2.5 w-2.5 rounded-full bg-indigo-500"></i>Lượt sử dụng</span
                >
                <span class="rounded-full bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700"
                  >{{ totalUsageHours() | number: '1.0-1' }} giờ</span
                >
              </div>
            </div>
            <div class="p-5 sm:p-6">
              @if (dashboard().usageTrend.length === 0) {
                <div class="flex h-72 flex-col items-center justify-center text-center">
                  <div
                    class="flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500"
                  >
                    <app-icon name="chart" [size]="26" />
                  </div>
                  <p class="mt-4 text-sm font-semibold text-slate-700">
                    Chưa có dữ liệu usage trong kỳ
                  </p>
                </div>
              } @else {
                <div class="dashboard-chart-panel relative h-72 overflow-hidden rounded-2xl p-4">
                  <div class="absolute inset-x-4 top-4 bottom-10 flex flex-col justify-between">
                    @for (line of [1, 2, 3, 4, 5]; track line) {
                      <div class="border-t border-dashed border-slate-200"></div>
                    }
                  </div>
                  <svg
                    class="relative h-[225px] w-full overflow-visible"
                    viewBox="0 0 600 190"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="Biểu đồ xu hướng sử dụng"
                  >
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.24" />
                        <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon [attr.points]="usageAreaPoints()" fill="url(#trendFill)" />
                    <polyline
                      [attr.points]="usageTrendPoints()"
                      fill="none"
                      stroke="#6366f1"
                      stroke-width="4"
                      vector-effect="non-scaling-stroke"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    @for (point of usagePointObjects(); track point.x) {
                      <circle
                        [attr.cx]="point.x"
                        [attr.cy]="point.y"
                        r="5"
                        fill="#eef2ff"
                        stroke="#4f46e5"
                        stroke-width="3"
                        vector-effect="non-scaling-stroke"
                      />
                    }
                  </svg>
                  <div class="mt-1 flex justify-between text-[10px] font-medium text-slate-400">
                    @for (label of trendLabels(); track label) {
                      <span>{{ label }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          </article>

          <article class="card-surface overflow-hidden">
            <div class="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 class="text-lg font-bold text-slate-950">Booking theo trạng thái</h2>
              <p class="mt-1 text-xs text-slate-400">Phân bổ trong khoảng thời gian đã chọn</p>
            </div>
            <div
              class="grid items-center gap-6 p-5 sm:grid-cols-[170px_1fr] sm:p-6 xl:grid-cols-1 2xl:grid-cols-[170px_1fr]"
            >
              <div
                class="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full"
                [style.background]="statusDonut()"
              >
                <div
                  class="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner"
                >
                  <span class="text-3xl font-bold tracking-[-0.04em] text-slate-950">{{
                    dashboard().totalBookings
                  }}</span>
                  <span class="mt-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase"
                    >Booking</span
                  >
                </div>
              </div>
              <div class="space-y-3">
                @for (
                  status of dashboard().bookingStatusCounts.slice(0, 6);
                  track status.key;
                  let index = $index
                ) {
                  <div class="flex items-center gap-3">
                    <span
                      class="h-2.5 w-2.5 shrink-0 rounded-full"
                      [style.background-color]="chartColors[index % chartColors.length]"
                    ></span>
                    <span class="min-w-0 flex-1 truncate text-xs font-medium text-slate-500">{{
                      status.displayName || statusLabel(status.key)
                    }}</span>
                    <strong class="text-sm text-slate-900">{{ status.count }}</strong>
                    <span class="w-11 text-right text-[10px] text-slate-400"
                      >{{ status.percentage | number: '1.0-1' }}%</span
                    >
                  </div>
                }
                @if (dashboard().bookingStatusCounts.length === 0) {
                  <p class="py-8 text-center text-sm text-slate-400">Chưa có dữ liệu trạng thái.</p>
                }
              </div>
            </div>
          </article>
        </div>

        <div class="grid gap-6 xl:grid-cols-2">
          <article class="card-surface p-5 sm:p-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-bold text-slate-950">Booking theo mục đích</h2>
                <p class="mt-1 text-xs text-slate-400">Nhu cầu sử dụng tài nguyên</p>
              </div>
              <div
                class="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"
              >
                <app-icon name="sparkles" [size]="20" />
              </div>
            </div>
            <div class="mt-6 space-y-5">
              @for (
                item of dashboard().bookingPurposeCounts.slice(0, 6);
                track item.key;
                let index = $index
              ) {
                <div>
                  <div class="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span class="font-medium text-slate-600">{{
                      item.displayName || purposeLabel(item.key)
                    }}</span>
                    <span class="font-bold text-slate-900"
                      >{{ item.count }}
                      <small class="font-medium text-slate-400"
                        >({{ item.percentage | number: '1.0-1' }}%)</small
                      ></span
                    >
                  </div>
                  <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full transition-all duration-700"
                      [style.width.%]="item.percentage"
                      [style.background-color]="chartColors[index % chartColors.length]"
                    ></div>
                  </div>
                </div>
              }
              @if (dashboard().bookingPurposeCounts.length === 0) {
                <p class="py-12 text-center text-sm text-slate-400">Chưa có dữ liệu mục đích.</p>
              }
            </div>
          </article>

          <article class="card-surface p-5 sm:p-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-bold text-slate-950">Booking theo khoa / phòng ban</h2>
                <p class="mt-1 text-xs text-slate-400">Đơn vị có nhu cầu sử dụng cao nhất</p>
              </div>
              <div
                class="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"
              >
                <app-icon name="building" [size]="20" />
              </div>
            </div>
            <div class="mt-6 space-y-4">
              @for (
                item of dashboard().bookingDepartmentCounts.slice(0, 6);
                track item.key;
                let index = $index
              ) {
                <div class="grid grid-cols-[32px_1fr_auto] items-center gap-3">
                  <span
                    class="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold"
                    [class.bg-indigo-50]="index === 0"
                    [class.text-indigo-700]="index === 0"
                    [class.bg-slate-100]="index !== 0"
                    [class.text-slate-500]="index !== 0"
                    >{{ index + 1 }}</span
                  >
                  <div class="min-w-0">
                    <div class="flex items-center justify-between gap-3">
                      <span class="truncate text-sm font-medium text-slate-600">{{
                        item.displayName || item.key
                      }}</span
                      ><span class="text-xs text-slate-400"
                        >{{ item.percentage | number: '1.0-1' }}%</span
                      >
                    </div>
                    <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full bg-linear-to-r from-cyan-500 to-indigo-500"
                        [style.width.%]="item.percentage"
                      ></div>
                    </div>
                  </div>
                  <strong class="text-sm text-slate-900">{{ item.count }}</strong>
                </div>
              }
              @if (dashboard().bookingDepartmentCounts.length === 0) {
                <p class="py-12 text-center text-sm text-slate-400">Chưa có dữ liệu phòng ban.</p>
              }
            </div>
          </article>
        </div>

        <div class="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <article class="card-surface overflow-hidden">
            <div
              class="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"
            >
              <div>
                <h2 class="text-lg font-bold text-slate-950">Hiệu suất tài nguyên</h2>
                <p class="mt-1 text-xs text-slate-400">
                  Phòng lab và thiết bị có tỷ lệ sử dụng cao
                </p>
              </div>
              <select
                [ngModel]="resourceTab()"
                (ngModelChange)="resourceTab.set($event)"
                class="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600"
              >
                <option value="labs">Phòng lab</option>
                <option value="equipments">Thiết bị</option>
              </select>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full min-w-[660px] text-left">
                <thead>
                  <tr
                    class="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase"
                  >
                    <th class="px-6 py-4">Tài nguyên</th>
                    <th class="px-4 py-4">Booking</th>
                    <th class="px-4 py-4">Giờ thực tế</th>
                    <th class="px-4 py-4">Khả dụng</th>
                    <th class="px-6 py-4">Tỷ lệ sử dụng</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (resource of selectedResources().slice(0, 7); track resource.resourceId) {
                    <tr class="transition-colors duration-150 hover:bg-indigo-50/45">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <span
                            class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
                            ><app-icon
                              [name]="resourceTab() === 'labs' ? 'flask' : 'microscope'"
                              [size]="18"
                          /></span>
                          <div>
                            <p class="text-sm font-semibold text-slate-800">
                              {{ resource.resourceName }}
                            </p>
                            <p class="mt-0.5 text-[11px] text-slate-400">
                              {{ resource.labName || resource.resourceType }}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-4 text-sm font-semibold text-slate-700">
                        {{ resource.bookingCount }}
                      </td>
                      <td class="px-4 py-4 text-sm text-slate-500">
                        {{ resource.actualUsageHours | number: '1.0-1' }}h
                      </td>
                      <td class="px-4 py-4 text-sm text-slate-500">
                        {{ resource.availableHours | number: '1.0-1' }}h
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div class="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              class="h-full rounded-full transition-[width] duration-500"
                              [class.bg-emerald-500]="resource.utilizationRate >= 70"
                              [class.bg-indigo-500]="
                                resource.utilizationRate >= 40 && resource.utilizationRate < 70
                              "
                              [class.bg-amber-500]="resource.utilizationRate < 40"
                              [style.width.%]="clamp(resource.utilizationRate)"
                            ></div>
                          </div>
                          <span class="w-12 text-right text-xs font-bold text-slate-700"
                            >{{ resource.utilizationRate | number: '1.0-1' }}%</span
                          >
                        </div>
                      </td>
                    </tr>
                  }
                  @if (selectedResources().length === 0) {
                    <tr>
                      <td colspan="5" class="px-6 py-14 text-center text-sm text-slate-400">
                        Chưa có dữ liệu sử dụng tài nguyên.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </article>

          <article class="card-surface overflow-hidden">
            <div class="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 class="text-lg font-bold text-slate-950">Người dùng có điểm phạt cao</h2>
              <p class="mt-1 text-xs text-slate-400">Ưu tiên theo dõi trong kỳ</p>
            </div>
            <div class="divide-y divide-slate-100">
              @for (
                user of dashboard().usersWithMostPenaltyPoints.slice(0, 6);
                track user.userId;
                let index = $index
              ) {
                <div class="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-bold"
                    [class.bg-rose-50]="index < 3"
                    [class.text-rose-700]="index < 3"
                    [class.bg-slate-100]="index >= 3"
                    [class.text-slate-500]="index >= 3"
                    >{{ index + 1 }}</span
                  >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-slate-800">{{ user.fullName }}</p>
                    <p class="mt-0.5 truncate text-[11px] text-slate-400">
                      {{ user.departmentName }} • {{ user.activeViolationCount }} vi phạm hoạt động
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-base font-bold text-rose-600">{{ user.penaltyPoints }}</p>
                    <p class="text-[10px] text-slate-400">điểm</p>
                  </div>
                </div>
              }
              @if (dashboard().usersWithMostPenaltyPoints.length === 0) {
                <div class="px-6 py-14 text-center text-sm text-slate-400">
                  Không có người dùng vi phạm trong kỳ.
                </div>
              }
            </div>
          </article>
        </div>

        <div class="grid gap-6 xl:grid-cols-2">
          <article class="card-surface p-5 sm:p-6">
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"
              >
                <app-icon name="flask" [size]="21" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-slate-950">Phòng lab dùng nhiều nhất</h2>
                <p class="text-xs text-slate-400">Xếp hạng theo giờ sử dụng thực tế</p>
              </div>
            </div>
            <div class="mt-6 grid gap-3 sm:grid-cols-3">
              @for (
                lab of dashboard().mostUsedLabRooms.slice(0, 3);
                track lab.resourceId;
                let index = $index
              ) {
                <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-indigo-600">TOP {{ index + 1 }}</span
                    ><span class="text-xs text-slate-400">{{ lab.usageCount }} lượt</span>
                  </div>
                  <p class="mt-4 truncate font-semibold text-slate-800">{{ lab.resourceName }}</p>
                  <p class="mt-1 text-sm font-bold text-slate-950">
                    {{ lab.actualUsageHours | number: '1.0-1' }} giờ
                  </p>
                </div>
              }
              @if (dashboard().mostUsedLabRooms.length === 0) {
                <p class="col-span-3 py-8 text-center text-sm text-slate-400">Chưa có dữ liệu.</p>
              }
            </div>
          </article>

          <article class="card-surface p-5 sm:p-6">
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"
              >
                <app-icon name="microscope" [size]="21" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-slate-950">Thiết bị dùng nhiều nhất</h2>
                <p class="text-xs text-slate-400">Xếp hạng theo giờ sử dụng thực tế</p>
              </div>
            </div>
            <div class="mt-6 grid gap-3 sm:grid-cols-3">
              @for (
                equipment of dashboard().mostUsedEquipments.slice(0, 3);
                track equipment.resourceId;
                let index = $index
              ) {
                <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-cyan-600">TOP {{ index + 1 }}</span
                    ><span class="text-xs text-slate-400">{{ equipment.usageCount }} lượt</span>
                  </div>
                  <p class="mt-4 truncate font-semibold text-slate-800">
                    {{ equipment.resourceName }}
                  </p>
                  <p class="mt-1 text-sm font-bold text-slate-950">
                    {{ equipment.actualUsageHours | number: '1.0-1' }} giờ
                  </p>
                </div>
              }
              @if (dashboard().mostUsedEquipments.length === 0) {
                <p class="col-span-3 py-8 text-center text-sm text-slate-400">Chưa có dữ liệu.</p>
              }
            </div>
          </article>
        </div>
      }
    </section>
  `,
})
export class DashboardPage implements OnInit {
  private readonly workspace = inject(WorkspaceService)
  protected readonly store = inject(AuthStore)
  private readonly toast = inject(ToastService)
  protected readonly dashboard = signal<DashboardResponse>(EMPTY_DASHBOARD)
  protected readonly loading = signal(true)
  protected readonly activePreset = signal(30)
  protected readonly chartColors = [
    '#6366f1',
    '#06b6d4',
    '#8b5cf6',
    '#f59e0b',
    '#10b981',
    '#f43f5e',
  ]
  protected readonly presets = [
    { label: '7 ngày', days: 7 },
    { label: '30 ngày', days: 30 },
    { label: '90 ngày', days: 90 },
    { label: 'Năm nay', days: 365 },
  ]
  protected fromDate = ''
  protected toDate = ''
  protected readonly resourceTab = signal<'labs' | 'equipments'>('labs')

  protected readonly metricCards = computed(() => {
    const data = this.dashboard()
    return [
      {
        label: 'Tổng booking',
        value: this.integer(data.totalBookings),
        icon: 'calendar',
        tone: 'indigo',
      },
      {
        label: 'Usage log',
        value: this.integer(data.totalUsageLogs),
        icon: 'activity',
        tone: 'cyan',
      },
      { label: 'Vi phạm', value: this.integer(data.totalViolations), icon: 'alert', tone: 'rose' },
      {
        label: 'Chi phí bảo trì',
        value: this.moneyCompact(data.totalMaintenanceCost),
        icon: 'wrench',
        tone: 'violet',
      },
      {
        label: 'No-show',
        value: this.integer(data.noShow.noShowCount),
        icon: 'user',
        tone: 'amber',
      },
      {
        label: 'Tỷ lệ No-show',
        value: `${data.noShow.noShowRate.toFixed(1)}%`,
        icon: 'chart',
        tone: 'emerald',
      },
    ]
  })
  protected readonly selectedResources = computed<ResourceUtilizationResponse[]>(() =>
    this.resourceTab() === 'labs'
      ? this.dashboard().labUtilization
      : this.dashboard().equipmentUtilization,
  )
  protected readonly totalUsageHours = computed(() =>
    this.dashboard().usageTrend.reduce((sum, item) => sum + item.totalUsageHours, 0),
  )
  protected readonly usagePointObjects = computed(() => {
    const values = this.dashboard().usageTrend.map((item) => item.usageCount)
    if (values.length === 0) return []
    const max = Math.max(...values, 1)
    return values.map((value, index) => ({
      x: values.length === 1 ? 300 : (index / (values.length - 1)) * 580 + 10,
      y: 170 - (value / max) * 145,
    }))
  })
  protected readonly usageTrendPoints = computed(() =>
    this.usagePointObjects()
      .map((point) => `${point.x},${point.y}`)
      .join(' '),
  )
  protected readonly usageAreaPoints = computed(() => {
    const points = this.usagePointObjects()
    if (points.length === 0) return ''
    return `10,180 ${points.map((point) => `${point.x},${point.y}`).join(' ')} 590,180`
  })
  protected readonly trendLabels = computed(() => {
    const trend = this.dashboard().usageTrend
    if (trend.length <= 5) return trend.map((item) => this.shortDate(item.periodStart))
    const indices = [
      0,
      Math.floor((trend.length - 1) * 0.25),
      Math.floor((trend.length - 1) * 0.5),
      Math.floor((trend.length - 1) * 0.75),
      trend.length - 1,
    ]
    return indices.map((index) => this.shortDate(trend[index]?.periodStart ?? ''))
  })
  protected readonly statusDonut = computed(() =>
    this.buildDonut(this.dashboard().bookingStatusCounts),
  )

  ngOnInit(): void {
    this.applyPreset(30)
  }

  protected applyPreset(days: number): void {
    this.activePreset.set(days)
    const to = new Date()
    const from = new Date()
    if (days === 365) {
      from.setMonth(0, 1)
    } else {
      from.setDate(to.getDate() - days)
    }
    this.toDate = this.dateInput(to)
    this.fromDate = this.dateInput(from)
    this.load()
  }

  protected load(): void {
    if (!this.fromDate || !this.toDate) return
    if (new Date(this.fromDate) > new Date(this.toDate)) {
      this.toast.error('Khoảng ngày không hợp lệ', 'Ngày bắt đầu phải trước ngày kết thúc.')
      return
    }
    this.loading.set(true)
    const from = new Date(`${this.fromDate}T00:00:00`).toISOString()
    const to = new Date(`${this.toDate}T23:59:59`).toISOString()
    this.workspace.dashboard(from, to).subscribe({
      next: (response) => {
        this.dashboard.set(response)
        this.loading.set(false)
      },
      error: (error: unknown) => {
        this.loading.set(false)
        this.dashboard.set(EMPTY_DASHBOARD)
        const message =
          error instanceof ApiError ? error.message : 'Không thể tải dữ liệu dashboard.'
        this.toast.error('Tải dashboard thất bại', message)
      },
    })
  }

  protected statusLabel(value: string): string {
    return (
      (
        {
          Pending: 'Chờ duyệt',
          Approved: 'Đã duyệt',
          Rejected: 'Từ chối',
          Cancelled: 'Đã hủy',
          Completed: 'Hoàn thành',
          NoShow: 'No-show',
        } as Record<string, string>
      )[value] ?? value
    )
  }

  protected purposeLabel(value: string): string {
    return (
      (
        {
          ResearchProject: 'Dự án nghiên cứu',
          CoursePractice: 'Thực hành môn học',
          SelfStudy: 'Tự học',
        } as Record<string, string>
      )[value] ?? value
    )
  }

  protected clamp(value: number): number {
    return Math.max(0, Math.min(100, value))
  }

  private buildDonut(items: CategoryCountResponse[]): string {
    if (items.length === 0 || items.every((item) => item.percentage <= 0))
      return 'conic-gradient(#e2e8f0 0 100%)'
    let cursor = 0
    const slices = items.slice(0, this.chartColors.length).map((item, index) => {
      const start = cursor
      cursor += Math.max(0, item.percentage)
      return `${this.chartColors[index]} ${start}% ${Math.min(cursor, 100)}%`
    })
    if (cursor < 100) slices.push(`#e2e8f0 ${cursor}% 100%`)
    return `conic-gradient(${slices.join(', ')})`
  }

  private dateInput(value: Date): string {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  private shortDate(value: string): string {
    if (!value) return ''
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(
      new Date(value),
    )
  }

  private integer(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value)
  }

  private moneyCompact(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} tr`
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
    return new Intl.NumberFormat('vi-VN').format(value)
  }
}
