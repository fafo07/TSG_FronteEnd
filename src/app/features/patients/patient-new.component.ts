import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, switchMap, tap, catchError, finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ContactsService } from '../../core/api/contacts.service';
import { PatientsService } from '../../core/api/patients.service';
import { Patient } from '../../shared/models/models';
import { emailIfPresentValidator } from '../../shared/validators/domain.validators';
import { PatientFormComponent } from './patient-form.component';

@Component({
  standalone: true,
  imports: [CommonModule, MatCardModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, PatientFormComponent],
  template: `
    <mat-card class="page-card">
      <h2 style="margin:0 0 1rem">New patient</h2>

      <app-patient-form [loading]="saving" (submit)="save($event)" (cancel)="back()">
        <div extra-fields style="grid-column:1/-1;margin-top:.25rem;padding-top:1rem;border-top:1px solid #E5E7EB">
          <h3 style="margin:0 0 .75rem">Required primary contact</h3>

          <div [formGroup]="contactForm" class="form-grid form-grid-2">
            <mat-form-field>
              <mat-label>Full name</mat-label>
              <input matInput formControlName="full_name" />
              <mat-error *ngIf="contactForm.get('full_name')?.hasError('required')">Contact name is required.</mat-error>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phone" />
              <mat-error *ngIf="contactForm.get('phone')?.hasError('required')">Phone is required.</mat-error>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Relationship</mat-label>
              <input matInput formControlName="relationship" />
            </mat-form-field>

            <mat-form-field>
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" />
              <mat-error *ngIf="contactForm.get('email')?.hasError('invalidEmail')">Invalid email</mat-error>
            </mat-form-field>

            <mat-form-field class="notes-field" style="grid-column:1/-1">
              <mat-label>Notes</mat-label>
              <textarea matInput rows="4" formControlName="notes"></textarea>
            </mat-form-field>
          </div>

          <p style="margin:.5rem 0 0;color:#64748B;font-size:.85rem">A patient can only be created when a primary contact is completed.</p>
        </div>
      </app-patient-form>

      <p *ngIf="errorMessage" style="color:#DC2626;margin:.75rem 0 0">{{ errorMessage }}</p>
    </mat-card>
  `
})
export class PatientNewComponent {
  private service = inject(PatientsService);
  private contactsService = inject(ContactsService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  saving = false;
  errorMessage = '';

  contactForm = this.fb.group({
    full_name: ['', Validators.required],
    relationship: [''],
    phone: ['', Validators.required],
    email: ['', [emailIfPresentValidator()]],
    notes: ['']
  });

  save(payload: Partial<Patient>): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const contactData = this.contactForm.getRawValue();
    this.service
      .create(payload)
      .pipe(
        switchMap((patient) =>
          this.contactsService
            .create({
              full_name: contactData.full_name ?? undefined,
              relationship: contactData.relationship ?? undefined,
              phone: contactData.phone ?? undefined,
              email: contactData.email ?? undefined,
              notes: contactData.notes ?? undefined
            })
            .pipe(
              switchMap((contact) => this.contactsService.link(patient.patient_id, contact.contact_id, true)),
              tap(() => void this.router.navigate(['/patients', patient.patient_id, 'overview']))
            )
        ),
        catchError(() => {
          this.errorMessage = 'Unable to create patient and primary contact. Please try again.';
          return EMPTY;
        }),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe();
  }

  back(): void { void this.router.navigate(['/patients']); }
}
