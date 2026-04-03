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
          <mat-select formControlName="finding_codes" multiple [disabled]="!selectedSystem">
            <mat-option *ngFor="let finding of filteredFindings" [value]="finding.finding_code">{{ finding.finding_name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <p *ngIf="selectedSystem && !filteredFindings.length" style="grid-column:1/-1;margin:.25rem 0;color:#64748b">No findings available for selected system.</p>
        <p *ngIf="systemChangeWarning" style="grid-column:1/-1;margin:.25rem 0;color:#b45309">{{ systemChangeWarning }}</p>

        <mat-form-field class="notes-field"><mat-label>Notes</mat-label><textarea matInput rows="5" formControlName="notes"></textarea></mat-form-field>
        <div style="grid-column:1/-1;display:flex;gap:.75rem;justify-content:flex-end">
          <button mat-stroked-button type="button" (click)="cancelEdit()">Cancel</button>
          <button mat-flat-button type="submit" color="primary" [disabled]="form.invalid || isSaving">{{ isEditMode ? 'Update' : 'Save' }}</button>
        </div>
      </form>
      <p *ngIf="saveError" style="color:#DC2626;margin:.5rem 0 0">{{ saveError }}</p>

      <app-loading-state *ngIf="isLoading" />
      <app-error-state *ngIf="error" message="Failed to load manifestations" (retry)="reloadCurrentRouteContext()" />
      <app-empty-state *ngIf="!isLoading && !error && !items.length" message="No manifestations found" />

      <h3 *ngIf="!isLoading && !error && items.length" class="section-title">Manifestations list</h3>
      <table *ngIf="!isLoading && !error && items.length" mat-table [dataSource]="items" class="full-width" style="margin-top:1rem">
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

  patientId: number | null = null;
  manifestationId: number | null = null;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  error = false;
  saveError = '';
  systemChangeWarning = '';

  allSystems: System[] = [];
  allFindings: FindingCatalog[] = [];
  filteredFindings: FindingCatalog[] = [];
  selectedFindingCodes: string[] = [];
  selectedSystem: string | null = null;

  items: Manifestation[] = [];
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
      this.patientId = Number(params.get('patientId') ?? params.get('id'));
      this.manifestationId = Number(params.get('manifestationId')) || null;
      this.isEditMode = !!this.manifestationId;
      this.reloadCurrentRouteContext();
    });
  }

  reloadCurrentRouteContext(): void {
    if (!this.patientId) return;
    this.isLoading = true;
    this.error = false;
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
        this.items = unwrapResults(manifestations);
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
    const previousSystem = this.selectedSystem;
    this.selectedSystem = systemCode || null;
    this.filteredFindings = this.selectedSystem ? this.allFindings.filter((finding) => (finding.system_code || finding.system) === this.selectedSystem) : [];

    if (previousSystem && previousSystem !== this.selectedSystem && (this.form.getRawValue().finding_codes ?? []).length) {
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
    this.saveError = '';
    const raw = this.form.getRawValue();
    const payload = {
      evaluation_date: this.formatDate(raw.evaluation_date),
      system: raw.system_code ?? undefined,
      notes: raw.notes ?? undefined
    };
    const findingsPayload = (raw.finding_codes ?? []).map((finding_code) => ({ finding_code, is_present: true }));

    const finish = () => {
      this.isSaving = false;
      this.resetFormVisualState();
      void this.router.navigate(['/patients', this.patientId, 'manifestations']);
      this.reloadCurrentRouteContext();
    };

    if (this.isEditMode && this.manifestationId) {
      this.service.update(this.manifestationId, payload).subscribe({
        next: (updated) => {
          this.manifestationFindingsService.replace(updated.manifestation_id, findingsPayload).subscribe({
            next: finish,
            error: () => {
              this.isSaving = false;
              this.saveError = 'Unable to save manifestation findings.';
            }
          });
        },
        error: () => {
          this.isSaving = false;
          this.saveError = 'Unable to save manifestation changes.';
        }
      });
      return;
    }

    this.service.create(this.patientId, payload).subscribe({
      next: (created) => {
        this.manifestationFindingsService.replace(created.manifestation_id, findingsPayload).subscribe({
          next: finish,
          error: () => {
            this.isSaving = false;
            this.saveError = 'Manifestation created, but findings could not be saved.';
            this.reloadCurrentRouteContext();
          }
        });
      },
      error: () => {
        this.isSaving = false;
        this.saveError = 'Unable to save manifestation changes.';
      }
    });
  }

  cancelEdit(): void {
    this.resetFormVisualState();
    if (this.patientId) void this.router.navigate(['/patients', this.patientId, 'manifestations']);
  }

  private loadManifestationForEdit(manifestationId: number): void {
    if (!this.patientId) return;
    forkJoin({
      manifestation: this.service.getById(manifestationId),
      findings: this.manifestationFindingsService.get(manifestationId)
    }).subscribe({
      next: ({ manifestation, findings }) => {
        const systemCode = manifestation.system_code || manifestation.system || null;
        const selectedCodes = findings.filter((item) => item.is_present).map((item) => item.finding_code);
        this.selectedSystem = systemCode;
        this.filteredFindings = this.selectedSystem ? this.allFindings.filter((finding) => (finding.system_code || finding.system) === this.selectedSystem) : [];
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
      error: () => {
        this.error = true;
        this.isLoading = false;
      }
    });
  }

  private resetFormVisualState(): void {
    this.systemChangeWarning = '';
    this.selectedSystem = null;
    this.selectedFindingCodes = [];
    this.filteredFindings = [];
    this.saveError = '';

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
    if (!this.items.length) {
      this.findingsLabelByManifestation = {};
      return;
    }

    const requests = this.items.map((manifestation) =>
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
          if (!codes.length) {
            this.findingsLabelByManifestation[manifestationId] = '-';
            return;
          }
          this.findingsLabelByManifestation[manifestationId] = codes
            .map((code) => this.allFindings.find((finding) => finding.finding_code === code)?.finding_name ?? code)
            .join(', ');
        });
      },
      error: () => {
        this.findingsLabelByManifestation = {};
      }
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
