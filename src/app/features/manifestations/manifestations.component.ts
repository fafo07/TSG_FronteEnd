import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { ManifestationsService } from '../../core/api/manifestations.service';
import { Manifestation } from '../../shared/models/models';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule],
  template: `
    <mat-card class="page-card">
      <h2>Avaliações</h2>

      <form [formGroup]="filterForm" (ngSubmit)="load()" style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:1rem;align-items:center;margin-bottom:1rem">
        <mat-form-field><mat-label>Filtro por sistema</mat-label><input matInput formControlName="system_code" /></mat-form-field>
        <mat-form-field><mat-label>De</mat-label><input matInput type="date" formControlName="from" /></mat-form-field>
        <mat-form-field><mat-label>Até</mat-label><input matInput type="date" formControlName="to" /></mat-form-field>
        <button mat-stroked-button color="primary">Filtrar</button>
      </form>

      <form [formGroup]="form" (ngSubmit)="create()" style="display:grid;grid-template-columns:1fr 1fr auto;gap:1rem;align-items:center">
        <mat-form-field><mat-label>Sistema</mat-label><input matInput formControlName="system_code" /></mat-form-field>
        <mat-form-field><mat-label>Data da avaliação</mat-label><input matInput type="date" formControlName="evaluation_date" /></mat-form-field>
        <button mat-flat-button color="primary">Salvar</button>
      </form>

      <table mat-table [dataSource]="items" class="full-width">
        <ng-container matColumnDef="system_code"><th mat-header-cell *matHeaderCellDef>Sistema</th><td mat-cell *matCellDef="let item">{{ item.system_code }}</td></ng-container>
        <ng-container matColumnDef="evaluation_date"><th mat-header-cell *matHeaderCellDef>Data</th><td mat-cell *matCellDef="let item">{{ item.evaluation_date }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Ações</th><td mat-cell *matCellDef="let item"><a [routerLink]="['/manifestations', item.manifestation_id]">Detalhe</a></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-card>
  `
})
export class ManifestationsComponent {
  private service = inject(ManifestationsService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  items: Manifestation[] = [];
  columns = ['system_code', 'evaluation_date', 'actions'];

  filterForm = this.fb.group({ system_code: [''], from: [''], to: [''] });
  form = this.fb.group({ system_code: ['', Validators.required], evaluation_date: ['', Validators.required], notes: [''] });

  constructor() {
    this.load();
  }

  load(): void {
    const filter = this.filterForm.getRawValue();
    this.service
      .listByPatient(this.patientId, filter.system_code || undefined, filter.from || undefined, filter.to || undefined)
      .subscribe((data) => (this.items = data));
  }

  create(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload = {
      system_code: raw.system_code ?? undefined,
      evaluation_date: raw.evaluation_date ?? undefined,
      notes: raw.notes ?? undefined
    };

    this.service.create(this.patientId, payload).subscribe(() => {
      this.form.reset({ system_code: '', evaluation_date: '', notes: '' });
      this.load();
    });
  }
}
