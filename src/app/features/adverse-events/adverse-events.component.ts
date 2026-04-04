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

import { AdverseEventsService } from '../../core/api/adverse-events.service';
import { TreatmentsService } from '../../core/api/treatments.service';
import { AdverseEvent, Treatment } from '../../shared/models/models';
import { unwrapResults } from '../../shared/models/pagination';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatTableModule, MatDatepickerModule, MatNativeDateModule, PatientTabsComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card">
      <h2>Adverse events</h2>
      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid form-grid-3">
        <mat-form-field><mat-label>Event</mat-label><input matInput formControlName="event_name" /></mat-form-field>
        <mat-form-field>
          <mat-label>Event date</mat-label>
          <input matInput [matDatepicker]="eventDatePicker" [max]="today" formControlName="event_date" readonly />
          <mat-datepicker-toggle matIconSuffix [for]="eventDatePicker"></mat-datepicker-toggle>
          <mat-datepicker #eventDatePicker></mat-datepicker>
        </mat-form-field>
        <mat-form-field><mat-label>Severity</mat-label><mat-select formControlName="severity"><mat-option value="MILD">Mild</mat-option><mat-option value="MODERATE">Moderate</mat-option><mat-option value="SEVERE">Severe</mat-option><mat-option value="LIFE_THREATENING">Life-threatening</mat-option></mat-select></mat-form-field>
        <mat-form-field><mat-label>Action taken</mat-label><input matInput formControlName="action_taken" /></mat-form-field>
        <mat-form-field><mat-label>Treatment (optional)</mat-label><mat-select formControlName="treatment_id"><mat-option [value]="null">No link</mat-option><mat-option *ngFor="let t of treatments" [value]="t.treatment_id">#{{ t.treatment_id }} - {{ t.medication }}</mat-option></mat-select></mat-form-field>
        <mat-form-field class="notes-field"><mat-label>Notes</mat-label><textarea matInput rows="5" formControlName="notes"></textarea></mat-form-field>
        <div style="grid-column:1/-1;display:flex;gap:.75rem;justify-content:flex-end"><button mat-stroked-button type="button" (click)="cancelEdit()">Cancel</button><button mat-flat-button type="submit" color="primary" [disabled]="form.invalid || saving">{{ editingId ? 'Update' : 'Save' }}</button></div>
      </form>
      <p *ngIf="saveError" style="color:#DC2626;margin:.5rem 0 0">{{ saveError }}</p>

      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" message="Failed to load adverse events" (retry)="load()" />
      <app-empty-state *ngIf="!loading && !error && !items.length" message="No adverse events found" />

      <h3 *ngIf="!loading && !error && items.length" class="section-title">Adverse events list</h3>
      <table *ngIf="!loading && !error && items.length" mat-table [dataSource]="items" class="full-width" style="margin-top:1rem">
        <ng-container matColumnDef="event_name"><th mat-header-cell *matHeaderCellDef>Event</th><td mat-cell *matCellDef="let item">{{ item.event_name }}</td></ng-container>
        <ng-container matColumnDef="event_date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let item">{{ item.event_date }}</td></ng-container>
        <ng-container matColumnDef="treatment_id"><th mat-header-cell *matHeaderCellDef>Treatment</th><td mat-cell *matCellDef="let item">{{ resolveTreatmentLabel(item) }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let item"><button mat-button (click)="startEdit(item)">Edit</button><button mat-button color="warn" (click)="remove(item)">Delete</button></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-card>
  `
})
export class AdverseEventsComponent {
  today = new Date();
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(AdverseEventsService);
  private treatmentsService = inject(TreatmentsService);

  patientId = Number(this.route.snapshot.paramMap.get('patientId') ?? this.route.snapshot.paramMap.get('id'));
  items: AdverseEvent[] = [];
  treatments: Treatment[] = [];
  columns = ['event_name', 'event_date', 'treatment_id', 'actions'];
  editingId: number | null = null;
  loading = false;
  error = false;
  saving = false;
  saveError = '';

  form = this.fb.group({
    event_name: ['', [Validators.required, Validators.maxLength(255)]],
    event_date: [null as Date | null, Validators.required],
    severity: ['MILD', Validators.maxLength(50)],
    action_taken: ['', Validators.maxLength(255)],
    notes: [''],
    treatment_id: [null as number | null]
  });

  constructor() {
    this.load();
    this.treatmentsService.listByPatient(this.patientId).subscribe((data) => (this.treatments = unwrapResults(data)));
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.service.listByPatient(this.patientId).subscribe({
      next: (data) => {
        this.items = unwrapResults(data);
        this.resetFormVisualState();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  startEdit(item: AdverseEvent): void {
    this.editingId = item.ae_id;
    this.form.patchValue({ ...item, event_date: this.parseDate(item.event_date), treatment_id: item.treatment_id ?? item.treatment ?? null });
    this.resetFormVisualState();
  }

  resolveTreatmentLabel(item: AdverseEvent): string {
    const treatmentId = item.treatment_id ?? item.treatment ?? null;
    if (!treatmentId) return '-';
    const treatment = this.treatments.find((t) => t.treatment_id === treatmentId);
    return treatment ? `${treatment.medication} (#${treatmentId})` : `#${treatmentId}`;
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({ event_name: '', event_date: null, severity: 'MILD', action_taken: '', notes: '', treatment_id: null });
    this.resetFormVisualState();
  }

  remove(item: AdverseEvent): void {
    if (!window.confirm(`Delete event "${item.event_name}"?`)) return;
    this.service.delete(item.ae_id).subscribe(() => this.load());
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.saveError = '';
    const raw = this.form.getRawValue();
    const payload = {
      event_name: raw.event_name ?? undefined,
      event_date: this.formatDate(raw.event_date),
      severity: raw.severity ?? undefined,
      action_taken: raw.action_taken ?? undefined,
      notes: raw.notes ?? undefined,
      treatment_id: raw.treatment_id ?? undefined
    };

    const done = () => {
      this.form.reset({ event_name: '', event_date: null, severity: 'MILD', action_taken: '', notes: '', treatment_id: null });
      this.resetFormVisualState();
      this.editingId = null;
      this.saving = false;
      this.load();
    };

    if (this.editingId) {
      this.service.update(this.editingId, payload).subscribe({
        next: done,
        error: () => {
          this.saving = false;
          this.saveError = 'Unable to save adverse event changes.';
        }
      });
      return;
    }

    this.service.create(this.patientId, payload).subscribe({
      next: done,
      error: () => {
        this.saving = false;
        this.saveError = 'Unable to save adverse event changes.';
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

  private resetFormVisualState(): void {
    this.form.markAsPristine();
    this.form.markAsUntouched();
    Object.values(this.form.controls).forEach((control) => {
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity({ emitEvent: false });
    });
    this.form.updateValueAndValidity({ emitEvent: false });
  }
}
