import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { forkJoin, map, of, switchMap } from 'rxjs';

import { CountriesService } from '../../core/api/catalogs.service';
import { ContactsService } from '../../core/api/contacts.service';
import { PatientsService } from '../../core/api/patients.service';
import { Contact, Patient } from '../../shared/models/models';
import { unwrapResults } from '../../shared/models/pagination';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

type PatientContactRelation = { patient?: number; contact?: number | Contact; contact_id?: number; is_primary?: boolean };

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, PatientTabsComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card" *ngIf="patient as p">
      <div class="detail-header">
        <h2 style="margin:0">{{ p.full_name }}</h2>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button mat-flat-button color="primary" [routerLink]="['/patients', patientId, 'edit']">Edit patient details</button>
        </div>
      </div>

      <div class="detail-grid">
        <div><strong>Country</strong><div>{{ countryName || p.country || p.country_code || '-' }}</div></div>
        <div><strong>Birth date</strong><div>{{ p.date_of_birth || '-' }}</div></div>
        <div><strong>Diagnosis date</strong><div>{{ p.diagnosis_date || '-' }}</div></div>
      </div>

      <div class="notes-block">
        <strong>Family history</strong>
        <p>{{ p.family_history || '-' }}</p>
      </div>

      <div class="notes-block" style="margin-top:.75rem">
        <strong>Contacts</strong>
        <ul *ngIf="contacts.length; else noContacts" style="margin:.6rem 0 0;padding-left:1.1rem">
          <li *ngFor="let contact of contacts">
            {{ contact.full_name }} <span *ngIf="contact.phone">· {{ contact.phone }}</span> <span *ngIf="contact.is_primary">· Primary</span>
          </li>
        </ul>
        <ng-template #noContacts><p style="margin:.5rem 0 0">No related contacts.</p></ng-template>
      </div>
    </mat-card>
  `
})
export class PatientOverviewComponent {
  private route = inject(ActivatedRoute);
  private patientsService = inject(PatientsService);
  private countriesService = inject(CountriesService);
  private contactsService = inject(ContactsService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  patient?: Patient;
  countryName = '';
  contacts: Contact[] = [];

  constructor() {
    this.patientsService.getById(this.patientId).subscribe((data) => {
      this.patient = data;
      this.resolveCountryName(data.country ?? data.country_code ?? '');
    });
    this.loadRelatedContacts();
  }

  private resolveCountryName(code: string): void {
    if (!code) {
      this.countryName = '';
      return;
    }

    this.countriesService.list(1).subscribe((response) => {
      const country = response.results.find((item) => item.country_code === code);
      this.countryName = country?.country_name ?? code;
    });
  }

  private loadRelatedContacts(): void {
    this.contactsService
      .listByPatient(this.patientId)
      .pipe(
        map((response) => unwrapResults(response) as unknown as PatientContactRelation[]),
        switchMap((relations) => {
          const links = relations
            .map((relation) => {
              const relationContact = relation.contact;
              const contactId = relation.contact_id ?? (typeof relationContact === 'number' ? relationContact : relationContact?.contact_id ?? 0);
              return { contactId, isPrimary: !!relation.is_primary, embedded: typeof relationContact === 'object' ? relationContact : null };
            })
            .filter((entry) => entry.contactId > 0);

          if (!links.length) return of([] as Contact[]);

          const detailCalls = links.map((entry) =>
            entry.embedded
              ? of({ ...entry.embedded, is_primary: entry.isPrimary })
              : this.contactsService.getById(entry.contactId).pipe(map((contact) => ({ ...contact, is_primary: entry.isPrimary })))
          );

          return forkJoin(detailCalls);
        })
      )
      .subscribe({
        next: (contacts) => {
          this.contacts = contacts;
        },
        error: () => {
          this.contacts = [];
        }
      });
  }
}
