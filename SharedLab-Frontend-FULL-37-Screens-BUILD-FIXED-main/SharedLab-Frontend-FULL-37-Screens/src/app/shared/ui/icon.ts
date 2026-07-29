import { Component, input } from '@angular/core'

@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('flask') {
          <path d="M9 3h6" />
          <path d="M10 3v6.2L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.2V3" />
          <path d="M7.5 16h9" />
        }
        @case ('dashboard') {
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        }
        @case ('home') {
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        }
        @case ('bell') {
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        }
        @case ('user') {
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        }
        @case ('logout') {
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M15 3h5a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5" />
        }
        @case ('menu') {
          <path d="M4 6h16M4 12h16M4 18h16" />
        }
        @case ('calendar') {
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        }
        @case ('activity') {
          <path d="M3 12h4l2-7 4 14 2-7h6" />
        }
        @case ('alert') {
          <path
            d="M10.3 3.7 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z"
          />
          <path d="M12 9v4M12 17h.01" />
        }
        @case ('check') {
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        }
        @case ('shield') {
          <path d="M12 3 4 6v5c0 5.2 3.4 8.5 8 10 4.6-1.5 8-4.8 8-10V6l-8-3Z" />
          <path d="m9 12 2 2 4-4" />
        }
        @case ('mail') {
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        }
        @case ('lock') {
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        }
        @case ('eye') {
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        }
        @case ('eye-off') {
          <path d="m3 3 18 18" />
          <path d="M10.6 6.2A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3 3.8" />
          <path d="M6.5 6.5C3.5 8.3 2 12 2 12s3.5 6 10 6a10 10 0 0 0 4-.8" />
        }
        @case ('arrow-left') {
          <path d="m15 18-6-6 6-6" />
        }
        @case ('arrow-right') {
          <path d="m9 18 6-6-6-6" />
        }
        @case ('refresh') {
          <path d="M20 7v5h-5" />
          <path d="M4 17v-5h5" />
          <path d="M6.1 8A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 11.9-2" />
        }
        @case ('chart') {
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        }
        @case ('wrench') {
          <path
            d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L5 16l3 3 6.7-7.3a4 4 0 0 0 5-5L17.4 9 15 6.6l2.3-2.3a4 4 0 0 0-2.6 2Z"
          />
        }
        @case ('building') {
          <path d="M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2M17 13h1M17 17h1M2 21h20" />
        }
        @case ('microscope') {
          <path d="m6 18 4-4M7 3l4 4-3 3-4-4 3-3ZM10 7l5 5" />
          <path d="M14 10a5 5 0 1 1-7 7" />
          <path d="M5 21h14" />
        }
        @case ('sparkles') {
          <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" />
          <path
            d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14ZM5 13l.7 2.3L8 16l-2.3.7L5 19l-.7-2.3L2 16l2.3-.7L5 13Z"
          />
        }
        @case ('filter') {
          <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        }
        @case ('chevron-down') {
          <path d="m6 9 6 6 6-6" />
        }
        @case ('x') {
          <path d="M6 6l12 12M18 6 6 18" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('edit') {
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        }
        @case ('trash') {
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6" />
        }
        @case ('save') {
          <path d="M5 3h12l3 3v15H4V3h1Z" />
          <path d="M8 3v6h8V3M8 21v-7h8v7" />
        }
        @case ('download') {
          <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
        }
        @case ('send') {
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        }
        @case ('calendar-plus') {
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18M12 13v5M9.5 15.5h5" />
        }
        @case ('book-open') {
          <path d="M2 4h6a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H2Z" />
          <path d="M22 4h-6a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h6Z" />
        }
        @case ('grid') {
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        }
        @case ('list') {
          <path d="M8 6h13M8 12h13M8 18h13" />
          <circle cx="3" cy="6" r="1" />
          <circle cx="3" cy="12" r="1" />
          <circle cx="3" cy="18" r="1" />
        }
        @case ('users') {
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
        }
        @case ('user-plus') {
          <path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8" cy="7" r="4" />
          <path d="M19 8v6M16 11h6" />
        }
        @case ('user-x') {
          <path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8" cy="7" r="4" />
          <path d="m17 8 5 5M22 8l-5 5" />
        }
        @case ('map-pin') {
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        }
        @case ('chevron-left') {
          <path d="m15 18-6-6 6-6" />
        }
        @case ('chevron-right') {
          <path d="m9 18 6-6-6-6" />
        }
        @case ('clipboard') {
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4" />
        }
        @case ('hourglass') {
          <path d="M6 2h12M6 22h12M8 2v5l4 5-4 5v5M16 2v5l-4 5 4 5v5" />
        }
        @case ('inbox') {
          <path d="M4 4h16l2 10v6H2v-6Z" />
          <path d="M2 14h5l2 3h6l2-3h5" />
        }
        @case ('layers') {
          <path d="m12 2 9 5-9 5-9-5Z" />
          <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
        }
        @case ('history') {
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5M12 7v5l3 2" />
        }
        @case ('settings') {
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"
          />
        }
        @case ('shield-alert') {
          <path d="M12 3 4 6v5c0 5.2 3.4 8.5 8 10 4.6-1.5 8-4.8 8-10V6l-8-3Z" />
          <path d="M12 8v5M12 17h.01" />
        }
        @case ('lightbulb') {
          <path
            d="M9 18h6M10 22h4M8.5 15.5A7 7 0 1 1 15.5 15.5C14.5 16.3 14 17 14 18h-4c0-1-.5-1.7-1.5-2.5Z"
          />
        }
        @case ('pause') {
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        }
        @case ('play') {
          <path d="m8 5 11 7-11 7Z" />
        }
        @case ('login') {
          <path d="M14 8l4 4-4 4M18 12H5" />
          <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
        }
        @default {
          <circle cx="12" cy="12" r="9" />
        }
      }
    </svg>
  `,
})
export class IconComponent {
  readonly name = input.required<string>()
  readonly size = input(20)
}
