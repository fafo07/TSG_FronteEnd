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
import { geneValidator } from '../../shared/validators/domain.validators';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule],
  template: `
    <mat-card class="page-card">
      <h2>Teste genético</h2>
      <form [formGroup]="form" (ngSubmit)="save()" style="display:grid;grid-template-columns:1fr 1fr auto;gap:1rem;align-items:center">
        <mat-form-field><mat-label>Gene</mat-label><input matInput formControlName="gene" placeholder="TSC1 ou TSC2" /></mat-form-field>
        <mat-form-field><mat-label>Data do teste</mat-label><input matInput type="date" formControlName="test_date" /></mat-form-field>
        <button mat-flat-button color="primary">Salvar</button>
      </form>
      <p *ngIf="form.errors?.['invalidGene']" style="color:#DC2626">Campo gene deve ser TSC1 ou TSC2</p>

      <table mat-table [dataSource]="items" class="full-width">
        <ng-container matColumnDef="gene"><th mat-header-cell *matHeaderCellDef>Gene</th><td mat-cell *matCellDef="let i">{{ i.gene }}</td></ng-container>
        <ng-container matColumnDef="test_date"><th mat-header-cell *matHeaderCellDef>Data</th><td mat-cell *matCellDef="let i">{{ i.test_date || '-' }}</td></ng-container>
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
  columns = ['gene', 'test_date'];

  form = this.fb.group(
    { gene: ['', Validators.required], test_date: [''], variant: [''], lab_name: [''], notes: [''] },
    { validators: [geneValidator('gene')] }
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.service.listByPatient(this.patientId).subscribe((data) => (this.items = data));
  }

  save(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload = {
      gene: raw.gene ?? undefined,
      test_date: raw.test_date ?? undefined,
      variant: raw.variant ?? undefined,
      lab_name: raw.lab_name ?? undefined,
      notes: raw.notes ?? undefined
    };

    this.service.create(this.patientId, payload).subscribe(() => {
      this.form.reset({ gene: '', test_date: '', variant: '', lab_name: '', notes: '' });
      this.load();
    });
  }
}
