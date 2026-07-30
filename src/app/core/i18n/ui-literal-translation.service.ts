import { DestroyRef, Injectable, effect, inject } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { filter } from 'rxjs'
import { LanguageService } from './language.service'
import { UI_EN_LITERAL_MAP } from './ui-literal-map'

type NodeState = { original: string; translated: string }
type AttributeState = { original: string; translated: string }

const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'] as const
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE'])

const UI_EN_OVERRIDES: Readonly<Record<string, string>> = {
  'Shared Lab Workspace': 'Shared Lab Workspace',
  'Không gian phòng thí nghiệm dùng chung': 'Shared Lab Workspace',
  'Tạo lịch đặt': 'Create booking',
  'Lịch đặt': 'Booking',
  'Lịch đặt và bảo trì': 'Bookings and maintenance',
  'Lịch đặt của tôi': 'My bookings',
  'Quản lý lịch đặt': 'Booking management',
  'Yêu cầu cần duyệt': 'Pending approvals',
  'Bảng điều khiển': 'Dashboard',
  'Nhật ký kiểm toán': 'Audit logs',
  'Nhật ký sử dụng': 'Usage history',
  'Lượt sử dụng': 'Usage records',
  'Không đến': 'No-show',
  'Tỷ lệ không đến': 'No-show rate',
  'Tên đăng nhập': 'Username',
  'Mã người dùng': 'User ID',
  'Bạn có thể sử dụng đầy đủ các chức năng theo vai trò được cấp.':
    'You can use all functions available to your assigned role.',
  'Mật khẩu mới không được trùng với mật khẩu hiện tại.':
    'The new password must be different from the current password.',
  'Hãy kiểm tra lại khung giờ sau khi thay đổi tài nguyên hoặc thời gian':
    'Check availability again after changing resources or time.',
  'Khung giờ chưa được kiểm tra hoặc kết quả kiểm tra đã hết hiệu lực':
    'The time slot has not been checked, or the previous result is no longer valid.',
  'Khung giờ vừa phát sinh xung đột': 'A scheduling conflict has just occurred',
  'Đã chọn một khung giờ thay thế đã được kiểm tra.':
    'A verified alternative time slot has been selected.',
  'Bạn không có quyền check-in booking này': 'You cannot check in for this booking.',
  'Bạn không có quyền check-out booking này': 'You cannot check out from this booking.',
  'Bạn không có quyền báo sự cố cho booking này':
    'You cannot report an incident for this booking.',
  'Ngày': 'Day',
  'Tuần': 'Week',
  'Tháng': 'Month',
  'Danh sách': 'List',
  'Phòng thí nghiệm': 'Laboratory',
  'Tất cả phòng': 'All laboratories',
  'Tất cả thiết bị': 'All equipment',
  'Loại sự kiện': 'Event type',
  'Sự kiện trong kỳ': 'Events in this period',
  'Không có sự kiện': 'No events',
  'Ngày này chưa có lịch đặt hoặc bảo trì.': 'There are no bookings or maintenance events on this day.',
  'Hãy đổi khoảng thời gian hoặc bộ lọc để xem lịch tài nguyên.':
    'Change the period or filters to view the resource calendar.',
  'Theo dõi lịch đặt và bảo trì theo ngày, tuần, tháng hoặc dạng danh sách.':
    'View bookings and maintenance by day, week, month, or list.',
  'Booking chưa có lượt check-in': 'This booking has no check-in record.',
  'Booking chưa kết thúc': 'The booking has not ended yet.',
  'Booking không còn đủ điều kiện để hủy': 'This booking can no longer be cancelled.',
  'Booking không thuộc người dùng đã chọn': 'The booking does not belong to the selected user.',
  'Bạn chỉ có thể chỉnh sửa booking của chính mình': 'You can only edit your own booking.',
  'Bạn đã đọc hết thông báo': 'You have read all notifications.',
  'Bắt đầu lịch bảo trì': 'Start maintenance',
  'Chi phí không âm; chu kỳ lặp và ngày kết thúc phải hợp lệ.':
    'Cost cannot be negative; the recurrence interval and end date must be valid.',
  'Chưa đến thời gian bắt đầu': 'The start time has not been reached.',
  'Chỉ booking đang chờ duyệt mới được chỉnh sửa': 'Only pending bookings can be edited.',
  'Chỉ có thể hoàn thành booking sau giờ kết thúc':
    'A booking can only be completed after its end time.',
  'Chỉ có thể đánh dấu NoShow sau 30 phút kể từ giờ bắt đầu':
    'No-show can only be recorded 30 minutes after the start time.',
  'Hãy chọn phòng lab và nhập tên thiết bị': 'Select a laboratory and enter the equipment name.',
  'Hãy nhập đầy đủ tên phòng, mã phòng, vị trí, sức chứa và LabManager':
    'Enter the laboratory name, room code, location, capacity, and lab manager.',
  'Không thể gửi liên kết đặt lại mật khẩu.': 'Unable to send the password reset link.',
  'Không thể gửi thông báo. Vui lòng thử lại.': 'Unable to send the notification. Please try again.',
  'Không tải được danh sách LabManager đang hoạt động':
    'Unable to load the list of active lab managers.',
  'Không tải được dữ liệu tạo tài khoản': 'Unable to load account creation data.',
  'Không tải được người dùng': 'Unable to load users.',
  'Không tải được nhật ký sử dụng': 'Unable to load usage history.',
  'Không tải được vai trò hoặc khoa/phòng ban. Hãy kiểm tra API rồi tải lại dữ liệu.':
    'Unable to load roles or departments. Check the service and reload the data.',
  'Không tải được vi phạm liên quan': 'Unable to load related violations.',
  'Không xác minh được booking': 'Unable to verify the booking.',
  'Kiểm tra trạng thái và xung đột thời gian.': 'Check the status and scheduling conflicts.',
  'Kiểm tra tài nguyên, thời gian tương lai, chi phí và cấu hình lặp.':
    'Check the resource, future time, cost, and recurrence settings.',
  'Lịch bảo trì đã quá thời gian kết thúc': 'The maintenance period has already ended.',
  'Mật khẩu có ít nhất 8 ký tự, chữ hoa, chữ thường và số':
    'Use at least 8 characters with uppercase, lowercase, and numbers.',
  'Một phần báo cáo chưa tải được': 'Some report data could not be loaded.',
  'Một phần danh mục tài nguyên chưa tải được, lịch vẫn tiếp tục hoạt động.':
    'Some resource data could not be loaded, but the calendar remains available.',
  'Nếu email tồn tại, hệ thống đã gửi liên kết đặt lại mật khẩu.':
    'If the email exists, a password reset link has been sent.',
  'Thông tin bảo trì chưa hợp lệ': 'The maintenance information is invalid.',
  'Thời gian checkout phải sau check-in và không được ở tương lai':
    'Check-out must be after check-in and cannot be in the future.',
  'Tài khoản hiện tại chưa được cấp quyền gửi thông báo.':
    'The current account is not allowed to send notifications.',
  'Tên, username hoặc email...': 'Name, username, or email...',
  'Tìm người dùng': 'Search users',
  'Tải lại': 'Reload',
  'Vui lòng nhập tên phòng, vị trí và sức chứa hợp lệ':
    'Enter a valid laboratory name, location, and capacity.',
  'Vẫn còn tài nguyên chưa check-out': 'Some resources have not been checked out.',
  'Đang tải...': 'Loading...',
  'Đánh dấu booking hoàn thành': 'Mark booking as completed',
  'Đánh dấu người dùng không đến': 'Mark requester as no-show',
  'Đã xảy ra lỗi. Vui lòng thử lại.': 'An error occurred. Please try again.',
  'Đã đọc hết': 'All read',
  'Bạn không có quyền duyệt booking này': 'You are not allowed to approve this booking.',
  'Bạn không có quyền từ chối booking này': 'You are not allowed to reject this booking.',
  'Chỉ có thể đánh dấu không đến sau 30 phút kể từ giờ bắt đầu':
    'No-show can only be recorded 30 minutes after the start time.',
  'Chỉ được đánh dấu không đến sau 30 phút kể từ giờ bắt đầu':
    'No-show can only be recorded 30 minutes after the start time.',
  'Các trường có dấu * là bắt buộc. Tên đăng nhập và email phải duy nhất.':
    'Fields marked with * are required. Username and email must be unique.',
  'Hãy kiểm tra lại và chọn một khung giờ thay thế.':
    'Check again and choose an alternative time slot.',
  'Hãy nhập đầy đủ tên phòng, mã phòng, vị trí, sức chứa và người quản lý phòng thí nghiệm':
    'Enter the laboratory name, room code, location, capacity, and lab manager.',
  'Khung giờ có thể vừa phát sinh xung đột hoặc lịch đặt không còn ở trạng thái chờ duyệt.':
    'The time slot may now conflict, or the booking is no longer pending.',
  'Không thể đổi vai trò của quản lý phòng thí nghiệm khi người này vẫn đang được phân công quản lý phòng lab.':
    'The lab manager role cannot be changed while the user is still assigned to a laboratory.',
  'Không tải được danh sách quản lý phòng thí nghiệm đang hoạt động':
    'Unable to load active lab managers.',
  'Kiểm tra lần cuối trước khi gửi booking ở trạng thái chờ duyệt.':
    'Review the information before submitting the pending booking.',
  'Kiểm tra lịch trước khi gửi. Yêu cầu chờ duyệt không khóa tài nguyên; lịch đặt chỉ giữ khung giờ sau khi được duyệt.':
    'Check the calendar before submitting. Pending requests do not block resources; a time slot is reserved only after approval.',
  'Liên hệ quản lý phòng thí nghiệm để được hướng dẫn trước khi sử dụng.':
    'Contact the lab manager for instructions before use.',
  'Liên hệ quản lý phòng thí nghiệm để được hướng dẫn.':
    'Contact the lab manager for instructions.',
  'Lịch đặt đã có lượt vào nên không thể đánh dấu không đến':
    'This booking already has a check-in and cannot be marked as no-show.',
  'Nút chỉ được bật khi lịch đặt đáp ứng đúng điều kiện thời gian và nhật ký sử dụng.':
    'The action is enabled only when the booking meets the time and usage-history conditions.',
  'Quản lý phòng thí nghiệm': 'Lab manager',
  'Quản lý phòng thí nghiệm *': 'Lab manager *',
  'Quản lý phòng thí nghiệm chỉ chọn được tài nguyên thuộc phạm vi được phân công.':
    'Lab managers can only select resources within their assigned scope.',
  'Quản trị viên có thể bổ sung thiết bị từ màn hình quản lý thiết bị.':
    'Administrators can add equipment from the equipment management screen.',
  'Quản trị viên quản lý hệ thống; quản lý phòng thí nghiệm xử lý tài nguyên được phân công; người đặt lịch sử dụng luồng đặt lịch cá nhân.':
    'Administrators manage the system; lab managers handle assigned resources; requesters use the personal booking flow.',
  'Sự cố sẽ chờ quản lý phòng thí nghiệm xác nhận nếu cần.':
    'The incident will be reviewed by a lab manager when required.',
  'Tài khoản hiện không được phép tạo hoặc chỉnh sửa lịch đặt':
    'This account is not allowed to create or edit bookings.',
  'Tài khoản đang ngừng hoạt động. Hãy liên hệ quản trị viên.':
    'This account is inactive. Contact an administrator.',
  'Tài khoản đã bị khóa và cần quản trị viên mở lại.':
    'This account is locked and must be unlocked by an administrator.',
  'Tài khoản đã bị khóa. Hãy liên hệ quản trị viên để được hỗ trợ.':
    'This account is locked. Contact an administrator for support.',
  'Tên đăng nhập *': 'Username *',
  'Tên đăng nhập hoặc email có thể đã được sử dụng.':
    'The username or email may already be in use.',
  'Đánh dấu không đến': 'Mark as no-show',
  'Đổi quản lý phòng thí nghiệm': 'Change lab manager',
  'Sửa booking': 'Edit booking',
}

