import { Routes } from '@angular/router'
import { authGuard, guestGuard, landingGuard, roleGuard } from './core/auth/auth.guard'
import { AppLayoutComponent } from './shared/layout/app-layout'

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Shared Lab · Booking System',
    loadComponent: () => import('./features/landing/homepage.page').then((m) => m.HomepagePage),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Đăng nhập · Shared Lab',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'forgot-password',
    title: 'Quên mật khẩu · Shared Lab',
    loadComponent: () =>
      import('./features/auth/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    title: 'Đặt lại mật khẩu · Shared Lab',
    loadComponent: () =>
      import('./features/auth/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: '403',
    title: 'Không có quyền truy cập',
    loadComponent: () => import('./features/system/forbidden.page').then((m) => m.ForbiddenPage),
  },
  {
    path: 'app',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [landingGuard],
        loadComponent: () => import('./features/system/blank.page').then((m) => m.BlankPage),
      },
      {
        path: 'home',
        canActivate: [roleGuard(['Requester'])],
        title: 'Trang chủ · Shared Lab',
        loadComponent: () =>
          import('./features/home/requester-home.page').then((m) => m.RequesterHomePage),
      },
      {
        path: 'dashboard',
        canActivate: [roleGuard(['Admin', 'LabManager'])],
        title: 'Dashboard · Shared Lab',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'profile',
        title: 'Tài khoản cá nhân',
        loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'security/password-reset',
        title: 'Đặt lại mật khẩu · Shared Lab',
        loadComponent: () =>
          import('./features/profile/request-password-reset.page').then(
            (m) => m.RequestPasswordResetPage,
          ),
      },
      {
        path: 'notifications',
        title: 'Trung tâm thông báo',
        loadComponent: () =>
          import('./features/notifications/notifications.page').then((m) => m.NotificationsPage),
      },
      {
        path: 'calendar',
        title: 'Lịch tài nguyên',
        loadComponent: () =>
          import('./features/resources/calendar.page').then((m) => m.CalendarPage),
      },
      {
        path: 'labs',
        title: 'Phòng thí nghiệm',
        loadComponent: () => import('./features/resources/labs.page').then((m) => m.LabsPage),
      },
      {
        path: 'labs/:labId',
        title: 'Chi tiết phòng lab',
        loadComponent: () =>
          import('./features/resources/lab-detail.page').then((m) => m.LabDetailPage),
      },
      {
        path: 'equipments',
        title: 'Thiết bị',
        loadComponent: () =>
          import('./features/resources/equipments.page').then((m) => m.EquipmentsPage),
      },
      {
        path: 'equipments/:equipmentId',
        title: 'Chi tiết thiết bị',
        loadComponent: () =>
          import('./features/resources/equipment-detail.page').then((m) => m.EquipmentDetailPage),
      },
      {
        path: 'bookings/new',
        canActivate: [roleGuard(['Requester'])],
        title: 'Tạo booking',
        loadComponent: () =>
          import('./features/bookings/booking-form.page').then((m) => m.BookingFormPage),
      },
      {
        path: 'bookings/my',
        canActivate: [roleGuard(['Requester'])],
        title: 'Booking của tôi',
        loadComponent: () =>
          import('./features/bookings/my-bookings.page').then((m) => m.MyBookingsPage),
      },
      {
        path: 'bookings/:bookingId/edit',
        canActivate: [roleGuard(['Requester'])],
        title: 'Sửa booking',
        loadComponent: () =>
          import('./features/bookings/booking-form.page').then((m) => m.BookingFormPage),
      },
      {
        path: 'bookings/:bookingId',
        title: 'Chi tiết booking',
        loadComponent: () =>
          import('./features/bookings/booking-detail.page').then((m) => m.BookingDetailPage),
      },
      {
        path: 'waitlists/my',
        canActivate: [roleGuard(['Requester'])],
        title: 'Hàng chờ của tôi',
        loadComponent: () =>
          import('./features/requester/my-waitlists.page').then((m) => m.MyWaitlistsPage),
      },
      {
        path: 'violations/my',
        canActivate: [roleGuard(['Requester'])],
        title: 'Vi phạm của tôi',
        loadComponent: () =>
          import('./features/requester/my-violations.page').then((m) => m.MyViolationsPage),
      },
      {
        path: 'management/bookings/pending',
        canActivate: [roleGuard(['LabManager'])],
        title: 'Booking cần duyệt',
        loadComponent: () =>
          import('./features/management/pending-bookings.page').then((m) => m.PendingBookingsPage),
      },
      {
        path: 'management/bookings',
        canActivate: [roleGuard(['LabManager'])],
        title: 'Quản lý booking',
        loadComponent: () =>
          import('./features/management/bookings-management.page').then(
            (m) => m.BookingsManagementPage,
          ),
      },
      {
        path: 'management/maintenances/new',
        canActivate: [roleGuard(['LabManager'])],
        title: 'Tạo lịch bảo trì',
        loadComponent: () =>
          import('./features/management/maintenance-form.page').then((m) => m.MaintenanceFormPage),
      },
      {
        path: 'management/maintenances/:id/edit',
        canActivate: [roleGuard(['LabManager'])],
        title: 'Sửa lịch bảo trì',
        loadComponent: () =>
          import('./features/management/maintenance-form.page').then((m) => m.MaintenanceFormPage),
      },
      {
        path: 'management/maintenances/:id',
        title: 'Chi tiết bảo trì',
        loadComponent: () =>
          import('./features/management/maintenance-detail.page').then(
            (m) => m.MaintenanceDetailPage,
          ),
      },
      {
        path: 'management/maintenances',
        title: 'Lịch bảo trì',
        loadComponent: () =>
          import('./features/management/maintenances.page').then((m) => m.MaintenancesPage),
      },
      {
        path: 'management/usage-logs',
        canActivate: [roleGuard(['LabManager'])],
        title: 'Nhật ký sử dụng',
        loadComponent: () =>
          import('./features/management/usage-logs.page').then((m) => m.UsageLogsPage),
      },
      {
        path: 'management/incidents',
        canActivate: [roleGuard(['LabManager'])],
        title: 'Duyệt sự cố',
        loadComponent: () =>
          import('./features/management/incidents.page').then((m) => m.IncidentsPage),
      },
      {
        path: 'management/waitlists',
        canActivate: [roleGuard(['LabManager'])],
        title: 'Quản lý hàng chờ',
        loadComponent: () =>
          import('./features/management/waitlists-management.page').then(
            (m) => m.WaitlistsManagementPage,
          ),
      },
      {
        path: 'management/violations',
        canActivate: [roleGuard(['LabManager'])],
        title: 'Quản lý vi phạm',
        loadComponent: () =>
          import('./features/management/violations-management.page').then(
            (m) => m.ViolationsManagementPage,
          ),
      },
      {
        path: 'reports',
        canActivate: [roleGuard(['Admin', 'LabManager'])],
        title: 'Trung tâm báo cáo',
        loadComponent: () => import('./features/reports/reports.page').then((m) => m.ReportsPage),
      },
      {
        path: 'admin/users/new',
        canActivate: [roleGuard(['Admin'])],
        title: 'Tạo người dùng',
        loadComponent: () =>
          import('./features/admin/create-user.page').then((m) => m.CreateUserPage),
      },
      {
        path: 'admin/users/:userId',
        canActivate: [roleGuard(['Admin'])],
        title: 'Chi tiết người dùng',
        loadComponent: () =>
          import('./features/admin/user-detail.page').then((m) => m.UserDetailPage),
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard(['Admin'])],
        title: 'Quản lý người dùng',
        loadComponent: () => import('./features/admin/users.page').then((m) => m.UsersPage),
      },
      {
        path: 'admin/departments',
        canActivate: [roleGuard(['Admin'])],
        title: 'Khoa/phòng ban',
        loadComponent: () =>
          import('./features/admin/departments.page').then((m) => m.DepartmentsPage),
      },
      {
        path: 'admin/priority-rules',
        canActivate: [roleGuard(['Admin'])],
        title: 'Quy tắc ưu tiên',
        loadComponent: () =>
          import('./features/admin/priority-rules.page').then((m) => m.PriorityRulesPage),
      },
      {
        path: 'notifications/send',
        canActivate: [roleGuard(['Admin'])],
        title: 'Gửi thông báo',
        loadComponent: () =>
          import('./features/admin/send-notification.page').then((m) => m.SendNotificationPage),
      },
      {
        path: 'admin/notifications/send',
        pathMatch: 'full',
        redirectTo: 'notifications/send',
      },
      {
        path: 'admin/audit-logs',
        canActivate: [roleGuard(['Admin'])],
        title: 'Audit log',
        loadComponent: () =>
          import('./features/admin/audit-logs.page').then((m) => m.AuditLogsPage),
      },
      {
        path: 'admin/roles',
        canActivate: [roleGuard(['Admin'])],
        title: 'Danh sách vai trò',
        loadComponent: () => import('./features/admin/roles.page').then((m) => m.RolesPage),
      },
    ],
  },
  {
    path: '**',
    title: 'Không tìm thấy trang',
    loadComponent: () => import('./features/system/not-found.page').then((m) => m.NotFoundPage),
  },
]
