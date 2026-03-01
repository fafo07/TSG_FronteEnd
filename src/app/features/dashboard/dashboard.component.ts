import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

import { PatientsService } from '../../core/api/patients.service';

@Component({
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule],
  template: `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1rem">
      <mat-card class="page-card"><h3>Total pacientes</h3><p>{{ totalPatients }}</p></mat-card>
      <mat-card class="page-card"><h3>Tratamentos ativos</h3><p>{{ activeTreatments }}</p></mat-card>
      <mat-card class="page-card"><h3>Próximas avaliações</h3><p>{{ upcomingManifestations }}</p></mat-card>
    </div>

    <mat-card class="page-card">
      <h3>Últimos pacientes adicionados</h3>
      <table mat-table [dataSource]="latestPatients" class="full-width">
        <ng-container matColumnDef="full_name"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let p">{{ p.full_name }}</td></ng-container>
        <ng-container matColumnDef="diagnosis_date"><th mat-header-cell *matHeaderCellDef>Diagnóstico</th><td mat-cell *matCellDef="let p">{{ p.diagnosis_date || '-' }}</td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-card>
  `
})
export class DashboardComponent {
  private patientsService = inject(PatientsService);

  totalPatients = 0;
  activeTreatments = 0;
  upcomingManifestations = 0;
  latestPatients: Array<{ full_name: string; diagnosis_date?: string }> = [];
  columns = ['full_name', 'diagnosis_date'];

  constructor() {
    this.patientsService.list('', '', 0, 5).subscribe((data) => {
      this.latestPatients = data;
      this.totalPatients = data.length;
    });
  }
}
