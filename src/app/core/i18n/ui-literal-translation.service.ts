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
  'Chọn ngày và slot sử dụng': 'Select a date and time slots',
  'Chọn một hoặc hai slot liên tiếp trong cùng một buổi. Hệ thống tự tính giờ bắt đầu và kết thúc.':
    'Select one or two consecutive slots in the same session. The system calculates the start and end times automatically.',
  'Ngày sử dụng *': 'Booking date *',
  'Buổi sáng': 'Morning',
  'Buổi chiều': 'Afternoon',
  'Slot 1 và Slot 2': 'Slots 1 and 2',
  'Slot 3 và Slot 4': 'Slots 3 and 4',
  '2 giờ': '2 hours',
  'Tạo một booking duy nhất từ': 'Create one booking from',
  'Nhắc check-in lúc': 'Check-in reminder at',
  'và nhắc check-out lúc': 'and check-out reminder at',
  'Không gửi lại thông báo tại ranh giới giữa hai slot.':
    'No additional reminder is sent at the boundary between two slots.',
  'Chưa chọn slot. Có thể chọn Slot 1 + 2 hoặc Slot 3 + 4 để tạo một khoảng thời gian liên tục.':
    'No slot selected. Select Slots 1 + 2 or Slots 3 + 4 to create one continuous time range.',
  'Khung giờ thay thế theo slot cố định': 'Alternative fixed time slots',
  'Các gợi ý hiện tại không khớp bốn slot cố định. Hãy chọn ngày hoặc slot khác.':
    'The current suggestions do not match the four fixed slots. Select another date or slot.',
  'Chỉ chọn các slot liên tiếp trong cùng một buổi':
    'Select consecutive slots within the same session only.',
  'Khung giờ được truyền vào không thuộc bốn slot cố định':
    'The provided time range does not match the four fixed slots.',
  'Hãy chọn lại một hoặc hai slot liên tiếp trong cùng một buổi.':
    'Select one or two consecutive slots in the same session.',
  'Booking cũ chưa thuộc bốn slot cố định':
    'This legacy booking does not match the four fixed slots.',
  'Hãy chọn lại slot trước khi lưu thay đổi.': 'Select valid slots before saving changes.',
  'Gợi ý này không thuộc bốn slot cố định': 'This suggestion does not match the four fixed slots.',
  'Đã chọn khung giờ thay thế. Hệ thống đang kiểm tra lại.':
    'The alternative slot was selected. The system is checking it again.',
  'Bạn đã có một booking khác trùng với khung giờ này.':
    'You already have another booking that overlaps this time range.',
  'Khung giờ hiện chưa có sự kiện chặn tài nguyên và không trùng lịch cá nhân.':
    'This time range has no blocking resource event and does not overlap your other bookings.',
  'Khung giờ cố định': 'Fixed time slot',
  'Chưa chọn slot': 'No slot selected',
  'Chọn một phòng, tích thiết bị cần mượn, chọn thời gian rồi gửi một booking duy nhất để duyệt.':
    'Select one laboratory, choose any required equipment, select a time, and submit one booking for approval.',
  'Chọn phòng và thiết bị sử dụng': 'Select a laboratory and equipment',
  'Mỗi booking bắt buộc có một phòng. Thiết bị trong phòng là tùy chọn; chỉ tích những thiết bị cần mượn.':
    'Each booking must include one laboratory. Equipment is optional; select only the items you need.',
  'Phòng là tài nguyên chính và luôn được gửi trong booking.':
    'The laboratory is the primary resource and is always included in the booking.',
  'Không bắt buộc. Không tích thiết bị nếu chỉ cần sử dụng phòng.':
    'Optional. Leave all equipment unselected when you only need the laboratory.',
  'Phòng chưa có thiết bị khả dụng': 'No available equipment in this laboratory',
  'Bạn vẫn có thể tiếp tục và tạo booking chỉ gồm phòng.':
    'You can continue and create a laboratory-only booking.',
  'Phòng & thiết bị': 'Laboratory & equipment',
  'Phòng và thiết bị đã chọn': 'Selected laboratory and equipment',
  'Thiết bị mượn': 'Selected equipment',
  'Hàng chờ hiện chỉ hỗ trợ một tài nguyên. Booking có thiết bị đi kèm chưa thể tham gia hàng chờ; hãy bỏ chọn thiết bị hoặc chọn slot khác.':
    'The waitlist currently supports one resource only. Remove the selected equipment or choose another slot.',
  'Hàng chờ chỉ hỗ trợ booking gồm một phòng và không kèm thiết bị':
    'The waitlist only supports a laboratory-only booking.',
  'Phòng và thiết bị trong booking': 'Laboratory and equipment in this booking',
  'Check-in một lần cho toàn bộ booking; check-out sẽ trả toàn bộ phòng và thiết bị.':
    'Check in once for the entire booking; check-out releases the laboratory and all equipment.',
  'Check-in booking': 'Check in booking',
  'Check-out toàn bộ': 'Check out all',
  'Đang sử dụng toàn bộ booking': 'Entire booking in use',
  'Đã check-out toàn bộ': 'All resources checked out',
  'Đã trả tài nguyên': 'Resource returned',
  'Booking chưa đủ điều kiện để check-in': 'This booking is not eligible for check-in yet.',
  'Booking chưa đủ điều kiện để check-out toàn bộ':
    'This booking is not eligible for full check-out yet.',
  'Check-in booking thành công': 'Booking check-in successful',
  'Phòng và toàn bộ thiết bị đã chọn được check-in cùng một lần.':
    'The laboratory and all selected equipment were checked in together.',
  'Không thể check-in booking': 'Unable to check in the booking',
  'Xác nhận check-out toàn bộ phòng và thiết bị trong booking?':
    'Check out the laboratory and all equipment in this booking?',
  'Check-out booking thành công': 'Booking check-out successful',
  'Toàn bộ phòng và thiết bị đã được trả; booking đã hoàn tất.':
    'The laboratory and all equipment were returned; the booking is complete.',
  'Không thể check-out toàn bộ booking': 'Unable to check out the entire booking',
  'Đặt phòng với thiết bị này': 'Book the laboratory with this equipment',
  'Chưa xác định người dùng': 'Unknown user',
  'Chưa xác định người đặt': 'Unknown requester',
  'Chưa xác định người tạo': 'Unknown creator',
  'Chưa có email': 'No email address',
  'Phòng quản lý': 'Managed laboratories',
  'Phòng đang quản lý': 'Managed laboratories',
  'Giới hạn booking': 'Booking restrictions',
  'Phạm vi dựa trên LabRoom.ManagerId': 'Scope based on assigned laboratories',
  'Chưa được phân công quản lý phòng lab nào.': 'No laboratories assigned.',
  'Không thể tự đổi vai trò hoặc vô hiệu hóa tài khoản đang đăng nhập.':
    'You cannot change the role or deactivate the account currently in use.',
  'Đăng nhập bằng email hoặc username của tài khoản.':
    'Sign in with the account email address or username.',
  'Ví dụ: user@university.edu hoặc nguyenvana':
    'Example: user@university.edu or nguyenvana',
  'Phiên đăng nhập không còn hiệu lực': 'Your session is no longer valid',
  'Tài khoản có thể vừa được đăng nhập trên thiết bị hoặc trình duyệt khác, nên phiên này đã kết thúc. Vui lòng đăng nhập lại để tiếp tục.':
    'This account may have been used to sign in on another device or browser, so this session has ended. Sign in again to continue.',
  'Phiên đăng nhập đã hết hạn': 'Your session has expired',
  'Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống.':
    'Sign in again to continue using the system.',
  'Phiên đăng nhập đã được kết thúc': 'Your session has ended',
  'Mật khẩu của tài khoản vừa được thay đổi. Vui lòng đăng nhập lại bằng mật khẩu mới.':
    'The account password has changed. Sign in again with the new password.',
  'Chi tiết lịch đặt': 'Booking details',
  'Chưa check-in': 'Not checked in',
  'Chưa checkout': 'Not checked out',
  'Tài nguyên': 'Resource',
  'booking này': 'this booking',
  'Chỉnh sửa booking': 'Edit booking',
  'Tạo yêu cầu booking': 'Create booking request',
  'Đã gửi yêu cầu đặt lịch': 'Booking request submitted',
  'Yêu cầu của bạn đang chờ quản lý duyệt.':
    'Your request is pending manager approval.',
  'Hãy chọn phòng và khung giờ hợp lệ trước khi tham gia hàng chờ':
    'Select a laboratory and a valid time slot before joining the waitlist.',
  'Đã tham gia hàng chờ của phòng': 'Joined the laboratory waitlist',
  'Vị trí hiện tại của bạn': 'Your current position',
  'Thiết bị không được giữ và sẽ chọn lại khi đến lượt.':
    'Equipment is not reserved and must be selected again when your turn arrives.',
  'Trạng thái hiện tại': 'Current status',
  'thiết bị đã chọn': 'equipment selected',
  'Hàng chờ chỉ giữ quyền ưu tiên cho phòng.':
    'The waitlist reserves priority for the laboratory only.',
  'Các thiết bị đang chọn sẽ không được giữ; khi đến lượt, bạn chọn lại thiết bị còn khả dụng rồi tạo booking.':
    'Selected equipment will not be reserved. When your turn arrives, select from the available equipment and create the booking.',
  'Gửi yêu cầu booking': 'Submit booking request',
  'Tìm theo mục đích': 'Search by purpose',
  'Mã booking, tên người đặt, mục đích...': 'Booking ID, requester name, purpose...',
  'Không tải được tên người đặt': 'Unable to load requester names',
  'Không tải được tên người dùng': 'Unable to load user names',
  'Duyệt booking': 'Approve booking',
  'Xác nhận sự cố': 'Confirm incident',
  'Từ chối sự cố': 'Reject incident',
  'Không xác định': 'Unknown',
  'Sự cố được xác nhận có thể tạo vi phạm tự động và tăng điểm phạt người dùng.':
    'A confirmed incident may automatically create a violation and add penalty points to the requester.',
  'Thông tin lịch bảo trì': 'Maintenance details',
  'Tự động bắt đầu': 'Automatic start',
  'Hệ thống sẽ tự chuyển lịch sang InProgress đúng giờ bắt đầu và gửi nhắc trước 15 phút. Không cần bấm Start thủ công.':
    'The schedule automatically changes to In Progress at the start time and sends a reminder 15 minutes beforehand. No manual start is required.',
  'Đã quá thời gian kết thúc dự kiến': 'Past the expected end time',
  'Tài nguyên vẫn giữ trạng thái Maintenance. LabManager hoặc Admin cần kiểm tra thực tế và bấm Hoàn thành khi bảo trì đã xong.':
    'The resource remains under maintenance. A lab manager or administrator must verify the work and mark it complete.',
  'Chỉnh sửa lịch bảo trì': 'Edit maintenance schedule',
  'Tạo lịch bảo trì': 'Create maintenance schedule',
  'Bảo trì có kế hoạch có thể chọn theo slot; trường hợp khẩn cấp có thể bắt đầu ngay.':
    'Choose fixed slots for planned maintenance or start emergency maintenance immediately.',
  'Tài nguyên & thời gian': 'Resource and time',
  'Hệ thống sẽ kiểm tra xung đột tài nguyên và thời gian trước khi lưu.':
    'The system checks resource and time conflicts before saving.',
  'Bảo trì phòng lab': 'Laboratory maintenance',
  'Khóa toàn bộ phòng trong thời gian thực hiện':
    'Block the entire laboratory during maintenance',
  'Bảo trì thiết bị': 'Equipment maintenance',
  'Chỉ khóa thiết bị được chọn': 'Block only the selected equipment',
  'Phòng chứa thiết bị': 'Equipment laboratory',
  'Bảo trì khẩn cấp — bắt đầu ngay': 'Emergency maintenance — start now',
  'Tài nguyên chuyển sang trạng thái bảo trì ngay sau khi tạo. Không áp dụng lặp định kỳ.':
    'The resource enters maintenance status immediately after creation. Recurrence does not apply.',
  'Theo slot cố định': 'Fixed time slots',
  '07–09, 09–11, 13–15, 15–17; hỗ trợ nhiều ngày.':
    '07–09, 09–11, 13–15, and 15–17; supports multiple days.',
  'Thời gian tùy chỉnh': 'Custom time',
  'Dùng cho khoảng liên tục hoặc lịch tuần/tháng.':
    'Use a continuous period or a weekly/monthly schedule.',
  'Thời gian kết thúc dự kiến *': 'Expected end time *',
  'Đây chỉ là thời gian dự kiến. Đến giờ hệ thống sẽ nhắc, nhưng không tự Complete; LabManager/Admin phải xác nhận hoàn thành.':
    'This is an expected end time. The system sends a reminder but does not complete maintenance automatically; a lab manager or administrator must confirm completion.',
  'Từ ngày *': 'From date *',
  'Đến ngày *': 'To date *',
  'Chọn slot mỗi ngày': 'Select daily slots',
  'Có thể chọn 1–2 slot liên tiếp trong cùng một buổi.':
    'Select one or two consecutive slots in the same session.',
  'Cả ngày 07:00–17:00': 'Full day 07:00–17:00',
  'Chỉ khóa tài nguyên trong các khung giờ đã chọn của từng ngày.':
    'The resource is blocked only during the selected time slots each day.',
  'Bắt đầu *': 'Start *',
  'Kết thúc *': 'End *',
  'Loại lặp': 'Recurrence type',
  'Không lặp': 'No recurrence',
  'Khoảng lặp': 'Recurrence interval',
  'Ngày kết thúc chuỗi': 'Series end date',
  'Chi phí bảo trì': 'Maintenance cost',
  'Nội dung bảo trì, đơn vị thực hiện, linh kiện thay thế...':
    'Maintenance work, service provider, replacement parts...',
  'Đang lưu...': 'Saving...',
  'Lưu thay đổi': 'Save changes',
  'Bắt đầu bảo trì ngay': 'Start maintenance now',
  'Chưa chọn lịch slot hợp lệ.': 'No valid slot schedule selected.',
  'Kiểm tra tài nguyên, thời gian/slot, chi phí và cấu hình lặp.':
    'Check the resource, time slot, cost, and recurrence settings.',
  'Không xác định được thời gian bảo trì': 'Unable to determine the maintenance period',
  'Đã bắt đầu bảo trì khẩn cấp': 'Emergency maintenance started',
  'Không thể lưu lịch bảo trì': 'Unable to save the maintenance schedule',
  'Kiểm tra xung đột và phạm vi quyền quản lý.':
    'Check scheduling conflicts and your management scope.',
  'Quản lý bảo trì': 'Maintenance management',
  'Lịch bảo trì tài nguyên': 'Resource maintenance schedule',
  'Tạm ngừng': 'Pause',
  'Kích hoạt': 'Activate',
  'Chỉnh sửa khoa/phòng ban': 'Edit department',
  'Thêm khoa/phòng ban': 'Add department',
  'Chỉnh sửa quy tắc ưu tiên': 'Edit priority rule',
  'Thêm quy tắc ưu tiên': 'Add priority rule',
  'Tạo, sửa và theo dõi booking cá nhân': 'Create, edit, and track personal bookings',
  'Hàng chờ, check-in/check-out và báo sự cố cá nhân':
    'Use the waitlist, check in or out, and report personal incidents',
  'Duyệt/từ chối booking trong phạm vi phòng':
    'Approve or reject bookings within assigned laboratories',
  'Bảo trì, usage log, sự cố, hàng chờ và vi phạm quản lý':
    'Manage maintenance, usage logs, incidents, waitlists, and violations',
  'Quản lý phòng lab và thiết bị': 'Manage laboratories and equipment',
  'Quản trị người dùng, phòng ban, vai trò và quy tắc ưu tiên':
    'Manage users, departments, roles, and priority rules',
  'Gửi thông báo hệ thống và xem Audit log':
    'Send system notifications and view audit logs',
  'Quản trị người dùng, tài nguyên, cấu hình hệ thống và báo cáo toàn cục.':
    'Manage users, resources, system settings, and global reports.',
  'Quản lý người dùng, phòng ban, vai trò, phòng lab và thiết bị':
    'Manage users, departments, roles, laboratories, and equipment',
  'Cấu hình quy tắc ưu tiên và gửi thông báo hệ thống':
    'Configure priority rules and send system notifications',
  'Xem dashboard, báo cáo và audit log toàn hệ thống':
    'View system-wide dashboards, reports, and audit logs',
  'Duyệt/từ chối booking trong đúng phòng được phân công':
    'Approve or reject bookings in assigned laboratories',
  'Quản lý bảo trì, usage log, sự cố, hàng chờ và vi phạm':
    'Manage maintenance, usage logs, incidents, waitlists, and violations',
  'Xem dashboard và báo cáo trong phạm vi quản lý':
    'View dashboards and reports within the assigned scope',
  'Tạo, sửa, hủy và theo dõi booking cá nhân':
    'Create, edit, cancel, and track personal bookings',
  'Tham gia hàng chờ, check-in/check-out và báo sự cố':
    'Join waitlists, check in or out, and report incidents',
  'Xem thông báo, vi phạm và điểm phạt cá nhân':
    'View personal notifications, violations, and penalty points',
  'Nội dung thông báo sẽ được hiển thị ở đây để bạn kiểm tra trước khi gửi.':
    'The notification content appears here for review before sending.',
  'Hiển thị': 'Showing',
  'tài khoản': 'accounts',
  'Thiết bị hiện không thể đặt': 'This equipment cannot be booked',
  'Phòng hiện không thể đặt': 'This laboratory cannot be booked',
  'Đang kích hoạt...': 'Reactivating...',
  'Kích hoạt lại': 'Reactivate',
  'Kích hoạt lại phòng lab này?': 'Reactivate this laboratory?',
  'Đã kích hoạt lại phòng lab. Bây giờ có thể chỉnh sửa.':
    'The laboratory has been reactivated and can now be edited.',
  'Không thể kích hoạt lại phòng bằng phiên bản hiện tại.':
    'This laboratory cannot be reactivated in the current version.',
  'Đã gửi yêu cầu kích hoạt nhưng không tải lại được trạng thái phòng lab':
    'The reactivation request was sent, but the laboratory status could not be refreshed.',
  'Không thể kích hoạt lại phòng lab': 'Unable to reactivate the laboratory',
  'Trang này chỉ dành cho một số vai trò nhất định. Hệ thống đã bảo vệ nội dung và không hiển thị bất kỳ thông tin kỹ thuật nào.':
    'This page is available only to specific roles. Its content is protected.',
  'Đường dẫn bạn đang mở không tồn tại, đã được di chuyển hoặc không còn khả dụng trong hệ thống.':
    'The page you requested does not exist, has moved, or is no longer available.',
  'Không tải được vai trò hoặc khoa/phòng ban. Vui lòng tải lại dữ liệu.':
    'Unable to load roles or departments. Reload the data.',
  'Ẩn mật khẩu': 'Hide password',
  'Lịch đặt của thiết bị': 'Equipment bookings',
  'Không thể đặt': 'Unavailable for booking',
  'mỗi kỳ': 'per occurrence',
  'sự kiện khác': 'more events',
  'Violation ID, tên người dùng, Booking ID...': 'Violation ID, user name, booking ID...',
  'Xử lý': 'Resolve',
  'Cho hết hạn': 'Mark as expired',
  'Hàng chờ giữ ưu tiên cho phòng. Khi đến lượt, bạn chọn lại thiết bị còn khả dụng rồi tạo booking.':
    'The waitlist reserves laboratory priority. When your turn arrives, select from the available equipment and create a booking.',
  'Phòng được giữ ưu tiên tối đa 30 phút kể từ':
    'Laboratory priority is held for up to 30 minutes from',
  'Thiết bị không được giữ và sẽ chọn lại khi tạo booking.':
    'Equipment is not reserved and must be selected again when creating the booking.',
  'Xem lịch đặt': 'View booking',
  'Tổng quan hộp thư': 'Notification overview',
  'Thông báo chưa đọc sẽ có nền tím nhạt và chấm trạng thái ở bên phải.':
    'Unread notifications are highlighted and marked with a status dot.',
  'Nhóm thông báo': 'Notification types',
  'Phân loại nhanh': 'Quick filters',
  'Chưa có dữ liệu phân loại.': 'No category data available.',
  'Chi tiết thông báo': 'Notification details',
  'Đóng chi tiết': 'Close details',
  'Thời gian gửi': 'Sent at',
  'Trước': 'Previous',
  'Sau': 'Next',
  'Hãy tạo booking trước khi thời gian giữ chỗ kết thúc.':
    'Create the booking before the reservation expires.',
  'Xem trạng thái và điểm phạt ở trang Tài khoản cá nhân.':
    'View status and penalty points on the personal profile page.',
  'Không tải được lịch bảo trì': 'Unable to load the maintenance schedule',
  'Không có ghi chú.': 'No notes.',
  'Cấu hình định kỳ': 'Recurrence settings',
  'Kết thúc chuỗi': 'Series end',
  'Hủy lịch bảo trì': 'Cancel maintenance',
  'Hủy một kỳ không dừng các kỳ sau. Hủy cả chuỗi sẽ dừng toàn bộ lịch định kỳ còn hoạt động.':
    'Cancelling one occurrence does not affect later occurrences. Cancelling the series stops every remaining recurring schedule.',
  'Chỉ nhập thời gian lịch sử khi cần sửa dữ liệu. Luồng bình thường nên để trống.':
    'Enter a historical time only when correcting data. Otherwise, leave it blank.',
}

