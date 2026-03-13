import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { CountriesService } from '../../core/api/catalogs.service';
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
    <app-page-header title="Patients" subtitle="Manage TSC registry patients">
      <button mat-flat-button color="primary" routerLink="/patients/new">New patient</button>
    </app-page-header>

    <div style="display:flex;gap:.75rem;align-items:center;margin-bottom:1rem;flex-wrap:wrap">
      <mat-form-field style="max-width:420px;width:100%"><mat-label>Search by name</mat-label><input matInput [formControl]="searchControl" (keyup.enter)="load(1)"></mat-form-field>
      <button mat-stroked-button color="primary" (click)="load(1)">Search</button>
      <button mat-button (click)="clearSearch()" [disabled]="!searchControl.value">Clear</button>
    </div>

    <app-loading-state *ngIf="loading" />
    <app-error-state *ngIf="error" message="Failed to load patients" (retry)="load(page)" />

    <ng-container *ngIf="!loading && !error">
      <app-empty-state *ngIf="!patients.length" message="No patients found yet" actionLabel="Create patient" (action)="goNew()" />

      <table *ngIf="patients.length" mat-table [dataSource]="patients" class="full-width">
        <ng-container matColumnDef="patient_id"><th mat-header-cell *matHeaderCellDef>ID</th><td mat-cell *matCellDef="let p">{{ p.patient_id }}</td></ng-container>
        <ng-container matColumnDef="full_name"><th mat-header-cell *matHeaderCellDef>Full name</th><td mat-cell *matCellDef="let p">{{ p.full_name }}</td></ng-container>
        <ng-container matColumnDef="country_code"><th mat-header-cell *matHeaderCellDef>Country</th><td mat-cell *matCellDef="let p">{{ countryName(p) }}</td></ng-container>
        <ng-container matColumnDef="diagnosis_date"><th mat-header-cell *matHeaderCellDef>Diagnosis date</th><td mat-cell *matCellDef="let p">{{ p.diagnosis_date || '-' }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let p"><a class="table-action" [routerLink]="['/patients', p.patient_id, 'overview']">View</a></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>

      <div *ngIf="patients.length" class="pagination-bar">
        <button mat-stroked-button (click)="load(page - 1)" [disabled]="!hasPrevious">Previous</button>
        <small>Page {{ page }}</small>
        <button mat-stroked-button (click)="load(page + 1)" [disabled]="!hasNext">Next</button>
      </div>
    </ng-container>
  </mat-card>
  `
})
export class PatientsComponent {
  private service = inject(PatientsService);
  private countriesService = inject(CountriesService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  patients: Patient[] = [];
  displayedColumns = ['patient_id', 'full_name', 'country_code', 'diagnosis_date', 'actions'];
  loading = false;
  error = false;
  page = 1;
  hasNext = false;
  hasPrevious = false;
  countriesByCode: Record<string, string> = {};

  searchControl = this.fb.control('');

  constructor() {
    this.loadCountries(1);
    this.load(1);
  }

  load(page: number): void {
    if (page < 1) return;
    this.loading = true;
    this.error = false;
    this.service.list((this.searchControl.value ?? '').trim(), '', page).subscribe({
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

  clearSearch(): void {
    this.searchControl.setValue('');
    this.load(1);
  }

  countryName(patient: Patient): string {
    const code = patient.country_code ?? patient.country ?? '';
    return this.countriesByCode[code] ?? code ?? '-';
  }

  private loadCountries(page: number): void {
    this.countriesService.list(page).subscribe({
      next: (response) => {
        response.results.forEach((country) => {
          this.countriesByCode[country.country_code] = country.country_name;
        });
        if (response.next) {
          this.loadCountries(page + 1);
        }
      }
    });
  }

  goNew(): void { void this.router.navigate(['/patients/new']); }
}
