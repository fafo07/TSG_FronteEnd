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
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state.component';
import { PatientTabsComponent } from '../../shared/ui/patient-tabs.component';

type PatientContactListItem = Contact | {
  contact?: Contact;
  contact_id?: number;
  is_primary?: boolean;
  full_name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
};

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, MatTableModule, PatientTabsComponent, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <app-patient-tabs [patientId]="patientId" />

    <mat-card class="page-card">
      <h2>Contacts</h2>
      <form [formGroup]="form" (ngSubmit)="save()" style="display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:1rem;align-items:center">
        <mat-form-field><mat-label>Full name</mat-label><input matInput formControlName="full_name" /></mat-form-field>
        <mat-form-field><mat-label>Phone</mat-label><input matInput formControlName="phone" /></mat-form-field>
        <mat-form-field><mat-label>Email</mat-label><input matInput formControlName="email" /></mat-form-field>
        <mat-form-field><mat-label>Relationship</mat-label><input matInput formControlName="relationship" /></mat-form-field>
        <mat-form-field><mat-label>Address</mat-label><input matInput formControlName="address" /></mat-form-field>
        <mat-form-field style="grid-column:span 2"><mat-label>Notes</mat-label><textarea matInput rows="5" formControlName="notes"></textarea></mat-form-field>
        <mat-checkbox formControlName="is_primary">Primary</mat-checkbox>
        <button mat-flat-button color="primary">{{ editingContactId ? 'Update contact' : 'Save & link' }}</button>
      </form>
      <p *ngIf="form.get('full_name')?.errors?.['pattern']" style="color:#DC2626">Full name must contain letters only.</p>
      <p *ngIf="form.get('phone')?.errors?.['pattern']" style="color:#DC2626">Phone format is invalid.</p>
      <p *ngIf="form.get('email')?.errors?.['invalidEmail']" style="color:#DC2626">Invalid email</p>

      <app-loading-state *ngIf="loading" />
      <app-error-state *ngIf="error" message="Failed to load contacts" (retry)="load()" />
      <app-empty-state *ngIf="!loading && !error && !contacts.length" message="No contacts linked" />

      <table *ngIf="!loading && !error && contacts.length" mat-table [dataSource]="contacts" class="full-width" style="margin-top:1rem">
        <ng-container matColumnDef="full_name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let item">{{ item.full_name }}</td></ng-container>
        <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>Email</th><td mat-cell *matCellDef="let item">{{ item.email || '-' }}</td></ng-container>
        <ng-container matColumnDef="phone"><th mat-header-cell *matHeaderCellDef>Phone</th><td mat-cell *matCellDef="let item">{{ item.phone || '-' }}</td></ng-container>
        <ng-container matColumnDef="primary"><th mat-header-cell *matHeaderCellDef>Primary</th><td mat-cell *matCellDef="let item">{{ primaryByContactId[item.contact_id] ? 'Yes' : 'No' }}</td></ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let item"><button mat-button (click)="edit(item)">Edit</button><button mat-button (click)="togglePrimary(item)">Toggle primary</button><button mat-button color="warn" (click)="unlink(item)">Unlink</button></td></ng-container>
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
  columns = ['full_name', 'email', 'phone', 'primary', 'actions'];
  editingContactId: number | null = null;
  loading = false;
  error = false;

  form = this.fb.group({
    full_name: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÿ'\-\s]+$/)]],
    relationship: [''],
    phone: ['', Validators.pattern(/^[0-9+()\-\s]{6,20}$/)],
    email: ['', [emailIfPresentValidator()]],
    address: [''],
    notes: [''],
    is_primary: [false]
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.service.listByPatient(this.patientId).subscribe({
      next: (data) => {
        this.contacts = unwrapResults(data).map((item) => this.normalizeContact(item as PatientContactListItem));
        this.contacts.forEach((c) => {
          this.primaryByContactId[c.contact_id] = !!c.is_primary;
        });
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  edit(contact: Contact): void {
    this.editingContactId = contact.contact_id;
    this.form.patchValue({
      full_name: contact.full_name ?? '',
      relationship: contact.relationship ?? '',
      phone: contact.phone ?? '',
      email: contact.email ?? '',
      address: contact.address ?? '',
      notes: contact.notes ?? '',
      is_primary: !!this.primaryByContactId[contact.contact_id]
    });
  }

  togglePrimary(contact: Contact): void {
    const next = !this.primaryByContactId[contact.contact_id];
    this.service.updateLink(this.patientId, contact.contact_id, next).subscribe(() => {
      this.primaryByContactId[contact.contact_id] = next;
    });
  }

  unlink(contact: Contact): void {
    if (!window.confirm(`Unlink ${contact.full_name}?`)) return;
    this.service.unlink(this.patientId, contact.contact_id).subscribe(() => this.load());
  }



  private normalizeContact(item: PatientContactListItem): Contact {
    const nested = 'contact' in item && item.contact ? item.contact : null;
    if (nested) {
      return { ...nested, is_primary: item.is_primary ?? nested.is_primary ?? false };
    }

    return {
      contact_id: item.contact_id ?? 0,
      full_name: item.full_name ?? '',
      relationship: item.relationship ?? undefined,
      phone: item.phone ?? undefined,
      email: item.email ?? undefined,
      address: item.address ?? undefined,
      notes: item.notes ?? undefined,
      is_primary: item.is_primary ?? false
    };
  }

  save(): void {
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

    const done = () => {
      this.form.reset({ full_name: '', relationship: '', phone: '', email: '', address: '', notes: '', is_primary: false });
      this.editingContactId = null;
      this.load();
    };

    if (this.editingContactId) {
      this.service.update(this.editingContactId, contactPayload).subscribe(() => {
        this.service.updateLink(this.patientId, this.editingContactId!, Boolean(is_primary)).subscribe(done);
      });
      return;
    }

    this.service.create(contactPayload).subscribe((contact) => {
      this.service.link(this.patientId, contact.contact_id, Boolean(is_primary)).subscribe(done);
    });
  }
}