const PHRASE_FALLBACKS: readonly [RegExp, string][] = [
  [/\bXem phòng\b/gi, 'View laboratory'],
  [/\bXem thiết bị\b/gi, 'View equipment'],
  [/\bXem\b/gi, 'View'],
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
  if ((match = value.match(/^(.+),\s+lặp hằng ngày từ\s+(.+)\s+đến\s+(.+)\.$/))) {
    return `${match[1]}, repeats daily from ${match[2]} to ${match[3]}.`
  }
  if ((match = value.match(/^(.+)\s+ngày\s+(.+)\.$/))) return `${match[1]} on ${match[2]}.`
  if ((match = value.match(/^(.+),\s+(.+)\s+\+(\d+)\s+phòng$/))) {
    return `${match[1]}, ${match[2]} +${match[3]} laboratories`
  }
  if ((match = value.match(/^Vị trí hiện tại:\s*(\d+)\. Thiết bị không được giữ và sẽ chọn lại khi đến lượt\.$/))) {
    return `Current position: ${match[1]}. Equipment is not reserved and must be selected again when your turn arrives.`
  }
  if ((match = value.match(/^Chào\s+(.+),\s+sẵn sàng nghiên cứu chưa\?$/))) {
    return `Hello ${match[1]}, ready to start your research?`
  }
  if ((match = value.match(/^(\d+)\s+chưa đọc$/))) return `${match[1]} unread`
  if ((match = value.match(/^(\d+)\s+đã chọn$/))) return `${match[1]} selected`
  if ((match = value.match(/^(\d+)\s+thiết bị đã chọn$/))) return `${match[1]} equipment selected`
  if ((match = value.match(/^(\d+(?:[.,]\d+)?)\s+giờ$/))) return `${match[1]} hours`
  if ((match = value.match(/^(\d+)\s+lượt$/))) return `${match[1]} uses`
  if ((match = value.match(/^(\d+)\s+người$/))) return `${match[1]} people`
  if ((match = value.match(/^(\d+)\s+lần bảo trì$/))) return `${match[1]} maintenance records`
  if ((match = value.match(/^(\d+)\s+bản ghi(?:\s+sau bộ lọc)?$/))) return `${match[1]} records`
  if ((match = value.match(/^(\d+)\s+điểm(?:\s+phạt)?$/))) return `${match[1]} penalty points`
  if ((match = value.match(/^#(\d+)\s+trong hàng chờ$/))) return `#${match[1]} in the waitlist`
  if ((match = value.match(/^Phòng\s+#(\d+)$/))) return `Laboratory #${match[1]}`
  if ((match = value.match(/^Thiết bị\s+#(\d+)$/))) return `Equipment #${match[1]}`
  if ((match = value.match(/^(?:Người dùng|Mã người dùng)\s+#(\d+)$/))) return 'User'
  if ((match = value.match(/^Bảo trì\s+#(?:MT-)?(\d+)$/))) return `Maintenance #${match[1]}`
  if ((match = value.match(/^Trang\s+(\d+)\s*\/\s*(\d+)$/))) return `Page ${match[1]} / ${match[2]}`
  if ((match = value.match(/^Đang hiển thị\s+(.+)$/))) return `Showing ${match[1]}`
  if ((match = value.match(/^(\d+)\s+sự kiện trong kỳ$/))) return `${match[1]} events in this period`
  if ((match = value.match(/^\+(\d+)\s+sự kiện khác$/))) return `+${match[1]} more events`
  if ((match = value.match(/^Hiển thị\s+(\d+)\s*\/\s*(\d+)\s+tài khoản$/)))
    return `Showing ${match[1]} of ${match[2]} accounts`
  if ((match = value.match(/^Trang\s+(\d+)\s+·\s+(\d+)\s+bản ghi$/)))
    return `Page ${match[1]} · ${match[2]} records`
  if ((match = value.match(/^Trang\s+(\d+)\s+•\s+tối đa\s+(\d+)\s+thông báo\/trang$/)))
    return `Page ${match[1]} • up to ${match[2]} notifications per page`
  if ((match = value.match(/^(\d+)\s+lượt\s+·\s+([\d.,]+)\s+giờ$/)))
    return `${match[1]} uses · ${match[2]} hours`
  if ((match = value.match(/^(\d+)\s+vi phạm đang hoạt động,\s*(\d+)\s+điểm phạt hiệu lực\.$/)))
    return `${match[1]} active violations, ${match[2]} active penalty points.`
  if ((match = value.match(/^(.+?)\s+•\s+(\d+)\s+vi phạm hoạt động$/)))
    return `${match[1]} • ${match[2]} active violations`
  if ((match = value.match(/^(\d+)\s+·\s+(\d+)\s+vi phạm$/)))
    return `${match[1]} · ${match[2]} violations`
  if ((match = value.match(/^(.+?)\s+·\s+\+(\d+)\s+điểm$/)))
    return `${match[1]} · +${match[2]} points`
  if ((match = value.match(/^Vị trí được giữ tối đa 30 phút kể từ\s+(.+)\.$/)))
    return `Your position is held for up to 30 minutes from ${match[1]}.`
  if ((match = value.match(/^Tài khoản đang bị hạn chế đến\s+(.+)\. Trong thời gian này bạn có thể không tạo được booking mới\.$/)))
    return `This account is restricted until ${match[1]}. You may be unable to create new bookings during this period.`
  if ((match = value.match(/^Tài khoản đang bị hạn chế đến\s+(.+)\. Vui lòng kiểm tra thời hạn hạn chế hoặc liên hệ quản trị viên\.$/)))
    return `This account is restricted until ${match[1]}. Check the restriction period or contact an administrator.`
  if ((match = value.match(/^Bạn đang có\s+(\d+)\s+vi phạm hoạt động\. Hãy kiểm tra để tránh bị hạn chế tài khoản\.$/)))
    return `You have ${match[1]} active violations. Review them to avoid account restrictions.`
  if ((match = value.match(/^Xác nhận\s+(.+?)\s+booking #([0-9]+)\?$/)))
    return `Confirm ${translateAction(match[1])} for booking #${match[2]}?`
  if ((match = value.match(/^Xác nhận thao tác\s+(.+?)\s+booking #([0-9]+)\?$/)))
    return `Confirm ${translateAction(match[1])} for booking #${match[2]}?`
  if ((match = value.match(/^Duyệt booking #([0-9]+)\?$/))) return `Approve booking #${match[1]}?`
  if ((match = value.match(/^Hủy waitlist #([0-9]+)\?$/))) return `Cancel waitlist #${match[1]}?`
  if ((match = value.match(/^Cho hết hạn waitlist #([0-9]+)\?$/)))
    return `Mark waitlist #${match[1]} as expired?`
  if ((match = value.match(/^(Xử lý|Hủy) vi phạm #([0-9]+)\?$/)))
    return `${match[1] === 'Xử lý' ? 'Resolve' : 'Cancel'} violation #${match[2]}?`
  if ((match = value.match(/^Xác nhận\s+(.+?)\s+lịch bảo trì #([0-9]+)\?$/)))
    return `Confirm ${translateAction(match[1])} for maintenance #${match[2]}?`
  if ((match = value.match(/^Bạn sắp\s+(.+?)\s+tài khoản của\s+(.+)\. Thao tác sẽ có hiệu lực ngay\.$/)))
    return `You are about to ${translateAction(match[1])} ${match[2]}'s account. This action takes effect immediately.`
  if ((match = value.match(/^Ngừng hoạt động đơn vị “(.+)”\? Người dùng cũ vẫn giữ liên kết dữ liệu\.$/)))
    return `Deactivate “${match[1]}”? Existing user data links will be preserved.`
  if ((match = value.match(/^Kích hoạt lại đơn vị “(.+)”\?$/))) return `Reactivate “${match[1]}”?`
  if ((match = value.match(/^Thông báo đã được gửi tới\s+(.+)\.$/)))
    return `The notification was sent to ${match[1]}.`
  if ((match = value.match(/^(\d+)\s+nhóm dữ liệu chưa tải được; các phần còn lại vẫn được hiển thị\.$/)))
    return `${match[1]} data groups could not be loaded; the remaining sections are still displayed.`
  if ((match = value.match(/^Booking #([0-9]+) đang chờ duyệt\.$/)))
    return `Booking #${match[1]} is pending approval.`
  if ((match = value.match(/^Vị trí hiện tại của bạn:\s*([0-9]+)\.$/)))
    return `Your current queue position: ${match[1]}.`
  if ((match = value.match(/^([\d.,]+)\s+tỷ$/))) return `${match[1]} billion`
  return null
}

function translateAction(value: string): string {
  const normalized = normalize(value).toLowerCase()
  const actions: Record<string, string> = {
    duyệt: 'approve',
    'từ chối': 'reject',
    hủy: 'cancel',
    'hoàn thành': 'complete',
    'đánh dấu không đến': 'mark as no-show',
    'bắt đầu': 'start',
    'kết thúc': 'complete',
    khóa: 'lock',
    'mở khóa': 'unlock',
    'ngừng hoạt động': 'deactivate',
    'kích hoạt': 'activate',
  }
  return actions[normalized] ?? value
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
