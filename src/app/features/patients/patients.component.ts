import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { PatientsService } from '../../core/api/patients.service';
import { Patient } from '../../shared/models/models';
import { diagnosisAfterBirthValidator } from '../../shared/validators/domain.validators';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule],
  template: `
  <mat-card class="page-card">
    <h2>Pacientes</h2>

    <div style="display:flex;gap:1rem;align-items:center;margin-bottom:1rem">
      <mat-form-field style="max-width:420px;width:100%"><mat-label>Buscar por nome</mat-label><input matInput [formControl]="searchControl" (keyup.enter)="load()"></mat-form-field>
      <button mat-stroked-button color="primary" (click)="load()">Buscar</button>
    </div>

    <form [formGroup]="form" (ngSubmit)="create()" style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:1rem;align-items:center">
      <mat-form-field><mat-label>Nome completo</mat-label><input matInput formControlName="full_name"></mat-form-field>
      <mat-form-field><mat-label>Data de nascimento</mat-label><input matInput type="date" formControlName="date_of_birth"></mat-form-field>
      <mat-form-field><mat-label>Data do diagnóstico</mat-label><input matInput type="date" formControlName="diagnosis_date"></mat-form-field>
      <button mat-flat-button color="primary">Novo</button>
    </form>

    <p *ngIf="form.errors?.['invalidDiagnosisDate']" style="color:#DC2626">A data do diagnóstico deve ser maior ou igual à data de nascimento</p>

    <table mat-table [dataSource]="patients" class="full-width">
      <ng-container matColumnDef="full_name"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let p">{{ p.full_name }}</td></ng-container>
      <ng-container matColumnDef="country_code"><th mat-header-cell *matHeaderCellDef>País</th><td mat-cell *matCellDef="let p">{{ p.country_code || '-' }}</td></ng-container>
      <ng-container matColumnDef="diagnosis_date"><th mat-header-cell *matHeaderCellDef>Diagnóstico</th><td mat-cell *matCellDef="let p">{{ p.diagnosis_date || '-' }}</td></ng-container>
      <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Ações</th><td mat-cell *matCellDef="let p"><a [routerLink]="['/patients', p.patient_id]">Abrir</a></td></ng-container>
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>
  </mat-card>
  `
})
export class PatientsComponent {
  private service = inject(PatientsService);
  private fb = inject(FormBuilder);

  patients: Patient[] = [];
  displayedColumns = ['full_name', 'country_code', 'diagnosis_date', 'actions'];

  searchControl = this.fb.control('');

  form = this.fb.group(
    { full_name: ['', [Validators.required, Validators.minLength(3)]], date_of_birth: [''], diagnosis_date: [''], country_code: [''] },
    { validators: [diagnosisAfterBirthValidator('date_of_birth', 'diagnosis_date')] }
  );

  constructor() { this.load(); }

  load(): void {
    this.service.list(this.searchControl.value ?? '').subscribe((data) => (this.patients = data));
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.service.create(this.form.getRawValue()).subscribe(() => {
      this.form.reset({ full_name: '', date_of_birth: '', diagnosis_date: '', country_code: '' });
      this.load();
    });
  }
}
