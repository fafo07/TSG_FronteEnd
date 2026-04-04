import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, expand, map, reduce, throwError } from 'rxjs';

import { environment } from '../config/environment';
import { Contact, PatientContact } from '../../shared/models/models';
import { PaginatedResponse, unwrapResults } from '../../shared/models/pagination';

export type PatientContactCreateWithContactPayload = {
  full_name: string;
  relationship?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  is_primary: boolean;
};

export type ContactCreatePayload = Partial<Contact> & { full_name: string };

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private http = inject(HttpClient);

  list(page = 1): Observable<PaginatedResponse<Contact> | Contact[]> {
    return this.http
      .get<PaginatedResponse<Contact> | Contact[]>(`${environment.apiBaseUrl}/contacts`, { params: { page } })
      .pipe(
        map((data) => {
          const list = unwrapResults(data);
          return Array.isArray(data) ? list : { ...data, results: list };
        })
      );
  }

  listAll(): Observable<Contact[]> {
    return this.list(1).pipe(
      expand((pageData) => {
        if (Array.isArray(pageData) || !pageData.next) return [];
        return this.fetchPageByUrl(pageData.next);
      }),
      reduce((acc, pageData) => [...acc, ...unwrapResults(pageData)], [] as Contact[])
    );
  }

  create(payload: ContactCreatePayload): Observable<Contact> {
    return this.http.post<Contact>(`${environment.apiBaseUrl}/contacts`, payload);
  }

  buildContactPayload(formValue: Partial<Contact>): ContactCreatePayload {
    return {
      full_name: this.normalizeRequired(formValue.full_name),
      relationship: this.normalizeOptional(formValue.relationship),
      phone: this.normalizeOptional(formValue.phone),
      email: this.normalizeOptional(formValue.email),
      address: this.normalizeOptional(formValue.address),
      notes: this.normalizeOptional(formValue.notes)
    };
  }

  hasContactData(formValue: Partial<Contact>): boolean {
    const payload = this.buildContactPayload(formValue);
    return !!payload.full_name || !!payload.relationship || !!payload.phone || !!payload.email || !!payload.address || !!payload.notes;
  }

  buildPatientContactRelationPayload(patientId: number, contactId: number, isPrimary: boolean): { patient: number; contact: number; is_primary: boolean } {
    return {
      patient: patientId,
      contact: contactId,
      is_primary: !!isPrimary
    };
  }

  buildCreateWithContactPayload(payload: Partial<Contact> & { is_primary: boolean }): PatientContactCreateWithContactPayload {
    const contactPayload = this.buildContactPayload(payload);
    return { ...contactPayload, is_primary: !!payload.is_primary };
  }

  createForPatient(patientId: number, payload: Partial<Contact> & { is_primary: boolean }): Observable<Contact> {
    const body = this.buildCreateWithContactPayload(payload);
    console.log('POST /api/v1/patients/{patient_id}/contacts payload', body);
    return this.http.post<Contact>(`${environment.apiBaseUrl}/patients/${patientId}/contacts`, body).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 400) {
          console.error('POST /api/v1/patients/{patient_id}/contacts 400 response body', error.error);
        }
        return throwError(() => error);
      })
    );
  }

  update(contactId: number, payload: ContactCreatePayload): Observable<Contact> {
    return this.http.patch<Contact>(`${environment.apiBaseUrl}/contacts/${contactId}`, payload);
  }

  getById(contactId: number): Observable<Contact> {
    return this.http.get<Contact>(`${environment.apiBaseUrl}/contacts/${contactId}`);
  }

  listByPatient(patientId: number): Observable<PaginatedResponse<Contact> | Contact[]> {
    return this.http
      .get<PaginatedResponse<Contact> | Contact[]>(`${environment.apiBaseUrl}/patients/${patientId}/contacts`)
      .pipe(
        map((data) => {
          const list = unwrapResults(data);
          return Array.isArray(data) ? list : { ...data, results: list };
        })
      );
  }

  link(patientId: number, contactId: number, is_primary: boolean): Observable<PatientContact> {
    return this.http.post<PatientContact>(`${environment.apiBaseUrl}/patients/${patientId}/contacts/${contactId}`, {
      patient: patientId,
      contact: contactId,
      is_primary
    });
  }

  updateLink(patientId: number, contactId: number, is_primary: boolean): Observable<PatientContact> {
    return this.http.put<PatientContact>(`${environment.apiBaseUrl}/patients/${patientId}/contacts/${contactId}`, {
      patient: patientId,
      contact: contactId,
      is_primary
    });
  }

  unlink(patientId: number, contactId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/patients/${patientId}/contacts/${contactId}`);
  }

  private fetchPageByUrl(url: string): Observable<PaginatedResponse<Contact> | Contact[]> {
    const resolvedUrl = url.startsWith('http') ? url : `${environment.apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    return this.http
      .get<PaginatedResponse<Contact> | Contact[]>(resolvedUrl)
      .pipe(
        map((data) => {
          const list = unwrapResults(data);
          return Array.isArray(data) ? list : { ...data, results: list };
        })
      );
  }

  private normalizeRequired(value?: string | null): string {
    return (value ?? '').trim();
  }

  private normalizeOptional(value?: string | null): string | undefined {
    const normalized = (value ?? '').trim();
    return normalized ? normalized : undefined;
  }
}
