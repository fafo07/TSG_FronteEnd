import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../config/environment';
import { Manifestation } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class ManifestationsService {
  private http = inject(HttpClient);

  listByPatient(patientId: number, system_code?: string, from?: string, to?: string): Observable<Manifestation[]> {
    let params = new HttpParams();
    if (system_code) params = params.set('system_code', system_code);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<Manifestation[]>(`${environment.apiBaseUrl}/patients/${patientId}/manifestations`, { params });
  }

  create(patientId: number, payload: Partial<Manifestation>): Observable<Manifestation> {
    return this.http.post<Manifestation>(`${environment.apiBaseUrl}/patients/${patientId}/manifestations`, payload);
  }

  getById(manifestationId: number): Observable<Manifestation> {
    return this.http.get<Manifestation>(`${environment.apiBaseUrl}/manifestations/${manifestationId}`);
  }

  update(manifestationId: number, payload: Partial<Manifestation>): Observable<Manifestation> {
    return this.http.put<Manifestation>(`${environment.apiBaseUrl}/manifestations/${manifestationId}`, payload);
  }
}
