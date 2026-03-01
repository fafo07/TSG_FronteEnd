import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ContactsService } from '../../core/api/contacts.service';
import { Contact } from '../../shared/models/models';
import { emailIfPresentValidator } from '../../shared/validators/domain.validators';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule],
  template: `
    <mat-card class="page-card">
      <h2>Contatos</h2>
      <form [formGroup]="form" (ngSubmit)="create()" style="display:grid;grid-template-columns:2fr 2fr auto auto;gap:1rem;align-items:center">
        <mat-form-field><mat-label>Nome completo</mat-label><input matInput formControlName="full_name" /></mat-form-field>
        <mat-form-field><mat-label>E-mail</mat-label><input matInput formControlName="email" /></mat-form-field>
        <mat-checkbox formControlName="is_primary">Principal</mat-checkbox>
        <button mat-flat-button color="primary">Salvar</button>
      </form>
      <p *ngIf="form.get('email')?.errors?.['invalidEmail']" style="color:#DC2626">E-mail inválido</p>
      <div *ngFor="let item of contacts" style="margin-top:.5rem">{{ item.full_name }} - {{ item.email || '-' }}</div>
    </mat-card>
  `
})
export class ContactsComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(ContactsService);

  patientId = Number(this.route.snapshot.paramMap.get('id'));
  contacts: Contact[] = [];

  form = this.fb.group({
    full_name: ['', Validators.required],
    email: ['', [emailIfPresentValidator()]],
    is_primary: [false]
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.service.listByPatient(this.patientId).subscribe((data) => (this.contacts = data));
  }

  create(): void {
    if (this.form.invalid) return;

    const { is_primary, ...contactPayload } = this.form.getRawValue();
    if (is_primary && !window.confirm('Este contato será definido como principal. Deseja continuar?')) {
      return;
    }

    this.service.create(contactPayload).subscribe((contact) => {
      this.service.link(this.patientId, contact.contact_id, Boolean(is_primary)).subscribe(() => {
        this.form.reset({ full_name: '', email: '', is_primary: false });
        this.load();
      });
    });
  }
}
