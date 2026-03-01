import {
  APP_INITIALIZER,
  ApplicationConfig,
  PLATFORM_ID,
  provideZoneChangeDetection,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { AuthStateService } from './shared/services/auth-state.service';

export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ withCredentials: true }));

function authInitializer(
  authState: AuthStateService,
  platformId: object,
): () => Promise<void> {
  return () =>
    isPlatformBrowser(platformId) ? authState.bootstrap() : Promise.resolve();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([withCredentialsInterceptor])),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: authInitializer,
      deps: [AuthStateService, PLATFORM_ID],
    },
  ],
};
