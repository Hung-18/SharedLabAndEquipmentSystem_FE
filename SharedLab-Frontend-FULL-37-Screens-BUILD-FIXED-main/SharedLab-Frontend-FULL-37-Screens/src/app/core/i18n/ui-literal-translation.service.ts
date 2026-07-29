import { DestroyRef, Injectable, effect, inject } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { filter } from 'rxjs'
import { LanguageService } from './language.service'
import { UI_EN_LITERAL_MAP } from './ui-literal-map'

type NodeState = { original: string; translated: string }
type AttributeState = { original: string; translated: string }

const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'] as const
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE'])

@Injectable({ providedIn: 'root' })
export class UiLiteralTranslationService {
  private readonly language = inject(LanguageService)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)
  private readonly textStates = new WeakMap<Text, NodeState>()
  private readonly attributeStates = new WeakMap<Element, Map<string, AttributeState>>()
  private readonly reverseMap = new Map(
    Object.entries(UI_EN_LITERAL_MAP).map(([vi, en]) => [normalize(en), vi]),
  )
  private locale: 'vi' | 'en' = this.language.locale()
  private scheduled = false
  private readonly nativeConfirm = window.confirm.bind(window)
  private readonly nativeAlert = window.alert.bind(window)
  private readonly observer = new MutationObserver(() => {
    if (this.locale === 'en') this.scheduleApply()
  })

  constructor() {
    window.confirm = (message?: string) =>
      this.nativeConfirm(
        this.locale === 'en' ? translateLiteral(String(message ?? '')) : String(message ?? ''),
      )
    window.alert = (message?: unknown) =>
      this.nativeAlert(
        this.locale === 'en' ? translateLiteral(String(message ?? '')) : String(message ?? ''),
      )

    this.observer.observe(document.querySelector('app-root') ?? document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    })

    effect(() => {
      this.locale = this.language.locale()
      this.scheduleApply()
    })

    const subscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.scheduleApply())

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe()
      this.observer.disconnect()
      window.confirm = this.nativeConfirm
      window.alert = this.nativeAlert
    })
  }

  private scheduleApply(): void {
    if (this.scheduled) return
    this.scheduled = true
    queueMicrotask(() => {
      this.scheduled = false
      if (this.locale === 'en') {
        this.translateTree(document.body)
        this.translateDocumentTitle()
      } else {
        this.restoreTree(document.body)
        this.restoreDocumentTitle()
      }
    })
  }

  private translateTree(root: Node): void {
    if (root instanceof Text) {
      this.translateTextNode(root)
      return
    }
    if (!(root instanceof Element) || SKIPPED_TAGS.has(root.tagName)) return
    this.translateAttributes(root)
    for (const child of Array.from(root.childNodes)) this.translateTree(child)
  }

  private restoreTree(root: Node): void {
    if (root instanceof Text) {
      const state = this.textStates.get(root)
      if (state && root.data !== state.original) root.data = state.original
      return
    }
    if (!(root instanceof Element) || SKIPPED_TAGS.has(root.tagName)) return
    const attrs = this.attributeStates.get(root)
    if (attrs) {
      for (const [name, state] of attrs) {
        if (root.getAttribute(name) !== state.original) root.setAttribute(name, state.original)
      }
    }
    for (const child of Array.from(root.childNodes)) this.restoreTree(child)
  }

  private translateTextNode(node: Text): void {
    const parent = node.parentElement
    if (!parent || SKIPPED_TAGS.has(parent.tagName)) return

    const current = node.data
    const previous = this.textStates.get(node)
    if (previous && current === previous.translated) return

    const original = previous && current === previous.original ? previous.original : current
    const translated = translatePreservingWhitespace(original)
    if (!translated || translated === original) return

    this.textStates.set(node, { original, translated })
    node.data = translated
  }

  private translateAttributes(element: Element): void {
    let states = this.attributeStates.get(element)
    for (const name of TRANSLATABLE_ATTRIBUTES) {
      const current = element.getAttribute(name)
      if (!current) continue
      const previous = states?.get(name)
      if (previous && current === previous.translated) continue
      const original = previous && current === previous.original ? previous.original : current
      const translated = translateLiteral(original)
      if (!translated || translated === original) continue
      if (!states) {
        states = new Map<string, AttributeState>()
        this.attributeStates.set(element, states)
      }
      states.set(name, { original, translated })
      element.setAttribute(name, translated)
    }
  }

  private translateDocumentTitle(): void {
    const current = normalize(document.title)
    const translated = UI_EN_LITERAL_MAP[current]
    if (translated) document.title = translated
  }

  private restoreDocumentTitle(): void {
    const original = this.reverseMap.get(normalize(document.title))
    if (original) document.title = original
  }
}

function translatePreservingWhitespace(value: string): string {
  const leading = value.match(/^\s*/)?.[0] ?? ''
  const trailing = value.match(/\s*$/)?.[0] ?? ''
  const core = normalize(value)
  if (!core) return value
  const translated = translateLiteral(core)
  return translated === core ? value : `${leading}${translated}${trailing}`
}

function translateLiteral(value: string): string {
  const normalized = normalize(value)
  const exact = UI_EN_LITERAL_MAP[normalized]
  if (exact) return exact

  const dynamic = translateDynamic(normalized)
  return dynamic ?? value
}

function translateDynamic(value: string): string | null {
  let match: RegExpMatchArray | null
  if ((match = value.match(/^Chào\s+(.+),\s+sẵn sàng nghiên cứu chưa\?$/))) {
    return `Hello ${match[1]}, ready to start your research?`
  }
  if ((match = value.match(/^(\d+)\s+chưa đọc$/))) return `${match[1]} unread`
  if ((match = value.match(/^(\d+)\s+đã chọn$/))) return `${match[1]} selected`
  if ((match = value.match(/^(\d+(?:[.,]\d+)?)\s+giờ$/))) return `${match[1]} hours`
  if ((match = value.match(/^(\d+)\s+lượt$/))) return `${match[1]} uses`
  if ((match = value.match(/^(\d+)\s+người$/))) return `${match[1]} people`
  if ((match = value.match(/^(\d+)\s+lần bảo trì$/))) return `${match[1]} maintenance records`
  if ((match = value.match(/^(\d+)\s+bản ghi(?:\s+sau bộ lọc)?$/))) return `${match[1]} records`
  if ((match = value.match(/^(\d+)\s+điểm(?:\s+phạt)?$/))) return `${match[1]} penalty points`
  if ((match = value.match(/^#(\d+)\s+trong hàng chờ$/))) return `#${match[1]} in the waitlist`
  if ((match = value.match(/^Phòng\s+#(\d+)$/))) return `Laboratory #${match[1]}`
  if ((match = value.match(/^Thiết bị\s+#(\d+)$/))) return `Equipment #${match[1]}`
  if ((match = value.match(/^(?:Người dùng|Mã người dùng)\s+#(\d+)$/))) return `User #${match[1]}`
  if ((match = value.match(/^Bảo trì\s+#(?:MT-)?(\d+)$/))) return `Maintenance #${match[1]}`
  if ((match = value.match(/^Trang\s+(\d+)\s*\/\s*(\d+)$/))) return `Page ${match[1]} / ${match[2]}`
  if ((match = value.match(/^Đang hiển thị\s+(.+)$/))) return `Showing ${match[1]}`
  return null
}

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}
