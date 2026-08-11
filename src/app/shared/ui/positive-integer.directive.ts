import { Directive, ElementRef, HostListener, inject } from '@angular/core'

const message = 'Vui lòng chỉ nhập số nguyên dương'
const blockedKeys = new Set(['e', 'E', '+', '-', '.', ' ', ','])

@Directive({
  selector: 'input[appPositiveInteger]',
})
export class PositiveIntegerDirective {
  private readonly element = inject(ElementRef<HTMLInputElement>).nativeElement

  constructor() {
    this.element.inputMode = 'numeric'
    this.element.pattern = '[0-9]*'
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!blockedKeys.has(event.key)) return
    event.preventDefault()
    this.showError()
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? ''
    if (/^[1-9]\d*$/.test(text.trim())) return
    event.preventDefault()
    this.showError()
  }

  @HostListener('input')
  onInput(): void {
    const value = this.element.value
    if (!value || /^[1-9]\d*$/.test(value)) {
      this.element.setCustomValidity('')
      return
    }
    this.showError()
  }

  private showError(): void {
    this.element.setCustomValidity(message)
    this.element.reportValidity()
  }
}
