import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, NgZone, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthStateService } from '../../shared/services/auth-state.service';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-case-entry',
  standalone: true,
  template: `
    <section class="entry-shell" data-testid="case-entry">
      @if (loading) {
        <div class="entry-card">
          <p class="entry-kicker">Lexio</p>
          <h1 data-testid="case-entry-title">Abriendo tu espacio de trabajo</h1>
          <p>Buscando el primer expediente accesible para esta sesión.</p>
        </div>
      } @else {
        <div class="entry-card">
          <p class="entry-kicker">Lexio</p>
          <h1 data-testid="case-entry-title">{{ title }}</h1>
          <p>{{ message }}</p>
          <button
            class="entry-btn"
            type="button"
            (click)="retry()"
            data-testid="case-entry-retry"
          >
            Reintentar
          </button>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .entry-shell {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at top, rgba(200, 168, 111, 0.16), transparent 36%),
          linear-gradient(180deg, #f7f1e7 0%, #fdfbf7 100%);
      }

      .entry-card {
        width: min(520px, 100%);
        border: 1px solid rgba(20, 42, 66, 0.1);
        border-radius: 28px;
        background: rgba(255, 252, 247, 0.92);
        box-shadow: 0 24px 64px rgba(16, 25, 35, 0.12);
        padding: 28px;
      }

      .entry-kicker {
        margin: 0 0 10px;
        color: var(--color-brand-700);
        font-size: 0.74rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        color: var(--color-ink-950);
        font-family: var(--font-display);
        font-size: clamp(2rem, 5vw, 3rem);
      }

      p {
        margin: 14px 0 0;
        color: var(--color-ink-700);
        line-height: 1.6;
      }

      .entry-btn {
        margin-top: 22px;
        border: none;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--color-brand-700), var(--color-brand-500));
        color: #fff8ea;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        padding: 12px 18px;
      }
    `,
  ],
})
export class CaseEntryComponent implements OnInit {
  loading = true;
  title = 'No encontramos expedientes';
  message =
    'Esta cuenta aún no tiene asuntos asignados. Solicita acceso o inicia sesión con otro perfil.';

  private readonly api = inject(ApiService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  ngOnInit(): void {
    this.authState.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (currentUser) => {
          if (currentUser) {
            this.redirectToFirstCase();
            return;
          }

          this.loading = false;
          this.title = 'Inicia sesión para continuar';
          this.message =
            'Selecciona una sesión válida para que Lexio cargue tu bandeja de asuntos.';
        },
      });
  }

  retry(): void {
    this.redirectToFirstCase();
  }

  private redirectToFirstCase(): void {
    this.loading = true;
    this.api.getCases().subscribe({
      next: (cases) => {
        this.ngZone.run(() => {
          if (cases.length === 0) {
            this.loading = false;
            this.title = this.authState.currentUser
              ? 'No tienes expedientes asignados'
              : 'Inicia sesión para continuar';
            this.message = this.authState.currentUser
              ? 'Un administrador debe asignarte al menos un expediente para abrir el espacio de trabajo.'
              : 'Selecciona una sesión válida para que Lexio cargue tu bandeja de asuntos.';
            return;
          }

          void this.router.navigate(['/cases', cases[0].id, 'documents']);
        });
      },
      error: async (err) => {
        this.ngZone.run(async () => {
          if (err?.status === 401) {
            await this.authState.handleExpiredSession(
              'Tu sesión expiró. Inicia sesión nuevamente para abrir tus expedientes.',
            );
            this.title = 'Inicia sesión para continuar';
            this.message =
              'La sesión actual no es válida o ya expiró. Vuelve a autenticarte para abrir un expediente.';
            this.loading = false;
            return;
          }

          if (err?.status === 403) {
            this.title = 'Sin acceso al listado de expedientes';
            this.message =
              'La cuenta actual no puede abrir asuntos en este entorno. Revisa tus asignaciones o el rol operativo.';
            this.loading = false;
            return;
          }

          this.title = 'No fue posible abrir el espacio de trabajo';
          this.message =
            'La plataforma no pudo resolver el primer expediente disponible. Reintenta cuando la API esté operativa.';
          this.loading = false;
        });
      },
    });
  }
}
