import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../config/environment';
import { GeneticTest } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class GeneticTestsService {
  private http = inject(HttpClient);

  listByPatient(patientId: number): Observable<GeneticTest[]> {
    return this.http.get<GeneticTest[]>(`${environment.apiBaseUrl}/patients/${patientId}/genetic-tests`);
  }

  create(patientId: number, payload: Partial<GeneticTest>): Observable<GeneticTest> {
    return this.http.post<GeneticTest>(`${environment.apiBaseUrl}/patients/${patientId}/genetic-tests`, payload);
  }

  update(testId: number, payload: Partial<GeneticTest>): Observable<GeneticTest> {
    return this.http.put<GeneticTest>(`${environment.apiBaseUrl}/genetic-tests/${testId}`, payload);
  }

  delete(testId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/genetic-tests/${testId}`);
  }
}
