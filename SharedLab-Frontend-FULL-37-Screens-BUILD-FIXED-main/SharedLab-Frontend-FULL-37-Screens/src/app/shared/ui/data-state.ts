import { Component, input } from '@angular/core'
import { IconComponent } from './icon'

@Component({
  selector: 'app-data-state',
  imports: [IconComponent],
  template: `
    <div class="flex min-h-64 flex-col items-center justify-center rounded-[26px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><app-icon [name]="icon()" [size]="25" /></div>
      <p class="mt-4 text-base font-black text-slate-800">{{ title() }}</p>
      <p class="mt-2 max-w-md text-sm leading-6 text-slate-500">{{ message() }}</p>
      <ng-content />
    </div>
  `,
})
export class DataStateComponent {
  readonly icon = input('sparkles')
  readonly title = input.required<string>()
  readonly message = input('')
}
