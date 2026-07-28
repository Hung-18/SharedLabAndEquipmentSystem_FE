export type UserRole = 'Admin' | 'LabManager' | 'Requester'
export type UserStatus = 'Active' | 'Restricted' | 'Inactive' | 'Locked' | number

export interface AuthUser {
  userId: number
  fullName: string
  username: string
  email: string
  roleName: UserRole | string
  departmentName: string
  penaltyPoints: number
  restrictionUntil: string | null
  status: UserStatus
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  email: string
  token: string
  newPassword: string
}
