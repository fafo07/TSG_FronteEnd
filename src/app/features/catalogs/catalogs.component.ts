import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { CountriesService, SystemsService } from '../../core/api/catalogs.service';
import { FindingsCatalogService } from '../../core/api/findings-catalog.service';
import { Country, FindingCatalog, System } from '../../shared/models/models';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule, MatTableModule],
  template: `
    <mat-card class="page-card" style="margin-bottom:1rem">
      <h2>Catálogos - Países</h2>
      <form [formGroup]="countryForm" (ngSubmit)="createCountry()" style="display:grid;grid-template-columns:1fr 2fr auto;gap:1rem;align-items:center">
        <mat-form-field><mat-label>Código</mat-label><input matInput formControlName="country_code" /></mat-form-field>
        <mat-form-field><mat-label>Nome</mat-label><input matInput formControlName="country_name" /></mat-form-field>
        <button mat-flat-button color="primary">Salvar</button>
      </form>
      <table mat-table [dataSource]="countries" class="full-width">
        <ng-container matColumnDef="country_code"><th mat-header-cell *matHeaderCellDef>Código</th><td mat-cell *matCellDef="let c">{{ c.country_code }}</td></ng-container>
        <ng-container matColumnDef="country_name"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let c">{{ c.country_name }}</td></ng-container>
        <tr mat-header-row *matHeaderRowDef="countryColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: countryColumns"></tr>
      </table>
    </mat-card>

    <mat-card class="page-card" style="margin-bottom:1rem">
      <h2>Catálogos - Sistemas</h2>
      <form [formGroup]="systemForm" (ngSubmit)="createSystem()" style="display:grid;grid-template-columns:1fr 2fr auto;gap:1rem;align-items:center">
        <mat-form-field><mat-label>Código</mat-label><input matInput formControlName="system_code" /></mat-form-field>
        <mat-form-field><mat-label>Nome</mat-label><input matInput formControlName="system_name" /></mat-form-field>
        <button mat-flat-button color="primary">Salvar</button>
      </form>
      <table mat-table [dataSource]="systems" class="full-width">
        <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>Código</th><td mat-cell *matCellDef="let s">{{ s.system_code }}</td></ng-container>
        <ng-container matColumnDef="system_name"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let s">{{ s.system_name }}</td></ng-container>
        <tr mat-header-row *matHeaderRowDef="systemColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: systemColumns"></tr>
      </table>
    </mat-card>

    <mat-card class="page-card">
      <h2>Catálogos - Achados</h2>
      <form [formGroup]="findingForm" (ngSubmit)="createFinding()" style="display:grid;grid-template-columns:1fr 1fr 2fr auto auto;gap:1rem;align-items:center">
        <mat-form-field><mat-label>Código</mat-label><input matInput formControlName="finding_code" /></mat-form-field>
        <mat-form-field><mat-label>Sistema</mat-label><input matInput formControlName="system_code" /></mat-form-field>
        <mat-form-field><mat-label>Nome do achado</mat-label><input matInput formControlName="finding_name" /></mat-form-field>
        <mat-checkbox formControlName="is_active">Ativo</mat-checkbox>
        <button mat-flat-button color="primary">Salvar</button>
      </form>
      <table mat-table [dataSource]="findings" class="full-width">
        <ng-container matColumnDef="finding_code"><th mat-header-cell *matHeaderCellDef>Código</th><td mat-cell *matCellDef="let f">{{ f.finding_code }}</td></ng-container>
        <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>Sistema</th><td mat-cell *matCellDef="let f">{{ f.system_code }}</td></ng-container>
        <ng-container matColumnDef="finding_name"><th mat-header-cell *matHeaderCellDef>Achado</th><td mat-cell *matCellDef="let f">{{ f.finding_name }}</td></ng-container>
        <ng-container matColumnDef="is_active"><th mat-header-cell *matHeaderCellDef>Ativo</th><td mat-cell *matCellDef="let f">{{ f.is_active ? 'Sim' : 'Não' }}</td></ng-container>
        <tr mat-header-row *matHeaderRowDef="findingColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: findingColumns"></tr>
      </table>
    </mat-card>
  `
})
export class CatalogsComponent {
  private fb = inject(FormBuilder);
  private countriesService = inject(CountriesService);
  private systemsService = inject(SystemsService);
  private findingsService = inject(FindingsCatalogService);

  countries: Country[] = [];
  systems: System[] = [];
  findings: FindingCatalog[] = [];

  countryColumns = ['country_code', 'country_name'];
  systemColumns = ['system_code', 'system_name'];
  findingColumns = ['finding_code', 'system_code', 'finding_name', 'is_active'];

  countryForm = this.fb.group({ country_code: ['', Validators.required], country_name: ['', Validators.required] });
  systemForm = this.fb.group({ system_code: ['', Validators.required], system_name: ['', Validators.required] });
  findingForm = this.fb.group({
    finding_code: ['', Validators.required],
    system_code: ['', Validators.required],
    finding_name: ['', Validators.required],
    description: [''],
    is_active: [true, Validators.required]
  });

  constructor() {
    this.loadAll();
  }

  loadAll(): void {
    this.countriesService.list().subscribe((data) => (this.countries = data));
    this.systemsService.list().subscribe((data) => (this.systems = data));
    this.findingsService.list(undefined, undefined).subscribe((data) => (this.findings = data));
  }

  createCountry(): void {
    if (this.countryForm.invalid) return;
    this.countriesService.create(this.countryForm.getRawValue() as Country).subscribe(() => {
      this.countryForm.reset({ country_code: '', country_name: '' });
      this.loadAll();
    });
  }

  createSystem(): void {
    if (this.systemForm.invalid) return;
    this.systemsService.create(this.systemForm.getRawValue() as System).subscribe(() => {
      this.systemForm.reset({ system_code: '', system_name: '' });
      this.loadAll();
    });
  }

  createFinding(): void {
    if (this.findingForm.invalid) return;
    this.findingsService.create(this.findingForm.getRawValue() as FindingCatalog).subscribe(() => {
      this.findingForm.reset({ finding_code: '', system_code: '', finding_name: '', description: '', is_active: true });
      this.loadAll();
    });
  }
}
