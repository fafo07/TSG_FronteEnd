import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

import { PatientsService } from '../../core/api/patients.service';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';
import { Patient } from '../../shared/models/models';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, PatientTabsComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card" *ngIf="patient as p">
      <h2>{{ p.full_name }}</h2>
      <p><strong>País:</strong> {{ p.country_code }}</p>
      <p><strong>Nascimento:</strong> {{ p.date_of_birth || '-' }}</p>
      <p><strong>Diagnóstico:</strong> {{ p.diagnosis_date || '-' }}</p>
      <p><strong>Histórico familiar:</strong> {{ p.family_history || '-' }}</p>
      <div style="margin-top:1rem"><a [routerLink]="['/patients', patientId, 'edit']">Editar dados do paciente</a></div>
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
