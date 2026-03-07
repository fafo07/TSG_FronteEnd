import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

import { PatientsService } from '../../core/api/patients.service';
import { Patient } from '../../shared/models/models';
import { PatientFormComponent } from './patient-form.component';

@Component({
  standalone: true,
  imports: [MatCardModule, PatientFormComponent],
  template: `<mat-card class="page-card"><h2>Editar paciente</h2><app-patient-form [value]="patient" (submit)="save($event)" (cancel)="back()"/></mat-card>`
})
export class PatientEditComponent {
  private service = inject(PatientsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  patientId = Number(this.route.snapshot.paramMap.get('id'));
  patient: Partial<Patient> | null = null;

  constructor() {
    this.service.getById(this.patientId).subscribe((data) => (this.patient = data));
  }

  save(payload: Partial<Patient>): void {
    this.service.update(this.patientId, payload).subscribe(() => void this.router.navigate(['/patients', this.patientId, 'overview']));
  }

  back(): void { void this.router.navigate(['/patients', this.patientId, 'overview']); }
}
