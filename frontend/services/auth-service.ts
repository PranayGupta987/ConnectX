import { apiClient } from "@/lib/api-client";
import { env } from "@/lib/env";
import { API_ROUTES } from "@/lib/constants";
import type { AuthTokens, User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}
export interface SignupPayload {
  email: string;
  password: string;
  username: string;
  displayName: string;
}
export interface ForgotPasswordPayload {
  email: string;
}
export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(API_ROUTES.AUTH.LOGIN, payload);
    return data;
  },
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(API_ROUTES.AUTH.SIGNUP, payload);
    return data;
  },
  async logout(): Promise<void> {
    await apiClient.post(API_ROUTES.AUTH.LOGOUT);
  },
  async me(): Promise<User> {
    const { data } = await apiClient.get<User>(API_ROUTES.AUTH.ME);
    return data;
  },
  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await apiClient.post(API_ROUTES.AUTH.FORGOT_PASSWORD, payload);
  },
  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await apiClient.post(API_ROUTES.AUTH.RESET_PASSWORD, payload);
  },
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post(API_ROUTES.AUTH.VERIFY_EMAIL, { token });
  },
  async refresh(refreshToken?: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(
      API_ROUTES.AUTH.REFRESH,
      refreshToken ? { refreshToken } : {},
    );
    return data;
  },
  async googleWithIdToken(idToken: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(API_ROUTES.AUTH.GOOGLE, { idToken });
    return data;
  },
  /** URL that starts the server-side Google OAuth redirect flow. */
  googleRedirectUrl(): string {
    return `${env.API_URL}${API_ROUTES.AUTH.GOOGLE}/redirect`;
  },
};
