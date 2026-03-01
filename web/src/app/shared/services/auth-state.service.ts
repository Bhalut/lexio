import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

import {
  ApiService,
  AuthProviderConfig,
  CurrentUser,
} from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly api = inject(ApiService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  private readonly authNoticeSubject = new BehaviorSubject<string | null>(null);
  private readonly authConfigSubject = new BehaviorSubject<AuthProviderConfig>({
    mode: 'LOCAL',
    oidcEnabled: false,
    providerLabel: 'SSO del despacho',
    localEnabled: true,
    passwordResetEnabled: true,
  });

  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly authNotice$ = this.authNoticeSubject.asObservable();
  readonly authConfig$ = this.authConfigSubject.asObservable();

  get currentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  get authNotice(): string | null {
    return this.authNoticeSubject.value;
  }

  get authConfig(): AuthProviderConfig {
    return this.authConfigSubject.value;
  }

  async bootstrap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const authConfig = await firstValueFrom(
        this.api.getCurrentAuthProviderConfig(),
      );
      this.authConfigSubject.next(authConfig);
    } catch {
      this.authConfigSubject.next({
        mode: 'LOCAL',
        oidcEnabled: false,
        providerLabel: 'SSO del despacho',
        localEnabled: true,
        passwordResetEnabled: true,
      });
    }

    try {
      const currentUser = await firstValueFrom(this.api.getCurrentUser());
      this.currentUserSubject.next(currentUser);
      this.authNoticeSubject.next(null);
      return;
    } catch (error) {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        throw error;
      }
    }
    this.currentUserSubject.next(null);
    this.authNoticeSubject.next(null);
  }

  async refreshCurrentUser(): Promise<void> {
    try {
      const currentUser = await firstValueFrom(this.api.getCurrentUser());
      this.currentUserSubject.next(currentUser);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        await this.handleExpiredSession();
        return;
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(this.api.login(email, password));
    this.currentUserSubject.next(response.user);
    this.authNoticeSubject.next(null);
  }

  async logout(): Promise<void> {
    let redirectUrl: string | null | undefined = null;
    try {
      const response = await firstValueFrom(this.api.deleteCurrentSession());
      redirectUrl = response.redirectUrl;
    } catch {
      // Clearing local auth state is enough if the server session is already gone.
    }
    this.currentUserSubject.next(null);
    this.authNoticeSubject.next(null);

    if (
      redirectUrl &&
      isPlatformBrowser(this.platformId) &&
      typeof window !== 'undefined'
    ) {
      window.location.assign(redirectUrl);
    }
  }

  async handleExpiredSession(
    message = 'Tu sesión expiró. Inicia sesión nuevamente para continuar.',
  ): Promise<void> {
    this.currentUserSubject.next(null);
    this.authNoticeSubject.next(message);

    try {
      await firstValueFrom(this.api.deleteCurrentSession());
    } catch {
      // Ignore cleanup errors; the UI state has already been reset.
    }
  }

  clearAuthNotice(): void {
    this.authNoticeSubject.next(null);
  }
}
