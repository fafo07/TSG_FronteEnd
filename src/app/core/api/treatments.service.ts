import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../config/environment';
import { Treatment } from '../../shared/models/models';
import { PaginatedResponse, unwrapResults } from '../../shared/models/pagination';

@Injectable({ providedIn: 'root' })
export class TreatmentsService {
  private http = inject(HttpClient);

  listByPatient(patientId: number): Observable<PaginatedResponse<Treatment> | Treatment[]> {
    return this.http
      .get<PaginatedResponse<Treatment> | Treatment[]>(`${environment.apiBaseUrl}/patients/${patientId}/treatments`)
      .pipe(
        map((data) => {
          const list = unwrapResults(data);
          return Array.isArray(data) ? list : { ...data, results: list };
        })
      );
  }

  create(patientId: number, manifestationId: number, treatment: Partial<Treatment>): Observable<Treatment> {
    return this.http.post<Treatment>(`${environment.apiBaseUrl}/patients/${patientId}/manifestations/${manifestationId}/treatments`, treatment);
  }

  update(treatmentId: number, payload: Partial<Treatment>): Observable<Treatment> {
    return this.http.put<Treatment>(`${environment.apiBaseUrl}/treatments/${treatmentId}`, payload);
  }

  delete(treatmentId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/treatments/${treatmentId}`);
  }
}
