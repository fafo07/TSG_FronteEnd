import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../config/environment';
import { AdverseEvent } from '../../shared/models/models';
import { PaginatedResponse, unwrapResults } from '../../shared/models/pagination';

@Injectable({ providedIn: 'root' })
export class AdverseEventsService {
  private http = inject(HttpClient);

  listByPatient(patientId: number): Observable<PaginatedResponse<AdverseEvent> | AdverseEvent[]> {
    return this.http
      .get<PaginatedResponse<AdverseEvent> | AdverseEvent[]>(`${environment.apiBaseUrl}/patients/${patientId}/adverse-events`)
      .pipe(
        map((data) => {
          const normalized = unwrapResults(data).map((item) => this.normalize(item));
          return Array.isArray(data) ? normalized : { ...data, results: normalized };
        })
      );
  }

  create(patientId: number, payload: Partial<AdverseEvent>): Observable<AdverseEvent> {
    return this.http.post<AdverseEvent>(`${environment.apiBaseUrl}/patients/${patientId}/adverse-events`, this.toApiPayload(payload)).pipe(map((item) => this.normalize(item)));
  }

  update(aeId: number, payload: Partial<AdverseEvent>): Observable<AdverseEvent> {
    return this.http.patch<AdverseEvent>(`${environment.apiBaseUrl}/adverse-events/${aeId}`, this.toApiPayload(payload)).pipe(map((item) => this.normalize(item)));
  }

  delete(aeId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/adverse-events/${aeId}`);
  }

  private normalize(item: AdverseEvent): AdverseEvent {
    const treatment = item.treatment ?? item.treatment_id ?? null;
    return { ...item, treatment, treatment_id: item.treatment_id ?? treatment };
  }

  private toApiPayload(payload: Partial<AdverseEvent>): Partial<AdverseEvent> & { treatment?: number | null } {
    const treatment = payload.treatment ?? payload.treatment_id ?? null;
    return {
      ...payload,
      treatment,
      treatment_id: undefined
    };
  }
}
