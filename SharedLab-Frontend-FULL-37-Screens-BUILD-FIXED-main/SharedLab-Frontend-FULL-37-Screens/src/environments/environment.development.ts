export const environment = {
  production: false,
  appName: 'Shared Lab Booking System',
  // Trong môi trường development, Angular gọi cùng origin /api.
  // Dev server sẽ proxy request sang backend HTTPS tại https://localhost:7073.
  apiBaseUrl: 'https://sharedlabandequipmentbookingsystem.onrender.com/api',
  defaultLocale: 'vi',
  supportedLocales: ['vi', 'en'] as const,
}
