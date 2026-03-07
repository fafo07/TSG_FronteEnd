import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { CountriesService } from '../../core/api/catalogs.service';
import { Country, Patient } from '../../shared/models/models';
import { diagnosisAfterBirthValidator } from '../../shared/validators/domain.validators';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit.emit(payload())" style="display:grid;grid-template-columns:repeat(2,minmax(240px,1fr));gap:1rem;align-items:end">
      <mat-form-field>
        <mat-label>Full name</mat-label>
        <input matInput formControlName="full_name" placeholder="e.g. Jane Doe" />
        <mat-error *ngIf="form.get('full_name')?.hasError('required')">Full name is required.</mat-error>
        <mat-error *ngIf="form.get('full_name')?.hasError('pattern')">Use letters, spaces, apostrophes or hyphens only.</mat-error>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Country</mat-label>
        <mat-select formControlName="country_code">
          <mat-option *ngFor="let country of countries" [value]="country.country_code">{{ country.country_name }}</mat-option>
        </mat-select>
        <mat-error *ngIf="form.get('country_code')?.hasError('required')">Country is required.</mat-error>
      </mat-form-field>

      <mat-form-field><mat-label>Date of birth</mat-label><input matInput type="date" formControlName="date_of_birth" /></mat-form-field>
      <mat-form-field><mat-label>Diagnosis date</mat-label><input matInput type="date" formControlName="diagnosis_date" /></mat-form-field>
      <mat-form-field style="grid-column:1/-1"><mat-label>Family history</mat-label><input matInput formControlName="family_history" /></mat-form-field>

      <div style="grid-column:1/-1;display:flex;justify-content:flex-end;gap:.75rem">
        <button mat-stroked-button type="button" (click)="cancel.emit()">Cancel</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid">Save</button>
      </div>
    </form>
  `
})
export class PatientFormComponent {
  private fb = inject(FormBuilder);
  private countriesService = inject(CountriesService);

  countries: Country[] = [];

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
      full_name: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-zÀ-ÿ'\-\s]+$/)]],
      country_code: ['', Validators.required],
      date_of_birth: [''],
      diagnosis_date: [''],
      family_history: ['']
    },
    { validators: [diagnosisAfterBirthValidator('date_of_birth', 'diagnosis_date')] }
  );

  constructor() {
    this.countriesService.list(1).subscribe((res) => (this.countries = res.results));
  }

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
