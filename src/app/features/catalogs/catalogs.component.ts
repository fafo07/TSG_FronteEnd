import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { CountriesService, SystemsService } from '../../core/api/catalogs.service';
import { FindingsCatalogService } from '../../core/api/findings-catalog.service';
import { Country, FindingCatalog, System } from '../../shared/models/models';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatCheckboxModule, MatSelectModule, PageHeaderComponent, EmptyStateComponent, LoadingStateComponent],
  template: `
    <mat-card class="page-card">
      <app-page-header [title]="title" subtitle="Gerenciamento de catálogos">
        <div style="display:flex;gap:.5rem">
          <button mat-stroked-button routerLink="/catalogs/systems">Sistemas</button>
          <button mat-stroked-button routerLink="/catalogs/findings">Achados</button>
          <button mat-stroked-button routerLink="/catalogs/countries">Países</button>
        </div>
      </app-page-header>

      <ng-container [ngSwitch]="mode">
        <ng-container *ngSwitchCase="'countries'">
          <form [formGroup]="countryForm" (ngSubmit)="createCountry()" style="display:grid;grid-template-columns:1fr 2fr auto;gap:1rem;align-items:center">
            <mat-form-field><mat-label>Código</mat-label><input matInput formControlName="country_code" /></mat-form-field>
            <mat-form-field><mat-label>Nome</mat-label><input matInput formControlName="country_name" /></mat-form-field>
            <button mat-flat-button color="primary" [disabled]="countryForm.invalid">Salvar</button>
          </form>
          <app-loading-state *ngIf="loading" />
          <app-empty-state *ngIf="!loading && !countries.length" message="Nenhum país cadastrado" />
          <table *ngIf="countries.length" mat-table [dataSource]="countries" class="full-width">
            <ng-container matColumnDef="country_code"><th mat-header-cell *matHeaderCellDef>Código</th><td mat-cell *matCellDef="let c">{{ c.country_code }}</td></ng-container>
            <ng-container matColumnDef="country_name"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let c">{{ c.country_name }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="countryColumns"></tr><tr mat-row *matRowDef="let row; columns: countryColumns"></tr>
          </table>
        </ng-container>

        <ng-container *ngSwitchCase="'systems'">
          <form [formGroup]="systemForm" (ngSubmit)="createSystem()" style="display:grid;grid-template-columns:1fr 2fr auto;gap:1rem;align-items:center">
            <mat-form-field><mat-label>Código</mat-label><input matInput formControlName="system_code" /></mat-form-field>
            <mat-form-field><mat-label>Nome</mat-label><input matInput formControlName="system_name" /></mat-form-field>
            <button mat-flat-button color="primary" [disabled]="systemForm.invalid">Salvar</button>
          </form>
          <app-loading-state *ngIf="loading" />
          <app-empty-state *ngIf="!loading && !systems.length" message="Nenhum sistema cadastrado" />
          <table *ngIf="systems.length" mat-table [dataSource]="systems" class="full-width">
            <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>Código</th><td mat-cell *matCellDef="let s">{{ s.system_code }}</td></ng-container>
            <ng-container matColumnDef="system_name"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let s">{{ s.system_name }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="systemColumns"></tr><tr mat-row *matRowDef="let row; columns: systemColumns"></tr>
          </table>
        </ng-container>

        <ng-container *ngSwitchDefault>
          <form [formGroup]="findingForm" (ngSubmit)="createFinding()" style="display:grid;grid-template-columns:1fr 2fr 2fr auto auto;gap:1rem;align-items:center">
            <mat-form-field><mat-label>Código</mat-label><input matInput formControlName="finding_code" /></mat-form-field>
            <mat-form-field><mat-label>Sistema</mat-label><mat-select formControlName="system_code"><mat-option *ngFor="let s of systems" [value]="s.system_code">{{ s.system_name }}</mat-option></mat-select></mat-form-field>
            <mat-form-field><mat-label>Nome do achado</mat-label><input matInput formControlName="finding_name" /></mat-form-field>
            <mat-checkbox formControlName="is_active">Ativo</mat-checkbox>
            <button mat-flat-button color="primary" [disabled]="findingForm.invalid">Salvar</button>
          </form>
          <app-loading-state *ngIf="loading" />
          <app-empty-state *ngIf="!loading && !findings.length" message="Nenhum achado cadastrado" />
          <table *ngIf="findings.length" mat-table [dataSource]="findings" class="full-width">
            <ng-container matColumnDef="finding_code"><th mat-header-cell *matHeaderCellDef>Código</th><td mat-cell *matCellDef="let f">{{ f.finding_code }}</td></ng-container>
            <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>Sistema</th><td mat-cell *matCellDef="let f">{{ f.system_code }}</td></ng-container>
            <ng-container matColumnDef="finding_name"><th mat-header-cell *matHeaderCellDef>Achado</th><td mat-cell *matCellDef="let f">{{ f.finding_name }}</td></ng-container>
            <ng-container matColumnDef="is_active"><th mat-header-cell *matHeaderCellDef>Ativo</th><td mat-cell *matCellDef="let f">{{ f.is_active ? 'Sim' : 'Não' }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="findingColumns"></tr><tr mat-row *matRowDef="let row; columns: findingColumns"></tr>
          </table>
        </ng-container>
      </ng-container>
    </mat-card>
  `
})
export class CatalogsComponent {
  private fb = inject(FormBuilder);
  private countriesService = inject(CountriesService);
  private systemsService = inject(SystemsService);
  private findingsService = inject(FindingsCatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  mode: 'countries' | 'systems' | 'findings' = 'systems';
  title = 'Catálogos - Sistemas';
  loading = false;

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
    const url = this.router.url;
    if (url.includes('/catalogs/countries')) { this.mode = 'countries'; this.title = 'Catálogos - Países'; }
    else if (url.includes('/catalogs/findings')) { this.mode = 'findings'; this.title = 'Catálogos - Achados'; }
    else { this.mode = 'systems'; this.title = 'Catálogos - Sistemas'; }

    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.systemsService.list().subscribe((systems) => {
      this.systems = systems.results;
      this.countriesService.list().subscribe((countries) => {
        this.countries = countries.results;
        this.findingsService.list().subscribe((findings) => {
          this.findings = findings.results;
          this.loading = false;
        });
      });
    });
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
    const raw = this.findingForm.getRawValue();
    this.findingsService
      .create({ finding_code: raw.finding_code!, finding_name: raw.finding_name!, system_code: raw.system_code!, description: raw.description ?? undefined, is_active: !!raw.is_active })
      .subscribe(() => {
        this.findingForm.reset({ finding_code: '', system_code: '', finding_name: '', description: '', is_active: true });
        this.loadAll();
      });
  }
}
