import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { ManifestationsService } from '../../core/api/manifestations.service';
import { SystemsService } from '../../core/api/catalogs.service';
import { Manifestation, System } from '../../shared/models/models';
import { unwrapResults } from '../../shared/models/pagination';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatSelectModule, PatientTabsComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card">
      <h2>Patient manifestations</h2>

      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid form-grid-3">
        <mat-form-field><mat-label>Evaluation date</mat-label><input matInput type="date" [max]="today" formControlName="evaluation_date" /></mat-form-field>
        <mat-form-field><mat-label>System</mat-label><mat-select formControlName="system_code"><mat-option *ngFor="let s of systems" [value]="s.system_code">{{ s.system_name }}</mat-option></mat-select></mat-form-field>
        <mat-form-field class="notes-field"><mat-label>Notes</mat-label><textarea matInput rows="5" formControlName="notes"></textarea></mat-form-field>
        <button mat-flat-button color="primary" [disabled]="form.invalid">{{ editingId ? 'Update' : 'Save' }}</button>
      </form>


      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" message="Failed to load manifestations" (retry)="load()" />
      <app-empty-state *ngIf="!loading && !error && !items.length" message="No manifestations found" />

      <table *ngIf="!loading && !error && items.length" mat-table [dataSource]="items" class="full-width" style="margin-top:1rem">
        <ng-container matColumnDef="evaluation_date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let m">{{ m.evaluation_date || '-' }}</td></ng-container>
        <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>System</th><td mat-cell *matCellDef="let m">{{ m.system_code }}</td></ng-container>
        <ng-container matColumnDef="notes"><th mat-header-cell *matHeaderCellDef>Notes</th><td mat-cell *matCellDef="let m">{{ m.notes || '-' }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let m"><button mat-stroked-button color="primary" [routerLink]="['/manifestations', m.manifestation_id, 'findings']">Findings</button> <button mat-button (click)="edit(m)">Edit</button></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-card>
  `
})
export class ManifestationsComponent {
  today = new Date().toISOString().slice(0, 10);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(ManifestationsService);
  private systemsService = inject(SystemsService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  items: Manifestation[] = [];
  systems: System[] = [];
  columns = ['evaluation_date', 'system_code', 'notes', 'actions'];
  editingId: number | null = null;
  loading = false;
  error = false;

  form = this.fb.group({
    evaluation_date: ['', Validators.required],
    system_code: ['', Validators.required],
    notes: ['']
  });

  constructor() {
    this.systemsService.list().subscribe((res) => (this.systems = res.results));
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

  edit(item: Manifestation): void {
    this.editingId = item.manifestation_id;
    this.form.patchValue({ evaluation_date: item.evaluation_date, system_code: item.system_code, notes: item.notes ?? '' });
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload = { evaluation_date: raw.evaluation_date ?? undefined, system_code: raw.system_code ?? undefined, notes: raw.notes ?? undefined };

    const done = () => {
      this.form.reset({ evaluation_date: '', system_code: '', notes: '' });
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
