import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { PatientsService } from '../../core/api/patients.service';
import { Patient } from '../../shared/models/models';
import { PatientFormComponent } from './patient-form.component';

@Component({
  standalone: true,
  imports: [MatCardModule, MatButtonModule, PatientFormComponent],
  template: `<mat-card class="page-card"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">New patient</h2><button mat-stroked-button type="button" (click)="back()">Back</button></div><app-patient-form (submit)="save($event)" (cancel)="back()"/></mat-card>`
})
export class PatientNewComponent {
  private service = inject(PatientsService);
  private router = inject(Router);

  save(payload: Partial<Patient>): void {
    this.service.create(payload).subscribe((patient) => void this.router.navigate(['/patients', patient.patient_id, 'overview']));
  }

  back(): void { void this.router.navigate(['/patients']); }
}
