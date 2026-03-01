import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule],
  template: `
    <mat-card class="page-card">
      <h2>Paciente #{{ patientId }}</h2>
      <p>Selecione um módulo para continuar.</p>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:1rem;max-width:900px">
        <a [routerLink]="['/patients', patientId, 'genetic-tests']">Teste genético</a>
        <a [routerLink]="['/patients', patientId, 'manifestations']">Avaliações</a>
        <a [routerLink]="['/patients', patientId, 'treatments']">Tratamentos</a>
        <a [routerLink]="['/patients', patientId, 'adverse-events']">Efeitos adversos</a>
        <a [routerLink]="['/patients', patientId, 'contacts']">Contatos</a>
      </div>
    </mat-card>
  `
})
export class PatientDetailComponent {
  private route = inject(ActivatedRoute);
  patientId = Number(this.route.snapshot.paramMap.get('id'));
}