const PHRASE_FALLBACKS: readonly [RegExp, string][] = [
  [/\bPhòng thí nghiệm\b/gi, 'Laboratory'],
  [/\bphòng lab\b/gi, 'laboratory'],
  [/\bThiết bị\b/gi, 'Equipment'],
  [/\bBảo trì\b/gi, 'Maintenance'],
  [/\bLịch tài nguyên\b/gi, 'Resource calendar'],
  [/\bTrạng thái\b/gi, 'Status'],
  [/\bTất cả\b/gi, 'All'],
  [/\bĐã duyệt\b/gi, 'Approved'],
  [/\bChờ duyệt\b/gi, 'Pending'],
  [/\bĐã hủy\b/gi, 'Cancelled'],
  [/\bHoàn thành\b/gi, 'Completed'],
  [/\bĐang thực hiện\b/gi, 'In progress'],
  [/\bĐã lên lịch\b/gi, 'Scheduled'],
  [/\bKhông có\b/gi, 'No'],
  [/\bChưa có\b/gi, 'No'],
  [/\bTạo\b/gi, 'Create'],
  [/\bChỉnh sửa\b/gi, 'Edit'],
  [/\bXóa\b/gi, 'Delete'],
  [/\bHủy\b/gi, 'Cancel'],
  [/\bLưu\b/gi, 'Save'],
  [/\bGửi\b/gi, 'Send'],
  [/\bQuay lại\b/gi, 'Back'],
  [/\bTiếp tục\b/gi, 'Continue'],
  [/\bTìm kiếm\b/gi, 'Search'],
  [/\bTải lại\b/gi, 'Reload'],
  [/\bNgười dùng\b/gi, 'User'],
  [/\bQuản trị viên\b/gi, 'Administrator'],
  [/\bQuản lý phòng lab\b/gi, 'Lab manager'],
  [/\bNgười đặt lịch\b/gi, 'Requester'],
  [/\bThông báo\b/gi, 'Notification'],
  [/\bVi phạm\b/gi, 'Violation'],
  [/\bHàng chờ\b/gi, 'Waitlist'],
  [/\bMục đích\b/gi, 'Purpose'],
  [/\bThời gian\b/gi, 'Time'],
  [/\bBắt đầu\b/gi, 'Start'],
  [/\bKết thúc\b/gi, 'End'],
  [/\bHôm nay\b/gi, 'Today'],
  [/\bĐang tải\b/gi, 'Loading'],
  [/\bKhông thể\b/gi, 'Unable to'],
  [/\bVui lòng\b/gi, 'Please'],
  [/\bKiểm tra\b/gi, 'Check'],
]

