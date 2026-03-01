import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig, withCredentialsInterceptor } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideHttpClient(
      withFetch(),
      withInterceptors([withCredentialsInterceptor]),
    ),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
