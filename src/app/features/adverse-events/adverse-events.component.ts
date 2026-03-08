import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatTableModule, PatientTabsComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card">
      <h2>Adverse events</h2>
      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid form-grid-3">
        <mat-form-field><mat-label>Event</mat-label><input matInput formControlName="event_name" /></mat-form-field>
        <mat-form-field><mat-label>Event date</mat-label><input matInput type="date" [max]="today" formControlName="event_date" /></mat-form-field>
        <mat-form-field><mat-label>Severity</mat-label><mat-select formControlName="severity"><mat-option value="MILD">Mild</mat-option><mat-option value="MODERATE">Moderate</mat-option><mat-option value="SEVERE">Severe</mat-option><mat-option value="LIFE_THREATENING">Life-threatening</mat-option></mat-select></mat-form-field>
        <mat-form-field><mat-label>Action taken</mat-label><input matInput formControlName="action_taken" /></mat-form-field>
        <mat-form-field><mat-label>Treatment (optional)</mat-label><mat-select formControlName="treatment_id"><mat-option [value]="null">No link</mat-option><mat-option *ngFor="let t of treatments" [value]="t.treatment_id">#{{ t.treatment_id }} - {{ t.medication }}</mat-option></mat-select></mat-form-field>
        <mat-form-field class="notes-field"><mat-label>Notes</mat-label><textarea matInput rows="5" formControlName="notes"></textarea></mat-form-field>
        <button mat-flat-button color="primary" [disabled]="form.invalid">{{ editingId ? 'Update' : 'Save' }}</button>
      </form>

      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" message="Failed to load adverse events" (retry)="load()" />
      <app-empty-state *ngIf="!loading && !error && !items.length" message="No adverse events found" />

      <table *ngIf="!loading && !error && items.length" mat-table [dataSource]="items" class="full-width" style="margin-top:1rem">
        <ng-container matColumnDef="event_name"><th mat-header-cell *matHeaderCellDef>Event</th><td mat-cell *matCellDef="let item">{{ item.event_name }}</td></ng-container>
        <ng-container matColumnDef="event_date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let item">{{ item.event_date }}</td></ng-container>
        <ng-container matColumnDef="treatment_id"><th mat-header-cell *matHeaderCellDef>Treatment</th><td mat-cell *matCellDef="let item">{{ item.treatment_id || '-' }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let item"><button mat-button (click)="startEdit(item)">Edit</button><button mat-button color="warn" (click)="remove(item)">Delete</button></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-card>
  `
})
export class AdverseEventsComponent {
  today = new Date().toISOString().slice(0, 10);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(AdverseEventsService);
  private treatmentsService = inject(TreatmentsService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  items: AdverseEvent[] = [];
  treatments: Treatment[] = [];
  columns = ['event_name', 'event_date', 'treatment_id', 'actions'];
  editingId: number | null = null;
  loading = false;
  error = false;

  form = this.fb.group({
    event_name: ['', Validators.required],
    event_date: ['', Validators.required],
    severity: ['MILD'],
    action_taken: [''],
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
    this.form.patchValue({ ...item });
  }

  remove(item: AdverseEvent): void {
    if (!window.confirm(`Delete event "${item.event_name}"?`)) return;
    this.service.delete(item.ae_id).subscribe(() => this.load());
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload = {
      event_name: raw.event_name ?? undefined,
      event_date: raw.event_date ?? undefined,
      severity: raw.severity ?? undefined,
      action_taken: raw.action_taken ?? undefined,
      notes: raw.notes ?? undefined,
      treatment_id: raw.treatment_id ?? undefined
    };

    const done = () => {
      this.form.reset({ event_name: '', event_date: '', severity: 'MILD', action_taken: '', notes: '', treatment_id: null });
      this.editingId = null;
      this.load();
    };

    if (this.editingId) {
      this.service.update(this.editingId, payload).subscribe(done);
      return;
    }

    this.service.create(this.patientId, payload).subscribe(done);
  }
}
