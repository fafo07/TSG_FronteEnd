import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

import { PatientsService } from '../../core/api/patients.service';
import { Patient } from '../../shared/models/models';
import { PatientFormComponent } from './patient-form.component';

@Component({
  standalone: true,
  imports: [MatCardModule, PatientFormComponent],
  template: `<mat-card class="page-card"><h2 style="margin:0 0 1rem">New patient</h2><app-patient-form (submit)="save($event)" (cancel)="back()"/></mat-card>`
})
export class PatientNewComponent {
  private service = inject(PatientsService);
  private router = inject(Router);

  save(payload: Partial<Patient>): void {
    this.service.create(payload).subscribe((patient) => void this.router.navigate(['/patients', patient.patient_id, 'overview']));
  }

  back(): void { void this.router.navigate(['/patients']); }
}
