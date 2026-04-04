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
      .pipe(map((response) => unwrapResults(response).map((row) => this.normalize(row))));
  }

  replace(manifestationId: number, findings: Array<{ finding_code: string; is_present: boolean }>): Observable<void> {
    return this.http.put<void>(`${environment.apiBaseUrl}/manifestations/${manifestationId}/findings`, { findings });
  }

  private normalize(row: ManifestationFinding): ManifestationFinding {
    const anyRow = row as ManifestationFinding & { manifestation?: number; finding?: string };
    return {
      manifestation_id: anyRow.manifestation_id ?? anyRow.manifestation ?? 0,
      finding_code: anyRow.finding_code ?? anyRow.finding ?? '',
      is_present: anyRow.is_present ?? false
    };
  }
}
