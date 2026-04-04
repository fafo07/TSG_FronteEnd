import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, expand, map, reduce } from 'rxjs';

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

  listAllByPatient(patientId: number, system_code?: string, from?: string, to?: string): Observable<Manifestation[]> {
    return this.listByPatient(patientId, system_code, from, to).pipe(
      expand((page) => {
        if (Array.isArray(page) || !page.next) return [];
        return this.fetchPageByUrl(page.next);
      }),
      reduce((acc, page) => [...acc, ...unwrapResults(page)], [] as Manifestation[])
    );
  }

  create(patientId: number, payload: Partial<Manifestation>): Observable<Manifestation> {
    return this.http.post<Manifestation>(`${environment.apiBaseUrl}/patients/${patientId}/manifestations`, this.toApiPayload(payload)).pipe(map((item) => this.normalize(item)));
  }

  getById(manifestationId: number): Observable<Manifestation> {
    return this.http.get<Manifestation>(`${environment.apiBaseUrl}/manifestations/${manifestationId}`).pipe(map((item) => this.normalize(item)));
  }

  update(manifestationId: number, payload: Partial<Manifestation>): Observable<Manifestation> {
    return this.http.patch<Manifestation>(`${environment.apiBaseUrl}/manifestations/${manifestationId}`, this.toApiPayload(payload)).pipe(map((item) => this.normalize(item)));
  }

  private fetchPageByUrl(url: string): Observable<PaginatedResponse<Manifestation> | Manifestation[]> {
    const resolvedUrl = url.startsWith('http') ? url : `${environment.apiBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    return this.http.get<PaginatedResponse<Manifestation> | Manifestation[]>(resolvedUrl).pipe(
      map((data) => {
        const normalized = unwrapResults(data).map((item) => this.normalize(item));
        return Array.isArray(data) ? normalized : { ...data, results: normalized };
      })
    );
  }

  private normalize(item: Manifestation): Manifestation {
    const system = item.system ?? item.system_code;
    return { ...item, system, system_code: item.system_code ?? system ?? '' };
  }

  private toApiPayload(payload: Partial<Manifestation> & { patient?: number }): Partial<Manifestation> & { system?: string; patient?: number } {
    const system = payload.system ?? payload.system_code;
    return {
      ...payload,
      system,
      patient: undefined,
      patient_id: undefined,
      system_code: undefined
    };
  }
}
