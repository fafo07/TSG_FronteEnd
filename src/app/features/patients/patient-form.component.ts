import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

import { CountriesService } from '../../core/api/catalogs.service';
import { Country, Patient } from '../../shared/models/models';
import { diagnosisAfterBirthValidator } from '../../shared/validators/domain.validators';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit.emit(payload())" class="form-grid form-grid-2">
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

      <mat-form-field>
        <mat-label>Date of birth</mat-label>
        <input matInput [matDatepicker]="birthPicker" [max]="today" formControlName="date_of_birth" readonly />
        <mat-datepicker-toggle matIconSuffix [for]="birthPicker"></mat-datepicker-toggle>
        <mat-datepicker #birthPicker></mat-datepicker>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Diagnosis date</mat-label>
        <input matInput [matDatepicker]="diagPicker" [max]="today" formControlName="diagnosis_date" readonly />
        <mat-datepicker-toggle matIconSuffix [for]="diagPicker"></mat-datepicker-toggle>
        <mat-datepicker #diagPicker></mat-datepicker>
      </mat-form-field>

      <mat-form-field class="notes-field"><mat-label>Family history</mat-label><textarea matInput rows="5" formControlName="family_history"></textarea></mat-form-field>

      <div style="grid-column:1/-1;display:flex;justify-content:flex-end;gap:.75rem">
        <button mat-stroked-button type="button" (click)="cancel.emit()">Cancel</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid">Save</button>
      </div>
    </form>
  `
})
export class PatientFormComponent {
  today = new Date();
  private fb = inject(FormBuilder);
  private countriesService = inject(CountriesService);

  countries: Country[] = [];

  @Input() set value(data: Partial<Patient> | null) {
    if (!data) return;
    this.form.patchValue({
      full_name: data.full_name ?? '',
      country_code: data.country_code ?? data.country ?? '',
      date_of_birth: this.parseDate(data.date_of_birth),
      diagnosis_date: this.parseDate(data.diagnosis_date),
      family_history: data.family_history ?? ''
    });
  }

  @Output() submit = new EventEmitter<Partial<Patient>>();
  @Output() cancel = new EventEmitter<void>();

  form = this.fb.group(
    {
      full_name: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-zÀ-ÿ'\-\s]+$/)]],
      country_code: ['', Validators.required],
      date_of_birth: [null as Date | null],
      diagnosis_date: [null as Date | null],
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
      date_of_birth: this.formatDate(raw.date_of_birth),
      diagnosis_date: this.formatDate(raw.diagnosis_date),
      family_history: raw.family_history ?? undefined
    };
  }

  private formatDate(value: Date | string | null | undefined): string | undefined {
    if (!value) return undefined;
    const d = value instanceof Date ? value : this.parseDate(value);
    if (!d || Number.isNaN(d.getTime())) return undefined;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const [y, m, d] = value.split('-').map((n) => Number(n));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
}
