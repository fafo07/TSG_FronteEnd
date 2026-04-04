import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, of, switchMap, tap, catchError, finalize, map } from 'rxjs';
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

            <mat-form-field>
              <mat-label>Address</mat-label>
              <input matInput formControlName="address" />
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
    full_name: [''],
    relationship: [''],
    phone: [''],
    email: ['', [emailIfPresentValidator()]],
    address: [''],
    notes: ['']
  });

  save(payload: Partial<Patient>): void {
    if (this.saving) return;
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const contactData = this.contactForm.getRawValue();
    const hasContactData = this.contactsService.hasContactData(contactData);
    const patientPayload = {
      full_name: payload.full_name ?? undefined,
      country_code: payload.country_code ?? undefined,
      date_of_birth: payload.date_of_birth ?? undefined,
      diagnosis_date: payload.diagnosis_date ?? undefined,
      family_history: payload.family_history ?? undefined
    };
    console.log('patient create payload', patientPayload);
    this.service.create(payload).pipe(
        tap((createdPatient) => console.log('patient create response', createdPatient)),
        switchMap((createdPatient) => {
          const patientId = createdPatient?.patient_id;
          console.log('extracted patient_id', patientId);
          if (!patientId || typeof patientId !== 'number') {
            console.error('Missing patient_id in create patient response', createdPatient);
            this.errorMessage = 'Patient was created but patient_id is missing in the response.';
            return EMPTY;
          }

          if (!hasContactData) {
            return of(patientId);
          }

          const contactPayload = this.contactsService.buildContactPayload(contactData);
          if (!contactPayload.full_name.trim()) {
            this.errorMessage = 'Contact full_name is required when contact data is provided.';
            return EMPTY;
          }

          console.log('contact create payload', contactPayload);
          return this.contactsService.create(contactPayload).pipe(
            tap((createdContact) => console.log('contact create response', createdContact)),
            switchMap((createdContact) => {
              const contactId = createdContact?.contact_id;
              console.log('extracted contact_id', contactId);
              if (!contactId || typeof contactId !== 'number') {
                console.error('Missing contact_id in create contact response', createdContact);
                this.errorMessage = 'Contact was created but contact_id is missing in the response.';
                return EMPTY;
              }

              const relationPayload = this.contactsService.buildPatientContactRelationPayload(patientId, contactId, true);
              console.log('relation payload', relationPayload);
              return this.contactsService.link(patientId, contactId, relationPayload.is_primary).pipe(map(() => patientId));
            })
          );
        }),
        tap((patientId) => {
          if (patientId) void this.router.navigate(['/patients', patientId, 'overview']);
        }),
        catchError((error: { error?: unknown }) => {
          console.error('Patient/contact create flow failed. Backend body:', error?.error);
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
