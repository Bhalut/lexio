import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'cases/:caseId/documents',
    loadComponent: () =>
      import('./features/documents/page.component').then(
        (m) => m.DocumentsPageComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/cases/entry.component').then(
        (m) => m.CaseEntryComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
