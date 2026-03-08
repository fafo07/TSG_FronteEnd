import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { FindingsCatalogService } from '../../core/api/findings-catalog.service';
import { ManifestationFindingsService } from '../../core/api/manifestation-findings.service';
import { ManifestationsService } from '../../core/api/manifestations.service';
import { SystemsService } from '../../core/api/catalogs.service';
import { TreatmentsService } from '../../core/api/treatments.service';
import { FindingCatalog, Manifestation, System } from '../../shared/models/models';
import { unwrapResults } from '../../shared/models/pagination';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, PatientTabsComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card">
      <h2>Patient manifestations</h2>

      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid form-grid-3">
        <mat-form-field>
          <mat-label>Evaluation date</mat-label>
          <input matInput [matDatepicker]="evaluationPicker" [max]="today" formControlName="evaluation_date" readonly />
          <mat-datepicker-toggle matIconSuffix [for]="evaluationPicker"></mat-datepicker-toggle>
          <mat-datepicker #evaluationPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field>
          <mat-label>System</mat-label>
          <mat-select formControlName="system_code" (selectionChange)="onSystemChange($event.value)">
            <mat-option *ngFor="let s of systems" [value]="s.system_code">{{ s.system_name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Finding catalog</mat-label>
          <mat-select formControlName="finding_code" [disabled]="!form.value.system_code">
            <mat-option *ngFor="let f of findingsBySystem" [value]="f.finding_code">{{ f.finding_name }} ({{ f.finding_code }})</mat-option>
          </mat-select>
          <mat-hint *ngIf="form.value.system_code && !findingsBySystem.length">No findings available for selected system</mat-hint>
        </mat-form-field>

        <mat-form-field class="notes-field"><mat-label>Notes</mat-label><textarea matInput rows="5" formControlName="notes"></textarea></mat-form-field>
        <button mat-flat-button color="primary" [disabled]="form.invalid">{{ editingId ? 'Update' : 'Save' }}</button>
      </form>

      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" message="Failed to load manifestations" (retry)="load()" />
      <app-empty-state *ngIf="!loading && !error && !items.length" message="No manifestations found" />

      <h3 *ngIf="!loading && !error && items.length" class="section-title">Manifestations list</h3>
      <table *ngIf="!loading && !error && items.length" mat-table [dataSource]="items" class="full-width" style="margin-top:1rem">
        <ng-container matColumnDef="evaluation_date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let m">{{ m.evaluation_date || '-' }}</td></ng-container>
        <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>System</th><td mat-cell *matCellDef="let m">{{ m.system || m.system_code }}</td></ng-container>
        <ng-container matColumnDef="finding"><th mat-header-cell *matHeaderCellDef>Finding</th><td mat-cell *matCellDef="let m">{{ selectedFindingByManifestation[m.manifestation_id] || '-' }}</td></ng-container>
        <ng-container matColumnDef="has_treatment"><th mat-header-cell *matHeaderCellDef>Treatment</th><td mat-cell *matCellDef="let m"><span class="status-badge" [class.status-badge-active]="hasTreatment(m.manifestation_id)">{{ hasTreatment(m.manifestation_id) ? 'Has treatment' : 'No treatment' }}</span></td></ng-container>
        <ng-container matColumnDef="notes"><th mat-header-cell *matHeaderCellDef>Notes</th><td mat-cell *matCellDef="let m">{{ m.notes || '-' }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let m"><button mat-stroked-button color="primary" [routerLink]="['/manifestations', m.manifestation_id, 'findings']">Findings</button> <button mat-button color="primary" [routerLink]="['/patients', patientId, 'treatments']" [queryParams]="{ manifestationId: m.manifestation_id }">Add treatment</button> <button mat-button (click)="edit(m)">Edit</button></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-card>
  `
})
export class ManifestationsComponent {
  today = new Date();
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(ManifestationsService);
  private systemsService = inject(SystemsService);
  private findingsCatalogService = inject(FindingsCatalogService);
  private manifestationFindingsService = inject(ManifestationFindingsService);
  private treatmentsService = inject(TreatmentsService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  items: Manifestation[] = [];
  systems: System[] = [];
  findingsBySystem: FindingCatalog[] = [];
  columns = ['evaluation_date', 'system_code', 'finding', 'has_treatment', 'notes', 'actions'];
  editingId: number | null = null;
  loading = false;
  error = false;
  treatmentsByManifestation: Record<number, boolean> = {};
  selectedFindingByManifestation: Record<number, string> = {};

  form = this.fb.group({
    evaluation_date: [null as Date | null, Validators.required],
    system_code: ['', Validators.required],
    finding_code: ['', Validators.required],
    notes: ['']
  });

  constructor() {
    this.systemsService.list().subscribe((res) => (this.systems = res.results));
    this.load();
  }

  onSystemChange(systemCode: string): void {
    this.form.patchValue({ finding_code: '' });
    if (!systemCode) {
      this.findingsBySystem = [];
      return;
    }
    this.findingsCatalogService.list(1, systemCode, true).subscribe((response) => {
      this.findingsBySystem = response.results;
    });
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.service.listByPatient(this.patientId).subscribe({
      next: (data) => {
        this.items = unwrapResults(data);
        this.loadTreatmentIndicators();
        this.loadManifestationFindingLabels();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  hasTreatment(manifestationId: number): boolean {
    return !!this.treatmentsByManifestation[manifestationId];
  }

  edit(item: Manifestation): void {
    this.editingId = item.manifestation_id;
    const systemCode = item.system_code || item.system || '';
    this.form.patchValue({ evaluation_date: this.parseDate(item.evaluation_date), system_code: systemCode, notes: item.notes ?? '', finding_code: '' });
    this.onSystemChange(systemCode);

    this.manifestationFindingsService.get(item.manifestation_id).subscribe((findings) => {
      const selected = findings.find((finding) => finding.is_present);
      this.form.patchValue({ finding_code: selected?.finding_code ?? '' });
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload = { evaluation_date: this.formatDate(raw.evaluation_date), system_code: raw.system_code ?? undefined, notes: raw.notes ?? undefined };

    const done = (manifestationId: number) => {
      this.manifestationFindingsService.replace(manifestationId, [{ finding_code: raw.finding_code!, is_present: true }]).subscribe(() => {
        this.form.reset({ evaluation_date: null, system_code: '', finding_code: '', notes: '' });
        this.findingsBySystem = [];
        this.editingId = null;
        this.load();
      });
    };

    if (this.editingId) {
      this.service.update(this.editingId, payload).subscribe((updated) => done(updated.manifestation_id));
      return;
    }

    this.service.create(this.patientId, payload).subscribe((created) => done(created.manifestation_id));
  }

  private loadTreatmentIndicators(): void {
    this.treatmentsService.listByPatient(this.patientId).subscribe((response) => {
      this.treatmentsByManifestation = {};
      unwrapResults(response).forEach((treatment) => {
        this.treatmentsByManifestation[treatment.manifestation_id] = true;
      });
    });
  }

  private loadManifestationFindingLabels(): void {
    this.selectedFindingByManifestation = {};
    this.items.forEach((manifestation) => {
      this.manifestationFindingsService.get(manifestation.manifestation_id).subscribe((findings) => {
        const selected = findings.find((finding) => finding.is_present);
        this.selectedFindingByManifestation[manifestation.manifestation_id] = selected?.finding_code ?? '-';
      });
    });
  }

  private formatDate(value: Date | null | undefined): string | undefined {
    if (!value) return undefined;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const [y, m, d] = value.split('-').map((n) => Number(n));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
}
