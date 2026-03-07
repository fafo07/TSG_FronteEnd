import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../config/environment';
import { Patient } from '../../shared/models/models';
import { PaginatedResponse } from '../../shared/models/pagination';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private http = inject(HttpClient);

  list(search = '', country = '', page = 1): Observable<PaginatedResponse<Patient>> {
    let params = new HttpParams().set('page', page);
    if (search) params = params.set('search', search);
    if (country) params = params.set('country', country);
    return this.http.get<PaginatedResponse<Patient>>(`${environment.apiBaseUrl}/patients`, { params });
  }

  getById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${environment.apiBaseUrl}/patients/${id}`);
  }

  create(payload: Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>(`${environment.apiBaseUrl}/patients`, payload);
  }

  update(id: number, payload: Partial<Patient>): Observable<Patient> {
    return this.http.patch<Patient>(`${environment.apiBaseUrl}/patients/${id}`, payload);
  }
}
