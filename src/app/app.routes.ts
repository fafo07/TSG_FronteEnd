import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./core/auth/login.component').then((m) => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'patients', loadComponent: () => import('./features/patients/patients.component').then((m) => m.PatientsComponent) },
      { path: 'users', loadComponent: () => import('./features/patients/patients.component').then((m) => m.PatientsComponent) },
      { path: 'patients/new', loadComponent: () => import('./features/patients/patient-new.component').then((m) => m.PatientNewComponent) },
      { path: 'patients/:id/edit', loadComponent: () => import('./features/patients/patient-edit.component').then((m) => m.PatientEditComponent) },
      { path: 'patients/:id/overview', loadComponent: () => import('./features/patients/patient-overview.component').then((m) => m.PatientOverviewComponent) },
      { path: 'patients/:id/manifestations', loadComponent: () => import('./features/manifestations/manifestations.component').then((m) => m.ManifestationsComponent) },
      { path: 'patients/:id/treatments', loadComponent: () => import('./features/treatments/treatments.component').then((m) => m.TreatmentsComponent) },
      { path: 'patients/:id/adverse-events', loadComponent: () => import('./features/adverse-events/adverse-events.component').then((m) => m.AdverseEventsComponent) },
      { path: 'patients/:id/genetic-tests', loadComponent: () => import('./features/genetic-tests/genetic-tests.component').then((m) => m.GeneticTestsComponent) },
      { path: 'patients/:id/contacts', loadComponent: () => import('./features/contacts/contacts.component').then((m) => m.ContactsComponent) },
      { path: 'patients/:id', loadComponent: () => import('./features/patient-detail/patient-detail.component').then((m) => m.PatientDetailComponent) },
      { path: 'manifestations/:mid', loadComponent: () => import('./features/manifestation-detail/manifestation-detail.component').then((m) => m.ManifestationDetailComponent) },
      { path: 'manifestations/:mid/findings', loadComponent: () => import('./features/findings/findings.component').then((m) => m.FindingsComponent) },
      { path: 'catalogs/systems', loadComponent: () => import('./features/catalogs/catalogs.component').then((m) => m.CatalogsComponent) },
      { path: 'catalogs/findings', loadComponent: () => import('./features/catalogs/catalogs.component').then((m) => m.CatalogsComponent) },
      { path: 'catalogs/countries', loadComponent: () => import('./features/catalogs/catalogs.component').then((m) => m.CatalogsComponent) },
      { path: 'catalogs', pathMatch: 'full', redirectTo: 'catalogs/systems' },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: '' }
];
