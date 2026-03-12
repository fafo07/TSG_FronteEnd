import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { catchError, forkJoin, map, of } from 'rxjs';

import { ManifestationsService } from '../../core/api/manifestations.service';
import { TreatmentsService } from '../../core/api/treatments.service';
import { Manifestation, Treatment } from '../../shared/models/models';
import { unwrapResults } from '../../shared/models/pagination';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

@Component({
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, PatientTabsComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card">
      <h2>Treatments</h2>
      <p style="margin-top:-.25rem;color:#475569">Read-only review of patient medications. New treatments are created from the Manifestations tab.</p>

      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" message="Failed to load treatments" (retry)="load()" />
      <app-empty-state *ngIf="!loading && !error && !items.length" message="No treatments found" />

      <h3 *ngIf="!loading && !error && items.length" class="section-title">Patient medications</h3>
      <table *ngIf="!loading && !error && items.length" mat-table [dataSource]="items" class="full-width" style="margin-top:1rem">
        <ng-container matColumnDef="manifestation"><th mat-header-cell *matHeaderCellDef>Manifestation</th><td mat-cell *matCellDef="let t">{{ manifestationLabel(t.manifestation_id) }}</td></ng-container>
        <ng-container matColumnDef="medication"><th mat-header-cell *matHeaderCellDef>Medication</th><td mat-cell *matCellDef="let t">{{ t.medication }}</td></ng-container>
        <ng-container matColumnDef="dose"><th mat-header-cell *matHeaderCellDef>Dose</th><td mat-cell *matCellDef="let t">{{ t.dose || '-' }}</td></ng-container>
        <ng-container matColumnDef="indication"><th mat-header-cell *matHeaderCellDef>Indication</th><td mat-cell *matCellDef="let t">{{ t.indication || '-' }}</td></ng-container>
        <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let t">{{ t.status || '-' }}</td></ng-container>
        <ng-container matColumnDef="dates"><th mat-header-cell *matHeaderCellDef>Dates</th><td mat-cell *matCellDef="let t">{{ t.start_date || '-' }} → {{ t.end_date || '-' }}</td></ng-container>
        <ng-container matColumnDef="notes"><th mat-header-cell *matHeaderCellDef>Notes</th><td mat-cell *matCellDef="let t">{{ t.notes || '-' }}</td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-card>
  `
})
export class TreatmentsComponent {
  private route = inject(ActivatedRoute);
  private treatmentsService = inject(TreatmentsService);
  private manifestationsService = inject(ManifestationsService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  items: Treatment[] = [];
  columns = ['manifestation', 'medication', 'dose', 'indication', 'status', 'dates', 'notes'];
  loading = false;
  error = false;

  private manifestationCache: Record<number, Manifestation | null> = {};

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.treatmentsService.listByPatient(this.patientId).subscribe({
      next: (data) => {
        this.items = unwrapResults(data);
        this.hydrateManifestations();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  manifestationLabel(manifestationId?: number | null): string {
    if (!manifestationId) return '-';
    const manifestation = this.manifestationCache[manifestationId];
    if (!manifestation) return `#${manifestationId}`;
    const system = manifestation.system || manifestation.system_code;
    if (!system) return `#${manifestationId}`;
    return manifestation.evaluation_date
      ? `#${manifestationId} - ${system} - ${manifestation.evaluation_date}`
      : `#${manifestationId} - ${system}`;
  }

  private hydrateManifestations(): void {
    const uniqueIds = Array.from(new Set(this.items.map((item) => item.manifestation_id).filter((id): id is number => !!id)));
    const missingIds = uniqueIds.filter((id) => !(id in this.manifestationCache));

    if (!missingIds.length) return;

    const requests = missingIds.map((id) =>
      this.manifestationsService.getById(id).pipe(
        map((manifestation) => ({ id, manifestation })),
        catchError(() => of({ id, manifestation: null as Manifestation | null }))
      )
    );

    forkJoin(requests).subscribe((results) => {
      results.forEach(({ id, manifestation }) => {
        this.manifestationCache[id] = manifestation;
      });
    });
  }
}
