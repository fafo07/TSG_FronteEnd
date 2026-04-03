import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { forkJoin, map } from 'rxjs';

import { FindingsCatalogService } from '../../core/api/findings-catalog.service';
import { ManifestationFindingsService } from '../../core/api/manifestation-findings.service';
import { ManifestationsService } from '../../core/api/manifestations.service';
import { SystemsService } from '../../core/api/catalogs.service';
import { TreatmentsService } from '../../core/api/treatments.service';
import { FindingCatalog, Manifestation, System } from '../../shared/models/models';
import { unwrapResults } from '../../shared/models/pagination';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

type ManifestationFindingsPayload = { findings: Array<{ finding_code: string; is_present: boolean }> };

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, PatientTabsComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-patient-tabs [patientId]="patientId || 0" />

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
            <mat-option *ngFor="let s of allSystems" [value]="s.system_code">{{ s.system_name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Findings</mat-label>
          <mat-select formControlName="finding_codes" multiple [disabled]="!selectedSystemCode">
            <mat-option *ngFor="let finding of filteredFindings" [value]="finding.finding_code">{{ finding.finding_name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <p *ngIf="selectedSystemCode && !filteredFindings.length" style="grid-column:1/-1;margin:.25rem 0;color:#64748b">No findings available for selected system.</p>
        <p *ngIf="systemChangeWarning" style="grid-column:1/-1;margin:.25rem 0;color:#b45309">{{ systemChangeWarning }}</p>

        <mat-form-field class="notes-field"><mat-label>Notes</mat-label><textarea matInput rows="5" formControlName="notes"></textarea></mat-form-field>
        <div style="grid-column:1/-1;display:flex;gap:.75rem;justify-content:flex-end">
          <button mat-stroked-button type="button" (click)="cancelEdit()">Cancel</button>
          <button mat-flat-button type="submit" color="primary" [disabled]="form.invalid || isSaving">{{ isEditMode ? 'Update' : 'Save' }}</button>
        </div>
      </form>
      <p *ngIf="errorMessage" style="color:#DC2626;margin:.5rem 0 0">{{ errorMessage }}</p>

      <app-loading-state *ngIf="isLoading" />
      <app-error-state *ngIf="error" message="Failed to load manifestations" (retry)="reloadCurrentRouteContext()" />
      <app-empty-state *ngIf="!isLoading && !error && !manifestations.length" message="No manifestations found" />

      <h3 *ngIf="!isLoading && !error && manifestations.length" class="section-title">Manifestations list</h3>
      <table *ngIf="!isLoading && !error && manifestations.length" mat-table [dataSource]="manifestations" class="full-width" style="margin-top:1rem">
        <ng-container matColumnDef="evaluation_date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let m">{{ m.evaluation_date || '-' }}</td></ng-container>
        <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>System</th><td mat-cell *matCellDef="let m">{{ m.system || m.system_code }}</td></ng-container>
        <ng-container matColumnDef="findings"><th mat-header-cell *matHeaderCellDef>Findings</th><td mat-cell *matCellDef="let m">{{ findingsLabelByManifestation[m.manifestation_id] || '-' }}</td></ng-container>
        <ng-container matColumnDef="has_treatment"><th mat-header-cell *matHeaderCellDef>Treatment</th><td mat-cell *matCellDef="let m"><span class="status-badge" [class.status-badge-active]="hasTreatment(m.manifestation_id)">{{ hasTreatment(m.manifestation_id) ? 'Has treatment' : 'No treatment' }}</span></td></ng-container>
        <ng-container matColumnDef="notes"><th mat-header-cell *matHeaderCellDef>Notes</th><td mat-cell *matCellDef="let m">{{ m.notes || '-' }}</td></ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let m">
            <button mat-button [routerLink]="['/patients', patientId, 'manifestations', m.manifestation_id, 'edit']">Edit</button>
            <button mat-button color="primary" [routerLink]="treatmentLink(m.manifestation_id)">
              {{ hasTreatment(m.manifestation_id) ? 'View treatment' : 'Add treatment' }}
            </button>
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
  private router = inject(Router);
  private service = inject(ManifestationsService);
  private systemsService = inject(SystemsService);
  private findingsCatalogService = inject(FindingsCatalogService);
  private manifestationFindingsService = inject(ManifestationFindingsService);
  private treatmentsService = inject(TreatmentsService);

  patientId = 0;
  manifestationId: number | null = null;
  isEditMode = false;

  allSystems: System[] = [];
  allFindings: FindingCatalog[] = [];
  filteredFindings: FindingCatalog[] = [];
  selectedSystemCode: string | null = null;
  selectedFindingCodes: string[] = [];

  manifestations: Manifestation[] = [];
  selectedManifestation: Manifestation | null = null;

  isLoading = false;
  isSaving = false;
  error = false;
  errorMessage: string | null = null;
  systemChangeWarning = '';

  columns = ['evaluation_date', 'system_code', 'findings', 'has_treatment', 'notes', 'actions'];
  treatmentIdByManifestation: Record<number, number> = {};
  findingsLabelByManifestation: Record<number, string> = {};

  @ViewChild(FormGroupDirective) private formGroupDirective?: FormGroupDirective;

  form = this.fb.group({
    evaluation_date: this.fb.control<Date | null>(null, Validators.required),
    system_code: this.fb.control<string | null>(null, Validators.required),
    finding_codes: this.fb.control<string[]>([]),
    notes: this.fb.control<string>('')
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.patientId = Number(params.get('patientId') ?? params.get('id') ?? 0);
      this.manifestationId = Number(params.get('manifestationId') ?? 0) || null;
      this.isEditMode = !!this.manifestationId;
      this.reloadCurrentRouteContext();
    });
  }

  reloadCurrentRouteContext(): void {
    if (!this.patientId) return;
    this.isLoading = true;
    this.error = false;
    this.errorMessage = null;
    this.systemChangeWarning = '';

    forkJoin({
      systems: this.systemsService.getAllSystems(),
      findings: this.findingsCatalogService.getAllFindings(true),
      manifestations: this.service.listByPatient(this.patientId),
      treatments: this.treatmentsService.listByPatient(this.patientId)
    }).subscribe({
      next: ({ systems, findings, manifestations, treatments }) => {
        this.allSystems = systems;
        this.allFindings = findings;
        this.manifestations = unwrapResults(manifestations);
        this.treatmentIdByManifestation = {};
        unwrapResults(treatments).forEach((treatment) => {
          if (treatment.manifestation_id) this.treatmentIdByManifestation[treatment.manifestation_id] = treatment.treatment_id;
        });
        this.loadManifestationFindingsLabels();

        if (this.isEditMode && this.manifestationId) {
          this.loadManifestationForEdit(this.manifestationId);
        } else {
          this.resetFormVisualState();
          this.isLoading = false;
        }
      },
      error: () => {
        this.error = true;
        this.isLoading = false;
      }
    });
  }

  onSystemChange(systemCode: string): void {
    const previousSystemCode = this.selectedSystemCode;
    this.selectedSystemCode = systemCode || null;
    this.filteredFindings = this.selectedSystemCode
      ? this.allFindings.filter((finding) => finding.system === this.selectedSystemCode || finding.system_code === this.selectedSystemCode)
      : [];

    if (previousSystemCode && previousSystemCode !== this.selectedSystemCode && (this.form.getRawValue().finding_codes ?? []).length) {
      this.systemChangeWarning = 'Changing system clears previously selected findings.';
      this.form.patchValue({ finding_codes: [] });
      this.selectedFindingCodes = [];
    } else {
      this.systemChangeWarning = '';
    }
  }

  hasTreatment(manifestationId: number): boolean {
    return manifestationId in this.treatmentIdByManifestation;
  }

  treatmentLink(manifestationId: number): string[] {
    const treatmentId = this.treatmentIdByManifestation[manifestationId];
    if (treatmentId) return ['/patients', String(this.patientId), 'treatments', String(treatmentId), 'edit'];
    return ['/patients', String(this.patientId), 'manifestations', String(manifestationId), 'treatments', 'new'];
  }

  save(): void {
    if (this.form.invalid || !this.patientId) return;

    this.isSaving = true;
    this.errorMessage = null;

    const manifestationPayload = this.buildManifestationPayload();
    const findingsPayload = this.buildManifestationFindingsPayload();

    const saveFindings = (targetManifestationId: number, onSuccess: () => void): void => {
      console.log('Manifestation findings save debug:', {
        patientId: this.patientId,
        manifestationId: targetManifestationId,
        selectedSystemCode: this.selectedSystemCode,
        selectedFindingCodes: this.selectedFindingCodes,
        findingsPayload
      });
      this.manifestationFindingsService.replace(targetManifestationId, findingsPayload.findings).subscribe({
        next: onSuccess,
        error: (error) => {
          console.error('Manifestation findings replace failed:', error);
          this.isSaving = false;
          this.errorMessage = 'Unable to save manifestation findings. Please verify selected findings.';
        }
      });
    };

    const finish = () => {
      this.isSaving = false;
      this.resetFormVisualState();
      void this.router.navigate(['/patients', this.patientId, 'manifestations']);
      this.reloadCurrentRouteContext();
    };

    if (this.isEditMode && this.manifestationId) {
      this.service.update(this.manifestationId, manifestationPayload).subscribe({
        next: (updated) => saveFindings(updated.manifestation_id, finish),
        error: (error) => {
          console.error('Manifestation update failed:', error);
          this.isSaving = false;
          this.errorMessage = 'Unable to save manifestation changes.';
        }
      });
      return;
    }

    this.service.create(this.patientId, manifestationPayload).subscribe({
      next: (created) => saveFindings(created.manifestation_id, finish),
      error: (error) => {
        console.error('Manifestation create failed:', error);
        this.isSaving = false;
        this.errorMessage = 'Unable to save manifestation changes.';
      }
    });
  }

  cancelEdit(): void {
    this.resetFormVisualState();
    if (this.patientId) void this.router.navigate(['/patients', this.patientId, 'manifestations']);
  }

  private loadManifestationForEdit(manifestationId: number): void {
    forkJoin({
      manifestation: this.service.getById(manifestationId),
      findings: this.manifestationFindingsService.get(manifestationId)
    }).subscribe({
      next: ({ manifestation, findings }) => {
        this.selectedManifestation = manifestation;
        const systemCode = manifestation.system || manifestation.system_code || null;
        const selectedCodes = findings
          .filter((item) => item.is_present)
          .map((item) => item.finding_code)
          .filter((code) => !!code);

        this.selectedSystemCode = systemCode;
        this.filteredFindings = this.selectedSystemCode
          ? this.allFindings.filter((finding) => finding.system === this.selectedSystemCode || finding.system_code === this.selectedSystemCode)
          : [];
        this.selectedFindingCodes = selectedCodes.filter((code) => this.filteredFindings.some((finding) => finding.finding_code === code));

        this.form.patchValue({
          evaluation_date: this.parseDate(manifestation.evaluation_date),
          system_code: systemCode,
          finding_codes: this.selectedFindingCodes,
          notes: manifestation.notes ?? ''
        });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Manifestation edit preload failed:', error);
        this.error = true;
        this.isLoading = false;
      }
    });
  }

  private resetFormVisualState(): void {
    this.systemChangeWarning = '';
    this.selectedSystemCode = null;
    this.selectedFindingCodes = [];
    this.filteredFindings = [];
    this.selectedManifestation = null;
    this.errorMessage = null;

    const resetState = { evaluation_date: null, system_code: null, finding_codes: [], notes: '' };
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

  private loadManifestationFindingsLabels(): void {
    if (!this.manifestations.length) {
      this.findingsLabelByManifestation = {};
      return;
    }

    const requests = this.manifestations.map((manifestation) =>
      this.manifestationFindingsService.get(manifestation.manifestation_id).pipe(
        map((rows) => ({
          manifestationId: manifestation.manifestation_id,
          codes: rows.filter((row) => row.is_present).map((row) => row.finding_code)
        }))
      )
    );

    forkJoin(requests).subscribe({
      next: (results) => {
        this.findingsLabelByManifestation = {};
        results.forEach(({ manifestationId, codes }) => {
          this.findingsLabelByManifestation[manifestationId] = codes.length
            ? codes.map((code) => this.allFindings.find((finding) => finding.finding_code === code)?.finding_name ?? code).join(', ')
            : '-';
        });
      },
      error: () => {
        this.findingsLabelByManifestation = {};
      }
    });
  }

  private buildManifestationPayload(): Partial<Manifestation> & { patient: number; system?: string } {
    const raw = this.form.getRawValue();
    this.selectedSystemCode = raw.system_code ?? null;
    return {
      patient: this.patientId,
      system: this.selectedSystemCode ?? undefined,
      evaluation_date: this.formatDate(raw.evaluation_date),
      notes: raw.notes ?? undefined
    };
  }

  private buildManifestationFindingsPayload(): ManifestationFindingsPayload {
    const raw = this.form.getRawValue();
    this.selectedFindingCodes = (raw.finding_codes ?? []).filter((code): code is string => !!code);
    return {
      findings: this.selectedFindingCodes.map((code) => ({
        finding_code: code,
        is_present: true
      }))
    };
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
