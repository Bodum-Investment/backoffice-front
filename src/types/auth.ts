export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminRefreshRequest {
  refreshToken: string;
}

export interface AdminTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
