import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { filter } from 'rxjs';

import { CountriesService, SystemsService } from '../../core/api/catalogs.service';
import { FindingsCatalogService } from '../../core/api/findings-catalog.service';
import { AuthService } from '../../core/auth/auth.service';
import { Country, FindingCatalog, System } from '../../shared/models/models';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatCheckboxModule, MatSelectModule, PageHeaderComponent, EmptyStateComponent, LoadingStateComponent, ErrorStateComponent],
  template: `
    <mat-card class="page-card">
      <app-page-header [title]="title" subtitle="Catalog management">
        <div style="display:flex;gap:.5rem">
          <button mat-stroked-button routerLink="/catalogs/systems">Systems</button>
          <button mat-stroked-button routerLink="/catalogs/findings">Findings</button>
          <button mat-stroked-button routerLink="/catalogs/countries">Countries</button>
        </div>
      </app-page-header>

      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" [message]="error" (retry)="load()" />
      <p *ngIf="!canEditCatalogs" style="margin:.5rem 0;color:#475569">Read-only mode for your role.</p>

      <ng-container [ngSwitch]="mode" *ngIf="!loading && !error">
        <ng-container *ngSwitchCase="'countries'">
          <form [formGroup]="countryForm" (ngSubmit)="saveCountry()" style="display:grid;grid-template-columns:1fr 2fr auto;gap:1rem;align-items:center">
            <mat-form-field><mat-label>Code</mat-label><input matInput formControlName="country_code" [readonly]="!!editingCountryCode" /></mat-form-field>
            <mat-form-field><mat-label>Name</mat-label><input matInput formControlName="country_name" /></mat-form-field>
            <button mat-flat-button type="submit" color="primary" [disabled]="countryForm.invalid || !canEditCatalogs">{{ editingCountryCode ? 'Update' : 'Save' }}</button>
          </form>
          <div style="display:flex;gap:.75rem;align-items:center;margin:.5rem 0 1rem">
            <mat-form-field style="max-width:420px;width:100%"><mat-label>Search by name</mat-label><input matInput [value]="countrySearchTerm" (input)="applyCountryFilter($any($event.target).value)" /></mat-form-field>
            <button mat-button (click)="applyCountryFilter('')" [disabled]="!countrySearchTerm">Clear</button>
          </div>
          <app-empty-state *ngIf="!filteredCountries.length" message="No countries found" />
          <table *ngIf="filteredCountries.length" mat-table [dataSource]="filteredCountries" class="full-width">
            <ng-container matColumnDef="country_code"><th mat-header-cell *matHeaderCellDef>Code</th><td mat-cell *matCellDef="let c">{{ c.country_code }}</td></ng-container>
            <ng-container matColumnDef="country_name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let c">{{ c.country_name }}</td></ng-container>
            <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let c"><button mat-button [disabled]="!canEditCatalogs" (click)="editCountry(c)">Edit</button></td></ng-container>
            <tr mat-header-row *matHeaderRowDef="countryColumns"></tr><tr mat-row *matRowDef="let row; columns: countryColumns"></tr>
          </table>
          <div class="pagination-bar">
            <button mat-stroked-button (click)="load(mode, page - 1)" [disabled]="!hasPrevious">Previous</button>
            <small>Page {{ page }}</small>
            <button mat-stroked-button (click)="load(mode, page + 1)" [disabled]="!hasNext">Next</button>
          </div>
        </ng-container>

        <ng-container *ngSwitchCase="'systems'">
          <form [formGroup]="systemForm" (ngSubmit)="saveSystem()" style="display:grid;grid-template-columns:1fr 2fr auto;gap:1rem;align-items:center">
            <mat-form-field><mat-label>Code</mat-label><input matInput formControlName="system_code" [readonly]="!!editingSystemCode" /></mat-form-field>
            <mat-form-field><mat-label>Name</mat-label><input matInput formControlName="system_name" /></mat-form-field>
            <button mat-flat-button type="submit" color="primary" [disabled]="systemForm.invalid || !canEditCatalogs">{{ editingSystemCode ? 'Update' : 'Save' }}</button>
          </form>
          <div style="display:flex;gap:.75rem;align-items:center;margin:.5rem 0 1rem">
            <mat-form-field style="max-width:420px;width:100%"><mat-label>Search by name</mat-label><input matInput [value]="systemSearchTerm" (input)="applySystemFilter($any($event.target).value)" /></mat-form-field>
            <button mat-button (click)="applySystemFilter('')" [disabled]="!systemSearchTerm">Clear</button>
          </div>
          <app-empty-state *ngIf="!filteredSystems.length" message="No systems found" />
          <table *ngIf="filteredSystems.length" mat-table [dataSource]="filteredSystems" class="full-width">
            <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>Code</th><td mat-cell *matCellDef="let s">{{ s.system_code }}</td></ng-container>
            <ng-container matColumnDef="system_name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let s">{{ s.system_name }}</td></ng-container>
            <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let s"><button mat-button [disabled]="!canEditCatalogs" (click)="editSystem(s)">Edit</button></td></ng-container>
            <tr mat-header-row *matHeaderRowDef="systemColumns"></tr><tr mat-row *matRowDef="let row; columns: systemColumns"></tr>
          </table>
          <div class="pagination-bar">
            <button mat-stroked-button (click)="load(mode, page - 1)" [disabled]="!hasPrevious">Previous</button>
            <small>Page {{ page }}</small>
            <button mat-stroked-button (click)="load(mode, page + 1)" [disabled]="!hasNext">Next</button>
          </div>
        </ng-container>

        <ng-container *ngSwitchDefault>
          <form [formGroup]="findingForm" (ngSubmit)="saveFinding()" class="form-grid form-grid-3">
            <mat-form-field><mat-label>Code</mat-label><input matInput formControlName="finding_code" [readonly]="!!editingFindingCode" /><mat-error *ngIf="findingForm.get('finding_code')?.hasError('required')">Code is required.</mat-error><mat-error *ngIf="findingForm.get('finding_code')?.hasError('maxlength')">Max length is 50.</mat-error></mat-form-field>
            <mat-form-field><mat-label>System</mat-label><mat-select formControlName="system_code"><mat-option *ngFor="let s of systemOptions" [value]="s.system_code">{{ s.system_name }}</mat-option></mat-select><mat-error *ngIf="findingForm.get('system_code')?.hasError('required')">System is required.</mat-error></mat-form-field>
            <mat-form-field><mat-label>Finding name</mat-label><input matInput formControlName="finding_name" /><mat-error *ngIf="findingForm.get('finding_name')?.hasError('required')">Name is required.</mat-error><mat-error *ngIf="findingForm.get('finding_name')?.hasError('maxlength')">Max length is 255.</mat-error></mat-form-field>
            <mat-form-field class="notes-field" style="grid-column:1/-1"><mat-label>Notes</mat-label><textarea matInput rows="5" formControlName="description"></textarea></mat-form-field>
            <mat-checkbox formControlName="is_active">Active</mat-checkbox>
            <div style="display:flex;justify-content:flex-end;grid-column:1/-1"><button mat-flat-button type="submit" color="primary" [disabled]="findingForm.invalid || !canEditCatalogs">{{ editingFindingCode ? 'Update' : 'Save' }}</button></div>
          </form>
          <div style="display:flex;gap:.75rem;align-items:center;margin:.5rem 0 1rem">
            <mat-form-field style="max-width:420px;width:100%"><mat-label>Search by name</mat-label><input matInput [value]="findingSearchTerm" (input)="applyFindingFilter($any($event.target).value)" /></mat-form-field>
            <button mat-button (click)="applyFindingFilter('')" [disabled]="!findingSearchTerm">Clear</button>
          </div>
          <app-empty-state *ngIf="!filteredFindings.length" message="No findings found" />
          <table *ngIf="filteredFindings.length" mat-table [dataSource]="filteredFindings" class="full-width">
            <ng-container matColumnDef="finding_code"><th mat-header-cell *matHeaderCellDef>Code</th><td mat-cell *matCellDef="let f">{{ f.finding_code }}</td></ng-container>
            <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>System</th><td mat-cell *matCellDef="let f">{{ f.system || f.system_code }}</td></ng-container>
            <ng-container matColumnDef="finding_name"><th mat-header-cell *matHeaderCellDef>Finding</th><td mat-cell *matCellDef="let f">{{ f.finding_name }}</td></ng-container>
            <ng-container matColumnDef="is_active"><th mat-header-cell *matHeaderCellDef>Active</th><td mat-cell *matCellDef="let f">{{ f.is_active ? 'Yes' : 'No' }}</td></ng-container>
            <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let f"><button mat-button [disabled]="!canEditCatalogs" (click)="editFinding(f)">Edit</button></td></ng-container>
            <tr mat-header-row *matHeaderRowDef="findingColumns"></tr><tr mat-row *matRowDef="let row; columns: findingColumns"></tr>
          </table>
          <div class="pagination-bar">
            <button mat-stroked-button (click)="load(mode, page - 1)" [disabled]="!hasPrevious">Previous</button>
            <small>Page {{ page }}</small>
            <button mat-stroked-button (click)="load(mode, page + 1)" [disabled]="!hasNext">Next</button>
          </div>
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
  private router = inject(Router);
  private auth = inject(AuthService);

  mode: 'countries' | 'systems' | 'findings' = 'systems';
  title = 'Catalogs - Systems';
  loading = false;
  error: string | null = null;

  countries: Country[] = [];
  systems: System[] = [];
  findings: FindingCatalog[] = [];

  filteredCountries: Country[] = [];
  filteredSystems: System[] = [];
  filteredFindings: FindingCatalog[] = [];

  countrySearchTerm = '';
  systemSearchTerm = '';
  findingSearchTerm = '';

  systemOptions: System[] = [];

  page = 1;
  hasNext = false;
  hasPrevious = false;

  get canEditCatalogs(): boolean {
    const role = (this.auth.getRole() ?? '').toLowerCase();
    return role === 'admin' || role === 'administrator';
  }

  editingCountryCode: string | null = null;
  editingSystemCode: string | null = null;
  editingFindingCode: string | null = null;

  countryColumns = ['country_code', 'country_name', 'actions'];
  systemColumns = ['system_code', 'system_name', 'actions'];
  findingColumns = ['finding_code', 'system_code', 'finding_name', 'is_active', 'actions'];

  countryForm = this.fb.group({ country_code: ['', Validators.required], country_name: ['', Validators.required] });
  systemForm = this.fb.group({ system_code: ['', Validators.required], system_name: ['', Validators.required] });
  findingForm = this.fb.group({
    finding_code: ['', [Validators.required, Validators.maxLength(50)]],
    system_code: ['', Validators.required],
    finding_name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    is_active: [true, Validators.required]
  });

  constructor() {
    this.syncModeFromUrl(this.router.url);
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.syncModeFromUrl(this.router.url);
    });
  }

  private syncModeFromUrl(url: string): void {
    if (url.includes('/catalogs/countries')) {
      this.mode = 'countries';
      this.title = 'Catalogs - Countries';
    } else if (url.includes('/catalogs/findings')) {
      this.mode = 'findings';
      this.title = 'Catalogs - Findings';
      this.systemsService.list(1).subscribe((systems) => (this.systemOptions = systems.results));
    } else {
      this.mode = 'systems';
      this.title = 'Catalogs - Systems';
    }
    this.page = 1;
    this.hasNext = false;
    this.hasPrevious = false;
    this.load(this.mode, 1);
  }

  load(mode = this.mode, page = 1): void {
    if (page < 1) return;

    this.loading = true;
    this.error = null;
    this.page = page;

    if (mode === 'countries') {
      this.countriesService.list(page).subscribe({
        next: (res) => {
          this.countries = res.results;
          this.applyCountryFilter(this.countrySearchTerm);
          this.hasNext = !!res.next;
          this.hasPrevious = !!res.previous;
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load countries';
          this.loading = false;
        }
      });
      return;
    }

    if (mode === 'systems') {
      this.systemsService.list(page).subscribe({
        next: (res) => {
          this.systems = res.results;
          this.applySystemFilter(this.systemSearchTerm);
          this.hasNext = !!res.next;
          this.hasPrevious = !!res.previous;
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load systems';
          this.loading = false;
        }
      });
      return;
    }

    this.findingsService.list(page).subscribe({
      next: (res) => {
        this.findings = res.results;
        this.applyFindingFilter(this.findingSearchTerm);
        this.hasNext = !!res.next;
        this.hasPrevious = !!res.previous;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load findings';
        this.loading = false;
      }
    });
  }

  applyCountryFilter(term: string): void {
    this.countrySearchTerm = term;
    const normalized = this.normalizeTerm(term);
    this.filteredCountries = !normalized
      ? [...this.countries]
      : this.countries.filter((country) => this.matchByName(normalized, country.country_name));
  }

  applySystemFilter(term: string): void {
    this.systemSearchTerm = term;
    const normalized = this.normalizeTerm(term);
    this.filteredSystems = !normalized
      ? [...this.systems]
      : this.systems.filter((system) => this.matchByName(normalized, system.system_name));
  }

  applyFindingFilter(term: string): void {
    this.findingSearchTerm = term;
    const normalized = this.normalizeTerm(term);
    this.filteredFindings = !normalized
      ? [...this.findings]
      : this.findings.filter((finding) => this.matchByName(normalized, finding.finding_name ?? finding.description));
  }

  editCountry(country: Country): void {
    if (!this.canEditCatalogs) return;
    this.editingCountryCode = country.country_code;
    this.countryForm.patchValue(country);
  }

  saveCountry(): void {
    if (!this.canEditCatalogs) return;
    if (this.countryForm.invalid) return;
    const raw = this.countryForm.getRawValue();

    if (this.editingCountryCode) {
      this.countriesService.update(this.editingCountryCode, { country_name: raw.country_name ?? undefined }).subscribe(() => {
        this.editingCountryCode = null;
        this.countryForm.reset({ country_code: '', country_name: '' });
        this.load('countries', this.page);
      });
      return;
    }

    this.countriesService.create(raw as Country).subscribe(() => {
      this.countryForm.reset({ country_code: '', country_name: '' });
      this.load('countries', this.page);
    });
  }

  editSystem(system: System): void {
    if (!this.canEditCatalogs) return;
    this.editingSystemCode = system.system_code;
    this.systemForm.patchValue(system);
  }

  saveSystem(): void {
    if (!this.canEditCatalogs) return;
    if (this.systemForm.invalid) return;
    const raw = this.systemForm.getRawValue();

    if (this.editingSystemCode) {
      this.systemsService.update(this.editingSystemCode, { system_name: raw.system_name ?? undefined }).subscribe(() => {
        this.editingSystemCode = null;
        this.systemForm.reset({ system_code: '', system_name: '' });
        this.load('systems', this.page);
      });
      return;
    }

    this.systemsService.create(raw as System).subscribe(() => {
      this.systemForm.reset({ system_code: '', system_name: '' });
      this.load('systems', this.page);
    });
  }

  editFinding(finding: FindingCatalog): void {
    if (!this.canEditCatalogs) return;
    this.editingFindingCode = finding.finding_code;
    this.findingForm.patchValue({
      finding_code: finding.finding_code,
      system_code: finding.system_code || finding.system || '',
      finding_name: finding.finding_name,
      description: finding.description ?? '',
      is_active: finding.is_active
    });
  }

  saveFinding(): void {
    if (!this.canEditCatalogs) return;
    if (this.findingForm.invalid) return;
    const raw = this.findingForm.getRawValue();
    const createPayload = {
      finding_code: raw.finding_code!,
      finding_name: raw.finding_name!,
      system_code: raw.system_code!,
      description: raw.description ?? undefined,
      is_active: !!raw.is_active
    };

    const updatePayload = {
      finding_name: raw.finding_name!,
      system_code: raw.system_code!,
      description: raw.description ?? undefined,
      is_active: !!raw.is_active
    };

    if (this.editingFindingCode) {
      this.findingsService.update(this.editingFindingCode, updatePayload).subscribe(() => {
        this.editingFindingCode = null;
        this.findingForm.reset({ finding_code: '', system_code: '', finding_name: '', description: '', is_active: true });
        this.load('findings', this.page);
      });
      return;
    }

    this.findingsService.create(createPayload).subscribe(() => {
      this.findingForm.reset({ finding_code: '', system_code: '', finding_name: '', description: '', is_active: true });
      this.load('findings', this.page);
    });
  }

  private normalizeTerm(term: string): string {
    return term.toLowerCase().trim();
  }

  private matchByName(searchTerm: string, value?: string | null): boolean {
    return (value ?? '').toLowerCase().trim().includes(searchTerm);
  }
}
