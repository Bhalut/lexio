import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { ApiService, AuthProviderConfig, CurrentUser } from '../services/api.service';
import { canManageUsers } from '../auth/permissions';
import {
  buildSidebarUrl,
  parseSidebarAuthQueryState,
} from './sidebar-url-state';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  active: boolean;
  disabled: boolean;
  tooltip: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() manageUsersRequested = new EventEmitter<void>();

  currentUser: CurrentUser | null = null;
  authNotice: string | null = null;
  authConfig: AuthProviderConfig = {
    mode: 'LOCAL',
    oidcEnabled: false,
    providerLabel: 'SSO del despacho',
    localEnabled: true,
    passwordResetEnabled: true,
  };
  userMenuOpen = false;
  authenticating = false;
  resetSubmitting = false;
  loginEmail = '';
  loginPassword = '';
  loginError = '';
  showResetRequest = false;
  resetEmail = '';
  resetRequestMessage = '';
  resetRequestError = '';
  showResetModal = false;
  resetToken = '';
  resetNewPassword = '';
  resetConfirmPassword = '';

  private readonly authState = inject(AuthStateService);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  navItems: NavItem[] = [
    {
      label: 'Expedientes',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      route: '/',
      active: true,
      disabled: false,
      tooltip: '',
    },
    {
      label: 'Calendario',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      route: '/calendario',
      active: false,
      disabled: true,
      tooltip: 'Gestiona audiencias, vencimientos y citas importantes del despacho',
    },
    {
      label: 'Tareas',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      route: '/tareas',
      active: false,
      disabled: true,
      tooltip: 'Asigna y supervisa tareas, checklists y plazos del equipo legal',
    },
    {
      label: 'Facturación',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      route: '/facturacion',
      active: false,
      disabled: true,
      tooltip: 'Administra honorarios, facturación y seguimiento de pagos',
    },
    {
      label: 'Clientes',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      route: '/clientes',
      active: false,
      disabled: true,
      tooltip: 'Directorio de clientes, contactos y CRM del despacho',
    },
  ];

  onToggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  ngOnInit(): void {
    this.currentUser = this.authState.currentUser;
    this.authNotice = this.authState.authNotice;
    this.authConfig = this.authState.authConfig;
    this.initializeAuthQueryState();

    this.authState.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          if (user) {
            this.userMenuOpen = false;
            this.loginPassword = '';
            this.loginError = '';
            this.showResetRequest = false;
          }
        },
      });

    this.authState.authNotice$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (notice) => {
          this.authNotice = notice;
        },
      });

    this.authState.authConfig$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (config) => {
          this.authConfig = config;
        },
      });
  }

  getInitials(name?: string): string {
    if (!name) {
      return 'LX';
    }

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  }

  canLogin(): boolean {
    if (this.authConfig.mode === 'OIDC_ONLY') {
      return false;
    }

    return (
      this.loginEmail.trim().length > 0 &&
      this.loginPassword.trim().length >= 8
    );
  }

  onLoginEmailInput(event: Event): void {
    this.loginEmail = (event.target as HTMLInputElement | null)?.value || '';
  }

  onLoginPasswordInput(event: Event): void {
    this.loginPassword = (event.target as HTMLInputElement | null)?.value || '';
  }

  startSsoLogin(): void {
    if (!this.authConfig.oidcEnabled || typeof window === 'undefined') {
      return;
    }

    this.loginError = '';
    this.authState.clearAuthNotice();
    window.location.assign(this.api.getOidcAuthorizeUrl());
  }

  openUserAdmin(): void {
    this.manageUsersRequested.emit();
    this.userMenuOpen = false;
  }

  canManageUsers(user: CurrentUser | null): boolean {
    return canManageUsers(user);
  }

  async login(): Promise<void> {
    if (!this.canLogin() || this.authenticating) {
      return;
    }

    this.authenticating = true;
    this.loginError = '';
    this.authState.clearAuthNotice();

    try {
      await this.authState.login(this.loginEmail.trim(), this.loginPassword);
    } catch {
      this.loginError =
        'No fue posible iniciar sesión. Verifica tu correo y contraseña.';
    } finally {
      this.authenticating = false;
    }
  }

  async logout(): Promise<void> {
    await this.authState.logout();
    this.userMenuOpen = false;
  }

  toggleResetRequest(): void {
    this.showResetRequest = !this.showResetRequest;
    this.resetRequestError = '';
    this.resetRequestMessage = '';
    this.resetEmail = this.loginEmail;
  }

  async requestPasswordReset(): Promise<void> {
    if (!this.resetEmail.trim() || this.resetSubmitting) {
      return;
    }

    this.resetSubmitting = true;
    this.resetRequestError = '';
    this.resetRequestMessage = '';

    this.api.requestPasswordReset(this.resetEmail.trim()).subscribe({
      next: () => {
        this.resetSubmitting = false;
        this.resetRequestMessage =
          'Si existe una cuenta local con ese correo, enviamos un enlace de restablecimiento.';
      },
      error: () => {
        this.resetSubmitting = false;
        this.resetRequestError =
          'No fue posible generar el enlace de restablecimiento.';
      },
    });
  }

  canSubmitPasswordReset(): boolean {
    return (
      this.resetToken.trim().length > 0 &&
      this.resetNewPassword.trim().length >= 8 &&
      this.resetNewPassword === this.resetConfirmPassword
    );
  }

  submitPasswordReset(): void {
    if (!this.canSubmitPasswordReset() || this.resetSubmitting) {
      return;
    }

    this.resetSubmitting = true;
    this.resetRequestError = '';
    this.resetRequestMessage = '';

    this.api
      .confirmPasswordReset(this.resetToken, this.resetNewPassword)
      .subscribe({
        next: () => {
          this.resetSubmitting = false;
          this.resetRequestMessage =
            'Contraseña actualizada. Ya puedes ingresar con tu nueva clave.';
          this.loginPassword = '';
          this.closeResetModal();
          this.showResetRequest = false;
        },
        error: (err) => {
          this.resetSubmitting = false;
          this.resetRequestError =
            err?.error?.message ||
            'No fue posible aplicar la nueva contraseña.';
        },
      });
  }

  closeResetModal(): void {
    if (this.resetSubmitting) {
      return;
    }

    this.showResetModal = false;
    this.resetToken = '';
    this.resetNewPassword = '';
    this.resetConfirmPassword = '';
    this.clearResetQueryParams();
  }

  private initializeAuthQueryState(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const state = parseSidebarAuthQueryState(
      window.location.search,
      this.loginEmail,
    );
    this.loginError = state.loginError;
    this.resetToken = state.resetToken;
    this.resetEmail = state.resetEmail;
    this.showResetModal = state.showResetModal;

    this.replaceQueryParams(state.cleanedParams);
  }

  private clearResetQueryParams(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    params.delete('resetToken');
    params.delete('email');
    this.replaceQueryParams(params);
  }

  private replaceQueryParams(params: URLSearchParams): void {
    if (typeof window === 'undefined') {
      return;
    }

    const nextUrl = buildSidebarUrl(
      window.location.pathname,
      params,
      window.location.hash,
    );
    window.history.replaceState({}, '', nextUrl);
  }
}
