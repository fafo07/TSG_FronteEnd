import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../config/environment';
import { ManifestationFinding } from '../../shared/models/models';
import { PaginatedResponse, unwrapResults } from '../../shared/models/pagination';

@Injectable({ providedIn: 'root' })
export class ManifestationFindingsService {
  private http = inject(HttpClient);

  get(manifestationId: number): Observable<ManifestationFinding[]> {
    return this.http
      .get<PaginatedResponse<ManifestationFinding> | ManifestationFinding[]>(`${environment.apiBaseUrl}/manifestations/${manifestationId}/findings`)
      .pipe(map((response) => unwrapResults(response)));
  }

  replace(manifestationId: number, findings: Array<{ finding_code: string; is_present: boolean }>): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseUrl}/manifestations/${manifestationId}/findings`, { findings });
  }
}
