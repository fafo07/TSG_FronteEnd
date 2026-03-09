import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
import { TreatmentsService } from '../../core/api/treatments.service';
import { ManifestationsService } from '../../core/api/manifestations.service';
import { FindingCatalog, Manifestation, Treatment } from '../../shared/models/models';
import { dateRangeValidator } from '../../shared/validators/date-range.validator';
import { unwrapResults } from '../../shared/models/pagination';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, PatientTabsComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card">
      <h2>Treatments</h2>
      <p style="margin-top:-.25rem;color:#475569">Patient #{{ patientId }} · Treatments are created from a manifestation context.</p>

      <div *ngIf="selectedManifestationId; else noManifestationContext" style="margin:.5rem 0 1rem;padding:.6rem .75rem;border-radius:.5rem;background:#EFF6FF;color:#1E3A8A;display:inline-block">
        Creating treatment for manifestation: {{ manifestationLabel(selectedManifestationId) }}
      </div>
      <ng-template #noManifestationContext>
        <p style="margin:.5rem 0 1rem;padding:.6rem .75rem;border-radius:.5rem;background:#F8FAFC;color:#334155;display:inline-block">Open this page from Manifestations using "Add treatment" to create a new record.</p>
      </ng-template>

      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid form-grid-3">
        <mat-form-field>
          <mat-label>Medication</mat-label>
          <input matInput formControlName="medication" />
        </mat-form-field>
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
        <button mat-flat-button color="primary" [disabled]="form.invalid || (!selectedManifestationId && !editingId)">{{ editingId ? 'Update' : 'Save' }}</button>
      </form>

      <p *ngIf="form.errors?.['invalidDateRange']" style="color:#DC2626">End date must be greater than or equal to start date</p>

      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" message="Failed to load treatments" (retry)="load()" />
      <app-empty-state *ngIf="!loading && !error && !items.length" message="No treatments found" />

      <h3 *ngIf="!loading && !error && items.length" class="section-title">Patient medications</h3>
      <table *ngIf="!loading && !error && items.length" mat-table [dataSource]="items" class="full-width" style="margin-top:1rem">
        <ng-container matColumnDef="manifestation"><th mat-header-cell *matHeaderCellDef>Manifestation</th><td mat-cell *matCellDef="let t">{{ manifestationLabel(t.manifestation_id) }}</td></ng-container>
        <ng-container matColumnDef="findings"><th mat-header-cell *matHeaderCellDef>Findings</th><td mat-cell *matCellDef="let t">{{ findingsLabel(t.manifestation_id) }}</td></ng-container>
        <ng-container matColumnDef="medication"><th mat-header-cell *matHeaderCellDef>Medication</th><td mat-cell *matCellDef="let t">{{ t.medication }}</td></ng-container>
        <ng-container matColumnDef="dose"><th mat-header-cell *matHeaderCellDef>Dose</th><td mat-cell *matCellDef="let t">{{ t.dose || '-' }}</td></ng-container>
        <ng-container matColumnDef="indication"><th mat-header-cell *matHeaderCellDef>Indication</th><td mat-cell *matCellDef="let t">{{ t.indication || '-' }}</td></ng-container>
        <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let t">{{ t.status || '-' }}</td></ng-container>
        <ng-container matColumnDef="dates"><th mat-header-cell *matHeaderCellDef>Dates</th><td mat-cell *matCellDef="let t">{{ t.start_date || '-' }} → {{ t.end_date || '-' }}</td></ng-container>
        <ng-container matColumnDef="notes"><th mat-header-cell *matHeaderCellDef>Notes</th><td mat-cell *matCellDef="let t">{{ t.notes || '-' }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let t"><button mat-button (click)="startEdit(t)">Edit</button><button mat-button color="warn" (click)="remove(t)">Delete</button></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-card>
  `
})
export class TreatmentsComponent {
  today = new Date();
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(TreatmentsService);
  private manifestationsService = inject(ManifestationsService);
  private manifestationFindingsService = inject(ManifestationFindingsService);
  private findingsCatalogService = inject(FindingsCatalogService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  selectedManifestationId = Number(this.route.snapshot.queryParamMap.get('manifestationId')) || null;
  items: Treatment[] = [];
  manifestations: Manifestation[] = [];
  findingsByCode: Record<string, FindingCatalog> = {};
  findingsLabelByManifestationId: Record<number, string> = {};
  columns = ['manifestation', 'findings', 'medication', 'dose', 'indication', 'status', 'dates', 'notes', 'actions'];
  editingId: number | null = null;
  loading = false;
  error = false;

  form = this.fb.group(
    {
      medication: ['', Validators.required],
      dose: [''],
      indication: [''],
      start_date: [null as Date | null],
      end_date: [null as Date | null],
      status: ['ACTIVE', Validators.pattern(/^(ACTIVE|INACTIVE)$/)],
      notes: ['']
    },
    { validators: [dateRangeValidator('start_date', 'end_date')] }
  );

  constructor() {
    this.loadAllFindings(1);
    this.manifestationsService.listByPatient(this.patientId).subscribe((data) => {
      this.manifestations = unwrapResults(data);
      this.loadFindingsContext();
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.service.listByPatient(this.patientId).subscribe({
      next: (data) => {
        this.items = unwrapResults(data);
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  manifestationLabel(id: number): string {
    const manifestation = this.manifestations.find((m) => m.manifestation_id === id);
    return manifestation ? `${manifestation.system || manifestation.system_code} · ${manifestation.evaluation_date}` : `#${id}`;
  }

  findingsLabel(manifestationId: number): string {
    return this.findingsLabelByManifestationId[manifestationId] ?? '-';
  }

  startEdit(item: Treatment): void {
    this.editingId = item.treatment_id;
    this.selectedManifestationId = item.manifestation_id;
    this.form.patchValue({ ...item, start_date: this.parseDate(item.start_date), end_date: this.parseDate(item.end_date) });
  }

  remove(item: Treatment): void {
    if (!window.confirm(`Delete treatment "${item.medication}"?`)) return;
    this.service.delete(item.treatment_id).subscribe(() => this.load());
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    if (!this.selectedManifestationId && !this.editingId) return;

    const payload = {
      medication: raw.medication ?? undefined,
      dose: raw.dose ?? undefined,
      indication: raw.indication ?? undefined,
      start_date: this.formatDate(raw.start_date),
      end_date: this.formatDate(raw.end_date),
      status: raw.status ?? undefined,
      notes: raw.notes ?? undefined
    };

    const done = () => {
      this.form.reset({ medication: '', dose: '', indication: '', start_date: null, end_date: null, status: 'ACTIVE', notes: '' });
      this.editingId = null;
      this.load();
    };

    if (this.editingId) {
      this.service.update(this.editingId, payload).subscribe(done);
      return;
    }

    this.service.create(this.patientId, Number(this.selectedManifestationId), payload).subscribe(done);
  }

  private loadAllFindings(page: number): void {
    this.findingsCatalogService.list(page).subscribe({
      next: (response) => {
        response.results.forEach((finding) => {
          this.findingsByCode[finding.finding_code] = finding;
        });
        if (response.next) this.loadAllFindings(page + 1);
      }
    });
  }

  private loadFindingsContext(): void {
    this.findingsLabelByManifestationId = {};
    this.manifestations.forEach((manifestation) => {
      this.manifestationFindingsService.get(manifestation.manifestation_id).subscribe((findings) => {
        const codes = findings.filter((f) => f.is_present).map((f) => f.finding_code);
        if (!codes.length) {
          this.findingsLabelByManifestationId[manifestation.manifestation_id] = '-';
          return;
        }
        const labels = codes.map((code) => this.findingsByCode[code]?.finding_name ?? code);
        this.findingsLabelByManifestationId[manifestation.manifestation_id] = labels.join(', ');
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
