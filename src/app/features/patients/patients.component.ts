import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { PatientsService } from '../../core/api/patients.service';
import { Patient } from '../../shared/models/models';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent, PageHeaderComponent],
  template: `
  <mat-card class="page-card">
    <app-page-header title="Pacientes" subtitle="Gestão de pacientes do registro TSC">
      <button mat-flat-button color="primary" routerLink="/patients/new">Novo paciente</button>
    </app-page-header>

    <div style="display:flex;gap:1rem;align-items:center;margin-bottom:1rem">
      <mat-form-field style="max-width:420px;width:100%"><mat-label>Buscar por nome</mat-label><input matInput [formControl]="searchControl" (keyup.enter)="load(1)"></mat-form-field>
      <button mat-stroked-button color="primary" (click)="load(1)">Buscar</button>
    </div>

    <app-loading-state *ngIf="loading" />
    <app-error-state *ngIf="error" message="Erro ao carregar pacientes" (retry)="load(page)" />

    <ng-container *ngIf="!loading && !error">
      <app-empty-state *ngIf="!patients.length" message="Nenhum paciente cadastrado ainda" actionLabel="Criar paciente" (action)="goNew()" />

      <table *ngIf="patients.length" mat-table [dataSource]="patients" class="full-width">
        <ng-container matColumnDef="patient_id"><th mat-header-cell *matHeaderCellDef>ID</th><td mat-cell *matCellDef="let p">{{ p.patient_id }}</td></ng-container>
        <ng-container matColumnDef="full_name"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let p">{{ p.full_name }}</td></ng-container>
        <ng-container matColumnDef="country_code"><th mat-header-cell *matHeaderCellDef>País</th><td mat-cell *matCellDef="let p">{{ p.country_code || '-' }}</td></ng-container>
        <ng-container matColumnDef="diagnosis_date"><th mat-header-cell *matHeaderCellDef>Diagnóstico</th><td mat-cell *matCellDef="let p">{{ p.diagnosis_date || '-' }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Ações</th><td mat-cell *matCellDef="let p"><a [routerLink]="['/patients', p.patient_id, 'overview']">Visualizar</a> · <a [routerLink]="['/patients', p.patient_id, 'edit']">Editar</a></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>

      <div *ngIf="patients.length" style="display:flex;justify-content:flex-end;align-items:center;gap:.75rem;margin-top:1rem">
        <button mat-stroked-button (click)="load(page - 1)" [disabled]="!hasPrevious">Anterior</button>
        <small>Página {{ page }}</small>
        <button mat-stroked-button (click)="load(page + 1)" [disabled]="!hasNext">Próxima</button>
      </div>
    </ng-container>
  </mat-card>
  `
})
export class PatientsComponent {
  private service = inject(PatientsService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  patients: Patient[] = [];
  displayedColumns = ['patient_id', 'full_name', 'country_code', 'diagnosis_date', 'actions'];
  loading = false;
  error = false;
  page = 1;
  hasNext = false;
  hasPrevious = false;

  searchControl = this.fb.control('');

  constructor() { this.load(1); }

  load(page: number): void {
    if (page < 1) return;
    this.loading = true;
    this.error = false;
    this.service.list(this.searchControl.value ?? '', '', page).subscribe({
      next: (data) => {
        this.patients = data.results;
        this.page = page;
        this.hasNext = !!data.next;
        this.hasPrevious = !!data.previous;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  goNew(): void { void this.router.navigate(['/patients/new']); }
}
