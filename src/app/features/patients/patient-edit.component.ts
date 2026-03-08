import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { PatientsService } from '../../core/api/patients.service';
import { Patient } from '../../shared/models/models';
import { PatientFormComponent } from './patient-form.component';

@Component({
  standalone: true,
  imports: [MatCardModule, MatButtonModule, PatientFormComponent],
  template: `<mat-card class="page-card"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">Edit patient</h2><button mat-stroked-button type="button" (click)="back()">Back</button></div><app-patient-form [value]="patient" (submit)="save($event)" (cancel)="back()"/></mat-card>`
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
