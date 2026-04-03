import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { TreatmentsService } from '../../core/api/treatments.service';
import { FindingCatalog, Manifestation, Treatment } from '../../shared/models/models';
import { unwrapResults } from '../../shared/models/pagination';
import { dateRangeValidator } from '../../shared/validators/date-range.validator';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, PatientTabsComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card">
      <h2>Treatments</h2>
      <p style="margin-top:-.25rem;color:#475569">Read-only review by default. Use Manifestations actions to add or edit treatment.</p>

      <form *ngIf="manageMode" [formGroup]="form" (ngSubmit)="save()" class="form-grid form-grid-3" style="margin:.75rem 0 1rem">
        <mat-form-field><mat-label>Medication</mat-label><input matInput formControlName="medication" /></mat-form-field>
        <mat-form-field><mat-label>Dose</mat-label><input matInput formControlName="dose" /></mat-form-field>
        <mat-form-field><mat-label>Indication</mat-label><input matInput formControlName="indication" /></mat-form-field>

        <mat-form-field>
          <mat-label>Start date</mat-label>
          <input matInput [matDatepicker]="startPicker" [max]="today" formControlName="start_date" readonly />
          <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field>
          <mat-label>End date</mat-label>
          <input matInput [matDatepicker]="endPicker" [max]="today" formControlName="end_date" readonly />
          <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="ACTIVE">ACTIVE</mat-option>
            <mat-option value="INACTIVE">INACTIVE</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="notes-field"><mat-label>Notes</mat-label><textarea matInput rows="5" formControlName="notes"></textarea></mat-form-field>
        <div style="grid-column:1/-1;display:flex;gap:.5rem">
          <button mat-flat-button type="submit" color="primary" [disabled]="form.invalid || saving">{{ selectedTreatmentId ? 'Update treatment' : 'Create treatment' }}</button>
          <button mat-stroked-button type="button" (click)="closeManageMode()">Cancel</button>
        </div>
      </form>
      <p *ngIf="saveError" style="color:#DC2626;margin:.5rem 0 0">{{ saveError }}</p>

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
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private treatmentsService = inject(TreatmentsService);
  private manifestationsService = inject(ManifestationsService);
  private manifestationFindingsService = inject(ManifestationFindingsService);
  private findingsCatalogService = inject(FindingsCatalogService);

  today = new Date();
  patientId = Number(this.route.snapshot.paramMap.get('patientId') ?? this.route.snapshot.paramMap.get('id'));
  selectedManifestationId =
    Number(this.route.snapshot.paramMap.get('manifestationId')) ||
    Number(this.route.snapshot.queryParamMap.get('manifestationId')) ||
    null;
  selectedTreatmentId =
    Number(this.route.snapshot.paramMap.get('treatmentId')) ||
    Number(this.route.snapshot.queryParamMap.get('treatmentId')) ||
    null;
  selectedTreatment: Treatment | null = null;
  manageMode = !!this.selectedManifestationId || !!this.selectedTreatmentId;

  items: Treatment[] = [];
  columns = ['system', 'findings', 'medication', 'dose', 'indication', 'status', 'dates', 'notes'];
  loading = false;
  error = false;
  saving = false;
  saveError = '';

  private manifestationCache: Record<number, Manifestation | null> = {};
  private findingsByManifestation: Record<number, string[]> = {};
  private findingDetailCache: Record<string, FindingCatalog | null> = {};
  @ViewChild(FormGroupDirective) private formGroupDirective?: FormGroupDirective;

  form = this.fb.group(
    {
      medication: ['', Validators.required],
      dose: [''],
      indication: [''],
      start_date: this.fb.control<Date | null>(null),
      end_date: this.fb.control<Date | null>(null),
      status: ['ACTIVE', Validators.pattern(/^(ACTIVE|INACTIVE)$/)],
      notes: ['']
    },
    { validators: [dateRangeValidator('start_date', 'end_date')] }
  );

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
        this.prefillManageFormIfNeeded();
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

  save(): void {
    if (!this.manageMode || this.form.invalid || !this.selectedManifestationId) return;
    this.saving = true;
    this.saveError = '';
    const raw = this.form.getRawValue();
    const payload = {
      medication: raw.medication ?? undefined,
      dose: raw.dose ?? undefined,
      indication: raw.indication ?? undefined,
      start_date: this.formatDate(raw.start_date),
      end_date: this.formatDate(raw.end_date),
      status: raw.status ? raw.status.toLowerCase() : undefined,
      notes: raw.notes ?? undefined
    };

    console.log('Payload enviado a la API:', {
      ...payload,
      patient: this.patientId,
      manifestation_id: this.selectedManifestationId,
      treatment_id: this.selectedTreatmentId
    });
    console.log('Selected manifestation ID:', this.selectedManifestationId);
    console.log('Selected treatment ID:', this.selectedTreatmentId);

    const done = () => {
      this.resetManageState();
      this.saving = false;
      this.load();
    };

    if (this.selectedTreatmentId) {
      this.treatmentsService.update(this.selectedTreatmentId, payload).subscribe({
        next: done,
        error: () => {
          this.saving = false;
          this.saveError = 'Unable to save treatment changes.';
        }
      });
      return;
    }

    this.treatmentsService.create(this.patientId, this.selectedManifestationId, payload).subscribe({
      next: done,
      error: () => {
        this.saving = false;
        this.saveError = 'Unable to save treatment changes.';
      }
    });
  }

  closeManageMode(): void {
    this.resetManageState();
    void this.router.navigate(['/patients', this.patientId, 'treatments']);
  }

  private prefillManageFormIfNeeded(): void {
    if (!this.manageMode) return;

    if (this.selectedTreatmentId) {
      const treatment = this.items.find((item) => item.treatment_id === this.selectedTreatmentId);
      if (treatment) {
        this.selectedTreatment = treatment;
        this.form.patchValue({
          medication: treatment.medication ?? '',
          dose: treatment.dose ?? '',
          indication: treatment.indication ?? '',
          start_date: this.parseDate(treatment.start_date),
          end_date: this.parseDate(treatment.end_date),
          status: this.normalizeStatus(treatment.status),
          notes: treatment.notes ?? ''
        });
      }
      return;
    }

    const byManifestation = this.items.find((item) => item.manifestation_id === this.selectedManifestationId);
    if (byManifestation) {
      this.selectedTreatmentId = byManifestation.treatment_id;
      this.selectedTreatment = byManifestation;
      this.form.patchValue({
        medication: byManifestation.medication ?? '',
        dose: byManifestation.dose ?? '',
        indication: byManifestation.indication ?? '',
        start_date: this.parseDate(byManifestation.start_date),
        end_date: this.parseDate(byManifestation.end_date),
        status: this.normalizeStatus(byManifestation.status),
        notes: byManifestation.notes ?? ''
      });
    }
  }

  private resetManageState(): void {
    this.selectedManifestationId = null;
    this.selectedTreatmentId = null;
    this.selectedTreatment = null;
    this.manageMode = false;
    this.saveError = '';

    const resetState = { medication: '', dose: '', indication: '', start_date: null, end_date: null, status: 'ACTIVE', notes: '' };
    this.form.reset(resetState);
    this.form.setErrors(null);
    this.form.markAsPristine();
    this.form.markAsUntouched();
    Object.values(this.form.controls).forEach((control) => {
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
    });
    this.form.updateValueAndValidity({ emitEvent: false });
    this.formGroupDirective?.resetForm(resetState);
  }

  private normalizeStatus(value?: string | null): 'ACTIVE' | 'INACTIVE' {
    const normalized = (value ?? '').toUpperCase();
    return normalized === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
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
