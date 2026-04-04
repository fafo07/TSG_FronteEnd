import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, map, switchMap, tap, catchError, finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ContactsService } from '../../core/api/contacts.service';
import { PatientsService } from '../../core/api/patients.service';
import { Patient } from '../../shared/models/models';
import { unwrapResults } from '../../shared/models/pagination';
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
    this.service.create(payload).pipe(
        switchMap((patientCreated) => {
          console.log('create patient response', patientCreated);
          const patientIdFromResponse =
            (patientCreated as Patient & { id?: number; data?: { patient_id?: number; id?: number } })?.patient_id ??
            (patientCreated as Patient & { id?: number; data?: { patient_id?: number; id?: number } })?.id ??
            (patientCreated as Patient & { id?: number; data?: { patient_id?: number; id?: number } })?.data?.patient_id ??
            (patientCreated as Patient & { id?: number; data?: { patient_id?: number; id?: number } })?.data?.id;

          if (patientIdFromResponse) return this.resolveCreatedPatient(payload, patientIdFromResponse);
          return this.resolveCreatedPatient(payload);
        }),
        tap((resolvedPatient) => console.log('resolved patientId', resolvedPatient?.patient_id ?? null)),
        switchMap((resolvedPatient) =>
          this.contactsService
            .create({
              full_name: contactData.full_name ?? undefined,
              relationship: contactData.relationship ?? undefined,
              phone: contactData.phone ?? undefined,
              email: contactData.email ?? undefined,
              notes: contactData.notes ?? undefined
            })
            .pipe(
              switchMap((contactCreated) => {
                console.log('create contact response', contactCreated);
                const resolvedContactId =
                  (contactCreated as { contact_id?: number; id?: number; data?: { contact_id?: number; id?: number } })?.contact_id ??
                  (contactCreated as { contact_id?: number; id?: number; data?: { contact_id?: number; id?: number } })?.id ??
                  (contactCreated as { contact_id?: number; id?: number; data?: { contact_id?: number; id?: number } })?.data?.contact_id ??
                  (contactCreated as { contact_id?: number; id?: number; data?: { contact_id?: number; id?: number } })?.data?.id;

                console.log('resolved contactId', resolvedContactId ?? null);

                if (!resolvedContactId) {
                  this.errorMessage = 'Primary contact was created but could not be linked because contact_id is missing.';
                  console.error('Missing contact_id in create contact response', contactCreated);
                  return EMPTY;
                }

                const patientId = resolvedPatient?.patient_id ?? null;
                const contactId = resolvedContactId;
                if (!patientId || !contactId) {
                  console.error('Missing patientId/contactId after fallback resolution', { patientId, contactId });
                  this.errorMessage = 'Unable to create patient-contact relation because IDs could not be resolved.';
                  return EMPTY;
                }

                console.log('creating patient-contact relation', { patientId, contactId });
                return this.contactsService.link(patientId, contactId, true).pipe(
                  tap(() => void this.router.navigate(['/patients', patientId, 'overview']))
                );
              })
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

  private resolveCreatedPatient(payload: Partial<Patient>, patientIdFromResponse?: number) {
    if (patientIdFromResponse) {
      return this.service.getById(patientIdFromResponse).pipe(
        map((patient) => patient ?? null),
        tap((resolvedPatient) => console.log('Resolved patient after create', resolvedPatient))
      );
    }

    return this.service.list('', '', 1).pipe(
      map((response) => {
        const patients = unwrapResults(response);
        const matches = patients
          .filter((patient) =>
            this.sameText(patient.full_name, payload.full_name) &&
            this.sameText(patient.country_code ?? patient.country, payload.country_code ?? payload.country) &&
            this.sameText(patient.date_of_birth, payload.date_of_birth) &&
            this.sameText(patient.diagnosis_date, payload.diagnosis_date) &&
            this.sameText(patient.family_history, payload.family_history)
          )
          .sort((a, b) => b.patient_id - a.patient_id);

        const fallback = [...patients].sort((a, b) => b.patient_id - a.patient_id)[0] ?? null;
        const resolvedPatient = matches[0] ?? fallback;
        console.log('Resolved patient after create', resolvedPatient);
        return resolvedPatient;
      })
    );
  }

  private sameText(a?: string, b?: string): boolean {
    return (a ?? '').trim() === (b ?? '').trim();
  }

  back(): void { void this.router.navigate(['/patients']); }
}
