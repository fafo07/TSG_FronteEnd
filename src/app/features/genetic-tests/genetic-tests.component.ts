import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { GeneticTestsService } from '../../core/api/genetic-tests.service';
import { GeneticTest } from '../../shared/models/models';
import { unwrapResults } from '../../shared/models/pagination';
import { geneValidator } from '../../shared/validators/domain.validators';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, PatientTabsComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card">
      <h2>Genetic tests</h2>
      <form [formGroup]="form" (ngSubmit)="save()" style="display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:1rem;align-items:center">
        <mat-form-field><mat-label>Gene</mat-label><input matInput formControlName="gene" placeholder="TSC1 or TSC2" /></mat-form-field>
        <mat-form-field><mat-label>Test date</mat-label><input matInput type="date" formControlName="test_date" /></mat-form-field>
        <mat-form-field><mat-label>Variant</mat-label><input matInput formControlName="variant" /></mat-form-field>
        <mat-form-field><mat-label>Laboratory</mat-label><input matInput formControlName="lab_name" /></mat-form-field>
        <mat-form-field style="grid-column:span 2"><mat-label>Notes</mat-label><textarea matInput rows="5" formControlName="notes"></textarea></mat-form-field>
        <button mat-flat-button color="primary">{{ editingId ? 'Update' : 'Save' }}</button>
      </form>
      <p *ngIf="form.errors?.['invalidGene']" style="color:#DC2626">Gene must be TSC1 or TSC2</p>

      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" message="Failed to load genetic tests" (retry)="load()" />
      <app-empty-state *ngIf="!loading && !error && !items.length" message="No genetic tests found" />

      <table *ngIf="!loading && !error && items.length" mat-table [dataSource]="items" class="full-width">
        <ng-container matColumnDef="gene"><th mat-header-cell *matHeaderCellDef>Gene</th><td mat-cell *matCellDef="let i">{{ i.gene }}</td></ng-container>
        <ng-container matColumnDef="test_date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let i">{{ i.test_date || '-' }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let i"><button mat-button (click)="startEdit(i)">Edit</button><button mat-button color="warn" (click)="remove(i)">Delete</button></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-card>
  `
})
export class GeneticTestsComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(GeneticTestsService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  items: GeneticTest[] = [];
  columns = ['gene', 'test_date', 'actions'];
  editingId: number | null = null;
  loading = false;
  error = false;

  form = this.fb.group(
    { gene: ['', Validators.required], test_date: [''], variant: [''], lab_name: [''], notes: [''] },
    { validators: [geneValidator('gene')] }
  );

  constructor() {
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

  startEdit(item: GeneticTest): void {
    this.editingId = item.test_id;
    this.form.patchValue({ ...item });
  }

  remove(item: GeneticTest): void {
    if (!window.confirm(`Delete test ${item.test_id}?`)) return;
    this.service.delete(item.test_id).subscribe(() => this.load());
  }

  save(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const gene: GeneticTest['gene'] | undefined = raw.gene === 'TSC1' || raw.gene === 'TSC2' ? raw.gene : undefined;
    const payload = {
      gene,
      test_date: raw.test_date ?? undefined,
      variant: raw.variant ?? undefined,
      lab_name: raw.lab_name ?? undefined,
      notes: raw.notes ?? undefined
    };

    const done = () => {
      this.form.reset({ gene: '', test_date: '', variant: '', lab_name: '', notes: '' });
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
