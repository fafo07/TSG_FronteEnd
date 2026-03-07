import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../config/environment';
import { AdverseEvent } from '../../shared/models/models';
import { PaginatedResponse } from '../../shared/models/pagination';

@Injectable({ providedIn: 'root' })
export class AdverseEventsService {
  private http = inject(HttpClient);

  listByPatient(patientId: number): Observable<PaginatedResponse<AdverseEvent> | AdverseEvent[]> {
    return this.http.get<AdverseEvent[]>(`${environment.apiBaseUrl}/patients/${patientId}/adverse-events`);
  }

  create(patientId: number, payload: Partial<AdverseEvent>): Observable<AdverseEvent> {
    return this.http.post<AdverseEvent>(`${environment.apiBaseUrl}/patients/${patientId}/adverse-events`, payload);
  }

  update(aeId: number, payload: Partial<AdverseEvent>): Observable<AdverseEvent> {
    return this.http.put<AdverseEvent>(`${environment.apiBaseUrl}/adverse-events/${aeId}`, payload);
  }

  delete(aeId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/adverse-events/${aeId}`);
  }
}
