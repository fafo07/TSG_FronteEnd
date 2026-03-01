import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../config/environment';
import { Patient } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private http = inject(HttpClient);

  list(search = '', country_code = '', page = 0, pageSize = 10): Observable<Patient[]> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    if (country_code) params = params.set('country_code', country_code);
    return this.http.get<Patient[]>(`${environment.apiBaseUrl}/patients`, { params });
  }

  getById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${environment.apiBaseUrl}/patients/${id}`);
  }

  create(payload: Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>(`${environment.apiBaseUrl}/patients`, payload);
  }

  update(id: number, payload: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`${environment.apiBaseUrl}/patients/${id}`, payload);
  }
}
