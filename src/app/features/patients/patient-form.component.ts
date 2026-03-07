import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Patient } from '../../shared/models/models';
import { diagnosisAfterBirthValidator } from '../../shared/validators/domain.validators';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit.emit(payload())" style="display:grid;grid-template-columns:repeat(2,minmax(240px,1fr));gap:1rem;align-items:end">
      <mat-form-field><mat-label>Nome completo</mat-label><input matInput formControlName="full_name" /></mat-form-field>
      <mat-form-field><mat-label>País (código)</mat-label><input matInput formControlName="country_code" /></mat-form-field>
      <mat-form-field><mat-label>Data de nascimento</mat-label><input matInput type="date" formControlName="date_of_birth" /></mat-form-field>
      <mat-form-field><mat-label>Data do diagnóstico</mat-label><input matInput type="date" formControlName="diagnosis_date" /></mat-form-field>
      <mat-form-field style="grid-column:1/-1"><mat-label>Histórico familiar</mat-label><input matInput formControlName="family_history" /></mat-form-field>
      <div style="grid-column:1/-1;display:flex;justify-content:flex-end;gap:.75rem">
        <button mat-stroked-button type="button" (click)="cancel.emit()">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid">Salvar</button>
      </div>
    </form>
  `
})
export class PatientFormComponent {
  private fb = inject(FormBuilder);

  @Input() set value(data: Partial<Patient> | null) {
    if (!data) return;
    this.form.patchValue({
      full_name: data.full_name ?? '',
      country_code: data.country_code ?? '',
      date_of_birth: data.date_of_birth ?? '',
      diagnosis_date: data.diagnosis_date ?? '',
      family_history: data.family_history ?? ''
    });
  }

  @Output() submit = new EventEmitter<Partial<Patient>>();
  @Output() cancel = new EventEmitter<void>();

  form = this.fb.group(
    {
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      country_code: ['', Validators.required],
      date_of_birth: [''],
      diagnosis_date: [''],
      family_history: ['']
    },
    { validators: [diagnosisAfterBirthValidator('date_of_birth', 'diagnosis_date')] }
  );

  payload(): Partial<Patient> {
    const raw = this.form.getRawValue();
    return {
      full_name: raw.full_name ?? undefined,
      country_code: raw.country_code ?? undefined,
      date_of_birth: raw.date_of_birth ?? undefined,
      diagnosis_date: raw.diagnosis_date ?? undefined,
      family_history: raw.family_history ?? undefined
    };
  }
}
