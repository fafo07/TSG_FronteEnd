import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { PatientsService } from '../../core/api/patients.service';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';
import { Patient } from '../../shared/models/models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, PatientTabsComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card" *ngIf="patient as p">
      <div class="detail-header">
        <h2 style="margin:0">{{ p.full_name }}</h2>
        <button mat-flat-button color="primary" [routerLink]="['/patients', patientId, 'edit']">Edit patient details</button>
      </div>

      <div class="detail-grid">
        <div><strong>Country</strong><div>{{ p.country_code || '-' }}</div></div>
        <div><strong>Birth date</strong><div>{{ p.date_of_birth || '-' }}</div></div>
        <div><strong>Diagnosis date</strong><div>{{ p.diagnosis_date || '-' }}</div></div>
      </div>

      <div class="notes-block">
        <strong>Family history</strong>
        <p>{{ p.family_history || '-' }}</p>
      </div>
    </mat-card>
  `
})
export class PatientOverviewComponent {
  private route = inject(ActivatedRoute);
  private service = inject(PatientsService);
  patientId = Number(this.route.snapshot.paramMap.get('id'));
  patient?: Patient;

  constructor() {
    this.service.getById(this.patientId).subscribe((data) => (this.patient = data));
  }
}
