import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { TreatmentsService } from '../../core/api/treatments.service';
import { ManifestationsService } from '../../core/api/manifestations.service';
import { Manifestation, Treatment } from '../../shared/models/models';
import { endDateAfterStartDate } from '../../shared/validators/date-range.validator';
import { unwrapResults } from '../../shared/models/pagination';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatSelectModule, PatientTabsComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card">
      <h2>Tratamentos</h2>
      <form [formGroup]="form" (ngSubmit)="save()" style="display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:1rem;align-items:center">
        <mat-form-field><mat-label>Manifestação</mat-label><mat-select formControlName="manifestation_id"><mat-option *ngFor="let m of manifestations" [value]="m.manifestation_id">{{ m.system_code }} - {{ m.evaluation_date }}</mat-option></mat-select></mat-form-field>
        <mat-form-field><mat-label>Medicação</mat-label><input matInput formControlName="medication" /></mat-form-field>
        <mat-form-field><mat-label>Dose</mat-label><input matInput formControlName="dose" /></mat-form-field>
        <mat-form-field><mat-label>Indicação</mat-label><input matInput formControlName="indication" /></mat-form-field>
        <mat-form-field><mat-label>Início</mat-label><input matInput type="date" formControlName="start_date" /></mat-form-field>
        <mat-form-field><mat-label>Fim</mat-label><input matInput type="date" formControlName="end_date" /></mat-form-field>
        <mat-form-field><mat-label>Status</mat-label><input matInput formControlName="status" /></mat-form-field>
        <mat-form-field style="grid-column:span 2"><mat-label>Observações</mat-label><input matInput formControlName="notes" /></mat-form-field>
        <button mat-flat-button color="primary" [disabled]="form.invalid">{{ editingId ? 'Atualizar' : 'Salvar' }}</button>
      </form>

      <p *ngIf="form.errors?.['invalidDateRange']" style="color:#DC2626">A data de fim deve ser maior ou igual à data de início</p>

      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" message="Erro ao carregar tratamentos" (retry)="load()" />
      <app-empty-state *ngIf="!loading && !error && !items.length" message="Nenhum tratamento cadastrado" />

      <table *ngIf="!loading && !error && items.length" mat-table [dataSource]="items" class="full-width" style="margin-top:1rem">
        <ng-container matColumnDef="medication"><th mat-header-cell *matHeaderCellDef>Medicação</th><td mat-cell *matCellDef="let t">{{ t.medication }}</td></ng-container>
        <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let t">{{ t.status || '-' }}</td></ng-container>
        <ng-container matColumnDef="manifestation_id"><th mat-header-cell *matHeaderCellDef>Manifestação</th><td mat-cell *matCellDef="let t">{{ t.manifestation_id }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Ações</th><td mat-cell *matCellDef="let t"><button mat-button (click)="startEdit(t)">Editar</button><button mat-button color="warn" (click)="remove(t)">Excluir</button></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-card>
  `
})
export class TreatmentsComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(TreatmentsService);
  private manifestationsService = inject(ManifestationsService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  items: Treatment[] = [];
  manifestations: Manifestation[] = [];
  columns = ['medication', 'status', 'manifestation_id', 'actions'];
  editingId: number | null = null;
  loading = false;
  error = false;

  form = this.fb.group(
    {
      manifestation_id: [null as number | null, Validators.required],
      medication: ['', Validators.required],
      dose: [''],
      indication: [''],
      start_date: [''],
      end_date: [''],
      status: ['ACTIVE'],
      notes: ['']
    },
    { validators: [endDateAfterStartDate('start_date', 'end_date')] }
  );

  constructor() {
    this.manifestationsService.listByPatient(this.patientId).subscribe((data) => (this.manifestations = unwrapResults(data)));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.service.listByPatient(this.patientId).subscribe({
      next: (data) => {
        this.items = unwrapResults(data);
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  startEdit(item: Treatment): void {
    this.editingId = item.treatment_id;
    this.form.patchValue({ ...item });
  }

  remove(item: Treatment): void {
    if (!window.confirm(`Excluir tratamento ${item.medication}?`)) return;
    this.service.delete(item.treatment_id).subscribe(() => this.load());
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    if (!raw.manifestation_id && !this.editingId) return;
    const createPayload = {
      manifestation_id: Number(raw.manifestation_id),
      medication: raw.medication ?? undefined,
      dose: raw.dose ?? undefined,
      indication: raw.indication ?? undefined,
      start_date: raw.start_date ?? undefined,
      end_date: raw.end_date ?? undefined,
      status: raw.status ?? undefined,
      notes: raw.notes ?? undefined
    };
    const updatePayload = {
      medication: raw.medication ?? undefined,
      dose: raw.dose ?? undefined,
      indication: raw.indication ?? undefined,
      start_date: raw.start_date ?? undefined,
      end_date: raw.end_date ?? undefined,
      status: raw.status ?? undefined,
      notes: raw.notes ?? undefined
    };

    const done = () => {
      this.form.reset({ manifestation_id: null, medication: '', dose: '', indication: '', start_date: '', end_date: '', status: 'ACTIVE', notes: '' });
      this.editingId = null;
      this.load();
    };

    if (this.editingId) {
      this.service.update(this.editingId, updatePayload).subscribe(done);
      return;
    }

    this.service.create(this.patientId, Number(raw.manifestation_id), createPayload).subscribe(done);
  }
}
