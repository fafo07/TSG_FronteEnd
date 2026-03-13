import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { catchError, forkJoin, map, of } from 'rxjs';

import { FindingsCatalogService } from '../../core/api/findings-catalog.service';
import { ManifestationFindingsService } from '../../core/api/manifestation-findings.service';
import { ManifestationsService } from '../../core/api/manifestations.service';
import { TreatmentsService } from '../../core/api/treatments.service';
import { FindingCatalog, Manifestation, Treatment } from '../../shared/models/models';
import { unwrapResults } from '../../shared/models/pagination';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

@Component({
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, PatientTabsComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card">
      <h2>Treatments</h2>
      <p style="margin-top:-.25rem;color:#475569">Read-only review of patient medications. New treatments are created from the Manifestations tab.</p>

      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" message="Failed to load treatments" (retry)="load()" />
      <app-empty-state *ngIf="!loading && !error && !items.length" message="No treatments found" />

      <table *ngIf="!loading && !error && items.length" mat-table [dataSource]="items" class="full-width" style="margin-top:1rem">
        <ng-container matColumnDef="system"><th mat-header-cell *matHeaderCellDef>System</th><td mat-cell *matCellDef="let t">{{ systemLabel(t.manifestation_id) }}</td></ng-container>
        <ng-container matColumnDef="findings"><th mat-header-cell *matHeaderCellDef>Findings</th><td mat-cell *matCellDef="let t">{{ findingsLabel(t.manifestation_id) }}</td></ng-container>
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
  private manifestationFindingsService = inject(ManifestationFindingsService);
  private findingsCatalogService = inject(FindingsCatalogService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  items: Treatment[] = [];
  columns = ['system', 'findings', 'medication', 'dose', 'indication', 'status', 'dates', 'notes'];
  loading = false;
  error = false;

  private manifestationCache: Record<number, Manifestation | null> = {};
  private findingsByManifestation: Record<number, string[]> = {};
  private findingDetailCache: Record<string, FindingCatalog | null> = {};

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.treatmentsService.listByPatient(this.patientId).subscribe({
      next: (data) => {
        this.items = unwrapResults(data);
        this.hydrateManifestationsAndFindings();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  systemLabel(manifestationId?: number | null): string {
    if (!manifestationId) return '-';
    const manifestation = this.manifestationCache[manifestationId];
    if (!manifestation) return `#${manifestationId}`;
    return manifestation.system || manifestation.system_code || `#${manifestationId}`;
  }

  findingsLabel(manifestationId?: number | null): string {
    if (!manifestationId) return '-';
    const codes = this.findingsByManifestation[manifestationId] ?? [];
    if (!codes.length) return '-';
    return codes.map((code) => this.findingDetailCache[code]?.finding_name ?? code).join(', ');
  }

  private hydrateManifestationsAndFindings(): void {
    const manifestationIds = Array.from(new Set(this.items.map((item) => item.manifestation_id).filter((id): id is number => !!id)));
    if (!manifestationIds.length) return;

    this.fetchManifestations(manifestationIds);
    this.fetchManifestationFindings(manifestationIds);
  }

  private fetchManifestations(ids: number[]): void {
    const missing = ids.filter((id) => !(id in this.manifestationCache));
    if (!missing.length) return;

    const requests = missing.map((id) =>
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

  private fetchManifestationFindings(ids: number[]): void {
    const missing = ids.filter((id) => !(id in this.findingsByManifestation));
    if (!missing.length) return;

    const requests = missing.map((id) =>
      this.manifestationFindingsService.get(id).pipe(
        map((rows) => ({ id, codes: rows.filter((row) => row.is_present).map((row) => row.finding_code).filter((code) => !!code) })),
        catchError(() => of({ id, codes: [] as string[] }))
      )
    );

    forkJoin(requests).subscribe((results) => {
      const codesToResolve = new Set<string>();
      results.forEach(({ id, codes }) => {
        this.findingsByManifestation[id] = codes;
        codes.forEach((code) => {
          if (!(code in this.findingDetailCache)) codesToResolve.add(code);
        });
      });
      if (codesToResolve.size) this.fetchFindingDetails(Array.from(codesToResolve));
    });
  }

  private fetchFindingDetails(codes: string[]): void {
    const requests = codes.map((code) =>
      this.findingsCatalogService.getByCode(code).pipe(
        map((detail) => ({ code, detail })),
        catchError(() => of({ code, detail: null as FindingCatalog | null }))
      )
    );

    forkJoin(requests).subscribe((results) => {
      results.forEach(({ code, detail }) => {
        this.findingDetailCache[code] = detail;
      });
    });
  }
}
