import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, PatientTabsComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />
    <mat-card class="page-card">
      <h2>Paciente #{{ patientId }}</h2>
      <p>Acesse os módulos do paciente pelas abas acima.</p>
      <a [routerLink]="['/patients', patientId, 'overview']">Ir para dados gerais</a>
    </mat-card>
  `
})
export class PatientDetailComponent {
  private route = inject(ActivatedRoute);
  patientId = Number(this.route.snapshot.paramMap.get('id'));
}
