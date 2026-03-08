import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../config/environment';
import { FindingCatalog } from '../../shared/models/models';
import { PaginatedResponse } from '../../shared/models/pagination';

@Injectable({ providedIn: 'root' })
export class FindingsCatalogService {
  private http = inject(HttpClient);

  list(page = 1, system?: string, isActive?: boolean): Observable<PaginatedResponse<FindingCatalog>> {
    let params = new HttpParams().set('page', page);
    if (system) params = params.set('system', system);
    if (isActive !== undefined) params = params.set('is_active', isActive);
    return this.http.get<PaginatedResponse<FindingCatalog>>(`${environment.apiBaseUrl}/findings`, { params }).pipe(
      map((res) => ({ ...res, results: res.results.map((item) => this.normalize(item)) }))
    );
  }

  create(payload: Partial<FindingCatalog>): Observable<FindingCatalog> {
    return this.http.post<FindingCatalog>(`${environment.apiBaseUrl}/findings`, this.toApiPayload(payload)).pipe(map((item) => this.normalize(item)));
  }

  update(findingCode: string, payload: Partial<FindingCatalog>): Observable<FindingCatalog> {
    return this.http.patch<FindingCatalog>(`${environment.apiBaseUrl}/findings/${findingCode}`, this.toApiPayload(payload)).pipe(map((item) => this.normalize(item)));
  }

  private normalize(item: FindingCatalog): FindingCatalog {
    const system = item.system ?? item.system_code;
    return { ...item, system, system_code: item.system_code ?? system ?? '' };
  }

  private toApiPayload(payload: Partial<FindingCatalog>): Partial<FindingCatalog> & { system?: string } {
    const system = payload.system ?? payload.system_code;
    return {
      ...payload,
      system,
      system_code: undefined
    };
  }
}
