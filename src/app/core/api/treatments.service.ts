import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../config/environment';
import { Treatment } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class TreatmentsService {
  private http = inject(HttpClient);

  listByPatient(patientId: number): Observable<Treatment[]> {
    return this.http.get<Treatment[]>(`${environment.apiBaseUrl}/patients/${patientId}/treatments`);
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
