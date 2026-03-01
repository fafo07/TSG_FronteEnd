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

import { AdverseEventsService } from '../../core/api/adverse-events.service';
import { TreatmentsService } from '../../core/api/treatments.service';
import { AdverseEvent, Treatment } from '../../shared/models/models';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatTableModule],
  template: `
    <mat-card class="page-card">
      <h2>Efeitos adversos</h2>
      <form [formGroup]="form" (ngSubmit)="create()" style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:1rem;align-items:center">
        <mat-form-field><mat-label>Evento</mat-label><input matInput formControlName="event_name" /></mat-form-field>
        <mat-form-field><mat-label>Data do evento</mat-label><input matInput type="date" formControlName="event_date" /></mat-form-field>
        <mat-form-field>
          <mat-label>Tratamento (opcional)</mat-label>
          <mat-select formControlName="treatment_id">
            <mat-option [value]="null">Sem vínculo</mat-option>
            <mat-option *ngFor="let t of treatments" [value]="t.treatment_id">#{{ t.treatment_id }} - {{ t.medication }}</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary">Salvar</button>
      </form>
      <table mat-table [dataSource]="items" class="full-width">
        <ng-container matColumnDef="event_name"><th mat-header-cell *matHeaderCellDef>Evento</th><td mat-cell *matCellDef="let item">{{ item.event_name }}</td></ng-container>
        <ng-container matColumnDef="event_date"><th mat-header-cell *matHeaderCellDef>Data</th><td mat-cell *matCellDef="let item">{{ item.event_date }}</td></ng-container>
        <ng-container matColumnDef="treatment_id"><th mat-header-cell *matHeaderCellDef>Tratamento</th><td mat-cell *matCellDef="let item">{{ item.treatment_id || '-' }}</td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-card>
  `
})
export class AdverseEventsComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(AdverseEventsService);
  private treatmentsService = inject(TreatmentsService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  items: AdverseEvent[] = [];
  treatments: Treatment[] = [];
  columns = ['event_name', 'event_date', 'treatment_id'];

  form = this.fb.group({ event_name: ['', Validators.required], event_date: ['', Validators.required], treatment_id: [null as number | null] });

  constructor() {
    this.load();
    this.treatmentsService.listByPatient(this.patientId).subscribe((data) => (this.treatments = data));
  }

  load(): void {
    this.service.listByPatient(this.patientId).subscribe((data) => (this.items = data));
  }

  create(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload = {
      event_name: raw.event_name ?? undefined,
      event_date: raw.event_date ?? undefined,
      treatment_id: raw.treatment_id ?? undefined
    };

    this.service.create(this.patientId, payload).subscribe(() => {
      this.form.reset({ event_name: '', event_date: '', treatment_id: null });
      this.load();
    });
  }
}
