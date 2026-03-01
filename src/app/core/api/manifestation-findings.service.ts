import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../config/environment';
import { ManifestationFinding } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class ManifestationFindingsService {
  private http = inject(HttpClient);

  get(manifestationId: number): Observable<ManifestationFinding[]> {
    return this.http.get<ManifestationFinding[]>(`${environment.apiBaseUrl}/manifestations/${manifestationId}/findings`);
  }

  replace(manifestationId: number, findings: ManifestationFinding[]): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseUrl}/manifestations/${manifestationId}/findings`, { findings });
  }
}
