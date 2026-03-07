import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { ContactsService } from '../../core/api/contacts.service';
import { Contact } from '../../shared/models/models';
import { unwrapResults } from '../../shared/models/pagination';
import { emailIfPresentValidator } from '../../shared/validators/domain.validators';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, MatTableModule, PatientTabsComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card">
      <h2>Contatos</h2>
      <form [formGroup]="form" (ngSubmit)="create()" style="display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:1rem;align-items:center">
        <mat-form-field><mat-label>Nome completo</mat-label><input matInput formControlName="full_name" /></mat-form-field>
        <mat-form-field><mat-label>Telefone</mat-label><input matInput formControlName="phone" /></mat-form-field>
        <mat-form-field><mat-label>E-mail</mat-label><input matInput formControlName="email" /></mat-form-field>
        <mat-form-field><mat-label>Relação</mat-label><input matInput formControlName="relationship" /></mat-form-field>
        <mat-form-field><mat-label>Endereço</mat-label><input matInput formControlName="address" /></mat-form-field>
        <mat-checkbox formControlName="is_primary">Principal</mat-checkbox>
        <button mat-flat-button color="primary">Salvar e vincular</button>
      </form>
      <p *ngIf="form.get('email')?.errors?.['invalidEmail']" style="color:#DC2626">E-mail inválido</p>

      <table mat-table [dataSource]="contacts" class="full-width" style="margin-top:1rem">
        <ng-container matColumnDef="full_name"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let item">{{ item.full_name }}</td></ng-container>
        <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>E-mail</th><td mat-cell *matCellDef="let item">{{ item.email || '-' }}</td></ng-container>
        <ng-container matColumnDef="phone"><th mat-header-cell *matHeaderCellDef>Telefone</th><td mat-cell *matCellDef="let item">{{ item.phone || '-' }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Ações</th><td mat-cell *matCellDef="let item"><button mat-button (click)="togglePrimary(item)">Alternar principal</button><button mat-button color="warn" (click)="unlink(item)">Remover vínculo</button></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </mat-card>
  `
})
export class ContactsComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(ContactsService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  contacts: Contact[] = [];
  primaryByContactId: Record<number, boolean> = {};
  columns = ['full_name', 'email', 'phone', 'actions'];

  form = this.fb.group({
    full_name: ['', Validators.required],
    relationship: [''],
    phone: [''],
    email: ['', [emailIfPresentValidator()]],
    address: [''],
    notes: [''],
    is_primary: [false]
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.service.listByPatient(this.patientId).subscribe((data) => {
      this.contacts = unwrapResults(data);
      this.contacts.forEach((c) => {
        this.primaryByContactId[c.contact_id] = !!c.is_primary;
      });
    });
  }

  togglePrimary(contact: Contact): void {
    const next = !this.primaryByContactId[contact.contact_id];
    this.service.updateLink(this.patientId, contact.contact_id, next).subscribe(() => {
      this.primaryByContactId[contact.contact_id] = next;
    });
  }

  unlink(contact: Contact): void {
    if (!window.confirm(`Remover vínculo de ${contact.full_name}?`)) return;
    this.service.unlink(this.patientId, contact.contact_id).subscribe(() => this.load());
  }

  create(): void {
    if (this.form.invalid) return;

    const { is_primary, ...rawPayload } = this.form.getRawValue();
    const contactPayload = {
      full_name: rawPayload.full_name ?? undefined,
      relationship: rawPayload.relationship ?? undefined,
      phone: rawPayload.phone ?? undefined,
      email: rawPayload.email ?? undefined,
      address: rawPayload.address ?? undefined,
      notes: rawPayload.notes ?? undefined
    };

    this.service.create(contactPayload).subscribe((contact) => {
      this.service.link(this.patientId, contact.contact_id, Boolean(is_primary)).subscribe(() => {
        this.primaryByContactId[contact.contact_id] = Boolean(is_primary);
        this.form.reset({ full_name: '', relationship: '', phone: '', email: '', address: '', notes: '', is_primary: false });
        this.load();
      });
    });
  }
}
