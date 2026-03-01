import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../config/environment';
import { Contact, PatientContact } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private http = inject(HttpClient);

  create(payload: Partial<Contact>): Observable<Contact> {
    return this.http.post<Contact>(`${environment.apiBaseUrl}/contacts`, payload);
  }

  update(contactId: number, payload: Partial<Contact>): Observable<Contact> {
    return this.http.put<Contact>(`${environment.apiBaseUrl}/contacts/${contactId}`, payload);
  }

  listByPatient(patientId: number): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${environment.apiBaseUrl}/patients/${patientId}/contacts`);
  }

  link(patientId: number, contactId: number, is_primary: boolean): Observable<PatientContact> {
    return this.http.post<PatientContact>(`${environment.apiBaseUrl}/patients/${patientId}/contacts/${contactId}`, { is_primary });
  }

  updateLink(patientId: number, contactId: number, is_primary: boolean): Observable<PatientContact> {
    return this.http.put<PatientContact>(`${environment.apiBaseUrl}/patients/${patientId}/contacts/${contactId}`, { is_primary });
  }

  unlink(patientId: number, contactId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/patients/${patientId}/contacts/${contactId}`);
  }
}
