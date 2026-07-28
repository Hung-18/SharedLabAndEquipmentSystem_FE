import { Component, computed, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { TranslatePipe } from '@ngx-translate/core'
import { AuthStore } from '../../core/auth/auth.store'
import { landingPath } from '../../core/auth/auth.guard'
import { IconComponent } from '../../shared/ui/icon'
import { LanguageSwitcherComponent } from '../../shared/ui/language-switcher'

@Component({
  selector: 'app-homepage-page',
  imports: [RouterLink, TranslatePipe, IconComponent, LanguageSwitcherComponent],
  template: `
    <main class="min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-950">
      <section class="relative isolate overflow-hidden bg-[#101936] text-white">
        <div
          class="pointer-events-none absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-violet-500/25 blur-3xl"
        ></div>
        <div
          class="pointer-events-none absolute right-[-6rem] -bottom-48 h-[36rem] w-[36rem] rounded-full bg-cyan-400/20 blur-3xl"
        ></div>
        <div
          class="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:30px_30px] opacity-[.08]"
        ></div>

        <header
          class="relative mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12"
        >
          <a routerLink="/" class="flex items-center gap-3" aria-label="Shared Lab homepage">
            <span
              class="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-violet-400 to-cyan-300 text-[#101936] shadow-xl shadow-violet-950/30"
              ><app-icon name="flask" [size]="24"
            /></span>
            <span
              ><strong class="block text-[11px] tracking-[.24em] text-cyan-300 uppercase"
                >Shared Lab</strong
              ><span class="mt-1 block text-sm font-black">Booking System</span></span
            >
          </a>
          <nav class="hidden items-center gap-7 text-sm font-bold text-white/60 md:flex">
            <a href="#features" class="transition hover:text-white">{{
              'landing.features' | translate
            }}</a>
            <a href="#workflow" class="transition hover:text-white">{{
              'landing.workflow' | translate
            }}</a>
            <a href="#resources" class="transition hover:text-white">{{
              'landing.resources' | translate
            }}</a>
          </nav>
          <div class="flex items-center gap-2">
            <app-language-switcher tone="dark" />
            <a
              [routerLink]="primaryRoute()"
              class="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-xs font-black text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/15"
            >
              {{ (store.isAuthenticated() ? 'landing.enter' : 'landing.login') | translate }}
              <app-icon name="arrow-right" [size]="16" />
            </a>
          </div>
        </header>

        <div
          class="relative mx-auto grid max-w-[1440px] gap-14 px-5 pt-14 pb-20 sm:px-8 sm:pt-20 sm:pb-28 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-12 lg:pb-32"
        >
          <div class="max-w-3xl">
            <span
              class="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-200 backdrop-blur-sm"
              ><app-icon name="sparkles" [size]="16" /> {{ 'landing.badge' | translate }}</span
            >
            <h1
              class="mt-7 text-5xl leading-[1.02] font-black tracking-[-.055em] sm:text-6xl lg:text-7xl"
            >
              {{ 'landing.hero1' | translate }}<br /><span
                class="bg-linear-to-r from-violet-300 via-indigo-300 to-cyan-300 bg-clip-text text-transparent"
                >{{ 'landing.hero2' | translate }}</span
              >
            </h1>
            <p class="mt-7 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
              {{ 'landing.subtitle' | translate }}
            </p>
            <div class="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                [routerLink]="primaryRoute()"
                class="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-500 to-indigo-500 px-6 text-sm font-black text-white shadow-2xl shadow-violet-950/35 transition hover:-translate-y-1 hover:shadow-violet-950/50"
                >{{ (store.isAuthenticated() ? 'landing.open' : 'landing.start') | translate
                }}<app-icon name="arrow-right" [size]="18"
              /></a>
              <a
                href="#features"
                class="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[.07] px-6 text-sm font-black text-white/85 backdrop-blur-sm transition hover:bg-white/12 hover:text-white"
                ><app-icon name="play" [size]="17" /> {{ 'landing.explore' | translate }}</a
              >
            </div>
            <div class="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              @for (stat of stats; track stat.labelKey) {
                <div class="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-sm">
                  <p class="text-xl font-black sm:text-2xl">{{ stat.value }}</p>
                  <p class="mt-1 text-[11px] font-semibold text-white/40">
                    {{ stat.labelKey | translate }}
                  </p>
                </div>
              }
            </div>
          </div>

          <div class="relative mx-auto w-full max-w-[620px]">
            <div
              class="absolute -inset-6 rounded-[44px] bg-linear-to-br from-violet-500/25 to-cyan-400/10 blur-2xl"
            ></div>
            <div
              class="relative overflow-hidden rounded-[34px] border border-white/12 bg-white/[.08] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-5"
            >
              <div class="rounded-[26px] bg-white p-5 text-slate-950 shadow-2xl sm:p-6">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="text-[10px] font-black tracking-[.18em] text-indigo-500 uppercase">
                      {{ 'landing.preview.eyebrow' | translate }}
                    </p>
                    <h2 class="mt-2 text-xl font-black">
                      {{ 'landing.preview.today' | translate }}
                    </h2>
                  </div>
                  <span
                    class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[10px] font-black text-emerald-700"
                    ><i class="h-2 w-2 rounded-full bg-emerald-500"></i>
                    {{ 'landing.preview.online' | translate }}</span
                  >
                </div>
                <div class="mt-6 grid grid-cols-3 gap-3">
                  @for (card of previewCards; track card.labelKey) {
                    <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <span
                        class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
                        ><app-icon [name]="card.icon" [size]="18"
                      /></span>
                      <p class="mt-4 text-2xl font-black">{{ card.value }}</p>
                      <p class="mt-1 text-[10px] font-bold text-slate-400">
                        {{ card.labelKey | translate }}
                      </p>
                    </div>
                  }
                </div>
                <div class="mt-5 rounded-2xl border border-slate-100 p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-black">
                        {{ 'landing.preview.utilization' | translate }}
                      </p>
                      <p class="mt-1 text-[10px] text-slate-400">
                        {{ 'landing.preview.utilizationHint' | translate }}
                      </p>
                    </div>
                    <span
                      class="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700"
                      >72%</span
                    >
                  </div>
                  <div class="mt-5 flex h-28 items-end gap-2">
                    @for (bar of bars; track $index) {
                      <span
                        class="flex-1 rounded-t-lg bg-linear-to-t from-indigo-600 to-cyan-400"
                        [style.height.%]="bar"
                      ></span>
                    }
                  </div>
                </div>
                <div class="mt-5 grid gap-3 sm:grid-cols-2">
                  <div class="rounded-2xl bg-[#101936] p-4 text-white">
                    <div class="flex items-center gap-3">
                      <span
                        class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-cyan-300"
                        ><app-icon name="calendar" [size]="19"
                      /></span>
                      <div>
                        <p class="text-xs font-black">
                          {{ 'landing.preview.controlled' | translate }}
                        </p>
                        <p class="mt-1 text-[10px] text-white/45">
                          {{ 'landing.preview.controlledHint' | translate }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div class="flex items-center gap-3">
                      <span
                        class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
                        ><app-icon name="wrench" [size]="19"
                      /></span>
                      <div>
                        <p class="text-xs font-black">
                          {{ 'landing.preview.maintenance' | translate }}
                        </p>
                        <p class="mt-1 text-[10px] text-slate-400">
                          {{ 'landing.preview.maintenanceHint' | translate }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div class="mx-auto max-w-3xl text-center">
          <p class="text-xs font-black tracking-[.2em] text-indigo-600 uppercase">
            {{ 'landing.featureSection.eyebrow' | translate }}
          </p>
          <h2 class="mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl">
            {{ 'landing.featureSection.title' | translate }}
          </h2>
          <p class="mt-5 text-sm leading-7 text-slate-500 sm:text-base">
            {{ 'landing.featureSection.subtitle' | translate }}
          </p>
        </div>
        <div class="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          @for (feature of features; track feature.titleKey) {
            <article
              class="group rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,.055)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_70px_rgba(79,70,229,.12)]"
            >
              <span
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white"
                ><app-icon [name]="feature.icon" [size]="22"
              /></span>
              <h3 class="mt-5 text-lg font-black">{{ feature.titleKey | translate }}</h3>
              <p class="mt-3 text-sm leading-6 text-slate-500">
                {{ feature.descriptionKey | translate }}
              </p>
            </article>
          }
        </div>
      </section>

      <section id="workflow" class="bg-white py-20 lg:py-28">
        <div
          class="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-12"
        >
          <div>
            <p class="text-xs font-black tracking-[.2em] text-violet-600 uppercase">
              {{ 'landing.workflowSection.eyebrow' | translate }}
            </p>
            <h2 class="mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl">
              {{ 'landing.workflowSection.title' | translate }}
            </h2>
            <p class="mt-5 text-sm leading-7 text-slate-500 sm:text-base">
              {{ 'landing.workflowSection.subtitle' | translate }}
            </p>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            @for (step of workflow; track step.number) {
              <div class="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                <div class="flex items-center justify-between">
                  <span class="text-3xl font-black text-indigo-200">{{ step.number }}</span
                  ><span
                    class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm"
                    ><app-icon [name]="step.icon" [size]="19"
                  /></span>
                </div>
                <h3 class="mt-5 font-black">{{ step.titleKey | translate }}</h3>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  {{ step.descriptionKey | translate }}
                </p>
              </div>
            }
          </div>
        </div>
      </section>

      <section id="resources" class="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div
          class="overflow-hidden rounded-[36px] bg-[#101936] p-7 text-white shadow-2xl shadow-indigo-950/15 sm:p-10 lg:flex lg:items-center lg:justify-between lg:p-14"
        >
          <div class="max-w-2xl">
            <p class="text-xs font-black tracking-[.2em] text-cyan-300 uppercase">
              {{ 'landing.cta.eyebrow' | translate }}
            </p>
            <h2 class="mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl">
              {{ 'landing.cta.title' | translate }}
            </h2>
            <p class="mt-5 text-sm leading-7 text-white/55 sm:text-base">
              {{ 'landing.cta.subtitle' | translate }}
            </p>
          </div>
          <a
            [routerLink]="primaryRoute()"
            class="mt-8 inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-[#101936] transition hover:-translate-y-1 hover:shadow-xl lg:mt-0"
            >{{ (store.isAuthenticated() ? 'landing.enter' : 'landing.cta.button') | translate
            }}<app-icon name="arrow-right" [size]="18"
          /></a>
        </div>
      </section>

      <footer class="border-t border-slate-200 bg-white">
        <div
          class="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"
        >
          <p>© 2026 Shared Lab & Equipment Booking System</p>
          <p>{{ 'landing.footer' | translate }}</p>
        </div>
      </footer>
    </main>
  `,
})
export class HomepagePage {
  protected readonly store = inject(AuthStore)
  protected readonly primaryRoute = computed(() =>
    this.store.isAuthenticated() ? landingPath(this.store.role()) : '/login',
  )
  protected readonly stats = [
    { value: '24/7', labelKey: 'landing.stats.access' },
    { value: '3', labelKey: 'landing.stats.roles' },
    { value: 'Realtime', labelKey: 'landing.stats.live' },
  ]
  protected readonly previewCards = [
    { icon: 'calendar', value: '128', labelKey: 'landing.preview.monthBookings' },
    { icon: 'microscope', value: '42', labelKey: 'landing.preview.activeEquipment' },
    { icon: 'building', value: '12', labelKey: 'landing.preview.labs' },
  ]
  protected readonly bars = [34, 56, 42, 72, 64, 88, 70, 92, 78, 68, 84, 74]
  protected readonly features = [
    {
      icon: 'calendar-plus',
      titleKey: 'landing.featureItems.booking.title',
      descriptionKey: 'landing.featureItems.booking.description',
    },
    {
      icon: 'microscope',
      titleKey: 'landing.featureItems.resources.title',
      descriptionKey: 'landing.featureItems.resources.description',
    },
    {
      icon: 'wrench',
      titleKey: 'landing.featureItems.maintenance.title',
      descriptionKey: 'landing.featureItems.maintenance.description',
    },
    {
      icon: 'chart',
      titleKey: 'landing.featureItems.dashboard.title',
      descriptionKey: 'landing.featureItems.dashboard.description',
    },
  ]
  protected readonly workflow = [
    {
      number: '01',
      icon: 'search',
      titleKey: 'landing.workflowItems.resource.title',
      descriptionKey: 'landing.workflowItems.resource.description',
    },
    {
      number: '02',
      icon: 'calendar',
      titleKey: 'landing.workflowItems.time.title',
      descriptionKey: 'landing.workflowItems.time.description',
    },
    {
      number: '03',
      icon: 'check',
      titleKey: 'landing.workflowItems.approval.title',
      descriptionKey: 'landing.workflowItems.approval.description',
    },
    {
      number: '04',
      icon: 'activity',
      titleKey: 'landing.workflowItems.usage.title',
      descriptionKey: 'landing.workflowItems.usage.description',
    },
  ]
}
