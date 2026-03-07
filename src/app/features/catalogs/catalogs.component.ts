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
      <app-page-header [title]="title" subtitle="Gerenciamento de catálogos">
        <div style="display:flex;gap:.5rem">
          <button mat-stroked-button routerLink="/catalogs/systems">Sistemas</button>
          <button mat-stroked-button routerLink="/catalogs/findings">Achados</button>
          <button mat-stroked-button routerLink="/catalogs/countries">Países</button>
        </div>
      </app-page-header>

      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" [message]="error" (retry)="load()" />

      <ng-container [ngSwitch]="mode" *ngIf="!loading && !error">
        <ng-container *ngSwitchCase="'countries'">
          <form [formGroup]="countryForm" (ngSubmit)="saveCountry()" style="display:grid;grid-template-columns:1fr 2fr auto;gap:1rem;align-items:center">
            <mat-form-field><mat-label>Código</mat-label><input matInput formControlName="country_code" [readonly]="!!editingCountryCode" /></mat-form-field>
            <mat-form-field><mat-label>Nome</mat-label><input matInput formControlName="country_name" /></mat-form-field>
            <button mat-flat-button color="primary" [disabled]="countryForm.invalid">{{ editingCountryCode ? 'Atualizar' : 'Salvar' }}</button>
          </form>
          <app-empty-state *ngIf="!countries.length" message="Nenhum país cadastrado" />
          <table *ngIf="countries.length" mat-table [dataSource]="countries" class="full-width">
            <ng-container matColumnDef="country_code"><th mat-header-cell *matHeaderCellDef>Código</th><td mat-cell *matCellDef="let c">{{ c.country_code }}</td></ng-container>
            <ng-container matColumnDef="country_name"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let c">{{ c.country_name }}</td></ng-container>
            <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Ações</th><td mat-cell *matCellDef="let c"><button mat-button (click)="editCountry(c)">Editar</button><button mat-button color="warn" (click)="deleteCountry(c)">Excluir</button></td></ng-container>
            <tr mat-header-row *matHeaderRowDef="countryColumns"></tr><tr mat-row *matRowDef="let row; columns: countryColumns"></tr>
          </table>
          <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
            <button mat-stroked-button (click)="load(mode, page - 1)" [disabled]="!hasPrevious">Anterior</button>
            <small>Página {{ page }}</small>
            <button mat-stroked-button (click)="load(mode, page + 1)" [disabled]="!hasNext">Próxima</button>
          </div>
        </ng-container>

        <ng-container *ngSwitchCase="'systems'">
          <form [formGroup]="systemForm" (ngSubmit)="saveSystem()" style="display:grid;grid-template-columns:1fr 2fr auto;gap:1rem;align-items:center">
            <mat-form-field><mat-label>Código</mat-label><input matInput formControlName="system_code" [readonly]="!!editingSystemCode" /></mat-form-field>
            <mat-form-field><mat-label>Nome</mat-label><input matInput formControlName="system_name" /></mat-form-field>
            <button mat-flat-button color="primary" [disabled]="systemForm.invalid">{{ editingSystemCode ? 'Atualizar' : 'Salvar' }}</button>
          </form>
          <app-empty-state *ngIf="!systems.length" message="Nenhum sistema cadastrado" />
          <table *ngIf="systems.length" mat-table [dataSource]="systems" class="full-width">
            <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>Código</th><td mat-cell *matCellDef="let s">{{ s.system_code }}</td></ng-container>
            <ng-container matColumnDef="system_name"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let s">{{ s.system_name }}</td></ng-container>
            <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Ações</th><td mat-cell *matCellDef="let s"><button mat-button (click)="editSystem(s)">Editar</button><button mat-button color="warn" (click)="deleteSystem(s)">Excluir</button></td></ng-container>
            <tr mat-header-row *matHeaderRowDef="systemColumns"></tr><tr mat-row *matRowDef="let row; columns: systemColumns"></tr>
          </table>
          <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
            <button mat-stroked-button (click)="load(mode, page - 1)" [disabled]="!hasPrevious">Anterior</button>
            <small>Página {{ page }}</small>
            <button mat-stroked-button (click)="load(mode, page + 1)" [disabled]="!hasNext">Próxima</button>
          </div>
        </ng-container>

        <ng-container *ngSwitchDefault>
          <form [formGroup]="findingForm" (ngSubmit)="saveFinding()" style="display:grid;grid-template-columns:1fr 2fr 2fr auto auto;gap:1rem;align-items:center">
            <mat-form-field><mat-label>Código</mat-label><input matInput formControlName="finding_code" [readonly]="!!editingFindingCode" /></mat-form-field>
            <mat-form-field><mat-label>Sistema</mat-label><mat-select formControlName="system_code"><mat-option *ngFor="let s of systems" [value]="s.system_code">{{ s.system_name }}</mat-option></mat-select></mat-form-field>
            <mat-form-field><mat-label>Nome do achado</mat-label><input matInput formControlName="finding_name" /></mat-form-field>
            <mat-checkbox formControlName="is_active">Ativo</mat-checkbox>
            <button mat-flat-button color="primary" [disabled]="findingForm.invalid">{{ editingFindingCode ? 'Atualizar' : 'Salvar' }}</button>
          </form>
          <app-empty-state *ngIf="!findings.length" message="Nenhum achado cadastrado" />
          <table *ngIf="findings.length" mat-table [dataSource]="findings" class="full-width">
            <ng-container matColumnDef="finding_code"><th mat-header-cell *matHeaderCellDef>Código</th><td mat-cell *matCellDef="let f">{{ f.finding_code }}</td></ng-container>
            <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>Sistema</th><td mat-cell *matCellDef="let f">{{ f.system_code }}</td></ng-container>
            <ng-container matColumnDef="finding_name"><th mat-header-cell *matHeaderCellDef>Achado</th><td mat-cell *matCellDef="let f">{{ f.finding_name }}</td></ng-container>
            <ng-container matColumnDef="is_active"><th mat-header-cell *matHeaderCellDef>Ativo</th><td mat-cell *matCellDef="let f">{{ f.is_active ? 'Sim' : 'Não' }}</td></ng-container>
            <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Ações</th><td mat-cell *matCellDef="let f"><button mat-button (click)="editFinding(f)">Editar</button></td></ng-container>
            <tr mat-header-row *matHeaderRowDef="findingColumns"></tr><tr mat-row *matRowDef="let row; columns: findingColumns"></tr>
          </table>
          <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
            <button mat-stroked-button (click)="load(mode, page - 1)" [disabled]="!hasPrevious">Anterior</button>
            <small>Página {{ page }}</small>
            <button mat-stroked-button (click)="load(mode, page + 1)" [disabled]="!hasNext">Próxima</button>
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

  mode: 'countries' | 'systems' | 'findings' = 'systems';
  title = 'Catálogos - Sistemas';
  loading = false;
  error: string | null = null;

  countries: Country[] = [];
  systems: System[] = [];
  findings: FindingCatalog[] = [];

  page = 1;
  hasNext = false;
  hasPrevious = false;

  editingCountryCode: string | null = null;
  editingSystemCode: string | null = null;
  editingFindingCode: string | null = null;

  countryColumns = ['country_code', 'country_name', 'actions'];
  systemColumns = ['system_code', 'system_name', 'actions'];
  findingColumns = ['finding_code', 'system_code', 'finding_name', 'is_active', 'actions'];

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
    this.syncModeFromUrl(this.router.url);
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.syncModeFromUrl(this.router.url);
    });
  }

  private syncModeFromUrl(url: string): void {
    if (url.includes('/catalogs/countries')) {
      this.mode = 'countries';
      this.title = 'Catálogos - Países';
    } else if (url.includes('/catalogs/findings')) {
      this.mode = 'findings';
      this.title = 'Catálogos - Achados';
      this.systemsService.list(1).subscribe((systems) => (this.systems = systems.results));
    } else {
      this.mode = 'systems';
      this.title = 'Catálogos - Sistemas';
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
          this.hasNext = !!res.next;
          this.hasPrevious = !!res.previous;
          this.loading = false;
        },
        error: () => {
          this.error = 'Erro ao carregar países';
          this.loading = false;
        }
      });
      return;
    }

    if (mode === 'systems') {
      this.systemsService.list(page).subscribe({
        next: (res) => {
          this.systems = res.results;
          this.hasNext = !!res.next;
          this.hasPrevious = !!res.previous;
          this.loading = false;
        },
        error: () => {
          this.error = 'Erro ao carregar sistemas';
          this.loading = false;
        }
      });
      return;
    }

    this.findingsService.list(page).subscribe({
      next: (res) => {
        this.findings = res.results;
        this.hasNext = !!res.next;
        this.hasPrevious = !!res.previous;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar achados';
        this.loading = false;
      }
    });
  }

  editCountry(country: Country): void {
    this.editingCountryCode = country.country_code;
    this.countryForm.patchValue(country);
  }

  saveCountry(): void {
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

  deleteCountry(country: Country): void {
    if (!window.confirm(`Excluir país ${country.country_name}?`)) return;
    this.countriesService.delete(country.country_code).subscribe(() => this.load('countries', this.page));
  }

  editSystem(system: System): void {
    this.editingSystemCode = system.system_code;
    this.systemForm.patchValue(system);
  }

  saveSystem(): void {
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

  deleteSystem(system: System): void {
    if (!window.confirm(`Excluir sistema ${system.system_name}?`)) return;
    this.systemsService.delete(system.system_code).subscribe(() => this.load('systems', this.page));
  }

  editFinding(finding: FindingCatalog): void {
    this.editingFindingCode = finding.finding_code;
    this.findingForm.patchValue({
      finding_code: finding.finding_code,
      system_code: finding.system_code,
      finding_name: finding.finding_name,
      description: finding.description ?? '',
      is_active: finding.is_active
    });
  }

  saveFinding(): void {
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
}
