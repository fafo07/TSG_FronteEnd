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
import { catchError, forkJoin, map, of } from 'rxjs';

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
          <mat-select formControlName="finding_codes" [disabled]="!form.value.system_code" multiple>
            <mat-option *ngFor="let f of findingsBySystem" [value]="f.finding_code">{{ f.finding_name }} ({{ f.finding_code }})</mat-option>
          </mat-select>
          <mat-hint *ngIf="form.value.system_code && !findingsBySystem.length">No findings available for selected system</mat-hint>
        </mat-form-field>

        <mat-form-field class="notes-field"><mat-label>Notes</mat-label><textarea matInput rows="5" formControlName="notes"></textarea></mat-form-field>
        <div style="grid-column:1/-1;display:flex;gap:.75rem;justify-content:flex-end">
          <button mat-stroked-button type="button" (click)="cancelEdit()">Cancel</button>
          <button mat-flat-button type="submit" color="primary" [disabled]="form.invalid || saving">{{ editingId ? 'Update' : 'Save' }}</button>
        </div>
      </form>
      <p *ngIf="saveError" style="color:#DC2626;margin:.5rem 0 0">{{ saveError }}</p>

      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" message="Failed to load manifestations" (retry)="load()" />
      <app-empty-state *ngIf="!loading && !error && !items.length" message="No manifestations found" />

      <h3 *ngIf="!loading && !error && items.length" class="section-title">Manifestations list</h3>
      <table *ngIf="!loading && !error && items.length" mat-table [dataSource]="items" class="full-width" style="margin-top:1rem">
        <ng-container matColumnDef="evaluation_date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let m">{{ m.evaluation_date || '-' }}</td></ng-container>
        <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>System</th><td mat-cell *matCellDef="let m">{{ m.system || m.system_code }}</td></ng-container>
        <ng-container matColumnDef="findings"><th mat-header-cell *matHeaderCellDef>Findings</th><td mat-cell *matCellDef="let m">{{ findingsLabelByManifestation[m.manifestation_id] || '-' }}</td></ng-container>
        <ng-container matColumnDef="has_treatment"><th mat-header-cell *matHeaderCellDef>Treatment</th><td mat-cell *matCellDef="let m"><span class="status-badge" [class.status-badge-active]="hasTreatment(m.manifestation_id)">{{ hasTreatment(m.manifestation_id) ? 'Has treatment' : 'No treatment' }}</span></td></ng-container>
        <ng-container matColumnDef="notes"><th mat-header-cell *matHeaderCellDef>Notes</th><td mat-cell *matCellDef="let m">{{ m.notes || '-' }}</td></ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let m">
            <button mat-button [routerLink]="['/manifestations', m.manifestation_id, 'findings']">Edit findings</button>
            <button mat-button color="primary" [routerLink]="['/patients', patientId, 'treatments']" [queryParams]="treatmentActionParams(m.manifestation_id)">{{ hasTreatment(m.manifestation_id) ? 'Edit treatment' : 'Add treatment' }}</button>
            <button mat-button (click)="edit(m)">Edit</button>
          </td>
        </ng-container>
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
  findingsCatalog: FindingCatalog[] = [];
  findingsByCode: Record<string, FindingCatalog> = {};
  private findingsDetailCache: Record<string, FindingCatalog | null> = {};
  findingsBySystem: FindingCatalog[] = [];
  columns = ['evaluation_date', 'system_code', 'findings', 'has_treatment', 'notes', 'actions'];
  editingId: number | null = null;
  loading = false;
  error = false;
  saving = false;
  saveError = '';
  treatmentIdByManifestation: Record<number, number> = {};
  findingsLabelByManifestation: Record<number, string> = {};

  form = this.fb.group({
    evaluation_date: this.fb.control<Date | null>(null, Validators.required),
    system_code: this.fb.control<string | null>(null, Validators.required),
    finding_codes: this.fb.control<string[]>([], Validators.required),
    notes: this.fb.control<string>('')
  });

  constructor() {
    this.systemsService.list().subscribe((res) => (this.systems = res.results));
    this.loadAllFindings(1);
    this.load();
  }

  onSystemChange(systemCode: string): void {
    this.findingsBySystem = this.findingsCatalog.filter((f) => (f.system ?? f.system_code) === systemCode && f.is_active);
    const selectedCodes = (this.form.getRawValue().finding_codes ?? []) as string[];
    const allowed = new Set(this.findingsBySystem.map((f) => f.finding_code));
    this.form.patchValue({ finding_codes: selectedCodes.filter((code) => allowed.has(code)) });
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.service.listByPatient(this.patientId).subscribe({
      next: (data) => {
        this.items = unwrapResults(data);
        this.loadTreatmentIndicators();
        this.loadManifestationFindingsLabels();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  hasTreatment(manifestationId: number): boolean {
    return manifestationId in this.treatmentIdByManifestation;
  }

  treatmentActionParams(manifestationId: number): { manifestationId: number; treatmentId?: number } {
    const treatmentId = this.treatmentIdByManifestation[manifestationId];
    return treatmentId ? { manifestationId, treatmentId } : { manifestationId };
  }

  edit(item: Manifestation): void {
    this.editingId = item.manifestation_id;
    const systemCode = item.system_code || item.system || '';
    this.form.patchValue({ evaluation_date: this.parseDate(item.evaluation_date), system_code: systemCode, notes: item.notes ?? '', finding_codes: [] });
    this.onSystemChange(systemCode);

    this.manifestationFindingsService.get(item.manifestation_id).subscribe((findings) => {
      const selectedCodes = findings.filter((finding) => finding.is_present).map((finding) => finding.finding_code);
      this.form.patchValue({ finding_codes: selectedCodes });
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.saveError = '';
    const raw = this.form.getRawValue();
    const payload = {
      evaluation_date: this.formatDate(raw.evaluation_date),
      system: raw.system_code ?? undefined,
      patient_id: this.patientId,
      notes: raw.notes ?? undefined
    };

    const done = (manifestationId: number) => {
      const selectedCodes = ((raw.finding_codes as string[] | null) ?? []).filter((code) => !!code);
      const findingsPayload = selectedCodes.map((finding_code) => ({ finding_code, is_present: true }));
      this.manifestationFindingsService.replace(manifestationId, findingsPayload).subscribe({
        next: () => {
          this.form.reset({ evaluation_date: null, system_code: null, finding_codes: [], notes: '' });
          this.findingsBySystem = [];
          this.editingId = null;
          this.saving = false;
          this.load();
        },
        error: () => {
          this.saving = false;
          this.saveError = 'Unable to save manifestation changes.';
        }
      });
    };

    if (this.editingId) {
      this.service.update(this.editingId, payload).subscribe({
        next: (updated) => done(updated.manifestation_id),
        error: () => {
          this.saving = false;
          this.saveError = 'Unable to save manifestation changes.';
        }
      });
      return;
    }

    this.service.create(this.patientId, payload).subscribe({
      next: (created) => done(created.manifestation_id),
      error: () => {
        this.saving = false;
        this.saveError = 'Unable to save manifestation changes.';
      }
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({ evaluation_date: null, system_code: null, finding_codes: [], notes: '' });
    this.findingsBySystem = [];
    this.saveError = '';
  }

  private loadAllFindings(page: number): void {
    this.findingsCatalogService.list(page).subscribe({
      next: (response) => {
        response.results.forEach((finding) => {
          this.findingsByCode[finding.finding_code] = finding;
        });
        this.findingsCatalog = Object.values(this.findingsByCode);
        this.items.length && this.loadManifestationFindingsLabels();
        if (response.next) {
          this.loadAllFindings(page + 1);
        }
      }
    });
  }

  private loadTreatmentIndicators(): void {
    this.treatmentsService.listByPatient(this.patientId).subscribe((response) => {
      this.treatmentIdByManifestation = {};
      unwrapResults(response).forEach((treatment) => {
        if (treatment.manifestation_id) this.treatmentIdByManifestation[treatment.manifestation_id] = treatment.treatment_id;
      });
    });
  }

  private loadManifestationFindingsLabels(): void {
    this.findingsLabelByManifestation = {};
    this.items.forEach((manifestation) => {
      this.manifestationFindingsService.get(manifestation.manifestation_id).subscribe((findings) => {
        const selectedCodes = findings.filter((f) => f.is_present).map((f) => f.finding_code).filter((code) => !!code);
        if (!selectedCodes.length) {
          this.findingsLabelByManifestation[manifestation.manifestation_id] = '-';
          return;
        }

        const missingCodes = Array.from(new Set(selectedCodes)).filter((code) => !(code in this.findingsDetailCache));
        if (!missingCodes.length) {
          this.findingsLabelByManifestation[manifestation.manifestation_id] = this.codesToLabel(selectedCodes);
          return;
        }

        const requests = missingCodes.map((code) =>
          this.findingsCatalogService.getByCode(code).pipe(
            map((detail) => ({ code, detail })),
            catchError(() => of({ code, detail: null as FindingCatalog | null }))
          )
        );

        forkJoin(requests).subscribe((results) => {
          results.forEach(({ code, detail }) => {
            this.findingsDetailCache[code] = detail;
          });
          this.findingsLabelByManifestation[manifestation.manifestation_id] = this.codesToLabel(selectedCodes);
        });
      });
    });
  }

  private codesToLabel(codes: string[]): string {
    return codes.map((code) => this.findingsDetailCache[code]?.finding_name ?? this.findingsByCode[code]?.finding_name ?? code).join(', ');
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
