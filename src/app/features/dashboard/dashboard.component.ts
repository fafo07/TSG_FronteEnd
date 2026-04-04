import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { PatientsService } from '../../core/api/patients.service';
import { TreatmentsService } from '../../core/api/treatments.service';
import { ManifestationsService } from '../../core/api/manifestations.service';
import { Patient, Treatment } from '../../shared/models/models';
import { unwrapResults } from '../../shared/models/pagination';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { StatCardComponent } from '../../shared/ui/stat-card.component';

@Component({
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, LoadingStateComponent, StatCardComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-loading-state *ngIf="loading" />
    <app-error-state *ngIf="error" message="Failed to load dashboard" (retry)="load()" />

    <ng-container *ngIf="!loading && !error">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1rem">
        <app-stat-card title="Total patients" [value]="totalPatients" />
        <app-stat-card title="Active treatments" [value]="activeTreatments" />
        <app-stat-card title="Upcoming evaluations" [value]="upcomingManifestations" />
      </div>

      <mat-card class="page-card">
        <h3>Latest added patients</h3>
        <app-empty-state *ngIf="!latestPatients.length" message="No patients found yet" />

        <table *ngIf="latestPatients.length" mat-table [dataSource]="latestPatients" class="full-width">
          <ng-container matColumnDef="full_name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let p">{{ p.full_name }}</td></ng-container>
          <ng-container matColumnDef="diagnosis_date"><th mat-header-cell *matHeaderCellDef>Diagnosis</th><td mat-cell *matCellDef="let p">{{ p.diagnosis_date || '-' }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      </mat-card>
    </ng-container>
  `
})
export class DashboardComponent {
  private patientsService = inject(PatientsService);
  private treatmentsService = inject(TreatmentsService);
  private manifestationsService = inject(ManifestationsService);

  loading = true;
  error = false;
  totalPatients = 0;
  activeTreatments = 0;
  upcomingManifestations = 0;
  latestPatients: Patient[] = [];
  columns = ['full_name', 'diagnosis_date'];

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;

    this.patientsService.list('', '', 1).pipe(
      switchMap((patientsPage) => {
        this.latestPatients = patientsPage.results.slice(0, 5);
        this.totalPatients = patientsPage.count;

        const patientIds = this.latestPatients.map((p) => p.patient_id);
        if (!patientIds.length) return of({ active: 0, upcoming: 0 });

        return forkJoin({
          treatments: forkJoin(patientIds.map((id) => this.treatmentsService.listByPatient(id).pipe(catchError(() => of([]))))),
          manifestations: forkJoin(patientIds.map((id) => this.manifestationsService.listByPatient(id).pipe(catchError(() => of([])))))
        }).pipe(
          map(({ treatments, manifestations }) => {
            const flatTreatments = treatments.flatMap((x) => unwrapResults(x as Treatment[]));
            const active = flatTreatments.filter((t) => (t.status || '').toUpperCase() === 'ACTIVE').length;
            const upcoming = manifestations.reduce((acc, cur) => acc + unwrapResults(cur as any[]).length, 0);
            return { active, upcoming };
          })
        );
      })
    ).subscribe({
      next: (stats) => {
        this.activeTreatments = stats.active;
        this.upcomingManifestations = stats.upcoming;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }
}
