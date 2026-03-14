import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

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
    return this.http.get<PaginatedResponse<Patient>>(`${environment.apiBaseUrl}/patients`, { params }).pipe(
      map((res) => ({ ...res, results: res.results.map((item) => this.normalize(item)) }))
    );
  }

  getById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${environment.apiBaseUrl}/patients/${id}`).pipe(map((item) => this.normalize(item)));
  }

  create(payload: Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>(`${environment.apiBaseUrl}/patients`, this.toApiPayload(payload)).pipe(map((item) => this.normalize(item)));
  }

  update(id: number, payload: Partial<Patient>): Observable<Patient> {
    return this.http.patch<Patient>(`${environment.apiBaseUrl}/patients/${id}`, this.toApiPayload(payload)).pipe(map((item) => this.normalize(item)));
  }

  private normalize(item: Patient): Patient {
    const country = item.country ?? item.country_code;
    return { ...item, country, country_code: item.country_code ?? country };
  }

  private toApiPayload(payload: Partial<Patient>): Partial<Patient> & { country?: string } {
    const country = payload.country ?? payload.country_code;
    return {
      ...payload,
      country,
      country_code: undefined
    };
  }
}
