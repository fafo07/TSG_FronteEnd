import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../config/environment';
import { Manifestation } from '../../shared/models/models';
import { PaginatedResponse, unwrapResults } from '../../shared/models/pagination';

@Injectable({ providedIn: 'root' })
export class ManifestationsService {
  private http = inject(HttpClient);

  listByPatient(patientId: number, system_code?: string, from?: string, to?: string): Observable<PaginatedResponse<Manifestation> | Manifestation[]> {
    let params = new HttpParams();
    if (system_code) params = params.set('system', system_code);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    return this.http
      .get<PaginatedResponse<Manifestation> | Manifestation[]>(`${environment.apiBaseUrl}/patients/${patientId}/manifestations`, { params })
      .pipe(
        map((data) => {
          const normalized = unwrapResults(data).map((item) => this.normalize(item));
          return Array.isArray(data) ? normalized : { ...data, results: normalized };
        })
      );
  }

  create(patientId: number, payload: Partial<Manifestation>): Observable<Manifestation> {
    return this.http.post<Manifestation>(`${environment.apiBaseUrl}/patients/${patientId}/manifestations`, this.toApiPayload(payload)).pipe(map((item) => this.normalize(item)));
  }

  getById(manifestationId: number): Observable<Manifestation> {
    return this.http.get<Manifestation>(`${environment.apiBaseUrl}/manifestations/${manifestationId}`).pipe(map((item) => this.normalize(item)));
  }

  update(manifestationId: number, payload: Partial<Manifestation>): Observable<Manifestation> {
    return this.http.patch<Manifestation>(`${environment.apiBaseUrl}/manifestations/${manifestationId}`, this.toApiPayload(payload, false)).pipe(map((item) => this.normalize(item)));
  }

  private normalize(item: Manifestation): Manifestation {
    const system = item.system ?? item.system_code;
    return { ...item, system, system_code: item.system_code ?? system ?? '' };
  }

  private toApiPayload(payload: Partial<Manifestation>, includePatient = true): Partial<Manifestation> & { system?: string; patient?: number } {
    const system = payload.system ?? payload.system_code;
    const patient = payload.patient_id;
    return {
      ...payload,
      system,
      patient: includePatient ? patient : undefined,
      system_code: undefined
    };
  }
}
