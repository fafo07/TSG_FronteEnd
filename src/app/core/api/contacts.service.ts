import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, expand, map, reduce } from 'rxjs';

import { environment } from '../config/environment';
import { Contact, PatientContact } from '../../shared/models/models';
import { PaginatedResponse, unwrapResults } from '../../shared/models/pagination';

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

  create(payload: Partial<Contact>): Observable<Contact> {
    return this.http.post<Contact>(`${environment.apiBaseUrl}/contacts`, payload);
  }

  update(contactId: number, payload: Partial<Contact>): Observable<Contact> {
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
    return this.http.post<PatientContact>(`${environment.apiBaseUrl}/patients/${patientId}/contacts/${contactId}`, { is_primary });
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
}