@Injectable({ providedIn: 'root' })
export class UiLiteralTranslationService {
  private readonly language = inject(LanguageService)
  private readonly router = inject(Router)
  private readonly destroyRef = inject(DestroyRef)
  private readonly textStates = new WeakMap<Text, NodeState>()
  private readonly attributeStates = new WeakMap<Element, Map<string, AttributeState>>()
  private readonly reverseMap = new Map(
    [...Object.entries(UI_EN_LITERAL_MAP), ...Object.entries(UI_EN_OVERRIDES)].map(([vi, en]) => [
      normalize(String(en)),
      vi,
    ]),
  )
  private readonly pendingNodes = new Set<Node>()
  private locale: 'vi' | 'en' = this.language.locale()
  private scheduled = false
  private readonly nativeConfirm = window.confirm.bind(window)
  private readonly nativeAlert = window.alert.bind(window)
  private readonly observer = new MutationObserver((mutations) => {
    if (this.locale !== 'en') return
    for (const mutation of mutations) {
      if (mutation.type === 'characterData' || mutation.type === 'attributes') {
        this.pendingNodes.add(mutation.target)
      }
      for (const node of Array.from(mutation.addedNodes)) this.pendingNodes.add(node)
    }
    this.schedulePendingApply()
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
      this.scheduleFullApply()
    })

