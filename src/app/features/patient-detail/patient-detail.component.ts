import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, PatientTabsComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />
    <mat-card class="page-card">
      <h2>Patient #{{ patientId }}</h2>
      <p>Access patient modules using the tabs above.</p>
      <button mat-stroked-button [routerLink]="['/patients', patientId, 'overview']">Go to overview</button>
    </mat-card>
  `
})
export class PatientDetailComponent {
  private route = inject(ActivatedRoute);
  patientId = Number(this.route.snapshot.paramMap.get('patientId') ?? this.route.snapshot.paramMap.get('id'));
}
