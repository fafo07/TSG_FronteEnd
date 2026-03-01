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

import { ManifestationsService } from '../../core/api/manifestations.service';
import { TreatmentsService } from '../../core/api/treatments.service';
import { Manifestation, Treatment } from '../../shared/models/models';
import { endDateAfterStartDate } from '../../shared/validators/date-range.validator';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatTableModule],
  template: `
  <mat-card class="page-card">
    <h2>Tratamentos</h2>
    <form [formGroup]="form" (ngSubmit)="create()" style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr auto;gap:1rem;align-items:center">
      <mat-form-field><mat-label>Medicação</mat-label><input matInput formControlName="medication"></mat-form-field>
      <mat-form-field>
        <mat-label>Avaliação</mat-label>
        <mat-select formControlName="manifestation_id">
          <mat-option [value]="null">Selecione</mat-option>
          <mat-option *ngFor="let m of manifestations" [value]="m.manifestation_id">#{{ m.manifestation_id }} - {{ m.system_code }} - {{ m.evaluation_date }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field><mat-label>Data de início</mat-label><input matInput type="date" formControlName="start_date"></mat-form-field>
      <mat-form-field><mat-label>Data de fim</mat-label><input matInput type="date" formControlName="end_date"></mat-form-field>
      <button mat-flat-button color="primary" [disabled]="form.invalid">Salvar</button>
    </form>
    <p *ngIf="form.get('manifestation_id')?.hasError('required') && form.get('manifestation_id')?.touched" style="color:#DC2626">Campo obrigatório</p>
    <p *ngIf="form.errors?.['dateRange']" style="color:#DC2626">A data de fim deve ser maior ou igual à data de início</p>

    <table mat-table [dataSource]="items" class="full-width">
      <ng-container matColumnDef="medication"><th mat-header-cell *matHeaderCellDef>Medicação</th><td mat-cell *matCellDef="let item">{{ item.medication }}</td></ng-container>
      <ng-container matColumnDef="manifestation_id"><th mat-header-cell *matHeaderCellDef>Avaliação</th><td mat-cell *matCellDef="let item">{{ item.manifestation_id }}</td></ng-container>
      <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let item">{{ item.status }}</td></ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>
  </mat-card>
  `
})
export class TreatmentsComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(TreatmentsService);
  private manifestationsService = inject(ManifestationsService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  items: Treatment[] = [];
  manifestations: Manifestation[] = [];
  columns = ['medication', 'manifestation_id', 'status'];

  form = this.fb.group(
    {
      medication: ['', Validators.required],
      manifestation_id: [null as number | null, Validators.required],
      start_date: [''],
      end_date: [''],
      status: ['ACTIVE', Validators.required],
      notes: ['']
    },
    { validators: [endDateAfterStartDate('start_date', 'end_date')] }
  );

  constructor() {
    this.load();
    this.manifestationsService.listByPatient(this.patientId).subscribe((data) => (this.manifestations = data));
  }

  load(): void {
    this.service.listByPatient(this.patientId).subscribe((data) => (this.items = data));
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.getRawValue();
    this.service.create(this.patientId, Number(payload.manifestation_id), payload).subscribe(() => {
      this.form.reset({ medication: '', manifestation_id: null, start_date: '', end_date: '', status: 'ACTIVE', notes: '' });
      this.load();
    });
  }
}