    const subscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.scheduleFullApply())

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe()
      this.observer.disconnect()
      window.confirm = this.nativeConfirm
      window.alert = this.nativeAlert
    })
  }

  private scheduleFullApply(): void {
    this.pendingNodes.clear()
    this.pendingNodes.add(document.body)
    this.schedulePendingApply(true)
  }

  private schedulePendingApply(forceRestore = false): void {
    if (this.scheduled) return
    this.scheduled = true
    queueMicrotask(() => {
      this.scheduled = false
      const nodes = this.pendingNodes.size ? Array.from(this.pendingNodes) : [document.body]
      this.pendingNodes.clear()
      if (this.locale === 'en' && !forceRestore) {
        for (const node of nodes) this.translateTree(node)
        this.translateDocumentTitle()
      } else if (this.locale === 'en') {
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
    const translated = translateLiteral(current)
    if (translated !== current) document.title = translated
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
  const override = UI_EN_OVERRIDES[normalized]
  if (override) return override
  const exact = UI_EN_LITERAL_MAP[normalized]
  if (exact) return cleanGeneratedEnglish(exact)

  const dynamic = translateDynamic(normalized)
  if (dynamic) return dynamic

  let fallback = normalized
  for (const [pattern, replacement] of PHRASE_FALLBACKS) fallback = fallback.replace(pattern, replacement)
  return fallback !== normalized ? cleanGeneratedEnglish(fallback) : value
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
  if ((match = value.match(/^(\d+)\s+sự kiện trong kỳ$/))) return `${match[1]} events in this period`
  return null
}

function cleanGeneratedEnglish(value: string): string {
  return value
    .replace(/\b(\w+)\s+\1\b/gi, '$1')
    .replace(/time\s+time/gi, 'time')
    .replace(/limit restriction/gi, 'restriction')
    .replace(/guide guide/gi, 'guide')
    .replace(/valid rate/gi, 'valid')
    .replace(/laboratory room/gi, 'laboratory')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}
